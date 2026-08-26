import { getDb } from "@/lib/db";
import { WorkflowError } from "@/lib/errors";
import {
  ACP_STATE,
  EXECUTION_STATUS,
  canonicalAcpState,
  getAcpIntake
} from "@/lib/dgix-intake";
import {
  BLOCKED_PUBLISH,
  FACEBOOK_ORGANIC_ADAPTER,
  ORGANIC_PAGE_FEED_OPERATION,
  resolveFacebookConnection,
  routeAuthorizedAcp
} from "@/lib/facebook-resolve";
import {
  executePageFeedPost,
  mapPackageToPageFeed,
  PAID_ORGANIC_REFUSAL
} from "@/lib/facebook-organic-adapter";
import { FACEBOOK_PLATFORM, facebookPageAccessToken, graphApiVersion } from "@/lib/meta-config";
import { graphPost, type GraphPostFn } from "@/lib/meta-graph";

const SECRET_KEY = /access_token|page_access_token|app_secret|ad_access_token|password|api_key/i;

export type ExecutionPublic = {
  id: number;
  intakeId: number;
  packageId: string;
  clientId: string;
  platform: string;
  distributionType: string;
  adapterId: string;
  operation: string;
  graphApiVersion: string;
  pageId: string | null;
  attemptedAt: string;
  completedAt: string | null;
  status: "attempted" | "succeeded" | "failed";
  externalObjectId: string | null;
  sanitizedError: string | null;
};

export type ExecuteOptions = {
  graphPost?: GraphPostFn;
};

function nowIso(): string {
  return new Date().toISOString();
}

function assertPublicRecord(record: Record<string, unknown>): void {
  for (const key of Object.keys(record)) {
    if (SECRET_KEY.test(key)) {
      throw new WorkflowError("Execution records must not include credential fields", 500);
    }
  }
}

function shapeExecution(row: Record<string, unknown>): ExecutionPublic {
  const record = {
    id: Number(row.id),
    intakeId: Number(row.intake_id),
    packageId: String(row.package_id),
    clientId: String(row.client_id),
    platform: String(row.platform),
    distributionType: String(row.distribution_type),
    adapterId: String(row.adapter_id),
    operation: String(row.operation),
    graphApiVersion: String(row.graph_api_version),
    pageId: row.page_id == null ? null : String(row.page_id),
    attemptedAt: String(row.attempted_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
    status: String(row.status) as ExecutionPublic["status"],
    externalObjectId: row.external_object_id == null ? null : String(row.external_object_id),
    sanitizedError: row.sanitized_error == null ? null : String(row.sanitized_error)
  };
  assertPublicRecord(record as unknown as Record<string, unknown>);
  return record;
}

export function listExecutionsForIntake(intakeId: number): ExecutionPublic[] {
  return (
    getDb()
      .prepare("SELECT * FROM dgix_executions WHERE intake_id = ? ORDER BY id DESC")
      .all(intakeId) as Record<string, unknown>[]
  ).map(shapeExecution);
}

export function latestSucceededExecution(intakeId: number): ExecutionPublic | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM dgix_executions WHERE intake_id = ? AND status = 'succeeded' ORDER BY id DESC LIMIT 1"
    )
    .get(intakeId) as Record<string, unknown> | undefined;
  return row ? shapeExecution(row) : null;
}

function setIntakeExecutionStatus(intakeId: number, status: string): void {
  const stamp = nowIso();
  getDb()
    .prepare("UPDATE dgix_acp_intakes SET execution_status = ?, updated_at = ? WHERE id = ?")
    .run(status, stamp, intakeId);
}

function insertAttempt(input: {
  intakeId: number;
  packageId: string;
  clientId: string;
  platform: string;
  distributionType: string;
  adapterId: string;
  operation: string;
  graphApiVersion: string;
  pageId: string | null;
}): ExecutionPublic {
  const stamp = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO dgix_executions (
        intake_id, package_id, client_id, platform, distribution_type, adapter_id, operation,
        graph_api_version, page_id, attempted_at, completed_at, status, external_object_id,
        sanitized_error, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'attempted', NULL, NULL, ?, ?)`
    )
    .run(
      input.intakeId,
      input.packageId,
      input.clientId,
      input.platform,
      input.distributionType,
      input.adapterId,
      input.operation,
      input.graphApiVersion,
      input.pageId,
      stamp,
      stamp,
      stamp
    );
  const row = getDb()
    .prepare("SELECT * FROM dgix_executions WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as Record<string, unknown>;
  return shapeExecution(row);
}

function completeAttempt(
  id: number,
  outcome: { status: "succeeded"; externalObjectId: string } | { status: "failed"; sanitizedError: string }
): ExecutionPublic {
  const stamp = nowIso();
  if (outcome.status === "succeeded") {
    getDb()
      .prepare(
        `UPDATE dgix_executions
         SET status = 'succeeded', external_object_id = ?, sanitized_error = NULL,
             completed_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(outcome.externalObjectId, stamp, stamp, id);
  } else {
    getDb()
      .prepare(
        `UPDATE dgix_executions
         SET status = 'failed', external_object_id = NULL, sanitized_error = ?,
             completed_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(outcome.sanitizedError, stamp, stamp, id);
  }
  const row = getDb()
    .prepare("SELECT * FROM dgix_executions WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return shapeExecution(row);
}

export async function executeAuthorizedOrganicAcp(intakeId: number, options: ExecuteOptions = {}) {
  const intake = getAcpIntake(intakeId);
  const state = canonicalAcpState(intake.reviewState);

  if (state === ACP_STATE.rejected) {
    throw new WorkflowError("A rejected package cannot execute. Authorization and execution remain separate events.", 409);
  }
  if (state === ACP_STATE.imported || state === ACP_STATE.ready_for_decision) {
    throw new WorkflowError(
      "Only an AUTHORIZED ACP may execute. Import and review are not authorization, and authorization is not automatic publishing.",
      409
    );
  }
  if (state !== ACP_STATE.authorized || !intake.executionAuthorized) {
    throw new WorkflowError("Only an AUTHORIZED ACP may execute.", 409);
  }
  if (!intake.executionReady || !intake.package.execution) {
    throw new WorkflowError(
      "This package is not execution-ready. DGIX will not invent Facebook fields from other ACP sections.",
      400
    );
  }

  if (intake.executionStatus === EXECUTION_STATUS.executed || latestSucceededExecution(intakeId)) {
    throw new WorkflowError(
      "This ACP was already executed successfully. DGIX will not publish a duplicate Facebook post from a repeated request. Retry is allowed only after EXECUTION FAILED.",
      409
    );
  }

  const routing = routeAuthorizedAcp(intake.package);
  const execution = intake.package.execution;
  const distributionType = execution.distributionType || "organic";

  if (distributionType === "paid" || routing.adapter === "facebook_paid_marketing") {
    throw new WorkflowError(PAID_ORGANIC_REFUSAL, 409);
  }
  if (execution.platform.trim().toLowerCase() !== FACEBOOK_PLATFORM) {
    throw new WorkflowError(
      `Organic Facebook execution requires platform=facebook, not ${execution.platform}.`,
      400
    );
  }
  if (routing.adapter !== FACEBOOK_ORGANIC_ADAPTER) {
    throw new WorkflowError("This ACP did not route to the Facebook Organic Adapter.", 409);
  }

  const resolved = resolveFacebookConnection(execution.clientId, execution.platform);
  if (!resolved.ok) {
    throw new WorkflowError(
      `${resolved.message} Organic Page Operations are NOT AVAILABLE. ${BLOCKED_PUBLISH}`,
      409
    );
  }
  if (!resolved.connection.organicConfigured || !resolved.connection.pageId) {
    throw new WorkflowError(
      `No valid organic Facebook Page capability is available for client "${execution.clientId}". ${BLOCKED_PUBLISH}`,
      409
    );
  }

  const mapping = mapPackageToPageFeed(intake.package, resolved.connection.pageId);
  if (!mapping.ok) {
    throw new WorkflowError(mapping.message, mapping.code === "paid_not_implemented" ? 409 : 400);
  }

  const pageToken = facebookPageAccessToken();
  if (!pageToken) {
    throw new WorkflowError(
      `Organic Page authorization is not configured. ${BLOCKED_PUBLISH}`,
      409
    );
  }

  const attempt = insertAttempt({
    intakeId,
    packageId: intake.packageId,
    clientId: execution.clientId,
    platform: FACEBOOK_PLATFORM,
    distributionType,
    adapterId: FACEBOOK_ORGANIC_ADAPTER,
    operation: ORGANIC_PAGE_FEED_OPERATION,
    graphApiVersion: graphApiVersion(),
    pageId: resolved.connection.pageId
  });
  setIntakeExecutionStatus(intakeId, EXECUTION_STATUS.execution_attempted);

  const posted = await executePageFeedPost(mapping, pageToken, options.graphPost || graphPost);
  if (!posted.ok) {
    const failed = completeAttempt(attempt.id, {
      status: "failed",
      sanitizedError: posted.message
    });
    setIntakeExecutionStatus(intakeId, EXECUTION_STATUS.execution_failed);
    return {
      ok: false as const,
      executed: false,
      blocked: false,
      code: posted.code,
      message: posted.message,
      intake: getAcpIntake(intakeId),
      execution: failed
    };
  }

  const succeeded = completeAttempt(attempt.id, {
    status: "succeeded",
    externalObjectId: posted.externalObjectId
  });
  setIntakeExecutionStatus(intakeId, EXECUTION_STATUS.executed);
  return {
    ok: true as const,
    executed: true,
    blocked: false,
    message: "Facebook Page post created. DGIX did not rewrite ACP content.",
    intake: getAcpIntake(intakeId),
    execution: succeeded
  };
}

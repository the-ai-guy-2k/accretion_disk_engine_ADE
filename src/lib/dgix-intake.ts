import { getDb } from "@/lib/db";
import {
  ACP_TO_ADE_MAPPING,
  ACP_VERSION,
  adapterHandoff,
  assertValidAcp,
  reviewView,
  type AcpPackage
} from "@/lib/acp-validate";
import { WorkflowError } from "@/lib/errors";

export const ACP_STATE = {
  imported: "imported",
  ready_for_decision: "ready_for_decision",
  authorized: "authorized",
  rejected: "rejected"
} as const;

export const MISSION_STATUS = {
  intake_pending_review: "intake_pending_review",
  intake_reviewed: "intake_reviewed",
  authorized: "authorized",
  rejected: "rejected"
} as const;

export const EXECUTION_STATUS = {
  not_connected: "authorized_platform_not_connected"
} as const;

const LEGACY_STATE: Record<string, string> = {
  pending_operator_review: ACP_STATE.imported,
  operator_reviewed: ACP_STATE.ready_for_decision,
  declined: ACP_STATE.rejected
};

function nowIso(): string {
  return new Date().toISOString();
}

export function canonicalAcpState(value: unknown): string {
  const raw = String(value || "");
  return LEGACY_STATE[raw] || raw || ACP_STATE.imported;
}

export function acpStateLabel(state: string): string {
  const canonical = canonicalAcpState(state);
  if (canonical === ACP_STATE.authorized) {
    return "AUTHORIZED — PLATFORM EXECUTION NOT YET CONNECTED";
  }
  if (canonical === ACP_STATE.ready_for_decision) return "REVIEWED / READY FOR DECISION";
  if (canonical === ACP_STATE.rejected) return "REJECTED";
  return "IMPORTED";
}

function parseRaw(raw: string): AcpPackage {
  return JSON.parse(raw) as AcpPackage;
}

function profileFromPackage(pkg: AcpPackage): "execution_ready" | "legacy" {
  return pkg.execution ? "execution_ready" : "legacy";
}

function shapeIntake(row: Record<string, unknown>) {
  const raw = String(row.raw_json || "{}");
  let pkg: AcpPackage;
  try {
    pkg = parseRaw(raw);
  } catch {
    throw new WorkflowError("Stored Campaign Package JSON is unreadable", 500);
  }
  const reviewState = canonicalAcpState(row.review_state);
  const executionReady = profileFromPackage(pkg) === "execution_ready";
  const authorized = reviewState === ACP_STATE.authorized;
  return {
    id: row.id,
    missionId: row.mission_id,
    packageId: row.package_id,
    acpVersion: row.acp_version,
    originatingSystem: row.originating_system,
    clientBusinessId: row.client_business_id,
    campaignName: row.campaign_name,
    packageCreatedAt: row.package_created_at,
    importedAt: row.imported_at,
    reviewState,
    reviewStateLabel: acpStateLabel(reviewState),
    executionAuthorized: Boolean(row.execution_authorized) || authorized,
    executionStatus: row.execution_status || (authorized ? EXECUTION_STATUS.not_connected : null),
    decisionAt: row.decision_at || null,
    decisionBy: row.decision_by || null,
    acpProfile: row.acp_profile || profileFromPackage(pkg),
    executionReady,
    materializedIntoAde: Boolean(row.materialized),
    isTest: Boolean(row.is_test),
    missionStatus: row.mission_status,
    missionTitle: row.mission_title,
    goalId: row.goal_id,
    campaignId: row.campaign_id,
    importIsNotApproval: true,
    authorizationIsNotExecution: true,
    package: pkg,
    review: reviewView(pkg),
    platformHandoff: adapterHandoff(pkg),
    mapping: ACP_TO_ADE_MAPPING,
    authorityNote: executionReady
      ? "This package is execution-ready as prepared by the originating system. DGIX will not regenerate the post. Import is not approval. Authorization is not Facebook publishing and does not create Standard ADE Goal, Campaign, Source, or Draft records."
      : "This is a legacy ACP intake record without an execution block. It is preserved. It cannot be authorized for platform execution until an execution-ready ACP is imported. Import is not approval."
  };
}

export function listAcpIntakes() {
  return (
    getDb()
      .prepare(
        `SELECT i.*, m.status AS mission_status, m.title AS mission_title, m.goal_id, m.campaign_id
         FROM dgix_acp_intakes i
         JOIN dgix_missions m ON m.id = i.mission_id
         ORDER BY i.id DESC`
      )
      .all() as Record<string, unknown>[]
  ).map((row) => shapeIntake(row));
}

export function getAcpIntake(id: number) {
  const row = getDb()
    .prepare(
      `SELECT i.*, m.status AS mission_status, m.title AS mission_title, m.goal_id, m.campaign_id
       FROM dgix_acp_intakes i
       JOIN dgix_missions m ON m.id = i.mission_id
       WHERE i.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) throw new WorkflowError("Campaign Package intake not found", 404);
  return shapeIntake(row);
}

export function importAcp(raw: unknown) {
  const pkg = assertValidAcp(raw);
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM dgix_acp_intakes WHERE package_id = ?")
    .get(pkg.packageId) as { id?: number } | undefined;
  if (existing?.id) {
    throw new WorkflowError(
      `A Campaign Package with packageId ${pkg.packageId} was already imported (intake #${existing.id}). Import is not repeated automatically.`,
      409
    );
  }

  const stamp = nowIso();
  const isTest = pkg.isTest === true ? 1 : 0;
  const platform = pkg.execution?.platform || pkg.objective.intendedPlatforms.join(", ");
  const profile = profileFromPackage(pkg);
  const mission = db.prepare(
    `INSERT INTO dgix_missions (
      title, business_label, platform, objective, status, goal_id, campaign_id, is_test, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`
  );
  const missionResult = mission.run(
    pkg.campaignName,
    pkg.clientBusinessId,
    platform,
    pkg.objective.statement,
    MISSION_STATUS.intake_pending_review,
    isTest,
    `ACP ${ACP_VERSION} ${profile}. Not Facebook execution. Not ADE-generated evidence.`,
    stamp,
    stamp
  );
  const missionId = Number(missionResult.lastInsertRowid);

  const intake = db.prepare(
    `INSERT INTO dgix_acp_intakes (
      mission_id, package_id, acp_version, originating_system, client_business_id, campaign_name,
      package_created_at, imported_at, raw_json, review_state, execution_authorized, materialized,
      is_test, acp_profile, execution_status, decision_at, decision_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, NULL, NULL, NULL, ?, ?)`
  );
  const intakeResult = intake.run(
    missionId,
    pkg.packageId,
    ACP_VERSION,
    pkg.originatingSystem,
    pkg.clientBusinessId,
    pkg.campaignName,
    pkg.createdAt,
    stamp,
    JSON.stringify(raw),
    ACP_STATE.imported,
    isTest,
    profile,
    stamp,
    stamp
  );

  return getAcpIntake(Number(intakeResult.lastInsertRowid));
}

export function markAcpReviewed(id: number, decision: "reviewed" | "declined") {
  const current = getAcpIntake(id);
  if (canonicalAcpState(current.reviewState) === ACP_STATE.authorized) {
    throw new WorkflowError("An authorized package cannot be returned to review-only.", 409);
  }
  const stamp = nowIso();
  const reviewState = decision === "declined" ? ACP_STATE.rejected : ACP_STATE.ready_for_decision;
  const missionStatus =
    decision === "declined" ? MISSION_STATUS.rejected : MISSION_STATUS.intake_reviewed;
  const db = getDb();
  db.prepare(
    `UPDATE dgix_acp_intakes
     SET review_state = ?, decision_at = ?, decision_by = ?, updated_at = ?
     WHERE id = ?`
  ).run(reviewState, stamp, "local-operator", stamp, id);
  db.prepare("UPDATE dgix_missions SET status = ?, updated_at = ? WHERE id = ?").run(
    missionStatus,
    stamp,
    current.missionId
  );
  const updated = getAcpIntake(id);
  if (updated.executionAuthorized || updated.materializedIntoAde) {
    throw new WorkflowError("ACP review must not authorize or execute the package", 500);
  }
  return updated;
}

export function decideAcpExecution(
  id: number,
  decision: "authorize" | "reject",
  decidedBy = "local-operator"
) {
  const current = getAcpIntake(id);
  const state = canonicalAcpState(current.reviewState);
  if (state === ACP_STATE.authorized && decision === "authorize") {
    throw new WorkflowError("This package is already authorized. Authorization is not execution.", 409);
  }
  if (state === ACP_STATE.rejected && decision === "authorize") {
    throw new WorkflowError("A rejected package cannot be authorized.");
  }
  if (decision === "authorize" && !current.executionReady) {
    throw new WorkflowError(
      "This package is not execution-ready. Import an ACP with an execution block (platform, post type, final message, publish mode) before authorizing."
    );
  }

  const stamp = nowIso();
  const actor = String(decidedBy || "local-operator").trim() || "local-operator";
  const db = getDb();

  if (decision === "reject") {
    db.prepare(
      `UPDATE dgix_acp_intakes
       SET review_state = ?, execution_authorized = 0, execution_status = NULL,
           decision_at = ?, decision_by = ?, updated_at = ?
       WHERE id = ?`
    ).run(ACP_STATE.rejected, stamp, actor, stamp, id);
    db.prepare("UPDATE dgix_missions SET status = ?, updated_at = ? WHERE id = ?").run(
      MISSION_STATUS.rejected,
      stamp,
      current.missionId
    );
    return getAcpIntake(id);
  }

  db.prepare(
    `UPDATE dgix_acp_intakes
     SET review_state = ?, execution_authorized = 1, execution_status = ?,
         decision_at = ?, decision_by = ?, updated_at = ?
     WHERE id = ?`
  ).run(ACP_STATE.authorized, EXECUTION_STATUS.not_connected, stamp, actor, stamp, id);
  db.prepare("UPDATE dgix_missions SET status = ?, updated_at = ? WHERE id = ?").run(
    MISSION_STATUS.authorized,
    stamp,
    current.missionId
  );
  const updated = getAcpIntake(id);
  if (updated.materializedIntoAde) {
    throw new WorkflowError("Authorization must not materialize Standard ADE records", 500);
  }
  if (updated.executionStatus !== EXECUTION_STATUS.not_connected) {
    throw new WorkflowError("Authorization must remain disconnected from Facebook", 500);
  }
  return updated;
}

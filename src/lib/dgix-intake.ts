import { getDb } from "@/lib/db";
import {
  ACP_TO_ADE_MAPPING,
  ACP_VERSION,
  assertValidAcp,
  reviewView,
  type AcpPackage
} from "@/lib/acp-validate";
import { WorkflowError } from "@/lib/errors";

export const MISSION_STATUS = {
  intake_pending_review: "intake_pending_review",
  intake_reviewed: "intake_reviewed",
  intake_declined: "intake_declined"
} as const;

export const ACP_REVIEW_STATE = {
  pending_operator_review: "pending_operator_review",
  operator_reviewed: "operator_reviewed",
  declined: "declined"
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

function parseRaw(raw: string): AcpPackage {
  return JSON.parse(raw) as AcpPackage;
}

function shapeIntake(row: Record<string, unknown>) {
  const raw = String(row.raw_json || "{}");
  let pkg: AcpPackage;
  try {
    pkg = parseRaw(raw);
  } catch {
    throw new WorkflowError("Stored Campaign Package JSON is unreadable", 500);
  }
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
    reviewState: row.review_state,
    executionAuthorized: Boolean(row.execution_authorized),
    materializedIntoAde: Boolean(row.materialized),
    isTest: Boolean(row.is_test),
    missionStatus: row.mission_status,
    missionTitle: row.mission_title,
    goalId: row.goal_id,
    campaignId: row.campaign_id,
    importIsNotApproval: true,
    package: pkg,
    review: reviewView(pkg),
    mapping: ACP_TO_ADE_MAPPING,
    authorityNote:
      "Importing a Campaign Package is not approval and is not publishing. ADE will not create Goal, Campaign, Source, or Draft records from this import until a later governed action."
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
  const platform = pkg.objective.intendedPlatforms.join(", ");
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
    `ACP ${ACP_VERSION} intake. Not execution. Not ADE-generated evidence.`,
    stamp,
    stamp
  );
  const missionId = Number(missionResult.lastInsertRowid);

  const intake = db.prepare(
    `INSERT INTO dgix_acp_intakes (
      mission_id, package_id, acp_version, originating_system, client_business_id, campaign_name,
      package_created_at, imported_at, raw_json, review_state, execution_authorized, materialized,
      is_test, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
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
    ACP_REVIEW_STATE.pending_operator_review,
    isTest,
    stamp,
    stamp
  );

  return getAcpIntake(Number(intakeResult.lastInsertRowid));
}

export function markAcpReviewed(id: number, decision: "reviewed" | "declined") {
  const current = getAcpIntake(id);
  const stamp = nowIso();
  const reviewState =
    decision === "declined" ? ACP_REVIEW_STATE.declined : ACP_REVIEW_STATE.operator_reviewed;
  const missionStatus =
    decision === "declined" ? MISSION_STATUS.intake_declined : MISSION_STATUS.intake_reviewed;
  const db = getDb();
  db.prepare(
    "UPDATE dgix_acp_intakes SET review_state = ?, updated_at = ? WHERE id = ?"
  ).run(reviewState, stamp, id);
  db.prepare("UPDATE dgix_missions SET status = ?, updated_at = ? WHERE id = ?").run(
    missionStatus,
    stamp,
    current.missionId
  );
  const updated = getAcpIntake(id);
  if (updated.executionAuthorized || updated.materializedIntoAde) {
    throw new WorkflowError("ACP review must not authorize execution", 500);
  }
  return updated;
}

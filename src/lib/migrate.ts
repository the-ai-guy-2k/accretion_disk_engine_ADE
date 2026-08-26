import type { DatabaseSync } from "node:sqlite";
import {
  FACEBOOK_CHANNEL_TYPE,
  MANUAL_FACEBOOK_ADAPTER_ID,
  SCHEMA_VERSION
} from "@/lib/schema";

function nowIso(): string {
  return new Date().toISOString();
}

function columnNames(db: DatabaseSync, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

function addColumn(
  db: DatabaseSync,
  table: string,
  column: string,
  definition: string
): void {
  const cols = columnNames(db, table);
  if (!cols.has(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function ensureRuntimeSchema(db: DatabaseSync): void {
  addColumn(db, "sources", "body", "TEXT");
  addColumn(db, "sources", "activity_date", "TEXT");
  addColumn(db, "sources", "provenance", "TEXT");
  addColumn(db, "sources", "is_test", "INTEGER NOT NULL DEFAULT 0");

  addColumn(db, "content_items", "generation_mode", "TEXT");
  addColumn(db, "content_items", "generation_note", "TEXT");
  addColumn(db, "content_items", "generation_provider", "TEXT");
  addColumn(db, "content_items", "generation_model", "TEXT");
  addColumn(db, "content_items", "generation_status", "TEXT");
  addColumn(db, "content_items", "is_test", "INTEGER NOT NULL DEFAULT 0");

  addColumn(db, "channels", "adapter_id", "TEXT");
  addColumn(db, "channels", "is_mock", "INTEGER NOT NULL DEFAULT 0");

  addColumn(db, "publications", "failure_reason", "TEXT");
  addColumn(db, "publications", "adapter_id", "TEXT");
  addColumn(db, "publications", "is_mock", "INTEGER NOT NULL DEFAULT 1");
  addColumn(db, "publications", "attempt_id", "TEXT");

  addColumn(db, "goals", "starting_value", "REAL NOT NULL DEFAULT 0");
  addColumn(db, "goals", "target_value", "REAL");
  addColumn(db, "goals", "target_date", "TEXT");
  addColumn(db, "goals", "is_test", "INTEGER NOT NULL DEFAULT 0");
  addColumn(db, "goals", "notes", "TEXT");

  addColumn(db, "sources", "goal_id", "INTEGER");
  addColumn(db, "content_items", "goal_id", "INTEGER");

  addColumn(db, "metrics", "numeric_value", "REAL");
  addColumn(db, "metrics", "capture_method", "TEXT");
  addColumn(db, "metrics", "captured_by", "TEXT");
  addColumn(db, "metrics", "notes", "TEXT");

  addColumn(db, "recommendations", "observed", "TEXT");
  addColumn(db, "recommendations", "why_it_matters", "TEXT");
  addColumn(db, "recommendations", "evidence_json", "TEXT");
  addColumn(db, "recommendations", "analysis_mode", "TEXT");
  addColumn(db, "recommendations", "analysis_boundary_note", "TEXT");
  addColumn(db, "recommendations", "is_test", "INTEGER NOT NULL DEFAULT 0");

  addColumn(db, "campaigns", "start_date", "TEXT");
  addColumn(db, "campaigns", "end_date", "TEXT");
  addColumn(db, "campaigns", "is_test", "INTEGER NOT NULL DEFAULT 0");
  addColumn(db, "campaigns", "notes", "TEXT");
  addColumn(db, "campaigns", "plan_summary", "TEXT");
  addColumn(db, "campaigns", "plan_mode", "TEXT");
  addColumn(db, "campaigns", "plan_boundary_note", "TEXT");
  addColumn(db, "campaigns", "plan_generated_at", "TEXT");

  db.exec(`CREATE TABLE IF NOT EXISTS dgix_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    business_label TEXT,
    platform TEXT,
    objective TEXT,
    status TEXT,
    goal_id INTEGER,
    campaign_id INTEGER,
    is_test INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (goal_id) REFERENCES goals(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS dgix_acp_intakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    package_id TEXT NOT NULL UNIQUE,
    acp_version TEXT NOT NULL,
    originating_system TEXT,
    client_business_id TEXT,
    campaign_name TEXT,
    package_created_at TEXT,
    imported_at TEXT NOT NULL,
    raw_json TEXT NOT NULL,
    review_state TEXT NOT NULL,
    execution_authorized INTEGER NOT NULL DEFAULT 0,
    materialized INTEGER NOT NULL DEFAULT 0,
    is_test INTEGER NOT NULL DEFAULT 0,
    acp_profile TEXT,
    execution_status TEXT,
    decision_at TEXT,
    decision_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (mission_id) REFERENCES dgix_missions(id)
  )`);

  addColumn(db, "dgix_acp_intakes", "acp_profile", "TEXT");
  addColumn(db, "dgix_acp_intakes", "execution_status", "TEXT");
  addColumn(db, "dgix_acp_intakes", "decision_at", "TEXT");
  addColumn(db, "dgix_acp_intakes", "decision_by", "TEXT");

  db.prepare(
    "UPDATE dgix_acp_intakes SET review_state = ? WHERE review_state = ?"
  ).run("imported", "pending_operator_review");
  db.prepare(
    "UPDATE dgix_acp_intakes SET review_state = ? WHERE review_state = ?"
  ).run("ready_for_decision", "operator_reviewed");
  db.prepare(
    "UPDATE dgix_acp_intakes SET review_state = ? WHERE review_state = ?"
  ).run("rejected", "declined");

  db.exec(`
    UPDATE dgix_acp_intakes
    SET acp_profile = CASE
      WHEN json_extract(raw_json, '$.execution') IS NOT NULL THEN 'execution_ready'
      ELSE 'legacy'
    END
    WHERE acp_profile IS NULL OR acp_profile = ''
  `);

  db.exec(`CREATE TABLE IF NOT EXISTS dgix_platform_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    graph_api_version TEXT,
    page_id TEXT,
    page_name TEXT,
    ad_account_id TEXT,
    ad_account_name TEXT,
    organic_available INTEGER NOT NULL DEFAULT 0,
    paid_available INTEGER NOT NULL DEFAULT 0,
    connection_status TEXT NOT NULL,
    last_validated_at TEXT,
    last_error TEXT,
    blocked_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (client_id, platform)
  )`);

  const stamp = nowIso();
  const existingChannel = db
    .prepare("SELECT id FROM channels WHERE channel_type = ? LIMIT 1")
    .get(FACEBOOK_CHANNEL_TYPE) as { id?: number } | undefined;
  if (!existingChannel?.id) {
    db.prepare(
      `INSERT INTO channels (name, channel_type, adapter_id, status, is_mock, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`
    ).run(
      "Facebook Page (Channel 01)",
      FACEBOOK_CHANNEL_TYPE,
      MANUAL_FACEBOOK_ADAPTER_ID,
      "mock_manual",
      stamp,
      stamp
    );
  }

  db.prepare(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run("schema_version", SCHEMA_VERSION, stamp);
}

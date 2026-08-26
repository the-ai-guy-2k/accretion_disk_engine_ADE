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

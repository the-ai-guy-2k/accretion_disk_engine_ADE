import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { initFoundation } from "../scripts/init-db.mjs";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

const REQUIRED_TABLES = [
  "app_meta",
  "sources",
  "goals",
  "content_items",
  "campaigns",
  "campaign_sources",
  "campaign_plan_items",
  "approvals",
  "publications",
  "channels",
  "metrics",
  "audience_network_events",
  "leads",
  "opportunities",
  "recommendations",
  "dgix_missions",
  "dgix_acp_intakes",
  "dgix_platform_connections"
];

test("SQLite foundation creates required tables and schema version", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ade-db-"));
  const dbPath = path.join(dir, "ade.sqlite");
  initFoundation(dbPath);

  const db = new DatabaseSync(dbPath);
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    )
    .all()
    .map((row) => row.name)
    .sort();

  for (const name of REQUIRED_TABLES) {
    assert.ok(tables.includes(name), `missing table ${name}`);
  }

  const version = db.prepare("SELECT value FROM app_meta WHERE key = ?").get("schema_version");
  assert.equal(version.value, "8");

  const counts = REQUIRED_TABLES.filter((name) => name !== "app_meta").map((name) => {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get();
    return { name, n: row.n };
  });
  assert.ok(
    counts.every((row) => row.n === 0),
    "foundation tables must start empty (no fabricated business data)"
  );

  const sourceCols = db.prepare("PRAGMA table_info(sources)").all().map((row) => row.name);
  for (const col of ["body", "activity_date", "provenance", "is_test", "goal_id"]) {
    assert.ok(sourceCols.includes(col), `sources missing ${col}`);
  }
  const goalCols = db.prepare("PRAGMA table_info(goals)").all().map((row) => row.name);
  for (const col of ["starting_value", "target_value", "target_date", "is_test", "target_metric"]) {
    assert.ok(goalCols.includes(col), `goals missing ${col}`);
  }
  const metricCols = db.prepare("PRAGMA table_info(metrics)").all().map((row) => row.name);
  for (const col of ["numeric_value", "capture_method", "captured_by"]) {
    assert.ok(metricCols.includes(col), `metrics missing ${col}`);
  }
  const campaignCols = db.prepare("PRAGMA table_info(campaigns)").all().map((row) => row.name);
  for (const col of ["goal_id", "objective", "start_date", "end_date", "plan_summary", "is_test"]) {
    assert.ok(campaignCols.includes(col), `campaigns missing ${col}`);
  }
  const contentCols = db.prepare("PRAGMA table_info(content_items)").all().map((row) => row.name);
  for (const col of ["generation_mode", "generation_note", "generation_provider", "generation_model", "generation_status"]) {
    assert.ok(contentCols.includes(col), `content_items missing ${col}`);
  }
  const intakeCols = db.prepare("PRAGMA table_info(dgix_acp_intakes)").all().map((row) => row.name);
  for (const col of [
    "package_id",
    "acp_version",
    "raw_json",
    "review_state",
    "execution_authorized",
    "imported_at",
    "acp_profile",
    "execution_status",
    "decision_at",
    "decision_by"
  ]) {
    assert.ok(intakeCols.includes(col), `dgix_acp_intakes missing ${col}`);
  }
  const connectionCols = db.prepare("PRAGMA table_info(dgix_platform_connections)").all().map((row) => row.name);
  for (const col of ["client_id", "platform", "page_id", "ad_account_id", "organic_available", "paid_available", "connection_status"]) {
    assert.ok(connectionCols.includes(col), `dgix_platform_connections missing ${col}`);
  }
  assert.ok(!connectionCols.includes("access_token"), "connection table must not store access tokens");
  assert.ok(!connectionCols.includes("page_access_token"), "connection table must not store page tokens");
  db.close();
});

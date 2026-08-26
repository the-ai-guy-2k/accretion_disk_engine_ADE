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
  "approvals",
  "publications",
  "channels",
  "metrics",
  "audience_network_events",
  "leads",
  "opportunities",
  "recommendations"
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
  assert.equal(version.value, "1");

  const counts = REQUIRED_TABLES.filter((name) => name !== "app_meta").map((name) => {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get();
    return row.n;
  });
  assert.ok(
    counts.every((n) => n === 0),
    "foundation tables must start empty (no fabricated business data)"
  );
  db.close();
});

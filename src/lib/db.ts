import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { sqlitePath } from "@/lib/config";
import { ensureRuntimeSchema } from "@/lib/migrate";
import { FOUNDATION_TABLES, SCHEMA_VERSION } from "@/lib/schema";

type GlobalAde = typeof globalThis & {
  __adeSqlite?: DatabaseSync;
};

function nowIso(): string {
  return new Date().toISOString();
}

function schemaSql(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src", "lib", "schema.sql"),
    "utf8"
  );
}

export function getDb(): DatabaseSync {
  const g = globalThis as GlobalAde;
  if (g.__adeSqlite) {
    return g.__adeSqlite;
  }

  const dbFile = sqlitePath();
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });

  const db = new DatabaseSync(dbFile);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(schemaSql());
  ensureRuntimeSchema(db);

  const stamp = nowIso();
  const upsert = db.prepare(
    "INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  );
  upsert.run("schema_version", SCHEMA_VERSION, stamp);
  const existingInit = db
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get("initialized_at") as { value?: string } | undefined;
  if (!existingInit?.value) {
    upsert.run("initialized_at", stamp, stamp);
  }

  g.__adeSqlite = db;
  return db;
}

export function getFoundationStatus() {
  const db = getDb();
  const versionRow = db
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get("schema_version") as { value?: string } | undefined;
  const initRow = db
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get("initialized_at") as { value?: string } | undefined;

  const tableRows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as { name: string }[];

  const present = new Set(tableRows.map((row) => row.name));
  const missing = FOUNDATION_TABLES.filter((name) => !present.has(name));

  return {
    ok: missing.length === 0,
    schemaVersion: versionRow?.value ?? null,
    initializedAt: initRow?.value ?? null,
    tables: [...present],
    missingTables: [...missing]
  };
}

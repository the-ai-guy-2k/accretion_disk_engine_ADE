import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

const root = path.resolve(import.meta.dirname, "..");
const dbFile = path.join(root, "data", "ade.sqlite");
const schemaFile = path.join(root, "src", "lib", "schema.sql");

export function initFoundation(dbPath = dbFile) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(fs.readFileSync(schemaFile, "utf8"));
  const stamp = new Date().toISOString();
  db.prepare(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run("schema_version", "7", stamp);
  const existing = db.prepare("SELECT value FROM app_meta WHERE key = ?").get("initialized_at");
  if (!existing) {
    db.prepare(
      `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).run("initialized_at", stamp, stamp);
  }
  db.close();
  return dbPath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  console.log(`ADE SQLite foundation initialized at ${initFoundation()}`);
}

# ADE data model (schema v2)

Engine: **SQLite** via Node `node:sqlite`.  
File: `./data/ade.sqlite` unless `ADE_SQLITE_PATH` is set.  
SQL source of truth: `src/lib/schema.sql`. Runtime column upgrades: `src/lib/migrate.ts`.

Schema v2 adds the ACI-004 workflow fields. Existing v1 files are upgraded on startup. `initialized_at` is not reset.

## Workflow tables (ACI-004)

| Table | Role |
| --- | --- |
| `sources` | Title, body, type, activity_date, provenance, notes, `is_test` |
| `content_items` | Drafts. `source_id` required for the vertical slice. Status `draft` / `rejected` / `approved`. Mock generation metadata. |
| `approvals` | Decision history (approve / reject / return_to_draft) |
| `channels` | Facebook Channel 01 seeded as mock `manual_facebook` |
| `publications` | Queue: `PENDING` / `READY` / `PUBLISHED` / `FAILED`. `is_mock`, `adapter_id`, `failure_reason`, `attempt_id` |

Only **approved** content may receive a `PENDING` publication. FAILED is never stored as PUBLISHED.

Other tables (goals, campaigns, metrics, leads, …) remain empty placeholders.

Foreign keys are enabled. IDs are integers. Timestamps are ISO-8601 text.

## Restart behavior

The SQLite file remains on disk. WAL files may appear next to it and are gitignored. Stopping and starting `npm run dev` reuses the same file; `initialized_at` is not overwritten if already set.

## Not in v2

- Auth users/sessions
- Encrypted secrets storage
- Live Meta Graph payloads
- Fabricated clients, revenue, or audience metrics

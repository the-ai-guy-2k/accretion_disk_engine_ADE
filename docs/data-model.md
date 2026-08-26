# ADE data model (schema v5)

Nebula copy: [`docs/nebula/data-model/current-data-model.md`](nebula/data-model/current-data-model.md). SQL source of truth remains `src/lib/schema.sql`.

Engine: **SQLite** via Node `node:sqlite`.  
File: `./data/ade.sqlite` unless `ADE_SQLITE_PATH` is set.  
SQL source of truth: `src/lib/schema.sql`. Runtime column upgrades: `src/lib/migrate.ts`.

Schema v5 adds ACI-008 live-AI generation metadata on `content_items` (`generation_provider`, `generation_model`, `generation_status`). Existing files are upgraded on startup. `initialized_at` is not reset.  
File: `./data/ade.sqlite` unless `ADE_SQLITE_PATH` is set.  
SQL source of truth: `src/lib/schema.sql`. Runtime column upgrades: `src/lib/migrate.ts`.

Schema v4 adds ACI-006 campaigns, selected sources, content-plan items, and campaign-linked drafts. Existing files are upgraded on startup. `initialized_at` is not reset.

## Workflow tables (ACI-004, preserved)

| Table | Role |
| --- | --- |
| `sources` | Title, body, type, activity_date, provenance, notes, `is_test`, optional `goal_id` |
| `content_items` | Drafts. `source_id` required. Optional `goal_id` and `campaign_id`. Status `draft` / `rejected` / `approved`. Generation: `mock_manual` or `live_ai` plus optional provider/model/status. |
| `approvals` | Decision history (approve / reject / return_to_draft) |
| `channels` | Facebook Channel 01 seeded as mock `manual_facebook` |
| `publications` | Queue: `PENDING` / `READY` / `PUBLISHED` / `FAILED` |

Only **approved** content may receive a `PENDING` publication.

Effective Goal is `COALESCE(content_items.goal_id, sources.goal_id)`.

## Goals, results, intelligence (ACI-005)

| Table | Role |
| --- | --- |
| `goals` | Name, metric, starting/target values, status. Progress is computed. |
| `metrics` | Per-publication results. Manual in this product; platform collection refused. |
| `recommendations` | Stored analysis with evidence JSON and analysis-mode boundary (`deterministic_mock` or `live_ai`) |

## Campaigns (ACI-006)

| Table | Role |
| --- | --- |
| `campaigns` | Name, objective, `goal_id`, optional period, status, plan summary/mode/boundary |
| `campaign_sources` | Selected sources ADE may use for the campaign |
| `campaign_plan_items` | Lightweight planned posts: purpose, format, audience, suggested timing, linked `source_id` and later `content_id` |

Relationship: **Goal → Campaign → Source → Content → Publication → Results**. Campaign totals reuse `metrics` via `content_items.campaign_id`.

Leads, opportunities, and audience_network_events remain unused placeholders.

Foreign keys are enabled. IDs are integers. Timestamps are ISO-8601 text.

## Restart behavior

The SQLite file remains on disk. Stopping and starting `npm run dev` reuses the same file; `initialized_at` is not overwritten if already set. Campaigns, selected sources, plan items, drafts, and Goal/content links survive restart.

## Not in v5

- Auth users/sessions
- Encrypted secrets storage
- Live Meta Graph payloads or platform analytics
- Calendar scheduling (suggested timing is a plan hint only)
- Fabricated clients, revenue, or audience metrics

## Proposed later (not implemented) — DGIX Mission

ACI-DGIX-012 did not change schema v5. A later bounded DGIX ACI may add `dgix_missions`:

`id`, `title`, `business_label`, `platform`, `objective`, `status`, nullable `goal_id`, nullable `campaign_id`, `is_test`, `created_at`, `notes`.

That table would bind a business objective to existing ADE Goal/Campaign rows plus future ACP/ACRP artifact references. It is **not** present now.

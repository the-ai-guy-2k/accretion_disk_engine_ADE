# ADE data model (schema v6)

Nebula copy: [`docs/nebula/data-model/current-data-model.md`](nebula/data-model/current-data-model.md). SQL source of truth remains `src/lib/schema.sql`.

Engine: **SQLite** via Node `node:sqlite`.  
File: `./data/ade.sqlite` unless `ADE_SQLITE_PATH` is set.  
SQL source of truth: `src/lib/schema.sql`. Runtime column upgrades: `src/lib/migrate.ts`.

Schema v6 adds DGIX `dgix_missions` and `dgix_acp_intakes` for ACP v1 intake/review. Existing files are upgraded on startup. `initialized_at` is not reset.

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

The SQLite file remains on disk. Stopping and starting `npm run dev` reuses the same file; `initialized_at` is not overwritten if already set. Campaigns, selected sources, plan items, drafts, Goal/content links, and imported Campaign Packages survive restart.

## DGIX intake (ACI-DGIX-013, schema v6)

| Table | Role |
| --- | --- |
| `dgix_missions` | Minimum Mission row for an imported ACP (title, business, platform, objective, intake review status). `goal_id` / `campaign_id` stay null until a later governed materialization. |
| `dgix_acp_intakes` | Stored ACP v1 JSON, package identity, originating system, created/imported timestamps, review state. `execution_authorized` and `materialized` stay 0 on import. |

Contract: [`docs/acp/ACP_V1.md`](acp/ACP_V1.md). Import is not approval.

## Not in v6

- Auth users/sessions
- Encrypted secrets storage
- Live Meta Graph payloads or platform analytics
- Calendar scheduling (suggested timing is a plan hint only)
- Fabricated clients, revenue, or audience metrics

ACP materialization into ADE Goal/Campaign/Source/Draft records is not performed on import.

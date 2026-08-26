# ADE data model (schema v1)

Engine: **SQLite** via Node `node:sqlite`.  
File: `./data/ade.sqlite` unless `ADE_SQLITE_PATH` is set.  
SQL source of truth: `src/lib/schema.sql`.

ACI-002 **creates tables only**. It does not seed fake goals, campaigns, metrics, or leads.

## Tables

| Table | Later entity | Notes |
| --- | --- | --- |
| `app_meta` | Foundation bookkeeping | `schema_version`, `initialized_at` |
| `sources` | Source | Provenance/eligibility fields reserved |
| `goals` | Goal | Status and target metric reserved |
| `campaigns` | Campaign | Optional `goal_id` |
| `content_items` | Content | Optional `source_id`, `campaign_id` |
| `approvals` | Approval | Decision fields reserved; human authority later |
| `channels` | Channel | Facebook intended as Channel 01 later |
| `publications` | Publication | Status, schedule, external id reserved |
| `metrics` | Metric | `is_simulated` so manual/mock values can be labeled later |
| `audience_network_events` | Audience Network event | Counts only when real data exists |
| `leads` | Lead / conversation | Optional content/campaign/channel links |
| `opportunities` | Opportunity | Optional `lead_id` |
| `recommendations` | Recommendation | Optional goal/campaign links |

Foreign keys are enabled. IDs are integers. Timestamps are ISO-8601 text.

## Restart behavior

The SQLite file remains on disk. WAL files (`.sqlite-wal`, `.sqlite-shm`) may appear next to it and are gitignored. Stopping and starting `npm run dev` reuses the same file; `initialized_at` is not overwritten if already set.

## What is not in v1

- Auth users/sessions
- Encrypted secrets storage
- Full audit log of edits
- Platform-specific Facebook JSON payloads

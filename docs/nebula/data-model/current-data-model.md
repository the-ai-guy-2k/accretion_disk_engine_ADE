# ADE implemented data model

**Authority:** `src/lib/schema.sql` and `src/lib/migrate.ts` (schema **v6**).  
**Working copy for operators:** [`docs/data-model.md`](../../data-model.md) — kept in place so existing README links still work.  
This Nebula record restates current relationships. If those files ever diverge, **code wins**.

Engine: SQLite via Node `node:sqlite`. File: `data/ade.sqlite` (gitignored). IDs are integers. Timestamps are ISO-8601 text. Foreign keys are enabled.

## Primary implemented chain

```text
Goal
  └── Campaign
        └── campaign_sources → Source
        └── campaign_plan_items → Source / Content
              └── Content (draft)
                    └── Approval
                    └── Publication
                          └── Result (metrics)
  └── Source (optional goal_id)
        └── Content (optional goal_id)
              └── Approval
              └── Publication
                    └── Result (metrics)
  └── Recommendation (goal_id; optional campaign_id)
```

Effective Goal on content: `COALESCE(content_items.goal_id, sources.goal_id)`.

## Tables

| Table | Implemented use |
| --- | --- |
| `app_meta` | `schema_version` (5), `initialized_at` |
| `goals` | Operator goals; progress is computed, not stored as a live platform value |
| `sources` | Source material; optional `goal_id` |
| `campaigns` | Campaign on a Goal; plan summary/mode/boundary |
| `campaign_sources` | Selected sources for a campaign |
| `campaign_plan_items` | Planned posts; suggested timing is a hint, not a scheduler |
| `content_items` | Drafts. Required `source_id`. Optional `goal_id`, `campaign_id`. Status `draft` / `rejected` / `approved`. `generation_mode` is `mock_manual` or `live_ai`; live drafts also store `generation_provider`, `generation_model`, `generation_status` |
| `approvals` | Decision history |
| `channels` | Seeded mock Facebook Channel 01 (`adapter_id = manual_facebook`) |
| `publications` | Queue: `PENDING` / `READY` / `PUBLISHED` / `FAILED` |
| `metrics` | Manual results on a publication (`capture_method = manual`) |
| `recommendations` | Stored analysis (`deterministic_mock` or `live_ai`) with evidence JSON and analysis-mode boundary |
| `dgix_missions` | DGIX Mission for ACP intake/review only; Goal/Campaign FKs unused in this ACI |
| `dgix_acp_intakes` | Imported ACP v1 JSON + provenance + review state; not executable |
| `audience_network_events` | Placeholder — unused by workflow |
| `leads` | Placeholder — unused by workflow |
| `opportunities` | Placeholder — unused by workflow |

## Guards encoded in workflow (not only SQL)

- Only **approved** content may receive a `PENDING` publication.
- FAILED is never rewritten as PUBLISHED.
- Duplicate queue for the same content is refused.
- Platform-captured metrics are refused (409).

## Not in v6

Auth, encrypted secrets, live Meta payloads, calendar schedule rows, fabricated audience/business metrics. Live AI generation and analysis reuse existing `content_items` and `recommendations` columns; they are not extra tables.

ACP import does not create Goal, Campaign, Source, or Draft rows. `dgix_missions.goal_id` / `campaign_id` remain null until a later governed action.

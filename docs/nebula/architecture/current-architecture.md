# ADE current architecture (implemented)

**Authority:** application code on `deployable` (product commit `014835b`; current branch tip includes later governance docs).  
**This is current truth.** Future intent is listed only as *not implemented*.

Stale bootstrap note: `docs/architecture.md` describes the ACI-002 shell (schema v1, health-only). Do not treat it as current product truth.

## Runtime stack

- **Node.js** 22.5+ (`node:sqlite`)
- **Next.js** App Router + **React** + **TypeScript**
- **SQLite** file `data/ade.sqlite` (schema **v5**)
- Single process: Hub UI and JSON APIs in the same Next.js server
- Local run: `npm run dev` → http://localhost:3000

No Docker, Postgres, Redis, Temporal, NestJS, Laravel, Postiz, or Mixpost in this product.

## Layer diagram (implemented)

```text
ADE Hub / UI
  src/app/* pages, src/components/AppShell.tsx
        ↓
ADE-native workflow / application layer
  src/lib/workflow.ts
  src/lib/ai-generation.ts (live content generation)
  src/lib/goals.ts
  src/lib/campaigns.ts
  src/lib/campaign-plan.ts
  src/lib/analytics.ts
  src/lib/analytics-logic.ts
  src/app/api/* route handlers
        ↓
SQLite persistence
  src/lib/db.ts, schema.sql, migrate.ts
  data/ade.sqlite
        ↓
Publishing adapter boundary
  src/lib/channel-adapter.ts
        ↓
Manual / mock Facebook adapter
  adapter_id = manual_facebook
  Channel 01 — no Meta Graph call
```

## Hub surfaces (implemented)

| Route | Role |
| --- | --- |
| `/` | Dashboard / Hub |
| `/goals` | Goals |
| `/campaigns`, `/campaigns/[id]` | Campaign workspace |
| `/sources` | Sources |
| `/create` | Draft from source |
| `/review` | Review / approve / reject |
| `/publishing` | Queue + mock adapter actions |
| `/analytics` | Goal/content results |
| `/intelligence` | Deterministic recommendation |
| `/leads` | Placeholder (no lead capture) |
| `/settings` | Config names; no live keys required |

## Functional relationships through ACI-006

**Loop A — Source → Draft → Review → Approval → Queue → mock Facebook**

1. Operator creates a `sources` row (`workflow.createSource`).
2. Create produces a `content_items` draft (`createDraftFromSource` / mock-manual generation).
3. Review edits, approves, or rejects (`approvals` history).
4. Only `approved` content may enter the publishing queue (`tryEnqueue` → `publications.status = PENDING`).
5. Operator hands the item to the adapter (`READY`), then confirms (`PUBLISHED`) or fails (`FAILED`).
6. FAILED is never stored as PUBLISHED. Duplicate enqueue is refused (409).

**Loop B — Goal → Content → Results → Analysis → Recommendation**

1. Operator creates a `goals` row.
2. Content and/or sources may carry `goal_id`. Effective Goal is `COALESCE(content_items.goal_id, sources.goal_id)`.
3. After mock publish, operator enters **manual** `metrics` on a publication.
4. Intelligence `runAnalysis` stores a `recommendations` row with `analysis_mode = deterministic_mock`.
5. `ADE_AI_API_KEY` being set does **not** mean live AI ran.

**Loop C — Goal → Campaign → Sources → Plan → Drafts → Human review**

1. Campaign belongs to a Goal (`campaigns.goal_id`).
2. Operator selects sources (`campaign_sources`).
3. Deterministic planner writes `campaign_plan_items` (suggested timing is a hint, not a scheduler).
4. Multi-draft generation creates `content_items` with `campaign_id`; each draft still requires human approve/reject.
5. Campaign results reuse publication `metrics` via campaign-linked content.

## Publishing adapter (implemented)

`manualFacebookAdapter` in `src/lib/channel-adapter.ts`:

- `accept` → READY (payload accepted, not published)
- `confirm` → PUBLISHED with `mock-fb-…` external id
- `fail` → FAILED with reason

Banners in the UI state that this is not real Facebook publishing.

## Intelligence / planning boundaries (implemented)

- Draft generation: `generation_mode = mock_manual` **or** `live_ai` (Create → Generate with AI)
- Campaign plan: `plan_mode` deterministic
- Analysis: `analysis_mode = deterministic_mock` (live AI analytics is **not** implemented)
- Metrics capture: `capture_method = manual` only; platform collection is refused (409)

## Not implemented (do not treat as current)

- Live AI analytics / recommendations (content generation is implemented)
- Real Facebook / Meta Graph publishing
- Calendar scheduling (queue only; plan timing is a hint)
- Platform-collected analytics
- Authentication
- Lead capture / opportunity pipeline (tables exist unused)
- Postiz or Mixpost runtime

## Hybrid harvest (ACI-003)

Postiz source reuse rejected (AGPL + stack). Mixpost embedding rejected (PHP/Laravel). ADE may adapt patterns only. See [hybrid-postiz-mixpost-decision.md](hybrid-postiz-mixpost-decision.md).

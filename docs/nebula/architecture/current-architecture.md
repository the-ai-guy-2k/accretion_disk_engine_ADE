# ADE current architecture (implemented)

**Authority:** ADE MVP baseline on `deployable` (product commit `3c18176`; ACI-011 PAPEV **MVP PASS**). DGIX through ACI-DGIX-015 Facebook connection foundation (**POST-MVP — IN DEVELOPMENT**).  
**This is current truth.** Future intent is listed only as *not implemented*.

Stale bootstrap note: `docs/architecture.md` describes the ACI-002 shell (schema v1, health-only). Do not treat it as current product truth.

## Runtime stack

- **Node.js** 22.5+ (`node:sqlite`)
- **Next.js** App Router + **React** + **TypeScript**
- **SQLite** file `data/ade.sqlite` (schema **v8**)
- Single process: Hub UI and JSON APIs in the same Next.js server
- Local run: `npm run dev` → http://localhost:3000

No Docker, Postgres, Redis, Temporal, NestJS, Laravel, Postiz, or Mixpost in this product.

## Layer diagram (implemented)

```text
ADE Hub / UI
  src/app/* pages, src/components/AppShell.tsx
  /dgix — DGIX Operator workspace (ACP intake, review, authorization; not a second app)
        ↓
ADE-native workflow / application layer
  src/lib/workflow.ts
  src/lib/ai-generation.ts (live content generation)
  src/lib/ai-analysis.ts (live performance analysis)
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
        ↓
Future (not implemented): real social-platform adapters, ACRP export
```

## Hub surfaces (implemented)

| Route | Role |
| --- | --- |
| `/` | Hub — next step, Goal, happening now, decisions, recent results, recommendation |
| `/dgix` | DGIX workspace — ACP intake, Operator review, Operator authorization, operating model, proving mission |
| `/dgix/acp/[id]` | Operator review/authorization of an imported Campaign Package (not Standard ADE content approval) |
| `/goals` | Goals |
| `/campaigns`, `/campaigns/[id]` | Campaign workspace |
| `/sources` | Sources |
| `/create` | Draft from source |
| `/review` | Review / approve / reject |
| `/publishing` | Queue + mock adapter actions |
| `/analytics` | Goal/content results |
| `/intelligence` | Deterministic baseline + live AI recommendation |
| `/leads` | Placeholder (not in primary nav; post-MVP) |
| `/settings` | Config names; no live keys required |

## Functional relationships through ACI-009

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
4. Intelligence stores a `recommendations` row. Default analyze is `analysis_mode = deterministic_mock`. Operator-requested live AI analyze is `analysis_mode = live_ai`.
5. `ADE_AI_API_KEY` being set does **not** by itself mean live AI ran; `analysis_mode` and `liveAiUsed` do.

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
- Analysis: `analysis_mode = deterministic_mock` **or** `live_ai` (Intelligence → Analyze with AI)
- Metrics capture: `capture_method = manual` only; platform collection is refused (409)

## Standard ADE vs DGIX

- **Standard ADE** (`/` plus Goal → Intelligence): the Operator directly creates and manages Goals, Campaigns, Sources, content, approvals, results, and intelligence.
- **DGIX** (`/dgix`): execution-ready ACP intake, validation, Operator review/authorization, and Facebook connection validation. Real Facebook publishing, paid execution, and Results Package return remain future. **POST-MVP — IN DEVELOPMENT.**

Both use the same ADE engine. DGIX authorization does not call Facebook and does not use the mock adapter as real-platform execution. ACP import/authorize does not create Standard ADE Goal/Campaign/Source/Draft records.

## Not implemented (do not treat as current)

- Real Facebook / Meta Graph publishing
- Facebook account connection / OAuth
- Automatic Client QEN connectivity
- Results Package (ACRP) export
- Calendar scheduling (queue only; plan timing is a hint)
- Platform-collected analytics
- Authentication
- Lead capture / opportunity pipeline (tables exist unused)
- Postiz or Mixpost runtime
- ACP → ADE Goal/Campaign/Source/Draft materialization (not performed on import or authorization)

## Hybrid harvest (ACI-003)

Postiz source reuse rejected (AGPL + stack). Mixpost embedding rejected (PHP/Laravel). ADE may adapt patterns only. See [hybrid-postiz-mixpost-decision.md](hybrid-postiz-mixpost-decision.md).

# ADE ACI-009 — Live AI Analytics Completion Report

**Product:** Accretion Disk Engine (ADE)  
**QEN:** Social Engine Build QEN  
**Execution:** AIA / CAE — Local  
**Date:** 2026-08-26  
**Type:** Product capability  
**Branch:** `feature/aci-009`

**Completion condition:** ADE can use its live AI capability to analyze persisted social-content performance evidence and return useful, evidence-grounded recommendations that help the Operator decide how to improve future content, while retaining deterministic analytics and human decision authority.

---

## 1. AI Analytics Implementation

Live analysis reuses the ACI-008 provider boundary. There is no second AI stack.

| Piece | Location |
| --- | --- |
| Shared config (no secrets in git) | `src/lib/ai-config.ts` (`analyticsLive` when OpenAI is ready) |
| Shared complete() HTTP primitive | `src/lib/openai-content-provider.ts` |
| Provider interface | `src/lib/ai-provider.ts` (`complete` + `generate`) |
| Analysis prompts / JSON parse | `src/lib/ai-prompt.ts` |
| Orchestration | `src/lib/ai-analysis.ts` |
| Persist recommendation | `src/lib/analytics.ts` `analyzeAndStore(..., mode)` |
| HTTP | `POST /api/intelligence/analyze` with `mode: "deterministic" \| "live_ai"` |

Default `mode` is **deterministic** so ACI-005 callers stay unchanged. Live path: compute deterministic baseline → send evidence pack to the provider → store `analysis_mode=live_ai` only on success.

Proven live: `openai` / `gpt-4o-mini-2024-07-18`.

---

## 2. Evidence/Input Model

The model receives only persisted ADE rows, preserving Goal → Campaign → Content → Publication → Metrics:

- Goal (id, title, target metric, starting/target values, status, computed progress)
- Campaign (id, title) when content is campaign-linked
- Source/content context (titles, source type / material kind, publication ids)
- Operator-entered metrics: views/reach, reactions, comments, shares, clicks, Audience Network, meaningful conversations, leads
- Deterministic baseline Observed / Meaning / Action (labeled as not a live AI conclusion)
- Capture method on each metric (`manual` in this product)

Unknown publication ids returned by the model are dropped. Evidence stored on the recommendation is ADE-stored metric rows, not model-invented numbers.

---

## 3. Analysis Workflow

**Goal + Campaign/Content + Results → Operator requests Analyze with AI → live provider → stored recommendation.**

Intelligence `/intelligence` has two actions:

- **Compute baseline** — `mode=deterministic` (rankings and progress remain code, not AI)
- **Analyze with AI** — `mode=live_ai` when `ai.analyticsLive`

The operator does not export data, open an external AI UI, or paste a prompt.

---

## 4. Recommendation Workflow

Stored structure:

- **Observed** → `recommendations.observed`
- **Meaning** → `recommendations.why_it_matters`
- **Recommended next action** → `recommendations.action_hint`

Recommendations are advisory. ADE does not auto-approve, auto-publish, or execute campaigns from a recommendation.

---

## 5. Evidence Traceability

Each stored live recommendation includes:

- `goal_id` and `campaign_id` when a single campaign is in the pack
- `evidence` array: `{ publicationId, contentId, title, metric, value, captureMethod }`
- Boundary note identifying live AI, provider, and model

Validation recommendation `#11` cited publication `#20` (Audience Network **9**, manual) and `#21` (Audience Network **1**, manual) — the values stored by `validate-aci009.mjs`, not invented platform analytics.

---

## 6. UI Integration

| Surface | Change |
| --- | --- |
| `/intelligence` | Observed / Meaning / Recommended next action; Analyze with AI; unavailable reason when AI is not ready |
| `/analytics` | Deterministic rankings unchanged; link to Intelligence for AI analysis |
| `/create` | Same credentials can be used for analysis; generation path unchanged |
| `/settings` | Variable names only; notes generation **and** analysis |
| Dashboard | Already shows Live AI vs deterministic on the latest recommendation |

No prompt-engineering UI.

---

## 7. Deterministic Analytics Preservation

`GET /api/analytics` still returns code rankings (Business Outcomes > Meaningful Engagement > Raw Visibility). `buildDeterministicRecommendation` still runs first on the live path and is stored as `deterministicBaseline` in the analyze response. Default analyze without `mode` remains `liveAiUsed: false` (`validate:aci005` PASS).

---

## 8. Failure Handling

| Condition | Result |
| --- | --- |
| Missing credentials | Unit-tested; Hub reports unavailable; Analyze with AI disabled |
| Invalid `mode` | HTTP 400; no recommendation stored |
| Unknown Goal on live analyze | HTTP 404; no fake `live_ai` row |
| Malformed provider JSON | HTTP 502; no live AI recommendation stored |
| Provider timeout / HTTP failure | Classified operator message; metrics and deterministic analytics unchanged |

ADE does not generate fake live AI recommendations when analysis is unavailable.

---

## 9. Validation Evidence

`npm run validate:aci009` against http://localhost:3000:

| Step | Result |
| --- | --- |
| Goal #9 `[TEST DATA] Increase Audience Network by 10` | created |
| Campaign #5 | linked to Goal #9 |
| Publication #20 client-result | AN **9**, views **47** (manual) |
| Publication #21 informational | AN **1**, views **412** (manual) |
| Platform capture | still 409 |
| Deterministic rankings | client-result wins toward Goal; informational wins visibility |
| Default analyze | deterministic (ACI-005 contract) |
| Invalid mode / missing Goal | fail closed, no stored fake rec |
| Live analyze | recommendation **#11**, `analysis_mode=live_ai` |
| Evidence | AN 9 and 1 match stored metrics |

Artifacts: `docs/nebula/artifacts/aci-009-evidence/`

---

## 10. Regression Results

| Check | Result |
| --- | --- |
| `npm test` | 15 passed |
| `validate:aci004` | PASS (Sources, mock draft, Review, Queue) |
| `validate:aci005` | PASS (Goals, manual metrics, deterministic intel) |
| `validate:aci006` | PASS (Campaigns / plan / multi-draft) |
| `validate:aci008` | PASS (live AI Draft generation + mock/manual drafts) |

Provenance, human approval, and mock Facebook publishing were not rebuilt.

---

## 11. Real vs Manual/Mock Data Boundaries

- Live AI **did run** for analysis (OpenAI).
- Metrics in the proof are **operator-entered TEST DATA** (`capture_method=manual`).
- ADE still **does not** ingest Facebook/Meta analytics.
- Mock Facebook publishing is unchanged (not real Graph publish).
- Recommendation `#11` is advisory interpretation of those stored numbers, not a predicted business outcome.

---

## 12. Known Limitations

- OpenAI is the only implemented provider
- No platform-collected metrics
- No predictive performance guarantees
- Campaign multi-draft generation remains mock/manual
- Local TEST DATA remains in SQLite
- Live analysis requires credentials in the ADE process and a restart after changing them

---

## 13. Recommended Next ACI

Keep ADE-native Hub, approval gates, live draft generation, and this analysis path.

Suggested **ACI-010:** Graph Facebook adapter behind the existing `ChannelAdapter`, still blocked by human approval, with `manual_facebook` as fallback.

Do not import Postiz or Mixpost. Use `feature/aci-010` → validation → `deployable`.

---

**ACI-009 status:** Live AI-assisted performance analysis/recommendations are implemented and proven on persisted ADE evidence. Deterministic analytics and human decision authority remain. Stopped for Social Engine Build QEN review.

# ADE ACI-008 — Live AI Content Generation Completion Report

**Product:** Accretion Disk Engine (ADE)  
**QEN:** Social Engine Build QEN  
**Execution:** AIA / CAE — Local  
**Date:** 2026-08-26  
**Type:** Product capability  
**Branch:** `feature/aci-008`

**Completion condition:** An operator can select real source material inside ADE, invoke a real AI provider, receive a persisted source-grounded social-media draft, edit it, and move it through the existing mandatory human-review workflow.

---

## 1. AI Provider Implementation

ADE-owned provider boundary:

| Piece | Location |
| --- | --- |
| Config (no secrets in git) | `src/lib/ai-config.ts` |
| Prompt / grounding | `src/lib/ai-prompt.ts` |
| Error classification | `src/lib/ai-errors.ts` |
| Provider interface | `src/lib/ai-provider.ts` |
| OpenAI adapter | `src/lib/openai-content-provider.ts` |
| Orchestration | `src/lib/ai-generation.ts` |
| Persist draft | `src/lib/workflow.ts` `createDraftFromLiveAi` |
| HTTP | `POST /api/content/generate`, `GET /api/ai/status` |

Default provider is **OpenAI** Chat Completions (`ADE_AI_PROVIDER=openai`, model default `gpt-4o-mini`). Core workflow talks to `AiContentProvider`, not to OpenAI types. Unsupported provider ids fail closed with an operator-readable message. This is not multi-provider orchestration.

Proven live: `openai` / `gpt-4o-mini-2024-07-18`.

---

## 2. Source-Grounding Method

Generate always loads the selected `sources` row. The user prompt includes source id, title, type, date, provenance, notes, and body.

The system prompt forbids inventing customers, results, revenue, metrics, endorsements, partnerships, completed work, or product capabilities that are not in the source. Output is JSON `{title, body}` treated as a **draft**, not established truth.

---

## 3. Generation Workflow

**Select Source → Generate with AI → persisted Draft (`status=draft`, `generation_mode=live_ai`) → Review/Edit → Approve/Reject.**

Mock/manual **Create draft from source** is unchanged (`POST /api/content`). Campaign plan/draft generation remains deterministic/mock.

Schema **v5** stores `generation_provider`, `generation_model`, `generation_status` on `content_items`. Failed generates do not insert a content row.

---

## 4. UI Integration

Create (`/create`) now has Generate with AI controls: platform, purpose, tone, length/format, optional instruction. The operator does not leave ADE or paste from another AI UI.

Review shows a live-AI banner and still requires human approve/reject. Settings lists AI variable **names** only.

---

## 5. Provenance Evidence

Validation draft `#17`:

- `source_id` = 17
- `source_title` = `[TEST DATA] ADE local operator note`
- `source_provenance` = `scripts/validate-aci008.mjs`
- `generation_mode` = `live_ai`
- `generation_status` = `succeeded`
- `generation_provider` = `openai`
- After edit, `source_id` remained 17

File: `docs/nebula/artifacts/aci-008-evidence/content-17.json`

---

## 6. Human Approval Preservation

Live generate returns `status=draft` with no publication row. Approve creates `PENDING`. Rejected AI drafts cannot enqueue (409). AI does not auto-publish or auto-approve.

---

## 7. Failure Handling

| Condition | Behavior |
| --- | --- |
| Missing / rejected credentials | 503, no draft |
| Timeout | 504, no draft |
| Unavailable / rate-limit / 5xx | 502, no draft |
| Malformed model output | 502, no draft |
| Missing `source_id` | 400, no draft (HTTP-proven) |
| Unknown source | 404, no draft (HTTP-proven) |

Create UI shows `data.error`. `GET /api/ai/status` explains unconfigured state without exposing the key.

Missing-credentials detection: `tests/ai-generation.test.mjs`.

---

## 8. Credential/Security Handling

- `.env.example` lists names only
- `.env` / `.env.local` gitignored
- Browser receives `{configured, provider, model, ready}` — never the key
- OpenAI `Authorization` header is server-side only
- `ADE_AI_API_KEY` is primary; OpenAI may use `OPENAI_API_KEY` if ADE’s key is empty

No secrets were committed.

---

## 9. Validation Evidence

Non-sensitive TEST DATA source. Live OpenAI request succeeded.

| Check | Result |
| --- | --- |
| `GET /api/health` schema v5, `ai.ready=true` | PASS |
| `npm run validate:aci008` | PASS |
| Live draft persist + edit + approve + reject-enqueue 409 | PASS |
| Mock/manual draft still works | PASS |
| `npm test` | PASS (12) |

Evidence folder: `docs/nebula/artifacts/aci-008-evidence/`

`initialized_at` unchanged: `2026-08-26T00:24:40.643Z`

---

## 10. Regression Results

| Check | Result |
| --- | --- |
| `validate:aci004` | PASS |
| `validate:aci005` | PASS |
| `validate:aci006` | PASS |
| Create page HTTP 200 | PASS |

Manual drafts, review, approval, queue, goals, campaigns, and results still function.

---

## 11. Known Limitations

- OpenAI is the only implemented provider
- Campaign multi-draft generation is still mock/manual
- Intelligence/analytics are still deterministic
- No live Meta publishing, scheduling, or auth
- Local TEST DATA remains in SQLite
- Generated copy is a draft; operators must still review for accuracy

---

## 12. Recommended Next ACI

Keep ADE-native Hub, approval gates, and this generation path.

Suggested **ACI-009:** Graph Facebook adapter behind the existing `ChannelAdapter`, still blocked by human approval, mock adapter as fallback — the product recommendation left from ACI-006/007.

Alternate: live AI **analysis/recommendations** behind the existing deterministic Intelligence boundary, separate from this content-generation path.

Do not import Postiz or Mixpost. Use `feature/aci-009` → validation → `deployable`.

---

**ACI-008 status:** Live source-grounded content generation is implemented and proven. Human review remains mandatory. Stopped for Social Engine Build QEN review.

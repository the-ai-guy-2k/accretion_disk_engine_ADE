# ACI-004 — Vertical Slice Completion Report

**Product:** Accretion Disk Engine (ADE)  
**QEN:** Social Engine Build QEN  
**Date:** 2026-08-26  
**Path:** `C:\Users\tim\Documents\business_related\The_AI_Guy\nebula\2 - TAIG2K_SOFTWARE\Accretion_disk_engin_ADE`  
**Run:** ADE RUNNING — http://localhost:3000  
**Restart validation:** PASS  
**Postiz / Mixpost code imported:** none

---

## 1. Implementation Summary

ADE now runs the first operator workflow on the existing Next.js + SQLite Hub:

**Source → Mock/manual draft → Review (edit / reject / return / approve) → Publishing queue → Manual/mock Facebook adapter**

Human approval is required before a queue row exists. The Facebook path is a **manual/mock adapter** (`manual_facebook`). It does not call Meta.

Validation: `npm test` (schema + gates) and `npm run validate:aci004` (HTTP success + failure + provenance).

---

## 2. Data Model Changes

Schema **v2** (`src/lib/schema.sql` + `src/lib/migrate.ts` for existing files).

| Change | Purpose |
| --- | --- |
| `sources.body`, `activity_date`, `provenance`, `is_test` | Real source fields + TEST DATA flag |
| `content_items.generation_mode`, `generation_note`, `is_test` | Mock generation boundary |
| `content_items.status` | `draft` / `rejected` / `approved` |
| `channels.adapter_id`, `is_mock` | Channel 01 mock Facebook seed |
| `publications.status` | `PENDING` / `READY` / `PUBLISHED` / `FAILED` |
| `publications.failure_reason`, `is_mock`, `adapter_id`, `attempt_id` | Truthful fail + no duplicate run |

`app_meta.initialized_at` from ACI-002 is unchanged (`2026-08-26T00:24:40.643Z`).

---

## 3. Source Capability

Operator can create and list sources (title, body, type, date, provenance, notes, TEST DATA).  
**Load ACI-004 test source** inserts a labeled test record.  
Select source → Create draft (`/create?sourceId=`).

API: `GET/POST /api/sources`, `GET /api/sources/:id`.

---

## 4. Draft Capability

`POST /api/content` with `source_id` creates a draft. Body includes  
`ADE MOCK / MANUAL GENERATION BOUNDARY — this draft was not produced by a live AI provider.`  
Drafts are editable via `PATCH` while not approved/published.  
`source_id` is stored and shown on Create, Review, and Queue.

---

## 5. Review / Approval Capability

`/review` shows source + draft, save edits, **Approve into queue**, **Reject**, **Return to draft**.

- Approve → content `approved` + publication `PENDING`  
- Reject / return while queued → publication `FAILED` (cancelled), not PUBLISHED  
- `POST ... action=enqueue` on draft/rejected → **409**

Approvals are appended to `approvals`.

---

## 6. Publishing Queue

States: **PENDING → READY → PUBLISHED** or **PENDING/READY → FAILED**.

| Action | From | To |
| --- | --- | --- |
| Approve | — | PENDING |
| Hand to mock Facebook | PENDING | READY |
| Confirm mock publish | READY | PUBLISHED |
| Simulate failure | PENDING or READY | FAILED |
| Retry | FAILED | PENDING |

Duplicate hand-off/confirm → 409. PUBLISHED is terminal. FAILED never writes `published_at` or status PUBLISHED.

---

## 7. Facebook Adapter Boundary

`src/lib/channel-adapter.ts` — `ChannelAdapter` + `manualFacebookAdapter`.

- `id`: `manual_facebook`  
- `isMock`: true  
- UI banner: **NOT REAL FACEBOOK PUBLISHING**  
- Mock external id like `mock-fb-1-…`  
- No `META_*` values required  

Core workflow talks to the adapter interface, not Graph API.

---

## 8. UI Workflow

Hub chrome preserved. Strip: **1. Source → 2. Draft → 3. Review → 4. Queue**.  
Dashboard shows live counts (sources, pending decisions, queue states) and the mock adapter label. Analytics/leads/intelligence remain non-workflow placeholders without fake metrics.

---

## 9. Provenance Validation

Every draft and publication carries `source_id` and displays  
`Provenance: source #n — {title} · {provenance} · TEST DATA`.

After approve, fail, retry, mock publish, and process restart, content `#1` still has `source_id = 1`.

---

## 10. Success-Path Evidence

`scripts/validate-aci004.mjs` (see `docs/aci/aci-004-evidence/http-validation.txt`):

Create TEST source → mock draft → edit → (reject path covered separately) → approve → PENDING → fail (then retry) → hand to adapter READY → confirm **PUBLISHED** (mock).

Screenshots: `docs/aci/aci-004-evidence/sources.png`, `create.png`, `review.png`, `publishing.png`.

Queue screenshot shows `[TEST DATA] Edited draft title`, provenance source #1, `manual_facebook`, `PUBLISHED`, mock id, and the not-real-Facebook banner.

---

## 11. Failure-Path Evidence

Same script: adapter `fail` from PENDING → status **FAILED**, `published_at` null, not PUBLISHED. Duplicate confirm after success is 409. Failing a PUBLISHED row is 409.

---

## 12. Persistence / Restart Evidence

**Restart validation: PASS.**

`docs/aci/aci-004-evidence/content-before-restart.json` and `content-after-restart.json`:  
`source_id=1`, publication `PUBLISHED` before and after a controlled `next dev` stop/start.  
`restart_check.txt`: `provenance_ok=True`.  
Health after restart: schema v2; `initialized_at` unchanged (`2026-08-26T00:24:40.643Z`).

The later `next dev` process exits (shell tasks 574977 / 574978, Windows exit `4294967295`) were **intentional stops** during that restart check. They are **not ADE startup failures** and are **not a capability defect**. The first process held port 3000, was stopped so the restart could run, and ADE came back on **http://localhost:3000**. Amendment re-check (no extra restart): health `ok`, content `#1` still `source_id=1` / `PUBLISHED`.

---

## 13. Known Limitations

- No live AI  
- No real Facebook/Meta publish  
- No calendar scheduler (queue only)  
- No extra networks  
- No analytics/leads/intelligence  
- TEST DATA in the local DB from validation (labeled)  
- Single-operator, no auth  

---

## 14. Recommended ACI-005 Scope

Keep ADE-native Hub and this workflow.

Suggested next slice: **Graph Facebook adapter behind the same `ChannelAdapter`**, still blocked by human approval, with the mock adapter remaining as fallback when Meta credentials/App Review are missing. Do not add Temporal, Mixpost, or Postiz.

Alternatively, if Meta is still blocked: **goal linkage on drafts** and a small **schedule_at** on PENDING items, still mock-publish only.

## 15. README product intent (ACI-004 amendment)

`README.md` now states ADE as a **general user product** (viewership, hub, automate repetitive social work, AI-assisted analytics as **intent**). TAIG is documented only as the initial user/test environment. Unimplemented areas (live AI, real Facebook, scheduling, analytics) remain listed as not implemented.

**ACI-004 status:** Operator can complete Source → Draft → Human decision → Approved queue item → Controlled Facebook mock boundary on localhost, with persistence and provenance intact. Restart validation **PASS**.

Stopped.

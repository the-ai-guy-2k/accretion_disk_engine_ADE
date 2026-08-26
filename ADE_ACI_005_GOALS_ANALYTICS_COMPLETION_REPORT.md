# ACI-005 — Goals, Results & AI-Assisted Analytics Completion Report

**Product:** Accretion Disk Engine (ADE)  
**QEN:** Social Engine Build QEN  
**Date:** 2026-08-26  
**Path:** `C:\Users\tim\Documents\business_related\The_AI_Guy\nebula\2 - TAIG2K_SOFTWARE\Accretion_disk_engin_ADE`  
**Run:** ADE RUNNING — http://localhost:3000  
**Restart validation:** PASS  
**Postiz / Mixpost code imported:** none

The `next dev` process was **intentionally stopped** so persistence could be checked. That stop is **not** an ADE startup failure and is **not** a capability defect.

---

## 1. Implementation Summary

ACI-005 adds the first measurable feedback loop on top of the proven ACI-004 workflow:

**Goal → Source → Draft → Publication → Manual results → Analysis → Recommendation**

The ACI-004 path is unchanged:

**Source → Draft → Review → Approval → Queue → Mock Facebook adapter**

Operators can create a Goal (including “Increase Audience Network by 10”), associate sources/drafts with it, enter labeled manual performance results for **PUBLISHED** items, see simple analytics, and get an evidence-based next-action recommendation. Live AI is **not** wired; analysis uses a clearly labeled deterministic/mock boundary that a real analyzer can replace later.

Validation: `npm test`, `npm run validate:aci005`, `npm run validate:aci004` (regression), then a controlled restart.

---

## 2. Goal Model

Table `goals` (schema **v3**):

| Field | Role |
| --- | --- |
| `title` | Name |
| `description` | What the Goal is for |
| `target_metric` | One of the ADE metric keys (default `audience_network_gained`) |
| `starting_value` | Baseline |
| `target_value` | Target |
| `target_date` | Optional |
| `status` | `active` / `paused` / `achieved` / `archived` |
| `is_test` | TEST DATA flag |

**Progress is computed**, not stored:  
`current = starting_value + SUM(metric on PUBLISHED content linked to the Goal)`.

UI: `/goals`. API: `GET/POST /api/goals`, `GET/PATCH /api/goals/:id`.

Hub shows the active Goal and its progress.

---

## 3. Content-to-Goal Relationship

Preserved chain:

**Goal → Source (`sources.goal_id`) → Draft (`content_items.goal_id` + `source_id`) → Publication**

Effective Goal is `COALESCE(content.goal_id, source.goal_id)`. Drafts inherit the source Goal unless the operator overrides it. Association can be set on source create, draft create, or Review without rewriting published copy.

ACI-004 `source_id` provenance is unchanged.

---

## 4. Metrics Model

Results are stored on **PUBLISHED** publications only (`PUT /api/publications/:id/results`).

| Metric key | Label |
| --- | --- |
| `views_reach` | Views / reach |
| `reactions` | Reactions |
| `comments` | Comments |
| `shares` | Shares |
| `clicks` | Clicks |
| `audience_network_gained` | Audience Network gained |
| `meaningful_conversations` | Meaningful conversations |
| `leads_generated` | Leads generated |

`capture_method`:

- `manual` — operator-entered (this slice)
- `platform` — **refused (HTTP 409)**; Meta/Facebook collection is not implemented

Rows keep `numeric_value`, `captured_by=operator`, and `is_simulated` for TEST DATA. ADE does not invent performance numbers.

---

## 5. Analytics Capability

`GET /api/analytics?goal_id=` answers:

- Which content received the most visibility?
- Which content produced the most meaningful engagement?
- Which content contributed most to Audience Network growth?
- Is the selected Goal progressing?
- Which published content appears most useful toward the Goal?

Ranking hierarchy (fixed):

**Business Outcomes > Meaningful Engagement > Raw Visibility**

This is decision support, not a BI suite. UI: `/analytics`.

---

## 6. Intelligence / Recommendation Capability

Interface: `runAnalysis()` in `src/lib/analytics-logic.ts`.

Current implementation: **deterministic_mock**.

If `ADE_AI_API_KEY` is set, ADE still does **not** call a live model; it keeps the deterministic result and notes that no live analyzer is wired. Live AI can replace this boundary later without changing Goal/content/metrics storage.

Each run stores a `recommendations` row with:

- what ADE observed
- why it matters
- recommended next action
- Goal id
- evidence JSON (publication, metric, value, capture method)
- `analysis_mode` + boundary note

UI: `/intelligence` (“Analyze from persisted evidence”). API: `GET /api/intelligence`, `POST /api/intelligence/analyze`.

Unsupported guesses are not presented as measured findings. If there are no results, ADE says it is waiting for results.

---

## 7. Hub Changes

Dashboard (`/`) is centered on **Goals → Decisions → Results**:

- active Goal + progress
- content awaiting decisions
- recent publication results
- latest ADE recommendation
- mock Facebook adapter reminder (not vanity metrics)

Nav adds **Goals**. Analytics and Intelligence placeholders are replaced with working views. Leads remains a placeholder.

---

## 8. Validation Evidence

Clearly labeled TEST DATA. Script: `scripts/validate-aci005.mjs` → `docs/aci/aci-005-evidence/http-validation.txt`.

**Goal:** Increase Audience Network by 10 (`starting_value=0`, `target_value=10`).

Two associated published items:

| Item | Kind | First AN result | After update |
| --- | --- | --- | --- |
| Publication #2 / source #2 | `client_result` | 7 | 7 |
| Publication #3 / source #3 | `informational` | 1 | 8 |

Proven:

- Goal created and visible
- Both sources/drafts/publications linked (`effective_goal_id=1`, `source_id` intact)
- First progress **8 / 10**
- Analytics: informational had more visibility; client-result had more Audience Network and was most useful toward the Goal
- First recommendation named **client-result content** as the stronger contributor
- After updating informational AN to 8, progress became **15 / 10** and the recommendation flipped to **general informational content** (8 vs 7)
- `capture_method=platform` → 409
- Results before PUBLISHED → 409

---

## 9. Persistence / Restart Evidence

**Restart validation: PASS.**

Controlled stop of `next dev`, then start again on http://localhost:3000.

`docs/aci/aci-005-evidence/restart_check.txt`:

- Goal `#1` remained
- Goal/content links remained (`content #2` `source_id=2`, `effective_goal_id=1`)
- Metrics remained (`contributed=15` before and after)
- Progress remained correct (`current=15`)
- Stored recommendation `#2` remained
- Analyze after restart still produced the evidence-based recommendation from persisted metrics
- `initialized_at` unchanged: `2026-08-26T00:24:40.643Z`
- schema **v3**

The process exit used to free port 3000 was an **intentional stop**, not an ADE defect.

---

## 10. ACI-004 Regression Results

`npm run validate:aci004` → **PASS** after ACI-005 was in place.

Unapproved/rejected content still cannot enter the queue (409). FAILED is not stored as PUBLISHED. Duplicate adapter hand-off/confirm still 409. Mock Facebook boundary still identified. `source_id` provenance survived.

---

## 11. Mock vs Real Capability Boundaries

| Capability | This slice |
| --- | --- |
| Draft generation | Mock/manual (ACI-004, unchanged) |
| Facebook publish | Mock `manual_facebook` (ACI-004, unchanged) |
| Performance metrics | **Manual entry only**; platform collection refused |
| Analysis / recommendation | **Deterministic/mock**; live AI not used |
| Audience/business numbers | Only operator-entered TEST DATA; none fabricated as platform facts |

Banners state these boundaries in the Hub and APIs.

---

## 12. Known Limitations

- No live AI analysis
- No Meta/Facebook insights
- No scheduler
- No extra networks
- No leads/CRM
- No autonomous campaign decisions
- Goal progress can exceed 100% if entered results overshoot the target (honest math)
- Local TEST DATA remains in `data/ade.sqlite` from validation (labeled)
- Single-operator, no auth

---

## 13. Recommended ACI-006 Scope

Keep the ADE-native Hub, ACI-004 publishing gates, and this Goal → Results → Recommendation loop.

Suggested next slice: **live Graph Facebook adapter behind the existing `ChannelAdapter`**, still blocked by human approval, with the mock adapter as fallback. If Page insights are available, store them as `capture_method=platform` without changing the analytics contract. Do not add Temporal, Mixpost, or Postiz.

Alternatively, if Meta is still blocked: **wire a live AI analyzer** behind `runAnalysis()` using `ADE_AI_*` only when configured, requiring the same persisted evidence and keeping the deterministic fallback.

---

**ACI-005 status:** Operator can complete Goal → associated published content → measurement → analysis → recommendation on localhost, while Source → Draft → Review → Approval → Queue → Mock Facebook remains intact. Restart validation **PASS**.

Stopped.

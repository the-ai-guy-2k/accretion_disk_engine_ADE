# ACI-006 — Campaign Planning & Content Automation Completion Report

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

ACI-006 adds campaign planning so the operator can state a Goal and let ADE organize selected sources into a content plan and multiple drafts:

**Goal → Campaign → Sources → Content Plan → Drafts → Human Review**

ACI-004 and ACI-005 remain intact:

- Source → Draft → Review → Approval → Queue → Mock Facebook
- Goal → Content → Results → Analysis → Recommendation

Live AI is not used. Planning and draft generation use a labeled deterministic/mock boundary. Human approval is still required before publishing.

Validation: `npm test`, `npm run validate:aci006`, `npm run validate:aci004`, `npm run validate:aci005`, then a controlled restart.

---

## 2. Campaign Data Model

Schema **v4**.

| Table | Role |
| --- | --- |
| `campaigns` | Name, objective, `goal_id`, optional start/end, status (`planning` / `active` / `paused` / `completed`), `is_test`, plan summary/mode/boundary |
| `campaign_sources` | Selected sources ADE may use |
| `campaign_plan_items` | Planned posts: sequence, purpose, format, audience, suggested timing, `source_id`, later `content_id` |
| `content_items.campaign_id` | Drafts generated for the campaign |

Progress/results stay on existing `metrics` rows. No new analytics engine.

---

## 3. Goal → Campaign Relationship

A Campaign is created from an existing Goal (`POST /api/campaigns` with `goal_id`). Validation used Goal **Increase Audience Network by 10** and Campaign **ADE Awareness Campaign**.

Drafts inherit `goal_id` from the campaign. Workspace always shows the associated Goal.

---

## 4. Source Selection

Operator attaches sources with `PUT /api/campaigns/:id/sources` (`source_ids`). ADE will not generate a plan until at least one source is selected. Validation attached two TEST DATA sources (`client_result` and `informational`).

---

## 5. Content Planning

`POST /api/campaigns/:id/plan` builds a lightweight plan:

- number of posts (one per selected source)
- purpose (from source type)
- source material
- intended audience (from Goal)
- suggested format (Facebook short post)
- publication order (result-proof sources first)
- suggested timing (Day 1, Day 3, … as a **hint**, not a scheduler)

Banner: deterministic/mock campaign plan. Live AI is not claimed.

---

## 6. Automated Draft Workflow

`POST /api/campaigns/:id/generate-drafts` (`/api/campaigns/:id/drafts`) creates one draft per plan item that does not already have `content_id`.

Each draft answers:

- Which Source contributed? `source_id` + provenance
- Which Campaign? `campaign_id`
- Which Goal? `effective_goal_id`

Generation uses the existing mock/manual draft boundary. Generated items start as `draft`. They are not auto-approved or auto-published.

---

## 7. Campaign Workspace

`/campaigns` list + `/campaigns/:id` workspace (`GET /api/campaigns/:id/workspace`).

Shows objective, Goal, selected sources, plan, drafts, approval counts, publishing state, and available campaign results. Hub nav adds **Campaigns**. Dashboard includes a campaign count. Loop: **Goals → Campaigns → Decisions → Results**.

---

## 8. Human Approval Validation

Validation generated two drafts, approved one, rejected one.

- Approved draft entered the publishing queue as `PENDING`
- Rejected draft `enqueue` returned **409**
- Unapproved campaign content cannot publish

ACI-004 gates are unchanged.

---

## 9. Campaign Results Relationship

`GET /api/campaigns/:id/results` aggregates existing ACI-005 `metrics` for publications whose content has `campaign_id`. No new BI system. Empty totals until published items have operator-entered results.

---

## 10. Persistence / Restart Evidence

**Restart validation: PASS.**

`docs/aci/aci-006-evidence/restart_check.txt`:

- Campaign `#1` remained (ADE Awareness Campaign)
- Goal `#2` relationship remained
- Two sources, two plan items, two drafts remained
- Approval counts remained (1 approved, 1 rejected)
- Draft `source_id` and `campaign_id` remained
- `initialized_at` unchanged: `2026-08-26T00:24:40.643Z`
- schema **v4**

---

## 11. Regression Results

| Check | Result |
| --- | --- |
| `npm test` | PASS (8) |
| `npm run validate:aci006` | PASS |
| `npm run validate:aci004` | PASS |
| `npm run validate:aci005` | PASS |

ACI-005’s schema assertion now accepts v3 **or later**, and ranking assertions are Goal-scoped so leftover TEST DATA on the same localhost DB does not false-fail the loop.

---

## 12. Mock vs Real Capability Boundaries

| Capability | This slice |
| --- | --- |
| Campaign plan | Deterministic/mock |
| Draft generation | Mock/manual (not live AI) |
| Facebook publish | Mock `manual_facebook` (unchanged) |
| Metrics | Manual ACI-005 entry; campaign totals reuse those rows |
| Suggested timing | Plan hint only — not a scheduler |

---

## 13. Known Limitations

- No live AI planner or writer
- No real Meta publish or insights
- No calendar scheduler
- No multi-platform campaigns
- No autonomous publishing or business decisions
- Campaign results are empty until content is published and measured
- Local TEST DATA remains in `data/ade.sqlite` (labeled)
- Single-operator, no auth

---

## 14. Recommended ACI-007 Scope

Keep ADE-native Hub, approval gates, and this campaign loop.

Suggested next slice: **Graph Facebook adapter behind the existing `ChannelAdapter`**, still blocked by human approval, mock adapter as fallback. If Page insights exist, store them as `capture_method=platform` so campaign totals can include platform results without changing the analytics contract.

Alternatively: wire a **live AI planner/writer** behind `buildCampaignPlan` / draft generation when `ADE_AI_*` is configured, keeping the deterministic fallback.

Do not add Temporal, Mixpost, or Postiz.

---

**ACI-006 status:** Operator can move from a social-media Goal to Campaign → selected Sources → planned content → multiple drafts → human decisions, without building each post by hand. Restart validation **PASS**.

Stopped after commit/push of this validated state (see git).

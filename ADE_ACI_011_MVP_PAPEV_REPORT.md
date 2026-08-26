# ADE ACI-011 — MVP PAPEV Report

**Product:** Accretion Disk Engine (ADE)  
**QEN:** Social Engine Build QEN  
**Execution:** AIA / CAE — Local  
**Date:** 2026-08-26  
**Type:** PAPEV / MVP acceptance  
**Product baseline:** `deployable` @ `3c18176`  
**New product capability:** not added  
**DGIX:** not implemented

---

## 1. Executive PAPEV Result

**MVP PASS**

The current ADE MVP demonstrates its intended purpose: it reduces repetitive social-media work (source-grounded draft generation, queue, Goal progress, analysis), keeps the stated objective central, preserves human approval, measures operator-entered results, and returns evidence-grounded next-action advice.

This is not a pass merely because ACI-004–010 previously passed. PAPEV re-ran the full Goal → Intelligence loop, then checked whether ADE reasoned about **+2 client contacts** rather than vanity views, and whether the Hub answers operator questions with honest boundaries.

TEST DATA used for the scenario is labeled. ADE did not create two real TAIG clients and did not collect Facebook metrics.

---

## 2. MVP Current Truth

ADE is a localhost operator Hub that runs:

**Goal → Campaign → Source → Draft (manual or live AI) → Review/Approval → mock Facebook publishing → manual Results → deterministic Analytics + live AI Intelligence**

- SQLite schema **v5**, stage badge **MVP baseline**
- Live AI: OpenAI via existing provider boundary (drafts + analysis)
- Publishing: **mock / manual Facebook adapter** — no Meta API
- Metrics: **manually entered** only; platform capture refused (409)
- Recommendations: advisory; not guaranteed outcomes
- DGIX, real Facebook, paid targeting, scheduling calendar, Leads/CRM: **not implemented**

Product code SHA for this MVP: **`3c18176`**. This PAPEV adds acceptance records on `deployable`; it does not add a major capability.

---

## 3. End-to-End Validation

PAPEV scenario Goal (TEST DATA):

**Increase TAIG client contacts through Facebook by 2**  
`target_metric = leads_generated`, starting 0, target 2.

`npm run validate:aci011` against http://localhost:3000:

| Step | Evidence |
| --- | --- |
| Goal #16 | created, TEST DATA |
| Campaign #10 | linked to Goal |
| Source #40 | attached; provenance `scripts/validate-aci011.mjs` |
| Live AI Draft #47 | `generation_mode=live_ai`, source 40, campaign 10, `status=draft`, no publication |
| Operator edit | source provenance retained |
| Reject second AI draft | enqueue 409 |
| Approve #47 | publication #35 |
| Manual draft (vanity contrast) | publication #36 |
| Mock Facebook | hand-off message includes not-real-Facebook; confirm PUBLISHED |
| Manual results | #35: **leads 2**, views 40; #36: **leads 0**, views **500** |
| Platform metrics | 409 |
| Goal progress | contributed **2**, achieved **true** from leads, not views |
| Deterministic ranking | most useful toward Goal = #35 (leads 2); most visibility = #36 (views 500) |
| Live AI rec #19 | Observed / Meaning / Action; evidence `leads_generated=2` manual |

`validate:aci010` also PASS on the same Hub (single-item contacts Goal).

---

## 4. Product Intent Evaluation

Intended purpose: automate repetitive social-media management and use AI-assisted analytics to improve content, viewership, online presence, and progress toward a stated objective.

| Intent element | MVP demonstration |
| --- | --- |
| Reduce repetitive drafting | Live AI produces an editable, source-grounded draft in-Hub |
| Keep human in control | Review mandatory; reject cannot publish |
| Measure against a Goal | Progress uses `leads_generated` for this scenario |
| Learn and recommend | Live AI rec #19: Goal achieved via 2 leads; try similar source material |
| Honest about platforms | Mock Facebook + manual metrics labeled |

The MVP does **not** yet close the loop with real distribution. That is a documented limitation, not a hidden gap.

---

## 5. Automation / Manual-Work Evaluation

**ADE now automates:** draft generation from a Source; campaign plan from selected Sources; queue state; Goal progress from entered metrics; ranking; live AI interpretation of stored evidence; persistence of the loop.

**Operator still does (by design or MVP bound):**

- State Goal / Campaign / Source
- Approve or reject every draft (required)
- Two mock Facebook clicks (hand-off + confirm)
- Type performance numbers by hand
- Request analysis
- Choose between campaign plan drafts (mock) and Create → Generate with AI

The remaining manual work is either **human authority** or **honest MVP bounds** (no real Facebook, no platform metrics). It does not prevent the product from demonstrating purpose.

---

## 6. Goal-Oriented Intelligence Evaluation

Contrast pack for Goal #16:

- Content A (live AI): **2 leads**, 40 views  
- Content B (manual): **0 leads**, **500 views**

Deterministic Analytics selected A as most useful toward the Goal and B as most visibility.

Live AI recommendation **#19**:

- **Observed:** Update on TAIG Activity generated 2 Leads, while Draft from source generated 0 Leads.  
- **Meaning:** Goal is fully achieved with 2 Leads generated… the Update content directly contributed to the goal.  
- **Recommended next action:** Consider producing another piece based on similar source material.

ADE did **not** treat 500 views as the win. It reasoned around **+2 contacts / leads**. Views were recorded but not ranked above the Goal metric.

---

## 7. AI Content Evaluation

Draft #47:

- Consumed Source #40 body/title  
- Editable; operator edit persisted  
- `source_id` retained  
- `campaign_id` retained  
- Identified as live AI in `generation_note`  
- `status=draft`; no auto-approve or auto-publish  

---

## 8. Human Authority Evaluation

**AI assists → Human decides → ADE executes the approved workflow.**

Rejected AI content could not enter the publishing-ready path (409). Unapproved content cannot enqueue. Review copy states ADE will not auto-publish.

---

## 9. Publishing Evaluation

Channel 01 is the **manual/mock Facebook adapter**. Hand-off messages include **NOT REAL FACEBOOK PUBLISHING**. Hub states publishing is not the Meta API. Confirm stores a mock external id. This MVP must not be described as live Facebook publishing.

---

## 10. Measurement Evaluation

Operator entered results on PUBLISHED items. Metrics linked through publication → content → campaign → Goal. Banner: manually entered; not collected from Facebook. `capture_method=platform` remains 409. Goal progress used **leads_generated**, not views.

---

## 11. AI Intelligence Evaluation

Intelligence stored Observed / Meaning / Recommended next action with evidence `leads_generated=2`, `captureMethod=manual`, Goal #16, Campaign #10. Rec #19 did not invent revenue, real clients, or platform collection. Deterministic baseline remains available separately.

---

## 12. Operator Usefulness

The Hub is built around operator questions (objective, happening now, decisions, recent results, recommendation) plus a suggested next step and a single journey strip.

On a **clean** objective this is a coherent operating experience, not a pile of endpoints.

On a **dirty local SQLite file** filled with prior TEST DATA, Hub next-step uses whole-database counts and can point at unrelated drafts. That is a known ACI-010 MINOR. It does not stop an operator from completing one Goal’s journey via the strip and screens.

**Verdict:** useful MVP operating experience, with remaining mock-publish and manual-metrics labor that is truthful rather than fake automation.

---

## 13. Truth-Boundary Validation

| Distinction | Present |
| --- | --- |
| Live AI vs deterministic | Create, Review, Intelligence, Hub rec card |
| Real evidence vs TEST DATA | `is_test`, TEST DATA labels, scenario copy |
| Manual vs platform metrics | Publishing copy; 409 on platform |
| Mock vs real Facebook | Publishing banner; Hub; adapter messages |
| Facts vs interpretation | Observed / Meaning / Action |
| Recommendation vs guarantee | Advisory copy |
| MVP vs post-MVP | README two tables; DGIX listed not implemented |

---

## 14. Regression Results

| Check | Result |
| --- | --- |
| `npm test` | 15 passed |
| `validate:aci004` | PASS |
| `validate:aci005` | PASS |
| `validate:aci006` | PASS |
| `validate:aci008` | PASS |
| `validate:aci009` | PASS |
| `validate:aci010` | PASS |
| `validate:aci011` | PASS |

No rebuild of Hub, Goals, Campaigns, Sources, drafts, Review, Queue, mock adapter, metrics, analytics, recommendations, provenance, or persistence.

---

## 15. Remaining Issues by Severity

**BLOCKER:** none.

**MAJOR:** none that prevent demonstrating MVP purpose.

**MINOR:**

- Hub next-step uses whole-database counts (ACI-010; does not fail PAPEV).
- Campaign plan multi-draft remains mock/manual; live AI is on Create (ACI-010).
- Mock publish is two operator actions; metrics are typed by hand (honest MVP bound).

**COSMETIC:**

- Journey strip wraps on a narrow window.
- `/leads` placeholder remains (not in primary nav).
- Local TEST DATA accumulates in `data/ade.sqlite`.

---

## 16. MVP Limitations

- Localhost; no authentication  
- No real Facebook auth, publish, or metric retrieval  
- No calendar scheduler  
- No Leads/CRM  
- No DGIX (ACP intake, ACRP export, paid targeting, distribution optimization)  
- OpenAI is the only wired AI provider  
- Recommendations are not performance guarantees  

---

## 17. PAPEV Decision

**MVP PASS**

The current ADE MVP sufficiently demonstrates its intended product purpose and is suitable to establish as the MVP baseline.

Not CONDITIONAL PASS: ACI-010 leftovers do not materially stop the primary workflow.  
Not FAIL: no blocker in authority, Goal-orientation, truth boundaries, or the end-to-end loop.

---

## 18. Release-Baseline Recommendation

Establish **`deployable` at product commit `3c18176`**, plus this PAPEV acceptance overlay, as the **ADE MVP baseline**.

QEN may treat `deployable` as the validated MVP from which post-MVP work is authorized separately.

Do **not** begin DGIX in this slice.

---

## 19. DGIX Readiness

The MVP is a **sound baseline** for later DGIX:

- Campaign, Goal, Source, Draft, Approval, Publication, and Results relationships already exist  
- Human approval gate is in place  
- Mock adapter is a clean boundary for a future Graph adapter  
- Manual metrics are explicit, so Facebook retrieval can be added without pretending it already exists  
- Intelligence already consumes persisted evidence  

DGIX (ACP intake, real Facebook, ACRP export, paid targeting) remains **post-MVP** and is not started here.

---

**ACI-011 status:** Complete. PAPEV decision **MVP PASS**. Stopped for Social Engine Build QEN. DGIX not begun.

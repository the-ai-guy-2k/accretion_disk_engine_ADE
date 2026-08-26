# ADE ACI-008 — Governance & Traceability Reconciliation Report

**Product:** Accretion Disk Engine (ADE)  
**QEN:** Social Engine Build QEN  
**Execution:** AIA / CAE — Local  
**Date:** 2026-08-26  
**Type:** Governance / traceability reconciliation  
**Product changes:** none

**Numbering fact:** QEN previously issued **ACI-008 Live AI Content Generation**, which was implemented and merged to `deployable` (`014835b`). This slice is a **second** ACI numbered 008 (reconciliation). Both records are kept. Live AI was **not** implemented in this slice and was **not** removed.

---

## 1. ACI Archive Status

Inspected: `docs/nebula/aci/`

| ACI | Class | Artifact filename |
| --- | --- | --- |
| ACI-001 (search, superseded) | **RECOVERED** | `docs/nebula/aci/ACI-001_superseded_search.md` |
| ACI-001 (authoritative path) | **RECOVERED** | `docs/nebula/aci/ACI-001.md` |
| ACI-002 | **RECOVERED** | `docs/nebula/aci/ACI-002.md` |
| ACI-003 | **RECOVERED** | `docs/nebula/aci/ACI-003.md` |
| ACI-004 | **RECOVERED** | `docs/nebula/aci/ACI-004.md` |
| ACI-004 amendment | **RECOVERED** | `docs/nebula/aci/ACI-004_amendment.md` |
| ACI-005 | **RECOVERED** | `docs/nebula/aci/ACI-005.md` |
| ACI-006 | **RECOVERED** | `docs/nebula/aci/ACI-006.md` |
| ACI-007 | **ARCHIVED** | `docs/nebula/aci/ACI-007.md` |
| ACI-008 Live AI (prior QEN slice) | **ARCHIVED** | `docs/nebula/aci/ACI-008.md` |
| ACI-008 reconciliation (this slice) | **ARCHIVED** | `docs/nebula/aci/ACI-008_GOVERNANCE_RECONCILIATION.md` |

None of ACI-001–006 are original QEN-packaged files that lived in git before ACI-007. They are labeled recovered. None of ACI-001–007 are **MISSING** as instruction text in this tree.

---

## 2. ACR Archive Status

Inspected: `docs/nebula/acr/`

| ACR | Class | Notes |
| --- | --- | --- |
| ACR-001 | **RECOVERED** | Written in ACI-007 from intake report. No ACR at original completion. |
| ACR-002 | **RECOVERED** | Written in ACI-007 from bootstrap report + `docs/aci/aci-002-evidence/`. |
| ACR-003 | **RECOVERED** | Written in ACI-007 from harvest report. No runtime evidence package. |
| ACR-004 | **RECOVERED** | Written in ACI-007 from vertical-slice report + HTTP/restart evidence. |
| ACR-005 | **RECOVERED** | Written in ACI-007 from goals/analytics report + evidence. Combined git push with ACI-006. |
| ACR-006 | **RECOVERED** | Written in ACI-007 from campaign report + evidence; product commit `f219fce`. |
| ACR-007 | **COMPLETE** | Written at ACI-007 completion with `docs/nebula/artifacts/aci-007-evidence/`. |
| ACR-008 (Live AI) | **COMPLETE** | Written at live-AI completion with `docs/nebula/artifacts/aci-008-evidence/`. File: `ACR-008.md`. |
| ACR-008 (reconciliation) | **COMPLETE** | This slice. File: `ACR-008_RECONCILIATION.md` (does not overwrite Live AI ACR). |

No historical ACR is **MISSING** as a file. ACR-001–006 are not contemporaneous **COMPLETE** acceptances.

Validation evidence cited in recovered ACRs was **not invented** in this slice.

---

## 3. ACI ↔ ACR Traceability Matrix

Canonical copy: [`docs/nebula/TRACEABILITY.md`](docs/nebula/TRACEABILITY.md)

| ACI | ACI Artifact | ACR | Evidence Status | Product Capability/Outcome |
| --- | --- | --- | --- | --- |
| ACI-001 | `ACI-001.md` | ACR-001 | Recovered ACR; intake report + sanitized package | Empty local path; GitHub empty; not connected |
| ACI-002 | `ACI-002.md` | ACR-002 | Recovered ACR; bootstrap report + aci-002 evidence | Hub + SQLite + git |
| ACI-003 | `ACI-003.md` | ACR-003 | Recovered ACR; harvest report only | No Postiz/Mixpost code |
| ACI-004 | `ACI-004.md` | ACR-004 | Recovered ACR; HTTP/restart evidence present | Source → Draft → Review → mock publish |
| ACI-005 | `ACI-005.md` | ACR-005 | Recovered ACR; HTTP/restart evidence; combined remote commit | Goals / manual results / deterministic intel |
| ACI-006 | `ACI-006.md` | ACR-006 | Recovered ACR; HTTP/restart evidence | Campaigns + plan + multi-draft |
| ACI-007 | `ACI-007.md` | ACR-007 | Contemporaneous | Nebula overlay + `deployable` born |
| ACI-008 Live AI | `ACI-008.md` | ACR-008.md | Contemporaneous live proof | Live AI drafts + human review |
| ACI-008 recon | `ACI-008_GOVERNANCE_RECONCILIATION.md` | ACR-008_RECONCILIATION.md | This report | Governance truth only |

**Holes:** original QEN packages; contemporaneous ACR-001–006; Operator Build Guide file; ACI-005 standalone remote commit; dual-008 numbering (documented, not erased).

Every implemented capability above has a governance record. The hole is **quality/timing of records**, not a missing product on a hidden branch.

---

## 4. `deployable` Status

| Item | Value |
| --- | --- |
| Commit (product) | `014835b65333eaea6a3541cef923e39081bd1b65` live AI |
| Commit (this overlay) | reconciliation documentation on `deployable` after `014835b` (no `src/` change) |
| Message | Add source-grounded live AI draft generation so operators can create reviewable posts without leaving ADE. |
| Tracking | `origin/deployable` |

Contains validated ADE through **ACI-007** (included via `acb0f46`) **and** the later live-AI product slice. Ancestor product commits: `96260eb` (bootstrap), `06d2432` (ACI-004), `f219fce` (ACI-005/006), `acb0f46` (ACI-007).

No completed ADE capability exists only on another branch. `feature/aci-007` is behind at `acb0f46` (ACI-007 only). `feature/aci-008` matches `deployable`.

Git history was not rewritten.

---

## 5. `main` vs `deployable`

`main` and `deployable` match. `main` was fast-forwarded only. Neither was force-updated.

Going forward, **validated promotion truth is `deployable`**. `main` is the historical integration line and currently happens to match.

---

## 6. Current Product Capability Baseline

High-level check against **code + README + running health** (not a full revalidation). Localhost `/api/health` at reconciliation time: `ok`, schema **v5**, stage `ACI-008 live AI content generation`, `initialized_at` `2026-08-26T00:24:40.643Z`, `ai.ready=true`.

| Area | Status |
| --- | --- |
| ADE Hub | Implemented (`src/app`, `AppShell`) |
| Sources | Implemented |
| Drafts | Implemented (mock/manual **and** live AI) |
| Review/Approval | Implemented; unapproved cannot queue |
| Publishing Queue | Implemented `PENDING/READY/PUBLISHED/FAILED` |
| Manual/Mock Facebook | Implemented `manual_facebook` |
| Goals | Implemented |
| Results/Metrics | Implemented; manual capture |
| Analytics/Recommendations | Implemented; **deterministic**, not live AI analysis |
| Campaigns | Implemented |
| Campaign content planning | Implemented; deterministic plan |
| Provenance | Implemented (`source_id` on content) |
| Persistence | SQLite `data/ade.sqlite` schema v5 |

Governance and implementation **agreed** after correcting the architecture file’s stale schema **v4** header (code was already v5). README already listed live AI content generation as working.

---

## 7. Architecture/Data-Model Documentation Status

| Record | Status |
| --- | --- |
| `docs/nebula/architecture/current-architecture.md` | Repaired in this slice: authority `014835b`, schema **v5**. Body already described live AI + mock Facebook. |
| `docs/architecture.md` | Historical ACI-002 snapshot; labeled stale. |
| `docs/nebula/data-model/current-data-model.md` | Schema v5; Goal → Campaign → Source → Draft → Approval → Publication → Result. Matches `schema.sql`. |
| `docs/data-model.md` | Operator copy; v5. |
| Hybrid decision | `docs/nebula/architecture/hybrid-postiz-mixpost-decision.md` + ACI-003 report |

---

## 8. Historical Evidence Gaps

**KNOWN HISTORICAL EVIDENCE GAP** — original QEN ACI package files for ACI-001–006 were never stored in this git repository.

**KNOWN HISTORICAL EVIDENCE GAP** — ACR-001–006 were not written at completion; recovered in ACI-007 from reports/evidence that do exist.

**KNOWN HISTORICAL EVIDENCE GAP** — Nebula QEN Operator Build Guide is not a file in this ADE repo.

**KNOWN HISTORICAL EVIDENCE GAP** — ACI-005 has no dedicated remote commit (`f219fce` also contains ACI-006).

**KNOWN HISTORICAL EVIDENCE GAP** — contemporaneous screenshots/logs beyond what is already under `docs/aci/` and `docs/nebula/artifacts/` were not manufactured.

**KNOWN GOVERNANCE COLLISION** — two ACI-008 instructions. Not a missing product; a numbering overlap.

---

## 9. Governance Repairs Performed

- Added `docs/nebula/TRACEABILITY.md`.
- Archived this instruction as `docs/nebula/aci/ACI-008_GOVERNANCE_RECONCILIATION.md` without deleting `ACI-008.md` (Live AI).
- Added `docs/nebula/acr/ACR-008_RECONCILIATION.md` without deleting `ACR-008.md`.
- Added `docs/nebula/passdowns/FORWARD_BASELINE.md`.
- Corrected architecture current-truth header and schema version to match code.
- Updated Nebula indexes/HISTORY/README pointers.
- Did **not** move large existing reports (links already work).
- Did **not** change `src/` or product behavior.

---

## 10. Remaining Governance Limitations

- Recovered ACI/ACR files are not original QEN packages.
- ACR-001–006 remain reconstructed.
- ACR-007 still correctly describes **its** completion-time schema v4; current `deployable` is v5.
- Dual ACI-008 remains in the archive by design.
- Health `stage` string still says “ACI-008 live AI content generation” (product identity in code; not changed here).

---

## 11. Forward Baseline

> **The validated ADE product and governance baseline from which the next product ACI will proceed is `deployable` at last product-code commit `014835b`, with this reconciliation overlay applied.**

That baseline includes Hub, sources, mock and live-AI drafts, review/approval, mock Facebook queue, goals, manual metrics, deterministic intelligence, campaigns/plans, provenance, SQLite v5, and Nebula ACI/ACR records.

See `docs/nebula/passdowns/FORWARD_BASELINE.md`.

---

## 12. Readiness for ACI-009

QEN: next product capability after reconciliation is **Live AI Content Generation**, to be issued as **ACI-009**. This reconciliation did not implement it.

**Readiness:** the capability **already exists** on the forward baseline (prior ACI-008 product slice; `validate:aci008` PASS; ACR-008.md COMPLETE).

ACI-009 should **not** be a greenfield rebuild. If issued, it should confirm the existing path, close a documented limitation (e.g. OpenAI-only provider), or explicitly supersede numbering. Campaign drafts remain mock; live AI **analytics** remain unimplemented.

---

**ACI-008 (reconciliation) status:** Historical evidence is classified; gaps are labeled, not fabricated; `deployable` is the validated product including live AI; records now describe that baseline. Stopped for Social Engine Build QEN review.

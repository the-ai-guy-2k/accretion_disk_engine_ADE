# ADE ACI ↔ ACR traceability

**Reconciled:** 2026-08-26  
**Product code:** ADE MVP baseline `deployable` @ `3c18176` (ACI-011 PAPEV); DGIX workspace ACI-DGIX-012; ACP v1 intake ACI-DGIX-013; execution-ready ACP + Operator authorization ACI-DGIX-014; Facebook connection foundation ACI-DGIX-015 on `deployable`.  
**Rule:** ACI-NNN ↔ ACR-NNN for the MVP series. DGIX uses **ACI-DGIX-NNN ↔ ACR-DGIX-NNN**. A second QEN instruction also used number **008**; both records are kept. ACI-009 is analytics, not a second generation ACI.

Classification of ACI files: **ARCHIVED** (stored at time of the slice) | **RECOVERED** (reconstructed later from CAE chat; not an original QEN package) | **PARTIAL** | **MISSING**.

Classification of ACR files: **COMPLETE** (written at slice completion with contemporaneous evidence) | **RECOVERED** (written later from existing reports; evidence cited is real, ACR itself was not contemporaneous) | **PARTIAL** | **MISSING**.

## ADE MVP: ACI-001 → ACI-011

| ACI | ACI artifact | ACI class | ACR | ACR class | Evidence status | Product capability / outcome |
| --- | --- | --- | --- | --- | --- | --- |
| ACI-001 (search, superseded) | `docs/nebula/aci/ACI-001_superseded_search.md` | RECOVERED | — | — | Completion report exists; no dedicated ACR for the superseded instruction | Machine search superseded; not the locked path |
| ACI-001 | `docs/nebula/aci/ACI-001.md` | RECOVERED | `docs/nebula/acr/ACR-001.md` | RECOVERED | `docs/aci/ADE_ACI_001_CURRENT_STATE_REPORT.md` + sanitized package. **KNOWN HISTORICAL EVIDENCE GAP:** no ACR at the time; empty-folder intake, no runtime | Path locked; local empty; GitHub empty; not connected |
| ACI-002 | `docs/nebula/aci/ACI-002.md` | RECOVERED | `docs/nebula/acr/ACR-002.md` | RECOVERED | Bootstrap report + `docs/aci/aci-002-evidence/`. **GAP:** ACR not contemporaneous | Hub + SQLite foundation; git remote |
| ACI-003 | `docs/nebula/aci/ACI-003.md` | RECOVERED | `docs/nebula/acr/ACR-003.md` | RECOVERED | Harvest report only. **GAP:** no runtime evidence package; ACR not contemporaneous | Postiz/Mixpost code reuse rejected; patterns only |
| ACI-004 | `docs/nebula/aci/ACI-004.md` + `ACI-004_amendment.md` | RECOVERED | `docs/nebula/acr/ACR-004.md` | RECOVERED | Vertical-slice report + `docs/aci/aci-004-evidence/` + `validate:aci004`. **GAP:** ACR not contemporaneous | Source → Draft → Review → Queue → mock Facebook |
| ACI-005 | `docs/nebula/aci/ACI-005.md` | RECOVERED | `docs/nebula/acr/ACR-005.md` | RECOVERED | Goals/analytics report + `docs/aci/aci-005-evidence/` + `validate:aci005`. **GAP:** ACR not contemporaneous; first remote push combined with ACI-006 in `f219fce` | Goals, manual metrics, deterministic recommendation |
| ACI-006 | `docs/nebula/aci/ACI-006.md` | RECOVERED | `docs/nebula/acr/ACR-006.md` | RECOVERED | Campaign report + `docs/aci/aci-006-evidence/` + `validate:aci006`. **GAP:** ACR not contemporaneous | Goal → Campaign → plan → multi-draft → human review |
| ACI-007 | `docs/nebula/aci/ACI-007.md` | ARCHIVED | `docs/nebula/acr/ACR-007.md` | COMPLETE | Alignment report + `docs/nebula/artifacts/aci-007-evidence/` | Nebula tree, `deployable`, recovered ACI/ACR overlay. ACR-007 describes schema **v4** at that time |
| ACI-008 (Live AI, earlier QEN slice) | `docs/nebula/aci/ACI-008.md` | ARCHIVED | `docs/nebula/acr/ACR-008.md` | COMPLETE | Live AI report + `docs/nebula/artifacts/aci-008-evidence/` + `validate:aci008` | Source-grounded live AI drafts; human review preserved |
| ACI-008 (this reconciliation) | `docs/nebula/aci/ACI-008_GOVERNANCE_RECONCILIATION.md` | ARCHIVED | `docs/nebula/acr/ACR-008_RECONCILIATION.md` | COMPLETE | This matrix + `ADE_ACI_008_GOVERNANCE_RECONCILIATION_REPORT.md` | Governance truth; no product change |
| ACI-009 | `docs/nebula/aci/ACI-009.md` | ARCHIVED | `docs/nebula/acr/ACR-009.md` | COMPLETE | Live AI analytics report + `docs/nebula/artifacts/aci-009-evidence/` + `validate:aci009` | Live AI analysis/recommendations on persisted manual metrics; deterministic analytics preserved |
| ACI-010 | `docs/nebula/aci/ACI-010.md` | ARCHIVED | `docs/nebula/acr/ACR-010.md` | COMPLETE | Integration report + `docs/nebula/artifacts/aci-010-evidence/` + `validate:aci010` | MVP journey UX/integration; no new major capability |
| ACI-011 | `docs/nebula/aci/ACI-011.md` | ARCHIVED | `docs/nebula/acr/ACR-011.md` | COMPLETE | PAPEV report + `docs/nebula/artifacts/aci-011-evidence/` + `validate:aci011` | **MVP PASS** — ADE MVP baseline on `deployable` @ `3c18176` |

## DGIX Feature Build: ACI-DGIX-012 → onward

DGIX is **POST-MVP — IN DEVELOPMENT**. It is not a completed product family.

| ACI | ACI artifact | ACI class | ACR | ACR class | Evidence status | Product capability / outcome |
| --- | --- | --- | --- | --- | --- | --- |
| ACI-DGIX-012 | `docs/nebula/aci/ACI-DGIX-012.md` | ARCHIVED | `docs/nebula/acr/ACR-DGIX-012.md` | COMPLETE | Workspace report + `docs/nebula/artifacts/aci-dgix-012-evidence/` + `validate:aci-dgix-012` | DGIX Operator workspace in ADE Hub; engine reused; intake/Facebook/ACRP not implemented at that slice |
| ACI-DGIX-013 | `docs/nebula/aci/ACI-DGIX-013.md` | ARCHIVED | `docs/nebula/acr/ACR-DGIX-013.md` | COMPLETE | Intake report + `docs/nebula/artifacts/aci-dgix-013-evidence/` + `validate:aci-dgix-013` | ACP v1 contract + Operator-controlled intake/review; import is not approval |
| ACI-DGIX-014 | `docs/nebula/aci/ACI-DGIX-014.md` | ARCHIVED | `docs/nebula/acr/ACR-DGIX-014.md` | COMPLETE | Execution-ready ACP report + `docs/nebula/artifacts/aci-dgix-014-evidence/` + `validate:aci-dgix-014` | Execution-ready ACP + Operator authorization; not Facebook execution; no Standard ADE materialization |
| ACI-DGIX-015 | `docs/nebula/aci/ACI-DGIX-015.md` | ARCHIVED | `docs/nebula/acr/ACR-DGIX-015.md` | COMPLETE | Meta connection report + `docs/nebula/artifacts/aci-dgix-015-evidence/` + `validate:aci-dgix-015` | Facebook connection foundation (organic vs paid capability); real Meta validation blocked without credentials; no publishing |

## Holes

1. Original QEN-packaged ACI files (with package IDs/signatures) for ACI-001–006 were never git objects. **KNOWN HISTORICAL EVIDENCE GAP.**
2. ACR-001–006 did not exist at original completion; they are recovered. **KNOWN HISTORICAL EVIDENCE GAP.**
3. QEN Operator Build Guide is not a file in this ADE repository. **KNOWN HISTORICAL EVIDENCE GAP.**
4. ACI-005 has no separate remote commit. **KNOWN HISTORICAL EVIDENCE GAP** (git history only).
5. Two different QEN instructions used ACI-008. Both are archived; neither is deleted.
6. QEN later issued **ACI-009 Live AI Performance Analytics** (this slice). It is **not** a second Live AI Content Generation ACI. Generation remains ACI-008 / ACR-008. Do not treat 009 as a numbering collision with generation.

All listed product capabilities exist on `deployable` (and matching `main`). None exist only on a stray branch.

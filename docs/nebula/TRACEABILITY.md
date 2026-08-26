# ADE ACI ↔ ACR traceability

**Reconciled:** 2026-08-26  
**Product code:** not modified in this reconciliation.  
**Rule:** ACI-NNN ↔ ACR-NNN. A second QEN instruction also used number **008**; both records are kept.

Classification of ACI files: **ARCHIVED** (stored at time of the slice) | **RECOVERED** (reconstructed later from CAE chat; not an original QEN package) | **PARTIAL** | **MISSING**.

Classification of ACR files: **COMPLETE** (written at slice completion with contemporaneous evidence) | **RECOVERED** (written later from existing reports; evidence cited is real, ACR itself was not contemporaneous) | **PARTIAL** | **MISSING**.

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

## Holes

1. Original QEN-packaged ACI files (with package IDs/signatures) for ACI-001–006 were never git objects. **KNOWN HISTORICAL EVIDENCE GAP.**
2. ACR-001–006 did not exist at original completion; they are recovered. **KNOWN HISTORICAL EVIDENCE GAP.**
3. QEN Operator Build Guide is not a file in this ADE repository. **KNOWN HISTORICAL EVIDENCE GAP.**
4. ACI-005 has no separate remote commit. **KNOWN HISTORICAL EVIDENCE GAP** (git history only).
5. Two different QEN instructions used ACI-008. Both are archived; neither is deleted.
6. QEN’s intended next product ACI (**ACI-009 Live AI Content Generation**) is **already implemented** on `deployable` as the earlier ACI-008 product slice. Do not treat it as missing capability.

All listed product capabilities exist on `deployable` (and matching `main`). None exist only on a stray branch.

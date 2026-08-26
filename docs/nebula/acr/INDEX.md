# ACR index

Each ACR corresponds to one ACI. Evidence is taken from repository reports and validation artifacts. Missing historical items are marked; they are not invented.

| ACR | ACI | Status | Evidence |
| --- | --- | --- | --- |
| [ACR-001](ACR-001.md) | ACI-001 | RECOVERED | Empty-path intake report + sanitized evidence package |
| [ACR-002](ACR-002.md) | ACI-002 | RECOVERED | Bootstrap report + localhost health/restart evidence |
| [ACR-003](ACR-003.md) | ACI-003 | RECOVERED | Harvest report; no Postiz/Mixpost code imported |
| [ACR-004](ACR-004.md) | ACI-004 | RECOVERED | Vertical-slice report + HTTP/restart evidence |
| [ACR-005](ACR-005.md) | ACI-005 | RECOVERED | Goals/analytics report + HTTP/restart evidence |
| [ACR-006](ACR-006.md) | ACI-006 | RECOVERED | Campaign report + HTTP/restart evidence; commit `f219fce` |
| [ACR-007](ACR-007.md) | ACI-007 | COMPLETE | Governance alignment; `deployable` established |
| [ACR-008](ACR-008.md) | ACI-008 Live AI | COMPLETE | Live OpenAI content generation; `validate:aci008` PASS |
| [ACR-008_RECONCILIATION](ACR-008_RECONCILIATION.md) | ACI-008 reconciliation | COMPLETE | Traceability matrix; no product change |
| [ACR-009](ACR-009.md) | ACI-009 Live AI analytics | COMPLETE | Live OpenAI analysis/recommendations; `validate:aci009` PASS |
| [ACR-010](ACR-010.md) | ACI-010 MVP integration | COMPLETE | Integrated operator journey; `validate:aci010` PASS |
| [ACR-011](ACR-011.md) | ACI-011 PAPEV | COMPLETE | **MVP PASS**; product baseline `3c18176` |
| [ACR-DGIX-012](ACR-DGIX-012.md) | ACI-DGIX-012 Operator workspace | COMPLETE | DGIX Hub workspace; intake/Facebook/ACRP not implemented |
| [ACR-DGIX-013](ACR-DGIX-013.md) | ACI-DGIX-013 ACP intake | COMPLETE | ACP v1 intake/review; import is not approval |

ACR-001–006 files exist but were **recovered in ACI-007**, not written at original completion. See [TRACEABILITY.md](../TRACEABILITY.md).

Traceability rule: **ACI-NNN ↔ ACR-NNN** for the MVP series. DGIX uses **ACI-DGIX-NNN ↔ ACR-DGIX-NNN**. Two QEN instructions used number 008; both ACR files are retained.

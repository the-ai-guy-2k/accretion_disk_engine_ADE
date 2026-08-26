# ACI archive — recovery status

**Recovered during:** ACI-007  
**Product:** Accretion Disk Engine (ADE)

Standalone QEN ACI package files were **not** stored in the ADE git repository before ACI-007. The instruction texts below were recovered from CAE conversation history (Cursor agent transcript) and labeled as recovered. They were **not** invented.

ACI-001 was issued twice. The second (authoritative-path) instruction superseded the first search instruction.

| ACI | Recovered instruction | Completion evidence in repo | Original QEN package file in repo before ACI-007 |
| --- | --- | --- | --- |
| ACI-001 (search, superseded) | [ACI-001_superseded_search.md](ACI-001_superseded_search.md) | [Current-state report](../../aci/ADE_ACI_001_CURRENT_STATE_REPORT.md) | Missing |
| ACI-001 (authoritative path) | [ACI-001.md](ACI-001.md) | Report + [sanitized package](../../aci/ACI-001_SANITIZED_PACKAGE/PACKAGE_MANIFEST.md) | Missing |
| ACI-002 | [ACI-002.md](ACI-002.md) | [Bootstrap report](../../../ADE_ACI_002_BOOTSTRAP_COMPLETION_REPORT.md) | Missing |
| ACI-003 | [ACI-003.md](ACI-003.md) | [Harvest report](../../../ADE_ACI_003_HYBRID_HARVEST_REPORT.md) | Missing |
| ACI-004 | [ACI-004.md](ACI-004.md) + [amendment](ACI-004_amendment.md) | [Vertical slice report](../../../ADE_ACI_004_VERTICAL_SLICE_COMPLETION_REPORT.md) | Missing |
| ACI-005 | [ACI-005.md](ACI-005.md) | [Goals/analytics report](../../../ADE_ACI_005_GOALS_ANALYTICS_COMPLETION_REPORT.md) | Missing |
| ACI-006 | [ACI-006.md](ACI-006.md) | [Campaign report](../../../ADE_ACI_006_CAMPAIGN_AUTOMATION_COMPLETION_REPORT.md) | Missing |
| ACI-007 | [ACI-007.md](ACI-007.md) | Governance alignment | Stored during ACI-007 |
| ACI-008 (Live AI) | [ACI-008.md](ACI-008.md) | Live AI content generation | Stored during the product slice |
| ACI-008 (reconciliation) | [ACI-008_GOVERNANCE_RECONCILIATION.md](ACI-008_GOVERNANCE_RECONCILIATION.md) | Traceability reconciliation | Stored during reconciliation; does not replace Live AI ACI-008 |
| ACI-009 | [ACI-009.md](ACI-009.md) | Live AI performance analysis/recommendations | Stored during the product slice |
| ACI-010 | [ACI-010.md](ACI-010.md) | MVP integration and UX stabilization | Stored during the product slice |
| ACI-011 | [ACI-011.md](ACI-011.md) | MVP PAPEV and release baseline | Stored during PAPEV; **MVP PASS** |
| ACI-DGIX-012 | [ACI-DGIX-012.md](ACI-DGIX-012.md) | DGIX Operator workspace foundation | Stored during the DGIX slice |
| ACI-DGIX-013 | [ACI-DGIX-013.md](ACI-DGIX-013.md) | ACP v1 contract and intake | Stored during the DGIX slice |
| ACI-DGIX-014 | [ACI-DGIX-014.md](ACI-DGIX-014.md) | Execution-ready ACP and Operator authorization | Stored during the DGIX slice |

**Still missing (not fabricated):**

- QEN Operator Build Guide as a file inside this ADE repository
- Original ACI files with QEN package IDs/signatures other than chat delivery
- Separate ACR records before ACI-007 (created now from existing evidence)

Conversation transcript used for recovery (local CAE log, not a git object):

`agent-transcripts/a7774456-cc7c-4081-8c87-0a3fc37bb58b`

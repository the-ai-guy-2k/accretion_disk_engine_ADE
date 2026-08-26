<!-- AUTHORITATIVE ACI INSTRUCTION FOR THIS SLICE -->
Source: QEN operator instruction as received in CAE chat.
This is a second ACI numbered 008. It does **not** replace the earlier ACI-008 Live AI Content Generation instruction stored as `ACI-008.md`.
Stored during governance reconciliation. Product changes: not authorized.

# ACI-008 — ADE Historical Governance & Traceability Reconciliation
**Product:** Accretion Disk Engine (ADE)
**QEN:** Social Engine Build QEN
**Execution:** AIA / CAE — Local
**Type:** Governance / Traceability Reconciliation
**Product Changes:** NOT AUTHORIZED
## Mission
Establish the authoritative governance and traceability status of completed ADE work before further product development.
This is a **reconciliation ACI**, not a product-build ACI.
Do not recreate historical evidence merely to make the repository appear complete.
## 1. Inspect Historical ACI Archive
Inspect:
`/docs/nebula/aci/`
Determine the actual status of:
* ACI-001
* ACI-002
* ACI-003
* ACI-004
* ACI-005
* ACI-006
* ACI-007
For each classify:
**ARCHIVED | RECOVERED | PARTIAL | MISSING**
Report the actual artifact filename where present.
## 2. Inspect Historical ACR Archive
Inspect:
`/docs/nebula/acr/`
Determine the actual status of:
* ACR-001
* ACR-002
* ACR-003
* ACR-004
* ACR-005
* ACR-006
* ACR-007
For each classify:
**COMPLETE | RECOVERED | PARTIAL | MISSING**
Do not invent validation evidence for historical ACIs.
If evidence was not captured, explicitly record the gap.
## 3. Verify ACI ↔ ACR Traceability
Produce a simple traceability matrix:
**ACI | ACI Artifact | ACR | Evidence Status | Product Capability/Outcome**
Verify whether each completed capability has a corresponding governance record.
Identify holes.
## 4. Verify `deployable`
Determine:
* current `deployable` commit;
* what validated ADE capability it contains;
* whether it contains the validated state through ACI-007;
* relationship between `main` and `deployable`;
* whether any completed ADE capability exists only on another branch.
Do not rewrite Git history.
Do not discard working code.
## 5. Verify Current Product Capability Baseline
Using existing code and documentation, confirm the current implemented ADE baseline at a high level.
At minimum determine the status of:
* ADE Hub;
* Sources;
* Drafts;
* Review/Approval;
* Publishing Queue;
* Manual/Mock Facebook boundary;
* Goals;
* Results/Metrics;
* Analytics/Recommendations;
* Campaigns;
* Campaign content planning;
* provenance;
* persistence.
This is **not a full product revalidation**.
The purpose is to ensure governance records and actual implementation do not materially disagree.
## 6. Identify Historical Evidence Gaps
Report anything from earlier ACIs that cannot now be truthfully reconstructed.
Use:
**KNOWN HISTORICAL EVIDENCE GAP**
where appropriate.
Do not spend substantial cycles trying to manufacture old screenshots, logs, tests, timestamps, or reports.
A documented gap is preferable to fabricated evidence.
## 7. Repair Only Low-Risk Governance Gaps
CAE may repair straightforward repository-governance gaps when the underlying truth is already supported.
Examples:
* place an existing report in the correct Nebula directory;
* correct references;
* add a traceability index;
* document a known evidence gap;
* align architecture/data-model documentation with existing code;
* update governance indexes.
Do not reconstruct unsupported completion claims.
Do not modify ADE product functionality.
## 8. Establish Forward Baseline
Create a clear statement identifying:
> **The validated ADE product and governance baseline from which the next product ACI will proceed.**
The next product capability after this reconciliation is:
**Live AI Content Generation**
That capability will now be issued as **ACI-009**.
Do not implement it during this ACI.
## Required Report
Create:
`ADE_ACI_008_GOVERNANCE_RECONCILIATION_REPORT.md`
## Repository Governance
Execute on:
`feature/aci-008`
After reconciliation:
* archive this ACI as ACI-008;
* create ACR-008 for the reconciliation work itself;
* merge validated governance changes into `deployable`;
* push the remote checkpoint.
## Non-Goals
Do not perform product development during this ACI.
Do not implement Live AI Content Generation in this slice (it is already present on `deployable` from a prior ACI-008 product slice).

# ACR-DGIX-013 — ACI-DGIX-013 acceptance

**ACI:** ACI-DGIX-013 — ADE/DGIX — Campaign Package Contract & Intake  
**Date recorded:** 2026-08-26  
**Status:** COMPLETE  
**Build phase:** POST-MVP — DGIX FEATURE BUILD  
**New ADE MVP capability:** none  
**New DGIX capability:** ACP v1 contract + Operator-controlled intake/review

## Accepted outcome

ACP v1 exists as a documented JSON contract. DGIX can import a valid package, persist it on schema v6 (`dgix_missions` + `dgix_acp_intakes`), and present it for Operator review. Invalid packages are rejected with path-level feedback. Import does not approve content, does not publish, and does not create ADE Goal/Campaign/Source/Draft records.

The TAIG / Facebook / +2 qualified-contact TEST package imports as TEST DATA and is not represented as achieved Facebook results.

Facebook connection, real publishing, metric retrieval, and Results Package export remain **NOT YET IMPLEMENTED**.

## Evidence (in repo)

- `ADE_ACI_DGIX_013_CAMPAIGN_PACKAGE_INTAKE_COMPLETION_REPORT.md`
- `docs/acp/ACP_V1.md`
- `examples/acp/`
- `docs/nebula/artifacts/aci-dgix-013-evidence/`
- `scripts/validate-aci-dgix-013.mjs`
- Instruction: `docs/nebula/aci/ACI-DGIX-013.md`

## Gaps retained for later DGIX ACIs

- No automatic Client QEN connectivity
- No ACP → ADE record materialization
- No Facebook OAuth/publishing/metrics
- No ACRP export

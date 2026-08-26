# ACR-DGIX-014 — ACI-DGIX-014 acceptance

**ACI:** ACI-DGIX-014 — ADE/DGIX — Execution-Ready ACP & Operator Authorization  
**Date recorded:** 2026-08-26  
**Status:** COMPLETE  
**Build phase:** POST-MVP — DGIX FEATURE BUILD  
**New ADE MVP capability:** none  
**New DGIX capability:** execution-ready ACP validation, Operator review of final content, explicit authorize/reject without Facebook execution or Standard ADE materialization

## Accepted outcome

ACP v1 now distinguishes execution data from record/intelligence data. An execution-ready package can be imported, conditionally validated, reviewed as already-prepared content, and explicitly authorized or rejected.

Authorization sets `review_state = authorized` and `execution_status = authorized_platform_not_connected`. DGIX does not call Facebook, does not use the Standard ADE mock publisher as DGIX execution, and does not create Goal, Campaign, Source, or Draft records.

Legacy ACI-DGIX-013 packages without `execution` still import. Their original JSON is preserved. They cannot be authorized until an execution-ready ACP is supplied.

Facebook Account Connection, real Facebook publishing, Facebook metrics retrieval, and Results Package export remain **NOT YET IMPLEMENTED**.

## Evidence (in repo)

- `ADE_ACI_DGIX_014_EXECUTION_READY_ACP_COMPLETION_REPORT.md`
- `docs/acp/ACP_V1.md`
- `docs/acp/ACP_ADAPTER_HANDOFF.md`
- `examples/acp/acp-v1-taig-facebook-contacts.test.json`
- `docs/nebula/artifacts/aci-dgix-014-evidence/`
- `scripts/validate-aci-dgix-014.mjs`
- Instruction: `docs/nebula/aci/ACI-DGIX-014.md`

## Gaps retained for later DGIX ACIs

- No Platform Resolver / Facebook account connection
- No Meta API publishing or metrics
- No ACRP export
- No ACP → Standard ADE materialization (intentionally never automatic in this model)
- No authentication system for Operator identity (`decision_by` is a local label)

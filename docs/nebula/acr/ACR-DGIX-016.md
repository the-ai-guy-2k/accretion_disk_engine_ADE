# ACR-DGIX-016 — ACI-DGIX-016 acceptance

**ACI:** ACI-DGIX-016 — ADE/DGIX — Facebook Organic Execution Adapter  
**Date recorded:** 2026-08-26  
**Status:** COMPLETE (implementation + blocked real Facebook publish validation)  
**Build phase:** POST-MVP — DGIX FEATURE BUILD  
**New ADE MVP capability:** none  
**New DGIX capability:** bounded organic Facebook Page execution for authorized ACPs

## Accepted outcome

DGIX routes `platform = facebook` + `distribution_type = organic` to the Facebook Organic Adapter. Only an AUTHORIZED execution-ready ACP may execute. The adapter maps ACP `message` (and optional `link`) onto Graph API **v26.0** `POST /{page-id}/feed` without rewriting copy. Execution attempts are persisted without tokens. EXECUTED requires a Meta object id. Duplicate successful publishes are blocked. Paid ACPs are refused by the organic adapter.

Authorization remains a separate event from execution. The Standard ADE mock Facebook adapter is not used.

## Real Facebook publishing validation

This execution environment did not supply TAIG Meta credentials/assets for a live Page post. CAE did not invent Page IDs or fabricate EXECUTED.

**REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED**

This is not a mock PASS of a live Facebook publish.

## Evidence (in repo)

- `ADE_ACI_DGIX_016_FACEBOOK_ORGANIC_EXECUTION_COMPLETION_REPORT.md`
- `docs/dgix/FACEBOOK_ORGANIC_EXECUTION.md`
- `docs/dgix/FACEBOOK_CONNECTION.md`
- `scripts/validate-aci-dgix-016.mjs`
- `docs/nebula/artifacts/aci-dgix-016-evidence/`
- Instruction: `docs/nebula/aci/ACI-DGIX-016.md`

## Gaps retained for later DGIX ACIs

- Real Page publish against live TAIG Meta credentials/assets
- Image/photo upload
- Paid advertising execution (Campaign → Ad Set → Creative → Ad)
- Facebook metrics retrieval
- Results Package export

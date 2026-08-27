# ACR-DGIX-017 — ACI-DGIX-017 acceptance

**ACI:** ACI-DGIX-017 — ADE/DGIX — Real TAIG Facebook Connection & Organic Publish Validation  
**Date recorded:** 2026-08-27  
**Status:** BLOCKED — OPERATOR ACTION REQUIRED  
**Build phase:** POST-MVP — DGIX FEATURE BUILD  
**New ADE MVP capability:** none  
**New DGIX capability:** none (this ACI validates existing organic execution)

## Accepted outcome

**Not accepted as PASS.** Real TAIG Facebook connection and organic publish validation could not be performed.

This CAE run found:

- `.env.local` **absent**
- `ADE_DGIX_FB_CLIENT_ID` **UNSET**
- `FACEBOOK_PAGE_ID` / `ADE_DGIX_FB_PAGE_ID` **UNSET**
- `META_PAGE_ACCESS_TOKEN` / `ADE_DGIX_FB_PAGE_ACCESS_TOKEN` **UNSET**
- `META_APP_ID` **UNSET**
- `META_APP_SECRET` **UNSET**

CAE did not invent Page IDs, tokens, or a Facebook object id. CAE did not call Meta, did not auto-authorize, did not auto-publish, and did not change Real Facebook Publishing from **IMPLEMENTED BUT REAL VALIDATION PENDING**.

**REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED**

## Operator action required

Configure the existing ACI-DGIX-015 server-side connection in `.env.local` (copy from `.env.example`; never commit secrets):

| Variable | Purpose |
| --- | --- |
| `ADE_DGIX_FB_CLIENT_ID` | Must be `TAIG` |
| `FACEBOOK_PAGE_ID` or `ADE_DGIX_FB_PAGE_ID` | Real TAIG Facebook Page id |
| `META_PAGE_ACCESS_TOKEN` or `ADE_DGIX_FB_PAGE_ACCESS_TOKEN` | ADE-held Page token that Meta will accept for organic Page operations |

Optional for token introspection: `META_APP_ID`, `META_APP_SECRET`.

Obtain Page id and a Page access token from the TAIG Meta/Facebook Business assets (Meta Business Suite / Meta Developer App with Page permissions sufficient for Page feed publishing). Then re-authorize this ACI.

## Evidence (in repo)

- `ADE_ACI_DGIX_017_REAL_FACEBOOK_VALIDATION_COMPLETION_REPORT.md`
- Instruction: `docs/nebula/aci/ACI-DGIX-017.md`

No live Meta object/post id exists for this ACI. That absence is the evidence.

## Product truth retained

Real Facebook Publishing remains **IMPLEMENTED BUT REAL VALIDATION PENDING**. Paid advertising was not executed. ACI-DGIX-018 was not started.

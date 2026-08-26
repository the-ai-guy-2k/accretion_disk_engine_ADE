# ADE Campaign Package (ACP) v1

**Status:** execution-ready intake, validation, Operator review, and Operator authorization (ACI-DGIX-014)  
**DGIX:** POST-MVP — IN DEVELOPMENT  
**Not included:** Facebook account connection, Meta API publishing, Facebook metrics, ACRP export, automatic Client QEN connectivity, ACP → Standard ADE materialization

## Execution-ready ACP

An execution-ready ACP is the Client QEN's **final prepared campaign artifact**. DGIX does not regenerate, rewrite, reinterpret, or reconstruct it before execution.

```text
Client QEN thinks/prepares
        ↓
Execution-Ready ACP
        ↓
DGIX validates
        ↓
Operator reviews exactly what will be sent
        ↓
Operator authorizes or rejects
        ↓
Platform resolver (future)
        ↓
Platform adapter / API (future)
        ↓
DGIX measures (future)
        ↓
Client QEN learns (future)
```

KISS responsibility:

| Actor | Does | Does not |
| --- | --- | --- |
| **Client QEN** | Understands the client/business; develops campaign intelligence; prepares final post content; defines objective and measurement intent; produces the execution-ready ACP | Execute on the platform |
| **Operator** | Reviews exactly what will be executed; authorizes or rejects | Regenerate the post |
| **DGIX** | Validates; preserves records/provenance; later resolves the configured platform connection; maps approved execution data to an adapter; later executes, measures, and returns results | Invent content; reconstruct the campaign as Standard ADE Goal/Campaign/Source/Draft |
| **Platform API** | Performs external platform operations | Live in this ACI |

Import is **not** approval. Authorization is **not** execution. ADE does not create Goal, Campaign, Source, or Draft records from an ACP.

## Two data groups

### A. Execution data (`execution`)

What DGIX needs to construct a future platform request. Required fields depend on the intended operation. This is **not** a proven Meta Graph contract.

| Field | Text post | Image post | Scheduled |
| --- | --- | --- | --- |
| `clientId` | required | required | required |
| `platform` | required | required | required |
| `postType` (`text` \| `image`) | required | required | required |
| `message` (final publish-ready caption) | required | required as applicable | required |
| `mediaReference` (`{ kind, value }` or string) | optional | required | as required by post type |
| `link` | optional | optional | optional |
| `callToAction` | optional | optional | optional |
| `publishMode` (`now` \| `scheduled`) | required | required | required |
| `scheduledAt` (ISO-8601) | no | no | required |
| `distributionType` (`organic` \| `paid`) | no — default `organic` | no — default `organic` | no — default `organic` |

`clientId` + `platform` are logical identifiers (example: `TAIG` + `facebook`). ACP must not carry Facebook tokens, Meta app secrets, API credentials, passwords, or AI credentials. DGIX later resolves the ADE-held connection.

Supported `postType` values are ADE's current execution-ready set. They are not claimed as Meta Graph object types.

### B. Record / intelligence data

Used for records, attribution, measurement intent, and exchange. Not used to rebuild a Standard ADE campaign before execution.

| Field | Required |
| --- | --- |
| `acpVersion` | yes — `"1"` (integer `1` also accepted) |
| `packageId` | yes |
| `originatingSystem` | yes |
| `clientBusinessId` | yes |
| `campaignName` | yes |
| `createdAt` | yes — ISO-8601 |
| `isTest` | no — boolean if present |
| `objective.statement` | yes |
| `objective.measurementTarget.metric` | yes |
| `objective.measurementTarget.targetValue` | yes — JSON number |
| `objective.measurementTarget.startingValue` | no |
| `objective.measurementTarget.unit` | no |
| `objective.intendedPlatforms` | yes — list of platform names |
| `audience.description` | yes |
| `content.posts[]` | yes — at least one object with `body` |
| `content.posts[].title` | no |
| `content.posts[].callToAction` | no |
| `content.posts[].mediaReferences` | no |
| `provenance.originatingIntelligenceSource` | yes |
| `provenance.sourceEvidence[]` | yes — at least one `title` or `reference` |
| `executionIntent.approvalRequirements` | yes |
| `executionIntent.timingPreference` | no |
| `executionIntent.restrictions` | no |
| `measurementIntent.signals` | yes |
| `measurementIntent.notes` | no |
| `execution` | no for **legacy** ACI-DGIX-013 records; **required to authorize** |

Unknown non-secret fields are stored in `raw_json`. ADE does not silently repair missing structure.

## Conditional validation

Not every ACP field is mandatory for every operation. The validator expresses requirements from the intended `execution` operation:

- Text + `publishMode: now` → client, platform, post type, message, publish mode
- Image → plus `mediaReference`
- Scheduled → plus `scheduledAt`

Packages **without** `execution` remain valid ACP v1 **legacy** intakes (ACI-DGIX-013). They can be imported and reviewed. They cannot be authorized.

## Authorization states

| State | Meaning |
| --- | --- |
| `imported` | Accepted and stored. Not reviewed as a decision. |
| `ready_for_decision` | Operator marked reviewed. Still not authorized. |
| `authorized` | Operator authorized DGIX to execute later through a configured adapter. |
| `rejected` | Operator rejected the package. |

On schema v7, older values are remapped: `pending_operator_review` → `imported`, `operator_reviewed` → `ready_for_decision`, `declined` → `rejected`. Original JSON is not rewritten.

Authorization means: the Operator authorizes DGIX to execute this package through its configured platform adapter **when that capability exists**. Authorization does not publish.

After authorize, the truthful status for an organic Facebook ACP is **AUTHORIZED — READY FOR FACEBOOK EXECUTION** (`execution_status = ready_for_facebook_execution`). Publishing requires a separate Operator execute action, a valid organic Facebook connection, and a Meta object id. DGIX does not use the Standard ADE mock Facebook adapter as DGIX execution.

## Credential boundary

ACP identifies the client/business and target platform logically:

```text
ACP:  client_id = TAIG, platform = facebook
DGIX: resolve the configured TAIG Facebook connection
      obtain ADE-held identifiers/credentials (never from the artifact)
      facebook + organic → Facebook Organic Adapter → Meta Graph Page feed
```

Rejected credential-like keys include `access_token`, `page_access_token`, `api_key`, `password`, `client_secret`, `app_secret`, `ade_ai_api_key`, `openai_api_key`, `meta_app_secret`, and similar.

Adapter handoff for an authorized package is documented in [`ACP_ADAPTER_HANDOFF.md`](ACP_ADAPTER_HANDOFF.md). It contains execution fields plus package identity. It does not contain secrets.

## Standard ADE vs DGIX

| | Standard ADE | DGIX |
| --- | --- | --- |
| Who prepares content | Operator in Hub (Goal → Campaign → Source → Draft) | Client QEN via ACP |
| Who authorizes | ADE Review (`/review`) | DGIX Operator Authorization |
| Execution | Mock Facebook adapter (Channel 01) | Organic Facebook adapter for authorized Page text posts; paid ads not implemented |
| ACP import/authorize | Does not create Goal, Campaign, Source, or Draft | Execution does not depend on reconstructing ACP inside Standard ADE |

ACP campaign/objective fields are retained for records, attribution, measurement, and intelligence exchange.

## Representation

Machine-readable JSON. Example: [`examples/acp/acp-v1-taig-facebook-contacts.test.json`](../../examples/acp/acp-v1-taig-facebook-contacts.test.json)

Invalid example: [`examples/acp/acp-v1-invalid-missing-objective.json`](../../examples/acp/acp-v1-invalid-missing-objective.json)

## Provenance

Stored on `dgix_acp_intakes` (schema v7):

- package ID, ACP version, originating system, client/business ID, campaign identity
- package `createdAt` vs ADE `imported_at`
- original JSON (`raw_json` — not rewritten on schema evolution)
- Operator decision (`review_state`, `decision_at`, `decision_by`; default actor `local-operator`)
- `execution_authorized`, `execution_status`, `acp_profile` (`legacy` \| `execution_ready`)
- `materialized` stays 0

No authentication system was added. The decision actor is a recorded label, not a login.

## Duplicate packages

Duplicate `packageId` after a successful import is refused (409).

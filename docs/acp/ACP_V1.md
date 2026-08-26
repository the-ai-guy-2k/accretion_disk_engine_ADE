# ADE Campaign Package (ACP) v1

**Status:** implemented for DGIX intake/review (ACI-DGIX-013)  
**DGIX:** POST-MVP — IN DEVELOPMENT  
**Not included:** Facebook auth/publishing/metrics, ACRP export, automatic Client QEN connectivity

## Purpose

An ADE Campaign Package is a **generic, versioned JSON artifact** that carries structured campaign/business intelligence into ADE.

First intended producer: a Client QEN. Other authorized systems or a human-authored file may also produce a valid ACP.

```text
Producer (Client QEN or other)
        ↓
ADE Campaign Package (ACP v1 JSON)
        ↓
DGIX Intake (Operator-controlled)
        ↓
Operator Review
        ↓
Human Approval (existing ADE Review — not this ACI)
        ↓
future execution
```

Import is **not** approval and **not** publishing. ADE does not silently create Goal, Campaign, Source, or Draft records from an imported ACP.

## Representation

Machine-readable JSON. Example: [`examples/acp/acp-v1-taig-facebook-contacts.test.json`](../../examples/acp/acp-v1-taig-facebook-contacts.test.json)

Invalid example used in validation: [`examples/acp/acp-v1-invalid-missing-objective.json`](../../examples/acp/acp-v1-invalid-missing-objective.json)

## Required vs optional

| Field | Required |
| --- | --- |
| `acpVersion` | yes — `"1"` (integer `1` also accepted, not rewritten) |
| `packageId` | yes |
| `originatingSystem` | yes |
| `clientBusinessId` | yes |
| `campaignName` | yes |
| `createdAt` | yes — ISO-8601 date or timestamp |
| `isTest` | no — boolean if present |
| `objective.statement` | yes |
| `objective.measurementTarget.metric` | yes |
| `objective.measurementTarget.targetValue` | yes — JSON number |
| `objective.measurementTarget.startingValue` | no — JSON number |
| `objective.measurementTarget.unit` | no |
| `objective.intendedPlatforms` | yes — non-empty list of platform names (not Facebook-specific schema) |
| `audience.description` | yes |
| `content.posts[]` | yes — at least one object with `body` |
| `content.posts[].title` | no |
| `content.posts[].callToAction` | no |
| `content.posts[].mediaReferences` | no — `{ kind, value }` or a description string |
| `provenance.originatingIntelligenceSource` | yes |
| `provenance.sourceEvidence[]` | yes — at least one item with `title` or `reference` |
| `executionIntent.approvalRequirements` | yes |
| `executionIntent.timingPreference` | no |
| `executionIntent.restrictions` | no — list of text |
| `measurementIntent.signals` | yes — non-empty list |
| `measurementIntent.notes` | no |

Unknown non-secret fields are allowed for future extension and are stored in `raw_json`. ADE does not silently repair missing required structure (for example a lone `content.body` is not turned into `content.posts`).

## Validation behavior

Rejected with operator-facing `{ path, message }` issues:

- unsupported `acpVersion`
- missing campaign identity (`packageId`, `campaignName`, `clientBusinessId`)
- missing objective / statement
- measurement target that is not an object with numeric `targetValue`
- platforms not a list of text
- malformed content payload
- missing provenance / source evidence
- known credential field names (`access_token`, `api_key`, `password`, `client_secret`, …)

Duplicate `packageId` after a successful import is refused (409).

## Provenance

Stored on `dgix_acp_intakes`:

- which ACP (`package_id`, `acp_version`)
- originating system / business identifier
- package `createdAt` vs ADE `imported_at`
- original JSON (`raw_json`)
- review state; `execution_authorized` stays 0; `materialized` stays 0

External artifact content is labeled as imported, not as internally generated ADE evidence.

## Security boundary

ACP must not carry Facebook tokens, API keys, AI-provider credentials, or passwords. Those belong to ADE's future secured integration layer.

## Relationship to existing ADE entities

| ACP | ADE concept | On import |
| --- | --- | --- |
| Objective | Goal | not created |
| Campaign | Campaign | not created |
| Source evidence | Source / Provenance | not created |
| Proposed content | Draft | not created; later human approval still required |

A `dgix_missions` row holds the intake/review state only. `goal_id` and `campaign_id` remain null in this ACI.

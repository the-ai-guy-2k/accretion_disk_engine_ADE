# ACP → platform adapter handoff (future)

**ACI:** ACI-DGIX-014 documents this boundary. It does **not** implement Meta API, Facebook OAuth, or a live adapter.

```text
AUTHORIZED ACP
        ↓
Platform Resolver   (clientId + platform → ADE-held connection)
        ↓
Facebook Adapter
        ↓
Meta API
```

## What the future adapter receives

From an **authorized**, **execution-ready** ACP, DGIX can supply:

| Field | Source | Notes |
| --- | --- | --- |
| `clientId` | `execution.clientId` | Logical business identifier (example: `TAIG`) |
| `platform` | `execution.platform` | Logical platform (example: `facebook`) |
| `postType` | `execution.postType` | Currently `text` or `image`. Not a proven Meta Graph type. |
| `message` | `execution.message` | Final publish-ready caption. Do not regenerate. |
| `mediaReference` | `execution.mediaReference` | Required for image posts. Kind + value; not a uploaded binary in this ACI. |
| `link` | `execution.link` | Optional |
| `callToAction` | `execution.callToAction` | Optional |
| `publishMode` | `execution.publishMode` | `now` or `scheduled` |
| `scheduledAt` | `execution.scheduledAt` | Required when scheduled |
| `packageId` | ACP identity | Provenance |
| `campaignName` | ACP identity | Record/intelligence only |
| `isTest` | ACP flag | Test data must stay labeled |

Runtime code: `adapterHandoff()` in `src/lib/acp-validate.ts`. The Operator review page shows this object as **not sent**.

## What the adapter must obtain from ADE, not from ACP

- Facebook / Meta access tokens
- App secret
- Page IDs or other ADE-held platform identifiers
- AI credentials
- Passwords

Resolver concept: `TAIG` + `facebook` → configured TAIG Facebook connection → credentials held by ADE.

## What this handoff is not

- Not a successful Facebook post
- Not a call to the existing Standard ADE mock Facebook adapter
- Not a claim that the Meta-specific request body is finalized

Recommended next slice: **ACI-DGIX-015** — Platform Resolver and Facebook account connection, still without pretending real publishing has occurred until a later publishing ACI.

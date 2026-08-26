# ACP → platform adapter handoff

**ACI-DGIX-014** defined the ACP payload. **ACI-DGIX-015** adds the Platform Resolver and connection layer. Neither slice publishes.

```text
AUTHORIZED ACP
        ↓
Platform Resolver   (clientId + platform → ADE-held Facebook connection)
        ↓
  distributionType = organic → facebook_organic_page
  distributionType = paid    → facebook_paid_marketing
        ↓
Meta Graph / Marketing API   (not executed in ACI-DGIX-015)
```

Graph API version: **v26.0**. Details: [`docs/dgix/FACEBOOK_CONNECTION.md`](../dgix/FACEBOOK_CONNECTION.md)

## What the future adapter receives from ACP

| Field | Source | Notes |
| --- | --- | --- |
| `clientId` | `execution.clientId` | Logical business identifier (example: `TAIG`) |
| `platform` | `execution.platform` | Logical platform (example: `facebook`) |
| `distributionType` | `execution.distributionType` | `organic` (default) or `paid` |
| `postType` | `execution.postType` | Currently `text` or `image`. Not a proven Meta Graph type. |
| `message` | `execution.message` | Final publish-ready caption. Do not regenerate. |
| `mediaReference` | `execution.mediaReference` | Required for image posts |
| `link` / `callToAction` | execution | Optional |
| `publishMode` / `scheduledAt` | execution | `now` or `scheduled` |
| `packageId` / `campaignName` / `isTest` | ACP identity | Provenance / records |

Runtime: `adapterHandoff()` plus `routeAuthorizedAcp()`. `executed` remains false until a later publishing ACI.

## What DGIX supplies from the connection (not from ACP)

- Page identity and ADE-held Page authorization (organic)
- Ad Account identity and advertising authorization when configured (paid)
- Graph API version
- Adapter selection

Tokens never leave the server configuration.

## Organic next step

Authorized ACP + resolved Facebook Page connection → Page publishing operation (future ACI).

## Paid next step

The paid adapter must translate the ACP into Marketing API objects:

Campaign → Ad Set → Creative → Ad

Not implemented in ACI-DGIX-015.

# ACP → platform adapter handoff

**ACI-DGIX-014** defined the ACP payload. **ACI-DGIX-015** added the Platform Resolver and connection layer. **ACI-DGIX-016** executes authorized **organic** Facebook Page posts. Paid advertising remains unimplemented.

```text
AUTHORIZED ACP
        ↓
Platform Resolver   (clientId + platform → ADE-held Facebook connection)
        ↓
  distributionType = organic → facebook_organic_page → POST /{page-id}/feed
  distributionType = paid    → facebook_paid_marketing (refused; not implemented)
```

Graph API version: **v26.0**. Connection: [`docs/dgix/FACEBOOK_CONNECTION.md`](../dgix/FACEBOOK_CONNECTION.md). Organic adapter: [`docs/dgix/FACEBOOK_ORGANIC_EXECUTION.md`](../dgix/FACEBOOK_ORGANIC_EXECUTION.md).

## What the organic adapter receives from ACP

| Field | Source | Notes |
| --- | --- | --- |
| `clientId` | `execution.clientId` | Logical business identifier (example: `TAIG`) |
| `platform` | `execution.platform` | Logical platform (example: `facebook`) |
| `distributionType` | `execution.distributionType` | `organic` (default) or `paid` |
| `postType` | `execution.postType` | `text` → Page feed; `image` refused in this adapter |
| `message` | `execution.message` | Final publish-ready caption. Do not regenerate. |
| `mediaReference` | `execution.mediaReference` | Required for image posts at ACP intake; not uploaded here |
| `link` / `callToAction` | execution | `link` may map to Meta `link`; CTA text is not a Graph CTA type |
| `publishMode` / `scheduledAt` | execution | `now` or scheduled unpublished feed post |
| `packageId` / `campaignName` / `isTest` | ACP identity | Provenance / records |

Runtime: `adapterHandoff()` plus `routeAuthorizedAcp()`. `executed` on the handoff object remains a contract flag; actual success is `dgix_executions.status = succeeded` plus a Meta object id.

## What DGIX supplies from the connection (not from ACP)

- Page identity and ADE-held Page authorization (organic)
- Ad Account identity and advertising authorization when configured (paid)
- Graph API version
- Adapter selection

Tokens never leave the server configuration.

## Organic execution

Authorized ACP + resolved Facebook Page connection + explicit Operator execute → `POST /v26.0/{page-id}/feed`. Success requires Meta `id`. Duplicate successful publishes are blocked.

## Paid next step

The paid adapter must translate the ACP into Marketing API objects:

Campaign → Ad Set → Creative → Ad

Not implemented. The organic adapter refuses `distributionType = paid`.

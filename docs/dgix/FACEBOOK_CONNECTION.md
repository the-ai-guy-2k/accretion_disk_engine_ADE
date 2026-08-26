# DGIX Facebook / Meta connection (ACI-DGIX-015)

Implementation-specific Meta details for the DGIX adapter/connection layer. These are not DGIX business concepts. ACP remains the business/execution contract.

**Graph API version:** `v26.0` (`META_GRAPH_API_VERSION`, default `v26.0`)  
**Host:** `https://graph.facebook.com/v26.0/...`  
Unversioned Graph paths are not used.

## Architecture

```text
AUTHORIZED ACP
  clientId + platform + distribution_type
        ↓
Platform resolver (ADE-held config, not ACP)
        ↓
  distribution_type = organic → facebook_organic_page  (Page feed text post; ACI-DGIX-016)
  distribution_type = paid    → facebook_paid_marketing (not executed; organic adapter refuses)
```

One DGIX, one ACP format. `platform = facebook` plus `execution.distributionType` (`organic` | `paid`, default `organic`) selects the future Meta operation family.

## Organic family

DGIX → Facebook Page connection → Graph API Page operations (organic feed post in ACI-DGIX-016).

Required to validate organic capability:

- logical client `ADE_DGIX_FB_CLIENT_ID`
- Page ID (`FACEBOOK_PAGE_ID` or `ADE_DGIX_FB_PAGE_ID`)
- Page access token (`META_PAGE_ACCESS_TOKEN` or `ADE_DGIX_FB_PAGE_ACCESS_TOKEN`)

Validation GET: `/{page-id}?fields=id,name`  
Optional token check: `/debug_token` using `META_APP_ID` + `META_APP_SECRET` (app token). Tokens are never returned to the browser.

## Paid family

DGIX → Meta advertising connection → Marketing API hierarchy (future):

Ad Account → Campaign → Ad Set → Ad Creative → Ad  
Insights remain a later measurement ACI.

Required to validate paid capability (independent of organic):

- `META_AD_ACCOUNT_ID` (with or without `act_` prefix)
- advertising authorization (`META_AD_ACCESS_TOKEN`, or the Page token if that is all that is configured)

Validation GET: `/act_{ad-account-id}?fields=id,name,account_status`

This ACI does **not** create Campaign, Ad Set, Creative, or Ad objects and does not spend.

## Credential boundary

| Location | Tokens / app secret |
| --- | --- |
| ACP JSON | rejected |
| Browser / API JSON | not included |
| `dgix_platform_connections` | identity/status only |
| Git | `.env.example` names only |

Configure via `.env.local` (copy `.env.example`). Restart ADE after changing values.

## Operator status

| Facebook | Organic | Paid |
| --- | --- | --- |
| CONNECTED / NOT CONNECTED / INVALID | AVAILABLE / NOT AVAILABLE | AVAILABLE / NOT AVAILABLE |

CONNECTED requires a successful live Meta identity call. Missing credentials are reported as:

`REAL CONNECTION VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED`

Absence of an Ad Account does not invalidate a valid organic Page connection. A Page-only connection is not automatically paid-capable.

Connection capability ≠ automatic execution. Organic Facebook Page publishing is implemented in ACI-DGIX-016 when Organic Page Operations are AVAILABLE and the Operator takes a separate execute action. Paid Advertising Execution remains not implemented.

## Failures

Operator-facing codes (no credentials in the message):

- missing connection configuration
- invalid/expired authorization
- inaccessible Page
- inaccessible Ad Account
- insufficient capability/permission
- Meta API error
- network/API failure

Failures never set an ACP to executed.

## Organic execution (ACI-DGIX-016)

See [`FACEBOOK_ORGANIC_EXECUTION.md`](FACEBOOK_ORGANIC_EXECUTION.md). Authorized organic Facebook ACPs can POST `/{page-id}/feed` on Graph **v26.0**. Connection validation still does not publish.

## Paid handoff

Authorized ACP remains the business contract. The paid adapter must translate it into Campaign → Ad Set → Creative → Ad. Not implemented here. The organic adapter refuses paid ACPs.

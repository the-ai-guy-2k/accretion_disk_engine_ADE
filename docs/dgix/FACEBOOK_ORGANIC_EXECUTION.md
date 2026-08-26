# DGIX Facebook organic execution (ACI-DGIX-016)

Bounded organic publishing path. ACP remains the business/execution contract. Meta-specific details stay in this adapter layer.

```text
CLIENT QEN
  → prepares execution-ready ACP
OPERATOR
  → reviews and authorizes (does not publish)
DGIX
  → resolves Facebook connection (ACI-DGIX-015)
  → routes facebook + organic → Facebook Organic Adapter
  → translates ACP fields deterministically
  → POST Graph API
META
  → creates the Page object
```

Execution never bypasses Operator authorization. Authorization never publishes by itself.

## Router

| ACP | Adapter |
| --- | --- |
| `platform = facebook` AND `distribution_type = organic` | `facebook_organic_page` |
| `platform = facebook` AND `distribution_type = paid` | `facebook_paid_marketing` — **refused** by the organic adapter. Paid Advertising Execution is NOT YET IMPLEMENTED. |

Paid ACPs are recognized and explicitly refused. They are not silently treated as organic.

## Graph API contract

**Version:** `v26.0` (same default as the connection layer; `META_GRAPH_API_VERSION` may override, still versioned).

**Minimum proving operation:** Facebook Page **text/message feed post**.

```text
POST https://graph.facebook.com/v26.0/{page-id}/feed
Content-Type: application/x-www-form-urlencoded

message=<ACP execution.message, unmodified>
link=<ACP execution.link when it is an http(s) URL>
access_token=<ADE-held Page token, never logged or stored in execution records>
```

Success requires Meta to return a non-empty `id` (typically `{page-id}_{post-id}`). An HTTP attempt without that id is **EXECUTION FAILED**, not EXECUTED.

Optional scheduled mapping (not the proving path): `published=false` plus `scheduled_publish_time` as unix seconds from `execution.scheduledAt`.

Image `postType` is refused. This adapter does not upload binary media or guess a photos endpoint.

## ACP → Meta mapping (deterministic, not AI)

| ACP | Meta / adapter |
| --- | --- |
| `execution.clientId` | DGIX connection resolver |
| `execution.platform` | Facebook organic adapter when `facebook` |
| `execution.distributionType` | organic operation family, or paid refusal |
| `execution.postType` | text → Page feed post; image → refused |
| `execution.message` | `message` (verbatim) |
| `execution.link` | `link` when it is an http(s) URL |
| `execution.publishMode` / `scheduledAt` | immediate feed post, or unpublished scheduled feed post |
| `execution.callToAction` | not sent as a Meta CTA object (free text is not a Graph CTA type) |
| `execution.mediaReference` | ignored for text posts; not treated as a file |

DGIX does not rewrite or regenerate ACP content.

## Authorization requirement

Only `review_state = authorized` may execute.

Refused:

- imported ACP
- reviewed but unauthorized ACP
- rejected ACP
- structurally invalid / non-execution-ready ACP
- paid ACP routed to organic execution

Import is not approval. Authorization is not execution.

## Connection requirement

Reuse ACI-DGIX-015. Before the adapter POSTs, DGIX resolves `clientId` + `platform=facebook` and requires Organic Page Operations **AVAILABLE** (configured Page id + Page access token).

If that capability is missing, DGIX **stops**, does not simulate a post, and returns:

`REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED`

## Execution state

`review_state` stays `authorized` after execute so authorization remains a separate event.

| `execution_status` | Operator label |
| --- | --- |
| `ready_for_facebook_execution` | AUTHORIZED — READY FOR FACEBOOK EXECUTION |
| `execution_attempted` | EXECUTION ATTEMPTED |
| `executed` | EXECUTED (Meta returned an object/post id) |
| `execution_failed` | EXECUTION FAILED |

EXECUTED is never recorded merely because HTTP was attempted.

## Duplicate protection

A succeeded execution for an intake cannot be repeated by an ordinary second button/API request (409). SQLite enforces at most one `status = succeeded` row per intake.

Retry is explicit after **EXECUTION FAILED** (the Operator uses Retry Facebook execution).

## Persistence

Table `dgix_executions` (schema **v9**). Records ACP id, client, platform, distribution type, adapter, Graph operation/version, Page id, timestamps, status, external object id, sanitized error.

Never persisted: Page access tokens, app secrets, advertising tokens.

## Failure handling

| Case | Result |
| --- | --- |
| No Facebook connection / organic unavailable | Stop. BLOCKED. Not EXECUTED. No success row. |
| Unauthorized / rejected / imported | 409. Not EXECUTED. |
| Paid distribution | 409 capability message. Not EXECUTED. |
| Malformed execution / unsupported image post | 400. Not EXECUTED. |
| Meta auth / permission / validation / network | Attempt row → failed. `execution_failed`. |
| Duplicate success | 409. No second post. |

## Security

Credentials remain server-side. Tokens are sent only in the Graph POST body, never in ACP, browser JSON, logs, execution records, or screenshots.

## Real-validation status

If TAIG Meta credentials/assets are unavailable, adapter/router/state are still tested, and real publishing is reported:

**REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED**

Do not treat that as a mocked PASS of a live Page post.

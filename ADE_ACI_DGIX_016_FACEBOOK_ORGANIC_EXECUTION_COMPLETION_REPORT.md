# ADE ACI-DGIX-016 — Facebook Organic Execution Adapter completion report

**Product:** Accretion Disk Engine (ADE)  
**Feature family:** Distribution, Growth & Intelligence Exchange (DGIX)  
**Build phase:** POST-MVP — DGIX FEATURE BUILD  
**ACI:** ACI-DGIX-016  
**Baseline:** `deployable` / `main` @ `227da75`  
**Feature branch:** `feature/dgix/aci-dgix-016-facebook-organic-execution`  
**Date:** 2026-08-26  
**New ADE MVP capability:** NO  
**New DGIX capability:** YES

This report is the required return to the Social Engine Build QEN. ACI-DGIX-017 was not started.

---

## 1. Implementation Summary

DGIX now contains a bounded organic Facebook execution path:

```text
AUTHORIZED ACP
  → DGIX router (facebook + organic)
  → Facebook Organic Adapter
  → Meta Graph API v26.0 POST /{page-id}/feed
  → Facebook Page
```

The Client QEN content is not rewritten. Authorization and execution are separate Operator actions. Paid advertising is recognized and refused. Tokens never enter ACP, browser JSON, logs, or execution records.

Real Meta publishing was not fabricated. This environment has no `.env.local` Meta credentials/assets.

**REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED**

## 2. Execution Router

`routeAuthorizedAcp()` in `src/lib/facebook-resolve.ts`:

| Condition | Adapter | Ready | Executed |
| --- | --- | --- | --- |
| `platform=facebook` + `distribution_type=organic` | `facebook_organic_page` | yes (adapter exists) | no until Meta returns an object id |
| `platform=facebook` + `distribution_type=paid` | `facebook_paid_marketing` | no | no — organic adapter refused |

Paid ACPs are not routed through the organic feed POST.

## 3. Facebook Organic Adapter

New module `src/lib/facebook-organic-adapter.ts` plus orchestrator `src/lib/dgix-execute.ts`.

The adapter owns endpoint selection, Graph version, Page id, authentication, payload translation, request execution, Meta response handling, platform identifiers, and error normalization.

HTTP surface: `POST /api/dgix/acp/[id]/execute`  
Operator control: **Execute on Facebook** / **Retry Facebook execution** on `/dgix/acp/[id]`.

## 4. Meta API Contract / Version

**Graph API v26.0** (`DEFAULT_GRAPH_API_VERSION`; host `https://graph.facebook.com`).

Minimum proving operation, verified against current Meta Page feed publishing:

```text
POST https://graph.facebook.com/v26.0/{page-id}/feed
message=<ACP execution.message, unmodified>
link=<optional http(s) URL>
access_token=<ADE-held Page token; body only; never persisted>
```

Success = Meta JSON with a non-empty `id`.

## 5. Supported Organic Operations

| Operation | Status |
| --- | --- |
| Page feed text/message post (`page_feed_post`) | Implemented |
| Optional `link` on that feed post | Implemented when ACP supplies an http(s) URL |
| Scheduled unpublished feed post | Mapped (`published=false`, `scheduled_publish_time`) |
| Image / photo upload | Refused — not the minimum proving operation |
| Paid Campaign / Ad Set / Creative / Ad | Refused / not implemented |

Text/`now` is the proving path.

## 6. ACP → Meta Mapping

Deterministic. No AI mapping.

| ACP | Adapter / Meta |
| --- | --- |
| `execution.clientId` | connection resolver |
| `execution.platform` | Facebook organic adapter |
| `execution.distributionType` | organic family or paid refusal |
| `execution.postType` | text → feed; image → refused |
| `execution.message` | `message` verbatim |
| `execution.link` | `link` if http(s) |
| `execution.publishMode` / `scheduledAt` | immediate vs scheduled unpublished post |

`callToAction` is ACP text, not a Graph CTA enum, so it is not sent as a Meta CTA object.

## 7. Authorization Enforcement

Only `review_state = authorized` may execute.

Proven refused:

- imported ACP (409)
- reviewed but unauthorized ACP (409)
- rejected ACP (409)
- paid ACP through the organic adapter (409)
- structurally invalid / non-execution-ready ACP

Authorize still does **not** call Facebook. Status after authorize: `ready_for_facebook_execution` / **AUTHORIZED — READY FOR FACEBOOK EXECUTION**.

## 8. Connection Enforcement

Reuses ACI-DGIX-015. Before POST, DGIX resolves `clientId` + `platform=facebook` and requires Organic Page Operations AVAILABLE (Page id + Page token).

If missing: STOP. Operator-facing:

`REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED`

No simulated success row.

## 9. Execution Persistence

Schema **v9** table `dgix_executions`:

intake, package, client, platform, distribution type, adapter, operation, Graph version, Page id, attempted/completed timestamps, status (`attempted` / `succeeded` / `failed`), external object id, sanitized error.

No token columns. Preflight refusals do not insert a succeeded row. Adapter invocation inserts `attempted`, then `succeeded` or `failed`.

## 10. Execution State Model

```text
IMPORTED → REVIEWED → AUTHORIZED
  → EXECUTION ATTEMPTED
  → EXECUTED
  or EXECUTION FAILED
```

`review_state` remains `authorized` after execute. Lifecycle truth is `execution_status`:

| Value | Label |
| --- | --- |
| `ready_for_facebook_execution` | AUTHORIZED — READY FOR FACEBOOK EXECUTION |
| `execution_attempted` | EXECUTION ATTEMPTED |
| `executed` | EXECUTED (Meta object id required) |
| `execution_failed` | EXECUTION FAILED |

EXECUTED is never recorded merely because HTTP was attempted.

## 11. Duplicate Protection

A succeeded execution cannot be repeated by an ordinary second button/API request (409). SQLite unique index: one `status=succeeded` row per intake.

Retry is explicit after EXECUTION FAILED (**Retry Facebook execution**).

## 12. Failure Handling

Handled:

- no Facebook connection / organic unavailable
- unauthorized / rejected / imported ACP
- paid distribution type
- malformed execution / unsupported image post
- Meta authentication, permission, API validation, network/API failure
- duplicate successful execution

Failures are never recorded as successful execution.

## 13. Security Boundary

Page access tokens, app secrets, advertising credentials, and API secrets stay server-side. They are rejected in ACP JSON, omitted from browser/health/execute JSON, omitted from `dgix_executions`, and stripped from Meta error text.

## 14. Real Facebook Validation

`.env.local` was **absent**. CAE did not invent Page IDs or fabricate EXECUTED.

**REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED**

Adapter, router, authorization, paid refusal, persistence, and duplicate-success contract were tested without treating a mock Graph response as live TAIG publishing.

`health.facebook.realPublishingImplemented` remains `false` (live proof not claimed). `organicExecutionAdapterImplemented` is `true`.

## 15. Paid Distribution Boundary

`distribution_type = organic | paid` is preserved. Paid ACPs can still be imported and authorized. The organic adapter refuses them with:

`Paid Advertising Execution is NOT YET IMPLEMENTED. The organic Facebook adapter will not create Campaign, Ad Set, Creative, or Ad objects.`

One ACP / one DGIX architecture is unchanged.

## 16. DGIX Current Truth

| Capability | Status |
| --- | --- |
| Campaign Package Intake | IMPLEMENTED |
| ACP Validation | IMPLEMENTED |
| Operator Review | IMPLEMENTED |
| Operator Authorization | IMPLEMENTED |
| Facebook Account Connection | IMPLEMENTED |
| Organic Facebook Execution Adapter | IMPLEMENTED |
| Real Facebook Publishing | IMPLEMENTED BUT REAL VALIDATION PENDING |
| Paid Advertising Execution | NOT YET IMPLEMENTED |
| Facebook Metrics Retrieval | NOT YET IMPLEMENTED |
| Results Package Export | NOT YET IMPLEMENTED |

## 17. Regression Results

| Check | Result |
| --- | --- |
| `npm test` | **33 passed**, 0 failed |
| `validate:aci004` … `validate:aci011` | PASS |
| `validate:aci-dgix-012` | PASS |
| `validate:aci-dgix-013` | PASS |
| `validate:aci-dgix-014` | PASS (authorize still does not publish) |
| `validate:aci-dgix-015` | PASS (connection still independent of paid; live Meta still blocked here) |
| `validate:aci-dgix-016` | PASS (real publish blocked; no fabricated success) |

Evidence: `docs/nebula/artifacts/aci-dgix-016-evidence/`.

## 18. Known Limitations

- Live Facebook publish not proven in this environment (credentials/assets required).
- Image posts are refused; no binary upload.
- Scheduled mapping exists; text/`now` is the proving path.
- No Facebook OAuth UI; connection is still process `.env.local` configuration.
- No paid advertising objects, metrics retrieval, or Results Package.
- Standard ADE mock Facebook adapter remains mock and is not DGIX execution.

## 19. Recommended ACI-DGIX-017

Facebook **metrics retrieval** for an **already executed** organic Page post (sanitized insights/evidence on the stored Meta object id).

Do **not** implement paid advertising, ACRP export, or optimization in 017 unless the Social Engine Build QEN separately authorizes those.

Do not begin ACI-DGIX-017 until authorized.

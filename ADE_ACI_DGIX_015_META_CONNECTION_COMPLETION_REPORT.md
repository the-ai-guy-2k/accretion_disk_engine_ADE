# ADE ACI-DGIX-015 — Meta Connection Completion Report

**Product:** Accretion Disk Engine (ADE)  
**Feature family:** Distribution, Growth & Intelligence Exchange (DGIX)  
**QEN:** Social Engine Build QEN  
**Execution:** AIA / CAE — Local  
**Date:** 2026-08-26  
**Type:** DGIX platform integration capability  
**Branch:** `feature/dgix/aci-dgix-015-meta-connection`  
**Baseline:** `deployable` / `main` @ `836fd4d`  
**New ADE MVP capability:** none  
**New DGIX capability:** Meta/Facebook connection foundation

**Completion condition:** DGIX has a secure, truthful Meta/Facebook connection layer for organic and paid infrastructure, without ACP credentials and without executing a social operation. Real Meta validation is blocked in this environment because credentials/assets were not supplied.

---

## 1. Implementation Summary

- Server-side connection config (`.env.local` names in `.env.example`)
- Resolver: logical `clientId` + `platform=facebook` → ADE-held Page / optional Ad Account
- Versioned Graph client (`v26.0`, GET-only for this ACI)
- Operator validate action on `/dgix`
- Independent organic vs paid capability
- Token-free snapshot table `dgix_platform_connections` (schema **v8**)
- Future routing contract (`facebook_organic_page` / `facebook_paid_marketing`) with `executed: false`
- No Page posts, no ads, no spend

`npm run validate:aci-dgix-015` records the blocked live-validation outcome honestly.

---

## 2. Meta API Contract Used

Graph API GET:

- `/{page-id}?fields=id,name` — organic Page identity
- `/debug_token` — optional authorization validity when App ID + App Secret are set
- `/act_{ad-account-id}?fields=id,name,account_status` — paid Ad Account identity

No POST to Page feed. No Marketing API object writes. Marketing API hierarchy is documented for a later ACI only.

---

## 3. Graph API Version

**v26.0** (current at implementation; `META_GRAPH_API_VERSION`, default `v26.0`).  
Host: `https://graph.facebook.com/v26.0/...`. Unversioned paths are not used.

---

## 4. Connection Data Model

Env (secrets): Page token, optional ad token, App secret.  
SQLite `dgix_platform_connections`: `client_id`, `platform`, Graph version, Page id/name, Ad Account id/name, organic/paid flags, connection status, sanitized error. **No token columns.**

Logical client is `ADE_DGIX_FB_CLIENT_ID`. TAIG is not hard-coded.

---

## 5. Organic Connection Capability

AVAILABLE only after a successful live Page identity GET with a configured Page token.  
Missing Page ID or token → organic NOT AVAILABLE. Does not by itself force paid UNAVAILABLE beyond its own rules.

---

## 6. Paid Connection Capability

AVAILABLE only after a successful live Ad Account GET.  
Missing Ad Account does **not** invalidate a valid organic connection. Organic AVAILABLE does **not** imply paid AVAILABLE.

This ACI does not create Campaign, Ad Set, Creative, or Ad objects.

---

## 7. Credential/Security Boundary

ACP continues to reject credential-like keys. API responses omit tokens. Settings lists variable **names** only. `.env.local` is gitignored. Completion report contains no secrets.

---

## 8. Connection Configuration

Copy `.env.example` to `.env.local`, set:

- `ADE_DGIX_FB_CLIENT_ID` (proving client example: TAIG)
- `FACEBOOK_PAGE_ID` / `ADE_DGIX_FB_PAGE_ID`
- `META_PAGE_ACCESS_TOKEN` / `ADE_DGIX_FB_PAGE_ACCESS_TOKEN`
- optional `META_AD_ACCOUNT_ID`, `META_AD_ACCESS_TOKEN`
- optional `META_APP_ID`, `META_APP_SECRET` for debug_token
- `META_GRAPH_API_VERSION=v26.0`

Restart ADE. ACP never carries these values.

---

## 9. Real Connection Validation

Operator: **Validate Facebook connection** → `POST /api/dgix/facebook/validate`.

This CAE environment: **`.env.local` absent**. No Page ID or Ad Account ID was invented.

**REAL CONNECTION VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED**

Not a fabricated Meta PASS.

---

## 10. Capability Detection

Workspace and API expose:

- Facebook: CONNECTED / NOT CONNECTED / INVALID
- Organic: AVAILABLE / NOT AVAILABLE
- Paid: AVAILABLE / NOT AVAILABLE

CONNECTED requires a successful live Meta call, not merely env presence.

---

## 11. DGIX Workspace Changes

Facebook connection panel on `/dgix`. Capability table: Facebook Account Connection **IMPLEMENTED**. Real Facebook Publishing and Paid Advertising Execution **NOT YET IMPLEMENTED**.

---

## 12. ACP Routing Boundary

Optional `execution.distributionType` (`organic` | `paid`, default organic).  
Router returns adapter id and `executed: false`. Authorize still does not publish.

Future organic: Authorized ACP + resolved Page connection → Page publish (later).  
Future paid: adapter translates ACP into Campaign → Ad Set → Creative → Ad (later).

---

## 13. Failure Handling

Missing config, invalid/expired auth, inaccessible Page, inaccessible Ad Account, insufficient permission, Meta API error, network failure. Messages are sanitized. ACP execution state is unchanged.

---

## 14. TAIG Connection Status

Architecture allows `client_id=TAIG` + `platform=facebook` when `ADE_DGIX_FB_CLIENT_ID=TAIG` is configured.  
In this run TAIG was **not** bound because no client/Page/token assets were supplied. No invented Page or Ad Account IDs.

---

## 15. Regression Results

Unit tests PASS. `validate:aci-dgix-012`, `013`, `014`, `015` and ADE MVP validators are run at completion. Authorization still does not execute. ACP secret rejection remains.

---

## 16. Known Limitations

- No OAuth login flow (env-configured tokens only)
- Media is not uploaded
- Page publishing not implemented
- Paid object writes not implemented
- Metrics/ACRP not implemented
- Real Meta validation blocked until Operator supplies assets

---

## 17. Recommended ACI-DGIX-016

**Organic Facebook Page publishing for an authorized ACP** using the resolved Page connection and Graph v26.0, still without paid object creation, and without treating the mock ADE adapter as DGIX execution.

Do not begin ACI-DGIX-016 in this slice.

# ACI-DGIX-017 evidence

Do not store API keys, tokens, or Page secrets here.

## Connection validation (resumed after Operator `.env.local` input)

DGIX `POST /api/dgix/facebook/validate` (sanitized):

- clientId: TAIG
- platform: facebook
- Graph API: v26.0
- Facebook: CONNECTED
- Organic Page Operations: AVAILABLE
- Paid: NOT AVAILABLE (expected; not in scope)
- Page identity name returned by Meta: TAIG Solutions
- Page ID: present and accepted by Meta (value not archived here)
- tokenExposed: false
- realValidation: succeeded
- Banner: connection validation does not publish; no post or ad was created

No access token, app secret, or raw Graph payload is stored in this folder.

## ACP intake (not authorized, not executed)

- intake id: 42
- packageId: `acp-taig-real-017-1787868307489`
- review_state: imported
- execution_authorized: no
- execution_status: null
- adapter route: facebook_organic_page
- executed: false

Operator authorization of the live TAIG Page post is still required. PASS has not been claimed.

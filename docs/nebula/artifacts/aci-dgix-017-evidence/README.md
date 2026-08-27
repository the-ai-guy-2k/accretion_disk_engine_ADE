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

Intake **#42** was **rejected** by Operator instruction. Nothing was published.

Replacement:

- intake id: 43
- packageId: `acp-taig-real-017-operator-1787869168564`
- review_state: imported
- execution_authorized: no
- execution_status: null
- adapter route: facebook_organic_page
- executed: false
- execution.message (verbatim): `... one giant leap for mankind; a larger one for humanity...`
- no link, no CTA

Operator authorization of intake **#43** is required before DGIX may publish. PASS has not been claimed.

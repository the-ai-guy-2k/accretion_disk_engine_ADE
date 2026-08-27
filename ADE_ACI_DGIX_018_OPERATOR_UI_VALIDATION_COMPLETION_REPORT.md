# ADE ACI-DGIX-018 — Operator UI Organic Execution Validation

**Product:** Accretion Disk Engine (ADE)  
**Feature family:** Distribution, Growth & Intelligence Exchange (DGIX)  
**Build phase:** POST-MVP — DGIX FEATURE BUILD  
**ACI:** ACI-DGIX-018  
**Baseline:** `deployable` / `main` @ `76c9c7c`  
**Feature branch:** `feature/dgix/aci-dgix-018-operator-ui-validation`  
**Date:** 2026-08-27  
**Result:** **BLOCKED — OPERATOR AUTHORIZATION REQUIRED**  
**New ADE MVP capability:** NO  
**New DGIX capability:** NO (Operator UI uses the existing organic execution path)

ACI-DGIX-019 was not started.

---

## Why blocked

A live organic Facebook Page post is required to prove the Operator UI execute action. CAE imported the proving ACP and stopped before authorization and before publication.

## Operator UI workflow proven (without live publish)

1. DGIX workspace loads.
2. ACP import through the same intake control the UI uses (`POST /api/dgix/acp`). Import is not authorization.
3. Review page shows client, platform, distribution, destination, content, and publish timing.
4. Organic routing is shown (`facebook_organic_page`).
5. Unauthorized and review-only ACPs cannot execute (HTTP 409). The UI does not treat import/review as execute.
6. Operator can authorize or reject through the product actions. Authorization does not publish.
7. Execute uses existing `POST /api/dgix/acp/[id]/execute` (no parallel path).
8. Intake **#43** (ACI-DGIX-017) remains **EXECUTED** in the UI with Meta object id `1258891693979751_122109387345419404`. Duplicate execute remains 409.
9. No credential keys in UI JSON or evidence.

## Architecture / data changes

Bounded Operator-facing labels only:

- Review page **Intended execution** panel (client, platform, distribution, destination, timing, routing)
- Intake list **Route** column
- `reviewView` now exposes `CLIENT`, `PLATFORM`, `DISTRIBUTION_TYPE`

No new Meta adapter, no second execute route, no paid ads, no metrics.

## Awaiting Operator action

| Field | Value |
| --- | --- |
| Intake | **#54** |
| packageId | `acp-taig-018-operator-ui-1787873477597` |
| Review URL | `/dgix/acp/54` |
| Destination | TAIG Solutions Facebook Page (`facebook` for client `TAIG`) |
| Distribution | organic |
| Publish timing | now |
| Message | `TAIG Solutions is confirming that an Operator can publish an authorized organic Page post from the ADE DGIX workspace.` |

Do **not** ask CAE to auto-authorize or auto-publish. If this copy is wrong, reject #54 or supply replacement text.

## Tests

- `npm test`: 34 passed
- `validate:aci004` through `validate:aci-dgix-016`: PASS
- `validate:aci-dgix-018`: PASS (live UI publish still requires Operator authorization)

## Remaining limitations

- UI-driven live execute not yet Operator-authorized
- Browser click-path not separately instrumented (no browser automation in this environment); UI pages and the same APIs the buttons call were used
- Paid advertising, metrics, Results Package remain unimplemented

## Discovered later (do not implement in this ACI)

- Intake list could show the persisted Facebook object id on EXECUTED rows
- Review could show the connected Page name (TAIG Solutions) next to destination
- Dedicated browser-driven PE harness if QEN wants click telemetry beyond HTML + API equivalence


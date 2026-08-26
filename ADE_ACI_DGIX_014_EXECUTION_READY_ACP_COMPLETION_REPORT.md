# ADE ACI-DGIX-014 — Execution-Ready ACP Completion Report

**Product:** Accretion Disk Engine (ADE)  
**Feature family:** Distribution, Growth & Intelligence Exchange (DGIX)  
**QEN:** Social Engine Build QEN  
**Execution:** AIA / CAE — Local  
**Date:** 2026-08-26  
**Type:** DGIX product capability / intent reconciliation  
**Branch:** `feature/dgix/aci-dgix-014-execution-ready-acp`  
**Baseline:** `deployable` @ `2b32d5f`  
**New ADE MVP capability:** none  
**New DGIX capability:** execution-ready ACP, conditional validation, Operator authorization

**Completion condition:** An execution-ready ACP can enter DGIX, be validated, reviewed, and explicitly authorized by the Operator without being regenerated or reconstructed through Standard ADE. The authorized package is a clean input boundary for a future platform adapter.

---

## 1. Intent Reconciliation

Governing model:

```text
Client QEN → Execution-Ready ACP → DGIX Validation → Operator Review
  → Operator Authorization → Platform Adapter → Platform API
```

KISS: **QEN thinks/prepares → human authorizes → DGIX executes/measures.**

This slice locked that boundary in the implemented ACP/DGIX workflow. DGIX does not regenerate ACP content. Execution does not depend on reconstructing the package as Standard ADE Goal, Campaign, Source, or Draft records. Authorization is not Facebook publishing.

---

## 2. Implementation Summary

- Optional ACP v1 `execution` block for publish-ready fields
- Conditional validation (text / image / scheduled)
- Canonical states: `imported`, `ready_for_decision`, `authorized`, `rejected`
- `POST /api/dgix/acp/:id/authorize` with `authorize` | `reject`
- Operator review shows destination, post type, final content, media/link, timing, objective, measurement, provenance
- After authorize: **AUTHORIZED — PLATFORM EXECUTION NOT YET CONNECTED**
- Schema **v7** (`acp_profile`, `execution_status`, `decision_at`, `decision_by`)
- Adapter handoff object documented; not sent to Meta
- TAIG TEST ACP updated as execution-ready TEST DATA
- `npm run validate:aci-dgix-014`

---

## 3. ACP Execution Data Model

`execution` (when present) carries:

- `clientId`, `platform`, `postType` (`text` | `image`)
- `message` — final publish-ready caption
- `mediaReference` when required
- `link`, `callToAction` when supplied
- `publishMode` (`now` | `scheduled`)
- `scheduledAt` when scheduled

This is ADE's execution-ready contract. It is **not** claimed as a proven Meta Graph request body.

---

## 4. Record / Intelligence Data

Unchanged ACP v1 identity, objective, audience, content posts, provenance, `executionIntent` (restrictions / approval requirements), and `measurementIntent`.

These fields are stored for records, attribution, measurement, and later results exchange. They are not used to rebuild a Standard ADE campaign before execution.

---

## 5. Conditional Validation

| Operation | Extra required execution fields |
| --- | --- |
| Text post | client, platform, post type, message, publish mode |
| Image post | plus `mediaReference` |
| Scheduled | plus `scheduledAt` |

Packages without `execution` remain valid **legacy** ACP v1. They import and review; they cannot be authorized.

---

## 6. Operator Review

`/dgix/acp/[id]` presents:

- DESTINATION
- POST TYPE
- FINAL CONTENT (exactly the prepared message)
- MEDIA / LINK
- TIMING
- OBJECTIVE
- MEASUREMENT
- PROVENANCE

Copy states the package is already execution-ready. DGIX does not ask the Operator to regenerate the post. Legacy packages are labeled and cannot be authorized.

---

## 7. Authorization Model

| State | Label |
| --- | --- |
| `imported` | IMPORTED |
| `ready_for_decision` | REVIEWED / READY FOR DECISION |
| `authorized` | AUTHORIZED — PLATFORM EXECUTION NOT YET CONNECTED |
| `rejected` | REJECTED |

ACI-DGIX-013 values are remapped on migrate. `POST .../review` still records reviewed/declined without authorizing. `POST .../authorize` is the explicit decision.

`decision_by` defaults to `local-operator`. No authentication system was added.

---

## 8. Platform Account Boundary

ACP identifies `clientId` + `platform` only. Tokens, app secrets, API keys, passwords, and AI credentials are rejected if present in the artifact. Future DGIX resolves an ADE-held connection. Handoff: [`docs/acp/ACP_ADAPTER_HANDOFF.md`](docs/acp/ACP_ADAPTER_HANDOFF.md).

---

## 9. Standard ADE / DGIX Boundary

Authorization does not create Goal, Campaign, Source, or Draft rows. `materialized` stays 0. `goal_id` / `campaign_id` on `dgix_missions` stay null. Standard ADE `/review` and the mock Facebook adapter remain the engine path; they are not DGIX real-platform execution.

---

## 10. Existing ACP Compatibility

Schema v7 adds columns and remaps review-state names. `raw_json` is not rewritten. Rows without `execution` are `acp_profile = legacy`. They remain importable and reviewable. They are not silently invalidated or authorized.

---

## 11. TAIG Test ACP

[`examples/acp/acp-v1-taig-facebook-contacts.test.json`](examples/acp/acp-v1-taig-facebook-contacts.test.json)

- client `TAIG`, platform `facebook`, post type `text`, `publishMode: now`
- objective: Generate 2 qualified TAIG client contacts through Facebook
- measurement: `qualified_client_contacts` target = 2
- final publish-ready Facebook message labeled **TEST DATA**
- objective is **not** represented as achieved

---

## 12. Security

Credential-like keys continue to fail validation. Authorization responses and adapter handoff do not include platform credentials. No secrets were committed.

---

## 13. Regression

Standard ADE Hub screens remain operational. DGIX-012 workspace remains. DGIX-013 intake remains (canonical states). Provenance (`packageId`, original JSON, timestamps) remains. ADE MVP validators are unchanged in intent.

---

## 14. DGIX Current Truth

| Capability | Status |
| --- | --- |
| Campaign Package Intake | IMPLEMENTED |
| ACP Validation | IMPLEMENTED |
| Operator Review | IMPLEMENTED |
| Operator Authorization | IMPLEMENTED |
| Facebook Account Connection | NOT YET IMPLEMENTED |
| Real Facebook Publishing | NOT YET IMPLEMENTED |
| Facebook Metrics Retrieval | NOT YET IMPLEMENTED |
| Results Package Export | NOT YET IMPLEMENTED |

---

## 15. Known Limitations

- No Facebook OAuth / Page connection
- No Meta API call
- No ACRP export
- No Operator login; `decision_by` is a local label
- `postType` is not a proven Meta Graph contract
- Media references are descriptors, not uploaded binaries
- Automatic Client QEN connectivity is not implemented

---

## 16. Recommended ACI-DGIX-015

**Platform Resolver + Facebook Account Connection** — resolve `clientId` + `platform` to an ADE-held connection, still without calling Meta as a successful publish, and without using the mock Facebook adapter as DGIX real-platform execution.

Do not begin ACI-DGIX-015 in this slice.

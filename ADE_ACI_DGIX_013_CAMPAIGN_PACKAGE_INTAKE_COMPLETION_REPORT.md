# ADE ACI-DGIX-013 — Campaign Package Intake Completion Report

**Product:** Accretion Disk Engine (ADE)  
**Feature family:** Distribution, Growth & Intelligence Exchange (DGIX)  
**QEN:** Social Engine Build QEN  
**Execution:** AIA / CAE — Local  
**Date:** 2026-08-26  
**Type:** DGIX product capability  
**Branch:** `feature/dgix/aci-dgix-013-campaign-package-intake`  
**Baseline:** `deployable` @ `25ce5a5`  
**New ADE MVP capability:** none  
**New DGIX capability:** ACP v1 contract and Operator-controlled intake/review

**Completion condition:** A valid structured ADE Campaign Package can enter DGIX, be validated, persisted, and presented coherently to the Operator without automatically approving or executing its content.

---

## 1. Implementation Summary

DGIX now has a working Client QEN → Artifact → ADE/DGIX intake boundary:

- ACP v1 JSON contract (generic; not TAIG- or QEN-specific)
- Operator-controlled import on `/dgix` (paste JSON or local file)
- Validation with operator-facing issues
- Persistence on schema **v6** (`dgix_missions`, `dgix_acp_intakes`)
- Review screen `/dgix/acp/[id]`
- Import is not approval and not publishing

`npm run validate:aci-dgix-013` **PASS**.

---

## 2. ACP v1 Contract

Documented in [`docs/acp/ACP_V1.md`](docs/acp/ACP_V1.md). JSON fields cover identity, objective, audience, content, provenance, execution intent, and measurement intent. Required vs optional is explicit. Extra non-secret fields are stored for extension. Secrets are rejected.

---

## 3. Intake Mechanism

Localhost: JSON paste or `.json` file on the DGIX workspace, posted to `POST /api/dgix/acp`. No automatic Client QEN connectivity.

---

## 4. Validation

Rejected before persistence:

- unsupported version
- missing identity / objective / campaign name
- measurement target not an object with numeric `targetValue`
- invalid platform list
- malformed content (including a lone `body` that is not `posts`)
- missing provenance/source evidence
- known credential field names

Failures return `{ ok: false, error, issues: [{ path, message }] }`. ADE does not silently repair invalid packages.

---

## 5. Operator Review Experience

`/dgix/acp/[id]` answers OBJECTIVE, CAMPAIGN, AUDIENCE, CONTENT, SOURCE, CTA, MEASUREMENT, and RESTRICTIONS. TEST DATA is labeled. The Operator can mark reviewed or decline. That still does not approve ADE drafts.

---

## 6. Human Authority

ACP → Intake → Operator Review → Human Approval → future execution.

`execution_authorized` stays 0. `materialized` stays 0. No draft enters the publishing queue from import.

---

## 7. Provenance

Stored: `package_id`, ACP version, originating system, business id, package `createdAt`, ADE `imported_at`, original JSON. External artifact content is not treated as internally generated ADE evidence.

---

## 8. DGIX Mission / Persistence Model

Minimum authorized Mission table:

- `dgix_missions` — title, business, platform, objective, intake review status; Goal/Campaign FKs unused
- `dgix_acp_intakes` — package + review state

Existing ADE tables are unchanged. Restart keeps imported packages (SQLite file). Schema upgrades existing files to v6 without wiping MVP data.

---

## 9. Existing ADE Mapping

Documented on the review screen and not performed:

ACP Objective → Goal · ACP Campaign → Campaign · ACP Source Evidence → Source · ACP Proposed Content → Draft.

Conversion remains a later explicit governed action.

---

## 10. TAIG Test ACP

[`examples/acp/acp-v1-taig-facebook-contacts.test.json`](examples/acp/acp-v1-taig-facebook-contacts.test.json)

Business TAIG, platform Facebook, objective +2 qualified contacts. Labeled TEST DATA. Not claimed as Facebook distribution or actual clients. Imports successfully.

---

## 11. Invalid ACP Test

[`examples/acp/acp-v1-invalid-missing-objective.json`](examples/acp/acp-v1-invalid-missing-objective.json)

Has identity and a post but no objective. Rejected with issues naming `objective`. Credential-field packages are also rejected.

---

## 12. Security Boundary

ACP must not contain tokens, API keys, passwords, or AI/Facebook secrets. Known credential keys are rejected. No external credentials are required for intake.

---

## 13. DGIX Workspace Status

| Capability | Status |
| --- | --- |
| Campaign Package Intake | IMPLEMENTED |
| Facebook Account Connection | NOT YET IMPLEMENTED |
| Real Facebook Publishing | NOT YET IMPLEMENTED |
| Facebook Metrics Retrieval | NOT YET IMPLEMENTED |
| Results Package Export | NOT YET IMPLEMENTED |
| Distribution / Growth Optimization | NOT YET IMPLEMENTED |

DGIX remains **POST-MVP — IN DEVELOPMENT**.

---

## 14. MVP Regression

| Check | Result |
| --- | --- |
| `npm test` | 19 passed |
| `validate:aci-dgix-012` | PASS |
| `validate:aci-dgix-013` | PASS |
| `validate:aci004`–`aci011` | PASS |

Mock Facebook behavior unchanged. Human reject still blocks enqueue. Standard ADE remains independent.

---

## 15. Documentation / Traceability

- `docs/acp/ACP_V1.md`
- `docs/nebula/aci/ACI-DGIX-013.md` archived
- `docs/nebula/acr/ACR-DGIX-013.md` (exactly one)
- TRACEABILITY distinguishes ADE MVP ACI-001→011 from DGIX ACI-DGIX-012 onward

---

## 16. Known Limitations

- No automatic Client QEN connectivity
- No ACP → ADE Goal/Campaign/Source/Draft materialization
- No Facebook OAuth, real publishing, or metric retrieval
- No ACRP export
- Duplicate `packageId` is refused rather than versioned
- Localhost file/JSON intake only

---

## 17. Recommended ACI-DGIX-014

**ACI-DGIX-014 — Governed ACP materialization into ADE records**

Bounded next slice: after Operator review of a valid ACP, an explicit Operator action may create linked Goal / Campaign / Source / Draft records **without** auto-approval and **without** Facebook OAuth, real publishing, metric retrieval, or ACRP export. Human approval on ADE Review would remain mandatory before any publishing path.

Do not begin ACI-DGIX-014 in this slice.

---

**ACI-DGIX-013 status:** Complete. Returned to Social Engine Build QEN. ACI-DGIX-014 not begun.

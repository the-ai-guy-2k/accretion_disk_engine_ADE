# Forward baseline (post reconciliation)

**Date:** 2026-08-26  
**Git:** last product-code commit `014835b` on `deployable` / `main` / `feature/aci-008`. Reconciliation documentation is committed after that tip; no further product-code change.

## Statement

> **The validated ADE product and governance baseline from which the next product ACI will proceed is `deployable` at last product-code commit `014835b`, plus the governance reconciliation overlay: localhost ADE Hub with Source → Draft (mock/manual **and** live AI) → Review/Approval → mock Facebook queue, plus Goals, manual results, deterministic Intelligence, Campaigns/plans, SQLite schema v5, and the Nebula ACI/ACR overlay through ACI-007 plus the live-AI ACI-008 records.**

This reconciliation did **not** add or remove product capability.

## QEN numbering note

QEN directed that the next product capability after this reconciliation would be **Live AI Content Generation as ACI-009**, and that it must not be implemented in this slice.

That capability is **already present** on this baseline (prior ACI-008 product slice, live-validated). ACI-009, if issued, should confirm or delta that existing path. It should not rebuild ADE or treat live generation as unimplemented.

## Next CAE default

`feature/aci-009` → validation → `deployable`  
Do not treat unvalidated feature branches as release truth.

<!-- AUTHORITATIVE ACI INSTRUCTION FOR THIS SLICE -->
Source: QEN operator instruction as received in CAE chat (ACI-DGIX-016).
Stored during ACI-DGIX-016.

# ACI-DGIX-016 — ADE/DGIX — Facebook Organic Execution Adapter
**Product:** Accretion Disk Engine (ADE)
**Feature Family:** Distribution, Growth & Intelligence Exchange (DGIX)
**Build Phase:** POST-MVP — DGIX FEATURE BUILD
**QEN:** Social Engine Build QEN
**Execution:** AIA / CAE — Local
**Baseline:** deployable / main @ 227da75
**Feature Branch:** feature/dgix/aci-dgix-016-facebook-organic-execution
**Type:** DGIX Platform Execution Capability
**Status:** AUTHORIZED FOR IMPLEMENTATION
**New ADE MVP Capability:** NO
**New DGIX Capability:** YES

## Mission
Implement the first real DGIX external execution path:

AUTHORIZED ACP → DGIX → Facebook Organic Adapter → Meta Graph API → Facebook Page

Applies when `platform = facebook` AND `distribution_type = organic`. DGIX must not rewrite or regenerate Client QEN content.

## Completion condition
DGIX contains a bounded Facebook organic execution path capable of taking an authorized execution-ready ACP, resolving its configured Facebook connection, translating it into the appropriate Meta operation, safely executing that operation when real credentials are available, and truthfully recording the result.

Real platform success may remain externally blocked if credentials or Meta assets are unavailable, but it must never be fabricated.

## Non-goals
Do not generate campaign strategy; rewrite or regenerate ACP content with AI; execute paid advertising; create Campaign/Ad Set/Creative/Ad objects; retrieve Facebook metrics; generate Results Package; implement optimization; automatically execute upon ACP import or authorization. Do not begin ACI-DGIX-017 in this slice.

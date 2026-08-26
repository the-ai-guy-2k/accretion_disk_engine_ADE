<!-- AUTHORITATIVE ACI INSTRUCTION FOR THIS SLICE -->
Source: QEN operator instruction as received in CAE chat (ACI-DGIX-013).
Stored during ACI-DGIX-013.

# ACI-DGIX-013 — ADE/DGIX — Campaign Package Contract & Intake
**Product:** Accretion Disk Engine (ADE)
**Feature Family:** Distribution, Growth & Intelligence Exchange (DGIX)
**Build Phase:** POST-MVP — DGIX FEATURE BUILD
**DGIX Sequence:** 02
**QEN:** Social Engine Build QEN
**Execution:** AIA / CAE — Local
**Baseline:** `deployable` @ `25ce5a5`
**Feature Branch:** `feature/dgix/aci-dgix-013-campaign-package-intake`
**Type:** DGIX Product Capability
**New ADE MVP Capability:** NO
**New DGIX Capability:** YES

## Mission
Implement the first functional DGIX intelligence-exchange capability: ADE Campaign Package (ACP) contract and Operator-controlled intake.

This ACI stops at intake/review. Do not implement real Facebook authentication, publishing, platform metrics retrieval, or Results Package export.

## Completion condition
A valid structured ADE Campaign Package can enter DGIX, be validated, persisted where required, and presented coherently to the Operator without automatically approving or executing its content. The system must preserve provenance and reject materially invalid packages.

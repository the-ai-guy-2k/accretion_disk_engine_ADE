<!-- AUTHORITATIVE ACI INSTRUCTION FOR THIS SLICE -->
Source: QEN operator instruction as received in CAE chat (ACI-DGIX-018).
Stored during ACI-DGIX-018.

# ACI-DGIX-018 — ADE/DGIX — Operator UI Organic Execution Validation
**Product:** Accretion Disk Engine (ADE)
**Feature Family:** Distribution, Growth & Intelligence Exchange (DGIX)
**Build Phase:** POST-MVP — DGIX FEATURE BUILD
**QEN:** Social Engine Build QEN
**Execution:** AIA / CAE — Local
**Baseline:** deployable / main @ 76c9c7c
**Feature Branch:** feature/dgix/aci-dgix-018-operator-ui-validation
**Type:** DGIX Operator UI / Product Evaluation
**Status:** AUTHORIZED FOR IMPLEMENTATION / OPERATOR AUTHORIZATION REQUIRED BEFORE LIVE PUBLISH
**New ADE MVP Capability:** NO
**New DGIX Capability:** NO (validates existing organic execution through the Operator UI)

## Mission
Prove that the Operator can drive the already-validated Facebook organic publishing capability from the normal ADE/DGIX localhost UI. Do not create a second execution path. Do not redesign DGIX.

## Completion condition
PASS only when the localhost Operator UI can import/select, review, authorize or reject, and execute an organic Facebook ACP through the existing DGIX router and Facebook Organic Adapter, and a successful execution corresponds to a real Meta object/post id.

If a live Facebook post is required, CAE must stop before publication until the Operator explicitly authorizes the exact package.

## Non-goals
Do not implement paid advertising, Marketing API objects, insights/metrics ingestion, Results Package, Page profile management, authentication/user accounts, production deployment, major UI redesign, or ACP regeneration. Do not begin ACI-DGIX-019.

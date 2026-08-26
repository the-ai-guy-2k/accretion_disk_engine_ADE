# Hybrid architecture decision (ACI-003)

**Status:** Binding. Preserved during ACI-007.  
**Product code change:** none in ACI-003 and none in ACI-007.

Authoritative harvest report (kept in place, not duplicated):  
[`ADE_ACI_003_HYBRID_HARVEST_REPORT.md`](../../../ADE_ACI_003_HYBRID_HARVEST_REPORT.md)

## Decision

| Option | Outcome |
| --- | --- |
| Reuse Postiz source | **Rejected** |
| Embed Mixpost (Lite or Pro) | **Rejected** |
| ADE-owned Hub and intelligence | **Retained** |
| Channel adapter boundary | **Retained** (implemented ACI-004) |
| Explicit publishing states | **Retained** (`PENDING` / `READY` / `PUBLISHED` / `FAILED`) |
| Publishing failure guards | **Retained conceptually and in workflow** (FAILED is not PUBLISHED; only approved content queues; retry is a new attempt) |
| Facebook / Meta adapter boundary | **Retained** (`manual_facebook`; live Graph not implemented) |

ADE may **adapt proven social-plumbing patterns** (adapter interface, pending/finalize, job guards). ADE must **not** vendor those products’ code or run them as the Hub.

## Rationale (from ACI-003 evidence)

- **Postiz** is AGPL-3.0 and a distributed product (Next + Nest + Temporal + Postgres + Redis). Copying or linking it would fight ADE Hub ownership and likely force AGPL on ADE.
- **Mixpost Lite** is MIT but PHP/Laravel/Vue. Embedding it would add a second runtime. Mixpost Pro networks are out of license/scope.
- Commodity overlap is channel compose / schedule / publish. ADE differentiation is Source, Goal, Campaign, mandatory human approval, and ADE-native intelligence.

## Implemented follow-through (not future intent)

ACI-004 implemented the adapter + state machine + failure guards against ADE SQLite.  
ACI-005–006 kept Hub/intelligence ADE-native (`deterministic_mock`).  
No Postiz or Mixpost files exist in this repository.

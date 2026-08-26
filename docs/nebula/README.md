# ADE Nebula engineering record

This tree is the **governance and traceability** overlay for the Accretion Disk Engine. It does not replace the running application.

Application code remains under `src/`. Do not treat this folder as a second ADE product.

| Path | Purpose |
| --- | --- |
| [aci/](aci/) | ACI instructions (recovered/current) |
| [acr/](acr/) | Acceptance / completion records |
| [TRACEABILITY.md](TRACEABILITY.md) | ACI ↔ ACR matrix (reconciled 2026-08-26) |
| [passdowns/FORWARD_BASELINE.md](passdowns/FORWARD_BASELINE.md) | Validated baseline for the next product ACI |
| [artifacts/](artifacts/) | Pointers to validation evidence |
| [architecture/](architecture/) | Implemented architecture (current truth) |
| [data-model/](data-model/) | Implemented SQLite model (current truth) |
| [passdowns/](passdowns/) | Branch workflow and CAE passdowns |
| [reports/](reports/) | Pointers to ACI completion reports |

**Release branch:** `deployable`  
**Integration line:** `main` (not rewritten)  
**Feature work:** `feature/aci-###` → validation → `deployable`

Authoritative remote: `https://github.com/the-ai-guy-2k/accretion_disk_engine_ADE`

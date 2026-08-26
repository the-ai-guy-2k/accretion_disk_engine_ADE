# ADE engineering workflow and branch model

## Authoritative remote

`https://github.com/the-ai-guy-2k/accretion_disk_engine_ADE`

Local folder spelling `Accretion_disk_engin_ADE` is the workstation path. GitHub uses `engine`.

## Branch meaning

| Branch | Role |
| --- | --- |
| `feature/aci-###` | CAE implementation for one ACI. Not release truth. |
| `deployable` | Validated release/promotion line. After ACI-007 this is the branch QEN treats as the validated ADE state. |
| `main` | Historical integration line. **Do not destroy or rewrite.** It may lag or match `deployable` after a checkpoint; it is not a substitute for validation. |

Going forward:

```text
feature/aci-###  →  validation  →  deployable
```

Do not treat unvalidated feature branches as release truth.

`deployable` was created during ACI-007 from commit `f219fce` (completed work through ACI-006), then fast-forwarded to include this governance alignment after validation.

## CAE execution path

```text
QEN
  → ACI
  → feature/aci-###
  → CAE implementation
  → validation
  → ACR
  → merge to deployable
  → remote checkpoint
```

Future feature ACIs use their corresponding feature branch unless governance explicitly authorizes otherwise.

## Product-code rule for governance ACIs

ACI-007 did not add ADE product capability. Documentation and repository alignment only.

## Intentional process stops

Stopping `next dev` during restart validation is **not** an application failure.

# Artifact notes — ACI-007

Captured during ACI-007 validation. No ADE product code was changed.

- `health-before-restart.json` / `health-after-restart.json` — `/api/health` (schema v4, same `initialized_at`)
- `workspace-before-restart.json` / `workspace-after-restart.json` — campaign 2 workspace
- `restart_check.txt` — persistence identity after intentional `next dev` stop
- `restart_stop.txt` — port 3000 cleared before restart
- `validate-aci00{4,5,6}.txt` — HTTP regression against localhost
- `unit-tests.txt` — `npm test` (8 passed)
- git snapshots — branch/HEAD at alignment time

`initialized_at` remains `2026-08-26T00:24:40.643Z`. Intentional `next dev` termination is not an ADE defect.

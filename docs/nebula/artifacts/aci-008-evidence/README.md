# ACI-008 evidence

Live AI content generation validation. Do not store API keys here.

- `health.json` — schema v5, `ai.ready`, same `initialized_at`
- `ai-status.json` — public AI status (no credential)
- `content-17.json` — live AI draft with source provenance, operator edit, human approval, queue PENDING
- `validate-aci008.txt` — HTTP validation log
- `unit-tests.txt` — `npm test` (12 passed)

Live provider proven: OpenAI `gpt-4o-mini`. Intelligence/analytics were not switched to live AI.

# ACI-DGIX-017 evidence

Do not store API keys, tokens, or Page secrets here.

## Connection

DGIX validate: client TAIG, Facebook CONNECTED, Organic AVAILABLE, Page name TAIG Solutions, paid NOT AVAILABLE. tokenExposed false. No post created by validate.

## Publication PASS

- Intake 42 rejected (not published)
- Intake 43 authorized by Operator, then executed via `POST /api/dgix/acp/43/execute`
- Message unchanged: `... one giant leap for mankind; a larger one for humanity...`
- Meta object/post id: `1258891693979751_122109387345419404`
- DGIX execution_status: executed
- execution row: succeeded
- Duplicate execute: 409
- No access token in client JSON or this folder

## Files

- `pass-record.sanitized.json` — GET intake 43 + health/connection snapshot + duplicate 409 (credential keys stripped; none were present)
- `unit-tests.txt`
- `regression.txt`

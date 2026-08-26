# ADE architecture (ACI-002)

ADE is a **single-operator localhost MVP**. One Next.js process serves the Hub UI and a small health API. There is no microservice split, message bus, or cloud dependency in this foundation.

```text
Browser  →  Next.js (App Router)  →  SQLite file (data/ade.sqlite)
                 └── /api/health
```

## Layers

| Layer | Location | Role |
| --- | --- | --- |
| Hub UI | `src/app/*`, `src/components/*` | Operator shell: identity, navigation, placeholder sections |
| HTTP API | `src/app/api/health` | Confirms process + persistence init |
| Persistence | `src/lib/db.ts`, `src/lib/schema.sql` | Local SQLite, schema v1 |
| Config | `.env.example`, `src/lib/config.ts` | Names for port, DB path, future AI/Meta keys |

Future AI providers, Meta/Facebook, and any Postiz/Mixpost reuse are expected to enter as **adapters behind ADE-owned routes and data**, not as the Hub itself. That work is out of scope for ACI-002.

## Why this shape

- One stack the Operator can run with `npm run dev`
- Component-based UI that later ACIs can fill in
- SQL tables for Source, Goal, Content, Campaign, Approval, Publication, Channel, Metric, Audience Network, Lead, Opportunity, Recommendation without inventing a distributed schema
- File-backed SQLite survives process restart without Docker or Postgres for the local MVP

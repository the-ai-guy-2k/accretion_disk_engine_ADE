# Accretion Disk Engine (ADE)

Localhost MVP **foundation** for TAIG’s Accretion Disk Engine.

ADE is intended to turn real TAIG work into approved content, measure what that content produces, and feed evidence back into better business decisions. **This repository is not that full product yet.**

This tree is the ACI-002 bootstrap: a runnable ADE Hub shell, local SQLite persistence, and Git connection. It does **not** generate content, publish to Facebook, schedule posts, ingest analytics, or embed AI.

## Product identity

# Accretion Disk Engine
**ADE**

Operator philosophy: **Goals → Decisions → Results**

## Current capabilities (honest)

| Area | Status |
| --- | --- |
| ADE Hub shell in the browser | Working |
| Navigation to Dashboard, Sources, Create, Review, Publishing, Analytics, Leads, Intelligence, Settings | Working (shell pages) |
| Local SQLite schema for future entities | Working (empty tables) |
| AI generation | Not implemented |
| Human approval workflow | Not implemented |
| Publishing / scheduling / Facebook | Not implemented |
| Analytics / leads / intelligence | Not implemented |
| Postiz / Mixpost | Not integrated (deferred to later ACI) |

Dashboard cards are **placeholders**. They do not display real campaigns, metrics, or recommendations.

## Technology stack

- **Node.js** 22.5+ (developed on 24.x) — uses built-in `node:sqlite`
- **Next.js** (App Router) + **React** + **TypeScript**
- **SQLite** file at `data/ade.sqlite` (gitignored)
- Single process; no separate API server, Docker, or cloud services required for local run

## Prerequisites

- Node.js `>= 22.5.0`
- npm (bundled with Node)

## Local setup / run

From the authorized project folder:

```text
C:\Users\tim\Documents\business_related\The_AI_Guy\nebula\2 - TAIG2K_SOFTWARE\Accretion_disk_engin_ADE
```

```bash
npm install
npm run dev
```

Open **http://localhost:3000**

Optional:

```bash
copy .env.example .env.local
npm test
npm run db:init
```

Production-style local run after `npm run build`:

```bash
npm start
```

(`npm start` also listens on port 3000.)

## Persistence

On first `/api/health` request (and when the Dashboard/Settings pages load that endpoint), ADE creates `data/ade.sqlite` and schema version `1`.

Restarting the app keeps data in that file. ACI-002 does not write business records; tables start empty except `app_meta`.

See [docs/data-model.md](docs/data-model.md).

## Configuration

Variable **names** are listed in `.env.example`. Do not put secrets in Git. None of the AI or Meta variables are required to start the Hub.

## Directory structure

```text
src/app            Hub routes and /api/health
src/components     App shell, placeholders, status
src/lib            Config, SQLite access, schema
data               Runtime SQLite (gitignored)
docs               Architecture, data model, ACI reports
tests              Persistence foundation test
scripts            Standalone DB init
```

## Git

Authoritative remote:

`https://github.com/the-ai-guy-2k/accretion_disk_engine_ADE.git`

The local folder name `Accretion_disk_engin_ADE` is the workstation path; the GitHub repository name uses `engine`.

## Limitations

- Foundation / shell only
- No authentication
- No hybrid Postiz/Mixpost harvest
- Requires Node with `node:sqlite` (22.5+)
- Default bind is localhost port 3000

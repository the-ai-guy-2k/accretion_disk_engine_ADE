# Accretion Disk Engine (ADE)

The **Accretion Disk Engine (ADE)** is designed to increase a user's social media viewership and online presence by automating repetitive content-management tasks and using AI-assisted analytics to evaluate performance and improve future content. ADE helps users create, review, schedule, publish, measure, and continuously improve social media content from one centralized hub.

**Short intent:** Automate the manual work of social media management and use AI-assisted analytics to continuously improve content, viewership, and online presence.

That is the **product intent**. This repository is an early localhost MVP. Features named above that are not in the capability table below are **not yet implemented**.

TAIG is the **initial user and test environment**. ADE itself is a general product for its users, not a TAIG-only tool.

## Product identity

# Accretion Disk Engine
**ADE**

Operator philosophy: **Goals → Decisions → Results**  
Implemented loop through ACI-006 also includes **Goals → Campaigns → Decisions → Results**. That is current capability, not a rename of the product.

## Current capabilities (honest)

| Area | Status |
| --- | --- |
| ADE Hub shell in the browser | Working |
| Sources (create, list, select) | Working |
| Draft from source (mock/manual generation) | Working |
| Review / edit / approve / reject | Working |
| Publishing queue + mock Facebook adapter | Working |
| Goals (create, progress, Hub) | Working |
| Content associated with a Goal | Working |
| Campaigns (plan + multi-draft from sources) | Working |
| Manual publication results | Working |
| Analytics / Intelligence (deterministic) | Working |
| Live AI generation | Not implemented (mock/manual boundary) |
| Scheduling | Not implemented (queue only) |
| Real Facebook/Meta publishing | Not implemented (mock adapter only) |
| Platform-collected analytics | Not implemented (manual entry only) |
| Live AI-assisted analysis | Not implemented (deterministic boundary; replaceable later) |
| Leads | Not implemented |
| Postiz / Mixpost | Not imported (patterns only, ACI-003) |

The Hub does **not** display live social metrics or fabricated audience/business results. Operator-entered results are labeled as manual.

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
npm run validate:aci004
npm run validate:aci005
npm run validate:aci006
```

Production-style local run after `npm run build`:

```bash
npm start
```

(`npm start` also listens on port 3000.)

## Persistence

On first health/workflow use, ADE creates or upgrades `data/ade.sqlite` (schema **v4** for ACI-006 campaigns, content plans, and multi-draft generation). Restarting the app keeps stored sources, drafts, approvals, publications, goals, campaigns, metrics, and recommendations.

See [docs/data-model.md](docs/data-model.md) and the Nebula record [docs/nebula/data-model/current-data-model.md](docs/nebula/data-model/current-data-model.md).

## Configuration

Variable **names** are listed in `.env.example`. Do not put secrets in Git. None of the AI or Meta variables are required to start the Hub or complete the mock Facebook path.

## Directory structure

```text
src/app            Hub routes and APIs
src/components     App shell and workflow UI
src/lib            Config, SQLite, workflow, channel adapter
data               Runtime SQLite (gitignored)
docs               Architecture, data model, ACI reports
docs/nebula        Governance: ACI/ACR, architecture, data model, workflow
tests              Schema and workflow-gate tests
scripts            DB init and ACI HTTP validation
```

## Engineering documentation (Nebula)

Governance overlay (does not replace the app):

- [docs/nebula/README.md](docs/nebula/README.md)
- Architecture (current truth): [docs/nebula/architecture/current-architecture.md](docs/nebula/architecture/current-architecture.md)
- Branch workflow: [docs/nebula/passdowns/engineering-workflow.md](docs/nebula/passdowns/engineering-workflow.md)
- ACI archive: [docs/nebula/aci/HISTORY.md](docs/nebula/aci/HISTORY.md)
- ACR index: [docs/nebula/acr/INDEX.md](docs/nebula/acr/INDEX.md)

## Git

Authoritative remote:

`https://github.com/the-ai-guy-2k/accretion_disk_engine_ADE.git`

The local folder name `Accretion_disk_engin_ADE` is the workstation path; the GitHub repository name uses `engine`.

### Branches

| Branch | Role |
| --- | --- |
| `feature/aci-###` | Work for one ACI. Not release truth. |
| `deployable` | Validated promotion / release line. |
| `main` | Historical integration line. Do not destroy or rewrite. |

Workflow:

**QEN → ACI → feature/aci-### → CAE implementation → validation → ACR → merge to deployable → remote checkpoint**

Do not treat unvalidated feature branches as the validated ADE state.

## Limitations

- Localhost MVP, not the full product intent
- No authentication
- No live AI, live Facebook publish, scheduling calendar, or platform analytics
- Manual metrics and deterministic recommendations are local decision support only
- Requires Node with `node:sqlite` (22.5+)
- Default bind is localhost port 3000

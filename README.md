# Accretion Disk Engine (ADE)

The **Accretion Disk Engine (ADE)** is designed to increase a user's social media viewership and online presence by automating repetitive content-management tasks and using AI-assisted analytics to evaluate performance and improve future content. ADE helps users create, review, schedule, publish, measure, and continuously improve social media content from one centralized hub.

**Short intent:** Automate the manual work of social media management and use AI-assisted analytics to continuously improve content, viewership, and online presence.

That is the **product intent**. This repository is an early localhost MVP. Features named above that are not in the capability table below are **not yet implemented**.

TAIG is the **initial user and test environment**. ADE itself is a general product for its users, not a TAIG-only tool.

## Product identity

# Accretion Disk Engine
**ADE**

**MVP baseline:** PAPEV ACI-011 **MVP PASS** on `deployable` (product commit `3c18176`).

```text
ADE
├── Standard Operator Workflow
└── DGIX Operator Workspace   (POST-MVP — IN DEVELOPMENT)
       ↓
    Existing ADE Engine
       ↓
    Future Artifact / Social Platform Interfaces
```

Operator philosophy: **Goal → Campaign → Source → Draft → Review → Publishing → Results → Intelligence**  
AI assists. The operator decides. ADE runs the approved workflow.

## Implemented MVP capability

ADE automates repetitive social-media management work and uses AI-assisted analytics to help users improve content, viewership, and online presence.

| Area | Status |
| --- | --- |
| ADE Hub | Working — next-step orientation for the operator journey |
| Goals | Working |
| Campaigns (plan + multi-draft from sources) | Working |
| Sources | Working |
| Draft from source (manual) | Working |
| Live AI content generation (source-grounded drafts) | Working |
| Review / edit / approve / reject | Working — AI cannot skip this |
| Publishing queue + mock Facebook adapter | Working |
| Manual publication results | Working |
| Analytics (deterministic rankings + Goal progress) | Working |
| Live AI-assisted analysis / recommendations | Working — advisory, not a guarantee |
| DGIX Operator workspace | Working — orientation workspace; not a complete DGIX product |
| Persistence (local SQLite) | Working |

The Hub does **not** display live social metrics or fabricated audience/business results. Operator-entered results are labeled as manually entered.

## Future / post-MVP capability (not implemented)

| Area | Status |
| --- | --- |
| Calendar scheduling | Not implemented (queue only) |
| Real Facebook / Meta authentication, publishing, or metrics | Not implemented (mock adapter + manual results only) |
| Leads / CRM | Not implemented (placeholder) |
| Paid targeting / distribution optimization | Not implemented |
| DGIX (ACP artifact intake, ACRP results export, real Facebook, optimization) | POST-MVP — IN DEVELOPMENT. Workspace exists; intake, Facebook, and export are not implemented |
| Postiz / Mixpost | Not imported (patterns only, ACI-003) |
| Authentication | Not implemented |

Do not treat DGIX as complete. Do not treat real Facebook integration, automatic platform metrics, or paid distribution as present.

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
npm run validate:aci008
npm run validate:aci009
npm run validate:aci010
npm run validate:aci011
npm run validate:aci-dgix-012
```

Production-style local run after `npm run build`:

```bash
npm start
```

(`npm start` also listens on port 3000.)

## Persistence

On first health/workflow use, ADE creates or upgrades `data/ade.sqlite` (schema **v5** for ACI-008 live AI generation metadata on drafts; campaigns remain v4 tables). Restarting the app keeps stored sources, drafts, approvals, publications, goals, campaigns, metrics, and recommendations.

See [docs/data-model.md](docs/data-model.md) and the Nebula record [docs/nebula/data-model/current-data-model.md](docs/nebula/data-model/current-data-model.md).

## Configuration

Variable **names** are listed in `.env.example`. Do not put secrets in Git.

**Live AI content generation** (Create → Generate with AI) and **live AI analytics** (Intelligence → Analyze with AI) use the same server-side credentials:

- `ADE_AI_PROVIDER` (default `openai`)
- `ADE_AI_API_KEY` (required for live generation and live analysis; OpenAI also accepts `OPENAI_API_KEY` if this is empty)
- `ADE_AI_MODEL` (default `gpt-4o-mini`)
- `ADE_AI_BASE_URL` (default `https://api.openai.com/v1`)
- `ADE_AI_TIMEOUT_MS` (default `45000`)

Restart ADE after changing credentials. The Hub still starts without them; Generate with AI and Analyze with AI then show an unconfigured state. Mock/manual drafts and deterministic analytics still work. Meta variables are not required for the mock Facebook path. Publication results remain **manually entered**; ADE does not collect Facebook/Meta analytics.

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
| `feature/aci-###` | Work for one MVP ACI. Not release truth. |
| `feature/dgix/aci-dgix-###` | Work for one DGIX ACI. Not release truth. |
| `deployable` | Validated promotion / release line. |
| `main` | Historical integration line. Do not destroy or rewrite. |

Workflow:

**QEN → ACI → feature branch → CAE implementation → validation → ACR → merge to deployable → remote checkpoint**

Do not treat unvalidated feature branches as the validated ADE state.

## Limitations

- Localhost MVP, not the full product intent
- No authentication
- Live AI drafts (Create) and live AI analysis (Intelligence) when credentials are configured; deterministic analytics remain the ranking/progress baseline
- No live Facebook publish, scheduling calendar, or platform analytics
- Manual metrics are operator-entered; they are not Meta-supplied numbers
- Requires Node with `node:sqlite` (22.5+)
- Default bind is localhost port 3000

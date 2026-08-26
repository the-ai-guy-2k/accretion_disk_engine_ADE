# ACI-003 — ADE Postiz + Mixpost Hybrid Harvest Report

**Product:** Accretion Disk Engine (ADE)  
**QEN:** Social Engine Build QEN  
**Date:** 2026-08-26  
**Type:** Architecture / reuse assessment  
**Implementation:** none — no Postiz or Mixpost code was copied into ADE  
**ADE path:** `C:\Users\tim\Documents\business_related\The_AI_Guy\nebula\2 - TAIG2K_SOFTWARE\Accretion_disk_engin_ADE`

**References inspected (read-only, not vendored):**

| System | Repository | License | Stack (observed) |
| --- | --- | --- | --- |
| Postiz | https://github.com/gitroomhq/postiz-app | AGPL-3.0 | TypeScript monorepo: Next.js frontend, NestJS API, Temporal orchestrator, Prisma/PostgreSQL, Redis |
| Mixpost Lite | https://github.com/inovector/mixpost | MIT | Laravel PHP package + Vue 3 / Inertia, Horizon jobs, Facebook/X/Mastodon in Lite |

---

## 1. Postiz Assessment

Postiz is a full **social scheduling product**, not a library. It is sized and operated as a distributed app: `apps/frontend`, `apps/backend`, `apps/orchestrator`, plus `apps/commands`, `apps/extension`, `apps/sdk`. Docs describe Controller → Service → Repository, Temporal workflows for schedule/publish/token refresh, S3 (or compatible) media, JWT/OAuth/CASL.

### Relevant implementation patterns

| Area | What exists | ADE relevance |
| --- | --- | --- |
| Channel integration | `SocialProvider` interface in `libraries/nestjs-libraries/src/integrations/social/social.integrations.interface.ts`; providers live under `.../integrations/social/` (28+ platforms) | **Pattern:** one adapter type with `generateAuthUrl`, `authenticate`, `refreshToken`, `post` |
| Facebook/Meta | `facebook.provider.ts` — Graph API OAuth, long-lived token exchange, Page listing (`isBetweenSteps`), publish | **Learn:** Meta Page vs user token split; do not copy the file (AGPL) |
| Composer | Frontend calendar/composer; provider `editor` types (`normal` / markdown / html) | UX ideas only; ADE Create is source-grounded, not a Buffer clone |
| Media | S3 / Transloadit in production shape | Too heavy for localhost MVP; keep local files later |
| Scheduling / queue | Temporal workflows; durable retry; `missingPostWorkflow` | **Do not adopt Temporal** for single-operator SQLite MVP |
| Publish status | `post` vs `postPending` + `checkPostStatus` + `finalizePost` (`pending` / `ready` / `completed`) | **Adapt:** async Facebook (especially video) needs a pending state so ADE never lies about “published” |
| Analytics | Provider `analytics` / `postAnalytics` | Later Channel 01 metrics import, not ADE Intelligence |
| AI | Product is “agentic” scheduling / generation | Different mission than ADE (real TAIG sources + human approval). Do not harvest their AI loop |
| API | NestJS REST; public API / Node SDK / n8n | ADE already has Next.js route handlers; do not add Nest |
| Auth / config | JWT, long env list of per-platform app IDs | ADE Settings already reserved `META_*` names |
| Frontend | Next/React/Tailwind custom UI | Same family as ADE, but **do not reskin Postiz** |

### Modules that look useful **as patterns only**

- `SocialProvider` / `SocialAbstract` / `IntegrationManager` shape  
- Facebook two-step Page selection  
- Pending-publish contract (avoid duplicate finalize)  
- Per-provider rate / `maxConcurrentJob`

**Not useful to ADE as a dependency:** Temporal, Prisma/Postgres, Redis, the whole monorepo, marketplace/team “buy posts”, Chrome extension.

**Feasibility of embedding Postiz:** technically possible only as a **separate product** (Docker + Postgres + Redis + Temporal). That would make the Operator run two systems and would fight ADE Hub ownership. **Rejected for localhost MVP.**

---

## 2. Mixpost Assessment

Mixpost **Lite** (this GitHub repo) is a self-hosted Buffer-style manager. It is a **Laravel package** (`inovector/mixpost`), not a Node app. Commercial **Pro/Enterprise** add Instagram, LinkedIn, YouTube, TikTok, etc.; those are **out of license/scope** for harvest from Lite.

### Relevant implementation patterns

| Area | What exists | ADE relevance |
| --- | --- | --- |
| Self-hosted architecture | One Laravel app, Vue pages, Horizon workers | Simpler than Postiz, but **PHP** — cannot drop into ADE Next.js |
| Accounts | `src/Models/Account.php`; Add Facebook Page/Group Vue | Channel 01 = Facebook Page (Groups optional later) |
| Composer | `resources/js/Pages/Posts/CreateEdit.vue`; `PostVersion` per network | ADE Review should edit **one ADE content item** with optional channel variants later |
| Calendar / schedule | `Calendar.vue`, month/week components; `PostStatus` + `PostScheduleStatus` | Strong UX for **Publishing** subsection, not for ADE home |
| Queue / publish | `src/Jobs/AccountPublishPostJob.php` — cancel, history, service off, unauthorized, rate-limit `release()` | **Best harvestable job semantics** (reimplement in TS) |
| Media | `src/Models/Media.php`, Media page, Unsplash integration | Local media table later; skip Unsplash for MVP |
| Analytics | `FacebookInsight`, `ImportFacebookInsightsJob`, `ImportFacebookPageFollowersJob`, Reports Vue | Pattern for **pulling** Page insights; ADE must label simulated vs real (`metrics.is_simulated` already exists) |
| Operator UX | Pages: Dashboard, Calendar, Posts, Media, Accounts, Services, Settings | Commodity IA — map into ADE Hub sections, do not become Mixpost |
| Provider abstraction | `src/Abstracts/SocialProvider.php`, `src/SocialProviderManager.php`, `src/SocialProviders/Meta/*` | **Adapt:** OAuth / Page resources / rate-limit as separate concerns |
| Config | `config/mixpost.php` `social_provider_options` (Facebook 5000 chars, 10 photos, 1 video) | Encode as ADE channel rules, not copy PHP |
| Data model | `Post`, `PostVersion`, `Account`, `Audience`, `Metric`, `Tag` | Closer to a scheduler than ADE (no Goal/Source/Approval/Lead/Opportunity) |

Lite Facebook support is real and maintained (changelog through Graph **v25**). `FacebookPageProvider` is a thin Meta subclass (page token + `facebook.com/{provider_post_id}` URL).

**Feasibility of embedding Mixpost:** would require PHP, Composer, Laravel, Horizon/Redis, Vue/Inertia — a second runtime beside ADE. **Rejected.** MIT would allow a **translated** TypeScript adapter inspired by Lite Meta concerns, with copyright notice if substantial code were ported. ACI-003 does **not** port it.

---

## 3. Licensing Findings

### Postiz — AGPL-3.0

- GitHub `license.key`: `agpl-3.0`. README: source under AGPL-3.0.
- **Direct reuse / modification / linking of Postiz source into ADE** would likely require ADE (as a network-facing combined work) to be offered under AGPL and to ship corresponding source to operators who use it over a network.
- **Unsuitable** for ADE-as-TAIG-product unless the QEN explicitly accepts AGPL for all of ADE.
- **Allowed without copying their code:** reading architecture, implementing ADE’s own adapter against **Meta’s public Graph API**, using the *idea* of a provider interface.

### Mixpost Lite — MIT

- `LICENSE.md`: MIT, Copyright 2022–present Dima Botezatu / Inovector.
- **May** use, copy, modify, merge, including commercially, **if** copyright notice and license are kept on substantial portions.
- **Mixpost Pro/Enterprise is not this MIT tree.** Do not take Pro-only platforms or features from paid editions.
- Practical reuse of Lite **PHP/Vue** inside ADE is still a **stack mismatch**. Prefer ADE-native TypeScript + attribution only if a future ACI ports a *small* Lite-derived unit.

### Meta / Facebook Platform

- Publishing requires a Meta app, Page permissions, and often App Review. That is independent of Postiz/Mixpost.
- ADE already reserved env **names** (`META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`) with empty values.

### Recommendation

| Action | Postiz | Mixpost Lite |
| --- | --- | --- |
| Copy source into ADE | **No** (AGPL + complexity) | **Not for MVP** (PHP; Pro boundary) |
| Fork as ADE | **No** | **No** |
| Run as sidecar | **No** for MVP | **No** for MVP |
| Adapt patterns | **Yes** | **Yes** (preferred reference for Facebook Page + jobs + calendar) |
| Learn UX | **Yes**, carefully | **Yes**, map into Hub |

This is not legal advice; QEN should treat AGPL as a **hard stop on vendoring Postiz**.

---

## 4. Useful Components / Patterns

Harvest **ideas**, not files:

1. **Channel adapter interface** — authenticate, refresh, publish, poll pending, fetch metrics, report errors.  
2. **Publication state machine** — Mixpost: `DRAFT / SCHEDULED / PUBLISHED / FAILED` plus schedule `PENDING / PROCESSING / PROCESSED`. ADE should add **Approved** (human) *before* schedule, and **Manual-ready** when Graph is unavailable.  
3. **Job guards** — Mixpost `AccountPublishPostJob`: skip if cancelled/history; fail clearly if token dead; retry on rate limit; persist errors on the post-account link; never mark published on error.  
4. **Meta concern split** — Mixpost `ManagesFacebookOAuth`, `ManagesFacebookPageResources`, `ManagesRateLimit`.  
5. **Two-step Facebook connect** — Postiz `isBetweenSteps` + page picker.  
6. **Async publish** — Postiz pending/finalize so video/processing does not duplicate.  
7. **Channel limits table** — Mixpost `social_provider_options`.  
8. **Calendar as a Publishing view** — Mixpost month/week calendar.  
9. **Per-account external post URL** — Mixpost `externalPostUrl`.  
10. **Insights import jobs** — Mixpost Facebook insights/followers jobs (later Analytics).

**Do not harvest:** Temporal, Horizon-as-required-infra, 28-platform matrix, team marketplaces, Unsplash, Postiz AI agents, Mixpost Pro networks.

---

## 5. ADE Capability Comparison

ADE today (ACI-002): Hub shell + empty SQLite schema. No publisher, no AI, no approval workflow.

| ADE area | Postiz | Mixpost Lite | ADE today |
| --- | --- | --- | --- |
| Sources | Not a core object | Not a core object | Table only |
| Create | Composer + AI scheduling features | Posts/CreateEdit + versions | Placeholder |
| Review / Approval | Team comment, not ADE-style mandatory publish gate | Collaboration in Pro narrative; Lite is scheduler | Placeholder + `approvals` table |
| Publishing | Strong | Strong | Placeholder + `publications` |
| Scheduling | Temporal | Horizon + schedule statuses | `scheduled_at` column only |
| Channels | 28+ providers | FB Page/Group, X, Mastodon in Lite | `channels` empty |
| Media | S3-centric | Media library | Not implemented |
| Analytics | Provider analytics | Insights jobs + reports | `metrics` empty |
| Goals | Not ADE’s loop | Not ADE’s loop | Table only |
| Audience Network | “Build an audience” marketing language | `Audience` / followers import | ADE concept; empty table |
| Leads / conversations | Mentioned in marketing | Not ADE attribution | Table only |
| Business attribution | Not ADE-owned | Not ADE-owned | Table only |
| Intelligence | Agent/AI product | Templates/hashtags | Placeholder |
| Hub UI | Postiz app chrome | Mixpost app chrome | ADE shell **exists** |

Commodity overlap is **channel, compose-for-network, schedule, publish, media, page analytics**. Differentiation is **everything above the adapter**.

---

## 6. REUSE / ADAPT / BUILD / DEFER Matrix

Classification for **ADE’s next implementation**, not for what those products do internally.

| Area | Strategy | Why |
| --- | --- | --- |
| Sources | **BUILD ADE-NATIVE** | Neither product models TAIG provenance or marketing eligibility. |
| Create | **BUILD ADE-NATIVE** (+ **LEARN FROM** composer constraints) | Drafts must stay tied to sources. Use Mixpost/Postiz only for length/media rules. No Postiz AI. |
| Review / Approval | **BUILD ADE-NATIVE** | Mandatory human authority is ADE governance. Do not reuse their “schedule from composer” as publish. |
| Publishing | **ADAPT COMPONENT/PATTERN** | Queue, statuses, per-channel result, external post id/URL. Implement in ADE TS against `publications`. **REUSE CODE: no.** |
| Scheduling | **ADAPT COMPONENT/PATTERN** | Due-time + retry/rate-limit semantics from Mixpost jobs. **DEFER** Temporal/Horizon/Redis. Localhost: poll SQLite `scheduled_at` (or later a tiny in-process timer). |
| Channels | **ADAPT COMPONENT/PATTERN** | Provider interface + Facebook Page as Channel 01. ADE-written adapter. |
| Media | **DEFER** (minimal **BUILD** when Create needs an image) | Full libraries (S3, Unsplash, conversions) are extra. Store a local path on content when needed. |
| Analytics | **ADAPT COMPONENT/PATTERN** then **DEFER** depth | Insights *import shape* later; do not fake numbers. Keep `is_simulated`. |
| Goals | **BUILD ADE-NATIVE** | ADE loop owner. |
| Audience Network | **BUILD ADE-NATIVE** | Not Mixpost follower tables. May *later* ingest follower counts as one input, never as success definition. |
| Leads / conversations | **BUILD ADE-NATIVE** | Scheduler products are not a CRM/attribution path. |
| Business attribution | **BUILD ADE-NATIVE** | ADE-owned. |
| Intelligence / recommendations | **BUILD ADE-NATIVE** | Grounded in ADE evidence (KEEP/CHANGE/STOP/TEST NEXT later). |
| Hub UI | **BUILD ADE-NATIVE** | Keep current shell. **LEARN FROM** calendar/queue **inside Publishing**. |

**REUSE CODE:** **none** for ACI-004. Revisit Mixpost MIT *port of a tiny Meta helper* only if Graph work is blocked and legal review accepts attribution; still not a Mixpost embed.

---

## 7. Proposed Hybrid Architecture

Keep ADE’s current single Next.js + SQLite process. Put social plumbing **behind ADE**, not beside it.

```text
ADE Hub UI (Next.js — ADE-owned)
  Dashboard · Sources · Create · Review · Publishing · Analytics · Leads · Intelligence · Settings
        │
        ▼
ADE Workflow + Intelligence (ADE-owned)
  Goal → Source → Content → Approval → Publication intent
  Recommendations, leads, attribution
  Never skip Approval for external publish
        │
        ▼
ADE Channel Adapter (ADE-owned TypeScript contract)
  connect / refresh / publish / pollStatus / fetchMetrics / manualConfirm
        │
        ▼
Adapters (ADE-written, pattern-informed; not Postiz/Mixpost binaries)
  ManualFacebookAdapter (MVP boundary)
  GraphFacebookAdapter (when Meta app is ready)
  MockAdapter (tests)
        │
        ▼
Facebook Page (Channel 01) / future channels
```

**Boundaries**

| Boundary | Rule |
| --- | --- |
| Hub | ADE chrome and **Goals → Decisions → Results** only |
| Workflow | ADE decides *whether* something may publish |
| Adapter | Only *how* a payload hits a network (or manual confirm) |
| Facebook | No Graph types in Hub components; no Hub imports of Meta SDK |
| Persistence | ADE SQLite remains source of truth; adapter may not own operator records |
| Orchestration | No Temporal/Postgres/Redis required for MVP |

This is the fastest path: fill ADE workflow, add a **manual/mock publish boundary**, then a thin Graph adapter — without inheriting Postiz’s cluster or Mixpost’s PHP stack.

---

## 8. UI/UX Recommendations

Do **not** copy Postiz or Mixpost chrome.

Governing loop: **Goals → Decisions → Results**.

| ADE section | How it should feel | What to borrow as *behavior*, not pixels |
| --- | --- | --- |
| Dashboard | Goal status, **pending decisions** (approvals), last truthful results | Mixpost/Postiz dashboards are metric-first; ADE should be decision-first |
| Create | “Transform this **source** into a draft for this **goal**” | Platform length/media warnings (Mixpost options) |
| Review | The **decision** screen: edit, approve, reject, return | Not a calendar. Approval is the product |
| Publishing | Queue + optional month/week calendar **after** approval | Mixpost Calendar/Posts list; statuses Draft/Scheduled/Published/Failed + Manual-ready |
| Analytics | Results for approved+published (or manual-confirmed) items | Mixpost Page reports later; always distinguish real vs manual |

Create, Review, and Publishing should share the same content record and show **which goal and source** it came from (provenance strip). That is how they stay one Hub instead of three tools.

---

## 9. Dependency Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Vendoring Postiz (AGPL) | ADE license contamination; huge ops surface | Do not copy or fork |
| Embedding Mixpost PHP | Second runtime, Horizon, Operator complexity | Do not embed |
| Mixing Mixpost Pro into Lite harvest | License/product violation | Lite GitHub only |
| Adopting Temporal/Redis/Postgres | Destroys localhost MVP simplicity | SQLite poller / explicit manual publish |
| Copying provider code vs Meta docs | Copyright + stale Graph versions | Implement against current Graph docs; Mixpost changelog shows version churn (v17→v25) |
| Meta App Review | Blocks live Facebook | Documented **manual/mock** boundary (already in GVCA) |
| Treating follower import as Audience Network success | Wrong ADE metric hierarchy | ADE-owned interpretation layer |
| Reskinning either UI | ADE becomes “another scheduler” | Hub + loop stay ADE |
| Postiz “AI social agent” | Fabrication risk vs source-of-truth rule | ADE AI only on authorized sources, later ACI |

No isolated runtime PoC of Postiz/Mixpost Docker was required: stack, license, and embed cost are already disqualifying for MVP. Feasibility of **pattern adaptation in ADE TypeScript** is **yes**.

---

## 10. Recommended Scope for ACI-004

**Name suggestion:** ADE-native Source → Draft → Review/Approve, plus Publishing queue with **manual Facebook boundary**.

**In scope**

1. Operator can create a **Source** (real text/notes; eligibility field).  
2. Operator can create a **Content** draft linked to a source (and optional goal) — **no AI required yet** (avoids blocking on keys).  
3. **Review:** edit, approve, reject; only **Approved** may enter Publishing.  
4. **Publishing list/queue** using ADE `publications` statuses; schedule datetime stored.  
5. **Manual/mock adapter:** “Ready for Facebook” / “Operator confirmed published” + optional URL; never auto-mark published.  
6. Document ADE `ChannelAdapter` contract in `docs/` (TypeScript interface allowed; no Graph publish).  
7. Keep Hub; fill shells; no Postiz/Mixpost import.

**Out of scope (later ACIs)**

- Graph Facebook live publish  
- Temporal / Mixpost embed  
- AI generation  
- Analytics harvest  
- Extra networks  
- UI redesign to look like Postiz or Mixpost  

**Success for the QEN**

> Harvest **patterns** (adapter, statuses, job guards, calendar-as-publishing-view, Meta Page OAuth *shape*). Keep **ADE-native** Hub, goals, sources, approval, attribution, intelligence. **Do not reuse Postiz or Mixpost code** for the localhost MVP. Fastest strong MVP: ADE workflow + honest manual Channel 01, then a thin ADE-written Graph adapter.

**ACI-003 status:** complete. Stopped.

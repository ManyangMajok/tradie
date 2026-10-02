> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 00 — README: How to use this documentation pack

This folder contains the full specification for building the tradie membership platform. It is designed to be read and executed by an AI coding agent (Claude Code) but is also readable by humans.

---

## Reading order by task

**Don't read all 10 docs at once.** Pull only what you need for the current task.

### If you're setting up the project for the first time

1. `CLAUDE.md` (root) — operating rules
2. `01-product-spec.md` — what we're building
3. `02-architecture.md` — stack and topology
4. `09-development-guide.md` — folder structure and conventions
5. `10-build-phases.md` — what to build first

### If you're building a database migration or model

1. `03-database.md`
2. `01-product-spec.md` (relevant section only)
3. `09-development-guide.md` (naming conventions)

### If you're building an API endpoint

1. `04-api-spec.md` (for the specific endpoint)
2. `03-database.md` (for the models involved)
3. `08-notifications.md` (if the endpoint triggers notifications)

### If you're building the dispatch engine or touching lead flow

1. `05-dispatch-engine.md` — **read entirely, this is the heart of the product**
2. `03-database.md` (jobs, job_offers, tradie_subscriptions tables)
3. `08-notifications.md` (lead offer SMS/email)

### If you're building a frontend page

1. `06-frontend-spec.md` (for the specific page)
2. `04-api-spec.md` (for endpoints the page calls)
3. `01-product-spec.md` (for business rules shown in UI)

### If you're integrating Stripe, Twilio, Resend, or handling file uploads

1. `07-integrations.md` (for the specific service)
2. `08-notifications.md` (if it's Twilio or Resend)

### If you're building the mobile apps (Phase 2 only)

1. `11-mobile-apps-spec.md` — read entirely before starting (§12 design system + §13 Stitch usage are mandatory)
2. `design-mapping.md` — lookup table from screen to spec section to design file
3. `design/<app>/<screen-id>.tsx` — the Stitch design reference for the screen you're building
4. `04-api-spec.md` — for the endpoints the mobile apps call (note: the `routes/api.php` surface which is empty at MVP)
5. `08-notifications.md` — for push notification triggers
6. `09-development-guide.md` — for cross-cutting code conventions

**Do not start mobile work until web MVP is live.** The mobile apps depend on the web's dispatch engine, the API surface, and the Stripe/notification integrations — all of which must be battle-tested in production first.

---

## Document conventions

### Markers you will encounter

- **`DECISION REQUIRED: <question>`** — A product decision has not been made. Stop work on the affected feature and surface the question to the user. Do not guess.
- **`AGENT NOTE: <guidance>`** — A hint specifically aimed at the building agent. Read and respect.
- **`RATIONALE: <reason>`** — Why a choice was made. Do not overturn without asking.
- **`OUT OF SCOPE`** — Explicitly not part of MVP. Do not build.
- **`PHASE 2`** / **`PHASE 3`** — Deliberately deferred. See `10-build-phases.md`.

### Code examples

Code examples in these docs are **illustrative, not authoritative**. The doc's prose describes the behaviour; the code is a hint. If prose and code conflict, prose wins and you should ask.

### Currency

All dollar amounts are AUD unless stated otherwise. Stripe is configured for AUD.

### Time and dates

All timestamps are stored in UTC. All display is in Australia/Perth (WA) unless the user's timezone is set. The MVP assumes Perth-only initially; see `DECISION REQUIRED: geographic scope` in `01-product-spec.md`.

---

## What's in each doc (expanded)

**`CLAUDE.md`** (in project root, not in docs/) — the agent's persistent operating instructions. Read automatically by Claude Code.

**`00-README.md`** — this file.

**`01-product-spec.md`** — the product. User roles, business rules, non-negotiables, plan structures, terminology. The "what" and "why."

**`02-architecture.md`** — the stack, service topology, environment variables, deployment layout, local dev setup.

**`03-database.md`** — every table, column, type, constraint, index, foreign key. Migration-ready. Includes seed data strategy.

**`04-api-spec.md`** — every endpoint. Path, HTTP verb, auth requirements, request body schema, response schema, error codes. Grouped by user role.

**`05-dispatch-engine.md`** — how leads are matched to tradies. Scoring algorithm, state machine, timing windows, edge cases, failure modes. This is the document you must read most carefully.

**`06-frontend-spec.md`** — Inertia pages, route map, component hierarchy, form validation rules, state management strategy. Maps to the wireframes.

**`07-integrations.md`** — Stripe (subscriptions, webhooks, Cashier), Twilio (SMS, delivery receipts), Resend (email, templates, webhooks), local disk file storage, Sentry (error tracking).

**`08-notifications.md`** — every message the system sends. Trigger, channel, template, variables, retry policy.

**`09-development-guide.md`** — folder structure, naming conventions, testing expectations, git workflow, coding standards, what "done" means.

**`10-build-phases.md`** — phased build order. Phase 1 (MVP), Phase 2, Phase 3. Each phase has acceptance criteria the agent must verify before moving on.

**`11-mobile-apps-spec.md`** — Phase 2 mobile apps. Two React Native apps (tradie + member) in a shared monorepo with pnpm workspaces. Page-by-page screen specs, shared packages, push notifications, build and release pipeline. Do not start this until web MVP is in production.

**`design-mapping.md`** — lookup table that maps each mobile screen to its spec section AND its Stitch design file. Used when building mobile screens so the agent knows which design file to look at.

**`design/`** — folder containing Stitch-exported React Native code for every mobile screen. These are visual references, not production code. See `design/README.md` for usage.

---

## Meta: keeping docs in sync with code

- If you (agent or human) discover a doc is wrong or incomplete, **update the doc in the same commit as the code change**. Stale docs are worse than no docs.
- If a `DECISION REQUIRED` gets resolved in conversation, update the relevant doc to remove the marker and record the decision.
- Don't let the code and docs drift. If they disagree, the docs are what a new agent will believe.

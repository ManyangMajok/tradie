> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# AGENTS.md — Agent Operating Instructions

**This file is read automatically by Codex on every session. It is the source of truth for how you (the agent) work in this repository.**

You are helping build a membership-based tradie dispatch platform. This file tells you what the project is, where to find detailed context, and how to behave.

---

## 1. Project summary (one paragraph)

A web platform where homeowners and investors pay an annual membership to get fast, trusted tradies with no call-out fees and a member discount. Tradies pay an annual subscription to receive member jobs routed to them by a scoring-based dispatch engine. The platform tracks every lead, acceptance, completion, and dollar value so that good tradies can be retained and poor ones deprioritised. The business value lives in the quality of the dispatch engine and the honesty of the performance data.

---

## 2. Your reading order

Before you write any code, read `docs/00-README.md`. It tells you which document to load for any given task. **Do not try to hold all 11 documents in context simultaneously** — read the ones the task requires.

The docs live in `docs/` and are numbered:

- `00-README.md` — How to use this pack. **Always read first.**
- `01-product-spec.md` — What we're building, business rules, user roles.
- `02-architecture.md` — Stack, deployment, system topology.
- `03-database.md` — Full Postgres schema, migrations, seeders.
- `04-api-spec.md` — Every endpoint, request/response, errors.
- `05-dispatch-engine.md` — The scoring algorithm. **The most important doc.**
- `06-frontend-spec.md` — Routes, pages, component hierarchy, forms (web).
- `07-integrations.md` — Stripe, Twilio, Resend, local disk, Sentry.
- `08-notifications.md` — Every SMS, email, push, in-app message.
- `09-development-guide.md` — Folder structure, conventions, testing, git.
- `10-build-phases.md` — Phased build order with acceptance criteria.
- `11-mobile-apps-spec.md` — React Native apps (tradie + member, monorepo). **Phase 2 only — do not build until web MVP ships.**
- `design-mapping.md` — lookup table: screen → spec section → design file. **Read when building any mobile screen.**
- `design/` — Stitch-exported React Native code for every screen (visual references only; never import, never edit).

---

## 3. Hard rules (do not violate)

1. **Never invent business logic.** If a rule is not written in these docs, stop and ask. Do not fill gaps with what "seems reasonable."
2. **Never skip a `DECISION REQUIRED` marker.** When you encounter one in the docs, stop work on that feature and surface the decision to the user.
3. **Never commit secrets.** No API keys, tokens, credentials, or `.env` values in git. Use `.env.example` with placeholders.
4. **Never run destructive database commands in production.** No `migrate:fresh`, `db:wipe`, or equivalent against a non-local environment.
5. **Always follow the conventions in `09-development-guide.md`.** Folder structure, naming, and test expectations are not negotiable.
6. **Always write tests for dispatch logic and financial calculations.** See `09-development-guide.md` for coverage expectations.
7. **Always use database transactions for multi-step writes** (job creation, subscription changes, completion reports).
8. **Always use Laravel's built-in mechanisms before reaching for a package.** Form Requests, Policies, Events, Listeners, Jobs, Notifications, Broadcasting. Adding a package needs justification.

---

## 4. Stack (locked)

- **Backend:** Laravel 13 (PHP 8.3+)
- **Frontend:** React 19 + Inertia.js v3 + TypeScript 6
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL 16+
- **Cache/Queue:** Redis 7+
- **WebSockets:** Laravel Reverb (first-party)
- **Queue monitor:** Laravel Horizon
- **Payments:** Stripe (Cashier)
- **SMS:** Twilio
- **Email:** Resend (via `resend/resend-laravel`)
- **File storage:** Local disk (`storage/app/private`) at MVP — migrate to R2 in Phase 2 if needed
- **Error tracking:** Sentry
- **Hosting:** GoDaddy VPS (Ubuntu 24.04 LTS, min 4GB/2vCPU), manually provisioned — see `PROVISIONING.md`

If a task would require deviating from this stack, stop and ask.

---

## 5. How to approach any task

1. **Read the relevant doc(s)** first. Do not assume context you don't have.
2. **State your plan** in one short paragraph before writing code for any non-trivial task.
3. **Ask when you are uncertain.** Prefer one clarifying question over three wrong assumptions. Do not ask three questions when one will do.
4. **Write the test first** for dispatch logic, money handling, and state transitions.
5. **Commit in small, focused units.** One feature per PR. Message format: `[phase-N] <verb>: <what>`, e.g. `[phase-1] feat: add member subscription model`.
6. **Verify before moving on.** Run `php artisan test`, `npm run build`, and the linter before you consider a task done.

---

## 6. When to stop and ask

Stop and ask the user if:

- A `DECISION REQUIRED` marker applies to your task.
- A doc is contradictory or incomplete for the scope you're working on.
- You are about to add a third-party package not listed in Section 4.
- You are about to change a public API contract defined in `04-api-spec.md`.
- You are about to modify the dispatch engine logic in `05-dispatch-engine.md`.
- You need to touch a production environment.

Stop and ask is cheaper than stop and rebuild.

---

## 7. Communication style with the user

- Be direct. Skip preamble.
- Surface problems the moment you see them, not at the end.
- When you make a non-obvious decision, state it in one line and explain why.
- When you write code, explain the parts that aren't self-evident.
- Use Australian English spelling in user-facing copy (colour, honour, organise) because the target market is Australia. Code identifiers stay American English by convention (color prop on components, etc.).

---

## 8. What "done" means

A task is done when:

- Code compiles and passes the linter.
- Tests you wrote pass, and pre-existing tests still pass.
- The behaviour matches what's written in the relevant doc.
- You've updated the doc if you discovered it was wrong or incomplete.
- You've committed with a clear message.
- You've told the user what you did and what's next.

Not before.

# 10 — Build Phases

**Status:** Canonical. The agent builds in this order. Each phase has acceptance criteria that MUST be green before moving on.

---

## 0. Philosophy

Ship a working spine fast. Fill in features along that spine. Never build feature X before the dispatch engine works end-to-end.

The critical path is:
- A member can sign up, subscribe, add a property.
- A tradie can apply, be approved, subscribe.
- A member can submit a job.
- The dispatch engine offers it to a tradie.
- The tradie can accept it.
- The tradie can mark it complete.
- The member can review + confirm benefits.

Everything else is scaffolding on top. Build that critical path first, with minimum-viable UX, then iterate.

---

## Phase 0 — Setup (1–2 days)

**Goal:** A bootable Laravel app with our stack installed, CI green, one dummy page rendering.

**Tasks:**
1. `composer create-project laravel/laravel tradify` (Laravel 13).
2. Add `.env.example` with the full variable set from `02-architecture.md §4`.
3. Install Inertia + React + TypeScript + Tailwind + Vite.
4. Install Cashier, Horizon, Reverb, Sanctum, Pint, Pest.
5. Install Sentry, Twilio SDK, Resend for Laravel.
6. Set up Docker Compose / Sail with Postgres 16, Redis 7, Reverb, Mailpit.
7. Create the skeleton folder structure from `09-development-guide.md §1`.
8. Set up GitHub repo + CI pipeline (`test`, `lint`, `build`).
9. Create the first Inertia page: `/` → "Tradify coming soon".
10. Write the CLAUDE.md doc to project root. Link `docs/` folder.
11. Create `deploy/` folder with empty shell scripts: `provision.sh`, `deploy.sh`, `backup.sh`. Populated during Phase 0.5.
12. Create `PROVISIONING.md` at repo root with full provisioning runbook.

**Acceptance:**
- [ ] `./vendor/bin/sail up -d` boots successfully on a clean checkout.
- [ ] `sail npm run dev` serves the homepage.
- [ ] `sail artisan reverb:start` and `sail artisan horizon` run without errors.
- [ ] `sail artisan test` passes (zero tests).
- [ ] `sail artisan pint --test` passes.
- [ ] `sail npm run build` produces a production bundle under 200kb gzipped.
- [ ] CI runs on PRs and blocks merge on failure.
- [ ] `CLAUDE.md` is in project root and loaded by Claude Code.

---

## Phase 0.5 — VPS provisioning (1 day, before or in parallel with Phase 1)

**Goal:** A running, secured GoDaddy VPS ready to accept a first deploy. Does not require app code to be feature-complete.

**Tasks:**
1. Buy GoDaddy VPS (minimum 4 GB RAM / 2 vCPU / 80 GB SSD, Ubuntu 24.04 LTS).
2. Buy domain at GoDaddy (or wherever). Point A record at VPS IP.
3. SSH into VPS as root, change root password.
4. Follow `PROVISIONING.md` in the repo root. The script installs:
   - PHP 8.3 + required extensions
   - PostgreSQL 16 + create `tradify` database and user
   - Redis 7
   - Nginx with the Reverb WebSocket proxy config
   - Node 20 (for asset builds)
   - Supervisor
   - Certbot (Let's Encrypt SSL)
   - UFW firewall configured
   - Fail2ban for SSH
   - A non-root `deploy` user with SSH key auth
   - Log rotation for Laravel logs
5. Create Stripe account, Twilio account, Resend account, Sentry account. (Domain verification in Resend takes 15m + DNS propagation.)
6. In Twilio: start the Australian alpha sender ID registration process for "Tradify" — this takes 1–2 weeks for carrier approval, so start early.
7. Set up offsite backup destination (Backblaze B2 or Cloudflare R2 free tier).
8. Configure nightly backup cron (`deploy/backup.sh`).
9. Deploy the Phase 0 skeleton app (the "coming soon" page) to prove end-to-end.

**Acceptance:**
- [ ] Domain resolves to VPS over HTTPS with a green lock.
- [ ] `sudo systemctl status nginx php8.3-fpm postgresql redis-server supervisor` all show `active (running)`.
- [ ] SSH as `root` is disabled; SSH as `deploy` with key-auth works.
- [ ] UFW shows only 22, 80, 443 open externally.
- [ ] A test backup ran and a test restore succeeded.
- [ ] Uptime monitor (UptimeRobot free) pinging the homepage.
- [ ] Sentry receives a test exception from production.

---

## Phase 1 — MVP Critical Path (3–5 weeks)

**Goal:** A member submits a job, a tradie accepts, a tradie completes, a member confirms. End-to-end.

Break into sub-phases for visibility. Each sub-phase should ship behind feature flags if the path isn't complete.

### Phase 1.1 — Database + Auth (3–5 days)

**Tasks:**
1. Create all Postgres enum types (migration).
2. Create all migrations in dependency order (`03-database.md §5`).
3. Create all Eloquent models with casts and relationships.
4. Create all factories.
5. Create seeders for `suburbs`, `tradie_categories`, `issue_types`, `member_plans`, `tradie_plans`, `DevUserSeeder`.
6. Build auth (login, registration shell, password reset) using Breeze-React as a starting point, customised for our 3-role world.
7. Add the custom `EnsureRole`, `EnsureActiveMemberSubscription`, `EnsureApprovedTradie` middleware.
8. Build `HandleInertiaRequests` middleware sharing auth + flash + Reverb config.
9. Set up Policies with deny-by-default registration.

**Acceptance:**
- [ ] `sail artisan migrate:fresh --seed` creates a populated local DB.
- [ ] All 4 dev users seeded and can log in.
- [ ] Wrong-role user accessing a role-protected route gets 403.
- [ ] Unauthenticated user is redirected to `/login`.
- [ ] Tests: login + logout + registration happy paths.

### Phase 1.2 — Member Onboarding + Subscriptions (3–5 days)

**Tasks:**
1. Build member registration wizard: account → property → plan (3 pages).
2. Integrate Stripe Cashier. Create the 3 member plans in Stripe Dashboard. Paste Stripe Price IDs into seeder.
3. Build Stripe webhook handlers for the 5 events in `07-integrations.md §1.7`.
4. Write the `checkout.session.completed` handler that creates the `member_subscriptions` row.
5. Build `/membership` page using Cashier's Customer Portal redirect.
6. Tests.

**Acceptance:**
- [ ] New member can sign up, pay with test card `4242...`, and reach `/dashboard` as an active subscriber.
- [ ] A failed payment triggers `past_due` status.
- [ ] Cancellation via portal correctly flips `auto_renew=false`.
- [ ] Test covers: subscription activation, payment failure, cancellation, plan change.

### Phase 1.3 — Tradie Onboarding + Approval (4–6 days)

**Tasks:**
1. Build 4-step tradie application flow.
2. Build S3 upload flow for licence + insurance documents.
3. Build admin view of pending applications + approve/reject actions.
4. Build post-approval "activate subscription" flow (Cashier → Checkout).
5. Build tradie service area + category management pages.
6. Build tradie availability (operating hours) page.
7. Tests.

**Acceptance:**
- [ ] Tradie can apply with all documents uploaded.
- [ ] Admin sees application in queue.
- [ ] On approve, tradie receives email + SMS.
- [ ] Tradie logs in, pays, lands on Leads inbox (empty at this point).
- [ ] Tests: application lifecycle, approval, rejection, subscription activation.

### Phase 1.4 — Job Submission + Dispatch Engine (5–7 days)

**The hardest and most important sub-phase.**

**Tasks:**
1. Build the member request-a-tradie wizard (7 steps).
2. Build `POST /jobs` endpoint with full validation.
3. Build the `DispatchJobAction` + `TradieScorer` + eligibility query.
4. Build `SendLeadNotification` queue job (SMS + email via Twilio/Postmark).
5. Build tradie Lead inbox + Lead detail + Accept/Decline actions.
6. Build `AcceptOfferAction` + `DeclineOfferAction` + `ExpireOffer` queue job + `AdvanceToNextRank`.
7. Build the sequential round advancement logic.
8. Build the admin escalation path when all rounds fail.
9. Build member's job-status live page (Echo / Reverb broadcast on status change).
10. Full test coverage of dispatch: every edge case in `05-dispatch-engine.md §8`.
11. Write the scheduled `dispatch:sweep-expired-offers` command as a safety net.

**Acceptance:**
- [ ] Member submits a job in Baldivis for a plumber.
- [ ] Within 5 seconds, the top-scored plumber receives an SMS + in-app notification.
- [ ] Tradie clicks the SMS link, lands on Lead detail, taps Accept.
- [ ] Member's `/jobs/{id}` page updates live (without refresh) to show tradie assigned.
- [ ] If tradie declines, next-ranked tradie receives offer.
- [ ] If all 3 in round 1 expire, round 2 starts with next 3.
- [ ] If all in round 2 expire, member + admin get notified, job flagged.
- [ ] Scoring tests: 20+ unit tests on `TradieScorer`.
- [ ] Feature tests: happy path, decline flow, expiry flow, round advance, escalation.
- [ ] Race tests: two tradies cannot both accept the same offer.

### Phase 1.5 — Job Progression + Completion (2–3 days)

**Tasks:**
1. Tradie status transitions: "On the way" → "Started" buttons on the job page.
2. Tradie completion form with invoice amount, discount fields, invoice PDF upload.
3. Trigger SMS + email to member on completion.
4. Build member review form.
5. Build the `SubmitReviewAction` + denormalised rating update on tradie.
6. Build the dispute flag logic.
7. Scheduled `jobs:auto-confirm-stale` command.

**Acceptance:**
- [ ] Tradie can transition status through to `completed`.
- [ ] Member receives review prompt SMS + email.
- [ ] Member review with "yes" on both benefits → job status `confirmed`, tradie rating updated.
- [ ] Member review with "no" on benefits → job status `disputed`, tradie paused in admin.
- [ ] After 7 days with no review → auto-confirm.
- [ ] Tests cover all three review outcomes.

### Phase 1.6 — Admin Console (3–5 days)

**Tasks:**
1. Admin overview dashboard (`/admin`).
2. Jobs list + filter + detail.
3. Tradies list + filter + approval/suspension actions.
4. Applications queue (duplicate of tradies filtered by pending — or dedicated page).
5. Disputes queue + resolution form.
6. Manual job assignment flow.
7. Basic platform metrics page (aggregated queries, cached 10 min).

**Acceptance:**
- [ ] Admin can see all live jobs, filter by status/urgency/suburb.
- [ ] Admin can approve a pending tradie application.
- [ ] Admin can suspend + reinstate a tradie.
- [ ] Admin can manually assign a flagged job to any tradie.
- [ ] Admin can resolve a dispute with 4 outcome options.
- [ ] Metrics dashboard loads under 2s.

### Phase 1.7 — Polish + Harden (3–5 days)

**Tasks:**
1. Error boundaries on every layout.
2. Loading states on every data-fetching page.
3. Empty states on every list view.
4. Accessibility pass: keyboard navigation, labels, focus rings.
5. Responsive pass: every page usable at 360px.
6. Email template styling + preview.
7. SMS template copy review for Australian voice.
8. Sentry alerts configured.
9. Rate limits in place on all endpoints.
10. Performance: dispatch query under 50ms with seeded load.
11. Load test: simulate 100 concurrent job submissions (basic Artillery or k6 script).

**Acceptance:**
- [ ] Lighthouse accessibility score ≥ 90.
- [ ] No console errors on any page.
- [ ] Load test passes without error rate > 1%.
- [ ] Dispatch query remains under 50ms p99 with 500 tradies + 10k suburbs.
- [ ] All TODOs in the code resolved or ticketed.

---

## Phase 1 — Acceptance Gate

Before declaring Phase 1 done and opening Phase 2, the following ALL must be true:

- [ ] The 7 critical path steps (see §0) work end-to-end without manual intervention.
- [ ] All docs have been kept current.
- [ ] All `DECISION REQUIRED` items affecting MVP have been resolved and docs updated.
- [ ] Full test suite has >80% line coverage on `app/Actions/` and `app/Services/`.
- [ ] Production deployment via `deploy/deploy.sh` succeeds from a clean git push on `main`.
- [ ] At least 5 internal test users have run through the critical path without the team touching the DB.
- [ ] Sentry has been quiet for 48h after a soft-launch cohort.
- [ ] Member-side NPS survey (can be a Typeform link in follow-up email) drafted and ready.

Only then → Phase 2.

---

## Phase 2 — Scale + Retention (6–12 weeks after MVP)

**Goal:** Features that move retention, operational leverage, and geographic expansion.

### Phase 2.A — Tradie mobile app (React Native + Expo, monorepo)

**See `11-mobile-apps-spec.md` for the full spec.** Summary here:

- Set up monorepo (`apps/tradie-app`, `apps/member-app` scaffolded, `packages/shared`, `packages/ui`)
- Laravel backend additions: Sanctum tokens, `user_devices` table, Expo Push notification channel, universal-links JSON files
- Build the tradie app first (leads inbox, lead detail, job detail, status transitions, completion form, performance, settings)
- Launch on TestFlight + Play Console internal track, then production stores
- Target: 4–6 weeks

### Phase 2.B — Member mobile app

- Build member app on the same foundation laid in 2.A
- Home, submit wizard, job detail, review form, properties, membership, saved tradies
- Target: 3–4 weeks once 2.A lands

### Phase 2.C — Two-way messaging

- In-app thread per job (web + both mobile apps)
- Push notification on new message
- Admin can see threads for dispute evidence

### Phase 2.D — Masked calls

- Twilio Voice Proxy Service
- Member dials masked number; routes to tradie. Same in reverse.
- Recording optional per job (with consent)

### Phase 2.E — Suburb exclusivity for Premium

- Premium tier gets "exclusive rights" to N suburbs. Only one premium tradie per suburb per category.
- Requires a waitlist mechanism when a suburb is taken.

### Phase 2.F — Invoice requirement for Premium

- Premium tier must upload an invoice on completion (required, not optional).
- Cross-check invoice amount vs discount_applied.

### Phase 2.G — Renewal reminders

- Scheduled job 14 / 7 / 1 days before subscription end_date.
- Email + SMS.
- "Renew now" deep-link to Stripe Portal.

### Phase 2.H — Referral system

- Members refer members: each gets $X off next renewal on signup.
- Tradies refer tradies: tradie-referrer gets $Y off next renewal.
- Unique referral codes, tracking table.

### Phase 2.I — Team accounts for tradies

- `tradie_company` can have multiple users (owner, field staff).
- Field staff see jobs assigned to the company, can accept/update status, cannot see billing.
- Requires proper RBAC per tradie_company.

### Phase 2.J — Investor portfolio view

- Members on Investor plan get a multi-property summary.
- Per-property job history, total spend, estimated savings.
- CSV export for tax time.

### Phase 2.K — Public SEO review pages

- Each tradie gets a public profile at `tradify.au/t/{slug}`.
- Shows rating, review count, some sample reviews.
- Links from Google local results.

### Phase 2 — Acceptance Gate

Each sub-phase has its own acceptance. Phase 2 overall is "ongoing" and doesn't need a single gate.

---

## Phase 3 — Differentiation (~6 months post-MVP)

### Phase 3.A — Live tradie tracking
- Tradie's phone streams GPS location once they tap "On the way".
- Member sees a map with ETA.
- Stops at "Started".

### Phase 3.B — Maintenance reminders
- Recurring jobs: "Inspect gutters every 12 months."
- Member sets cadence; we auto-create draft jobs at the date.

### Phase 3.C — AI dispatch
- Feed historical data into a scoring model that learns per-suburb per-tradie patterns beyond our static weights.
- A/B against the rule-based scorer.
- Only roll out if A/B shows meaningful improvement.

### Phase 3.D — Investor analytics
- Revenue/expense analytics for property investors.
- Integration with xero / QuickBooks for tax export.

### Phase 3.E — Pay-per-lead alternative (pilot)
- For certain categories or geographies where subscription volume is thin, offer pay-per-lead.
- Only if the business case is clear — the founding premise is subscription.

---

## 4. Per-phase deliverables template

For every phase and sub-phase, the agent must produce:

1. **Code** — matching the docs.
2. **Tests** — matching the expectations in `09-development-guide.md §7`.
3. **Doc updates** — if the phase discovered gaps or required changes, update the relevant `docs/` files.
4. **Runbook** — any new ops concerns (e.g., "if the Stripe webhook falls behind, check Horizon dashboard at /horizon") documented in `docs-ops/` (informal, can be a single `runbook.md`).
5. **Demo** — a 2-min Loom or annotated screenshot set showing the feature working end-to-end, for the user's review.

---

## 5. Open decisions affecting phasing

| # | Decision | Impact |
|---|---|---|
| 1 | Dispatch model (sequential/parallel) | Phase 1.4 architecture. |
| 2 | Dispatch windows | Phase 1.4 behavior. |
| 3 | Pricing | Required for Phase 1.2 and 1.3 to go live. |
| 4 | Branding | Required for Phase 1.7 polish. |
| 5 | Geographic scope | Affects seed data in Phase 1.1. |

Resolve in order of impact: #3 and #5 block launch; #1 and #2 block dispatch coding; #4 blocks public launch.

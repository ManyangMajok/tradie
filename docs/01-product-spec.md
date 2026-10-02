# 01 — Product Specification

**Status:** Canonical. If a feature isn't here or in a linked doc, it isn't in scope.

---

## 1. What we are building

A two-sided membership platform where:

- **Homeowners and property investors** pay an annual membership fee to get fast access to trusted tradies with no call-out fees and a member discount applied to every job.
- **Tradespeople** (plumbers, electricians, locksmiths, etc.) pay an annual subscription to receive member-generated jobs routed to them by a scoring-based dispatch engine.
- **The platform** earns recurring revenue from both sides, tracks every lead and completion, and uses that data to retain good tradies, deprioritise poor ones, and recruit better ones.

This is **not** a directory, **not** a bidding marketplace, **not** lead-gen-by-volume. It is a **membership + dispatch + performance platform**.

---

## 2. Non-negotiable product rules

These are business rules. The agent MUST enforce them in code; the UI must reinforce them.

1. **Only active members can submit jobs.** Membership must be paid and in-date.
2. **Only active subscribed tradies can receive leads.** Subscription must be paid, in-date, and application must be approved.
3. **Tradies must waive the call-out fee for members.** This is in the agreement they sign on application.
4. **Tradies must honour the member discount** (see plan section). This is in the same agreement.
5. **Jobs are never blasted to all tradies at once.** The dispatch engine scores and offers to a bounded number. See `05-dispatch-engine.md`.
6. **Tradies who miss their acceptance window repeatedly are deprioritised automatically.** See `05-dispatch-engine.md`.
7. **Members must confirm whether benefits were honoured** on job completion. This is the platform's primary trust signal. See Section 11.
8. **Admin can override any automated decision.** Manual assignment, manual suspension, manual refund.
9. **All financial amounts are stored as integer cents** in the database. Never floats. See `09-development-guide.md`.
10. **All times are UTC in the database**, displayed in Australia/Perth unless user timezone is set.

---

## 3. User roles

Three roles. Each is a `role` value on the `users` table (see `03-database.md`).

### 3.1 `admin`
- Platform operator.
- Full read/write access.
- Can impersonate other users for support (PHASE 2).
- Typically 1–3 accounts at launch.

### 3.2 `member`
- Homeowner or property investor.
- Has a paid `member_subscription` and one or more `properties`.
- Submits jobs, tracks status, rates tradies.
- Confirms benefits were honoured on completion.

### 3.3 `tradie`
- A user who owns or manages a `tradie_company`.
- Has a paid `tradie_subscription`.
- Receives job offers in their configured service suburbs + categories.
- Accepts/declines, updates job status, submits completion reports.

**AGENT NOTE:** A `tradie_company` is the commercial entity. A `user` with role `tradie` is the person. One company can have one owner user (MVP) and additional staff users in Phase 2. In MVP, `tradie_company` has exactly one owner user.

---

## 4. Geographic scope

**Decision: Perth/WA only at MVP.** Hardcode `state = 'WA'`. Seed only WA suburbs (~600). State selector is not required on forms. Expand nationally in Phase 2 when there is tradie supply outside WA.

---

## 5. Business name and branding

**Decision: Tradify** — business name confirmed. Domain: `tradify.au`. SMS sender ID: `Tradify`. Stripe product names: `Tradify Basic`, `Tradify Pro`, `Tradify Investor`, `Tradify Standard`, `Tradify Premium`.

---

## 6. Plans and pricing

### 6.1 Member plans

Three tiers. Structure is fixed; pricing is not.

| Plan | Properties | Dispatch priority | Additional benefits |
|---|---|---|---|
| Basic | 1 | Standard | No call-out fee, 10% discount |
| Pro | Up to 3 | Priority (moves member up dispatch queue tie-breaker) | All Basic benefits + phone support |
| Investor | Unlimited | Priority | All Pro benefits + portfolio view (PHASE 2 feature) |

**Pricing (AUD, yearly, tax-inclusive):** Basic $149 · Pro $249 · Investor $449.

**Member discount: 10%** across all plans.

**AGENT NOTE:** "Dispatch priority" on Pro/Investor does **not** mean the member's job bumps another member's job. It means when two jobs are competing for the same tradie, the Pro/Investor member's job is offered first. See `05-dispatch-engine.md`.

### 6.2 Tradie plans

Two tiers.

| Plan | Dispatch ranking | Featured listing | Suburb exclusivity |
|---|---|---|---|
| Standard | Normal rank | No | No |
| Premium | Top of dispatch queue (offered first in rank) | Yes — on public profile listings | No (PHASE 2) |

**Pricing (AUD, yearly, tax-inclusive):** Standard $499 · Premium $999.

**Suburb exclusivity:** Deferred to Phase 2.

### 6.3 Billing cycle

- All plans bill **annually** at MVP. No monthly option.
- Billing is via Stripe Subscriptions (managed through Laravel Cashier).
- Auto-renew is on by default. Member/tradie can turn off in settings.
- See `07-integrations.md` for Stripe webhook handling.

---

## 7. Categories and issue types

### 7.1 Tradie categories (MVP)

Seeded as rows in `tradie_categories`:

1. Plumber
2. Electrician
3. Locksmith
4. Roofer
5. Pest control
6. Handyman
7. HVAC
8. Appliance repair

### 7.2 Issue types per category

Stored in an `issue_types` table linked to `tradie_categories`.

**Plumber:** Blocked drain · Leaking tap · Burst pipe · Hot water issue · Toilet issue · Gas issue · Other
**Electrician:** Power outage · Faulty switch/outlet · Lighting issue · Switchboard issue · Appliance install · Other
**Locksmith:** Lockout · Broken lock · Lock replacement · Key cutting · Other
**Roofer:** Leak · Tile/iron damage · Gutter issue · Other
**Pest control:** Ants · Cockroaches · Termites · Rodents · Wasps/bees · Other
**Handyman:** Wall repair · Hanging/mounting · Door/window · Fence/gate · Other
**HVAC:** No cooling · No heating · Service/clean · Install · Other
**Appliance repair:** Washer/dryer · Dishwasher · Oven/stove · Fridge/freezer · Other

**AGENT NOTE:** Seed these. Don't hardcode in views. Members pick from the seeded list; admin can add more via admin UI (PHASE 2 can defer the admin UI, but the seeder must be in place).

---

## 8. Urgency levels

Four values, seeded on `jobs.urgency` as an enum/check constraint.

| Urgency | Meaning | Dispatch window (see §10) |
|---|---|---|
| `emergency` | Water/gas/power/lockout — now | 2 minutes |
| `same_day` | Needs sorting today | 15 minutes |
| `within_48h` | Soon, not urgent | 30 minutes |
| `flexible` | Book when available | 60 minutes |

Dispatch windows: emergency 2 min · same-day 15 min · within-48h 30 min · flexible 60 min.

---

## 9. Job lifecycle (states)

State values are canonical. Use these exact strings in the database.

### 9.1 Lead stage (on `job_offers`)

- `pending` — offer created, not yet sent
- `offered` — sent to tradie, awaiting response
- `viewed` — tradie opened the lead (push/SMS clicked)
- `accepted` — tradie accepted (terminal for this offer)
- `declined` — tradie declined (terminal for this offer)
- `expired` — window passed without response (terminal for this offer)

### 9.2 Job stage (on `jobs.status`)

- `pending_dispatch` — just created, dispatcher hasn't run yet
- `offered` — offers are live, awaiting acceptance
- `assigned` — a tradie accepted
- `tradie_on_the_way` — tradie tapped "On the way"
- `in_progress` — tradie tapped "Started"
- `awaiting_client_response` — tradie requested member input (PHASE 2)
- `rescheduled` — tradie and member agreed a new time (PHASE 2)
- `completed` — tradie submitted completion report
- `confirmed` — member confirmed work + benefits
- `disputed` — member marked benefits not honoured OR opened a dispute
- `cancelled` — cancelled by member, tradie (with reason), or admin

**State transitions are strict.** See `05-dispatch-engine.md` §State Machine for the allowed transitions and who can cause them.

---

## 10. Dispatch model

Full detail lives in `05-dispatch-engine.md`. Summary only here so this doc is self-contained.

- Jobs are dispatched via a **strict ranked offer model**: top-ranked tradie gets the offer first, window opens, if they don't accept the offer expires and the next ranked tradie gets it, etc.
- Up to **3 tradies** get offered in sequence per dispatch cycle.
- Scoring factors (weighted): category match · suburb match · subscription active · premium tier · recent response time · acceptance rate · rating · current workload.
- If all 3 expire without acceptance, a **second round** of the next 3 is triggered automatically.
- If the second round also expires, the job is flagged to **admin for manual assignment** and the member is notified.

**Decision: strict sequential ranking.** Top-ranked tradie gets an exclusive window; offer expires before the next tradie is contacted. This avoids race conditions and gives tradies a fairer shot at responding.

---

## 11. Benefits confirmation (ROI integrity)

This is the single most important trust loop on the platform. Without it, the ROI data the business sells to future tradies becomes fiction.

### Flow

1. Tradie marks job `completed` and submits a completion report with:
   - Summary of work
   - Final amount invoiced (cents)
   - `no_callout_fee_confirmed: bool`
   - `discount_applied: bool`
   - `discount_amount_cents: int | null`
   - Optional invoice upload
2. System sets `jobs.status = completed`.
3. Member receives SMS + email (see `08-notifications.md`) prompting them to confirm.
4. Member answers three questions on a review page:
   - Was the work completed? (Yes / Partially / No)
   - Was the call-out fee waived? (Yes / No)
   - Was your member discount applied? (Yes / No / N/A)
   - Plus 1–5 star rating and optional comment.
5. On submit:
   - If member says **Yes to both benefits** → `jobs.status = confirmed`. Tradie's performance card updates.
   - If member says **No to either benefit** → `jobs.status = disputed`. Tradie is automatically flagged in admin. Further leads to that tradie are **paused pending admin review** (not hard-suspended — paused until reviewed).
   - If the member doesn't respond within 7 days → `jobs.status = confirmed` by default, flagged in admin as "no-response confirm". **Decision: 7-day auto-confirm confirmed.**

---

## 12. Dispute handling (MVP scope)

**Dispute SLA: admin responds within 48 hours of dispute being raised.**

MVP scope is intentionally thin:

- Disputes are a list in admin. See `04-api-spec.md` admin endpoints.
- Admin can: contact member, contact tradie, reassign job to another tradie, issue a "platform credit" to the member, suspend tradie lead flow, formally warn tradie, or dismiss the dispute.
- Credits are **off-Stripe** for MVP — tracked as a `member_credits` table and applied as a discount at next renewal. (OUT OF SCOPE for first build; add model but leave logic stubbed.)

No automated dispute resolution. Humans handle it.

---

## 13. Data the platform MUST collect

This is the asset. Collecting it correctly matters more than any single feature.

### Per tradie (aggregated from jobs + offers)
- Total leads offered
- Leads viewed / not viewed
- Leads accepted / declined / expired
- Acceptance rate
- Average response time (offer → accept)
- Jobs completed / cancelled / disputed
- No-show count (assigned but no `on the way` logged within window)
- Average rating
- Total reported job value (sum of `invoice_total_cents`)
- Total discount value given
- Per-suburb breakdown of above
- Per-issue-type breakdown of above

### Per member
- Active subscription + plan
- Total requests submitted
- Total completed jobs
- Estimated savings: sum of (call-out fees avoided + discount amounts applied)
- Favourite / saved tradies
- Properties count
- Renewal-risk score (PHASE 2)

### Per platform
- Jobs by suburb / category / urgency
- Time-of-day distribution
- Lead-to-job conversion rate
- Average time to assignment
- Average time to completion
- Tradie churn (non-renewal rate)
- Member churn

---

## 14. Glossary

- **Member** — user with role `member`; has subscription + properties.
- **Tradie** — user with role `tradie`; linked to a `tradie_company`.
- **Company** — the `tradie_company` record; commercial entity a tradie operates under.
- **Lead / Offer** — a `job_offer` row; represents the platform offering a specific job to a specific tradie.
- **Job** — a `jobs` row; the overall job request from a member.
- **Dispatch** — the process of scoring tradies and creating ordered offers.
- **Dispatch cycle / round** — one pass through up to 3 tradies. A job can run multiple rounds.
- **Window** — the time a tradie has to accept before their offer expires.
- **Benefit confirmation** — the member's post-job answers about whether call-out fee was waived and discount applied.
- **Call-out fee** — the standard fee a tradie charges for showing up. Waived for members.

---

## 15. Out of scope for MVP

Explicitly not building in Phase 1:

- Mobile app (React Native — Phase 2)
- In-app messaging between member and tradie (Phase 2; MVP uses phone)
- Masked phone numbers (Phase 2)
- Real-time tradie location tracking (Phase 3)
- Recurring maintenance reminders (Phase 3)
- AI-powered dispatch (Phase 3)
- Investor portfolio analytics (Phase 2)
- Staff/team accounts under a tradie company (Phase 2)
- Referral system (Phase 2)
- Suburb exclusivity for Premium tradies (Phase 2)
- Member credits system (stubbed in MVP, live in Phase 2)
- Tradie admin dashboard for managing their own team (Phase 2)
- Public review pages for SEO (Phase 2)
- Pay-per-lead alternative pricing for tradies (never; the model is subscription-only)

See `10-build-phases.md` for what IS in scope, by phase.

---

## 16. Decision register

All Phase 1 decisions resolved:

| # | Decision | Outcome |
|---|---|---|
| 1 | Geographic scope | Perth/WA only at MVP |
| 2 | Business name / domain / SMS sender / Stripe | Tradify / tradify.au / Tradify / Tradify |
| 3 | Member plan pricing | $149 / $249 / $449 per year (tax-incl.) |
| 4 | Member discount % | 10% across all plans |
| 5 | Tradie plan pricing | $499 / $999 per year (tax-incl.) |
| 6 | Suburb exclusivity | Deferred to Phase 2 |
| 7 | Same-day dispatch window | 15 minutes |
| 8 | Flexible dispatch window | 60 minutes |
| 9 | Dispatch model | Strict sequential ranking |
| 10 | Auto-confirm period | 7 days with no member response |
| 11 | Dispute SLA | 48 hours |

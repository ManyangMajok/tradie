> **Member-choice update:** The web demo uses explicit member selection as described in `docs/DEMO.md`. Do not automatically advance a member-selected job to a different tradie. The scoring rules below still apply to legacy/mobile automatic dispatch.

> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 05 — Dispatch Engine

**Status:** Canonical. This is the most important doc in the pack. **Read it entirely before writing dispatch code.**

---

## 0. Read this first

The dispatch engine is the heart of the product. Every other feature exists to feed or consume it. Get this wrong and:

- Members stop submitting jobs (they wait too long, feel ignored).
- Tradies churn (they get bad-fit leads, or none).
- The platform's ROI data becomes garbage (the whole sales pitch collapses).

Do not "simplify" the dispatch engine. Do not inline scoring logic into controllers. Do not skip the tests. If you think you've found a faster way, stop and ask.

---

## 1. What dispatch does

Given a newly submitted job, decide which tradies to offer it to, in what order, and when.

**Inputs:**
- The job (suburb, category, urgency, submission time)
- The pool of tradies who match (see §4 eligibility)
- Tradie performance history
- Current time (affects availability check)

**Outputs:**
- A set of `job_offers` rows (initially 1 active at a time in sequential mode)
- Queued `SendLeadNotification` jobs for each offer
- Queued `ExpireOffer` jobs scheduled at offer's expires_at
- A `job_status_logs` row for the status change

---

## 2. Dispatch model

**Decision: strict sequential ranking.** Top-ranked tradie gets an exclusive window; offer expires before the next is contacted. See `01-product-spec.md §10`.

### 2.1 Strict sequential (recommended, this doc's default)

- Rank all eligible tradies by score.
- Offer the job to **rank #1 only**.
- That tradie has a window (see §6) to accept.
- If they accept → job assigned, done.
- If they decline OR the window expires → offer goes to rank #2.
- Continue through ranks #2, #3.
- If all 3 fail → start a **second round** with ranks #4, #5, #6.
- If the second round fails → mark job `requires_admin_review = true`, notify admin, notify member.

**Why this is the recommendation:**
- Premium tier is meaningful (premium tradies actually get first dibs, not just a race).
- Reduces SMS spend (only one tradie is SMS'd at a time).
- Creates clean response-time data (no "first-to-accept" noise).
- Easier to reason about, debug, and test.

**Tradeoff:**
- Slightly slower to a first accept in the common case (you wait for window #1 to expire before offering #2).

To mitigate the tradeoff, windows are **tight** (see §6).

### 2.2 Parallel (alternative)

- Rank all eligible tradies by score.
- Offer the job to the **top 3 simultaneously**.
- Whoever accepts first wins; other offers are marked `superseded`.
- If all 3 expire without accept → next round of 3.

**If the user chooses this:** the scoring logic below is unchanged, but `DispatchJobAction` creates 3 offers at once instead of 1, and acceptance has a race-condition-safe "first-wins" transaction.

**This doc assumes §2.1 sequential from here forward. If §2.2 is chosen, most of the logic is the same; only offer-creation count differs.**

---

## 3. State machine

### 3.1 Job states (from `03-database.md §4.14 jobs.status`)

```
pending_dispatch
    │ (DispatchJobAction runs)
    ▼
  offered  ◀────────┐  (next round after expiry)
    │               │
    │ (accept)      │ (all offers in round expire/decline)
    ▼               │
  assigned ─────────┘  (if round < max_rounds; else → requires_admin_review)
    │
    │ (tradie taps "on the way")
    ▼
tradie_on_the_way
    │ (tradie taps "started")
    ▼
 in_progress
    │ (tradie submits completion)
    ▼
  completed
    │ (member confirms)
    ▼                    (member says benefits not honoured)
  confirmed        OR       disputed
                              │
                              │ (admin resolves)
                              ▼
                          confirmed / cancelled / reassigned
```

### 3.2 Offer states (from `03-database.md §4.16 job_offers.status`)

```
 pending
    │ (SendLeadNotification runs)
    ▼
 offered ──(tradie opens SMS/push link)── viewed ─┐
    │                                             │
    ├──(tradie accepts)──► accepted               │
    ├──(tradie declines)─► declined               │
    ├──(window hits)─────► expired                │
    └──(sibling accepted)► superseded  (parallel mode only)
```

### 3.3 Allowed transitions (enforce in code, not optional)

A `JobStatusTransition` action class must enforce these. Any non-listed transition throws `InvalidStatusTransitionException`.

```php
// app/Services/JobStatusTransition.php
public const ALLOWED = [
    'pending_dispatch' => ['offered', 'cancelled'],
    'offered'          => ['assigned', 'pending_dispatch' /* retry round */, 'cancelled'],
    'assigned'         => ['tradie_on_the_way', 'in_progress', 'cancelled', 'rescheduled'],
    'tradie_on_the_way'=> ['in_progress', 'cancelled', 'rescheduled'],
    'in_progress'      => ['completed', 'cancelled', 'awaiting_client_response'],
    'awaiting_client_response' => ['in_progress', 'completed', 'cancelled'],
    'rescheduled'      => ['assigned', 'cancelled'],
    'completed'        => ['confirmed', 'disputed'],
    'disputed'         => ['confirmed', 'cancelled', 'assigned' /* admin reassigned */],
    'confirmed'        => [],  // terminal
    'cancelled'        => [],  // terminal
];
```

Every transition writes a row to `job_status_logs`.

---

## 4. Eligibility (who can receive an offer)

A tradie company is **eligible** for a job IFF all of:

1. `tradie_companies.status = 'approved'`
2. `tradie_companies.deleted_at IS NULL`
3. Has an **active** `tradie_subscriptions` row (status in `active` or — tentatively — `past_due` for the first 3 days of past_due; after that, excluded).
4. Has an **active** `tradie_company_categories` row matching `jobs.tradie_category_id`.
5. Has an **active** `tradie_service_areas` row matching the job's suburb (looked up via `properties.suburb_id`).
6. **Not currently flagged for dispute review** — i.e., no other job where this tradie is assigned and `requires_admin_review = true`.
7. **Not already offered this job** — no `job_offers` row exists for (this job, this tradie), in any round.
8. **Within operating hours** OR `tradie_availability.accepts_emergency = true` if urgency is `emergency`. Operating hours check uses the property's suburb local timezone (Australia/Perth in MVP).

A tradie's `current_workload` (count of jobs in `assigned`/`tradie_on_the_way`/`in_progress`) affects their **score**, not eligibility. A heavily-loaded tradie gets a lower score but is still eligible unless they've disabled their "available for leads" flag (PHASE 2 feature).

---

## 5. Scoring

Scores are a floating-point number. Higher = better. Used only to rank — absolute values don't matter, only relative.

### 5.1 Base score components

All eligible tradies get scored. Score = sum of:

| Factor | Contribution | Notes |
|---|---|---|
| Premium plan boost | `tradie_plans.dispatch_rank_boost` | Premium = **+100**, Standard = **0**. This is the big one — Premium almost always ranks first. |
| Rating | `(rating_average ?? 4.0) * 10` | Ratings stored as 1.00–5.00 numeric(3,2). If no rating yet, default 4.0 (new tradies not penalised). |
| Response time (30d) | `clamp(0, 30, 30 - (avg_response_sec / 60))` | Faster response = higher score. 0 seconds = 30 points, 30 minutes = 0 points, capped. |
| Acceptance rate (30d) | `(accepted / offered) * 20` if offered >= 5 else `10` | Higher acceptance = higher score. New tradies (few offers) get neutral 10. |
| Current workload penalty | `-min(workload, 10) * 2` | 0 jobs = 0 penalty, 5 jobs = -10, 10+ jobs = -20. |
| Pro/Investor member bonus | `+5` if member is on Pro or Investor plan | Applied at dispatch time, not tradie-specific. **This changes ranking order when multiple jobs compete for one tradie, not within one job.** Still, included for symmetry — it's part of the score that's logged. |
| Dispute-recency penalty | `-30` per dispute in last 30 days | Strong signal to deprioritise tradies who've been disputed. |
| Recent expiry penalty | `-15` per expired offer in last 7 days | Tradies who ignore leads drop fast. |

### 5.2 Scoring example

Two plumbers eligible for a Baldivis job. Member is on Pro plan.

| Factor | Tradie A (Premium, great) | Tradie B (Standard, new) |
|---|---|---|
| Plan boost | +100 | 0 |
| Rating | 4.8 → +48 | null → +40 (default 4.0) |
| Response time | avg 85s → +29.58 | no data → +15 (neutral) |
| Acceptance rate | 22/30 = 73% → +14.7 | 1/2 = too few → +10 |
| Workload | 3 jobs → -6 | 0 jobs → 0 |
| Pro bonus | +5 | +5 |
| Disputes | 0 → 0 | 0 → 0 |
| Expired offers | 1 → -15 | 0 → 0 |
| **Total** | **176.28** | **70** |

Tradie A offered first. If they decline/expire, Tradie B next.

### 5.3 The scoring function (reference implementation)

Lives in `app/Services/TradieScorer.php`. Pure function, unit-tested exhaustively.

```php
final class TradieScorer
{
    public function score(ScoringContext $ctx, EligibleTradie $tradie): float
    {
        $score = 0.0;

        // Plan boost
        $score += $tradie->planDispatchBoost;

        // Rating
        $rating = $tradie->ratingAverage ?? 4.0;
        $score += $rating * 10;

        // Response time (30d)
        if ($tradie->recentAvgResponseSeconds !== null) {
            $minutes = $tradie->recentAvgResponseSeconds / 60;
            $score += max(0, min(30, 30 - $minutes));
        } else {
            $score += 15;  // neutral default
        }

        // Acceptance rate (30d)
        if ($tradie->recentOffersCount >= 5) {
            $rate = $tradie->recentOffersCount > 0
                ? $tradie->recentAcceptedCount / $tradie->recentOffersCount
                : 0;
            $score += $rate * 20;
        } else {
            $score += 10;  // neutral for new tradies
        }

        // Workload penalty
        $score -= min($tradie->currentWorkload, 10) * 2;

        // Member plan bonus
        if ($ctx->memberPriorityDispatch) {
            $score += 5;
        }

        // Dispute penalty
        $score -= $tradie->disputesLast30Days * 30;

        // Expired offers penalty
        $score -= $tradie->expiredOffersLast7Days * 15;

        return $score;
    }
}
```

**AGENT NOTE:** Every weight above is a constant that should live in `config/dispatch.php`, not hardcoded. This lets ops tune without a deploy. See §11 below.

---

## 6. Timing windows

### 6.1 Acceptance windows by urgency

**Decided windows:**

| Urgency | Window |
|---|---|
| `emergency` | 2 min |
| `same_day` | 15 min |
| `within_48h` | 30 min |
| `flexible` | 60 min |

Longer non-emergency windows reflect that tradies on tools aren't glued to their phones.

### 6.2 Max rounds per job

- MVP: **max 2 rounds** (= up to 6 tradies attempted before admin takes over).
- If both rounds fail, job is flagged for admin. Member is notified (see `08-notifications.md`).

### 6.3 Between-round delay

- Zero delay. The moment round 1's last offer expires, round 2 starts.
- If round 1 has no candidates for rank #2 or #3 (e.g., only 1 eligible tradie total), round ends early and round 2 kicks in immediately. If still no candidates, `requires_admin_review`.

---

## 7. The dispatch flow (pseudocode)

### 7.1 `DispatchJobAction::execute(Job $job)`

Called synchronously by the controller on job submission, OR by the `ExpireOffer` job when advancing rounds.

```
// 1. Check job is dispatchable
assert job.status in ['pending_dispatch', 'offered']

// 2. Determine which round this is
currentRound = (latest job_offer for this job).round, or 0
targetRound = currentRound + 1 (but only if we're starting a new round)

// 3. If targetRound > max_rounds (2), escalate
if targetRound > config('dispatch.max_rounds'):
    job.status = 'pending_dispatch'
    job.requires_admin_review = true
    save + log status change
    queue NotifyAdminJobUnassigned
    queue NotifyMemberJobDelayed
    return

// 4. Query eligible tradies (see 03-database.md §8 SQL)
eligibleTradies = query(job.suburb_id, job.category_id, job.id)

// 5. Exclude tradies already offered this job in ANY previous round
// (handled by the eligibility query)

// 6. Score each
scoringCtx = new ScoringContext(job, member)
scored = eligibleTradies.map(t => [t, scorer.score(ctx, t)])
scored.sortByDesc(score)

// 7. Take top N for this round (N = offers_per_round, default 3)
offersToMake = scored.take(config('dispatch.offers_per_round'))

// 8. If zero eligible, escalate
if offersToMake.empty():
    goto escalate_to_admin  // same as step 3

// 9. In STRICT SEQUENTIAL mode, create offer for rank #1 ONLY
// In PARALLEL mode, create all offers now
DB::transaction:
    for (i, [tradie, score]) in offersToMake.take(1):  // sequential = take(1)
        offer = new JobOffer{
            job_id: job.id,
            tradie_company_id: tradie.id,
            round: targetRound,
            rank_in_round: i + 1,
            score: score,
            status: 'pending',
            expires_at: now() + window_for(job.urgency),
        }
        save offer

    job.status = 'offered'
    job.dispatched_at ??= now()
    job.dispatch_round = targetRound
    save job
    log status change

// 10. Outside the transaction:
for offer in just-created-offers:
    dispatch SendLeadNotification(offer)  // → queue
    dispatch ExpireOffer(offer.id)->delay(offer.expires_at - now())
```

### 7.2 `AcceptOfferAction::execute(JobOffer $offer, User $tradieUser)`

Called by the tradie's accept controller.

```
DB::transaction with SELECT FOR UPDATE:
    // 1. Lock and re-read the offer
    offer = JobOffer::lockForUpdate()->find(offer.id)

    // 2. Validate
    if offer.status != 'offered':
        throw OfferNoLongerAvailableException  // already accepted/expired/etc.

    if offer.tradie_company_id != tradieUser.tradieCompany.id:
        throw NotAuthorizedException

    if now() > offer.expires_at:
        throw OfferExpiredException  // raced with expiry

    // 3. Mutate offer
    offer.status = 'accepted'
    offer.accepted_at = now()
    offer.save()

    // 4. Update parent job
    job = offer.job
    if job.status != 'offered':
        throw InvalidJobStateException  // should never happen given step 2
    job.status = 'assigned'
    job.assigned_tradie_company_id = offer.tradie_company_id
    job.assigned_at = now()
    job.save()
    log status change

    // 5. Mark sibling offers in same round as superseded (parallel mode)
    // In sequential mode, only this offer exists, so no siblings. But we do this
    // defensively regardless.
    JobOffer::where(job_id = job.id)
        ->where(round = offer.round)
        ->where(id != offer.id)
        ->where(status IN ('pending', 'offered'))
        ->update(status = 'superseded', superseded_at = now())

// After transaction:
dispatch NotifyMemberAssigned(job)  // SMS + email
dispatch CancelPendingExpiryJobs(job.id, offer.round)  // cancels sibling ExpireOffer jobs
broadcast JobStatusChanged(job) on member & admin channels
```

### 7.3 `DeclineOfferAction::execute(JobOffer $offer, ?string $reason)`

```
DB::transaction:
    offer = lock and re-read
    if offer.status != 'offered': throw
    offer.status = 'declined'
    offer.declined_at = now()
    offer.declined_reason = reason
    save

// Outside txn: advance to next rank in the current round
dispatch AdvanceToNextRank(job.id, current_round)
```

### 7.4 `ExpireOffer::handle()` (queue job, runs at `offer.expires_at`)

```
offer = find(this.offerId)
if offer is null: return
if offer.status != 'offered': return  // already resolved, nothing to do

DB::transaction:
    offer = lock and re-read
    if offer.status != 'offered': return
    offer.status = 'expired'
    offer.expired_at = now()
    save

// Outside txn:
dispatch AdvanceToNextRank(offer.job_id, offer.round)
```

### 7.5 `AdvanceToNextRank::handle(int $jobId, int $round)` (queue job)

In sequential mode only. In parallel mode, this becomes "if all siblings failed, start next round."

```
job = Job::find(jobId)
if job.status != 'offered': return  // already resolved

// Get all scored candidates for this round
(Re-run the eligibility query + scoring, excluding already-offered tradies)

nextRank = (max rank_in_round used so far in this round) + 1

if nextRank > offers_per_round (3):
    // This round is exhausted. Start a new round.
    DispatchJobAction::execute(job)
    return

if nextCandidate doesn't exist:
    // No more eligible tradies at all.
    DispatchJobAction::execute(job)  // will escalate to admin if this is round 2
    return

// Create the next offer
create JobOffer{
    job_id, tradie_company_id, round = same,
    rank_in_round = nextRank, score, status = pending,
    expires_at = now() + window_for(urgency),
}
dispatch SendLeadNotification(offer)
dispatch ExpireOffer(offer.id)->delay(window)
```

---

## 8. Edge cases (agent must handle)

### 8.1 Race: tradie accepts at the same moment offer expires
**Handled by:** `SELECT ... FOR UPDATE` in acceptance + strict check that `offer.status == 'offered'` inside the lock. Whoever's transaction commits first wins. The other gets `OfferExpiredException` or `OfferNoLongerAvailable`.

### 8.2 Race: two tradies accept simultaneously (parallel mode only)
**Handled by:** Same row lock on the **parent job** when updating `job.status` to `assigned`. The second transaction sees `job.status != 'offered'` and throws.

### 8.3 Member cancels their job mid-dispatch
**Behaviour:** Job status → `cancelled`. All open offers → `superseded` (new terminal reason; or just leave `offered` and let them expire naturally). Cancelling active offers is cleaner. All pending `ExpireOffer` jobs can be left to run — they'll no-op because `offer.status != 'offered'`.

### 8.4 Tradie subscription lapses mid-dispatch
**Behaviour:** Eligibility query at next round filters them out. If they already have an active offer, it stays valid (don't yank an in-flight offer — respect the contract).

### 8.5 No eligible tradies at all (suburb has no subscribed tradies)
**Behaviour:** First dispatch attempt immediately escalates to admin. Member gets "we're having trouble finding a tradie in your area — we'll get back to you shortly" message (see `08-notifications.md`).

### 8.6 Tradie becomes ineligible between being scored and receiving the offer
**Mitigation:** Re-validate eligibility at offer-creation time inside the transaction. If ineligible now, skip them and score the next one. This is rare but possible with long queue delays.

### 8.7 Job submitted outside tradie operating hours, urgency = non-emergency
**Behaviour:** Eligible tradies include only those whose `tradie_availability` covers the current moment. If the suburb has no "currently open" tradies, escalate to admin OR hold the job until operating hours (PHASE 2). MVP: escalate to admin immediately — it's clearer.

### 8.8 Job submitted outside all tradie operating hours, urgency = emergency
**Behaviour:** `accepts_emergency = true` tradies are eligible regardless of hours. If none, admin escalation.

### 8.9 Duplicate submission (member double-clicks Submit)
**Handled by:** Form-level debounce + server-side uniqueness: no two jobs can exist for the same (member_user_id, property_id, category_id, submitted_at within 60 seconds). Not a hard DB constraint — enforced in the controller.

### 8.10 Tradie tries to accept after already accepting a sibling
**Behaviour:** The sibling offer is already `superseded` — their click on the old notification hits an expired state. Return friendly "this offer is no longer available" page.

### 8.11 Queue worker is down when offer should expire
**Mitigation:** A scheduled Artisan command `dispatch:sweep-expired-offers` runs every minute as a safety net. It finds any `offered` offers where `expires_at < now()` and processes them as expired. Idempotent.

### 8.12 Admin manually assigns a job
**Flow:** Admin picks a tradie. System creates a `job_offer` with `round = current_round + 1, rank_in_round = 1, status = 'accepted', score = null, offered_at = now(), accepted_at = now()`. Updates job to `assigned`. Logs "admin override" in status log note. No notification expiry machinery — this is a direct assignment.

### 8.13 Admin reassigns a disputed job
**Flow:** Admin marks original job `cancelled` with reason, OR transitions `disputed → assigned` with a new tradie via the same admin-manual-assign path. The original assignment stays in the status log for audit.

---

## 9. Observability

Dispatch is async and invisible without instrumentation. Required:

### 9.1 Logs
Every dispatch decision logs at INFO level (to the `dispatch` channel):
```
[dispatch] job=JOB-0142 round=1 eligible=7 scored_top3=[(12, 176.3), (7, 141.0), (23, 98.5)] created_offers=[#449]
[dispatch] offer=449 expired. advancing rank.
[dispatch] job=JOB-0142 round=1 offer=450 rank=2 tradie=7 score=141.0
[dispatch] job=JOB-0142 all offers in all rounds exhausted. escalating to admin.
```

### 9.2 Metrics (for Pulse / Horizon dashboards)
- `dispatch.jobs_dispatched` — counter
- `dispatch.time_to_first_offer_ms` — histogram (submission → first offer created)
- `dispatch.time_to_acceptance_ms` — histogram (submission → accepted)
- `dispatch.rounds_needed` — histogram (1, 2, or "escalated")
- `dispatch.offers_expired` — counter
- `dispatch.offers_declined_by_reason` — counter by reason

### 9.3 Sentry
- Dispatch exceptions (eligibility query failures, database deadlocks) → Sentry at ERROR.
- Escalations to admin → Sentry at WARNING (not an error, but worth visibility).

---

## 10. Testing requirements

Dispatch is the most test-covered part of the codebase. Non-negotiable.

### 10.1 Unit tests (Pest, `tests/Unit/Dispatch/`)
- `TradieScorerTest` — 20+ cases covering each scoring factor in isolation + combined.
- `EligibilityFilterTest` — filtering by subscription, category, suburb, hours.
- `WindowCalculatorTest` — correct window for each urgency level.

### 10.2 Feature tests (`tests/Feature/Dispatch/`)
- Submitting a job creates `job_offers`, status transitions correctly.
- Tradie accepting transitions job to `assigned` and notifies member.
- Offer expiring advances to next rank.
- All ranks in round 1 failing advances to round 2.
- All ranks in round 2 failing escalates to admin.
- Two tradies accepting at the same time → only one succeeds (parallel mode).
- Member cancelling mid-dispatch cleans up offers.
- Duplicate job submission within 60s returns the existing job.
- Tradie with paused flag (dispute-pending) excluded from dispatch.
- Tradie whose subscription lapsed between dispatch and acceptance → their live offer still valid.
- Emergency job finds `accepts_emergency=true` tradie outside normal hours.

### 10.3 Load considerations
- MVP target: 100 simultaneous in-flight jobs, 500 dispatches/day. The current design handles this on a single VPS without tuning.
- Dispatch queries take <50ms on seeded dataset of 200 tradies / 15 suburbs. Benchmark with `tests/Performance/DispatchBenchmarkTest.php` (optional but recommended).

---

## 11. Configuration (`config/dispatch.php`)

Everything tunable lives here. Changes take a cache clear, not a deploy.

```php
<?php

return [

    'mode' => env('DISPATCH_MODE', 'sequential'), // 'sequential' | 'parallel'

    'offers_per_round' => 3,
    'max_rounds' => 2,

    'windows_seconds' => [
        'emergency'   => 120,
        'same_day'    => 900,    // 15 min
        'within_48h'  => 1800,   // 30 min
        'flexible'    => 3600,   // 60 min
    ],

    'scoring' => [
        'rating_weight'               => 10,
        'default_rating_for_unrated'  => 4.0,
        'response_time_max_points'    => 30,
        'response_time_max_minutes'   => 30,
        'neutral_response_time_points'=> 15,
        'acceptance_rate_weight'      => 20,
        'acceptance_min_offers'       => 5,
        'neutral_acceptance_points'   => 10,
        'workload_penalty_per_job'    => 2,
        'workload_penalty_cap'        => 10,
        'member_priority_bonus'       => 5,
        'dispute_penalty'             => 30,
        'expiry_penalty'              => 15,
        'dispute_lookback_days'       => 30,
        'expiry_lookback_days'        => 7,
    ],

    'duplicate_submission_seconds' => 60,

    'admin_review_escalation_notification_emails' => [
        'ops@tradify.au',
    ],

];
```

---

## 12. Changes to dispatch (process)

This doc is change-controlled. When modifying dispatch:

1. Propose the change with a clear problem statement.
2. Show the expected effect on scoring via `TradieScorer` unit tests.
3. Update `05-dispatch-engine.md` BEFORE the code.
4. Update `config/dispatch.php` defaults.
5. Bump a version in `config/dispatch.php` (`'version' => 2`) so logs can be correlated.
6. Monitor `dispatch.rounds_needed` and `dispatch.time_to_acceptance_ms` for a week.

The agent must not change dispatch logic without the user approving the change.

---

## 13. Open decisions

| # | Decision | Consequence if deferred |
|---|---|---|
| 1 | Sequential vs parallel (§2) | Docs assume sequential. |
| 2 | Windows for same-day and flexible (§6.1) | Docs assume Option B (recommended). |
| 3 | Auto-confirm delay for member review (`01-product-spec.md §11`) | Defaults to 7 days; not a dispatch concern directly. |
| 4 | Offers per round (currently 3) | Tunable in config. |
| 5 | Max rounds (currently 2) | Tunable in config. |

> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 09 — Development Guide

**Status:** Canonical. These are the conventions. The agent follows them by default; deviations require justification.

---

## 1. Folder structure (full)

```
app/
├── Actions/                         # Single-purpose action classes (one public method: execute/handle)
│   ├── DispatchJobAction.php
│   ├── AcceptOfferAction.php
│   ├── DeclineOfferAction.php
│   ├── CompleteJobAction.php
│   ├── CancelJobAction.php
│   ├── SubmitReviewAction.php
│   ├── RegisterMemberAction.php
│   ├── AddPropertyAction.php
│   ├── SubmitTradieApplicationAction.php
│   ├── ApproveTradieAction.php
│   ├── SuspendTradieAction.php
│   ├── StartSubscriptionAction.php
│   ├── CancelSubscriptionAction.php
│   └── ApplySubscriptionWebhookEvent.php
├── Console/
│   ├── Commands/
│   │   ├── SweepExpiredOffers.php
│   │   ├── AutoConfirmStaleJobs.php
│   │   └── RebuildDailyPerformance.php
│   └── Kernel.php                   # Schedule definitions
├── Enums/                           # PHP backed enums for every Postgres enum type
├── Events/
│   ├── JobStatusChanged.php
│   ├── LeadOffered.php
│   ├── LeadWithdrawn.php
│   └── AdminReviewRequired.php
├── Exceptions/
│   ├── InvalidStatusTransitionException.php
│   ├── OfferNoLongerAvailableException.php
│   ├── OfferExpiredException.php
│   └── SubscriptionInactiveException.php
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── Member/
│   │   ├── Tradie/
│   │   ├── Admin/
│   │   └── Webhooks/
│   ├── Middleware/
│   │   ├── EnsureActiveMemberSubscription.php
│   │   ├── EnsureApprovedTradie.php
│   │   ├── EnsureRole.php
│   │   └── HandleInertiaRequests.php
│   ├── Requests/                    # Form Request validation classes
│   │   ├── Member/
│   │   ├── Tradie/
│   │   ├── Admin/
│   │   └── Auth/
│   └── Resources/                   # Inertia-side or JSON resources
│       ├── JobResource.php
│       ├── JobPublicResource.php
│       ├── JobOfferResource.php
│       └── TradieCompanySummary.php
├── Jobs/                            # Queue jobs (not business operations — those live in Actions/)
│   ├── AdvanceToNextRank.php        # Dispatch round progression
│   ├── ExpireOffer.php
│   ├── SendLeadNotification.php
│   ├── NotifyMemberAssigned.php
│   ├── ProcessStripeWebhookEvent.php
│   └── CancelPendingExpiryJobs.php
├── Listeners/
│   ├── LogOutboundEmail.php
│   └── UpdateTradieRatingOnReview.php
├── Models/
│   ├── User.php
│   ├── MemberSubscription.php
│   ├── MemberPlan.php
│   ├── Property.php
│   ├── Suburb.php
│   ├── TradieCompany.php
│   ├── TradieSubscription.php
│   ├── TradiePlan.php
│   ├── TradieCategory.php
│   ├── IssueType.php
│   ├── TradieServiceArea.php
│   ├── TradieCompanyCategory.php
│   ├── TradieAvailability.php
│   ├── Job.php
│   ├── JobOffer.php
│   ├── JobImage.php
│   ├── JobStatusLog.php
│   ├── JobCompletionReport.php
│   ├── Review.php
│   ├── OutboundMessage.php
│   ├── TradiePerformanceDaily.php
│   ├── MemberCredit.php
│   └── SavedTradie.php
├── Notifications/
│   ├── LeadOfferedNotification.php
│   ├── MemberTradieAssignedNotification.php
│   ├── ... (one per row in 08-notifications.md)
│   └── Channels/
│       └── TwilioChannel.php
├── Policies/
│   ├── JobPolicy.php
│   ├── PropertyPolicy.php
│   ├── JobOfferPolicy.php
│   ├── TradieCompanyPolicy.php
│   └── MemberSubscriptionPolicy.php
├── Providers/
│   ├── AppServiceProvider.php
│   ├── AuthServiceProvider.php      # Policy bindings
│   ├── BroadcastServiceProvider.php
│   ├── EventServiceProvider.php
│   └── NotificationServiceProvider.php  # Twilio channel binding
├── Support/                         # DTOs, value objects, utility classes
│   ├── ScoringContext.php           # DTO for dispatch scoring
│   └── EligibleTradie.php           # DTO
└── Services/                        # Multi-step domain services + external API wrappers
    ├── TradieScorer.php             # Pure scoring function, unit-tested exhaustively
    ├── EligibleTradiesQuery.php     # Builds the candidate set for a dispatch round
    ├── JobStatusTransition.php      # Enforces allowed status transitions
    ├── TwilioSmsService.php
    ├── StripeBillingService.php     # Thin wrapper; most Stripe work is via Cashier directly
    └── GooglePlacesService.php

bootstrap/
└── app.php                          # Laravel 11+ app bootstrap

config/
├── app.php
├── auth.php
├── broadcasting.php
├── cache.php
├── cashier.php
├── database.php
├── dispatch.php                     # Our dispatch tunables
├── filesystems.php
├── logging.php
├── queue.php
├── reverb.php
├── sentry.php
├── services.php
└── features.php                     # Feature flags (phone_verification, etc.)

database/
├── factories/
├── migrations/
├── seeders/
│   ├── DatabaseSeeder.php
│   ├── SuburbSeeder.php
│   ├── TradieCategorySeeder.php
│   ├── IssueTypeSeeder.php
│   ├── MemberPlanSeeder.php
│   ├── TradiePlanSeeder.php
│   ├── DevUserSeeder.php            # local/staging only
│   └── data/
│       ├── wa_suburbs.csv
│       └── issue_types.json
└── schema/                          # Optional Postgres schema dumps for Laravel

public/
├── index.php
├── favicon.ico
└── robots.txt

resources/
├── css/
│   └── app.css
├── js/
│   ├── Components/
│   │   ├── ui/                      # primitives
│   │   └── domain/                  # business components
│   ├── Hooks/
│   │   ├── useAuth.ts
│   │   ├── useToast.ts
│   │   └── useEchoChannel.ts
│   ├── Layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── MemberLayout.tsx
│   │   ├── TradieLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   └── PublicLayout.tsx
│   ├── Lib/
│   │   ├── echo.ts
│   │   ├── formatters.ts
│   │   ├── routes.ts                # Ziggy
│   │   └── strings.ts               # Copy bank
│   ├── Pages/                       # Maps 1:1 to Inertia routes (see 06-frontend-spec.md)
│   ├── Types/
│   │   ├── api.ts
│   │   ├── domain.ts
│   │   └── inertia.d.ts
│   └── app.tsx
└── views/
    ├── app.blade.php                # Inertia root
    └── emails/                      # Blade email templates

routes/
├── web.php
├── auth.php
├── webhooks.php
├── channels.php
└── api.php                          # Empty at MVP

tests/
├── Feature/
│   ├── Auth/
│   ├── Member/
│   ├── Tradie/
│   ├── Admin/
│   ├── Dispatch/
│   └── Webhooks/
├── Unit/
│   └── Dispatch/
├── Pest.php
└── TestCase.php

storage/                             # Laravel default
vendor/                              # Composer
node_modules/                        # npm

.env.example
.gitignore
.editorconfig
.prettierrc
.php-cs-fixer.php
phpunit.xml
pest.xml
tsconfig.json
vite.config.ts
package.json
composer.json
docker-compose.yml                   # Sail
```

---

## 2. Naming conventions

### 2.1 PHP
- Classes: `PascalCase` (`TradieCompany`, `DispatchJobAction`).
- Methods: `camelCase` (`execute`, `scoreFor`).
- Constants: `UPPER_SNAKE_CASE`.
- Config keys: `snake_case` (`dispatch.offers_per_round`).
- Files: one class per file, file name matches class name.

### 2.2 Database
- Tables: plural `snake_case`.
- Columns: singular `snake_case`, suffixes `_at` (timestamps), `_cents` (money), `_id` (FKs), `is_`/`has_` prefixes for booleans.
- Enums: Postgres types are `snake_case` (`job_status`, `user_role`).

### 2.3 TypeScript / React
- Components: `PascalCase` (`LeadCard`, `JobStatusPill`).
- Hooks: `camelCase` prefixed `use` (`useAuth`, `useEchoChannel`).
- Files: match the primary export (`LeadCard.tsx`, `useAuth.ts`).
- Types: `PascalCase` (`JobOffer`, `MemberPlan`).
- Props interfaces: `{ComponentName}Props` (`LeadCardProps`).
- Constants: `UPPER_SNAKE_CASE`.

### 2.4 CSS / Tailwind
- Prefer utilities. Where extracting is unavoidable, use BEM-ish: `card__header`, `lead-card--expired`.

### 2.5 Git branches
- `main` — production.
- `dev` — integration. Auto-deploys to staging.
- `feat/<ticket-id>-short-description` — feature branches off `dev`.
- `fix/<ticket-id>-...`, `chore/...`, `docs/...`.

---

## 3. Action class pattern

For any non-trivial business operation, extract to an Action class under `app/Actions/`.

**Rules:**
- One public method, typically named `execute` or `handle`.
- Injected dependencies via constructor.
- Stateless.
- Returns a DTO or model; doesn't return HTTP responses.
- Thrown exceptions are typed and meaningful.

**Example:**

```php
namespace App\Actions;

use App\Models\Job;
use App\Models\JobOffer;
use App\Exceptions\OfferExpiredException;
use Illuminate\Support\Facades\DB;

final class AcceptOfferAction
{
    public function __construct(
        private readonly \App\Services\Notifier $notifier,
    ) {}

    public function execute(int $offerId, int $tradieUserId): JobOffer
    {
        return DB::transaction(function () use ($offerId, $tradieUserId) {
            $offer = JobOffer::lockForUpdate()->findOrFail($offerId);

            if ($offer->status !== 'offered') {
                throw new OfferNoLongerAvailableException();
            }
            if (now()->greaterThan($offer->expires_at)) {
                throw new OfferExpiredException();
            }

            $offer->update(['status' => 'accepted', 'accepted_at' => now()]);

            $offer->job->update([
                'status' => 'assigned',
                'assigned_tradie_company_id' => $offer->tradie_company_id,
                'assigned_at' => now(),
            ]);

            JobOffer::where('job_id', $offer->job_id)
                ->where('round', $offer->round)
                ->where('id', '!=', $offer->id)
                ->whereIn('status', ['pending', 'offered'])
                ->update(['status' => 'superseded', 'superseded_at' => now()]);

            return $offer;
        });
    }
}
```

Controller becomes thin:

```php
public function accept(int $offerId, AcceptOfferAction $action)
{
    $offer = $action->execute($offerId, $request->user()->id);
    return response()->json(new JobResource($offer->job));
}
```

---

## 4. Validation (Form Requests)

Every mutating endpoint has a Form Request class. Validation lives there, never in controllers.

**Example:**

```php
namespace App\Http\Requests\Member;

class SubmitJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'member'
            && $this->user()->hasActiveMemberSubscription();
    }

    public function rules(): array
    {
        return [
            'property_id' => [
                'required', 'integer',
                Rule::exists('properties', 'id')
                    ->where('member_user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],
            'tradie_category_id' => ['required', 'integer', 'exists:tradie_categories,id'],
            'issue_type_id' => ['nullable', 'integer', 'exists:issue_types,id'],
            'custom_issue' => ['nullable', 'string', 'max:200', 'required_without:issue_type_id'],
            'urgency' => ['required', Rule::in(['emergency','same_day','within_48h','flexible'])],
            'description' => ['nullable', 'string', 'max:2000'],
            'best_contact_time' => ['nullable', 'string', 'max:32'],
            'image_ids' => ['nullable', 'array', 'max:10'],
            'image_ids.*' => ['integer', Rule::exists('job_images', 'id')
                ->where('uploaded_by_user_id', $this->user()->id)
                ->whereNull('job_id')],
        ];
    }
}
```

---

## 5. Authorization (Policies)

Every resource-level check uses a Policy. Controllers call `$this->authorize(...)` or `Gate::authorize(...)`.

**Example:**

```php
namespace App\Policies;

class JobPolicy
{
    public function view(User $user, Job $job): bool
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'member' && $job->member_user_id === $user->id) return true;
        if ($user->role === 'tradie'
            && $user->tradieCompany
            && $job->assigned_tradie_company_id === $user->tradieCompany->id
        ) return true;
        return false;
    }

    public function cancel(User $user, Job $job): bool
    {
        if ($user->role === 'admin') return true;
        return $user->id === $job->member_user_id
            && in_array($job->status, ['pending_dispatch','offered','assigned','tradie_on_the_way','rescheduled']);
    }
}
```

Register in `AuthServiceProvider`:
```php
protected $policies = [
    Job::class => JobPolicy::class,
    // ...
];
```

Controller:
```php
public function cancel(Job $job) {
    $this->authorize('cancel', $job);
    // ...
}
```

---

## 6. Models

- Fillable only what's mass-assignable; the rest via explicit setters.
- Casts: cast everything. Booleans, dates, enums, JSON.
- Relationships: typed return (`public function property(): BelongsTo`).
- Scopes: `scopeActive`, `scopeForSuburb` — no inline query fragments in controllers.
- **No query logic in models beyond simple scopes.** Complex queries belong in dedicated query classes under `app/Services/`.

**Enum casts (Postgres enums):**

Laravel supports native enums (PHP 8.1+). Define:
```php
enum JobStatus: string {
    case PendingDispatch = 'pending_dispatch';
    case Offered = 'offered';
    // ...
}
```

Model:
```php
protected $casts = [
    'status' => JobStatus::class,
    'urgency' => Urgency::class,
    // ...
];
```

---

## 7. Testing expectations

### 7.1 Framework
Pest (on top of PHPUnit). Use `it()` / `test()` syntax.

### 7.2 What MUST have tests

- **Every dispatch action** (scoring, acceptance, decline, expiry, round advance). Aim 95%+ coverage on `app/Actions/` and `app/Services/TradieScorer.php`.
- **Every state transition** through the `JobStatusTransition` class.
- **Every money calculation** (discount, refund, invoice totals).
- **Every webhook handler** (Stripe, Twilio, Postmark) — signature verification + event dispatch.
- **Every Policy** (happy + negative paths).

### 7.3 What SHOULD have tests
- Every Form Request's rules (at least one valid + one invalid example).
- Every non-trivial controller.
- Tradie application lifecycle end-to-end (feature test).
- Member registration + subscription activation end-to-end (feature test with Stripe fake).

### 7.4 What CAN skip tests
- Simple CRUD endpoints with no business logic.
- React components (write unit tests later if they grow complex).
- Page routing.

### 7.5 Test patterns

```php
test('scoring prefers premium plan over standard', function () {
    $standardTradie = TradieCompany::factory()
        ->withPlan(TradiePlan::standard())
        ->create();
    $premiumTradie  = TradieCompany::factory()
        ->withPlan(TradiePlan::premium())
        ->create();

    $ctx = new ScoringContext(/* ... */);

    $scorer = app(TradieScorer::class);

    expect($scorer->score($ctx, $premiumTradie->toEligible()))
        ->toBeGreaterThan($scorer->score($ctx, $standardTradie->toEligible()));
});
```

### 7.6 Factories

One per model. Use `definition()` and trait-style state methods:

```php
class TradieCompanyFactory extends Factory {
    public function approved(): static {
        return $this->state(fn() => ['status' => 'approved', 'approved_at' => now()]);
    }

    public function withPlan(TradiePlan $plan): static {
        return $this->afterCreating(fn($company) => 
            TradieSubscription::factory()
                ->for($company)
                ->for($plan)
                ->active()
                ->create()
        );
    }
}
```

### 7.7 Running tests

```bash
php artisan test                # full suite
php artisan test --filter=Dispatch
php artisan test --parallel
```

CI runs the full suite on every PR.

---

## 8. Linting & formatting

### 8.1 PHP
- **Laravel Pint** (`laravel/pint`) — run on every PR.
- Config in `pint.json` using the `laravel` preset.

### 8.2 TypeScript / React
- **Prettier** for formatting.
- **ESLint** with `@typescript-eslint/recommended` + `react-hooks/recommended`.
- Config in `.prettierrc` and `eslint.config.js`.

### 8.3 Commit hook (recommended)
`husky` + `lint-staged` runs Pint on staged PHP and Prettier on staged TS/React.

---

## 9. Git workflow

### 9.1 Branch + commit conventions

- Every non-trivial change → feature branch → PR into `dev`.
- PR → require at least 1 review (human) before merge.
- `dev` → `main` via a release PR (or just fast-forward at MVP).

### 9.2 Commit message format

`[phase-N] <type>: <short imperative>`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

Examples:
```
[phase-1] feat: add member subscription activation via Stripe webhook
[phase-1] fix: prevent double-acceptance of the same offer
[phase-1] test: add dispatch round advancement tests
[phase-1] docs: update 05-dispatch-engine with approved windows
```

### 9.3 PR description template

- What changed
- Why (reference DECISION REQUIRED or ticket)
- How tested
- Docs updated (yes/no — if no, why not)

---

## 10. Queueing & scheduling

### 10.1 Queue connection
`QUEUE_CONNECTION=redis` in all environments. Never `sync` in staging/prod.

### 10.2 Horizon supervisors (`config/horizon.php`)

```php
'environments' => [
    'production' => [
        'supervisor-high' => [
            'connection' => 'redis',
            'queue' => ['notifications-high'],
            'balance' => 'auto',
            'processes' => 5,
            'tries' => 3,
        ],
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => ['notifications', 'default'],
            'balance' => 'auto',
            'processes' => 10,
            'tries' => 3,
        ],
    ],
],
```

### 10.3 Scheduled commands (`app/Console/Kernel.php`)

```php
protected function schedule(Schedule $schedule): void
{
    // Safety net: expire offers whose queued ExpireOffer didn't run
    $schedule->command('dispatch:sweep-expired-offers')
        ->everyMinute()
        ->withoutOverlapping();

    // Auto-confirm jobs after 7 days of no review
    $schedule->command('jobs:auto-confirm-stale')
        ->dailyAt('02:00');

    // Rebuild tradie performance rollup
    $schedule->command('tradies:rebuild-daily-performance')
        ->dailyAt('03:00');

    // Laravel Horizon metrics snapshot
    $schedule->command('horizon:snapshot')
        ->everyFiveMinutes();
}
```

All scheduled commands must be idempotent and safe to run twice.

---

## 11. Logging

### 11.1 Channels (`config/logging.php`)

- `stack` (default) → `daily` files
- `dispatch` → dedicated channel for dispatch engine events (separate file)
- `webhooks` → dedicated channel for Stripe/Twilio/Postmark webhook payloads
- `sentry` → forward to Sentry for `error` and above

### 11.2 Structured logging

All log calls use context arrays:
```php
Log::channel('dispatch')->info('offer.created', [
    'job_id' => $job->id,
    'offer_id' => $offer->id,
    'tradie_company_id' => $tradie->id,
    'score' => $score,
    'round' => $round,
]);
```

Never log PII (full name, address, phone) at `info` level. Log IDs; cross-reference in the DB.

---

## 12. Environment parity

- Local, staging, and production all run Postgres + Redis + Reverb. No "it works on my machine" where local uses SQLite or memory-queue.
- Sail's `docker-compose.yml` mirrors production services. Only differences: single-container services (Postgres/Redis) vs managed.

---

## 13. Docs discipline

- Every PR that changes behaviour MUST update the relevant doc.
- Every resolved `DECISION REQUIRED` is a PR that updates all the docs referencing it.
- Docs go in the same commit as the code (not a follow-up). CI should fail if code changes in a "domain" folder without a corresponding doc change. (Optional lint — can skip at MVP.)

---

## 14. What "done" means

A task is done when:

- [ ] Tests you wrote pass locally.
- [ ] `php artisan test` passes the full suite.
- [ ] `npm run build` succeeds without errors.
- [ ] `./vendor/bin/pint --test` clean.
- [ ] `npm run lint` clean.
- [ ] The behaviour matches the relevant doc.
- [ ] If you discovered a doc was wrong, you updated it in the same commit.
- [ ] You committed with a clear message.
- [ ] PR description explains what changed and why.
- [ ] CI is green.

Not before.

---

## 15. Common pitfalls (read once, avoid forever)

1. **Using `$job->save()` inside a loop without transactions** — causes partial state if one iteration fails. Wrap in `DB::transaction()`.
2. **Rounding money at the frontend** — never. All money math on the server in integer cents.
3. **Calling notifications synchronously** — always `->queue(...)` or mark the Notification class `ShouldQueue`.
4. **Forgetting `lockForUpdate()` on offer accept** — causes double-acceptance races. Always lock.
5. **Skipping Postgres enum migrations in `down()`** — leaves orphaned types. Use `DB::statement('DROP TYPE IF EXISTS ...')`.
6. **Mixing Inertia redirects with JSON responses inconsistently** — pick one per endpoint and stick to it.
7. **Seeding Stripe Price IDs in test environments** — they won't match. Use env-specific seeders or DB-populate at tenant setup.
8. **Using `now()` everywhere instead of dependency-injected Clock** — makes testing painful. At MVP, `now()` is fine; introduce `Clock::now()` abstraction if tests become brittle.
9. **Reverb with `QUEUE_CONNECTION=sync`** — broadcasts don't fire in production. Always Redis-queue in prod.
10. **Storing Twilio token in git** — never. Use `.env` and Forge secrets.

---

## 16. Package whitelist

These are the only third-party packages you should introduce without asking:

**Composer (PHP):**
- `laravel/framework`, `laravel/cashier`, `laravel/horizon`, `laravel/reverb`, `laravel/sanctum`, `laravel/pint`
- `inertiajs/inertia-laravel`, `tightenco/ziggy`
- `twilio/sdk`
- `resend/resend-laravel`
- `sentry/sentry-laravel`
- `pestphp/pest`, `pestphp/pest-plugin-laravel`

**Phase 2 additions (DO NOT install at MVP):**
- `league/flysystem-aws-s3-v3` — only when migrating file storage to R2/S3

**NPM:**
- `react`, `react-dom`, `@inertiajs/react`, `typescript`
- `tailwindcss`, `@tailwindcss/vite` (Tailwind 4 Vite plugin — no PostCSS config needed)
- `lucide-react`, `date-fns`, `recharts`
- `laravel-echo`, `pusher-js`
- `@sentry/react`
- `ziggy-js`
- `vite`, `@vitejs/plugin-react`
- `eslint`, `prettier`, `typescript-eslint`

Anything else: **stop and ask**.

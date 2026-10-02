> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 07 — Integrations

**Status:** Canonical. One section per external service. Each section is self-contained — if you're integrating Stripe, you don't need to read the Twilio section.

---

## 1. Stripe (payments)

### 1.1 Library
**Laravel Cashier v16+** (`laravel/cashier`). Do not roll a custom Stripe integration.

### 1.2 What Cashier gives us
- `Billable` trait on `User` model → subscription methods (`subscribe`, `cancel`, etc.)
- Webhook controller mapping Stripe events to model state
- Stripe Checkout integration for hosted payment pages

### 1.3 Setup

```bash
composer require laravel/cashier
php artisan migrate   # Cashier's migrations
php artisan vendor:publish --tag="cashier-migrations"
```

Config in `config/cashier.php`:
```php
'currency' => 'aud',
'currency_locale' => 'en_AU',
```

Add to `User` model:
```php
use Laravel\Cashier\Billable;

class User extends Authenticatable {
    use Billable;
    // ...
}
```

**AGENT NOTE:** Cashier stores Stripe customer ID and subscription status on the user's row (`stripe_id`, `pm_*`, `trial_ends_at`). **We ALSO keep our own `member_subscriptions` and `tradie_subscriptions` tables** because (a) a tradie's Billable is actually the `TradieCompany`, not the `User`, (b) we need richer status than Cashier's default, (c) we want our own history. Use Cashier as the Stripe bridge, but source-of-truth for "what plan is this member on" is our tables.

### 1.4 Billable models

- `User` is billable for members (their subscription).
- `TradieCompany` is also billable — add the `Billable` trait. Cashier supports multiple billables.

**AGENT NOTE:** `TradieCompany` defines its own `subscriptions(): HasMany` method pointing to `tradie_subscriptions`. In PHP, a class method takes precedence over a trait method of the same name, so this overrides Cashier's `subscriptions()` without conflict. Do not remove or rename TradieCompany's `subscriptions()` — it is load-bearing.

### 1.5 Products and prices in Stripe

Create in Stripe Dashboard (or via Stripe CLI — document in `docs-source/stripe-setup.md`):

**Products:**
- "Tradify Member — Basic"
- "Tradify Member — Pro"
- "Tradify Member — Investor"
- "Tradify Tradie — Standard"
- "Tradify Tradie — Premium"

**Prices (recurring, yearly, AUD):**
- Each product has one price, **tax-inclusive** (GST included in the displayed price). Stripe Tax is deferred — enable it when the business is GST-registered and volume justifies automated tax reporting.

Record each Stripe Price ID in `member_plans.stripe_price_id` and `tradie_plans.stripe_price_id` via a one-time admin action or seeder.

### 1.6 Subscription flow (member)

**Start:**
1. Member picks plan at `/register/member/plan`.
2. Controller: `$user->newSubscription('default', $plan->stripe_price_id)->checkout([...])`.
3. Redirect to Stripe-hosted Checkout page.
4. User completes payment → Stripe redirects to `/membership/success?session_id=...`.
5. Webhook `checkout.session.completed` fires at Stripe → our app.

**Webhook handler `checkout.session.completed`:**

We route by `metadata.billable_type` set on the Checkout Session at creation time. This lets a single webhook endpoint handle both member and tradie checkouts.

```php
public function handleCheckoutSessionCompleted(array $payload): Response
{
    $session = $payload['data']['object'];

    if (($session['mode'] ?? '') !== 'subscription') {
        return $this->successMethod();
    }

    $billableType = $session['metadata']['billable_type'] ?? 'user';

    if ($billableType === 'tradie_company') {
        // Metadata: tradie_plan_id — find TradieCompany by stripe_id, write tradie_subscriptions
        $this->handleTradieCheckout($session);
    } else {
        // Metadata: member_plan_id (or derive from line items) — find User by stripe_id, write member_subscriptions
        $this->handleMemberCheckout($session);
    }

    return $this->successMethod();
}
```

**Setting the metadata at checkout time:**

Member checkout:
```php
$user->newSubscription('default', $plan->stripe_price_id)->checkout([
    'success_url' => route('membership.success').'?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url' => route('membership'),
    'metadata' => ['member_plan_id' => $plan->id],  // billable_type omitted → defaults to 'user'
]);
```

Tradie checkout:
```php
$tradieCompany->newSubscription('default', $plan->stripe_price_id)->checkout([
    'success_url' => route('tradie.subscription.success').'?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url' => route('tradie.activate-subscription'),
    'metadata' => ['billable_type' => 'tradie_company', 'tradie_plan_id' => $plan->id],
]);
```

**AGENT NOTE:** Cashier also creates its own `subscriptions` row. Our `member_subscriptions` and `tradie_subscriptions` are additional (see §1.3 note). The Cashier row is not used for business logic — our tables are the source of truth.

**AGENT NOTE:** `StripeWebhookController` extends Cashier's `WebhookController`. Its methods must return `Symfony\Component\HttpFoundation\Response` (not `Illuminate\Http\Response`) because that is what Cashier's `successMethod()` returns. Import `use Symfony\Component\HttpFoundation\Response;`, not `use Illuminate\Http\Response;`.

### 1.7 Webhook events we handle

| Event | Action |
|---|---|
| `checkout.session.completed` | Create our subscription row, mark user active |
| `invoice.payment_succeeded` | Extend `end_date` on renewal |
| `invoice.payment_failed` | Mark subscription `past_due`, notify user |
| `customer.subscription.updated` | Reconcile plan change (if member upgrades mid-term via Billing Portal) |
| `customer.subscription.deleted` | Mark subscription `canceled` |

### 1.8 Webhook signature verification

Cashier does this automatically IF `STRIPE_WEBHOOK_SECRET` is set in `.env`. The middleware `\Laravel\Cashier\Http\Middleware\VerifyWebhookSignature` is applied to the webhook route.

If extending Cashier's webhook controller, keep the middleware:
```php
Route::post('webhooks/stripe', [StripeController::class, 'handleWebhook'])
    ->middleware(\Laravel\Cashier\Http\Middleware\VerifyWebhookSignature::class);
```

### 1.9 Customer portal

Cashier provides `$user->redirectToBillingPortal(route('membership'))`. Enable Customer Portal in Stripe Dashboard first. Members use this to update card, cancel, download invoices.

For MVP, use the Portal for most billing UX instead of building our own. Reduces surface area.

### 1.10 Testing Stripe locally

Use Stripe CLI:
```bash
stripe login
stripe listen --forward-to localhost/webhooks/stripe
stripe trigger checkout.session.completed
```

Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0341` (fails on payment).

### 1.11 Tradie subscription flow

Same as member, but with `TradieCompany` as the billable:
```php
$tradieCompany->newSubscription('default', $plan->stripe_price_id)->checkout([...]);
```

Approval flow: tradie pays AFTER admin approves their application. Pending-review tradies see an "awaiting review" page, not the plan selector.

### 1.12 Renewal reminders

PHASE 2. Scheduled job 14 days before `end_date` sends reminder email. Not in MVP.

### 1.13 Cancellation flow

Member:
- `POST /membership/cancel` → `$user->subscription('default')->cancel()` (cancels at period end).
- We update `member_subscriptions.auto_renew = false`, `canceled_at = now()`.
- `customer.subscription.deleted` webhook fires at period end → we set `status = canceled`.

Tradie: identical pattern against `TradieCompany`.

---

## 2. Twilio (SMS)

### 2.1 Library
**Official Twilio SDK** (`twilio/sdk`). Wrap it in `app/Services/TwilioSmsService.php`.

```bash
composer require twilio/sdk
```

### 2.2 Config

`config/services.php`:
```php
'twilio' => [
    'sid'    => env('TWILIO_ACCOUNT_SID'),
    'token'  => env('TWILIO_AUTH_TOKEN'),
    'from'   => env('TWILIO_FROM'),
    'status_webhook' => env('TWILIO_STATUS_WEBHOOK_URL'),
],
```

### 2.3 Sender: alpha sender ID vs phone number

**SMS sender ID: alpha sender "Tradify"** for all one-way system messages. Start the Twilio Australian alpha sender ID registration early — it takes 1–2 weeks for carrier approval. If Phase 2 adds two-way messaging, add a phone number then.

### 2.4 The service

`app/Services/TwilioSmsService.php`:

```php
class TwilioSmsService {
    public function __construct(private \Twilio\Rest\Client $client) {}

    public function send(string $to, string $body, array $meta = []): SentSms {
        $message = $this->client->messages->create($to, [
            'from'           => config('services.twilio.from'),
            'body'           => $body,
            'statusCallback' => config('services.twilio.status_webhook'),
        ]);

        return new SentSms(
            providerId: $message->sid,
            status: $message->status,
        );
    }
}
```

Bind in a ServiceProvider:
```php
$this->app->singleton(\Twilio\Rest\Client::class, fn() => new \Twilio\Rest\Client(
    config('services.twilio.sid'),
    config('services.twilio.token'),
));
```

### 2.5 Sending from Laravel Notifications

Every SMS goes through a Laravel Notification with a custom `toTwilio` channel. See `08-notifications.md` for the template list. Example:

```php
class LeadOfferedNotification extends Notification implements ShouldQueue {
    use Queueable;

    public function __construct(public JobOffer $offer) {}

    public function via($notifiable) {
        return ['twilio', 'mail'];  // belt + braces
    }

    public function toTwilio($notifiable) {
        return new TwilioMessage(
            to: $notifiable->phone,
            body: $this->buildBody(),
        );
    }

    public function toMail($notifiable) {
        return (new MailMessage)->view('emails.lead-offered', ['offer' => $this->offer]);
    }

    private function buildBody(): string {
        $job = $this->offer->job;
        $url = route('tradie.leads.show', $this->offer);
        return "New lead: {$job->urgency} {$job->category->name} in {$job->property->suburb->name}. View: {$url}";
    }
}
```

Register the Twilio channel in a ServiceProvider:
```php
Notification::extend('twilio', fn($app) => new TwilioChannel(
    $app->make(TwilioSmsService::class)
));
```

The `TwilioChannel` writes an `outbound_messages` row before sending, so every SMS is auditable.

### 2.6 Status webhook

`POST /webhooks/twilio/status` — Twilio POSTs delivery status updates.

**Signature verification:**
```php
public function __invoke(Request $request) {
    $validator = new \Twilio\Security\RequestValidator(config('services.twilio.token'));

    $isValid = $validator->validate(
        $request->header('X-Twilio-Signature'),
        $request->fullUrl(),
        $request->all()
    );

    if (!$isValid) {
        abort(403);
    }

    $sid = $request->input('MessageSid');
    $status = $request->input('MessageStatus'); // queued | sent | delivered | failed | undelivered

    $message = OutboundMessage::where('provider_message_id', $sid)->first();
    if (!$message) return response()->noContent();

    $message->update([
        'status' => $this->mapStatus($status),
        'delivered_at' => $status === 'delivered' ? now() : $message->delivered_at,
        'failed_at' => in_array($status, ['failed', 'undelivered']) ? now() : $message->failed_at,
        'error_message' => $request->input('ErrorMessage'),
    ]);

    return response()->noContent();
}
```

### 2.7 Retries

SMS sends are queued jobs. Laravel's default `$tries = 3` with exponential backoff applies. After 3 failures, the job goes to `failed_jobs` and Sentry captures it.

### 2.8 Rate limits

Twilio Australia throttles depend on your account. Start conservative:
- 1 SMS/sec/number (Twilio default)
- For lead offers we need priority delivery. Use a dedicated queue `notifications-high` processed by a separate Horizon worker.

### 2.9 Unicode and segments

- Use plain GSM-7 characters where possible. Emoji forces Unicode encoding (70 char segments vs 160).
- Keep SMS under 160 characters when possible — one segment = one charge.
- URLs: use short-links via a simple path like `https://tradify.au/l/JOB-0142` that redirects to the full URL. (OPTIONAL — MVP can use full URLs.)

### 2.10 Testing locally

Use Twilio Test Credentials (separate SID/token from production). They don't actually send messages but return realistic responses.

Or use Magic Numbers:
- `+15005550006` — success
- `+15005550001` — invalid number

---

## 3. Resend (email)

### 3.1 Library
Resend's official Laravel SDK: `resend/resend-laravel`. It bundles a mailer transport and a webhook controller.

```bash
composer require resend/resend-laravel
```

Then `MAIL_MAILER=resend`, `RESEND_API_KEY=re_...` in `.env`.

### 3.2 Mailer config

`config/mail.php`, add to `mailers` array:

```php
'resend' => [
    'transport' => 'resend',
],
```

Then set `MAIL_MAILER=resend` in `.env`.

### 3.3 Domain verification

Before sending from `@tradify.au`, verify the domain in the Resend dashboard. Resend provides 4 DNS records to add at GoDaddy's DNS panel:

- **SPF:** TXT record including Resend's sending servers
- **DKIM:** 2 CNAME records (DKIM1 + DKIM2)
- **MX** (only if receiving): MX record — **skip for MVP**, we're send-only
- **DMARC** (optional but recommended): TXT record at `_dmarc.tradify.au` with policy `p=none` initially, move to `p=quarantine` after a month of clean sending

DNS propagation: 15 min to 48h. Verification in the Resend dashboard will show green when ready.

### 3.4 Templates

**MVP: Blade templates** in `resources/views/emails/`. Simpler, version-controlled, testable.

Example `resources/views/emails/lead-offered.blade.php`:
```blade
<x-mail::message>
# New Lead

A new **{{ $job->urgency_label }}** {{ $job->category->name }} job is available in {{ $job->property->suburb->name }}.

**Issue:** {{ $job->issue_type?->name ?? $job->custom_issue }}
**Description:** {{ $job->description }}
**Expires in:** {{ $expires_in_minutes }} minutes

<x-mail::button :url="$link">
Accept this lead
</x-mail::button>

— The Tradify team
</x-mail::message>
```

React Email templates are a Resend feature worth considering in Phase 2 if the team wants richer designs. Blade is fine for MVP.

### 3.5 Sending

Standard Laravel Notification `toMail` OR direct `Mail::to(...)->send(...)`. The Resend transport is invisible to your code — it's a standard Symfony Mailer.

Every email also writes an `outbound_messages` row via a Mail listener:

```php
// app/Listeners/LogOutboundEmail.php
public function handle(MessageSending $event) {
    OutboundMessage::create([
        'user_id' => /* lookup by recipient */,
        'channel' => 'email',
        'template_key' => /* set via message metadata */,
        'recipient' => $event->message->getTo()[0]->getAddress(),
        'subject' => $event->message->getSubject(),
        'body' => $event->message->getTextBody(),
        'status' => 'queued',
    ]);
}
```

### 3.6 Webhooks

Resend's Laravel package registers a controller at `/resend/webhook` that dispatches Laravel events mapped to Resend event types:
- `EmailDelivered`
- `EmailBounced`
- `EmailComplained`
- `EmailOpened` (if tracking enabled)
- `EmailClicked` (if tracking enabled)

Set up in Resend dashboard: Add webhook endpoint `https://tradify.au/resend/webhook`, select events to listen to, save the signing secret to `.env` as `RESEND_WEBHOOK_SECRET`.

Listener to update `outbound_messages`:

```php
namespace App\Listeners;

use Resend\Laravel\Events\EmailDelivered;
use Resend\Laravel\Events\EmailBounced;

class UpdateOutboundMessageFromResend
{
    public function handleDelivered(EmailDelivered $event): void
    {
        OutboundMessage::where('provider_message_id', $event->payload['data']['email_id'])
            ->update(['status' => 'delivered', 'delivered_at' => now()]);
    }

    public function handleBounced(EmailBounced $event): void
    {
        OutboundMessage::where('provider_message_id', $event->payload['data']['email_id'])
            ->update([
                'status' => 'bounced',
                'failed_at' => now(),
                'error_message' => $event->payload['data']['bounce']['subType'] ?? 'bounce',
            ]);
    }
}
```

Register in `EventServiceProvider`.

### 3.7 Webhook signature verification

Resend signs webhooks using **Svix**. The Resend Laravel package verifies signatures automatically when `RESEND_WEBHOOK_SECRET` is set. Invalid signatures return 403 before your listener fires.

The webhook route must bypass CSRF. Resend's package puts it in the `api` middleware group by default, which is fine. If you want it under `web` for consistency, add `/resend/webhook` to the CSRF `except` list in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(except: [
        'stripe/*',
        'webhooks/*',
        'resend/webhook',
    ]);
})
```

### 3.8 Deliverability checklist

- SPF, DKIM set up at DNS provider (GoDaddy DNS panel).
- DMARC record present with `p=none` initially.
- From address: `no-reply@tradify.au` (or `hello@tradify.au` — friendlier).
- Reply-to: `support@tradify.au` (set up a Gmail/Google Workspace inbox for this, or use a catch-all on your domain).
- Don't use subject-line spam triggers ("FREE!", excessive punctuation).
- Include plain-text body alongside HTML (Laravel does this by default).
- Unsubscribe header on any marketing mail (MVP has none, so skip).

### 3.9 Testing locally

Local dev: use **Mailpit** (bundled with Laravel Sail). Set `MAIL_MAILER=smtp` with Mailpit's host/port. All emails captured at `http://localhost:8025`.

Staging/prod: Resend. Use a Resend-verified "test" subdomain if paranoid (`staging.tradify.au` DNS-verified separately).

### 3.10 Pricing and limits

Resend free tier: **3,000 emails/month, 100/day.** Enough for MVP. Paid tiers start at Pro ($20 USD/month) for 50,000 emails/month.

At MVP volumes (hundreds of members, thousands of emails), you will stay free for a long time. Monitor monthly usage in the Resend dashboard.

---

## 4. File storage (local disk at MVP)

### 4.1 Why local disk for MVP

The agent should NOT use S3 or R2 at MVP. The simpler, cheaper, perfectly adequate choice is storing files on the VPS disk.

**Why this works for MVP:**
- Hundreds of members × 2 photos per job × 500 jobs/month × ~2 MB/photo ≈ 2 GB/year. Trivial.
- One VPS, one filesystem. No network hop, no egress cost, no signature overhead.
- Migration to R2 or S3 later is a one-day job if volumes grow.

**When to migrate (Phase 2 trigger):**
- Storage exceeds 50 GB.
- You add a second app server (you'll need shared storage).
- You want a CDN in front of files.

### 4.2 Config

**MVP implementation uses the built-in `local` disk** (`Storage::disk('local')`, root = `storage/app`). The `local_private` disk described below is the target config for when signed-URL serving is needed for job images and completion reports (Phase 2 content types). Tradie credential documents uploaded during registration use the `local` disk.

`config/filesystems.php` — add a `local_private` disk for signed-URL content:

```php
'disks' => [

    'local_private' => [
        'driver' => 'local',
        'root' => storage_path('app/private'),
        'serve' => true,                                // enable Laravel's signed URL support
        'throw' => false,
        'visibility' => 'private',
    ],

],
```

Set `FILESYSTEM_DISK=local` in `.env` for MVP. Switch to `local_private` when Phase 2 signed-URL serving is needed.

### 4.3 Directory structure

```
storage/app/
├── tradie_docs/
│   └── {uuid}.{ext}                      # tradie credential uploads (licence, insurance)
│                                         # stored flat — uploaded as guest BEFORE company
│                                         # record exists, so no company ID available yet
├── jobs/
│   ├── pending/{userId}/{uuid}.jpg       # pre-submission job image uploads
│   └── {jobId}/{uuid}.jpg                # job images attached to a submitted job
└── completion/
    └── {jobId}/{uuid}.pdf                # invoice uploads from tradie
```

These paths are stored in the database: `tradie_companies.licence_document_path`, `tradie_companies.insurance_document_path`, `job_images.path`, etc. **Relative paths only** — never absolute.

**Why `tradie_docs/` is flat:** Tradie credential documents are uploaded during the registration wizard step 3, which is a guest-only flow. The company record has not been created yet at that point, so there is no `company_id` to use as a path segment. The UUID in the filename provides sufficient uniqueness.

### 4.4 Upload flow

Controller receives multipart, validates, stores:

```php
public function store(UploadJobImageRequest $request, JobImage::class): JsonResponse
{
    $path = $request->file('photo')->store(
        "jobs/pending/{$request->user()->id}",
        'local_private'
    );

    $image = JobImage::create([
        'uploaded_by_user_id' => $request->user()->id,
        'path' => $path,
        'mime' => $request->file('photo')->getMimeType(),
        'size_bytes' => $request->file('photo')->getSize(),
    ]);

    return response()->json([
        'id' => $image->id,
        'url' => URL::temporarySignedRoute(
            'file.serve',
            now()->addMinutes(10),
            ['image' => $image->id]
        ),
    ]);
}
```

### 4.5 Serving files

Files are private. Never directly exposed via `/storage/` symlink. Serve through an authenticated + signed-URL controller:

```php
// routes/web.php
Route::get('/files/{image}', [FileController::class, 'serveJobImage'])
    ->name('file.serve')
    ->middleware('signed');          // signature verification
```

```php
// app/Http/Controllers/FileController.php
public function serveJobImage(JobImage $image, Request $request): StreamedResponse
{
    Gate::authorize('view', $image);                      // policy check
    abort_unless(Storage::disk('local_private')->exists($image->path), 404);

    return Storage::disk('local_private')->response($image->path);
}
```

**Two layers of security:**
1. `middleware('signed')` rejects expired or tampered URLs (Laravel's `URL::temporarySignedRoute`).
2. `Gate::authorize` checks the authenticated user's actual permission on that image.

Signed URLs belong in Inertia props (e.g., `job.images[].url`). Frontend doesn't need to know about signing.

### 4.6 Validation

- Max size: 10 MB per image, 20 MB per PDF. Enforced in the Form Request `file` rule.
- MIME whitelist enforced server-side (`image/jpeg`, `image/png`, `image/heic`, `image/webp`, `application/pdf`). Client-side `accept=""` is UX only.
- Dimensions: reject `> 8000x8000` images server-side (use Intervention Image, or just check `getimagesize()`).
- Virus scanning: **OUT OF SCOPE at MVP.** If you open uploads to public-facing flows (tradie application docs), consider ClamAV via `xtreamwayz/clamav-php` in Phase 2.

### 4.7 Backup

Files are part of the nightly backup. `rsync storage/app/private/` to offsite storage (Backblaze B2 free tier or Cloudflare R2 free tier). See `02-architecture.md §6.3` and `PROVISIONING.md`.

### 4.8 Disk quota monitoring

Add a scheduled health-check command `php artisan disk:check-usage` that runs daily, reads `df` for the storage partition, and emails admin if usage exceeds 80%.

```php
// app/Console/Commands/CheckDiskUsage.php
public function handle(): int
{
    $total = disk_total_space(storage_path('app/private'));
    $free  = disk_free_space(storage_path('app/private'));
    $usedPercent = (($total - $free) / $total) * 100;

    if ($usedPercent > 80) {
        Mail::raw(
            "Disk usage at {$usedPercent}% on tradify VPS.",
            fn ($m) => $m->to(config('app.admin_email'))->subject('Disk space warning')
        );
    }

    return self::SUCCESS;
}
```

Schedule daily at 06:00 in `app/Console/Kernel.php`.

---

## 5. Sentry (error tracking)

### 5.1 Installation

**Laravel:**
```bash
composer require sentry/sentry-laravel
php artisan sentry:publish --dsn=$SENTRY_LARAVEL_DSN
```

**Frontend:**
```bash
npm install @sentry/react
```

### 5.2 Config

`SENTRY_LARAVEL_DSN` and `SENTRY_TRACES_SAMPLE_RATE=0.2` in `.env`.

Backend: `bootstrap/app.php` register the Sentry handler:
```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->reportable(function (Throwable $e) {
        if (app()->bound('sentry') && !app()->environment('local')) {
            app('sentry')->captureException($e);
        }
    });
})
```

Frontend: `resources/js/app.tsx`:
```ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: import.meta.env.MODE,
});
```

### 5.3 What to report

- All unhandled exceptions (automatic).
- Manually capture when a dispatch escalation occurs (`Sentry::captureMessage('dispatch escalated to admin', 'warning')`).
- User context attached on login (user_id, role) so we can correlate.

### 5.4 What NOT to report

- Validation errors (too noisy; they're user errors).
- 404s.
- Authentication failures (they'll be logged elsewhere).

### 5.5 Sampling

Production: 20% traces sample rate. Dev: 100%.

---

## 6. Google Places (address autocomplete)

### 6.1 Why server-side

Keep the API key secret. Also lets us match returned addresses against our `suburbs` table before returning to the client — client never sees a "suburb" we don't have a row for.

### 6.2 Endpoint

`GET /properties/address-autocomplete?q=...`

Backend:
```php
public function __invoke(Request $request) {
    $q = $request->query('q');
    abort_if(strlen($q) < 3, 400);

    $resp = Http::get('https://maps.googleapis.com/maps/api/place/autocomplete/json', [
        'input' => $q,
        'types' => 'address',
        'components' => 'country:au',
        'key' => config('services.google.maps_key'),
    ]);

    $predictions = collect($resp->json('predictions', []));

    return response()->json([
        'suggestions' => $predictions->map(fn($p) => [
            'place_id' => $p['place_id'],
            'description' => $p['description'],
        ]),
    ]);
}
```

A separate endpoint `GET /properties/address-details?place_id=...` fetches Place Details for a chosen prediction, extracts `address_line_1`, `suburb`, `postcode`, matches against our `suburbs` table, returns:

```json
{
  "address_line_1": "12 Palm St",
  "suburb_id": 142,
  "suburb_name": "Baldivis",
  "postcode": "6171",
  "state": "WA"
}
```

If no matching suburb in our table, return an error — don't auto-create suburbs from user input.

### 6.3 Billing

Google Places Autocomplete: ~$2.83/1000 requests. Cache results for 24h per query string (Redis).

---

## 7. Cross-cutting: webhook safety

All webhook endpoints must:

1. **Verify signature** (Stripe/Twilio) or HTTP Basic Auth (Postmark).
2. **Respond with 2xx immediately** — do not make downstream calls inline. Queue a job.
3. **Be idempotent** — process the same event twice, get the same result. Use an `idempotency_keys` table if necessary (Stripe provides `event.id`; Twilio provides `MessageSid`).
4. **Log every event** — raw payload to `storage/logs/webhooks.log` channel. Retention 14 days.
5. **Return 200 even for unrecognised event types** — don't make Stripe retry you.

---

## 8. Admin email configuration

The platform sends system notifications (new tradie applications, disk alerts, webhook failures) to an admin email address. This is configured via `ADMIN_EMAIL` in `.env`, which maps to `config('mail.admin_address')`.

In `config/mail.php`:
```php
'admin_address' => env('ADMIN_EMAIL', env('MAIL_FROM_ADDRESS', 'admin@example.com')),
```

Usage:
```php
$adminEmail = config('mail.admin_address');
Notification::route('mail', $adminEmail)->notify(new AdminNewTradieApplication($company));
```

Set `ADMIN_EMAIL` in `.env` to the inbox that receives operational alerts.

---

## 9. Open decisions

| # | Decision | Status |
|---|---|---|
| 1 | GST / Stripe Tax | §1.5 — still open; default tax-inclusive pricing for MVP. |
| 2 | SMS sender ID (alpha or number) | §2.3 — still open; default alpha "Tradify" if registration is viable. |
| 3 | File storage | **Resolved:** Local disk (`local`). Migrate to `local_private` + R2 at Phase 2. |
| 4 | Email templates (Resend templates vs Blade) | **Resolved:** Blade. |
| 5 | Virus scan on uploads | **Resolved:** Skip at MVP. |
| 6 | Address autocomplete provider | **Resolved:** Google Places. |

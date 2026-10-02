> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 08 — Notifications Catalogue

**Status:** Canonical. Every message the system sends is listed here with its trigger, channels, template, variables, and retry policy.

---

## 0. Conventions

### 0.1 Template keys
Each notification has a unique `template_key` — a snake_case string that:
- Appears in `outbound_messages.template_key`
- Maps to a Blade view file name (`resources/views/emails/{template_key}.blade.php`)
- Maps to a Notification class name (`App\Notifications\{StudlyCasedKey}`)

### 0.2 Channels
- `sms` — Twilio
- `email` — Resend
- `push` — web push / mobile push (PHASE 2; MVP skips)
- `in_app` — toast + notification centre inside the app (via broadcast to private channel)

### 0.3 Required vs optional channels
- **Required**: must deliver. Retries. Sentry if all retries fail.
- **Optional**: nice to have. Don't block critical flows if this fails.

### 0.4 User preferences (MVP vs Phase 2)
- MVP: no per-user opt-out for system notifications. Legal-required emails (receipt, etc.) always send.
- PHASE 2: preference toggles for marketing / reminders.

### 0.5 Quiet hours
- MVP: **no quiet hours applied**. SMS lead offers can fire at any time (a tradie who's accepting emergency leads is opted into 3am SMS).
- PHASE 2: per-tradie availability-aware quiet hours.

### 0.6 Rendering
- SMS: plain text, <160 chars target, <480 chars hard cap (3 segments).
- Email: HTML + plain-text alternative. Minimal CSS (inlined). Single-column responsive.
- Never put sensitive data (passwords, tokens) in email bodies that persist.

---

## 1. Notification matrix

Full inventory. Group by trigger.

### 1.1 Account lifecycle

| # | Trigger | Recipient | Template key | Channels | Priority |
|---|---|---|---|---|---|
| A1 | Member registers | Member | `welcome_member` | email | Required |
| A2 | Member subscribes (first payment) | Member | `member_subscription_activated` | email, sms | Required |
| A3 | Member payment fails | Member | `member_payment_failed` | email, sms | Required |
| A4 | Member subscription canceled | Member | `member_subscription_canceled` | email | Required |
| A5 | Tradie submits application | Admin | `admin_new_tradie_application` | email | Required |
| A6 | Tradie application approved | Tradie | `tradie_application_approved` | email, sms ¹ | Required |
| A7 | Tradie application rejected | Tradie | `tradie_application_rejected` | email | Required |
| A8 | Tradie subscribes (first payment) | Tradie | `tradie_subscription_activated` | email, sms | Required |
| A9 | Tradie payment fails | Tradie | `tradie_payment_failed` | email, sms | Required |
| A10 | Tradie suspended | Tradie | `tradie_suspended` | email | Required |
| A11 | Tradie reinstated | Tradie | `tradie_reinstated` | email | Required |
| A12 | Password reset requested | User | `password_reset` | email | Required |

### 1.2 Job flow (member-facing)

| # | Trigger | Recipient | Template key | Channels | Priority |
|---|---|---|---|---|---|
| J1 | Job submitted (confirmation) | Member | `member_job_submitted` | email, sms, in_app | Optional (in_app required) |
| J2 | Tradie assigned | Member | `member_tradie_assigned` | sms, email, in_app | Required |
| J3 | Tradie on the way | Member | `member_tradie_on_the_way` | sms, in_app | Required |
| J4 | Job completed (prompt review) | Member | `member_job_completed_prompt_review` | sms, email, in_app | Required |
| J5 | Job auto-confirmed (no response in 7d) | Member | `member_job_auto_confirmed` | email | Optional |
| J6 | Job dispatched but no tradie yet (admin escalation) | Member | `member_job_delayed` | sms, email, in_app | Required |
| J7 | Job cancelled by tradie | Member | `member_job_cancelled_by_tradie` | sms, email, in_app | Required |
| J8 | Job cancelled by admin | Member | `member_job_cancelled_by_admin` | email, in_app | Required |

### 1.3 Job flow (tradie-facing)

| # | Trigger | Recipient | Template key | Channels | Priority |
|---|---|---|---|---|---|
| T1 | Lead offered | Tradie | `tradie_lead_offered` | sms, email, in_app | Required (sms + in_app) |
| T2 | Lead superseded (parallel mode only) | Tradie | `tradie_lead_superseded` | in_app | Optional |
| T3 | Lead accepted (confirmation) | Tradie | `tradie_lead_accepted` | email, in_app | Optional (in_app required) |
| T4 | Member cancelled assigned job | Tradie | `tradie_job_cancelled_by_member` | sms, email, in_app | Required |
| T5 | Member disputed completed job | Tradie | `tradie_job_disputed` | email, in_app | Required |
| T6 | Admin resolved dispute against you | Tradie | `tradie_dispute_resolved_warning` | email | Required |

### 1.4 Admin-facing

| # | Trigger | Recipient | Template key | Channels | Priority |
|---|---|---|---|---|---|
| X1 | New tradie application | Admin | `admin_new_tradie_application` | email, in_app ² | Required |
| X2 | Job dispatch escalated (no accepts) | Admin | `admin_job_unassigned` | email, in_app | Required |
| X3 | Job disputed by member | Admin | `admin_job_disputed` | email, in_app | Required |
| X4 | Tradie hit 3 disputes in 30 days | Admin | `admin_tradie_dispute_threshold` | email | Required |
| X5 | Stripe webhook persistent failure (from `failed_jobs`) | Admin | `admin_stripe_webhook_failure` | email | Required |

**Channel deferral notes:**

¹ **A6 SMS** — `TradieApplicationApproved` sends email only in the current implementation. SMS channel is deferred until the Twilio SDK is installed (`composer require twilio/sdk`) and `TwilioChannel` is registered. See `07-integrations.md §2`.

² **X1 in_app** — `AdminNewTradieApplication` sends email only in the current implementation. The `in_app` broadcast channel requires the `TwilioChannel` registration pattern and a `private-admin.{id}` broadcast channel on the frontend. Deferred until broadcast infrastructure is built.

---

## 2. Detailed templates

Each entry: trigger logic, variables, body examples. Replace `Tradify` / `tradify.au` with real branding when resolved.

### 2.1 `welcome_member` (email)

**Trigger:** `UserRegistered` event for users with role=member. Dispatched inline when user row is created.

**Variables:** `user`.

**Subject:** `Welcome to Tradify, {{ user.first_name }}`

**Body:**
```
Hi {{ user.first_name }},

Welcome to Tradify. Your account is set up. Next step: add a property and pick a plan.

[Continue signup]  →  {{ url }}

If you have questions, just reply to this email.

— The Tradify team
```

### 2.2 `member_subscription_activated` (email + sms)

**Trigger:** Stripe `checkout.session.completed` webhook creates the `member_subscriptions` row.

**Variables:** `user`, `plan`, `start_date`, `end_date`.

**Email subject:** `You're all set — welcome to Tradify {{ plan.name }}`

**Email body:**
```
Thanks, {{ user.first_name }}. Your Tradify {{ plan.name }} membership is active.

Valid: {{ start_date }} to {{ end_date }}
Properties you can register: {{ plan.max_properties ?? 'Unlimited' }}

Your membership benefits:
✓ No call-out fees from our tradies
✓ {{ plan.discount_percent }}% off every job

You can now submit your first job request whenever you need one.

[Submit a job]  →  {{ url }}
```

**SMS (≤160 chars):**
```
Tradify: Your {{ plan.name }} membership is active. Submit a job anytime at {{ short_url }}
```

### 2.3 `member_tradie_assigned` (sms + email + in_app)

**Trigger:** `AcceptOfferAction` transitions job to `assigned`. Fires inline.

**Variables:** `job`, `member`, `tradie_company` (with phone).

**SMS:**
```
Tradify: Great news — {{ tradie_company.business_name }} has accepted your {{ job.category }} job. They'll call you shortly. Contact: {{ tradie_phone }}
```

**Email subject:** `{{ tradie_company.business_name }} has accepted your job`

**Email body:**
```
Hi {{ member.first_name }},

{{ tradie_company.business_name }} has accepted your {{ job.category }} request at {{ job.property.address }}.

Tradie contact: {{ tradie_company.phone }}
Rating: {{ tradie_company.rating_average }} ({{ tradie_company.rating_count }} reviews)

You'll see a status update here when they're on the way.

[View job]  →  {{ url }}
```

### 2.4 `tradie_lead_offered` (sms + email + in_app)

**Trigger:** `SendLeadNotification` queue job (created by dispatch engine). Fires within seconds of offer creation.

**Variables:** `offer`, `job`, `expires_in_minutes`, `link`.

**SMS (highest priority — this is the money moment):**
```
Tradify LEAD: {{ job.urgency_label }} {{ job.category }} in {{ job.suburb }}. Expires in {{ expires_in_minutes }}m. View & accept: {{ link }}
```

Target: under 160 chars. Example rendered:
> Tradify LEAD: Emergency plumber in Baldivis. Expires in 2m. View & accept: https://tradify.au/l/449

**Email subject:** `New lead — {{ job.urgency_label }} {{ job.category }} in {{ job.suburb }}`

**Email body:**
```
New lead from Tradify.

Category: {{ job.category }}
Suburb: {{ job.suburb }}
Urgency: {{ job.urgency_label }}
Issue: {{ job.issue_type or job.custom_issue }}

Description:
{{ job.description }}

This lead expires in {{ expires_in_minutes }} minutes.

[Accept this lead]  →  {{ link }}
```

### 2.5 `member_job_completed_prompt_review` (sms + email)

**Trigger:** `JobCompleted` event. Fired by `POST /tradie/jobs/{id}/complete`.

**Variables:** `job`, `tradie_company`, `review_link`.

**SMS:**
```
Tradify: {{ tradie_company.business_name }} marked your job complete. Quick 1-min check: was the call-out fee waived & discount applied? {{ review_link }}
```

**Email subject:** `How did it go with {{ tradie_company.business_name }}?`

**Email body:**
```
Hi {{ member.first_name }},

{{ tradie_company.business_name }} has marked your {{ job.category }} job complete at {{ job.property.label }}.

Please take 1 minute to confirm:
✓ Was the work completed?
✓ Was the call-out fee waived?
✓ Was your member discount applied?

And leave a star rating for future members.

[Leave your review]  →  {{ review_link }}

This helps us keep good tradies on the platform.
```

### 2.6 `member_job_delayed` (sms + email + in_app)

**Trigger:** Job dispatch rounds all exhausted → `requires_admin_review = true`.

**Variables:** `member`, `job`.

**SMS:**
```
Tradify: We're having trouble finding a tradie for your {{ job.category }} request. Our team is sorting this now and will call you within {{ sla }}. Job ref: {{ job.public_id }}
```

**Admin response SLA: 48 hours.** Substitute `{{ sla }}` with `48 hours` in the SMS template. Emergency jobs in practice get attention faster, but 48h is the stated commitment.

### 2.7 `admin_job_unassigned` (email + in_app)

**Trigger:** Same event as `member_job_delayed` — admins and members are both notified.

**Email subject:** `🚨 Job requires manual assignment: {{ job.public_id }}`

**Email body:**
```
Job {{ job.public_id }} needs manual assignment.

Member: {{ member.full_name }} ({{ member.phone }})
Category: {{ job.category }}
Suburb: {{ job.suburb }}
Urgency: {{ job.urgency_label }}
Rounds attempted: {{ job.dispatch_round }}
Submitted: {{ job.submitted_at }}

Tradies offered (none accepted):
{{ #each offers }}
- {{ tradie_company }} — {{ status }} at {{ offered_at }}
{{ /each }}

[Assign manually]  →  {{ admin_url }}
```

### 2.8 `tradie_application_approved` (email + sms)

**Trigger:** Admin approves tradie via `POST /admin/tradies/{id}/approve`.

**SMS:**
```
Tradify: Your application is approved. Log in to activate your subscription and start receiving leads: {{ url }}
```

**Email subject:** `You're approved — next step: activate your subscription`

**Email body:**
```
Hi {{ user.first_name }},

Your application to join Tradify as a {{ categories_list }} tradie has been approved.

Next step: choose your plan (Standard or Premium) and pay the first annual fee.

Once that's done, you'll immediately start receiving leads in your service suburbs:
{{ service_areas_list }}

[Activate your subscription]  →  {{ url }}

Welcome aboard.
```

### 2.9 `tradie_job_disputed` (email + in_app)

**Trigger:** Member submits a review that triggers disputed status.

**Variables:** `job`, `review`, `member`.

**Email subject:** `Dispute raised on job {{ job.public_id }}`

**Email body:**
```
A member has raised a concern about job {{ job.public_id }}.

Their review:
- Work completed: {{ review.work_completed_status }}
- Call-out fee waived: {{ review.no_callout_fee_honoured }}
- Discount applied: {{ review.discount_honoured }}
- Rating: {{ review.stars }}/5

Their comment:
{{ review.review_text or '(no comment)' }}

Our team will review this and may contact you. In the meantime, new leads to your business are paused pending this review.

If you'd like to respond first, reply to this email.
```

### 2.10 `password_reset` (email)

**Trigger:** Laravel's built-in password reset flow.

Use Laravel's stock `ResetPassword` notification, customised to use Tradify branding.

### 2.11 `member_job_auto_confirmed` (email)

**Trigger:** Scheduled command `jobs:auto-confirm-stale` runs daily, finds jobs in `completed` status with `completed_at < now() - 7 days` and no review. Creates an auto-review row (`was_auto_confirmed = true`) and sets job to `confirmed`.

**Email body:**
```
Hi {{ member.first_name }},

Your recent job with {{ tradie_company.business_name }} was marked complete {{ 7 }} days ago. Since we didn't hear back, we've assumed everything went fine.

If there was an issue, reply to this email and we'll take a look.

— Tradify
```

### 2.12 Remaining templates (briefer — follow same pattern)

For the rest, the pattern is:
- Clear subject including the key entity (job public_id, tradie business name)
- 3–6 sentence body
- One primary CTA button
- Unsubscribe footer on marketing emails only (MVP has none)

Agent should draft each based on the table in §1. When drafting, prefer:
- Named fields over vague references ("Your {{ job.category }} job" not "Your request")
- Explicit timestamps formatted for Australia/Perth
- Short-links wherever they appear in SMS

---

## 3. Message dispatching infrastructure

### 3.1 Laravel Notifications

All messages go through Laravel's Notification system. Target channels: `twilio` (custom, wraps `TwilioSmsService`) and `mail` (Resend via `resend/resend-laravel` transport).

**MVP Phase 1 status:** Only the `mail` channel is active. The `twilio` channel requires `composer require twilio/sdk` and a ServiceProvider binding. All notifications in the current implementation use `via() => ['mail']` only. SMS and in_app channels are to be added in a follow-up pass once the Twilio SDK and broadcast infrastructure are in place.

Each notification class:
- Implements `ShouldQueue`
- Has a `via($notifiable)` returning an array of channels based on priority
- Has `toMail`, `toTwilio`, `toBroadcast` methods

### 3.2 Queueing

All notification sends are queued. Two queue connections:
- `notifications-high` — lead offers only. Processed by a dedicated Horizon supervisor.
- `notifications` — everything else.

This ensures lead SMS fires within 2-3 seconds even if 500 other notifications are queued.

### 3.3 Retries

Queue job `$tries = 3`. Backoff: `[30, 60, 120]` seconds. After 3 failures → `failed_jobs` + Sentry capture + admin email (X5).

### 3.4 Idempotency

If `SendLeadNotification` runs twice for the same `offer_id` (e.g., queue worker retry), it must not double-send. Check `outbound_messages` for an existing row with `related_type=job_offer, related_id=offer.id, channel=sms, status!=failed` — skip if present.

### 3.5 Audit

Every send writes an `outbound_messages` row BEFORE calling the provider. On provider response, update the row with `provider_message_id` and `status`. On webhook status update, update `delivered_at` / `failed_at`.

### 3.6 In-app toast mechanism

A `NotificationReceived` Laravel event is broadcast on `private-{role}.{id}` channel. Frontend's `useEffect` hook listens and shows a toast via `useToast()`.

---

## 4. Copy voice guidelines

Australian English. Direct. No filler.

- "Your tradie is on their way" ✓
- "We are delighted to inform you that your selected tradie is en route" ✗
- "No one accepted — our team is sorting this" ✓
- "We regret to inform you that no tradespeople have accepted your request" ✗

Keep signatures short: `— Tradify` or `— The Tradify team`. No email footer beyond company name and a working reply-to.

---

## 5. Open decisions

| # | Decision | Location |
|---|---|---|
| 1 | Admin response SLA text | §2.6 |
| 2 | SMS sender ID (alpha / number) | See `07-integrations.md §2.3` |
| 3 | Quiet hours for PHASE 2 | Design here later |
| 4 | Per-user notification preferences | PHASE 2 |

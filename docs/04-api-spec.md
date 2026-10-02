> **Member-choice demo update:** Web GET /jobs/available-tradies validates owned property_id, active tradie_category_id and urgency, returning location and public tradies in descending rating order. Web POST /jobs requires selected_tradie_company_id and rechecks eligibility. POST /jobs/{publicId}/choose-tradie lets the owner choose again after a declined/expired offer. JSON creation returns 201 (200 on duplicate); Inertia forms redirect. Versioned mobile endpoints retain their existing contract.

> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 04 — API Specification

**Status:** Canonical. Each endpoint below is the contract. Do not add, remove, or modify without a conversation.

---

## 0. Conventions

### 0.1 Two API surfaces

MVP has ONE surface — **Inertia-over-web routes** (session auth). Endpoints return Inertia responses (HTML with embedded JSON) for page loads, and JSON-only responses for XHR actions.

A second surface — **Sanctum-authenticated REST API** in `routes/api.php` — is scaffolded but empty for MVP. It's how the Phase 2 React Native app will connect. When Phase 2 arrives, the controllers below get a sibling API controller that reuses the same Action classes.

### 0.2 Route groups and middleware

```
routes/
├── web.php          // All MVP endpoints here
├── auth.php         // Login, register, password reset (stock Breeze + custom)
├── webhooks.php     // Stripe, Twilio, Postmark webhooks (no auth, signed)
├── channels.php     // Reverb channel auth
└── api.php          // Sanctum routes (empty at MVP)
```

Middleware groups:
- `web` (default) — sessions, CSRF, cookies
- `auth` — must be logged in
- `verified` — must have verified email (Phase 2)
- `role:admin`, `role:member`, `role:tradie` — custom role middleware
- `throttle:60,1` — generic rate limit for auth-protected endpoints
- `throttle:5,1` — strict rate limit for auth & password endpoints

### 0.3 Inertia vs JSON

- **Page routes** (GET, rendering a page): return `Inertia::render('PageName', $props)`
- **Action routes** (POST/PATCH/DELETE that mutate): return either a redirect (for full page form submits) or `response()->json($data)` for XHR.
- Inertia form submissions use redirects. JSON responses are for fetch() calls from inside components (e.g., typeahead search).

### 0.4 Error responses

All JSON errors follow one shape:
```json
{
  "message": "Human-readable explanation.",
  "errors": {
    "field_name": ["Error 1", "Error 2"]
  },
  "code": "machine_readable_code"
}
```

Validation errors (422) include `errors`. Other errors may omit it.

### 0.5 Standard HTTP codes used

- `200` — OK
- `201` — Created
- `204` — No content (successful delete)
- `302` — Redirect (Inertia flow)
- `400` — Bad request (malformed body)
- `401` — Unauthenticated
- `403` — Forbidden (authenticated but not allowed)
- `404` — Not found
- `409` — Conflict (e.g., offer already accepted)
- `410` — Gone (offer expired)
- `422` — Validation error
- `429` — Rate limited
- `500` — Server error

### 0.6 Form Requests

Every mutating endpoint uses a Form Request class for validation. They live in `app/Http/Requests/`. See `09-development-guide.md §Validation`.

### 0.7 Policies

Every resource-level action (viewing a job, accepting an offer) uses a Policy. Never inline `abort_if` auth checks. See `09-development-guide.md §Authorization`.

---

## 1. Authentication

### 1.1 `GET /login` — Login page

Returns the login Inertia page.

### 1.2 `POST /login`

**Request:**
```json
{ "email": "...", "password": "...", "remember": true }
```

**Response:** 302 redirect to role-appropriate dashboard.

**Errors:** 422 validation, 429 rate limited.

### 1.3 `POST /logout`
**Response:** 302 redirect to `/`.

### 1.4 `GET /register/member` — Member registration page (step 1 of signup flow)
### 1.5 `POST /register/member`

**Request:**
```json
{
  "first_name": "Sarah",
  "last_name": "Mahan",
  "email": "sarah@example.com",
  "phone": "+61412345678",
  "password": "...",
  "password_confirmation": "..."
}
```

Creates a user with `role=member`, `status=pending_verification`. Sends phone OTP (Phase 2 — at MVP we accept unverified phones but flag them). Returns 302 redirect to `/register/member/property`.

### 1.6 `GET /register/member/property` — Add first property (step 2)
### 1.7 `POST /register/member/property`

Requires authenticated member mid-signup.

**Request:**
```json
{
  "label": "Home",
  "address_line_1": "12 Palm St",
  "address_line_2": null,
  "suburb_id": 142,
  "property_type": "house",
  "gate_code": null,
  "access_notes": null
}
```

**Response:** 302 redirect to `/register/member/plan`.

### 1.8 `GET /register/member/plan` — Plan selection (step 3)
### 1.9 `POST /register/member/plan`

**Request:**
```json
{ "member_plan_id": 2 }
```

Creates a Stripe Checkout Session via Cashier. Returns 302 redirect to Stripe-hosted checkout. Stripe webhook (§8.1) activates the subscription on success.

### 1.10 `POST /register/tradie` — Tradie application (single-step or multi-step; multi-step API below)

The tradie application has 4 steps and 4 endpoints. Each persists a draft row (`tradie_companies.status = pending_review` doesn't exist until all 4 complete).

**AGENT NOTE:** Implement the application draft as a session-stored object OR as a `tradie_applications` intermediate table. The doc assumes session-stored (simpler), persisted to `tradie_companies` on final submit.

- `GET /register/tradie/step-1` / `POST` — business details (user + draft company)
- `GET /register/tradie/step-2` / `POST` — categories + service areas
- `GET /register/tradie/step-3` / `POST` — credentials (licence/insurance uploads)
- `GET /register/tradie/step-4` / `POST` — agreement checkboxes + final submit

Final submit creates `users(role=tradie)` + `tradie_companies(status=pending_review)` + related rows in a transaction. Emails admin about pending review.

---

## 2. Member endpoints

All require `auth` + `role:member` + active subscription (enforced by `EnsureActiveSubscription` middleware applied at group level).

### 2.1 `GET /dashboard` — Member dashboard

Returns `MemberDashboard` Inertia page with props:
```json
{
  "stats": {
    "jobs_this_year": 7,
    "saved_fees_cents": 42000,
    "properties_count": 3
  },
  "active_jobs": [ /* Job resource, most recent 5 */ ],
  "recent_activity": [ /* last 10 status-change log entries */ ]
}
```

### 2.2 `GET /properties` — Properties list
### 2.3 `POST /properties` — Add property

**Request:** same shape as §1.7.
**Response:** 201 JSON `{ "property": Property }` or redirect (depends on caller).

**Rules:** Enforce plan's `max_properties` — if full, return 403 with code `"property_limit_reached"`.

### 2.4 `PATCH /properties/{property}` — Update property
### 2.5 `DELETE /properties/{property}` — Soft-delete property

Cannot delete a property that has any non-terminal jobs. Returns 409.

### 2.6 `GET /jobs` — Member's job list

Query params: `status` (filter), `page`, `per_page` (max 50).

**Response (Inertia page `MemberJobs`):** paginated jobs with `JobResource` (see §Resources).

### 2.7 `GET /jobs/new` — Request-a-tradie wizard (step 1 page)

Props include: member's properties (for step 1 select), categories, issue types grouped by category.

### 2.8 `POST /jobs` — Submit a new job

Single endpoint; the wizard collects via local state and posts once.

**Request:**
```json
{
  "property_id": 42,
  "tradie_category_id": 1,
  "issue_type_id": 7,          // or null with custom_issue
  "custom_issue": null,
  "urgency": "same_day",       // enum
  "description": "Kitchen mixer drips constantly",
  "best_contact_time": "any",
  "image_ids": [15, 16]        // IDs from prior /uploads calls
}
```

**Validation:**
- `property_id` must belong to the authenticated member
- `tradie_category_id` must be active
- `issue_type_id` (if provided) must belong to that category
- `custom_issue` required if `issue_type_id` is null
- `urgency` must be a valid enum value
- `description` max 2000 chars
- `image_ids` all must belong to the user and be unassigned

**Response:** 201 JSON `{ "job": Job, "public_id": "JOB-0142" }`

**Side effects:**
- Creates `jobs` row with `status=pending_dispatch`
- Reassigns uploaded images to this job
- Synchronously dispatches `DispatchJobAction::execute($job)`
- Returns (even before first offer is created — dispatch is fast but not sync-blocking from the client's point of view)

**Errors:**
- 402 `"subscription_inactive"` if member's subscription is not active
- 422 validation

### 2.9 `GET /jobs/{publicId}` — Job detail

Returns the full job with all its offers (if member can see them — they can), images, completion report (if present), review (if present).

### 2.10 `POST /jobs/{publicId}/cancel` — Cancel a job

Only allowed in statuses: `pending_dispatch`, `offered`, `assigned`, `tradie_on_the_way`, `rescheduled`.
Not allowed once `in_progress` or later — must be handled as a dispute.

**Request:**
```json
{ "reason": "Sorted it myself" }
```

**Response:** 200 JSON updated job.

### 2.11 `POST /jobs/{publicId}/review` — Submit review + benefit confirmation

Only allowed when job status is `completed` and no review exists yet.

**Request:**
```json
{
  "work_completed_status": "yes",         // "yes" | "partial" | "no"
  "no_callout_fee_honoured": true,
  "discount_honoured": "yes",             // "yes" | "no" | "na"
  "stars": 5,
  "review_text": "Fast and tidy."
}
```

**Validation:**
- `stars` 1–5
- Text max 1000 chars

**Response:** 201 JSON `{ "review": Review, "job": Job }`

**Side effects:**
- Creates `reviews` row
- If work_completed=yes AND fee honoured AND discount_honoured in ['yes', 'na'] → job status → `confirmed`
- Otherwise → job status → `disputed`, tradie company flagged in admin
- Updates tradie's `rating_average` and `rating_count` (denormalised)

### 2.12 `POST /uploads/job-image` — Pre-upload image before job submission

Accepts multipart. Enforces:
- max 10 MB per file
- allowed: image/jpeg, image/png, image/heic, image/webp
- image is virus-scanned (if ClamAV available; MVP can skip)

Stores in S3 under `jobs/pending/{userId}/{uuid}.ext`. Returns:
```json
{ "id": 15, "url": "https://..." }
```

On job submission, `image_ids` in the body attach these images to the job and the S3 object is moved to `jobs/{jobId}/{uuid}.ext` (or just metadata-updated, cheaper to keep path).

### 2.13 `GET /properties/address-autocomplete?q=12+palm+st` — Autocomplete proxy

Server-side proxy to Google Places (so the API key stays server-side). Returns suggestions with `suburb_id` matched against our `suburbs` table.

**Response:**
```json
{
  "suggestions": [
    {
      "formatted_address": "12 Palm St, Baldivis WA 6171, Australia",
      "address_line_1": "12 Palm St",
      "suburb_id": 142,
      "postcode": "6171"
    }
  ]
}
```

### 2.14 `GET /membership` — Member subscription / billing page
### 2.15 `POST /membership/change-plan` — Upgrade/downgrade

Redirects through Stripe Checkout or updates the Stripe subscription via Cashier. Webhook reconciles.

### 2.16 `POST /membership/cancel` — Cancel at period end (auto_renew=false)
### 2.17 `POST /membership/resume` — Re-enable auto-renew before period end

### 2.18 `GET /saved-tradies` — Saved tradies list
### 2.19 `POST /saved-tradies` — Save a tradie
### 2.20 `DELETE /saved-tradies/{id}` — Unsave

---

## 3. Tradie endpoints

All require `auth` + `role:tradie` + `tradie_companies.status=approved` + active subscription (enforced by middleware).

Exception: `GET /tradie/pending` and `GET /tradie/activate-subscription` accessible without active subscription (for newly-approved tradies).

### 3.1 `GET /tradie/dashboard` — Default lands on Leads inbox

Redirects to `/tradie/leads`.

### 3.2 `GET /tradie/leads` — Available leads

Returns leads offered to this tradie that are still open. Props:
```json
{
  "leads": [
    {
      "offer_id": 449,
      "job": { /* JobPublicResource — limited fields */ },
      "offered_at": "...",
      "expires_at": "...",
      "rank": 1
    }
  ]
}
```

**AGENT NOTE:** The `JobPublicResource` for pre-accept leads deliberately HIDES: member name, member phone, exact address. Shows only: suburb, category, issue, urgency, description, property type, photos. Post-accept, the full resource is returned.

### 3.3 `GET /tradie/leads/{offer}` — Lead detail (pre-accept)
### 3.4 `POST /tradie/leads/{offer}/accept`

Idempotent from the tradie's perspective: if they've already accepted, returns 200 with the job. If expired, 410. If another tradie won the race (parallel mode), 409 `"offer_superseded"`.

**Response (success):** 200 JSON with full job resource including member contact details.

### 3.5 `POST /tradie/leads/{offer}/decline`

**Request:**
```json
{ "reason": "too_far" }  // "too_far" | "busy" | "not_my_work" | "other"
```

### 3.6 `GET /tradie/jobs` — Active + completed jobs
### 3.7 `GET /tradie/jobs/{publicId}` — Job detail (full, post-accept)

Returns the full job with member contact, address, images, status history.

### 3.8 `POST /tradie/jobs/{publicId}/status` — Transition job status

**Request:**
```json
{ "to_status": "tradie_on_the_way" }  // or "in_progress", "rescheduled"
```

**Validation:** only allowed forward transitions from the current status (see `05-dispatch-engine.md §3.3`). Enforced by the `JobStatusTransition` action.

### 3.9 `POST /tradie/jobs/{publicId}/complete`

**Request:**
```json
{
  "summary_of_work": "Replaced mixer cartridge, no leaks.",
  "invoice_total_cents": 34000,
  "no_callout_fee_confirmed": true,
  "discount_applied": true,
  "discount_amount_cents": 3400,
  "invoice_document_path": "uploads/completion/...uuid.pdf",
  "completion_notes": null
}
```

**Validation:**
- `invoice_total_cents >= 0`
- If `discount_applied = true`, `discount_amount_cents >= 0`
- `summary_of_work` 10–2000 chars

**Response:** 201 JSON `{ "report": CompletionReport, "job": Job }`

**Side effects:** job status → `completed`. Queues `NotifyMemberCompleted` (SMS + email prompting review).

### 3.10 `POST /tradie/uploads/completion-doc` — Pre-upload invoice PDF

Same pattern as §2.12 but for PDFs. Stores in `completion/{jobId}/...`.

### 3.11 `GET /tradie/performance` — Performance dashboard

Returns aggregated data from `tradie_performance_daily` for the logged-in tradie's company. Query param: `range` (7d / 30d / 90d, default 90d).

**Response:**
```json
{
  "period": "90d",
  "leads_received": 41,
  "leads_accepted": 24,
  "acceptance_rate": 0.585,
  "jobs_completed": 20,
  "avg_response_seconds": 102,
  "rating_average": 4.8,
  "rating_count": 18,
  "reported_revenue_cents": 794000,
  "by_suburb": [ { "suburb": "Baldivis", "jobs": 12, "revenue_cents": 412000 }, ... ],
  "by_issue_type": [ ... ],
  "roi": {
    "subscription_cents": 0,       // TBD after pricing
    "annualised_revenue_cents": 3176000
  }
}
```

### 3.12 `GET /tradie/service-areas` / `POST` / `DELETE` — Manage service suburbs
### 3.13 `GET /tradie/categories` / `POST` / `DELETE` — Manage offered categories
### 3.14 `GET /tradie/availability` / `PATCH` — Manage operating hours
### 3.15 `GET /tradie/subscription` — Subscription page
### 3.16 `POST /tradie/subscription/activate` — Post-approval, initial activation → Stripe Checkout
### 3.17 `POST /tradie/subscription/change-plan`
### 3.18 `POST /tradie/subscription/cancel`
### 3.19 `POST /tradie/subscription/resume`

### 3.20 `GET /tradie/settings` / `PATCH` — Profile, notification preferences

---

## 4. Admin endpoints

All require `auth` + `role:admin`.

### 4.1 `GET /admin` — Overview dashboard

**Response props:**
```json
{
  "counts": {
    "active_members": 284,
    "active_tradies": 67,
    "jobs_this_month": 142,
    "jobs_requiring_review": 3
  },
  "attention": {
    "pending_tradie_applications": 3,
    "disputed_jobs": 2,
    "unassigned_jobs": 1,
    "renewals_in_7_days": 4
  },
  "live_jobs": [ /* JobResource, top 20 by recency */ ]
}
```

### 4.2 `GET /admin/jobs` — All jobs, filterable

Query params: `status`, `urgency`, `category`, `suburb_id`, `from_date`, `to_date`, `q` (search public_id or description).

### 4.3 `GET /admin/jobs/{publicId}` — Job detail with full audit trail

Includes: all offers (every round), status log, images, completion report, review, notification log filtered to this job.

### 4.4 `POST /admin/jobs/{publicId}/assign`

Admin manual assignment. See `05-dispatch-engine.md §8.12`.

**Request:**
```json
{ "tradie_company_id": 42, "note": "Per phone call" }
```

### 4.5 `POST /admin/jobs/{publicId}/redispatch`

Forces a new dispatch round. Useful when eligibility has changed.

### 4.6 `POST /admin/jobs/{publicId}/cancel`

Admin can cancel in any status.

### 4.7 `GET /admin/tradies` — List with filters

Query params: `status`, `category_id`, `suburb_id`, `plan_id`, `sort` (rating / leads / revenue).

### 4.8 `GET /admin/tradies/{id}` — Tradie detail

Full business info, licence/insurance links (signed S3 URLs), performance, jobs history.

### 4.9 `POST /admin/tradies/{id}/approve`

Approves a pending application. Sets `status=approved`, stamps `approved_at` and `approved_by_user_id`. Emails the tradie.

### 4.10 `POST /admin/tradies/{id}/reject`

**Request:**
```json
{ "reason": "Licence unverifiable" }
```

### 4.11 `POST /admin/tradies/{id}/suspend`

**Request:**
```json
{ "reason": "Multiple disputes" }
```

Sets status to `suspended`. No further leads. Active jobs kept running.

### 4.12 `POST /admin/tradies/{id}/reinstate`

Undoes suspend.

### 4.13 `GET /admin/members` — List
### 4.14 `GET /admin/members/{id}` — Detail
### 4.15 `POST /admin/members/{id}/suspend`
### 4.16 `POST /admin/members/{id}/reinstate`

### 4.17 `GET /admin/applications` — Tradie applications queue

### 4.18 `GET /admin/disputes` — Disputed jobs queue
### 4.19 `POST /admin/disputes/{job}/resolve`

**Request:**
```json
{
  "resolution": "tradie_at_fault",  // "tradie_at_fault" | "member_at_fault" | "no_fault" | "split"
  "action_on_tradie": "warn",       // "none" | "warn" | "suspend_7d" | "suspend_indefinite"
  "issue_member_credit_cents": 5000,
  "note": "Tradie admitted the callout fee was charged. Issuing credit."
}
```

### 4.20 `GET /admin/metrics` — Platform metrics page

Aggregate queries over a date range. Heavy endpoint — cached for 10 minutes.

### 4.21 `GET /admin/suburbs` / `POST` / `PATCH` — Manage suburbs
### 4.22 `GET /admin/categories` / `POST` / `PATCH` — Manage categories
### 4.23 `GET /admin/issue-types` / `POST` / `PATCH` — Manage issue types

### 4.24 `POST /admin/impersonate/{userId}` — **PHASE 2** (OUT OF SCOPE for MVP)

---

## 5. Webhooks

All webhooks bypass CSRF and verify signatures.

### 5.1 `POST /webhooks/stripe`

Laravel Cashier handles this automatically. Custom handlers in `app/Http/Controllers/Webhooks/StripeController.php` extend Cashier's controller for the events we care about:

- `checkout.session.completed` — activate subscription row
- `invoice.payment_succeeded` — extend `end_date`
- `invoice.payment_failed` — mark `past_due`
- `customer.subscription.deleted` — mark `canceled`
- `customer.subscription.updated` — reconcile plan changes

Signature verification via `Stripe-Signature` header and `STRIPE_WEBHOOK_SECRET`.

### 5.2 `POST /webhooks/twilio/status`

Twilio POSTs delivery status updates. Match by `MessageSid` against `outbound_messages.provider_message_id`. Update `status` and `delivered_at` / `failed_at`.

Signature verification via `X-Twilio-Signature` and `TWILIO_AUTH_TOKEN`.

### 5.3 `POST /webhooks/postmark`

Postmark POSTs bounce/delivery events. Same pattern as Twilio.

Signature verification: Postmark uses Basic Auth (configured in Postmark settings).

---

## 6. Broadcast channels (Reverb)

Authenticated via `routes/channels.php`.

### 6.1 `private-member.{userId}`

Authorises if `auth()->user()->id === $userId`. Events:
- `JobStatusChanged` — fires on job status transition.
- `NotificationReceived` — for in-app toast.

### 6.2 `private-tradie.{companyId}`

Authorises if user's tradie company ID matches. Events:
- `LeadOffered` — new offer for this tradie.
- `LeadWithdrawn` — sibling offer accepted (parallel mode) or admin cancelled.
- `JobStatusChanged` — for their assigned jobs.

### 6.3 `private-admin`

Authorises if user is admin. Events:
- `AdminReviewRequired` — dispute or escalation.
- `JobStatusChanged` — global.

---

## 7. Resources (JSON shapes)

Reference shapes. Implemented as `JsonResource` classes.

### 7.1 `JobResource` (full — member owner, tradie assigned, admin)

```json
{
  "id": 142,
  "public_id": "JOB-0142",
  "status": "assigned",
  "urgency": "same_day",
  "description": "...",
  "property": {
    "id": 42,
    "label": "Home",
    "address_line_1": "12 Palm St",
    "suburb": { "id": 142, "name": "Baldivis", "postcode": "6171" }
  },
  "category": { "id": 1, "slug": "plumber", "name": "Plumber" },
  "issue_type": { "id": 7, "slug": "leaking_tap", "name": "Leaking tap" },
  "custom_issue": null,
  "submitted_at": "2026-04-20T09:14:00Z",
  "dispatched_at": "2026-04-20T09:14:02Z",
  "assigned_at": "2026-04-20T09:17:30Z",
  "assigned_tradie": { /* TradieCompanySummary */ },
  "images": [ { "id": 15, "url": "...signed...", "caption": null } ],
  "completion_report": null,
  "review": null,
  "offers": [ /* JobOfferResource — visible to owner/admin */ ],
  "status_log": [ /* JobStatusLogEntry */ ]
}
```

### 7.2 `JobPublicResource` (pre-accept, for tradies viewing a lead)

```json
{
  "offer_id": 449,
  "public_id": "JOB-0142",
  "suburb": { "id": 142, "name": "Baldivis", "postcode": "6171" },
  "category": { "id": 1, "slug": "plumber", "name": "Plumber" },
  "issue_type": { "id": 7, "name": "Leaking tap" },
  "urgency": "same_day",
  "description": "...",
  "property_type": "house",
  "images": [ { "id": 15, "url": "..." } ],
  "member_plan": "pro",
  "offered_at": "2026-04-20T09:14:02Z",
  "expires_at": "2026-04-20T09:29:02Z"
}
```

### 7.3 `TradieCompanySummary`

```json
{
  "id": 42,
  "business_name": "ABC Plumbing",
  "phone": "+61412345678",
  "rating_average": 4.8,
  "rating_count": 124,
  "is_premium": true
}
```

### 7.4 `JobOfferResource`

```json
{
  "id": 449,
  "round": 1,
  "rank_in_round": 1,
  "status": "accepted",
  "tradie_company": { /* TradieCompanySummary, may be redacted for member view */ },
  "offered_at": "...",
  "viewed_at": "...",
  "accepted_at": "...",
  "declined_at": null,
  "declined_reason": null,
  "expired_at": null,
  "expires_at": "...",
  "response_time_seconds": 108,
  "score": 176.28       // admin only
}
```

---

## 8. Rate limits

| Endpoint group | Limit |
|---|---|
| `/login`, `/register/*`, `/password/*` | 5 req / min / IP |
| All authenticated endpoints | 60 req / min / user |
| `/webhooks/*` | no limit (signed) |
| `/properties/address-autocomplete` | 30 req / min / user |
| `POST /jobs` | 5 / min / user (rate limit to prevent abuse of dispatch) |
| `POST /uploads/*` | 10 / min / user |

---

## 9. Changes to this doc

Do not add endpoints without adding them here first. If you discover a real need during build, update this doc in the same commit as the code. Silent endpoints are a security smell.

---

## 10. Open decisions affecting API

| # | Decision | Affected endpoints |
|---|---|---|
| 1 | Plan prices | `/register/*/plan`, `/membership/change-plan` (amounts shown) |
| 2 | Dispatch windows | Reflected in `JobPublicResource.expires_at` — not breaking, just different values |
| 3 | Auto-confirm 7-day default | `POST /jobs/{id}/review` — no change, but a scheduled job fills in for non-responses |

None block building the API.

> **Member-choice demo update:** Jobs now have a nullable selected_tradie_company_id foreign key, separate from assignment until the chosen tradie accepts.

> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 03 — Database Schema

**Status:** Canonical. Agent should produce Laravel migrations that match this exactly.

**Database:** PostgreSQL 16+. This schema uses Postgres-specific features (enum types, partial indexes, generated columns, `jsonb`). Do not reach for MySQL equivalents.

---

## 1. Conventions

Read these before writing any migration.

### 1.1 Naming
- Tables: `snake_case`, plural (`users`, `tradie_companies`, `job_offers`).
- Columns: `snake_case`, singular (`first_name`, `created_at`).
- Foreign keys: `<singular_table>_id` (`member_user_id`, `tradie_company_id`).
- Booleans: prefixed with `is_`, `has_`, or a verb (`is_active`, `has_verified_insurance`, `auto_renew`).
- Timestamps: suffix `_at` (`accepted_at`, `expired_at`, `created_at`).
- Amounts: **always integer cents**, suffix `_cents` (`yearly_price_cents`, `invoice_total_cents`). Never floats. Never decimals.
- Enums: Postgres native enum types where values are stable; `varchar` + `CHECK` constraint where values may grow.

### 1.2 Primary keys
Use `bigint` auto-increment PKs (`$table->id()`). Do **not** use UUIDs as primary keys in MVP. UUIDs can be added as additional `public_id` columns later if exposed in URLs.

### 1.3 Timestamps
Every table has `created_at` and `updated_at` (`$table->timestamps()`) unless explicitly noted otherwise (join tables, append-only log tables may have `created_at` only).

### 1.4 Soft deletes
Use soft deletes (`deleted_at`) on: `users`, `properties`, `tradie_companies`, `tradie_service_areas`, `tradie_company_categories`. Do NOT soft-delete `jobs`, `job_offers`, `job_completion_reports`, `reviews`, notifications — these are historical records.

### 1.5 Money
- All amounts are integer cents in AUD.
- Column type: `bigint` (not int — avoid future overflow).
- Validation: must be >= 0.
- Format for display on the frontend: `$(cents/100).toFixed(2)`. Never do math in the browser.

### 1.6 JSON columns
Use `jsonb` (not `json`). Index frequently-queried JSON paths with GIN indexes when needed.

### 1.7 Referential integrity
- Always add foreign keys with explicit `onDelete` behaviour.
- Default to `restrict` on most deletes. Use `cascade` only where the child truly has no meaning without the parent (e.g., `job_images` cascade on `jobs` deletion — but we don't delete jobs anyway).
- User deletion: soft-delete only. Never hard-delete users.

### 1.8 Indexes
Index every foreign key (Postgres doesn't automatically, unlike MySQL InnoDB). Index columns used in WHERE clauses for hot paths (dispatch queries, tradie lookup, job lookup).

---

## 2. Schema overview (ERD, textual)

```
users ─┬─ member_subscriptions ── member_plans
       │
       ├─ properties
       │     └─ jobs ─┬─ job_offers ── tradie_companies
       │              ├─ job_images
       │              ├─ job_status_logs
       │              ├─ job_completion_reports
       │              └─ reviews
       │
       ├─ tradie_companies (owner)
       │     ├─ tradie_subscriptions ── tradie_plans
       │     ├─ tradie_company_categories ── tradie_categories
       │     ├─ tradie_service_areas
       │     └─ tradie_performance_daily (denormalised rollup)
       │
       └─ notifications

suburbs  (seeded)
issue_types ── tradie_categories
member_credits  (stubbed in MVP)
```

---

## 3. Enum types (Postgres native)

Create these as Postgres enum types in the initial migration. They are referenced throughout.

```sql
CREATE TYPE user_role AS ENUM ('admin', 'member', 'tradie');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending_verification');

CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete', 'paused');

CREATE TYPE property_type AS ENUM ('house', 'apartment', 'townhouse', 'duplex', 'commercial', 'other');

CREATE TYPE urgency AS ENUM ('emergency', 'same_day', 'within_48h', 'flexible');

CREATE TYPE job_status AS ENUM (
  'pending_dispatch',
  'offered',
  'assigned',
  'tradie_on_the_way',
  'in_progress',
  'awaiting_client_response',
  'rescheduled',
  'completed',
  'confirmed',
  'disputed',
  'cancelled'
);

CREATE TYPE offer_status AS ENUM (
  'pending',
  'offered',
  'viewed',
  'accepted',
  'declined',
  'expired',
  'superseded'
);

CREATE TYPE tradie_company_status AS ENUM (
  'pending_review',
  'approved',
  'suspended',
  'rejected'
);

CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push', 'in_app');
CREATE TYPE notification_status  AS ENUM ('queued', 'sent', 'delivered', 'failed', 'bounced');
```

**AGENT NOTE:** Use `DB::statement("CREATE TYPE ...")` in the initial migration. When adding new values later, use `ALTER TYPE ... ADD VALUE`. Never `DROP TYPE` in a migration that has shipped.

---

## 4. Tables (in dependency order)

### 4.1 `users`

The single authentication table for all roles.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `role` | `user_role` | no | — | Determines which dashboard and permissions. |
| `status` | `user_status` | no | `pending_verification` | |
| `first_name` | varchar(100) | no | — | |
| `last_name` | varchar(100) | no | — | |
| `email` | varchar(255) | no | — | Unique. Case-insensitive via lower() index. |
| `email_verified_at` | timestamptz | yes | null | |
| `phone` | varchar(32) | no | — | E.164 format (e.g., `+61412345678`). Unique. |
| `phone_verified_at` | timestamptz | yes | null | Verified via SMS OTP. |
| `password` | varchar(255) | no | — | Hashed (bcrypt / argon2). |
| `remember_token` | varchar(100) | yes | null | Laravel's remember-me. |
| `last_login_at` | timestamptz | yes | null | |
| `created_at` | timestamptz | no | now() | |
| `updated_at` | timestamptz | no | now() | |
| `deleted_at` | timestamptz | yes | null | Soft delete. |

**Indexes:**
- Unique on `lower(email)` where `deleted_at is null` (partial index)
- Unique on `phone` where `deleted_at is null`
- Index on `role, status` (for admin filtering)

**Rules:**
- Email must be unique across active (non-deleted) users only. A deleted user's email may be reused.
- Phone must be E.164 validated at the app layer.
- `role` is immutable after creation for MVP. (Admin cannot promote a member to tradie; they create a new account.)

### 4.2 `suburbs`

Seeded reference table. Joined on jobs, service areas, properties.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `name` | varchar(120) | no | — | E.g., `Baldivis`. |
| `postcode` | varchar(10) | no | — | |
| `state` | varchar(8) | no | — | E.g., `WA`. |
| `latitude` | numeric(9,6) | yes | null | For future radius matching. |
| `longitude` | numeric(9,6) | yes | null | |
| `is_active` | boolean | no | true | Admin can disable. |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(name, postcode, state)`
- Index on `postcode`

**Seeding:** Seed WA suburbs from a CSV committed to `database/seeders/data/wa_suburbs.csv`. Source: Australia Post postcode file or similar. Agent must not hand-type this.

### 4.3 `member_plans`

Seeded. Rarely changes.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `slug` | varchar(32) | no | — | `basic` / `pro` / `investor`. Unique. |
| `name` | varchar(64) | no | — | Display name. |
| `yearly_price_cents` | bigint | no | — | AUD cents. |
| `max_properties` | int | yes | null | null = unlimited. |
| `includes_discount` | boolean | no | true | Member discount enabled. |
| `discount_percent` | int | no | 10 | Whole percent. |
| `priority_dispatch` | boolean | no | false | Tie-breaker in scoring. |
| `stripe_price_id` | varchar(64) | yes | null | Matching Stripe Price. Null until Stripe is set up. |
| `is_active` | boolean | no | true | |
| `sort_order` | int | no | 0 | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Seed data:**
```
basic     | Basic    | 14900 | 1    | true | 10 | false
pro       | Pro      | 24900 | 3    | true | 10 | true
investor  | Investor | 44900 | null | true | 10 | true
```
(Prices in cents AUD, tax-inclusive: $149 / $249 / $449 per year.)

### 4.4 `member_subscriptions`

One active row per user at most. Multiple rows over time (past subscriptions kept).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `user_id` | bigint FK → users | no | — | on delete restrict |
| `member_plan_id` | bigint FK → member_plans | no | — | on delete restrict |
| `status` | `subscription_status` | no | `incomplete` | |
| `start_date` | date | yes | null | |
| `end_date` | date | yes | null | |
| `auto_renew` | boolean | no | true | |
| `stripe_subscription_id` | varchar(64) | yes | null | Unique. |
| `stripe_customer_id` | varchar(64) | yes | null | |
| `canceled_at` | timestamptz | yes | null | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Index on `user_id, status`
- Unique on `stripe_subscription_id` where not null
- Partial unique index: only one `active`/`past_due` subscription per user at a time:
  ```sql
  CREATE UNIQUE INDEX member_subscriptions_one_active_per_user
    ON member_subscriptions (user_id)
    WHERE status IN ('active', 'past_due');
  ```

### 4.5 `properties`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `member_user_id` | bigint FK → users | no | — | on delete restrict |
| `label` | varchar(60) | no | — | "Home", "Rental 1". |
| `address_line_1` | varchar(200) | no | — | |
| `address_line_2` | varchar(200) | yes | null | |
| `suburb_id` | bigint FK → suburbs | no | — | on delete restrict |
| `property_type` | `property_type` | no | — | |
| `gate_code` | varchar(60) | yes | null | |
| `access_notes` | text | yes | null | |
| `is_primary` | boolean | no | false | One per member. |
| `created_at`, `updated_at` | timestamptz | no | now() | |
| `deleted_at` | timestamptz | yes | null | Soft delete. |

**Indexes:**
- Index on `member_user_id` where `deleted_at is null`
- Index on `suburb_id`
- Partial unique: only one primary per member:
  ```sql
  CREATE UNIQUE INDEX properties_one_primary_per_member
    ON properties (member_user_id)
    WHERE is_primary = true AND deleted_at IS NULL;
  ```

**Rules:** When inserting a property, enforce plan `max_properties` at the application layer (not DB — DB can't know the plan from the row).

### 4.6 `tradie_categories`

Seeded. Changes infrequently.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `slug` | varchar(32) | no | — | Unique. `plumber`, `electrician`, ... |
| `name` | varchar(64) | no | — | Display. |
| `sort_order` | int | no | 0 | |
| `is_active` | boolean | no | true | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Seed:** 8 categories listed in `01-product-spec.md §7.1`.

### 4.7 `issue_types`

Seeded. Changes infrequently.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `tradie_category_id` | bigint FK → tradie_categories | no | — | on delete restrict |
| `slug` | varchar(48) | no | — | Unique per category. |
| `name` | varchar(100) | no | — | |
| `sort_order` | int | no | 0 | |
| `is_active` | boolean | no | true | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(tradie_category_id, slug)`
- Index on `tradie_category_id`

**Seed:** see `01-product-spec.md §7.2`.

### 4.8 `tradie_companies`

The business entity a tradie operates under.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `owner_user_id` | bigint FK → users | no | — | on delete restrict. One owner per company in MVP. Unique. |
| `business_name` | varchar(200) | no | — | |
| `trading_name` | varchar(200) | yes | null | |
| `abn` | varchar(20) | yes | null | Unique when not null. |
| `licence_number` | varchar(60) | yes | null | State licence. |
| `licence_state` | varchar(8) | yes | null | |
| `licence_expires_on` | date | yes | null | |
| `insurance_expires_on` | date | yes | null | Certificate of currency expiry. |
| `licence_document_path` | varchar(500) | yes | null | S3 key. |
| `insurance_document_path` | varchar(500) | yes | null | S3 key. |
| `about_text` | text | yes | null | Public-facing bio (Phase 2 display). |
| `logo_path` | varchar(500) | yes | null | S3 key. |
| `rating_average` | numeric(3,2) | yes | null | Cached from reviews. |
| `rating_count` | int | no | 0 | |
| `status` | `tradie_company_status` | no | `pending_review` | |
| `approved_at` | timestamptz | yes | null | |
| `approved_by_user_id` | bigint FK → users | yes | null | admin who approved |
| `suspended_reason` | text | yes | null | |
| `created_at`, `updated_at` | timestamptz | no | now() | |
| `deleted_at` | timestamptz | yes | null | Soft delete. |

**Indexes:**
- Unique on `owner_user_id` where `deleted_at is null`
- Unique on `abn` where `abn is not null and deleted_at is null`
- Index on `status`

### 4.9 `tradie_plans`

Seeded.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `slug` | varchar(32) | no | — | `standard`, `premium`. Unique. |
| `name` | varchar(64) | no | — | |
| `yearly_price_cents` | bigint | no | — | AUD cents. |
| `dispatch_rank_boost` | int | no | 0 | Added to tradie score. Premium = e.g., 100. |
| `featured_listing` | boolean | no | false | |
| `suburb_exclusivity` | boolean | no | false | Phase 2; always false at MVP. |
| `stripe_price_id` | varchar(64) | yes | null | |
| `is_active` | boolean | no | true | |
| `sort_order` | int | no | 0 | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

### 4.10 `tradie_subscriptions`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete restrict |
| `tradie_plan_id` | bigint FK → tradie_plans | no | — | on delete restrict |
| `status` | `subscription_status` | no | `incomplete` | |
| `start_date` | date | yes | null | |
| `end_date` | date | yes | null | |
| `auto_renew` | boolean | no | true | |
| `stripe_subscription_id` | varchar(64) | yes | null | Unique. |
| `stripe_customer_id` | varchar(64) | yes | null | |
| `canceled_at` | timestamptz | yes | null | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Index on `tradie_company_id, status`
- Partial unique: only one active/past_due per company:
  ```sql
  CREATE UNIQUE INDEX tradie_subs_one_active_per_company
    ON tradie_subscriptions (tradie_company_id)
    WHERE status IN ('active', 'past_due');
  ```

### 4.11 `tradie_company_categories`

Many-to-many join.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete cascade |
| `tradie_category_id` | bigint FK → tradie_categories | no | — | on delete restrict |
| `is_active` | boolean | no | true | Can toggle without deleting row. |
| `created_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(tradie_company_id, tradie_category_id)`
- Index on `tradie_category_id` (for dispatch queries)

### 4.12 `tradie_service_areas`

Which suburbs a company services.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete cascade |
| `suburb_id` | bigint FK → suburbs | no | — | on delete restrict |
| `is_active` | boolean | no | true | |
| `created_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(tradie_company_id, suburb_id)`
- Index on `suburb_id` (dispatch hot path — "who services this suburb?")

### 4.13 `tradie_availability`

Operating hours. One row per company per day of week, plus exceptions.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete cascade |
| `day_of_week` | int | no | — | 0=Sunday, 6=Saturday. |
| `opens_at` | time | yes | null | null = closed that day. |
| `closes_at` | time | yes | null | null = closed that day. |
| `accepts_emergency` | boolean | no | false | Willing to take emergency outside hours. |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(tradie_company_id, day_of_week)`

**AGENT NOTE:** An "availability exceptions" table (specific-date closures) is Phase 2. For MVP, only day-of-week availability.

**AGENT NOTE:** When a tradie company is first created (step 4 of the registration wizard), default availability rows are inserted automatically: Monday–Friday (days 1–5), `opens_at = 07:00`, `closes_at = 17:00`, `accepts_emergency = false`. Saturday and Sunday are not inserted (tradie is treated as closed). The tradie can update these from `/tradie/availability`.

**AGENT NOTE:** This table uses a singular name (`tradie_availability`) rather than the plural convention in §1.1. This matches the migration and Model (`protected $table = 'tradie_availability'`). Do not rename it.

### 4.14 `jobs`

The core entity.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `public_id` | varchar(12) | no | — | Unique, short, shareable in URLs ("JOB-0142" style). Generated on create. |
| `member_user_id` | bigint FK → users | no | — | on delete restrict |
| `property_id` | bigint FK → properties | no | — | on delete restrict |
| `tradie_category_id` | bigint FK → tradie_categories | no | — | on delete restrict |
| `issue_type_id` | bigint FK → issue_types | yes | null | on delete restrict. Null if "other". |
| `custom_issue` | varchar(200) | yes | null | Used when issue_type_id is null. |
| `urgency` | `urgency` | no | — | |
| `description` | text | yes | null | Member free-text. |
| `best_contact_time` | varchar(32) | yes | null | "any"/"mornings"/etc. |
| `status` | `job_status` | no | `pending_dispatch` | |
| `submitted_at` | timestamptz | no | now() | |
| `dispatched_at` | timestamptz | yes | null | When first round of offers went out. |
| `assigned_tradie_company_id` | bigint FK → tradie_companies | yes | null | on delete restrict |
| `assigned_at` | timestamptz | yes | null | |
| `on_the_way_at` | timestamptz | yes | null | |
| `started_at` | timestamptz | yes | null | |
| `completed_at` | timestamptz | yes | null | Tradie's "mark complete" timestamp. |
| `confirmed_at` | timestamptz | yes | null | Member's confirmation timestamp. |
| `cancelled_at` | timestamptz | yes | null | |
| `cancellation_reason` | text | yes | null | |
| `dispatch_round` | int | no | 0 | Incremented each new dispatch round. |
| `requires_admin_review` | boolean | no | false | Set to true after N failed rounds or on dispute. |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `public_id`
- Index on `member_user_id`
- Index on `property_id`
- Index on `status` (admin lists)
- Index on `assigned_tradie_company_id` (tradie's active jobs)
- Index on `tradie_category_id`
- Index on `submitted_at desc`
- Partial index on `(requires_admin_review) where requires_admin_review = true`

**`public_id` generation:** On create, generate `JOB-XXXXX` where X is a base32 Crockford encoding of the id, left-padded. Generated in a model boot `saving` hook after insert. Unique index enforces correctness.

### 4.15 `job_images`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `job_id` | bigint FK → jobs | no | — | on delete cascade |
| `uploaded_by_user_id` | bigint FK → users | no | — | member or tradie |
| `path` | varchar(500) | no | — | S3 key. |
| `mime` | varchar(64) | no | — | |
| `size_bytes` | bigint | no | — | |
| `caption` | varchar(200) | yes | null | |
| `created_at` | timestamptz | no | now() | |

**Indexes:**
- Index on `job_id`

### 4.16 `job_offers`

The heart of dispatch. One row per (job, tradie_company) pair, per round.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `job_id` | bigint FK → jobs | no | — | on delete cascade |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete restrict |
| `round` | int | no | 1 | Which dispatch round this offer belongs to. |
| `rank_in_round` | int | no | — | 1 = first offered, 2 = second, etc. |
| `score` | numeric(10,4) | no | — | The score computed by dispatch. Stored for audit. |
| `status` | `offer_status` | no | `pending` | |
| `offered_at` | timestamptz | yes | null | When sent to tradie. |
| `viewed_at` | timestamptz | yes | null | When tradie opened the lead. |
| `accepted_at` | timestamptz | yes | null | |
| `declined_at` | timestamptz | yes | null | |
| `declined_reason` | varchar(64) | yes | null | Enum-ish: `too_far`, `busy`, `not_my_work`, `other`. |
| `expired_at` | timestamptz | yes | null | |
| `expires_at` | timestamptz | no | — | Computed: offered_at + window. |
| `superseded_at` | timestamptz | yes | null | When sibling was accepted. |
| `response_time_seconds` | int | yes | null | Generated: accepted_at - offered_at. |
| `created_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(job_id, tradie_company_id, round)`
- Index on `job_id, status`
- Index on `tradie_company_id, status` (tradie's inbox)
- Index on `expires_at` where `status = 'offered'` (scheduler lookups)
- Index on `offered_at desc`

**Generated column:**
```sql
response_time_seconds bigint GENERATED ALWAYS AS (
  CASE WHEN accepted_at IS NOT NULL AND offered_at IS NOT NULL
       THEN EXTRACT(EPOCH FROM (accepted_at - offered_at))::bigint
       ELSE NULL END
) STORED;
```

### 4.17 `job_status_logs`

Append-only audit of job state transitions.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `job_id` | bigint FK → jobs | no | — | on delete cascade |
| `from_status` | `job_status` | yes | null | null on create |
| `to_status` | `job_status` | no | — | |
| `changed_by_user_id` | bigint FK → users | yes | null | null if system |
| `changed_by_system` | boolean | no | false | |
| `note` | text | yes | null | |
| `created_at` | timestamptz | no | now() | |

**Indexes:**
- Index on `job_id, created_at`

No `updated_at`. This table is append-only.

### 4.18 `job_completion_reports`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `job_id` | bigint FK → jobs | no | — | on delete cascade. Unique. One report per job. |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete restrict |
| `submitted_by_user_id` | bigint FK → users | no | — | The tradie user who submitted. |
| `summary_of_work` | text | no | — | |
| `invoice_total_cents` | bigint | no | — | >= 0. |
| `no_callout_fee_confirmed` | boolean | no | — | Tradie's self-report. |
| `discount_applied` | boolean | no | — | |
| `discount_amount_cents` | bigint | yes | null | >= 0 when discount_applied is true. |
| `invoice_document_path` | varchar(500) | yes | null | S3 key. |
| `completion_notes` | text | yes | null | |
| `submitted_at` | timestamptz | no | now() | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `job_id`
- Index on `tradie_company_id, submitted_at desc`

### 4.19 `reviews`

Member's post-job review. Also the benefits confirmation.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `job_id` | bigint FK → jobs | no | — | on delete restrict. Unique. |
| `member_user_id` | bigint FK → users | no | — | on delete restrict |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete restrict |
| `work_completed_status` | varchar(16) | no | — | `yes`, `partial`, `no` |
| `no_callout_fee_honoured` | boolean | no | — | |
| `discount_honoured` | varchar(8) | no | — | `yes`, `no`, `na` |
| `stars` | int | no | — | 1–5. Check constraint. |
| `review_text` | text | yes | null | |
| `was_auto_confirmed` | boolean | no | false | true if created by 7-day timeout (no review submitted). |
| `submitted_at` | timestamptz | no | now() | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `job_id`
- Index on `tradie_company_id, submitted_at desc`
- Check: `stars BETWEEN 1 AND 5`

**Rules:**
- If `work_completed_status` is `no` OR `no_callout_fee_honoured` is `false` OR `discount_honoured` is `no`, the parent job's `status` must be `disputed`. Enforced in the app layer.

### 4.20 `tradie_performance_daily`

Pre-aggregated performance rollup for fast reads. Rebuilt nightly by a scheduled command.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete cascade |
| `date` | date | no | — | Day of the snapshot. |
| `leads_offered` | int | no | 0 | |
| `leads_viewed` | int | no | 0 | |
| `leads_accepted` | int | no | 0 | |
| `leads_declined` | int | no | 0 | |
| `leads_expired` | int | no | 0 | |
| `jobs_completed` | int | no | 0 | |
| `jobs_disputed` | int | no | 0 | |
| `avg_response_time_seconds` | int | yes | null | |
| `reported_revenue_cents` | bigint | no | 0 | |
| `discount_given_cents` | bigint | no | 0 | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(tradie_company_id, date)`
- Index on `date desc`

**Rebuild:** `php artisan tradies:rebuild-daily-performance` runs nightly. Idempotent. See `app/Console/Commands/RebuildDailyPerformance.php`.

### 4.21 `notifications`

Outbound message log (separate from Laravel's built-in `notifications` table, which we disable and replace — renamed `messages` would be clearer, but Laravel devs will expect this one).

**AGENT NOTE:** To avoid confusion with Laravel's default notifications table, **rename this to `outbound_messages`**. We still use Laravel's Notification system — but we write an audit row to `outbound_messages` per send.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `user_id` | bigint FK → users | yes | null | null for system-only. |
| `channel` | `notification_channel` | no | — | |
| `template_key` | varchar(64) | no | — | e.g., `lead_offer_sms`. |
| `recipient` | varchar(255) | no | — | Phone / email / push token. |
| `subject` | varchar(255) | yes | null | |
| `body` | text | no | — | Rendered body. |
| `context` | jsonb | yes | null | Template variables for debugging. |
| `related_type` | varchar(64) | yes | null | e.g., `job_offer`, `job`. |
| `related_id` | bigint | yes | null | |
| `provider_message_id` | varchar(120) | yes | null | Twilio SID / Postmark MessageID. |
| `status` | `notification_status` | no | `queued` | |
| `error_message` | text | yes | null | |
| `sent_at` | timestamptz | yes | null | |
| `delivered_at` | timestamptz | yes | null | From provider webhooks. |
| `failed_at` | timestamptz | yes | null | |
| `created_at` | timestamptz | no | now() | |

**Indexes:**
- Index on `user_id, created_at desc`
- Index on `related_type, related_id`
- Index on `provider_message_id` where not null

No `updated_at` (`status` changes tracked via status_at columns).

### 4.22 `member_credits` (stubbed in MVP)

Schema present; logic unused in MVP. See `01-product-spec.md §12`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `member_user_id` | bigint FK → users | no | — | on delete restrict |
| `amount_cents` | bigint | no | — | >= 0. |
| `reason` | text | no | — | |
| `created_by_user_id` | bigint FK → users | yes | null | Admin who issued. |
| `applied_to_subscription_id` | bigint FK → member_subscriptions | yes | null | |
| `expires_at` | timestamptz | yes | null | |
| `created_at`, `updated_at` | timestamptz | no | now() | |

### 4.23 `saved_tradies`

Member can save tradies for future reference.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint PK | no | — | |
| `member_user_id` | bigint FK → users | no | — | on delete cascade |
| `tradie_company_id` | bigint FK → tradie_companies | no | — | on delete cascade |
| `created_at` | timestamptz | no | now() | |

**Indexes:**
- Unique on `(member_user_id, tradie_company_id)`
- Index on `tradie_company_id`

### 4.24 Laravel framework tables

Standard Laravel tables, use stock migrations:
- `sessions` (stored in DB even though SESSION_DRIVER=redis — used as fallback if needed; or skip)
- `cache`, `cache_locks` — skip if REDIS is cache driver (it is)
- `jobs`, `job_batches`, `failed_jobs` — skip if Horizon manages queue (still create `failed_jobs` for visibility)
- `password_reset_tokens` — required for auth
- `personal_access_tokens` — required for Sanctum (Phase 2 mobile)

Run: `php artisan make:auth-tables`, keep only what's listed.

---

## 5. Migration file order

The agent must create migrations in this order to satisfy foreign keys. Laravel migrations are ordered by timestamp prefix — use this exact sequence:

1. `create_enum_types` (custom raw SQL migration to create all Postgres enum types)
2. `create_users_table`
3. `create_suburbs_table`
4. `create_member_plans_table`
5. `create_member_subscriptions_table`
6. `create_properties_table`
7. `create_tradie_categories_table`
8. `create_issue_types_table`
9. `create_tradie_companies_table`
10. `create_tradie_plans_table`
11. `create_tradie_subscriptions_table`
12. `create_tradie_company_categories_table`
13. `create_tradie_service_areas_table`
14. `create_tradie_availability_table`
15. `create_jobs_table`
16. `create_job_images_table`
17. `create_job_offers_table`
18. `create_job_status_logs_table`
19. `create_job_completion_reports_table`
20. `create_reviews_table`
21. `create_tradie_performance_daily_table`
22. `create_outbound_messages_table`
23. `create_member_credits_table`
24. `create_saved_tradies_table`

Laravel framework tables (`password_reset_tokens`, `failed_jobs`, `personal_access_tokens`) go first — they have no dependencies on our tables and are created by Laravel's default installation.

---

## 6. Seeders

Order matters.

1. `SuburbSeeder` — loads from CSV (WA suburbs).
2. `TradieCategorySeeder` — 8 categories.
3. `IssueTypeSeeder` — issues per category.
4. `MemberPlanSeeder` — 3 plans ($149 / $249 / $449 per year).
5. `TradiePlanSeeder` — 2 plans.
6. **Local/staging only:** `DevUserSeeder` — test accounts.

The top 5 seeders MUST run in production. `DevUserSeeder` MUST NOT run in production (guard with `app()->environment('local', 'staging')`).

---

## 7. Critical constraints summary

Rules the schema enforces at the DB layer:

- Unique active email/phone per non-deleted user.
- Exactly one primary property per member.
- Exactly one active/past-due subscription per member.
- Exactly one active/past-due subscription per tradie company.
- Exactly one completion report per job.
- Exactly one review per job.
- Star rating 1–5.
- Offer uniqueness per (job, tradie_company, round).

Rules the **app** enforces (not the DB):
- Plan-based property limits.
- Job submission requires active member subscription.
- Job offer creation requires active tradie subscription.
- Tradie agreement checkboxes at application time.

---

## 8. Example query: the dispatch engine's eligible-tradies query

The hot path. This query runs every time a job is dispatched or a round advances. Full scoring logic in `05-dispatch-engine.md`. This is the SQL skeleton:

```sql
SELECT
  tc.id AS tradie_company_id,
  tc.rating_average,
  tc.rating_count,
  tp.dispatch_rank_boost,
  COALESCE(tpd.leads_accepted, 0)   AS recent_accepted,
  COALESCE(tpd.leads_expired, 0)    AS recent_expired,
  COALESCE(tpd.avg_response_time_seconds, 99999) AS recent_avg_response,
  (SELECT COUNT(*) FROM jobs j2
     WHERE j2.assigned_tradie_company_id = tc.id
       AND j2.status IN ('assigned','tradie_on_the_way','in_progress')) AS current_workload
FROM tradie_companies tc
INNER JOIN tradie_subscriptions ts
  ON ts.tradie_company_id = tc.id AND ts.status = 'active'
INNER JOIN tradie_plans tp
  ON tp.id = ts.tradie_plan_id
INNER JOIN tradie_company_categories tcc
  ON tcc.tradie_company_id = tc.id AND tcc.is_active = true
INNER JOIN tradie_service_areas tsa
  ON tsa.tradie_company_id = tc.id AND tsa.is_active = true
LEFT JOIN tradie_performance_daily tpd
  ON tpd.tradie_company_id = tc.id
  AND tpd.date = CURRENT_DATE - INTERVAL '30 days'
WHERE tc.status = 'approved'
  AND tc.deleted_at IS NULL
  AND tcc.tradie_category_id = :category_id
  AND tsa.suburb_id = :suburb_id
  -- Exclude tradies currently paused (dispute flag)
  AND NOT EXISTS (
    SELECT 1 FROM jobs jd
    WHERE jd.status = 'disputed'
      AND jd.assigned_tradie_company_id = tc.id
      AND jd.requires_admin_review = true
  )
  -- Exclude any that have already been offered this job
  AND NOT EXISTS (
    SELECT 1 FROM job_offers jo
    WHERE jo.job_id = :job_id
      AND jo.tradie_company_id = tc.id
  );
```

Scoring happens in application code (PHP) over these rows. See `05-dispatch-engine.md`.

---

## 9. Open decisions affecting schema

| # | Decision | Impact |
|---|---|---|
| 1 | Member plan pricing | `member_plans.yearly_price_cents` seed values. |
| 2 | Tradie plan pricing | `tradie_plans.yearly_price_cents` seed values. |
| 3 | Member discount % | `member_plans.discount_percent`. |
| 4 | Geographic scope | Whether `suburbs` seed includes all states or only WA. |

Schema itself is unaffected — only seed data.

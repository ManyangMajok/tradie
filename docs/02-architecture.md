> **Demo variant:** Read `docs/DEMO.md` and the root `README.md` first. Their owner-approved MySQL/local-integration choices supersede the production infrastructure and billing instructions below. Preserve all other business rules.

# 02 — Architecture

**Status:** Canonical. The stack is locked; deviations require a decision.

---

## 1. Stack (locked)

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| Language | PHP | 8.3+ | Laravel 13 requirement. |
| Backend framework | Laravel | 13.x | Operations-heavy CRUD, queues, auth, billing — Laravel is the right shape. |
| Frontend bridge | Inertia.js | 3.x | Monolith speed, React ergonomics, no separate API-first SPA needed at MVP. |
| Frontend library | React | 19.x | Reusable for mobile (React Native) later. |
| Language (FE) | TypeScript | 6.x | Caught bugs pay for themselves within a week. |
| Styling | Tailwind CSS | 4.x | Fast, consistent, zero CSS file maintenance. |
| Database | PostgreSQL | 16+ | Future-proof for geo (PostGIS) and analytics. |
| Cache / session / queue | Redis | 7+ | Industry default with Laravel. |
| Queue monitor | Laravel Horizon | latest | Dispatch is async; you need the dashboard from day one. |
| WebSockets | Laravel Reverb | latest | First-party, runs on your own box, no Pusher fees. |
| Payments | Stripe (via Laravel Cashier) | Cashier 15+ | Only serious option. |
| SMS | Twilio | latest SDK | Reliable, good AU delivery. |
| Email | Resend (via `resend/resend-laravel`) | latest | Free up to 3k emails/month; clean Laravel SDK. |
| File storage | Local disk (`storage/app/private`) | — | MVP simplicity. Migrate to R2/S3 in Phase 2 if volumes grow. |
| Error tracking | Sentry | latest | Mandatory for dispatch debugging. Free tier (5k errors/mo) likely sufficient for MVP. |
| Process supervisor | Supervisor | 4.x | Keeps queue workers + Reverb alive. |
| Web server | Nginx | stable | Reverse proxy for Laravel + WebSocket proxy for Reverb. |
| Deployment | Manual scripts on GoDaddy VPS | — | See §6 and `PROVISIONING.md`. |
| CI | GitHub Actions | — | Build, test, lint on every PR. |
| Monitoring | Sentry + Laravel Pulse + UptimeRobot (free) | latest | Pulse ships with Laravel. |

**AGENT NOTE:** If a task appears to require a package not in this table, STOP and ask. Suggest, don't install.

---

## 2. System topology

```
┌────────────────────────────────────────────────────────────────────┐
│                          Users (browsers)                          │
│          members · tradies · admins (one React/Inertia app)        │
└────────────────────────────────────────────────────────────────────┘
                    │ HTTPS                         │ WSS
                    ▼                               ▼
        ┌───────────────────────┐     ┌──────────────────────────┐
        │        Nginx          │     │        Nginx             │
        │   (proxy → PHP-FPM)   │     │   (proxy → Reverb :8080) │
        └───────────────────────┘     └──────────────────────────┘
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐     ┌──────────────────────────┐
        │   Laravel (PHP-FPM)   │     │   Laravel Reverb daemon  │
        │  ─ HTTP controllers   │     │  (WebSocket server)      │
        │  ─ Inertia responses  │     │                          │
        │  ─ Webhook handlers   │     │   Broadcasts from queue  │
        └───────────────────────┘     └──────────────────────────┘
                    │                               ▲
                    ▼                               │
        ┌──────────────────────────────────────────────────────┐
        │                       Redis                         │
        │   ─ queue jobs (dispatch, notifications, webhooks)  │
        │   ─ cache · sessions · broadcasting pub/sub         │
        └──────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────────────────────────┐
        │                    PostgreSQL 16                    │
        │   (users, jobs, offers, subscriptions, everything)  │
        └──────────────────────────────────────────────────────┘

        ┌──────────────────────────────────────────────────────┐
        │    Background worker pool (Supervisor-managed):      │
        │   ─ queue:work  (jobs, notifications, webhooks)     │
        │   ─ horizon     (queue dashboard + supervisor)      │
        │   ─ reverb:start (WebSocket daemon)                 │
        │   ─ schedule:run (via cron, every minute)           │
        └──────────────────────────────────────────────────────┘

        External services (egress over HTTPS):
           Stripe · Twilio · Resend · Sentry · Google Places

        Local filesystem (MVP):
           /var/www/tradify/current/storage/app/private/
             ├── jobs/{jobId}/...            (images)
             ├── completion/{jobId}/...      (invoices)
             └── tradie-credentials/{companyId}/... (licence/insurance)
```

---

## 3. Request lifecycles (the ones that matter)

### 3.1 Member submits a job

```
Browser (Inertia POST /api/member/jobs)
  → Laravel controller: validate + create job row (status=pending_dispatch)
  → Controller: dispatch DispatchJobToTradies job onto queue
  → Controller: return Inertia response with new job
Queue worker picks up DispatchJobToTradies
  → Scores eligible tradies (see 05-dispatch-engine.md)
  → Creates job_offer rows for the top N
  → Dispatches SendLeadNotification jobs for each offer
  → Updates jobs.status = offered
  → Broadcasts JobStatusChanged event → Reverb → browser updates live
  → Schedules ExpireOffer jobs with delay = window for each offer
Each SendLeadNotification job:
  → Sends SMS via Twilio (with HTTP retry)
  → Sends push (if device token) — PHASE 2
  → Sends email via Postmark (backup channel)
```

### 3.2 Tradie accepts a lead

```
Browser (Inertia POST /api/tradie/leads/{offerId}/accept)
  → Laravel controller: wrap in DB transaction
    → Lock offer row (SELECT ... FOR UPDATE)
    → Check offer status still = 'offered' (not expired or accepted)
    → Set offer.accepted_at, offer.status = accepted
    → Set job.status = assigned, job.assigned_tradie_company_id
    → Mark sibling offers for same job as 'superseded'
    → Commit
  → Queue NotifyMemberAssigned (SMS + email to member)
  → Queue CancelExpiryJobs (cancel pending ExpireOffer jobs for sibling offers)
  → Broadcast JobStatusChanged → Reverb
  → Return Inertia response
```

### 3.3 Expiry window hits

```
ExpireOffer queue job runs at scheduled time
  → Lock offer (FOR UPDATE)
  → If offer.status still 'offered':
      Set offer.status = 'expired'
      Check if any sibling offers are still 'offered' for this job
      If NONE and this was the last active offer in the round:
         → Trigger next dispatch round (new offers to next-ranked tradies)
      If this was the LAST round:
         → Mark job status = 'pending_dispatch' (needs admin)
         → Notify admin
```

See `05-dispatch-engine.md` for the complete state machine.

---

## 4. Environment variables

Full list. Placeholders in `.env.example` in the repo root.

### Laravel core
```
APP_NAME=Tradify
APP_ENV=local|staging|production
APP_KEY=<php artisan key:generate>
APP_DEBUG=true|false
APP_URL=https://tradify.au
APP_TIMEZONE=UTC
```

### Database
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=my_tradie
DB_USERNAME=my_tradie
DB_PASSWORD=<secret>
```

### Redis
```
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<secret-or-null-locally>

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### Broadcasting / Reverb
```
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=<generated>
REVERB_APP_KEY=<generated>
REVERB_APP_SECRET=<generated>
REVERB_HOST=tradify.au        # public domain (what the browser connects to)
REVERB_PORT=443               # public port (Nginx terminates SSL and proxies)
REVERB_SCHEME=https

REVERB_SERVER_HOST=127.0.0.1  # internal bind (Reverb daemon listens here)
REVERB_SERVER_PORT=8080       # internal port (Nginx proxies /app and /apps to here)

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

**AGENT NOTE (Reverb pitfall):** In production, `QUEUE_CONNECTION=redis` is correct — broadcasts queue and fire reliably. Some tutorials suggest `QUEUE_CONNECTION=sync` — **do not use sync in production**. Use Redis and ensure the queue worker is running.

### Stripe
```
STRIPE_KEY=pk_test_...            # publishable
STRIPE_SECRET=sk_test_...         # secret (server only)
STRIPE_WEBHOOK_SECRET=whsec_...   # for webhook signature verification
CASHIER_CURRENCY=aud
CASHIER_CURRENCY_LOCALE=en_AU
```

### Twilio
```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=<secret>
TWILIO_FROM=+61400000000          # or registered alpha sender ID 'Tradify'
TWILIO_STATUS_WEBHOOK_URL=https://tradify.au/webhooks/twilio/status
```

### Resend (email)
```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxx       # for Svix-signed webhook verification
MAIL_MAILER=resend
MAIL_FROM_ADDRESS=no-reply@tradify.au
MAIL_FROM_NAME="Tradify"
```

### File storage (local disk at MVP)
```
FILESYSTEM_DISK=local_private
# No AWS/R2 variables needed at MVP. Phase 2 will reintroduce these if we migrate.
```

**AGENT NOTE:** A custom disk `local_private` is configured in `config/filesystems.php` pointing at `storage_path('app/private')` with `'visibility' => 'private'`. Files are served via signed temporary URLs generated by a `FileController` that checks access policy before streaming. See `07-integrations.md §4` for the implementation pattern.

### Sentry
```
SENTRY_LARAVEL_DSN=https://<key>@sentry.io/<project>
SENTRY_TRACES_SAMPLE_RATE=0.2
```

### Google Places (address autocomplete)
```
GOOGLE_MAPS_API_KEY=<secret>      # used server-side for Places API
VITE_GOOGLE_MAPS_API_KEY=          # referrer-restricted browser key
```

**Address autocomplete: Google Places API** at MVP. Switch to Mapbox or Geoapify if costs become a concern at scale.

---

## 5. Local development setup

Documented so a new contributor (human or agent) can go from zero to running in under 30 minutes.

### 5.1 Prerequisites
- PHP 8.3+
- Composer 2.x
- Node 20+
- PostgreSQL 16 (or Docker)
- Redis 7 (or Docker)
- Laravel Herd (optional but recommended on macOS) OR Laravel Sail via Docker

### 5.2 Recommended: Laravel Sail

The project ships a `docker-compose.yml` with: `app` (PHP+Nginx), `pgsql`, `redis`, `mailpit`, `reverb`.

```bash
git clone <repo>
cd <repo>
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail composer install
./vendor/bin/sail npm install
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm run dev
```

Then in separate terminals:
```bash
./vendor/bin/sail artisan reverb:start
./vendor/bin/sail artisan horizon   # queue + dashboard
./vendor/bin/sail artisan schedule:work   # cron locally
```

Open http://localhost. Mailpit at http://localhost:8025. Horizon at /horizon (admin only).

### 5.3 Seeded test accounts (local/dev only — never in production)

Seeded by `database/seeders/DevUserSeeder.php`:

- `admin@tradify.test` / password `password` — admin
- `member@tradify.test` / password `password` — member on Pro plan, 2 properties in Baldivis + Wellard
- `tradie@tradify.test` / password `password` — approved tradie, plumber, Baldivis service area, Standard plan
- `tradie-premium@tradify.test` / password `password` — approved tradie, electrician, Rockingham + Baldivis, Premium plan

---

## 6. Deployment topology

### 6.1 GoDaddy VPS — MVP launch

**One VPS on GoDaddy.** Minimum spec: **4 GB RAM / 2 vCPU / 80 GB SSD, Ubuntu 24.04 LTS.**

**Why 4 GB RAM minimum:** Postgres + Redis + PHP-FPM + Reverb + Horizon workers all sharing a box. The 2 GB tier will swap and degrade under load.

**What runs on the box:**
- Nginx (ports 80/443) — app + Reverb WebSocket proxy
- PHP-FPM 8.3
- PostgreSQL 16
- Redis 7
- Supervisor with programs: `horizon`, `reverb`
- Cron: Laravel scheduler (every minute) + nightly DB backup
- UFW firewall: 22 + 80 + 443 only; Postgres + Redis bound to `127.0.0.1`
- Fail2ban for SSH brute-force protection
- Certbot for Let's Encrypt SSL (auto-renew via cron)

**Deployment process:** Manual provisioning scripts + git-based deploy. See `PROVISIONING.md` in the project root for the exact shell commands. Summary:

1. **Initial provisioning** (run once on a fresh VPS): `./deploy/provision.sh` — installs everything.
2. **First deploy**: `./deploy/first-deploy.sh` — clones repo, sets up `.env`, runs migrations.
3. **Subsequent deploys**: `./deploy/deploy.sh` — git pull, composer install, migrate, asset build, restart workers.

No Laravel Forge, no managed platform. Full control, zero monthly platform cost, more responsibility.

### 6.2 Scale-out path (not MVP)

When you outgrow single-VPS:
1. Move PostgreSQL to managed (Neon, Supabase Postgres, or DO Managed Postgres).
2. Move Redis to managed.
3. Move file storage off local disk to Cloudflare R2 (free egress) or S3.
4. Add a second app server behind a load balancer.
5. Move Reverb to a dedicated server with IP-hash load balancing.

Do none of this in MVP. Single VPS handles hundreds of concurrent users comfortably.

### 6.3 Backups (non-negotiable)

MVP backup strategy — set up on day 1, not day 100:

- **Database:** `pg_dump` nightly at 02:00 local, compress, encrypt with GPG, upload to a separate location (Backblaze B2 free tier 10GB, or Cloudflare R2 free tier 10GB, or a second VPS). 30-day retention.
- **Uploaded files:** `rsync` `storage/app/private` nightly to the same offsite location.
- **Test restores monthly.** A backup you haven't restored from is not a backup.

Script lives at `deploy/backup.sh`, cron'd via `crontab -e`.

---

## 7. Nginx configuration essentials

Two concerns: app serving (standard Laravel) and Reverb WebSocket proxy.

### 7.1 App server block (simplified)
```nginx
server {
    listen 443 ssl http2;
    server_name tradify.au;

    root /var/www/tradify/current/public;
    index index.php;

    ssl_certificate     /etc/letsencrypt/live/tradify.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradify.au/privkey.pem;

    # Reverb WebSocket proxy — MUST come before location / fallback
    location /app {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://127.0.0.1:8080;
    }
    location /apps {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://127.0.0.1:8080;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## 8. Supervisor configuration

`/etc/supervisor/conf.d/tradify.conf`:

```ini
[program:tradify-horizon]
process_name=%(program_name)s
command=php /var/www/tradify/current/artisan horizon
autostart=true
autorestart=true
user=deploy
redirect_stderr=true
stdout_logfile=/var/www/tradify/current/storage/logs/horizon.log
stopwaitsecs=3600

[program:tradify-reverb]
process_name=%(program_name)s
command=php /var/www/tradify/current/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
user=deploy
redirect_stderr=true
stdout_logfile=/var/www/tradify/current/storage/logs/reverb.log
stopasgroup=true
killasgroup=true
```

The Laravel scheduler runs via system cron:
```cron
* * * * * deploy cd /var/www/tradify/current && php artisan schedule:run >> /dev/null 2>&1
```

---

## 9. Sessions, auth, and API boundaries

### 9.1 Sessions
- All auth is **session-based** (Laravel Breeze / custom). Inertia requests carry the session cookie.
- Sessions are stored in Redis.
- Session lifetime: 2 hours idle, sliding. Remember-me token: 30 days.

### 9.2 CSRF
- All state-changing requests require CSRF token.
- Inertia handles this automatically via the meta tag in the root view.

### 9.3 API tokens (for future mobile app)
- Use **Laravel Sanctum** personal access tokens.
- Create `api` route group in `routes/api.php` — **empty for MVP**, scaffolded for Phase 2.
- All MVP endpoints live under web middleware group in `routes/web.php` and return Inertia responses.

### 9.4 Webhook endpoints
- Separate route group under `routes/webhooks.php` (or `routes/web.php` with its own middleware).
- Bypass CSRF (via the `VerifyCsrfToken` except list).
- Use signature verification (Stripe signs, Twilio signs, Postmark signs) — **never** just a shared secret in query string.

---

## 10. Folder structure (high-level)

Full detail in `09-development-guide.md`. High-level here so architecture is understandable:

```
app/
├── Actions/                  # Single-purpose action classes (DispatchJobAction, AcceptOfferAction, etc.)
├── Console/                  # Artisan commands + schedule
├── Enums/                    # PHP backed enums for every Postgres enum type
├── Events/                   # Broadcasted events (JobStatusChanged, etc.)
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   ├── Requests/             # Form Request validation
│   └── Resources/            # API resources (for Phase 2 API)
├── Jobs/                     # Queue jobs (AdvanceToNextRank, ExpireOffer, etc.)
├── Listeners/
├── Models/
├── Notifications/            # Laravel notifications (multi-channel)
├── Policies/
├── Providers/
├── Services/                 # Domain services + external API wrappers (TradieScorer, TwilioSms, etc.)
└── Support/                  # DTOs and value objects (ScoringContext, EligibleTradie)

resources/
├── js/
│   ├── Pages/                # Inertia pages (one per route)
│   ├── Components/           # Shared components
│   ├── Layouts/              # AppLayout, MemberLayout, TradieLayout, AdminLayout
│   ├── hooks/
│   ├── lib/                  # API client, formatters, validators
│   └── types/                # Shared TypeScript types
├── css/
└── views/                    # Only the Inertia root blade + mail markdown views

database/
├── migrations/
├── factories/
└── seeders/

tests/
├── Feature/                  # Most tests live here
├── Unit/                     # Only for pure functions (scoring, etc.)
└── Pest.php                  # Using Pest for tests

routes/
├── web.php
├── auth.php
├── webhooks.php
└── channels.php              # Reverb channel auth
```

---

## 11. Open architecture decisions

| # | Decision | Status |
|---|---|---|
| 1 | Single VPS vs split servers at launch | **Resolved:** Single GoDaddy VPS, 4GB/2vCPU min. |
| 2 | File storage | **Resolved:** Local disk at MVP; R2/S3 in Phase 2. |
| 3 | Address autocomplete provider | **Resolved:** Google Places (free tier at MVP volume). |
| 4 | Deployment platform | **Resolved:** Manual scripts; see `PROVISIONING.md`. |
| 5 | Email provider | **Resolved:** Resend. |

No open decisions remain at the architecture level.

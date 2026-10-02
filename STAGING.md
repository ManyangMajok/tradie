# STAGING.md — Staging Environment

**Status:** Reference. Read alongside `PROVISIONING.md` — staging is a delta on production, not a separate recipe.

---

## 0. Why staging exists

Staging is the environment where you verify a deploy works **against production-like infrastructure** before sending it to real users. It is NOT:

- A dev environment (that's your laptop)
- A demo environment (though it can double as one)
- A load test environment (that's a separate, ephemeral, non-shared target)

Skipping staging is the most common cause of avoidable production outages. The two hours a week staging costs save you one weekend per year.

---

## 1. What staging must match and what can differ

### Must match production
- OS, PHP version, Node version, Postgres version, Redis version — exactly
- Nginx config — same file, different hostname
- The full request lifecycle including Reverb WebSockets
- Database schema (same migrations, same seed data structure)
- Supervisor setup
- Cron jobs

### Can differ from production
- VPS size (staging can be smaller — 2GB/1vCPU is fine; production is 4GB/2vCPU)
- Real third-party services vs test-mode versions:
  - Stripe: use Stripe **test mode** in staging with separate test keys
  - Twilio: use Twilio **test credentials** OR a dedicated magic-number setup
  - Resend: use a separate API key pointed at a verified `staging.tradify.au` domain (or use Mailpit for local-only staging)
  - Google Places: same API key with IP-restricted access
- Sentry: separate Sentry project (tag `environment: staging`)
- Data volume — staging has seed + test data, not real user data

### Must NEVER happen
- Staging using production credentials for anything
- Production users ever hitting staging (accidental DNS misconfig)
- Real SMS going out from staging (Twilio test mode prevents this; verify it's configured)
- Real money charged in staging (Stripe test keys prevent this; verify)

---

## 2. DNS and domain setup

Staging lives at `staging.tradify.au`. Add a DNS A record pointing to the staging VPS IP.

```
A    staging.tradify.au     →    [STAGING_VPS_IP]
```

TTL 300 seconds (5 minutes) — low, so you can move staging around if needed.

Do NOT use a `www.staging.tradify.au` or a CNAME. Keep it simple.

---

## 3. Provisioning the staging VPS

Follow `PROVISIONING.md` **sections 1, 2, and 4–7** with these substitutions:

| What | Production | Staging |
|---|---|---|
| VPS tier | 4 GB RAM / 2 vCPU | 2 GB RAM / 1 vCPU |
| Domain | tradify.au | staging.tradify.au |
| DB name | tradify | tradify_staging |
| DB user | tradify | tradify_staging |
| DB password | strong unique | strong unique (different from prod) |
| Redis password | strong unique | strong unique (different from prod) |
| Reverb credentials | generated | generated (different from prod) |
| App path | /var/www/tradify/current | /var/www/tradify-staging/current |
| Supervisor program names | tradify-horizon, tradify-reverb | tradify-staging-horizon, tradify-staging-reverb |
| Supervisor log paths | /var/www/tradify/current/storage/logs/ | /var/www/tradify-staging/current/storage/logs/ |
| Deploy user | deploy | deploy (same user OK) |
| SSL cert | Let's Encrypt for tradify.au | Let's Encrypt for staging.tradify.au |

Skip `PROVISIONING.md §3` (don't use production env values), `§8` production-deploy section (use staging deploy script below), and `§13` disaster recovery (staging DR is "rebuild from scratch, it's just staging").

---

## 4. Staging `.env`

Key differences from production:

```env
APP_NAME="Tradify (Staging)"
APP_ENV=staging
APP_DEBUG=true                # OK in staging, NEVER in production
APP_URL=https://staging.tradify.au
APP_TIMEZONE=UTC

# Staging DB + Redis (local)
DB_DATABASE=my_tradie_staging
DB_USERNAME=my_tradie_staging
DB_PASSWORD=<staging-db-password>

REDIS_PASSWORD=<staging-redis-password>

# Stripe test mode
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Twilio test credentials (or magic numbers)
TWILIO_ACCOUNT_SID=AC...test...
TWILIO_AUTH_TOKEN=...test...
TWILIO_FROM=+15005550006     # magic test number; ALL staging SMS go here

# Resend with staging subdomain
RESEND_API_KEY=re_staging_...
RESEND_WEBHOOK_SECRET=whsec_staging_...
MAIL_FROM_ADDRESS=no-reply@staging.tradify.au

# Sentry staging project
SENTRY_LARAVEL_DSN=https://...@sentry.io/<staging-project-id>
SENTRY_TRACES_SAMPLE_RATE=1.0   # 100% in staging for visibility

# Feature flags — staging can have experimental flags on
FEATURE_PHONE_VERIFICATION=true
```

**AGENT NOTE:** Never copy production `.env` to staging or vice-versa. Each has its own, stored in its own secrets management.

---

## 5. Stripe configuration for staging

In Stripe Dashboard:

1. **Switch to test mode** (toggle at top left).
2. Create the same Products and Prices as production — or better, use Stripe CLI to duplicate from production:
   ```bash
   stripe products list
   # Copy the structure, create in test mode
   ```
3. Set up a webhook endpoint pointing to `https://staging.tradify.au/webhooks/stripe` with events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy the webhook signing secret into staging `.env` as `STRIPE_WEBHOOK_SECRET`

Test cards:
- `4242 4242 4242 4242` — success
- `4000 0000 0000 0341` — fails on payment
- `4000 0025 0000 3155` — requires 3D Secure

Use these during staging testing. Any real card numbers in staging will fail or create real charges (depending on whether you're truly in test mode — verify twice).

---

## 6. Twilio configuration for staging

Options, in order of preference:

### Option A: Twilio test credentials
In Twilio console, find your "Test Account SID" and "Test Auth Token" under Settings. These create API requests that simulate success/failure but **do not send real messages**. Magic numbers for testing:
- `+15005550006` — success
- `+15005550001` — invalid number
- `+15005550009` — unreachable

Use these for automated tests and basic staging smoke tests. No cost.

### Option B: Real Twilio account, magic numbers only
Use your production account but restrict staging to Twilio magic test numbers. Messages "succeed" without actually going out. No cost.

### Option C: Real Twilio account, whitelisted real numbers
Use real phone numbers of internal testers only. Real SMS go out. Costs small amounts per send. Most realistic for manual testing.

**Recommendation:** Option A for CI/automated tests; Option C for manual pre-release verification with a whitelist of internal mobile numbers.

Never let staging send to arbitrary real numbers. The app-level safeguard is a `STAGING_SMS_WHITELIST` env var that the `TwilioChannel` checks before sending in non-production environments.

```php
// app/Notifications/Channels/TwilioChannel.php
if (app()->environment('staging')) {
    $whitelist = explode(',', env('STAGING_SMS_WHITELIST', ''));
    if (!in_array($message->to, $whitelist)) {
        Log::info('Staging SMS blocked (not on whitelist)', ['to' => $message->to]);
        return;  // don't send
    }
}
```

Add this check. It's saved me before in equivalent setups.

---

## 7. Resend configuration for staging

Option A (recommended): verify a separate subdomain `staging.tradify.au` in Resend and send from `no-reply@staging.tradify.au`. This keeps staging and production sending domains separate — if staging somehow hits production contacts, it's visible, and there's no deliverability risk to production.

Option B: use Mailpit on the staging server; don't send real emails at all. Simpler but less realistic.

The same whitelist pattern from §6 should apply for staging email — only send to internal testers:

```php
// bootstrap/app.php or a ServiceProvider
if (app()->environment('staging')) {
    Mail::alwaysTo(env('STAGING_EMAIL_WHITELIST'));
}
```

Laravel has `Mail::alwaysTo()` which redirects ALL outgoing emails to a single address regardless of intended recipient. Perfect for staging. Set `STAGING_EMAIL_WHITELIST=your-staging-inbox@yourdomain.com`.

---

## 8. Seed data for staging

Staging should have:
- All reference data that production has (suburbs, categories, issue types, plans) — from seeders
- A representative cast of test accounts — different roles, different states, different edge cases
- Sample jobs in every possible state (pending, offered, assigned, completed, confirmed, disputed, cancelled)

Create a dedicated `StagingSeeder`:

```php
// database/seeders/StagingSeeder.php
class StagingSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment('staging')) {
            $this->command->warn('StagingSeeder only runs in staging. Skipping.');
            return;
        }

        // Create 10 members (various plans, various states)
        User::factory()->count(10)->member()->create();

        // Create 20 tradies across categories + suburbs
        TradieCompany::factory()->count(20)->approved()->create();

        // Create sample jobs in every status
        Job::factory()->count(5)->state(['status' => 'pending_dispatch'])->create();
        Job::factory()->count(10)->state(['status' => 'offered'])->create();
        Job::factory()->count(8)->state(['status' => 'assigned'])->create();
        // ... etc

        // 2 tradie applications pending review
        TradieCompany::factory()->count(2)->pending()->create();

        // 3 disputed jobs for admin review
        Job::factory()->count(3)->disputed()->create();

        $this->command->info('Staging seed complete.');
    }
}
```

Run after every staging reset:
```bash
php artisan migrate:fresh --seed --seeder=StagingSeeder
```

**Reset staging every Sunday night** via a cron job or manual ritual. Drift between staging and a clean state becomes confusing; regular resets keep it honest.

---

## 9. Deploying to staging

### 9.1 Deploy script

`deploy/deploy-staging.sh` — similar to production but:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/tradify-staging/current

BRANCH=${1:-main}   # defaults to main; can pass a feature branch

echo "→ Checking out $BRANCH"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "→ Installing composer dependencies"
composer install --no-dev --optimize-autoloader --no-interaction

echo "→ Installing npm dependencies + building assets"
npm ci
npm run build

echo "→ Running migrations"
php artisan migrate --force

echo "→ Caching"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "→ Reloading PHP-FPM + Supervisor"
sudo systemctl reload php8.3-fpm
sudo supervisorctl restart tradify-staging-horizon
sudo supervisorctl restart tradify-staging-reverb

echo "✓ Staging deploy complete ($BRANCH)"
```

### 9.2 When to deploy to staging

- **Always before production**, for any non-trivial change
- **Feature branches** can deploy directly to staging for review before merging to `main`
  - Pass the branch name: `./deploy-staging.sh feature/lead-decline-reasons`
  - Remember to reset back to main before the next deploy
- **Main branch** auto-deploys to staging on push (Phase 2: GitHub Actions webhook to run the script)

### 9.3 When NOT to deploy to staging

- Never deploy a production-only config change to staging unreviewed
- Never point staging at production DB or Redis (even "just for one test")
- Never use production credentials on staging

---

## 10. Pre-production checklist (using staging)

Before every production release, verify on staging:

**Core flows:**
- [ ] Member signup → subscription → first job end-to-end
- [ ] Tradie application → admin approval → subscription activation
- [ ] Job dispatch happy path (lead offered, accepted, completed, reviewed)
- [ ] Job dispatch failure (all tradies decline, admin escalation)
- [ ] Subscription cancellation via Stripe portal

**Integrations:**
- [ ] Stripe webhooks fire correctly (use Stripe CLI to replay test events)
- [ ] Twilio SMS lands (check Twilio console for test sends)
- [ ] Resend email lands (check staging inbox)
- [ ] Reverb WebSocket connections established (check browser network tab)

**UI:**
- [ ] No console errors on any page
- [ ] No visible regressions
- [ ] Mobile responsive on test devices

**Performance:**
- [ ] Load the dispatch query with seed data — verify < 200ms
- [ ] Horizon dashboard shows no stuck jobs

**Sentry:**
- [ ] Trigger a test error and verify it reaches Sentry in the staging project
- [ ] Verify production project does NOT receive it

If any check fails, do not deploy to production. Fix, redeploy to staging, re-verify.

---

## 11. Giving others staging access

Staging often needs to be demoable or shared with:
- Designers
- Beta testers
- Stakeholders
- Occasionally, a tradie or member pre-launch

**Password-protect staging at the Nginx level** so random crawlers don't hit it:

```nginx
# /etc/nginx/sites-available/tradify-staging

server {
    # ... (SSL + standard config)

    auth_basic "Tradify Staging";
    auth_basic_user_file /etc/nginx/.htpasswd-staging;

    # ... rest of server block
}
```

Generate the auth file:
```bash
sudo htpasswd -c /etc/nginx/.htpasswd-staging tradify-stage
```

Username: `tradify-stage`, password: something memorable. Share these with anyone who needs access.

**robots.txt must block indexing on staging**:

```
# public/robots.txt — but replace per-env
User-agent: *
Disallow: /
```

Use Laravel's env-aware logic in the robots route:

```php
// routes/web.php
Route::get('/robots.txt', function () {
    if (app()->environment('production')) {
        return response("User-agent: *\nAllow: /\n", 200, ['Content-Type' => 'text/plain']);
    }
    return response("User-agent: *\nDisallow: /\n", 200, ['Content-Type' => 'text/plain']);
});
```

---

## 12. Tearing down and rebuilding staging

Staging is **disposable**. If it breaks, it's fine to rebuild from scratch. The process:

1. Spin up a new VPS
2. Run `PROVISIONING.md §1–2` adjusted per §3 of this doc
3. `git clone` the repo at `/var/www/tradify-staging/current`
4. Populate `.env` from your staging secrets manager
5. `migrate:fresh --seed --seeder=StagingSeeder`
6. Update DNS A record to new IP (low TTL means fast switch)
7. Issue new Let's Encrypt cert

Total time: ~2 hours. Do this periodically anyway — it verifies your provisioning scripts still work.

---

## 13. Common staging problems

### "It works on staging but fails in production"
- Check PHP version match
- Check config:cache has been run in both
- Check `APP_DEBUG=false` in production (showing obscured errors)
- Check env variable differences

### "Production deploy failed but staging was fine"
- Almost always a secrets or credential issue
- Check `.env` difference
- Check DNS / SSL issues
- Check supervisor process is actually running on production

### "Staging is running yesterday's code"
- Supervisor not restarted
- Config cache stale — run `php artisan config:cache`
- Opcache not flushed — reload PHP-FPM

### "Staging SMS went to a real customer"
- You didn't implement the whitelist check in §6. Do it now.

---

## 14. Maintenance

- **Weekly:** verify staging is still deploying cleanly on main merge
- **Monthly:** reset staging to clean state (`migrate:fresh --seed`)
- **Quarterly:** re-issue staging SSL cert if Certbot hasn't auto-renewed
- **After every production incident:** check whether staging could have caught it; if not, expand coverage

Staging is a tool, not a product. It works best when treated as a cost centre — always on, rarely cared about, only noticed when it breaks — but dependable when you need it.

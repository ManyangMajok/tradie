# OBSERVABILITY.md — What to Watch, What to Alert On

**Status:** Reference. Your operations manual for "is everything working?"

---

## 0. Philosophy

You can't fix what you can't see. But you also can't see everything — too many alerts becomes noise and noise becomes ignored. The goal is: **the signal you need, and nothing more.**

Three tiers of monitoring:

1. **Passive** — logs, dashboards, occasional review. No alerting.
2. **Active** — automated check + alert on threshold breach.
3. **Paging** — wakes you up at 3am.

At MVP, paging tier should have at most 5 alerts. Everything else is active or passive. More than 5 paging alerts and you'll start ignoring them all.

---

## 1. The three things that must just work

If any of these are broken, the business is down.

### 1.1 The website / mobile APIs respond
Without this, members can't sign up, tradies can't accept leads.

**Monitor:** UptimeRobot free tier, 5-minute checks on:
- `https://tradify.au/` — 200 OK
- `https://tradify.au/up` — 200 OK (Laravel's default health endpoint)

**Alert:** email + SMS on two consecutive failures.

### 1.2 Dispatch is creating offers
A job submitted → an offer created within 10 seconds. This is the heart of the platform.

**Monitor:** a custom scheduled job that runs every 5 minutes:
- Checks: are there any jobs in `pending_dispatch` status for more than 2 minutes?
- If yes: log to Sentry at ERROR level + send SMS to founder

### 1.3 Stripe subscriptions are being created
A subscription checkout complete → a `member_subscriptions` row created. If the webhook handler is broken, users pay and get nothing.

**Monitor:** a custom scheduled job that runs every hour:
- Checks: does Stripe show subscriptions without corresponding rows in the DB?
- If yes: Sentry WARNING (not CRITICAL; they can be manually reconciled)

These three monitors are the core safety net. Everything else is nice-to-have.

---

## 2. Tools

### Free tier, MVP-sufficient:

**Sentry (free tier: 5K errors/month)**
- Application exceptions (Laravel + React + React Native)
- Tag by environment, app, user
- Slack integration (Phase 2) for team alerting

**UptimeRobot (free tier: 50 monitors, 5-min intervals)**
- HTTP checks on tradify.au, staging.tradify.au
- Public status page (optional; helps during outages)
- Email + SMS alerts (SMS is limited on free tier)

**Laravel Horizon**
- Queue monitoring: jobs processed, failed, retries
- Dashboard at `/horizon` (admin-only)
- No external alerting built-in, but visible

**Laravel Pulse**
- Live dashboard of request counts, slow queries, exceptions
- Ships with Laravel, zero setup

**Stripe Dashboard**
- Payment success rates, chargebacks, failed payments
- Built-in email alerts for failed webhooks

**Twilio Console**
- SMS delivery rates
- Error breakdowns (invalid number, carrier reject, etc.)

**Resend Dashboard**
- Email sent, delivered, bounced, complained
- Real-time event view

### Paid tier, Phase 2+ if needed:

- **Sentry Team plan** (~$26 USD/month) — longer retention, more errors, team features
- **UptimeRobot Pro** (~$7 USD/month) — 1-minute intervals, SMS credits
- **Better Stack / Uptime.com** — richer status pages and alerting
- **Logflare / Datadog** — real log aggregation if log volume outgrows VPS disk

Don't buy these at launch. Revisit when Sentry free tier runs out (typically 6+ months in).

---

## 3. What to watch (passive — daily/weekly review)

### 3.1 Sentry dashboard (daily, 5 minutes)
- Unresolved issues — anything new?
- Error rate trend — up or down?
- Slowest transactions — anything regressed?

Triage new issues: fix, ignore (with reason), or ticket.

### 3.2 Horizon dashboard (daily, 2 minutes)
- Failed jobs count (should be 0 most days)
- Queue wait times (should be <1s for high-priority queue)
- Jobs per minute (gives a pulse read on activity)

### 3.3 Stripe dashboard (weekly)
- New subscriptions this week
- Failed payments (should be <2%)
- Churn (cancellations)
- Disputes/chargebacks (should be 0 most weeks)

### 3.4 Twilio dashboard (weekly)
- SMS sent this week
- Delivery rate (should be >95%)
- Cost trend

### 3.5 Resend dashboard (weekly)
- Email sent
- Bounce rate (should be <2%)
- Complaint rate (should be <0.1%)

### 3.6 VPS health (weekly)
SSH into VPS, run:
```bash
df -h                            # disk space (alert at 80%)
free -h                          # memory (alert at 85% usage sustained)
top -bn1 | head -15              # top processes
sudo tail -100 /var/log/nginx/tradify_error.log  # anything unusual?
sudo journalctl --since "1 week ago" --priority=err  # system errors
```

---

## 4. What to alert on (active — automated)

The subset of metrics you want to wake you up or at least interrupt you.

### 4.1 Critical (SMS or equivalent — tier 3 paging)
- Site down for > 10 minutes (UptimeRobot)
- Dispatch queue backed up (>10 jobs in `pending_dispatch` for >5 minutes)
- Failed webhook: 5+ Stripe webhook failures in an hour
- Database unreachable from app
- Disk >95% full

### 4.2 High (email — tier 2)
- Site down for > 2 minutes but < 10 minutes (flaky but maybe transient)
- Queue failure rate >5% in last hour
- Sentry: new error with count >10 in last hour
- SSL certificate < 7 days to expiry (Certbot should renew, but verify)
- Stripe payment success rate <95% on 24-hour window

### 4.3 Medium (daily digest)
- Sentry: any new errors since yesterday
- Twilio: >2% SMS delivery failure in last 24h
- Resend: >2% email bounce in last 24h
- Disk >80%
- Job dispatch escalation rate >5% (too many jobs going to manual admin)

### 4.4 Low (weekly digest)
- User signup count
- Subscription revenue
- Churn count
- Support ticket volume and categories

---

## 5. Setting up alerts

### 5.1 UptimeRobot
1. Sign up, add the two HTTPS monitors
2. Alert contacts: your email + phone (SMS on free tier is limited, upgrade if needed)
3. Alert threshold: "Alert after 2 consecutive failures" (avoids flapping)

### 5.2 Sentry
1. Sentry → Alerts → Create alert rule
2. For critical errors: "when an event with tag environment=production AND level=error is seen"
3. Deliver to email + SMS (via Twilio integration) for critical
4. For new error types: "when a new issue is created" → email only

### 5.3 Custom Laravel checks (dispatch backlog)

Scheduled command that runs every 5 minutes:

```php
// app/Console/Commands/CheckDispatchHealth.php
public function handle(): int
{
    $stuckCount = Job::where('status', 'pending_dispatch')
        ->where('created_at', '<', now()->subMinutes(2))
        ->count();

    if ($stuckCount > 10) {
        Sentry\captureMessage(
            "Dispatch backlog: {$stuckCount} jobs stuck in pending_dispatch",
            Sentry\Severity::error()
        );

        Notification::route('mail', config('app.admin_email'))
            ->notify(new DispatchBacklogAlert($stuckCount));
    }

    return self::SUCCESS;
}
```

Register in `app/Console/Kernel.php`:
```php
$schedule->command('ops:check-dispatch-health')->everyFiveMinutes();
```

### 5.4 Stripe webhook health
Stripe Dashboard → Developers → Webhooks → your endpoint → "Alerts"
- "Alert if webhook failures >5 in a 1-hour period"

### 5.5 Status page (optional but recommended)
UptimeRobot free tier includes a public status page. Set up at `status.tradify.au`:
- Monitors visible: website, API
- Incident posting for transparency
- Link from main site footer

---

## 6. Runbooks (what to do when an alert fires)

Write these so that your future half-asleep self (or an assistant) can follow them without thinking.

### 6.1 "Site is down"

1. Load `https://tradify.au` in a browser — is it really down?
2. Check UptimeRobot dashboard — what's the pattern? One-off or sustained?
3. SSH into VPS: `ssh deploy@tradify.au`
4. Check `sudo systemctl status nginx php8.3-fpm postgresql redis-server`
5. Restart whatever's down: `sudo systemctl restart <service>`
6. Check disk: `df -h` — full? Rotate logs or clear cache
7. Check load: `top` — process eating everything?
8. Check `tail -100 /var/log/nginx/tradify_error.log`
9. If Supervisor-managed: `sudo supervisorctl status` — Horizon or Reverb stopped?
10. If unresolved in 10 minutes, post to status page: "We're investigating; more soon."
11. Call user impact "minimal/moderate/severe" in status update
12. Fix, document in §8 incident log

### 6.2 "Dispatch backlog"

1. Log into Horizon dashboard `/horizon`
2. Check: is queue worker running? (Supervisor → `tradify-horizon` RUNNING?)
3. Check failed jobs in Horizon → likely cause of backlog
4. SSH in: `php artisan horizon:status` → paused? `php artisan horizon:continue`
5. Check Redis: `redis-cli -a PASSWORD ping`
6. If jobs failing: check Sentry for exception; fix code; `php artisan queue:retry all`
7. If jobs stuck but not failing: scheduler might be down — check cron

### 6.3 "Stripe webhook failing"

1. Stripe Dashboard → Developers → Webhooks → your endpoint → recent deliveries
2. What HTTP status? 4xx means signature rejection; 5xx means our code throwing
3. 4xx: verify `STRIPE_WEBHOOK_SECRET` matches the endpoint
4. 5xx: check Sentry + Laravel logs for the error
5. Stripe auto-retries for 3 days; fix the cause and use "Resend" button for any missed events
6. For the missed webhooks, may need to manually reconcile (see `docs/07-integrations.md §1.6`)

### 6.4 "Disk filling up"

1. `ssh deploy@tradify.au && df -h`
2. `sudo du -sh /var/log/* | sort -rh | head` — biggest log dirs
3. `sudo du -sh /var/www/tradify/current/storage/logs/* | sort -rh | head`
4. Common culprits:
   - Laravel daily logs — rotate: `sudo find /var/www/tradify/current/storage/logs -name "*.log" -mtime +14 -delete`
   - Nginx access log — rotate via logrotate (should be config'd; if not, do it now)
   - User uploads in `storage/app/private/jobs/` — growth expected; check size trajectory
5. Free space; avoid touching user uploads unless you're positive they're orphaned

### 6.5 "SMS not sending / many failing"

1. Twilio console → Monitor → Logs → Errors
2. Group by error code
3. Common codes:
   - `21211` invalid number — app validation letting bad numbers through?
   - `21610` unsubscribed — expected for users who replied STOP
   - `30007` carrier block — content pattern triggering filters (review recent SMS templates)
   - `30008` unknown error — retry or contact Twilio
4. If alpha sender ID failing specifically: may need re-registration with Australian carriers

### 6.6 "Emails not arriving"

1. Resend Dashboard → Logs
2. Search by recipient email
3. Check status:
   - Delivered → arrived; user should check spam
   - Bounced → invalid email; update on their side
   - Complained → they marked as spam; never send to them again
4. Check domain reputation: Resend Dashboard → Domains → your verified domain
5. If many bounces suddenly: domain reputation issue? Deliverability tanking? Pause non-essential sends, investigate

### 6.7 "Unusual Sentry spike"

1. Sentry → what's the new error type?
2. Is it one exception exploding in count, or many different exceptions?
3. One exception: fix or revert
4. Many exceptions: probably infrastructure (DB issue, Redis issue, dependency update gone wrong)
5. Check deploys: was there a recent deploy? Consider rollback (`git reset --hard` to the last known-good commit and redeploy)

### 6.8 "I think we've been hacked"

See `THREAT-MODEL.md §D.1`. Short version:
1. Isolate the VPS (firewall everything but your IP)
2. Rotate all secrets (`SECRETS.md §6`)
3. Pull forensic snapshot if possible (VPS snapshot feature if available)
4. Restore from a clean backup
5. Call the lawyer before telling anyone else

---

## 7. Weekly operational review

Every Monday, 20 minutes:

**Quick health:**
- Sentry: any ignored issues I should revisit?
- Horizon: anything stuck?
- Disk: under 70%?
- SSL: auto-renewed properly?

**Week-over-week:**
- Signups (trending up/flat/down?)
- Active jobs (trending?)
- Disputes (trending?)
- Support tickets (categories shifting?)

**Follow-ups:**
- Any alerts fired this week? Root cause identified?
- Any runbook that was followed? Did it work? Edit if not.
- Any metric you wish you had? Add it.

20 minutes / week is the price of knowing how the business is actually going.

---

## 8. Incident log

Every time an alert fires OR something unexpected happens, log it. This is the single most valuable observability practice: writing things down.

| Date | Severity | What happened | Detection | Root cause | Resolution | Lessons |
|---|---|---|---|---|---|---|
| _YYYY-MM-DD_ | L/M/H | _Brief_ | _How did we notice?_ | _Why?_ | _What we did_ | _What to improve_ |

**Template example:**

| 2026-05-03 | M | Dispatch backlog | Alert fired: 15 jobs stuck 8 min | Horizon worker crashed overnight, Supervisor didn't autostart | Manually restarted; fixed Supervisor config to autostart | Added `autostart=true` check to provisioning script |

Monthly review: what patterns emerge? Are the same things recurring? Fix once, permanently.

---

## 9. Dashboards to consider (Phase 2)

When you outgrow daily-dashboard-checking, consider building:

- **Executive dashboard** — single page showing: active members, active tradies, MRR, jobs this week, dispute count, support volume
- **Operational dashboard** — dispatch health, queue health, error rate, uptime
- **Financial dashboard** — revenue, churn, refunds, MRR movement

Tools: Laravel Pulse for ops; for business metrics, a simple admin page that runs cached SQL queries is sufficient until you need more. No need for Looker / Metabase at MVP.

---

## 10. What this document is NOT

- Not a SRE handbook — we're at MVP scale, not Google scale
- Not a replacement for understanding your code — logs and metrics are signals, not explanations
- Not a substitute for care — automated alerts catch known problems; the ones that bring you down are always the unknown ones

The highest-value practice in this document: **review logs and metrics weekly when everything is fine.** That's when you build the intuition that lets you diagnose fast when it's not fine.

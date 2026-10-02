# SECRETS.md — Secrets Management

**Status:** Reference. Keep current.

This document is about **who has what access**, **where secrets live**, and **how you rotate them**. At MVP with one founder, a lot of this sits in your head — but that's the most dangerous place for it. Write it down.

---

## 0. Principles

1. **No secret in git, ever.** If one leaks there by accident, rotate immediately (§6). Removing the commit isn't enough.
2. **One source of truth per secret.** You should always know where to get the current value.
3. **Least privilege.** Give access to only who needs it, at the level they need.
4. **Rotate on known or suspected exposure.** When in doubt, rotate.
5. **Plan for your own absence.** If you're hit by a bus, a trusted person must be able to access critical systems.

---

## 1. Where secrets live

**Password manager (1Password, Bitwarden, or similar):** the canonical store for all production credentials. Create a dedicated "Tradify" vault. Categories within:

- Infrastructure (VPS SSH keys, server root passwords, Postgres password)
- Third-party services (Stripe keys, Twilio creds, Resend key, Sentry DSN)
- Application secrets (Laravel APP_KEY, Reverb APP_SECRET)
- Developer access (GitHub, Cloudflare if added, domain registrar)

**`.env` files on servers:** the active runtime source. `.env` on production VPS, `.env` on staging VPS. File permissions `600`, owned by `deploy` user. Never world-readable.

**CI secrets (GitHub Actions):** injected as `secrets.*` in workflows. Never logged, never committed.

**Developer local `.env`:** on your laptop only. Uses sandbox/test credentials where possible.

**Never:**
- Email
- Slack DMs
- Text messages
- Google Docs (unencrypted)
- Printouts left on desks
- Sticky notes on monitors

---

## 2. Inventory of secrets

Keep this table current. When you add a new integration, add a row.

| Secret | Where used | Stored in | Rotation trigger |
|---|---|---|---|
| **Infrastructure** | | | |
| GoDaddy VPS root password | Rescue / emergency only | Password manager | Every 6 months or on team change |
| VPS `deploy` user SSH key (private) | Your laptop + secure backup | Password manager + `~/.ssh/` | On laptop change or suspected compromise |
| Postgres `tradify` user password | App `.env` + backup scripts | Password manager | On team change or suspected DB compromise |
| Redis password | App `.env` | Password manager | On suspected compromise |
| **Application** | | | |
| Laravel `APP_KEY` | `.env` | Password manager | Never regenerate in production without data migration plan (encrypts sessions, password resets) |
| Reverb `APP_ID` / `APP_KEY` / `APP_SECRET` | `.env` + Vite build | Password manager | On suspected WS-layer compromise |
| **Third-party (production)** | | | |
| Stripe publishable key `pk_live_...` | `.env` (and Vite exposure) | Password manager | Rarely; rotate in Stripe Dashboard |
| Stripe secret key `sk_live_...` | `.env` | Password manager | **Immediately on any suspected leak** |
| Stripe webhook signing secret | `.env` | Password manager | When webhook endpoint URL changes |
| Twilio Account SID + Auth Token | `.env` | Password manager | On suspected compromise |
| Resend API key | `.env` | Password manager | On suspected compromise |
| Resend webhook signing secret | `.env` | Password manager | When webhook URL changes |
| Google Places API key | `.env` + Vite (browser key) | Password manager | If abuse or leak spotted |
| Sentry DSN | `.env` | Password manager | Rarely (not strictly secret, but not public) |
| **Developer access** | | | |
| GitHub personal access tokens | `~/.git-credentials` or SSH key | Password manager + machine keychain | On laptop change, team change, leak |
| Domain registrar login | Password manager | Password manager | Every 12 months + 2FA always |
| Cloudflare login (if added) | Password manager | Password manager | Every 12 months + 2FA always |
| Apple Developer ID | Password manager | Password manager | On team change; 2FA always |
| Google Play Console login | Password manager | Password manager | On team change; 2FA always |
| **Offsite backup** | | | |
| Backblaze B2 / R2 access keys (for backups) | Backup script env file on VPS | Password manager | On suspected backup compromise |

---

## 3. Access levels (by role)

At MVP, only the founder has access to everything. When you hire or add a co-founder, formalise:

### Role: Founder / Tech lead
- Everything above

### Role: Support staff (if hired)
- Admin console login with `role=admin` but with reduced permissions (see `docs/09-development-guide.md §5` — policies enforce what admins can actually do)
- **No** server SSH access
- **No** Stripe dashboard admin access (view-only if needed for billing support)
- **No** production database access
- **No** production `.env` access

### Role: Dev contractor (if hired)
- Access to staging only (staging VPS SSH, staging DB, staging `.env`)
- Production `.env` → only if deploying, and revoked after
- Dev sandbox access to Stripe / Twilio / Resend (they set up their own test accounts)
- Read access to production Sentry

### Role: Lawyer / accountant
- Data on user / plan / revenue via exports you personally generate
- **No** direct system access

### Role: Founder's trusted contact (bus factor)
- Emergency access documented in `RUNBOOK-CONTINUITY.md` (separate doc)
- Does not have everyday access
- Knows how to get into the password manager if you're incapacitated

---

## 4. Setting a new secret

When you add a new integration:

1. Create the account / obtain credentials from the provider
2. Save to password manager with a clear item name ("Stripe — Production Secret Key")
3. Add to server `.env` with a descriptive variable name
4. Add a row in §2 above
5. Add to `.env.example` in the repo with a placeholder value (NOT the real one)
6. If CI needs it, add as a GitHub Actions secret
7. Document the rotation procedure below (§6)
8. Commit the `.env.example` change to git — not `.env`

---

## 5. Onboarding a new team member

When you hire someone:

1. Determine their role per §3
2. Provision accounts:
   - Password manager vault access (shared or provisioned)
   - Necessary third-party logins (e.g., Stripe dashboard invite with appropriate role)
   - Staging / production SSH key added if applicable
   - GitHub repo access at appropriate level (read, write, admin)
3. They sign an NDA + confidentiality agreement (see `LEGAL.md §3` / §4)
4. They set up 2FA on all accounts
5. Document the access granted in the inventory
6. Review every 6 months — remove any access no longer needed

---

## 6. Rotating a secret

General procedure:

1. **Generate a new value** in the provider's dashboard
2. **Update the password manager** with the new value (keep old one labelled "pending retirement")
3. **Deploy to the environment** where the secret is used:
   - Edit `.env` on the server
   - `php artisan config:cache`
   - Restart services that read it (usually `php-fpm` and Supervisor programs)
4. **Verify** the application works with the new value
5. **Revoke the old value** at the provider
6. **Remove the old value** from password manager
7. **Update §2 inventory** with rotation date

### Provider-specific procedures

#### Stripe secret key
1. Stripe Dashboard → Developers → API keys → Create new secret key
2. Label it (e.g., "Production — 2026-04")
3. Update production `.env` → `config:cache` → reload PHP-FPM
4. Verify: run a test subscription or trigger a webhook; watch logs
5. Revoke the old key in Stripe Dashboard (this is the step that "finalises" the rotation)
6. Update password manager

#### Twilio auth token
1. Twilio Console → Account → API credentials → View Auth Token → "Request new auth token"
2. Update production `.env` → `config:cache` → reload PHP-FPM
3. Test: send an SMS via an internal tool or trigger a notification
4. Twilio applies the new token globally — the old one stops working once you confirm

#### Resend API key
1. Resend Dashboard → API Keys → Create API key
2. Update `.env`, reload
3. Revoke old key

#### Laravel APP_KEY
**Caution:** Rotating `APP_KEY` invalidates:
- All active sessions (users logged out)
- All encrypted values in the DB (password reset tokens, etc.)
- Any encrypted cache/queue payloads

Steps:
1. Schedule a maintenance window
2. Back up the database
3. `php artisan key:generate --show` to generate a new key (don't apply yet)
4. Decrypt then re-encrypt any encrypted DB columns with the old key, then the new key (requires custom artisan command)
5. Update `.env`, `config:cache`
6. Verify logins work (users will need to log back in)
7. Monitor for any broken encrypted-payload errors

Only do this if the key is genuinely compromised. Otherwise leave it.

#### VPS `deploy` user SSH key
1. On your laptop: `ssh-keygen -t ed25519 -C "deploy@tradify-vps-new" -f ~/.ssh/tradify_deploy_new`
2. SSH in with the old key, add the new public key to `~/.ssh/authorized_keys`
3. Test login with the new key from a second terminal
4. Remove the old public key from `authorized_keys`
5. Update password manager

#### Postgres password
1. SSH into VPS
2. `sudo -u postgres psql -c "ALTER USER tradify WITH PASSWORD 'new_strong_password';"`
3. Update `.env`, `config:cache`
4. Reload PHP-FPM and Supervisor programs
5. Verify app can connect

---

## 7. Leak response

If a secret leaks (committed to public repo, posted in Slack, etc.):

**Within 5 minutes:**
- Rotate the affected secret per §6
- If the leak is in a git commit: **the commit must be considered compromised forever**; rotating is mandatory; removing the commit from history does not help because it may already be cloned or scraped

**Within 1 hour:**
- Check logs for any abuse during the window between leak and rotation
- Check Stripe for unexpected transactions
- Check Twilio for unexpected sends
- Check Resend for unexpected emails
- Check Sentry for unusual patterns

**Within 24 hours:**
- Post-mortem: how did it leak, how to prevent recurrence
- Update tooling (e.g., install `git-secrets` or `gitleaks` pre-commit hook)
- If user data could have been accessed, see `THREAT-MODEL.md §D.1` response

**Preventing future leaks:**
- `.gitignore` entries: `.env`, `.env.*`, `*.pem`, `*.key`
- Pre-commit hook: `gitleaks` scans for accidentally-staged secrets
- Code review: another pair of eyes catches most leaks before merge (when you have a team)
- `git log -p -- .env` periodically to check nothing has sneaked in

---

## 8. CI secrets (GitHub Actions)

Secrets used in CI:

- Test API keys for Stripe/Twilio/Resend (sandbox accounts)
- DB credentials (CI uses a test Postgres container; credentials are ephemeral per run)
- SSH key to deploy to staging (optional; Phase 2 convenience)

Set up:
1. GitHub repo → Settings → Secrets and variables → Actions
2. Add each secret; they become `${{ secrets.NAME }}` in workflows
3. Never echo secrets in workflow output (`run: echo ${{ secrets.X }}` is a leak)
4. Mask in logs: GitHub auto-masks values added as secrets

---

## 9. 2FA requirements

**Mandatory 2FA on:**
- GitHub (account access controls source code)
- Stripe (financial)
- Twilio (messaging spend)
- Resend (email spend)
- Apple Developer (app signing)
- Google Play Console (app publishing)
- Password manager (master)
- Domain registrar (whoever owns the domain owns the business's online identity)
- Cloudflare (if used — controls DNS + traffic)

**2FA method preference (most to least secure):**
1. Hardware key (YubiKey) — best, one-time cost
2. TOTP app (1Password, Authy, Aegis)
3. SMS — **avoid where possible** (SIM-swap vulnerable). Only acceptable for vendors that offer nothing else.

**Backup codes:** every provider gives them. Save to password manager in the same vault as the credential.

---

## 10. Departure checklist

When someone leaves the team:

- [ ] Revoke GitHub access (remove from org / revoke PAT)
- [ ] Revoke SSH key on VPS (`authorized_keys`)
- [ ] Remove from password manager vault
- [ ] Remove from Stripe / Twilio / Resend / Sentry team accounts
- [ ] Remove from Apple Developer / Play Console team
- [ ] Rotate any secrets they had access to (err on the side of over-rotation)
- [ ] Update inventory in §2
- [ ] Archive their email / Slack access
- [ ] Retrieve any company devices
- [ ] Confirm NDA/confidentiality clauses are still in effect post-employment

---

## 11. Secrets audit (quarterly)

Every quarter, 30 minutes:

- Does the inventory in §2 match reality? Any secret in the wild that's not listed?
- Has anyone left in the last quarter whose access wasn't properly revoked?
- Any secrets over 12 months old that should be rotated on principle?
- Any new services added that weren't documented?
- Are `.gitignore` entries still correct?

Log the audit — a one-line note "2026-07-15: audit complete, 1 issue found and fixed" is enough.

---

## 12. What never to do

- Ask anyone to read a secret to you over phone/Zoom (copy-paste from password manager instead)
- Type a secret in plain text into a chat (even "it's just for testing")
- Commit a file that might contain secrets without reviewing first
- Use the same password across services (password manager generates unique ones)
- Store 2FA backup codes in the same place as the main credential
- Leave a terminal logged into production on a shared computer
- Use public Wi-Fi to access production without a VPN

Most security incidents are boring. This is the boring stuff that prevents them.

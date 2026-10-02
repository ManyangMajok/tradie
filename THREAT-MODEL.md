# THREAT-MODEL.md — Fraud, Abuse, and Security

**Status:** Reference. Updated quarterly or after any incident.

This document lists the categories of bad behaviour and attack vectors the platform must anticipate, with mitigations. It's **not** a comprehensive security audit — that's a separate, paid engagement with a security firm. This is the working document for the operational response to the realistic threats.

---

## 0. How to use this document

For each threat:
- **Description** — what the bad actor does
- **Impact** — what breaks if it happens
- **Likelihood** — Low / Medium / High at our stage
- **Existing mitigations** — what the docs / code already do
- **Missing mitigations** — what's still needed
- **Detection** — how you'd notice
- **Response** — what to do

This doc is a **live document**. When a new threat surfaces (either because you see it or because someone else in your industry reports it), add a section. When a threat turns out not to be real, strike through with a note.

---

## Part A: Financial fraud

### A.1 Stolen credit card used for subscription

**Description:** Someone uses a stolen card to sign up for a membership or tradie subscription.

**Impact:** Stripe chargeback 30–60 days later. You lose the subscription fee AND pay Stripe's chargeback fee (~$15 AUD). Multiple chargebacks lead to increased Stripe fees and, at scale, account suspension.

**Likelihood:** Low at MVP scale; Medium as you grow.

**Existing mitigations:**
- Stripe Radar (fraud detection) is on by default — blocks high-risk transactions
- Stripe 3D Secure can be enabled for extra verification
- Subscriptions require a real email and phone — raises the friction for fraudsters

**Missing mitigations:**
- 🔧 Enable Stripe Radar Rules: block signups from countries where you don't operate (outside AU)
- 🔧 Enable 3D Secure for all subscription creations (adds a verification step; slightly reduces conversion but dramatically reduces fraud)
- 🔧 Monitor chargeback ratio: Stripe flags accounts above 1%; stay below 0.5%

**Detection:**
- Stripe dashboard shows chargebacks as they happen
- Set up email alert for every chargeback

**Response:**
- Immediately: refund the fraudulent subscription, suspend the account
- Within 7 days: respond to Stripe with any evidence (login logs, IP, phone verification)
- If a pattern emerges: tighten signup (phone verification required, IP reputation check)

### A.2 Fraudulent tradie application

**Description:** Someone applies as a tradie using fake credentials (faked licence number, photoshopped insurance certificate). Gets approved, receives leads, does poor/unlicensed work, damages property.

**Impact:** Member trust collapses. Potential legal liability for the platform (see `LEGAL.md §5`). Real tradies lose leads to a fraudster.

**Likelihood:** Medium. This is the most likely serious threat because the reward is real money.

**Existing mitigations:**
- Tradie application requires licence number + insurance document upload (`docs/01-product-spec.md §3.3`, `03-database.md §4.8`)
- Admin approval required before activation (no self-serve approval)
- Application fee not charged until after approval — low financial friction but still a check

**Missing mitigations:**
- 🔧 **Licence verification against state registries.** Each state has an online licence lookup (e.g., WA Building Commission). Admin must verify each licence number against the real registry before approval, not just accept the document. This is a manual step at MVP; Phase 2 could automate for common states.
- 🔧 **Insurance verification.** Call or email the insurer on the certificate to verify it's genuine. Tradies sometimes submit a certificate they genuinely had once but has since been cancelled.
- 🔧 **ABN cross-check.** ABN lookup is free via the ABR API. Verify the ABN matches the business name and is active.
- 🔧 **Photo verification.** Phase 2: ask for a photo of the tradie holding their licence or a branded van. Not foolproof but raises the bar.
- 🔧 **Expiry reminders.** Scheduled job reminds admin when a tradie's licence or insurance is <30 days from expiry; auto-suspends at expiry (already in spec, must be implemented in Phase 1.3).

**Detection:**
- Rising disputes from a single tradie → flag
- Multiple members reporting unprofessional work → review
- Member reports that the tradie had no licence visible → investigate immediately
- Member complaint to state licensing body → you'll find out via subpoena or news

**Response:**
- Immediately suspend tradie pending investigation
- Verify licence + insurance + ABN from authoritative sources
- If fraud confirmed: terminate, refund their subscription (avoid their retaliation), notify affected members, notify the relevant state licensing body, consult lawyer
- Document the case for internal reference

### A.3 Dispute fraud — member

**Description:** Member uses the job then files a false dispute ("call-out fee was charged" when it wasn't) to get a platform credit or to damage the tradie.

**Impact:** Unfair suspension of a legitimate tradie. Credits issued dishonestly. Reputation damage to the platform within the trade community.

**Likelihood:** Low but real.

**Existing mitigations:**
- Disputes require manual admin review — not automatic penalty
- The review requires evidence from both sides (`SUPPORT-OPS.md §5.4`)

**Missing mitigations:**
- 🔧 Flag members who have filed 2+ disputes as a percentage of their completed jobs (e.g., >20% disputes → pattern)
- 🔧 Require invoice upload with dispute filing ("what did they charge you") to catch made-up charges
- 🔧 Tradie's side of the dispute must be documented before resolution (don't decide one-sidedly)

**Detection:**
- Pattern: same member files multiple disputes across different tradies
- Pattern: tradie pattern of being disputed is inconsistent with their overall rating trend (9/10 consistent, but one member leaves 1-star + dispute)

**Response:**
- Investigate both sides fairly
- If member is serial disputer: warn, then suspend
- If single bad actor: note internally, dismiss the dispute, explain to tradie

### A.4 Dispute fraud — tradie

**Description:** Tradie charges the call-out fee, doesn't apply discount, then claims in the dispute that they did.

**Impact:** Platform promise to members broken. Members lose trust when they realise the "benefit" isn't real.

**Likelihood:** Medium. Economically tempting — $50 call-out fee × 50 jobs = $2,500/year the tradie keeps.

**Existing mitigations:**
- Member confirmation is a separate question from tradie self-report (`docs/01-product-spec.md §11`) — the trust loop
- Disputes pause the tradie's lead flow automatically

**Missing mitigations:**
- 🔧 Invoice upload on completion becomes REQUIRED for Premium tier (per `docs/10-build-phases.md §Phase 2.F`) — Phase 2
- 🔧 Invoice pattern checks: cross-check invoice total against category typical values
- 🔧 Random audit: occasionally contact members directly to confirm their review answers

**Detection:**
- Member dispute rate on a tradie exceeds threshold
- Tradie self-reports "discount applied" at 100% but member confirmations say otherwise
- Reviews lagging behind completion (tradies who push completion through hoping member doesn't review)

**Response:**
- Same as A.3 — investigate both sides
- If tradie lied, suspend or terminate depending on severity
- Credit affected members
- Notify other members who had recent jobs with this tradie (may have been similarly treated)

### A.5 Chargeback after service delivered

**Description:** Tradie delivers a job to a member. Member receives benefits (no call-out fee + discount), then disputes the Tradify subscription charge with their bank.

**Impact:** Platform eats the subscription fee AND the value of the services the member received.

**Likelihood:** Low. Harder to pull off than normal chargeback fraud because there's a clear service relationship.

**Existing mitigations:**
- Subscription charge appears clearly labelled as "Tradify membership" on statements
- Member's job history and completed jobs are evidence the service was used

**Missing mitigations:**
- 🔧 Chargeback response template with standard evidence pack (signup confirmation, terms acceptance, job logs, review submissions)
- 🔧 Store evidence of consent: IP + timestamp + T&C version accepted at signup

**Detection:** Stripe notifies you of chargeback.

**Response:** File the evidence pack within Stripe's deadline (usually 7–14 days). Most consumer chargebacks against clearly-labelled subscriptions are won with adequate documentation.

---

## Part B: Abuse of the platform

### B.1 Off-platform circumvention

**Description:** A tradie completes a job via Tradify, then offers the member "next time, call me directly — I'll give you the discount without needing the membership."

**Impact:** Long-term erosion of member and tradie subscriptions. The core economic loop breaks.

**Likelihood:** High. Every marketplace has this problem.

**Existing mitigations:**
- Nothing directly enforced; the business model relies on value delivered (fast, trusted dispatch) being higher than the member's cost
- `LEGAL.md §4` notes the tradie T&Cs may include a non-circumvention clause (lawyer to advise on enforceability)

**Missing mitigations:**
- 🔧 T&Cs explicitly prohibit solicitation; consequence is termination (lawyer reviews enforceability)
- 🔧 Member surveys at renewal asking "have you used a Tradify tradie outside of Tradify?"
- 🔧 At renewal, emphasise value: "you saved $X this year through Tradify"
- 🔧 Phase 2: masked phone numbers (`docs/10-build-phases.md §Phase 2.D`) makes direct-contact harder

**Detection:**
- Hard to detect without survey
- Renewal decline with no stated reason — investigate
- Tradie has declining lead acceptance over time but no subscription churn — suspicious

**Response:**
- If evidence of solicitation: warn, then terminate tradie
- Educate members at renewal on value received
- Structural: ensure Tradify's value exceeds the cost (faster response, vetted quality, dispute protection)

### B.2 Tradie taking the lead and never fulfilling

**Description:** Tradie accepts a lead to block competitors (or just carelessly), then never shows up or starts the job.

**Impact:** Member has a bad first-impression experience. Dispatch hasn't offered to someone else. Trust damaged.

**Likelihood:** Medium.

**Existing mitigations:**
- Tradies who don't transition status ("On the way", "Started") can be flagged
- Member cancellation triggers dispute flag if they say tradie no-showed

**Missing mitigations:**
- 🔧 Auto-flag tradies whose jobs sit in `assigned` status for >24h without "on the way"
- 🔧 Ghost-acceptance rate as a scoring penalty (`docs/05-dispatch-engine.md §5`)
- 🔧 Tradie deposit / bond system — Phase 3 consideration; controversial

**Detection:**
- Job status telemetry: stale `assigned` without progression
- Member complaint via support channels

**Response:**
- After first incident: warn, explain, note
- After second: suspend lead flow for 2 weeks
- After third: terminate

### B.3 Member submits fake jobs to test / harass

**Description:** Member submits repeat fake jobs (tests, pranks, harassment toward a specific tradie).

**Impact:** Tradie wastes time responding, may lose trust in the platform. SMS/email costs accumulate.

**Likelihood:** Low.

**Existing mitigations:**
- Rate limit on job creation: 5/minute/user per `docs/04-api-spec.md §8`
- Duplicate submission check within 60 seconds per `docs/05-dispatch-engine.md §8.9`
- Jobs require a real property with a real address

**Missing mitigations:**
- 🔧 Tradie decline with reason "suspicious / repeated" feeds into a flag on the member
- 🔧 Pattern detection: member creating and cancelling multiple jobs in short periods
- 🔧 Cooldown: after 3 cancellations within a rolling 7 days, flag member for review

**Detection:**
- Dispatch logs show member cancellation rate
- Tradie complaints about specific member

**Response:**
- Investigate pattern
- Contact member for explanation
- Suspend if harassment confirmed

### B.4 Targeted harassment between member and tradie

**Description:** A job introduces two people who don't get along. One harasses the other via phone / SMS / social media after the job.

**Impact:** Platform liability risk. Member or tradie lost as customer.

**Likelihood:** Low but inevitable at scale.

**Existing mitigations:**
- Phone numbers exchanged post-acceptance (not masked at MVP — Phase 2 masked calls addresses this)

**Missing mitigations:**
- 🔧 Phase 2 masked calls (`docs/10-build-phases.md §Phase 2.D`)
- 🔧 Clear process for reporting harassment (support@tradify.au + specific category)
- 🔧 T&C clause prohibiting harassment; violation grounds for termination

**Detection:** Reports from affected party.

**Response:**
- Take reports seriously, immediately
- Suspend alleged harasser pending investigation
- If credible threat of violence: police
- If platform failure contributed: apologise and improve

### B.5 Review bombing

**Description:** Coordinated fake negative reviews against a tradie (by a competitor tradie, disgruntled member, or bot).

**Impact:** Wrongful reputation damage; tradie may churn.

**Likelihood:** Low at MVP, rises with visibility.

**Existing mitigations:**
- Reviews are tied to completed jobs only — you can't review a tradie you haven't hired (`docs/03-database.md §4.19`)
- This alone prevents most review-bombing

**Missing mitigations:**
- 🔧 Monitor for review patterns: multiple low reviews in short period from recent new members
- 🔧 Admin ability to hide a review pending investigation (Phase 2 admin tooling)

**Detection:** Sudden rating drop; tradie complaint.

**Response:**
- Investigate each suspicious review's job
- If the member is legitimate: the review stays, but engage the tradie's side
- If pattern of fake accounts: remove reviews, terminate fake accounts

---

## Part C: Account takeover and credential security

### C.1 Compromised user password

**Description:** Member or tradie's password is stolen (from another site's breach, reused). Attacker logs into their Tradify account.

**Impact:** Member: fake jobs submitted, subscription cancelled, address/PII visible to attacker. Tradie: leads accepted and mishandled, subscription cancelled.

**Likelihood:** Medium — password reuse is endemic.

**Existing mitigations:**
- Passwords hashed with bcrypt (Laravel default)
- Rate limit on login: 5 attempts/minute per IP (`docs/04-api-spec.md §8`)
- Sessions invalidated on password change

**Missing mitigations:**
- 🔧 Email notification on new device login ("We noticed a login from a new device at [TIME] from [LOCATION]")
- 🔧 Force password reset for any account in a known public breach (monitor HaveIBeenPwned API)
- 🔧 Password strength requirements on signup (minimum 12 characters, not on common-breach list)
- 🔧 2FA option (Phase 2 — optional for members, consider required for tradies given their subscription value)
- 🔧 Biometric unlock on mobile apps (already in spec — `docs/11-mobile-apps-spec.md §3.1`)

**Detection:**
- Unusual login pattern (new IP, new device)
- Multiple failed logins before success

**Response:**
- If reported by user: force password reset, invalidate all sessions
- Review recent activity on account for unauthorised actions
- Restore any unauthorised changes
- Notify affected parties if job submissions or data changes occurred

### C.2 Compromised admin account

**Description:** An admin account (yours) is compromised. Attacker can approve fake tradies, refund their own chargebacks, access all user data.

**Impact:** Catastrophic. Full platform data compromise.

**Likelihood:** Low with basic hygiene; Medium if you reuse passwords or leave access loose.

**Existing mitigations:**
- Admin role gated in middleware (`docs/04-api-spec.md §4`)
- Session lifetime 2 hours (`docs/02-architecture.md §9.1`)

**Missing mitigations:**
- 🔧 **2FA REQUIRED on admin accounts.** Not optional. Implement on day 1 of admin console.
- 🔧 IP allowlist for admin login (optional; useful if you always log in from the same places)
- 🔧 Admin action log (separate audit log for every admin action — approve, suspend, refund)
- 🔧 Email alert on every admin login from a new IP

**Detection:**
- Admin action log anomalies (actions outside normal hours, unusual patterns)
- Login from unexpected location

**Response:**
- Force password reset
- Invalidate all admin sessions
- Audit admin actions for the compromise window
- Consider external security review

### C.3 API token theft (mobile app)

**Description:** Sanctum personal access token exfiltrated from a compromised device or intercepted network.

**Impact:** Attacker can use API as that user until token is invalidated.

**Likelihood:** Low with HTTPS and secure store; Medium if device is jailbroken/rooted.

**Existing mitigations:**
- Tokens in `expo-secure-store` (Keychain/Keystore) per `docs/11-mobile-apps-spec.md §3.1`
- All API traffic HTTPS only
- Refresh token rotation on refresh (per spec)

**Missing mitigations:**
- 🔧 Device fingerprint: reject tokens when the device characteristics have changed
- 🔧 Short access token lifetime (1 hour per spec) — good
- 🔧 Logout on all devices option in settings
- 🔧 Admin ability to invalidate all tokens for a user (support use case)

**Detection:** Very hard without active monitoring.

**Response:**
- On user report: invalidate all tokens, force reauth
- Audit recent API usage for anomalies

### C.4 Password reset email hijacking

**Description:** Attacker requests password reset for a target's email, intercepts it somehow (compromised email account, ISP interception). Resets password.

**Impact:** Account takeover.

**Likelihood:** Low — requires email compromise as prerequisite.

**Existing mitigations:**
- Reset links expire within 60 minutes
- Reset links are single-use

**Missing mitigations:**
- 🔧 Reset notification to OLD email ("Your password was changed at [TIME]. If this wasn't you, contact support immediately.")
- 🔧 Account freeze: account-sensitive actions (plan changes, refund requests) require re-authentication for 24 hours after password change

---

## Part D: Infrastructure security

### D.1 VPS compromise

**Description:** Attacker gains root or `deploy` user access on the GoDaddy VPS.

**Impact:** Total platform compromise. Database dump. All credentials exposed. Everything in `storage/app/private/`.

**Likelihood:** Low with the `PROVISIONING.md` security steps; Medium without them.

**Existing mitigations:** (see `PROVISIONING.md §1`)
- SSH root login disabled
- Password authentication disabled
- SSH key-only auth
- UFW firewall: only 22, 80, 443 open
- Fail2ban for SSH brute force
- Postgres + Redis bound to localhost only

**Missing mitigations:**
- 🔧 Regular OS patching: `unattended-upgrades` package for automatic security updates
- 🔧 SSH on non-default port (moves port 22 to e.g. 2222 — reduces bot traffic, not real security but helpful)
- 🔧 Intrusion detection: consider `rkhunter` or `chkrootkit` with periodic scans
- 🔧 Offsite log shipping — so an attacker can't hide their tracks by wiping local logs

**Detection:**
- Unusual system load
- New user accounts on the system
- Unexpected outbound network traffic
- Tripwire on `/etc/passwd`, `/etc/shadow`, critical directories (advanced)

**Response:**
- Immediate: isolate the VPS, restore from a pre-compromise backup
- Rotate ALL secrets — Stripe, Twilio, Resend, Sentry, database passwords, Reverb secrets, SSH keys
- Notify affected users per privacy laws
- Consult lawyer re: breach notification obligations
- External forensics review
- Post-mortem, published internally

### D.2 Database leak via application bug

**Description:** SQL injection, IDOR (Insecure Direct Object Reference), or broken auth lets an attacker read another user's data via the application.

**Impact:** Privacy breach. Potential notifiable data breach.

**Likelihood:** Medium — this is the most common real-world attack against web apps.

**Existing mitigations:**
- Eloquent ORM prevents direct SQL injection
- Form Requests validate input (`docs/09-development-guide.md §4`)
- Policies enforce authorization (`docs/09-development-guide.md §5`)
- Test coverage required on every Policy (`docs/09-development-guide.md §7.2`)

**Missing mitigations:**
- 🔧 Pen test before public launch (one-off, ~$3,000–$8,000 AUD for a basic app test)
- 🔧 OWASP ZAP or similar automated scanner in CI (free)
- 🔧 Bug bounty program — Phase 3 when you have traffic worth bug-hunting

**Detection:**
- Rare to catch without monitoring
- User report of seeing someone else's data

**Response:**
- Immediate: patch the bug, force session invalidation
- Assess scope
- Notify affected users
- Regulator notification if threshold met (Privacy Act NDB)

### D.3 Supply chain attack

**Description:** A dependency (npm or Composer package) becomes malicious. Happens more often than people realise.

**Impact:** Depends on the package — could be credential exfiltration, crypto-mining, data theft.

**Likelihood:** Low per-package; Medium over a 2-year horizon across many dependencies.

**Existing mitigations:**
- Package whitelist (`docs/09-development-guide.md §16`) — limits which packages can be installed
- Lock files committed (`composer.lock`, `package-lock.json`, or `pnpm-lock.yaml`)

**Missing mitigations:**
- 🔧 Dependabot or Renovate on the GitHub repo — auto-PRs for security updates
- 🔧 `composer audit` and `npm audit` in CI pipeline
- 🔧 Review dependency changes in PRs, not just rubber-stamp
- 🔧 Be cautious about adding tiny, rarely-maintained packages (high supply-chain risk)

**Detection:**
- CI security audits flag known CVEs
- Sudden behavioural anomalies after a deploy

**Response:**
- Isolate, identify the malicious dependency
- Roll back to a previous known-good version
- Audit what the malicious code could have accessed
- Rotate affected secrets

### D.4 DDoS / volumetric attack

**Description:** Bot traffic overwhelms the server, taking down the site.

**Impact:** Service unavailable. Legitimate users can't access.

**Likelihood:** Low at MVP — attackers target sites worth attacking. Rises with visibility.

**Existing mitigations:**
- Rate limits at application layer (`docs/04-api-spec.md §8`)
- Nginx-level rate limiting (can be added via `limit_req_zone`)

**Missing mitigations:**
- 🔧 Cloudflare in front of the VPS — free tier provides excellent DDoS protection. Strongly recommend. Easy to add.
- 🔧 Fail2ban extended beyond SSH to cover HTTP abuse
- 🔧 Application-level bot detection (Phase 2)

**Detection:**
- Traffic spike visible in Nginx access logs
- Server load high
- Site slow or unreachable

**Response:**
- Enable Cloudflare "Under Attack" mode if configured
- Identify attack pattern (specific endpoint? specific IP range? specific user agent?)
- Block at Nginx or firewall
- If sustained: move DNS behind Cloudflare properly

---

## Part E: Data privacy breaches

### E.1 Accidental exposure via application bug

Covered in D.2.

### E.2 Insider threat (employee / contractor with access)

**Description:** Someone with legitimate access to the system misuses that access — exports member data, shares with competitors, etc.

**Impact:** Privacy breach, reputation damage.

**Likelihood:** Low at founder-only stage; Medium when you start hiring.

**Existing mitigations (implicit at MVP since only founder has access):** none needed until you have a team.

**Missing mitigations (for when you hire):**
- 🔧 Written confidentiality agreement with every hire
- 🔧 Role-based access: not everyone needs admin
- 🔧 Audit log of admin actions
- 🔧 Revoke access immediately on departure (checklist)
- 🔧 MDM (mobile device management) on company-issued devices

**Detection:**
- Unusual admin actions
- Data exports outside normal patterns

**Response:** HR + lawyer + potentially law enforcement if criminal.

### E.3 Data handed over to law enforcement

**Description:** Police or government agency requests user data.

**Impact:** Legal obligation to comply with valid requests; reputation risk if handled badly.

**Likelihood:** Low but inevitable over time.

**Existing mitigations:**
- Privacy Policy should disclose this possibility (see `LEGAL.md §7`)

**Missing mitigations:**
- 🔧 Written policy: require a valid subpoena or warrant for any user data release; never release informally
- 🔧 Process: all law enforcement requests go through lawyer first
- 🔧 Annual transparency report (Phase 2 nice-to-have; signals trust)

**Response:**
- Do NOT release data informally, even to a badge
- Consult lawyer
- Respond per the valid legal process only

---

## Part F: Platform integrity threats

### F.1 Gaming the dispatch engine

**Description:** Tradie figures out the scoring algorithm and games it — e.g., accepts leads fast but declines later, leaves fake 5-star reviews, pauses during low-demand periods.

**Impact:** Unfair advantage, degraded member experience.

**Likelihood:** Medium — as the platform grows, tradies will reverse-engineer the scoring.

**Existing mitigations:**
- Scoring factors are multi-dimensional — hard to optimise for one without hurting another (`docs/05-dispatch-engine.md §5`)
- Acceptance-then-decline penalised via dispute / expiry penalties

**Missing mitigations:**
- 🔧 Scoring changes periodically rebalanced (document in dispatch config versioning)
- 🔧 Quality thresholds: a tradie with great dispatch metrics but member complaints gets deprioritised
- 🔧 Don't publish the scoring algorithm in detail (internal doc is internal)

**Detection:**
- Rating distribution anomalies (a tradie with only 5-star reviews from the same 2 accounts — suspicious)
- High acceptance rate but high cancel-after-accept rate

**Response:**
- Quiet adjustments to scoring
- Manual review of outlier tradies

### F.2 Monopolisation of a suburb

**Description:** A well-funded tradie (or a small ring of colluding tradies) pays for Premium in every category in every suburb, crowding out independents.

**Impact:** Reduced choice for members; real independents discouraged.

**Likelihood:** Low at MVP; Medium later.

**Existing mitigations:**
- Premium tier doesn't grant exclusivity at MVP
- Pricing creates natural ceiling on how many Premium slots one business buys

**Missing mitigations:**
- 🔧 Suburb exclusivity feature (Phase 2.E per `docs/10-build-phases.md`) — limits Premium to one per suburb per category, preventing monopolisation
- 🔧 Cap on number of Premium subscriptions per ABN
- 🔧 Quality floor: Premium status requires minimum rating + job count

---

## Part G: Regulatory & compliance threats

### G.1 ACCC investigation (misleading claims)

**Description:** You advertise something the platform can't deliver. ACCC finds out.

**Impact:** Fines, required corrective advertising, reputation damage.

**Likelihood:** Low with careful messaging; Medium if marketing gets exuberant.

**Existing mitigations:**
- `LEGAL.md §11` flags ACL compliance
- Conservative language in docs ("best-matched tradie" not "guaranteed tradie")

**Missing mitigations:**
- 🔧 Marketing review process: any claim needs evidence to back it up
- 🔧 Avoid "always", "guaranteed", "best" — all risky
- 🔧 Member savings claims substantiated by real data

### G.2 ACMA complaint (SMS)

**Description:** Enough users report Tradify SMS as spam; ACMA investigates consent practices.

**Impact:** Fines up to $2.2M/day; carrier-level blocking.

**Likelihood:** Low if consent is real; High if you start SMS-marketing without explicit consent.

**Existing mitigations:**
- Transactional SMS is consent-inferred by nature of the subscription (`LEGAL.md §8`)

**Missing mitigations:**
- 🔧 Explicit SMS consent checkbox at signup (not pre-ticked)
- 🔧 No marketing SMS to members without separate marketing opt-in
- 🔧 All SMS templates reviewed for Spam Act compliance

### G.3 OAIC notifiable data breach

**Description:** A breach occurs where personal data is likely to result in serious harm.

**Impact:** Mandatory notification to affected users AND OAIC (regulator); public disclosure; reputation damage.

**Likelihood:** Low with good security practices; inevitable with poor ones.

**Existing mitigations:**
- Threat model itself (this doc)
- Security practices in `PROVISIONING.md`

**Missing mitigations:**
- 🔧 Written breach response playbook (30-day statutory clock to notify starts when you become aware)
- 🔧 Incident response contact list (lawyer, IT, founders)
- 🔧 Draft breach notification template

---

## Part H: What to do when you discover a threat

New threats emerge. You'll find them by:
- Reading industry incidents (AFR, Business Insider, security blogs)
- Your own "huh, someone could..." moments
- User reports
- Post-incident learnings

**Process:**

1. Write it up in this document (new section)
2. Classify: Low / Medium / High likelihood; impact
3. Identify mitigations currently in place
4. Identify missing mitigations
5. If likelihood × impact is High or greater: create an immediate work item
6. If lower: add to the backlog, revisit next quarter

---

## Part I: Quarterly review

Every quarter, re-read this document and ask:

- Has our threat landscape changed? (New features = new attack surface)
- Has our likelihood for any threat increased? (More visibility = more attackers)
- Has any threat materialised? (If yes, update with lessons learned)
- Are any missing mitigations still missing? (Ship them or justify why not)

**Maintain this document like you maintain code.** Stale threat models are worse than none — they give false confidence.

---

## Part J: Incident log

Record every security incident, however small. One-line entries; details in linked document.

| Date | Incident | Severity | Response | Lessons |
|---|---|---|---|---|
| _YYYY-MM-DD_ | _Brief description_ | Low/Med/High | _What we did_ | _What to fix_ |

Never leave this table empty for long. "Nothing happened" usually means "nothing was detected."

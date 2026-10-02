# RUNBOOK-CONTINUITY.md — If the Founder Is Unavailable

**Status:** Reference. Update every 6 months.

**Purpose:** This is the document a trusted person (family member, co-founder, business partner, lawyer) uses if you — the founder — are incapacitated, missing, or otherwise unable to operate the business. It covers the minimum knowledge needed to **keep the business running**, **preserve customer relationships**, and **make informed decisions about the business's future** on your behalf.

---

## 0. Who has this document

This file should exist in at least three places:

1. In the git repo (the version you're reading now — agents and collaborators see it)
2. Printed and stored in a secure physical location (sealed envelope, home safe, lawyer's office)
3. In a family / trusted-person accessible location (password manager emergency access, secure digital vault)

**`DECISION REQUIRED: who is the trusted contact?`** Fill this in and keep it current.

**Primary contact (trusted person):** _[NAME, RELATIONSHIP, PHONE, EMAIL]_

**Secondary contact:** _[NAME, RELATIONSHIP, PHONE, EMAIL]_

**Lawyer:** _[NAME, FIRM, PHONE, EMAIL]_

**Accountant:** _[NAME, FIRM, PHONE, EMAIL]_

---

## 1. What this business is (one paragraph)

Tradify is a membership platform connecting homeowners/investors with vetted tradespeople in [LAUNCH AREA]. Members pay an annual fee for fast access to trusted tradies with no call-out fees and a discount. Tradies pay an annual subscription to receive pre-qualified jobs from members. The platform runs as [BUSINESS ENTITY NAME], ABN [ABN]. The business operates primarily from a single VPS and cloud services.

---

## 2. If the founder is unavailable for <72 hours

Nothing urgent needs to happen for 72 hours in the normal case. The platform runs itself. Support emails can wait; phone calls go to voicemail with a message. Users are inconvenienced but not harmed.

**What DOES need attention:**
- Check that no critical alert is unaddressed (see `OBSERVABILITY.md §4`)
- Respond to any active-job emergencies flagged via support phone
- Don't make substantive decisions in the founder's absence

---

## 3. If the founder is unavailable for 72 hours to 2 weeks

At this point, customers will start noticing. The business needs someone actively operating it at minimum capacity.

### 3.1 First priorities (day 1–3)

**Communicate:**
- Email to all active members + tradies: "Founder is temporarily unavailable. Support response times may be slower but the platform continues to operate. Urgent issues: [emergency contact]."
- Out-of-office auto-reply on support email
- Brief update on website footer or status page

**Verify systems are running:**
- UptimeRobot dashboard (you have login credentials in the password manager — §6)
- Sentry dashboard (same)
- Horizon dashboard at `https://tradify.au/horizon` — admin login required
- Stripe: any failed webhooks? (Stripe Dashboard)

**Don't yet:**
- Make refund decisions
- Approve or reject tradie applications
- Change pricing
- Respond to press or legal inquiries

### 3.2 Week 2 actions

If the absence extends past a week, consider:
- Pausing new member signups (change `/register/member` to a holding page)
- Letting current subscriptions auto-renew normally
- Forwarding legal or urgent business to the lawyer

---

## 4. If the founder is unavailable permanently or indefinitely

This section is for the worst case. The trusted contact and lawyer need to make decisions about the business.

### 4.1 Critical first steps (within 7 days)

**Notify key parties:**
- Lawyer (they advise on next steps)
- Accountant (they handle tax and financial continuity)
- Stripe (business continuity; may need new account signer)
- Hosting provider (GoDaddy)
- Employees or contractors (if any)

**Preserve access:**
- Change passwords on critical accounts to passwords you control
- Ensure the password manager can be accessed (the founder should have set up emergency access; if not, this is much harder)
- Keep the VPS running — monthly payment continues from the business account

**Don't yet:**
- Shut the platform down — users paid for annual memberships
- Make refunds — legal advice first
- Sell customer data — this is almost certainly prohibited by privacy policy

### 4.2 Decisions to make in the first 30 days

With the lawyer's input, decide the path forward. Options:

#### Option A: Continue operating
If you or someone close has the skills and willingness. Hire contractors as needed:
- Developer for code maintenance
- Support staff for customer service
- Accountant for finances (you probably already have one)

#### Option B: Wind down cleanly
Stop taking new customers; honour existing subscriptions through their term:
- Turn off signup flows
- Continue operating platform for existing subscribers
- Disable auto-renewal; let subscriptions end naturally
- At end of last subscription: shut down, export data per legal retention rules

#### Option C: Sell the business
Tradify is an asset. At a minimum, its user base, brand, and working software have value:
- Lawyer engages an M&A advisor for small businesses
- Expected timeline: 3–12 months
- Don't rush — a fire sale leaves money on the table and may fail to close

#### Option D: Emergency shutdown
Only if there's no one to operate and no buyer and no wind-down feasible. Refund all unused subscription time per ACL obligations. Notify all users 30 days in advance. Export data per privacy retention rules.

---

## 5. Essential information

### 5.1 Accessing the password manager

The password manager (1Password / Bitwarden) has **emergency access** set up:
- Primary contact can request access via the manager's emergency-access feature
- There's a waiting period (typically 48 hours) unless the founder approves faster
- Once granted, they have access to all production credentials

**If the founder set up emergency access:** the primary contact knows the procedure because you set it up together. If not: you're locked out of a lot.

**`DECISION REQUIRED: set up emergency access on password manager NOW if not done.`**

### 5.2 Accessing the bank account

Business bank account is at [BANK], account in the name of [ENTITY]. Signers: [FOUNDER] (and any partners).

If founder is incapacitated:
- Spouse or next-of-kin may have power of attorney — check if this was set up
- Otherwise, court application for access (via lawyer) — slow, but the only way

### 5.3 Accessing the Stripe account

Stripe is linked to the business bank account. Logging in requires:
- Email: [STRIPE_ACCOUNT_EMAIL]
- Password: in password manager
- 2FA: in password manager (backup codes)

To change the account signer: Stripe support, with legal documentation of authority.

### 5.4 Accessing the VPS

SSH into `ssh deploy@tradify.au` with the private key stored in password manager. The `deploy` user has limited sudo — see `PROVISIONING.md §1.4`. For root access: [CONSULT PROVISIONING.md and password manager for root password].

### 5.5 Accessing the domain

Domain `tradify.au` is registered at [REGISTRAR]. Login in password manager. Owner's contact on the whois should be the business entity, not the founder personally (verify; fix if wrong).

### 5.6 Accessing Apple Developer / Google Play

Phase 2+ items. If mobile apps are live:
- Apple Developer: [ACCOUNT_EMAIL] — password in password manager + 2FA backup codes
- Google Play Console: [ACCOUNT_EMAIL] — password in password manager + 2FA backup codes

**`DECISION REQUIRED: are these registered to the business entity or the founder personally?`** The business entity is strongly preferred for continuity. Personal registration means transfer on incapacity is much harder.

---

## 6. Critical contractors and advisors

Maintain this list. These are the people who can be called upon to help.

| Role | Name | Contact | When to call |
|---|---|---|---|
| Lawyer | | | Any legal question, contract, breach, dispute, business decision |
| Accountant | | | Tax, payroll, business structure |
| VPS host support | GoDaddy | — | Server can't be accessed; billing issues |
| Developer (on retainer or on-call) | | | Bugs; code changes; anything the agent (Claude Code) can't handle |
| Support staff | | | Day-to-day support load |
| M&A advisor (only needed for sale) | | | If pursuing sale |

Update whenever relationships change.

---

## 7. Customer obligations in a transition

Users have paid subscriptions. Ethically and legally, they are owed the services they paid for or a refund.

**Member subscription default:** platform access for 12 months from payment date.

**Tradie subscription default:** same.

**If platform continues:** no refund obligation beyond normal cancellation policy.

**If platform winds down:** pro-rata refund of unused subscription time (legally likely required under ACL for substantial service changes).

**If platform operations degrade:** notify users, offer refund or extension.

The lawyer advises on specific obligations based on the transition path chosen.

---

## 8. Data preservation

Under Privacy Act obligations, user data must be:
- Protected while retained
- Deleted when no longer needed
- Transferred or preserved per the Act's provisions during business transition

**Do NOT:**
- Share customer data with any third party without legal authorisation
- Sell customer data separately from the business as a whole
- Delete data prematurely (there may be tax, legal, or regulatory retention obligations)

**Lawyer advises on specific data handling during transition.**

---

## 9. Documents to hand to the lawyer on first meeting

If the lawyer wasn't previously involved with the business, this accelerates their understanding:

- This document (RUNBOOK-CONTINUITY.md)
- Business entity registration papers
- `LEGAL.md` — shows what's been done and what's outstanding
- Final/current T&Cs and Privacy Policy
- Accountant contact and most recent BAS/financials
- Stripe account summary (last 12 months revenue, current MRR)
- User counts (active members, active tradies)
- Current liabilities (hosting, contractors, service providers)

---

## 10. A brief note to whoever reads this

If you're reading this and it's for real — not just a doc review — I'm sorry. Running into this document under duress is hard, and the business will feel like the last thing you should be thinking about.

The platform is built to keep running without intervention for weeks. Take the time to think carefully before making big decisions. The lawyer is your first call. The accountant is the second.

Customers don't need immediate answers. A brief, honest email — "Tradify is going through a transition; we'll update you with more information within 30 days" — buys the space to think.

You don't have to know anything about code or operations to handle this. You need to know the right people to call. This document tells you who.

---

## 11. Maintenance

Every 6 months, the founder reviews this document and:

- Updates contact information for lawyer, accountant, trusted contacts
- Verifies password manager emergency access is still configured and working
- Updates the list of critical contractors
- Reviews whether any account ownership has drifted (e.g., "is Apple Developer still under the business entity?")
- Runs a tabletop exercise: "if I disappeared today, could my trusted contact get into the password manager?" Test it.

**Last reviewed:** _YYYY-MM-DD_ by _[FOUNDER NAME]_.

---

This document is not pleasant to write or read. It is, however, one of the most important things a sole founder can produce. Future you, or the people who love you, will thank present you for doing it.

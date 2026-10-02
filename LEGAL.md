# LEGAL.md — Legal & Compliance Checklist

**Status:** Founder-completion required. This is a checklist and scaffolding, NOT legal advice.

**Hard disclaimer:** I am Claude, an AI assistant. Nothing in this document is legal advice. Every section flagged with 🧑‍⚖️ must be reviewed by an Australian lawyer before you publish terms, take payments, or send marketing messages. The cost of getting this wrong is higher than the cost of the legal bill.

**Who reviews this:** you, and a lawyer. Not Claude Code. The agent should never be asked to draft legally-binding terms.

---

## 0. What's in this file

This document lists the legal and compliance items you must resolve before launch. It is organised by risk level. Items in **Red** must be resolved before taking your first customer. Items in **Amber** must be resolved before scaling past a small pilot. Items in **Green** can be iterated on as you grow.

Each item has:
- **What it is** — plain-English description
- **Why it matters** — the consequence of ignoring it
- **What you need** — the deliverable
- **Status** — to be filled in as you progress

---

## 🔴 RED — Must resolve before first real customer

### 1. Business entity and registration

**What:** The business must exist as a legal entity that can sign contracts, hold a Stripe account, and be sued.

**Why:** Stripe won't onboard a business that's not registered. You personally are exposed to liability if the business isn't a separate entity. Tradies paying annual subscriptions need someone to pay.

**What you need:**
- [ ] Business structure decided (sole trader / partnership / company / trust — 🧑‍⚖️ talk to an accountant about this before you file anything)
- [ ] ABN (Australian Business Number) registered — free via business.gov.au
- [ ] GST registration (mandatory above $75k turnover; register before you hit it)
- [ ] Business name registered with ASIC if trading under a name different from your legal name
- [ ] Business bank account in the entity's name (Stripe will want this)
- [ ] Accountant retained (not optional once real money flows)

**Status:** Not started.

---

### 2. Stripe account setup and compliance

**What:** Stripe onboarding requires business identity verification, bank details, and acceptance of Stripe's terms.

**Why:** Without this, no payments can be processed. Some applications take days; if your documents are questioned, weeks.

**What you need:**
- [ ] Business entity registered first (§1)
- [ ] Stripe account created with entity details
- [ ] Bank account verified (micro-deposits)
- [ ] Identity documents uploaded (director ID, etc.)
- [ ] Products + prices created in Stripe Dashboard matching the plans in `docs/01-product-spec.md §6` (prices from your pricing decision)
- [ ] Tax settings — 🧑‍⚖️ decide: tax-inclusive prices vs Stripe Tax. Recommended: tax-inclusive AUD pricing at MVP (simpler); Stripe Tax when you're ready
- [ ] Customer Portal branding configured (logo, colours, business info)
- [ ] Refund policy documented (see §6)

**Status:** Not started.

---

### 3. Terms of Service — Member

**What:** The contract between Tradify and each member. Governs subscription, access, refunds, limitation of liability, platform obligations.

**Why:** Without clear terms, disputes become un-winnable. A member who feels wronged after a bad tradie experience may try to hold the platform liable.

**What you need (🧑‍⚖️ lawyer must draft/review):**
- [ ] Definition of services provided (membership access + dispatch matchmaking)
- [ ] What the platform does NOT provide (the tradespeople are not employees or agents; the platform does not guarantee outcomes)
- [ ] Subscription terms (annual billing, auto-renewal, cancellation, refund policy)
- [ ] Member obligations (truthful information, payment, reasonable use)
- [ ] What happens if a tradie doesn't honour benefits (dispute process; platform's contractual remedy — currently "we try to mediate, may issue platform credit")
- [ ] Limitation of liability — crucial
- [ ] Governing law (Western Australia law; Perth jurisdiction)
- [ ] Privacy — cross-reference to Privacy Policy
- [ ] Right to terminate accounts (for misuse, fraud, abusive behaviour)
- [ ] Changes to terms (how members are notified; what's their option)

**Key question for the lawyer:** What is the platform's exposure if a tradie damages a member's property? Answer shapes insurance requirements (§4).

**Status:** Not started.

---

### 4. Terms of Service — Tradie

**What:** The contract between Tradify and each tradie business. Significantly different from the member contract — includes the **benefit-honouring obligations** which are the core product promise.

**Why:** Tradies must be contractually bound to (a) waive call-out fees for members, (b) apply the member discount, (c) deliver work reasonably. Without this in a signed contract, the benefits confirmation system is just aspiration.

**What you need (🧑‍⚖️ lawyer must draft/review):**
- [ ] Subscription terms (annual, auto-renewal, cancellation, refund)
- [ ] **Benefit obligations** (explicit — no call-out fee, specified discount, work performed professionally)
- [ ] Consequences of failing to honour benefits (dispute process, suspension, termination)
- [ ] Representations (tradie warrants they hold valid licence and insurance; warranty persists for subscription duration)
- [ ] Independence clause (tradies are independent contractors; not employees or agents of the platform)
- [ ] Non-circumvention clause — 🧑‍⚖️ advice needed on whether you can prohibit tradies from moving members off-platform (may be unenforceable depending on structure)
- [ ] Dispute resolution process (binding on tradie)
- [ ] Right to suspend lead flow pending investigation
- [ ] Grounds for termination
- [ ] Data and lead ownership (the member's contact details become the tradie's to use only for the job offered)
- [ ] Limitation of liability (platform is not liable for tradie's failures; tradie indemnifies platform)
- [ ] Insurance requirements (see §5)
- [ ] IP of platform (tradie doesn't get rights to the logo, branding, member data beyond the job scope)

**Key question for the lawyer:** Are the benefit obligations enforceable? What are the contractual remedies if a tradie consistently breaches (repeated disputes)?

**Status:** Not started.

---

### 5. Insurance requirements

**What:** Who holds what insurance. Three categories: tradie-side, platform-side, and verification.

**Why:** Australia-wide, tradies in most categories are legally required to hold public liability insurance. If a tradie damages a member's property while doing work sourced via Tradify, the chain of liability is:
1. The tradie's insurance (primary)
2. The tradie personally (if uninsured or excluded)
3. Tradify? — this is the question you must resolve with the lawyer

**What you need:**

**Tradie side (verified at application):**
- [ ] Public liability insurance certificate (minimum $5M; $10M+ is common)
- [ ] Licence certificate (category + state-specific)
- [ ] Both uploaded during application + expiry dates captured in the DB (`tradie_companies.licence_expires_on`, `insurance_expires_on`)
- [ ] Admin must verify certificates are current before approval
- [ ] **Scheduled monthly check** for expiring certificates; auto-suspend if expired and not renewed within 7 days

**Platform side (held by Tradify):**
- [ ] 🧑‍⚖️ Professional indemnity insurance (if Tradify is held to provide "advice" or "service" that could be challenged)
- [ ] 🧑‍⚖️ Technology Errors & Omissions cover (if platform bugs cause loss, e.g., dispatch misrouted a lead and member lost a day of work)
- [ ] 🧑‍⚖️ Cyber liability (if a data breach exposes member/tradie data)
- [ ] Commercial general liability for your business operations generally

**The question only a lawyer can answer:**
> "If a tradie booked via Tradify breaks a member's $8,000 window while doing a $200 job, and the tradie's insurance denies the claim, is Tradify liable?"

Get a written answer before launch. The answer will inform both your insurance costs and your T&C language.

**Status:** Not started.

---

### 6. Refund and cancellation policy

**What:** A clear, published policy on when subscriptions can be cancelled, refunded, or pro-rated.

**Why:** Without a policy, every cancellation becomes a negotiation. Also: Australian Consumer Law (ACL) gives consumers statutory rights that override your policy in certain cases — you cannot contract out of them.

**What you need (🧑‍⚖️ lawyer-reviewed):**
- [ ] Member cancellation policy:
  - Within 14 days of signup, no jobs submitted → full refund (cooling-off good practice, not strictly required)
  - After 14 days or any job submitted → no refund; subscription continues to end of paid period, auto-renew disables
  - Exception for ACL (e.g., "not as described") — statutory; you cannot remove
- [ ] Tradie cancellation policy:
  - Within 14 days → full refund if no leads accepted
  - After leads accepted or 14 days elapsed → no refund; subscription runs to end of paid term
- [ ] Platform-initiated suspension or termination → pro-rata refund mandatory (this avoids ACL issues)
- [ ] Refunds via original payment method only
- [ ] No cash equivalents; no transfer of subscription between accounts
- [ ] Published at `/refunds` on the website
- [ ] Referenced from both T&Cs

**Status:** Not started.

---

### 7. Privacy Policy

**What:** Legally required document stating what data you collect, why, how it's stored, and users' rights.

**Why:** Australia's Privacy Act 1988 + Australian Privacy Principles (APPs) apply to any business with turnover above $3M. If you're below that threshold you may be technically exempt from APPs, but **(a)** you'll cross the threshold eventually, **(b)** members expect one, **(c)** Stripe/Twilio/Google require linked privacy policies from their customers, **(d)** the ACCC enforces misleading privacy practices under the ACL regardless of turnover.

Write one from day one.

**What you need (🧑‍⚖️ lawyer-reviewed):**
- [ ] What data you collect:
  - Account info (name, email, phone)
  - Payment info (routed through Stripe — you never hold card numbers)
  - Property addresses, job details, photos
  - Usage data (IP, device, app version)
  - Tradie business info, licence, insurance documents
  - Communication records (SMS, email, in-app)
- [ ] Why you collect each category (lawful basis)
- [ ] Who you share data with (Stripe, Twilio, Resend, Google Places, Sentry, S3/VPS, potentially government on valid request)
- [ ] How long you retain data (active accounts: indefinitely; deleted accounts: anonymised after 90 days; logs: 30 days; backups: 30 days)
- [ ] User rights (access, correction, deletion, complaint)
- [ ] How users exercise rights (email privacy@tradify.au)
- [ ] International data transfer disclosure (Resend and Sentry are US-based; S3/R2 data stored in AU)
- [ ] Data breach notification commitment (Notifiable Data Breaches scheme applies above the $3M threshold but is good practice regardless)
- [ ] Cookie and tracking disclosure (what you set, and why)
- [ ] Contact details of the privacy officer
- [ ] Date of last update + changelog

**Published:** `/privacy` on the website. Linked from every page footer and from signup flows.

**Status:** Not started.

---

### 8. SMS consent and the Spam Act 2003

**What:** Australian law requires explicit consent before sending commercial electronic messages, including SMS.

**Why:** The ACMA (regulator) imposes fines up to $2.2M per day for repeat breaches. More practically: carriers will block your sender ID if complaints spike.

**Three requirements under the Spam Act:**
1. **Consent** — must be express or inferred (explicit opt-in is safest)
2. **Identification** — the sender must be clearly identified
3. **Unsubscribe** — a functional unsubscribe option on every commercial message

**How this applies to Tradify:**

- **Transactional messages** (lead offers, job status updates, completion prompts) — generally covered under "inferred consent" via the terms the user agreed to. Still, best practice is explicit consent.
- **Marketing messages** (renewal reminders, promotions) — require explicit opt-in and unsubscribe in every message.

**What you need:**
- [ ] Sign-up forms (web + mobile) include an explicit checkbox: "I consent to receive SMS and email about my account and jobs from Tradify"
- [ ] Checkbox is **not** pre-ticked (ACCC guidance)
- [ ] Transactional SMS templates (lead offers, job updates) don't need an unsubscribe link (they're transactional, not commercial)
- [ ] Any future marketing SMS needs an unsubscribe path: "Reply STOP to unsubscribe"
- [ ] SMS sender ID registered with Twilio for Australia (see `docs/07-integrations.md §2.3`)
- [ ] T&Cs explicitly disclose that SMS is the primary channel for lead offers (tradies cannot opt out of this and remain on the platform)
- [ ] Consent timestamp captured in the DB at signup

**Status:** Not started.

---

### 9. Website disclosures

**What:** Standard disclosures on the website required by law or convention.

**Why:** Various regulations require these; also trust signals for users.

**What you need:**
- [ ] Business details in footer: registered business name, ABN, registered office address (can be PO box or registered office — doesn't need to be residential)
- [ ] Contact information: email, support hours
- [ ] Links in footer: Terms, Privacy, Refunds
- [ ] Cookie banner if you use analytics cookies (MVP has Sentry + possibly Google Places — check if they set cookies; if yes, banner needed)
- [ ] "© 2026 [Business Name]" copyright
- [ ] ABN displayed on invoices, receipts, contracts

**Status:** Not started.

---

## 🟡 AMBER — Resolve before scaling past a small pilot

### 10. Dispute handling policy

**What:** Written policy on how disputes between members and tradies are handled.

**Why:** Currently `docs/01-product-spec.md §12` says "admin handles it" without specifying outcomes. When disputes become more than a trickle, inconsistent handling creates legal and brand risk.

**What you need:**
- [ ] Written policy covering:
  - Timeframes (member has 7 days post-completion to raise; admin responds within X hours)
  - Evidence required (photos, communication records, invoice)
  - Outcomes (tradie warned / suspended / removed; member credited / refunded; no action)
  - Appeals process
- [ ] Tradie suspension thresholds codified (3 disputes in 30 days → automatic review; 5 upheld disputes in 12 months → termination)
- [ ] Published (summary) on the website; full detail internal to admin
- [ ] 🧑‍⚖️ Lawyer-reviewed for fairness and enforceability

**Status:** Not started.

---

### 11. Australian Consumer Law (ACL) compliance

**What:** ACL is the main consumer protection statute. It applies to your member subscriptions (consumer-facing) but likely not your tradie subscriptions (B2B).

**Why:** Breaches are enforced by the ACCC and by individual consumers via VCAT (or WA equivalent). The consumer guarantees (acceptable quality, fit for purpose, etc.) apply by law and **cannot be contracted out of**.

**What you need (🧑‍⚖️ lawyer-reviewed):**
- [ ] T&Cs do not attempt to limit consumer guarantees in a way that breaches the ACL (common trap)
- [ ] Advertising claims on the website are accurate and substantiable ("save up to 30%!" requires evidence)
- [ ] No misleading representations about tradie quality or platform guarantees
- [ ] Compliant refund policy (see §6)
- [ ] Unfair contract terms — certain clauses in consumer and small-business contracts may be void. Lawyer to review.

**Status:** Not started.

---

### 12. Tax obligations

**What:** GST, PAYG (if you hire), income tax, payroll tax at state level.

**Why:** Failing to remit GST correctly is a fast way to get a visit from the ATO.

**What you need:**
- [ ] Accountant retained (again — this is not optional)
- [ ] GST registered when turnover crosses $75k
- [ ] Quarterly BAS preparation routine
- [ ] Invoicing that meets Tax Invoice requirements (ABN, description, GST amount, date) for any B2B customer (tradies receive Tax Invoices from Tradify for their subscriptions)
- [ ] Tradie invoices to members are the tradie's responsibility, not yours — but your T&Cs should make this clear
- [ ] Stripe Tax evaluated in Phase 2 if manual GST handling becomes burdensome

**Status:** Not started.

---

### 13. Data retention and deletion policy

**What:** How long you keep data, and how you honour deletion requests.

**Why:** Privacy Act requires you to delete data no longer needed. Members will ask for deletion. You need a process.

**What you need:**
- [ ] Retention periods documented:
  - Active user account: retained for subscription duration
  - Cancelled account: anonymised 90 days after cancellation
  - Jobs: retained 7 years (tax records)
  - Logs: 30 days
  - Backups: 30 days
  - Outbound messages: 1 year
- [ ] Deletion request process:
  - Received at privacy@tradify.au
  - Verified (identity)
  - Performed within 30 days
  - Confirmed to user in writing
  - Anonymisation preferred over hard delete (preserves historical job data for platform integrity while removing PII)
- [ ] Hard-delete code path in admin (implemented Phase 2; for MVP, deletions are manual via DB with confirmation)

**Status:** Not started.

---

### 14. KYC / AML considerations

**What:** Know Your Customer / Anti-Money Laundering — applies to financial services primarily. Unlikely to apply to Tradify directly but worth a lawyer check.

**Why:** If the platform ever touches payments between member and tradie (Phase 3 possibility), AUSTRAC obligations kick in. Better to know now what the threshold looks like.

**What you need:**
- [ ] 🧑‍⚖️ Lawyer confirms that Tradify's subscription-only model does not trigger AUSTRAC registration
- [ ] If Phase 3 introduces payment facilitation, revisit
- [ ] Tradie verification (licence + insurance + ABN) is good KYC practice regardless of whether strictly required

**Status:** Not started.

---

## 🟢 GREEN — Iterate as you grow

### 15. Trademarks

**What:** Trademark registration for the business name and logo.

**Why:** Protects the brand. Cheap-ish (~$250 for 10 years per class via IP Australia). Not required for launch.

**What you need:**
- [ ] Business name searched on IP Australia register for conflicts — do this before printing business cards
- [ ] Trademark registered (classes 35 for advertising services, 42 for software services likely relevant)

**Status:** Not started.

---

### 16. Terms updates and versioning

**What:** Process for updating T&Cs and notifying users.

**Why:** You will update terms. When you do, users need to be notified (emails to current users; in-app banner for a period; version history kept).

**What you need:**
- [ ] T&C version number captured in the DB at each user's signup (`users.terms_version_accepted`)
- [ ] On update, email all users 14 days before effective date
- [ ] In-app banner directing users to review
- [ ] Log of all terms versions kept publicly at `/terms/archive`
- [ ] Users who don't re-accept after effective date are blocked from new actions (not retroactive; they can still see their account)

**Status:** Not started.

---

### 17. International expansion considerations

**What:** If you ever expand beyond Australia.

**Why:** Out of scope until it's in scope. Worth noting that GDPR (EU) and CCPA (California) apply to any platform accessible in those jurisdictions, though enforcement against small AU-focused businesses is rare.

**What you need:**
- [ ] Not now. Revisit when expanding.

**Status:** Not started.

---

### 18. Accessibility compliance

**What:** Accessibility standards (WCAG AA) for web and mobile.

**Why:** Disability Discrimination Act 1992 applies. There's been increasing Australian case law on digital accessibility. Good practice from day one.

**What you need:**
- [ ] `docs/06-frontend-spec.md §9` and `docs/11-mobile-apps-spec.md §12` both already require WCAG AA
- [ ] Accessibility statement on website
- [ ] Annual accessibility review as you grow

**Status:** Spec-level compliance required by docs; no formal statement drafted.

---

## Getting it done

**Recommended sequence:**

1. **Week 1–2:** Register business entity, ABN, business name. Open bank account.
2. **Week 2:** Retain accountant (structure advice) and lawyer (T&Cs, insurance, privacy).
3. **Week 3–4:** Lawyer drafts Member T&Cs, Tradie T&Cs, Privacy Policy, Refund Policy. Expect $3,000–$8,000 AUD for a competent startup lawyer to produce all four.
4. **Week 4:** Stripe account opens, linked to bank account, tax settings configured.
5. **Week 4–5:** Insurance quotes obtained (public liability for platform, professional indemnity, cyber).
6. **Week 5:** Final review of all documents. Published to website. Terms acceptance wired into signup flow.

**Target budget for legal + admin (MVP launch, Perth/WA):**

| Item | Cost (AUD, indicative) |
|---|---|
| Accountant setup + first quarter | $800–$1,500 |
| Lawyer: T&Cs × 2 + Privacy + Refund | $3,000–$8,000 |
| Business registration (ABN + name) | $40–$100 |
| Trademark (optional at launch) | $250–$500 per class |
| Insurance (public liability + PI + cyber), year 1 | $1,500–$4,000 |
| **Total** | **~$5,500–$14,000** |

This is the single biggest pre-launch cost outside your own time. Budget for it. Don't try to scrimp on the lawyer — cheap T&Cs are more expensive than good ones in the long run.

---

## What to do if you can't afford a lawyer at launch

**Bad but common answer:** Use a template from a service like LawPath or LegalVision ($500–$1500 for a reasonable starting point). It's not as good as a bespoke drafting, but it's dramatically better than nothing.

**Better answer:** Launch to a tiny pilot (10 members, 5 tradies — your friends) on a handshake while you save for the lawyer. Formal launch only after T&Cs are in place.

**Do not:** Copy someone else's T&Cs from another website. It's legally risky, often doesn't fit your business, and is a copyright violation.

---

## Questions to bring to your lawyer (starter list)

Go into the first meeting with these questions. A good lawyer will identify more.

1. Best business structure for a platform like this?
2. What's our liability exposure if a tradie damages a member's property?
3. Can the benefit obligations (no call-out fee, discount) be made enforceable against tradies?
4. What insurance do we need, and at what coverage levels?
5. What's the risk if we collect tradie licence/insurance certificates but don't verify them against state registries?
6. How do we structure the T&C changes process?
7. What's the minimum for Privacy Act compliance at our size? APP-compliant even below the threshold?
8. Any trap clauses we should avoid (unfair contract terms, restraint of trade, etc.)?
9. ACL implications for us as a consumer-facing platform?
10. Dispute resolution clause — what's enforceable for small dollar amounts?

---

## This document's maintenance

This file is **not** canonical documentation for Claude Code to build from. It's a founder checklist. Keep it in the repo for visibility; update status columns as items are completed.

When an item is done:
- Check the checkbox
- Add the date
- Link to the final artifact (filed document, PDF in shared drive, etc.)

When an item becomes not-applicable:
- Strike it through
- Note why

Every quarter: re-read this file. Laws change; your business changes. Items that were Green become Amber become Red.

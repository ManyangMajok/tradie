# SUPPORT-OPS.md — Customer Support Operations

**Status:** Founder-completion required. This is a playbook scaffolding.

**At MVP scale, support IS the founder.** This document tells you how to run that function efficiently without dropping the ball.

---

## 0. Principles

1. **Reply fast, even if briefly.** A three-line "I'm on it, will have an answer within 24 hours" reply is better than silence for three days followed by a perfect reply.
2. **Answer the person, not just the question.** Tradies and members are often frustrated when they reach out. Acknowledge the frustration before solving.
3. **Document recurring issues.** The third time you answer the same question, it belongs in the FAQ or as a product fix.
4. **Escalate honestly.** If you don't know the answer, say so and commit to finding out.
5. **Tradies and members have different temperatures.** A tradie with a billing question is matter-of-fact; a member whose tradie no-showed is upset. Match the tone.

---

## 1. Channels

MVP has two inbound support channels:

### 1.1 Email
- `support@tradify.au` — the address
- **Where it goes:** 🧑‍💼 TBD. Pick one:
  - Google Workspace inbox (simplest; ~$10 AUD/month per user)
  - Forwarding alias to your personal Gmail (free; reduces professional appearance)
  - A help desk tool (Help Scout free tier, Freshdesk free tier) — overkill at launch, useful at Phase 2
- **SLA:** see §3

### 1.2 Phone
- Members on Pro / Investor plans get "phone support" per `docs/01-product-spec.md §6.1`
- At MVP this means your mobile number, answered by you
- **`DECISION REQUIRED: phone support number and hours`** — default recommendation: 9am–5pm AWST Mon–Fri, answered by founder; emergency line for active jobs only outside hours
- Consider a separate business mobile (second SIM or eSIM) so you can turn it off

### 1.3 In-app messaging
- **Out of scope at MVP** (Phase 2.C per `docs/10-build-phases.md`)
- Mobile apps have a "Support" screen linking to email
- Web has a "Contact us" link in footer

### 1.4 What's explicitly NOT supported at MVP
- Live chat on the website (maintenance burden too high for solo founder)
- Social media DMs as support (Facebook/Instagram comments can be acknowledged, but not treated as a support channel — redirect to email)
- WhatsApp or SMS for support (tempting for AU audience, but unmanageable without tooling)

---

## 2. Who does support?

**Launch (months 1–3):** founder, full stop.

**Growth (months 4–6):** founder + part-time assistant (10 hrs/week) to handle tier-1 tickets.

**Scale (months 7+):** dedicated part-time support person, founder handles escalations.

**`DECISION REQUIRED: hiring trigger`** — what's the threshold that means you need help? Suggested: when support eats >15 hrs/week of founder time for two consecutive weeks.

---

## 3. Service levels (SLA)

**Response SLA** = time until the user gets a human reply (even "I'm on it").

**Resolution SLA** = time until the issue is actually resolved.

| Channel | Situation | Response | Resolution |
|---|---|---|---|
| Email | Normal enquiry | 4 business hours | 24 business hours |
| Email | Urgent (active job going wrong) | 1 hour during business hours | 4 hours |
| Email | Billing complaint or refund request | 8 business hours | 48 business hours |
| Phone | Business hours | Pickup immediately or voicemail response within 1h | Same call or within 4h |
| Phone | After hours (emergency only) | Voicemail; callback next business day | Next business day |

**Business hours:** Mon–Fri 9am–5pm AWST. **`DECISION REQUIRED: extend to Saturday?`** — probably yes for a tradie platform; Saturday is a working day for many trades. Default recommendation: Mon–Sat 9am–5pm.

**Auto-acknowledgement:** every inbound email triggers an auto-reply within 1 minute:
> Thanks — we've got your message. We aim to reply within 4 business hours (Mon–Fri 9am–5pm AWST). If your job is in progress right now, please call [PHONE_NUMBER] for urgent help.

Set up in Gmail / Google Workspace with a filter on `to: support@tradify.au`.

---

## 4. Ticket categories

Roughly map inbound support to these buckets. Build intuition for what's common so you can streamline the top 5.

### 4.1 Billing
- Subscription questions
- Refund requests
- Payment method updates
- Invoice requests
- "Charged wrong amount"

**Most go to Stripe Customer Portal.** You rarely need to manually process — redirect members there.

### 4.2 Account
- Can't log in
- Change email / phone
- Delete account
- Forgot password (handled automatically via web reset flow)

### 4.3 Active job issues
- Tradie hasn't shown up
- Tradie arrived but can't do the job
- Member wants to cancel
- Member can't reach the tradie
- **Highest urgency** — always pick up or respond within 1 hour

### 4.4 Dispute / benefit not honoured
- Member says tradie charged a call-out fee
- Member says tradie didn't apply the discount
- Member says work wasn't completed
- Tradie says member lied / refused to pay
- See `docs/01-product-spec.md §12` for the formal dispute process

### 4.5 Onboarding
- Tradie application questions
- Member signup help
- "How does this work?"

### 4.6 Technical issues
- Mobile app not working
- Can't receive SMS
- Photos won't upload
- Website error

### 4.7 Feedback and suggestions
- Feature requests
- Complaints
- Compliments (rare but worth capturing for testimonials)

### 4.8 Abuse / spam
- Fraudulent applications
- Harassment between member and tradie
- Platform misuse

---

## 5. Canned responses

Template responses for the most common situations. Customise per ticket — don't just paste. These are Australian-English; tone is direct and warm.

### 5.1 Billing: cancel subscription

> Hi [NAME],
>
> No worries — you can cancel your membership anytime. You won't be charged for the next year, and your current membership stays active until [END_DATE] so you can still use it for any jobs that come up.
>
> To cancel, log in and go to Membership → Manage subscription. It'll take you to Stripe's portal where you can switch off auto-renew.
>
> If you'd rather I do it for you, just reply confirming and I'll take care of it.
>
> — [YOUR NAME]
> Tradify

### 5.2 Billing: refund request

> Hi [NAME],
>
> Thanks for getting in touch. I'm sorry Tradify didn't work out for you.
>
> Per our refund policy [LINK], refunds are available within [PERIOD] if [CONDITIONS]. Based on your account, you [ARE / ARE NOT] eligible.
>
> [IF ELIGIBLE]: I'll process the refund to your original payment method within 5 business days.
>
> [IF NOT]: I can't offer a full refund, but I can: [AUTO-RENEW OFF / ACCOUNT CREDIT / ETC]. Is any of that useful?
>
> Happy to jump on a call if it's easier — just send a time that works.
>
> — [YOUR NAME]

### 5.3 Active job: tradie hasn't shown up

> Hi [NAME],
>
> Sorry to hear that. Let me sort this right now.
>
> I can see your job [JOB_ID] is assigned to [TRADIE_NAME]. I'm contacting them now and will update you within 30 minutes.
>
> If they can't make it, I'll assign a backup tradie immediately.
>
> — [YOUR NAME]

**Then actually do the thing.** Call the tradie on their registered number. If no answer, use the admin console to cancel the assignment and manually reassign (see `docs/04-api-spec.md §4.4 POST /admin/jobs/{publicId}/assign`).

### 5.4 Dispute: call-out fee charged

> Hi [NAME],
>
> Thanks for flagging this — we take benefit honouring seriously. That's literally why we exist.
>
> I've paused new leads to [TRADIE_NAME] pending a review. I'll contact them for their side of it and come back to you within 48 hours with a resolution.
>
> In the meantime, can you reply with:
> 1. A copy of the invoice or receipt you received
> 2. Any message where the tradie mentioned the call-out fee
>
> If we find the tradie was at fault, you'll receive a credit equivalent to the fee charged, and the tradie will be warned or removed. We'll make it right.
>
> — [YOUR NAME]

### 5.5 Tradie: application rejected

> Hi [NAME],
>
> Thanks for applying to Tradify. Unfortunately, I'm not able to approve your application at this time.
>
> [SPECIFIC REASON]:
> - Your licence verification came back unclear — the state registry shows [STATUS]. Please update your licence or clarify and reapply.
> - Your insurance certificate appears to be expired on [DATE]. Please provide a current certificate and we'll review again.
> - [OTHER]
>
> Happy to look at a reapplication once resolved. If you think this is a mistake, just reply.
>
> — [YOUR NAME]

### 5.6 Member: how does this work?

> Hi [NAME],
>
> Great question — here's the short version:
>
> You pay an annual membership. When you need a tradie, you submit a request in under a minute (web or app). My system offers the job to the best-matched tradie in your area — premium members go first. They've got a window to accept; once they do, you get their details and they get yours. No call-out fee, 10% off the job.
>
> If they don't accept in time, it automatically moves to the next-best tradie. You don't call 5 people and wait.
>
> Full details at [LINK]. Want me to walk you through it on a call?
>
> — [YOUR NAME]

### 5.7 Technical issue: can't receive SMS

> Hi [NAME],
>
> Thanks for reporting — SMS issues are frustrating. A few things to check:
>
> 1. The phone number on your account is [PHONE] — is that correct?
> 2. Has your phone blocked the sender "Tradify"? Check your message filters / spam folder
> 3. Are other SMS coming through normally?
>
> If all those look fine, I'll check our logs to see if the SMS was sent. Just reply with the time you expected it.
>
> — [YOUR NAME]

### 5.8 Feature request

> Hi [NAME],
>
> Thanks for the suggestion — genuinely useful input. I'll add it to our list and think about where it fits.
>
> I can't promise when or whether it'll happen, but I read every suggestion and track what people are asking for.
>
> — [YOUR NAME]

**Then actually log it.** Create a Google Sheet or Notion page of feature requests. Count how often each is raised. The fifth time something shows up, it's a real signal.

---

## 6. Escalation and authority levels

At MVP, the founder is tier 1 and tier 2. That's fine. The decision authority for actions should still be documented so if someone else handles a ticket (an assistant, a partner), they know what they can do.

### Tier 1: routine (anyone with support access can do)
- Respond to enquiries
- Reset passwords (member requests via verified email)
- Walk members through the signup / submission flow
- Cancel auto-renew on request
- Update phone number or email on account (with verification)
- Add notes to admin tickets

### Tier 2: judgement-required (founder or senior support)
- Issue platform credits up to $100
- Process refunds up to $200
- Suspend a tradie pending review
- Override dispatch to manually assign a job
- Waive documentation requirements (e.g., member can't provide invoice)

### Tier 3: founder-only
- Refunds over $200
- Terminating a tradie
- Issuing platform credits over $100
- Waiving T&C obligations
- Responding to legal or regulatory inquiries
- Any media / press contact

### Never delegable (founder + lawyer)
- Threats of legal action (from or to the platform)
- Data breach or security incident response
- Media coverage (positive or negative)
- Responding to regulator contact (ACCC, ACMA, OAIC)

---

## 7. Abuse and harassment

You will, eventually, get an abusive email or call. Have a policy before you do.

**Policy:**
- Every user is entitled to respectful treatment. So is every staff member.
- If a user is abusive (swearing at the person, insulting, threatening), the interaction is paused.
- Response template:
  > "I'd like to help, but we need to keep this respectful. I'm stepping away from the conversation for now. Reply when you're ready to continue and we'll pick it up."
- After two abusive interactions in 30 days, the account is suspended pending review.
- After threats of violence, the account is terminated immediately and police are contacted if credible.

**Document every instance.** Note date, account ID, what was said, action taken. Keeps a record for potential disputes or legal matters.

---

## 8. Tools (minimum viable)

**Must have at launch:**
- Google Workspace (or equivalent): `support@tradify.au` inbox + calendar for booking calls
- Auto-responder set up
- Canned responses saved (Gmail templates or similar)
- Spreadsheet (Google Sheets) for ticket log

**Nice to have in first 3 months:**
- Phone system with voicemail and SMS forwarding (you can just use your mobile, but a Twilio-hosted business number via their "Flex" or similar gives flexibility)
- Screen-recording tool for visual explanations (Loom free tier)
- FAQ page on the website (even a simple one)

**Don't install yet:**
- A help desk (Zendesk, Help Scout) until ticket volume makes Gmail unmanageable — probably 50+ tickets/week
- Live chat widgets
- A chatbot

---

## 9. FAQ / Help centre

A basic FAQ page removes 30–50% of support load. Build it early.

**Topics to cover at launch:**

**For members:**
- How does membership work?
- What's included in my membership?
- How do I submit a job request?
- What happens after I submit?
- What if no tradie accepts?
- What's the member discount, and how is it applied?
- Can I cancel my membership? How?
- What if I'm not happy with the tradie?
- How do I add another property?
- What if I move house?

**For tradies:**
- How does the platform work?
- How much does it cost?
- What are the benefit obligations?
- How are leads distributed?
- What happens if I can't take a job I accepted?
- How do I get paid by members? (Answer: members pay you directly; platform doesn't touch job payments)
- What happens in a dispute?
- Can I work with multiple categories?
- How do I expand my service area?
- How do I cancel?

**Shared:**
- Privacy policy summary
- Contact support
- System status (simple uptime page — link to UptimeRobot public status if you have one)

**Format:** simple web pages on tradify.au/help/. Can be static HTML at first; move to a proper help centre tool (Notion, HelpScout Docs) if content grows.

---

## 10. Ticket logging

At MVP, you're tracking tickets in a simple spreadsheet for learning, not enforcement.

| Date | User | Channel | Category | Issue (1-line) | Action taken | Resolved? | Notes |
|---|---|---|---|---|---|---|---|
| 2026-05-02 | jane@example.com | Email | Billing | Wants to cancel | Refund issued 50% | Yes | Was dissatisfied with tradie |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Weekly review:** 15 minutes every Monday.
- Which category had the most tickets? Is it growing?
- Same question asked 3+ times → update FAQ or product
- Any unresolved over 48 hours? Unblock them
- Any abuse to flag?

**Monthly review:** 1 hour.
- Ticket volume trend
- Resolution time trend
- Churn signals (cancellation tickets, refund requests)
- Feature request frequency count

---

## 11. The support voice

Some guidance on how you write support replies.

**Do:**
- Use the person's first name
- Acknowledge their situation briefly ("sorry to hear that", "that's frustrating")
- Use plain language, not jargon
- Be direct about what you can and can't do
- Offer an alternative if you're saying no
- Sign off with your first name (not "the Tradify team")
- Proofread; typos erode trust

**Don't:**
- Start with "Unfortunately..." — sounds defensive
- Use corporate pad-language ("as per our policy...", "we regret to inform you...")
- Over-apologise — one "sorry" is enough
- Blame the user
- Promise things you can't deliver
- Ignore part of what they asked

**Tone:** warm, direct, Australian. Like a capable friend helping you out.

---

## 12. What the support function feeds back

Support isn't just firefighting. It's one of your best sources of product feedback. Loop it back:

- Recurring questions → FAQ entries or UI fixes
- Recurring complaints → product roadmap items
- Refund reasons → retention pattern analysis
- Feature requests → prioritisation input
- Praise → testimonial capture (with permission)

Every month, do a 30-min writeup for yourself: "what did I learn from support this month." This is the cheapest product research money can buy.

---

## 13. Emergency playbook

For the worst-case situations. Have them mapped before they happen.

### Major outage (site / mobile apps / dispatch engine down)
1. Check Sentry + UptimeRobot + Horizon
2. Diagnose (often DB, Reverb, or Stripe webhook)
3. Post a status update on a pre-built status page (or temporary holding message on site)
4. Email affected users if outage > 1 hour
5. Post-mortem within 24h of resolution

### Data breach suspected
1. Immediately rotate all production secrets
2. Assess scope: what data, whose data, how long
3. Contact lawyer and consider OAIC notification obligations (Privacy Act notifiable data breach scheme)
4. Communicate honestly with affected users
5. External security review within 30 days

### Major media attention (positive or negative)
1. Do not improvise on the phone with a journalist
2. "Can I call you back in 15 minutes?" is always a valid answer
3. Use that time to think, check facts, and — if needed — consult a lawyer
4. Prepared statement is better than ad-lib

### Threat from user
1. Preserve evidence (screenshots, emails, call recording if legal)
2. Do not respond escalatingly
3. Consult lawyer if continued
4. Contact police if credible threat of violence or property damage

---

## 14. Quarterly review of this document

Every quarter, re-read this file and update:
- Canned responses that are getting edited heavily every time (rewrite the base)
- SLAs that you're consistently missing (either fix the cause or update the SLA)
- Categories that are exploding (warrant a product fix)
- Tooling that has become insufficient

This file is for your future self and whoever helps you run support. Keep it alive.

# GO-TO-MARKET.md — Launch Plan

**Status:** Founder-completion required. This is a scaffolding. Your market knowledge fills in the blanks.

**Honest note:** I'm Claude. I don't know Perth, I don't know the local trades community, I don't know which Facebook groups matter in Baldivis. What I can do is give you the structure of a GTM plan that works for two-sided platforms, and flag the decisions you must make.

---

## 0. The chicken-and-egg problem

Every two-sided platform has it: members won't pay for a membership if there are no tradies; tradies won't pay for a subscription if there are no leads. **You solve this by starting on the tradie side, manually.**

Specifically:

1. **Pre-launch:** Recruit a seed cohort of 15–30 tradies (by direct outreach, not the self-serve flow) in advance of having any members. Give them a free or discounted first year in exchange for committing to the platform and honouring the benefit obligations.
2. **Soft launch:** Open to 10–20 members you know personally. Submit jobs. Verify the dispatch engine works end-to-end. Iron out bugs in production conditions.
3. **Public launch:** Begin member acquisition marketing once tradie density is adequate in your launch area.

Do not skip step 1. A platform with no tradies fails the first member that signs up, and that member never comes back.

---

## Part A: Seed tradie acquisition

### A.1 Target: how many, in what categories, in what suburbs?

Before you recruit, decide your launch footprint.

**Recommended MVP footprint (Perth south-east corridor — you adjust):**

| Suburb cluster | Plumbers | Electricians | Locksmiths | Handymen | Other (total) |
|---|---|---|---|---|---|
| Baldivis + Wellard + Rockingham | 3 | 3 | 2 | 2 | 3 |
| Mandurah + Falcon | 2 | 2 | 1 | 1 | 1 |
| Kwinana + surroundings | 2 | 2 | 1 | 1 | 1 |
| **Total** | **7** | **7** | **4** | **4** | **5** |

**~27 tradies across ~10 suburbs = target launch density.**

Why this shape:
- Plumbers and electricians are highest-frequency categories; need duplication so one is always available
- Locksmiths are rarer call-outs but critical when needed; 2 per region is enough
- Other categories (roofer, HVAC, pest control, handyman, appliance repair) can launch thinner and backfill

**`DECISION REQUIRED: launch footprint`** — confirm the suburbs and category mix for your actual launch. Not prescriptive; fill in based on where you have personal network, where demand seems thickest, and where you can realistically recruit.

---

### A.2 The offer to seed tradies

You are asking a tradie to:
- Fill out an application
- Upload licence and insurance
- Agree to no-call-out-fee and 10% discount for members
- Pay an annual subscription (amount TBD from pricing decision)

**The offer needs to be compelling.** Rough options (not legal advice — apply ACL rules to any offer you make public):

**Option 1: Founding tradie deal**
- First 12 months free (pay nothing until year 2)
- Locked-in Premium tier at Standard price for life (if Premium pricing is announced)
- Named "Founding Tradie" badge on profile

**Option 2: Risk-reversed trial**
- First 3 months free
- Full refund on annual fee if fewer than N leads received in first 6 months
- Premium at discount for year one

**Option 3: Pay-when-leads-flow**
- No payment until first accepted lead
- Then full annual fee

I'd lean toward **Option 1** — it's simplest and removes any perceived risk. Option 2 and 3 make you look tentative; Option 1 signals confidence.

**`DECISION REQUIRED: seed tradie offer`** — pick one or invent another.

**Do not underprice permanently.** The economics of the business rely on tradies paying real subscription fees. Giving early supporters a one-year free period is fine; pricing the product too low forever is not.

---

### A.3 How to recruit them

The 27 tradies won't find themselves. You go to them. Channels, in order of likely yield:

**1. Personal network (fastest, highest-conversion)**
- Who do you know who's a tradie? Family, friends, friends-of-friends
- Start here before you do anything else
- Expected yield: 3–8 tradies with a warm intro conversation

**2. Past tradies you've used personally**
- Every good tradie whose number you have — text them
- Expected yield: 2–5

**3. Trade association and licensee lists**
- Master Plumbers WA, Electrical and Communications Association, etc.
- Members' directories often publicly searchable
- Cold email/phone outreach; expect 1–3% response rate
- Expected yield with 200 cold contacts: 2–6 tradies

**4. Facebook groups (local, trade-specific)**
- "Baldivis Tradies," "Perth Electricians," etc.
- Post a clear value prop, not spam
- Engage authentically for weeks before making the ask
- Expected yield: 2–4 tradies if done well; zero if done badly

**5. Local hardware stores (Bunnings, Reece Plumbing)**
- Put a flyer on the tradie-facing noticeboard
- Ask the store manager if they can recommend active tradies
- Expected yield: 1–3 tradies

**6. Physical door-to-door at tradie yards / workshops**
- Last resort but surprisingly effective for the tradie demographic
- They respond to people who show up in person
- Expected yield: hit-rate depends on you

**7. Referral from first tradies**
- Once you have 5, ask each for 2 more referrals
- Offer a referral bonus ($100 credit toward year 2 subscription per successful referral)
- Expected yield: ~20% of their referrals convert

### A.4 The pitch (do this well)

A pitch to a tradie isn't the same as a pitch to a VC. Tradies are busy, practical, skeptical of marketing, have heard hundreds of lead-gen promises, and have been burned by previous platforms that charge per lead with no quality.

**Effective pitch structure (5 minutes or less, ideally over coffee):**

1. **What this is NOT** (2 sentences):
   *"I'm not a lead-gen site that charges per lead. You don't pay for crap leads that don't convert. This is the opposite — members pay me an annual fee to have fast access to trusted tradies, and you pay a flat annual subscription to receive those jobs."*

2. **The mechanics** (2 sentences):
   *"When a member needs someone, my system offers the job to the best-matched tradie first — based on rating, response time, proximity. You see the job, decide in the window, accept if you want it. No bidding."*

3. **What you give up** (honest — tradies can smell BS):
   *"You agree to waive your call-out fee for members, and give them a 10% discount. That's the 'member benefit' — it's non-negotiable, and the system tracks whether you honour it."*

4. **What you get** (concrete):
   *"Pre-qualified jobs in your trade, in your suburbs, from people who've paid to be members. Exclusive to you at that moment — the system doesn't blast it to 50 tradies. And because it's a subscription, not pay-per-lead, the more you work, the better the ROI."*

5. **The offer** (specific — see §A.2):
   *"As a founding tradie, I'm offering your first year free. You pay nothing to prove it works. If it doesn't, we part ways. If it does, you're locked into early pricing."*

6. **The ask:**
   *"Would you be willing to look at the application? Takes 10 minutes."*

**Don't:**
- Promise specific lead volumes you can't guarantee
- Oversell ("this'll change your business") — tradies distrust hype
- Hide the discount/call-out-fee commitment until after they're in

**Do:**
- Be direct about what you're building and why
- Show them the web platform — a demo is worth 30 minutes of pitch
- Offer references once you have a few happy tradies on board

---

### A.5 Getting them onboarded quickly

Once a tradie says yes, make the onboarding frictionless:

- You or an assistant walks them through the application over a screen-share if they're not comfortable with web forms
- Offer to help them upload their licence and insurance (photos from their phone are fine)
- Approve them yourself, same day, if documents are in order
- Personal onboarding call to explain the app once it's live
- Add them to a private WhatsApp or similar for launch-cohort communication

**Target:** from "yes" to "receiving leads" in under 24 hours for seed tradies.

---

### A.6 Tracking seed tradie acquisition

Simple spreadsheet (Google Sheets is fine) until you have real CRM volume:

| Tradie name | Business | Category | Suburb(s) | Source | Contacted on | Status | Notes |
|---|---|---|---|---|---|---|---|
| Mike Jones | MJ Plumbing | Plumber | Baldivis, Wellard | Personal network | 2026-05-01 | Signed up | Founding tradie deal |
| ... | ... | ... | ... | ... | ... | ... | ... |

Status values: `Prospect` · `Contacted` · `Interested` · `Applied` · `Approved` · `Paid` · `Active` · `Declined` · `Churned`.

Review weekly. Measure conversion at each stage.

**Target metrics for seed phase:**
- Prospect → Contacted: 100% (you control this)
- Contacted → Interested: 30%+ (if lower, pitch needs work)
- Interested → Applied: 70%+ (if lower, application is too hard)
- Applied → Approved: 90%+ (reject only on genuine credential issues)
- Approved → Active (paid for subscription): 80%+ (if lower, offer isn't compelling enough)

---

## Part B: Member acquisition

### B.1 Only after tradie density is adequate

Do not begin member marketing until you have:
- At least 2 approved tradies per category in each launch suburb
- At least 1 tradie in each category with `accepts_emergency = true` in every launch suburb
- Dispatch tested end-to-end with a real tradie accepting a real job
- Stripe live mode working with a real subscription payment

If you start member marketing too early, the first ten members will have bad experiences ("no tradie accepted") and they'll tell their friends. Word-of-mouth in local communities is either your biggest ally or your biggest killer.

---

### B.2 Target: who is the member?

**Primary persona — Homeowner:**
- 30s–60s, owns a house in launch suburbs
- Busy dual-income household or retirees
- Has had bad tradie experiences before (waited all day, overcharged, poor work)
- Willing to pay for "I don't have to think about this" value
- Most likely to buy: homeowner of 5+ years (enough accumulated maintenance to notice)

**Secondary persona — Investor:**
- Owns 2+ investment properties
- Not living in them
- Needs reliable tradies for tenant call-outs without physically coordinating
- Tax-deductible expense helps the sell

**Tertiary — Renter:** probably **not** a member target; they typically rely on landlords. Don't market to them at MVP.

**`DECISION REQUIRED: which personas do you prioritise at launch?`** — default recommendation: Homeowner first, Investor second. Matches the plan structure in `docs/01-product-spec.md §6`.

---

### B.3 Positioning

**What members are actually buying:**

1. **Time saved** — no more "call 5 tradies, get quotes, pick one, hope they show up"
2. **Trust** — someone (you) vetted the tradie
3. **Money saved** — no call-out fee + 10% off
4. **Peace of mind** — when something breaks, you call one number

**Positioning options (pick one and be consistent):**

- **"Your annual home maintenance membership"** — positions it like a Costco membership for tradies
- **"Fast, trusted tradies. No call-out fees. Priority response."** — benefit-led, direct
- **"Like RAC for your house"** — analogy to a well-known WA roadside service (instantly understandable if audience knows RAC)
- **"Your home's speed dial"** — emotional, memorable

I'd lean toward the RAC analogy for a WA launch — it's sticky, requires zero explanation, and signals trust. Adjust if you're not in WA or if the analogy doesn't translate.

**`DECISION REQUIRED: positioning tagline`**.

---

### B.4 Channels (in order of likely ROI for a Perth / WA local launch)

**1. Neighbourhood Facebook groups**
- Every suburb has 2–3 active community groups
- People ask "can anyone recommend a plumber" in these daily
- Don't spam — contribute genuinely, then post your launch with permission from admins
- Local social proof compounds fast
- Expected CPA (cost per acquisition): low ($0–$20 per signup) if done well; zero if done badly

**2. Referral program**
- Members refer members for a discount on their next renewal
- Tradies refer members for a small commission or credit
- `docs/10-build-phases.md` has this as Phase 2.H — consider moving earlier if GTM leans heavily on it
- Expected CPA: low; leverages existing trust

**3. Letterbox drops in launch suburbs**
- Simple postcard with the pitch and a QR code to signup
- 2,000 letterbox drops ≈ $400–$600; conversion 0.1–0.5%
- Expected CPA: $20–$100 per signup
- Good for hitting homeowners specifically (renters throw it out, owners read it)

**4. Real estate agent partnerships**
- Agents have an incentive to impress new buyers — a "welcome kit" with a Tradify membership included is a real value-add for them
- Offer a co-branded referral code
- Agents get brand association; you get pre-qualified homeowners
- Expected CPA: moderate; slow to set up but high-trust

**5. Facebook/Instagram ads**
- Geo-targeted to launch suburbs
- Age targeting 30+
- Video or carousel format showing the "request a tradie in 30 seconds" flow
- Expected CPA: $30–$80 per signup in early testing; lower once optimised
- **Don't start here.** Paid acquisition before you have organic social proof is expensive and gives you nothing to learn from.

**6. Google Search ads**
- Keywords like "emergency plumber baldivis", "electrician kwinana"
- Intercepts people actively looking for tradies with the "become a member and never search again" pitch
- Expensive clicks ($3–$15 per click in trades category in Perth) but high intent
- Expected CPA: $50–$150 per signup
- Good for long-term customer acquisition; not for launch

**7. Local news/lifestyle PR**
- Community newspapers (Perth Now, Sound Telegraph, WA Today community)
- Angle: "local founder launches platform to fix the tradie problem"
- Free if the angle is good; high trust; slow
- Expected CPA: unpredictable but $0 out of pocket if you can land a story

**Launch-week channels (what to actually do):**
- **Week 0–2:** Your personal network. Direct asks. Target 20 members from your contacts.
- **Week 2–4:** Neighbourhood Facebook groups, with admin permission. Target 30 members.
- **Week 4–8:** Letterbox drops + agent partnerships. Target 100 members.
- **Week 8+:** Facebook/Instagram ads with real testimonials. Scale.

---

### B.5 The launch offer to members

As with tradies, founding members need an incentive.

**Options:**

- **Founding 100**: first 100 members get first year at 50% off, locked pricing forever
- **No-risk trial**: 30-day money-back guarantee if you don't submit any job
- **First-month free** (Netflix model): card captured, cancel anytime in month 1

I'd lean toward the **Founding 100** — it creates urgency, and the lifetime-locked pricing creates loyal advocates.

**`DECISION REQUIRED: member launch offer`**.

---

### B.6 Tracking member acquisition

Weekly cohort dashboard. Build it as simple SQL queries from the Laravel DB until you need something more.

**Week-1 metrics to watch:**
- Signups (visitors → account creation)
- Subscription activations (account → paid member)
- First-job submission rate (paid member → submitted within 30 days)
- Time to first job
- Acquisition source (self-reported at signup: "How did you hear about us?")

**Month-1 metrics to watch:**
- Dispatch success rate (% of submitted jobs that find an accepted tradie within 1st round)
- Member NPS or simple satisfaction ("would you recommend Tradify?")
- Early churn (any cancellations in month 1 — investigate each)

**Month-3 metrics:**
- Repeat-job rate (members who submitted 2+ jobs)
- Estimated annual value delivered (dollars saved in fees + discounts per member)
- Word-of-mouth signal (% of new members citing "referred by a friend")

---

## Part C: Launch sequence

Suggested 90-day plan:

### Days -30 to -14: Pre-launch
- Lawyer engaged, T&Cs in draft (`LEGAL.md`)
- Seed tradie outreach begins — target 30 conversations in 2 weeks
- Website live with signup flow in "coming soon" mode
- Mailing list capture for interested parties
- Stripe account approved, Twilio sender ID registered

### Days -14 to 0: Soft launch
- 15+ tradies approved and active
- Target suburbs covered in core categories
- Ten friendly members invited for a free founders cohort (no charge for 3 months)
- Real jobs submitted, completed, reviewed
- End-to-end dispatch validated
- Bugs fixed, UX rough edges sanded

### Days 0–30: Public launch
- Announcement to personal network + Facebook groups
- Founding 100 member offer live
- PR outreach to local media
- First letterbox drops
- Weekly founder check-in calls with every seed tradie (what's working, what's broken)

### Days 30–90: Growth
- Letterbox drops scale to full launch area
- Real estate agent partnerships signed
- Referral program live
- Facebook/Instagram ads begin (small budget, optimise)
- First 3-month member cohort reviewed — who churned, why
- Tradie roster expanded based on geographic gaps identified by job submissions that failed

### Day 90 review
- Are we hitting dispatch success rate > 90%?
- Are we hitting tradie renewal intent > 70%?
- Is member repeat-job rate > 30%?
- What's the signal on expanding to new suburbs?

---

## Part D: Budget

Launch budget (AUD, indicative — adjust to your situation):

| Category | Cost |
|---|---|
| Legal + admin (see `LEGAL.md`) | $5,500–$14,000 |
| Infrastructure (VPS, domain, services) | $50–$150/mo |
| Seed tradie acquisition (flyers, materials, coffee meetings) | $500–$1,500 |
| Launch marketing (letterbox drops 2,000 × $0.30) | $600–$1,200 |
| Stock imagery + graphic design | $500–$2,000 |
| Founding 100 discount absorbed (100 × ~50% of plan price) | Opportunity cost; not cash |
| PR outreach (no cost if DIY) | $0 |
| Facebook/Instagram ads (first 60 days) | $1,000–$3,000 |
| **Total cash launch budget** | **~$8,000–$22,000** |

Minimum viable launch budget: ~$8,000 — assumes friendly-only seed cohort, no paid ads, minimal legal (LawPath templates).

Recommended launch budget: ~$15,000 — gets you proper legal, modest paid acquisition, real marketing assets.

**Runway considerations:** budget at least 6 months of zero revenue. Subscription businesses are slow burners; don't expect to be cash-flow positive for at least 12 months at this scale.

---

## Part E: When you're stuck

If tradie acquisition is slow:
- Pitch isn't landing → revisit §A.4
- Offer isn't compelling → revisit §A.2
- Not reaching enough tradies → revisit §A.3 channels
- Tradies are interested but not converting → application friction is too high

If member acquisition is slow:
- Messaging isn't resonating → revisit §B.3 positioning
- Reaching wrong people → revisit §B.2 persona targeting
- Good traffic but no signups → signup friction or price objection
- Good signups but no job submissions → members don't feel urgency; try "first job free" follow-up email

If dispatch is failing:
- Gaps in tradie coverage → fill them with seed recruitment
- Right tradies are declining → review their decline reasons; adjust scoring if a pattern
- Everyone's accepting but disputes are rising → quality issue; raise approval bar

---

## Part F: What this document does NOT cover

- **Sales tooling** (CRM, pipeline management) — at MVP, Google Sheets is fine
- **Marketing automation** (drip campaigns, segmentation) — Phase 2 when you have cohort volume
- **Content marketing** (blog posts, SEO strategy) — Phase 2; not a launch lever
- **Event marketing** (trade shows, local expos) — consider if your launch area has relevant events
- **Growth experiments** (A/B testing, funnel optimisation) — pointless until you have traffic

---

## This document's maintenance

Update this doc monthly during the first six months post-launch:
- What worked
- What didn't
- What you'd do differently
- Which channel delivered the best cost-per-acquisition
- Which tradies are driving the most completed jobs
- Which suburbs are underserved

After 6 months, this doc becomes reference rather than live planning. Start a separate growth plan then.

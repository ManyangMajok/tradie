# Design → Spec mapping

Lookup table for every mobile screen. Use this when building any screen.

**Always read the spec section for behaviour and acceptance criteria.**
**Always read the stitch file for visual layout, spacing, colour, and component structure.**

Stitch exports live in `docs/stitch/<folder>/`. Each folder contains:
- `code.html` — Stitch-exported HTML/CSS (visual reference, never imported into apps)
- `screen.png` — rendered screenshot

---

## Tradie app (14 screens)

| # | Screen | Spec section | Stitch folder |
|---|---|---|---|
| 1 | Splash / Auth-Check | `11-mobile-apps-spec.md §9.1` | `docs/stitch/splash_auth_check/` |
| 2 | Onboarding (3-screen pager) | `§9.3` | `docs/stitch/onboarding_step_1/`, `onboarding_step_2/`, `onboarding_step_3/` |
| 3 | Leads Inbox | `§9.4` | `docs/stitch/leads_inbox/` |
| 4 | Lead Detail | `§9.5` | `docs/stitch/lead_detail/` |
| 5 | Jobs Inbox | `§9.6` | `docs/stitch/jobs_inbox/` |
| 6 | Job Detail | `§9.7` | `docs/stitch/job_detail/` |
| 7 | Completion Form (5-step wizard) | `§9.8` | `docs/stitch/completion_form_step_1/` … `completion_form_step_5/` |
| 8 | Performance Dashboard | `§9.9` | `docs/stitch/performance_dashboard/` |
| 9 | Service Areas | `§9.10` | `docs/stitch/service_areas/` |
| 10 | Service Categories | `§9.11` | `docs/stitch/service_categories/` |
| 11 | Availability | `§9.12` | `docs/stitch/availability/` |
| 12 | Subscription Status | `§9.13` | `docs/stitch/subscription_status/` |
| 13 | Profile & Settings | `§9.14` | `docs/stitch/profile_settings/` |
| 14 | Global States (offline / session / maintenance) | `§9.15` | `docs/stitch/global_states_overlay/` |

## Member app (14 screens)

| # | Screen | Spec section | Stitch folder |
|---|---|---|---|
| 1 | Splash / Auth-Check | `§11.1` | `docs/stitch/splash_auth_check/` |
| 2 | Onboarding Welcome | `§11.3` | `docs/stitch/member_onboarding_welcome/` |
| 3 | Onboarding Notifications | `§11.3` | `docs/stitch/member_onboarding_notifications/` |
| 4 | Home Dashboard | `§11.4` | `docs/stitch/member_home_dashboard/` |
| 5 | Submit Request Wizard (7 steps) | `§11.5` | `docs/stitch/submit_request_step_1/`, `submit_request_step_2/` |
| 6 | Properties List | `§11.6` | `docs/stitch/properties_list/` |
| 7 | Property Detail / Edit | `§11.7` | `docs/stitch/property_detail/` |
| 8 | Jobs List | `§11.8` | `docs/stitch/jobs_inbox/` |
| 9 | Job Detail (Member-Facing) | `§11.9` | `docs/stitch/job_detail_member/` |
| 10 | Review Form | `§11.10` | `docs/stitch/member_review_form/` |
| 11 | Saved Tradies | `§11.11` | `docs/stitch/saved_tradies/` |
| 12 | Membership & Support | `§11.12` | `docs/stitch/membership_support/` |
| 13 | Profile & Settings | `§11.13` | `docs/stitch/profile_settings/` |
| 14 | Global States | `§11.14` | `docs/stitch/global_states_overlay/` |

## Design system

All screens share the **Premium Dark Glass** design system. Tokens are defined in `packages/ui/src/tokens.ts`.

| Token | Value |
|---|---|
| Background | `#171219` |
| Surface | `#231e25` |
| Surface container | `#39333b` |
| Primary | `#AC5FDB` |
| Primary light | `#e5b4ff` |
| Secondary | `#f2affc` |
| Secondary container | `#693376` |
| Tertiary (gold) | `#dac84e` |
| Error | `#ffb4ab` |
| On-surface (text) | `#eadfea` |
| On-surface-variant | `#d0c2d3` |
| Outline | `#998d9d` |
| Font | Manrope (400/600/700) |
| Glass bg | `rgba(60, 53, 65, 0.7)` + `blur(16px)` + `rgba(255,255,255,0.1)` border |
| Gradient (CTA) | `#AC5FDB` → `#E3A2EE` |

# CRUD branch with client and fundi portals

Owner-approved scope, 26 November 2026: retain the web-only `tradie-crud` copy and simplified admin CRUD, combine fundi/contact and optional business entry, and restore clients' and fundis' web functionality. This document and the README supersede the earlier admin-only scope. Mobile apps and their APIs remain excluded. Original main checkout stays unchanged.

## Accounts

Active admin, member and tradie users share `/login`; successful authentication goes to /admin, /dashboard or /tradie respectively. Every authenticated web request rejects suspended/inactive users, including existing sessions. Logout remains available. Role middleware and record ownership policies protect each portal. There is no public registration: admins add users.

Admins can create a Laravel password-broker setup link from a People or Fundis detail page. The token is hashed in the database, single-use and expires after 60 minutes. The raw URL is flashed only to the requesting admin and is never committed or sent externally. A replacement link invalidates the old token. Users choose their own password and then sign in. Forgot-password email is logged locally. Admin-created fundis retain random initial passwords until setup; existing member passwords remain usable. Passwords never appear in page data.

## Independent fundis and optional businesses

Fundis still have one combined contact/business form. Business fields remain optional. On first portal access, a fundi without a provider record gets an independent service profile under their personal name, marked `is_independent`. This uses the existing provider relationships for locations, categories, offers, subscriptions, jobs and ratings without requiring a business name or registration number. The profile is approved for an admin-created independent fundi. Existing provider approval is preserved; admins can manage it from the combined form.

Independent profiles display blank optional business fields in admin and fundi settings. Adding business information reuses the same profile ID. Fundis can keep operating independently by leaving the business name blank in their settings. No separate business-creation step is required. Suspension of a user also excludes their service profile from client selection.

## Portal workflows

Clients manage their own properties and profile/password, select local fundis ranked by ratings, submit and track jobs, cancel eligible jobs, review completed work, save fundis and use simulated membership activation. Fundis configure trades, service areas and opening hours, activate simulated subscriptions, accept/decline offers, progress jobs, submit completion reports and view ratings/performance. Performance totals and charts are derived directly from real offers and completion reports, not placeholder aggregation rows.

The existing member-choice rules, timing windows, state transitions, money handling and review logic remain. Viewing a lead sets `viewed_at` while retaining the Offered status required by the existing acceptance/expiry actions; opening a lead therefore does not make it unacceptible. Browser/Inertia writes redirect to their resulting page; JSON clients retain JSON responses. Client property modifications are owner-scoped, and properties with jobs cannot be deleted.

MySQL-backed queued jobs handle delayed expiry and local notifications. `composer run dev` starts Laravel, the queue worker and scheduler. No Redis or external payment/email/SMS service is introduced. Emails are logs and payments are simulated. Do not set QUEUE_CONNECTION=sync for this workflow because delayed offers require the database queue.

## Admin consistency

Admin CRUD remains available, with an explicit allowlist and transactional multi-step writes. Admin accounts are excluded from People editing/deletion. A business requires a fundi owner and a property requires a member. Contact roles cannot change while dependent records exist. The combined Fundis delete removes an unused business/contact in a transaction; database references prevent orphaned records.

Jobs with offers, completion reports or reviews cannot have their relationship/status fields overwritten through generic CRUD, and cannot be deleted there. Basic description/title edits remain possible. This prevents admin forms from silently corrupting the restored portal state machine. The original manual CRUD behaviour remains for standalone records without workflow history.

## Setup and tests

Use separate MySQL databases: tradie_crud for the local app and tradie_crud_testing for tests. Run the incremental migration and seeder; never wipe the existing demo database. The new migration adds the independent-profile flag. Seeding creates Kenyan reference data, demo users, membership plans, a property/job and matching configuration for the sample fundi. It preserves changed passwords and existing matching settings. Users explicitly activate simulated plans.

The test suite covers role separation, inactive accounts, private single-use setup links, independent fundis, property ownership, opening/viewing/accepting leads, full selection-to-review flow, performance totals, saved fundis, admin guards and the retained domain regressions. Build, TypeScript, lint and PHP formatting checks are required. HTTP verification is used without browser automation, per the owner's preference.

## UI direction

The owner-provided dashboard reference informs the shared admin, client and fundi workspaces: a soft grey canvas, rounded white cards, compact icon navigation, dark pill actions and warm orange accents. Navigation stays labelled on small screens and icon links expose accessible names and keyboard focus. Sign-in and overview pages use the same visual system. Overview counts come from existing records; no synthetic financial charts or activity are introduced. Routes, validation and job rules are unchanged by this visual refresh.

Actions use the shared Lucide ActionIcon component alongside visible labels. Shared buttons accept a semantic icon name; loading states replace the action icon with a decorative spinner and expose aria-busy. Icons do not change routes, confirmation steps or form handling.

## Local-first selection and alternatives

The client sees all eligible fundis serving their area, ordered by ratings. Only when none are available do other active service areas appear as alternatives, labelled Travel needs confirmation. All other checks (trade, approval, subscription, hours, active account, existing offers and dispute flags) remain. Local availability is rechecked on submission. An outside-area offer records its travel flag; the fundi sees the warning and accepts to confirm travel, or declines. No automatic selection occurs.

Where stored area coordinates exist, alternatives are ordered by approximate straight-line distance to their nearest service area. Unknown distances sort after known ones; county and rating break ties. Coordinates are not currently seeded for Kenyan areas, so the demo uses same-county and rating fallback, with Distance unavailable shown honestly. A map and live GPS positions are not part of this change.

Admins can enter optional paired latitude/longitude values on Locations. These are area-centre coordinates, not home addresses or live fundi locations. Both coordinates are validated and must be supplied together.

# Demonstration variant — approved 2 October 2026

This document and the root README override the production infrastructure instructions in the copied specification pack. The owner requested a separate copy of the current app with Laravel and the same frontend, MySQL, simulated payments, locally logged email, and local file storage. The source `my-tradie` project is not modified.

- MySQL 8.4 replaces PostgreSQL. Column enums retain exactly the original values. Conditional unique indexes use nullable generated guard columns and composite unique indexes; active subscription, live email/phone, primary property, and company uniqueness rules remain enforced. Offer response time is generated with TIMESTAMPDIFF. ILIKE search uses the case-insensitive MySQL collation. The eligibility SQL changes dialect only; scoring, windows, and filtering rules remain unchanged.
- Laravel's database queue uses `queue_jobs` to avoid collision with the domain `jobs` table. Jobs are published after transaction commit. `composer run dev` runs the web server, queue worker, and scheduler. File cache and sessions replace Redis; no Horizon is needed.
- External billing packages and webhook controller are removed. Existing checkout POST paths and plan fields remain. Successful checkout activates the existing member/tradie domain subscription locally in a transaction with an owner-row lock. Duplicate checkout is idempotent; a different existing active plan is rejected instead of silently replaced. Existing member cancellation toggles renewal locally. Billing portal GET paths return to the local subscription screen with a demo message. No card or real payment API is used. Legacy Stripe-shaped database columns remain nullable for compatibility with the existing pages and factories.
- Laravel's log mailer records the existing email templates, including password-reset links, in `storage/logs/laravel.log`. SMS/push channels were already deferred in the source; the demo sends neither. No message is sent externally.
- Uploaded files use the existing private local disk and authorised download controllers. MySQL stores paths and metadata. Uploads and logs are excluded from Git.
- Reverb/Echo/Pusher initialisation and dependencies are removed. Navigate or refresh to see actions performed in another browser session. The original frontend had no Echo event listeners to replace.
- Seed users and plans retain their existing names and prices. Demo tradies share fixed service areas and all-day availability; the member gets a matching demo home. These are seed fixtures, not changes to dispatch eligibility rules.
- The original Stripe webhook tests are replaced by demo checkout/cancellation tests. The dispatch and job-state regression suite is retained. Automated checks use a separate MySQL database.
- This is a new repository snapshot of tracked and untracked source, without the original Git history, environment files, logs, uploaded user files, database data, dependency directories, or local agent memory. This avoids carrying prior credentials into the receiving repository.

The original product and frontend specs continue to describe the preserved app. Production provisioning, Stripe webhook setup, Redis/Horizon, email-provider setup, and WebSocket instructions do not apply here.

References: [Laravel database queues](https://laravel.com/framework/docs/13.x/queues), [MySQL generated-column indexes](https://dev.mysql.com/doc/refman/8.4/en/create-table-secondary-indexes.html).

Validation note: the original remaining Composer package versions are retained for app parity. Composer reports security advisories in that inherited lockfile; review and update those dependencies before exposing this demo beyond a local demonstration.

## Member-selected tradies — approved 2 October 2026

Members now choose the tradie themselves in the web demo. The request wizard lists all eligible companies serving the selected property's suburb and trade, ordered by average rating descending. Unrated companies appear last; equal ratings use business name then ID for stable display. Review count is shown as context, not an extra ranking weight. Premium plan boosts do not affect this list.

The existing approval, subscription, availability/emergency, category, service-area and dispute eligibility rules still apply. Only public company profile/rating fields are returned. Eligibility is rechecked when submitting. New web requests require a selected company and create a single offer transactionally; the tradie must accept before assignment. Existing acceptance windows remain unchanged.

On decline or expiry, existing admin escalation/notification is retained, but the system never automatically contacts another company for a member-selected job. The member can choose another eligible tradie on the same job page. Already attempted companies are excluded. A live offer or assigned job cannot be replaced by this action. Legacy requests and the preserved mobile API retain their existing dispatch behaviour.

Web endpoints: GET /jobs/available-tradies accepts property_id, tradie_category_id, urgency and returns location plus a ratings-ordered tradies list. POST /jobs additionally requires selected_tradie_company_id; web submissions redirect to the new job, JSON clients retain the JSON response. POST /jobs/{publicId}/choose-tradie permits the owner to choose again only when a selected job is pending dispatch. The nullable jobs.selected_tradie_company_id records member choice separately from confirmed assignment.


## Kenyan demonstration context

The owner requested Kenyan context throughout the runnable web demo. Default seeding now uses Kenyan names, +254 phone placeholders, 12 representative service areas across Nairobi, Mombasa, Kisumu, Nakuru, Kiambu and Kajiado, eight fictional fundi businesses, member properties, completed jobs, reviews, saved tradies and performance totals derived from those records. The existing demo login emails remain unchanged; new accounts use password `password`. Reseeding preserves existing passwords and jobs and does not wipe the database. Known demo profiles are updated; older WA areas are retained but made inactive.

Currency display is KES/KSh and times use Africa/Nairobi. Existing numerical subscription prices are retained as illustrative KSh placeholders, not converted prices or approved commercial pricing. Financial fields still store minor units (100 per shilling). Seed invoices show KSh 4,500 after a KSh 500 discount on KSh 5,000. Kenyan mobile signup accepts +2547XXXXXXXX and +2541XXXXXXXX. The legacy `abn` field is now an optional generic business registration reference; `licence_state` stores KE. This is a demo localisation, not a statement about Kenyan licensing or tax compliance. No real documents or external payments are seeded.

`php artisan db:seed` installs or refreshes this context. Do not run migrate:fresh to update an existing demo. Original mobile/design and production specification files remain historical references; the Kenyan localisation applies to the runnable web app.

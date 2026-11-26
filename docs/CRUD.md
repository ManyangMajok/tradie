# Web-only admin CRUD branch

Owner-approved scope, 26 November 2026: copy the web app into `tradie-crud`, remove mobile apps and simplify to basic admin CRUD. This supersedes original dispatch, registration, subscription and mobile requirements on this branch. The main checkout is preserved.

## Access and records

Only active admins can authenticate or access records. `/` redirects to `/admin`, which redirects guests to login. Logout is a CSRF-protected POST. Login throttling and session regeneration are retained. Registration and API routes are removed.

The admin manages people (member/fundi roles), fundi businesses, properties, manual jobs, locations, categories and issue types. Admin records are excluded, preventing self-deletion and privilege escalation. Passwords are hashed, never sent in page props, required on creation and unchanged on blank update.

A business must reference a fundi contact; a property must reference a member; a job derives its member from its property. Roles cannot change while properties, businesses or jobs depend on them. Properties with jobs cannot transfer to another member. References are validated server-side; unknown resources/IDs return 404. Only allowlisted fields are writable.

Jobs have four manually editable statuses: Open (stored as pending_dispatch), In progress, Completed and Cancelled. These edits never invoke dispatch/state-transition services, payments, notifications or queues. Current-status timestamps are set on entry and cleared on exit. Selecting a business records a manual assignment. There are no new financial calculations or performance reports. Multi-step writes are transactional.

Deletion is permanent after confirmation. Database foreign keys reject removal of referenced parents and return a useful form error. Remove dependent records first. Existing cascades remove job-owned internal rows.

## Implementation

The React UI keeps the existing orange/navy brand. Shared CRUD pages consume a server-defined field allowlist; this is not an arbitrary table editor. Lists have search/pagination, forms show labels and errors, and a native modal alert dialog confirms deletion. No packages were added.

The original schema, models, factories and internal domain services remain for compatibility and regression checks. Legacy portal controllers are unreachable; the frontend contains login and CRUD pages. Console scheduling is empty and `composer run dev` starts only Laravel. Mobile apps, native packages, Expo tooling and mobile design references are removed.

Seeding installs Kenyan reference data, one admin, one member, one fundi contact/business, one property and one example job. No subscriptions/payments/reviews are seeded. Repeated seeding preserves passwords and matching records. Use a new `tradie_crud` database. Tests force `tradie_crud_testing`. Environment files, dependencies, uploads, databases and builds remain ignored.

## Checks

Run the verification commands in the root README. Retained domain/model tests still run; endpoint tests for removed public workflows are retired and replaced with admin CRUD coverage. No browser automation is used, following the owner's preference.

## Combined fundi workflow — owner update

Fundis are created and edited at `/admin/fundis` with contact information and an optional business section in one form. An independent fundi has no business row. Providing a business name saves a linked business in the same transaction. Other business fields without a name are rejected, and a saved business name cannot be cleared inadvertently. Editing can add business information later. Existing business status is preserved.

Only fundi users appear in this resource; member/admin IDs are rejected. New fundis receive a random unusable-by-default portal password because the branch allows admin sign-in only; the admin does not need to invent a password for a managed contact. Deleting an unused fundi deletes their optional business and contact atomically. If another record references either, the transaction rolls back. People and legacy business URLs remain for compatibility, while the navigation presents Fundis as the combined workflow. Job assignment still references a business; independent contacts can be managed without one.

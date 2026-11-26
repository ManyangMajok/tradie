# TradeFinder — admin CRUD

The **tradie-crud** branch of [ManyangMajok/tradie](https://github.com/ManyangMajok/tradie) is a web-only copy using Laravel 13, React 19, Inertia 3, TypeScript 6, Tailwind 4 and MySQL 8.4. No Expo apps, mobile workspaces or external services are required.

Active admins can create, view, search, edit and delete **people, fundis (with optional business details), properties, jobs, locations, trade categories and issue types**. Lists have pagination. Forms validate inputs and relationships. Delete confirmation is required; referenced records cannot be deleted.

Jobs are manual records: Open, In progress, Completed or Cancelled. The job's member comes from its property. There is no automated dispatch, billing, checkout, registration, member/fundi portal, mobile API or background scheduler.

## Clone and run

Install PHP **8.4+** (pdo_mysql, mbstring, xml, curl, fileinfo, openssl, zip, bcmath), Composer 2, Node.js **22.13+**, npm, Git and MySQL **8.4**.

```sh
git clone --branch tradie-crud --single-branch https://github.com/ManyangMajok/tradie.git tradie-crud
cd tradie-crud/web
composer install
npm ci
php -r "copy('.env.example', '.env');"
```

Create a separate database in MySQL Workbench or the MySQL CLI:

```sql
CREATE DATABASE tradie_crud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Edit `web/.env`: set `DB_HOST`, `DB_PORT`, `DB_USERNAME` and `DB_PASSWORD` for your MySQL installation. Keep `DB_DATABASE=tradie_crud`. Use a new database, not the original demo's database. Never commit the environment file.

```sh
php artisan key:generate
php artisan migrate --seed
npm run build
composer run dev
```

Open **http://127.0.0.1:8000**. Keep MySQL and the server terminal running. Stop the web server with Ctrl+C. No Redis, queue worker, Expo, SMS, payment or email account is needed.

Local demo login: **admin@tradify.dev** / **password**. Only active admins may sign in. Sample members and fundis are managed records, not portal users. Admin accounts cannot be edited or deleted in the CRUD UI. Demo seeding runs only in local/testing environments and preserves changed passwords when repeated.

## Try it

1. Add a member under People.
2. Open **Fundis → Add fundi** and enter their contact details. Business information is optional: leave that section blank for an independent fundi, or fill it in to save both records together. No portal password is needed.
3. Add a property linked to the Member and a location.
4. Add a job for that property, choose a category and optionally assign a business.
5. Search for the job, view its details and edit its status or description.
6. Delete the job with confirmation, then delete the property or fundi. Deleting a fundi also removes their optional business when neither is in use. Deleting a referenced person or location shows an explanation instead of breaking relationships.

Locations, categories and issue types have the same CRUD flow. Create reference records before selecting them in dependent forms. Category/issue slugs use lowercase letters, numbers and hyphens, for example `water-heater`.

## Pull updates

From the checkout:

```sh
git switch tradie-crud
git pull --ff-only origin tradie-crud
cd web
composer install
npm ci
php artisan migrate
npm run build
php artisan optimize:clear
composer run dev
```

No database reset is required. Use `php artisan db:seed` only when you want to restore missing demo fixtures; it does not wipe data.

## Verification

Create a separate test database:

```sql
CREATE DATABASE tradie_crud_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tests inherit local MySQL connection settings and force the database name to `tradie_crud_testing`. CI supplies an isolated MySQL 8.4 service. From `web/`:

```sh
npm run typecheck
npm run lint
npm run build
php vendor/bin/pint --test
php artisan test
```

Coverage includes admin-only access, CRUD, passwords, relationship/unique-value validation, protected deletion and manual jobs. Original model/database and domain regression checks remain where applicable; tests for removed public workflows are replaced by CRUD coverage.

## Layout

- `web/`: complete runnable application with npm/Composer lockfiles.
- `web/app/Support/CrudResources.php`: explicit allowlist of editable resources and fields.
- `web/app/Http/Requests/Admin/SaveRecordRequest.php`: validation.
- `web/app/Actions/SaveCrudRecord.php`: transactional updates.
- `web/resources/js/Pages/Crud/`: admin pages.
- `docs/CRUD.md`: branch behaviour and architecture notes.

Original schema, models and internal domain services remain for compatibility and regression coverage. They are not exposed by the CRUD routes. The retained platform/production docs are historical references; this README and `docs/CRUD.md` are authoritative for this branch.

Fundis can be edited from the same screen, including their business information. An independent fundi can add business details later. Existing business names cannot be blanked accidentally; their details are retained unless the business record is explicitly deleted. The separate business URL remains available for existing records, but the main navigation uses the combined Fundis workflow.

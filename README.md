# TradeFinder — admin CRUD

> **Existing Windows Desktop checkout failing at setup?** Read [Desktop setup recovery and agent handoff](README-DESKTOP-SETUP.md). It records the confirmed bootstrap/cache error and resumes setup in the existing folder with the already created database.

The **tradie-crud** branch of [ManyangMajok/tradie](https://github.com/ManyangMajok/tradie) is a web-only copy using Laravel 13, React 19, Inertia 3, TypeScript 6, Tailwind 4 and MySQL 8.4. No Expo apps, mobile workspaces or external services are required.

The admin keeps full CRUD for people, fundis (optional business details), properties, jobs, locations, categories and issue types. **Clients and fundis also have their own web accounts and dashboards.** Mobile apps remain excluded.

- **Clients:** manage properties and profile/password, find available local fundis ranked by saved-pin distance and ratings, choose a fundi, track/cancel jobs, submit reviews, save fundis and activate a simulated membership.
- **Fundis:** manage profile/password, optional business details, trades, service areas and availability; activate a simulated subscription; accept/decline leads, update job progress, submit completion reports and see performance from actual records.
- **Admins:** retain the combined fundi form, manage records and generate private password setup links. Active workflow records are protected from destructive CRUD changes.

Payments are simulated, emails go to the local log, files stay on local disk, and the queue uses MySQL. No Redis or external integration credentials are required.

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

Open **http://127.0.0.1:8000**. Keep MySQL and the server terminal running. Stop the web server with Ctrl+C. The launcher starts Laravel, the MySQL queue worker and the scheduler. Keep all three running so notifications and timed offer expiry work. No Redis, Expo, SMS, payment or email account is needed.

## Sign in and give users access

All roles use the same `/login` page and are redirected to their own dashboard. Suspended/inactive accounts cannot sign in or continue using an existing session.

| Role | Demo email | Password | Dashboard |
|---|---|---|---|
| Admin | admin@tradify.dev | password | /admin |
| Client | member@tradify.dev | password | /dashboard |
| Fundi | tradie@tradify.dev | password | /tradie |

These credentials are local demo fixtures. Reseeding preserves changed passwords.

For a newly added user:

1. Add the client under **People** or add the fundi under **Fundis**. Business details remain optional.
2. Open their record and click **Create password setup link**.
3. Share the displayed link privately. It is single-use, expires in 60 minutes, and generating another invalidates the previous link. No email is sent by this button.
4. The user opens the link, sets their password, then signs in with their email at `/login`.

For another computer/phone, the app must run on a reachable LAN/host address; generate links from that reachable address. A `127.0.0.1` link only works on the computer hosting the app. Do not share an admin session with clients/fundis.

Forgot password sends its reset message to `web/storage/logs/laravel.log`, because this demonstration does not send real emails. Alternatively the admin can generate a new private setup link.

## Try the full workflow

1. Sign in as the fundi. Set **Trade Categories**, **Service Areas** and **Availability**, then activate a **demo subscription**. The seeded fundi already has plumbing, Westlands and daily availability configured. New profiles should configure their own coverage.
2. Sign in as a client in another browser profile/private window. Activate a demo membership and add a property if needed.
3. Request a job, view fundis serving that location, compare ratings and choose one. Only the chosen fundi receives the offer. If no local fundi is available, alternatives from other areas appear with a Travel needs confirmation notice. The fundi must accept to confirm travel.
4. The fundi opens the lead and accepts or declines. On acceptance, update progress under **My Jobs** and submit the completion report.
5. The client reviews the completed work. The fundi's rating and performance reflect actual saved records.
6. The admin can still edit basic records. Jobs with offers, reports or reviews cannot have their assignment/status overwritten or be deleted through generic CRUD.

Independent fundis use their own name as their service profile; business details are not required. The existing database's provider row holds service areas, offers and jobs for both independent and business fundis. They can add business information later without losing their job history.

The old business-record URL remains available for compatibility; the main admin navigation uses the combined **Fundis** workflow. Existing business approval can be changed from **Fundis → Edit → Service profile approval**.

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

Coverage includes role-isolated access, password setup, CRUD, relationship/unique-value validation, protected deletion, independent fundi setup, client selection, lead acceptance, completion, reviews and simulated billing. Original model/database and domain regression checks remain, with restored portal and billing tests.

## Layout

- `web/`: complete runnable application with npm/Composer lockfiles.
- `web/app/Support/CrudResources.php`: explicit allowlist of editable resources and fields.
- `web/app/Http/Requests/Admin/SaveRecordRequest.php`: validation.
- `web/app/Actions/SaveCrudRecord.php`: transactional updates.
- `web/resources/js/Pages/Crud/`: admin pages.
- `docs/CRUD.md`: branch behaviour and architecture notes.

The original schema and domain services support the restored web portals; the admin uses the explicit CRUD field allowlist. The retained platform/production docs are historical references; this README and `docs/CRUD.md` are authoritative for this branch.

For approximate nearest-area suggestions, add paired latitude/longitude values under Admin → Locations. Without coordinates, alternatives prioritise the same county and then ratings; no distance is fabricated. A map is not required for matching.


## OpenStreetMap pins

Leaflet displays OpenStreetMap automatically when fundi search results appear. Pin-editing forms use Open map. No API key or OSM account is needed for the default modest-use demo. Internet is needed for map tiles; numeric coordinate entry and the normal fundi list remain available without them.

- Admin: Locations → Add/Edit → Open map to pin an area centre.
- Client: Properties → Add/Edit → Property pin. Click to place/move it, then save the form.
- Fundi: Settings → Public base location. This pin is shown to clients in search; choose a location you are comfortable publishing. It does not change your service-area coverage.
- Client search: the map opens automatically with saved bases or labelled area centres. Select a fundi pin or its list entry. Property pins are not shown to other clients.

Local coverage remains first. Within local results, known property-to-base straight-line distances come first, then rating; entries without a distance remain listed. Other-area suggestions appear only when no local fundi is eligible and still require travel confirmation. Area-centre estimates are clearly distinguished from saved-base estimates. This is not live GPS, driving routes, or travel-time estimation. No coordinates are fabricated for existing accounts.

To pull this update, run composer install, npm ci, php artisan migrate, npm run build and restart the app/worker. The migration adds nullable pin columns without resetting data. Clear pin plus Save removes stored coordinates.

Default map tiles follow https://operations.osmfoundation.org/policies/tiles/: visible attribution, normal browser caching/referrer, no offline downloads or prefetching. For larger deployments, configure a suitable provider with VITE_MAP_TILE_URL and VITE_MAP_ATTRIBUTION in .env and rebuild. No address-search/geocoding service is integrated. Addresses and marker labels stay in the app; external requests fetch map tiles.

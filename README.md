# Tradify demonstration

The Tradify web application with Kenyan demo data, configured for a simple local demonstration: **Laravel 13 + React 19 + Inertia 3 + TypeScript 6 + Tailwind 4 + MySQL 8.4**.

Payments are simulated. Emails are written to `web/storage/logs/laravel.log`; uploaded files stay on local disk. No Redis, Stripe, Twilio, Resend, Sentry, Reverb, or cloud storage account is required.

## Install and run

Install **PHP 8.4+**, **Composer 2**, **Node.js 22.12+**, **Git**, and **MySQL 8.4**. PHP needs `pdo_mysql`, `mbstring`, `xml`, `curl`, `fileinfo`, `openssl`, `zip`, and `bcmath`. The committed dependency lock requires PHP 8.4 even though the original project specification said 8.3.

1. Clone the repository and enter its `web` folder:

   ```sh
   git clone <REPOSITORY_URL> tradie
   cd tradie/web
   composer install
   ```

2. Create a dedicated empty database in MySQL (Workbench or the MySQL CLI):

   ```sql
   CREATE DATABASE tradie_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Copy the sample environment using this command (works in PowerShell and Bash):

   ```sh
   php -r "copy('.env.example', '.env');"
   ```

   Edit `web/.env`: set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, and `DB_PASSWORD` for your local MySQL server. Keep `DB_DATABASE=tradie_demo`. No other service credentials are needed. Do not copy someone else's `.env`.

4. Prepare the app:

   ```sh
   php artisan key:generate
   php artisan migrate --seed
   npm ci
   npm run build
   ```

5. Start the demo from `web/`:

   ```sh
   composer run dev
   ```

   Open **http://127.0.0.1:8000**. Keep that terminal open; press Ctrl+C to stop. The command starts Laravel's web server, MySQL-backed queue worker, and scheduler together. MySQL must already be running. Node is used for this process launcher and the asset build; Vite is not required at runtime.

## Demo accounts

All four accounts use the local demonstration password **`password`**.

| Role | Email |
|---|---|
| Admin | `admin@tradify.dev` |
| Member | `member@tradify.dev` |
| Standard tradie | `tradie@tradify.dev` |
| Premium tradie | `tradie2@tradify.dev` |

The member has a demo home in Westlands, Nairobi. Eight fictional fundi businesses cover twelve Kenyan demo locations. Westlands has four available providers with different ratings, including one without reviews. All demo providers have daily availability. Additional tradie logins are tradie3@tradify.dev through tradie8@tradify.dev; regional member logins are member4@tradify.dev through member7@tradify.dev. Use separate browser profiles/private windows for different roles.

## Walk through the demo

1. Log in as the member and request a plumber for the demo home. Use a flexible urgency to give yourself time to switch accounts. Click **Find local tradies**, compare all available tradies serving the property suburb (highest rating first), choose one, then click **Send to chosen tradie**. Ratings are backed by seeded reviews; unrated providers appear last.
2. Log in as the tradie you selected and open the lead, then accept it. Only the selected tradie receives this request. If they decline or the offer expires, refresh the member job page and choose another tradie. Refresh pages to see changes made in another browser; this copy does not use WebSockets.
3. Progress the job, submit the completion report, then switch back to the member to review it.
4. Log in as admin to inspect jobs, tradies, applications, disputes, and performance.
5. To show signup, create a new member, add a property, select a plan, and click **Simulate payment**. For a new tradie, submit the application, approve it as admin, then activate its plan.
6. Use **Forgot password** to demonstrate email: open `web/storage/logs/laravel.log` and use the reset link recorded there. Notification emails appear after the queue worker processes them.

Annual prices, discounts, acceptance windows, and job state transitions are retained. Web and mobile members choose their tradie from a location-filtered, rating-ranked list; premium plans do not boost this list. Location means the property suburb and the tradie’s configured service areas, with no map or geolocation service required. Unrated tradies appear last. Original automatic scoring remains only for legacy requests. A simulated checkout activates a one-year subscription without collecting card details or making a charge. Repeating the same checkout does not create another subscription. Plan switching, real invoices, automatic renewal charges, and payment-failure scenarios are not simulated. Cancel membership turns off renewal while retaining access for the existing period; the demo does not simulate end-of-year payment-provider webhooks.

## Pull an update

Stop `composer run dev`, then run from `web/`:

```sh
git pull --ff-only
composer install
npm ci
php artisan migrate
php artisan optimize:clear
npm run build
composer run dev
```

Keep your existing `.env`, app key, database, and uploads. Do not reseed on every update: seeding resets the demonstration accounts.

## Tests and checks

Create a second, disposable database named `tradie_demo_testing`, then copy `.env.testing.example` to `.env.testing` and fill in the MySQL connection details. Set its `APP_KEY` to the generated key from your local `.env`.

```sh
php artisan test
php vendor/bin/pint --test
npm run lint
npm run typecheck
npm run build
```

Tests force `DB_DATABASE=tradie_demo_testing` and recreate its tables. Never point testing credentials at a non-local server. The main `tradie_demo` database is separate.

## Troubleshooting

- **Could not find driver:** enable `pdo_mysql` in the PHP CLI's `php.ini`; inspect `php --ini` and `php -m`.
- **Connection refused / access denied:** start MySQL and correct the five `DB_*` values in `.env`, then run `php artisan config:clear`.
- **Missing APP_KEY / Vite manifest:** run `php artisan key:generate` and `npm run build`.
- **Leads/emails do not advance:** keep `composer run dev` running. Inspect `php artisan queue:failed` and `storage/logs/laravel.log`.
- **Port 8000 is occupied:** stop the other app or change the serve command and `APP_URL` together.
- **Old pages after an update:** run `npm run build` and hard-refresh the browser.

## Repository layout

`web/` is the web demo. `apps/` contains the updated Kenyan member and fundi mobile apps, using shared code in `packages/`. See [Mobile setup and walkthrough](docs/MOBILE-DEMO.md) to run them; they are optional for the web demonstration. Root production deployment guides and `deploy/` are historical reference material; use this README for the demo. Do not run the original VPS deployment scripts for this copy.

See [docs/DEMO.md](docs/DEMO.md) for the implementation differences. This is a demonstration build with publicly documented test accounts, not a production deployment.


## Kenyan demo data

Run `php artisan db:seed` to install or refresh Kenyan demo fixtures without deleting existing jobs. The seed includes 24 example jobs, 21 reviews, eight fundi companies, saved providers and derived performance totals. Known demo profiles are updated; existing passwords are preserved. New accounts use `password`. Old Australian reference areas remain inactive to preserve existing job relationships.

Prices display as KSh and times use Africa/Nairobi. Existing numerical annual prices are illustrative placeholders (members: KSh 149/249/449; providers: KSh 499/999), not exchange-rate conversions or approved Kenyan prices. Payments and all contact details are for demonstration; no messages are sent externally. Location/postal values are representative fixtures, not a national address directory.

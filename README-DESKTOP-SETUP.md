# Desktop setup recovery — handoff to the receiving agent

Updated 27 November 2026. This is a recovery guide for the existing Windows Desktop checkout, not a new installation in another folder.

## Objective and existing state

Complete setup in this exact checkout:

```text
C:\Users\USER\OneDrive\Desktop\tradie-crud
```

Laravel lives in its `web` subdirectory. The owner explicitly wants to keep this Desktop checkout. Do not move it, clone another copy, delete it, reset Git changes, or recreate the database as a default fix. The database is already created. Its actual name, port and credentials must be checked on this computer; do not assume the author's local MySQL port 3308 or PHP path C:\php84 apply here.

Repository: https://github.com/ManyangMajok/tradie.git
Branch: **tradie-crud** (not main).

The receiving terminal is **Command Prompt (CMD)**. All command blocks below marked `bat` are CMD commands. Execute each line separately and inspect its result. Do not append a backslash to continue lines. If using PowerShell instead, translate deliberately; `%USERNAME%` and CMD `if` syntax do not work the same there.

## Confirmed errors and what has already been tried

1. `composer install` initially reported it could not find composer.json. The command belongs in `tradie-crud\web`, not the repository root.
2. `php artisan key:generate` then failed:

```text
The C:\Users\USER\OneDrive\Desktop\tradie-crud\web\bootstrap\cache directory must be present and writable.
```

The screenshot wraps `bootstrap` across lines; this is not evidence that the directory name contains a space or newline.

3. A suggested `New-Item` command failed with “not recognised as an internal or external command” because the user was in CMD, not PowerShell. Do not repeat that command in CMD.
4. The following diagnostic was actually run:

```bat
php -r "var_dump(getcwd(), is_dir('bootstrap/cache'), is_writable('bootstrap/cache'));"
```

Its confirmed output was:

```text
string(45) "C:\Users\USER\OneDrive\Desktop\tradie-crud\web"
bool(true)
bool(false)
```

**The directory exists at the correct path, but that PHP process reports it as not writable.** Creating it repeatedly is not a diagnosis.

5. This permission grant was run:

```bat
icacls "bootstrap\cache" /grant "%USERDOMAIN%\%USERNAME%:(OI)(CI)M"
```

CMD reported `Successfully processed 1 files; Failed processing 0 files`. Despite that, `php artisan key:generate` still reported the same error. A successful ACL command does not prove PHP now sees a writable directory.

6. `attrib -R "bootstrap\cache"` was suggested earlier, but there is no confirmed output proving it was executed or resolved anything. Inspect attributes rather than assume they were cleared.
7. Moving/cloning outside OneDrive was suggested, but the owner rejected changing the location. OneDrive is a possible factor, **not a confirmed root cause**.

## First: pull the handoff into the existing checkout

```bat
cd /d "C:\Users\USER\OneDrive\Desktop\tradie-crud"
git status --short
git branch --show-current
git remote -v
```

Confirm the remote and branch above. Preserve local edits, especially .env, uploaded files and any database data. If this is already `tradie-crud`, pull:

```bat
git pull --ff-only origin tradie-crud
cd web
dir composer.json
```

If on another branch, inspect changes before switching to `tradie-crud`. Do not merge the CRUD branch into main merely to obtain these instructions. If pull cannot fast-forward, inspect the divergence; do not force-reset.

## Diagnose the failure before running more Artisan commands

This repository tracks `web/bootstrap/cache/.gitignore` and the storage directory placeholders. They are not intentionally missing from Git.

In Laravel's installed `vendor/laravel/framework/src/Illuminate/Foundation/PackageManifest.php`, the manifest writer checks `is_writable(dirname($this->manifestPath))` before writing. The observed error happens during framework boot, before key generation can finish. **Do not edit vendor code or bypass that check.**

Run from the existing `web` directory:

```bat
whoami
where php
php -v
php --ini
where composer
composer --version
node --version
npm --version
git --version
attrib "bootstrap\cache"
icacls "bootstrap\cache"
icacls "bootstrap"
php -r "clearstatcache(); var_dump(PHP_BINARY, getcwd(), realpath('bootstrap/cache'), is_dir('bootstrap/cache'), is_writable('bootstrap/cache'), ini_get('open_basedir'));"
```

Check for multiple PHP installations, the actual CLI php.ini, a restrictive `open_basedir`, read-only directory attributes, inherited deny rules, and the effective logged-in Windows identity. The app requires PHP 8.4+ for its locked dependencies, Composer 2, Node 22.13+ and MySQL 8.4. Do not use `--ignore-platform-reqs` to suppress a dependency mismatch.

Now test an actual PHP write without Laravel. This creates a uniquely named empty probe in the target directory and removes only that probe if creation succeeds:

```bat
php -r "$p='bootstrap/cache/agent-write-probe-'.bin2hex(random_bytes(4)).'.tmp'; $h=fopen($p,'x'); var_dump($h!==false); if($h){fclose($h); unlink($p);}"
```

Record the exact PHP warning/error if it fails. Do not suppress warnings. Do not print .env contents, application keys or database passwords in reports.

### Interpret the evidence and repair only the demonstrated cause

- **Directory has a read-only attribute:** clear that attribute on this directory, then rerun the PHP probes in a new PHP process:

```bat
attrib -R "bootstrap\cache"
```

- **ACL/identity mismatch:** compare `whoami`, the ACL and the identity receiving the earlier grant. Grant Modify only to the correct current user on the required project directories if needed. An inherited deny is not fixed by blindly repeating an allow grant. Inspect its source. Do not grant Everyone Full Control, change drive-wide ACLs, or take ownership recursively of OneDrive.
- **PHP reports false but the actual write succeeds:** inspect Windows directory attributes and PHP version/configuration. This distinction matters because Laravel checks `is_writable` first. Do not declare success from the file write alone.
- **OneDrive placeholder/sync issue:** inspect the folder's sync status. If files are online-only, use “Always keep on this device” for this project and let hydration finish. Keep the project at its existing path.
- **Windows security/Controlled Folder Access:** check Protection History for an actual block against the PHP executable reported above. Only if a block is confirmed, use the narrow app exception appropriate for that trusted PHP installation and the owner's permissions. Do not disable antivirus or broad folder protection as a shortcut.
- **Probe passes but Artisan still fails:** capture the new full error path and stack. Check `APP_PACKAGES_CACHE`, `APP_SERVICES_CACHE`, `APP_CONFIG_CACHE`, `APP_ROUTES_CACHE` and `APP_EVENTS_CACHE` overrides in the process environment or .env locally. Confirm the path Laravel is checking is the same directory being tested. Inspect writable/read-only status of generated manifest files too. Never delete .gitignore or change vendor code to hide the issue.

Do not repeat successful permission commands without new evidence. Verify the cause and retest after each targeted change. If elevated access or a Windows UI action is genuinely required, explain precisely what is blocked and why, rather than making broad system changes.

**Gate before continuing:** `is_dir` and `is_writable` both return true, and the PHP write probe succeeds. Also verify these existing runtime directories are present and writable:

```text
storage/app/private
storage/app/public
storage/framework/cache/data
storage/framework/sessions
storage/framework/views
storage/logs
```

Create only missing directories; apply any permissions correction narrowly to the paths that actually fail. Cache files are generated, but user uploads and logs may contain useful data—do not clear storage wholesale.

## Resume setup at the failed step

Remain in `C:\Users\USER\OneDrive\Desktop\tradie-crud\web`.

### Check environment and dependencies

Preserve the current .env. Only if it is absent:

```bat
if not exist .env copy .env.example .env
```

Confirm locally that APP_ENV is local and that DB_CONNECTION=mysql plus DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME and DB_PASSWORD point to the **already created local database**. Start her existing MySQL service if stopped. Do not create a second database or import the author's database. Keep QUEUE_CONNECTION=database, MAIL_MAILER=log and the demo's simulated billing/local-storage configuration.

Run:

```bat
composer install
composer check-platform-reqs
npm ci
```

If Composer previously failed at `post-autoload-dump` / `artisan package:discover`, rerun `composer install` after fixing writability so those scripts complete. Do not leave setup in a `--no-scripts` workaround state. Do not use `composer update` or change dependency versions just to get this checkout running.

### Application key

Check locally whether APP_KEY already has a valid value, without printing it. If empty/missing on this fresh setup, run:

```bat
php artisan key:generate
```

Expected: `Application key set successfully`. If the key already exists, preserve it; do not rotate it unnecessarily. If cache writability fails again, return to the evidence-based diagnosis above.

### Database and frontend

```bat
php artisan config:clear
php artisan migrate:status
```

On an already created but empty database, “Migration table not found” at this step is expected; connection refusal or access denied is a different issue and must be corrected first.

```bat
php artisan migrate --seed
npm run build
php artisan optimize:clear
composer run dev
```

Migrations are incremental, and the demo seeders preserve existing passwords. Never run `migrate:fresh`, `db:wipe`, drop the database or overwrite existing data. Do not run the test suite against this app database; tests require the separate test database documented in the main README.

The default launcher starts the web server, MySQL-backed queue worker and scheduler. Keep its terminal open. Open the URL printed by Laravel, normally http://127.0.0.1:8000. The author's port 8002 is not mandatory on this computer. If the port is occupied, identify what owns it before stopping anything or intentionally select another port and align APP_URL.

## Acceptance checks and handoff report

Use shell/HTTP checks; do not control the browser without the owner's permission. The owner can perform the visual checks.

- Confirm the bootstrap/cache write probes and Composer scripts succeed under the same PHP executable used to run the app.
- Confirm the existing database is reachable, migrations are applied and assets are built.
- Confirm /login returns HTTP 200 and assets load, with no new application errors.
- Confirm the queue worker and scheduler stay running.
- Test the demo accounts: admin@tradify.dev, member@tradify.dev, tradie@tradify.dev; initial fixture password is `password`. Changed passwords are preserved, so do not reset them just because these defaults fail.
- Verify admin, client and fundi dashboard redirects. Owner can check map pins; internet is required for tiles, but property coordinates and list selection remain available without tiles.
- Report the **evidence-backed root cause**, exact targeted fix, PHP executable, checkout path/branch, running URL, checks passed and anything still blocked. Redact all secrets.

If the cause cannot be confirmed, report that honestly with the exact failing probe and message. Do not claim OneDrive or permissions were the cause merely because the path contains OneDrive or an ACL command succeeded.

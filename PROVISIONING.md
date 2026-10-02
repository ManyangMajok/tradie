# PROVISIONING.md — GoDaddy VPS Runbook

**This is the runbook for taking a fresh GoDaddy VPS to a live Tradify deployment.**

Read this file top-to-bottom before starting. Run commands in order. Don't skip steps.

Estimated time: **3–5 hours** end-to-end including DNS wait time. Active SSH time: ~2 hours.

---

## 0. Prerequisites

Before you start:

- [ ] GoDaddy VPS purchased (minimum **4 GB RAM / 2 vCPU / 80 GB SSD**, Ubuntu 24.04 LTS)
- [ ] Root SSH access credentials from GoDaddy
- [ ] Domain name (e.g., `tradify.au`) purchased and DNS manageable
- [ ] Stripe account (can be in test mode initially)
- [ ] Twilio account with trial or paid plan
- [ ] Resend account
- [ ] Sentry account (optional but recommended)
- [ ] A local machine with SSH and an SSH key pair (`~/.ssh/id_ed25519.pub`)

**Before starting the server work**, kick these off because they take time:
- [ ] Start the **Twilio alpha sender ID registration** for "Tradify" in Australia — this is carrier-approved and takes **1–2 weeks**. Don't wait until launch.
- [ ] Point your domain's **A record** at the VPS IP address in GoDaddy DNS. Propagation takes 15 minutes to 48 hours — start this before you SSH in.

---

## 1. First SSH login + security hardening

### 1.1 Log in as root

```bash
ssh root@YOUR_VPS_IP
```

You'll be prompted to change the root password if it's still the GoDaddy default. Do so. Use a strong password stored in a password manager.

### 1.2 Update the OS

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common ca-certificates gnupg lsb-release ufw fail2ban htop
```

Reboot if a kernel update happened:
```bash
[ -f /var/run/reboot-required ] && reboot
```

If you rebooted, SSH back in as root.

### 1.3 Create a non-root `deploy` user

```bash
adduser deploy
usermod -aG sudo deploy
```

Set a password when prompted. This is the user all deploys and daemons run as.

### 1.4 Set up SSH key auth for `deploy`

On your **local machine**, copy your public key up:
```bash
ssh-copy-id deploy@YOUR_VPS_IP
```

Or manually, on the VPS as root:
```bash
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
# Paste your public key (from ~/.ssh/id_ed25519.pub on your local machine)
nano /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

Test from your local machine:
```bash
ssh deploy@YOUR_VPS_IP
```

Should log in without a password.

### 1.5 Disable root SSH + password auth

Still as root, edit `/etc/ssh/sshd_config`:

```bash
nano /etc/ssh/sshd_config
```

Set (uncomment and change as needed):
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Reload SSH:
```bash
systemctl reload ssh
```

**Test before disconnecting** — open a second terminal and verify `ssh deploy@YOUR_VPS_IP` still works. Keep the root session open until you've confirmed, or you could lock yourself out.

### 1.6 Configure UFW firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Should show 22, 80, 443 open.

### 1.7 Configure Fail2ban

Fail2ban is installed; default config protects SSH out of the box.
```bash
systemctl enable --now fail2ban
systemctl status fail2ban
```

From this point forward, **log in as `deploy` and use `sudo`** for privileged commands.

---

## 2. Install the stack

From here on: `ssh deploy@YOUR_VPS_IP`.

### 2.1 PHP 8.3 + extensions

```bash
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y \
  php8.3-fpm php8.3-cli php8.3-common \
  php8.3-pgsql php8.3-redis php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-bcmath php8.3-intl php8.3-gd php8.3-zip \
  php8.3-opcache
```

Verify:
```bash
php -v           # should show 8.3.x
php -m | grep -E 'pgsql|redis|mbstring'  # should list all three
```

Edit `/etc/php/8.3/fpm/php.ini` and set production values:
```ini
memory_limit = 256M
upload_max_filesize = 20M
post_max_size = 25M
max_execution_time = 60
opcache.enable = 1
opcache.memory_consumption = 128
opcache.max_accelerated_files = 10000
opcache.validate_timestamps = 0    # revalidate disabled in prod; requires manual opcache flush on deploy
```

Edit `/etc/php/8.3/cli/php.ini` similarly (for artisan commands).

```bash
sudo systemctl restart php8.3-fpm
```

### 2.2 Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
composer --version
```

### 2.3 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # v20.x
npm --version
```

### 2.4 PostgreSQL 16

```bash
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16
```

Create the database and user:
```bash
sudo -u postgres psql <<EOF
CREATE DATABASE my_tradie;
CREATE USER my_tradie WITH ENCRYPTED PASSWORD 'CHANGE_ME_TO_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE my_tradie TO my_tradie;
\c my_tradie
GRANT ALL ON SCHEMA public TO my_tradie;
ALTER DATABASE my_tradie OWNER TO my_tradie;
EOF
```

**Save the password.** You'll need it in `.env`.

Configure Postgres to bind only to localhost (it does by default on 127.0.0.1, but confirm):
```bash
sudo grep "listen_addresses" /etc/postgresql/16/main/postgresql.conf
# Should be: listen_addresses = 'localhost'
```

Enable and start:
```bash
sudo systemctl enable --now postgresql
sudo systemctl status postgresql
```

### 2.5 Redis 7

```bash
sudo apt install -y redis-server
```

Edit `/etc/redis/redis.conf`:
- Confirm `bind 127.0.0.1 ::1`
- Set `supervised systemd`
- Set `requirepass YOUR_STRONG_REDIS_PASSWORD`

```bash
sudo systemctl enable --now redis-server
redis-cli -a YOUR_STRONG_REDIS_PASSWORD ping   # should return PONG
```

### 2.6 Supervisor

```bash
sudo apt install -y supervisor
sudo systemctl enable --now supervisor
```

### 2.7 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

Default welcome page should load at `http://YOUR_VPS_IP` (and at your domain if DNS has propagated).

### 2.8 Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

We'll issue the certificate **after** Nginx is configured for the app (§4).

---

## 3. Deploy the application

### 3.1 Prepare the deploy directory

```bash
sudo mkdir -p /var/www/tradify
sudo chown deploy:deploy /var/www/tradify
cd /var/www/tradify
```

### 3.2 Clone the repo

Set up an SSH deploy key for the repo (read-only is fine for pulling).

```bash
ssh-keygen -t ed25519 -C "deploy@tradify-vps" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Add that public key to your Git host as a read-only deploy key for the repo.

Clone:
```bash
cd /var/www/tradify
git clone git@github.com:YOUR_ORG/tradify.git current
cd current
```

We use `current` as the directory name so future symlinked-release deploys can plug in cleanly.

### 3.3 Install PHP dependencies

```bash
composer install --no-dev --optimize-autoloader --no-interaction
```

### 3.4 Set up `.env`

```bash
cp .env.example .env
nano .env
```

Fill in the production values. At minimum:

```
APP_NAME=Tradify
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tradify.au
APP_TIMEZONE=UTC

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=my_tradie
DB_USERNAME=my_tradie
DB_PASSWORD=<the password from §2.4>

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<the password from §2.5>

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=<generate a UUID or random string>
REVERB_APP_KEY=<generate>
REVERB_APP_SECRET=<generate>
REVERB_HOST=tradify.au
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8080

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"

STRIPE_KEY=pk_live_...
STRIPE_SECRET=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CASHIER_CURRENCY=aud

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=Tradify
TWILIO_STATUS_WEBHOOK_URL=https://tradify.au/webhooks/twilio/status

MAIL_MAILER=resend
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...
MAIL_FROM_ADDRESS=no-reply@tradify.au
MAIL_FROM_NAME="Tradify"

FILESYSTEM_DISK=local_private

SENTRY_LARAVEL_DSN=https://...@sentry.io/...
SENTRY_TRACES_SAMPLE_RATE=0.2

GOOGLE_MAPS_API_KEY=...
```

Generate APP_KEY:
```bash
php artisan key:generate
```

Generate the Reverb credentials with any random-string tool (e.g., `php -r "echo bin2hex(random_bytes(16));"` three times, or use `openssl rand -hex 16`).

### 3.5 Storage permissions

```bash
mkdir -p storage/app/private/jobs storage/app/private/completion storage/app/private/tradie-credentials
chmod -R 775 storage bootstrap/cache
```

Ensure `deploy` and `www-data` can both write:
```bash
sudo chown -R deploy:www-data storage bootstrap/cache
sudo chmod -R g+s storage bootstrap/cache
```

### 3.6 Database migrations + seeders

```bash
php artisan migrate --force
php artisan db:seed --class=SuburbSeeder --force
php artisan db:seed --class=TradieCategorySeeder --force
php artisan db:seed --class=IssueTypeSeeder --force
php artisan db:seed --class=MemberPlanSeeder --force
php artisan db:seed --class=TradiePlanSeeder --force
```

**Do NOT run `DevUserSeeder` in production.** It's guarded in code but also don't call it manually.

### 3.7 Front-end build

```bash
npm ci
npm run build
```

Builds assets into `public/build/`.

### 3.8 Cache everything

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 3.9 Verify

```bash
php artisan about
```

Should show Laravel 13, PostgreSQL connected, Redis connected, `storage/app/private` writable.

---

## 4. Nginx + SSL

### 4.1 Nginx server block

```bash
sudo nano /etc/nginx/sites-available/tradify
```

Paste:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tradify.au www.tradify.au;
    return 301 https://tradify.au$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tradify.au;

    root /var/www/tradify/current/public;
    index index.php;

    # SSL — Certbot fills these in §4.3
    ssl_certificate     /etc/letsencrypt/live/tradify.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradify.au/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    client_max_body_size 25M;

    # Reverb WebSocket proxy — MUST come before the fallthrough
    location /app {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://127.0.0.1:8080;
    }
    location /apps {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://127.0.0.1:8080;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    access_log /var/log/nginx/tradify_access.log;
    error_log /var/log/nginx/tradify_error.log;
}
```

### 4.2 Enable the site

```bash
sudo ln -sf /etc/nginx/sites-available/tradify /etc/nginx/sites-enabled/tradify
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t                # should be OK
```

**Don't reload Nginx yet** — SSL certs don't exist. Comment out the `ssl_certificate` lines temporarily, or:

### 4.3 Issue SSL certificate

```bash
sudo certbot --nginx -d tradify.au -d www.tradify.au
```

Follow the prompts. Certbot will:
1. Verify domain ownership via HTTP challenge
2. Fetch and install certificates
3. Update your Nginx config with correct `ssl_certificate` paths
4. Set up auto-renewal

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

Visit `https://tradify.au` — should show the "coming soon" page with a green lock.

---

## 5. Supervisor (Horizon + Reverb)

### 5.1 Create Supervisor config

```bash
sudo nano /etc/supervisor/conf.d/tradify.conf
```

Paste:
```ini
[program:tradify-horizon]
process_name=%(program_name)s
command=php /var/www/tradify/current/artisan horizon
autostart=true
autorestart=true
user=deploy
redirect_stderr=true
stdout_logfile=/var/www/tradify/current/storage/logs/horizon.log
stopwaitsecs=3600

[program:tradify-reverb]
process_name=%(program_name)s
command=php /var/www/tradify/current/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
user=deploy
redirect_stderr=true
stdout_logfile=/var/www/tradify/current/storage/logs/reverb.log
stopasgroup=true
killasgroup=true
```

### 5.2 Start the programs

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start tradify-horizon
sudo supervisorctl start tradify-reverb
sudo supervisorctl status
```

Both should show `RUNNING`.

### 5.3 Horizon dashboard access

Horizon's dashboard is at `/horizon`. It's gated by a Gate in `app/Providers/HorizonServiceProvider.php` — make sure it checks `$user->role === 'admin'`.

---

## 6. Cron (Laravel scheduler)

```bash
sudo crontab -u deploy -e
```

Add:
```
* * * * * cd /var/www/tradify/current && php artisan schedule:run >> /dev/null 2>&1
```

Test:
```bash
sudo -u deploy crontab -l
```

---

## 7. Backups

### 7.1 Set up an offsite backup destination

Options:
- **Backblaze B2** (10 GB free, then ~$6/TB) — `rclone` to it.
- **Cloudflare R2** (10 GB free, free egress) — `rclone` to it.
- **Second VPS** — `rsync` over SSH.

Configure `rclone`:
```bash
sudo apt install -y rclone
rclone config    # interactive setup for B2 or R2
```

### 7.2 Create the backup script

```bash
mkdir -p /var/www/tradify/deploy
nano /var/www/tradify/deploy/backup.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=/tmp/tradify-backup
DATE=$(date +%Y-%m-%d-%H%M)
RCLONE_REMOTE="tradify-backups:backups"   # change to your rclone remote

mkdir -p "$BACKUP_DIR"

# Dump Postgres
PGPASSWORD=YOUR_DB_PASSWORD pg_dump -h 127.0.0.1 -U my_tradie my_tradie \
    | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# Tar private storage
tar -czf "$BACKUP_DIR/files-$DATE.tar.gz" \
    -C /var/www/tradify/current/storage/app private/

# Push to remote
rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE" --include "*-$DATE.*"

# Clean up local
rm -f "$BACKUP_DIR"/*.gz

# Retention: delete remote files older than 30 days
rclone delete "$RCLONE_REMOTE" --min-age 30d
```

Secure it:
```bash
chmod +x /var/www/tradify/deploy/backup.sh
chmod 700 /var/www/tradify/deploy/backup.sh   # DB password is inside
```

Or better: store the password in an env file `root:root 600` and `source` it in the script.

### 7.3 Schedule the backup

```bash
sudo crontab -u deploy -e
```

Add:
```
0 2 * * * /var/www/tradify/deploy/backup.sh >> /var/log/tradify-backup.log 2>&1
```

### 7.4 TEST THE RESTORE

Non-negotiable. Do this before calling provisioning done.

```bash
# Download a backup
rclone copy tradify-backups:backups/db-<DATE>.sql.gz /tmp/

# Decompress and restore to a test database
gunzip /tmp/db-<DATE>.sql.gz
sudo -u postgres psql -c "CREATE DATABASE my_tradie_restore_test;"
PGPASSWORD=YOUR_DB_PASSWORD psql -h 127.0.0.1 -U my_tradie -d my_tradie_restore_test < /tmp/db-<DATE>.sql
sudo -u postgres psql -d my_tradie_restore_test -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql -c "DROP DATABASE my_tradie_restore_test;"
```

If that worked, backups are real.

---

## 8. Deploy script (for subsequent deploys)

```bash
nano /var/www/tradify/deploy/deploy.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/tradify/current

echo "→ Pulling latest main"
git fetch origin main
git reset --hard origin/main

echo "→ Installing composer dependencies"
composer install --no-dev --optimize-autoloader --no-interaction

echo "→ Installing npm dependencies + building assets"
npm ci
npm run build

echo "→ Running migrations"
php artisan migrate --force

echo "→ Caching config/routes/views/events"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "→ Clearing opcache"
# Because opcache.validate_timestamps = 0, we need to explicitly flush it.
# Simplest: restart php-fpm
sudo systemctl reload php8.3-fpm

echo "→ Restarting Horizon + Reverb"
sudo supervisorctl restart tradify-horizon
sudo supervisorctl restart tradify-reverb

echo "✓ Deploy complete"
```

```bash
chmod +x /var/www/tradify/deploy/deploy.sh
```

The `sudo supervisorctl` and `sudo systemctl` calls require `deploy` to have passwordless sudo for **those specific commands only**. Add this to sudoers:

```bash
sudo visudo -f /etc/sudoers.d/deploy-nopasswd
```

Paste:
```
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload php8.3-fpm, /usr/bin/supervisorctl restart tradify-horizon, /usr/bin/supervisorctl restart tradify-reverb
```

Save, then `sudo -u deploy /var/www/tradify/deploy/deploy.sh` should run without password prompts.

### 8.1 Deploy workflow going forward

From your laptop:

```bash
git push origin main
ssh deploy@tradify.au
/var/www/tradify/deploy/deploy.sh
```

Or set up a GitHub Action that SSHes in and runs `deploy.sh` on push to `main`. (Phase 2 nice-to-have.)

---

## 9. Monitoring

### 9.1 UptimeRobot (free)

1. Sign up at uptimerobot.com.
2. Add a monitor: HTTP(s), URL = `https://tradify.au`, interval = 5 minutes.
3. Add a monitor for the Horizon health: `https://tradify.au/up` (Laravel 11+ has `/up` by default).
4. Set up an email or SMS alert contact.

### 9.2 Sentry test

On the VPS:
```bash
cd /var/www/tradify/current
php artisan sentry:test
```

Check the Sentry dashboard for the test event. If it doesn't appear, check `SENTRY_LARAVEL_DSN` in `.env` and re-run `php artisan config:cache`.

### 9.3 Disk and memory

Install a lightweight monitor like `netdata` if you want per-minute graphs:
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Access at `http://YOUR_VPS_IP:19999`. **Firewall off external access** — bind to localhost or use SSH tunnel.

---

## 10. Post-provisioning checklist

Final smoke tests before declaring the VPS ready:

- [ ] `https://tradify.au` loads over HTTPS with green lock
- [ ] `curl -v https://tradify.au/up` returns 200
- [ ] `sudo supervisorctl status` shows both Horizon and Reverb RUNNING
- [ ] `sudo systemctl status nginx php8.3-fpm postgresql redis-server` all `active`
- [ ] `sudo ufw status` shows 22, 80, 443 only (no 5432 or 6379)
- [ ] SSH as root rejected; SSH as `deploy` works with key auth
- [ ] `psql` as `my_tradie` user succeeds with password
- [ ] `redis-cli -a PASSWORD ping` returns PONG
- [ ] Register a test user through the website → lands in DB
- [ ] Reverb WebSocket connection succeeds (browser dev tools, network tab → WS)
- [ ] Send a test Resend email → arrives in inbox
- [ ] Send a test Twilio SMS → arrives on phone
- [ ] Sentry receives test exception
- [ ] Backup cron ran successfully overnight (check `/var/log/tradify-backup.log`)
- [ ] UptimeRobot monitor green

If all green → the VPS is production-ready. Welcome to ops.

---

## 11. Common failures and fixes

### "502 Bad Gateway" from Nginx
- Check `sudo systemctl status php8.3-fpm`
- Check socket path matches in Nginx config: `/var/run/php/php8.3-fpm.sock`
- Check Nginx error log: `sudo tail /var/log/nginx/tradify_error.log`

### "Connection refused" on Postgres
- Check Postgres is running: `sudo systemctl status postgresql`
- Check `pg_hba.conf` allows `local md5` for the `my_tradie` user
- Check `postgresql.conf` listens on `localhost`

### Reverb WebSocket failing in browser
- Check `sudo supervisorctl status tradify-reverb` — should be RUNNING
- Check browser hits `wss://tradify.au/app/...` — if `ws://` not `wss://`, `REVERB_SCHEME` is wrong
- Check Nginx `/app` and `/apps` proxy blocks come BEFORE the `location /` fallthrough
- Check `QUEUE_CONNECTION=redis` in `.env`, not `sync`

### Horizon not processing jobs
- Check `sudo supervisorctl tail tradify-horizon stderr`
- Check Redis connection: `redis-cli -a PASSWORD ping`
- Check `QUEUE_CONNECTION=redis` in `.env`

### Emails not sending
- Check Resend domain is verified (dashboard should show green)
- Check DNS has fully propagated (use `dig TXT tradify.au` — SPF should be visible)
- Check `storage/logs/laravel.log` for transport errors
- Check `MAIL_MAILER=resend` and `RESEND_API_KEY` are set

### SMS not sending
- Check Twilio account isn't in trial mode (trial can only send to verified numbers)
- Check alpha sender ID "Tradify" is approved for Australia
- Check `storage/logs/laravel.log` for Twilio API errors

### "Class Resend\\Laravel\\... not found"
- Run `composer install --no-dev --optimize-autoloader`
- Run `php artisan package:discover`
- Run `php artisan config:cache`

---

## 12. What's intentionally NOT in this runbook

- **Zero-downtime deployments.** MVP uses an in-place `git reset --hard`, which causes a 2–5 second hiccup. Phase 2 can add symlinked-release deploys (Deployer-style).
- **Automated CI deploys.** The `deploy.sh` is run manually (or via a GitHub Action you set up). Fine at MVP.
- **Database replication / high availability.** Single DB, nightly backups. Upgrade when scale demands.
- **Horizontal scaling.** Single VPS. Horizontal scale is Phase 2+.
- **Staging environment.** Build one separately when you need it. Instructions in this file apply to any Ubuntu 24.04 VPS.
- **Container orchestration.** We're not using Docker in prod on purpose — simpler ops at this scale.

---

## 13. When you need to rebuild

If the VPS dies and you need to start over:

1. Stand up a new VPS (same specs).
2. Run through sections 1–5 of this runbook.
3. Restore the latest DB backup:
   ```bash
   rclone copy tradify-backups:backups/db-LATEST.sql.gz /tmp/
   gunzip /tmp/db-LATEST.sql.gz
   PGPASSWORD=... psql -h 127.0.0.1 -U my_tradie my_tradie < /tmp/db-LATEST.sql
   ```
4. Restore files:
   ```bash
   rclone copy tradify-backups:backups/files-LATEST.tar.gz /tmp/
   tar -xzf /tmp/files-LATEST.tar.gz -C /var/www/tradify/current/storage/app/
   ```
5. Update DNS A record to new IP.
6. Reissue SSL via Certbot.
7. Test.

Realistic rebuild time: 2 hours if you've done it once before.

---

**End of PROVISIONING.md.** Keep this file in sync with the actual state of the server. If you change a config, update this file in the same commit.

#!/usr/bin/env bash
# Production deploy — in-place git reset pattern (see PROVISIONING.md §8).
# Zero-downtime symlinked-release deploys are Phase 2.
# Run as: deploy@tradify-vps  /var/www/tradify/deploy/deploy.sh
set -euo pipefail

APP_DIR=/var/www/tradify/current
ROLLBACK_FILE=/var/www/tradify/.rollback_sha
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "$LOG_PREFIX $*"; }

# ── 0. Save rollback point ────────────────────────────────────────────────────
log "→ Saving rollback point"
git -C "$APP_DIR" rev-parse HEAD > "$ROLLBACK_FILE"

# ── 1. Maintenance mode ───────────────────────────────────────────────────────
log "→ Enabling maintenance mode"
php "$APP_DIR/artisan" down --retry=10 --refresh=10

# Ensure we always bring the site back up, even if something below fails.
trap 'php "$APP_DIR/artisan" up; log "⚠ Deploy failed — maintenance mode lifted"' ERR

# ── 2. Pull latest code ───────────────────────────────────────────────────────
log "→ Pulling latest main"
git -C "$APP_DIR" fetch origin main
git -C "$APP_DIR" reset --hard origin/main

# ── 3. PHP dependencies ───────────────────────────────────────────────────────
log "→ Installing Composer dependencies"
composer install --no-dev --optimize-autoloader --no-interaction \
    --working-dir="$APP_DIR"

# ── 4. Front-end build ────────────────────────────────────────────────────────
log "→ Installing npm dependencies + building assets"
cd "$APP_DIR"
npm ci
npm run build

# ── 5. Database migrations ────────────────────────────────────────────────────
log "→ Running migrations"
php "$APP_DIR/artisan" migrate --force

# ── 6. Application cache ──────────────────────────────────────────────────────
log "→ Caching config / routes / views / events"
php "$APP_DIR/artisan" config:cache
php "$APP_DIR/artisan" route:cache
php "$APP_DIR/artisan" view:cache
php "$APP_DIR/artisan" event:cache

# ── 7. Opcache flush ──────────────────────────────────────────────────────────
# opcache.validate_timestamps = 0 in prod — must explicitly flush on deploy.
log "→ Reloading PHP-FPM (opcache flush)"
sudo systemctl reload php8.3-fpm

# ── 8. Restart queue workers ──────────────────────────────────────────────────
log "→ Restarting Horizon + Reverb"
sudo supervisorctl restart tradify-horizon
sudo supervisorctl restart tradify-reverb

# ── 9. Bring site back up ─────────────────────────────────────────────────────
trap - ERR
php "$APP_DIR/artisan" up

log "✓ Deploy complete"

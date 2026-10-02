#!/usr/bin/env bash
# Rollback to the commit that was live before the last deploy.
# Run as: deploy@tradify-vps  /var/www/tradify/deploy/rollback.sh
#
# WARNING: This reverts PHP/JS code only. DB migrations are NOT reversed.
# Only roll back if bad code (not a bad migration) caused the incident.
set -euo pipefail

APP_DIR=/var/www/tradify/current
ROLLBACK_FILE=/var/www/tradify/.rollback_sha
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "$LOG_PREFIX $*"; }

# ── Guard: rollback point must exist ─────────────────────────────────────────
if [[ ! -f "$ROLLBACK_FILE" ]]; then
    echo "No rollback point found at $ROLLBACK_FILE." >&2
    echo "deploy.sh must be run at least once before rollback is available." >&2
    exit 1
fi

ROLLBACK_SHA=$(cat "$ROLLBACK_FILE")
CURRENT_SHA=$(git -C "$APP_DIR" rev-parse HEAD)

log "Current : $CURRENT_SHA"
log "Rollback: $ROLLBACK_SHA"
echo ""
echo "NOTE: DB schema stays at the current (migrated) version."
echo ""
read -rp "Roll back? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# ── 1. Maintenance mode ───────────────────────────────────────────────────────
log "→ Enabling maintenance mode"
php "$APP_DIR/artisan" down --retry=10 --refresh=10

trap 'php "$APP_DIR/artisan" up; log "⚠ Rollback failed — maintenance mode lifted"' ERR

# ── 2. Revert code ────────────────────────────────────────────────────────────
log "→ Reverting to $ROLLBACK_SHA"
git -C "$APP_DIR" reset --hard "$ROLLBACK_SHA"

# ── 3. Rebuild dependencies (may differ between commits) ─────────────────────
log "→ Installing Composer dependencies"
composer install --no-dev --optimize-autoloader --no-interaction \
    --working-dir="$APP_DIR"

log "→ Installing npm dependencies + building assets"
cd "$APP_DIR"
npm ci
npm run build

# ── 4. Re-cache ───────────────────────────────────────────────────────────────
log "→ Caching config / routes / views / events"
php "$APP_DIR/artisan" config:cache
php "$APP_DIR/artisan" route:cache
php "$APP_DIR/artisan" view:cache
php "$APP_DIR/artisan" event:cache

# ── 5. Opcache + services ─────────────────────────────────────────────────────
log "→ Reloading PHP-FPM"
sudo systemctl reload php8.3-fpm

log "→ Restarting Horizon + Reverb"
sudo supervisorctl restart tradify-horizon
sudo supervisorctl restart tradify-reverb

# ── 6. Bring site back up ─────────────────────────────────────────────────────
trap - ERR
php "$APP_DIR/artisan" up

# Remove the rollback point so we don't accidentally roll back a second time.
rm -f "$ROLLBACK_FILE"

log "✓ Rollback complete — running $ROLLBACK_SHA"

#!/usr/bin/env bash
# Manual DB + file backup trigger.
# Scheduled automatically at 02:00 daily via cron (see PROVISIONING.md §7.3).
# Run manually any time: deploy@tradify-vps  /var/www/tradify/deploy/backup-now.sh
set -euo pipefail

APP_DIR=/var/www/tradify/current
ENV_FILE="$APP_DIR/.env"
DATE=$(date +%Y-%m-%d-%H%M)
BACKUP_DIR="/tmp/tradify-backup-$DATE"
RETAIN_DAYS=30
RCLONE_REMOTE="tradify-backups:backups"   # update to your rclone remote name
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "$LOG_PREFIX $*"; }

# ── Parse DB credentials from app .env ───────────────────────────────────────
# Strips surrounding quotes if present.
env_val() { grep -E "^${1}=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^["'"'"']//;s/["'"'"']$//'; }

DB_HOST="${DB_HOST:-$(env_val DB_HOST)}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-$(env_val DB_PORT)}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="$(env_val DB_DATABASE)"
DB_USERNAME="$(env_val DB_USERNAME)"
DB_PASSWORD="$(env_val DB_PASSWORD)"

if [[ -z "$DB_DATABASE" || -z "$DB_USERNAME" || -z "$DB_PASSWORD" ]]; then
    echo "Could not parse DB credentials from $ENV_FILE" >&2
    exit 1
fi

# ── Create temp directory ─────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
trap 'rm -rf "$BACKUP_DIR"' EXIT

# ── 1. Dump PostgreSQL ────────────────────────────────────────────────────────
log "→ Dumping database ($DB_DATABASE)"
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USERNAME" \
    --no-password \
    "$DB_DATABASE" \
    | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

log "   DB dump size: $(du -sh "$BACKUP_DIR/db-$DATE.sql.gz" | cut -f1)"

# ── 2. Archive private storage ────────────────────────────────────────────────
log "→ Archiving private storage"
if [[ -d "$APP_DIR/storage/app/private" ]]; then
    tar -czf "$BACKUP_DIR/files-$DATE.tar.gz" \
        -C "$APP_DIR/storage/app" private/
    log "   Files archive size: $(du -sh "$BACKUP_DIR/files-$DATE.tar.gz" | cut -f1)"
else
    log "   No private/ directory found — skipping file archive"
fi

# ── 3. Upload to remote ───────────────────────────────────────────────────────
log "→ Uploading to $RCLONE_REMOTE"
rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE"

# ── 4. Enforce retention policy ───────────────────────────────────────────────
log "→ Deleting remote files older than ${RETAIN_DAYS} days"
rclone delete "$RCLONE_REMOTE" --min-age "${RETAIN_DAYS}d"

log "✓ Backup complete — $DATE"

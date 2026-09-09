#!/usr/bin/env bash
set -euo pipefail
SOURCE="${TEAM_DRSA_STORAGE_DIR:-/var/lib/team-drsa-website}"
DEST="${TEAM_DRSA_BACKUP_DIR:-/var/backups/team-drsa-website}"
mkdir -p "$DEST"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
tar -C "$SOURCE" -czf "$DEST/team-drsa-data-$stamp.tar.gz" .
find "$DEST" -type f -name 'team-drsa-data-*.tar.gz' -mtime +30 -delete
printf 'Backup created: %s\n' "$DEST/team-drsa-data-$stamp.tar.gz"

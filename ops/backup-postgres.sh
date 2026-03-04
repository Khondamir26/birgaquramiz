#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/birgaquramiz/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
TARGET_FILE="${BACKUP_DIR}/birga_quramiz_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is not installed. Install postgresql-client first." >&2
  exit 1
fi

pg_dump "${DATABASE_URL}" | gzip -c > "${TARGET_FILE}"

find "${BACKUP_DIR}" -type f -name '*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "Backup created: ${TARGET_FILE}"

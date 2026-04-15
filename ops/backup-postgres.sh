#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/birgaquramiz/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
HUMAN_DATE="$(TZ=Asia/Tashkent date +'%d %B %Y, %H:%M')"
TARGET_FILE="${BACKUP_DIR}/birga_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is not installed. Install postgresql-client first." >&2
  exit 1
fi

pg_dump "${DATABASE_URL}" | gzip -c > "${TARGET_FILE}"

find "${BACKUP_DIR}" -type f -name '*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "Backup created: ${TARGET_FILE}"

# ── Telegram upload ──────────────────────────────────────────────────────────
# Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in env to enable.
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
  FILE_SIZE=$(du -sh "${TARGET_FILE}" | cut -f1)
  CAPTION="🗄 Birga Quramiz — Database Backup

📅 ${HUMAN_DATE}
📦 Size: ${FILE_SIZE}"

  HTTP_CODE=$(curl -s -o /tmp/tg_response.json -w "%{http_code}" \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
    -F "chat_id=${TELEGRAM_CHAT_ID}" \
    -F "document=@${TARGET_FILE}" \
    -F "caption=${CAPTION}" \
    -F "parse_mode=Markdown")

  if [[ "${HTTP_CODE}" == "200" ]]; then
    echo "Telegram: backup uploaded successfully."
  else
    echo "Telegram: upload failed (HTTP ${HTTP_CODE})." >&2
    cat /tmp/tg_response.json >&2
  fi
else
  echo "Telegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping upload."
fi

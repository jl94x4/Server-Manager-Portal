#!/bin/sh
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Unraid appdata mounts are often root-owned; fix permissions before dropping privileges.
mkdir -p /app/config /app/backup /app/config/collexions/config /app/config/collexions/logs
chown -R "$PUID:$PGID" /app/config /app/backup

if command -v gosu >/dev/null 2>&1; then
  exec gosu "$PUID:$PGID" "$@"
fi
if command -v su-exec >/dev/null 2>&1; then
  exec su-exec "$PUID:$PGID" "$@"
fi

exec "$@"

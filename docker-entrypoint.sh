#!/bin/sh
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Unraid appdata mounts are often root-owned; fix permissions before dropping privileges.
mkdir -p /app/config /app/backup
chown -R $PUID:$PGID /app/config /app/backup

exec su-exec $PUID:$PGID "$@"

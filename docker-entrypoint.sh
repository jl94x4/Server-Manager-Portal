#!/bin/sh
set -e

# Unraid appdata mounts are often root-owned; fix permissions before dropping privileges.
mkdir -p /app/config /app/backup
chown -R node:node /app/config /app/backup

exec su-exec node "$@"

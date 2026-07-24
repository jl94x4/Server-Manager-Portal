# Scanner

**Scanner** is an admin-only, Autoscan-inspired library refresh built into the portal. It does **not** require a separate Autoscan container.

## What it does

1. Receives Sonarr / Radarr / Lidarr webhooks (and manual paths).
2. Rewrites paths as configured.
3. Queues folder scans with a configurable **minimum age**.
4. Sends partial library refreshes to **Plex**, **Jellyfin**, and/or **Emby**.

## Enable

1. Open **Settings → Scanner**.
2. Turn **Enable Scanner** on.
3. Set webhook username/password (required for `/triggers/*`).
4. Configure trigger rewrites and enable targets (portal credentials or overrides).
5. Save Settings, then open **Scanner** in the nav.

Optional: paste an Autoscan `config.yml` into **Import Autoscan config.yml** to prefill settings.

## Manual scan

On the Scanner page, enter a filesystem path and click **Submit**. The path is added to the queue and processed after the minimum age (and after path existence checks if that toggle is on).

## ARR Connect

For each *arr app:

1. Settings → Connect → Webhook
2. On Import + On Upgrade
3. URL examples (same host as the portal):
   - `/triggers/sonarr`
   - `/triggers/radarr`
   - `/triggers/lidarr`
4. Username / password = Scanner webhook credentials

## Notes

- Webhooks use **HTTP Basic Auth**, not portal login cookies.
- Plex scans use the **token and server URL from Settings → Plex** (no separate Scanner token).
- Leave **Verify path exists** off unless the portal container can see your media paths.
- Queue and activity logs live under `config/scanner/`.

## Related

- [Calendar](/features/calendar)
- [Integrations](/guide/integrations)
- [Configuration](/guide/configuration)

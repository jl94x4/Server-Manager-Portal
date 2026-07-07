# Configuration

Most configuration is managed from the browser in Settings. Environment variables cover process-level behavior and secrets needed before the UI can load.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_SECRET` | Yes | Session signing secret. Must be at least 32 characters. |
| `PUID` | No | User ID used by the container entrypoint. Defaults to `1000`; Unraid commonly uses `99`. |
| `PGID` | No | Group ID used by the container entrypoint. Defaults to `1000`; Unraid commonly uses `100`. |
| `PORT` | No | Listen port. Defaults to `2121`. |
| `BIND_HOST` | No | Bind address. Defaults to `0.0.0.0`. |
| `CONFIG_DIR` | No | Runtime data directory. Defaults to `./config` locally and `/app/config` in Docker. |
| `PUBLIC_BASE_URL` | Recommended | Public URL for links and emails. Include the subpath if the app is not hosted at the domain root. |
| `BASE_PATH` | No | URL prefix when hosted under a subpath, such as `/portal`. |
| `FORCE_SECURE_COOKIES` | Recommended for HTTPS | Set to `true` when the portal is served over HTTPS. |
| `ALLOW_PRIVATE_INTEGRATION_URLS` | No | Allows private/LAN URLs when saving integration settings. |
| `SETUP_TOKEN` | No | Enables remote first-time setup with an explicit token. |
| `CLIENT_ID` | No | Fixed Plex OAuth client id. Auto-generated if unset. |

See `.env.example` for the full template.

## Settings UI

Important browser-managed settings include:

| Area | What You Configure |
| --- | --- |
| Media Player | Plex or Jellyfin mode |
| Plex | Admin token, selected server, optional direct server URL |
| Jellyfin | Server URL, API key, login behavior, Quick Connect |
| Analytics | Tautulli for Plex or JellyStat for Jellyfin |
| Branding and UI | Logo, splash assets, accent colors, default theme |
| Access | Temporary access length, expiry rules, inactivity cleanup |
| SMTP | Host, port, username, password, sender address |
| Newsletters | Weekly or monthly schedule and content behavior |
| Home Layout | Section ordering and visibility |
| Media Stack | Sonarr and Radarr URLs and API keys |
| Status Page | Public service checks and health URLs |

## Security Defaults

The server refuses to start without a strong `JWT_SECRET`.

Session cookies are `httpOnly` and use `sameSite: lax`. Set `FORCE_SECURE_COOKIES=true` only when the app is served over HTTPS, typically behind a reverse proxy.

Admin-only API routes require an authenticated admin session. Plex admins are verified through server ownership, and Jellyfin admins are verified through Jellyfin policy data.

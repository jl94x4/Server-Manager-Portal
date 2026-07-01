# Unraid template

Install **Server Manager Portal** on Unraid using the Community Applications template XML in this folder.

## Install from template URL (recommended)

1. In Unraid, open **Docker** → **Add Container**.
2. Set **Template URL** to:

   ```
   https://raw.githubusercontent.com/jl94x4/Server-Manager-Portal/main/unraid/server-manager-portal.xml
   ```

3. Click **Add** and fill in:
   - **JWT Secret** — at least 32 characters (required)
   - **Config / Backup directories** — defaults use `/mnt/user/appdata/server-manager-portal/`
   - **Public Base URL** + **Force Secure Cookies** — if using a reverse proxy with HTTPS
   - **Allow Private Integration URLs** — `true` for LAN Sonarr/Radarr/Tautulli
4. Apply and open the **WebUI** link. Sign in with your Plex admin account.

## Troubleshooting

### `EACCES: permission denied, open '/app/config/config.json'`

Unraid creates appdata folders as root. Current images include an entrypoint that `chown`s `/app/config` and `/app/backup` on startup. **Pull the latest image** and recreate the container.

If you are on an older image, stop the container and run:

```bash
chown -R 1000:1000 /mnt/user/appdata/server-manager-portal/
```

Then start the container again.

## Container image

The template pulls `ghcr.io/jl94x4/server-manager-portal:latest`, built automatically on each push to `main` via GitHub Actions.

If the image is not available yet, build locally on your Unraid server:

```bash
git clone https://github.com/jl94x4/Server-Manager-Portal.git
cd Server-Manager-Portal
docker build -t ghcr.io/jl94x4/server-manager-portal:latest .
```

Then install from the template and ensure the **Repository** field matches that image name.

## Submit to Community Applications

This repository includes `ca_profile.xml` at the root and the template under `unraid/`. To list the app in the official Community Applications store:

1. Ensure the repo is public with a valid `LICENSE`.
2. Visit [ca.unraid.net/submit/new](https://ca.unraid.net/submit/new).
3. Submit `https://github.com/jl94x4/Server-Manager-Portal`.
4. Run **Validate** and **Scan** until all checks pass.

## Migrating existing data

If you previously ran the portal outside Docker, copy your JSON files into the **Config Directory** path (e.g. `/mnt/user/appdata/server-manager-portal/config/`). On first startup the app also migrates any legacy files left in the project root.

# Docker Deployment

Docker is the recommended production path because it keeps runtime data in explicit mounted directories.

## Prebuilt Image

Images are published to GitHub Container Registry:

| Tag | When updated | Image |
| --- | --- | --- |
| `latest` | Every push to `main` and every release tag `v*` | `ghcr.io/jl94x4/server-manager-portal:latest` |
| `beta` | Every push to `beta` | `ghcr.io/jl94x4/server-manager-portal:beta` |
| `testing` | Every push to `testing` | `ghcr.io/jl94x4/server-manager-portal:testing` |
| `1.4.0` / `v1.4.0` | Matching GitHub release | `ghcr.io/jl94x4/server-manager-portal:1.4.0` |

Pin a version in Unraid or Docker Compose by replacing `:latest` with `:1.4.0` (or `:v1.4.0`).

Run the latest image:

```bash
docker run -d \
  --name server-manager-portal \
  -p 2121:2121 \
  -e JWT_SECRET="your-secret-at-least-32-chars" \
  -e FORCE_SECURE_COOKIES=true \
  -e PUBLIC_BASE_URL=https://portal.example.com \
  -v "$(pwd)/config:/app/config" \
  -v "$(pwd)/backup:/app/backup" \
  ghcr.io/jl94x4/server-manager-portal:latest
```

## Docker Compose

Copy the environment template:

```bash
cp .env.example .env
```

Set `JWT_SECRET` in `.env`, then build and start:

```bash
docker compose up -d --build
```

The portal listens on host port `2121` by default.

## Persistent Paths

| Host Path | Container Path | Purpose |
| --- | --- | --- |
| `./config` | `/app/config` | JSON settings, users, caches, and logs |
| `./backup` | `/app/backup` | Rolling backup snapshots |

## Common Commands

```bash
docker compose logs -f portal
docker compose up -d --build
docker compose down
```

To publish a different host port, set `PORT=8080` in `.env`. The Compose file maps the host value to container port `2121`.

## LAN Integrations

For Sonarr, Radarr, Tautulli, JellyStat, Seerr, Jellyseerr, or Ombi running on a private network, set:

```ini
ALLOW_PRIVATE_INTEGRATION_URLS=true
```

Use URLs reachable from inside the container. On Docker Desktop, `http://host.docker.internal:8989` is often useful. On Linux, use the host IP or a Docker network shared by the services.

## Unraid

Server Manager Portal includes an Unraid template at `unraid/server-manager-portal.xml`.

The template uses `ghcr.io/jl94x4/server-manager-portal:latest` and stores app data under `/mnt/user/appdata/server-manager-portal/` by default.

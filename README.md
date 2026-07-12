<div align="center">

<img src="static/logo.png" alt="Server Portal Logo" width="240" height="240" />

# Server Portal

**A premium, fully-automated management and analytics portal for Plex and Jellyfin media servers.**

Built with Node.js · Express · React · Tailwind CSS

[![View Documentation](https://img.shields.io/badge/View_Documentation-e5a00d?style=for-the-badge)](https://jl94x4.github.io/Server-Manager-Portal/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Plex](https://img.shields.io/badge/Plex-Media%20Server-orange.svg)](https://www.plex.tv/)
[![Jellyfin](https://img.shields.io/badge/Jellyfin-Media%20Server-00A4DC.svg)](https://jellyfin.org/)
[![Docker Image Size](https://ghcr-badge.egpl.dev/jl94x4/server-manager-portal/size?label=docker%20image%20size&color=blue)](https://github.com/jl94x4/Server-Manager-Portal/pkgs/container/server-manager-portal)
[![GitHub Stars](https://img.shields.io/github/stars/jl94x4/Server-Manager-Portal.svg?style=flat&logo=github&color=gold)](https://github.com/jl94x4/Server-Manager-Portal/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/jl94x4/Server-Manager-Portal.svg?style=flat&logo=github)](https://github.com/jl94x4/Server-Manager-Portal/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/jl94x4/Server-Manager-Portal.svg?style=flat&logo=github&color=red)](https://github.com/jl94x4/Server-Manager-Portal/issues)

</div>

---

Server Portal is a self-hosted web application that turns your Plex or Jellyfin server into a fully managed streaming service. It handles everything from user onboarding and automated access management, to real-time analytics, live session monitoring, trending content discovery, Seerr-style media request review, and personalized wrap-ups for every user, all from one polished, mobile-first dashboard with a premium glass UI.

Once set up, users can sign in with Plex OAuth or Jellyfin authentication/Quick Connect to see their own portal, activity, and stats.

---
<img width="2294" height="1218" alt="image" src="https://github.com/user-attachments/assets/16d548fb-c07c-4967-bd39-12ffdfac45c0" />
<img width="1956" height="972" alt="image" src="https://github.com/user-attachments/assets/c15bb979-b759-4fa1-ae88-772f6a04e34b" />


## Feature Overview

### Personal Analytics & Wrap-Up

Every user gets a rich, personalized dashboard packed with insights about their own streaming habits. A **time-period filter** (7 / 30 / 60 / 90 / 180 / 365 days / All Time) updates every card simultaneously. Metadata is cached server-side and refreshed by a background job every **30 minutes** for near-instant filter switching.

| Card | What it shows |
|---|---|
| **Server Rank** | Your current rank on the server leaderboard, a progress bar showing your percentile, a mini-leaderboard showing the 2 users above/below you, and a "plays to climb" target to beat the person above you |
| **Total Streams** | Total play count with a visual breakdown by Movies / Episodes / Tracks (with %), daily average, unique titles, and a recent watch history list |
| **Top Binge** | Your most-watched TV show with its backdrop art, synopsis, and runner-up shows with posters |
| **Top Movie** | Your most-watched movie with its backdrop art, tagline, synopsis, release year, and runner-up movies |
| **Media Profile** | Your viewer personality type (Movie Buff, TV Show Binger, Music Lover, Mixed Bag) with colour-coded breakdown bars, percentage splits, and top 3 movies + top 3 shows |
| **Watch Style** | Discovery vs Rewatch analysis with a split progress bar and your top 5 most-rewatched titles |
| **Streaming Habit** | Weekday vs Weekend split bar chart, average plays per day, and habit label (Weekend Warrior, Weekday Streamer, Balanced) |
| **Top Library** | Your most-used media library with a full ranked breakdown of all libraries |
| **Top Day** | An animated bar chart showing your plays across all 7 days of the week, highlighting your peak day |
| **Peak Hours** | An animated hourly distribution chart showing what time of day you stream the most |
| **Time of Day** | Your streaming persona (Night Owl, Early Bird, Evening Streamer, Afternoon Watcher) with a contextual description |

All cards open into detailed modals loaded with contextual data, media artwork, and dynamic charts.

**Shareable wrap-up** - Export your personal wrap-up as a PNG image from the home dashboard. The share modal previews the real card grid and supports native share on supported devices, with download as a fallback.

**Paginated watch history** - Recently Watched and Your Most Watched use responsive pagination (18 items per page on desktop, 12 on mobile) so large libraries stay fast and readable.

---

### Admin Dashboard

A comprehensive control panel for the server owner:

- **Live Session Monitor** - Real-time view of all active streams with user avatar, media title, progress bar, stream type badge (Direct Play / Transcode), and a click-through technical modal showing video codec, audio codec, bitrate, channels, resolution, and transcode reason
- **User Management Table** - View all users with their Plex or Jellyfin avatar, username, email, access expiry date, last seen timestamp, and quick-action buttons (+1 Month, +1 Year, Unlimited, Revoke)
- **Server Leaderboard** - Server-wide play count rankings across all time periods, updated automatically in the background
- **Audit Log** - Timestamped record of all system actions (access granted, revoked, extended, expired)
- **Settings UI** - Configure every aspect of the portal from the browser without touching config files
- **Customizable Home Layout** - Reorder home page sections and show or hide whole blocks (Personal Wrap-Up, Main grid, Pending Requests, Recently / Most Watched, Recently Added) from **Settings → Home Layout**, with a live preview before saving. The main dashboard grid keeps a fixed balanced two-column layout so card heights stay aligned
- **Pending Requests Widget** - Surface open Seerr/Jellyseerr requests on the home dashboard with quick review actions, fanart-backed cards, and a count badge in the sidebar
- **Library Maintenance** - Scan libraries for missing or empty media, manage exclusions, and run cleanup tasks from the Maintenance page
- **Library Upgrader (Plex / Jellyfin)** — Find non-HEVC titles, browse a poster grid with codec/HDR badges, drill into show episodes, open Plex/Jellyfin or Sonarr/Radarr deep links, snooze titles, and optionally switch ARR quality profiles with search triggers (dry-run preview, bulk select, history tab, rate limits). Enable in **Settings → System → Library Upgrader**.

---

### Customizable Home Layout

Admins can tailor the home page for their community without editing code:

| Control | What it does |
|---|---|
| **Section order** | Drag and drop the major home sections into any order, including the Pending Requests block |
| **Section visibility** | Toggle each section Shown or Hidden with one click |
| **Live preview** | See exactly how the layout will look before you save |
| **Locked main grid** | Left and right dashboard columns stay balanced; individual widget order inside the grid is fixed to prevent uneven card heights |

Layout settings are saved server-wide, validated on the backend, and applied to every user on the next page load. Admin-only widgets (Quick Actions, Server Admin badge) cannot be hidden through layout tampering.

---

### Discover Page

A curated content discovery experience for all users, powered by server-wide watch history and live media activity:

**Live activity**
- Real-time stream summary cards (total streams, direct play, transcoding, bandwidth)
- Now playing cards with poster art, quality badges, player info, progress bar, and ETA
- Responsive layout: 3 stretched cards by default, up to 4 across on ultra-wide displays when 4 or more streams are active
- Activity refreshes every second while the page is open

**Recently added**
- Movies, TV shows, and music grids with poster quality badges
- 20 items per section on desktop and 12 on mobile by default
- 10-column poster grid on large screens
- Configurable limit dropdown (12, 20, 50, 100, 150, 200, 250 items) with preference saved in the browser

**Trending and community picks**
- **Trending This Week** - What the whole server has been watching in the last 7 days
- **Top Movies / Top Shows** - The most-played movies and shows over the past month
- **Weekend Warriors** - Content that spikes on Fridays, Saturdays, and Sundays
- **Night Owl Club** - Content most watched between midnight and 5am
- **All-Time Greats** - The highest play-count content ever on the server
- **Cult Classics** - Niche content with extremely high plays relative to its tiny viewer count
- **Blast from the Past** - Pre-2000 titles getting recent love

All discover items display server artwork, play counts, and quality badges (4K, HDR, AV1/HEVC, Atmos, and more). Trending and analytics caches are reused on startup when still fresh, so the portal loads quickly after restarts.

---

### Media Stack

Browse your Sonarr and Radarr activity directly inside the portal:

- **Release Calendar** - Upcoming TV episodes and movie releases with poster art, air dates, and grabbed/missing status
- **Active Queue** - Live download queue from Sonarr and Radarr with progress and status
- **Recent History** - Import and grab history across both services
- **Month Navigation** - Browse releases by month with auto-advance to the next month that has content
- **Smart ID Matching** - Uses IMDb, TMDB, and TVDB IDs to accurately map and display metadata

Configure Sonarr/Radarr URLs and API keys in **Settings → Media Stack**.

---

### Request Management

Review and approve media requests from Seerr, Jellyseerr, or Ombi without leaving the portal. Connect your request app in **Settings → Media Stack → Request App Integration** with the app URL and API key.

**Requests page (admin)**
- **Status tabs** - Pending, Failed, Approved, and Declined with live counts
- **Seerr-style cards** - Poster, requester, quality, folder, tags, seasons, and overview with faded fanart backdrops (poster fallback when no backdrop is available)
- **Review & Approve** - Full-screen modal with season picker, quality profile, root folder, language profile, tags, and request-as user override
- **Quick actions** - Approve, edit, decline, retry failed requests, and delete from the list
- **Rich metadata** - TMDB titles, posters, and backdrops enriched automatically from Seerr media data

**Home dashboard widget**
- **Pending Requests section** - Movable and hideable from **Settings → Home Layout**
- **Inline review** - Open the same approval modal directly from the dashboard widget
- **Wide layout support** - Two-column request cards on ultra-wide home layouts

---

### Library Upgrader

A powerful, built-in tool for server admins to identify and upgrade sub-optimal media in your library, fully integrated with your Sonarr and Radarr instances. Enable it in **Settings → System → Library Upgrader**.

**Core Capabilities:**
- **Advanced Media Filtering** - Index your entire library to easily filter and browse your media by codec, resolution, and size. Instantly locate H.264 files or check HDR availability per show, so you can easily upgrade to a different codec when you need to.
- **Deep ARR Integration** - Directly connects to your Sonarr and Radarr instances. Automatically matches Plex/Jellyfin items to their exact Radarr/Sonarr equivalents.
- **Multi-Instance Support** - Supports multiple Radarr/Sonarr instances simultaneously (e.g., separate 1080p and 4K instances) mapped to different libraries.
- **Smart Quality Profile Mapping** - Define default fallback and HEVC-target quality profiles per ARR instance so upgrades happen with a single click.

**Dashboard & Navigation:**
- **Rich Visual Grid** - Browse flagged movies and TV shows through a premium, responsive poster grid overlaid with real-time codec, resolution, size, and HDR badges.
- **Advanced Filtering & Sorting** - Filter by Codec (H.264, HEVC, AV1, VP9), Resolution (SD, 720p, 1080p, 4K), Quality (WebDL, Remux, Bluray), or special features (Missing HDR, Zero-byte files). Sort by size, watch count, or age.
- **Deep Episode Inspection** - Click into any TV show to open a detailed, season-by-season episode drawer showing exact file sizes, codecs, and current Sonarr custom formats/qualities for every individual episode.
- **Missing Episode Detection** - Instantly surfaces episodes that are in Plex but missing from Sonarr, or vice versa.

**Upgrade Actions:**
- **One-Click Upgrades** - Switch Sonarr/Radarr quality profiles directly from the portal and automatically trigger a search for the new quality.
- **Bulk Operations** - Select multiple movies or shows at once to upgrade their quality profiles and trigger searches in bulk.
- **Granular Search Triggers** - Trigger a search for an entire series, a specific season, or drill down to search for a single episode right from the UI.
- **Background Processing Queue** - Upgrades are sent to a background task queue with configurable rate limits (e.g., max 50 actions per hour) to prevent overwhelming your indexers or ARR instances.
- **Dry-Run Preview** - Preview exactly which items will be upgraded, skipped (if already on the target profile), or fail, before committing to any bulk changes.

**Management & Tracking:**
- **Action History** - A dedicated audit log tracking all your manual and automated upgrade actions, profile changes, and search triggers.
- **Snooze & Ignore** - Snooze specific titles to hide them from the upgrader view for a set duration, or permanently exclude specific libraries, shows, or movies.
- **Reclaimable Space Estimation** - View live statistics on how many gigabytes of storage could be reclaimed by upgrading large H.264 files to efficient HEVC formats.

---

### User Onboarding & Access Management

- **Invite Link System** - Generate shareable invite links with a configurable max-use limit and custom duration. Users claim access via a branded landing page
- **Plex OAuth** - Secure login via official Plex.tv authentication. No Plex passwords stored
- **Jellyfin Auth + Quick Connect** - Jellyfin portals support username/password auth and one-click Quick Connect, with admin detection from Jellyfin policy
- **Automated Temporary Access** - Auto-grant configurable temporary access periods (e.g., 3 days) to all new users
- **Access Expiry** - Set hard expiry dates per user. The system automatically revokes portal access when time is up
- **Inactivity Cleanup** - Automatically remove users who haven't streamed in a configurable number of days, with per-user exemptions available
- **Grace Period Notifications** - Warn users via email before their access expires

---

### Automated Communications

Beautiful, responsive HTML emails sent automatically:

| Email Type | Trigger |
|---|---|
| **Welcome** | Immediately when a user joins |
| **Temporary Access Warning** | When a temporary access user is approaching expiry |
| **Access Expired** | When a user's access is automatically removed |
| **Inactivity Warning** | Before an inactive user is purged |
| **Weekly/Monthly Newsletter** | Scheduled email featuring newly added Movies, TV Shows, and Music |

---

### Public-Facing Pages

- **Landing Page** - A sleek login page showing live library stats (total movies, shows, music) and your configured server branding
- **Status Page** - A public `/status` dashboard showing the live uptime of your media server, request tools (Seerr/Jellyseerr/Ombi), analytics companion, and download clients
- **Invite Claim Page** - A dedicated, shareable page for invited users to claim their account

---

### Custom UI Themes

- **Multiple Dark Themes** - Users can select between **Plex Dark** (classic orange), **Sleek Slate** (modern blue), or **Nordic Frost** (cool indigo) directly from the navigation panel.
- **Admin Configuration** - Admins can set the default theme for new users and visitors from **Settings ➔ Portal UI**.
- **Dynamic Accent Colors** - Interface elements, charts, active navigation states, and borders dynamically update to match the selected theme's brand palette.

---

### Mobile-First Design

- Full bottom navigation bar on mobile with smooth tab switching
- Clean top header on mobile showing only the server logo and essential actions
- All modals, cards, and charts are fully responsive and touch-friendly
- Safe area inset support for modern iOS and Android browsers

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Frontend** | React 18 (bundled via esbuild), TypeScript |
| **Styling** | Tailwind CSS v3 |
| **Auth** | JWT (httpOnly cookies) + Plex.tv OAuth or Jellyfin authentication |
| **Data** | Local JSON flat-files (no database required) |
| **Email** | Nodemailer (compatible with any SMTP provider) |
| **Icons** | Lucide React |
| **Compression** | GZIP via `compression` middleware |

---

## Security

- **No Plex Passwords** - Plex authentication is handled by Plex.tv OAuth. Jellyfin password login is exchanged directly with your Jellyfin server and is not stored by the portal
- **JWT Session Security** - Cookies use `httpOnly`, `secure`, and `sameSite: lax` flags to reduce XSS and CSRF risk while keeping auth redirects reliable
- **Rate Limiting** - Authentication endpoints have strict rate limiting to prevent brute-force attacks
- **HTTP Security Headers** - HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy enforced on every response
- **Admin Protection** - Admin routes require an authenticated admin session. Plex admins are verified from server ownership; Jellyfin admins are verified from Jellyfin user policy
- **Reverse Proxy Ready** - Supports Nginx, Caddy, and Cloudflare via `X-Forwarded-Proto` / `X-Forwarded-For` header trust, including optional subpath hosting (e.g. `https://media.example.com/portal`)
- **Injection Proof** - Uses a flat-file JSON system, making SQL injection structurally impossible

---

## Getting Started

### Prerequisites

- **Node.js** v20.6 or newer (for native `.env` support)
- A **Plex Media Server** with an admin Plex token, or a **Jellyfin Server** with an admin API key
- *(Optional)* An SMTP provider for email notifications

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/jl94x4/Server-Manager-Portal.git
cd Server-Manager-Portal
```

**2. Install dependencies**
```bash
npm install
```

**3. Generate your JWT secret**
```bash
printf 'JWT_SECRET=%s\n' "$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" > .env
```

**4. Start the application**
```bash
npm start
```

> `npm start` automatically builds the React frontend and Tailwind CSS, then starts the server on port **2121**.

**5. First-time admin setup**

- Navigate to `http://localhost:2121`
- Choose **Plex** or **Jellyfin** in the first-time setup wizard
- Plex setup uses Plex OAuth/token and server selection
- Jellyfin setup uses Jellyfin URL + API key, then supports Jellyfin login and Quick Connect
- Go to **Settings** in the sidebar to configure **Media Player**, SMTP, temporary access settings, branding, and scheduled tasks

### Media player modes

| Mode | Authentication | Analytics companion | Branding |
|---|---|---|---|
| **Plex** | Plex.tv OAuth, Plex token, selected owned server | Tautulli | Plex or custom theme |
| **Jellyfin** | Jellyfin username/password or Quick Connect | JellyStat | Jellyfin server icon and splash screen proxy, or custom theme |

Plex mode keeps the original Plex OAuth and Tautulli flow. Jellyfin mode uses your Jellyfin URL/API key for user sync, session activity, Quick Connect, and server branding assets. JellyStat provides rich analytics on par with Tautulli.

---

## Docker Deployment

The recommended way to run Server Portal in production is Docker with a persistent volume for `config/`.

### Pre-built images (GHCR)

Official images are published automatically on every push to `main`, `beta`, and `testing`:

| Tag | When updated | Image |
|---|---|---|
| `latest` | Every push to `main` and every release tag `v*` | `ghcr.io/jl94x4/server-manager-portal:latest` |
| `beta` | Every push to `beta` | `ghcr.io/jl94x4/server-manager-portal:beta` |
| `testing` | Every push to `testing` | `ghcr.io/jl94x4/server-manager-portal:testing` |
| `1.5.0` / `v1.5.0` | Matching GitHub release | `ghcr.io/jl94x4/server-manager-portal:1.5.0` |

Pull and run without building locally:

```bash
docker pull ghcr.io/jl94x4/server-manager-portal:latest
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

Use the `beta` tag to test upcoming features before they land on `latest`. Use `testing` for experimental branch builds (e.g. Library Upgrader work in progress).

### Quick start (Docker Compose)

**1. Clone and configure**

```bash
git clone https://github.com/jl94x4/Server-Manager-Portal.git
cd Server-Manager-Portal
cp .env.example .env
```

Edit `.env` and set `JWT_SECRET` (at least 32 characters). If the portal is served over HTTPS behind a reverse proxy, also set:

```env
FORCE_SECURE_COOKIES=true
PUBLIC_BASE_URL=https://portal.example.com
```

**2. Build and run**

```bash
docker compose up -d --build
```

The portal listens on port **2121** by default. Open `http://localhost:2121` and complete the first-time setup for Plex or Jellyfin.

**3. Persisted data**

| Host path | Container path | Purpose |
|---|---|---|
| `./config` | `/app/config` | All JSON settings, users, caches, logs |
| `./backup` | `/app/backup` | Rolling backup snapshots |

On first startup, any legacy JSON files still in the project root are automatically migrated into `config/`.

### Docker Compose tips

- Change the published port: set `PORT=8080` in `.env` (maps host `8080` → container `2121`).
- Integrations on your LAN (Sonarr, Radarr, Tautulli, Jellystat, Seerr/Jellyseerr/Ombi): set `ALLOW_PRIVATE_INTEGRATION_URLS=true` and use reachable URLs from inside the container (e.g. `http://host.docker.internal:8989` on Docker Desktop, or your host IP on Linux).
- View logs: `docker compose logs -f portal`
- Update: `git pull && docker compose up -d --build`

### Build the image manually

```bash
docker build -t server-manager-portal .
docker run -d \
  --name server-manager-portal \
  -p 2121:2121 \
  -e JWT_SECRET="your-secret-at-least-32-chars" \
  -e FORCE_SECURE_COOKIES=true \
  -e PUBLIC_BASE_URL=https://portal.example.com \
  -v "$(pwd)/config:/app/config" \
  -v "$(pwd)/backup:/app/backup" \
  server-manager-portal
```

### Reverse proxy (Nginx / Caddy / Traefik)

Run the container on an internal port and proxy HTTPS to it.

#### Root hosting (recommended)

Example Caddy:

```caddy
portal.example.com {
    reverse_proxy localhost:2121
}
```

Set `FORCE_SECURE_COOKIES=true` and `PUBLIC_BASE_URL=https://portal.example.com` so session cookies and email links use the public URL.

#### Subpath hosting

You can also host the portal under a path on an existing domain, for example `https://media.example.com/portal` alongside Plex, Jellyfin, or other services.

Example Caddy:

```caddy
media.example.com {
    handle /portal/* {
        reverse_proxy localhost:2121
    }
}
```

Set these environment variables:

```env
BASE_PATH=/portal
PUBLIC_BASE_URL=https://media.example.com/portal
FORCE_SECURE_COOKIES=true
```

`BASE_PATH` can be omitted if `PUBLIC_BASE_URL` already includes the path — the app derives it automatically. Leave both unset for root hosting; existing deployments are unchanged.

The proxy must forward requests **with** the `/portal` prefix intact (do not strip the path before the app). The portal rewrites asset and API URLs internally.

### Unraid

Server Manager Portal is available in the **Unraid Community Applications (CA) store**!

#### Install via Community Applications (Recommended)

1. Open the **Apps** tab in your Unraid dashboard
2. Search for **"Server Manager Portal"**
3. Click **Install**
4. Set your **JWT Secret** and adjust appdata paths if needed (default: `/mnt/user/appdata/server-manager-portal/`)
5. Click **Apply** and open the WebUI — you're done! 🎉

#### Manual Template Installation (Alternative)

If you prefer to install the template manually on Unraid 6+:

1. Download the template file: [`unraid/server-manager-portal.xml`](unraid/server-manager-portal.xml)
2. Rename the file with a `my-` prefix, e.g. `my-server-manager-portal.xml`
3. Upload it to your Unraid server at: `/boot/config/plugins/dockerMan/templates-user/`
4. Go to **Docker** → **Add Container** and select **Server-Manager-Portal** from the **User Templates** dropdown
5. Set **JWT Secret** and adjust appdata paths (defaults: `/mnt/user/appdata/server-manager-portal/`)
6. Apply and open the WebUI

The template uses `ghcr.io/jl94x4/server-manager-portal:latest` by default.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Session signing secret (min 32 characters) |
| `PUID` | No | User ID to run the app as (default `1000`; `99` on Unraid) |
| `PGID` | No | Group ID to run the app as (default `1000`; `100` on Unraid) |
| `PORT` | No | Listen port inside the container (default `2121`) |
| `BIND_HOST` | No | Bind address (default `0.0.0.0`) |
| `CONFIG_DIR` | No | Runtime data directory (default `/app/config` in Docker) |
| `PUBLIC_BASE_URL` | Recommended | Public HTTPS URL for links and emails. Include the subpath when using one, e.g. `https://media.example.com/portal` |
| `BASE_PATH` | No | URL prefix when hosted under a subpath (e.g. `/portal`). Leave empty for root hosting |
| `FORCE_SECURE_COOKIES` | Recommended | Set `true` when behind HTTPS |
| `ALLOW_PRIVATE_INTEGRATION_URLS` | No | Allow LAN/private URLs for Arr stack integrations |
| `SETUP_TOKEN` | No | Token for remote first-time setup |
| `CLIENT_ID` | No | Fixed Plex OAuth client id (auto-generated if unset; Plex mode only) |

See `.env.example` for a full template.

---

## Configuration

All configuration is managed through the **Settings UI** in the browser. Key options include:

| Setting | Description |
|---|---|
| Media Player | Choose Plex or Jellyfin |
| Plex Token / Server | Plex admin token, selected server, and optional direct Plex URL |
| Jellyfin URL / API Key | Jellyfin server URL and API key for users, sessions, Quick Connect, and branding proxy |
| Branding & UI | Portal accent colour, server logo, Jellyfin/Plex preset, and splash background |
| Temporary Access Duration | Number of days new users get for free |
| Inactivity Threshold | Days of inactivity before auto-removal |
| SMTP Settings | Host, port, username, password, from address |
| Newsletter Schedule | Weekly or monthly, with day/time selection |
| Home Layout | Section order and visibility for the user home page, including Pending Requests |
| Sonarr / Radarr URLs | For media stack calendar, queue, and history |
| Request App (Seerr/Ombi) | Seerr, Jellyseerr, or Ombi URL and API key for in-portal request review |
| Tautulli / Jellystat | Tautulli for Plex analytics, Jellystat for Jellyfin analytics |
| Status Page Services | Define services and their health check URLs |

---

## Background Tasks

The **Settings → Background Tasks** page shows the active scheduler and lets admins run jobs manually. Task labels follow the selected media player:

| Task | Plex mode | Jellyfin mode |
|---|---|---|
| User sync | Sync Plex Users | Sync Jellyfin Users |
| Expiry checks | Email users nearing expiry | Same |
| Revoke access | Removes expired Plex access | Revokes expired portal access |
| Inactive cleanup | Revokes inactive users | Revokes inactive Jellyfin portal users |
| Analytics cache | Uses Plex/Tautulli data where configured | Uses Jellyfin/Jellystat data where configured |
| Library stats | Plex Stats Builder | Hidden in Jellyfin mode |
| Maintenance index | Builds media/request index for cleanup rules | Same |
| Media quality index | Also powers Library Upgrader when enabled (Plex or Jellyfin codec scan) | Episode stats for shows when Upgrader enabled |
| Auto rolling backup | Creates rolling config backups | Same |

The **Settings → System** diagnostics page uses the same media-aware task list so Jellyfin portals are not penalized for Plex-only jobs.

---

## Project Structure

```
Server-Manager-Portal/
├── index.js            # Backend: Express API, Plex/Jellyfin integrations, auth, email, background jobs
├── index.tsx           # Frontend entry point
├── client/             # React application source
│   ├── App.tsx         # App shell, routing, responsive layout
│   ├── screens.tsx     # Dashboards, Discover, login, and shared screens
│   ├── home/           # User dashboard layout and widget renderers
│   ├── requests/       # Seerr-style request review UI (admin panel, approval modal, home widget)
│   ├── upgrader/       # Library Upgrader poster browse (non-HEVC scan)
│   ├── settings/       # Settings UI (Media Player, Home Layout, System, Background Tasks)
│   ├── shared/         # API helpers, types, theme, skeletons, wrap-up cards
│   ├── setup/          # First-time setup wizard
│   └── maintenance/    # Library maintenance panel
├── input.css           # Tailwind CSS source
├── static/
│   ├── bundle.js       # Built React frontend
│   ├── tailwind.css    # Built Tailwind styles
│   └── logo.png        # Server logo
├── lib/
│   └── data-paths.js   # Data file locations + legacy migration
├── config/             # Runtime JSON data (gitignored, created on first run)
├── Dockerfile          # Multi-stage production image
├── docker-compose.yml  # One-command Docker deployment
├── .github/workflows/
│   └── docker-publish.yml  # Publishes :latest, :beta, and :testing to GHCR
├── ca_profile.xml      # Unraid Community Applications maintainer profile
├── unraid/
│   └── server-manager-portal.xml  # Unraid Docker template
├── .env.example        # Environment variable template
├── build-version.js    # Stamps version.txt and cache-bust query strings on build
├── package.json
└── .env                # JWT_SECRET (not committed to git)
```

Runtime-generated files (stored in `config/`, not committed to git):
- `config/config.json` - Server configuration
- `config/users.json` - User records
- `config/audit-log.json` - System action log
- `config/trending-cache.json` - Cached leaderboard and trending data

On first startup after an upgrade, any legacy JSON files still in the project root are automatically moved into `config/`.

---

## Release History

Please see the [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes, new features, and bug fixes.

---

## Contributors

*   [Nerdy-Technician](https://github.com/Nerdy-Technician) - Added Jellyfin Support 🚀

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
Made with care for the self-hosting community.
</div>

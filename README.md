<div align="center">

# Server Portal

**A premium, fully-automated management and analytics portal for Plex Media Servers.**

Built with Node.js · Express · React · Tailwind CSS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Plex](https://img.shields.io/badge/Plex-Media%20Server-orange.svg)](https://www.plex.tv/)

</div>

---

Server Portal is a self-hosted web application that turns your Plex Media Server into a fully managed streaming service. It handles everything from user onboarding and automated access management, to real-time analytics, live session monitoring, trending content discovery, and beautiful personalized wrap-ups for every user, all from one polished, mobile-first dashboard with a premium glass UI.

Once setup your users will be able to login using their own Plex account to see their own stats! 

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
| **Top Library** | Your most-used Plex library with a full ranked breakdown of all libraries |
| **Top Day** | An animated bar chart showing your plays across all 7 days of the week, highlighting your peak day |
| **Peak Hours** | An animated hourly distribution chart showing what time of day you stream the most |
| **Time of Day** | Your streaming persona (Night Owl, Early Bird, Evening Streamer, Afternoon Watcher) with a contextual description |

All cards open into detailed modals loaded with contextual data, Plex artwork, and dynamic charts.

**Shareable wrap-up** - Export your personal wrap-up as a PNG image from the home dashboard. The share modal previews the real card grid and supports native share on supported devices, with download as a fallback.

**Paginated watch history** - Recently Watched and Your Most Watched use responsive pagination (18 items per page on desktop, 12 on mobile) so large libraries stay fast and readable.

---

### Admin Dashboard

A comprehensive control panel for the server owner:

- **Live Session Monitor** - Real-time view of all active streams with user avatar, media title, progress bar, stream type badge (Direct Play / Transcode), and a click-through technical modal showing video codec, audio codec, bitrate, channels, resolution, and transcode reason
- **User Management Table** - View all users with their Plex avatar, username, email, access expiry date, last seen timestamp, and quick-action buttons (+1 Month, +1 Year, Unlimited, Revoke)
- **Server Leaderboard** - Server-wide play count rankings across all time periods, updated automatically in the background
- **Audit Log** - Timestamped record of all system actions (access granted, revoked, extended, expired)
- **Settings UI** - Configure every aspect of the portal from the browser without touching config files
- **Customizable Home Layout** - Reorder home page sections and show or hide whole blocks (Personal Wrap-Up, Main grid, Recently / Most Watched, Recently Added) from **Settings → Home Layout**, with a live preview before saving. The main dashboard grid keeps a fixed balanced two-column layout so card heights stay aligned
- **Library Maintenance** - Scan libraries for missing or empty media, manage exclusions, and run cleanup tasks from the Maintenance page

---

### Customizable Home Layout

Admins can tailor the home page for their community without editing code:

| Control | What it does |
|---|---|
| **Section order** | Drag and drop the four major home sections into any order |
| **Section visibility** | Toggle each section Shown or Hidden with one click |
| **Live preview** | See exactly how the layout will look before you save |
| **Locked main grid** | Left and right dashboard columns stay balanced; individual widget order inside the grid is fixed to prevent uneven card heights |

Layout settings are saved server-wide, validated on the backend, and applied to every user on the next page load. Admin-only widgets (Quick Actions, Server Admin badge) cannot be hidden through layout tampering.

---

### Discover Page

A curated content discovery experience for all users, powered by server-wide watch history and live Plex activity:

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

All discover items display Plex artwork, play counts, and quality badges (4K, HDR, AV1/HEVC, Atmos, and more). Trending and analytics caches are reused on startup when still fresh, so the portal loads quickly after restarts.

---

### Media Stack

Browse your Sonarr and Radarr activity directly inside the portal:

- **Release Calendar** - Upcoming TV episodes and movie releases with poster art, air dates, and grabbed/missing status
- **Active Queue** - Live download queue from Sonarr and Radarr with progress and status
- **Recent History** - Import and grab history across both services
- **Month Navigation** - Browse releases by month with auto-advance to the next month that has content

Configure Sonarr/Radarr URLs and API keys in **Settings → Integrations**.

---

### User Onboarding & Access Management

- **Invite Link System** - Generate shareable invite links with a configurable max-use limit and custom duration. Users claim access via a branded landing page that automatically adds them to your Plex server
- **Plex OAuth** - Secure login via official Plex.tv authentication. No passwords stored
- **Automated Temporary Access** - Auto-grant configurable temporary access periods (e.g., 3 days) to all new users
- **Access Expiry** - Set hard expiry dates per user. The system automatically removes Plex server access when time is up
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

- **Landing Page** - A sleek login page showing live library stats (total movies, shows, music) to entice new users
- **Status Page** - A public `/status` dashboard showing the live uptime of your Plex server, request tools (Overseerr/Ombi), and download clients
- **Invite Claim Page** - A dedicated, shareable page for invited users to claim their account

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
| **Auth** | JWT (httpOnly cookies) + Plex.tv OAuth |
| **Data** | Local JSON flat-files (no database required) |
| **Email** | Nodemailer (compatible with any SMTP provider) |
| **Icons** | Lucide React |
| **Compression** | GZIP via `compression` middleware |

---

## Security

- **No Passwords** - Authentication is handled 100% by Plex.tv. The app only stores Plex Account IDs, usernames, and emails
- **JWT Session Security** - Cookies use `httpOnly`, `secure`, and `sameSite: lax` flags to reduce XSS and CSRF risk while keeping Plex OAuth redirects reliable
- **Rate Limiting** - Authentication endpoints have strict rate limiting to prevent brute-force attacks
- **HTTP Security Headers** - HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy enforced on every response
- **Admin Protection** - All admin routes are verified against live Plex server ownership, not just a stored flag. Home layout changes are admin-only and validated server-side
- **Reverse Proxy Ready** - Supports Nginx, Caddy, and Cloudflare via `X-Forwarded-Proto` / `X-Forwarded-For` header trust, including optional subpath hosting (e.g. `https://plex.example.com/portal`)
- **Injection Proof** - Uses a flat-file JSON system, making SQL injection structurally impossible

---

## Getting Started

### Prerequisites

- **Node.js** v20.6 or newer (for native `.env` support)
- A **Plex Media Server** with an admin Plex Token
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
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" > .env
```

**4. Start the application**
```bash
npm start
```

> `npm start` automatically builds the React frontend and Tailwind CSS, then starts the server on port **2121**.

**5. First-time admin setup**

- Navigate to `http://localhost:2121`
- Log in with your **Plex Admin account**
- The app will auto-detect you as the server owner and grant Admin access
- Go to **Settings** in the sidebar to configure your Plex token, SMTP, temporary access settings, and scheduled tasks

---

## Docker Deployment

The recommended way to run Server Portal in production is Docker with a persistent volume for `config/`.

### Pre-built images (GHCR)

Official images are published automatically on every push to `main` and `beta`:

| Tag | Branch | Image |
|---|---|---|
| `latest` | `main` | `ghcr.io/jl94x4/server-manager-portal:latest` |
| `beta` | `beta` | `ghcr.io/jl94x4/server-manager-portal:beta` |

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

Use the `beta` tag to test upcoming features before they land on `latest`.

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

The portal listens on port **2121** by default. Open `http://localhost:2121` and sign in with your Plex admin account.

**3. Persisted data**

| Host path | Container path | Purpose |
|---|---|---|
| `./config` | `/app/config` | All JSON settings, users, caches, logs |
| `./backup` | `/app/backup` | Rolling backup snapshots |

On first startup, any legacy JSON files still in the project root are automatically migrated into `config/`.

### Docker Compose tips

- Change the published port: set `PORT=8080` in `.env` (maps host `8080` → container `2121`).
- Integrations on your LAN (Sonarr, Radarr, Tautulli): set `ALLOW_PRIVATE_INTEGRATION_URLS=true` and use reachable URLs from inside the container (e.g. `http://host.docker.internal:8989` on Docker Desktop, or your host IP on Linux).
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

You can also host the portal under a path on an existing domain, for example `https://plex.example.com/portal` alongside Plex or other services.

Example Caddy:

```caddy
plex.example.com {
    handle /portal/* {
        reverse_proxy localhost:2121
    }
}
```

Set these environment variables:

```env
BASE_PATH=/portal
PUBLIC_BASE_URL=https://plex.example.com/portal
FORCE_SECURE_COOKIES=true
```

`BASE_PATH` can be omitted if `PUBLIC_BASE_URL` already includes the path — the app derives it automatically. Leave both unset for root hosting; existing deployments are unchanged.

The proxy must forward requests **with** the `/portal` prefix intact (do not strip the path before the app). The portal rewrites asset and API URLs internally.

### Unraid

Use the Community Applications-compatible template in [`unraid/server-manager-portal.xml`](unraid/server-manager-portal.xml):

1. **Docker** → **Add Container** → paste the [template URL](https://raw.githubusercontent.com/jl94x4/Server-Manager-Portal/main/unraid/server-manager-portal.xml)
2. Set **JWT Secret** and adjust appdata paths (defaults: `/mnt/user/appdata/server-manager-portal/`)
3. Apply and open the WebUI

The template uses `ghcr.io/jl94x4/server-manager-portal:latest` by default.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Session signing secret (min 32 characters) |
| `PORT` | No | Listen port inside the container (default `2121`) |
| `BIND_HOST` | No | Bind address (default `0.0.0.0`) |
| `CONFIG_DIR` | No | Runtime data directory (default `/app/config` in Docker) |
| `PUBLIC_BASE_URL` | Recommended | Public HTTPS URL for links and emails. Include the subpath when using one, e.g. `https://plex.example.com/portal` |
| `BASE_PATH` | No | URL prefix when hosted under a subpath (e.g. `/portal`). Leave empty for root hosting |
| `FORCE_SECURE_COOKIES` | Recommended | Set `true` when behind HTTPS |
| `ALLOW_PRIVATE_INTEGRATION_URLS` | No | Allow LAN/private URLs for Arr stack integrations |
| `SETUP_TOKEN` | No | Token for remote first-time setup |
| `CLIENT_ID` | No | Fixed Plex OAuth client id (auto-generated if unset) |

See `.env.example` for a full template.

---

## Configuration

All configuration is managed through the **Settings UI** in the browser. Key options include:

| Setting | Description |
|---|---|
| Plex Token | Your Plex admin token for API access |
| Plex Server URL | Local or remote address of your Plex server |
| Direct Plex URL | LAN URL for faster Plex image and history fetches (recommended in Docker) |
| Temporary Access Duration | Number of days new users get for free |
| Inactivity Threshold | Days of inactivity before auto-removal |
| SMTP Settings | Host, port, username, password, from address |
| Newsletter Schedule | Weekly or monthly, with day/time selection |
| Home Layout | Section order and visibility for the user home page |
| Sonarr / Radarr URLs | For embedding media request tools |
| Status Page Services | Define services and their health check URLs |

---

## Project Structure

```
Server-Manager-Portal/
├── index.js            # Backend: Express API, Plex integration, auth, email, scheduling
├── index.tsx           # Frontend entry point
├── client/             # React application source
│   ├── App.tsx         # App shell, routing, responsive layout
│   ├── screens.tsx     # Dashboards, Discover, login, and shared screens
│   ├── home/           # User dashboard layout and widget renderers
│   ├── settings/       # Settings UI (including Home Layout editor)
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
│   └── docker-publish.yml  # Publishes :latest and :beta to GHCR
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

## License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
Made with care for the self-hosting community.
</div>

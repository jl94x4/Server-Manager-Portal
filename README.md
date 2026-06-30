<div align="center">

# Server Portal

**A premium, fully-automated management and analytics portal for Plex Media Servers.**

Built with Node.js · Express · React · Tailwind CSS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Plex](https://img.shields.io/badge/Plex-Media%20Server-orange.svg)](https://www.plex.tv/)

</div>

---

Server Portal is a self-hosted web application that turns your Plex Media Server into a fully managed streaming service. It handles everything from user onboarding and automated access management, to real-time analytics, live session monitoring, trending content discovery, and beautiful personalized wrap-ups for every user - all from one polished, mobile-first dashboard.

---

<img width="1956" height="972" alt="image" src="https://github.com/user-attachments/assets/c15bb979-b759-4fa1-ae88-772f6a04e34b" />


## Feature Overview

### Personal Analytics & Wrap-Up

Every user gets a rich, personalized dashboard packed with insights about their own streaming habits. A **time-period filter** (7 / 30 / 60 / 90 / 180 / 365 days / All Time) updates every card simultaneously. Metadata is cached server-side for near-instant filter switching.

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

---

### Admin Dashboard

A comprehensive control panel for the server owner:

- **Live Session Monitor** - Real-time view of all active streams with user avatar, media title, progress bar, stream type badge (Direct Play / Transcode), and a click-through technical modal showing video codec, audio codec, bitrate, channels, resolution, and transcode reason
- **User Management Table** - View all users with their Plex avatar, username, email, access expiry date, last seen timestamp, and quick-action buttons (+1 Month, +1 Year, Unlimited, Revoke)
- **Server Leaderboard** - Server-wide play count rankings across all time periods, updated automatically in the background
- **Audit Log** - Timestamped record of all system actions (access granted, revoked, extended, expired)
- **Settings UI** - Configure every aspect of the portal from the browser without touching config files

---

### Discover Page

A curated content discovery experience for all users, powered by server-wide watch history:

- **Trending This Week** - What the whole server has been watching in the last 7 days
- **Top Movies / Top Shows** - The most-played movies and shows over the past month
- **Weekend Warriors** - Content that spikes on Fridays, Saturdays, and Sundays
- **Night Owl Club** - Content most watched between midnight and 5am
- **All-Time Greats** - The highest play-count content ever on the server
- **Cult Classics** - Niche content with extremely high plays relative to its tiny viewer count
- **Blast from the Past** - Pre-2000 titles getting recent love

All discover items display Plex backdrop artwork, play counts, and viewer counts.

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

### Media Stack Integration (coming soon)

Embed your Arr stack directly into the portal for seamless browsing and requesting:

- **Sonarr** - Browse and request TV shows without leaving the portal
- **Radarr** - Browse and request movies without leaving the portal

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
- **JWT Session Security** - Cookies use `httpOnly`, `secure`, and `sameSite: strict` flags to prevent XSS and CSRF attacks
- **Rate Limiting** - Authentication endpoints have strict rate limiting to prevent brute-force attacks
- **HTTP Security Headers** - HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy enforced on every response
- **Admin Protection** - All admin routes are verified against live Plex server ownership, not just a stored flag
- **Reverse Proxy Ready** - Supports Nginx, Caddy, and Cloudflare via `X-Forwarded-Proto` / `X-Forwarded-For` header trust
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

## Configuration

All configuration is managed through the **Settings UI** in the browser. Key options include:

| Setting | Description |
|---|---|
| Plex Token | Your Plex admin token for API access |
| Plex Server URL | Local or remote address of your Plex server |
| Temporary Access Duration | Number of days new users get for free |
| Inactivity Threshold | Days of inactivity before auto-removal |
| SMTP Settings | Host, port, username, password, from address |
| Newsletter Schedule | Weekly or monthly, with day/time selection |
| Sonarr / Radarr URLs | For embedding media request tools |
| Status Page Services | Define services and their health check URLs |

---

## Project Structure

```
Server-Manager-Portal/
├── index.js            # Backend - Express API, Plex integration, auth, email, scheduling
├── index.tsx           # Frontend - React application (all UI components)
├── input.css           # Tailwind CSS source
├── static/
│   ├── bundle.js       # Built React frontend
│   ├── tailwind.css    # Built Tailwind styles
│   └── logo.png        # Server logo
├── lib/
│   └── data-paths.js   # Data file locations + legacy migration
├── config/             # Runtime JSON data (gitignored — created on first run)
├── build-version.js    # Auto-increments version.txt on each build
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

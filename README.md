# Plex Manager

A powerful, fully-automated user management and dashboard application for Plex Media Servers. Built with Node.js, Express, React, and Tailwind CSS.

Plex Manager serves as a beautiful, public-facing portal for your Plex server, handling everything from user onboarding and free trials to automated access revocation, weekly newsletters, and live session monitoring.

## Key Features

### User Onboarding & Management
- **Automated Invite Links**: Generate custom invite links with strict use-limits and automated duration tracking. Invited users claim access through a beautiful, dedicated landing page that automatically adds them to your Plex Server.
- **Plex OAuth Integration**: Users securely log in using their official Plex credentials. No passwords stored, no messy invites.
- **Automated Free Trials**: Automatically grant new users access to your server for a configurable trial period (e.g., 3 days).
- **Access Expiry System**: Set hard expiry dates for users. The system automatically removes their server access when their time is up.
- **Automated Inactive Cleanup**: Automatically purge users who haven't streamed anything in a set number of days (highly configurable, with per-user exemptions).

### Admin Dashboard
- **Live Active Sessions**: Monitor current streams in real-time. Click on any stream to open a detailed technical modal showing Video/Audio Codecs, Channels, Bitrate, and Transcode reasons.
- **User Management Table**: Easily extend user access (+1 Month, +1 Year, Unlimited), track their last login, and view their current access status.
- **Audit Logs**: Keep track of every action taken by the system (user added, access revoked, expiry extended).
- **Settings UI**: Configure everything directly from the web interface without touching config files.

### Automated Communications
- **SMTP Email Alerts**: Automatically send beautiful HTML emails to users when:
  - They join the server (Welcome Email).
  - Their access is expiring soon (Warning Email).
  - Their access has expired or been revoked.
- **Weekly/Monthly Newsletters**: Automatically generate and send a stunning newsletter detailing recently added Movies, TV Shows, and Music to keep your users engaged.

### Public Portals
- **Landing Page**: A sleek, modern login page showing live library statistics (e.g., "10,000+ Movies") to entice new users.
- **Live System Status**: A public `/status` page displaying the uptime of your Plex server, request systems (Overseerr/Ombi), and download clients.
- **Media Stack Integration**: Embed Sonarr and Radarr directly into the user portal for seamless requests.

### Performance Optimized
- **GZIP Compression**: All assets and API responses are compressed to ensure fast load times over any connection.
- **In-Memory Caching**: Aggressive caching of Plex data (like library stats and active sessions) ensures the backend never hammers your Plex server.

---

## Getting Started

### Prerequisites
- Node.js (v20.6 or newer recommended for native `.env` support)
- A Plex Media Server and an Admin Plex Token
- (Optional) An SMTP provider for sending emails

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jl94x4/Plex-Manager.git
   cd Plex-Manager
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add a secure random string for JWT encryption.
   ```bash
   echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" > .env
   ```

4. **Start the Application:**
   ```bash
   npm start
   ```
   *Note: `npm start` automatically builds the React frontend and Tailwind CSS, then starts the Node.js server using `node --env-file=.env index.js`.*

5. **First Login (Admin Setup):**
   - Navigate to `http://localhost:2121`
   - Log in with your Plex Admin account.
   - The system will detect you are the server owner and grant you Admin access.
   - Go to the **Admin Dashboard -> Settings** to configure your server, SMTP, and automated tasks.

---

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React (esbuild), Tailwind CSS
- **Data Storage**: Local JSON files (No heavy database required!)
- **Authentication**: JWT (JSON Web Tokens) & Plex.tv OAuth

---

## Security

- **Strict Access Control**: Admin routes are protected and verified against Plex Server ownership.
- **Reverse Proxy Ready**: Fully supports running behind Nginx, Caddy, or Cloudflare with dynamic secure cookie handling via `X-Forwarded-Proto`.
- **No Passwords**: Authentication is handled entirely by Plex.tv. The app only stores email addresses, usernames, and Plex Account IDs.

---

## License

This project is open-source and available under the MIT License.

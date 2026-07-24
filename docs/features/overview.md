# Feature Overview

Server Portal combines user onboarding, access management, analytics, public pages, and server operations in one self-hosted app.

## Personal Dashboard

Every user receives a dashboard focused on their own streaming history:

| Card | What It Shows |
| --- | --- |
| Server Rank | Leaderboard position, percentile progress, nearby users, and plays needed to climb |
| Total Streams | Play count, media-type split, daily average, unique titles, and recent watch history |
| Top Binge | Most-watched show with artwork and runner-up shows |
| Top Movie | Most-watched movie with metadata and runner-up movies |
| Media Profile | Viewer personality type and media split |
| Watch Style | Discovery versus rewatch behavior |
| Streaming Habit | Weekday/weekend behavior and average plays per day |
| Top Library | Most-used library and ranked breakdown |
| Top Day | Weekly play distribution |
| Peak Hours | Hourly streaming distribution |
| Time of Day | Streaming persona and contextual description |

Dashboards support time filters, server-side metadata caching, modal detail views, paginated history, and PNG wrap-up export.

## Access Management

Admins can invite users, grant temporary access, set expiry dates, revoke access, exempt users from inactivity cleanup, and review actions in the audit log.

## Communications

The app can send HTML emails for welcome messages, temporary-access warnings, expired access, inactivity warnings, and newsletters.

## Public Pages

Public-facing routes include the landing/login page, invite claim page, and status dashboard.

## Integrations

Server Portal connects to the surrounding media stack: Plex, Jellyfin, Emby, Tautulli, Jellystat, Sonarr, Radarr, Lidarr, Bazarr, qBittorrent, Transmission, BitTorrent, Deluge, SABnzbd, Gotify, TMDB, and SMTP. Discover &amp; Request is built in (optional Seerr/Jellyseerr history import).

See [Integrations](/guide/integrations) for the full matrix.

## Themes

Users can choose among built-in dark themes, while admins can set the default theme and branding.

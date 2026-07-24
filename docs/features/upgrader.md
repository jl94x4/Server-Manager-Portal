# Library Upgrader

**Upgrader** helps admins find sub-optimal library files and upgrade them through Sonarr and Radarr. Enable it under **Settings → Library Upgrader**.

## What it does

- Index the library and filter by codec, resolution, size, HDR, and related attributes
- Match Plex / Jellyfin items to Sonarr / Radarr entries
- Support multiple Radarr / Sonarr instances (for example separate 1080p and 4K libraries)
- Map preferred quality profiles per library
- Trigger profile changes and searches from the portal

## Dashboard

- Poster grid with codec, resolution, size, and HDR badges
- Filters for codec, resolution, quality source, missing HDR, zero-byte files, and more
- Sort by size, watch count, or age
- Season / episode drawer for TV with file and custom-format detail
- Missing-episode detection between the media server and Sonarr

## Upgrade actions

- One-click quality profile switches with automatic search
- Bulk select movies or shows
- Search an entire series, a season, or a single episode
- Background queue with rate limits so indexers are not overwhelmed
- Dry-run preview before bulk commits

## Management

- Action history for upgrades, profile changes, and searches
- Snooze or permanently ignore libraries, shows, or movies
- Reclaimable space estimates for more efficient formats

## Related

- [Calendar](/features/calendar) — watch ARR queues while upgrades run
- [Cleaner](/features/cleaner) — remove unwanted library items instead of upgrading them
- [Integrations](/guide/integrations) — multi-instance Sonarr / Radarr notes

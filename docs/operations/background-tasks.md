# Background Tasks

The Background Tasks settings page shows the active scheduler and lets admins run jobs manually.

Task labels adapt to the selected media player:

| Task | Plex Mode | Jellyfin Mode |
| --- | --- | --- |
| User sync | Sync Plex users | Sync Jellyfin users |
| Expiry checks | Email users nearing expiry | Same |
| Revoke access | Remove expired Plex access | Revoke expired portal access |
| Inactive cleanup | Revoke inactive users | Revoke inactive Jellyfin portal users |
| Analytics cache | Plex and Tautulli data where configured | Jellyfin and JellyStat data where configured |
| Library stats | Plex stats builder | Hidden in Jellyfin mode |
| Maintenance index | Build media/request index | Same |
| Rolling backup | Create config backups | Same |

## Diagnostics

The Settings System diagnostics page uses the same media-aware task list. A Jellyfin portal is not expected to pass Plex-only checks, and Plex-only jobs are hidden where appropriate.

## Backups

Rolling backups are written to the backup directory. In Docker, mount `/app/backup` so snapshots survive container replacement.

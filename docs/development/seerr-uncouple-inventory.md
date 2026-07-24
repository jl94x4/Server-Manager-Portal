# Seerr uncouple inventory

Working document for the portal-native request/discover engine.  
**End goal:** remove Seerr/Overseerr/Jellyseerr runtime dependency.  
**Phase 4:** Discover defaults to TMDB metadata; Seerr optional rollback for browse proxy.

Related plan: uncouple Seerr in 10 phases (Discover first, JSON request store, then hard cut).

## Core libraries (today)

| File | Role |
|------|------|
| [`lib/request-app-service.js`](../../lib/request-app-service.js) | Facade: requests, users, quotas, services, watchlist, DTO mapping, `rawFetch` |
| [`lib/seerr-issue-service.js`](../../lib/seerr-issue-service.js) | Issues CRUD / comments / counts |
| [`lib/seerr-blocklist-service.js`](../../lib/seerr-blocklist-service.js) | Blocklist list/add/remove/search |
| [`lib/seerr-download-status.js`](../../lib/seerr-download-status.js) | Download / availability helpers from Seerr media payload |
| [`lib/seerr-season-status.js`](../../lib/seerr-season-status.js) | TV season status from Seerr |
| [`lib/discovery-settings.js`](../../lib/discovery-settings.js) | Discover prefs + `syncSeerrDiscoverySettings` → `/api/v1/settings/main` |
| [`lib/discovery-hero.js`](../../lib/discovery-hero.js) | Hero backdrops (uses Seerr `rawFetch` today) |
| [`lib/discovery-ratings.js`](../../lib/discovery-ratings.js) | Ratings (partially Seerr / *arr) |
| [`lib/sonarr-library-status.js`](../../lib/sonarr-library-status.js) | Sonarr library check (already portal-side; reuse in Phase 3) |

## Portal routes → Seerr

### Discover metadata (Phases 2–4)

| Portal route | Seerr / upstream | Replace in |
|--------------|------------------|------------|
| `GET /api/discovery/proxy/*` | `/api/v1` + path (`discover/*`, `movie/*`, `tv/*`, `person/*`, `search`, …) | Phase 2–4 |
| `GET /api/discovery/search` | Seerr search via `rawFetch` | Phase 2 |
| `GET /api/discovery/trending` | `/api/v1/discover/trending` | Phase 2 |
| `GET /api/discovery/hero-backdrops` | Seerr discover payloads | Phase 2–4 |
| `GET /api/discovery/preferences` | Portal config (synced *to* Seerr) | Phase 4 (drop sync) |
| Config save → `syncSeerrDiscoverySettings` | `POST /api/v1/settings/main` | Phase 4 / 10 |

### Requests (Phases 5–7)

| Portal route | Seerr | Replace in |
|--------------|-------|------------|
| `POST /api/discovery/request` | `POST /api/v1/request` | Phase 5–6 |
| `GET /api/discovery/request-options` | user + service + media | Phase 5–6 |
| `GET /api/discovery/request-services/:type/:serverId` | `/api/v1/service/*` | Phase 6 |
| `POST /api/discovery/request-tags` | Seerr tags | Phase 6 (or drop) |
| `POST /api/discovery/request-override-defaults` | override rules | Phase 8 (simplify) |
| `GET/DELETE/POST /api/discovery/my-requests*` | `/api/v1/request*`, user requests | Phase 5–7 |
| `GET /api/discovery/me` | `/api/v1/user/:id`, quota | Phase 8 |
| `GET /api/requests*` (admin) | `/api/v1/request*` | Phase 5–7 |
| `POST /api/requests/:id/approve\|decline\|retry` | matching Seerr mutations | Phase 6 |
| `GET /api/requests/services*` | `/api/v1/service/*` | Phase 6 |
| `GET /api/requests/users` | `/api/v1/user` | Phase 6–8 |

### Issues (Phase 8)

| Portal route | Seerr | Replace in |
|--------------|-------|------------|
| `GET/POST/DELETE /api/discovery/my-issues*` | issue service | Phase 8 |
| `POST /api/discovery/issues` | `POST /api/v1/issue` | Phase 8 |
| `GET/POST/DELETE /api/issues*` | issue service | Phase 8 |

### Blocklist (Phase 9)

| Portal route | Seerr | Replace in |
|--------------|-------|------------|
| `GET/POST/DELETE /api/blocklist*` | blocklist service | Phase 9 |

### Watchlist (Phase 9)

| Portal route | Seerr | Replace in |
|--------------|-------|------------|
| `GET /api/discovery/watchlist` | `/api/v1/discover/watchlist`, user watchlist | Phase 9 |
| `POST /api/discovery/watchlist/request` | batch request | Phase 5–9 |

### Availability / status overlays (Phases 3, 7)

| Portal route / helper | Seerr | Replace in |
|-----------------------|-------|------------|
| Proxy + filter `mediaInfo` | Seerr media status on discover results | Phase 3 |
| `GET /api/discovery/tv/:tmdbId/library-status` | Sonarr helper (mostly portal) | Phase 3 |
| `GET /api/discovery/library-link` | Plex (portal) | keep |
| Download badges on cards | `seerr-download-status` | Phase 7 |
| Season status in request modal | `seerr-season-status` | Phase 7 |

### Already less Seerr-dependent (keep / extend)

| Portal route | Notes |
|--------------|--------|
| `GET /api/discovery/radarr-releases` | Radarr direct |
| `GET /api/discovery/ratings/*` | Mixed; prefer *arr/TMDB |
| `GET /api/discovery/fact` | May use Seerr details today |

## UI DTO contracts to preserve

Source of truth for TypeScript shapes: [`client/requests/types.ts`](../../client/requests/types.ts).

- `PortalRequestItem` / `PortalRequestDetail`
- `PortalIssueItem` / `PortalIssueCounts`
- `PortalBlocklistItem`
- `PortalServiceOptions` / `PortalRequestUser` / `PortalRequestCounts`

Server mapping today lives in `request-app-service.js` (`toPortalRequestItem`, etc.). New portal engine must emit the same fields the UI reads (even if `seerrUrl` becomes empty/obsolete and is removed in Phase 10).

## New seams (Phase 1 stubs)

| Module | Path | Later phase |
|--------|------|-------------|
| TMDB client | `lib/portal-request/tmdbClient.js` | 2 ✅ |
| TMDB path router | `lib/portal-request/tmdbDiscover.js` | 2 ✅ |
| TMDB → Seerr mapper | `lib/portal-request/tmdbMapper.js` | 2 ✅ |
| Library availability | `lib/portal-request/libraryAvailability.js` | 3 ✅ |
| Request store (JSON) | `lib/portal-request/requestStore.js` | 5 ✅ |
| Portal request service | `lib/portal-request/portalRequestService.js` | 5 ✅ |
| Barrel | `lib/portal-request/index.js` | — |
| JSDoc types | `lib/portal-request/types.js` | 5+ |

Stubs are wired; Phase 4 defaults Discover metadata to TMDB (`discoverySource` default `tmdb`, Seerr rollback kept).

## Phase checklist

- [x] Phase 1 — Inventory + seams
- [x] Phase 2 — Direct TMDB client
- [x] Phase 3 — Portal library availability
- [x] Phase 4 — Flip Discover off Seerr proxy
- [x] Phase 5 — JSON RequestStore + create/list
- [x] Phase 6 — Approve/decline + *arr push
- [x] Phase 7 — Status sync from *arr/Plex
- [x] Phase 8 — Issues + quotas
- [x] Phase 9 — Watchlist/blocklist + migration
- [ ] Phase 10 — Hard cut + cleanup
  - [x] Setup wizard portal-first + optional Seerr import (`/api/setup/import-seerr`)
  - [ ] Remove Seerr dual-run routes / `requestEngine=seerr` / seerr service modules
  - [ ] Docs / Unraid template cleanup

## Phase 10 notes (in progress)

- **Setup:** Integrations → Requests defaults to portal Discover & Request (TMDB key). Optional “Coming from Seerr?” imports history via setup-token route; `requestEngine` forced to `portal` on first save.
- **Import fallback:** Unmapped Seerr request history is labeled with the setup admin Plex id (`fallbackUserId`) for display only (no access change) so wizard imports are not empty before members exist.
- **Settings:** Seerr engine labeled legacy rollback; import button remains for upgrades.

## Phase 2 notes

- Config flag: `discoverySource: 'seerr' | 'tmdb'` (Settings → Request → Discover Metadata Source).
- Requires `tmdbApiKey` when source is `tmdb`.
- Routes dual-run: `/api/discovery/search`, `/trending`, `/hero-backdrops`, `/proxy/*`.
- Responses match Seerr camelCase shapes (`posterPath`, `totalPages`, etc.).

## Phase 3 notes

- `createLibraryAvailability` attaches Seerr-shaped `mediaInfo` from Radarr/Sonarr catalogs when `discoverySource=tmdb`.
- List path: cached movie/series indexes (5 min) + queue sets (45s); Map lookup per card.
- Detail path: movies via Radarr; TV via existing Sonarr episode-aware enrich.
- Hide-available + availability overlays work in TMDB mode without Seerr `mediaInfo`.
- Request badges (`mediaInfo.requests`) still need Phase 5+.

## Phase 4 notes

- **Default flipped to TMDB** — unset/`discoverySource` empty → `tmdb`; explicit `seerr` kept as rollback.
- Discover Language/Region are portal-owned — Seerr main-settings sync removed from config save + boot.
- Ungated browse-adjacent routes: `fact`, `ratings` (TMDB + Radarr IMDb), `tv/:id/library-status` (Sonarr).
- Done criteria: Discover browse/details work with Seerr unreachable (request/watchlist/issues still need Seerr until later phases).
- `/media` library shelf still empty under TMDB (Phase 3/9).

## Phase 5 notes

- Flag: `requestEngine: 'seerr' | 'portal'` (Settings → Request → Request Engine). Default remains **seerr**.
- Portal path stores pending requests under `config/requests/` (`index.json` + `<id>.json`).
- Wired: `POST /api/discovery/request`, `GET/DELETE /api/discovery/my-requests*`.
- Phase 6 adds admin approve → *arr push.

## Phase 6 notes

- Admin `/api/requests*` dual-runs when `requestEngine=portal`: list/count/detail/approve/decline/retry/delete against JSON store.
- Approve looks up movie/series in Radarr/Sonarr, POSTs add+search, sets status **approved** (or **failed** with `meta.arrError`).
- Service options (`/api/requests/services*`, `/api/discovery/request-services*`) read profiles/root folders/tags from portal Arr instances.
- Requester identity uses portal account id / users file (no Seerr user sync).
- Status sync downloading→available remains Phase 7. Auto-approve / quotas remain Phase 8.

## Phase 7 notes

- Background job `requestStatusSync` (60s) when `requestEngine=portal`: refreshes approved request `meta.mediaStatus` / `meta.isDownloading` from Sonarr/Radarr via `libraryAvailability.getMediaStatus`.
- Admin Available / Processing tabs + counts use synced media status (no Seerr download APIs).
- Member My Requests labels already read `mediaStatus` / `isDownloading` — they update after sync.
- Manual run: Tasks → Portal Request Status Sync.
- Plex GUID match for “in library” can refine further later; *arr on-disk / queue is the Phase 7 source of truth.

## Phase 8 notes

- Flag: still `requestEngine=portal` (no separate issues flag).
- Issues JSON under `config/issues/` — member report + admin list/comment/resolve/delete without Seerr.
- Create accepts `tmdbId` + `mediaType` (Report Issue modal sends both).
- Global portal quotas: `requestQuotaLimit` / `requestQuotaDays` / `requestQuotaLimit4k` (0 = unlimited).
- Auto-approve: `autoApproveMovies` / `autoApproveTv` push to *arr on create via Phase 6 approve path.
- `/api/discovery/me` + `request-options` dual-run portal quota/permission DTOs when engine=portal.

## Phase 9 notes

- **Migration:** `POST /api/requests/import-from-seerr` + Tasks → **Import Seerr History** copies Seerr requests/issues/**blocklist** into `config/requests`, `config/issues`, `config/blocklist`.
- **Blocklist:** JSON under `config/blocklist/` when `requestEngine=portal`. Admin CRUD dual-run; decline-and-block; request create/options reject blocked titles.
- **Watchlist:** Live Plex Discover using member `plexAuthToken` (saved on login; admin uses `config.plexToken`). Cache under `config/watchlist/`. Bulk request → portal `createMemberRequest`.
- Blocklist search uses TMDB (needs `tmdbApiKey`). Seerr remains rollback when `requestEngine=seerr`.

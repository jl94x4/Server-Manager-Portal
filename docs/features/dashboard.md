# Dashboard

The **Dashboard** nav item (`/dashboard`) shows live server activity and community watch picks. It is separate from [Discover & Request](/features/discover-request), which is the TMDB browse and request surface.

## Live activity

- Stream summary cards: total streams, direct play, transcoding, and bandwidth
- Now-playing cards with poster art, quality badges, player info, progress, and ETA
- Layout stretches to three cards by default, up to four on ultra-wide displays when enough streams are active
- Activity refreshes about once per second while the page is open

## Recently added

- Movies, TV shows, and music grids with poster quality badges
- Configurable item limits (12–250) with the preference saved in the browser
- Dense poster grid on large screens

## Community picks

Sections are powered by server-wide watch history:

| Section | Meaning |
| --- | --- |
| Trending This Week | What the server watched in the last 7 days |
| Top Movies / Top Shows | Most-played titles over the past month |
| Weekend Warriors | Titles that spike Friday–Sunday |
| Night Owl Club | Titles most watched between midnight and 5am |
| All-Time Greats | Highest play-count content on the server |
| Cult Classics | Niche titles with very high plays for a small audience |
| Blast from the Past | Pre-2000 titles getting recent plays |

Items show server artwork, play counts, and quality badges (4K, HDR, AV1/HEVC, Atmos, and more). Analytics caches are reused when still fresh so the page stays quick after restarts.

## Related

- [Discover & Request](/features/discover-request) — browse TMDB and submit requests
- [Calendar](/features/calendar) — ARR release calendar, queues, and history
- [Analytics](/features/overview#personal-dashboard) — personal wrap-up cards on Home

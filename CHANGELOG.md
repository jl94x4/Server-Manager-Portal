# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0](https://github.com/jl94x4/Server-Manager-Portal/compare/v1.3.0...v1.4.0) (2026-07-08)


### Features

* add multi-instance arr read paths and per-instance media stack tabs ([60934e3](https://github.com/jl94x4/Server-Manager-Portal/commit/60934e3e6d0d6a8bcc752c8b61484d13e65daff7))
* Add optional public visibility controls ([#33](https://github.com/jl94x4/Server-Manager-Portal/issues/33)) ([48b6de6](https://github.com/jl94x4/Server-Manager-Portal/commit/48b6de6b0eba71bea5e1792f504755daeccfbf0b))
* add support for managing multiple arr instances ([65dc2b1](https://github.com/jl94x4/Server-Manager-Portal/commit/65dc2b1e966a597c9ce648344d1afd2b1572b824))
* enhance arr instance matching in maintenance index and setup UI ([2446811](https://github.com/jl94x4/Server-Manager-Portal/commit/24468119dfbecbfed23265c24c23447c3a2ff424))
* route maintenance actions by arr instance mapping ([fe4b685](https://github.com/jl94x4/Server-Manager-Portal/commit/fe4b685b5e5c99bfae76a94488ff8bb16271f17d))


### Bug Fixes

* clicking username in discover history navigates correctly to analytics profile ([eea2363](https://github.com/jl94x4/Server-Manager-Portal/commit/eea2363ca9610d2e9054461fdb74228b3d13fd6d))
* delay hash processing until users list is populated to ensure correct user id lookup ([e284b25](https://github.com/jl94x4/Server-Manager-Portal/commit/e284b25350b79c04404603f2fbbf50cc79e19e63))
* ensure analytics user modal opens dynamically from url hash and listens to hash changes ([0011a76](https://github.com/jl94x4/Server-Manager-Portal/commit/0011a768a103723b1cc9839fc0039fd3079e2d64))
* remove orphaned PORTAL_WIDE_LAYOUT_THRESHOLD import in App.tsx ([14d2120](https://github.com/jl94x4/Server-Manager-Portal/commit/14d21207db3bf4b46095ed40c5465de47582efbd))
* remove remaining pt-20 from outer scroll container to fix clipping ([59c943a](https://github.com/jl94x4/Server-Manager-Portal/commit/59c943a574335cfff96a9030bca6946b7db24572))
* repair config save syntax after arr instances ([b8887f4](https://github.com/jl94x4/Server-Manager-Portal/commit/b8887f4536e92a3f804797e3a55cc97610c3967a))
* resolve sticky header clipping issue and align calendar poster ([6d6db1e](https://github.com/jl94x4/Server-Manager-Portal/commit/6d6db1ef7b9710913a49994aba3cf6171ad69728))
* **ui:** improve mobile scrolling and layout for stream details modal ([b905af1](https://github.com/jl94x4/Server-Manager-Portal/commit/b905af195a828c359f51c848ec7bd846e7edb1b6))
* **ui:** increase max-width and set min-height on stream details modal for desktop to improve poster proportion ([2cfae95](https://github.com/jl94x4/Server-Manager-Portal/commit/2cfae95deff691c14008ab8328228691b23ce123))
* **ui:** increase width of stream details modal on desktop to improve poster aspect ratio ([80f7183](https://github.com/jl94x4/Server-Manager-Portal/commit/80f71836fe20ec9be2f222e9aef01f353c3e4321))
* **ui:** remove overflow-hidden from activity posters to prevent right-edge clipping and allow shadow ([1ea3a10](https://github.com/jl94x4/Server-Manager-Portal/commit/1ea3a108a48a4dc200c1251178c573d3c56566b1))
* **ui:** right-align stream status in activity cards ([ef38db3](https://github.com/jl94x4/Server-Manager-Portal/commit/ef38db34623af0106ec78945cf2a0a865cf08df3))

## [1.3.0](https://github.com/jl94x4/Server-Manager-Portal/compare/v1.2.0...v1.3.0) (2026-07-08)


### Features

* Add specific date picker to Peak Playback Hours chart ([0e53072](https://github.com/jl94x4/Server-Manager-Portal/commit/0e53072c6340b7454c5df208096f70339f2a8afc))
* Add Tautulli-mimicking search feature to Discover tab ([d1ae46f](https://github.com/jl94x4/Server-Manager-Portal/commit/d1ae46f63a87143f99244e90e7230dc97ab4b9d6))
* Allow clicking on a user in Discover history to quickly navigate to their profile in the Users tab ([55a1d50](https://github.com/jl94x4/Server-Manager-Portal/commit/55a1d50d3324e54a80dbb7936c54c197308d476d))
* Change click-to-view user behavior to navigate to Analytics profile instead of Users list ([7565320](https://github.com/jl94x4/Server-Manager-Portal/commit/7565320a783885af4955cfe7c3e24f83aac683dc))


### Bug Fixes

* Correct ServerInsightsWidget component usage ([fc11ed3](https://github.com/jl94x4/Server-Manager-Portal/commit/fc11ed37547f267d408e4d5ebf8688296109a097))
* TypeScript errors and missing Loader2 import ([51b1b81](https://github.com/jl94x4/Server-Manager-Portal/commit/51b1b81b7cbb1f7b97953390e85f1245e7447763))


### Performance Improvements

* Vastly speed up discover search by fetching watch history in parallel and capping result sizes ([91e69ec](https://github.com/jl94x4/Server-Manager-Portal/commit/91e69ec1572f50a28aaba895fc129799afa04c98))

## [1.2.0](https://github.com/jl94x4/Server-Manager-Portal/compare/v1.1.0...v1.2.0) (2026-07-08)


### Features

* Add documentation link to navigation sidebar ([75017e5](https://github.com/jl94x4/Server-Manager-Portal/commit/75017e54417702aafd8a8f70f701dd7ca6647c08))
* Move docs link to settings and setup wizard ([94324db](https://github.com/jl94x4/Server-Manager-Portal/commit/94324dbc3ea83fbb0ce5b27ad817f469cb3d54a7))

## [1.1.0](https://github.com/jl94x4/Server-Manager-Portal/compare/v1.0.0...v1.1.0) (2026-07-08)


### Features

* Add Vitepress Docs Site ([#23](https://github.com/jl94x4/Server-Manager-Portal/issues/23)) ([62c7436](https://github.com/jl94x4/Server-Manager-Portal/commit/62c74363dda3632c8027d514e0e531f16666a286))

## 1.0.0 (2026-07-07)


### Features

* Add 3 new metrics to Personal Wrap-Up (Top Day, Top Library, Media Profile) ([4333c9e](https://github.com/jl94x4/Server-Manager-Portal/commit/4333c9eed3a85583afa4fb35c7107a76b0d9a73d))
* add admin capability to reset status monitor statistics ([1b8efb4](https://github.com/jl94x4/Server-Manager-Portal/commit/1b8efb43cc40bb03bc515be3749a9ec162b540da))
* add admin toggle for branded skeleton shimmer ([fb96331](https://github.com/jl94x4/Server-Manager-Portal/commit/fb963316a867e191ed0a990c3d9e4a5aa76f97b8))
* add admin toggle to hide stream user details for privacy ([bad2a1a](https://github.com/jl94x4/Server-Manager-Portal/commit/bad2a1a18c024cc7e05159b569d07d342eb2ed5a))
* add all-time row and convert carousels to grids ([b4f75c8](https://github.com/jl94x4/Server-Manager-Portal/commit/b4f75c8903dc79190bc5914d943e25df5dda2297))
* add analytics time filter dropdown and paginated recent history grid layout ([239b31e](https://github.com/jl94x4/Server-Manager-Portal/commit/239b31e377230115e5aece3b2e38997aa4959ccb))
* add animated Hall of Fame leaderboard to analytics page ([7725a1a](https://github.com/jl94x4/Server-Manager-Portal/commit/7725a1a63357ae2311a8a2e08bc5d8f624c8d251))
* add automatic app versioning using git commit hash ([f34d3ff](https://github.com/jl94x4/Server-Manager-Portal/commit/f34d3ffbeba31f46d8df68620ec2cb97caba1b83))
* add cinematic loading sequences with admin toggle ([0971928](https://github.com/jl94x4/Server-Manager-Portal/commit/0971928c6b09d919fb46fdc2a66f1507320d8dde))
* add configurable rolling auto backup management ([f884e03](https://github.com/jl94x4/Server-Manager-Portal/commit/f884e0359ac533665402f7b08bfd34d4f6cbf5fc))
* add destructive-run option to create and pin collections ([326de4d](https://github.com/jl94x4/Server-Manager-Portal/commit/326de4daa062601191a579972798fbd86add9538))
* add direct email invites feature to admin portal ([7f1dc9c](https://github.com/jl94x4/Server-Manager-Portal/commit/7f1dc9c2e701327f29dc5d7df62d4e3bc27619ed))
* add Docker deployment with compose and README guide ([c45c5f3](https://github.com/jl94x4/Server-Manager-Portal/commit/c45c5f3d542842f3adde6a585fa59048be631ef0))
* Add dual-color clip-path progress text overlay ([bf145e7](https://github.com/jl94x4/Server-Manager-Portal/commit/bf145e78620f427781310c51142ec881636bafef))
* add dynamic social preview metadata ([9be3767](https://github.com/jl94x4/Server-Manager-Portal/commit/9be3767d8fa248216e4966746df404658ee241fb))
* add highly configurable Stream Kill Rules engine ([647b858](https://github.com/jl94x4/Server-Manager-Portal/commit/647b85867b5ae5cfa8234e1c983f4291ec2b5420))
* add informative empty state message for status dashboard ([4892f4b](https://github.com/jl94x4/Server-Manager-Portal/commit/4892f4bef439d27db622698da9caee3b2caa95cb))
* add library selection to invites and global default libraries setting ([98a4eea](https://github.com/jl94x4/Server-Manager-Portal/commit/98a4eeadfd916e86973f4061157bff84f44b6ba4))
* add opt-in scroll reveal animations to dashboard ([77fbab3](https://github.com/jl94x4/Server-Manager-Portal/commit/77fbab32391e3e22fd9c5697b1652334f08b156f))
* Add peak direct play, direct stream, and transcode metrics to Tautulli insights ([1e122c3](https://github.com/jl94x4/Server-Manager-Portal/commit/1e122c39a227f3d7c7b1dc9b05e10dcaa9f1b429))
* add personal wrap-up stats and community leaderboard to user portal ([32dcb11](https://github.com/jl94x4/Server-Manager-Portal/commit/32dcb118bccd460515ca9a858ba97ba41c1ef1ce))
* Add Play Duration vs Play Count toggles to Tautulli Graphs ([e688eb8](https://github.com/jl94x4/Server-Manager-Portal/commit/e688eb8673ac2ea27067f30c7057e53e5836bfd8))
* add recently added music to dashboard ([84a632a](https://github.com/jl94x4/Server-Manager-Portal/commit/84a632a091d4d9afb0c2ce9d92c4a20b5cc49907))
* Add report issue functionality and animated counters ([ec8829f](https://github.com/jl94x4/Server-Manager-Portal/commit/ec8829f4d39bd450e5b907d69091c60d71f97138))
* Add rich secondary information to Wrap-Up cards ([43485f0](https://github.com/jl94x4/Server-Manager-Portal/commit/43485f02a532d62425fcdc074cb0df597b04c4f7))
* add server-wide trending stats aggregator and discover UI rows ([9fd2fe4](https://github.com/jl94x4/Server-Manager-Portal/commit/9fd2fe4e8af66f43aeb42920ee48935c26defe9a))
* add status monitor UI and navigation bar reordering ([2cafc29](https://github.com/jl94x4/Server-Manager-Portal/commit/2cafc2997975894a306a9037711083f363c2d2a0))
* add stream kill switch and staggered announcement emails ([29c2ee9](https://github.com/jl94x4/Server-Manager-Portal/commit/29c2ee9ee3bd94987f12522dc00340829f54b8c6))
* Add Stream Type, Stream Resolution, and Platforms graphs to Tautulli tab ([9110223](https://github.com/jl94x4/Server-Manager-Portal/commit/91102237b8567d7c83b0f5b997747027590db494))
* add system health dashboard and audit diff viewer ([cb4acd8](https://github.com/jl94x4/Server-Manager-Portal/commit/cb4acd8679494d53b8c2f99347d8826f74320870))
* add system tooling and richer analytics insights ([af5d5c8](https://github.com/jl94x4/Server-Manager-Portal/commit/af5d5c8e4f1f489a86ef60301d222243da92eed2))
* Add Tautulli Daily Concurrent Stream Count graph and convert Stream Type to LineChart ([fe5a350](https://github.com/jl94x4/Server-Manager-Portal/commit/fe5a350ad0358678fe8ff37c43e0aeed3d90d1bd))
* Add Tautulli Graphs tab to Analytics with Recharts ([9c75bea](https://github.com/jl94x4/Server-Manager-Portal/commit/9c75beaca9ffb9e3dba26c53ec72bea2d28bf4fe))
* Add Tautulli Integration for advanced analytics insights ([7a5fb6f](https://github.com/jl94x4/Server-Manager-Portal/commit/7a5fb6fa768fc982a9f443089e4a166f15cd6e28))
* add time-based greeting to dashboard hero ([6b87e82](https://github.com/jl94x4/Server-Manager-Portal/commit/6b87e8294949507b17b7d41d1223bd3e86409fd1))
* add timeframe toggles to wrap-up widget and background aggregator ([4fa1481](https://github.com/jl94x4/Server-Manager-Portal/commit/4fa14812b6e6beebd07f4fe38eae4113e76caed8))
* Add Top Movie, Watch Style, and Streaming Habit to Personal Wrap-up ([96b4556](https://github.com/jl94x4/Server-Manager-Portal/commit/96b455646f96009fcbe752b8b85ce9b5abf3c439))
* add Unraid Community Applications template and GHCR publish ([d587579](https://github.com/jl94x4/Server-Manager-Portal/commit/d587579c2a1519baebb3fe0a1e12727998ed41b7))
* Add user configurable row counts for watch history widgets on dashboard ([dd2ab7b](https://github.com/jl94x4/Server-Manager-Portal/commit/dd2ab7ba75a49f254fbe22c4cceea1af48b88458))
* add wacky stats and apply recentLimit to all trending rows ([f61b7b3](https://github.com/jl94x4/Server-Manager-Portal/commit/f61b7b39ae75309f5afbbf0413a2dd6bf6a03d31))
* added TMDB trending slideshow background option ([aca5357](https://github.com/jl94x4/Server-Manager-Portal/commit/aca53578257e05932a5751b089546abdde30da4b))
* **analytics:** add detailed catalog counts row (movies, shows/episodes, artists/albums/tracks) ([d52d6de](https://github.com/jl94x4/Server-Manager-Portal/commit/d52d6dee8a033cb397044eadcc5b40aba0beeb8f))
* **analytics:** add new graphs and improve mobile layout ([958eaa2](https://github.com/jl94x4/Server-Manager-Portal/commit/958eaa27a07ba38b39e62350b5fcf961aa68140f))
* **analytics:** display catalog watched percentage alongside 4k coverage ([0b5fa3f](https://github.com/jl94x4/Server-Manager-Portal/commit/0b5fa3f5222b1b5e40c8d616045832ec5af546b6))
* **analytics:** expand user modal with paginated history and graphs ([3f0882e](https://github.com/jl94x4/Server-Manager-Portal/commit/3f0882eef30ff5224cc29ed14c1c2eb8b52689ba))
* animate hero background and move preferences to fill empty slot ([5aa3d49](https://github.com/jl94x4/Server-Manager-Portal/commit/5aa3d495f04f5e6c5b81271d3ee7182ef18a5030))
* apply rule-age grace windows and reset controls ([cd94110](https://github.com/jl94x4/Server-Manager-Portal/commit/cd94110fd4a3389fbaa632dfb77f4432f4870b8c))
* background plex stats task with manual rebuild button in Quick Actions ([728fadf](https://github.com/jl94x4/Server-Manager-Portal/commit/728fadfdd8debf2a620160cc0cedfa15557176f6))
* center leaderboard podium and add dynamic catalog count animations with deltas ([adedd93](https://github.com/jl94x4/Server-Manager-Portal/commit/adedd9381a9cdde63075645dd7968d7487a32cf9))
* change calendar to monthly fetching with forward/backward navigation ([02db8f0](https://github.com/jl94x4/Server-Manager-Portal/commit/02db8f0a889100653139426b083036484562c00c))
* change critical toggle to button and use dropdown for groups ([2552f20](https://github.com/jl94x4/Server-Manager-Portal/commit/2552f20432eadc74e696258350e35ef38ed9d78d))
* complete redesign of the user dashboard with personal analytics integration ([5155a5c](https://github.com/jl94x4/Server-Manager-Portal/commit/5155a5ce651afb50e49083f4c05090cee83eec72))
* dedicated top music section in user analytics ([da59b7c](https://github.com/jl94x4/Server-Manager-Portal/commit/da59b7c0cdb293a4ca05e0aaec4c8144a385e11d))
* default recently added limit to 10 ([d81952f](https://github.com/jl94x4/Server-Manager-Portal/commit/d81952fb9394c1917c56bcafceed3fe783c61a2a))
* display library sizes in TBs alongside item counts ([6c3fe10](https://github.com/jl94x4/Server-Manager-Portal/commit/6c3fe1028083404c6dd615769fda17c27f664d37))
* enhance stream user privacy options (anonymous/hidden) ([5a8e6b4](https://github.com/jl94x4/Server-Manager-Portal/commit/5a8e6b4186d921f42bab0a6d64876d37cfdefa3a))
* Enrich Media Profile modal with percentages, personality description and top picks ([65304fb](https://github.com/jl94x4/Server-Manager-Portal/commit/65304fb3dd578164e0af6bf7bcc82d4d336c4d0a))
* Enrich Server Rank modal with leaderboard neighbourhood, progress bar and plays-to-climb ([ac39d2c](https://github.com/jl94x4/Server-Manager-Portal/commit/ac39d2c4215391c763daabc011ae52f5cc86014e))
* Enrich Total Streams modal with breakdown bars, daily avg, unique titles and recent history ([4dd5c12](https://github.com/jl94x4/Server-Manager-Portal/commit/4dd5c12ea398d60517228c61980dbb141535b6f6))
* Enrich Watch Style modal and clean up mobile top nav ([ec6138d](https://github.com/jl94x4/Server-Manager-Portal/commit/ec6138d21f278b1935b236ca836881a504ac4895))
* Enrich Wrap-Up modals with detailed breakdowns and runner-ups ([e0d2434](https://github.com/jl94x4/Server-Manager-Portal/commit/e0d2434127a3dca1a7df32d96e1ad0e9b4a7bf48))
* expand storage metrics and add rating-based rule filters ([60ea3a0](https://github.com/jl94x4/Server-Manager-Portal/commit/60ea3a08ba959ea624483db424cf27df03eee3e2))
* Fix movie metadata fetching and add summary/tagline to Top Item modals ([de8e91b](https://github.com/jl94x4/Server-Manager-Portal/commit/de8e91b4cffefef9fe774a9c3eee8e22a5461f71))
* gate maintenance behind experimental toggle ([7362b95](https://github.com/jl94x4/Server-Manager-Portal/commit/7362b9516bde7b916e1f57e4e30dd434e16d7e87))
* highlight maintenance toggle when opened from disabled state ([7dcce4d](https://github.com/jl94x4/Server-Manager-Portal/commit/7dcce4d80477e1d9260480f30ccb34578bc39d65))
* implement custom branding themes and dark/light mode ([81ff779](https://github.com/jl94x4/Server-Manager-Portal/commit/81ff779aa427257d3e2a9a7415a77e324ad287f5))
* implement Trakt-style calendar view in media stack ([0190a65](https://github.com/jl94x4/Server-Manager-Portal/commit/0190a6500fb1fc33f976556620f003f131b57d0a))
* Include every possible Tautulli graph (Source Resolution, Top 10 Users) ([b1324a5](https://github.com/jl94x4/Server-Manager-Portal/commit/b1324a58c84f973be99559b0a40445d8e9489f68))
* increase analytics top content limit and add pagination UI with smaller posters ([e3e565c](https://github.com/jl94x4/Server-Manager-Portal/commit/e3e565c7c8aef6f4508e782af8b707065c0a5c33))
* increase dashboard polling to 1s ([a51877c](https://github.com/jl94x4/Server-Manager-Portal/commit/a51877ca1ad3c0958608f54ecc0f57d842d320bc))
* increase discover page row limit and deduplicate trending stats ([fff7853](https://github.com/jl94x4/Server-Manager-Portal/commit/fff7853fe399cadec5e8c04db06bba05f3c500da))
* Increase Top Obsessions to top 5 in Watch Style modal ([3ade48e](https://github.com/jl94x4/Server-Manager-Portal/commit/3ade48e068ff346de19361b05a226e9e4a79b599))
* make dashboard live with 2.5s polling interval ([3ad9ccf](https://github.com/jl94x4/Server-Manager-Portal/commit/3ad9ccf8adc50a0fe687ecfa450c05bc102428ba))
* Make Tautulli Insights card full width and add more data points ([352c333](https://github.com/jl94x4/Server-Manager-Portal/commit/352c333bd6bf18494f1ea19aa2f53df9785a099e))
* make UserDashboard the universal home page for admins and users ([be1dcf7](https://github.com/jl94x4/Server-Manager-Portal/commit/be1dcf7787f49b8c4395b6b572762177fd7f0cfa))
* Make Wrap-Up boxes clickable with beautiful modals ([ae143d8](https://github.com/jl94x4/Server-Manager-Portal/commit/ae143d8b013cd14a2d91301f1006b3dcbd0886ad))
* merged tautulli insights into server insights to fill layout gap ([6088001](https://github.com/jl94x4/Server-Manager-Portal/commit/60880016a1f0d87d9c3e8cd8ec1ff1dac51671c6))
* persist recent limit filter and optimize analytics background job ([c6465a5](https://github.com/jl94x4/Server-Manager-Portal/commit/c6465a528a398c217edb4141d00d3bf25e058560))
* Persist viewTab selection using localStorage ([4f716f0](https://github.com/jl94x4/Server-Manager-Portal/commit/4f716f08cadad4db9434e939507fe5f08dcf1a7f))
* polish maintenance mobile layout and filter controls ([d0ed522](https://github.com/jl94x4/Server-Manager-Portal/commit/d0ed52264d5479b6100d4033256e549d592e5941))
* properly handle music track history and add Music icon fallback ([29f83d8](https://github.com/jl94x4/Server-Manager-Portal/commit/29f83d8a2046ab0b2ee76d84cf7cd0a78d6a0074))
* redesign settings navigation with grouped sidebar ([e5987b1](https://github.com/jl94x4/Server-Manager-Portal/commit/e5987b1877741cd8b6c731885a91ff0ad70824f5))
* redesign UserDashboard to include server stats and recently added content ([c89a0db](https://github.com/jl94x4/Server-Manager-Portal/commit/c89a0dbf2667725aba35bb68a6198158c990e049))
* Remove subscription and pricing mentions from support card ([1a102de](https://github.com/jl94x4/Server-Manager-Portal/commit/1a102decccc48015e36b2276002e77bda46a0054))
* Replace All-Time Highs with Top Viewing Devices in analytics ([87e2f15](https://github.com/jl94x4/Server-Manager-Portal/commit/87e2f1550241eac04f8d80afb2c48e6bc9b01d3f))
* replace native confirm dialogs with custom react modal ([1a2c9be](https://github.com/jl94x4/Server-Manager-Portal/commit/1a2c9bede422263d692323a57dfefaa0e5cef9f9))
* replace trial and subscription terminology, add toggle, and improve login UI ([c6051b5](https://github.com/jl94x4/Server-Manager-Portal/commit/c6051b5e009db10e31786b0ceda950892a2c1053))
* replaced trending content with server insights hub ([a41ebe3](https://github.com/jl94x4/Server-Manager-Portal/commit/a41ebe35c352a718f46ba832551a8a0e771c77e9))
* restrict branding themes to top 3 dark variants ([c4f35a4](https://github.com/jl94x4/Server-Manager-Portal/commit/c4f35a4a2f880075b58f51aab86cb3fc85b2e93e))
* restructure hero to profile header layout ([f5adba3](https://github.com/jl94x4/Server-Manager-Portal/commit/f5adba3fc857a62e611f95ba89fc9a5b00cf8d61))
* server-side library deltas and new trending content showcase ([619d544](https://github.com/jl94x4/Server-Manager-Portal/commit/619d544f54eade02353d50d1650201a9a2620aa7))
* show all services on history and analytics tabs ([6f0f21f](https://github.com/jl94x4/Server-Manager-Portal/commit/6f0f21faf59f561cb3cf532aa8e85fca8a05b4df))
* Show top 3 movies and top 3 shows in Media Profile modal ([299efdb](https://github.com/jl94x4/Server-Manager-Portal/commit/299efdbd26e82b96f63de1e7884abe5ec71e1f37))
* shuffle TMDB slideshow backgrounds on mount ([e99f211](https://github.com/jl94x4/Server-Manager-Portal/commit/e99f211f0987e02dd0804272443d741cf5c0d35f))
* split top watched into movies and shows and make full width ([cde0c07](https://github.com/jl94x4/Server-Manager-Portal/commit/cde0c077ba8dcf1a71b2b43f35121e5f32fd64af))
* streamline maintenance mobile and compact controls ([7f5764b](https://github.com/jl94x4/Server-Manager-Portal/commit/7f5764b5335254a9c4cd7a2ada199de2853f40cc))
* Track all-time high concurrent streams, direct plays, and transcodes ([8cb7c47](https://github.com/jl94x4/Server-Manager-Portal/commit/8cb7c475010d7150b904ee7cb67cdc5223b0b5d6))
* trigger maintenance index rebuild after setup enablement ([b7dedcc](https://github.com/jl94x4/Server-Manager-Portal/commit/b7dedcc754c97cb35ac34fbb30b81be1b9e2551b))
* update fallback name to Server Portal and add new transparent logo ([bb008ee](https://github.com/jl94x4/Server-Manager-Portal/commit/bb008eebfcfcac67d331d34a51e019851f638838))
* update mobile nav layout to move logout to header and remove logs from bottom nav ([eb846a4](https://github.com/jl94x4/Server-Manager-Portal/commit/eb846a440058dc8033573a115ea378e6421d0706))
* use themed CustomSelect dropdowns in Stream Kill Rules conditions ([75843ec](https://github.com/jl94x4/Server-Manager-Portal/commit/75843ec2dd1b5be07c5e2cf90dc95dd52481118a))


### Bug Fixes

* **activity-cards:** increase card height to prevent text clipping and resolve skeletons.tsx syntax error ([5b65e1b](https://github.com/jl94x4/Server-Manager-Portal/commit/5b65e1bfafbd067f3f6942ef628697915d696b09))
* actually pass appVersion to Navigation ([c0302da](https://github.com/jl94x4/Server-Manager-Portal/commit/c0302daca19aa6880750af6d2090f6364a925b6f))
* add /users to backend SPA routing ([8b62d38](https://github.com/jl94x4/Server-Manager-Portal/commit/8b62d38ccb0ce986054451d32b603e513ad732a8))
* Add missing Cpu icon import for all-time highs card ([43df4e3](https://github.com/jl94x4/Server-Manager-Portal/commit/43df4e35af2d762a27fdcc81395e7f14824c2466))
* Add missing Monitor icon import for Tautulli Insights UI ([995fd2e](https://github.com/jl94x4/Server-Manager-Portal/commit/995fd2e0e775bc2501b74ddbdc5854b45a7e80d9))
* add missing Shield icon import ([51a3f0d](https://github.com/jl94x4/Server-Manager-Portal/commit/51a3f0dfe948d6da1dca2e747e9431fbc2346020))
* add missing style.css so Docker and GHCR publish succeed ([2a998a1](https://github.com/jl94x4/Server-Manager-Portal/commit/2a998a10ff08f03dcb29745ac8f118ceebabe235))
* Add missing tautulli API variables to SetupWizard ([8a52df3](https://github.com/jl94x4/Server-Manager-Portal/commit/8a52df3cafb7322ec07ab897f92d7c97aacc31ba))
* Add missing tautulli states to Admin Settings payload ([3839a65](https://github.com/jl94x4/Server-Manager-Portal/commit/3839a656162e27537dbbe0b6317a0200a3b737c9))
* Add PUID and PGID support for Unraid and Docker to fix permission issues ([4d7d118](https://github.com/jl94x4/Server-Manager-Portal/commit/4d7d11878c76fe9731ad7379fdbda7c913fff647))
* Add react-dom mapping to import map for recharts ([6f94c20](https://github.com/jl94x4/Server-Manager-Portal/commit/6f94c207e96c004693f751d9a7f7123ee3b1b9ae))
* add users to currentRoute state type ([abc8efe](https://github.com/jl94x4/Server-Manager-Portal/commit/abc8efed6dafe4940ee0d3f4d487ba04995b646a))
* adjust recently watched and most watched widget page sizes for proportional height ([47379e5](https://github.com/jl94x4/Server-Manager-Portal/commit/47379e54b7c07522ee8b5469262db726961868d4))
* aggregate maintenance watch counts across all users ([fa63d15](https://github.com/jl94x4/Server-Manager-Portal/commit/fa63d1533e8782e1e16d5d6d01f36f223d69f9c7))
* align integration test URL validation with config save validation ([19e58ab](https://github.com/jl94x4/Server-Manager-Portal/commit/19e58abade52559b4f16421fbfa40789b183adcf))
* align maintenance mobile spacing ([a449ebb](https://github.com/jl94x4/Server-Manager-Portal/commit/a449ebb9b5a48f657e7c6a43246fc804bf352be1))
* align plex product names and ensure pure uuid for client id ([7a7199e](https://github.com/jl94x4/Server-Manager-Portal/commit/7a7199ee49ee21e719d5f8487c083a6164e3f2e4))
* allow Google Fonts in CSP ([06c0709](https://github.com/jl94x4/Server-Manager-Portal/commit/06c07096b9ff109c559cbb9990d7ffe910259c47))
* allow position sticky to work by changing overflow-x-hidden to overflow-x-clip ([3dbee9a](https://github.com/jl94x4/Server-Manager-Portal/commit/3dbee9a1106113920051b83893b64cb9d6b63f72))
* allow private hosts for outbound integration calls ([ee5c732](https://github.com/jl94x4/Server-Manager-Portal/commit/ee5c7321aab2615744accf88beb1608991d09ddf))
* always show last login on user cards ([5b1e6ff](https://github.com/jl94x4/Server-Manager-Portal/commit/5b1e6ff2110ea46db533ce0191b09cd56f614c42))
* analytics home screen and add contact settings ([48e60d3](https://github.com/jl94x4/Server-Manager-Portal/commit/48e60d30f20a85db23d5fc765df5d4c832d4f68b))
* analytics home screen and add contact settings ([adb0d87](https://github.com/jl94x4/Server-Manager-Portal/commit/adb0d87a258f4696c201b2e65caed54f643ec89b))
* **analytics:** accurately track catalog counts and fix gap spacing ([bd4b2d9](https://github.com/jl94x4/Server-Manager-Portal/commit/bd4b2d9fbd2d54bb2327fdc4147c1b930693690d))
* **analytics:** fix 500 error by correcting getWeekdayInTimezone typo ([c2710eb](https://github.com/jl94x4/Server-Manager-Portal/commit/c2710eb1901849dfce679882283d439168021bf8))
* **analytics:** fix graph data payload and pagination reload bug ([1685e15](https://github.com/jl94x4/Server-Manager-Portal/commit/1685e15857b873c0ed5fbd2e57f55f1a96d59b61))
* Bar chart heights collapsing in modals ([87542db](https://github.com/jl94x4/Server-Manager-Portal/commit/87542dbb7f411e2a39343dfbd4f4ac8b3fbee584))
* Bump bundle.js version to bust browser cache ([c5a1ada](https://github.com/jl94x4/Server-Manager-Portal/commit/c5a1ada81f7fdfa10d2cb47097358f8d9d40cb06))
* Bundle react and react-dom to prevent any dynamic require errors with recharts ([653973d](https://github.com/jl94x4/Server-Manager-Portal/commit/653973de324501e5024dfccdaf67176fc0064e2a))
* change 4k stats calculation to count by title instead of episode ([72cbf82](https://github.com/jl94x4/Server-Manager-Portal/commit/72cbf82595ba3a503e7e91fc0e0a0e335624e60d))
* change default invite max uses to 1 ([b7b7e7f](https://github.com/jl94x4/Server-Manager-Portal/commit/b7b7e7f5039073a94ccbb225962acd20b60a29a6))
* complete maintenance module and resolve slow page loads ([53a7b45](https://github.com/jl94x4/Server-Manager-Portal/commit/53a7b45fb4daac775a99fc679fee55095cda6401))
* Correct CustomSelect dropdown placement when rendering upwards ([7f7c350](https://github.com/jl94x4/Server-Manager-Portal/commit/7f7c3508795cc8caa9dbdaf67f6484e156b592a7))
* correctly format ca_profile.xml with Maintainer root and Profile node ([95887fd](https://github.com/jl94x4/Server-Manager-Portal/commit/95887fd53fa61f5176a255d42e8e844b140f044c))
* correctly map Users tab to AdminDashboard routing ([68fd251](https://github.com/jl94x4/Server-Manager-Portal/commit/68fd251788d9b4acd6d5aab6ca78462fd40fe17c))
* correctly show nextRun as null for disabled tasks ([35dd21b](https://github.com/jl94x4/Server-Manager-Portal/commit/35dd21b3edd54bf9157f9b706c186837909c2377))
* currentRoute state type errors preventing compilation ([14fa609](https://github.com/jl94x4/Server-Manager-Portal/commit/14fa60940d7a2721fe429ad6576e9bffe0dd9a26))
* CustomSelect dropdown now scrolls for long option lists ([40dcf85](https://github.com/jl94x4/Server-Manager-Portal/commit/40dcf8523c564db60320fb9c5418641cfd42de46))
* CustomSelect dropdown uses React portal to escape overflow clipping ([f4c13b1](https://github.com/jl94x4/Server-Manager-Portal/commit/f4c13b110d0df82d1b09c18c49c64e9fff391e29))
* do not overwrite version.txt if git fails ([256e37e](https://github.com/jl94x4/Server-Manager-Portal/commit/256e37e0f38d86d5459cdde04c1bc9d7ac7fe0d8))
* evaluate stream-rule resolution using transcode output ([334cfb2](https://github.com/jl94x4/Server-Manager-Portal/commit/334cfb2942ecfea5673c0d25748556382a1e70b7))
* expose analytics to users with masked viewer names ([fb10bc8](https://github.com/jl94x4/Server-Manager-Portal/commit/fb10bc897f031e23d0c01a4c14fe6ba48e4bf829))
* externalize react-dom to prevent bundling dynamic requires ([4422429](https://github.com/jl94x4/Server-Manager-Portal/commit/4422429ee176318d1ea7f6fcdb4f566b6754e012))
* Fetch true Plex background art for top titles if missing from history endpoint ([14f83fb](https://github.com/jl94x4/Server-Manager-Portal/commit/14f83fb0d92545871c6afd2df84e7ce1f3ec48fc))
* flatten Status Monitor settings layout ([03de9dd](https://github.com/jl94x4/Server-Manager-Portal/commit/03de9ddc9f30e09fef7a214bdb5bda77a286cfa1))
* force recently watched cards to stretch with self-stretch and items-stretch ([6015970](https://github.com/jl94x4/Server-Manager-Portal/commit/601597074ad4321306cd7564785e39c7909b26b4))
* force Recently Watched episode cards to stretch to equal height (h-full) ([af2b996](https://github.com/jl94x4/Server-Manager-Portal/commit/af2b996d5fd54dc2dce33bdc5d77cf5dbefbf0c1))
* frontend server stats polling and handle legacy cache format ([bf03188](https://github.com/jl94x4/Server-Manager-Portal/commit/bf03188470e5cf14772dab7e66c169eb86e2bc19))
* generate unique plex client id per installation to prevent auth blocks ([652d7b3](https://github.com/jl94x4/Server-Manager-Portal/commit/652d7b320af5159560c27d90fbcbe277892d3420))
* hard-lock discover now playing card width ([974e017](https://github.com/jl94x4/Server-Manager-Portal/commit/974e017f99b861a8da2d9dceeb99370ba5f693c9))
* harden setup auth, mask config secrets, sandbox email preview ([b9eea20](https://github.com/jl94x4/Server-Manager-Portal/commit/b9eea20b63c0354ab47e9b930ebec6f2c8037c8d))
* hide stream users toggle persistence and peak viewing hours bars visibility ([3d453a3](https://github.com/jl94x4/Server-Manager-Portal/commit/3d453a39e33d49c47967d98a57de1fee781dbe6e))
* ignore maintenance cache files in health check when module is disabled ([003fd23](https://github.com/jl94x4/Server-Manager-Portal/commit/003fd2373dd98fd05f45666443ca539c54b8b75f))
* implement flex-1 alignment so both Recently Watched and Most Watched cards stretch to match heights at bottom ([deeace5](https://github.com/jl94x4/Server-Manager-Portal/commit/deeace5ddca37ad68eaeb18f969a4b6c3990cae6))
* improve analytics totals and viewer pagination ([88aabed](https://github.com/jl94x4/Server-Manager-Portal/commit/88aabedb05c5af545931b15ea311d395004aaf65))
* improve maintenance exclusions selection UX ([44521e6](https://github.com/jl94x4/Server-Manager-Portal/commit/44521e681030dee0b273adde271228e4ecaa7835))
* improve plex user matching during sync to use plexId ([114370d](https://github.com/jl94x4/Server-Manager-Portal/commit/114370d4544a81bc241086dea9c59cafb2962494))
* improve toast placement, sizing, and stack limit ([9c14d16](https://github.com/jl94x4/Server-Manager-Portal/commit/9c14d160eaf645fe6fd163887ef2ec76b0e6b03c))
* Include topShows and topMovies in analytics payload for runner ups ([1c6d8bc](https://github.com/jl94x4/Server-Manager-Portal/commit/1c6d8bc3a0b4f1a71b965a6b16b54869f67763bc))
* include zero-play users in top viewers list ([8b7f730](https://github.com/jl94x4/Server-Manager-Portal/commit/8b7f7300ca0444b70a64cc68d2634040b0b554f4))
* increase plex stats timeout to 5m and fix fs cache bug ([702319d](https://github.com/jl94x4/Server-Manager-Portal/commit/702319d1cb69e978e7f902b0537981576d3264fe))
* increase recently watched items to 14 for 7 rows to match most watched height ([d321806](https://github.com/jl94x4/Server-Manager-Portal/commit/d321806b8b75ae5cfd0bcde135d215f55de69026))
* keep discover now playing cards fixed width ([573110d](https://github.com/jl94x4/Server-Manager-Portal/commit/573110d78bbbdd2eeec98ac14cc78105a5f0aa50))
* keep discover poster cards fixed on desktop resize ([557175a](https://github.com/jl94x4/Server-Manager-Portal/commit/557175af555ded9005c19a5a0fd32780954ed809))
* lighten gradients on hero banner slideshow for visibility ([a3d1171](https://github.com/jl94x4/Server-Manager-Portal/commit/a3d1171e95750b3c7ae1ab6cd0e7f765987cfd17))
* Load tautulli config on Settings Dashboard init ([3df0bf5](https://github.com/jl94x4/Server-Manager-Portal/commit/3df0bf5e4cd74c1fdb1f3d034204b95d274cff8d))
* make dashboard activity cards responsive ([5703d25](https://github.com/jl94x4/Server-Manager-Portal/commit/5703d25083d5e30fdad63e2004a92b493bf0439e))
* make group ID read-only and use custom select for service group ([49e1039](https://github.com/jl94x4/Server-Manager-Portal/commit/49e1039820f35340f1b7e773f91210472914961a))
* make login live stats widget resilient ([b2b2559](https://github.com/jl94x4/Server-Manager-Portal/commit/b2b255975a38152f1a7a08f4f4848376a8afc541))
* make status monitor settings full width and add edit functionality ([639f884](https://github.com/jl94x4/Server-Manager-Portal/commit/639f8840a961f5ab3666a626e09fb9161ea2e8cc))
* Map deviceID to actual device names in analytics instead of showing Unknown Platform ([b1a88c0](https://github.com/jl94x4/Server-Manager-Portal/commit/b1a88c09cc4b3c5aeb08806e0784dc9512f0e734))
* mount confirmModal in MainApp and wire state ([375af88](https://github.com/jl94x4/Server-Manager-Portal/commit/375af88e9b054565d3c065f2784b8d550b792ab7))
* move TMDB slideshow to dashboard hero banner only ([9787320](https://github.com/jl94x4/Server-Manager-Portal/commit/9787320491650edfbdbc445a71dc1995c4a86356))
* paginate plex stats fetching to prevent timeouts, show building status, set recent history to 5 items ([77469aa](https://github.com/jl94x4/Server-Manager-Portal/commit/77469aa939b2955fccf86240d2159a8468b7ff82))
* Parse Tautulli stats from top_libraries and most_concurrent ([e51affe](https://github.com/jl94x4/Server-Manager-Portal/commit/e51affe2ffa55085f123cce0b28af2e72c3f6e15))
* prevent duplicate maintenance disabled popups ([e91ba22](https://github.com/jl94x4/Server-Manager-Portal/commit/e91ba229ceab7098eeba503b2941ab39329b90e3))
* prevent mobile horizontal overflow causing nav bar to shrink ([041ffa0](https://github.com/jl94x4/Server-Manager-Portal/commit/041ffa0a0a686bb7165a8e82211348ce2e4bd22e))
* Prevent posters from zooming in as background on dashboard cards and modals ([d26ead9](https://github.com/jl94x4/Server-Manager-Portal/commit/d26ead9a53ad22e7480c91432cfd8911931f8ec5))
* refactor status monitor settings save to use the global save button ([9f9f44e](https://github.com/jl94x4/Server-Manager-Portal/commit/9f9f44efd105490d251e1130f9c6aafc7907c038))
* ReferenceError for ANALYTICS_CACHE_PATH ([2564705](https://github.com/jl94x4/Server-Manager-Portal/commit/25647056a9827c3a0ce6c7fc112732c89a99d09d))
* refine exclusions mobile toolbar layout ([25c3c23](https://github.com/jl94x4/Server-Manager-Portal/commit/25c3c2313c981f259003654f1a08b4e7d495507b))
* remove blur and increase opacity on hero banner slideshow ([f5f40fb](https://github.com/jl94x4/Server-Manager-Portal/commit/f5f40fb64a45fdd2d752f86c6d4d08ef7623df1f))
* remove blur from hero background images ([74321bd](https://github.com/jl94x4/Server-Manager-Portal/commit/74321bdef693d3baeeacdbb731d9c79d0e06e297))
* remove hardcoded plexified domains and use generic placeholders ([fc39315](https://github.com/jl94x4/Server-Manager-Portal/commit/fc393156dbdb71048b798a48f22f65b91b920882))
* remove orphaned confirmModal reference in SettingsDashboard ([ef59672](https://github.com/jl94x4/Server-Manager-Portal/commit/ef5967243b9aec21805315de51ef0711e6b8c5d6))
* remove publicConfig reference from StatusDashboard ([382f326](https://github.com/jl94x4/Server-Manager-Portal/commit/382f32673c13104da70a7ee266c1010190756089))
* remove run logs card from maintenance overview ([81687ab](https://github.com/jl94x4/Server-Manager-Portal/commit/81687abb4efea3bf30032e700eebed392ca56b9b))
* remove settings sidebar internal scrollbar ([d4f3d0e](https://github.com/jl94x4/Server-Manager-Portal/commit/d4f3d0eb764c2501687586a32cabb81e6a263dbf))
* remove undefined useLibraryDelta hook ([574ff6b](https://github.com/jl94x4/Server-Manager-Portal/commit/574ff6b108df926d8fb05b912f26004d47055be6))
* rename last 1 day to 24 hours and correct analytics timeframe array ([abed4c0](https://github.com/jl94x4/Server-Manager-Portal/commit/abed4c0d52f6419a2c3a74a522df4c38a7555ff7))
* replace authenticateToken with requireAdmin middleware ([656ee98](https://github.com/jl94x4/Server-Manager-Portal/commit/656ee989858c6992b9ec07190b44190d2ac8c02a))
* resolve admin profile picture, analytics history fetching, and dashboard layout balance ([cdd41e6](https://github.com/jl94x4/Server-Manager-Portal/commit/cdd41e6384a2768da2b1e66c0d8588be5c0fa77d))
* resolve contactWhatsApp undefined error ([9cc1d5c](https://github.com/jl94x4/Server-Manager-Portal/commit/9cc1d5c2844b56960deebe0b915ebdec90191ac3))
* resolve crash when config.json is parsed as null ([4e5134a](https://github.com/jl94x4/Server-Manager-Portal/commit/4e5134aba671c41cbaa007d8558549b98760c2b0))
* resolve fetchStatusConfig undefined error ([2918bf0](https://github.com/jl94x4/Server-Manager-Portal/commit/2918bf08301653d720fd0631c822cf4b8a0e796f))
* resolve flex shrink causing cut off text and align top boxes perfectly ([cdf0397](https://github.com/jl94x4/Server-Manager-Portal/commit/cdf0397a4fcb904ff309d9dd202d90759794c854))
* resolve high/medium-impact logic bugs across backend and frontend ([bbf37d1](https://github.com/jl94x4/Server-Manager-Portal/commit/bbf37d164a854816e32b6ea559ce3cebdf17be81))
* resolve invite save race condition and add claimed user tracking ([a0563dd](https://github.com/jl94x4/Server-Manager-Portal/commit/a0563dd569005ab1f6640c9410acb8676dc069bd))
* Resolve JSX tag mismatch ([47e0217](https://github.com/jl94x4/Server-Manager-Portal/commit/47e0217f03cc3c8cafdac3109087856843bfc978))
* resolve readConfig and readUsers undefined reference errors ([1aada11](https://github.com/jl94x4/Server-Manager-Portal/commit/1aada11ccfbe7c437445ee89785a1789987fc52d))
* Resolve undefined fetchPlexStatsInternal error in newsletter generator ([57541de](https://github.com/jl94x4/Server-Manager-Portal/commit/57541dee92dd17cb56859a121b98af4deeaffcfc))
* resolve unknown API error when removing status monitor groups and services ([f0a8046](https://github.com/jl94x4/Server-Manager-Portal/commit/f0a80467d9f2457c4a44c0a70276039809712a31))
* restore analytics fetching and rendering for admin accounts ([da48408](https://github.com/jl94x4/Server-Manager-Portal/commit/da48408ced9d745509ff16137793bcaa6ac7a4f5))
* restore analytics graphs tab for non-admin users ([25745d0](https://github.com/jl94x4/Server-Manager-Portal/commit/25745d01b91fc89c3ef589b9fa82cd203063f3aa))
* restore circular border on login screen logo ([919bfcd](https://github.com/jl94x4/Server-Manager-Portal/commit/919bfcd8742830cb368a23bca0afa40e1bc9add6))
* restore desktop sidebar sticky nav after overflow change ([8afa671](https://github.com/jl94x4/Server-Manager-Portal/commit/8afa6713764067645a6693d0bfb78bcddb61aaec))
* right-align mobile theme dropdown to prevent screen overflow ([9dbcc0d](https://github.com/jl94x4/Server-Manager-Portal/commit/9dbcc0d35e23e281bfaadc8b99754d536eee982e))
* route settings save to stream rules on rules tab ([f914f9d](https://github.com/jl94x4/Server-Manager-Portal/commit/f914f9d83352395b3adf0104c1098a8e670550bf))
* Save Tautulli configuration correctly in backend api ([ab85010](https://github.com/jl94x4/Server-Manager-Portal/commit/ab85010746d1f951e2476bc18962bf3ef77f233d))
* set default expiry for newly imported Plex users to unlimited ([dcbcc3d](https://github.com/jl94x4/Server-Manager-Portal/commit/dcbcc3d3d23222048d0120d682b6e223d5b2f118))
* show login above request access on mobile ([df19b6e](https://github.com/jl94x4/Server-Manager-Portal/commit/df19b6e7298835bc8a4ccdf080e347c1ff5b785d))
* shrink long usernames on mobile, icon-only theme picker in mobile nav ([5b9ff61](https://github.com/jl94x4/Server-Manager-Portal/commit/5b9ff61008ae67b3c0824230c3c9b29c81f13561))
* shrink Most Watched posters to fit more per row ([40e088c](https://github.com/jl94x4/Server-Manager-Portal/commit/40e088cbb75bc727c2bc526666c6bf3083da8e6c))
* sort plex history by newest first ([c6d75bc](https://github.com/jl94x4/Server-Manager-Portal/commit/c6d75bc216c739a8262a4961cac20fe801a8d79d))
* stretch sidebar footer to prevent off-center theme select box ([f82adfc](https://github.com/jl94x4/Server-Manager-Portal/commit/f82adfc609310f0490e17d261de093597a254c0f))
* syntax error in analytics view ([1705979](https://github.com/jl94x4/Server-Manager-Portal/commit/17059792732586355ab65e6255eef525454cfdde))
* syntax error missing brace ([a94657b](https://github.com/jl94x4/Server-Manager-Portal/commit/a94657bb09701ed7f965fabc8f3ad3d9676a2b4d))
* undefined publicConfig reference in Navigation ([1f328d2](https://github.com/jl94x4/Server-Manager-Portal/commit/1f328d2bb03c5bad5d8e6ed8f840870f4a354921))
* Unraid appdata permissions via Docker entrypoint ([eb7723d](https://github.com/jl94x4/Server-Manager-Portal/commit/eb7723de16162dbf7a2615accbdf07e413b36a88))
* unraid template documentation and setup wizard state persistence ([ada9eac](https://github.com/jl94x4/Server-Manager-Portal/commit/ada9eacda97be438ec207e8d6aff5595420a5bc7))
* Update analyticsData type definition to include max stream stats ([3fb7515](https://github.com/jl94x4/Server-Manager-Portal/commit/3fb7515c9e95d4ffef01d2711213dca8f9e6c407))
* Update broken Unsplash URL for Media Profile background ([1fd9fd0](https://github.com/jl94x4/Server-Manager-Portal/commit/1fd9fd0d71593fb22f4d179217f0e7d5227aea6f))
* update ca_profile.xml to correctly use the CommunityApplications root node ([dd74e6c](https://github.com/jl94x4/Server-Manager-Portal/commit/dd74e6c76c3c917c9c47b5b78bdae823f8388f08))
* update ca_profile.xml to correctly use the Profile schema for Unraid CA ([7591c2f](https://github.com/jl94x4/Server-Manager-Portal/commit/7591c2fc5762a4a3ddd1f0dc70d6ac524ac2977a))
* Use CustomSelect for home layout rows and preserve settings on backend ([a2b1a18](https://github.com/jl94x4/Server-Manager-Portal/commit/a2b1a18c1eb5d131d7c637a0465eceee34867823))
* Use landscape artwork for Top Binge and Top Movie background images ([dd1731b](https://github.com/jl94x4/Server-Manager-Portal/commit/dd1731ba813d059b578da5a43bfeba51fae4d06b))
* use node user in Docker image instead of conflicting uid 1000 ([8376870](https://github.com/jl94x4/Server-Manager-Portal/commit/8376870833b3f391fc1ce2c7bbb9ca65a01d0fe6))


### Performance Improvements

* Add in-memory metadata cache to speed up analytics endpoints ([e21708e](https://github.com/jl94x4/Server-Manager-Portal/commit/e21708e3b704f51b19d073582f703c9352fe111a))
* increase plex stats cache duration to 24 hours ([c244fda](https://github.com/jl94x4/Server-Manager-Portal/commit/c244fda638738e22d895f5c960af2117551a8289))
* parallelize api fetches and add disk caching for library stats ([ea2e3a1](https://github.com/jl94x4/Server-Manager-Portal/commit/ea2e3a16bd0578f24d0495d9ca9bd88c8b0b9789))

## [Unreleased]

### Added
- **IMDb Integration**: Added IMDb ID mapping for Sonarr and Radarr, improving media matching and metadata accuracy.
- **JellyStat Integration**: Fully integrated JellyStat for Jellyfin analytics, bringing it on par with Tautulli for Plex. Added to README documentation.

### Changed
- Split calendar page into separate Sonarr and Radarr tabs.
- Scope Media Stack page content to the active Sonarr or Radarr tab.
- Rename sidebar category back to Media Stack.

## [v1.0] - 2026-07-03

### Added
- Initial stable release.
- Fully automated management and analytics portal for Plex and Jellyfin.
- Personal Analytics & Wrap-Up features.
- Admin Dashboard with Live Session Monitor.
- Customizable Home Layout.
- Discover Page with Live activity and Trending content.
- Media Stack integration with Sonarr and Radarr.
- User Onboarding & Access Management via Invite Link System, Plex OAuth, and Jellyfin Auth.
- Automated Communications via HTML emails.
- Public-Facing Pages (Landing Page, Status Page, Invite Claim Page).
- Custom UI Themes.

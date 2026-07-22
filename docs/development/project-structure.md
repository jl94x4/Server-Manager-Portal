# Project Structure

```text
Server-Manager-Portal/
├── index.js
├── index.tsx
├── client/
│   ├── App.tsx
│   ├── screens.tsx
│   ├── home/
│   ├── settings/
│   ├── shared/
│   ├── setup/
│   └── maintenance/
├── input.css
├── static/
├── lib/
├── config/
├── Dockerfile
├── docker-compose.yml
├── unraid/
├── docs/
├── .env.example
├── build-version.js
└── package.json
```

## Backend

`index.js` contains the Express API, authentication, Plex and Jellyfin integrations, email handling, security headers, rate limiting, background jobs, and static asset serving.

`lib/portal-request/` holds seams for the portal-native Discover/request engine (replacing Seerr over time). See [seerr-uncouple-inventory.md](./seerr-uncouple-inventory.md).

## Frontend

`index.tsx` mounts the React application. The app source lives in `client/`:

| Path | Purpose |
| --- | --- |
| `client/App.tsx` | Application shell and responsive navigation |
| `client/screens.tsx` | Main views, dashboards, login, and shared screens |
| `client/home/` | User dashboard layout and widgets |
| `client/settings/` | Settings panels |
| `client/shared/` | API helpers, types, themes, formatters, UI helpers |
| `client/setup/` | First-time setup wizard |
| `client/maintenance/` | Library maintenance UI |

## Styling and Builds

Tailwind source lives in `input.css`, and generated CSS is written to `static/tailwind.css`.

The React bundle is produced by esbuild and written to `static/bundle.js`.

## Runtime Data

`lib/data-paths.js` centralizes runtime file paths and migrates legacy root-level JSON files into `config/`.

`config/` and `backup/` are runtime directories and should not be committed.

## Docs

The VitePress documentation source lives in `docs/`.

```bash
npm run docs:dev
npm run docs:build
npm run docs:preview
```

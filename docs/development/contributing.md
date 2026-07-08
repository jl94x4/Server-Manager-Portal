# Contributing

## Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set `JWT_SECRET`, then run:

```bash
npm start
```

The app builds before it starts. During frontend work, rerun `npm run build` after changing React or Tailwind files.

## Build Commands

| Command | Purpose |
| --- | --- |
| `npm run build:css` | Build Tailwind CSS into `static/tailwind.css` |
| `npm run build:js` | Bundle React into `static/bundle.js` |
| `npm run build:version` | Update `version.txt` |
| `npm run build` | Run all app build steps |
| `npm run docs:dev` | Start the VitePress docs dev server |
| `npm run docs:build` | Build the static docs site |
| `npm run docs:preview` | Preview the built docs site |

## Pull Request Checklist

- Keep runtime secrets out of git.
- Avoid committing generated runtime data from `config/` or `backup/`.
- Run the relevant build command before opening a pull request.
- Update docs when behavior, setup, configuration, or deployment changes.
- Add focused tests or manual verification notes when touching shared flows.

## Release Notes

User-facing changes belong in `CHANGELOG.md`.

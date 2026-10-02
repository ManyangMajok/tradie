# Tradify Web App

Laravel 13 + Inertia.js v2 + React 18 + TypeScript.

Currently an empty shell — run Phase 0 setup from `docs/10-build-phases.md` to initialise.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
php artisan serve
```

See:
- `docs/02-architecture.md` for stack & topology
- `docs/03-database.md` for schema
- `docs/09-development-guide.md` for conventions

Claude Code initialises this directory per Phase 0.

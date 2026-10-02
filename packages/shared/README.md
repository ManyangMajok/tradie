# @tradify/shared

Shared code used by both mobile apps:
- API client (`src/api/`) — axios-based, calls /api/v1/*
- Auth (`src/auth/`) — token store interface, useAuth hook
- Types (`src/types/`) — Job, JobOffer, User, etc.
- Schemas (`src/schemas/`) — zod schemas for form validation
- Formatters (`src/formatters/`) — currency, dates, AU phone numbers
- Constants (`src/constants/`) — enums mirroring backend
- Echo (`src/echo/`) — Reverb WebSocket setup

Initialise during Phase 2.A. See `docs/11-mobile-apps-spec.md §4` for structure.

This package is NOT used by the web app. The web app has its own API client bundled with Inertia.

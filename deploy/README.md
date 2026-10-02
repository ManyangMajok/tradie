# Deploy scripts

Shell scripts for deploying to production and staging.

Populated in Phase 0.5 per `PROVISIONING.md §8`.

Expected contents (once populated):
- `deploy.sh` — zero-downtime production deploy
- `deploy-staging.sh` — staging deploy (see `STAGING.md §9`)
- `rollback.sh` — revert to previous release
- `backup-now.sh` — manual DB backup trigger

Never commit secrets here. Secrets come from server-side `.env`.

# AskMyLawyer working context

Before project work, read `docs/README.md` and `docs/PROJECT_STATE.md`, then the relevant architecture, API or component document. Follow any more specific instructions under each application; admin has Next.js version-specific documentation requirements.

After meaningful implementation or verification, update `docs/PROJECT_STATE.md`, `docs/WORKLOG.md` and affected handover documentation. Keep completed work, source/configuration presence and provider/device acceptance distinct. Never store credentials or user data in these files.

API changes: regenerate the source-derived collection with `npm run docs:api` in backend and verify with `npm run docs:check`. Read `docs/api/README.md` before executing collection requests.

Reuse documented components, styles, API clients and service boundaries. Preserve existing user changes. Local source/database and live AWS are separate; do not silently connect development mutations to production. Storage source has been recovered from EC2 and locally tested; read docs/STORAGE_RECOVERY.md for changes/limits before deployment.

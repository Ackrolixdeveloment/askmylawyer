# Developer handover

Start here before changing code. These files describe the current working source, not an assertion that every integration is production-tested.

| Read | Purpose |
|---|---|
| [Project state](PROJECT_STATE.md) | Current branch/baseline, completed checks, environment separation and blockers |
| [Architecture and coding](ARCHITECTURE.md) | Request flow, feature ownership, business rules and code navigation |
| [Runbook](RUNBOOK.md) | Install/run/test/debug, migration and deployment checks |
| [Components and styling](COMPONENTS_AND_STYLING.md) | Reusable React/Flutter components, CSS ownership and change patterns |
| [API guide](api/README.md) | Import/use collection, authentication, examples and troubleshooting |
| [API inventory](api/INVENTORY.md) | Every mounted HTTP route linked to its handler |
| [Work log](WORKLOG.md) | Decisions, evidence and changes across sessions |
| [AWS audit](DEPLOYMENT_AUDIT.md) | Observed live checkout/configuration/migration differences |
| [Storage recovery](STORAGE_RECOVERY.md) | Recovered source, path safeguards and verification limits |
| [Local staging](LOCAL_STAGING.md) | PostgreSQL 18 sandbox, migration/restore rehearsal and commands |
| [Provider acceptance](PROVIDER_ACCEPTANCE.md) | Sandbox payment, OTP, calls and device evidence checklist |

For the full request-field/validator reference use [routes.json](api/routes.json). Import [the collection](api/AskMyLawyer.postman_collection.json) and [blank local environment](api/Local.postman_environment.json) into Postman.

The older root `PROJECT_REVIEW.md`, `ADMIN_FRONTEND_HANDOVER.md`, `CONSULTATION_INTEGRATIONS.md` and `SUPPORT_IMPLEMENTATION.md` retain useful implementation history. Their dated/superseded findings must not override the current source or the verification status here.

## Keep this useful

For each meaningful change, update the affected architecture/component/API notes, PROJECT_STATE and WORKLOG. Record what passed, the environment, the code revision and what remains unverified. Do not copy credentials, tokens, private keys, user exports or database dumps into these tracked files.

After changing controllers/DTOs/module mounting, run `npm run docs:api` and `npm run docs:check` in `backend`. Commit the generator and artifacts together. Generated examples are templates; acceptance tests are separate. A source-derived contract fingerprint is used so an unrelated Git commit does not invalidate the collection.

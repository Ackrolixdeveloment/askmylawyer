# Existing hosted testing backend upgrade — 17 November 2026

The user confirmed all current accounts/consultations/payments are testing data and the application has not launched. Reuse the existing EC2 and Amplify main; no new AWS instance.

## Confirmed recovery point

User-created private backup: `/home/ubuntu/askmylawyer-backups/20261117-104604` contains database.dump, backend.env, unit, original storage source, backend-dist.tgz, uploads.tgz and repository.bundle. Database dump was actually restored into independent `aml_upgrade_verify_20261117_104604`; its 33 applied migrations were verified. Source service remained unchanged. No original DB reset/drop was performed.

Observed service user is ubuntu, executable /usr/bin/node, no systemd drop-ins or EnvironmentFiles reported. Existing backend source is e0882d0, while Amplify Deployment 8 references ef3a365.

## Controlled sequence

1. Publish a dedicated reviewed upgrade candidate branch without changing Amplify main automatically.
2. Prepare the candidate in a separate release directory, retain the original .env/encryption/provider configuration, and point local upload storage to its existing absolute directory. Do not copy secrets to Git.
3. Install dependencies/generate/build with a bounded Node heap and lower process priority. Check the 33-to-42 migrations against the restored database before cutover.
4. Stop the testing API briefly, apply committed migrations to the original testing database, switch the existing systemd service to the reviewed release and start it. Keep original source/unit/env/dump/uploads for recovery. Never run migrate reset or seed existing users implicitly.
5. Verify service health, 42 migrations, admin login, new dashboard/billing/support APIs and preserved testing users/uploads before considering the upgrade complete.
6. Configure sandbox payments and explicitly review environment/engine bypass flags, then perform device/provider acceptance. A successful upgrade is not a passed payment/call test.

This file records the plan/evidence, not a claim that the candidate or service has already been deployed. Future updates belong in WORKLOG and PROJECT_STATE.

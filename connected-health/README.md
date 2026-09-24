# My Timber connected health — integrated review candidate

Approved read-only scope: Apple Health / Health Connect, weight, height, steps and sleep. Same existing My Timber accounts, website/PWA screens and service. Authoritative baseline `cb7db5b2cd13b12fb87553a2e33be7d0a9a11ad6`; review branch `feat/connected-health-20260924`, PR #805. No production deployment or database migration.

## Implemented

- Native iOS and Android consent screens: explicit first-party selected-category agreement, real OS read-permission requests, existing app session, fixed first-party HTTPS uploads, no general JavaScript/native bridge, account/session checks before uploads, cancellation and honest partial/error outcomes.
- Foreground **user-triggered** imports; an already-active unchanged consent can be reused without requesting agreement on every sync. This is not background or automatic app-open sync.
- Same-backend, source/date-labelled imported observations; weight kg, height cm suggestion, platform daily steps, Apple asleep-interval union and Android sleep-session duration kept distinguishable. Missing values are not zero; manual/clinical answers are not overwritten.
- Optional Connected health data controls within existing settings/progress HTML. Stop syncing, withdraw personalisation, delete copies, and explicitly confirm a height reading. Ordinary web/PWA clients do not claim direct device-health access.
- Existing privacy export append; erasure statements compose into existing optional-health/account-deletion transactions. Account deletion still returns request received, not a false whole-account-erased success. Retained disabled connection revisions prevent in-flight imports from resurrecting deleted optional measurements.
- Bounded, transactional, idempotent imports; no health store writes, employer access, advertising or external AI use.

## Reproducible integration, not a production toggle

Run `node connected-health/prepare-integration.mjs` once in a clean checkout. Exact-source replacement preconditions fail on drift. It composes the existing native shells and privacy handlers, records hashes and keeps production wrangler configuration unchanged. The candidate Worker entry is `connected-health/worker.mjs`. A compile-only configuration contains no real bindings, cron or routes. `schema.sql` is outside automatic migrations. Do not enable or deploy merely because the module tests pass.

The dedicated workflow builds the actual existing iOS simulator app and Android debug app with the integration, compiles the composed Worker, exercises real SQLite behavior and runs Chromium against a loopback fictional-account fixture. It has read-only repository access and no deployment/store credentials. No real-member sign-in, device reading, payment or push is automated.

## Evidence boundaries

Source commit `1b50ef34fa9cbd7b3b4f2986109c35ab152ff2a9`, run `35967587178`: 70 unit/integration tests, nine browser scenarios, composed Worker compile and full iOS simulator app build passed. Android reader/coordinator library passed; full Android composition exposed an AGP plugin-version registration conflict. This follow-up explicitly registers the same library plugin version in the existing root build and requires a fresh complete run. Never count that earlier Android app job as passed.

## Remaining before production acceptance

Physical iPhone/Android permission, partial permission, actual import, account switch, interrupted network, off/delete and cross-device read-back proof; isolated hosted candidate and full existing-account regressions; signing and store health declarations; reviewed first-party privacy notice/DPIA, lawful-basis/retention/backup-erasure/rate-limit operations; correct HealthKit anchors/Health Connect changes including upstream deletion propagation. Automatic app-open sync, the one-time Today introduction and fuller Today/story/graph integration are not claimed implemented by the current manual-import controls. Keep release blocked until the agreed end-to-end scope is reconciled and accepted.

Run `node --test connected-health/tests/*.test.mjs`; after preparation also run `node --test connected-health/tests/prepared-privacy.mjs my-timber-app/tests/source.test.mjs`. All fixtures are fictional. Hume/Renpho export coverage and proprietary scores remain unverified.

## Official references

https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
https://developer.apple.com/documentation/healthkit/setting-up-healthkit
https://developer.android.com/health-and-fitness/health-connect/get-started
https://developer.android.com/health-and-fitness/health-connect/read-data
https://developer.android.com/health-and-fitness/health-connect/aggregate-data
https://developer.android.com/jetpack/androidx/releases/health-connect

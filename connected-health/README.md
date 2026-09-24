# My Timber connected health — review candidate

Approved by Matt, 24 September 2026. Baseline `cb7db5b2cd13b12fb87553a2e33be7d0a9a11ad6` in the authoritative `shiftsometimber/shift-core` repository. Same member accounts, same PWA and website. No replacement product.

The previous GitHub source-write failure was retried successfully. This branch restores the saved four-metric backend, native readers and their actual tests. No production configuration or live database has changed.

## Implemented slice

Read-only Apple Health / Android Health Connect: weight, height, daily steps and sleep. Existing-session authentication seam, explicit versioned granular consent, transactional idempotent batches, provider/source/date provenance, session/account-change protection, stop/withdraw/delete, export and erasure functions. Imported values remain separate from manual/clinical answers. No external AI, advertising, employer data or device-store writes.

`CONNECTED_HEALTH_V1_ENABLED` is default-off. Schema is outside automatic migrations. No connection button is exposed by this slice. 52 local synthetic tests have been rerun successfully against the actual SQL. A read-only/no-secrets CI workflow compiles the actual native readers. Reader compilation is not device-sync evidence.

## Remaining integration and release gates

Native account-bound consent/upload coordinator; existing My Timber settings/progress presentation; Worker registration; whole-account export/erasure wiring; explicit upstream deletion/change tracking; retention/rate-limit/backup-erasure policy; privacy notice/DPIA/store declarations; full regression matrix and physical iPhone/Android consent/import/revoke/offline/account-switch proof. These gates are not waived by source recovery or successful compilation.

Source metrics: weight kg; height cm as a suggestion until explicitly confirmed; steps from platform aggregation; sleep labelled Apple asleep-interval union or Android session duration (not silently equivalent). Missing readings are not zero, and empty Apple reads do not prove permission denial or justify deleting history. Native first reads cover 30 local calendar dates, no background or extended-history permissions.

Run `node --test connected-health/tests/connected-health.test.mjs`. Fictional accounts and local SQLite only. Do not test against production member records. No signing identity, store submission or Cloudflare deployment is part of this branch.

## Official references

- https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- https://developer.apple.com/documentation/healthkit/setting-up-healthkit
- https://developer.android.com/health-and-fitness/health-connect/get-started
- https://developer.android.com/health-and-fitness/health-connect/read-data
- https://developer.android.com/health-and-fitness/health-connect/aggregate-data
- https://developer.android.com/jetpack/androidx/releases/health-connect

Hume/Renpho field coverage and proprietary scores remain unverified.

# My Timber health device acceptance

This is a private development harness, separate from the production app,
member database and v1.0 store review. It runs the actual connected-health UI,
authentication, consent, import and privacy-export modules against two synthetic
members. It has no medicine, payment, AI or email handlers.

## Status on 2 October 2026

- 34 software tests pass locally, including the two-account harness and UI feedback.
- Native policy/sleep calculations and both native shells require CI compilation
  after these edits; see the exact commit's build receipts.
- No separate hosted database/service has been provisioned in this run.
- Both connected development Macs are offline; physical-device tests are not run.
- Release builds refuse health import. Debug builds also refuse it until a valid
  non-production HTTPS origin is explicitly configured and the test service's
  isolation marker is verified. Production domains/subdomains cannot be selected.

## Prepare the private service on the connected development machine

Use the existing Cloudflare login. Create a **new** D1 database named
`shift-my-timber-health-test-db`; do not reuse any production or partner database.
From the repository root:

```sh
npx wrangler d1 create shift-my-timber-health-test-db
node my-timber-app/scripts/configure-health-test.mjs NEW_DATABASE_UUID
```

The configuration helper refuses IDs found in the production `wrangler.jsonc`
and writes only the separate harness config. Confirm the D1 UUID and name in the
create receipt before either migration. The harness also refuses databases that
lack its marker or contain members other than fixtures 101 and 102.

```sh
npx wrangler d1 execute shift-my-timber-health-test-db --remote --config my-timber-app/health-test/wrangler.health-test.json --file my-timber-app/health-test/schema.sql
npx wrangler d1 execute shift-my-timber-health-test-db --remote --config my-timber-app/health-test/wrangler.health-test.json --file migrations/021_device_health_sync.sql
npx wrangler secret put HEALTH_TEST_ACCESS_CODE --config my-timber-app/health-test/wrangler.health-test.json
npx wrangler deploy --config my-timber-app/health-test/wrangler.health-test.json
```

Set a private, random access code of at least 24 characters through the secret
prompt. Do not commit, log or paste it into a report. Use the **actual** HTTPS
address returned by deploy, not an assumed workers.dev address. Verify its
`/v1/device-health/test-environment` response before building the native candidate.
These commands have been prepared, not executed.

## Build the native candidate for that exact origin

Android, from `my-timber-app/android`:

```sh
gradle --no-daemon -PmyTimberHealthTestOrigin="$SHIFT_HEALTH_TEST_ORIGIN" :app:assembleDebug
```

iOS: prepare the approved resources with `scripts/prepare.py`, generate the
Xcode project, then build the **Debug** configuration with
`MY_TIMBER_HEALTH_TEST_ORIGIN="$SHIFT_HEALTH_TEST_ORIGIN"`. Use the development
bundle ID, the existing authorised development team and a profile with HealthKit
enabled. A simulator compilation is not an iPhone-signed build. Do not change
or submit the v1.0 review build.

The web account and native upload use the same exact test origin. Uploads refuse
redirects. The app checks the test marker and health consent before opening OS
permissions; it checks that the signed-in session has not changed before saving.

## Device acceptance

In the app, sign in to test member A with the private access code and enable
optional tracking. Grant only the health types needed for the test. Use known
values in the OS health store, record their times, and compare the saved result.
Then repeat with member B and verify account separation.

Test permission denial, partial permission, no supported readings, OS revocation,
expired sign-in, offline/server failure, repeated sync, consent withdrawal,
disconnect/reconnect, and account changes while permissions are open. Verify
weight, steps, blood pressure and heart rate first, then each additional type.
Confirm no writes back to the OS health store.

Sleep is recorded as **actual asleep minutes in the latest episode**, merging
overlaps and excluding awake gaps. An awake gap over two hours starts a separate
episode. Android sessions without explicit asleep stages are omitted rather than
counting the entire time in bed. Device/source semantics still need acceptance.

The app shows only data the OS makes readable; it cannot prove the accuracy or
calibration of an attached watch, scale or monitor. This harness is not a clinical
assessment or a test of the complete production member journey.

## Clear test data

Use **Delete my test readings** in each test account when finished, then sign out.
Delete the dedicated Worker and D1 database after the acceptance session. Test
health values are not automatically purged by this harness. Preserve only a
redacted result, app/database identifiers and pass/fail evidence; do not attach
raw health values or session/access secrets to a public PR.

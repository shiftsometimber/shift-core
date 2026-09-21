# PWA candidate review — 21 September 2026

Draft PR: https://github.com/shiftsometimber/shift-core/pull/784

Approved icon: existing `/assets/favicon.svg` and `/assets/apple-touch-icon.png`.
Both were visually inspected on the live site: the cream S within the ash-green
circle. `/assets/st-logo.svg` is the old ST mark and is deliberately not used.
No logo artwork has been redrawn. The exact same-origin assets are used for the
install manifest, Apple home-screen icon and notification icon.

## Verified

- Reconciled main `1af0b7bb9e2d354198bcee918cbbd2da2b11b7fc` (Grub repair and
  ingredient/recovery repairs preserved).
- 258 Node tests passed before protocol correction: PWA/SQL/service-worker/UI states, existing Fit delivery,
  member experiences, auth, session cookies, public navigation and privacy.
- A real-library protocol smoke caught the existing Fit library's legacy
  `aesgcm`/`WebPush` format. New PWA sends now use pinned `web-push@3.6.7`,
  explicitly `aes128gcm` and modern signed `vapid` headers, with existing keys.
  `push-protocol.test.mjs` verifies actual encryption framing/headers and signature
  with transport mocked. This is not device-delivery proof. Fit's own sender is
  intentionally unchanged and must not be described as iPhone-delivery verified.
- After correction and adding the public-manifest alias: **260 tests passed**.
  CI additionally exercises the real Cloudflare crypto runtime with ephemeral
  fixture keys and a non-network transport; no notification is sent by that gate.
- Actual production Worker compiled with Wrangler dry-run. No production deploy.
- Candidate uses existing sign-in and launches Today; only My Timber HTML gets
  the small install/reminder disclosure. Header/navigation are not rewritten.
- No cache API, offline health records, price caching, background saves or hidden
  permission request. Device opt-ins default off; no email subscription is added.
- Persisted opt-ins and test sends require verified, same-origin member sessions.
  Log-out, reset/revocation, expiry and deletion-session revocation stop scheduling.
- Scheduler tests cover UK daylight-saving time, saved-check-in suppression,
  concurrent claims, retries, accepted-send receipt failure, expired endpoints and
  page starvation. Preview has no scheduler and no production bindings.
- Data export includes preference/delivery metadata without bearer endpoints or
  encryption keys; off deletes this check-in device's records without changing Fit.

## Still required before production

1. Consenting physical iPhone and Android: install, verify S icon, reopen Today,
   allow notifications, send one test while closed/locked, tap it, test off.
   Badge support is browser-dependent. Provider acceptance is not delivery proof.
2. Full candidate deployed to an approved whole-site staging environment: verify
   real login, return-to flow, check-in persistence and existing account recovery
   in installed mode. This deliberately limited device-test shell is not that proof.
3. Refresh main, rerun regressions, receive release approval and update the current
   pinned runtime release scope. No Pages rebuild or catalogue publication is needed.

## Device preview

https://shift-my-timber-pwa-preview.matobrien.workers.dev/

Separately named Worker and D1, no production records/credentials, email or cron.
Anonymous fictional test accounts only. Start is an explicit reviewer action.
The read-only review link does not create an account. Subscription and test-send
buttons require explicit consent. Finish removes the reviewer's preview rows;
remove the preview home-screen app too. The preview expires 3 days after its last
deployment. Unfinished preview records require operator cleanup after the review;
the time gate stops use/sends but does not itself erase the database.

Rollback after any later authorised release: set `MY_TIMBER_PWA_ENABLED=false`
to stop the new routes/presentation/scheduler; preserve existing Fit service-worker
path/keys and private records. Returning to the old Worker stops all new check-in
sends but does not revoke already displayed notifications or erase opt-in records.

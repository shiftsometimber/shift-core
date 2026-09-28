# Native health integration scope — 28 September 2026

Status: proposed implementation, not connected. Existing native clients are WKWebView and Android WebView; no HealthKit capability or Health Connect bridge was found in this source review. Browser layout changes cannot add native access.

## First bounded scope

| Data | Read into My Timber | Write to device store | Meaning |
| --- | --- | --- | --- |
| Weight | Yes, subject to permission and account-storage opt-in | Only weight explicitly entered by the member, separate permission | Timestamped measurement; retain unit and provenance |
| Steps | Yes, daily aggregate using platform deduplication | No | Daily activity count, not proof of a Fit session |
| Sleep | Later, after overlap/source policy is verified | No | Duration and intervals; never substitute for subjective sleep rating |
| Goals and feedback | Remain in My Timber | No | No invented mapping to clinical measurements |

## Same account across clients

Installed app reads permitted device records, shows a review of what will be stored, and sends accepted records to authenticated My Timber endpoints under separate account-storage consent. Website reads the same server records. Website does not directly call HealthKit/Health Connect. A website-entered weight can reach the device store when the installed app next syncs, if write permission exists; instant/background sync is not promised.

No privileged bridge is to be exposed generally to remotely loaded pages. Prefer a native connection screen and a narrowly scoped authenticated sync service. Bind each sync operation to the current member and generation; cancel pending work on logout/account change. Exact production and preview origins must be separately allowlisted. Never infer authentication from a member ID supplied by web content.

## Required contract before implementation

- Per-platform record ID, data type, source application/device, timestamps/timezone, original unit and normalised value, version/deletion marker; idempotent user-scoped imports.
- No re-export of imported records. A saved meal is not eaten; a planned workout is not completed. No clinical decisions from imported data.
- HealthKit request completion is not proof of read access. Empty results stay unknown; do not display 'all permissions granted'.
- Android permissions declared consistently in manifest and Play Console. Handle partial grant, revocation, unavailable provider and unsupported devices.
- Imports re-check account and consent before commit. Pausing/disconnecting stops new imports; deleting existing copies is a separate explicit choice.
- Keep health content out of analytics, advertising and general logs. Native disclosure, account storage, retention, deletion and store declarations need to match actual implementation.

## Acceptance

Physical iPhone and Android: grant/deny/partial grant; revoke; offline retry; interrupted sync; repeated import; source update/deletion; unit conversion; daylight-saving boundary; account switch/logout; duplicate sources; empty histories; app-to-web visibility; web-entered weight to native store; deletion choices. Use authorised fictional/test records, not a user's real health history. Native signing and store approval are separate gates.

No added paid vendor is proposed. Existing hosting usage could still increase; no claim of zero running cost. Confirm volume and limits before enabling recurring sync.

Primary sources reviewed 28 September 2026:
- https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- https://developer.apple.com/documentation/healthkit/setting-up-healthkit
- https://developer.android.com/health-and-fitness/health-connect/get-started
- https://developer.android.com/health-and-fitness/health-connect/write-data
- https://developer.android.com/health-and-fitness/health-connect/sync-data

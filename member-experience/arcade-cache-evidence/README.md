# Installed app update repair

Live member version: 17bb6c7a-8f46-45f5-9ce3-e81cd7946adf
Live: 2026-11-04T23:44:16.712Z; verified: 2026-11-04T23:44:25.780Z
Source: 5408d5aa4d904975f332c50f8102b26249c26f41

The original arcade release was served correctly to fresh sessions, but an already-open app continued executing its seven-game shell. The previous verification missed that upgrade path.

## Repair

- Current public assets are read from the current shell cache. A stale fingerprint is resolved to this release, rather than matched against every retained cache.
- Private APIs stay network-only; no sign-in, consent, saved record or cache key is cleared. Offline fallback to older code is limited to entertainment modules.
- On return to the app, worker update checks are throttled. New releases show an explicit Open latest version link in content; no form, basket or active game is forcibly reloaded.
- The existing pre-fix JavaScript needs one normal app reopen or an explicit refresh link. Updating a service worker does not replace JavaScript already running in an open page.
- Today says All 8 games; that door opens eight tiles including Shed Fighter. The new introduction is retained.
- Shop matched its immediately preceding live content and links in both engines. This release changed no Core service, clinical route, payment code, frame or navigation.

## Proof

| Test | Chromium | WebKit |
|---|---:|---:|
| Actual captured seven-game shell → same browser profile, current shell | 13 PASS | 13 PASS |
| Live Today, eight games, stale asset URL and cached reopen | 13 PASS | 13 PASS |

17 focused model/cache/update tests passed. Synthetic accounts only. Browser mobile emulation at 390 × 844; no physical phone result is claimed. The seven-game fixture is isolated to the synthetic test host, selected by an unguessable test-only cookie. It is excluded from the production packet. Removing that fixture cookie does not remove sign-in or browser caches.

The regression opens an unsaved weight form before the background worker update and checks it stays intact. After an explicit app reopen, the same account shows All 8 games and opens Shed Fighter; saved bests, food and pile are unchanged.

[Chromium upgrade recording](test/chromium-upgrade.webm) · [WebKit upgrade recording](test/webkit-upgrade.webm)

[Chromium live recording](live/chromium-verification.webm) · [WebKit live recording](live/webkit-verification.webm)

## Rollback

node member-experience/tools/arcade-cache-release.mjs rollback

Restores the preceding eight-game member version 0bc31907-6556-4d1c-9d31-8ea5659a8bf7.

## Results

| Phase | Engine | Check | Result |
|---|---|---|
| Cached upgrade | chromium | Captured previous release really displays All seven games | PASS |
| Cached upgrade | chromium | Seven-game shell persists in real service-worker cache | PASS |
| Cached upgrade | chromium | Previously cached arcade really has only seven tiles | PASS |
| Cached upgrade | chromium | Unsaved form is present before the background worker upgrade | PASS |
| Cached upgrade | chromium | Only the test fixture cookie is removed; sign-in cookie remains | PASS |
| Cached upgrade | chromium | Background upgrade neither reloads the frame nor discards an unsaved form | PASS |
| Cached upgrade | chromium | Normal app reopen upgrades seven to eight without cache clearing | PASS |
| Cached upgrade | chromium | Stale asset URL receives current code rather than old cached code | PASS |
| Cached upgrade | chromium | Same installed browser now opens all eight games and Shed Fighter | PASS |
| Cached upgrade | chromium | Updated introduction survives upgrading the cached app | PASS |
| Cached upgrade | chromium | New eighth game opens from an upgraded seven-game app | PASS |
| Cached upgrade | chromium | Upgrade preserves sign-in, daily pile, food and saved arcade bests | PASS |
| Cached upgrade | chromium | No execution errors during upgrade | PASS |
| Cached upgrade | webkit | Captured previous release really displays All seven games | PASS |
| Cached upgrade | webkit | Seven-game shell persists in real service-worker cache | PASS |
| Cached upgrade | webkit | Previously cached arcade really has only seven tiles | PASS |
| Cached upgrade | webkit | Unsaved form is present before the background worker upgrade | PASS |
| Cached upgrade | webkit | Only the test fixture cookie is removed; sign-in cookie remains | PASS |
| Cached upgrade | webkit | Background upgrade neither reloads the frame nor discards an unsaved form | PASS |
| Cached upgrade | webkit | Normal app reopen upgrades seven to eight without cache clearing | PASS |
| Cached upgrade | webkit | Stale asset URL receives current code rather than old cached code | PASS |
| Cached upgrade | webkit | Same installed browser now opens all eight games and Shed Fighter | PASS |
| Cached upgrade | webkit | Updated introduction survives upgrading the cached app | PASS |
| Cached upgrade | webkit | New eighth game opens from an upgraded seven-game app | PASS |
| Cached upgrade | webkit | Upgrade preserves sign-in, daily pile, food and saved arcade bests | PASS |
| Cached upgrade | webkit | No execution errors during upgrade | PASS |
| Live | chromium | Shop remains exactly as before the cache repair | PASS |
| Live | chromium | Verified owned synthetic identity | PASS |
| Live | chromium | Today explicitly shows All 8 games | PASS |
| Live | chromium | Today door opens eight games | PASS |
| Live | chromium | Shed Fighter appears as the eighth game | PASS |
| Live | chromium | New introduction is present | PASS |
| Live | chromium | Eighth game opens its phone controls | PASS |
| Live | chromium | Frame did not reload when entering or leaving the arcade | PASS |
| Live | chromium | Normal cached app reopen still shows eight without bypass | PASS |
| Live | chromium | Stale script address resolves to the current release | PASS |
| Live | chromium | Current app does not show a spurious update notice | PASS |
| Live | chromium | Identity, saved bests, food and pile are preserved | PASS |
| Live | chromium | No browser execution errors | PASS |
| Live | webkit | Shop remains exactly as before the cache repair | PASS |
| Live | webkit | Verified owned synthetic identity | PASS |
| Live | webkit | Today explicitly shows All 8 games | PASS |
| Live | webkit | Today door opens eight games | PASS |
| Live | webkit | Shed Fighter appears as the eighth game | PASS |
| Live | webkit | New introduction is present | PASS |
| Live | webkit | Eighth game opens its phone controls | PASS |
| Live | webkit | Frame did not reload when entering or leaving the arcade | PASS |
| Live | webkit | Normal cached app reopen still shows eight without bypass | PASS |
| Live | webkit | Stale script address resolves to the current release | PASS |
| Live | webkit | Current app does not show a spurious update notice | PASS |
| Live | webkit | Identity, saved bests, food and pile are preserved | PASS |
| Live | webkit | No browser execution errors | PASS |

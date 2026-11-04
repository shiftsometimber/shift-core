# Shift Arcade — live release

- Member version: 0bc31907-6556-4d1c-9d31-8ea5659a8bf7
- Live: 2026-11-04T23:07:48.299Z; verified: 2026-11-04T23:08:14.892Z
- Source: e19faf11887beb8c44c29438a8ba6d71e5743e17
- Core unchanged. Shop content and links matched the preceding live version in both browser engines.

## Built

- Exact approved SHIFT ARCADE introduction, eight-tile grid and dynamic All 8 games Today door.
- Shed Fighter: account-owned bests, sound off, Left→Right and Light→Heavy finger sliding, independent touch owners, pause/cancel/blur cleanup.
- Endless Fighter: beat the Foreman and continue into another tougher ladder; best counts fights without a three-fight ceiling.
- Endless Timber Lob: procedural stages beyond seven. Real-physics level-eight win continued to nine; stages 8, 36 and 10,000 loaded in both engines. Highest-cleared-level record; original stars retained.
- Six other engines byte-identical. Runner, stacking, batting and Smash already have open-ended runs/levels. Chop Shop retains repeatable 30-second rounds; Saw Duel retains repeatable races. Neither has a final campaign completion.
- Direct game links preload their existing modules in parallel. No game preloads on Today. No frame, Shop, clinical, payment or Apple changes.
- Offline startup uses an unexpired encrypted snapshot on actual network failure even if navigator.onLine reports true. Explicit unauthorised responses still clear private data.

## Verification

| Phase | Engine | Passed | Failed |
|---|---|---:|---:|
| Test site | chromium mobile emulation + desktop | 45 | 0 |
| Test site | webkit mobile emulation + desktop | 41 | 0 |
| Live | chromium mobile emulation + desktop | 44 | 0 |
| Live | webkit mobile emulation + desktop | 42 | 0 |

86 test-site checks and 86 live checks passed; eight SQL/model tests passed. Synthetic accounts only; no member purchase, message or share sent. Sharing captured locally. Supplied engine helpers advance simulation; actual touch/pointer actions and persisted API reads are checked separately.

| Screen | Live p95 | Median | Samples | FPS |
|---|---:|---:|---:|---:|
| shed-fighter | 1742 ms | 1243 ms | 20 | 60 |
| timber-lob | 1344 ms | 1194 ms | 20 | 60 |

Chromium mobile 390x844, 150ms latency, 200kB/s down, 96kB/s up, 4x CPU. Fresh context per sample; live hosted responses. Browser measurements, not physical-device measurements. Initial Fighter p95 was 2,054 ms; parallel deep-link preloading reduced final test-site p95 to 1,278 ms. No failed samples were removed.

## Limits

- Physical iPhone and Android were unavailable; physical-device proof is not claimed.
- Chromium passed an offline full-page reopen. WebKit passed offline in-shell game navigation/play; its automated offline hard reload reported an internal browser error and is not marked passing.
- Changed-game checks and all eight routes rerun. Prior full G2–G7 mechanics, keyboard, password-login and nudge evidence remains in ../arcade-evidence; those six engines are byte-identical. No fresh physical or assistive-technology audit of every historic requirement is claimed.

## Rollback

Run: node member-experience/tools/shed-fighter-release.mjs rollback

Restores member version 2abe05bf-2f50-4818-8335-a2180293cf7e. Core, routes, schedules and bindings preserved; no data migration.

## Live pass/fail table

| Engine | Check | Result |
|---|---|---|
| chromium | Authenticated synthetic account only | PASS |
| chromium | Shop content and links exactly match preceding live release | PASS |
| chromium | Eight games and exact approved introduction | PASS |
| chromium | timber-lob opens in retained native shell | PASS |
| chromium | G1 endless stage 8 is playable | PASS |
| chromium | G1 endless stage 36 is playable | PASS |
| chromium | G1 endless stage 10000 is playable | PASS |
| chromium | G1 level eight can be won using the real physics engine | PASS |
| chromium | G1 level win continues to level nine | PASS |
| chromium | G1 endless progress saves to member account | PASS |
| chromium | chop-shop opens in retained native shell | PASS |
| chromium | timber opens in retained native shell | PASS |
| chromium | stack-the-shed opens in retained native shell | PASS |
| chromium | saw-duel opens in retained native shell | PASS |
| chromium | timber-smash opens in retained native shell | PASS |
| chromium | over-the-shed opens in retained native shell | PASS |
| chromium | shed-fighter opens in retained native shell | PASS |
| chromium | G8 sound off by default; no example totals or prototype labels | PASS |
| chromium | Phone buttons fit above bottom navigation | PASS |
| chromium | G8 fighter selection starts a match | PASS |
| chromium | G8 uninterrupted Left to Right slide releases old and holds new | PASS |
| chromium | G8 real touch events switch without touchend | PASS |
| chromium | G8 independent pointer owners: releasing second keeps first held | PASS |
| chromium | G8 uninterrupted Light to Heavy slide damages opponent with both | PASS |
| chromium | G8 pause clears held controls | PASS |
| chromium | G8 Special cannot fire before full meter | PASS |
| chromium | G8 combat fills the special meter | PASS |
| chromium | G8 full-meter Special fires and consumes meter | PASS |
| chromium | G8 Block reduces actual CPU damage | PASS |
| chromium | G8 clears the Foreman and continues into a harder fourth fight | PASS |
| chromium | G8 higher best earned offline is queued for its owner | PASS |
| chromium | G8 best saved to member account | PASS |
| chromium | G8 best returns in another authenticated session | PASS |
| chromium | G8 replay returns to fighter selection | PASS |
| chromium | G8 floored result and replay work | PASS |
| chromium | G8 deliberate share contains only game, result and clean arcade URL | PASS |
| chromium | G8 reloaded game restores saved best | PASS |
| chromium | G8 previously loaded game opens offline | PASS |
| chromium | G8 back to Today retains the shell | PASS |
| chromium | Food, daily action and pile unchanged | PASS |
| chromium | G8 signed-out users cannot play | PASS |
| chromium | Eight games fit desktop grid | PASS |
| chromium | G8 desktop controls and canvas fit the shared shell | PASS |
| chromium | No browser execution errors | PASS |
| webkit | Authenticated synthetic account only | PASS |
| webkit | Shop content and links exactly match preceding live release | PASS |
| webkit | Eight games and exact approved introduction | PASS |
| webkit | timber-lob opens in retained native shell | PASS |
| webkit | G1 endless stage 8 is playable | PASS |
| webkit | G1 endless stage 36 is playable | PASS |
| webkit | G1 endless stage 10000 is playable | PASS |
| webkit | G1 level eight can be won using the real physics engine | PASS |
| webkit | G1 level win continues to level nine | PASS |
| webkit | G1 endless progress saves to member account | PASS |
| webkit | chop-shop opens in retained native shell | PASS |
| webkit | timber opens in retained native shell | PASS |
| webkit | stack-the-shed opens in retained native shell | PASS |
| webkit | saw-duel opens in retained native shell | PASS |
| webkit | timber-smash opens in retained native shell | PASS |
| webkit | over-the-shed opens in retained native shell | PASS |
| webkit | shed-fighter opens in retained native shell | PASS |
| webkit | G8 sound off by default; no example totals or prototype labels | PASS |
| webkit | Phone buttons fit above bottom navigation | PASS |
| webkit | G8 fighter selection starts a match | PASS |
| webkit | G8 uninterrupted Left to Right slide releases old and holds new | PASS |
| webkit | G8 uninterrupted Light to Heavy slide damages opponent with both | PASS |
| webkit | G8 pause clears held controls | PASS |
| webkit | G8 Special cannot fire before full meter | PASS |
| webkit | G8 combat fills the special meter | PASS |
| webkit | G8 full-meter Special fires and consumes meter | PASS |
| webkit | G8 Block reduces actual CPU damage | PASS |
| webkit | G8 clears the Foreman and continues into a harder fourth fight | PASS |
| webkit | G8 higher best earned offline is queued for its owner | PASS |
| webkit | G8 best saved to member account | PASS |
| webkit | G8 best returns in another authenticated session | PASS |
| webkit | G8 replay returns to fighter selection | PASS |
| webkit | G8 floored result and replay work | PASS |
| webkit | G8 deliberate share contains only game, result and clean arcade URL | PASS |
| webkit | G8 reloaded game restores saved best | PASS |
| webkit | G8 previously loaded game opens offline | PASS |
| webkit | G8 back to Today retains the shell | PASS |
| webkit | Food, daily action and pile unchanged | PASS |
| webkit | G8 signed-out users cannot play | PASS |
| webkit | Eight games fit desktop grid | PASS |
| webkit | G8 desktop controls and canvas fit the shared shell | PASS |
| webkit | No browser execution errors | PASS |

Recordings: [Chromium](live/chromium-fighter.webm) · [WebKit](live/webkit-fighter.webm). Raw results, screenshots, module comparison, unit log, speed samples and release receipt accompany this report.

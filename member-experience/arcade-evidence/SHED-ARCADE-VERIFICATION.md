# Shed Arcade — release evidence

Live: 2026-11-04T09:36:17.679Z

Member URL: https://shiftsometimber.co.uk/member/shed-arcade

Seven supplied games run as lazy native content inside the existing V7 frame. Today entry follows the daily action and pile. The Support/Shed entry is private. No public menus, Shop styles, checkout, clinical gates, Apple submission, member messages or purchases were changed.

Personal bests, sound and a manually typed Saw Duel nickname are account scoped. Offline bests merge on reconnect; Saw Duel keeps the fastest positive time. Entertainment writes are independent of food, activity and the daily-action pile. Example Shed totals are hidden. Sound is off by default. The nudge caps at twice per week, two days apart, and dismisses for that day.

## Named checks

| ID | Check | Chromium | WebKit | Full acceptance | Evidence |
|---|---|---|---|---|---|
| E1 | Today card follows check-in, action and pile and Play opens its game | PASS | PASS | PASS | [Chromium](chromium-proof/E1.png), [WebKit](webkit-proof/E1.png) |
| E2 | Game-of-day date selection | PASS | PASS | PASS — controlled-date UI | [Chromium](chromium-proof/E2.png), [WebKit](webkit-proof/E2.png) |
| E3 | New account sees friendly no-best text | PASS | PASS | PASS | [Chromium](chromium-proof/E3.png), [WebKit](webkit-proof/E3.png) |
| E4 | Seven grid tiles link to their own game | PASS | PASS | PASS | [Chromium](chromium-proof/E4.png), [WebKit](webkit-proof/E4.png) |
| E5 | Every game returns to Today inside the same frame | PASS | PASS | PASS | [Chromium](chromium-proof/E5.png), [WebKit](webkit-proof/E5.png) |
| E6 | Shed-area door opens arcade | PASS | PASS | PASS | [Chromium](chromium-proof/E6.png), [WebKit](webkit-proof/E6.png) |
| E7 | Post-check-in nudge dismisses and stays dismissed | PASS | PASS | PASS | [Chromium](chromium-proof/E7.png), [WebKit](webkit-proof/E7.png) |
| E8 | Signed-out arcade asks for sign-in; public menus unchanged | PASS | PASS | PASS | [Chromium](chromium-proof/E8.png), [WebKit](webkit-proof/E8.png) |
| G1 | timber-lob input, completed result, saved best and retry | PASS | PASS | PASS | [Chromium](chromium-proof/G1.png), [WebKit](webkit-proof/G1.png) |
| G2 | chop-shop input, completed result, saved best and retry | PASS | PASS | PASS | [Chromium](chromium-proof/G2.png), [WebKit](webkit-proof/G2.png) |
| G3 | timber input, completed result, saved best and retry | PASS | PASS | PASS | [Chromium](chromium-proof/G3.png), [WebKit](webkit-proof/G3.png) |
| G4 | stack-the-shed input, completed result, saved best and retry | PASS | PASS | PASS | [Chromium](chromium-proof/G4.png), [WebKit](webkit-proof/G4.png) |
| G5 | saw-duel input, completed result, saved best and retry | PASS | PASS | PASS | [Chromium](chromium-proof/G5.png), [WebKit](webkit-proof/G5.png) |
| G6 | timber-smash input, completed result, saved best and retry | PASS | PASS | PASS | [Chromium](chromium-proof/G6.png), [WebKit](webkit-proof/G6.png) |
| G7 | over-the-shed input, completed result, saved best and retry | PASS | PASS | PASS | [Chromium](chromium-proof/G7.png), [WebKit](webkit-proof/G7.png) |
| P1 | Accounts separated and bests retained in a second authenticated session | PASS | PASS | PASS | [Chromium](chromium-proof/P1.png), [WebKit](webkit-proof/P1.png) |
| P2 | Every initial game silent; member toggle remembered | PASS | PASS | PASS | [Chromium](chromium-proof/P2.png), [WebKit](webkit-proof/P2.png) |
| P3 | Seven cached games open offline; earned offline best syncs on reconnect | PASS | PASS | FAIL — physical-phone evidence missing | [Chromium](chromium-proof/P3.png), [WebKit](webkit-proof/P3.png) |
| P4 | Keyboard focus, labelled canvas, touch layout and zoom allowed | PASS | PASS | PASS | [Chromium](chromium-proof/P4.png), [WebKit](webkit-proof/P4.png) |
| P5 | No example Shed totals appear | PASS | PASS | PASS | [Chromium](chromium-proof/P5.png), [WebKit](webkit-proof/P5.png) |
| P6 | Captured shares contain game/result and typed nickname only | PASS | PASS | PASS | [Chromium](chromium-proof/P6.png), [WebKit](webkit-proof/P6.png) |
| P7 | Player-visible arcade wording scan | PASS | PASS | PASS | [Chromium](chromium-proof/P7.png), [WebKit](webkit-proof/P7.png) |

[Chromium recording](chromium-proof/arcade.webm) · [WebKit recording](webkit-proof/arcade.webm)

[Chromium results](chromium-proof/results.json) · [WebKit results](webkit-proof/results.json)

These are automated 390 × 844 browser profiles, not physical iPhone or Android recordings. Actual hosted responses and the isolated synthetic database were used, without API result interception. Supplied game debug helpers advance simulation time for long rounds after real controls are exercised. The two-date rotation check now includes Chromium and WebKit UI fixtures using the exact production-served card renderer at the beginning and end of 4 and 5 November. Same-day selection is stable, the next date selects a different game, and the rendered Play destination matches. This is controlled-date component evidence, not observation of a natural midnight rollover. The accessibility checks cover controls, focus, labels, viewport and touch layout; they are not a complete assistive-technology audit.

## Performance

Throttled Chromium: 390 × 844, 150ms latency, 200kB/s down, 96kB/s up, 4× CPU. Fresh contexts; 20 samples per game. Observed render cadence is a browser measurement, not a physical mid-range-phone benchmark.

| Game | Fresh p95 | Samples | Observed render cadence |
|---|---:|---:|---:|
| timber-lob | 1810ms | 20 | 60.0fps |
| chop-shop | 1804ms | 20 | 60.0fps |
| timber | 1810ms | 20 | 60.0fps |
| stack-the-shed | 1779ms | 20 | 60.0fps |
| saw-duel | 1728ms | 20 | 60.0fps |
| timber-smash | 1803ms | 20 | 60.0fps |
| over-the-shed | 1789ms | 20 | 60.0fps |

Today fresh p95: 1049ms; Fit: 1015ms; warm Today/Fit: 32/32ms; tap: 33ms; repeat shell: 80ms. Each has 20 samples. Before Arcade, live V7 was Today 1070ms, Fit 1013ms, warm 32ms, tap 33ms; these runs have ordinary network variance and do not establish a further speed improvement.

[Raw game timings](game-speed/results.json) · [Raw V7 regression timings](mobile-speed/results.json)

## Existing V7 regression

40 Node tests passed, including the existing 35 V7 tests and five Arcade tests. Real SQL covers concurrent best writes, account separation, unchanged health/food/pile data, owner/origin validation, export and atomic erasure.

[chromium three-journey results](v7-journeys-chromium/results.json): choose: 16 PASS, 0 FAIL; hard-week: 4 PASS, 0 FAIL; milestone: 6 PASS, 0 FAIL.

[webkit three-journey results](v7-journeys-webkit/results.json): choose: 16 PASS, 0 FAIL; hard-week: 4 PASS, 0 FAIL; milestone: 6 PASS, 0 FAIL.

Shop is compared against an actual production capture immediately before Arcade. Live proof, including content/link equality and all seven games, is recorded separately below. No checkout is submitted.

[Live chromium results](live-after-chromium/results.json) · [Recording](live-after-chromium/verification.webm): 15 PASS, 0 FAIL, 0 browser errors.

[Live webkit results](live-after-webkit/results.json) · [Recording](live-after-webkit/verification.webm): 15 PASS, 0 FAIL, 0 browser errors.

[Before Shop recording](live-before-chromium/verification.webm) · [Before Shop capture](live-before-chromium/shop.png)

Live mobile p95, n=20 each: Today 1235ms, Fit 1092ms, warm 31/31ms, tap 31ms. [Raw production timings](live-mobile-speed/results.json).

## Release and rollback

- shift-core: a397ea3f-f6b1-4de3-a0de-36ff49cf7a7d; previous V7: 199339a4-4c48-43bd-892d-e60d33c6c862.
- shift-programme-member-20261023: 33282b19-2c49-4b26-9dc6-4b9267087fef; previous V7: f9780c08-fe6d-4f62-8eb8-cab368f57981.

One-step rollback:

```sh
node member-experience/tools/shed-arcade-release.mjs rollback
```

This restores the exact previous V7 serving versions and reverses only the two added Arcade page routes; it retains existing member records and entertainment scores. Candidate module hashes, all existing bindings, assets configuration and schedules were checked before promotion. No database migration or member-data initialisation was needed.

Synthetic accounts only: shed-arcade-one@example.invalid, shed-arcade-two@example.invalid; V7 journey-specific synthetic accounts in their reports; v7-live-proof@example.invalid for production. No purchases, emails, messages, invitations or native-app submission were made. Physical-device recordings remain unverified. A natural midnight rollover has not been observed; the required two test dates use explicitly labelled, controlled-date UI fixtures.

## Completion recheck — 4 November 2026

The serving release was rechecked against its exact approved worker versions. No production code was changed or redeployed. Twenty-one named checks have automated evidence, including controlled-date UI evidence for E2. P3 remains an acceptance failure because physical-phone recording and performance evidence is missing. Browser test PASS results do not override that remaining acceptance failure.

Only the SST Mac is remotely accessible. USB inventory found no iPhone, iPad or Android phone; iOS device enumeration timed out after 15 seconds; Android ADB and the iOS USB utility are unavailable. No physical-phone result is claimed. The smallest next step is access to test phones. Controlled-date UI proof is complete; no reminder or background task was created.

[Exact completion status](completion-status.json)

## Controlled-date UI evidence

The exact renderer was fetched from the serving production JavaScript, its SHA256 recorded, and executed in both browser profiles with explicit synthetic date fixtures. No API response was intercepted, member record written, production clock changed or app code redeployed. Three assertions passed in each browser: same game throughout each test day; different game on the next test date; rendered game text and Play link match the selection.

[Results and served-source hash](date-ui/results.json) · [Chromium recording](date-ui/chromium.webm) · [WebKit recording](date-ui/webkit.webm)

[Chromium day one](date-ui/chromium-2026-11-04-early.png) · [Chromium day two](date-ui/chromium-2026-11-05-early.png) · [WebKit day one](date-ui/webkit-2026-11-04-early.png) · [WebKit day two](date-ui/webkit-2026-11-05-early.png)

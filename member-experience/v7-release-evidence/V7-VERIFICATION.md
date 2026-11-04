# My Timber V7 — release and verification

Report generated: 2026-11-04T00:36:52.516Z

Member release: **LIVE — 2026-11-04T00:34:30.776Z**

Source commit: 14927e12f356a6dd1a62d04fe2d0350cc935e26e

Pack: replacement 30-file pack; SHA256 3b4f6f7303938fab378dcc023b1a26ef532207b42a8fbee2c8f2b73767bb4c5f

PASS means the stated evidence was obtained. FAIL includes missing proof; it does not by itself mean a confirmed product defect. Browser profiles are not physical phones.

## Final mobile timing

Slow 4G: 150ms latency, 200,000 B/s download, 96,000 B/s upload, 4× CPU slowdown. Chromium mobile profile; 20 samples per measure.

| Measure | Earlier baseline | Final hosted-test p95 |
|---|---:|---:|
| Fresh Today | 4,438ms | 1028ms |
| Fresh Fit | 1,796ms | 1020ms |
| Warm Today | — | 31ms |
| Warm Fit | — | 32ms |
| Tap feedback | — | 32ms |

The earlier baseline was a prior browser measurement, not a new physical-phone run. Hosted-test and production evidence are kept separate.

Production p95: Today 1070ms; Fit 1013ms; warm Today 32ms; warm Fit 32ms; tap 33ms.


## Three journeys

| Engine | Journey | Result | Recording |
|---|---|---|---|
| chromium mobile profile | choose | PASS — 16 passed, 0 failed | [Recording](journeys-chromium/choose.webm) |
| chromium mobile profile | hard-week | PASS — 4 passed, 0 failed | [Recording](journeys-chromium/hard-week.webm) |
| chromium mobile profile | milestone | PASS — 6 passed, 0 failed | [Recording](journeys-chromium/milestone.webm) |
| webkit mobile profile | choose | PASS — 16 passed, 0 failed | [Recording](journeys-webkit/choose.webm) |
| webkit mobile profile | hard-week | PASS — 4 passed, 0 failed | [Recording](journeys-webkit/hard-week.webm) |
| webkit mobile profile | milestone | PASS — 6 passed, 0 failed | [Recording](journeys-webkit/milestone.webm) |

The per-condition tables below give the exact recorded journey results. The hosted Support/More/account integration run separately passed 34 checks in each engine. Neither result is labelled as a physical iPhone or Android result.

## Main brief — every numbered rule

| Rule | Requirement | Result | Evidence and coverage |
|---:|---|---|---|
| 1 | One release; no V7 flag or member cohorts | PASS | production-release.json |
| 2 | Small SVG, cached CSS, early identity, native screens; preparation off the read path | PASS | shell-chromium/results.json; tests/v7-stream.test.mjs; tests/v7-overnight.test.mjs |
| 3 | One-step rollback | PASS | rollback-check.json — restored and version verified during preparation failure |
| 4 | One account/day log across Today, Grub and devices | PASS | journeys-chromium/results.json; journeys-webkit/results.json; tests/v7-account.test.mjs |
| 5 | Food, quick logs and walks do not award another log | PASS | Both journey recordings; tests/v7-food-routes.test.mjs |
| 6 | Pile, milestone and weekly reset | PASS | Both milestone recordings; tests/v7-model.test.mjs; tests/v7-crew.test.mjs |
| 7 | Mood buttons retained; recorded moods require History | PASS | Both choosing-an-action recordings |
| 8 | Five Quick log controls and no-pile explanation | PASS | Both choosing-an-action recordings |
| 9 | Three source-matched swaps within 5g | PASS | final-pack-nutrition-source-check.json; tests/v7-nutrition.test.mjs; both choosing recordings |
| 10 | Done awards once; optional feedback keeps the log; food remains separate | PASS | Both choosing recordings; tests/v7-account.test.mjs |
| 11 | Weight defaults on; control in More > Preferences | PASS | tests/v7-model.test.mjs; tests/v7-visibility.test.mjs; final-chromium/journey.png |
| 12 | Sharing requires preview and excludes weight and private details | PASS | Both milestone recordings; tests/v7-model.test.mjs |
| 13 | Memory naming; medicine collapsed; latest two wins and See all | PASS | final-chromium/journey.png; existing Journey source retained |
| 14 | Private crew league ranked on weekly effort | PASS | tests/v7-crew.test.mjs |
| 15 | Swipe meals and next-card peek | PASS | Both choosing recordings; Grub screenshots |
| 16 | Snack control and own plan targets | PASS | Both choosing recordings; tests/v7-nutrition.test.mjs |
| 17 | Quick log options, photo and barcode | FAIL — proof incomplete | Food logging is recorded; physical camera/barcode capture has not been recorded |
| 18 | Neutral off-plan logging | PASS | Both off-plan screenshots and choosing recordings |
| 19 | Nutrients and UK traffic-light boundaries | PASS | Meal detail screenshots; tests/v7-nutrition.test.mjs |
| 20 | Eating-out places and estimates | PASS | Both choosing recordings show the eating-out control; full restaurant-food recording not separately captured |
| 21 | Under-eating flag stays off pending clinical thresholds | PASS | No threshold is invented; intentionally off as specified |
| 22 | Named nutrition source | PASS | UK CoFID 2021 public catalogue; reviewed recipe source records; Open Food Facts barcode adapter |
| 23 | Prepared time/kit sessions and swaps | PASS | Both Fit screenshots and choosing recordings; existing reviewed generator retained |
| 24 | Walk is an activity record, not another pile award | PASS | Both choosing recordings; tests/v7-account.test.mjs |
| 25 | Consented, deletable private health tags | PASS | tests/v7-model.test.mjs; private share allow-list and retained health-tag controls |
| 26 | Optional Fit feedback; overnight adjustment | PASS | Both choosing recordings; tests/v7-overnight.test.mjs |
| 27 | One shared frame and active destinations | PASS | Both final integration recordings, seven destinations |
| 28 | Approved palette and line icons | PASS | Final screenshots; Shop styling excluded from the restyle |
| 29 | UK copy; no mockup labels or invented member readings | PASS | Hosted screenshots use synthetic accounts, not example labels in member UI |
| 30 | Throttled-mobile speed targets | PASS | mobile-speed/results.json; 20 samples per measure |

## Support/More addendum

| Rule | Requirement | Result | Evidence and coverage |
|---:|---|---|---|
| 1 | Retain live Support and More content | PASS | Both final integration recordings |
| 2 | Only specified extra rows | PASS | Final Support/More screenshots and retained renderer source |
| 3 | Shared black frame, green accent, line icons | PASS | Both final integration recordings |
| 4 | Correct active navigation for retained routes | PASS | Both final integration recordings |
| 5 | Shop is excluded from the restyle | PASS | Original shopHome and shopStyles; scoped retained styles |
| 6 | Shop before/after plus synthetic payment checkout | FAIL — proof incomplete | Live before/after catalogue recordings; payment checkout not exercised |
| 7 | Support home links and extras | PASS | Both final integration recordings; no actual calls or messages made |
| 8 | Five situation pages preserve full text | PASS | Both final integration recordings; real-phone dial action remains unverified |
| 9 | More content and privacy controls | PASS | Both final integration recordings; Sign out uses retained authenticated handler |
| 10 | Every Settings operation | FAIL — proof incomplete | Forms and sections open; password/email communications, physical notifications and destructive UI actions not exercised |
| 11 | Quick settings use the canonical saved settings | PASS | Shared handlers, visibility tests and final integration recordings |

## Shell evidence and limitations

- Chromium shell checks passed. WebKit navigation, frame and caching checks passed except the automated offline-navigation probe, which produced an internal WebKit navigation error. Physical iPhone offline recovery is unverified.
- Final integration recordings confirm one persistent frame across all seven destinations and active navigation on retained account routes.
- Logo is an SVG below 10KB. CSS and font are versioned cached assets. Member snapshots are encrypted, account-bound and expiring; private data is kept out of CacheStorage.
- The rollback was actually executed and provider serving versions were verified, before any V7 front-end member switch.

## Features retained

Mood check-in; In your corner; Rough day; Life Back; saved next step and privacy line; weight/waist/clothes progress; Medicine over time wording; timeline; injection records; record editing; Snapshot; private photos; weight history import/download; record comparison; Journey setup; Shop categories, basket, orders and existing checkout routes; consent; export/deletion; clinical gates; supplier holds; payment safeguards.

Source preservation is supported by the captured serving handlers and inherited bindings. Opened UI routes and logic tests are listed separately from operations not exercised. No real purchases, communications, phone calls or Apple submission actions were performed.

## Outstanding proof

- Physical iPhone Safari and Android Chrome recordings, including offline recovery.
- Synthetic test-mode payment checkout reaching payment. No live purchase was attempted.
- Physical camera/barcode capture and the complete Settings operations listed above.
- Under-eating thresholds remain a clinical-partner dependency; the flag is intentionally off.

## Release/rollback receipt

See [production-release.json](production-release.json) and [rollback-check.json](rollback-check.json). The approved latest instruction permits release without waiting for a reviewer or a perfect test run; it does not convert missing proof into a PASS.


## Must-not-break — exact coverage

Original serving modules and bindings were captured before this release. Retention of source is distinguished below from exercising every operation. A route opening is not proof of a purchase, reset email or deletion.

| Feature | Before | After | Result / evidence |
|---|---|---|
| Mood check-in | Serving source captured | Recorded through the native controls | PASS — both choose journeys |
| In your corner | Serving source captured | Retained controller, fields and saved choices | PASS source; full personalised output not independently re-recorded |
| Rough day | Serving source captured | Retained route and wording | PASS source; linked in Support/Today |
| Life Back | Serving source captured | Original source controller in shared frame | PASS — retained browser proof |
| My next step privacy line | Serving source captured | Present in Today card | PASS — Today screenshot |
| Your progress: weight, waist, clothes size | Serving source captured | Existing controls and readings | PASS — integration screenshot; weight preference logic tests |
| Medicine over time and existing wording | Serving source captured | Original controller retained, collapsed initially | PASS source; expanded medical illustration not physically verified |
| Your timeline | Serving source captured | Original records and controls retained | PASS source; Journey screenshot |
| Record an injection | Serving source captured | Original treatment route/controller | PASS route; no real treatment record submitted |
| View or edit my records | Serving source captured | Original record controller | PASS source; real records not edited |
| Snapshot | Serving source captured | Original private snapshot route/controller | PASS source; no real patient export performed |
| Progress photos | Serving source captured | Original private photo input/controller | PASS — retained browser proof; physical camera not verified |
| Weight history import/download | Serving source captured | Original import/download controls | PASS source; real history not imported or downloaded |
| Compare saved records | Serving source captured | Original comparison controls | PASS source; no member records compared |
| Journey setup | Serving source captured | Original setup controls | PASS source; consent/paused logic tests |
| Shop | Serving source captured | Exact home text/links and original category owners | PASS if live-shop-after/results.json passes; before/after recordings |
| Basket | Serving source captured | Original script and commerce API owner retained | PASS source; test-mode checkout not completed |
| Orders | Serving source captured | Original authenticated route opens | PASS — integration proof; no order created |
| Consent | Serving source captured | Original checks plus fail-closed V7 guards | PASS — account/privacy SQL tests |
| Deletion/export | Serving source captured | Original handler with atomic owned V7 stores | PASS — privacy SQL tests; destructive production UI not exercised |
| Clinical gates | Serving source captured | Original Core business handlers and bindings retained | PASS source; no clinical decision or medication change made |
| Supplier holds | Serving source captured | Original commerce owner and handlers retained | PASS source; no real supplier hold changed |
| Payment safeguards | Serving source captured | Original payment owner and handlers retained | PASS source; synthetic test-mode payment proof incomplete |

## Live integration results

| Browser profile | Passed | Failed | Evidence |
|---|---:|---:|---|
| chromium | 34 | 0 | live-final-chromium/results.json |
| webkit | 34 | 0 | live-final-webkit/results.json |

Production Shop comparison: PASS.

## Shell pass/fail rows

| Browser profile | Shell condition | Result | Evidence |
|---|---|---|---|
| chromium | journey keeps the shared frame | PASS | shell-chromium/results.json |
| chromium | shop keeps the shared frame | PASS | shell-chromium/results.json |
| chromium | grub keeps the shared frame | PASS | shell-chromium/results.json |
| chromium | fit keeps the shared frame | PASS | shell-chromium/results.json |
| chromium | support keeps the shared frame | PASS | shell-chromium/results.json |
| chromium | more keeps the shared frame | PASS | shell-chromium/results.json |
| chromium | today keeps the shared frame | PASS | shell-chromium/results.json |
| chromium | Seven destinations do not reload the document | PASS | shell-chromium/results.json |
| chromium | More active on Preferences | PASS | shell-chromium/results.json |
| chromium | Shell service worker installed | PASS | shell-chromium/results.json |
| chromium | Repeat shell has fewer than ten requests before content | PASS | shell-chromium/results.json |
| chromium | CacheStorage contains no private API responses | PASS | shell-chromium/results.json |
| chromium | Offline opens saved shell and account content | PASS | shell-chromium/results.json |
| chromium | No browser exceptions or failed HTTP responses | PASS | shell-chromium/results.json |
| webkit | journey keeps the shared frame | PASS | shell-webkit/results.json |
| webkit | shop keeps the shared frame | PASS | shell-webkit/results.json |
| webkit | grub keeps the shared frame | PASS | shell-webkit/results.json |
| webkit | fit keeps the shared frame | PASS | shell-webkit/results.json |
| webkit | support keeps the shared frame | PASS | shell-webkit/results.json |
| webkit | more keeps the shared frame | PASS | shell-webkit/results.json |
| webkit | today keeps the shared frame | PASS | shell-webkit/results.json |
| webkit | Seven destinations do not reload the document | PASS | shell-webkit/results.json |
| webkit | More active on Preferences | PASS | shell-webkit/results.json |
| webkit | Shell service worker installed | PASS | shell-webkit/results.json |
| webkit | Repeat shell has fewer than ten requests before content | PASS | shell-webkit/results.json |
| webkit | CacheStorage contains no private API responses | PASS | shell-webkit/results.json |
| webkit | Browser run completes | FAIL | shell-webkit/results.json |
| webkit | No browser exceptions or failed HTTP responses | PASS | shell-webkit/results.json |
| Throttled mobile | Repeat-shell visible header paint below 500ms, 20 samples | PASS | 77ms p95; live-mobile-speed/results.json |

Prepared eligible accounts: 222/222 have a current-day action; 222/222 have a reviewed Fit session. Aggregate only; this includes one owned synthetic live-proof account.

## Exact remaining blockers and smallest next steps

| Proof | Blocker | Smallest next step |
|---|---|---|
| Physical iPhone Safari / Android Chrome | No physical device is connected to this execution session | Run the linked three journeys on those phones; record and label separately |
| Test-mode checkout | This isolated test host intentionally blocks checkout writes; production payment ownership was retained | Wire the retained checkout to its approved Stripe test environment, then record a synthetic checkout without a live charge |
| Under-eating flag | Clinical thresholds not signed off | Clinical partner supplies thresholds; flag remains off as approved |

## Each journey condition

| Browser / synthetic account | Journey | Condition | Result |
|---|---|---|---|
| chromium / v7-chromium-choose@example.invalid | choose | Prepared starting pile | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Exactly three sourced, protein-matched swaps | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Swap changes action without food or a pile award | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Today and Grub use the same selected action | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Concurrent Done on two sessions and two screens awards once | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Negative optional feedback keeps log and food totals | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Pile count and remaining add to thirty | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | All five quick logs leave pile unchanged | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Recorded mood is absent from Today | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Off-plan confirmation is neutral | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Full food day records four meals without an award | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Eating-out figures explicitly use estimates | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Fit offers shorter, no-kit and low-impact | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | Closing optional Fit ratings keeps activity, no second pile log | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | A walk and extra session never add a pile log | PASS |
| chromium / v7-chromium-choose@example.invalid | choose | No uncaught browser exception | PASS |
| chromium / v7-chromium-hard-week@example.invalid | hard-week | Prepared starting pile | PASS |
| chromium / v7-chromium-hard-week@example.invalid | hard-week | Hard-week return is welcoming, pile retained | PASS |
| chromium / v7-chromium-hard-week@example.invalid | hard-week | Feedback can be closed without losing the earned log | PASS |
| chromium / v7-chromium-hard-week@example.invalid | hard-week | No uncaught browser exception | PASS |
| chromium / v7-chromium-milestone@example.invalid | milestone | Prepared starting pile | PASS |
| chromium / v7-chromium-milestone@example.invalid | milestone | Milestone starts unawarded | PASS |
| chromium / v7-chromium-milestone@example.invalid | milestone | Thirtieth log awards exactly one milestone | PASS |
| chromium / v7-chromium-milestone@example.invalid | milestone | Share preview contains effort only | PASS |
| chromium / v7-chromium-milestone@example.invalid | milestone | Refresh neither awards again nor replaces milestone | PASS |
| chromium / v7-chromium-milestone@example.invalid | milestone | No uncaught browser exception | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Prepared starting pile | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Exactly three sourced, protein-matched swaps | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Swap changes action without food or a pile award | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Today and Grub use the same selected action | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Concurrent Done on two sessions and two screens awards once | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Negative optional feedback keeps log and food totals | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Pile count and remaining add to thirty | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | All five quick logs leave pile unchanged | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Recorded mood is absent from Today | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Off-plan confirmation is neutral | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Full food day records four meals without an award | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Eating-out figures explicitly use estimates | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Fit offers shorter, no-kit and low-impact | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | Closing optional Fit ratings keeps activity, no second pile log | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | A walk and extra session never add a pile log | PASS |
| webkit / v7-webkit-choose@example.invalid | choose | No uncaught browser exception | PASS |
| webkit / v7-webkit-hard-week@example.invalid | hard-week | Prepared starting pile | PASS |
| webkit / v7-webkit-hard-week@example.invalid | hard-week | Hard-week return is welcoming, pile retained | PASS |
| webkit / v7-webkit-hard-week@example.invalid | hard-week | Feedback can be closed without losing the earned log | PASS |
| webkit / v7-webkit-hard-week@example.invalid | hard-week | No uncaught browser exception | PASS |
| webkit / v7-webkit-milestone@example.invalid | milestone | Prepared starting pile | PASS |
| webkit / v7-webkit-milestone@example.invalid | milestone | Milestone starts unawarded | PASS |
| webkit / v7-webkit-milestone@example.invalid | milestone | Thirtieth log awards exactly one milestone | PASS |
| webkit / v7-webkit-milestone@example.invalid | milestone | Share preview contains effort only | PASS |
| webkit / v7-webkit-milestone@example.invalid | milestone | Refresh neither awards again nor replaces milestone | PASS |
| webkit / v7-webkit-milestone@example.invalid | milestone | No uncaught browser exception | PASS |

## Production screenshots

[Today](live-final-chromium/today.png) · [Grub](live-final-chromium/grub.png) · [Journey](live-final-chromium/journey.png) · [Fit](live-final-chromium/fit.png) · [Support](live-final-chromium/support.png) · [More](live-final-chromium/more.png) · [Shop](live-final-chromium/shop.png)

Shop recordings: [Before](live-shop-before/shop.webm) · [After](live-shop-after/shop.webm)
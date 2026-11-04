# My Timber release report — 4 November 2026

**NOT LIVE FOR MEMBERS.** The new frontend is deployed on the isolated synthetic-account test service. No member release was attempted.

Built: first/returning Welcome, accessible original-artwork hotspot, existing three-section personalisation in the persistent shell, Explore intro and existing-service entry, account-owned treatment-status presentation, approved Support/More restyle and retained routes. Shop home content and appearance match production.

The existing clinical route reports assessmentAvailable=false and has no pharmacy integration binding. Its current payment flow does not implement automatic decline refunds or a safe manual card-hold lifecycle. No questionnaire, verified intake, product or price was invented; 43 Choose and pay is not complete. 44–46 are tested with labelled database fixtures, not real provider/payment results.

## Speed

All times below are milliseconds, p95 from 20 samples. 390×844 mobile browser emulation, 2×, 150ms latency, 200,000B/s down, 96,000B/s up, CPU4×. This is not real-phone evidence. The latest complete run is used; earlier runs remain archived.

| Measure | Supplied live limit | Live remeasured | Candidate test service | Result |
|---|---:|---:|---:|---|
| Fresh Today | 1070 | 1412 | 1067 | PASS |
| Fresh Fit | 1010 | 1343 | 1053 | FAIL |
| Visited tab switch (worst destination) | 32 | 33 | 32 | PASS |
| Tap feedback | 33 | 33 | 32 | PASS |
| Repeat shell | 77 | 79 | 79 | FAIL |

Welcome Lighthouse13.6.0 mobile4G: LCP1,604ms, FCP674ms, TBT0, performance100. One lab run, separate from the repeated speed tests.

## Evidence limits and release blocker

- Chromium and WebKit mobile emulation each pass the three V7 journeys (26 checks per engine), 34 retained route/controller checks, and 37 available Welcome checks. The 38th Welcome check explicitly fails because the real clinical questionnaire is closed.
- 42 SQL/model/privacy/service-worker tests pass; profile-save-after-Done race also passes.
- Shop before/after recordings compare serving production and the test candidate using synthetic accounts; visible content pixel hashes and all home text/links match in both engines.
- No physical iPhone/Android results, completed payment/refund, dispensing, real purchase, real-member test, message or call is claimed.
- Stripe supports authorisation holds, but this till is not wired for approval capture, cancellation and expiry reconciliation. It currently uses automatic capture; declined-state updates do not issue refunds.
- Smallest clinical next step: connect the commissioned provider sandbox and prove intake completion, paid review, approval/dispatch and declined refund (or the complete hold/capture/cancel/expiry path), without opening live supplier/payment gates.
- Strict warm-tab and repeat-shell limits, full settings/checkout evidence and physical-phone checks also remain release requirements.

## Source and rollback

Work continues on fix/my-timber-precompiled-documents-20261102. Exact current member front: 42f085ae-553c-4b11-82f6-116203fb3c5e. Current Core a301697d-5586-4839-aa44-5edb01105731 was preserved. Inactive candidate bbe2a656-2b4f-43c0-b8da-31f5b8b35b9c is prepared with the current front bindings/assets/settings/cron; it serves no member traffic.

Rollback: `node member-experience/tools/welcome-release.mjs rollback`. It restores the exact current member front only; no Core rollback, route change or database deletion. The guarded live command rejects this recorded failed acceptance.

## Sensible implementation decisions

- First-visit Welcome marker is per account on this device; completed setup always returns to Today. Direct Welcome links remain usable.
- Original setup uses its existing three sections and persistence, with optional explicit tracking consent. No new clinical questionnaire is created.
- Only a confirmed refunded payment state claims a refund has been processed. A clinical decline flag alone does not claim money moved.
- Welcome images load only on Welcome and cache when visited. Today/Fit do not download them.
- Batch reads are authenticated and account-owned; consent/paused tracking checks stay inside the food query. Precomputed offers/recaps remain overnight.
- Font subset retains all required outlines, advances, vertical metrics and licence. JS/CSS Brotli is prepared at build time and round-trip verified.

## Pass/fail against every brief rule

PASS means the stated scope/evidence passed on the test build. FAIL includes unperformed proof; unchanged source alone is not proof of every behaviour.

| Brief | ID | Rule | Result | Evidence / limitation |
|---|---|---|---|---|
| Welcome and Explore brief | W1.1 | Top tabs read, in order: Welcome, Today, Journey, Shop. Welcome is first. | PASS | browser/results.json: both engines W1; returning and first-visit recordings.  |
| Welcome and Explore brief | W1.2 | The plan: a first visit lands on Welcome. A returning member lands on Today. Welcome stays as a tab after setup. | PASS | browser/results.json: both engines W1; returning and first-visit recordings.  |
| Welcome and Explore brief | W2.1 | PASS only if the Welcome visual is the supplied v2 artwork image, not rebuilt in CSS. Headline, paper, tape, pins and note text come from the image files. | PASS | artwork.json exact supplied-file hashes; W2 image natural/display widths and alt text in both engines.  |
| Welcome and Explore brief | W2.2 | Use only the headline and note crops. Do not use the artwork's own header, three tabs, "Have a look around" or bottom bar; the app draws those. | PASS | artwork.json exact supplied-file hashes; W2 image natural/display widths and alt text in both engines.  |
| Welcome and Explore brief | W2.3 | Headline 374px wide, note 378px wide on a 390px screen (about 2.2x, sharp on phones). Crop edges fade into #050505 with a CSS mask, no visible box. | PASS | artwork.json exact supplied-file hashes; W2 image natural/display widths and alt text in both engines.  |
| Welcome and Explore brief | W2.4 | Ship the crops as supplied (WebP, each under 100KB). Alt text on each image carries the full wording. | PASS | artwork.json exact supplied-file hashes; W2 image natural/display widths and alt text in both engines.  |
| Welcome and Explore brief | W3.1 | MAKE IT MINE is part of the artwork, with a real tappable hotspot exactly over it (left 10.8%, top 77.5%, width 78.1%, height 11.3% of the note image), a 44px minimum tap height, a visible focus ring and the label "Make it mine" for screen readers. It goes to the three quick taps, then the first Done on Today. | PASS | Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.  |
| Welcome and Explore brief | W3.2 | Directly under the note: EXPLORE WEIGHT LOSS, a real outlined button (2px #707762, cream text). It goes into the EXISTING clinical route ("Check eligibility and explore your options"). No new questionnaire. | PASS | Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.  |
| Welcome and Explore brief | W3.3 | Below that: "Have a look around", a quiet cream text link. It goes to Today without setup. | PASS | Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.  |
| Welcome and Explore brief | W3.4 | The MAKE IT MINE button is removed: use `welcome-v2-note-nobutton.webp` (same note, torn bottom edge kept, no button). | PASS | Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.  |
| Welcome and Explore brief | W3.5 | Welcome keeps the headline, the note and EXPLORE WEIGHT LOSS, now a filled #707762 button with black text, as it is the only action left. | PASS | Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.  |
| Welcome and Explore brief | W3.6 | Below it: "Your one thing for today is waiting in Today" link, to Today. | PASS | Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.  |
| Welcome and Explore brief | W3.7 | Personalise My Timber stays in the existing setup flow (More), not on Welcome. | PASS | Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.  |
| Welcome and Explore brief | W4.1 | Only three colours: black #050505, cream #E7E3DA, brand green #707762 (all from the live CSS). No other greens or greys. Thin dividers may be cream at reduced opacity. | PASS | final-visuals/results.json: computed colour/font/button values in Chromium and WebKit; contrast.json. Palette check covers the approved new elements; existing Shop content is preserved. |
| Welcome and Explore brief | W4.2 | Top tabs: labels and icons bold (800) cream #E7E3DA (the "white"). Active tab underline: #707762. | PASS | final-visuals/results.json: computed colour/font/button values in Chromium and WebKit; contrast.json. Palette check covers the approved new elements; existing Shop content is preserved. |
| Welcome and Explore brief | W4.3 | Bottom bar (Grub, Fit, Support, More): #707762, bold (800), icons #707762. | PASS | final-visuals/results.json: computed colour/font/button values in Chromium and WebKit; contrast.json. Palette check covers the approved new elements; existing Shop content is preserved. |
| Welcome and Explore brief | W4.4 | Filled buttons: #707762 background, black #050505 text, bold, at least 19px (contrast 4.37:1, passes AA for large bold text). Cream text on green is 3.64:1, so do not use it. | PASS | final-visuals/results.json: computed colour/font/button values in Chromium and WebKit; contrast.json. Palette check covers the approved new elements; existing Shop content is preserved. |
| Welcome and Explore brief | W4.5 | Outline buttons: 2px #707762 border, cream text. | PASS | final-visuals/results.json: computed colour/font/button values in Chromium and WebKit; contrast.json. Palette check covers the approved new elements; existing Shop content is preserved. |
| Welcome and Explore brief | W5.1 | 41 Intro: no medicine names, images, prices or "buy". Says what the route is, what to have to hand, a privacy line. "Start my health questions" and "Not ready? Keep going with My Timber". No questionnaire duration unless the live route states one. | PASS | W5-no-medicine-price in both engines; 41 Explore screenshot; existing clinical service availability checked on entry.  |
| Welcome and Explore brief | W5.2 | 42 Questions: one question per screen, progress bar, Back and Continue, Save and finish later. Questions come from the existing provider route. | FAIL | readiness.json: live assessmentAvailable=false; no pharmacy integration bindings; existing assessment page closed. 44–46 status rendering and return-to-Today work with labelled synthetic DB fixtures. These are UI checks, not proof of payment, provider decisions, dispensing or refunds. No option or price was invented for 43. |
| Welcome and Explore brief | W5.3 | 43 Choose and pay: shown only after the questionnaire is complete. Option and price come from the live till. This plain line sits directly above the pay button: "If the prescriber decides it isn't right for you, you get a full refund. Automatically." (Use "Automatically" only once confirmed in section 6.) Also shows "Paying doesn't guarantee a prescription. The prescriber decides." | FAIL | readiness.json: live assessmentAvailable=false; no pharmacy integration bindings; existing assessment page closed. 44–46 status rendering and return-to-Today work with labelled synthetic DB fixtures. These are UI checks, not proof of payment, provider decisions, dispensing or refunds. No option or price was invented for 43. |
| Welcome and Explore brief | W5.4 | 44 Under review: "Paid. A prescriber is reviewing your answers." Next steps: approved, dispensed and sent; not approved, full refund. No promised times. Main button "Back to My Timber" goes to Today, with the line "We'll tell you the prescriber's decision here in the app." | FAIL | readiness.json: live assessmentAvailable=false; no pharmacy integration bindings; existing assessment page closed. 44–46 status rendering and return-to-Today work with labelled synthetic DB fixtures. These are UI checks, not proof of payment, provider decisions, dispensing or refunds. No option or price was invented for 43. |
| Welcome and Explore brief | W5.5 | 45 Not suitable: kind wording, ask the prescriber why, talk to your GP, other support, My Timber stays free. Shows "Your refund is on its way" (charge then refund) or "Your card hasn't been charged" (card hold), matching the method used. Main button "Back to My Timber" goes to Today. | FAIL | readiness.json: live assessmentAvailable=false; no pharmacy integration bindings; existing assessment page closed. 44–46 status rendering and return-to-Today work with labelled synthetic DB fixtures. These are UI checks, not proof of payment, provider decisions, dispensing or refunds. No option or price was invented for 43. |
| Welcome and Explore brief | W5.6 | 46 Today with status: a small row "Your treatment: with your prescriber" at the top of Today. Tapping it opens the review status. It updates when the outcome arrives. | FAIL | readiness.json: live assessmentAvailable=false; no pharmacy integration bindings; existing assessment page closed. 44–46 status rendering and return-to-Today work with labelled synthetic DB fixtures. These are UI checks, not proof of payment, provider decisions, dispensing or refunds. No option or price was invented for 43. |
| Welcome and Explore brief | W5.7 | PASS: after payment, and after any outcome, the member lands back in My Timber Today, and the review status is visible there. | FAIL | readiness.json: live assessmentAvailable=false; no pharmacy integration bindings; existing assessment page closed. 44–46 status rendering and return-to-Today work with labelled synthetic DB fixtures. These are UI checks, not proof of payment, provider decisions, dispensing or refunds. No option or price was invented for 43. |
| Welcome and Explore brief | W6.1 | PASS: payment is taken at checkout after the questionnaire and before prescriber review. | FAIL | Existing till uses automatic capture. Decline handler has no Stripe refund call. No approval capture/cancel/expiry lifecycle is wired. Stripe can authorise a hold, but this till does not safely implement it. No real charge or invented provider clearance was used. |
| Welcome and Explore brief | W6.2 | PASS: the refund-if-not-approved line is shown plainly before paying, and the refund is processed automatically when the prescriber declines, with no action from the member. | FAIL | Existing till uses automatic capture. Decline handler has no Stripe refund call. No approval capture/cancel/expiry lifecycle is wired. Stripe can authorise a hold, but this till does not safely implement it. No real charge or invented provider clearance was used. |
| Welcome and Explore brief | W6.3 | Developer to say NOW whether the till supports a card hold (authorise at checkout, capture on approval). If it does, use the card hold in preference to charge then refund, and switch the wording on 43 to 45 to match. | FAIL | Existing till uses automatic capture. Decline handler has no Stripe refund call. No approval capture/cancel/expiry lifecycle is wired. Stripe can authorise a hold, but this till does not safely implement it. No real charge or invented provider clearance was used. |
| Welcome and Explore brief | W6.4 | No medicine name, image or price anywhere before the questionnaire is complete. | PASS | No pre-questionnaire medicine/price UI; medicine-commerce-v1.js and discount/checkout source unchanged (source-preservation.json).  |
| Welcome and Explore brief | W6.5 | Discount codes unchanged. | PASS | No pre-questionnaire medicine/price UI; medicine-commerce-v1.js and discount/checkout source unchanged (source-preservation.json).  |
| Welcome and Explore brief | W7.1 | Shop is unchanged. | PASS | Source hashes unchanged for Shop catalogue, basket and routes, medicine-commerce and Core. Both engines Shop home text/links and visible content pixel hashes equal production. Home visual preservation passes. Complete checkout behaviour is separately FAIL under addendum 6. |
| Welcome and Explore brief | W7.2 | Discount codes, checkout and the clinical provider integration are unchanged. | PASS | Source hashes unchanged for Shop catalogue, basket and routes, medicine-commerce and Core. Both engines Shop home text/links and visible content pixel hashes equal production. Home visual preservation passes. Complete checkout behaviour is separately FAIL under addendum 6. |
| Welcome and Explore brief | W8.1 | No heavy images. Welcome images total under 120KB (first visit about 114KB, after setup about 106KB). | PASS | First-visit artwork 114,026 bytes; after setup 106,418 bytes; exact supplied WebPs.  |
| Welcome and Explore brief | W8.2 | Fresh load of Welcome under 2s on mobile 4G (Lighthouse or WebPageTest result attached). | PASS | Lighthouse 13.6.0 mobile 4G, LCP 1604ms, FCP 674ms, TBT 0; lighthouse/welcome.json and HTML. Lighthouse is a single lab run, separate from the 20-sample Today/Fit performance run. |
| Welcome and Explore brief | W9.1 | Screen recording: first visit, lands on Welcome, Make it mine, three taps, first Done. Then Welcome again, showing the after-setup state. | PASS | browser/<engine>/first-setup-browse-support-more.webm Recorded on the deployed test service in Chromium and WebKit mobile emulation, not physical phones. |
| Welcome and Explore brief | W9.2 | Screen recording: first visit, Have a look around, lands on Today without setup. | PASS | browser/<engine>/browse-without-setup.webm Recorded on the deployed test service in Chromium and WebKit mobile emulation, not physical phones. |
| Welcome and Explore brief | W9.3 | Screen recording: Explore weight loss into the existing route, through to sent. | FAIL | Existing clinical assessment is closed; no physical iPhone or Android phone attached. Browser screenshots are labelled engine emulation. No mockup, fixture or desktop WebKit run is presented as physical-phone proof. |
| Welcome and Explore brief | W9.4 | Screen recording: returning member lands on Today. | PASS | browser/<engine>/returning.webm Recorded on the deployed test service in Chromium and WebKit mobile emulation, not physical phones. |
| Welcome and Explore brief | W9.5 | Screenshots of 40b to 48 equivalents on a real phone, at 2x. | FAIL | Existing clinical assessment is closed; no physical iPhone or Android phone attached. Browser screenshots are labelled engine emulation. No mockup, fixture or desktop WebKit run is presented as physical-phone proof. |
| Welcome and Explore brief | W9.6 | Contrast check output for buttons and bars. | PASS | contrast.json and final-visuals/results.json; actual rendered styles measured in both engines.  |
| Support and More addendum | A1 | Nothing live in Support or More is removed, renamed into something else, or broken. Wording on screens 24 to 26 is the live wording. Where a screen and the live app disagree on content, the live content wins; ask me before dropping anything. | PASS | Retained source/controller hashes, 68 retained browser checks and before/after link inventory. Source retention and route checks pass; destructive/external side effects were not exercised. |
| Support and More addendum | A2 | The only additions allowed are the small extras marked [EXTRA] below. | PASS | Only approved Welcome/Explore and More shortcuts added; existing Support/More content preserved.  |
| Support and More addendum | A3 | Same frame as every V7 screen: flat black, circled-S + MY TIMBER, Today/Journey/Shop with green underline on the active tab, bottom bar Grub/Fit/Support/More. Support screens: Support highlighted. More screens: More highlighted. Brand green accent, no amber, no wood grain, line icons only. | PASS | Approved shared frame and active navigation measured in both engines; native route node-identity checks. The later Welcome brief explicitly approves the fourth Welcome top tab. |
| Support and More addendum | A4 | Support, Ask Timber, treatment details and Life Back support keep the Support item highlighted. Settings, orders, saved and plans keep More highlighted (as the live shell does now). | PASS | Existing settings, orders, saved, Ask Timber and treatment routes open in retained browser proof with correct selection. Physical-phone route recordings remain unperformed. |
| Support and More addendum | A5 | Shop: do not restyle. Keep the current live Shop design, content and behaviour exactly as it is now, inside the V7 frame (Shop top tab active). | PASS | Shop home text/links and visible content pixels match serving production in Chromium and WebKit; shop source unchanged.  |
| Support and More addendum | A6 | That includes the Shop home, Testing & wellbeing, Supplements & nutrition, Weight-management care, Everyday kit, Your orders, the header basket, checkout, Stripe, the clinical assessment route and discount codes. No new prices, codes, products or wording. | FAIL | Before/after Shop recordings exist in both engines. Catalogue, basket, checkout and discount source unchanged. No complete synthetic checkout-to-payment proof: clinical intake closed and financial lifecycle incomplete. |
| Support and More addendum | A7 | Support home ("In your corner." / "A starting point when things feel difficult.") keeps, in this order or better: | PASS | Support home, all five situations, urgent tel links, Shed target=_blank, snapshot, Ask Timber, saved step, league and Message Matt route retained. No real call or message was sent. |
| Support and More addendum | A8 | Each "What would help?" page keeps its live text (What next / Who to talk to / What stays with you), Back to Support, Ask Timber and Your own prescriber rows, and the urgent-help box. On Side effects the urgent box sits at the top (as live). | FAIL | Five full live situation texts and side-effects urgent-first order are present and open in both engines. Required physical-phone dial/route proof not performed. Browser tel href checks are not phone dial proof. |
| Support and More addendum | A9 | More keeps: "More. In your corner." heading; Support; Your stuff: Saved & plans (/member/saved), My orders (/member/orders), Account & settings (/member/settings); Timber Shed; Headline privacy (Allow quoted headlines on this device, with its live explainer, per account per device); Sign out (signs out, falls back to /member/login); Timber Mill kit (/shop); Help using My Timber (/help); version line; "Need help? Go to Support". | PASS | More inventory retains all rows, headline privacy, sign-out route, version/help and original destinations. Sign-out and per-device headline setting were not re-exercised as part of this release. |
| Support and More addendum | A10 | Account & settings keeps every live section: Notifications (daily check-in reminder, time 07:00 to 21:00, turn on, change, turn off); Member details (personal, home address, GP practice, save, reload); Delivery address; Change sign-in email; Units (weight, height); Privacy (export through Shift Core, health-data consent, Privacy & data rights); Password reset; Clear local data; Delete my account with its confirmation; Add My Timber to your phone. | FAIL | Original settings controller and all IDs/sections are retained and load; account controls inventory is captured. Every setting mutation, email change/reset, deletion/export and Add to Home Screen was not exercised before and after on real phones. |
| Support and More addendum | A11 | [EXTRA] Quick settings on More, as shortcuts into the same settings, not copies: Show weight (on by default, screen 08), Daily check-in reminder, Health tags (consented, deletable, never shared, e.g. Dodgy knee), Units, Privacy & data rights. | FAIL | Quick settings point into original controls; weight visibility has dedicated unit coverage. Physical health-tag deletion and every shortcut save are not recorded end-to-end in this release. |
| Original V7 regression | V1 | V7 (Today, Journey, Grub, Fit, recap, league, share card, preferences) and the speed fixes go live together in one release. No feature flags, no phased rollout. | FAIL | No member release or partial rollout made. Candidate prepared without serving traffic. Full single release held for clinical/financial and strict speed failures. |
| Original V7 regression | V2 | Speed fixes in the same release: | PASS | Existing native shell; build-time Brotli; 5 account reads in one D1 batch; precomputed offers/recaps; no new page-load fetch.  |
| Original V7 regression | V3 | Keep a one-step rollback to the current live version ready on release day. If anything breaks for members, roll back first, fix after. | PASS | release.json anchors exact serving version; one command rollback, bindings/assets/schedules retained. Rollback not invoked because member traffic never changed. |
| Original V7 regression | V4 | Only Done on Today's one thing earns a pile log. Once per day per account, across devices, whichever screen Done is tapped on (Today or the Grub card for the same action). | PASS | Real SQL concurrency + both engine choose journeys: Today/Grub two sessions yield exactly one award.  |
| Original V7 regression | V5 | Nothing else ever adds or removes a log: quick logs, food, off-plan meals, eating out, walks, extra sessions. | PASS | Both choose journeys: five quick logs, full food day, walk and extra session leave pile unchanged.  |
| Original V7 regression | V6 | Pile shows N of 30 and "X to go" that always add up to 30. Milestone at 30 awarded once. Monday reset clears only the weekly league, never the pile. | PASS | Both milestone journeys, SQL one-time award and Monday lifetime-pile retention tests.  |
| Original V7 regression | V7 | Mood: Good / So-so / A bit flat buttons stay visible. No previously recorded mood shows on Today; only a "History ›" link opens past check-ins. | PASS | Both choose journeys: mood buttons and History retained, no recorded mood on Today.  |
| Original V7 regression | V8 | Quick log row (Pint, Takeaway, Gym done, Rough night, Weigh in) under "Quick log" with "Helps Timber learn. Doesn't add a pile log." | PASS | Both choose recordings exercise all five quick logs with unchanged pile.  |
| Original V7 regression | V9 | Swap: three alternatives, each within 5g protein of the original, from the same nutrition data, not hard-coded. Plus Not for me, Didn't get round to it, None of these?, Keep the original. | PASS | Ten-original-action source/version/5g unit test and three sourced swaps in both engines.  |
| Original V7 regression | V10 | After Done: +1 log, optional "How did it go?" (Helped / Tried it, didn't help / Ask me later). Log is safe either way. Done never adds food. | PASS | Both choose/hard-week journeys and SQL tests: feedback optional, log retained, food separate.  |
| Original V7 regression | V11 | Weight shown by default and leads Journey. Hiding weight is only the Show weight setting in More > Preferences. | PASS | Default-on and off/re-enable unit tests; More preference route browser check; nested weight suppression tests.  |
| Original V7 regression | V12 | Weight never appears on the share card, recap share or anything shareable. Share needs a preview. | PASS | Both milestone previews plus private-field projection and nested weight suppression unit tests.  |
| Original V7 regression | V13 | "What you've told us" naming. Medicine over time collapsed. Timeline shows latest 2 wins + See all. Detailed chart loads only when opened. | FAIL | Existing Journey module preserved, native route opens. Detailed Medicine wording/chart-open and timeline-two-wins not newly recorded against every condition. |
| Original V7 regression | V14 | Mates league ranks by logs this week only, never weight, private to the crew. | PASS | Real SQL crew ACL, explicit opt-in, effort-only ranking and Monday tests.  |
| Original V7 regression | V15 | Today's meals: swipe row (Breakfast, Lunch, Dinner, Snacks), one line each: name · protein · kcal. Next card peeks. | FAIL | Existing Grub native module unchanged and full day recorded. Next-card peek and every one-line card condition not separately measured in this run. |
| Original V7 regression | V16 | "+ Snack" always visible. Protein and Calories bars use the member's own targets from his plan, never hard-coded. | PASS | Own-plan/unknown-target unit tests; existing + Snack native UI retained.  |
| Original V7 regression | V17 | Quick log: meal selector, usuals, snack chips, search, photo, barcode, and "Off-plan / Big one" styled like every other option. | FAIL | Existing meal selector/usuals/snack/search/photo/barcode/off-plan code retained; full day and search path covered. Photo/barcode capture not tested on physical phones. |
| Original V7 regression | V18 | Off-plan: neutral confirmation, calories shown plainly. No red, no warnings, no "over budget". | PASS | Both choose recordings: neutral off-plan confirmation with plain calorie totals.  |
| Original V7 regression | V19 | Meal detail: calories, protein, carbs (sugars), fat (saturates), fibre, salt. Traffic lights only on sugars, fat, saturates, salt (UK front-of-pack scheme). These muted traffic-light colours are the only allowed non-green accent. | PASS | Nutrition source/portion and exact UK FoP boundary tests; existing meal detail UI unchanged.  |
| Original V7 regression | V20 | Eating out: swipe row of places + Search, figures labelled as estimates. | PASS | Both choose journeys: eating-out record uses explicitly labelled estimates.  |
| Original V7 regression | V21 | Under-eating flag: build it switched off. Thresholds come from our clinical partner; do not invent them. | PASS | Existing under-eating flag remains off; no clinical threshold added.  |
| Original V7 regression | V22 | Nutrition data comes from a named food database. Tell me which before you build. | PASS | Existing named sources: UK CoFID 2021 and named UK product labels, Open Food Facts; source provenance retained. No nutrition database change in this release. |
| Original V7 regression | V23 | Today's session by time (10/20/40) and kit (None/Dumbbells/Gym), Start and Swap it (shorter, no-kit, low-impact). | PASS | Both choose journeys: native Fit and all three shorter/no-kit/low-impact alternatives.  |
| Original V7 regression | V24 | "Log a walk" records activity only, no pile log. If Today's one thing is a walk or session, its Done earns the log as normal. | PASS | Both choose journeys and SQL: activity records never create extra pile log.  |
| Original V7 regression | V25 | Health tags (e.g. knee) need clear consent, are deletable, and never appear in anything shareable. | FAIL | Existing consent/health-tag control source untouched; privacy/erasure tests pass. Health-tag creation/deletion on both physical devices not recorded. |
| Original V7 regression | V26 | "How did it go?" and "How hard was it?" are optional; next session adjusts overnight. | PASS | Both engines: optional session rating dismissal keeps activity; overnight-only adjustment tests.  |
| Original V7 regression | V27 | Frame unchanged on every screen: flat black, circled-S + MY TIMBER, Today/Journey/Shop with green underline on active tab, bottom bar Grub/Fit/Support/More. Highlight the active bottom item (including More on Preferences). | PASS | Persistent shared node checks through eight destinations. Latest Welcome brief approves fourth top tab.  |
| Original V7 regression | V28 | Brand green accent. No amber, no wood grain, no emojis. Symbols shown as text in mockups (tick, swap, star, play, chevron) are drawn as thin line icons. | PASS | Existing source symbols remain line SVG icons; no additional accent/retheme introduced.  |
| Original V7 regression | V29 | UK English. "CONCEPT, EXAMPLE DATA" labels are mockup-only; remove them in the build and use real member data. | PASS | Real own-account records, no CONCEPT labels added; all test data synthetic and labelled.  |
| Original V7 regression | V30 | Tap feedback under 100ms. Warm tab switch under 500ms. Fresh screen under 2s. Today and Fit before/after numbers reported. | PASS | 20 samples: tap32ms, warm max32ms, Today1067ms, Fit1053ms; original brief 100/500/2000 limits pass. Latest user limits are stricter; see the current speed table. |
| Latest release rules | S-Fresh Today | Fresh Today must match or beat supplied live p95. | PASS | 20 samples, Slow 4G / CPU 4×, candidate-mobile-speed/results.json Supplied 1070ms; remeasured live 1412ms; candidate 1067ms. |
| Latest release rules | S-Fresh Fit | Fresh Fit must match or beat supplied live p95. | FAIL | 20 samples, Slow 4G / CPU 4×, candidate-mobile-speed/results.json Supplied 1010ms; remeasured live 1343ms; candidate 1053ms. |
| Latest release rules | S-Visited tab switch (worst destination) | Visited tab switch (worst destination) must match or beat supplied live p95. | PASS | 20 samples, Slow 4G / CPU 4×, candidate-mobile-speed/results.json Supplied 32ms; remeasured live 33ms; candidate 32ms. |
| Latest release rules | S-Tap feedback | Tap feedback must match or beat supplied live p95. | PASS | 20 samples, Slow 4G / CPU 4×, candidate-mobile-speed/results.json Supplied 33ms; remeasured live 33ms; candidate 32ms. |
| Latest release rules | S-Repeat shell | Repeat shell must match or beat supplied live p95. | FAIL | 20 samples, Slow 4G / CPU 4×, candidate-mobile-speed/results.json Supplied 77ms; remeasured live 79ms; candidate 79ms. |
| Latest release rules | R-live | Single member release live and verified | FAIL | readiness.json: original front still receives 100%; prepared candidate receives 0%. Clinical route, automated refunds, stricter speed and phone proof incomplete. |
| Latest release rules | R-webp | Only supplied compressed Welcome WebPs, cached | PASS | Exact byte hashes, immutable endpoints and service-worker asset cache.  |
| Latest release rules | R-shop | Shop design and content unchanged | PASS | Both engine before/after pixel and text/link hashes; source-preservation.json. Complete checkout proof remains failed under A6. |
| Latest release rules | R-rollback | One-step exact rollback ready before traffic moves | PASS | welcome-release.mjs rollback; release.json original hashes, settings and cron capture. No production traffic move attempted. |
| Must-not-break inventory | M1 | Mood check-in | PASS | Both browser choose journeys and retained controller. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M2 | In your corner | FAIL | Original support module retained; every saved-support-step mutation not retested before/after. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M3 | Rough day | PASS | Both engines open the full wobble page and retain its original routes/text. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M4 | Life Back | FAIL | Existing native module/source retained; reason/goal edit not recorded before/after. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M5 | My next step privacy line | PASS | Existing support-plan wording and controller unchanged; retained page loads. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M6 | Your progress: weight, waist, clothes size | FAIL | Default weight, hidden-weight and original Journey controller checked; every reading type not re-entered before/after. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M7 | Medicine over time, existing wording | FAIL | Source/controller preserved; full expanded chart and wording not separately re-recorded. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M8 | Your timeline | FAIL | Existing route/controller retained; complete timeline record/edit cycle not re-exercised. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M9 | Record an injection | FAIL | Existing records source unchanged; no new injection record test in this release. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M10 | View or edit my records | FAIL | Original records source unchanged; full edit/delete UI proof unperformed. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M11 | Snapshot | FAIL | Snapshot link and original source retained; complete appointment snapshot generation not re-exercised. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M12 | Private progress photos | FAIL | Original source retained; physical-camera upload/delete not performed. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M13 | Weight history import/download | FAIL | Original portability source retained; file import/download not repeated. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M14 | Compare saved records | FAIL | Original Journey source retained; complete comparison flow not recorded. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M15 | Journey setup | FAIL | Original Journey tool source retained; distinct Join My Timber three-section personalisation passes, but Journey setup was not fully repeated. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M16 | Shop home | PASS | Before/after text/links and visible content pixels identical in both engines. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M17 | Basket | FAIL | Original basket source unchanged; complete checkout proof unperformed. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M18 | Orders | PASS | Existing owned-account order route/controller opens in both engines; no real purchase. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M19 | Consent | PASS | Real optional grant/save in both engines; SQL consent checks and service-worker grant/withdrawal tests. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M20 | Deletion/export | FAIL | SQL owner-only erasure/rollback tests pass and original controls retained; complete UI deletion/export not performed. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M21 | Clinical gates | PASS | Source and serving Core unchanged; live assessment remains closed, no verified intake fabricated. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M22 | Supplier holds | PASS | No supplier configuration/gate changed or bypassed. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M23 | Payment safeguards | FAIL | No money writes or changed checkout. Existing automatic decline refund/card-hold lifecycle is absent; not safe to call new flow passed. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M24 | Saved & plans, Ask Timber and treatment routes | PASS | Original signed-in routes/controllers open; all before/after links preserved. No message sent. FAIL can mean missing verification; it does not assert a new regression. |
| Must-not-break inventory | M25 | Daily reminders and Add to Home Screen | FAIL | Existing settings controls/manifest retained; physical notification/install proof not performed. FAIL can mean missing verification; it does not assert a new regression. |
| App shell | H1 | One persistent shared frame; content-only navigation | PASS | frame-pixels/results.json: same three DOM nodes and static frame pixels across13 routes per engine; 26/26. Removed the existing forced 3D/backface-hidden bars that blanked Chromium labels after long-page navigation. Appearance unchanged. |
| App shell | H2 | Cached shell, CSS, fonts, logo and native Grub/Fit/Life Back | PASS | Existing service worker/native routes retained; actual repeat-resource record; build-time compression verified. No frame copy or iframe added. |
| App shell | H3 | Identity once early; private data only after verified account | PASS | Streaming privacy tests plus real same-shell setup flow and cached identity adapter.  |
| App shell | H4 | Airplane mode shows cached private views with offline note | FAIL | Existing consent-aware private cache and offline note retained. Latest build has no physical airplane-mode recording; not claimed as passed. |
| App shell | H5 | Repeat shell under500ms, tap under100ms, visited switch under500ms | PASS | 20 samples: repeat79ms, tap32ms, warm32ms. Latest stricter77ms repeat limit remains FAIL. |

## Synthetic accounts

Welcome: Chromium900710501–505 and WebKit900710511–515; addresses welcome-<engine>-<case>@example.invalid. V7 journeys: v7-<engine>-choose/hard-week/milestone@example.invalid. Production visual comparison uses only v7-live-proof@example.invalid (900710301). Credentials and preview access codes are excluded from source and reports.

## Preserved critical source

| Module | SHA-256 unchanged from starting branch |
|---|---|
| medicine-commerce-v1.js | PASS — b726577f17fef8ac534ba8d5b7e65b7fba1aa0e1a2d3de5f7993bd3d0851cc30 |
| member-state-fast-v1.js | PASS — d8dcf15f7b66da7cfbb67fa859ed68d1bd2525f3f1ff760d37b223d2c14dc8e9 |
| privacy-account-request-v1.js | PASS — 801a47b6f6270a7701dc9fcba7f47def0f90815d4fd44232d3d84907c2422df4 |
| privacy-health-erasure-v1.js | PASS — 9bd50e41e9f82a7edaca308a26bb200e23f98ebc9d86db130a221050f2d61f5d |
| privacy-health-erasure-route-v1.js | PASS — 5cfc93c3144857b703d65375ba62f3b9fcbdb3847923e2429631b3a636d45409 |
| industrial-grub-nutrition-v1.js | PASS — 27dcf5755c2e343cbb26559fb1e5bf216f9122075307d63a08947e5d60df5772 |
| memory-privacy.js | PASS — dda7d01f43d0f689c20fcb3a33761beb99c105c0f7249b6de682ce3871ea7892 |
| member-experience/shop-routes.mjs | PASS — 2133f139dc7950ce8a0bff74d8b844c888ad5d8fb41e8965901ff94ea7a04783 |
| member-experience/shop-basket.mjs | PASS — c1b00634ee293073cb49b2eb11bccedcf908181a63314d77ec56c3e507cd6db5 |
| member-experience/shop-catalogue-reader.mjs | PASS — 32c7cdfe73cf6d58917c7f643091bb90f1144248ac7670afbfc57fa3958eea93 |
| member-experience/support-markup.mjs | PASS — 03977c34506c2b3aefe7f1d9945712400fe6d44a1ecd24a252a0606e1c8c80da |
| member-experience/support-plan-client.mjs | PASS — ecb9dc8579e904667f7dbcb98a6c62150f02c93e498cc7a2a58716f14e6516ce |
| member-experience/journey-page-client.mjs | PASS — c1d79e1e0ad131db91c3e166d9fcecee972ead8d6ab6664c0d8451e2563fa898 |
| member-experience/journey-records.mjs | PASS — e21a48d9fbbedfb2406b3e492111668c24f8b2cddd2a58f15d90ecd5e5fefba0 |
| member-experience/journey-portability.mjs | PASS — fcb10700268d4b710a86c192bd1df998a5fe1ad7d9241db6b1b7624c1bc5f580 |
| member-experience/v7-api.mjs | PASS — 5e5ca300319e30a33a3eb7f54896e3e2c059eaac07ab6a9c665e3716edfc3b7a |
| member-experience/v7-model.mjs | PASS — 7969bee2b9bbabcb0a84ea64eef6e5893f6eb4a729283de5d67732a7c7fc4474 |
| member-experience/v7-food-routes.mjs | PASS — 5231b45303e0a319da0af3784b3767c42aba1d263a47c7eee0a417dfe1a4c4a7 |
| member-experience/v7-fit.mjs | PASS — ed159a3214d7e1c0af9104b8750b75220794047ded0fdd5240facc6e025f2397 |
| member-experience/v7-overnight.mjs | PASS — 584591f17b86a071f3a2876d1f021b01ba77b0f81643604226f24ecf984c32a6 |
| member-experience/v7-privacy.mjs | PASS — 0b59078de8a435f5be37e4c53b9b2a39d3ff236ae5c5977e1389b26015d74039 |
| member-experience/v7-visibility.mjs | PASS — 27e914544d8d9a6911742fcd1c47349fe1d1025622321564a49c40ee5be84dbf |

Final measurement note: Latest full20-sample run after early Welcome artwork discovery; no sample selection. Streaming privacy tests2/2pass. No member traffic moved.

Frame rendering: removed the old forced 3D/backface-hidden layers. The new unmodified test pages retain identical static frame pixels and DOM nodes through13 routes in each engine (26/26).

Production comparison synthetic session expired during one capture attempt; that failed run is archived. Only that owned synthetic session was renewed, and both complete Shop comparison runs then passed. No real-member session was changed.

## Every live Support, More and Shop home link before and after

Both engines compare the serving production front with the candidate. No link or button is missing. The only addition is the approved More Personalise My Timber shortcut. External destinations were inventoried without opening them or sending anything.

### Chromium

| View | Label | Destination | Before | After |
|---|---|---|---|---|
| support | Call 999Life-threatening emergency | tel:999 | yes | yes |
| support | Call NHS 111Urgent medical advice | tel:111 | yes | yes |
| support | Samaritans · 116 123Someone to listen, day or night | tel:116123 | yes | yes |
| support | Your snapshotCheck your words and dates before an appointment | /member/life-back/journey#snapshot | yes | yes |
| support | Your own prescriberTreatment, dose or side-effect questions | /member/treatment | yes | yes |
| support | Talk to other men in the Timber ShedPrivate community · opens in your browser | https://shiftsometimber.co.uk/timber-shed (new tab) | yes | yes |
| support | Shift ArcadeBored? Seven quick games, just for a laugh. | /member/shed-arcade | yes | yes |
| support | Ask TimberAI help with the everyday stuff | /member/ask-timber | yes | yes |
| support | My next stepOpen my saved step and reminders | /member/support | yes | yes |
| support | Mates leagueRanked on effort, never weight. Private to your crew. | /member/life-back/support/league | yes | yes |
| support | Message MattApp and account questions · view reply time | /member/life-back/support#contact | yes | yes |
| more | SupportEveryday help, treatment contacts and your snapshot | /member/dashboard?timber=support#today | yes | yes |
| more | Saved & plansIdeas and plans to come back to | /member/saved | yes | yes |
| more | My ordersOrders and delivery | /member/orders | yes | yes |
| more | Account & settingsProfile, units and privacy | /member/settings | yes | yes |
| more | Talk to other men in the Timber ShedPrivate community · opens in your browser | https://shiftsometimber.co.uk/timber-shed (new tab) | yes | yes |
| more | Show weight: OnTurn off if you’d rather focus on strength, energy or measurements. | /member/life-back/preferences | yes | yes |
| more | Daily check-in reminderOptional. No health details in the notification | /member/settings#notifications | yes | yes |
| more | Health tagsSaved with your consent. Never shared. | /member/settings#health-tags | yes | yes |
| more | UnitsWeight and height | /member/settings#prefWeight | yes | yes |
| more | Privacy & data rightsExport your data, or delete your account | /member/settings#healthConsentManager | yes | yes |
| more | Timber Mill kitOptional SHIFT clothing | /shop | yes | yes |
| more | Help using My TimberFind the right place to start | /help | yes | yes |
| more | Need help? Go to Support | /member/dashboard?timber=support#today | yes | yes |
| more | Personalise My TimberYour goals, starting point and first step | /member/dashboard/personalise?edit=1 | approved addition | yes |
| shop | Your orders | /member/orders | yes | yes |
| shop | Testing & wellbeingHome tests, lab tests and what each can tell you.Explore tests | /member/life-back/shop/testing | yes | yes |
| shop | Supplements & nutritionUnderstand the optional extras before choosing.Explore the range | /member/life-back/shop/nutrition | yes | yes |
| shop | Weight-management careUnderstand your options and the assessment.Explore care | /member/life-back/shop/care | yes | yes |
| shop | Everyday kitClothing and useful accessories from the Timber Mill.Explore the Mill | /member/life-back/shop/kit | yes | yes |

### Webkit

| View | Label | Destination | Before | After |
|---|---|---|---|---|
| support | Call 999Life-threatening emergency | tel:999 | yes | yes |
| support | Call NHS 111Urgent medical advice | tel:111 | yes | yes |
| support | Samaritans · 116 123Someone to listen, day or night | tel:116123 | yes | yes |
| support | Your snapshotCheck your words and dates before an appointment | /member/life-back/journey#snapshot | yes | yes |
| support | Your own prescriberTreatment, dose or side-effect questions | /member/treatment | yes | yes |
| support | Talk to other men in the Timber ShedPrivate community · opens in your browser | https://shiftsometimber.co.uk/timber-shed (new tab) | yes | yes |
| support | Shift ArcadeBored? Seven quick games, just for a laugh. | /member/shed-arcade | yes | yes |
| support | Ask TimberAI help with the everyday stuff | /member/ask-timber | yes | yes |
| support | My next stepOpen my saved step and reminders | /member/support | yes | yes |
| support | Mates leagueRanked on effort, never weight. Private to your crew. | /member/life-back/support/league | yes | yes |
| support | Message MattApp and account questions · view reply time | /member/life-back/support#contact | yes | yes |
| more | SupportEveryday help, treatment contacts and your snapshot | /member/dashboard?timber=support#today | yes | yes |
| more | Saved & plansIdeas and plans to come back to | /member/saved | yes | yes |
| more | My ordersOrders and delivery | /member/orders | yes | yes |
| more | Account & settingsProfile, units and privacy | /member/settings | yes | yes |
| more | Talk to other men in the Timber ShedPrivate community · opens in your browser | https://shiftsometimber.co.uk/timber-shed (new tab) | yes | yes |
| more | Show weight: OnTurn off if you’d rather focus on strength, energy or measurements. | /member/life-back/preferences | yes | yes |
| more | Daily check-in reminderOptional. No health details in the notification | /member/settings#notifications | yes | yes |
| more | Health tagsSaved with your consent. Never shared. | /member/settings#health-tags | yes | yes |
| more | UnitsWeight and height | /member/settings#prefWeight | yes | yes |
| more | Privacy & data rightsExport your data, or delete your account | /member/settings#healthConsentManager | yes | yes |
| more | Timber Mill kitOptional SHIFT clothing | /shop | yes | yes |
| more | Help using My TimberFind the right place to start | /help | yes | yes |
| more | Need help? Go to Support | /member/dashboard?timber=support#today | yes | yes |
| more | Personalise My TimberYour goals, starting point and first step | /member/dashboard/personalise?edit=1 | approved addition | yes |
| shop | Your orders | /member/orders | yes | yes |
| shop | Testing & wellbeingHome tests, lab tests and what each can tell you.Explore tests | /member/life-back/shop/testing | yes | yes |
| shop | Supplements & nutritionUnderstand the optional extras before choosing.Explore the range | /member/life-back/shop/nutrition | yes | yes |
| shop | Weight-management careUnderstand your options and the assessment.Explore care | /member/life-back/shop/care | yes | yes |
| shop | Everyday kitClothing and useful accessories from the Timber Mill.Explore the Mill | /member/life-back/shop/kit | yes | yes |

# My Timber service handover — 27 October 2026

The member service is live. All six pages, menu, Fit opening at the top, urgent routes and account/draft privacy passed finite live Chromium and WebKit checks. Usefulness to real members and clinical outcomes are not established.

| Need | Working route | Responsibility |
|---|---|---|
| Everyday food, movement, planning and feedback | Today, saved support and personal review | Timber software; no person-on-call implication |
| Progress, feelings and everyday wins | Journey and editable member-owned notes | Member controls correction, deletion and deliberate sharing |
| App/account enquiry | Support → Message Matt; private reference/thread | Matt checks daily, replies within one working day |
| Away / cover | Approved template and Linda controls | Inactive until real date/message and explicit cover activation |
| Treatment question | Own prescriber or pharmacist | No SHIFT diagnosis, dose change or clinical-reading interpretation |
| Urgent situation | Existing prominent urgent routes | Signposting; no urgent monitoring |
| Community | Qualified private test namespace | Off for real members pending its separate operating confirmation |

History, ordinary food/movement and saved support continue under the agreed free offer when treatment changes. No new unlimited AI allowance or staffed coaching entitlement is promised; current service limits apply.

## Shed operating proposal — pending approval

Matt owns daily moderation/report review, proposed within one working day, without continuous monitoring. Linda is proposed cover and the separate appeal reviewer, subject to Matt confirming her appointment and availability. The original decision-maker cannot review his own appeal. High-risk posts remain held for appropriate review and cannot be ordinarily approved.

Approve rules/privacy version shed-member-support-2026-10-27-v3: adult peers; separate display names; no third-party identifying details, trading, unsafe treatment instructions, harassment or scams; every post/reply held for human review; in-app reporting/blocking and independent appeals. Returning a post for review does not publish it. No automatic private-record sharing. Deliberate preview/share, export/leave and separate removal of shared posts remain available.

The inherited cap is ten total accounts including moderators, not ten peers plus staff. The ten-man product pilot can use the core service with a smaller initial Shed cohort. Any capacity change needs a separately checked decision.

Proposed initial internal time budget: 30 minutes/day plus 30 minutes/week review = four hours/week, plus actual appeal/cover time. Monetary cost is hours multiplied by Matt's internal rate. This is a proposal; no staffing or spending commitment has been made.

## Voluntary pilot — after go-live; nothing sent

Ten men, at least six who did not design it, covering starting/continuing treatment, another provider, changing/stopping and returning after a gap. Consent is voluntary and no successful members/marks are invented.

Proposed pass criteria: 8/10 use a suggestion without explanation; 7/10 demonstrate feedback changed later help; 7/10 report a real hassle removed; 9/10 find their own treatment contact; 7/10 returners recover something useful. Report denominators, non-response and negative feedback. Non-response is not success. This is not a clinical-effectiveness study.

Draft invitation for review only: “We’re testing whether My Timber can make an ordinary week easier. Try one useful step, tell us when it doesn’t fit and be blunt about whether the next help changes. Taking part is optional; it does not replace your own treatment team.” Do not send without specific approval.

## Three further ideas — proposals only

1. An explicitly opted-in return prompt with chosen timing and no private quote.
2. A partner handover pilot using the standalone try-it route and member-owned notes, without automatic clinical-record transfer.
3. A separately staffed practical-support pilot with a named non-clinical coach and costed capacity. Current Matt support stays app/account only.

Build none until Matt chooses. Additional staffing and usage commitments require his approval.

## Remaining limits

The repaired password form validates, but automated/visible Chromium timed out on the existing interactive security check before sending a login request. No CAPTCHA bypass or seeded-session normal-login pass is claimed. The fictional review account is prepared for an ordinary user browser.

PR1439 remains open until broader qualification passes. The scoped live release is separately evidenced. Real Shed operation, benefit to real men and pilot outcomes are not delivered claims.

## Connected Shop and navigation — 29 October 2026

Matt approved the Shop mockup, its cream text and 8px image-to-title spacing, then requested “Can we connect all please”. The implementation is prepared on `work/my-timber-shop-connected-20261029` in `shiftsometimber/shift-core`, isolated checkout `/workspace/scratch/d63fedce877d/shift-core-shop`. Its exact predecessor is Journey PR1446 at `a67f1b3f1bdd51ca2b93997fa796a1e1202b390b`. The candidate commit is the head reported in the connected-Shop PR metadata and description. This is source-ready, unmerged and undeployed; it does not establish native-store or physical-iPhone acceptance.

The persistent top navigation is Today, Journey, Shop; bottom navigation is Grub, Fit, Support, More. Each has an icon. More retains the existing account/settings, saved items, orders and sign-out handlers. The shared authenticated navigation also follows the member into settings/orders and existing Journey tools. Embedded app panels keep their parent navigation. No native prefix, account/data handler, clinical decision, member record or Shed activation is changed.

`/member/life-back/shop` implements the approved four-category hub and existing `/member/orders` link. Finite nested testing, nutrition and kit routes read the serving public catalogue without forwarding member cookies, authorisation or referrer. The original main content, product identities, current descriptions, approved content styles, relevant functional scripts, stock and purchase controls are retained. Browsing links and GET filters stay inside My Timber. The care card opens the existing eligibility route; clinical and payment POSTs retain their existing owners. Public headers, ticker, analytics and public service-worker registration are not copied into private Shop pages. These pages use the existing session gate and private/no-store responses.

The member basket adapter reads the serving shared basket asset rather than forking its commercial rules. It retains account hashes, safe persisted selections, existing-attempt checks and verified Stripe resume URLs. It adds visibility/account clearance, stale-response rejection, and guards against an old optional-extras decision continuing after the account changes. Its contract checks fail closed if that shared source changes. A catalogue or basket upstream failure never creates a payment or substitutes invented stock/prices. Keep testing OOS/price-TBC and supplement ordering holds intact. Olivit commercial activation and the existing checkout owner’s work remain separate.

Only `member-experience/support-release.mjs` overlaps the existing Journey/Support owner: three imports, additional finite routes and the navigation response wrapper. The new implementation is in `shop-navigation.mjs`, `shop-navigation-client.mjs`, `shop-routes.mjs`, `shop-basket.mjs` and the two adjacent Shop test files. `package.json` adds only the focused test command. Public catalogue, commerce, supplier and payment sources are unchanged. PR1439/1446 and live nutrition/checkout/public-navigation changes must be preserved during provider composition; do not deploy this older checkout as a replacement for the current provider baseline.

Validation: 52 focused source/regression tests pass, covering connected Shop, retained Journey, Life Back, orders, settings, session handling, support and byte-preserved Health presentation. `npm run check` and `git diff --check` pass. The standalone build receipt is `docs/my-timber-shop-build-20261029.json`; the candidate is 1,998,848 gzip bytes, a 7,719-byte increase over the exact predecessor. This is compilation, not provider-baseline qualification.

Offline Chromium acceptance passes 22 cases using captured public HTML/JS and synthetic accounts at 320/390/768/1440px: seven destinations and icon/current-tab states; More settings/orders; 8px title spacing and visible cream text; no hub horizontal overflow; held testing control; nutrition form; working kit colour selection; basket count across pages; invalid payment-host rejection; account/anonymous clearance; late old-account response rejection; and no identity-service retry loop. All browser requests were intercepted. There were zero production writes, orders or payments. `docs/my-timber-shop-browser-20261029.json` records input and owned-source hashes. Existing Today/More/Support acceptance fixtures use the actual legacy presentation runtimes, not real member data. Safari/WebKit, normal production login and native-device operation are still release checks.

Next action belongs to the existing coordinated release owner: compose this exact candidate on a freshly captured serving provider baseline with the pending Journey change, qualify the seven-tab header and private routes in that composition, then release/verify web/PWA and native parity through the existing sequence. No new watcher, release job, route, secret, staff commitment or commercial activation was created.

Reproduce focused tests with `npm run test:shop-connected`; build with `node scripts/check-my-timber-journey-build.mjs a67f1b3f1bdd51ca2b93997fa796a1e1202b390b`. The offline browser runner is `member-experience/tests/shop-connected-browser.mjs`; provide `MY_TIMBER_SHOP_FIXTURES` containing `live-testing.html`, `live-nutrition.html`, `live-kit.html`, `live-basket.js`, plus optional `MY_TIMBER_KIT_CLIENT`, `MY_TIMBER_SHOP_IMAGES`, `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE`. Capture the public paths named in the adapter and compare receipt hashes before reusing evidence for unchanged inputs.

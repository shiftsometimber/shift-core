# Shift Some Timber — master action register V6

Authority date: 2 September 2026  
Owner: Matt O'Brien  
Repository authority: `shift-core` main at or after `cc241f908adf1198e820911d3361f421ac66ae11`  
Static deployment candidate: V1.45 Runtime Brand/Wire Closeout (supersedes deployed V1.44)

This supersedes V5 where later account-side evidence is recorded below.

## 4 September 2026 engineering reconciliation

Current authority is `shift-core` main plus live production responses; older ZIP, route-count and PASS claims do not override a newer red production run.

| Area | Current state |
|---|---|
| Pharmacy and commercial launch | **PAUSED BY OWNER** — keep stock and checkout closed; do not progress partner, catalogue, margin or live-Stripe work in this closeout. |
| Human and operational sign-off | **PAUSED BY OWNER** — retain the requirements without presenting them as completed. |
| Deferred growth work | **DEFERRED BY OWNER** — paid acquisition, apparel expansion and partner outreach remain outside the active batch. |
| Lounge public chrome | **V1.44 SOURCE DEPLOYED; RENDERED DEFECT FOUND; V1.45 READY** — the server HTML is clean, but the production render proved shared JavaScript could restore Tap Room links. V1.45 removes the retired label/route from public HTML and JavaScript while retaining explicit redirects. Human visual sign-off remains paused. Package SHA-256: `85af874597097bd6086ba9dfd94ad1f3e89f06cd0d9f81b8299fc6cc35ebe148`. |nd links from all 451 source HTML files, makes `/lounge` the sole destination, retains explicit legacy redirects, and leaves the homepage ticker-free. Human visual sign-off remains paused. Package SHA-256: `7febe92db37ae14256d582238dce5bcf19d4d4ebe657a68f0914b3ba062abc91`. |
| Member rendered acceptance | **LIVE PASS — ALL FOUR LANES** — after a clean production Worker redeploy, run `33936036592` attempt 2 passed G2-011 Progress, G2-013 private photo lifecycle, G2-014 premium Progress Picture and G2-015 My Plans at desktop and 390px, then passed final all-four enforcement. Job `101263010863`, evidence artifact `9964593781`, digest `sha256:95cc811fe4a0fac47cea65a4ad06256c12ce55b5c81e5b5c780bcbdbc41c3418`. Each lane used a fresh restricted OIDC identity. |
| Shift Me source gate | **LIVE PASS** — navigation authority is eight current destinations including Clinic Gone Quiet / Coming Off and The Lounge, not the retired seven-tab/Tap Room assertion. Production run `33935206117` passed both jobs; technical job `101221679193`, evidence artifact `9959931000`, digest `sha256:3a35bbe0e8bd07b5d9f5d9e36d2e06d09ae381a542d05ab1917122a7c5acc98a`. |
| SHIFT AI wire | **V1.45 READY; DEPLOYMENT REQUIRED** — production rendering proved the full wire on `/medicine-news`, but also exposed a missing Treatment Centre ticker body and a static-library fallback when the live desk was RED. V1.45 fixes the container and enforces full current approved wire or hidden across Explore Knowledge, Treatment Centre and `/medicine-news`; homepage remains ticker-free. |nowledge and Treatment Centre chrome uses canonical `/v1/radar/ticker`, renders the full approved wire with no item cap, and removes the strip when the desk reports non-current or empty. Production is correctly RED/empty today, so no ticker appears. Homepage remains ticker-free. |
| Mental-health sitemap | **LIVE PASS** — production returns 252 URLs under `X-Shift-Sitemap-Authority: reviewed-mental-health-v1`, including exactly six reviewed leaves; the other 96 remain outside pending review. |
| Clinic Gone Quiet schema | **LIVE PASS** — Article headline matches the current H1 and public positioning on `/articles/stopping-glp1`. |
| My Journey controlled inputs | **SOURCE PASS** — measurements and optional personalisation use dropdowns; health context is consent-controlled and excluded when consent is off. Rendered member acceptance remains tied to the production closeout above. |

## Newly closed and corrected

| ID/area | Status and retained evidence |
|---|---|
| The Lounge treatment-language control | **CLOSED** — plain-language dose directives added to the held-treatment classifier; all 51 treatment-language cases pass with zero false positives/negatives; whole-estate and master-integration gates passed; PR #522 squash-merged as `cc241f908adf1198e820911d3361f421ac66ae11`. |
| Contact-page concern | **CLOSED AS OBSOLETE** — V1.31 contains no sensitive GET message form. Live authority presents phone, mailto partnership/general routes and the support route. No static patch is required. |
| A-01 Search Console property/sitemap | **RECONCILIATION REQUIRED** — historical proof recorded 347 URLs, but V1.44 and the live Worker now deliberately expose 252 canonical sitemap URLs. V1.43 evidence records `/articles/stopping-glp1` as submitted/indexed and `/medicine-news` as live/indexable but unknown to Google on 4 September. A fresh account-side read and reinspection are blocked because the connected GSC Wizard subscription is inactive. |
| A-01 priority indexing proof | **CLOSED** — 2 September URL Inspection returned PASS / Submitted and indexed / INDEXING_ALLOWED for homepage, Start Here, Explore Knowledge, Treatment Centre, GLP-1 Knowledge Centre, Men’s Mental Health, Tools, Shop, About and Contact. |
| Search indexing monitoring | **TRACKER RECONCILIATION REQUIRED** — V1.44's static sitemap and the live Worker are aligned at 252 URLs. The historical 347-URL tracker must be reconciled to that canonical set when GSC Wizard access is restored; do not retain deleted URLs merely to preserve the old count. |
| Search baseline | **RECORDED** — last 28 days: 486 impressions, 0 clicks, average position 65.22. Sitemap aggregate indexed count was stale because direct inspection proved ten priority URLs indexed. |

## Remaining actions that require account configuration or human/external evidence

| ID | Action | Exact blocker / closure test |
|---|---|---|
| A-02 | Bing Webmaster proof | Bing API key is not configured in the connected service. Add the site/API key, then submit/read the sitemap and retain feed/crawl proof. |
| A-03 | GA4 Realtime/DebugView and consent evidence | Search Console account is connected but Google Analytics permission is not. Grant the Analytics scope, link the correct GA4 property, then retain consent-denied/consent-granted event evidence. |
| A-04 | Physical-device full journey | Matt must complete one clean iPhone Safari and desktop pass through visitor, account, Today, Journey, Grub, Fit, The Lounge, Ask Timber, support and logout. Automated/source evidence cannot substitute for physical-device judgement. |
| A-05 | My Journey weekly acceptance | A real member must complete and later review a weekly cycle; remove test data afterwards. |
| A-06 | Shift Me visual acceptance | Technical render/rerender/isolation/persistence/deletion is production-proven. A human must judge likeness and requested-change credibility. |
| A-07 | The Lounge P0 drill | Requires a synthetic incident that deliberately triggers notification/queue activity. Run only as a labelled test and retain delivery, acknowledgement, audit and closure evidence. |
| A-08 | Legal/claims approval | Routes and current wording are technically checked. Competent legal and, where applicable, regulated clinical/medicines review cannot be self-certified by engineering. |
| A-09 | Evidence Desk environment | Source/tests are fail-closed and the R1.5 sealed-closeout workflow defines the correct non-production proof. Account-side run and retained artifact are still required before calling the environment commissioned. Publication remains disabled. |
| A-10 | Health-data erasure drill | Route is authenticated, scoped, audited and fail-closed. A synthetic production deletion must be run and evidenced; no real member record may be used. |
| A-11 | Apparel | **DEFERRED** until supplier sample, cost, fulfilment, returns and margin evidence exist. This is a business decision, not a website defect. |
| A-12 | Non-pharmacy outreach | **DEFERRED** until the relevant offer and unit economics are real. External outreach also requires named recipients and approval of the final messages. |

## Pharmacy-only blockers

1. Contract regulated prescribing/dispensing/pharmacy service.
2. Replace indicative products, strengths, pricing, wholesale costs and stock with partner-confirmed catalogue data.
3. Agree clinical, safety, controller/processor, retention and escalation ownership.
4. Agree assessment, payment, decline, refund, dispensing, delivery and failure states.
5. Obtain regulated claims/copy approval.
6. Load partner economics and approve contribution margin.
7. Run the controlled partner launch rehearsal.
8. Move Stripe from tested test-mode to live and open the sales gate only after items 1–7 pass.

## Truth statement

The engineering/site estate is not hiding another broad backlog. Remaining non-pharmacy work is confined to two missing account connections, four human acceptance judgements, two controlled production drills, one Evidence Desk account-side proof and external professional review. Those account, human and external items cannot truthfully be closed by source code or automated tests alone.

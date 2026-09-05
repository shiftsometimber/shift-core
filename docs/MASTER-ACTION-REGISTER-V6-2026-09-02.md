# Shift Some Timber — master action register V6

Authority date: 2 September 2026  
Owner: Matt O'Brien  
Repository authority: `shift-core` main at or after `cc241f908adf1198e820911d3361f421ac66ae11`  
Static authority: V1.31 HQ Commerce Content SEO Closeout

This supersedes V5 where later account-side evidence is recorded below.

## 4 September 2026 engineering reconciliation

Current authority is `shift-core` main plus live production responses; older ZIP, route-count and PASS claims do not override a newer red production run.

| Area | Current state |
|---|---|
| Pharmacy and commercial launch | **PAUSED BY OWNER** — keep stock and checkout closed; do not progress partner, catalogue, margin or live-Stripe work in this closeout. |
| Human and operational sign-off | **PAUSED BY OWNER** — retain the requirements without presenting them as completed. |
| Deferred growth work | **DEFERRED BY OWNER** — paid acquisition, apparel expansion and partner outreach remain outside the active batch. |
| Lounge public chrome | **LIVE SOURCE PASS** — `/lounge` is the sole destination; `/tap-room` redirects; deployed public runtime chrome v2 replaces the retired label without creating a second surface. Human visual sign-off remains paused. |
| Member rendered acceptance | **REGRESSION RED — PRODUCTION LATENCY** — the retained four-lane green remains run `33925679463`, job `101193550178`, artifact `9956797649`. After the public-chrome deployment, clean serial reruns exposed intermittent authenticated production latency: run `33936036592`, job `101224051780` passed G2-011 and G2-013, then G2-014 timed out on mobile and G2-015 received `Shift Core took too long to respond` from the API adapter on desktop. Evidence artifact `9960278986`, digest `sha256:8b372b5ebb47f8ee45bc96a161e9f833048f908f9a19737c4f4a9c1865911b3d`. Do not call the current member production gate green until a clean rerun passes all four lanes. |
| Shift Me source gate | **LIVE PASS** — navigation authority is eight current destinations including Clinic Gone Quiet / Coming Off and The Lounge, not the retired seven-tab/Tap Room assertion. Production run `33935206117` passed both jobs; technical job `101221679193`, evidence artifact `9959931000`, digest `sha256:3a35bbe0e8bd07b5d9f5d9e36d2e06d09ae381a542d05ab1917122a7c5acc98a`. |
| SHIFT AI wire | **LIVE PASS — FAIL-CLOSED** — deployed Knowledge and Treatment Centre chrome uses canonical `/v1/radar/ticker`, renders the full approved wire with no item cap, and removes the strip when the desk reports non-current or empty. Production is correctly RED/empty today, so no ticker appears. Homepage remains ticker-free. |
| Mental-health sitemap | **LIVE PASS** — production returns 252 URLs under `X-Shift-Sitemap-Authority: reviewed-mental-health-v1`, including exactly six reviewed leaves; the other 96 remain outside pending review. |
| Clinic Gone Quiet schema | **LIVE PASS** — Article headline matches the current H1 and public positioning on `/articles/stopping-glp1`. |
| My Journey controlled inputs | **SOURCE PASS** — measurements and optional personalisation use dropdowns; health context is consent-controlled and excluded when consent is off. Rendered member acceptance remains tied to the production closeout above. |

## Newly closed and corrected

| ID/area | Status and retained evidence |
|---|---|
| Tap Room treatment-language control | **CLOSED** — plain-language dose directives added to the held-treatment classifier; all 51 treatment-language cases pass with zero false positives/negatives; whole-estate and master-integration gates passed; PR #522 squash-merged as `cc241f908adf1198e820911d3361f421ac66ae11`. |
| Contact-page concern | **CLOSED AS OBSOLETE** — V1.31 contains no sensitive GET message form. Live authority presents phone, mailto partnership/general routes and the support route. No static patch is required. |
| A-01 Search Console property/sitemap | **CLOSED** — connected property `sc-domain:shiftsometimber.co.uk`; sitemap `https://shiftsometimber.co.uk/sitemap.xml` submitted 26 August, downloaded 1 September, 347 URLs, zero sitemap errors and warnings. |
| A-01 priority indexing proof | **CLOSED** — 2 September URL Inspection returned PASS / Submitted and indexed / INDEXING_ALLOWED for homepage, Start Here, Explore Knowledge, Treatment Centre, GLP-1 Knowledge Centre, Men’s Mental Health, Tools, Shop, About and Contact. |
| Search indexing monitoring | **COMMISSIONED** — all 347 sitemap URLs added to active tracker `453d7058-86d9-4efd-98f1-6b9aaa6340fd`; email digest enabled; initial state zero errors/warnings with remaining URLs pending scheduled inspection. |
| Search baseline | **RECORDED** — last 28 days: 486 impressions, 0 clicks, average position 65.22. Sitemap aggregate indexed count was stale because direct inspection proved ten priority URLs indexed. |

## Remaining actions that require account configuration or human/external evidence

| ID | Action | Exact blocker / closure test |
|---|---|---|
| A-02 | Bing Webmaster proof | Bing API key is not configured in the connected service. Add the site/API key, then submit/read the sitemap and retain feed/crawl proof. |
| A-03 | GA4 Realtime/DebugView and consent evidence | Search Console account is connected but Google Analytics permission is not. Grant the Analytics scope, link the correct GA4 property, then retain consent-denied/consent-granted event evidence. |
| A-04 | Physical-device full journey | Matt must complete one clean iPhone Safari and desktop pass through visitor, account, Today, Journey, Grub, Fit, Tap Room, Ask Timber, support and logout. Automated/source evidence cannot substitute for physical-device judgement. |
| A-05 | My Journey weekly acceptance | A real member must complete and later review a weekly cycle; remove test data afterwards. |
| A-06 | Shift Me visual acceptance | Technical render/rerender/isolation/persistence/deletion is production-proven. A human must judge likeness and requested-change credibility. |
| A-07 | Tap Room P0 drill | Requires a synthetic incident that deliberately triggers notification/queue activity. Run only as a labelled test and retain delivery, acknowledgement, audit and closure evidence. |
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

The engineering/site estate is not hiding another broad backlog. One active engineering blocker remains: intermittent authenticated production latency must be diagnosed and followed by a clean four-lane rendered member pass. Beyond that, remaining non-pharmacy work is confined to two missing account connections, four human acceptance judgements, two controlled production drills, one Evidence Desk account-side proof and external professional review. Those account, human and external items cannot truthfully be closed by source code or automated tests alone.

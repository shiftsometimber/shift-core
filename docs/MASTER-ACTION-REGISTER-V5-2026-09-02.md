# Shift Some Timber — master action register V5

Authority date: 2 September 2026  
Owner: Matt O'Brien  
Supersedes: master register dated 31 August and all V1.30-or-earlier static-release statuses.

## Closed in the V1.31/non-pharmacy run

| Area | Evidence/status |
|---|---|
| Static release | V1.31 live: pricing, out-of-stock state, HQ discounts/content edits and consent closeout verified. V1.32 priority-redirect-only candidate awaits static deployment. |
| Stripe engineering | Test integration and webhook/signature/account gates pass; live activation deliberately deferred |
| SEO runtime | Five guided pages render one H1 and the 347-route estate is retained. Six priority FAQ redirects remain 404 until V1.32 is deployed; the earlier V1.31 PASS claim was incorrect. |
| Member source gates | Worker, My Journey, Tap Room and commerce suites pass. Shift Me dependency chain restored live and regression-gated at/after `b4808f76…`. |
| Moderation ownership | Matt primary; Linda out-of-hours backup; `hello@shiftsometimber.co.uk` P0 route; playbook adopted |\n| Synthetic production drills | Tap Room P0 hold/queue/audit/sanitise/close and authenticated health-data erasure passed in production; no genuine member data touched. Evidence run `33605043625`. |
| Governance baseline | Retention schedule, DPIA/ROPA summary, processor baseline and rights/incident boundary documented |
| Financial planning | Editable 36-month Base/Downside/Upside model delivered; partner inputs visibly unverified |
| Competition/growth | Current competitor baseline and 12-week controlled-launch plan documented |
| Release truth | V1.31 is static authority; Worker main at/after `418359e6…`; sales/clinical gates closed |

## Remaining internally actionable proof

| ID | Action | Status/closure evidence |
|---|---|---|
| A-01 | Google Search Console sitemap, indexing, GA4 association and account baseline | Account-side blocker: fresh Google CAPTCHA on 2 September; no false completion claim |
| A-02 | Bing sitemap/account proof | Account access/submission evidence required |
| A-03 | GA4 consent states, Realtime and DebugView | Account-side event evidence required; privacy/source gates already pass |
| A-04 | Physical-device full journey | One clean iPhone Safari and desktop Chrome/Safari pass: visitor → account → Today/Journey/Grub/Fit/Tap Room/Ask Timber/support/logout |
| A-05 | My Journey real weekly cycle | Human/member acceptance with no retained test data; source and integration gates pass |
| A-06 | Shift Me likeness/product-context acceptance | Technical lifecycle passes; human visual judgement remains |

| A-08 | Support/legal human approval | Live functionality and wording check; competent legal review remains advisable before commercial launch |
| A-09 | Evidence Desk real-environment proof | Confirm production/non-production bindings, ledger and retained evidence; clinical publication stays locked |

| A-11 | Apparel launch decision | Obtain supplier sample, cost, fulfilment, returns and margin; launch or explicitly defer |
| A-12 | Non-pharmacy outreach | Diagnostics/nutrition/food/apparel outreach only after offer/economics are real |

## Recurring operations

- Daily SEO watch at 22:00 Europe/London.
- Uptime, route, error and release monitoring.
- Release SHA/static checksum/rollback pointer after material deployment.
- Monthly metadata/search-result review once Google has recrawled.
- Monthly Core Web Vitals/mobile review when field data exists.
- Monthly P0 route delivery test; quarterly Tap Room synthetic incident.
- Six-monthly DPIA/ROPA/processor/playbook review, plus immediate review after material change or incident.

## Pharmacy/commercial blockers only

1. Appoint and contract the regulated prescribing/dispensing/pharmacy service.
2. Replace indicative catalogue data with partner-confirmed products, strengths, wholesale costs, stock and fulfilment.
3. Agree controller/processor roles, clinical escalation, retention and safety ownership.
4. Agree assessment, payment, decline, refund, dispensing, delivery and failure states.
5. Approve regulated claims and exact commercial copy.
6. Load real unit economics into the financial model and approve the contribution-margin gate.
7. Run the controlled end-to-end launch rehearsal with the partner.
8. Complete Stripe business/live-mode activation and switch the sales gate only after every prior item passes.

## Deliberately deferred product evolution

Medicine Explorer/tablet expansion, Shift Now health ticker, licensed sports data, larger Grub/Fit libraries, connected Evidence publishing and wider whole-bloke health remain valid future work. They are not pre-pharmacy closeout blockers.

## Truth rule

Code, a ZIP, a document or a passing static test does not by itself close a live/account/human/external action. Every status above names the missing proof. Prescription sales remain fail-closed until the pharmacy/commercial blockers are evidenced.

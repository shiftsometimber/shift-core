# Public tool release checks and useful next steps — prepared 9 October 2026

Status: implemented and tested on an isolated branch. Publication remains paused; these changes are not active on production. Preparation is not permission to merge, publish or dispatch a deployment.

The original markup repair is live and the new read-only check confirms all nine pages still pass. This change addresses the remaining generic-result complaint as well as automatic post-deployment and post-rollback checks.

## What changes

- The existing guarded production workflow checks all nine pages after its owned deployment and after a successful owned rollback. Existing rollback conditions and scripts are retained exactly.
- Checks record Git source, release run, exact active Worker deployment/version before and after, each page outcome and HTML SHA-256. Any failed page, wrong owner, superseding deployment, incomplete check or failed workflow prevents a VERIFIED release report. A successful rollback leaves the failed release failed.
- The same workflow runs calculator and content browser checks after deployment. Artifacts and the final step summary retain the result.
- Each of the eight calculator pages gets its actual method, a labelled worked example, three specific actions and a named relevant link. Preset values never appear as a personal result; changed inputs hide the prior result. Calculator arithmetic stays unchanged.
- A new Decision Centre visit gets a concrete route into Treatment Finder. Profile-dependent legacy tabs and an empty personal GP report are disabled with an explanation when the required profile is absent. No new questionnaire, diagnosis or treatment eligibility assessment is introduced.
- Homepage, Start Here, customer data, costs, communications and ownership checks are outside this change.

## Actual evidence

`automation-proof.json`: real checker and real existing rollback script invoked against an isolated local CLI double. Passing gate exit 0; deliberately failing gate exit 1; guarded simulated rollback exit 0; post-rollback check exit 0; newer-owner rollback refused. Zero real Cloudflare calls. Failed release remains unverified after passing rollback.

`tool-guidance-browser.json`: 18 passing journeys, nine pages on 390px and 1440px Chromium. Actual current public HTML is intercepted only inside the test browser; current public scripts execute unchanged. Checks cover calculations, initial-result hiding, changed-input stale-result hiding, negative alcohol input, methods, three useful steps, named destinations, no script errors/overflow on calculator pages, legacy no-profile controls and the Treatment Finder destination. This proves the prepared browser experience, not a production deployment.

`live-schema-check.json`: all nine current live public URLs passed HTTP and canonical free WebPage checks. This is not a Semrush recrawl and does not imply the prepared guidance is live.

`test-results.tap`: targeted verifier, automation, rollback and guidance tests.

## Specific methods and destinations

| Page | Specific answer | Next action |
|---|---|---|
| Alcohol | ml × ABV × quantity / 1000; two 568ml pints at 4% = 4.5 UK units | Add a whole week and read the NHS weekly guideline |
| BMI | 80kg / 1.8m² = 24.7; a reference, not a diagnosis | Record a baseline; add a waist measurement where appropriate |
| Calories | Adult male Mifflin–St Jeor equation; the stated example = 2076 kcal maintenance | Plan meals, then review the real trend rather than prescribing a deficit |
| Healthy weight | Standard BMI 18.5–24.9 gives 59.9–80.7kg at 180cm | Use as context; do not choose the bottom as a personal target |
| Protein | 80kg × selected 1.6g/kg = 128g/day | Check the selected planning level and use normal meals |
| Waist-height | 90cm / 180cm = 0.50 | Measure consistently; use alongside relevant health information |
| Walking | Selected MET calculation; 80kg, 30min, 3.5 MET = 147 kcal | Plan a manageable repeatable walk; track minutes |
| Water | Rough 30ml/kg heuristic; 80kg = 2.4L | Compare with NHS general guidance and follow individual restrictions |
| Decision Centre | New preferences form available; legacy profile calculators unavailable without that profile | Enter preferences, compare routes and prepare three professional discussion questions |

Primary guidance checked: NHS alcohol units, NHS hydration, NHS walking for health, NHS waist-to-height instructions, NICE NG246 identifying/assessing overweight and central adiposity, and the existing Mifflin research citation. The weight-based water heuristic is explicitly distinguished from NHS guidance. No formula or clinical threshold was changed.

## Outstanding and approvals

Production publication is paused by the user. No merge, workflow dispatch, Cloudflare upload or production rollback was performed. Once publication is explicitly authorised, use the guarded workflow and retain its actual live verification result. A branch proof does not replace that live run.

Semrush: no exposed Semrush connector or open authenticated Semrush project was available. Chrome had no open project; Safari showed ChatGPT only. No login, subscription or refresh was attempted without an available existing session. The original audit finding awaits a fresh crawl; current HTTP/markup tests pass. The generic copy and misleading default-result weaknesses remain on the live site until this paused change is published. Other audit findings are not silently claimed fixed.

Concurrent source integration: current main advanced to 7e218c9187b4605a9ed73bc17b8321091d0604a9 during preparation. Its recovery code, existing source receipts and eight-page answer additions are preserved unchanged. The finite source envelope also pins those already-present answer files; they are not newly edited or published by this task. Publication remains paused.

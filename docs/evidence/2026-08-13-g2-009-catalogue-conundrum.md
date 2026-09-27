# G2-009 — production catalogue-backed Conundrum evidence

Date: 2026-08-13

## Demonstrated production path

PR #160 (`G2-009: use permitted restricted commissioning identity`) was merged to `main` as `6e700a923f2dd7baa3bca5deb99f26d9a0c802b7` after its pre-merge gates were green.

The narrow correction changed only the synthetic commissioning identity into the already-permitted restricted `structured-*` namespace. It did not widen or weaken the production authentication boundary.

The unchanged main-branch **Shift Production Commissioning** run `31710006859`, production job `94480182185`, completed GREEN. Step 12 (`Final B03 Progress Picture and Shift AI production closure`) executes `finish-b03-final3-production.mjs`, which imports `gate2-conundrum-production.mjs`; therefore a failure in the Conundrum proof would have failed that production step and the job.

The production Conundrum proof requires all of the following:

- governed runtime source reports `published_catalogue`;
- a non-empty governed catalogue is available;
- relevant returned suggestions are from the published catalogue;
- a known governed recipe (`lighter-beef-cottage-pie`) is returned for its relevant ingredient relationship;
- matched-ingredient evidence is retained in the result;
- an unrelated ingredient set returns an honest zero-result response;
- zero-result behaviour does not invent a fallback recipe.

All assertions passed in run `31710006859` / job `94480182185`.

## Commissioning judgement

This is demonstrated production journey evidence rather than source/merge evidence alone. On the original-audit evidence standard, G2-009 has an evidence basis for PASS. Formal matrix/ledger/board reconciliation must preserve Category-A accounting: G2-009 was a Category-B post-launch-hardening AMBER, so its closure changes the original audit from 26 PASS / 28 AMBER / 3 BLOCKED to 27 PASS / 27 AMBER / 3 BLOCKED and Category B from 4 to 3; Category A remains 24 until an A-row itself closes.

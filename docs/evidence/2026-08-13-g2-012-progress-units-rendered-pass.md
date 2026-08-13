# G2-012 — rendered Progress units production PASS

Date: 2026-08-13 UTC

## Acceptance result

G2-012 has earned PASS on production evidence.

Fresh Gate 1 run `31754823760`, dedicated job `94628250500`, executed the real member Progress Picture surface at desktop 1440x900 and mobile 390x844.

Both cases proved:

- authenticated member entered the real `visualise` / Progress Picture surface;
- valid image input was accepted and decoded by the live client;
- member-visible state changed from `Saving your real progress photo…` to `Original progress photo saved to My Shift.`;
- production `POST /v1/shift/progress-photo` returned HTTP 201;
- saved history rendered `15 st 0 lb · 50.0 in waist`;
- no impossible `st 14 lb` remainder rendered;
- after logout and fresh login, saved history still rendered `15 st 0 lb · 50.0 in waist`;
- root overflow was 0px at both viewports;
- no console errors or page errors occurred.

Retained artifact: `9202339510`.

Artifact SHA-256: `661d48dfe4206db9f963e443f41c71035db9294bf52196680b5387f512f6044e`.

The same PR lineage has GREEN Shift Master Integration and Whole-Estate Route Sweep gates. Gate 1 run `31754823760` was rerun after a one-off dashboard-navigation commit timeout in the independent G1-008 state harness; the rerun completed GREEN for `rendered-state-system` job `94629176950`, G2-012 job `94629177272`, rendered-browser job `94629177460` and accessibility-performance job `94629177500`. That confirms the navigation timeout was transient and unrelated to the Progress unit acceptance.

## Prior red runs

The earlier G2 failures were commissioning-fixture defects rather than product-unit failures. The synthetic image bytes supplied by the harness were corrupt; the live member client correctly rejected them with `The source image could not be decoded.` Replacing that corrupt fixture with a genuinely decoded RGB PNG allowed the unchanged production unit path to execute end-to-end and pass.

## Accounting consequence

On merge/reconciliation, G2-012 moves AMBER -> PASS. Original-audit accounting therefore moves from `29 PASS / 25 AMBER / 3 BLOCKED` to `30 PASS / 24 AMBER / 3 BLOCKED`. Any Category-A board that currently counts G2-012 as an open Category-A blocker should fall by one at the same atomic reconciliation point.

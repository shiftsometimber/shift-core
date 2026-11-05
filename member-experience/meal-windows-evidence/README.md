# Time-aware meals — LIVE 5 November 2026

Deployed 12:25:53 GMT; verified 12:28:12 GMT.
Member version: 819fc42f-1a75-4689-b84b-370c19d6bbb5.
Preparation service: 637b0bab-7fff-4a83-a98c-524373e4837e.
App source: 88ef635c38ada106c4ce9fba3c84db023f9d855f.
Release operator readiness repair: 13b5e1ae.
Core remains 36d0c04b-bb34-4c05-81ac-27e20a958756; no Core, Shop, checkout, clinical, CSS, frame or navigation change.

| Requirement | Result | Evidence |
|---|---|---|
| Breakfast 03:00–11:00, lunch 11:01–15:00, tea 15:01–02:59, UK clock | PASS | Unit boundary/DST cases and live browser renders with controlled clock |
| Same meal on Today and Grub | PASS | Browser navigation and recipe-title assertions |
| No extra request on clock change or visited Grub navigation | PASS | Actual browser request log; no intercepted API responses |
| Picked/completed choice stays put | PASS | Pick, clock change and account snapshot assertions |
| One pile log across two concurrent completion requests | PASS | UI Done races independent API client; pile increases 12 to 13, food totals unchanged |
| Negative optional feedback retains log | PASS | Actual feedback write and account snapshot |
| Three same-source swaps within 5g | PASS | Ten generated groups across all periods, reviewed 2692-recipe fixture, test/live response checks |
| Breakfast food entry opens with Breakfast selected | PASS | Browser assertion without submitting food |
| Return-to-app applies current prepared meal | PASS | Existing visibility lifecycle with actual boot response |
| Shop stays as before | PASS | Before/after text/link projection and videos; unchanged CSS/frame source |
| Overnight preparation; no screen-open recommendation generation | PASS | Existing preparation/cron lane; prepared context test rejects any DB query |
| Physical iPhone / Android | NOT PERFORMED | Results are mobile browser emulation on the authorised Mac |

38 focused model, nutrition, account, privacy, bootstrap, overnight, cache and clock tests passed.
Test site: Chromium 26/26, WebKit 26/26.
Production: Chromium 18/18 (clock/read checks), WebKit 25/25 (clock plus choice/completion/feedback).
Browser tests used owned synthetic accounts only. Preparation updated derived offers for 223 eligible consented accounts, without changing action, food, Fit, pile, consent or clinical records. Browser tests then wrote the owned synthetic account's choice and daily completion only.

## Speed

Same throttled mobile profile, 20 samples per metric before and after: 390×844, DPR 2, 150ms latency, 200000 bytes/s download, 96000 upload, 4× CPU slowdown. Fresh timing includes fonts-ready and two paint frames. This is a fresh comparison, not a reassertion of historical 1.07s measurements.

| Metric | Before median / p95 | After median / p95 |
|---|---|---|
| Fresh Today | 1271 / 1423 ms | 1250 / 1415 ms |
| Warm Today → Grub | 22 / 23 ms | 22 / 23 ms |

No errors or dropped samples. No new full-app, Fit, physical-phone or repeat-shell timing claim.

## Release and rollback

The first live attempt hit HTTP 404 while the temporary preparation operator propagated. Both services automatically rolled back. An authenticated empty-batch readiness probe was added; the same reviewed app candidate then prepared all eligible accounts and passed live checks. The operator was disabled and restored afterwards. Failure receipts remain in release.json. An earlier bundled dependency error was caught and fixed on the test site.

One-step rollback:
node member-experience/tools/meal-windows-release.mjs rollback

Restores member 17bb6c7a-8f46-45f5-9ce3-e81cd7946adf and preparer fd40f888-6cec-48bc-b9e8-22bce33b182b. Derived offer data is additive/backwards-compatible; actual records are never rolled back. No route or schedule changed. No purchases, messages, Apple changes, new provider settings or paid services were actioned.

Clock changes defer while a dialog, form, open recipe or save is active, and never remount the shared shell. Tea crosses midnight; the pile ledger retains its UK calendar day.

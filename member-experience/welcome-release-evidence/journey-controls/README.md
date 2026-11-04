# Journey controls — live and verified, 4 November 2026

Member release 2abe05bf-2f50-4818-8335-a2180293cf7e; live 2026-11-04T22:27:28.531Z; verified 2026-11-04T22:27:56.851Z (GMT).
Source 453c387eadfb47772d0d7f72d877a1fb1745f38f. Core unchanged from the assessment-fee public-terms release.

| Requested change | Result | Evidence |
|---|---|---|
| Remove MEDICINE OVER TIME and How the example works from the guide | PASS — live | guide screenshots and rendered-text checks. The existing main Journey medicine section and illustration information remain. An accessible, visually hidden page heading is retained. |
| Put Day on one line, number underneath | PASS — live | Seven controls in one row at 320/375/390px. Each word has one text line; number is below it; no horizontal overflow; each button >=44px tall. Day 1 through 7 still select the correct date. |
| Strength and Energy respond without pressing Save | PASS — live | Instant card ordering/selected state while the real preference POST is deliberately delayed 450ms. No response is mocked. The view switches before the request completes. |
| Remember the choice, including rapid taps/reload | PASS — live | Strength→Energy queue persists Energy to the actual account; both Energy and Strength survive reloads. Unsaved Energy form selection survives background preference saving. |
| Shared frame, records and pile | PASS for changed scope | Same shell DOM within each document, unchanged pile count, existing privacy/SQL tests. The test's intentional full-document reload starts a new shell reference. |

Test site: Chromium 27/27, WebKit 27/27. Production: Chromium 27/27, WebKit 27/27. Focused Journey tests: 16/16. Videos and actual screenshots are in the test/live subdirectories. Owned synthetic accounts only. These are mobile browser emulation results on the authorised Mac, not physical iPhone or Android results. A single interaction latency is recorded for the delayed-response test; no new p95 or broad performance claim is made.

Cause: Journey saved successfully, then reused a stale cached response and drew the old lead choice. Fix: optimistic view selection; serial last-choice persistence; fresh reads from the existing Journey endpoint after writes and when Journey opens. Health records still require their own explicit save. Today's startup requests and the shared frame are unchanged.

One-step rollback to the exact preceding member release (assessment changes remain):
node member-experience/tools/journey-controls-release.mjs rollback

The earlier assessment/T&C changes and their remaining provider/checkout/refund integration limits are unchanged. No payments, messages, clinical submissions, Apple changes or real-member test writes occurred.

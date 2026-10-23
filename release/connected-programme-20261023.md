# Connected Programme — implementation and release record

State: deployed on 23 October 2026. Authenticated production joining save/reload and cross-page Programme acceptance now pass in the dedicated Test account. Public assets and anonymous access controls also pass. Weekly/four-week timing remains fixture-clock verification.
Base: `4e3fcf85c9396260981b495cb2cc5861a76b2734` (main, 23 October 2026).

The approved compact joining questions now use the existing authenticated Life Back API and account-owned member-state storage. `/member/get-started` keeps one or two reasons, their 1–5 starting points, an optional note and the member's small win. The first baseline is immutable. Later edits retain the earlier answers; a new primary reason gets its own comparable starting point without fabricating scores. These ratings are separate from the existing six-area Life Back score.

Today carries the saved reason and small win. Grub and Fit show the connection to the member's current step. Weekly reviews become available after seven elapsed days, with an explicit proposal before acceptance. The four-week comparison becomes available after 28 elapsed days for the relevant starting point. Reviews, reflections and prior goals remain in the account. No new table or database migration is required.

The existing Next Shift loop now accepts `not-helped`, distinguishes that from `not-fit`, and remembers rejected approaches. Food can change from recipes to the meal-building guide. Feedback proposals are read-only until accepted; canonical and linked daily reviews check the proposed revision. Choosing a smaller step from a reflection does not invent a failed attempt. Planned, tried and completed remain distinct.

## Verification

- 83 focused Node tests pass, including real SQLite-backed route tests for account isolation, consent withdrawal and withdrawal races, idempotent retries, stale-tab conflicts, immutable baselines, weekly/four-week timing, rejection memory and linked-feedback proposal revisions.
- Existing entry, Next Shift, check-in follow-up, progress, first-day, Today and session-state regression checks pass.
- `npm run check` passes: route readiness, commissioning source, login fast path and commissioning independence.
- Wrangler production configuration compiled with `deploy --dry-run`. Live configuration inspection then showed that a broad core release would not preserve the latest live setup, so the approved feature was published through the narrow adapter instead. The core Worker code and bindings were not redeployed.
- Internal browser QA uses the actual clients and Life Back routes against a separate in-memory SQLite fixture with fictional sessions. Desktop joining, saved reason, a different feedback proposal, acceptance, weekly review and refresh persistence pass. Phone joining, four-week comparison, smaller-step proposal/acceptance and retained Life Back comparison pass. Tested phone document width 375px; horizontal overflow zero.
- The browser harness uses simple tool scaffolds around the new components. It is not proof of a complete production Grub/Fit account journey. Day 8/day 29 checks deliberately advance fixture timestamps; they are not elapsed-time production proof.

## Controls and release outcome

Optional health tracking and the existing authenticated API remain the write boundary. Health data is not saved in local/session storage. Existing Grub/Fit records and six-area history are preserved. Export and erasure inherit the canonical Life Back storage boundary. Signup, verification emails, medicine checkout, stock, clinical decisions and the homepage are outside this change.

Matt explicitly approved the completed connected version for deployment. `shift-programme-member-20261023` now serves 22 narrow website/API routes, delegating the existing member pages to the unchanged live core and appending the Programme assets once. All unrelated routes and core bindings were preserved. The approved implementation source is `0bbf4acfd71d86a51ffffc211dc55961d5a47b36`. The adapter has four additional focused tests; all pass. The final sign-in guard stays below the existing header.

Live verification: six served assets/documents match source exactly, four member pages mount the Programme client once, five website access/origin checks pass, and both API-host endpoints deny anonymous access while preserving the official-origin preflight. The deployment receipt and exact route rollback records are adjacent to this file. Rollback changes only the owned narrow routes to their recorded previous owners; it does not restore or overwrite member data.

The audited commissioning login is not available in this local deployment session. No customer account was used for acceptance. Account saving and reflection history passed the SQLite-backed route/browser tests, but a signed-in production save/read-back is still required. The day-eight/day-29 checks remain fixture-clock tests rather than real elapsed-time proof. The earlier owner-private Sites prototype remains a design preview and is separate from this deployed implementation.

## Joined-up recheck — 23 October 2026, 11:02 BST

A fresh read-only live verification passed: six exact assets/documents, four member-page mounts and five anonymous/origin checks. Receipt: `work/build/programme-overlay/live-verification.json`, timestamp `2026-10-23T10:02:03.363Z`. Joining correctly shows the account guard and its Sign in link retains `/member/get-started` as returnTo. Clients use the same `/v1/life-back` account boundary and return links to Today; no independent browser-local journey store was introduced. The commissioning identity remains unavailable. Authenticated production save/read-back and cross-page continuity remain pending secure sign-in to an authorised test account. No customer data was changed during this recheck.

Secure browser sign-in was submitted for the user-selected test identity. The live form then displayed a Cloudflare Verify you are human challenge. Authentication success is unverified; no account writes were attempted. Browser handoff requested for the security check. Do not replay credential submission or bypass the challenge. Resume with fresh visible session verification, then the account save/reload/cross-page check.

## Authenticated production acceptance — 23 October 2026, 12:05 BST

Matt created the dedicated Test account and completed secure sign-in/human verification. The existing normal server session opened `/member/get-started`. Fictional reason, 3/5 baseline, clearly labelled test note and a fictional small win were saved via the visible live form after the optional tracking consent control. All four exact answers were read back after reload. Today, Grub, Fit and Life Back retained the same account context; Life Back displayed the original baseline without inventing six-area scores. This retires the earlier account-save acceptance blocker.

The live walk-through found three frontend continuity defects: repeated personalisation after joining, unrelated food-task context in Fit, and the persistent tool shell dropping the meal-guide parameter/reusing stale state. These were fixed in source `1cd28ec70`, with the return-to-feedback refinement in `9d9816ae7`. Six added continuity regressions pass; the affected 26-test run passes. Only the narrow existing Programme Worker was republished; routes, its bindings and live core settings were checked unchanged.

Live did-not-help feedback first showed a read-only different-approach proposal, then explicit acceptance saved the meal-guide next step. The accepted step survived reload. The exact guide link carried its approach/shift through the embedded shell; ordinary Grub reload restored the guide from canonical account state. Its return link opened feedback for the accepted guide. Fit showed the personal reason for a food-focused next step; the redundant joining prompt was absent. Original reason, baseline, note and small win remained intact.

Current production/application receipt: `connected-programme-account-acceptance-20261023.json`. The embedded public HTTP receipt intentionally reports only its anonymous checks; the authenticated proof is recorded by the enclosing receipt. Previous deployment/recheck receipts remain historical. No credentials, cookies or real customer health records were recorded. The test answers remain available in Test for further use. No email, order, payment, treatment change or account erasure was performed during the acceptance walk-through.

Limits: genuine day-eight/day-29 elapsed production acceptance is not yet possible on this new account. Timing remains covered by the existing fixture tests. A second-account production isolation test was not repeated; SQLite-backed account-isolation/consent tests continue to pass. This receipt does not claim native-device, clinical checkout or complete Grub/Fit plan-generation acceptance.

## Broad member-process acceptance — 23 October 2026

Core live account writes, return visits, Grub recipes/fridge/plans/swaps/shopping/diary, Fit partial-session state, daily check-ins, Life Back, explicit Next Shift feedback, Ask Timber working-late handoff, personal details and consent withdrawal/opt-in were exercised with fictional Test-account data. After-treatment week-one activation survives reload. This is broader acceptance, not universal sign-off. No production code was changed or deployed in this audit.

The two automated runs contain 682 tests: 676 passed, five failed and one skipped. Three failures are preservation harness assumptions requiring a native .git directory in a worktree checkout. Two are old coming-off static string/wiring expectations differing from the current 12-week implementation; live week-one start passes but later weeks remain unaccepted. The skipped check is the real-model practical pilot. Tests were not weakened. Raw output remains in work/member-process-acceptance-20261023/.

Confirmed priorities: latest94.5kg/99cm review does not update Journey Now95kg/100cm or Life Back measurement summary; Progress→Fit changes URL but stays on Progress until reload; Programme reason and Life Back baseline are asked/shown inconsistently in Journey. Appointment records still display medicine-supply language. Grub day3 shows three planned meals totalling861.2kcal/person, requiring nutrition-quality acceptance rather than assuming a complete balanced day. Ask Timber exposes preview/technical copy.

Detailed evidence, statuses, scope limits and next actions: member-process-acceptance-20261023.json. Device permission/delivery, second-account production isolation, real elapsed reviews, controlled clinical/order/payment/refund processes, file-content checks and destructive final boundaries are not signed off. No messages, orders, charges, appointment bookings or history/account erasure were submitted. Optional tracking was restored on and existing history retained.

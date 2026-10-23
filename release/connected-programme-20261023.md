# Connected Programme — implementation and release record

State: deployed on 23 October 2026; public pages, exact served assets and anonymous access controls verified. Authenticated production save acceptance remains unverified.
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

# Connected Programme — implementation and release record

State: implemented and tested in `work/connected-programme-20261023`; not deployed to production.
Base: `4e3fcf85c9396260981b495cb2cc5861a76b2734` (main, 23 October 2026).

The approved compact joining questions now use the existing authenticated Life Back API and account-owned member-state storage. `/member/get-started` keeps one or two reasons, their 1–5 starting points, an optional note and the member's small win. The first baseline is immutable. Later edits retain the earlier answers; a new primary reason gets its own comparable starting point without fabricating scores. These ratings are separate from the existing six-area Life Back score.

Today carries the saved reason and small win. Grub and Fit show the connection to the member's current step. Weekly reviews become available after seven elapsed days, with an explicit proposal before acceptance. The four-week comparison becomes available after 28 elapsed days for the relevant starting point. Reviews, reflections and prior goals remain in the account. No new table or database migration is required.

The existing Next Shift loop now accepts `not-helped`, distinguishes that from `not-fit`, and remembers rejected approaches. Food can change from recipes to the meal-building guide. Feedback proposals are read-only until accepted; canonical and linked daily reviews check the proposed revision. Choosing a smaller step from a reflection does not invent a failed attempt. Planned, tried and completed remain distinct.

## Verification

- 83 focused Node tests pass, including real SQLite-backed route tests for account isolation, consent withdrawal and withdrawal races, idempotent retries, stale-tab conflicts, immutable baselines, weekly/four-week timing, rejection memory and linked-feedback proposal revisions.
- Existing entry, Next Shift, check-in follow-up, progress, first-day, Today and session-state regression checks pass.
- `npm run check` passes: route readiness, commissioning source, login fast path and commissioning independence.
- Wrangler production configuration compiles with `deploy --dry-run`; no upload or deployment performed.
- Internal browser QA uses the actual clients and Life Back routes against a separate in-memory SQLite fixture with fictional sessions. Desktop joining, saved reason, a different feedback proposal, acceptance, weekly review and refresh persistence pass. Phone joining, four-week comparison, smaller-step proposal/acceptance and retained Life Back comparison pass. Tested phone document width 375px; horizontal overflow zero.
- The browser harness uses simple tool scaffolds around the new components. It is not proof of a complete production Grub/Fit account journey. Day 8/day 29 checks deliberately advance fixture timestamps; they are not elapsed-time production proof.

## Controls and remaining release step

Optional health tracking and the existing authenticated API remain the write boundary. Health data is not saved in local/session storage. Existing Grub/Fit records and six-area history are preserved. Export and erasure inherit the canonical Life Back storage boundary. Signup, verification emails, medicine checkout, stock, clinical decisions and the homepage are outside this change.

Production release has not been performed. Obtain go-live sign-off for the completed connected implementation, retain the previous Worker version for rollback, and verify the deployed routes and authorised test-account persistence after release. Do not describe the private design preview or this test candidate as customer-live.

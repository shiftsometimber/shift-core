# My Timber treatment week — source candidate, 13 October 2026

Built on current main `c9756798dd271260c8812e419fae5f0d7c61e194`, tree `04cc61c1e2283d2fba3411666bf5a57ef2979940`, in an isolated worktree. Matt's 13 October 17:27 BST instruction authorised wider app research and building on My Timber. This is source preparation for the existing #1065 lane, not production activation, clinical approval, a new release owner or permission to send communications.

## Implemented

- Existing Progress gains an optional treatment-week view after explicit owned-source selection. A keyboard-accessible day picker shows one day at a time on phone and desktop.
- Seven elapsed days connect actual dose/strength/site, typed symptoms, member severity and reported onset, appetite, energy and selected food/Fit/measurement context.
- Retrospective repeated timing includes day three and day seven. Strength changes, incomplete/shortened/interrupted weeks, missing onset and missing logs are handled explicitly. The old 48-hour rule remains byte-identical in its original module.
- Private prescriber-question notes use existing event storage, with same-origin/session/ownership, atomic consent/pause guards and idempotent retry. Nothing is sent.
- A selected recorded-week text report and the existing last-12-weeks treatment PDF remain clearly separate. The PDF does not silently add medical disclosures.
- A functional draft absorption/elimination and accumulation engine and plot are built for fictional review. Real member responses contain `review_pending`, without curve points. No model call or service subscription.

The benchmark and complete capability reconciliation are in `my-timber-app-benchmark-20261013.md`. This increment preserves the delivered charts, quick logs, supply estimate, optional weight trend, original photos, food diary, CSV, consent/privacy routes and existing Today spine. It does not claim to complete every surveyed capability.

## Actual verification

Final current source: 397 member/Progress unit and real-SQL tests pass, zero failures/skips; configured Wrangler Worker dry build passes. The final new browser receipt is dated `2026-10-13T17:01:33.191Z`, with 13 checks at each of 380 and 1440 px, zero browser errors and no horizontal overflow. It exercises the actual candidate Progress/client and owned routes with fictional SQLite records, including note failure/retry/reopen, one saved note, source withdrawal, session expiry, safe text rendering, full-week evidence, keyboard/day selection and export.

The unchanged original browser verifier also passes all 11 retained groups at 380/1440 and expiry, including charts/logging/pattern explanation, photo consent/withdrawal/delete, CSV import, Grub save/reuse/delete and original dose/PDF checks. Its blob remains `31c7bf5bb87d301dc8b232f43a443b177a012007`; no original assertion or timeout was weakened. The first new fixture run failed because navigating to the identical hash URL did not reload the denied page. The new fixture uses an explicit reload for the same URL, retains the failure evidence and passes the recovery assertions. Test-fixture column-count and EOF formatting errors were corrected before final proof.

These are source/synthetic browser and configured-build receipts, not production, clinical, independent-member or actual-device acceptance. The online SST Mac's fresh xctrace inventory lists the Mac only; no connected physical iPhone was established.

## Finite candidate

Exactly 12 intended source paths:

1. `frontend/member/member-progress-v1.js`
2. `member-experience/entry.mjs`
3. `member-experience/treatment-routes.mjs`
4. `member-experience/treatment-week.mjs`
5. `member-experience/treatment-week-route.mjs`
6. `member-experience/treatment-week-client.mjs`
7. `member-experience/tests/treatment-week.test.mjs`
8. `member-experience/tests/treatment-week-route.test.mjs`
9. `member-experience/staging/verify-treatment-week.mjs`
10. `docs/my-timber-app-benchmark-20261013.md`
11. `docs/my-timber-treatment-week-20261013.md`
12. `docs/my-timber-treatment-week-20261013.receipt.json`

No production configuration, migration, prescribing, stock, homepage, global navigation, native package/store, original verifier, existing release registry or workflow change. Proof directories, installed dependencies and logs are excluded from the source commit. The separate source branch is preparation for the sole #1065 lane; no competing PR or release is created.

## Exact remaining dependencies

1. Existing My Timber/#1065 source owner adopts this exact source, preserving any intervening owner changes, and performs finite composition registration with all original positive/negative and exact-head gates.
2. Named qualified clinical/model reviewers resolve the draft model assumptions, repeated-timing presentation/thresholds and relevant regulatory/operating decisions. `CYCLE_REVIEW` remains pending and the real route never supplies a medication curve. Do not mark review as approved in order to pass a test.
3. Final reviewed source/version and activation scope need the existing production authority before enabling `MY_TIMBER_WEEK_VIEW_ENABLED` and guarded promotion. Patient-facing activation is not authorised by a source-build instruction alone.
4. Actual holders close the existing installed iPhone/Android sheet and ordinary entry/recovery separately. No email-generating account test was initiated.
5. Today/proactive follow-up, native widgets/shortcut and CSV mapping adoption, maintenance and reviewed automatic food capture remain the next existing-owner increments recorded in the benchmark. No paid provider, upload, background model or external message is enabled here. Source and current reviewer dependencies must be satisfied before making a completion-date commitment.

The source receipt contains actual SHA-256 identities and dated test/browser/build results. The working review in the existing upgrade document uses fictional records and never reads an account, calls a model or sends a note. A saved report/branch does not establish delivery of instructions into another chat or prove another owner started.

# My Timber — consolidated release recovery

Owner request: Matt asked to combine the failed My Timber and publishing-access handovers and finish the already authorised release. This is the single continuation of PR #784, not a second feature branch or a production approval bypass.

## Authoritative state recovered from GitHub

- Repository: shiftsometimber/shift-core. Existing PR: #784; branch: feat/my-timber-pwa-20260921.
- Starting remote candidate: 0f8fe98f795d9acae9020599431c5c0e8bbfd6ee.
- PR was open, draft and unmerged on recovery; GitHub reported mergeable=false. That flag alone does not establish the reason.
- The handover names local commit c526683. A direct repository commit lookup returned HTTP 422, No commit found for SHA. Its contents have not been recovered; do not describe that commit or its work as pushed, tested or live.
- Current session has no previous session workspace. Existing remote work must be retained. No older ZIP or alternate Pages source is authorised.
- Existing PR records owner release authorisation conditional on acceptance. No repeat design approval is needed; outstanding acceptance must not be marked passed without evidence.

## Combined bounded scope and acceptance

| Item | Recovered state | Completion criterion |
| --- | --- | --- |
| Compact My Timber install instructions, public footer link and 8px header-to-CTA gap | In remote preview at the starting candidate; previous preview evidence recorded in PR | Exact candidate preview/browser regression checks, then guarded release and production read-back |
| Existing-account installed My Timber experience and optional reminders | Prior full-account staging and iPhone device-shell receipt recorded; full installed-account and Android physical gates remain unverified | Existing ACCEPTANCE.md and REVIEW.md gates; do not substitute emulation for physical-device evidence |
| My Orders and Member Details (address, contact, date of birth, phone, email, consents) | Requested by owner; not in the remote PR changed-file list, implementation not recovered | Authenticated own-account views; proper empty/failure states; validated saves read back after reload/sign-out/sign-in; no cross-member disclosure; consent handling preserves existing rules |
| Site-wide postcode Find address / selection and GP suggestions | Requested by owner; implementation not recovered | Shared accessible component on actual address/GP entry surfaces; provider-backed full address/GP results where configured; honest manual fallback without inventing unavailable address records; save/reload verified |
| Earlier Ask Timber, password visibility and Grub repairs | Prior handovers report them released | Preserve current main and verify these regressions; do not reapply an old candidate over newer repairs |
| Missing local changes and publishing path | Missing local SHA confirmed, write path being exercised by this register | Recover exact original patch or explicitly reconstruct from authoritative source, run exact-head preview gates, record actual write/release result |

## Protected decisions

Preserve No stock available today messaging, theoretical-stock testing setup, prices, intended services, member data, brand/header/navigation locks and existing clinical/payment decisions. No unrelated features, stock/catalogue writes or source changes. No production deployment merely to test permissions. Keep one preview and one guarded production release after acceptance, with source/build identity, results and checksum.

## Evidence discipline

Remote PR state and commit lookup are direct checks made during recovery. Earlier PR test totals are historical records, not fresh test results for a reconstructed candidate. This document is not proof of a deployed feature. Record exact build and raw test/browser/live evidence before changing any row to complete.

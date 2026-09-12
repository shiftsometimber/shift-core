# Member experience verification — 12 September 2026

Implementation: `d4071764cce61f82901f39a1f0393bd46c30b89d`, tree `76aeab8ebb334f237422485378fdea4d237e9d87`.

## Result

The isolated checks workflow passed 155 checks: 33 member presentation/existing Journey, check-in and Fit contract checks, 38 workplace checks (including real workerd authentication and persistence), and 84 existing Programme checks.

- Checks: https://github.com/shiftsometimber/shift-core/actions/runs/34690665204
- Hosted staging: https://github.com/shiftsometimber/shift-core/actions/runs/34690665172
- Remote workplace probe passed at `2026-09-12T11:18:57.583Z`: member/HQ session separation, persistent code claim/review, foreign-employer rejection, fixed report and revocation, blocked clinical ordering, logout invalidation.

The unrelated pre-existing `act2b-one-shot.yml` workflow validation failure remains. This is not a claim that every repository workflow is green.

## Browser review

The final deployment was checked at 320, 390, 768 and 1280px frame widths. Today, Journey, Grub, Fit, daily check-in, Saved and Settings showed no horizontal page overflow in 28 measurements. `verification.json` contains the individual results.

The actual tool clients were exercised with fictional read-only data: navigation between Today/Journey, restored weekly review, weekly validation and rejected-save feedback, Grub search/save failure, labelled ingredient controls, direct Saved-food landing, daily mood selection and consent cancellation, and Fit request failure. The revised interface preserves the existing API handlers and never falsely confirms a rejected save.

Visual inspection caught and corrected the legacy Today hover overlay, duplicated check-in/settings sidebar, narrow header overflow, conflicting outer dark frames, and heading/field contrast. The approved SHIFT-owned homepage image is retained. No clinical advice or approved recipe/exercise content was rewritten.

## Release boundary

Production `wrangler.jsonc` and the authoritative Pages payload are unchanged. The new member layer is inactive unless `MEMBER_EXPERIENCE_V1_ENABLED=true`; it composes after the existing Programme and workplace dashboard entries. No production promotion was performed.

The browser screens use pinned production templates and the Worker-owned assets that override Pages. Their API façade has fictional values, rejects saves and uses a `connect-src 'none'` CSP. They deliberately omit auth, analytics, service workers and unrelated public widgets. They do not replace authenticated acceptance on the production origin or certify Safari/physical devices. Partner, content, privacy and clinical commissioning gates documented in the workplace/Programme release handoffs still apply.

Review entry: https://shift-core-work-staging.matobrien.workers.dev/staging/member/grub

Responsive checker: https://shift-core-work-staging.matobrien.workers.dev/staging/member/review

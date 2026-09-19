# Activation and measurement — 19 September 2026

Owner-authorised next block after Health Passport v1. Reconciled with deployed main 06d2a952c02263abcd443c91c59ec6fca75cccd1; the NICE/GPhC source changes are retained. The previously prepared branch is continued, not replaced with a competing implementation. No redesign, stock/clinical/payment changes, new analytics vendor, tracking-table migration or deletion of customer records.

## Scope

1. Serve the existing analytics-bootstrap-v1.js from Git. The existing GTM loads only after explicit analytics opt-in, not on member/authentication, health-record/questionnaire or payment routes. Unknown query, encoded path and fragment values suppress collection. Advertising consent remains denied. Do not designate existing page-open or form-attempt events as completed conversions.
2. Use the existing authenticated /v1/hq/journey endpoint for an aggregate account cohort: created, email verified, signed in, then a successful audited Journey/Passport save. Ordered transitions use the same account, not unrelated stage totals. Set-based cohort joins avoid repeated per-person history reads. Exclude known commissioning records; keep zero mature denominators null.
3. Verification-email delivery failure receives an accurate recovery message, not a false claim that a message was sent. Server-side CAPTCHA verification has a ten-second deadline and retains action, hostname and token checks. Email verification, password policy, login protections and clinical boundaries are unchanged.

## Measurement limitations

Week one means days 1–7 after registration, with eight complete days required. Week four means days 21–27 with 28 complete days required. Returns are observed authenticated logins or successful Journey/Passport writes, not all passive visits. First save is not a health outcome. Missing historical audit entries and erased accounts can reduce observed counts. Unknown staff/test activity can remain; no claim of perfect internal-traffic exclusion.

Private activity is first-party HQ reporting, not GA4. Historical and post-change Google traffic coverage are not directly comparable. Campaign collection accepts only a bounded source/medium list; this does not provide joined acquisition-to-activation attribution. Anonymous Start Here completion remains unavailable from the cohort records. No health answers, measurements, authentication tokens or free text are added to marketing analytics by this change.

## Proof boundaries

Ordinary registration/email verification/login/reset tests use actual application handlers with fictional SQLite accounts, a recording EMAIL adapter, no commissioning identity and AUTO_VERIFY_EMAIL=false. Siteverify fixtures prove response handling but not completion of a real human CAPTCHA or inbox delivery. Do not label the complete ordinary production signup journey verified from these tests.

Browser privacy checks use real Chromium with external requests intercepted. The additional consent-stack test executes the captured current consent/config/event scripts with the candidate bootstrap and clicks the actual consent buttons in fixture HTML. This is stronger than a bootstrap-only test, but not a complete live GTM configuration audit or full-site browser walkthrough.

Source workflow is contents:read with persisted credentials disabled. No temporary encoded patches or automatic repository writes remain. Full PR checks and controlled production/preservation gates must pass. Production acceptance must match the deployed bootstrap bytes and record the owner-only aggregate, without exposing underlying account/audit rows.

## Separate approved work

Five existing articles need substantive editorial strengthening and source review. The small real-user pilot needs real participants and a clear usability protocol. Neither is complete merely because this release passes. NICE/GPhC access and reuse dependencies remain in issue #743; this work does not weaken their restrictions.

Primary implementation references:
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

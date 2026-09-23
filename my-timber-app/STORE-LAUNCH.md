# My Timber — store launch runbook

Status: accelerated release track, 23 September 2026.

## Locked product identity

- App name: **My Timber**
- Legal publisher: **SHIFT SOME TIMBER LTD**
- Planned Apple bundle / Google package ID: `uk.co.shiftsometimber.mytimber`
- Product specification: the existing My Timber PWA.
- Launch destination: `/member/dashboard#today`.
- Existing member accounts and backend remain authoritative.
- PWA remains supported alongside store apps.
- No D-U-N-S number, signing key, APNs key, Google service-account key, password,
  reset token, member health data or payment credential may be committed here.

## Owner actions — critical path

1. Enrol **SHIFT SOME TIMBER LTD** in Apple Developer as an **Organisation** using
   the existing D-U-N-S number and company-domain work email.
2. Create/verify the Google Play Console account as an **Organisation** using the
   same legal entity and D-U-N-S record.
3. Keep the owner as Account Holder / primary owner. Do not share passwords or
   2FA codes. Add named developer access later rather than sharing the owner login.
4. After verification, record only non-secret identifiers needed by the build:
   Apple Team ID and the confirmed app/package identifier. Signing/private keys
   belong in the platform's protected credential store, never this repository.

## Engineering sequence after account verification

1. Register `uk.co.shiftsometimber.mytimber` on both platforms before first store upload.
2. Produce owner-signed internal builds: TestFlight and Google internal testing.
3. Implement native check-in reminders using APNs/FCM while preserving the PWA
   reminder contract: explicit opt-in, chosen UK hour, no sensitive notification
   text, suppress after saved check-in, respect session revocation, dedupe, switch off.
4. Verify on physical iPhone and Android: fresh login + Turnstile, cookie/session
   persistence, logout, forgotten/reset password, Today, check-in, Next Shift,
   did-it-help, Grub, Fit, progress, profile/member details, orders, consents,
   uploads/camera, back/external links, offline/failure recovery and payment
   duplicate protection. Use a specifically authorised test account only.
5. Verify account-deletion initiation from the app and create the public external
   deletion-request URL required by Google if one is not already live.
6. Complete privacy/data inventory and Google Data safety + Health apps declaration.
   Complete Apple App Privacy and health/medical review information accurately.
7. Capture screenshots from the exact signed candidate. Do not use mock screens.
8. Create reviewer credentials with no real member health data and write concise
   review notes explaining SHIFT's informational/member-support scope and clinical
   hand-off boundaries.
9. Run the full acceptance matrix against the exact candidate. Fix regressions in
   the same candidate, then submit one release to each store.
10. Store approval is an external decision; do not advertise “available on” a
    store until the public listing is actually live.

## Current evidence

- Native Android debug build: PASS on commit `6d510c64f99826ae540abaf03df0d81f1344933d`.
- Native iOS simulator build: PASS on the same commit.
- Integration gate: PASS.
- Whole-estate route sweep initially hit one unrelated transient newsroom fetch
  failure after 788 URLs; rerun attempt 2: PASS on 23 September 2026.
- Physical-device authenticated parity: OPEN.
- Native APNs/FCM receipt/tap/off: OPEN.
- Apple/Google organisation verification and signing: OPEN.

## Store-policy checkpoints

Checked 23 September 2026 against official platform documentation:

- Apple organisation enrollment requires a legal entity, D-U-N-S number, binding
  authority, work-domain email and public functional website.
- Google says health apps should use an Organisation developer account and requires
  a D-U-N-S number for Organisation accounts.
- Google health apps require the Health apps declaration and a public privacy policy.
- Apps with accounts need a discoverable deletion route; Google additionally
  requires an external web resource for deletion requests.
- Do not treat this runbook as store approval or legal/regulatory sign-off.

# My Timber v1 — deploy switch checklist

Target: make store-account approval the trigger for final signing/testing, not the
start of app development.

## Prepared before Apple/Google approval

- [x] Product identity locked: My Timber / SHIFT SOME TIMBER LTD.
- [x] Final bundle/package ID in Release source: uk.co.shiftsometimber.mytimber.
- [x] Version 1.0.0 / build 1.
- [x] Exact approved S mark and official SHIFT wordmark locked.
- [x] Native startup animation implemented on iOS and Android.
- [x] Existing My Timber Today is the launch destination.
- [x] Existing member backend/account remains authoritative.
- [x] PWA/site not replaced by the native app.
- [x] PWA-only install/reminder controls hidden in native v1.
- [x] Native v1 does not claim notifications.
- [x] Store listing/reviewer copy drafted.
- [x] Physical acceptance matrix written.
- [x] Public privacy + deletion URLs prepared separately in PR #803.
- [x] CI compiles debug candidates.
- [ ] CI compiles final-ID unsigned Android AAB and iOS Release candidate on exact current commit.

## Switches that require verified store accounts

### Apple
- [ ] Organisation membership ACTIVE.
- [ ] Register App ID uk.co.shiftsometimber.mytimber.
- [ ] Record non-secret Team ID.
- [ ] Configure protected distribution/App Store Connect credentials.
- [ ] Produce signed iPhone archive and upload to TestFlight.

### Google
- [ ] Organisation verification ACTIVE.
- [ ] Create My Timber app with package uk.co.shiftsometimber.mytimber.
- [ ] Enable Play App Signing and protected upload credential.
- [ ] Produce signed AAB and upload to Internal testing.

## Exact signed-candidate gates before submission

- [ ] Run every row in PHYSICAL-ACCEPTANCE.md on iPhone and Android.
- [ ] Fix any regression in the same candidate and repeat affected matrix.
- [ ] Confirm public privacy and deletion URLs return 200.
- [ ] Confirm exact commerce routes and complete store commerce answers.
- [ ] Complete Apple App Privacy / health review fields.
- [ ] Complete Google Data safety / Health apps declaration.
- [ ] Capture genuine store screenshots from the accepted signed candidate.
- [ ] Put disposable reviewer credentials in store secure fields.
- [ ] Final evidence/checksums retained.

## Submission

Only after the signed matrix is green:
- submit one iOS v1.0.0 candidate to Apple review;
- submit one Android v1.0.0 candidate to Google review.

Store review/approval is external and cannot be pre-cleared by CI.

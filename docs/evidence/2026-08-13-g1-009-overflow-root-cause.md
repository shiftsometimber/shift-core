# G1-009 authenticated rendered production RC

Date: 2026-08-13

Status: **PASS.** The production member estate now passes the unchanged authenticated Chromium/Firefox/WebKit desktop + 390px rendered acceptance after the RC3 source repair was deployed.

## Earlier retained failure

Production evidence run `31680649245` had retained the common authenticated surplus: 1440px viewport -> 1460px scroll width (20px overflow), and 390px viewport -> 478px scroll width (88px overflow). Subsequent production diagnosis showed the final causes were local member-layout geometry: the decorative `.mp-hero::after` escaping the hero on desktop and the deliberately horizontally-scrollable `.member-side` / `.mp-tabs` strips allowing nowrap descendants to inflate document-root width on mobile. The authoritative repair used local containment only; no global overflow mask or weakened acceptance was introduced.

PR #154 was merged to `main` as `34f22153a7b6c43584363d8e35ccc6f2bbfb6262`, preserving the final member geometry repair and live extensionless member routing in version-controlled source.

## Unchanged post-deployment proof

GitHub Actions run `31689802921`, authenticated-rendered job `94426973527`, fingerprinted the actual live deployment before running the matrix. `/member/dashboard` and the member P0 stylesheet returned 200 and the deployed source contained the expected `mp-hero`, `member-side`, `mp-tabs` and member-shell repair markers.

All six production browser/device cases then demonstrated the authentication prerequisite and rendered member journey: registration 201, sign-in 200, session cookie present, authenticated member-state 200, and authenticated landing remained in the member product.

The journey exercised dashboard/My Shift, Today, Grub, Fit, Progress and Shift AI. Every tested route completed with document width equal to viewport width and zero horizontal overflow:

- Chromium desktop: 1440 -> 1440, overflow 0
- Chromium mobile: 390 -> 390, overflow 0
- Firefox desktop: 1440 -> 1440, overflow 0
- Firefox mobile: 390 -> 390, overflow 0
- WebKit desktop: 1440 -> 1440, overflow 0
- WebKit mobile: 390 -> 390, overflow 0

The earlier route regression is absent and the live extensionless member routes remain intact.

## Scope discipline

This evidence closes **G1-009 only**. It does not promote G1-001, G1-003, G1-004, G1-008 or G1-012 by association.

A separate direct-overflow diagnostic rerun received `commissioning_identity_rejected` because that diagnostic workflow path is not currently in the production commissioning-identity allowlist. That is an internal diagnostic authorization gap, not a member-authentication failure, and it does not supersede the successful unchanged rendered production acceptance above.

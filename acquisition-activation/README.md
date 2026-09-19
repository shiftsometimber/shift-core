# Acquisition to activation — bounded source attribution

Purpose: join the source/medium that brought a consenting visitor to SHIFT to that same account's successful registration, verification, login and first audited Journey/Passport save. This is first-party operational reporting, not a Google identity export or medical-outcome measurement.

## Model

First recognised, explicitly consented touch within 30 days. Retain only a fixed source/medium pair and timestamps. No URLs, campaign text, search terms, click IDs, email, identity fields, health answers or notes in the attribution payload. Unknown labels and no consent remain unattributed. A missing referrer is labelled direct_or_unknown, never proven direct acquisition. Browser-supplied tags are observational and can be spoofed; they are not financial billing evidence.

Fresh source-specific consent is required. Old analytics consent is not upgraded. The existing Cookie choices interface adds SHIFT measurement only; Google remains separately off for that choice. Necessary only clears browser attribution and, when signed in, removes the account-linked source. Signed-out users must sign in to remove already-saved account attribution. Browser storage is limited to 30 days; the linked account field expires after 90 days and is removed by daily maintenance. There is no retrospective source backfill and no cross-device matching before registration. Email verification after registration can occur on another device because the source is already attached to the account.

The bounded acquisition object is part of the existing auth.register audit metadata written in the same transaction as successful authentication-record creation. Failed/duplicate registrations cannot attach it to a different account. Existing session/token/CAPTCHA/email/password policy is not weakened. No new table, Worker, tracking vendor or profile field is introduced.

## Reading and deleting

GET/DELETE /v1/acquisition-attribution is restricted to the signed-in account. Account deletion requests and optional health-data erasure also remove this optional attribution. Existing data export includes the coarse source, not full audit rows or IP data. Expiry only removes the optional acquisition JSON property; the security audit action, timestamps and other metadata are preserved.

The existing authenticated /v1/hq/journey report adds activation.acquisition.sources. Its grouped registered/verified/signedIn/activated totals reconcile with the same cohort and synthetic-account exclusions as the top-line activation report. No individual identities or health values are returned. This is API/report integration, not a new dashboard design. Expired/withdrawn sources move to unattributed, so historical attribution can change. Acquisition-to-revenue, ad-spend ROI, all anonymous starts and full multi-touch modelling are out of scope.

## Tests and limits

Dedicated tests exercise real registration, email-token verification, password login, source persistence, optional-health-consent save guards and actual Journey writes in SQLite. Browser tests use the captured real public registration form/controller and current API adapter with the same handlers. Email transport is recorded and CAPTCHA is outside this harness; do not claim a real inbox or human-CAPTCHA signup from it. All third-party browser requests are intercepted. Existing complete-site/member/Passport release gates remain unchanged.

Production proof checks actual delivered bootstrap, consent and API adapter bytes/guards and the aggregate report from the real database. Existing accounts remain unattributed unless their registration already contains valid consented source evidence. No invented backfill or fabricated growth result is allowed.

References used for the consent design: ICO cookies-and-similar-technologies guidance; Google Analytics prohibitions on sensitive personal information. These are design constraints, not a claim of independent legal certification.

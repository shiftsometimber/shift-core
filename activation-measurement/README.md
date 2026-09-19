# Activation and measurement — 19 September 2026

Owner-authorised next block after Health Passport v1. Production baseline at preparation: c478c969ae74a67906b0d3beac2d22a079a3ce71. No redesign, medicine availability changes, new analytics vendor, member-data migration or customer-record deletion.

## Exact scope

1. Serve the existing analytics-bootstrap-v1.js from this repository. Load the existing GTM only after an explicit analytics opt-in, never on member/authentication, health-record, payment routes or unrecognised query/hash values. Keep Google advertising consent denied. Existing event definitions are deliberately unchanged because duplicate transmission depends on the live GTM configuration, not simply the number of local event objects.
2. Use the existing protected /v1/hq/journey endpoint for a source-of-truth activation cohort: account created, email verified, signed in and a first successful Journey/Passport save. Return rates use fully observed day windows. Exclude known commissioning fixtures. Do not turn missing data into zero, raw events into customers, or an aggregate into a clinical efficacy claim. No new tracking table or identifiers sent to a marketing platform.
3. Explain verification-email delivery failure accurately and place a ten-second deadline on server-side CAPTCHA verification. Do not disable CAPTCHA, remove email verification or change password/security policy.

## Measurement tradeoffs

This deliberately changes collection coverage. Private/member activity belongs in controlled first-party reporting, not GA4. Historical GA4 and post-change traffic are not directly comparable. Only recognised utm_source/utm_medium values are allowed at bootstrap; unknown parameters, campaign values and fragments suppress collection rather than risk sending identifiers. A future campaign taxonomy requires an explicit reviewed allowlist; do not silently permit arbitrary campaign text.

Known synthetic accounts are excluded using the actual commissioning audit actions and address families. Unknown staff activity can remain and must be labelled; no claim is made that all internal traffic is identifiable. Existing pairwise event transitions now require ordered events for the same account and source=server; they are not a cumulative registration funnel. Historical registration_started is only emitted on successful account creation, so it cannot measure abandonment.

Week one is days 1–7 after signup and requires eight complete days; week four is days 21–27 and requires 28 complete days. Return evidence is authenticated logins or successful Journey/Passport writes, not every passive visit. All output is owner/HQ-only aggregate data. Zero mature members means a null rate, not 0% retention.

## Evidence boundaries

Tests exercise actual ordinary registration, email-token verification, login, reset and session modules against real SQLite, with no commissioning identity and AUTO_VERIFY_EMAIL=false. EMAIL transport is recorded in memory and Siteverify responses are controlled fixtures. This proves module behaviour, not actual inbox placement or a production human CAPTCHA challenge. Do not call the complete ordinary production signup gate green on these tests alone.

The existing hosted full-dashboard/Passport proof remains valid; this block does not claim to retest physical Safari/iPhone, clinical fulfilment or payment. Public/member HTML is not changed by the analytics asset or reporting module.

## Acceptance

Run activation-measurement tests plus the existing auth, member, Passport and public preservation regressions. Compile the real Worker with the locked toolchain. Verify browser network attempts at both consent states and private routes. Before production, retain the exact source revision, confirm main has not advanced, pass existing repository gates, and keep rollback explicit. Live acceptance must prove exact bootstrap bytes and the existing auth/account protections without creating unapproved production accounts or exposing health data.

Sources supporting implementation boundaries:
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- https://support.google.com/analytics/answer/6366371?hl=en
- https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events

The five-page editorial strengthening and real-user pilot are separate work items, not silently claimed complete by this release.

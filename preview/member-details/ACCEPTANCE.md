# Member details — bounded preview acceptance

Owner: Matt. PR #790 only. Production/GOLD is unchanged until a separately approved release.

## Scope
Member Details, manual full address saving, and GP practice suggestions. Keep the current My Timber shell, stock/prices, all orders, clinical gates, Grub/Fit/Today and old preference/consent contracts intact. Sign-in email remains identity-owned/read-only. Existing order addresses are immutable here.

## Repairs to the initial candidate
The initial PR imported the new form but did not mount it in Settings. Its two-request save could partially apply a profile and replace stale whole preferences. The new code mounts the form and uses one authenticated, optimistic, transactional account-details save; street address/GP are kept out of AI/member preference blobs. The old generic 161-case member suite did not test this new feature.

## Required proof
- Visible Member details destination and real form on Settings and .html alias.
- Correct account identity; no client account selector; hostile origin and anonymous/revoked sessions rejected.
- Name/phone/DOB/address save, actual readback, refresh and logout/fresh-login persistence.
- Field validation, true optional-field clearing, failed-save retry, response-loss retry and stale-tab conflicts.
- Atomic user/contact save; no partial updates on SQL failure; no duplicate audit on concurrent same-operation retry.
- No changes to order addresses, member preferences, consent, prices, stock or existing auth algorithms.
- New account-contact record appears in full account export and cascades with actual account deletion; optional-health erasure does not erase necessary account contact details. Operator must include this table in their retention inventory.
- Chromium/WebKit desktop and phone browser screenshots, keyboard order, no horizontal overflow; preserve physical-device limitations.
- Fresh owner preview entry button works on the actual deployed preview.
- Exact source, source-scope guard, tests, build and hosted evidence retained, including failures.

## Explicit limits
Full postcode-to-street-address lookup requires an actual licensed provider key. No such key is added or claimed available. The adapter is covered with synthetic contract tests; real postcode lookup and site-wide rollout are NOT signed off. The UI says so and manual address editing works independently.
GP search uses the NHS ODS public directory (England/Wales), with active GP role filters and manual fallback. Real provider receipt is recorded separately from mocks; a directory outage is not reported as a working lookup. Choosing a directory practice does not verify the member's registration.
No secure sign-in email change flow, delivery checkout-prefill rewrite, clinical handoff, My Orders rebuild or production data migration is included in this preview. Existing sign-offs stay closed.

## Production gate
A release needs reviewed additive member_account_details schema, private data-retention review, owner's preview approval, exact-head guards, backup sufficiency and data-preserving rollback. Do not merge this PR merely because a preview passes. The current source-identity/Time Travel reference pack is not a standalone source-plus-database archive or an indefinite data backup.

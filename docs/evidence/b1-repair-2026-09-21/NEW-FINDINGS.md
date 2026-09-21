# New findings during B1

## B1-N01 — reset page coerces input to numbers (release-blocking, confirmed)

The immutable authoritative Pages reset form uses bitwise `|` in five string fallbacks: token, password, confirmation and two error messages. Preview DOM script inspection on 21 September showed the received token/password could become 0. An isolated API pass cannot prove this journey. High confidence: exact source and rendered form. This is newly discovered within WR02, not a new feature.

Smallest correction: restore those five `||` operators in the existing Pages document through the authoritative Worker response layer. Use the same repair function in the preview. Preserve layout/copy and all other pages. Acceptance adds rendered valid/invalid/expired/reused link, entered-password retention, failed submission/retry, actual email token and sign-in confirmation. Keep this item open until those gates pass.

## B1-N02 — preview strips its required session runtime (confirmed, preview only)

The preview public-login filter removes `/assets/member-experience/session.mjs` even though its inline auth controller calls `SST_MEMBER_SESSION.check`. Observed result: permanent “Checking your sign-in…” and a TypeError. This blocks the requested preview recovery entry. Production uses the retained runtime; do not describe it as a production defect.

Smallest correction: retain that exact dependency in the existing preview filter. Verify signed-out login appears, Forgot password opens, failure/retry works, and the actual owner-authorised test email is requested through that form. No production authentication bypass.

## Verification harness corrections (not product discoveries)

- First preparation run stopped before preview deployment because a Node Fetch `ok` property was called as a method; corrected.
- Existing member-state source gate required the stale read/merge expression responsible for WR01. Replace that brittle assertion with executable concurrency, rollback, ownership and account-isolation checks; retain its other security/source assertions.

Other register items remain queued. No stock, price, service or partner decision is reopened.

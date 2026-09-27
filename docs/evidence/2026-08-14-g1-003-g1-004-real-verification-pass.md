# G1-003 / G1-004 — genuine email verification lifecycle PASS

Fresh production run `31793828102`, rerun job `94753848697`, executed the real lifecycle against production.

- registration: HTTP 201, verification required, real delivery sent
- pre-verification login: HTTP 403 / `email_verification_required`
- genuine verification email: connected Gmail, 11:26:49 UTC
- post-verification login: HTTP 200
- logout: HTTP 200
- final fresh login: HTTP 200
- post-verification Welcome email: connected Gmail, 11:27:49 UTC
- retained artifact: `9217492229`
- artifact SHA256: `82bce3845465ff96a651fd3f15dfc5427986f324f4f1e29f4f6aebc76603f2c5`

This is demonstrated inbox/token/account-state evidence, not source or merge inference. G1-003 and G1-004 are therefore PASS. Password recovery remains independently AMBER.

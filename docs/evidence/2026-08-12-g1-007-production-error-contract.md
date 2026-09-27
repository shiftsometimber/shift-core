# G1-007 production failure-contract proof — 2026-08-12

Evidence source: merged PR #82, `main` commit `88b00361039b5a59046e3c4c836c1ce6a2c065b5`, Shift Whole-Estate Route Sweep run `31639268727`, job `94257358057`.

## Defect found before production proof

The first live commissioning attempt exposed a real response-envelope defect: password-reset responses intercepted by `worker-entry-v6.js` did not carry `X-Shift-Request-Id`, even though fallback Worker failures were correlated. The commissioning gate was not weakened. The product envelope was fixed to add request correlation, `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` to intercepted member responses.

Because a PR branch is not necessarily the deployed production Worker, the release workflow was split correctly: pull requests prove the source response-envelope contract; a push to `main` waits for deployment propagation and then runs the unchanged live production contract.

## Deployed production outcome

The post-merge production run completed GREEN and proved all of the following against the deployed API:

- unknown route -> 404 `not_found`, correlated JSON failure;
- unauthenticated member surface -> 401 `authentication_required`;
- unauthenticated HQ surface -> 401 `hq_unauthorized`;
- malformed registration JSON -> 400 `invalid_registration`;
- invalid registration -> controlled 400 with member-facing guidance;
- invalid login -> 401 `invalid_credentials` without account enumeration;
- unknown-account password-reset request -> generic success without enumeration;
- unsupported method -> controlled 404 `not_found`.

The gate additionally rejects stack traces, SQL/SQLite diagnostics, generic internal-server leakage and unexpectedly verbose error payloads. Every applicable tested failure required `X-Shift-Request-Id`.

Final production output: `G1-007 PRODUCTION ERROR CONTRACT PASS`.

The same release run also re-proved the exhaustive whole-estate route sweep: 418 same-origin URLs / 370 HTML pages / zero critical failures / discovery exhausted.

## Commissioning decision

This closes the deployed API failure-contract and diagnostic-leakage portion of G1-007. The original row remains AMBER until member-facing rendered failure states are accepted across the representative release-candidate surfaces; do not promote it merely from API-contract evidence.

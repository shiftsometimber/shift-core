# My Timber sign-in repair — 12 September 2026

Reported: live dashboard stuck on Signing in, both buttons disabled.

Source finding: the Turnstile configuration, script and challenge were awaited before the API timeout, with no independent timeout. The challenge was placed at the end of the document. This creates an indefinite wait outside the form.

Fix: bounded configuration/body (8s), script (12s) and challenge (45s); in-form visible challenge; retry after all failure paths; preserve required security enforcement. Both public login entry pages load a uniquely named Pages asset to avoid the Worker's older static asset override. Dashboard also restores controls in finally and keeps analytics failure separate from sign-in success.

Release baseline: exact current production fingerprint bea98002e376482eb5111d6d1d9ad5e1708c3e893c777749f740b6ea172b9a59. Only two login pages, one new security asset and integrity manifests change. Workplace preview remains preserved in parent commit 2002cc69fc4f399171a60ca039b59a56fd5f6bbd. No Worker or database deployment.

Validation before preview: 11 authentication/security tests pass, including stalled configuration body, stalled script, silent/expired/unsupported challenges, retry, successful token attachment and fail-closed backend rules. 871-file deployment fingerprint and all 457-page SEO integrity checks pass. Fresh authenticated sign-in is not yet verified; an existing browser session is not evidence of fresh login success.

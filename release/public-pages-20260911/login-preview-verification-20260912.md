# Login preview verification — 12 September 2026

Exact preview: https://331f45f9.projectshift.pages.dev
Fingerprint: 0111ddc13262846355df76dd5f2b3067b02dca9d92716105bf4bf24f9394e665
Workflow: 34695341780 (success).

Browser checks: both /member/dashboard and /member-login render the expected login forms and load /assets/member-login-security-20260912.js. Login controls enabled; no horizontal overflow on the inspected viewport. Dashboard site script error log clear (only unrelated browser extension metadata error). No credentials entered. Existing production session is not fresh-login proof.

Client/backend verification: 11 passing tests cover bounded configuration including body, script and challenge waits; callback failure and retry; successful token attachment; unrelated request exclusion; required security remains enforced. Entire source fingerprint and SEO integrity checks pass.

Release is a narrow repair for the user's reported live sign-in regression. No production Worker/database or member/employer feature deployment. Fresh live sign-in remains a post-release verification requirement; this report does not claim it passed.

# G1-008 — production PASS

Date: 2026-08-13
Status: **PASS — production loading / empty / settled-success state system proven at desktop + 390px.**

## Deployment proof

PR #176 merged the bounded exact-path static deployment repair as `69f446a36ce1eb30af5183e9b16f9f58f121a40b`. The Worker owns only the existing public member adapter URL and serves the Git-authoritative `frontend/member/api-adapter-v33d.js` through the Workers Static Assets binding. Ordinary member API requests retain the finite 15-second default; Fit generation alone receives the commissioned finite 60-second budget.

A fresh live-source recapture after deployment downloaded **7,278 bytes** from production `/api-adapter-v33d.js` and proved the live `generateFit` call uses `timeout:GENERATION_TIMEOUT`. The prior stale 7,217-byte / 15-second-only production asset is no longer served.

## Strict rendered production acceptance

Workflow run: `31744305693`
Rendered-state-system job: `94594994187`
Evidence artifact: `gate1-state-system-production-evidence`
Artifact ID: `9198446706`
Artifact SHA-256: `c50deb642456f43555c52925709c0b389865f62ca0fb916e3eaab2391a5795e5`
Proof identifier: `G1_008_RENDERED_STATE_SYSTEM_PRODUCTION_V12_RESILIENT_DASHBOARD_RETURN`
Failures: **0**

The final harness change did not weaken any product outcome. It made return navigation to the already-authenticated dashboard wait for navigation commit and then require the rendered authenticated shell, instead of waiting for every subresource to fire `domcontentloaded`. All state assertions remained unchanged.

### Desktop

- fixture registration 201;
- authenticated login 200;
- authenticated member-state 200;
- `sst_session` retained;
- fresh Grub empty state visible, root overflow 0;
- fresh Fit empty state visible, root overflow 0;
- fresh Progress empty state visible (`Your story starts here` / `Add your first check-in`), root overflow 0;
- fresh My Plans empty state visible, root overflow 0;
- Grub generation: explicit in-flight loading visible, action locked, HTTP 200, 28 returned items, returned `Bacon & egg breakfast butty` visibly rendered, loading settled, completion copy visible, root overflow 0;
- Fit generation: explicit in-flight loading visible, action locked, HTTP 200, 15 returned items, returned `March on the spot` visibly rendered, loading settled, completion copy visible, root overflow 0.

### Mobile 390px

- fixture registration 201;
- authenticated login 200;
- authenticated member-state 200;
- `sst_session` retained;
- all four fresh-member empty states visible with root overflow 0;
- Grub generation: loading visible, action locked, HTTP 200, returned recipe visibly rendered, settled completion visible, root overflow 0;
- Fit generation: loading visible, action locked, HTTP 200, 15 returned items, `March on the spot` visibly rendered, settled completion visible, root overflow 0.

The focused Fit network diagnostic in the same run also passed: the real browser request remained alive, returned HTTP 200 with three sessions and no quality issues, and the member UI displayed `Building your Fit plan complete.`

## Commissioning judgement

G1-008 has earned PASS. This closes only the original loading/empty/success consistency row. It does **not** promote premium visual-system, accessibility/performance, Progress-unit, Grub editorial, Fit premium-art or human email-token rows by association.

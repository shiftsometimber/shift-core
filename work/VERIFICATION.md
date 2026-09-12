# Verification — 12 September 2026

Source: isolated `feature/shift-for-work-20260912`, starting from the exact Programme candidate tree `cd01566169fdb1c72b721735d819f8bee880945e`. The corresponding remote Programme commit is `5bc565f482856b63e61667302555a750d7de1afa`.

Only `worker-entry-v6.js` and the small exported HQ-session adapter in `worker.js` alter existing Worker files. New code is under `work/`. Production Wrangler configuration, shared sign-in, existing member health stores, public navigation, homepage ticker and the approved proposition/PDF remain unchanged.

Results: **26 workplace runtime/client tests passed**, **2 complete-Worker tests passed**, and **84 existing Programme tests passed**. The complete Worker bundle dry-run passed.

The test harness uses fictional accounts and separate local D1 databases. It exercises real Cloudflare workerd/SQLite storage and the existing member authentication; the complete Worker test separately verifies the real HQ/member cookie boundary. No live D1 pass is claimed.

Commands:

```sh
node --test work/tests/client.test.mjs
node --test work/tests/runtime.test.mjs
node node_modules/wrangler/bin/wrangler.js deploy --dry-run --outdir work/build
node --test work/tests/full-worker.test.mjs
node --test programme/tests/*.test.mjs
```

Runtime tests in this environment use the installed workerd 2026-09-11 binary via `MINIFLARE_WORKERD_PATH` because the original Miniflare dependency's binary predates the existing compatibility date. The application compatibility date remains 2026-08-09. This override is a local verification detail, not a production configuration change.

Coverage includes concurrent seat contention, pre-start enrolment, expiry, hashed/revoked codes, rate limiting, account isolation, unknown health payload rejection, HQ-only membership, reporter grant/revocation, individual entitlement revocation, withdrawal/export, CSRF, immutable report release, category/complement suppression, and permanently disabled test ordering. Deferred-response tests check stale identity, page exit, hidden tabs and session expiry. Dashboard tests preserve original HTML after removing the single new card.

The fictional Pages preview uses the actual workplace screen/client with an explicit read-only fixture transport. It contains no accounts, raw invitation codes or real employer data. All mutations return a preview refusal and no request reaches the real API. It is visual review evidence only; local runtime tests provide separate backend evidence.

Open acceptance gates: an authenticated hosted end-to-end flow with isolated remote D1; all supported mobile/browser/keyboard checks including Safari; approved privacy and retention procedures; reviewed delivery content/support; partner and clinical commissioning; production release approval. Do not infer that these passed from unit/runtime tests or fictional screenshots.

## Hosted visual verification

Final fictional preview: https://95e283ac.projectshift.pages.dev/shift-work-preview
Pages commit: `2002cc69fc4f399171a60ca039b59a56fd5f6bbd`. Fingerprint: `6d31ed83d4915f958c25bbd002393661ba03b31f7968a60c91a70b331f04aa52`. Deployment workflow: https://github.com/shiftsometimber/shift-core/actions/runs/34680117338 (success).

At the available 1363 × 936 browser viewport, the employee, employer and HQ screens rendered. No horizontal overflow was observed. The code field and voluntary joining checkbox are present; the fictional transport rejects mutations rather than recording a false success. The employer report demonstrates rounded group figures and an entirely suppressed small cohort. HQ shows private, unconfirmed pricing and the staff-only membership control.

The browser review caught shared-CSS interference with navigation/table layout and inactive footer controls. Scoped workplace styles now resolve the layout conflict. Larger text changes the main text to 20px with pressed state; reduced motion also updates its pressed state. Menu opening reveals its backdrop and focuses Close; Escape closes it and returns focus to Menu. The HQ header/main/footer order is intact. This is not full keyboard, mobile or Safari acceptance.

SEO integrity passed for 461 pages and the exact release fingerprint passed. The source comparison preserves all 871 original production files plus the four approved employer proposition files; only generated integrity records and five new fictional preview files differ. The approved PDF remains byte-identical. The actual production deployment remains `02d4d911`, checked by the release workflow.

The repository also triggers a pre-existing `.github/workflows/act2b-one-shot.yml` validation failure on these branch pushes; it is separate from the successful Pages deployment. This record does not call the entire repository CI green.

## Account journey gate — 12 September 2026

`work/tests/journey.test.mjs` adds one passing integration journey through the actual bundled Worker: employee and employer password login, separate HQ password login, code issuance/claim, saved weekly review, employer isolation, blocked test ordering, a fixed closing report, reporter-access revocation, employee withdrawal, logout and rejection of the old session. The free account remains. Passwords are randomly generated for each run and never saved in the repository.

The closed reporting period is an explicit local fixture transition in WORK_DB, not a real twelve-week pilot and not a request-controlled clock override. The HQ test account has MFA disabled; no production MFA setting changes or MFA acceptance claim are involved. This verifies the HTTP account journey in local workerd/D1, not a hosted browser or remote D1 flow. The existing legacy schema readiness probe emits its known SQLite parameter-limit fallback during HQ login; the unchanged fallback completes and the journey passes.

The feature branch now has `.github/workflows/shift-work-checks.yml`: read-only repository permissions, isolated runtime tests, a bundle dry-run and existing Programme tests. It has no deployment credentials, remote database mutation or publishing step. Its runtime binary is pinned to the exact verified `1.20260911.1` version in a separate tools directory. Local test totals are now 29 workplace checks plus 84 existing Programme checks. Hosted CI status is recorded separately after the run.

Hosted CI passed for implementation commit `55b5f856aea1234ac1f38abc5fe807cdb0a8e0a1`: https://github.com/shiftsometimber/shift-core/actions/runs/34683221284. The clean GitHub runner completed dependency installation, the exact runtime installation, bundle dry-run, all workplace tests including the password-login journey, and existing Programme tests. This is hosted execution of isolated local-runtime tests; no Cloudflare remote D1 or production deployment was used.

## Isolated hosted staging candidate

The staging entry/workflow is now prepared under `work/staging/` and `.github/workflows/shift-work-staging.yml`. It requires the existing preview-only credential, uses two separately named databases, rejects production hosts/IDs, restricts routes and expires after 48 hours. Pinned Pages styles/logo are reused; production source and deployment configuration are unchanged. Generated SQL, passwords and code/config files are ignored and excluded from uploaded evidence.

Two local staging integration checks pass against the separately bundled staging Worker: production-host/unrelated-route rejection, fictional-only registration, actual member authentication, rejection of HQ access, blocked clinical ordering and logout/session revocation. These add to the previous 29 workplace checks. The staging bundle dry-run passes. Remote deployment and browser-authentication outcomes must be recorded separately; this preparation is not a pass for either.

Hosted staging is deployed at https://shift-core-work-staging.matobrien.workers.dev with separate real D1 databases. Remote verification passed at 2026-09-12 09:33 UTC in https://github.com/shiftsometimber/shift-core/actions/runs/34686084461, implementation commit `af27c70dd3c63679c240af560d1b94e3c163b73b`. Non-secret evidence is in `work/staging-evidence.json`. Both local staging tests and the isolated GitHub suite also pass; browser credentials have not yet been entered and no browser journey pass is claimed.

The first immediate post-deployment probe returned 404. A bounded anonymous auth-route readiness check was added before any seeded-account login; the subsequent remote run passed. Actual account logins are not blindly retried. The stage sign-in/registration pages render in the supported browser. The browser skill requires a secure credential handoff to finish the interactive account journey. Production remains unchanged.

Browser account creation is BLOCKED by automatic approval review. The advertised secure credential handoff displayed a sign-in description while the visible form creates a fictional account. The reviewer rejected it before any prompt/action; this was not a user rejection. No credential entry or browser account creation occurred. No retry, alternate credential entry, cookie injection or workaround was attempted. Remote API/D1 checks remain passed; browser account-journey acceptance remains open. An existing fictional staging account would permit the normal, correctly labelled sign-in handoff.

## Interactive browser journey — 12 September 2026

The user created a fictional staging account externally. The correctly labelled secure sign-in handoff succeeded; no credential values were entered or inspected through automation. The original registration rejection was not retried.

The browser caught a deployment-only `ReferenceError: __name is not defined`: stringifying the Worker-bundled client included an esbuild helper unavailable to the browser. `work/client.mjs` now exports literal browser source. A regression test executes the actual script served by the bundled staging Worker and asserts that the invitation form renders. Commit `51840c8d018785583a602d319bcd43e3dc252386` passed isolated CI (run `34687185148`) and remote staging/D1 verification (run `34687185152`).

In hosted Chrome, the existing member account successfully claimed the fictional company invitation with its voluntary notice checkbox, received the shared start date (2026-09-12), and marked week one complete. A full page reload preserved both the workplace entitlement and the completed review. At the available desktop viewport, document width and viewport were both 1348px with no horizontal overflow. Testing remained explicitly unavailable. This is the staging member journey, not production sign-in UI, HQ MFA, or mobile/Safari acceptance.

Browser logout completed after a delayed navigation. A fresh request to `/member/work` redirected to `/member/dashboard?returnTo=%2Fmember%2Fwork` and displayed the sign-in form, confirming that private workplace access was closed. The cause of the delay is not diagnosed. The staging helper now adds pending/error states and a regression test for success/failure behaviour; this feedback improvement is separate from the already observed logout success.

Final staging implementation `1141a18f1c1a73b196c1ea8d4c19db456b1e888d` passed isolated CI (`34687345831`; 33 workplace checks plus 84 Programme checks) and remote staging verification (`34687345910`, probe passed at 2026-09-12T10:02:19.964Z). The latest non-secret API and browser evidence is recorded in `work/staging-evidence.json`. Production was not promoted. Remaining release gates include supported mobile/Safari testing, approved privacy/retention and delivery procedures, and production release review; clinical testing remains disabled pending partner commissioning.

## Responsive and release handoff — 12 September 2026

Staging implementation `62f9df4d89b0846a1babc3df9618f074d5b2ffe8` adds a read-only `/staging/layout-check` reviewer. It renders the current workplace client/styles with local fictional responses at selected frame widths; writes are refused and `connect-src 'none'` prohibits network data access from those fixtures. Only these fictional layout documents allow same-origin framing. Authenticated work screens retain `frame-ancestors 'none'`; production routing is unchanged.

Employee, HQ and employer-report screens passed 320, 375, 390, 768 and 1024px frame-width measurements with no horizontal overflow. The browser's vertical scrollbar uses 15px inside each frame; measured content areas are 305, 360, 375, 753 and 1009px. The employer report was visually inspected at 320px and its wrapped rows remained readable. Detailed results are in `responsive-evidence.json`.

At the narrowest width, Menu focused Close, Shift+Tab wrapped to the final link, Tab wrapped back to Close, and Escape closed the menu and restored Menu focus. Submitting an empty HQ form focused the required organisation field. Larger text and reduced motion controls each updated their pressed state. This is responsive Chrome and targeted keyboard evidence, not Safari, a physical phone, a full screen-reader review or complete accessibility certification.

The existing Pages dashboard file was rechecked: its SHA-256 remains `e030aee40a5d72441c7060a540ca8c1702b76ff76ff6bca94b4db53ded8a7d78`, matching the pinned return-function source. A new test passes actual signed-out employee and employer-route redirects through that existing function and confirms both destinations are retained. No shared authentication code was changed.

The isolated suite passed at https://github.com/shiftsometimber/shift-core/actions/runs/34687802288 (35 workplace checks plus 84 Programme checks). Hosted staging and the real remote D1 probe passed at https://github.com/shiftsometimber/shift-core/actions/runs/34687802312, probe timestamp `2026-09-12T10:12:54.376Z`.

`RELEASE-HANDOFF.md` records the exact Worker/Pages relationship, commissioning records, first-cohort procedure and pause/disable/rollback controls. Physical iPhone/Safari and Android acceptance, approved privacy/retention and delivery procedures, and the production release decision remain outstanding. Testing stays hard-disabled. No production deployment or employer communication occurred.

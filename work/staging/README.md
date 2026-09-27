# Isolated hosted workplace verification

This is a separate staging entry and deployment workflow. It does not alter the production Worker entry/configuration or public Pages payload. It imports the current Worker and exposes only workplace and test authentication routes.

- Worker: `shift-core-work-staging`, workers.dev only; no custom domains/routes.
- Auth database: `shift-core-work-staging-auth-20260912`.
- Workplace database: `shift-core-work-staging-data-20260912`.
- Production database IDs are rejected; the two staging bindings must be distinct.
- Environment guard and expiry fail closed, including malformed expiry dates. Deployment expires after 48 hours. Stored test records remain until an explicit cleanup; expiry is not a deletion claim.
- No email, payment, AI, clinical, scheduled-job or production service bindings.
- Shared styling/logo are fetched from the exact reviewed Pages deployment and checked against committed SHA-256 pins.
- Generated passwords, password hashes, invitations, SQL/configuration and local build outputs stay in the ignored `generated/` directory. Only a non-secret probe-result JSON is uploaded as workflow evidence. Do not upload the whole generated directory or log credential values.
- The only deployment credential is the existing `CLOUDFLARE_PREVIEW_API_TOKEN`. Missing credentials stop the job; there is no production-token fallback. It must permit managing the separately named staging Worker and D1 databases in the configured account.

The remote probe uses actual password logins, code claim, saved review readback, employer isolation, a fixed report from a clearly seeded closed-period fixture, reporter revocation and logout. The closed period is fictional; this is not evidence of a twelve-week employer pilot or legal privacy approval.

Browser entry is `/staging/register` or `/staging/sign-in`. Registration permits only fictional `@example.invalid` addresses, a fixed fictional display name, and at most twenty browser-created test accounts. It grants ordinary member access only. The existing registration/password verifier is retained; email auto-verification applies solely in this isolated fixture environment, with no email delivery. Never use a live password.

An authenticated reviewer can load the fictional company invitation into the normal workplace form with the staging helper, read/accept the workplace notice and submit the real claim. This helper supplies no login session and grants no entitlement by itself. Real member/HQ authentication and every work API boundary still apply.

The staging sign-in form is purpose-built for verification; it is not a claim that the existing production sign-in UI has passed. Browser credential entry must use the supported secure handoff. No cookie injection, browser credential scripting or login bypass is provided.

Build commands and checks:

```sh
node work/staging/prepare.mjs
node work/staging/provision.mjs
node node_modules/wrangler/bin/wrangler.js deploy --config work/staging/generated/config.json
node work/staging/probe.mjs
```

Provision/deploy/probe run only in the dedicated workflow with its preview credential. Local staging tests use an independently bundled staging entry and local fictional D1. Their source does not provision remote resources. Production remains uncommissioned.

Browser verification found that serializing a bundled function leaked Wrangler's `__name` helper into the external script. The workplace client now uses literal browser source; the staging test executes the actual served, bundled asset and checks that the invitation form renders.

The staging-only `/staging/layout-check` page shows the current employee, HQ and employer screens at 320, 375, 390, 768 and 1024px frame widths. A visible measurement reports horizontal overflow. These frames use fictional local responses, reject writes and have `connect-src 'none'`; only fictional layout documents can be framed on the same origin. Authenticated workplace documents retain `frame-ancestors 'none'`. This checks responsive CSS in the available browser, not Safari or physical-device behaviour.

The member experience now leads with the current weekly action, then progress and the existing My Timber tools. Full joining information remains above voluntary consent for first-time claims; returning members keep it in an expandable privacy section. The approved homepage photograph is SHA-pinned. Scoped workplace styles prevent the shared public card-hover treatment from obscuring private forms and reports.

## Restored member tools proof (16 September 2026)

The readiness branch uses this same isolated Worker and the same two separately
named databases. It exposes the current member enhancement at `/member/dashboard`
as well as the older connected-preview links. The canonical staging path lets the
actual clients keep their production pathname guards unchanged. The actual
progress/photo and retained-plan routes use the isolated auth database; there is
no production database, R2 bucket, email or payment fallback.

`member-experience/staging/tool-assets.mjs` explicitly lists the current checkout
assets copied into the staging package. Their SHA-256 values are recorded, and the
hosted browser proof checks each served file against those values. The approved
immutable Pages shell remains pinned. Blob images are allowed in this connected
staging document so a selected fictional image can be previewed and resized by
the existing client before it is saved.

The workflow creates four additional fictional accounts solely for
`member-tools-browser-proof.mjs`. In CI, the real test password API creates their
ordinary sessions; it does not use a commissioning bypass. Chromium checks the
actual rendered desktop and 390px interfaces, progress and photo saving, plan
history, read-only saved-plan contents, return after sign-in, account separation,
photo deletion, typography, overflow and preservation of the current Today card.
It never submits an AI image-generation request. It records only non-secret
results, asset hashes and screenshots of those fictional accounts. Passwords,
session cookies, SQL and the full generated directory must never be uploaded.
Browser interactions outside this CI verification still require the supported
secure browser sign-in handoff.

A passing result is evidence of these staging interactions, not production
sign-in, actual Safari, clinical aftercare delivery or pharmaceutical fulfilment.

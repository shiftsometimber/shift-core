# B1 acceptance contract — recorded before application edits

Authorised: member saves (WR01) and password reset (WR02), isolated preview only. Production requires Matt's approval after gates. No item closes solely on source changes or unit tests.

## Authoritative source

Remote main confirmed via GitHub Git API on 21 September 2026: `f6c9e47629383e3ecb560648e58d92b7e7cab8e1`, tree `68618153c045fcc1d4208832b84fb8c8701a0b4a`. Local starting tree is identical (local history head `b6b55d4ba4b3c97c809d4b57a181a14536a36934`). All remote candidate commits must descend from remote main, not the local history approximation.

Pages source: recorded verified production deployment `0da69833-83f7-4c70-9c7a-bceab7de1660`, immutable URL https://0da69833.projectshift.pages.dev, source `c733bf03834d93154a51a0db6ef05dbebb3c7cb3`, 876-file aggregate SHA-256 `1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0`. Evidence: `docs/evidence/audit-repair-2026-09-21/pages-source.json`, verified 09:47 UTC today. Recheck control-plane identity and pinned assets during candidate build. Drift or unavailable current provenance remains an explicit release gate, never silently replaced by another source.

Single preview: https://shift-stabilisation-preview.matobrien.workers.dev. Isolated fictional-account D1 databases only; never production records. Existing preview expiry, noindex and payment/order guards retained. Any corrections remain in this preview and rerun affected gates.

## WR01 — acceptance and regression checks

1. Two simultaneous partial PATCH requests updating different legacy fields both return success and both changes remain in a subsequent independent GET. Repeat for existing and initially absent rows.
2. Omitted/null fields retain existing semantics and never overwrite concurrent changes. Empty payloads preserve data. Malformed/non-object JSON receives a clear client error, with no data write.
3. Deliberate replacement of the same supplied field uses the last database-accepted write. Nested values in that field remain replacement semantics; no speculative merge feature.
4. Dedicated preferences (`grubV2`, and when enabled `myJourney`, `lifeBack`, `fitJourney`, `displayUnits`) remain owned by their dedicated routes. An unrelated save cannot undo them. Omitted preferences preserve ALL current preferences.
5. State and member-activity writes commit together or roll back together. Inject a failure at each write; no success response and no partial save. Retrying the same payload is safe; no duplicate record. Simulate a lost acknowledgement, read back, then retry without reverting unrelated fields.
6. Browser failure feedback retains entered work and permits retry. Reload, logout/login and a second tab read persisted data. Expired/revoked sessions cannot save; two fictional accounts stay isolated.
7. Existing Journey, Grub, Fit, Life Back, Progress, Passport, consent, export and erasure tests remain green. No UI redesign or storage migration.

## WR02 — acceptance and regression checks

1. With one unused valid token and simultaneous different password submissions, exactly one succeeds. Only that password works; the loser reports expired/used. Repeat in real isolated D1.
2. Unused expiry is checked atomically at claim time, including expiry while password hashing is in progress. Invalid, missing, expired and reused links cannot change the password or revoke unrelated sessions.
3. Token consumption, password update and session revocation form one transaction. Failure at any statement rolls everything back. The token remains retryable after rollback. Once successful all existing account sessions are revoked, the old password fails, a fresh login with the new password works, and saved member data survives.
4. Requesting a new link supersedes older links. Generic reset-request responses continue to prevent account enumeration. Missing email binding and provider failures remain recorded, never described as confirmed delivery.
5. Exercise duplicate submissions, dropped response/retry, weak password, invalid input and ordinary login/rate-limit/Turnstile regression tests. No commissioning authentication substitutes for ordinary reset/login acceptance.
6. Send an actual reset email for a fictional preview account to Matt's verified connected mailbox, using an allowlisted preview mail binding. Verify provider result AND inbox receipt; open the actual received link, confirm the preview origin, reset via the rendered form, sign in normally, and prove reuse rejection. Do not extract or fabricate the inbox token from the database. Do not reset Matt's production account. Keep credentials and live tokens out of logs/artifacts.

## Relevant preview matrix and release gate

- Chromium and WebKit at 1440x1000 and 390x844: affected save and reset journeys, visible success/failure/retry, persisted read-back and session handling.
- Affected forms at 360, 768 and 1024 widths: keyboard labels, focus, submission/retry controls, horizontal overflow and status feedback. Existing five-point and audit/discovery browser regression suites retained.
- Run relevant repository member/auth/consent/privacy/ownership/Passport tests and source gates. Record counts, failures and reruns; do not reuse earlier-release passes as current evidence.
- Record actual preview configuration differences: isolated databases, fictional fixture creation, allowed mailbox, preview origin, absent production dependencies and any untested production-only controls. A preview pass does not prove an unavailable dependency.
- No changes to OOS wording, theoretical stock testing, prices, intended services, home-test-only decisions, approved navigation/palette/artwork, clinical/partner boundaries, consent or deferred expansion. Baseline hashes and complete candidate diff must demonstrate preservation.
- Return commit/tree/build/deployment identity, preview URL, evidence manifest and SHA-256 archive checksum. Outstanding mandatory acceptance or source gates block a ready-for-production statement. Production still requires explicit user approval.

## Technical dependency evidence

Cloudflare D1 documents batch statements as a single transaction with rollback on error: https://developers.cloudflare.com/d1/worker-api/d1-database/ . Cloudflare Email Service documents the structured send binding and provider message ID: https://developers.cloudflare.com/email-service/api/send-emails/workers-api/ . Neither documentation nor provider acceptance substitutes for the required preview/inbox evidence.

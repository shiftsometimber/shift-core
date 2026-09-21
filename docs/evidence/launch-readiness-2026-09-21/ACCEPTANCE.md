# Launch readiness repair acceptance — defined before application edits

Authority: remote main `2d5931d9250f66c5196cf3629f52687dce6bdbb6`, tree `6fb57d79d9ac735a96d480cdaec57fab40415f92`, freshly checked 21 September 2026. Local baseline has exactly that tree. Public Pages stays pinned to deployment `0da69833-83f7-4c70-9c7a-bceab7de1660` (source c733bf03834d93154a51a0db6ef05dbebb3c7cb3). No deployment authorised by this document.

## Protected decisions

Keep prices, theoretical-stock testing, exact “No stock available today” wording, intended services, home tests only, partner activation holds, navigation, existing member journeys and B1 save/reset repairs. Never claim a contract, clinical review, real stock, human response or restore proof exists without evidence. No live payments, destructive production tests, customer-record inspection, external messages or source-access bypasses.

## Repair gates

* WR04: shop settlement, stock, order reference and event completion commit atomically. Inject failure at each statement, then redeliver the same event; exactly one settlement results. Distinct concurrent successes, late failures, repeat failures and later success cannot release another reservation, regress paid/refunded state or deduct twice. Missing orders remain retryable. Receipt requirements persist with settlement; absent email and uncertain provider acceptance remain visible, without blind resend.
* WR05: repeated checkout requests for one unresolved purchase recover the original attempt and provider parameters. Timeouts before/after acceptance do not allocate a second purchase. Partial preparation is identifiable and recoverable. Definitive rejection differs from unknown outcome. Provider mode, verification, account isolation and stock gates remain enforced. Provider-sandbox proof must be labelled separately from local fault injection.
* WR07–09: selected Orlistat count, configured amount and summary agree for every existing pack; the Health MOT CTA accurately describes its existing destination; Foundayo statements use a current authoritative UK source and distinguish authorisation from supply. No price/service rewrite.
* B1-Q02: reproduce or bound the photo-selection failure with delayed initialisation and image loading. File selection must either preview or show an actionable error; retry, save/reload/relogin, isolation and deletion work. A passing rerun is not a root-cause finding.
* WR03/10–23: inspect each existing process and record evidence, owner, completion criterion and remaining access/dependency. Implement only demonstrated, bounded defects. Restore and external integrations require isolated fictional data; operator/partner commitments cannot be inferred from code.

## Release gates

One isolated preview, relevant repository and hosted desktop/mobile Chromium/WebKit tests, failure/retry cases, B1 regression coverage, public-content and commercial preservation. Correct regressions in that preview. Report exact commit/build, raw results, limitations, checksum and all unresolved launch blockers. Production remains blocked pending the release pack and Matt's approval. The previous B1-only release guard must be explicitly reviewed for the new candidate, never bypassed.

Technical owner: Codex. Business, partner, clinical and operational appointments: Matt; named delegates remain unverified. Optional expansion and broad marketing changes remain deferred.

## LR-N06 — stale authentication response, added before repair

Final preview 67b9114 reproduced HTTP 401 at a consent save after an ordinary successful re-login. Both member authentication paths currently attach an unconditional session-cookie deletion to an expired-session response. A delayed response for a revoked session can therefore erase a newer valid login. Block this release until a deterministic delayed-response test passes. Smallest correction: expired/invalid reads still return 401 but do not mutate the cookie; explicit logout and account-deletion receipt continue clearing it, and server revocation/expiry remains authoritative. Verify real old-session rejection, replay that response after new login in a browser cookie jar, retained access/data, reset expiry/reuse, and explicit logout/deletion regressions. Do not lower password work factors, expiry checks or account-isolation rules.

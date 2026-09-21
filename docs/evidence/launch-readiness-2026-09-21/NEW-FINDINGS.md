# New findings, kept separate from the inherited register

## LR-N01 — Public discovery assumption disproved (confirmed, high confidence)

21 September 2026: public `site:shiftsometimber.co.uk` search returned the homepage, Programme, Start Here, About, terms, help, cookies, Foundayo, Life Back and contact. This disproves the assumption that nobody can find the test site. It does not establish traffic volume, Search Console status or rankings. The public domain is not a private preview boundary. Current visibility is unchanged; Matt was notified during repair work. Preserve actual stock/payment holds and require accurate public claims irrespective of promotion date. Technical owner Codex; launch/visibility decision Matt. Close when the intended public scope and actual access/indexing settings have been reviewed together; do not treat robots.txt alone as access control.

Evidence URLs: https://shiftsometimber.co.uk/ ; https://shiftsometimber.co.uk/programme ; https://shiftsometimber.co.uk/start-here . Search dated 21 September 2026. robots.txt web retrieval failed and is unverified by that tool.

## B1-Q02 advancement — Photo readiness gap (confirmed code path, historical incident attribution medium)

`member-experience/dashboard-tools.mjs` renders an enabled file input then asynchronously loads `member-product-v33d.js` after member readiness. Only that later script assigns `onchange`. A file selected in the gap has no handler and is not replayed on boot. This is a real missed-selection path, but cannot conclusively attribute the previous production timeout without its event timing. Candidate disables the retained-shell input until binding, processes any already selected legacy file, revokes preview URLs and provides decode/timeout failure feedback. Hosted delayed-load, corrupt-file/retry and persistence/isolation tests are required; a passing old rerun is insufficient.

## LR-N02 — Age-only reservation release (confirmed, high confidence; deduplicated into WR05)

`reconcileExpiredReservations` marked medicine orders expired after 40 minutes before consulting Stripe, then updated reference and inventory in separate writes. A provider session may still accept payment; interruption could also split the release. Candidate requires confirmed provider expiry and atomic release, and removes provider reconciliation from the public catalogue request. No historical reservations have been changed or replayed. Completion requires failure/late callback and exact-once tests; provider sandbox remains a commissioning dependency.

## LR-N03 — Uncertain receipt acceptance (confirmed source gap; deduplicated into WR04/11)

Original shop receipt work ran outside settlement, skipped silently with no email binding and retained failures only in console logs. Candidate persists recipient-specific pending/sending/accepted/uncertain states with settlement and exposes aggregate signals through existing Watchtower. Provider acceptance is not Inbox delivery. No automatic retry for uncertain acceptance. Full operator acknowledgement remains a separate unverified commissioning gate.

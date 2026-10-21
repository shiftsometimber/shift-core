# Approved Ask Timber release

Live and verified: https://shiftsometimber.co.uk/ask-timber

Matt approved the guided preview with “Brilliant - go with it please”. Identical presentation content from b3fd4b7c, deployed release source 1b62c3cc725d675951280729d02a144f05f7670d.

Six exact/wildcard Ask Timber routes point to shift-ask-guided-presentation-20261021. Other paths delegate to Core. The new page uses /ask-timber/question and /ask-timber/client.js. It preserves the shared header, footer, consent and existing non-page routes.

The question service reuses the existing Ask Timber handler with focused retrieval, food foundation matching, a strict public-table read-only DB wrapper, no cookies/authorisation/history and no personalisation. Bundle boundaries refuse private member APIs/journey/selected recipes. The original question is preserved; the browser never manufactures advice. Cloudflare Workers AI uses the existing account service. No D1 writes, account writes or new customer sessions.

18 scoped native tests, four staged and four live Chrome/WebKit mobile390/desktop1440 passes, staged meal/protein/medicine/emergency answers, live meal/source regression, six URL variants and prior-route/Health/Treatments preservation passed. Exact receipts and rollback route identities are in live-proof.

Rollback from native ask-timber-guided-live-20261021: node release/ask-timber-guided-20261021/deploy.cjs rollback. It validates ownership and removes only the six added routes.

The legacy /v1/ai/chat endpoint and other callers were not migrated or deployed by this page release. Do not report its source-matching fault fixed estate-wide. Full Core/TRT release and verifier performance work remain separate.

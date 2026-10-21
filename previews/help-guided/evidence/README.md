# Help live acceptance

Approved preview d68390e44dfbafe140d6b0228711304a4320b390, design signed off (“Spot on”). Matt explicitly instructed “Also, help needs to be live” on 21 October 2026.

Now published and live-verified: https://shiftsometimber.co.uk/help

Production source: release/help-guided-20261021 at 6531ea52419c6eceba8e21b044d94059536a5981. Worker: shift-help-guided-presentation-20261021. Approved main, style and client retained byte for byte. Production preserves analytics, consent, shared header and full footer. GET/HEAD HTML Help only is transformed; /help/client.js serves the approved local search client; other paths and methods delegate to Core.

Eight scoped boundary tests and staging search passed. Chrome/WebKit at 390/1440 passed search, topic filters, answers, keyboard, urgent links, menu and horizontal overflow. Thirteen internal destinations and six canonical/www/slash/query variants passed. Initial WebKit desktop clear-search wait timed out; the unchanged scenario was repeated with click diagnostics and passed. That first attempt is retained in live/checks.json. No communications sent. Every pre-existing route remains unchanged; Health, Treatments and Ask Timber markers verified.

Live proof and exact owned-route identities: live/. Exact rollback from clean native /Users/shiftsometimberltd/SST/help-guided-live-20261021: node release/help-guided-20261021/deploy.cjs rollback. This removes only the six owned Help routes after validating current ownership.

Original preview remains available at https://shift-help-guided-preview-20261021.matobrien.workers.dev/help. Original preview checks retain their historical live-unchanged observation.

Next page: Start Here preview, prioritising goal-relevant explained results and free My Timber. Current source inspection confirms actual /assets/start-here-support-v1.js uses medicine preference/access/budget for potential routes while goals only populate summary text. No Start Here implementation or publication claimed.

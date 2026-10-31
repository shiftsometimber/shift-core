# Ticker placement — deployed and verified, 31 October 2026

Approved scope: remove the shared ticker from Ask Timber and SHIFT Health, preserving the homepage, purchasing hold and existing news logic.

Source: c7ed4aa6da99cfed56654d7784738d6978c90cef, branch fix/ticker-placement-20261031.
Production run: https://github.com/shiftsometimber/shift-core/actions/runs/41192128096 — success.
Worker: shift-latest-news-ticker-20261024. Existing CORE binding, settings and routing behaviour retained. No routes added or changed. Original module and settings, tested candidate, upload result and verified receipt are retained in the run's ticker-placement artifact.

Changed runtime: a single placement guard in the embedded public-news-ticker-v1.js. The remainder of the Worker and ticker client was preserved exactly.
Tests: four actual-client VM cases, no feed requests on excluded pages, exact original-code restoration and retained pin expiry. Cloud verification compared the served JS and provider source exactly, all routes unchanged, homepage bytes unchanged; automatic exact-source rollback retained.

Live desktop browser: /ask-timber and /shift-health have zero ticker elements; /treatment-centre retains one. Each has one shared footer and no horizontal overflow. Browser tab closed in finally. Physical Safari and mobile acceptance were not performed.

Correction to the earlier review: the MPs lead was explicitly implemented as a seven-day timed pin, expiring 31 October 2026 at 20:00 GMT. That existing expiry remains unchanged. This receipt does not claim its future automatic transition has already been observed.

Status: scoped runtime deployed/verified; branch remains unmerged. Other outstanding blog/duplicate-guide, signed-in, Safari and pack/supply-period acceptance items remain unresolved. No homepage edit, purchasing activation, customer data write, message or new schedule.

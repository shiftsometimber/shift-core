# Purchase release gate — remains CLOSED

Owner instruction, 23 October 2026: do not enable purchasing, take payments or change commitments. A future opening requires explicit owner approval; this work supplies none.

Treat Start Here availability wording, cart/checkout routing, authoritative catalogue prices, clinical/pre-payment readiness and provider payment mode as one coordinated release. A successful page, route, merge or Stripe connection alone is insufficient.

Before opening, require evidence for all of the following against the same exact candidate:
1. Starting and continuing-treatment selection, strengths, quantities and supply periods agree with the authoritative live catalogue. Starter cost must not imply ongoing cost. Budget matching must respect actual available products.
2. Stock and prices are current, and unavailable products cannot be ordered.
3. Required clinical intake, identity/evidence handling, prescriber workflow, consent and pre-payment checks pass. No clinical suitability decision is inferred from a public calculator.
4. Cart/checkout routes and public availability wording agree with the actual closed/open state; direct links must respect the same gate.
5. Payment mode, authorised clinical/order handover and failure/idempotency handling pass controlled acceptance. No live purchase is authorised by this document.
6. Matt explicitly approves opening the verified version, with a coordinated rollback that restores both the closed message and disabled purchase routes.

Current read-only baseline: Start Here says ordering is unavailable and no payment can be taken; /cart and /checkout return 404. This verifies those entry points only, not the absence of every possible payment path. Historical readiness receipt at checkout-public-flow-20261023/production-readiness.json is dated 23 October 08:47 UTC and must be refreshed before any future activation.

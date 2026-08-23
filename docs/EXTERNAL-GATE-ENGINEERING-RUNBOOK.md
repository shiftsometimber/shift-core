# External-gate engineering runbook

This is a preparation document, not authority to deploy, sell medicines or change production.

## Evidence required from the commercial track

Engineering acts only when attributable evidence is supplied for the relevant domain:

- supplier/partner: legal identity, approval owner, decision reference and effective date;
- cost: per-strength acquisition, dispensing, delivery and payment costs with source reference;
- stock: exact supplier SKU, availability state, observation timestamp and evidence reference;
- claims: exact wording, channel, destination, source evidence, version, reviewer and expiry/review date;
- clinical: named accountable approval, scope, version and effective/review dates;
- commercial authorisation: named owner, target candidate commit and candidate evidence digest.

Missing, stale, unmatched or unreferenced evidence remains blocked. No evidence source is allowed to approve itself.

## Controlled catalogue intake

1. Confirm the requested target commit is still the frozen candidate or an explicitly authorised successor.
2. Convert supplier data to the existing bounded intake contract; do not add activation, claims or approval fields.
3. Run the HQ dry-run and retain its per-row validation output.
4. Resolve every rejected or unmatched row. Do not bypass catalogue identity checks.
5. Apply with a unique idempotency key to the authorised non-production environment.
6. Verify that imported costs remain `proposed`, stock remains `review`/`unavailable`, supplier approval is not imported, and every CTA/commercial state remains blocked.
7. Retain revision ID, actor, source reference, before/after audit and row count.
8. Exercise rollback immediately in the same environment and prove restoration. A revision conflict stops the operation.

## Claims and governed decision content

Claims and decision content use their own reviewed lifecycles. Catalogue intake must never mutate them. Approval requires exact content/evidence versions, a current evidence window, an independent reviewer and an attributable lifecycle audit. Withdrawal must take effect without falling back to an older unsafe version.

## Release-control checklist

All items below are mandatory and independently verified:

- seven engineering proof keys bound to the exact target commit;
- artifact reference and SHA-256 digest for every proof;
- current supplier, cost, stock, partner, clinical and claims evidence;
- separate commercial, clinical and production actors;
- every approval bound to the target commit and candidate digest;
- current rollback proof for the same commit;
- explicit production authorisation;
- separate explicit medicine-sale authorisation.

Production deployment stays blocked without the production token. Medicine purchasing stays blocked unless production is permitted, every external gate is current, and the separate sale token is present.

## Stop and rollback conditions

Stop on an idempotency conflict, row identity mismatch, stale evidence, approval mismatch, candidate digest mismatch, rollback conflict, off-palette regression, device regression or any unexpected enabled purchase state. Do not continue with a partial batch.

Rollback to the retained pre-change revision, verify the frozen candidate journeys and gates, retain the failure evidence, and require fresh authority before another attempt.

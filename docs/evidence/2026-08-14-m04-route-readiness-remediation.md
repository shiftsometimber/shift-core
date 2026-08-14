# M04 route-readiness remediation

The M04 production gate now treats deployment state as evidence rather than elapsed time. Before creating the member journey, it polls the restricted `/v1/commissioning/product-events` route for up to five minutes using the short-lived GitHub OIDC commissioning identity. Legacy `404` and transient `502` remain retryable; unexpected statuses fail immediately; endpoint-present `200` or schema-not-yet-initialised `503` permit the real journey to begin. The final evidence lookup still requires HTTP success plus the complete required event set and ordering.

A source regression gate is wired into `npm run check` so the bounded endpoint-readiness contract cannot silently fall back to an arbitrary sleep.

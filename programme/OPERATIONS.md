# Programme service operations — candidate

These routines are tested with fictional accounts. They are not a public administration API, a deployed operator interface, or permission to access production data.

## Provision and pause

The trusted operator imports `provisionAccount` or `changeAccess` from `account-operations.mjs` and supplies the isolated environment's `DB` and separate `PROGRAMME_DB` bindings. `provisionAccount` verifies the member exists; a supplied request parameter alone is never sufficient. Every active grant requires an explicit future UTC expiry. Operator identity and reason are required. A second provision refuses to overwrite an account. `changeAccess` requires the current revision; competing changes cannot overwrite each other.

No member endpoint accepts an entitlement, operator identity or provisioning request. Do not add the operator module to public route dispatch. A named service owner and authenticated operator execution route are required before these routines are used for real accounts.

Expiry is resolved on every Programme read and mutation and on dashboard entry. It stops new service review/accept/repeat actions; it preserves saved records, manually managed lists, existing free tools and export. Existing explicitly active legacy grants with no expiry retain their prior meaning; all newly provisioned active grants require expiry. A future migration of legacy grants requires an explicit service decision.

## Export

`GET /v1/programme/export` uses the unchanged member authentication path and ignores foreign account identifiers. It downloads only the authenticated member's stored Programme aggregate. Internal request signatures and operator event records are omitted. The endpoint is read-only, privately uncached and available after service expiry. It does not export unrelated Journey records, clinical records, authentication secrets or another member's data.

## Data requests and retention

No retention period, deletion promise or service response time has been invented. The service owner must specify who receives requests, verifies the requester, handles records in existing free tools, applies the approved retention policy, and records completion. Code here performs no deletion or automatic pruning. A code rollback preserves the Programme table and its records; it is not a database restore.

For a deletion request, first confirm the requested scope and governing policy with the accountable operator. This candidate includes export and exact owner-scoped storage but no exposed delete endpoint or bulk deletion script. Do not erase a member's free-tool records as a side effect of ending Programme access.

## Test environment commissioning

Use the exact candidate branch. Create a separate test Worker, separate authentication DB and separate Programme DB; use fictional records only. The root production configuration and its real bindings are protected. Apply `migration.sql` only to the selected Programme test database. Keep the feature off until the two bindings and test identities are verified. No real cookies, payments, email bindings or clinical submissions belong in these checks.

Run the remote D1 contract in DELIVERY-3.md using two independently authenticated fictional sessions. Preserve request IDs, Worker version, database identities and final revisions. The local tests do not supply those remote results. Provide the permitted browser origin through the supported workflow; the current cloud-browser URL rejection must not be bypassed.

## Capacity and rollback

Existing per-request limits remain: 20,000 characters for Programme JSON bodies; at most eight initial actions, thirty reports in one request, and one hundred manual shopping additions. No customer-volume/load claim is made. The stored aggregate retains history and operation identities; long-term aggregate growth and load limits require commissioning measurements before paid scale.

Rollback only the namespaced continuation changes. Disabling `PROGRAMME_V1_ENABLED` removes Programme entry/service routes and leaves free tools intact; it does not delete the store. Re-enabling the previous candidate must preserve the additive `startedOn`, `expiresAt` and service-event fields. Ending a subscription uses access expiry/pause, not the emergency feature switch, because normal expiry keeps record access available.

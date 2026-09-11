# Delivery 3 — release evidence and open gates

Owner of candidate engineering and verification: **Codex**. Release decision: **Matt O’Brien**. This register does not authorise deployment, production data access or participant contact.

## D3-01 — Worker / D1 concurrency and retry contract

**Owner: Codex. Status: OPEN — not proved on the target runtime.**

The Node SQLite adapter proves the local aggregate logic only. A further seven contract checks now pass in actual workerd 1.20260911.1 with local Miniflare D1 emulation, at the unchanged 2026-08-09 compatibility date: 12 competing writes (one success, eleven 409s), concurrent duplicate/retry, conflicting operation ID, stale acceptance, ownership, read-only existing-tool access through the separate D1 binding, and real session expiry. These results still do not establish remote Cloudflare D1 behaviour. See `evidence/workerd-d1-contract.json`. Its scheduling and SQLite locking do not establish Cloudflare Worker or D1 behaviour. The candidate storage adapter targets D1 through a separate `PROGRAMME_DB` binding. KV or Durable Objects would be a different implementation and require their own contract proof.

Run against the exact candidate Worker bundle and a separately provisioned test D1 database, with fictional accounts and the pinned member authentication path. Record Worker version, D1 database identity, binding, compatibility settings, region information where available, request IDs and resulting aggregate revisions. No production database is used.

Required results:

1. Two independently authenticated sessions submit different writes at the same base revision concurrently: exactly one commits; the other returns 409; no plan/list/decision partial update.
2. Many competing writes at one revision: exactly one revision advance and one committed operation. Repeat across separate Worker invocations, not just simultaneous promises sharing a local adapter.
3. Identical operation retried after success: one effect only. Concurrent identical first attempts may produce a success and a conflict; retry of the conflicted identical operation must return the committed result without a second effect.
4. Same operation ID with different payload: 409, no mutation. Stale preview/accept after another session edits: 409, newer state preserved.
5. Inject a storage failure before commit and simulate a lost response after commit: atomicity and safe replay in both cases.
6. Cross-account attempts, actual expiry/revocation and binding/feature-off failures return the documented responses without private content.

Exit evidence: raw request/result table plus stored aggregate comparisons from that test runtime. Local SQLite passes, a bundle dry run, and a walkthrough cannot close this gate. Test runtime provisioning/binding is still outstanding.

## D3-02 — logout, expiry and browser back/forward

**Owner: Codex. Status: OPEN — browser-back verification blocked in the prior browser session.**

Home: Delivery 3 functional acceptance 13 and member privacy evidence. Earlier browser URL policy rejected the back-navigation check; no pass is inferred from response headers or pagehide code. Do not bypass that policy through another automation route.

On an authorised isolated test origin, use the supported browser workflow (or record an operator-run check where automation policy does not permit it): open member A’s private view; log out/revoke the session; use browser Back and Forward, including bfcache restoration; refresh; then sign into member B. Repeat after actual session expiry. Verify no A record flashes or remains visible, private API requests reject the old session, and B sees only B’s data. Include reload from a restored tab and history return after leaving the module. Record browser/version, steps, expected/actual result and evidence.

API expiry checks have passed in Node and workerd/D1 emulation. A further module-level check verifies that page cleanup removes the account name, entitlement, status, tabs, plan body and pending preview; the prior cleanup left the account-name header behind. This correction is not a substitute for observing browser history restoration. The earlier restricted-root harness mount problem is now fixed: the containing workspace mounts both the authoritative core and pinned Pages source, and the managed preview starts. Reloading the Programme page was then rejected by browser URL policy. That action was not retried through another URL or browser surface. No new browser pass is claimed. The browser result remains OPEN until observed. Native Safari/WebKit is a separate OPEN compatibility check, also owned by Codex; an actual test device/runtime is required.

## D3-03 — accountable content review and usable coverage

**Technical enforcement owner: Codex. Appointment/accountability owner: Matt O’Brien. Named professional reviewer: NOT ASSIGNED. Status: BLOCKED for real member use.**

All six recipes remain test fixtures with null reviewer, date and reviewed version. A valid metadata record does not perform or authenticate a professional food/allergen review. The appointed accountable reviewer must review actual recipe versions and restriction fields. Record approval, date, identity and scope before production selection is enabled.

Use the intended member constraints to build a coverage table: current meal, quicker compatible alternative, no-cook option where appropriate, quantities and review provenance. Where no option exists, preserve the record, display the limit and offer no invented alternative. A technically correct refusal is not evidence of a useful paid service.

## Other existing V1 gates remain open

Private dashboard entry and the pinned return function are implemented and contract-tested; the complete rendered sign-in/return journey remains open. Existing Grub/Fit data now has an owner-scoped read-only adapter; further Journey/check-in compatibility and complete free-tool journey testing remain open. Other outstanding work: reviewed Fit and four-week/continuity content; outstanding accessibility/browser checks; account provisioning/expiry and service-desk/export/deletion/retention arrangements. This follow-up does not silently close them.

## Participant sessions

The prepared research script can support a comprehension/usefulness study of a fictional concept. Matt must explicitly authorise participant contact and identify the operator/recruitment route. No contact is authorised by this register or by reviewing a colleague’s recommendation. Use the current candidate only; the earlier standalone prototype is archived. Explain that the recipes are fictional test content and the service is not available. Do not present ten conversations as proof of payment, retention, food safety or technical release readiness.

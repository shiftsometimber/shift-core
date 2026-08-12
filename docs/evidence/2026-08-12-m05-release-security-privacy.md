# M05 / G1-010 / G5-011 — release security and privacy commissioning evidence

Date: 2026-08-12
Production authority at proof: `16381fa94b3a34f7c4129dd6ebaecf2a5d756a68`
Production commissioning run: `31641335098`, job `94264272717`
Result: **GREEN**

## Acceptance standard
This evidence does not treat a source audit or green merge as PASS by itself. The release review combines existing adversarial/runtime security commissioning with an unchanged deployed production proof of exposed V1 privacy, identity and cross-member boundaries.

## Existing security controls retained
The pre-existing security suite remains regression-protected and covers member/HQ authorisation boundaries, session/cookie controls, failed-login/rate-limit behaviour, reset-token security, malicious payload handling, cross-member isolation, analytics filtering, secrets/client-exposure policy and the restricted GitHub Actions commissioning identity. The new release gate did not relax any of those controls.

## New deployed production proof
The post-deploy production step `G1-010 / M05 deployed release security and privacy` completed successfully on the deployed Worker and proved:

1. The GitHub Actions OIDC commissioning identity cannot be used to verify an arbitrary real-member address; a non-synthetic address was rejected.
2. Anonymous callers could not access privacy export, privacy deletion, member profile or HQ identity surfaces.
3. A hostile web origin did not receive a credentialed `Access-Control-Allow-Origin` grant.
4. Two independently authenticated synthetic members stored different private preferences and Progress records.
5. Each member's privacy export returned that member's own data and excluded the other member's email, Progress values and private state.
6. A privacy deletion request returned accepted status and immediately revoked the requesting member's active session.
7. The unrelated member's authenticated session remained valid after the other member submitted the deletion request.
8. Tested exposed responses retained release security envelopes including `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` and a request-correlation ID.

The same production run then continued successfully through genuine Radar scanning/freshness, authenticated member isolation + retained state, longitudinal Grub/Fit learning, locked B03 production journeys and M07 structured content serving. The security/privacy proof therefore did not obtain green by breaking the wider production member system.

## Defect/weakening policy
No production verification bypass, broad commissioning identity, disabled authorisation, weakened privacy boundary or relaxed security assertion was introduced to obtain this proof. The synthetic commissioning identity remains repository/actor/audience/workflow/email-pattern restricted and short-lived.

## Closure judgement
Original `G1-010` required formal commissioning of auth/security controls. Original `G5-011` required completion of the exposed-V1 security/privacy audit. With existing runtime/adversarial security gates plus the unchanged deployed production privacy/identity/isolation/deletion proof above, both requirements have demonstrated release evidence and are promoted to **PASS**.

Human inbox/device requirements remain separate AMBER rows and the three provider/clinical dependencies remain BLOCKED. This PASS must be reopened only by genuine regression evidence.

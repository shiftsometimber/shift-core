# G1-008 — Fit generated-state client abort diagnosis

Date: 2026-08-13

## Scope

This evidence records the exact remaining production blocker exposed while commissioning the rendered loading / empty / success state system. It does **not** promote G1-008 to PASS.

## Demonstrated production journey

PR #161 runs the unchanged production member journey with a fresh authenticated synthetic member and retained `sst_session` state. Public rendered-browser and accessibility/performance jobs are green; G1-008 remains red only in the generated Fit state.

The focused production diagnostic on Gate 1 run `31728688341` used the same live member dashboard and the same production API. It demonstrated:

1. fresh synthetic registration succeeded;
2. login succeeded;
3. `/v1/member-state` succeeded;
4. the authenticated session cookie was retained;
5. the member navigated to Fit;
6. `Build my session` became visibly busy/disabled and the UI showed `Building your Fit plan…`;
7. the browser emitted `POST /v1/fit/plan` with the exact body:
   `{"days":3,"minutes_per_day":30,"location":"home","equipment":"none"}`;
8. the browser request was aborted at approximately **15.0 seconds** with `net::ERR_ABORTED` and therefore never produced the expected rendered success state;
9. the diagnostic then replayed the **same request body** directly to the same production API using the **same retained authenticated session**;
10. that direct replay returned **HTTP 200** after approximately **39.6 seconds**, with three Fit sessions and no quality issues.

## Commissioning judgement

This is not a Playwright matcher defect and not an authentication failure. The current member-facing production client terminates a request that the production backend subsequently completes successfully.

Therefore the exact remaining G1-008 product defect is:

> the live Fit client request lifetime is shorter than the successful production Fit generation time, so a member can enter a legitimate loading state and then lose the valid result before it can render.

The commissioning harness must remain strict. Increasing a test timeout or weakening the expected success assertion would be invalid.

## Required closure

G1-008 remains **AMBER** until the actual product path is repaired and an unchanged production run demonstrates, at desktop and 390px where applicable:

- explicit loading state;
- action locked while loading;
- successful production response;
- returned Fit product visibly rendered;
- settled completion state;
- retained authenticated state;
- no horizontal overflow.

The production deploy boundary remains unchanged: Git-version the actual member client source and repair first; production publication still requires the established authorised release path.

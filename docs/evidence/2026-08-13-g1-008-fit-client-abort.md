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
7. the browser emitted `POST /v1/fit/plan` with the exact body `{"days":3,"minutes_per_day":30,"location":"home","equipment":"none"}`;
8. the browser request was aborted at approximately **15.0 seconds** with `net::ERR_ABORTED` and therefore never produced the expected rendered success state;
9. the diagnostic replayed the **same request body** directly to the same production API using the **same retained authenticated session**;
10. that direct replay returned **HTTP 200** after approximately **39.6 seconds**, with three Fit sessions and no quality issues.

## Commissioning judgement

This is no longer primarily a harness problem. The harness has isolated a real member-product defect: the live Fit client request lifetime is shorter than the successful production Fit generation time.

**Do not weaken or extend Playwright acceptance to hide this. Fix the canonical member client.**

The live dashboard references `api-adapter-v33d.js` / `member-product-v33d.js`; those deployed static sources are not currently Git-versioned on main. The diagnostic branch therefore captures the exact live member-product source before any repair. The next legitimate product change is to recover that exact deployed client source into Git authority, locate the 15-second cancellation policy (`AbortController`, `AbortSignal.timeout`, `setTimeout(...abort...)`, `15000` / `15_000`, shared request wrapper or navigation cleanup), and make the bounded canonical repair there.

## Required product behaviour

For Fit generation the member client must:

- submit once;
- remain visibly loading while the legitimate production operation runs;
- keep the action locked against duplicate submission;
- allow the successful backend request to complete with sensible headroom above the observed ~39.6s envelope;
- render the returned sessions and settle cleanly;
- retain a finite upper failure boundary and controlled error/retry state.

Do **not** blindly increase every API request timeout. If the 15-second limit is shared, long-running generative operations need their own appropriate request policy while ordinary APIs retain tighter budgets.

## Latency evidence required alongside the V1 fix

Instrument or retain timings for the Fit production path at bounded stage boundaries: request received -> member/context load -> generation/composition -> quality gate -> persistence -> response. The immediate V1 requirement is reliable delivery of a legitimate result; reduce an obvious bounded latency hotspot if exposed, but do not start an architectural performance rewrite merely to close G1-008.

## Closure

G1-008 remains **AMBER** until the actual product path is repaired and an unchanged production run demonstrates at desktop and 390px:

- explicit loading state;
- action locked while loading;
- request not prematurely aborted;
- HTTP-successful production response;
- returned Fit sessions visibly rendered;
- settled completion state;
- retained authenticated state;
- zero document-root horizontal overflow.

The commissioning harness remains strict and unchanged for that final proof.
# Backend memory and practical-answer candidate — not live

Tested application source: `13b603a41c52033aaac7ba830c6613f96a1e63b0`.
Real AI/browser run: https://github.com/shiftsometimber/shift-core/actions/runs/36277837113
Draft PR: https://github.com/shiftsometimber/shift-core/pull/817

## Verified behaviour

- 126 local regression checks pass; the real-model test is intentionally skipped locally and runs in CI.
- Seven real-model scenarios pass: saved member context, limited time/budget, changed goal, food/medicine topic relevance, dose boundary, account isolation and honest save status when memory is disabled.
- The unchanged desktop chat saves a fictional member's midnight finish time, recalls it after page reload, accepts a correction to 10pm and recalls that correction after another reload.
- The recipe query returns the actual governed ingredients and quantities: large eggs (2 / 100g), kidney beans (80g drained). The practical plan references actual ingredients and preparation, answers the beforehand question and provides a fallback when ten minutes is too short.
- Phone-sized WebKit renders the member's actual Life Back goal; response text is asserted against the API answer and the page has no horizontal overflow.
- Separate-account requests cannot read the first member's conversation. Actual authenticated health-data erasure clears AI records; re-consent does not restore the erased detail.
- Memory-off, paused tracking, withdrawal, explicit personalisation opt-out, in-flight privacy changes, correction/deletion and member-only export are covered by real SQL tests. Existing edit/delete operations and their conversation boundary commit atomically.

## Measured timings

| Sample | Observations | Result |
|---|---:|---|
| Real inference with synthetic SQL | 7 | median 2,932 ms; range 1,426–4,613 ms |
| Browser submit to rendered answer | 7 | median 2,579 ms; range 1,734–4,541 ms |

The full recipe plan took 4.54 seconds. One observation per case, not a production p95, load test or SLA. Browser runs use local authenticated synthetic SQL and hosted real Workers AI; live D1 latency is excluded. WebKit uses a phone-sized viewport, not a physical iPhone.

The rejected shallow-answer run is retained in `real-model-depth-rejected.json`. Earlier baseline/credential-blocked reports remain historical evidence; their results are not the current release result. The preview credential works through the existing isolated Worker binding pattern. The temporary evaluator was removed successfully after each completed run and has no production routes or database bindings.

## Review limits

This connects bounded recent conversation context and existing preferences; it does not train a model, research autonomously, create new structured preferences, or guarantee permanent recall of every saved message. See README.md for the exact six-message/30-day retrieval limits and controls. Generated wording still needs ordinary quality review. Erased or unavailable memory cannot establish whether someone said a fact in the past.

No frontend/public/assets files, production configuration, package manifest or lockfile changed from production baseline `b7684acb867e85386cea87ecbfb055847d0fa55d`. All sixteen applicable workflow runs passed on the tested source, including whole-estate route sweep, integration, frontend, privacy, readiness, academy, knowledge, acquisition and the real-AI/browser evaluation; the unrelated Health Passport preview was skipped by its condition. Production activation is not performed; both feature flags remain off by default. Disable the flags to stop the new behaviour; doing so does not erase previously saved records.

## Browser captures

[Desktop answer](chromium-desktop.png) · [Phone-sized WebKit answer](webkit-phone.png). Both reviewed visually. Service workers are blocked in the isolated fixture to keep requests on the synthetic routes; offline/service-worker behaviour is outside this backend test. The cookie choice is preserved through a reload before testing, so no blocked-production-write warning obscures the final capture.

# Production Update Status — verified release

Verified 2 November 2026. All three workers serve the qualified versions at 100%. Runtime source: `0eac5a654929a962932d8777e3a19db1b2385d9c`. Core's retained public-resource source is `ee287e38c997fc3a712c82811e084e515ac1ee13`.

| Worker | Release/version ID | Publication deployment ID |
| --- | --- | --- |
| shift-core | `ab3b4d50-6b45-4893-829f-2bb4c282a5c1` | `a2b67107-746a-4f97-bdfa-4df149f0b446` |
| shift-programme-member-20261023 | `f7fdb690-b1a0-47a5-ad0e-6f501fbb1f32` | `0efe518a-67f0-49dd-ad24-97460fea9e21` |
| shift-hq-member-comms-20261023 | `3742484b-fd3f-4dea-8e13-7e6536163ccf` | `fc9db836-e5a4-4f79-8675-7b2760e27f56` |

Candidate: 28/28 p95 comparisons passed, 560 before and 560 after samples across normal and Slow 4G profiles. Live: 14/14 p95 comparisons passed, 280 samples. Every comparison has n=20 before and after. Live privacy/auth: 101/101. Chromium and WebKit functional and expired-session fresh re-entry: pass, zero browser errors. Unit checks: 15/15. Public code/page preservation: 71/71. Production p95 rollback was armed throughout admission; no rollback was triggered for this qualified release.

## Live screen measurements

Milliseconds; each cell is median / p95. Fresh means first visit to that screen inside the app; public HTTP cache may already contain resources. Return means revisiting a retained screen. Percentiles use nearest rank (10th and 19th observations of 20).

| Screen | Fresh before | Fresh live | Return before | Return live |
| --- | ---: | ---: | ---: | ---: |
| Today | 2098 / 3259 | 1082 / 1367 | 1705 / 3529 | 375 / 376 |
| Journey | 733 / 931 | 481 / 515 | 774 / 1335 | 208 / 209 |
| Shop | 407 / 989 | 565 / 580 | 406 / 519 | 208 / 208 |
| Grub | 1200 / 1678 | 765 / 881 | 1193 / 2571 | 359 / 374 |
| Fit | 1157 / 1463 | 831 / 931 | 1178 / 2018 | 358 / 375 |
| Support | 1568 / 2102 | 1131 / 1314 | 1582 / 2739 | 374 / 376 |
| More | 1635 / 2108 | 1081 / 1283 | 1690 / 3262 | 374 / 375 |

These UI measurements use real production documents/static assets, Chromium mobile emulation (390×844) on the SST Mac, and fictional intercepted APIs with a fixed 150 ms response delay. Candidate Slow 4G used 300 ms API delay, 1.6 Mbps down / 750 kbps up, 150 ms network latency and 4× CPU slowdown. Candidate/baseline use version overrides; the live run has none. Production member API requests/writes: 0. Physical-phone samples and real signed-in member latency samples: 0. Chromium/WebKit recovery checks use fictional account data.

## Ordinary production HTTP

Twenty new HTTPS connections before and after, with no cookies, version overrides, API stubs or production writes. Final HTTP 200 headers are measured separately from any 103 Early Hints.

| Stage | Before median / p95 ms | Live median / p95 ms |
| --- | ---: | ---: |
| Final response headers | 595 / 1755 | 497 / 743 |
| Complete response | 609 / 1769 | 516 / 756 |

TLS handshake median: 44 → 43 ms. Body transfer median: 13 → 14 ms. The original 2.8–4.3 second wait was not reproduced in this ordinary anonymous n=20 run. Internal worker/DB/queue attribution remains blocked by Cloudflare HTTP 403, code 10104, `workers_observability.api.error.authentication.no_access_to_workers_observability`. Smallest next action: grant the existing operator Workers Observability access, then run the prepared stage query. No retries until access changes.

## Remaining performance targets

All p95 regression gates pass. Eight Slow 4G median engineering targets remain above their 2,000 ms fresh / 500 ms return targets:

| Screen | Visit | Median ms | Target ms |
| --- | --- | ---: | ---: |
| today | fresh | 3746 | 2000 |
| today | warm | 858 | 500 |
| grub | warm | 826 | 500 |
| fit | warm | 826 | 500 |
| support | fresh | 3427 | 2000 |
| support | warm | 850 | 500 |
| more | fresh | 3325 | 2000 |
| more | warm | 837 | 500 |

Normal-network live median targets all pass. Slow 4G targets and internal stage telemetry are recorded as remaining work, with no privacy/auth/recovery failures accepted.

## Implementation and evidence

Public-resource compression/content fingerprints, duplicate module removal and reusable public document bases reduce repeated delivery work. Retained member screens overlap fresh identity with data revalidation, and keep private controls blocked until both succeed. Fresh in-flight identity takes precedence over cached identity. The contrast guard now rejects invisible elements before style/geometry work. Chromium and WebKit preserve original contrast corrections, dynamic reveal behaviour and visible controls; isolated geometry reads fall from 5,028 to 6 per engine.

Earlier candidates were rejected rather than promoted: warm Shop p95 519 → 592 ms; then Slow 4G Today p95 5,726 → 7,024 ms and 5,726 → 7,687 ms. Historical failures and rollback receipts remain preserved; unchanged failed distributions were not relabelled or resampled for acceptance.

[Full evidence JSON](performance-final-evidence-20261102.json) contains all 42 comparison summaries, every n=20 UI usable-time sample, ordinary HTTP rows, privacy/re-entry proofs, source hashes and provider receipts. JSON SHA-256: `41cc2384a3eb28e30019d27044ba6422a5aecbef5d09105bf5fa4465e59a10c0`.

No emails/messages, spending, store changes or real member-data writes were made.

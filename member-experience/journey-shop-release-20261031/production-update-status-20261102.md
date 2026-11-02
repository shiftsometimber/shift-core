# Production Update Status — 2 November 2026

**Unresolved. No new candidate was promoted to normal traffic.** Matt reports the signed-in iPhone is still slow. The latest candidate failed the original speed gate, and all original distributions are restored. No performance check or repair remains running.

## Verified serving state

| Service | Version at 100% | Restored deployment |
| --- | --- | --- |
| shift-core | `e6ab12fe-b178-450c-8a1b-9ed909f1d5de` | `554b415a-87ea-4159-b76e-3b7b00059ee9` |
| shift-programme-member-20261023 | `c9771e70-bde3-4013-92df-f0698155caca` | `36ebd3f3-fdce-4a2c-852c-86c901a20ff5` |
| shift-hq-member-comms-20261023 | `727fe8d9-c51d-4057-b013-f7ed9da36fb9` | `e8a7db9d-f1bd-41c1-995b-6d8247c02cf1` |
| Support | `6a027bed-24f9-4727-aae8-ed45e8f89eab` | `dc6492ed-3359-4ed4-8fc4-b279b92a5cd1` |

Routes, schedules, bindings, operating settings and dependent releases were guarded. The final managed guard is recorded separately. The failed new packaging versions are unallocated after restoration; they received only explicitly overridden anonymous test requests.

## Real anonymous HTTP qualification

New TLS connection per request; final HTTP 200 headers separated from interim 103 hints. No cookies, member-data reads, production API calls or writes. Each row is n20 using nearest-rank median/p95.

| Composition | Median final headers | p95 final headers | Outcome |
| --- | ---: | ---: | --- |
| Retained original baseline | 595ms | 1755ms | Unchanged hard gate |
| Earlier ordinary production | 1310ms | 4063ms | Fault reproduced |
| Core immutable compatibility repair only | 1325ms | 3725ms | Withheld |
| String-only control | 1211ms | 4286ms | Original source |
| String-only candidate | 1011ms | 4100ms | Withheld; restored |
| Structured-data control | 1005ms | 4493ms | Original source |
| Structured-data candidate | 1164ms | 3163ms | Withheld; restored |
| Static string-reuse control | 1061ms | 3759ms | Original source |
| Static string-reuse candidate | 803ms | 3100ms | Withheld; restored |
| Compressed-data control | 1304ms | 3364ms | Original source |
| Compressed-data candidate | 924ms | 3362ms | Withheld; restored |

No unchanged qualification retry replaced a failed result. Four distinct packaging variants were measured; all failed the retained 1755ms p95 gate. Lower artifact size or one fast request is not acceptance.

## Concrete slow-request incident

Ordinary current production, anonymous GET `/member/dashboard?view=app`, 20:59:55.720 UTC:

- Cloudflare reference: `a54610c94f810c18-LHR`.
- Final headers 2654ms; complete 2667ms; HTTP 200; 82122 wire bytes.
- Caller Server-Timing: Core 827ms, Support 2199ms.

| Matched worker | CPU | Execution wall time | Event timestamp (Unix ms) |
| --- | ---: | ---: | ---: |
| Core e6ab12fe | 39ms | 41ms | 1793653194505 |
| Programme c9771e70 | 280ms | 1114ms | 1793653193483 |
| Support 6a027bed | 9ms | 2152ms | 1793653193439 |
| Documents 727fe8d9 | 19ms | 2220ms | 1793653193365 |

All four events matched the same unpredictable anonymous probe header and sample. All outcomes were ok, with zero exceptions. Only timings, versions, outcomes, timestamps and the anonymous incident reference are retained. Cookies, IPs, other headers, log bodies and member records are omitted. All tails closed. This was a bounded incident collection, not an acceptance retry or a new watcher.

The remaining wait is not fully attributed. Execution wall time can differ from response delivery time; these figures alone do not identify a database query, startup queue, streaming operation or provider fault. The incident gives an exact request and version set for the next runtime investigation.

## CPU findings and prepared code

A usable 10-second production Programme profile recorded 4079ms sampled CPU, including 3761ms garbage collection (about 92%). This establishes memory churn in that capture. It does not establish that every long response is caused by garbage collection. A separate allocation-stack profile returned zero samples. The initial CPU capture 404/no-recent-executions and the next idle-only capture are retained as unusable attempts.

The compressed-data implementation is prepared in source commit `8d31e86e99ef797b15788e5392e53bee08ef2d87`. It moves pure fixed data into native compressed binary modules and uses existing native zlib support. Total artifact bytes fall from 93.61MB to 23.05MB; executable JavaScript is 11.45MB. Exact values, separate mutable object instances and non-initialiser function source are preserved. Decoded JSON input is not cached. No login, session or identity logic changes and no shared completed private-response cache are introduced.

Eleven correctness checks pass: Unicode/key order, separate mutable objects, unchanged serialised functions, prototypes/holes/negative zero/side effects, methods/tagged templates, and immutable-public-resource behaviour. Every compressed resource also passes a decompression round trip. The narrow immutable AEO compatibility guard is retained in the candidate; member/API early pass-through is unchanged.

Staged compressed versions: Core `942f3d58-6b28-4ab5-a977-7b085403dc3e`; Programme `fd140d52-bf02-4e93-81d1-7a31900fd9db`; Documents `fcd250d6-5f7b-422a-bb53-3ce24cec7241`.

One separate matched request attested all three intended compressed versions plus the unchanged Support version. It returned headers in 855ms, with Programme 51ms CPU /171ms execution wall time. This proves routing for that request and does not replace the failed n20 result. Its temporary distribution was closed and the original versions restored.

A prior reviver-based string-reuse implementation was rejected before Programme deployment by Cloudflare 10021/startup CPU limit. Its iterative replacement passed startup validation but still failed the n20 gate. Neither was promoted.

## Historical browser evidence and remaining gates

The earlier 791 composite normal-network Today fresh p95 failed 3259→4331ms, despite 13/14 groups passing. Partial Slow4G rows remain incomplete. Its six immutable tests, 101 HTTP privacy checks and Chromium/WebKit functional/expiry checks are historical evidence for that composition.

No full browser/privacy/expiry qualification was started for the new static-data candidates after their initial HTTP gate failed. Those earlier passes must not be carried forward as acceptance. The real signed-in iPhone remains unverified and reported slow.

Retain the original p95, privacy, expiry/fresh re-entry, source-pinning and automatic live rollback requirements. Do not rerun these rejected candidates unchanged or waive the gate. Isolate the remaining wait with a slow matched request before another implementation.

## Access and costs

Filtered live tails and the production profiling API work with the existing operator connection. The older Workers Observability query 403 is historical and is not a blanket diagnostic blocker. Exact billing subscription lookup was separately denied 403. All three delivery Workers use Standard; no paid upgrade has been established as a remedy, purchased or agreed.

No external messages, native/store changes, new dependencies, private shared HTTP cache or permanent watchers were created. Temporary diagnostics were closed.

Raw source, profiles, attempts, proof receipts and all measured rows: `performance-memory-investigation-20261102.json.gz`, 74409bytes, SHA-256`b2d8d776d7b38791f5e596b57619007d3cfb43ea5996a4db238d161db42f7dbe`. Provider author-email metadata is omitted. Earlier rejection evidence remains in `performance-withheld-evidence-20261102.json.gz`.

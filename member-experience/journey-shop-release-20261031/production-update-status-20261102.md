# Production Update Status — 2 November 2026

**Unresolved. No new normal-traffic promotion in this continuation.** Matt reports the signed-in iPhone is still slow. Lab results do not establish phone acceptance.

## Current serving anchors

| Service | Version at 100% | Last restored deployment |
| --- | --- | --- |
| Core | `e6ab12fe-b178-450c-8a1b-9ed909f1d5de` | `ade1e78f-1d4d-4eff-a015-dbb8567c3cb9` |
| Programme | `c9771e70-bde3-4013-92df-f0698155caca` | `388a3148-5639-4c74-b226-0686de1c930f` |
| Documents | `727fe8d9-c51d-4057-b013-f7ed9da36fb9` | `3203c0d6-c9a4-4f9f-8a5a-f5e1b33eacdf` |
| Support | `6a027bed-24f9-4727-aae8-ed45e8f89eab` | `dc6492ed-3359-4ed4-8fc4-b279b92a5cd1` |

The earlier 791 composite remains withheld. Its normal-network Today fresh p95 failed 3259 → 4331ms (n20 each), despite the other 13 groups passing. Partial Slow4G rows are retained as incomplete evidence. The existing 041 member runtime is the source of the currently serving member features.

## Live measurements

Anonymous real HTTPS, new TLS connection per sample, final HTTP 200 headers separated from interim 103 hints. No cookies, API fixtures, member-data reads or writes.

| Composition | n | Median final headers | p95 final headers | Outcome |
| --- | ---: | ---: | ---: | --- |
| Retained original baseline | 20 | 595ms | 1755ms | Unchanged hard gate |
| Earlier ordinary current production | 20 | 1310ms | 4063ms | Regression reproduced |
| Core immutable repair only | 20 | 1325ms | 3725ms | Withheld |
| String-only packaging control | 20 | 1211ms | 4286ms | Current source |
| String-only packaging candidate | 20 | 1011ms | 4100ms | Withheld; original distribution restored |
| Structured-data packaging control | 20 | 1005ms | 4493ms | Current source |
| Structured-data packaging candidate | 20 | 1164ms | 3163ms | Withheld; original distribution restored |
| Iterative string-reuse control | 20 | 1061ms | 3759ms | Current source |
| Iterative string-reuse candidate | 20 | 803ms | 3100ms | Withheld; original distribution restored |

No unchanged retry replaced a failed percentile result. Lower code size is not a speed acceptance.

## Production CPU evidence

Filtered live tails are available with the existing operator connection. Three anonymous Core requests used 39–48ms CPU and 40–50ms execution wall time while final response headers took 2427–3065ms.

One matched ordinary production request took 3253ms to final headers:

| Worker | CPU | Execution wall time |
| --- | ---: | ---: |
| Core | 47ms | 50ms |
| Programme | 198ms | 1295ms |
| Support | 6ms | 2557ms |
| Documents | 31ms | 2665ms |

A usable 10-second production Programme CPU profile contains 4079ms of sampled CPU, including 3761ms in garbage collection (about 92%). This identifies memory churn in that capture; it does not prove that all response latency is garbage collection. The first profile request returned404/no recent executions. The next capture contained only an idle sample. Sustained anonymous traffic on a reused connection produced the usable profile. A separate allocation-stack profile returned zero samples and does not identify an allocating function.

Only numeric timings, static stack/function names and outcomes were retained. Log bodies, HTTP headers, cookies and member records were not collected. These probes are diagnostics, not physical-phone or percentile acceptance.

## Prepared memory candidate

Pure static data occupies 43.28MB of Programme's 49.49MB JavaScript. Exact-value native Text/JSON packaging reduces executable JavaScript across Core/Programme/Documents from 93.61MB to 11.44MB. Each parsed object remains separate; all non-initialiser function source is byte-identical. The narrow already-tested immutable AEO guard is retained, without changing member/API handling. Bindings, settings, routes, schedules and other owners' modules are guarded.

The first structured-data candidate still failed p95 3163ms and was restored. Its static Programme data contains 577383 string-value occurrences but 35683 unique values: 66.83MB logical UTF-16 string volume versus 9.52MB unique volume. This is a logical count, not a Cloudflare heap measurement; the engine may already share some strings.

The next candidate reuses immutable strings only and preserves separate mutable objects. Its reviver-based initialisation was rejected by Cloudflare 10021/startup CPU limit before Programme deployment. No normal traffic was promoted. An iterative implementation avoids one JSON reviver callback per value. Eleven data-equivalence, isolation, serialisation and immutable-resource tests pass.

The iterative string-reuse build passed initialisation and all 11 correctness tests, but its n20 p95 was 3100ms versus the original 1755ms limit. It was not promoted; all original distributions were restored.

The current candidate stores fixed data in native compressed binary modules. It uses existing native zlib support, preserves exact values and separate mutable objects, and retains no decoded JSON input cache. Total artifact size falls from 93.61MB to 23.05MB; executable JavaScript is 11.45MB. All 11 equivalence, isolation, serialisation and immutable-asset checks pass. Compressed resources also pass exact decompression-roundtrip checks.

Versions staged: Core `942f3d58-6b28-4ab5-a977-7b085403dc3e`; Programme `fd140d52-bf02-4e93-81d1-7a31900fd9db`; Documents `fcd250d6-5f7b-422a-bb53-3ce24cec7241`. Normal traffic remains on the original serving versions. Finite controller PID 57844 is running the single interleaved n20 control/candidate comparison. Each managed step has a 600-second deadline. No automatic promotion is included; a failed gate restores the original distribution.

## Remaining gates

Keep the original 1755ms anonymous-header p95 gate. Only a passing candidate may proceed to exact-current-feature Chromium/WebKit functional, privacy, expiry/fresh re-entry and complete n20 distribution checks. Reuse the exact 041 feature harness rather than requiring the unshipped 791 layout. Preserve all original per-group p95 gates. Promote only a passing pinned composition; verify live n20 and roll back on any failed live gate. The signed-in physical iPhone remains unverified.

## Access and spending

The historical Workers Observability query 403 remains recorded, but is not a blanket diagnostic blocker: filtered live tails and the production profiling API work with current access. Profiling documentation: https://developers.cloudflare.com/workers/observability/profiling-in-production/

Billing subscription lookup was separately denied 403. All three delivery Workers use Standard. No paid upgrade has been established as a remedy, purchased or agreed. No external messages, native/store changes, new dependencies, private shared HTTP cache or new watchers were created.

Earlier rejection evidence remains in `performance-withheld-evidence-20261102.json.gz`. New source, traces, rejected rows, profiling attempts and the usable raw CPU profile are in `performance-memory-investigation-20261102.json.gz` (50998bytes; SHA-256`f80f4c8a015a0462188a08d69b863aa4d333062c0c1f24179c10fb0a4ef0160f`).

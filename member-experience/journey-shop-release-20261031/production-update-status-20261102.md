# My Timber performance release — 3 November 2026

**DEPLOYED AND VERIFIED at 2026-11-03T15:50:37.171Z.** The six scoped member document URLs now serve the tested precompiled account-independent markup. All12 URL/UI variants match the approved HTML exactly; scripts, styles, images and client behaviour are unchanged. No homepage, purchasing, native/store, member-record, communication or cost changes.

- Worker source: b1b81ed1d3f65556886c9110d79df045f53d8fef; guarded controllers:0beaa61995b7b8d92a074d376b70eab941848c1d.
- Repository:shiftsometimber/shift-core; isolated branch:fix/my-timber-precompiled-documents-20261102. Existing task directory:journey-shop-release-20261031. Source remains **unmerged**; only the specifically delegated guarded deployment was performed.
- Programme:8500f880-3e8a-49ff-b74e-c2cd83c36f27; deployment:beb782ca-c932-44ef-a93a-a5b40f91993b.
- Documents:67958f58-8712-49ec-bcf0-2e513c1fd5d2; deployment:0283d979-046a-4472-a700-c9abfabb2d8b. Both100% normal traffic.
- Actual anonymous default dashboard, new connections,n20:before median1206ms/p954401ms; after normal-traffic median309ms/p95596ms. These measure final server headers, not full-page or physical-phone loading.
- All28 original p95 screen groups pass,560 samples across7screens,fresh/repeat,normal/Slow4G; retained hard limits unchanged. Slow4G Today/Support/More remain above engineering median targets; this repair does not establish universal instant loading.
- Chromium and WebKit functionality, account-switch, expired-session private clearing and fresh sign-in pass with fictional intercepted data. HTTP privacy:48 checks plus63 current resources matched. No production member records or API writes. After deployment:all7screen layouts pass at390px and1440px in both engines (28 live layouts); no duplicate member navigation or horizontal overflow.
- Physical iPhone/Safari unverified. Native build and App Store submission untouched. The unshipped same-account pending-target preview remains a separate client release; actual account-switch and expiry protection remained mandatory.
- Core/Support kept their current releases. During final promotion the guard caught Core e21cdda6's exact17-character sitemap-only change; the first attempt stopped and restored originals. Exact inverse hashing restored the entire original worker, all83 private modules matched, all54 private pass-through cases passed, settings matched, and8 positive/negative guard tests passed before continuation. No competing component was overwritten.
- Routes, schedules, bindings and operating settings protected. Original distributions and provider rollback receipts preserved in performance-precompiled-production-receipt-20261103.json; full qualification evidence retained. No release/watch/test job remains running after finalisation.

## Handover and next action

This lane changed the precompiled member-document runtime, pure assembly, six-URL public presentation manifest and finite guarded release/verification harnesses. Overlap:Programme and Documents only. Core/Support are read-only dependencies. Current source protection retains strict module/config checks and the one exact reviewed sitemap delta.

Existing release manager retains main merge and all other component releases. Do not redeploy earlier rejected candidates or restart completed560-sample qualification. Next independent checks:physical iPhone/Safari and remaining Slow4G screen work. Footer, public-site and other pending components are not claimed deployed by this repair. External support-case draft remains unsent; its old access issue does not block this successful deployment.

---

## Historical checkpoint below — superseded for current deployment status

# Production Update Status — 2 November 2026

**Unresolved. No new candidate was promoted to normal traffic.** Matt reports the signed-in iPhone is still slow. The latest candidate failed the original speed gate, and all original distributions are restored. No performance check or repair remains running.

## Verified serving state

| Service | Version at 100% | Restored deployment |
| --- | --- | --- |
| shift-core | `e6ab12fe-b178-450c-8a1b-9ed909f1d5de` | `4a160116-839b-4511-8307-dfe16bbe011f` |
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
| Internal-encoding control | 1417ms | 2972ms | Original source |
| Internal-encoding candidate | 1516ms | 4154ms | Withheld; restored |

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

## Latest response-delivery investigation

Three finite zero-traffic anonymous probes established the same encoding mismatch: `Accept-Encoding: identity`, original-client gzip allowed in `request.cf`, and Core returned `Content-Encoding: gzip`. Diagnostic version `9482288f-b880-49fa-b9e5-83931aa702b0` was closed and its prior distribution restored.

A narrow Core candidate honours explicit identity before the existing client gzip negotiation. It also retains the separately tested immutable-public-resource guard. Only `worker.js` and `aeo-geo/delivery.mjs` differ; all other module bytes, login/session/identity code, settings, bindings, routes and schedules are retained. All 12 correctness tests pass with Node's required experimental VM-module flag. The initial immutable-test invocation omitted that flag and failed as a harness configuration error; the corrected invocation passed all 12 tests.

Candidate `5f87bdb5-0516-45c4-95f3-55b801acd26d` was measured at 0% normal traffic with n20 control and n20 candidate requests. It failed p95 4154ms against the retained 1755ms limit (simultaneous control 2972ms). This confirms that correcting the encoding mismatch alone is insufficient; it does not establish that the change caused the higher p95. The original Core distribution is restored in deployment `4a160116-839b-4511-8307-dfe16bbe011f`; the managed probe ended successfully. No full browser/privacy/expiry qualification or promotion followed the failed initial gate.

The prepared next action is a technical case to Cloudflare for the specific anonymous incident and runtime gap, using existing support entitlement and authorising no charges or production changes. `performance-cloudflare-support-case-20261102.json` contains the complete recipient, subject, body and exact attachment hashes. Status: **DRAFT — NOT SENT — MATT'S SIGN-OFF REQUIRED**. This is an external-communication approval boundary, not a claim that application engineering or diagnosis is complete.

Additional receipts: `performance-hop-codec-diagnostic.json`, `performance-core-identity-encoding-candidate.json`, `performance-core-identity-encoding-http-qualification.json`. The source preparation, regression tests and guarded stage/probe code are retained. No permanent watcher or performance job remains running.

## Access and costs

Filtered live tails and the production profiling API work with the existing operator connection. The older Workers Observability query 403 is historical and is not a blanket diagnostic blocker. Exact billing subscription lookup was separately denied 403. All three delivery Workers use Standard; no paid upgrade has been established as a remedy, purchased or agreed.

No external messages, native/store changes, new dependencies, private shared HTTP cache or permanent watchers were created. Temporary diagnostics were closed.

Raw source, profiles, attempts, proof receipts and all measured rows: `performance-memory-investigation-20261102.json.gz`, 74409bytes, SHA-256`b2d8d776d7b38791f5e596b57619007d3cfb43ea5996a4db238d161db42f7dbe`. Provider author-email metadata is omitted. Earlier rejection evidence remains in `performance-withheld-evidence-20261102.json.gz`.


## 3 November 2026 — specifically authorised Deploy continuation

Matt's latest Deploy instruction delegates this prepared repair's guarded deployment operation. No active terminal/release was found. This continuation owns only the precompiled-document candidate and a single finite controller in the existing release lane. Preserve all prior failed candidates and current source. Next operation: exact-source/settings/routes/schedules capture, sequential candidate staging, zero-normal-traffic n20 comparison and original-distribution restoration. No normal-traffic promotion until all retained gates pass. Controller/receipt: performance-precompiled-documents-release-20261103.mjs/.json. Source c34277f34e12c53f11d351531698ac2432dce11b; no homepage, purchasing, native, communication or cost changes.
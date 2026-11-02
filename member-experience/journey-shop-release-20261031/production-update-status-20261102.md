# Production Update Status — 2 November 2026

**Unresolved. New candidates withheld; no production promotion in this continuation.**

Matt's signed-in iPhone remains unverified and reported slow. Controlled browser tests do not override that evidence.

## Release state

- Composite source: `7914832e76daa4d81bae4361d94105f7b72b7317`; navigation runtime retained from `e39f31a5277a803d784eb84a5d423f2c1daff2a1`.
- Core candidate `d6a13db3-fde0-42f6-b52c-ea9034c4ede9`, Programme `f324b890-24db-4bb7-9701-579e24c59f63`, Documents `1de51cbd-6931-4076-a18f-2b64d425b61f`: all 0%.
- Current live Core `e6ab12fe-b178-450c-8a1b-9ed909f1d5de`; Programme `c9771e70-bde3-4013-92df-f0698155caca`; Documents `727fe8d9-c51d-4057-b013-f7ed9da36fb9`.
- Support diagnostic `85f2005b-af8f-4361-8abf-26212bb90865` received only anonymous explicitly overridden requests. Normal production source `6a027bed-24f9-4727-aae8-ed45e8f89eab` restored and verified in deployment `dc6492ed-3359-4ed4-8fc4-b279b92a5cd1`.

## Qualification and rejection

6/6 immutable-asset tests, 101/101 HTTP privacy checks, Chromium/WebKit functional checks and expiry/fresh re-entry passed. Normal connection distribution: 280 samples, 20 per tab/visit, 13/14 p95 comparisons passed. **Today fresh p95 failed: 3259 → 4331 ms.** Slow4G was stopped through the managed runner after this known rejection. Partial rows are preserved and are not qualification evidence. No unchanged retry was used to replace the failed result.

The tab change immediately selects the target and shows a neutral layout while keeping private content locked; loading begins alongside mandatory identity checks. Empty layout is not counted as usable. This change has not been promoted.

## Ordinary HTTP and server stages

Anonymous HTTPS from SST Mac, new TLS connection per sample, real final HTTP 200 headers separated from interim 103 hints. No API fixtures, cookies or member-data reads.

| Composition | n | Median final headers | p95 final headers |
| --- | ---: | ---: | ---: |
| Retained original baseline | 20 | 595 ms | 1755 ms |
| Current ordinary production | 20 | 1310 ms | 4063 ms |
| Core immutable repair only, current member services | 20 | 1325 ms | 3725 ms |

The isolated static repair is also withheld under the unchanged original p95 gate. Its simultaneous live control was slow too; this does not prove the static patch caused that delay.

A separate temporary zero-traffic Support diagnostic collected 20 anonymous requests:

| Stage | Median | p95 |
| --- | ---: | ---: |
| Support waiting for Member response headers | 1004 ms | 3512 ms |
| Member response body read | 3 ms | 6 ms |
| Support enhancement (recorded elapsed timing) | 0 ms | 0 ms |
| Nested Core service wait | 160 ms | 1574 ms |

The header wait is the dominant measured stage. These timings do not identify a specific SQL query, CPU limit or provider queue. A recorded 0 ms is not a CPU profile. A local Node VM startup diagnostic is diagnostic only and cannot establish Cloudflare or phone performance.

## Compatibility repair prepared

The current AEO publication preserves the earlier performance modules. Its outer public wrapper rewrites fingerprinted immutable analytics bytes. The narrow patch preserves exact immutable bytes while keeping canonical public analytics/content repairs. Only `aeo-geo/delivery.mjs` differs from the captured current Core graph; the other 91 modules, bindings, settings, routes and schedules are retained. Member/API handlers are unchanged. This later compatibility fault does not explain the user's earlier 06:59 complaint by itself.

## Access and spending

Detailed Workers Observability queries were denied: HTTP 403, code 10104, `workers_observability.api.error.authentication.no_access_to_workers_observability`. Do not retry unchanged. The official telemetry-query API documents `Workers Observability Write` as its accepted permission even for an ad-hoc query: https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/

The existing operator credential needs that capability, scoped to the affected Workers where supported. No keys should be supplied through chat. Exact billing subscription lookup was separately denied 403 code 10000. All three delivery Workers use Standard. No paid upgrade has been established as a remedy, purchased or agreed. Website plan upgrades are separate from Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/

The official Cloudflare status page showed no known service issues at the check: https://www.cloudflarestatus.com/

No external messages, private data writes, native/store changes, paid services or new watchers were created. Managed checks and browser process groups completed or were cleaned up. No repair is running in the background.

## Next action

Restore authorised access to detailed server telemetry, identify the dominant backend operation, then prepare a targeted change. Retain the original privacy, expiry, n20 p95 and rollback gates. Keep the rejected release off. Do not claim the physical phone fixed.

Raw evidence: `performance-withheld-evidence-20261102.json.gz`, 191910 bytes, SHA-256 `936e48aaaf9dff92c9ec443708dfddb4b1fe8afbbfc9db5f53bcdca313ca37e9`. Earlier passing 041 browser evidence and initial release evidence remain historical; they did not establish real-phone acceptance.

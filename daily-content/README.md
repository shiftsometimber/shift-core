# Daily internal website content — prepared 15 October 2026

Status: implemented and locally tested; runtime deployment authorised on
16 October 2026. Not merged, deployed or activated.

The existing 15-minute Worker cron runs `runKnowledgeFlywheel`. Its original
publication-to-knowledge refresh remains intact. The additive job makes at most
one creation attempt per Europe/London day. It reads current public article
owners, retrieves their readable linked primary sources, writes original useful
copy, validates citations and material change, then performs an independent AI
source check. Exact NHS, NHS England, GOV.UK and FSA hosts only; no redirects,
credentials, query strings, source-policy exceptions or arbitrary model URLs.

Successful output is a **private proposal to improve an existing canonical
page**, in the existing Knowledge Hub article queue. It is not another public
URL or a second SEO queue. Evidence, target URL, dates, content hash and actual
status live in the daily run receipt. The private article's original public
target is explicit. Do not publish the `internal-daily-*` slug as a new page;
apply the exact approved change to its canonical owner through the existing lane.

The engine cannot publish, send notifications, assign Matt's byline, mark a
clinical review, change existing pages/dates, or ingest its own drafts into the
Brain. Publication and any required qualified review remain separate. Existing
approved/published knowledge ingestion remains the subsequent learning path;
this is retrieval/grounding, not model-weight training. News and Medicines Watch
retain their existing source correction and review lifecycles; BabyLoveGrowth is
supplementary and unchanged.

No filler is manufactured to satisfy a counter. Missing sources, unsupported
claims, source refusals, insufficient changes and reviewer HOLD leave an honest
held/no-change receipt. An uncertain/crashed attempt consumes that day's slot:
no silent replay or unbounded inference. A prepared target is suppressed for
30 days. Exactly two inference requests at most, through the existing `shift-ai`
gateway, existing model and `collectLog:false`; no direct-provider fallback or
retry. No member or payment data is queried.

The engine defaults off without explicit configuration. This branch stages the
activation authorised by Matt's "Runtime deploy". Matt's 16 October 10:38 BST
instruction cancels exclusive release ownership across all work: the executing
agent must progress the authorised deployment without a separate owner sign-off.
Reconcile this exact additive patch onto the actual accepted release source,
preserve all unrelated changes and pass the required composed gates. Coordinate
actual writes and preserve an in-flight frozen candidate; source preparation on
this isolated branch does not change that candidate or deploy production.
Verify the current shared gateway's $2/day limit, 10/min rate limit, logging-off
and retries-off configuration before setting the three environment controls:

```
DAILY_WEBSITE_CONTENT_ENABLED=true
DAILY_CONTENT_GATEWAY=shift-ai
DAILY_CONTENT_BUDGET_VERIFIED=true
```

The receipt flag is an operational interlock, not independent evidence of the
gateway's configuration. Normal authenticated Cloudflare CLI access recovered
on 16 October. A read-only primary D1 schema check confirmed the existing article
and knowledge tables; it performed zero writes. The separate original gateway
reader needs its existing CI credential; credentials were not read or extracted.

The 16 October preflight passed at 07:23:22 UTC on commit 9de862f: all 13 draft
tests, the original knowledge-ingestion proof, actual configured Worker dry
build, and authenticated gateway proof. The existing shared gateway had its
$2 rolling-day limit, 10 requests per 60 seconds (sliding), authentication on,
logging/export off and retries off. No inference or provider write occurred.
The three enablement variables are now staged in this branch's Wrangler config;
they only take effect after source admission and the guarded production release.
Its original fresh gateway budget check must pass before deployment.

The isolated feature branch has a finite read-only preflight: the original
knowledge-ingestion proof, daily draft tests, the actual configured Worker dry
build, and the original gateway settings reader with exact 10/minute assertions.
It makes no inference request, provider change, publication or deployment. This
does not admit this feature into the #1065 composition or replace its native,
hosted and production gates. The current integrated preparation preserves the
exact 19400eb release-repair candidate tree except for the six daily-content
paths. That repair candidate is still awaiting acceptance; its inclusion here
does not make either package accepted or deployed.

Required live acceptance: exact deployed source; one real private draft with
primary-source reads, independent review and hash bound to its target; overlap
and repeat do not duplicate; failure remains visible; existing public article,
canonical, date, sitemap and member/private data remain unchanged; subsequent
publication only after exact content approval and actual qualified review when
needed; then verify public HTML/discovery and that the published page is usable
in the existing knowledge refresh. An enabled switch or successful cron alone
does not meet acceptance.

Local validation: `node --test daily-content/engine.test.mjs` uses native SQLite
with real SQL transactions and synthetic page/model adapters. It proves local
flow, duplicate prevention, quarantine, failure, URL and budget-route boundaries;
it is not production, actual Workers AI output or clinical acceptance.

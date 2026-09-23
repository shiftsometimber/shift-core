# Public technical SEO audit — 23 September 2026

Status: audit complete within the scope below; findings are not repairs. No production deployment, application edit, merge, database operation, account change, stock/price change or automation change was performed. This file contains public-site observations only. Private Search Console/GA4 performance and task-state results are retained in Matt's private report, not this public repository.

## Evidence and identity

- Main/source baseline read at start: 323f2409c0bd7f719abb05969fe9aeb2a827261b, after the Reta PR793 merge.
- Main audit: https://github.com/shiftsometimber/shift-core/actions/runs/35850884433. Crawl and browser/lab capture jobs completed successfully. Audit code commit dec72091925f9b3034c733b93fe0b7da07bfb736.
- Additional consent/alias/bibliographic checks: https://github.com/shiftsometimber/shift-core/actions/runs/35851872516. Audit code commit 18977c12982d048436b77ed05c4ddd60b2871cf9. Capture completed; inspect findings rather than treating successful execution as a clean website score.
- Crawl artifact 10745322548, ZIP SHA256 87a60d4b43a1e0b85052c6d3a67b22f5c771f5e18b8cea119019dd3c5fcac8ee.
- Browser artifact 10745352342, ZIP SHA256 c69b87989823caf7aab1dc035b6cb3eb52c3fea0aba5995d65d7f43ccc47c06b.
- Consent artifact 10745603523, ZIP SHA256 6435a2e7e98b83ec11d9e74287fe2e4b599db9881900dbd7ce683c928b0fb000.
- Downloaded ZIPs and their internal SHA256SUMS were independently checked. Crawl raw HTML, parsed records, scripts, 11 browser screenshots and four Lighthouse JSON reports are retained. Homepage and Reta mobile screenshots were visually inspected.
- Public deployment fingerprint was unchanged over the main crawl. Audit workflows do not deploy; the audit branch is separate from main.

## Crawl: confirmed results

The live sitemap contained 535 unique URLs. All 535 returned HTTP 200 directly, allowed Googlebot under the fetched robots.txt, had no noindex directive, one static title, one static H1, one meta description and a self-canonical. There were no malformed JSON-LD blocks, duplicate-title groups, duplicate-description groups or exact main-text duplicate groups among the eligible pages checked. Syntax validity is not full semantic/rich-result certification, and exact-duplicate detection does not exclude near-duplicates.

A further 17 one-hop destinations were fetched: 16 HTML destinations and one CSV data endpoint. All returned 200. The resulting 552-response inventory is not an exhaustive test of every external citation, arbitrary query variant, authenticated route or multi-hop public destination. Thirty-six distinct on-site image URLs passed HEAD status checks; this is not a test of every possible image variant.

HTTP apex redirects 301 to HTTPS apex; HTTPS www redirects 301 to HTTPS apex. HTTP www uses two 301 hops. Reta .html and trailing-slash variants redirect 308 to the clean guide. The old medicine-news and pricing-membership aliases redirect 301 to their owners; these are not content-loss findings. A deliberately nonexistent URL returned 404, not a soft-200 shell. Guessed /continuity and /switching-provider also return 404 but were not found as links in this graph and are not classified as broken internal links.

Private member/checkout pages and printable downloads retain noindex and are absent from the public sitemap. Their missing search/social fields are not public SEO failures. Do not remove their protection or bulk-add them to the sitemap.

## Rendered and laboratory findings

Thirty-three anonymous browser contexts completed: fifteen routes at Chromium 390px and 1440px, plus Home/Reta/Mounjaro-cost at WebKit 390px. All reached 200, with no document-width overflow or JavaScript pageerror in this sample. Some knowledge/mental-health hubs have one visible H1 plus a hidden legacy H1; this is cleanup, not evidence of two competing visible headings or an automatic ranking penalty. The member login's hidden headings are outside the indexing scope.

Four single-run mobile Lighthouse laboratory reports (v12.8.2, simulated throttling, not field CWV):

| URL | Performance | SEO | Accessibility | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|
| / | 76 | 100 | 96 | 5.1 s | 0 | 30 ms |
| /guides/retatrutide-uk-guide | 76 | 100 | 90 | 4.8 s | 0.028 | 30 ms |
| /shift-health | 84 | 100 | 89 | 3.9 s | 0.028 | 30 ms |
| /articles/mounjaro-cost-uk | 72 | 100 | 93 | 5.4 s | 0.027 | 40 ms |

The reports identify render delay as the largest LCP phase. The LCP element is the hero image on Home, the first article image on Mounjaro-cost, and cookie-banner text on Reta and SHIFT Health. There are oversized shared logo/image resources and multiple blocking stylesheets. Investigate render dependencies and responsive images in one preview; do not remove consent safeguards, hide content to game LCP, rewrite approved layouts or broadly delete legacy CSS without regression tests. Predicted byte/time savings overlap and must not be summed as a promised gain. These tests do not establish a change from an earlier 3.15-second observation or measure real-user INP.

Contrast failures are real in the sampled lab reports: several small ash-green-on-black (and reverse ticker) text pairs measure approximately 4.37:1, and Mounjaro-cost's green-on-cream byline approximately 3.64:1. Repair only the failing combinations with approved brand colours; do not rebrand or change ticker placement.

## Content findings, not a blanket word-count rule

There are 167 medicine-news detail URLs in the inventory. Fifty-six have fewer than 200 parsed main-content words; this is a triage group, not 56 proven bad pages. The short Bolt ASA report, for example, contains specific decision/date/response context. Do not pad or delete all short reports.

Confirmed defects warranting an editorial repair batch:

1. /medicine-news/glp-1-analogs-research-update visibly contains the unresolved placeholder [journal name]. Public Europe PMC metadata for DOI 10.1016/j.bj.2026.101037 identifies Biomedical Journal and labels the work a Review. The page calls it a new study and does not explain substantive findings.
2. /medicine-news/glp-1-nutritional-paradox does not disclose preprint status in its visible content. Europe PMC metadata for DOI 10.32388/i85yu1 identifies source PPR and publication type Preprint. Label evidence maturity honestly rather than presenting database inclusion as journal peer review.
3. Several examined research reports state only that research exists and may matter to the UK, without saying what it found or what a reader can reasonably conclude. The high-potency-incretin and obesity-treatment-research articles are examples. Assess actual study design/results/limitations and a specific useful SHIFT interpretation before publishing replacements.
4. Eleven news pages display a future Source date relative to this audit. Two checked examples are already-online papers with future print issue dates: MED 42707648 firstPublicationDate 2026-09-06 versus print 2026-10-01; MED 42492687 firstPublicationDate 2026-07-23 versus print 2026-12-01. This is a date-labelling ambiguity, not proof the research was invented or unavailable. Check the other nine before deciding what to change. Distinguish online publication, issue date and SHIFT's own publication date.

No research claims were edited and this audit is not a clinical or legal certification.

## Alias and consent checks

/good-to-talk is a live 200 bridge page, canonicalised to /mens-mental-health, linked from 547 distinct captured source URLs. It does not redirect in the browser. A shared programme-promotion block appears ahead of its mental-health destination link after rendering. Recommend reconciling this bridge with the intended mental-health owner, preferably a scoped permanent redirect after reviewing the existing route decision. Preserve the Good to Talk label and the protected navigation. This is a routing/trust cleanup, not a Google penalty finding.

In fresh Home and Reta contexts, analytics consent defaults denied, advertising consent stays denied, and Google tags do not load before opt-in. Explicit acceptance loads one GTM-PSJVW9XR container and the intended G-Y7BV5KY6RR GA4 tag. Accepted consent persists through reload. Cookie choices opens and Necessary only changes analytics back to denied; the next reload loads no Google tags. Existing _ga and _ga_Y7BV5KY6RR cookies remain after withdrawal/reload, so do not claim consent withdrawal deletes cookies. Reconcile retention/cleanup with the stated policy separately. The harness blocks analytics delivery and non-GET/HEAD requests: attempted tags/consent states are tested, not actual receipt of these test events, every advertising tag, or authenticated health-data payloads.

## Warnings deliberately not promoted to failures

Every static image element in the 535 sitemap pages has an alt attribute; the common PWA icon is decorative with alt="". The third-party missing-alt counts were not reproduced as missing attributes and should not become hundreds of speculative edits. Assess meaningful images separately.

The stats Article lacks datePublished; that is optional completeness work requiring the true publication date, not fabricated freshness. The Organisation logo warnings concern nested editorial-author objects; the publisher's logo is present. Google Article/Organisation guidance does not designate these as universally required fields. A title over sixty characters is not an automatic penalty. Keep useful questions; FAQ markup is not a promise of rich-result eligibility.

## Scope limits

This is a point-in-time public technical/content sample with a full sitemap crawl, not a whole-site human clinical/content review, external backlink audit, Google manual-actions/security-screen review, complete external-link crawl, field CrUX result, physical-device Safari test, purchase/account test or proof of SEO growth. Private connected-search/analytics findings and monitoring status are reported separately to Matt. No repairs are marked complete by this audit.

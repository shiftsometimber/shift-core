# REC-039: editorial trust, source-backed statistics and public discovery

User authorisation: “Sort it all please”, covering search visibility, editorial credibility and strengthening the existing UK statistics resource. Existing approved design and commercial journey stay locked. Outreach remains on hold.

## Changes

- News articles visibly identify their recorded author/SHIFT Newsroom, first publication and separately recorded updates. Source dates retain day or month precision, with missing dates labelled. The original 156 article records/bodies are unchanged. No invented clinician or clinical review.
- Editorial standards explain AI-assisted drafting, editorial approval, source checking, archive date handling and a concrete correction contact. Organisation editorial approval is explicitly distinct from independent clinical review.
- Existing `/research/uk-mens-weight-health-statistics` URL retained. England scope is explicit in the headline, metadata and body. Nine selected NHS England HSE 2024 estimates have linked sources, table references, methods and rounding limits. CSV and SVG chart are generated from one checked data file; the chart uses a zero baseline and warns that measures overlap. This is a compilation, not SHIFT patient results or original survey research.
- Sitemap article dates follow recorded article modification/publication metadata instead of the hardcoded 3 September date. Unknown dates are omitted. The two genuinely edited resource pages have a 13 September update date. Unrelated existing dates remain unchanged.

## Evidence

NHS England: Health Survey for England 2024, published 27 January 2026; adults’ overweight and obesity chapter, tables 1–4 and 9; introduction and data quality statement. Source checked 13 September 2026. Values are rounded estimates from the published chapter, not a new analysis of respondent data.

## Verification and limits

Scoped unit tests cover source date precision, visible/structured publication alignment, preservation of body/chrome, correction routes, sitemap dates and download/table consistency. Production release is guarded against changes to main and current Worker; it captures public baselines and checks all 51 UK article URLs, canonical URLs, noindex absence, sitemap membership, downloads, unchanged Knowledge/SHIFT Health and the existing locked journey gate.

Google Search Console and Bing account data remain unavailable: GSC Wizard reports an expired subscription. No paid subscription was taken and no index/ranking/performance result is inferred from public crawlability. A free webmaster-tool export or working authorised connection is needed for actual indexing/performance baselines.

Production baseline: main 8fb4951578afd8b90e0345e6b271e7655da7a158; Worker 0596c9a3-42f9-4a67-ae3b-8cb311437fec.
Release result will be appended after verified deployment.

## Verified live release — 13 September 2026

Source: `4780ebce1f1918009fb1c58fb6306298c72c245d`; tree: `904b09f3c1ee7b5d4be0187ab4109d1929edf8a5`; Worker: `dc3b60dd-f158-4a97-9d09-1d9984e86969`.

Release run [34762932109](https://github.com/shiftsometimber/shift-core/actions/runs/34762932109), job 103738804070, completed successfully. All 37 scoped tests and existing source gates passed. The production before/after checks passed for locked homepage, Start Here, treatment detail workspace, SHIFT for Work, login, header CSS and Start Here script. Knowledge Hub and SHIFT Health HTML hashes also remained identical.

All 51 UK links returned 200 with matching canonical URLs, no page/header noindex, and sitemap membership. This includes 50 newsroom article routes plus one pre-existing attributed medicine guide; the guide remains on its existing template. Published totals stay 51 UK / 156 overall; first publication dates are unchanged. Sitemap dates agree with article metadata. The CSV and SVG downloads match the reviewed source artifacts exactly.

Actual browser checks verified the statistics headline/cards, loaded chart, data table, article byline/publication/source date precision and working editorial-process link. The approved five-link header remains visible; neither checked desktop page overflowed horizontally. No new mobile-device test or Google/Bing indexing claim is made. The unrelated pre-existing act2b-one-shot workflow validation failure remains outside this release; this is a scoped release success, not a claim that every repository workflow is healthy.

Main is to be fast-forwarded to a documentation-only child of the verified source with `[skip ci]`, avoiding an unrelated second deployment.

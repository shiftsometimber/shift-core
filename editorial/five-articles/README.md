# Five agreed article improvements — 19 September 2026

Baseline: production main 7ed49380288e9c1cd91fce49e63e81be9ecd94f6. Exact scope: the two Mounjaro comparisons, NHS weight-loss medication pathways, mental health and weight, and the existing England statistics resource. No new public URL, product feature, clinical decision, payment/stock/authentication/Passport change or customer-data write.

## What is improved

- Mounjaro versus Saxenda: removes unsupported 10/10-style ratings and an irrelevant Mounjaro/semaglutide head-to-head reference; presents separate placebo-controlled studies with populations, dose, duration, funding and limitations. Adds daily/weekly practical questions, accurate adult Saxenda stopping-rule timing, urgent pancreatitis advice and a prescriber-owned switching handover.
- Mounjaro versus orlistat: separates mechanisms and prescription versus pharmacy strengths; distinguishes total percentage weight reduction from additional kilograms versus placebo. Adds meal-time practicalities, vitamin/interaction review, stopping criteria and no self-directed combinations.
- NHS pathways: states the September 2026 position, the June 2026 England primary-care expansion and future April 2027 phase; distinguishes named qualifying conditions, specialist referral, diabetes and cardiovascular indications. Separates UK nations and replaces the false-precision generic finder with an appointment checklist. Keeps old useful section anchors.
- Mental health: expands a thin overview with eating-disorder concerns independent of body size, medication review without abrupt stopping, a usable GP conversation script, optional non-punitive tracking and correctly scoped urgent help.
- Statistics: retains the same nine HSE 2024 values and unchanged CSV/SVG. Adds precise claim wording, percentage-point versus percentage interpretation, England versus UK scope, uncertainty, measurement timing and the difference between population means and personal targets.

## Source and editorial boundaries

Sources are linked next to factual claims, with a numbered source list. Medicine particulars are from UK manufacturer SmPCs and NHS medicine information; efficacy figures are from the original SURMOUNT-1 and SCALE publications, not a new direct comparison or men-only effectiveness estimate. The urgent GLP-1 warning is MHRA's 29 January 2026 update. England commissioning details and dates come from NHS England and NHS ICB publications; other UK nations are not assigned England's rules. HSE data retain their actual survey year and publication date.

NICE/GPhC adaptation restrictions and issue #743 are unchanged. No NICE API content was imported and no pending licence or endorsement is asserted. The NHS implementation sources are identified as NHS sources, not a fabricated NICE permission.

Editorial responsibility is SHIFT Newsroom with an explicit AI-assisted label. No named clinician sign-off, reviewedBy claim, efficacy score, review stars, current stock promise or prescription purchase advertisement is added. The source check/editorial update is not a claim of independent clinical review or a new survey.

## Implementation

Use the existing editorial-resources response authority, not a second competing page origin. Five explicit canonical paths and existing trailing-slash/.html handling only; replace main content and page-specific metadata while preserving public header/footer and shared scripts. Remove only the obsolete in-page NHS finder script. Metadata parsing handles both attribute orders, removes stale duplicate Article/FAQ metadata and keeps an unambiguous valid original publication date when present. There is one current Article plus breadcrumb graph; missing original publication dates stay missing.

The existing sitemap-date writer applies only these five real revisions after its normal date handling. URL count and other dates stay unchanged; the older generic statistics resource date cannot overwrite the real article update. Downloaded statistics data retain their prior check date and exact bytes. Editorial standards behavior is retained.

## Acceptance

Read-only PR workflow: unit tests, existing editorial/public/SEO/newsroom tests, exact Worker compilation, fresh capture of all five live source documents plus unaffected controls, and Chromium at 390/1440 widths using the captured public shell and live public assets. Network interception prevents external tracking and form submissions. Check H1/main/canonical/schema uniqueness, body source equality, source anchors, contrast, horizontal overflow, source-list navigation and JavaScript-independent reading. Retain ten screenshots and raw results for inspection.

Production is separate: controlled existing promotion, preserved-site gates and a fresh read of the five actual deployed documents/downloads/sitemap. Successful preview transformation is not live publication; a source-review date is not a claim that every third-party source allows automated access. No security or preservation check may be disabled to obtain a green result.

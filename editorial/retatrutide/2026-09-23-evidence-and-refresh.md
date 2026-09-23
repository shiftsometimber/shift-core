# Retatrutide UK — evidence, editorial candidate and release register

Prepared: 23 September 2026, Europe/London.

**Status: editorial proposal and verified baseline only. This file does not implement or publish a website change. Clinical/compliance review and an actual site preview remain outstanding.**

## 1. Authority and protected scope

Repository: `shiftsometimber/shift-core`. Branch base: `4c014edce24bd9a37645dfbd6bad204ed3270091`. The inspected production workflow is `35789197932`, completed successfully on 22 September 2026. `worker-entry-v6.js` identifies `projectshift.pages.dev` as the public Pages upstream. The editable source of this guide and a complete current raw-HTML diff still need to be established before implementation; an upstream URL alone is not a source backup.

Keep the existing URL: `/guides/retatrutide-uk-guide`.

No edits to account/member data, authentication, checkout, prices, stock, theoretical-stock tests, navigation, ticker policy, other articles or deployment configuration. Do not create a second generic retatrutide landing page. No treatment activation, preorders or medicine-specific waiting list. Do not merge this file as though it were a runtime repair.

## 2. Verified baseline and completed actions

Sources: authenticated GSC Wizard URL Inspection, live on-page crawl and Search Analytics, run on 23 September 2026.

| Check | Observation |
| --- | --- |
| HTTP and canonical | 200, no redirect, self-canonical, indexable |
| Heading | One H1 |
| Existing title | Retatrutide UK: Evidence, Availability, Risks and Alternatives |
| Title / description | 62 / 148 characters, as reported by the crawler |
| Page content | 3,421 words reported; not an editorial quality score |
| Images | 4 images; 1 missing an alt attribute. The affected element was not identified by the tool. |
| Structured data | Article, MedicalWebPage, FAQPage and related entities detected; no parser issues reported. This does not verify authorship, claims or rich-result eligibility. |
| URL Inspection | PASS; Submitted and indexed; indexing and robots allowed; successful mobile crawl |
| Last recorded Google crawl | 24 August 2026, 12:46:25 UTC — not a fresh Google crawl today |
| Search Analytics period | 24 August–20 September 2026; settled GSC data, Pacific-date reporting |
| Page performance | 3 impressions, 0 clicks; average position 2.3333 across those three impressions only |
| Matching query/page report | No reportable rows for retatrutide / whole-word reta / LY3437943. Do not infer zero demand or successful head-term ranking. |
| Context pages | `/explore-knowledge` and `/glp1-knowledge-centre` both returned 200, self-canonical and indexable in the same crawl. |

The guide's reported 118 ms fetch is a single crawler response-time observation, not LCP, Core Web Vitals, a user load time or proof that a previous performance issue is fixed. A 62-character title is not a Google penalty; the proposed rewrite is for clarity, not to satisfy an arbitrary hard limit.

**Completed configuration:** created the GSC Wizard topic cluster `Retatrutide UK - evidence and availability`, ID `5d7a1a15-3d6e-462f-92d5-ff6173a0b9d0`, with `retatrutide`, `reta uk`, `reta weight loss`, `reta injection`, `reta jab`, `reta peptide`, `ly3437943`. These are tracking terms, not instructions to promote a product or repeat keywords in copy. The existing `Future medicines UK` cluster remains unchanged; overlapping clusters must not be added together as unique traffic.

**Existing monitoring preserved:** the guide was already in the Indexing Tracker, ID `6171cb0b-2733-4676-b24f-d9ee2708da78`, with indexed status and eight prior checks. No duplicate tracker or new scheduled task was created. This does not request or force indexing.

## 3. Proposed metadata — not yet applied

- Title: `Retatrutide UK: Availability, Trial Results & Safety` (52 characters).
- H1: `Retatrutide (Reta) in the UK: what we know so far`.
- Description: `Is retatrutide available in the UK? Check its approval status, clinical trial evidence, known safety concerns and what remains uncertain.` (137 characters).
- Canonical: preserve `https://shiftsometimber.co.uk/guides/retatrutide-uk-guide`.
- Preserve the original publication date. Set a modified date only when a substantive revision is actually published. A source-check date is not clinical sign-off.

## 4. Proposed opening and replacement editorial blocks

The following is a candidate for review and integration, not a blind replacement of the entire existing article. Preserve accurate, useful existing material and reconcile duplication against the actual source.

### Is retatrutide available in the UK?

Retatrutide, often called Reta online, is an investigational medicine. The MHRA's 24 July 2026 warning states that it is not authorised for use in the UK and warns against products sold as retatrutide. It is not an approved UK treatment you can order from SHIFT. [R1]

### What is retatrutide?

Lilly is developing retatrutide as a single molecule acting on GIP, GLP-1 and glucagon receptors. It is therefore described as a triple receptor agonist. “GLP-3” is an informal, scientifically inaccurate nickname, not the name of a newly recognised hormone or an approved medicine class. [R2]

### What do the trial results show?

In TRIUMPH-1, involving adults with obesity or overweight and a weight-related condition without diabetes, Lilly reported average weight loss of 28.3% at 80 weeks in the 12 mg research arm, compared with 2.2% for placebo, using an efficacy estimand. That analysis estimates outcomes assuming continued study treatment without prohibited weight-management treatments. [R3]

The same announcement reported 25.0% versus 3.9% using the treatment-regimen estimand, which includes outcomes regardless of adherence or use of prohibited treatments. These are two analyses of the same trial, not contradictory promises. Trial dose labels identify study groups; they are not instructions for use. [R3]

July's manufacturer-reported TRIUMPH-2 and TRIUMPH-3 results involved different patient groups: people with type 2 diabetes, and people with severe obesity and established cardiovascular disease. They should not be blended with TRIUMPH-1 into a single expected result for everyone. Their detailed publications and subsequent evidence need separate checking. [R4]

### What about side effects and unanswered questions?

The TRIUMPH-1 announcement reported nausea, diarrhoea, constipation and vomiting, as well as altered skin sensations. In the highest research-dose arm, 11.3% discontinued because of adverse events, compared with 4.9% receiving placebo. A headline weight-loss figure cannot establish tolerability for an individual. [R3]

TRIUMPH-3 did not establish a definite reduction in major cardiovascular events: reported confidence intervals crossed the point of no difference. Avoid claims that retatrutide is proven to prevent heart attacks or strokes. [R4]

### When could it launch, and what will it cost?

Lilly's July announcement described a planned US regulatory submission in the first quarter of 2027. That is a company plan for an application, not approval, and not a UK release date. This review has not verified a confirmed UK launch date or UK launch price. Do not use prices from sellers of unapproved products as a forecast. [R4, R1]

### Is it better than Mounjaro or Wegovy?

Separate trials cannot by themselves establish which treatment is best for a particular person. A fair comparison needs the study population, duration, analysis method, comparator and safety findings, not just the largest percentage. This guide should explain that distinction, rather than recommend switching to an unapproved medicine.

### The SHIFT take

The useful question is not simply “How much weight did a trial report?” It is also “Who was studied, how many people stopped treatment, what remains uncertain, and what would this mean for someone like me?” Our editorial aim is to make those questions easier to answer without turning research coverage into a sales pitch.

## 5. Page structure and search intent

Use one substantial evergreen guide to answer UK availability, approval, trial findings, risks, price uncertainty and the meaning of Reta. Explain the evidence before discussing comparisons. Keep plain-English questions readers actually need; do not create a page for every keyword variant.

Potential later content is conditional, not approved for publication here:

| Intent | Destination and condition |
| --- | --- |
| General retatrutide / Reta UK | Existing guide, preserved URL |
| A newly published trial or regulator decision | Dated, source-led news item only when there is an actual development; link back to the guide |
| Retatrutide versus tirzepatide or semaglutide | Start with sections in the guide. A separate comparison requires distinct useful depth, verified evidence and a cannibalisation check. |
| Muscle retention / everyday function | Expand only where evidence supports the exact claim; do not equate triple-agonist action with a muscle-building or myostatin-blocking treatment. |
| UK price or release date | Answer the uncertainty directly on the guide; no invented price or countdown page |

Proposed contextual discovery routes are the existing Knowledge and GLP-1 knowledge hubs, plus relevant factual news. Inspect actual existing anchors first; avoid duplicate cards or sitewide exact-match footer links. Use normal crawlable anchors with descriptive text. [G3]

No dedicated retatrutide conversion funnel in this change. Any wider SHIFT or My Timber signposting must be factually verified and reviewed in context, not used as a medicine-specific waiting list in disguise.

## 6. Editorial and technical safeguards

The joint ASA/MHRA/GPhC warning of 18 June 2026 explicitly covers promotion of pipeline medicines, including waiting lists. Calling content educational does not automatically take a commercial page outside advertising rules. Review the whole page, links, imagery and calls to action. [R5]

Use transparent, accurate authorship and primary citations. Do not invent a clinician or imply that this draft has been clinically reviewed. Google advises against exaggerated headings, fabricated release answers and changing dates just to look fresh. [G1]

Google retired FAQ rich results from 7 May 2026. Keep useful visible questions; do not promise expanded Google listings or add schema for that purpose. Accurate existing FAQ markup need not be removed purely for this project. Google also states that llms.txt does not affect Google Search visibility or ranking. Neither is the growth case here. [G2]

Preserve valid Article/MedicalWebPage information and reconcile it to visible content. No Product/Offer/AggregateRating markup for an unavailable investigational medicine. Verify existing author/reviewer entities rather than assuming syntax validation proves them.

The earlier chat reported the phrase “TRIUMPH Shift Programme”. Treat it as a carried-forward item to locate and verify in the actual source; the current crawler did not return that text. The intended research name is the TRIUMPH programme. Any correction must be local to the research passage, not a global brand replacement.

Locate the missing-alt element before changing it. If decorative, an empty alt may be correct; if informative, describe the actual image. Do not add guessed retatrutide branding or an invented product pen.

## 7. Acceptance criteria and open gates

All gates below remain OPEN unless explicitly marked otherwise:

1. Source: identify the guide's editable authoritative source, pin its commit/deployment and capture raw before HTML. Do not reconstruct production from an old ZIP or add a second competing source.
2. Editorial: reconcile proposed blocks with existing content, check current primary sources again, record actual qualified review and commercial/compliance review. No unsupported availability, superiority, muscle-preservation, safety or NHS-access claims.
3. Implementation: one scoped preview; one H1 and canonical; metadata and visible content agree; preserve existing publication date and useful anchors. The in-place guide refresh has an expected sitemap URL-count change of zero; record the actual complete before/after count.
4. Browser evidence: actual desktop Safari and mobile viewport checks, article images, reading order, links, consent controls and no horizontal overflow. A crawler result is not a browser test.
5. Regression: preserve header/drawer/ticker policy, homepage, Programme, SHIFT Health, Start Here, member login and purchase surfaces. No changes to stock, prices or data.
6. Release: Matt's preview approval, then one production release with source identity, diff, checksums and live verification. Do not mark complete when only this documentation is merged.
7. Measurement: record the real publication date; compare like-for-like settled 28-day page data. Monitor UK queries separately when there is reportable data. Do not celebrate average position from three impressions or claim a causal uplift without evidence.

## 8. Update trigger

Lilly's 15 September 2026 announcement schedules retatrutide data at EASD, 28 September–2 October 2026. On 23 September this is a future presentation, not an already published result. Recheck the actual release and publication when available. [R6]

Recommended future workflow: primary-source change detected → evidence reviewed → proposed diff → clinical/compliance check → scoped preview and approval → publication → truthful modified date and GSC annotation. Existing search/index tracking is not an automatic clinical publishing system. No new scheduled task was created in this run.

## Sources

R1 — MHRA, UK retatrutide warning, 24 July 2026: https://www.gov.uk/government/news/no-summer-shortcut-for-safe-weight-loss

R2 — Lilly, retatrutide explainer, reviewed July 2026: https://www.lilly.com/news/stories/what-to-know-about-retatrutide

R3 — Lilly-issued TRIUMPH-1 announcement, 21 May 2026; manufacturer report, not represented here as a peer-reviewed paper: https://www.prnewswire.com/news-releases/lillys-triple-agonist-retatrutide-delivered-powerful-weight-loss-in-pivotal-phase-3-obesity-trial-302778859.html

R4 — Lilly-issued TRIUMPH-2/3 announcement, 23 July 2026; manufacturer report: https://www.prnewswire.com/news-releases/lillys-triple-agonist-retatrutide-successful-in-two-additional-phase-3-obesity-trials-delivering-significant-improvements-in-weight-and-a1c-302832674.html

R5 — ASA/MHRA/GPhC pipeline-medicine promotion warning, 18 June 2026: https://www.asa.org.uk/news/warning-on-promoting-newly-licensed-prescription-only-medicines-and-unlicensed-medicines-for-weight-management.html

R6 — Lilly EASD announcement, 15 September 2026; primary search result retrieved, full-page retrieval unavailable in this run: https://investor.lilly.com/news-releases/news-release-details/lilly-present-new-data-foundayo-retatrutide-and-eloratzp-easd

G1 — Google people-first content and authorship guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content

G2 — Google Search documentation changelog, May and June 2026 FAQ/llms.txt entries: https://developers.google.com/search/updates

G3 — Google crawlable-link guidance: https://developers.google.com/search/docs/crawling-indexing/links-crawlable

Evidence limitations: no current raw-HTML archive, no rendered browser test, no independently verified clinical reviewer, no runtime implementation, no public preview, no production release and no ranking improvement established in this run.

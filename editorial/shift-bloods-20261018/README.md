# SHIFT Bloods launch editorial — 18 October 2026

Three complete drafts, approximately 2,450 words in total. No article has been published by this release. The owner's “Publish all” instruction was applied to the completed Bloods marketing pages; these new article versions remain unapproved drafts. Use the existing audited article-publication workflow when an exact version is approved. No new automation, email, social distribution or clinical-review claim.

## Release order and distinct jobs

1. Refresh existing `/articles/weight-loss-blood-tests` first. Preserve row identity, URL, original publication timestamp and other valid database fields. Record the actual update date. Do not import an old snapshot over a newer live edit.
2. New `/articles/upper-arm-blood-collection`: explain the collection option and the practical barrier it addresses. Planned canonical only; the route is not live.
3. New `/articles/understanding-blood-test-results`: explain reports and responsibility for next steps. Planned canonical only; the route is not live.

JSON candidates follow the repository's editorial body/source convention. They intentionally do not include a publication timestamp, invented reviewer or live status. `draft-manifest.json` fixes the reviewed Markdown versions by SHA256. The HTML file is a self-contained reading copy with the complete text, not a public Site.

## Current article check and correction rationale

The live article was read on 18 October 2026 at `/articles/weight-loss-blood-tests`; it displays publication on 16 October 2026. Its current HTML is retained privately in the release working directory as `blood-tests-current.html`.

The replacement removes:

- Universal “clinicians start with” panel recommendations and the unsupported application of a NICE paediatric investigation list to all adult weight-management patients. Current NG246 adult recommendations 1.9.16–17 concern assessment and management of comorbidities; they do not establish the advertised universal bundle.
- HbA1c described as 6–8 weeks; replacement uses approximately 2–3 months, supported by current NHS information.
- Blanket fasting advice for lipids; NHS guidance says most people do not need to fast.
- A numeric unexplained-weight-loss threshold that could encourage waiting before seeking assessment.
- Unsupported first-hand clinical experience, an attributed Matt quotation, implied commissioned clinical assessment/prescribing and booking language.

The new text keeps symptoms, preparation and follow-up ahead of a commercial CTA. It explicitly describes proposed panels, trial collection and closed ordering.

## Internal links to apply with approved publication

Each draft already links to the live Bloods comparison. After both new articles are verified live:

| Source | Location | Anchor and destination |
|---|---|---|
| Bloods hub | After collection overview | “Upper-arm collection explained” → `/articles/upper-arm-blood-collection` |
| Bloods hub | Results step | “What happens after your results?” → `/articles/understanding-blood-test-results` |
| Baseline, Advanced, Complete detail pages | Before final CTA | “Blood tests and weight management” → retained existing article |
| Existing article | Collection section | “Upper-arm collection explained” → new collection article |
| Existing article | Results section | “Understanding your report and next steps” → new results article |
| Collection article | Near final CTA | “What happens after the results?” → new results article |
| Results article | Panel comparison paragraph | “How upper-arm collection works” → new collection article |

Do not add links to unpublished URLs. Do not change the homepage, Start Here or the wider organic-growth release schedule. Keep each article in the ordinary article index, sitemap and appropriate Bloods/Health discovery once published. Use Article metadata, not Product offers, medical-review badges or fabricated star ratings.

## Evidence and editorial checks

- Primary NHS sources support preparation, general test categories, cholesterol testing, kidney blood/urine assessment, HbA1c timeframe, unexplained weight loss and online-record limits. Source links appear next to the relevant statements.
- PLOS ONE paper: Dasari et al., published 29 May 2024, DOI 10.1371/journal.pone.0304155. Study setting and device-specific limits are explicit. No study success rate or pain finding is transferred to SHIFT's unconfirmed device.
- NICE current adult assessment text was available in the official search result; direct page retrieval returned 403. No unseen full guideline or UK-wide commissioning policy is claimed.
- NHS kidney page carries last review 22 March 2023 and a passed scheduled review date. Only basic blood/urine assessment information is used, with no diagnostic thresholds or treatment recommendations.
- All three drafts use “specialist testing partner”; no supplier promotion or unconfirmed exclusivity. There are no final prices, guaranteed times, sample-volume instructions, device-specific steps, treatment instructions, clinical outcome promises or live ordering claims.
- Independent clinical review has not occurred and is not claimed. Operational service/device facts need reconfirmation before the exact approved drafts are released.

## Publication acceptance

Fetch the current existing article before replacing its body; stop on intervening changes. Render candidates through the existing article shell, check small and large screens, all internal/external links, canonical/title/description, author/dates, visible trial status, and absence of order forms. Verify actual public pages, article index and sitemap after release, then retain receipts. Do not label drafts as published.

## Publication copy v1 — exact review preparation

The three article bodies retain all substantive prose and links from the18October drafts. Only footer preparation/publishing instructions are removed, with the existing general-information, source-date, UK-context and clinical-review limitations retained. The complete self-contained review includes title, search title, summary, body and exact Markdown hashes. Original draft hashes are retained in the manifest. Publication is still unapproved; neither this source preparation nor the review copy authorises publication. Existing article identity/original date and current-source/owned rollback/public-verification controls remain required.

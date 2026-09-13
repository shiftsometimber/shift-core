# REC-037 — UK newsroom depth release

Released 13 September 2026. Owner requested 50+ credible UK articles from the preceding 18 months and explicitly prioritised quality and trust over volume.

## Published result

28 original UK archive articles were prepared against primary UK sources. Exact event IDs: 283 and 310–336. Event 283 reused the existing cholesterol source record; no duplicate story was created. Each package passed source-host, date-window, topic, evidence, unique-slug and website-destination checks. Each was approved in the signed-in owner HQ interface; the final publication preview contained exactly those 28 IDs. No unrelated drafts were approved.

Live newsroom: https://shiftsometimber.co.uk/shift-newsroom

51 UK articles, 105 international articles, 156 total. UK plus mental health returns 21 matching articles. Clear filters restores all 156. The browser showed no root overflow. The original source period is distinct from the 13 September archive review and actual SHIFT publication dates. NIHR month-only dates remain month-only. SEO dates now match the first audited publication, not preparation or historical source dates.

The 28 articles cover diabetes prevention/remission, mental-health support and research, ADHD, UK-nation service access, weight and wellbeing surveys, men’s cancer screening/treatment research, exercise support, employment and medication reviews. Similar announcements were combined; unavailable, out-of-window and overlapping leads were held. See editorial/UK-NEWSROOM-STANDARD.md.

## Runtime and verification

Deployed source: `06909c887572ef866a4453fd7ca2a79ab207bf92`.
Deployed tree: `b4d01a8152fb89081280fb281111c25d240199c9`.
Worker version: `0606c30d-ddab-4db7-87e5-a5fca54e5dbf`.

Final release [run 34748864167](https://github.com/shiftsometimber/shift-core/actions/runs/34748864167), job 103701604692, passed: 30 targeted tests, existing navigation/auth gates, before/after preservation checks, and all 28 public article bodies, source links, canonical URLs, metadata and sitemap entries. The publication-date alignment completed in run 34748787586; its first public checker rejected an equivalent source URL with a normalised trailing slash. The final checker compares that equivalent URL form and verifies the actual rendered source link.

A prepared-record visibility defect was fixed: ready-for-review, approved, held and publication-failed records remain visible for explicit decisions even if discovery relevance changes. Discovery filtering for other records and all authentication, verification, approval and publication gates are retained. The first 13 approvals preceded this repair; the remaining 15 followed it. No bulk approval of unrelated items occurred.

The article template no longer repeats an identical UK-meaning paragraph already present in the reviewed body. A regression test covers both repeated and distinct paragraphs; the live REDUCE article shows the paragraph once.

Public Pages, approved header/menu, Start Here quiz and treatment-selection journey, stock, pricing, medicines, payments, employer activation and authentication were preserved. No schema migration, new scheduled task, member message or social post. Website-only destinations remain medicine_news, knowledge_links, search and sitemap. Main reconciliation adds this record to the exact verified source with [skip ci].

Initial preparation run: 34747678464. Review visibility release: 34748489374. Read-only diagnostic runs investigated compiled code and API mapping; the first script-download request used an incorrect endpoint (405), corrected in subsequent successful diagnostics. The unrelated pre-existing act2b workflow validation failure is not represented as passing.

## Evidence

- SHIFT-Newsroom-51-UK-Live.jpg
- SHIFT-Newsroom-51-UK-Live-Checks.json
- GitHub artifact REC-037-UK-depth-evidence from the final release

No claim is made of clinician review, guaranteed rankings, indexing or earned backlinks.

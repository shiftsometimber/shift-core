# REC-036 — UK Newsroom archive, 13 September 2026

Matt requested a substantial UK-only backfill from the preceding 18 months, focused on weight loss, mental health and related UK services. This release preserves the approved website and extends the existing Newsroom.

## Production lock

- Runtime source: `4a5af46c18ac1534a8cf5f4782d1af516e4b5bdf`.
- Runtime tree: `d9ed5a4a5cf1db8f9a4cc9c42aeae3ecf644d003`.
- Worker version: `9b599e85-6f7b-4de3-bec2-1751578f7efc`.
- Final release and metadata correction: https://github.com/shiftsometimber/shift-core/actions/runs/34746087608 — passed.
- Initial source release and draft preparation: https://github.com/shiftsometimber/shift-core/actions/runs/34745573473 — passed.
- Pre-release main was `8bb2331379cf3cd60d8c9aecf445e75f46b43f44`. Main reconciliation adds only this record to the verified runtime, with `[skip ci]` to avoid redundant deployment and unrelated migrations.
- Public Pages fingerprint remains `1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0`; the REC-034 Pages deployment and REC-035 approved newsroom layout remain authoritative.

## Published content

Prepared 16 original articles from primary UK public-authority, university and charity sources. Source window searched: 13 March 2025–13 September 2026. Selected original reports span 30 April 2025–10 August 2026, with later updates identified where relevant. Existing published Wegovy-tablet article 236 was retained rather than duplicated.

New events 295–309: 15 articles, approved individually in the authenticated owner HQ session. The broader approval preview included 11 other unfinished/unreviewed candidates; they were not included. The subsequent publication preview contained exactly these 15 articles. HQ confirmed **15 published, zero failed**.

Destinations are `medicine_news`, `knowledge_links`, `search`, `sitemap`. No medicine-registry patch, stock/pricing change, member notification or social distribution was selected. Draft preparation performed no approval or publication.

| Event | Coverage | Original report |
| --- | --- | --- |
| 295 | UK less-processed-food trial | 4 August 2025 |
| 296 | Great Britain weight-loss medicine survey; Northern Ireland excluded from study | 8 January 2026 |
| 297 | NICE support after weight-management treatment, corroborated by NHS England guidance | 5 August 2025 |
| 298 | NHS England phased tirzepatide access | 2 April 2026 |
| 299 | Men and NHS talking therapies in London | 9 June 2025 |
| 300 | Tower Hamlets round-the-clock mental-health pilot | 17 July 2025 |
| 301 | England community mental-health expansion; updated 10 September | 5 August 2026 |
| 302 | England men's health strategy | 18 November 2025 |
| 303 | Wales mental-health strategy | 30 April 2025 |
| 304 | Scotland mental-health progress report | 11 June 2025 |
| 305 | Northern Ireland obesity-management first phase | 29 June 2026 |
| 306 | England Adult Psychiatric Morbidity Survey; fieldwork 2023–2024 | 27 November 2025 |
| 307 | UK orforglipron authorisation | 10 August 2026 |
| 308 | Scotland population-health and prevention frameworks | 17 June 2025 |
| 309 | Mental Health UK workplace burnout survey | 16 January 2026 |

Archive labels show original source dates and the current SHIFT review. Articles distinguish survey periods from publication dates, satisfaction from recovery, plans from operating services, UK authorisation from access, and national service boundaries. The withdrawn autism estimates from the England survey are excluded. The NICE web page could not be fetched in full; the narrow support-after-treatment statement is corroborated in NHS England's current primary guidance, without reproducing unverified duration details.

## Verification and correction

- Live hub: https://shiftsometimber.co.uk/shift-newsroom — **23 UK + 105 international = 128** cards; all 15 new article URLs present.
- Browser interaction: UK filter returns 23; UK plus mental-health filter returns 8 and all visible cards match both conditions; Clear restores 128.
- All 15 new URLs found in the live sitemap. Representative article body, original date, headings, source links, canonical, description and Article schema checked in the actual browser.
- Final SEO inspection caught the HQ partial SEO form replacing the SHIFT publication date with the source date. `radarSeoPackage` now preserves omitted metadata from the stored package. A regression test exercises a partial title edit while retaining publication date and author.
- An audited correction changed only the 15 archive packages' SEO publication dates and author, using their first recorded publication-history timestamps. Article bodies, sources, source dates, destinations, review times and published statuses were preserved and compared. The corrected live schema shows 13 September 2026 and SHIFT Newsroom.
- Exact trusted UK authority/primary-charity relevance was extended, with tests keeping unknown/global sources excluded. Mental-health hyphenation, talking therapies and burnout are recognised by topic filtering.
- Before/after public hashes match for home, Start Here, SHIFT for Work, sign-in, selected-treatment page, shared header CSS and Start Here script. Locked Start Here heading remains “Based on your answers, this could perhaps work for you…”. No layout, Pages, commerce, clinical, payment or employer activation changes; no schema migrations.
- Dedicated newsroom/editorial/navigation/security gates passed. The pre-existing unrelated `act2b-one-shot` workflow still reports its separate no-jobs failure; it is not the release gate.

Actual live desktop screenshot: `SHIFT-Newsroom-UK-Archive-Live.jpg`. Browser evidence: `SHIFT-UK-Archive-Live-Checks.json`. These are browser checks, not physical-device Safari coverage. This is a one-off archive backfill; no new recurring automation was created.

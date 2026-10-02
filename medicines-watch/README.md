# Treatments: Medicines & Peptides Watch

Public route: `/treatment-centre/medicines-watch`. Entry point is Treatments only. No member or My Timber integration. This is a continuously expanding selected weight-management reference, not an exhaustive medicine database, prescribing tool, stock service or recommendation ranking.

`data.mjs` is the reviewed editorial snapshot. Sources link to exact primary documents; provider information is explicitly labelled. Authorisation, trial stage, private supply and NHS England access are distinct. There are no inferred launch prices or cross-trial efficacy comparisons.

The existing Worker cron calls `checkSources`; atomic reservations limit each source to one attempt per hour. Checks have an eight-second deadline (20 seconds for exact NICE guidance URLs), 2 MiB response limit and concurrency of three. The checker fingerprints validated document text, not page furniture, and retains separate attempt, successful retrieval and failure times. It never edits the catalogue, approves a baseline, emails anyone or advances the editorial review date. Missing fingerprints, inaccessible sources, changed/withdrawn documents, incomplete scans and reviews older than seven days are visible states. Extra evidence links without a supported automated check are labelled accordingly.

`/v1/medicines-watch/health` is a SELECT-only public health endpoint containing no account data. Public page requests do not initialise storage, scan sources or call the older Radar publication handlers. Deployment initialises missing observations in the dedicated table; it cannot overwrite scheduler history for an unchanged URL.

When updating a reference:

1. Retrieve and read the original regulator, NHS, product-information or trial evidence. A changed hash or successful HTTP response alone is not a review. Verify the UK position, indication and access separately; do not infer availability from authorisation.
2. Update only supported wording, exact source links, and the affected source's `reviewedAt` / `reviewedFingerprint`. Use `fingerprintSource` on the actual complete retrieved response. Never pin an error page or accept the monitor's new hash without reading the changed evidence. Individual source dates can override the default; do not advance `REVIEWED_AT` for the whole catalogue after reviewing just one source. Update the affected medicine's `reviewedAt` explicitly when its wording changes.
3. Do not describe AI/source research as clinical approval. Follow the site's editorial and clinical governance process for claims needing qualified review. Leave uncertain changes visibly awaiting review.
4. Run `node --test medicines-watch/*.test.mjs`, the existing affected release gates and the guarded production workflow. `verify-live.mjs` proves actual serving, source-check execution, filters and read-only behavior. Use the live public browser to verify the Treatments entry and mobile layout.

Public preservation accepts only the exact marked Treatments entry. The other ten public/login responses stay byte-exact, and all pre-existing Treatments bytes must survive. Source availability can legitimately be delayed; the release proof must not conceal that or require fake all-green evidence.

## Coverage expansion and discovery

The live catalogue contains 6 detailed references plus 56 concise industry summaries in `industry.mjs`: 62 medicines/programmes, with 50 configured source documents. These are different denominators. A 50/50 source check would not mean the industry is fully covered. Wider summaries separate established/specialist, authorised-outside-the-UK, research, paused and discontinued programmes and do not inherit the detailed cards' review or clinical status.

`reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json` records the latest five owner-authorised factual additions, their exact primary URLs, registry dates where verified, research or stopped status and explicit UK-access boundaries. It creates no new automatic baseline. Earlier review receipts remain the evidence trail.

`reviews/2026-09-29-industry-expansion.json` retains the original evidence URLs, publication/update dates (null when not verified), factual review date and retrieval limitations. Fourteen additional sources have complete-response baselines; five do not. The follow-up review records five newly retrieved complete documents and the CagriSema attachment-label-only change, preserving earlier retrieval/review history. Readable primary-source text was used for the latter, but blocked or timed-out direct retrievals were not pinned as successful baselines. The Roche presentation is manually reviewed PDF evidence, explicitly outside automatic content monitoring. This is an AI-assisted factual proposal with no clinical approval; editorial review and any applicable qualified clinical review remain required before publication. Never manufacture an all-green release by dropping unavailable sources.

The existing **Medicines Watch credibility** task must perform two separate passes:

1. Check configured sources, affected claims, expiry dates and public monitor operation.
2. Discover untracked developments using `discovery.mjs` topic searches and primary domains. Search regulator/NHS/product information and trial registries as well as sponsors. Search by mechanism, indication, trial activity and safety, not only the names already present in the catalogue. Use the current month plus a broader undated search to catch older omissions and indexing delays. Follow original announcements and registry records, read the actual documents, distinguish completed events from plans, and record failed/unavailable searches. Search engines and selected domains cannot establish exhaustive coverage.

Discovery queries are a read-only search plan for that existing task, not an additional crawler or scheduler. `summariseDiscovery` records performed, missing and failed domain searches; even a completed selected-domain pass returns `industryComplete:false`. A search result is a candidate for review, never permission to publish or advance a review date. Record exact URLs and source dates, aliases/formulations, UK licence, NHS access and supply separately; unknown remains unknown. Reuse an existing open review PR instead of duplicating it. Notify only material new evidence or newly actionable failures; suppress unchanged blocked-source alerts.

Remaining discovery work includes muscle-preservation adjuncts/combinations, smaller and non-US/European developers, early programmes, and indications beyond general obesity. The initial 24 is a selected starting set, not an industry total. Candidate inclusion requires readable primary evidence and an explicit relevance decision; no catalogue-size target overrides evidence quality. This proposal does not expand into unrelated prescribing services, checkout or member navigation.

## 30 September follow-up

The follow-up in `reviews/2026-09-30-reviewed-expansion.json` adds eight formulation/programme summaries: 32 entries (6 detailed plus 26 wider summaries), with 45 configured source documents. Seven newly read complete responses have identity-validated fingerprints. The historical discovery proposal is retained separately; it is not the current publication-status record. An additional Scholar Rock pipeline link remains manually reviewed and direct-retrieval blocked. This does not renew unrelated source dates or cure existing source failures.

Retatrutide and enicepatide receive dated trial updates. Body-composition research is explicitly historical where current obesity-development status is unresolved; lean mass is not equated with function. No clinical approval or new UK licensing, NHS funding or stock claim is made. Matt authorised informational publication on 30 September ("Sort please"); release and live verification still have to pass.

## 30 September continuing discovery

`reviews/2026-09-30-hrs1596-discovery.json` records HRS-1596 as a new proposal only. Hengrui's 29 September announcement describes a potential once-weekly oral GLP-1/GIP dual agonist and a proposed Novo Nordisk licence outside Greater China. ClinicalTrials.gov lists the first-in-human Phase I study as not yet recruiting in China. The agreement was still subject to closing conditions, the weekly regimen is a development aim, and no UK authorisation, NHS access or lawful UK supply is established. The source is not added to the live monitor and the candidate is not added to the live catalogue without a separate editorial decision.

`reviews/2026-09-30-emugrobart-petrelintide-discovery.json` records two further review-only proposals. Chugai's 28 September primary announcement says Roche discontinued emugrobart's obesity development after an interim Phase II GYMINDA assessment; the registry had not yet caught up and still showed the trial active, not recruiting, at its 9 September update. The same receipt retains a newly readable Zealand sponsor release as a possible replacement evidence route for the currently delayed petrelintide monitor source. Neither proposal changes the live 32-entry catalogue or 45 configured sources, and neither establishes UK authorisation, NHS access or supply.

`reviews/2026-09-30-env308-discovery.json` records an older omission found by the undated topic pass: Enveda's investigational daily oral Lac-Phe mimetic for post-GLP-1 weight maintenance. The sponsor reports Phase I safety and pharmacology observations in healthy volunteers, while weight, body-composition and maintenance outcomes remain untested in the reported human study and Phase II is planned rather than completed. Preclinical lean-mass findings are not described as human evidence. The exact-name ClinicalTrials.gov query returned no matching record, and that evidence gap remains explicit. This is proposal-only and makes no UK authorisation, NHS access or supply claim.


## Berobenatide / VESPER-6 correction

`reviews/2026-09-30-berobenatide-vesper6.json` records a later Pfizer trial page and the sponsor-submitted ClinicalTrials.gov record for NCT07595549. The live PF-3944 summary should also carry the adopted study name berobenatide and distinguish the recruiting VESPER-6 study, which records an actual 10 June 2026 start, from the earlier VESPER-4 announcement. The sponsor trial page is added as a 49th configured source with a complete-response baseline; the registry record remains linked evidence outside automatic monitoring. Recruitment is not a result, UK authorisation, NHS access or retail supply. The source publication date is unknown where Pfizer does not state it, and the registry's May 2028 primary completion remains estimated.

## 30 September publication decision

Matt authorised the continuing-discovery release with "Ok go". `reviews/2026-09-30-authorised-continuing-discovery.json` publishes HRS-1596, emugrobart and ENV-308 as bounded factual summaries, and replaces the petrelintide source with the reviewed readable sponsor release. Historical proposal receipts and the previous URL remain retained. This gives 35 entries and 48 configured sources; neither count means industry completeness. Clinical approval remains null. Unrelated review dates and genuine warnings are unchanged.

## 30 September review-expiry follow-up

`reviews/2026-09-30-overdue-source-renewal.json` records two same-day expiry waves covering sixteen sources. Five product-information reviews crossed the seven-day boundary after the first eleven-source review was prepared. Their complete SmPC responses were retrieved and reread; each exact claim-bearing fingerprint remained unchanged and no withdrawal was present. Only those source-specific review dates advance. Medicine wording, catalogue-wide dates, NHS access, actual supply and monitor outcomes do not change. Production remains awaiting review until the reviewed release is merged, deployed and followed by a real scheduled source check.

## BI 3034701 publication

Matt authorised informational publication with “Go” on 30 September after the explicit BI 3034701 publication discussion. `reviews/2026-09-30-authorised-bi3034701.json` adds that research summary, retaining its original discovery receipt. The catalogue now has 36 entries; the 48 automated source checks are unchanged. Its three primary evidence links are visibly outside automatic content monitoring. No clinical approval, UK authorisation, NHS access, supply or completed Phase 2 result is inferred. The other five proposals in PR #868 remain separate review work.

## 1 October programme updates

`reviews/2026-10-01-eloratzp-phase2b.json` replaces the earlier forward-looking EloraTZP evidence with Lilly's completed Phase 2b announcement and linked sponsor-submitted registry record. It keeps the separate-injection study distinct from the planned co-formulation Phase 3 programme and does not treat that planned programme as started.

`reviews/2026-10-01-kainetic-enrolment.json` records Kailera's later announcement that enrolment is complete across all three global Phase 3 KaiNETIC injection trials. It adds a 50th configured, fingerprinted source and updates only the ribupatide injection summary. Mid-2028 topline data remain expected rather than completed; the separate oral programme, UK authorisation, NHS access and actual supply do not advance.

`reviews/2026-10-01-macupatide-discovery.json` records an older omission found by the broader mechanism-and-combination pass. The sponsor-submitted registry shows a recruiting Phase 2 study of macupatide and eloralintide, alone or together, with an actual 16 October 2025 start and no posted results. A separate Japanese Phase 1 record remains not yet recruiting, so its estimated October 2026 start is not treated as completed. The bounded research summary adds no automatically monitored source and makes no UK authorisation, NICE/NHS England access, supply or clinical-approval claim.

## 1 October evening publication

Matt authorised publication with “Go live - stop pausing when they are needed updates”. `reviews/2026-10-01-authorised-evening-updates.json` connects the full-text factual review to the catalogue: SYNCHRONIZE-2, low-dose COURAGE with the older triplet safety signal retained, Safiglipron naming and bounded Kailera updates, plus the older IBIO-600 omission. There are 38 entries (6 detailed and 32 industry summaries). The 50 automated sources are unchanged; six additional reviewed links are explicitly outside automatic monitoring. No baseline is greened, no unrelated review date advances, and no clinical approval or UK access/supply is inferred. Other historical proposals on this branch remain unpublished unless covered by an earlier authorised receipt.

## 1 October broader discovery publication

`reviews/2026-10-01-authorised-broader-discovery.json` records seven additional primary-source-reviewed research programmes found by an undated mechanism and smaller-developer pass: MBX 4291, ARO-INHBE, LX9851, NBIP-1968, CRB-913, SYNT-101 and ALV-100. The catalogue now contains 45 entries (6 detailed and 39 industry summaries). The automated-source denominator remains 50; the new sponsor and registry links are visibly labelled outside automatic content monitoring rather than being assigned unverified baselines.

Each entry separates completed observations from plans, preserves missing registry matches, and states that trial activity does not establish UK authorisation, NICE/NHS England access or retail supply. Standing owner authorisation covers this factual publication, but it is not clinical approval. The selected catalogue remains open-ended and non-exhaustive; these additions do not close discovery work.

## 1 October SYNT-101 correction

`reviews/2026-10-01-synt101-mad-correction.json` replaces the newly published SYNT-101 wording that incorrectly left the 28-day multiple-dose cohort as pending. Syntis had already reported the Phase 1/1b multiple-ascending-dose observations on 15 September 2026. The corrected entry records the 23-person early study, keeps the findings attributed to the sponsor, and treats the 2027 Phase 2 study as planned rather than started. It does not convert preclinical lean-muscle findings into human evidence, infer UK authorisation, NHS access or supply, approve a monitoring baseline, or claim clinical approval.

## 2 October international and injectable omissions

`reviews/2026-10-02-authorised-international-omissions.json` closes five evidence-backed gaps found by the broader undated pass. Ecnoglutide and mazdutide are recorded as sponsor-reported China NMPA approvals, explicitly not UK authorisations, NICE/NHS England access or evidence of UK supply. Injectable ASC36 and ASC36_35FDC are separate sponsor-reported US Phase 1 initiations; ASC35 is a separate recruiting Phase 1 registry record with no posted results. Development aims, IND clearance, trial recruitment and estimated dates are not presented as authorised regimens or completed evidence.

The catalogue now contains 50 entries (6 detailed and 44 wider summaries). The automated-source denominator remains 50 because these five reviewed links stay visibly outside automatic monitoring until separate supported baselines exist. Standing owner authorisation permits the factual publication; it is not clinical approval. Neither the matching counts nor this selected set establishes industry completeness.


## 2 October UBT251 omission

`reviews/2026-10-02-authorised-ubt251.json` closes an older programme gap found by the broader undated triple-agonist pass. Novo Nordisk and United Biotechnology reported Chinese Phase 2 obesity results for weekly injectable UBT251, while Novo's 21 September 2026 pipeline presentation records a separate global Phase 1b/2a obesity study as ongoing and a weight-management Phase 3 start as planned for mid-2027. The planned Phase 3 event is not treated as completed.

The catalogue now contains 56 entries (6 detailed and 50 wider summaries). The automated-source denominator remains 50 because the new primary links are labelled outside automatic monitoring until a separate complete-response baseline is reviewed. Standing owner authorisation permits this bounded factual publication; it is not clinical approval. No UK authorisation, NICE/NHS England access or lawful UK retail supply is inferred.

## 2 October SGB-7342 omission

`reviews/2026-10-02-authorised-sgb7342.json` closes an older non-incretin and smaller-developer gap found by the undated INHBE/RNAi and muscle-preservation pass. SanegeneBio reported the first participant dosed on 13 January 2026 in a Chinese Phase 1 study of subcutaneous SGB-7342, while the ClinicalTrials.gov record was last updated four days earlier and still displayed not yet recruiting. Both dated facts remain visible rather than being silently reconciled.

The catalogue now contains 57 entries (6 detailed and 51 wider summaries). The sponsor's lean-mass statements remain preclinical and are not presented as human body-composition, muscle-function or efficacy findings; no human results are posted. The two reviewed primary links remain outside automatic monitoring, and no UK authorisation, NICE/NHS England access, lawful UK retail supply or clinical approval is inferred.

## 2 October amylin, formulation and stopped-programme omissions

`reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json` closes five further evidence-backed gaps. ABBV-295 has sponsor-reported Phase 1 findings while Phase 2 remains planned. Oral ASC30 and its subcutaneous depot are separate formulations with separate evidence and neither sponsor-described extended dosing nor maintenance is presented as an authorised regimen. TERN-601 is retained as a completed Phase 2 programme that Terns said it would not advance, rather than as a current candidate. Bimagrumab with tirzepatide is an active, not recruiting Phase 2 study; completed enrolment and primary data collection are not presented as results or proof of muscle function.

The catalogue now contains 62 entries (6 detailed and 56 wider summaries), while the automated-source denominator remains 50. Direct Terns retrieval limitations, unknown publication/update dates and all three existing source-access failures remain explicit. No UK authorisation, NICE/NHS England access, lawful UK retail supply, SHIFT sale or clinical approval is inferred.

## 2 October source warning repair

`reviews/2026-10-02-source-monitor-repairs.json` records full-text review of four replacement retrieval routes. Pfizer's original Business Wire releases are monitored through their complete syndicated copies; AstraZeneca's original release through Cision. The EMBRAZE paper keeps its PMC public link and uses Europe PMC's complete JATS XML endpoint, validating the PMCID, DOI, balanced complete article and full body before fingerprinting. Browser challenges, malformed or incomplete XML, content changes and retractions remain failures or review flags.

The original URLs, previous baselines and failures remain in the receipt. Only the four affected source reviews change; no medicine wording, clinical approval or access/supply claim changes. The 50-source denominator is unchanged. New URLs must pass a real production retrieval and cannot inherit old successful checks. No green observation is seeded during deployment.

## 2 October international registry omissions

`reviews/2026-10-02-authorised-registry-omissions.json` closes four older gaps found by a broader undated registry and mechanism pass. A sponsor-submitted record describes once-daily oral DA-302168S in a recruiting Chinese Phase 3 study. NNC0662-0419 and the GLP-1/glucagon/FGF21 tri-agonist DR10624 each have completed Phase 1 registry records but no posted results. CMS-D008 remains not yet recruiting with no listed location, despite an estimated April 2026 start; that estimate is not treated as first dosing.

The catalogue now contains 66 entries (6 detailed and 60 wider summaries), while the automated-source denominator remains 50. The four registry links remain outside automatic monitoring and carry exact review dates and response hashes. No completed registry is presented as successful efficacy evidence, and no UK authorisation, NICE/NHS England access, lawful UK retail supply, SHIFT sale or clinical approval is inferred.

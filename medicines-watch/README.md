# Treatments: Medicines & Peptides Watch

Public route: `/treatment-centre/medicines-watch`. Entry point is Treatments only. No member or My Timber integration. This is a bounded weight-management reference, not an exhaustive medicine database, prescribing tool, stock service or recommendation ranking.

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

The expansion proposal contains 6 existing detailed references plus 18 concise industry summaries in `industry.mjs`: 24 medicines/programmes, with 38 configured source documents. These are different denominators. A 38/38 source check would not mean the industry is fully covered. Wider summaries separate established/specialist, research, paused and discontinued programmes and do not inherit the detailed cards' review or clinical status.

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

## 30 September publication decision

Matt authorised the continuing-discovery release with "Ok go". `reviews/2026-09-30-authorised-continuing-discovery.json` publishes HRS-1596, emugrobart and ENV-308 as bounded factual summaries, and replaces the petrelintide source with the reviewed readable sponsor release. Historical proposal receipts and the previous URL remain retained. This gives 35 entries and 48 configured sources; neither count means industry completeness. Clinical approval remains null. Unrelated review dates and genuine warnings are unchanged.

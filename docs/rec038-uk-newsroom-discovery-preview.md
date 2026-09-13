# REC-038 — Contextual UK newsroom discovery, prepared 13 September 2026

Status: **released after Matt’s explicit “Go live now please” instruction**. Source 169d8c1612aec0aa276162532e95adb06c2106ac; Worker 0596c9a3-42f9-4a67-ae3b-8cb311437fec. Historical preparation notes below record the earlier blocked preview.

Adds a compact “From the UK newsroom” section within the existing main content of Knowledge Hub and SHIFT Health. Each has three links to published articles, corresponding UK topic-filter links and an all-UK link. Scoped styling uses the established palette and stacks at 700px. Existing main content, header, footer, metadata and journeys remain intact. No article publication, medicines, pricing, clinical gates, member sends, social posts, homepage or ticker changes.

Local verification before the runtime stopped responding: 32 focused tests passed, plus the three existing navigation/auth source gates. All five distinct article destinations returned 200 and their expected article headings. A dedicated read-only GitHub workflow rechecks the saved source. This is not a claim that the full repository suite passes.

At initial preparation, the desktop/mobile preview remained outstanding. Starting the local preview server returned EPERM and reset the preview runtime. A browser reconnection failed; subsequent environment calls stopped returning. No alternate port, browser automation surface or access-control workaround was attempted. The tested source was preserved through the authorised GitHub connector. No production release had occurred at that stage.

The original resumption plan was to restore normal preview access, render the two actual pages at desktop and 390px, inspect the new section and topic-link/filter behaviour, and run the existing REC-035 before/after preservation guard for a tightly scoped release. Recheck current main and Worker identity first. Do not rerun the old REC-037 release workflow: its pre-release identity guard is stale. Record the actual new release and screenshot only after they exist.

## Next UK reporting priorities

These are research leads, not publishable availability statements.

1. **Semaglutide for cardiovascular prevention: what is the current NHS access route?** NIHR's [1 April 2026 report](https://www.nihr.ac.uk/news/nice-recommends-weight-loss-jab-prevent-heart-attacks-and-strokes) was opened and read. It describes the NICE recommendation and the UK-supported SELECT research. The useful missing layer is final guidance and implementation by nation/local pathway. Retrieve those primary documents before writing current access claims; do not treat April launch coverage as proof of September availability. Avoid conflating obesity prescribing with cardiovascular prevention.
2. **Weight-management medication outside hospital services.** The same NIHR report links to [award NIHR162959](https://fundingawards.nihr.ac.uk/award/NIHR162959). The reader question is what is being tested about delivery and support outside specialist services. The award page returned its application shell only, so study design, recruitment status and results remain unverified. No claim of effectiveness or open recruitment.
3. **Behavioural support alongside weight management.** The NIHR report links to [award NIHR206801](https://fundingawards.nihr.ac.uk/award/NIHR206801). Focus on what support is being evaluated and how that differs from medication access. The award details remain unverified; this should become an article only if the protocol/results answer a distinct question beyond the existing Game of Stones and support-after-treatment coverage.

BARCODE remains held: search snippets are insufficient to replace an inspected primary paper. RESTED is not a new recruitment story based on the previously observed 2024 end date. No extra articles have been created to pad the 51 UK total.

## Saved-source verification

The [dedicated check run](https://github.com/shiftsometimber/shift-core/actions/runs/34757788288) succeeded on commit bc747bb1d9bc5fb0b638a84e048adc6b73de4ac6: all 32 focused tests, the three existing source gates, and all five published reading destinations passed. This job contains no deployment or credentials. An unrelated pre-existing act2b-one-shot workflow validation failure remains outside this change. Visual verification and production deployment were outstanding at that checkpoint.

## Production release

[Release run 34759343882](https://github.com/shiftsometimber/shift-core/actions/runs/34759343882), job 103729243950, completed successfully. Deployed source 169d8c1612aec0aa276162532e95adb06c2106ac, tree 1a2ed0257603353d9407cbff574f373fb70979a7, Worker 0596c9a3-42f9-4a67-ae3b-8cb311437fec. The pre-release main and runtime guards passed. All 32 focused tests and the existing source gates passed. Both live reading sections appeared once, all five destination pages returned 200, and all 51 UK / 156 total articles remain published.

The complete existing Knowledge Hub and SHIFT Health HTML, after removing only the two added reading/style sections, matched their before-release SHA-256 values. REC-035 independently confirmed the locked homepage, Start Here, selected treatment workspace, SHIFT for Work, login and shared header assets were preserved. No database writes, publication changes, migrations, sends or Pages deployment were part of this release.

Actual live browser checks confirmed both reading sections render, the UK mental-health link selects both filters and returns 21 matching articles with zero wrong-topic/wrong-region results, and the SHIFT Health desktop page has no horizontal overflow. The browser has no supported viewport-resize capability; no new 390px browser claim is made.

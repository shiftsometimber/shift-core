# REC-038 — Contextual UK newsroom discovery, prepared 13 September 2026

Status: **prepared, not deployed**. Main stays at 51342daaa3ca7f0bd95f337af7f2e8d2fe82bf32 and the REC-037 runtime remains the live release. This branch is based on that exact main.

Adds a compact “From the UK newsroom” section within the existing main content of Knowledge Hub and SHIFT Health. Each has three links to published articles, corresponding UK topic-filter links and an all-UK link. Scoped styling uses the established palette and stacks at 700px. Existing main content, header, footer, metadata and journeys remain intact. No article publication, medicines, pricing, clinical gates, member sends, social posts, homepage or ticker changes.

Local verification before the runtime stopped responding: 32 focused tests passed, plus the three existing navigation/auth source gates. All five distinct article destinations returned 200 and their expected article headings. A dedicated read-only GitHub workflow rechecks the saved source. This is not a claim that the full repository suite passes.

The desktop/mobile preview remains outstanding. Starting the local preview server returned EPERM and reset the preview runtime. A browser reconnection failed; subsequent environment calls stopped returning. No alternate port, browser automation surface or access-control workaround was attempted. The tested source was preserved through the authorised GitHub connector. No production release should be represented as completed.

To finish: restore normal preview access, render the two actual pages at desktop and 390px, inspect the new section and topic-link/filter behaviour, and run the existing REC-035 before/after preservation guard for a tightly scoped release. Recheck current main and Worker identity first. Do not rerun the old REC-037 release workflow: its pre-release identity guard is stale. Record the actual new release and screenshot only after they exist.

## Next UK reporting priorities

These are research leads, not publishable availability statements.

1. **Semaglutide for cardiovascular prevention: what is the current NHS access route?** NIHR's [1 April 2026 report](https://www.nihr.ac.uk/news/nice-recommends-weight-loss-jab-prevent-heart-attacks-and-strokes) was opened and read. It describes the NICE recommendation and the UK-supported SELECT research. The useful missing layer is final guidance and implementation by nation/local pathway. Retrieve those primary documents before writing current access claims; do not treat April launch coverage as proof of September availability. Avoid conflating obesity prescribing with cardiovascular prevention.
2. **Weight-management medication outside hospital services.** The same NIHR report links to [award NIHR162959](https://fundingawards.nihr.ac.uk/award/NIHR162959). The reader question is what is being tested about delivery and support outside specialist services. The award page returned its application shell only, so study design, recruitment status and results remain unverified. No claim of effectiveness or open recruitment.
3. **Behavioural support alongside weight management.** The NIHR report links to [award NIHR206801](https://fundingawards.nihr.ac.uk/award/NIHR206801). Focus on what support is being evaluated and how that differs from medication access. The award details remain unverified; this should become an article only if the protocol/results answer a distinct question beyond the existing Game of Stones and support-after-treatment coverage.

BARCODE remains held: search snippets are insufficient to replace an inspected primary paper. RESTED is not a new recruitment story based on the previously observed 2024 end date. No extra articles have been created to pad the 51 UK total.

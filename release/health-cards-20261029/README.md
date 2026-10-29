# Approved SHIFT Health nine-card release

Matt approved deployment after reviewing the assembled nine-card layout on 29 October 2026. Choices: Bloods 06; Energy E6; Fertility F4; Hair H1; Heart C4; Mental M3 with Matt and Millie; Sleep S1; Supplements N2; Testing T4.

Scope is the category grid on `/shift-health` and its existing aliases. Preserve the home page, opening family-park hero, all lower feature sections, navigation, footer, consent, commerce and current destinations. The current Fertility shortcut is `/shift-health/testing/male-fertility`, not the old TRT guide.

The production adapter retrieves the exact currently deployed Health module and adds a wrapper. It does not redeploy the older repository runtime or change any route assignments. The capture, complete candidate, provider module hashes, predecessor version, live verification and receipt are retained in the Actions artifact. Runtime settings and bindings are preserved; databases are not written. The existing production concurrency group serialises the release, and deployment/source changes during staging stop promotion.

The nine approved photographs have had only review labels and baked typography/button elements removed. The same approved text is rendered as semantic HTML over the photos. All image variants total approximately 800 KB. The category list also has matching ItemList schema.

The release verifies the exact provider bytes before promotion, then the delivered HTML, all nine image hashes, all nine existing destinations, unchanged route assignments and preserved homepage main. If verification fails, it restores the captured predecessor only if this version still owns the Health component. It does not roll back a newer owner's version.

Current live predecessor captured in read-only run 40962515673: `shift-health-nutrition-20261027`, version `ca72d6a2-ff37-4176-8483-8e241a27a8d2`. The actual release captures and guards its own fresh predecessor, allowing already-completed independent work to remain intact.

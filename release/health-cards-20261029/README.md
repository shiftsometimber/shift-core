# Approved SHIFT Health H6 header and W1 tenth card

Matt selected header H6 after reviewing six complete visual concepts. H6 uses the approved two-panel everyday-life collage, the headline “Men’s health. Made clearer.”, the full introduction in `cards.mjs`, the existing caption “A little more life in the everyday.” and “What would you like to sort?” above the cards. The introduction incorporates Matt’s requested “clear information and carefully selected solutions”.

Matt separately selected W1: the canal-walk Weight loss card. It becomes the tenth category, alphabetically after Testing & wellbeing, using the existing `/mens-weight-management` destination and the exact weight-management description already on the page. The older duplicate weight-management feature is removed, and its remaining Bloods sibling spans the row.

The original nine cards remain byte-for-byte identical: Bloods 06; Energy E6; Fertility F4; Hair H1; Heart C4; Mental M3 with Matt and Millie; Sleep S1; Supplements N2; Testing T4. The corrected Fertility link remains `/shift-health/testing/male-fertility`.

The home page, navigation, footer, consent, commerce, databases, all category destinations and all HTML outside this bounded scope are preserved. The header is semantic HTML; artwork contains no baked text. Eleven WebP assets total about 1.25 MB, including the nine existing photos.

The provider adapter captures the exact active Worker module graph. It replaces only this release’s existing named presentation layer, preserving independent outer wrappers, settings, bindings and routes. It does not deploy the older Git main runtime. The shared `cloudflare-production-promote` concurrency group serialises production work; fresh runtime, source and route guards stop promotion if another owner changes the page during staging.

`check.mjs` verifies legacy nine-category, current nine-card and resulting ten-card sources, exact nine-card preservation, approved copy, destinations, unrelated HTML, removal of the old duplicate feature, unique valid schema, idempotence and refusal of unexpected sources. The deployment repeats the scope checks against a fresh live baseline, verifies every staged provider byte before promotion, and checks the exact delivered HTML, all eleven image hashes, ten destinations, unchanged routes and preserved homepage main. Failure restores only its own version if it still owns the component.

The Actions artifact retains the captured predecessor, before/candidate/live HTML, module hashes, fresh checks and deployment receipt. No messages, emails, D1 writes or route additions are part of this release.

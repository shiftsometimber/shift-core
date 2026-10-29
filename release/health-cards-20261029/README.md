# Approved SHIFT Health hub cleanup and closing sections

Latest follow-up: Matt confirmed that H6 feels right on his phone, so its existing markup, wording, image and sizing stay exactly as deployed. The unpublished smaller-header draft is shelved.

Matt supplied four screenshots and explicitly requested removal of the older Bloods, Testosterone & Energy, Supplements & Nutrition, and Testing & Wellbeing feature sections because the ten approved topic cards now cover them. Remove those four sections and their empty rows, preserving the ten card blocks byte for byte.

Matt also requested removal of the emoji arrows and a more polished bottom of the hub. The existing Useful places links become three equal-width outlined link cards on desktop and three aligned rows on mobile, using decorative SVG line arrows. The existing free My Timber section becomes a compact cream callout with a black action button. Its wording and the four destinations are unchanged. This styling is in a separate scoped stylesheet and does not change H6, the cards or the shared site footer.

The automated checks verify the exact existing H6 markup and stylesheet, all ten card blocks, removal of the four selected duplicate sections and empty rows, four semantic closing links with SVG icons, unchanged closing wording and destinations, valid schema, idempotence and preserved HTML outside this scope. The guarded provider deployment retains current independent module layers, bindings and routes and restores only its own version if verification fails. The home page remains untouched.

## Earlier H6 and W1 approval

Matt selected header H6 after reviewing six complete visual concepts. H6 uses the approved two-panel everyday-life collage, the headline “Men’s health. Made clearer.”, the full introduction in `cards.mjs`, the existing caption “A little more life in the everyday.” and “What would you like to sort?” above the cards. The introduction incorporates Matt’s requested “clear information and carefully selected solutions”.

Matt separately selected W1: the canal-walk Weight loss card. It becomes the tenth category, alphabetically after Testing & wellbeing, using the existing `/mens-weight-management` destination and the exact weight-management description already on the page. The older duplicate weight-management feature is removed, and its remaining Bloods sibling spans the row.

The original nine cards remain byte-for-byte identical: Bloods 06; Energy E6; Fertility F4; Hair H1; Heart C4; Mental M3 with Matt and Millie; Sleep S1; Supplements N2; Testing T4. The corrected Fertility link remains `/shift-health/testing/male-fertility`.

The home page, navigation, footer, consent, commerce, databases, all category destinations and all HTML outside this bounded scope are preserved. The header is semantic HTML; artwork contains no baked text. Eleven WebP assets total about 1.25 MB, including the nine existing photos.

The provider adapter captures the exact active Worker module graph. It replaces only this release’s existing named presentation layer, preserving independent outer wrappers, settings, bindings and routes. It does not deploy the older Git main runtime. The shared `cloudflare-production-promote` concurrency group serialises production work; fresh runtime, source and route guards stop promotion if another owner changes the page during staging.

`check.mjs` verifies legacy nine-category, current nine-card and resulting ten-card sources, exact nine-card preservation, approved copy, destinations, unrelated HTML, removal of the old duplicate feature, unique valid schema, idempotence and refusal of unexpected sources. The deployment repeats the scope checks against a fresh live baseline, verifies every staged provider byte before promotion, and checks the exact delivered HTML, all eleven image hashes, ten destinations, unchanged routes and preserved homepage main. Failure restores only its own version if it still owns the component.

The Actions artifact retains the captured predecessor, before/candidate/live HTML, module hashes, fresh checks and deployment receipt. No messages, emails, D1 writes or route additions are part of this release.

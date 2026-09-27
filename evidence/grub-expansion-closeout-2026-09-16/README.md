# Grub additive closeout — 16 September 2026

The 1,873 additive recipes are repaired, reproducible drafts with zero detected technical holds. The previous 888 placeholder methods have been replaced with concrete cooking instructions. Independent AI editorial reports support review of the exact content; **human second-person acceptance remains pending**. Nothing in this pack changes the published 798-recipe authority.

Final candidate SHA-256: `fc9fbbe12e29ed175c3a742d086b1820778a0adcafc680b25a47225ac876eab8`.

## Preserved authority and publication boundary

The eight retained decisions in `evidence/grub-v1-final-decisions-2026-08-14.json` still regenerate exactly 798 recipes: 212 breakfast, 204 lunch, 195 dinner and 187 snack. The candidate builder checks every accepted content hash and all eight family digests, then excludes those IDs from the additive candidate. Original catalogue content and approval records are unchanged.

The Grub industrial gate in `docs/SHIFT-MEMBER-HUMANNESS-STANDARD.md` explicitly requires human second-person review. AI editorial PASS records are supporting evidence, not human acceptance or inherited Matt approval. `required-decisions.json` retains the 87 exact family digests and descendant IDs pending that acceptance. `authorship.json` identifies the actual authors of all 1,873 exact recipe hashes so that a reviewer cannot approve their own authoring. The serving bridge must retain the original authority while this requirement is outstanding.

The original 205 quarantined recipes remain excluded. Their overlapping issues are 180 uncommissioned style/format combinations, 22 salmon method mismatches, 20 delicate slow-cooker mismatches and six insufficient-liquid slow-cooker variants. Complete IDs and reasons remain in the generated candidate; none is presented as repaired or accepted.

## Completed authoring and arithmetic repairs

All 1,873 drafts have fresh ingredient-level CoFID calculations using exact decimal accumulation and per-serving rounding. Thirteen compound quantities now count every addition: twelve oil cases use 10ml rather than 5ml, and one cinnamon case uses 2.3g under the retained teaspoon convention.

The format composers account for actual proteins, quantities, sauces, equipment, preparation order, heat, cooking times and doneness. These include 408 fakeaways, 264 pan meals, 216 oven/hash meals, 464 lunches and 271 breakfast/oat revisions. Other corrections include explicit rice cooling and 24-hour storage, single-reheat limits, 446 restored known-allergen records, measured dressing components, snack finishing order, canned corn and pulses, fruit preparation, seasoning and usable equipment lists.

Fifty-one overnight-oat formulas now contain 210ml measured semi-skimmed milk per 70g oats. Nutrition and milk allergens are recalculated. The ratio follows the published Dairy UK recipe cited in the breakfast authoring module. The minimum six-hour soak is included in total time. All candidates have explicit preparation, cooking, rest and total times; slow meals lose stale quick tags and quick preparation bands. Basic recipe formats are identified explicitly. Times are estimates; packet instructions and doneness checks still govern cooking.

The ingredient state corrections are explicit recipe revisions:

| Scope | Corrected identity and nutrition basis |
| --- | --- |
| 34 bacon recipes | Raw trimmed back bacon, CoFID 19-646, weighed before cooking |
| 140 turkey-mince recipes | Unseasoned 100% raw skinless turkey breast mince; CoFID 18-349 raw light meat remains a disclosed anatomical proxy, not approval of generic mixed-cut mince |
| 98 noodle recipes | Dried egg noodles, CoFID 11-719; egg and gluten declared |
| 54 roast-potato recipes | 250g raw peeled potato, CoFID 13-489, roasted using the separately measured recipe oil |
| 102 loaded-fries recipes | 250g cooked plain, uncoated oven-ready chips without batter, CoFID 13-487; bake first and weigh the cooked portion |

Bought sauces and other generic-food proxies retain their stated mapping limitations. CoFID estimates do not replace product labels. Known allergens are declared, but actual brands and substitutions still require label checks; no recipe is guaranteed allergy-safe. The 48 fakeaway pairs with equivalent ingredients/methods are disclosed in the independent fakeaway report, without claiming unique flavour experiences.

Food handling follows the [Food Standards Agency cooking guidance](https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food) and [home food fact checker](https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker). The general 24-hour prepared-food limit is a conservative authoring convention, subject to shorter ingredient use-by dates, not an individually validated shelf-life claim.

## Protected recipe correction proposals

Twelve recipes inside the accepted 798 also contain the compound-oil defect. `protected-quantity-revisions.json` contains separate versioned proposals with exact source hashes, corrected 10ml quantities, recalculated nutrition, nutrient deltas and correction digests. All other protected recipe fields remain unchanged. These proposals retain the original ingredient mappings so that unrelated mapping changes are not silently included. They require separate human acceptance and a new immutable publication authority before use.

## Reproduction and evidence

Run from the repository root without downloads or temporary fixtures:

```sh
node --test tests/grub-expansion-review.test.mjs tests/grub-expansion-pan.test.mjs tests/grub-expansion-fakeaway.test.mjs
node grub-expansion-review-pack.mjs
```

The 21 focused tests cover protected partition preservation, quantity arithmetic, exact rounding, revision scope, ingredient state and allergen corrections, actual cooking methods, timing metadata, fail-closed holds, stale acceptance rejection and full review coverage.

`tests/fixtures/grub-cofid-2021-governed-subset.json` contains 113 exact food records copied unchanged from the official CoFID 2021 extraction. It retains the original 2,887-record index hash, workbook hash, publication URL and Open Government Licence URL. The [official CoFID publication](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid) identifies the dataset.

Compact summaries, pending decisions, protected revision proposals and independent reports are source-controlled. The complete candidate gzip, expandable HTML review, content fingerprints and execution logs are generated artifacts retained by CI. The HTML exposes every additive recipe and exact family digest. No new visual screenshot or browser-layout pass is claimed.

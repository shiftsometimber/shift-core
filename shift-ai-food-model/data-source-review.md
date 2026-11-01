# Data source review — 1 November 2026

This is a rights/suitability review for the current own-model research. No
provider subscription, data purchase, outreach or member collection is created.

| Source | Publisher evidence | Current use |
| --- | --- | --- |
| Nutrition5k | Publisher permits commercial adaptation under CC BY 4.0; US cafeterias, ingredient weights and RGB images | Actual research training/evaluation, with per-image source and attribution; not UK-field acceptance |
| EPFL Food-5K / Food-11 | Publisher limits use to research purposes and says data may not be commercially distributed | Not incorporated into our commercial model pipeline |
| Cambridge AI-generated food stimuli | Publisher describes 220 AI-generated stimuli and CC BY 4.0 | Not used; synthetic images cannot establish real camera/UK-meal performance |
| Restrain Food Database | Paper describes UK-selected foods, standardised images and per-image Creative Commons licences | Candidate for per-image rights review and visual annotation; no bulk-use permission assumed from the article licence |
| Wikimedia Commons UK food photographs | Files have individual description-page licences; category metadata is not an image licence or verified food annotation | Candidate for per-image rights review and visual annotation; no images ingested from category labels |

Authoritative references checked:

- https://github.com/google-research-datasets/Nutrition5k
- https://www.epfl.ch/labs/mmspg/downloads/food-image-datasets/
- https://www.repository.cam.ac.uk/items/b98dbb43-d042-457c-b679-3726f8f3db68
- https://pmc.ncbi.nlm.nih.gov/articles/PMC9682305/
- https://commons.wikimedia.org/wiki/Category:Food_of_the_United_Kingdom

Next data work requires explicit visible-food labels and source rights for
every retained image. Unknown/hidden ingredients, similar shots of the same
plate and source/photographer grouping need attention. A public collection of
food photographs is not by itself a validated UK meal benchmark. Member
corrections or photos must not silently become shared training data.

## Follow-up: free visible-region annotations and broader data access

Checked 1 November 2026, Europe/London, after Matt requested checking the
opportunity provided it did not incur cost.

**Visible-region annotations:** public source
https://github.com/liamhand/ingredient-level-nutrition-regression, pinned revision
`0997586b5c177fa8f2c0a61eb7f958ab18605362`. LICENSE-DATA expressly permits
commercial adaptation under CC BY 4.0, with attribution to Hand et al. (2026)
and Nutrition5k/Thames et al. (2021). Public CSV, licence and eight masks were
retrieved without an account, payment or executing publisher code.
The CSV contains 2,922 annotation rows over 1,056 dishes and 40 coarse categories.
It overlaps 527 existing samples: 421 train, 52 validation and 54 development test.
Keep those splits; do not move the latter samples into training.

Eight train-only examples were checked: original RGB SHA256 pins match, mask/RGB
sizes match at 640x480, and each listed region's pixel count matches the CSV.
The photo/region overlays were visually inspected and align plausibly with food.
This is a small structural/visual review, not independent human adjudication of
all annotations. Categories are coarse: broccoli and cauliflower both appear as
cruciferous, while meat_red is not automatically beef. A mapping and label-quality
pass is required before training. These remain US cafeteria photographs and
cannot establish UK phone-photo acceptance. Ground-truth masks cannot be assumed
available at member inference: any crop experiment must distinguish oracle-mask
results from an automatic end-to-end photo pipeline.

**MyFoodRepo:** the official 2022 benchmark describes v2.1 with 54,392 training
photos, 100,256 annotations and 323 food classes. The published rules label the
dataset CC BY 4.0 and the page says participation is free. The dataset download
page currently redirects to sign-in; standalone authenticated download conditions
and any resulting access requirements remain unverified. No account was created,
no challenge entered, no model submitted and no additional agreement accepted.
Competition submission rights are a separate issue from the stated dataset
licence; do not claim a standalone data download grants rights to our model.

Immediate decision: the public annotation source is available for a controlled
label/crop comparison without buying a dataset or adding paid compute. Bigger
training runs or GPU rental have not been priced or authorised. No retraining or
new accuracy improvement is claimed from this access check. Detailed source,
licence, file pins, eight sample checks and access observations are retained in
`evidence/visible-data-access-review.json`.


## Visible-food improvement — 1 November 2026, Europe/London

Completed the authorised no-fee own-model experiment on 1,056 public Nutrition5k
photos with Hand et al. visible-region annotations (CC BY 4.0). All 1,056 indexed
masks matched their CSV region labels and pixel counts; only eight earlier samples
have received visual alignment review. Preserved capture-week assignments: 574
training photos / 11 weeks, 274 validation / five weeks, 208 development-test / four
weeks. Forty source categories become 39 by pooling egg and egg-white labels.

Candidate 5 trains our own 29,991-parameter head on the frozen pinned SigLIP base.
Whole-image and centre-view candidates were selected using validation only; the
full-image version won. Masks supplied image-level targets; no ground-truth crop
is needed at inference. Frozen image features were streamed during the public
download, with input/base/preprocessing pins. Test labels and predictions were
used after head/threshold selection. There is no calorie/portion prediction.

The visible-only head lost useful earlier egg/bacon recognition. Candidate 6
therefore routes each category between our two already-trained heads, requiring
at least five predictions and 85% precision on validation, then highest validation
F1. All original source thresholds stay unchanged. Routing requires one frozen
visual encoder call per photo, not two. This routing stage performs no additional
gradient training. Ten research categories are enabled; 29 remain disabled.

Same 208 JPEGs, shared 11 coarse categories, unchanged old thresholds: precision
80.67% -> 84.85%, recall 29.00% -> 50.76%, F1 42.67% -> 63.52%. The complete
39-category candidate result is 81.75% precision / 36.20% recall. These denominators
are distinct. The fixed existing food gate retains 197/208 photos; across all 39
categories the gated result is 81.96% / 35.19%. Weak class results remain recorded.
Neither these results nor test errors were used to relax thresholds. The router
was developed after inspecting candidate 5; this is development evidence, not a
fresh blind benchmark or independent UK acceptance. Related plate scans remain.

All 208 routed saved-model JPEG decisions reproduced exactly. Warm inference
averaged 289.7 ms, startup 7.50 s in the full reload check. Four known synthetic
blank/noise controls produced no gated food suggestions; this is not a real
non-food benchmark. Private identity fields were refused. The actual shared
adapter checks reused one ready worker and closed it afterwards, including a
final source guard recheck. An initial adapter
harness attempt used a mistyped image path and failed ENOENT; the corrected
manifest-backed fixture passed. Python checks: 46 passed; Node checks: 12 passed.

Code, full evaluation/reload/adapter receipts and the two pinned research candidate
bundles are retained on the existing feature branch. The archive excludes the
812 MB licensed base, RGB dataset and development feature cache. No production
activation, paid service, member-photo training, vendor contact or diary-save
change occurred. Exact-current-recipe training still has zero qualified real
photo pairs. Existing release floors remain unchanged and failed.

Evidence: `shift-ai-food-model/evidence/visible-model-progress-20261101.json`.
Reproduce with `visible_learning.py prepare`, `stream-features`, `train`, then
`routed_learning.py` and `verify_visible.py`; CLI help requires explicit local
paths and bounded download/compute budgets. Use `--research` for actual serving.

# Shift AI food model — research candidate

## Negative-label projection correction — 1 November 2026

The first publisher Food-negative candidate cohort is invalid as a global
food/drink rejection benchmark: image inspection found drinks, spices, eggs and
bananas among supposed negatives. Its 36% suggestion fraction is not a valid
false-food rate. None of these source-negative labels entered model training.
All raw outputs are retained. Assistant review classified 16 clear non-food
objects/live animals, 31 food/drink cases and 53 uncertain cases; this is a
provisional post-investigation review, not independent blind acceptance.

The benchmark code now refuses to publish a valid negative rate without visual
adjudication. An additional object-positive candidate cohort is being acquired
with individual licence checks and a review-required status. It cannot become
training truth or an acceptance score automatically. The full-39 food test and
its 83.00% precision / 56.73% recall are separate, unchanged development results.

Correction receipt: `shift-ai-food-model/evidence/nonfood-completion-20261101.json`.

## Spatial recognition and independent public-data continuation — 1 November 2026

Continued after Matt flagged that work had stopped. The earlier wording that UK
photos were the sole next dependency was too broad: UK field data is required
for UK acceptance, while licensed public-data development can continue now.

Implemented and trained a coarse 14x14 food/background localiser using the
existing 574 training segmentation masks. Frozen SigLIP patch vectors plus global
context feed our own regional heads. Validation and test prediction use only RGB;
no ground-truth crops, held-out masks or annotation CSV are needed at inference.
A nonlinear regional head, then four fixed seeded heads sharing one encoder,
were selected using validation only. All 39 categories remain in the score.

Full-39, gate-applied, same 208 development photos: candidate 6 precision/recall
81.96% / 35.19%; regional ensemble 15 is 83.00% / 56.73%. All 208 real-JPEG scores
reproduce within 1.97e-6. Warm inference averages 273 ms in this run. The actual
shared adapter reuses a ready worker, refuses private fields and closes it.
These are previously inspected public-development results, not UK acceptance.

Acquired 73 separately licensed Open Images validation photos and 90 separate
training photos with original-page CC BY 2.0 evidence, source attribution and
publisher CC BY 4.0 object annotations. Validation photos/authors are excluded
from training. Unlabelled foods remain unknown. Training uses weak positive-box
loss alongside the original dense masks, never invented complete meal labels.
The validation source contains only partial truth: on 60 mapped known-positive
cases, candidate 6 hits 35%, ensemble 15 hits 40%, transfer head 16 hits 56.67%.
Precision on that partial-label probe is unknown. Generalisation remains weak.
The new transfer ensemble did not outperform ensemble 15 on the main scorecard;
all outcomes, including regressions, are retained.

The acquisition corrected two actual implementation limits: CC BY 2.0 /deed.en
is the same licence as its root URL, while restricted variants remain rejected;
and the unsorted training-credit CSV needs a bounded streaming match rather than
a short prefix. Original source-page evidence and failed checks remain recorded.
No account, contact, spend, private member photo or production activation occurred.

A real non-food diagnostic has been launched on a fixed publisher-human Food-negative
cohort, excluding contradictory positive food descendants and training authors.
Its results are recorded separately; the four old blank/noise controls are not a
real non-food benchmark. No threshold is tuned on that diagnostic. Completion
receipt: `shift-ai-food-model/evidence/nonfood-completion-20261101.json`.

Evidence: `shift-ai-food-model/evidence/spatial-progress-20261101.json`.
The requested 99.99%/99.99% remains unverified. Existing release floors, privacy
holds and source/capture split checks remain unchanged. No rollout is authorised.

## Requested 99.99% quality target — 1 November 2026, Europe/London

Matt requested 99.99% precision and recall and a full route map. The concrete
plan is `shift-ai-food-model/quality-roadmap.md`. A tested scorecard now retains
misses from abstention, disabled categories and the actual 12-item response cap;
photo-only, shared-category and member-assisted results cannot be conflated.
Current results do not verify the requested target.

Executed four bounded class-balanced linear/nonlinear head variants on existing
public features; validation selected the nonlinear square-root variant. Tested
validation-only three-head routing as candidate 8. Shared-category recall rises
50.76% -> 66.77%, but precision falls 84.85% -> 83.08%. Full-39 ungated precision /
recall is 78.47% / 48.48%. This trade-off is explicit: candidate 8 is a research
alternative, not a promotion over candidate 6. All 208 saved JPEG decisions
reproduce exactly; the local shared adapter and incumbent backward compatibility
pass. Python checks: 50; Node checks: 12. No test floor was weakened.

A source-pinned 40-format UK collection brief is prepared: first 180 method-pilot
photos, then a planned 1,000 independent cook sessions / 3,000 photos, including
200 blind sessions. No real UK photos, participant requests, consent or costs have
been created. These are collection quotas, not proof of 99.99%. Exact-binomial
zero-error sample illustrations, independence assumptions and evidence limitations
are in the roadmap. Current grouped public development data is not acceptance.

Evidence: `shift-ai-food-model/evidence/quality-target-progress-20261101.json`.
Existing production, spend, member-photo-training and communication holds remain.
The next material dependency is qualified independently labelled UK meal/negative
data. No research job continues unattended after this completed batch.

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

Matt authorised the specialist food-model route on 1 November 2026,
Europe/London. This directory belongs to the existing food-capture branch;
it is not a second app, an external Cal AI integration or a production release.

## Recipe-aware continuation — 1 November 2026

Matt asked that recognition fit our own recipes and learn from them. The local
reference bank now contains 2,692 current governed source recipes: 2,671 full
UK recipes, 14 UK core additions and seven everyday recipes. Publication status,
release hashes and corrected row hashes are checked. This is a source snapshot,
not live D1 readback. Recipe text embeddings give image-to-recipe suggestions;
they do not constitute supervised visual training of 2,692 recipe identities.

`recipe_catalogue.mjs` provides an explicit current-recipe/hash and portion
confirmation step. Nutrition is optional and off by default. It scales recorded
per-serving estimates once, preserves unknown nutrients as absent, and withholds
recipe numbers when ingredients differ. Its result is a review draft with
`autoSave:false`: it does not itself call the existing member diary writer.
The future UI must pass the member-reviewed draft into the existing single-save
flow to update Grub, Today, Journey and shared AI context; no second log store.
No actual member selection, logging write or production hookup happened here.

Of the reference image bindings, 2,671 refer to older recipe snapshots; none
exactly matches current title, ingredients and method. Another 21 recipes lack
an exact binding. This is a source-version check, not proof that every photo
looks wrong or that the live recipe UI is broken. Some references are AI-generated
illustrations. These are excluded from exact-current-recipe training and from
real-photo evaluation. Learning exact recipes requires verified real meal photos
paired with the current recipe hash, substitutions and capture/source group;
training rights/consent must cover that reuse. Member confirmations alone are
not shared-training permission. A separate representative evaluation must stay
out of training, including repeat photos of the same dish/cook session.

A fourth component experiment used the public Apache-2.0 SigLIP base, pinned to
`7fd15f0689c79d79e38b1c2e2e2370a7bf2761ed`, and trained our own 9,228-parameter
head on the same 1,200 / 200 / 200 grouped images. It selected the full-image
view and epoch 119 using validation only. CPU training took 582.02 seconds.
Calibrated development-test precision was 70.87%, recall 31.03%, versus the prior
70.00% / 7.24%. Five classes remain disabled; several enabled classes still have
poor precision. The previously inspected test is not blind acceptance, the
labels remain only twelve ingredient groups, UK recipe accuracy is unmeasured,
and no true non-food evaluation exists. The release floors are still failed.
No threshold was changed using these test results.

All 200 real-JPEG saved-head round trips passed (maximum probability difference
8.11e-6; mean warm image inference 396 ms locally). Three text-only retrieval
queries ranked the intended beans on toast, tuna sandwich and scrambled eggs on
toast first. That is not photo accuracy. One public JPEG returned five possible
recipes with similarity scores, no nutrition and no automatic save; it is a
plumbing check, not a verified recipe hit. A simulated explicit selection and
1.5-serving confirmation produced source-derived estimates, while omitted
nutrition/substitutions correctly withheld them. No member confirmation occurred.

The new research artifact includes the learned head and recipe bank, with pins
and attribution; the 812 MB third-party SigLIP base is a separate dependency.
Neither a new foundation model nor a fully standalone inference bundle is claimed.
Local qualification: 11 Python checks and four recipe checks pass. Production
flags remain off, no service binding is provisioned, no new spend or gated
agreement was accepted. Prior full CI had the same two historical CSV failures
on feature and unchanged base; the gates have not been relaxed.

## What we are training

A compact, multi-label food-component classifier. Its general visual encoder
is the published Apache-2.0 `facebook/deit-tiny-patch16-224`, pinned to revision
`b3428f18dcc7b543470d07f14b4a4157815d1880`. Our training learns a new food
classification layer on top of its frozen visual features. The resulting
weights are a Shift-trained derivative; we did not pretrain the encoder from
scratch. A second `last-two-blocks` strategy additionally adapts the last two
visual transformer layers and their final normalisation. The original base
licence and credit travel with the candidate.

The first vocabulary contains twelve components: chicken, beef, fish, eggs,
rice, potatoes, broccoli, carrots, leafy salad, cauliflower, pizza and bacon.
This is not a comprehensive UK meal recogniser. No medicine, allergy, portion,
calorie or nutrient prediction is trained. Member review and the existing
confirmed-food save route remain necessary.

## Training-data rights and limitations

The first experiment uses public Nutrition5k RGB photographs and ingredient
annotations. Its publisher expressly permits commercial adaptation under
CC BY 4.0. Each sample retains its source URL, attribution, transformed-image
SHA256 and original-image SHA256. Images are resized/recompressed; that
modification is recorded. No member photograph or private data is used.

The source contains US cafeteria food. It cannot establish UK-meal performance.
Ingredient mass is only a proxy for visibility: an annotated ingredient may be
hidden. A candidate must therefore pass a separately labelled representative
UK evaluation before a production proposal. The initial experiment also lacks
true non-food photographs.

Whole capture weeks are assigned deterministically to train, validation or
test, reducing dependence between adjacent incremental plate scans. Exact image duplicates,
capture-group overlap, missing rights, altered image bytes and external paths
are rejected. These are our grouped splits, not the paper's benchmark split;
results must not be presented as reproducing its published benchmark.

Model selection and suggestion thresholds use validation data only. Test
images are first interpreted after selection and calibration. The report
includes per-class support, precision, recall, abstention coverage, exact
match and a fixed two-common-food baseline. Unsupported classes are disabled.

## Local run

Python 3.12. Commands below download only public source data and model weights.
They do not create a hosted service, rent a GPU, accept a gated model agreement,
upload the derivative model or activate the application.

```bash
python -m venv .food-model-venv
.food-model-venv/bin/python -m pip install torch==2.15.0 --index-url https://download.pytorch.org/whl/cpu
.food-model-venv/bin/python -m pip install -r shift-ai-food-model/requirements.txt
.food-model-venv/bin/python shift-ai-food-model/prepare.py base /absolute/work/base --max-download-mb 40
.food-model-venv/bin/python shift-ai-food-model/prepare.py data /absolute/work/data --max-download-mb 350 --counts 320,100,100
.food-model-venv/bin/python shift-ai-food-model/experiment.py --base /absolute/work/base --manifest /absolute/work/data/manifest.json --output /absolute/work/shift-food-candidate-1 --max-minutes 20
.food-model-venv/bin/python -m unittest discover -s shift-ai-food-model/tests -v
```

The stronger pass uses `--strategy last-two-blocks --epochs 20` and a new
candidate directory. If a development test has already been inspected, pass
`--development-test-seen`; its report then explicitly cannot be used as fresh
production acceptance. No test labels select weights, epochs or thresholds.

Downloads have explicit aggregate and per-file limits. Base weights must match
the publisher's immutable revision and LFS SHA256. The original weights are
read with PyTorch's restricted `weights_only=True` loader, on CPU. Candidate
weights are saved as safetensors. Training and inference use local files only,
disable Hub telemetry and never execute downloaded model code.

`predict.py CANDIDATE --research` consumes one bounded JSON object on stdin,
matching the existing internal `SHIFT_AI_VISION` wire contract:

```json
{"task":"recognise_food","image":"data:image/jpeg;base64,...","caption":"optional","maxOutputTokens":400}
```

It returns `{"items":["food component"],"nutrition":{}}`, with at most twelve
known labels. It ignores the caption as model input, rejects identity/unknown
fields, validates the decoded JPEG and does not save the request/image. It has
no HTTP listener, member session, diary/database writer, remote model fallback
or model download at inference time. The research override exists only as a
local CLI option. Normal invocation refuses this research candidate.

This is not yet an implementation of a deployed Cloudflare service binding.
Production hosting, binding, privacy review and phone acceptance remain separate
work. No existing application activation flags or release guards are changed.

## Proposed acceptance floors

These are initial engineering floors, not Matt's production sign-off or a
clinical validation claim. A research-only report cannot qualify production.

- Independent representative UK test set of at least 200 images.
- At least 20 independent examples for every advertised class.
- Suggestion micro-precision at least 90%, recall at least 60%, and measured
  per-class precision at least 85%. Low-support classes remain unavailable.
- At least 100 independent non-food images with false acceptance no greater
  than 5%.
- Reviewed hosting/photo privacy, explicit release decision, verified actual
  phone capture and photo-to-confirmed-log acceptance.

Dataset ingestion does not grant rights to future member images. UK field data
requires its own explicit collection/annotation permission and provenance.

## Authoritative references checked 1 November 2026

- https://huggingface.co/facebook/deit-tiny-patch16-224
- https://github.com/facebookresearch/deit/blob/main/LICENSE
- https://huggingface.co/docs/transformers/model_doc/deit
- https://github.com/google-research-datasets/Nutrition5k
- https://creativecommons.org/licenses/by/4.0/

Current experiment evidence and costs are recorded in the existing project
checkpoint, `docs/grub-food-capture-20261031.md`, and the candidate's
`evaluation.json`. Source checks are not food accuracy evidence.

## Measured research outcome

Three actual candidates have been trained on the existing CPU resources. The
largest uses 1,200 training, 200 validation and 200 development-test images.
It warms up the food head, adapts the last two visual layers, and selects the
best epoch using validation loss with early stopping. That run selected epoch
2 and stopped after epoch 7, taking 220.34 seconds on four CPU threads.

Its validation-selected thresholds achieved 70.00% suggestion precision and
7.24% component recall on the development test; nine classes were disabled.
These results fail the proposed member-use floors. More images from the same
source did not fix the problem. The general visual representation and
mass-derived ingredient labels need reassessment against visually verified
target meals. There is no claim that the prototype recognises complete meals.

The development test includes previously inspected research examples; it is
not independent production acceptance. None of the three candidates is
approved or activated for members. No paid training service, GPU rental,
hosted inference, gated Llama agreement or member-photo collection was used.

The existing source CI passes the eleven model qualification checks, 137
focused app/food/logging checks and Worker dry-run build. The broader member
suite still fails the same two historical CSV-release checks on both current
and unchanged pre-feature source. Its overall result must not be called green.

Candidate evaluations and real JPEG round-trip receipts are in `evidence/`.
The persisted model package retains original licence/credit and public-data
provenance. Production still needs a qualified recognition approach, verified
representative UK meal and non-food labels, reviewed serving integration and
actual phone/photo-to-confirmed-log acceptance.

## Stronger encoder and recipe bank commands

Run from the repository root after installing the pinned requirements. Keep output
directories new; inference never downloads a model. The base download is about
812 MB and must match the pinned SHA256. It is not included in the small head artifact.

```bash
python shift-ai-food-model/semantic_model.py --help
python shift-ai-food-model/recipe_bank.py fetch-tokenizer --base /absolute/work/siglip-base
node shift-ai-food-model/recipe_catalogue.mjs /absolute/governed-sources /absolute/work/recipe-index.json
python shift-ai-food-model/recipe_bank.py build --base /absolute/work/siglip-base --catalogue /absolute/work/recipe-index.json --bank /absolute/work/recipe-bank --max-minutes 20
python shift-ai-food-model/recipe_bank.py text-check --base /absolute/work/siglip-base --bank /absolute/work/recipe-bank --research
python shift-ai-food-model/recipe_bank.py predict --base /absolute/work/siglip-base --bank /absolute/work/recipe-bank --research < bounded-request.json
node --test shift-ai-food-model/tests/recipe-catalogue.test.mjs
```

The pinned SigLIP config emits Transformers BOS/EOS default-ID warnings; its
published tokenizer supplies valid input token IDs. Text retrieval diagnostics
succeeded; these warnings do not establish photo accuracy and must be reviewed
again before selecting a production runtime. Similarity scores are not calibrated
probabilities. A meal absent from the catalogue can still receive bad suggestions.
Always allow rejecting every candidate. No auto-training or live diary write is
implemented by these research tools.

## Supervised learning from checked recipe photos

`recipe_learning.py` adds an offline recipe-specific learning path alongside
text-based recipe retrieval. It averages frozen pinned SigLIP image features
from checked training dishes into learned recipe prototypes. It does not update
the foundation encoder. No real recipe-specific model was trained in this pass:
the inspected source contains zero qualified current real-photo/recipe pairs.
The 26 Python checks use generated JPEGs and vector fixtures to test contracts
and learning mechanics. They are not food or recipe accuracy evidence. Fixture
manifests cannot train or load a saved recipe artifact.

Intake requires the current catalogue SHA256 and recipe content SHA256, checked
exact ingredients, real resized JPEG bytes, anonymous capture/dish/source groups,
and pinned local review and rights records. Inference/training permission is not
inferred from saving a meal or correcting a suggestion. Recorded permissions
must explicitly cover model training and evaluation; withdrawn or changed records
invalidate reuse on the next local load. These attestations need real human review:
the code cannot independently establish ownership or recognise a fraudulent label.
There is no live consent collection, revocation service, upload UI or deletion
service in this research module. No member data is collected by these commands.

Exact file and decoded-pixel duplicates are rejected across the dataset. A small
perceptual fingerprint also flags likely duplicate photos across splits; this is
conservative and may flag genuinely different dishes that need human resolution.
Capture, dish and source groups cannot cross splits. Use source groups to keep a
household/photographer session together without embedding personal identifiers.
Evaluation admits one photo per cooked dish, so repeat angles cannot inflate the
sample count. Training requires three independently cooked dishes per recipe,
at least two recipes, and five validation dishes for each recipe. A small pilot
could begin with two recipes, three training/five validation/five test dishes each,
plus five non-food and five other-food negatives in both validation and test
(46 photos total). That would test the engineering path, not qualify production.

Calibration uses validation only. Both negative categories need at least five
validation examples. A suggestion setting must achieve 90% overall validation
precision, no more than 5% negative false accepts, and measured support/precision
for every recipe. A strong recipe cannot hide a weak recipe. When no setting
qualifies, the model abstains on every image. Similarities are not probabilities.
Test metrics are descriptive development evidence; production readiness always
remains false pending independent UK acceptance and hosting/privacy checks.

Minimal manifest structure (the empty list is deliberate, not fabricated data):

```json
{
  "schema": "shift-recipe-photo-pairs-1",
  "data_kind": "real_recipe_photos",
  "catalogue_sha256": "SHA256 of exported recipe catalogue",
  "test_previously_inspected": false,
  "samples": []
}
```

Each sample must contain `id`, `path`, `sha256`, `split`, `capture_group`,
`dish_group`, `source_group`, `image_kind:"real_photo"`, and `target` equal to
`recipe`, `other_food` or `non_food`. Recipe samples also have current `recipe_id`
and `recipe_hash`; negatives carry neither. `review` has `checked:true`,
`ingredients_match` (true for recipe, false for negatives), `evidence` (relative
JSON path) and that evidence file's `sha256`. The review JSON binds `photo_sha256`,
`target`, `recipe_id`, `recipe_hash`, `ingredients_match` and `checked:true`.
`rights` has `basis` (`SHIFT-owned`, `CC-BY-4.0` or
`explicit-member-training-consent`), `attribution`, `evidence` and `sha256`.
Its JSON evidence must bind the photo SHA256 and basis, and explicitly record
`active:true`, `reviewed:true`, `training_reuse:true`, `evaluation_reuse:true`.
Do not put member IDs or contact details in manifests; paths stay local to the
photo-pair directory. Strip EXIF, location, XMP and comments before intake.
A generated image remains a fixture regardless of its filename or labels.

```bash
python shift-ai-food-model/recipe_learning.py qualify --manifest /absolute/pairs/manifest.json --catalogue /absolute/work/recipe-index.json
python shift-ai-food-model/recipe_learning.py train --manifest /absolute/pairs/manifest.json --catalogue /absolute/work/recipe-index.json --base /absolute/work/siglip-base --output /absolute/work/recipe-model-1 --max-minutes 20
python shift-ai-food-model/recipe_learning.py predict --manifest /absolute/pairs/manifest.json --catalogue /absolute/work/recipe-index.json --base /absolute/work/siglip-base --artifact /absolute/work/recipe-model-1 --research < bounded-request.json
```

Prediction requires the same qualified dataset and recorded permissions at local
load, the same base and current recipe hashes, and intact learned prototype bytes.
It returns either one possible recipe or abstains. Nutrition stays absent and
`autoSave` stays false. Current-recipe/substitution/portion confirmation still
belongs before the existing single member-food save route. No production flags,
service bindings or member UI were changed by this learning stage.

## Preparing and reviewing photos for the pilot

`recipe_intake.py` closes the gap between original photos and the checked
`recipe_learning.py` dataset. This is an offline operator workflow, not a hosted
member upload screen. Its commands never train a model, log food, contact another
service or grant photo rights. The current two-recipe pilot targets and exact
recipe hashes are in `evidence/recipe-photo-pilot.json`: beans on toast and scrambled
eggs on toast, 46 independent photos including validation/test negatives. These
numbers support a small engineering pilot, not production accuracy acceptance.

1. **Prepare:** accept up to 200 JPEG/PNG/WebP stills per batch, each at most 30 MB
   and 50 million pixels. Apply EXIF orientation, resize within 768 px, rebuild
   from RGB pixels and save a JPEG within the existing 750 kB limit. Source
   originals are unchanged. The queue retains original and prepared SHA256 values
   but no original filenames, EXIF, XMP, comments or location. A current recipe
   hint is optional and never counts as a confirmed label. HEIC/animated inputs
   need an explicit still JPEG export; they are not silently interpreted.
2. **Label:** an operator checks that this is a real photo without private content,
   confirms the exact recipe ingredients (or a negative category), records anonymous
   capture/dish/source groups and a split, and points to an existing reviewed
   permission record. The queue stays immutable; a separate pinned review record
   describes the explicit operator decision. This is an attestation, not proof
   that a picture is real or that the operator owns it. No checkbox or permission
   is checked automatically. Member diary consent does not authorise training.
3. **Export:** assemble only reviewed photos and pinned review/permission evidence
   in a new dataset directory. Re-run the existing complete pair qualification,
   including source-group leakage, exact-recipe versions and duplicate checks,
   before making the output available. Unreviewed photos remain pending. Changed
   photos, permissions or recipe versions block export. Failed imports/exports
   leave no completed output directory; existing work is never overwritten.

Example import description (paths are relative to the separately supplied source
folder; IDs must be anonymous):

```json
{
  "schema": "shift-recipe-photo-import-1",
  "data_kind": "real_recipe_photos",
  "photos": [{"id":"beans-001","path":"photo.jpg","recipe_hint":"everyday-beans-on-toast"}]
}
```

The required permission JSON is placed inside the review directory and binds the
**prepared** `photo_sha256`. It records `basis`, `attribution`, `active`, `reviewed`,
`training_reuse` and `evaluation_reuse`. The last four must be explicitly true
on the basis of actual permission before labelling is allowed. The tool does not
create that permission. Keep personal contact information out of these research
records. Revocation must be managed in every exported dataset and derivative;
there is no central live revocation registry or deletion service in this offline
workflow. Checking pinned local evidence does not establish that an external
permission is still active. Production collection/revocation remains separate.

```bash
python shift-ai-food-model/recipe_intake.py prepare --batch /absolute/import.json --source /absolute/originals --catalogue /absolute/work/recipe-index.json --output /absolute/review-queue
python shift-ai-food-model/recipe_intake.py label --queue /absolute/review-queue/queue.json --catalogue /absolute/work/recipe-index.json --photo-id beans-001 --target recipe --recipe-id everyday-beans-on-toast --split train --capture-group capture-001 --dish-group dish-001 --source-group source-001 --permission permission-beans-001.json --confirm-real-photo --confirm-ingredients --confirm-no-private-content
python shift-ai-food-model/recipe_intake.py export --queue /absolute/review-queue/queue.json --catalogue /absolute/work/recipe-index.json --output /absolute/checked-pairs --test-history unseen
```

Do not use `unseen` after inspecting the test images to improve the model; choose
`previously-inspected` instead. Training still needs the independent splits and
minimum support described above. Fixture input must be `fixture_only`; that mark
is preserved through review/export and prevents saved training/serving.

Verification includes a pinned actual public Nutrition5k PNG converted to a
metadata-free JPEG, with its original bytes unchanged. It remained pending and
export correctly refused: no SHIFT recipe label or new permission was invented.
Generated fixture checks separately cover a complete reviewed export; that is
plumbing/contract evidence, never real recipe accuracy. The saved Library images
inspected during this continuation were interface concepts rather than checked
recipe photographs, so they were not imported or labelled for training.

## Full-test findings, 1 November 2026

The complete test summary is `evidence/full-test-20261101.json` and the existing
project checkpoint records scope and limitations. Software qualification passes,
but the recogniser is NOT ready: 70.87% precision / 31.03% recall on 200 previously
inspected public development images, false food on three of four synthetic
non-food controls, and one actual-model adapter process launch timed out at the
unchanged 14-second child deadline. No real UK recipe or phone acceptance is claimed.

To reproduce the actual-model diagnostics after restoring the pinned base,
candidate and exact research images:

```bash
python shift-ai-food-model/verify_semantic.py /absolute/base /absolute/candidate-4 /absolute/data/manifest.json
python shift-ai-food-model/verify_controls.py --base /absolute/base --candidate /absolute/candidate-4 --research
node shift-ai-food-model/verify_binding.mjs /absolute/python /absolute/candidate-4 /absolute/public-test.jpg /absolute/base
node --test shift-ai-food-model/tests/recipe-log-integration.test.mjs
```

`verify_controls.py` intentionally exits 1 for this failed model smoke test. Do
not lower its requirement, remove the controls or call them a real-world negative
benchmark. The fourth optional adapter argument selects the SigLIP model path;
without it the older self-contained DeiT research candidate path is preserved.
No timeout, release flag, model weight, acceptance threshold or runtime code is
changed by these diagnostics.

## Preloaded research worker and experimental food-presence gate

The per-request Python launch is superseded locally by `local_worker.py` and
`local_worker_client.mjs`: initialise once, await readiness, then pass requests
through the existing shared adapter. Scans before readiness are refused; startup
is not hidden inside a longer member request. Scan deadlines stay 14 seconds
inside the unchanged 15-second adapter deadline. Startup has a separate bounded
45-second ceiling. Timeout/abort kills the child and requires explicit recovery;
there is no automatic retry, queue or remote fallback. Normal invocation refuses
research models. This remains local stdin transport, not a hosted service.

`food_gate.py` uses the same image features and fixed text/image concepts before
returning food labels. The retained reference bank is in
`references/food-presence-v1/`, with its original base licence. It is an
experimental reference layer, not a newly trained foundation or recipe model.
Its threshold was selected only on 200 validation food photos for a fixed 95%
retention objective. It rejected all four known synthetic controls and kept
189/200 food development-test images, but component recall fell from 31.03% to
30.00%. Food precision is still about 71%. Real non-food and UK acceptance remain
outstanding. Do not promote the prototype on the basis of four known controls.

```bash
python shift-ai-food-model/food_gate.py --base /absolute/base --output /absolute/initial-gate
python shift-ai-food-model/food_gate.py --base /absolute/base --candidate /absolute/candidate-4 --gate /absolute/initial-gate --manifest /absolute/data/manifest.json --output /absolute/calibrated-gate
python shift-ai-food-model/verify_gate.py --candidate /absolute/candidate-4 --base /absolute/base --gate shift-ai-food-model/references/food-presence-v1 --manifest /absolute/data/manifest.json --research
node shift-ai-food-model/verify_warm_binding.mjs /absolute/python /absolute/candidate-4 /absolute/base shift-ai-food-model/references/food-presence-v1 /absolute/public-test.jpg
node --test shift-ai-food-model/tests/local-worker-client.test.mjs
```

The warm-binding proof measures readiness separately, reuses the actual model
for multiple requests, checks private-field refusal and closes the process.
Its true-valued capability flags exist only in the local test object; it changes
no Cloudflare configuration or production activation. The earlier process-launch
failure and full-test quality failures remain in their original receipts.

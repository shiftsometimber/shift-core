# Shift AI: food capture and research

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

Matt authorised the Cal AI-inspired Grub work on 31 October 2026.
He subsequently instructed that both food recognition and the MediSearch-style
research capability belong inside Shift AI. No competitor trial, subscription
or integration is part of this implementation.

## Data-opportunity access check — 1 November 2026, Europe/London

Matt asked to check the opportunity if there was no cost. The public visible-region
annotation source was pinned at 0997586b5c177fa8f2c0a61eb7f958ab18605362 and its
CC BY 4.0 commercial-adaptation/attribution terms inspected. Retrieved CSV/licence
and eight train-only image/mask pairs without purchase, registration, publisher
code execution, new paid compute or communications. All eight original-image
hashes, dimensions and region pixel counts matched. Their overlays were visually
inspected for plausible food alignment, not independently human-adjudicated.

The metadata covers 1,056 dishes, 2,922 regions and 40 coarse categories. Existing
data overlap is 421 training, 52 validation and 54 previously inspected test
photos; preserve the splits. Coarse category mapping and crop/inference design
remain to be checked. In particular, using ground-truth test masks cannot be
presented as member camera performance. At that earlier access-review checkpoint, no retraining had started; the later visible-food results above supersede that status.

MyFoodRepo's published v2.1 release has 54,392 training photos/323 classes and
stated CC BY 4.0 data licensing. Its download path redirects to sign-in; the site
advertises free participation, but standalone authenticated download conditions
have not been inspected. No account or challenge entry was created. Entry/model
submission rights were identified separately and not accepted or represented as
conditions automatically attached to standalone data use.

Full access/cost/sample review: shift-ai-food-model/evidence/visible-data-access-review.json.
The public annotation improvement can proceed as a controlled comparison on
existing resources; no dataset fee was paid and no new paid service was added.
This is an access/data review, not a trained-model improvement or release.

## Model startup and experimental rejection progress — 1 November 2026, Europe/London

Matt flagged a stall and required faster progress. Source checkpoint was
`6b5e4bd78ff1bfeba570f7e8a3fc45322c8ee05f`, verified on the existing feature
branch. The existing full-test failures remain recorded below, not rewritten as
passes. This continuation changes actual local inference behaviour and lifecycle;
it is not another source audit or a production release.

Implemented a research-only preloaded Python worker and bounded asynchronous
Node client. Model files and a pinned food-presence reference bank load once,
before a readiness handshake permits scans. The shared Shift AI adapter keeps
its 15-second deadline and the child scan deadline remains 14 seconds. Startup
has a separate bounded 45-second ceiling, with immediate refusal of scans before
readiness. No scan waits in a cold-start queue. There is one in-flight request;
timeout/cancellation kills the worker and suppresses late responses. No automatic
retry/restart, HTTP listener, remote model fallback, raw-request logging or diary
writer is introduced. The process is closed after each diagnostic.

Actual candidate-4 proof through the shared adapter: initial readiness 6,472 ms;
one real public food photo 470 ms and one blank control 428 ms. One model load
served both requests in the same process; the food returned carrots, the blank
returned no food or nutrition. Private identity fields were refused. Earlier
zero-margin prototype timing was 5,595 ms startup and 364/335 ms scans. These are
local process measurements, not hosted or phone acceptance. A final recheck
using the retained source-reference files and strict output validation took
11,580 ms before readiness, then 329/225 ms for food/blank scans; startup
variability is retained rather than reporting only the fastest run. The earlier failed
14-second process-per-scan launch remains valid historical evidence; it was not
repeated with a longer request timeout to obtain a pass.

Implemented a separate experimental food-presence gate using the same pinned
SigLIP encoder and fixed food/other text concepts. Captions do not supply gate
concepts. Cached reference vectors carry base revision/weight pins and licence.
The first zero-margin setting rejected all four known synthetic controls but
also rejected 47/200 food photos, so it was not selected as-is. A second gate was
calibrated using ONLY 200 original validation food photos, with a fixed objective
of retaining at least 95%. It retained 191/200 validation images. No negative
controls or test labels selected the margin threshold (-0.02740558923611641).

The calibrated gate then retained 189/200 food development-test photos (94.5%)
and rejected all four known synthetic controls, compared with three false food
suggestions in the baseline. Component precision/recall were 70.73%/30.00%,
versus 70.87%/31.03% without the gate. Thus the gate improves these known controls
at a small food-coverage cost; it does NOT improve the underlying food classifier
or meet release accuracy floors. Both the food test and four controls were
previously inspected development material, not independent acceptance. A real
non-food benchmark and fresh UK exact-recipe data remain missing. No claim of
reliable general non-food rejection is made.

The gate cache is retained in shift-ai-food-model/references/food-presence-v1.
The original food head weights and thresholds are unchanged; score differences
remain at most 8.11e-6. Existing trained model archive version 3 is preserved;
new source-backed gate references are stored with the code instead of duplicating
that archive. Python qualification now has 42 passing checks and worker lifecycle
has eight passing Node checks, including readiness, reuse, bounded startup,
request timeout, abort, bad protocol and fixed endpoint/body limits. Existing
member and release checks are retained by the workflow.

Results: shift-ai-food-model/evidence/photo-model-progress-20261101.json, with
full initial/calibrated gate and warm-adapter receipts beside it. Current state:
startup reuse implemented and locally verified; semantic rejection experimental;
food recognition remains below quality floors; nothing deployed or activated,
no new paid service or gated licence accepted. Model work can continue
independently of the historical CSV failures. Next work is stronger recognition
and genuine non-food/UK-recipe data, then hosted/installed-device acceptance.

## Full test — 1 November 2026, Europe/London

Matt explicitly requested a full test. Application source was verified at
`a4061f00faa36b3f0af206e0f9d838bf2c219ffc`. Existing development-only scope,
no production activation, no new paid service and no member training-data reuse
were preserved. The overall result is **NOT READY FOR RELEASE**.

| Check | Result | Limit |
| --- | --- | --- |
| Data/intake/learning qualification | 38 Python checks pass | Contract fixtures, not recipe accuracy |
| Food, recipe, shared AI and new logging integration | 145 pass, one existing opt-in skipped | Includes four actual recipe-catalogue and four new local recipe/log bridge checks |
| Complete member suite | 580/582 pass | Same two historical CSV Registration-tail failures; gates retained |
| Actual Worker dry-run build | Pass | No upload or production release |
| Saved model on 200 pinned real public JPEGs | Reproduces its recorded predictions; 70.87% precision, 31.03% recall | Twelve ingredient groups, previously inspected US development set; fails proposed 90%/60% quality floors |
| Four synthetic non-food smoke controls | FAIL: food suggested for three | Black, white and seeded random noise produce food; grey abstains. Not a real non-food benchmark |
| Actual candidate 4 through shared adapter/local process | FAIL: child ETIMEDOUT at 14 seconds | One attempt; unchanged 15-second shared deadline, no automatic retry or successful serving claim |
| Recipe reference bank | Three text queries rank intended recipes first; one public JPEG returns candidates, no nutrition/auto-save | Not exact-recipe photo accuracy |
| Generic public PubMed connection | Pass, two requests, no journey used | Citation metadata only, not clinical appraisal |

The added integration test uses explicit simulated confirmation of the current
beans-on-toast recipe and 1.5 servings, maps the reviewed draft into the existing
authenticated diary API, and verifies real in-memory SQLite writes. Retry counts
once; diary/shared AI see the source-derived amount; another account cannot see
it; deletion removes amounts and food facts. Unconfirmed/stale recipe versions,
invalid portions, changed ingredients and optional nutrition behave correctly.
Withdrawn consent returns the existing 409 health_consent_required contract and
writes nothing. This test-harness bridge does not claim the live recipe UI has
been wired to the diary. It is now included in the existing focused CI job.

The saved research archive was verified at version 3 and its full ZIP CRC/pinned
hash, recipe catalogue, learned head and provenance were checked. The public
SigLIP base was restored against its original immutable revision and SHA256;
all 200 source PNG and transformed JPEG hashes were checked, downloading
86,201,740 public image bytes within the explicit 200 MB recovery budget. The
200 fresh forward passes differ from recorded probabilities by at most 8.11e-6.
Mean local warm image inference was 253.52 ms; this is neither phone timing nor
production cold-start acceptance. Test labels, weights and thresholds were not
changed. No new model weights were trained.

The one-process-per-request actual-model adapter diagnostic exceeded its 14-second
child deadline on its first run. Successful standalone batch inference does not
supersede that failure. No longer timeout or retry was used to obtain a pass.
The new verify_controls.py makes the failed synthetic-negative smoke checks
reproducible and exits non-zero when food is suggested for a control. These are
separate from the 38 passing software qualification fixtures.

An initial sparse local checkout lacked binaries and was a partial/promisor
clone, producing five environment-specific failures in addition to the CSV pair.
A complete non-promisor repository and all assets were recovered and the full
member suite rerun with canonical concurrency two: only the two historical CSV
failures remain. No source guard or release qualifier was relaxed.

Missing acceptance remains: fresh independent UK exact-recipe photos, a real
non-food rejection set, a trained recipe-specific model, an implemented/accepted
internal serving process, live photo-to-save integration and actual installed
phone capture. Highest priorities are reliable non-food/unknown rejection and
serving lifecycle, alongside collecting checked recipe-photo pairs. Nothing
has been deployed or switched on. Do not describe the passing logging/software
checks as proof that the recogniser works accurately for members.

Machine-readable summary: shift-ai-food-model/evidence/full-test-20261101.json.
Actual forward-pass, negative-control and recipe-photo receipts are saved beside
it. Verification helpers gained candidate-4 support and actual metric reporting;
model architecture, training weights, thresholds and app runtime are unchanged.
Final CI for these new test/helper files is reported separately from the tested
application source above.

## Offline photo intake and review — further continuation, 1 November 2026 Europe/London

Matt said “Crack on”. The existing feature head was verified as
`73b0e38c9391293c360109982ccdba38daea3e3f`; code/checkpoint files removed by
workspace maintenance were restored from that exact committed source. The
research archive remains Library version 3. Its retained local bytes matched
SHA256 `c883c85e1fe57552238bbd02ba3a032b7079fe490ca76fd918ea4aec96c521be`,
and its 2,692-recipe catalogue was recovered with the bank's recorded SHA256.
No model weights or prior acceptance were discarded or retrained.

Implemented `shift-ai-food-model/recipe_intake.py`: bounded still-photo import,
EXIF orientation, metadata-free JPEG conversion within 768 px/750 kB, original
and transformed SHA256 lineage, immutable pending-review queue, explicit exact
recipe/negative review and existing training-permission evidence, then export
through the existing full recipe-pair validator. Source originals are unchanged;
original filenames and location metadata are omitted from the queue. No pending
photo becomes training data automatically. Existing output directories are never
overwritten; failed prepare/export operations do not publish partial datasets.
No live member upload, diary save, consent collection or service is introduced.

A narrow saved-image search found candidate images. Three plausible food-named
or highly ranked candidates were read and were interface/concept mock-ups, not
checked recipe photographs. They were not imported or labelled; the search is
not an exhaustive claim that no real photos exist anywhere. Retired handovers
were excluded and not read. No private member image was used for training.

An actual pinned Nutrition5k PNG (305,308 bytes) was prepared successfully, with
the original SHA256 verified before and after. The prepared JPEG stayed pending;
export refused because there was no checked recipe/permission record. No exact
SHIFT recipe or training authorisation was invented. Receipt:
`shift-ai-food-model/evidence/recipe-intake-public-check.json`.

The concrete starter pilot uses the current beans on toast and scrambled eggs
on toast recipes, with pinned source hashes and ingredient lists. Three training,
five validation and five test dishes per recipe, plus five non-food and five
other-food photos in each held-out split, make 46 photos. This is a small
engineering pilot, not production acceptance. No real recipe-photo dataset or
new recipe-specific trained weights exist yet. Target receipt:
`shift-ai-food-model/evidence/recipe-photo-pilot.json`.

Local checks cover the original 26 qualification/learning cases plus 12 intake
cases, including EXIF orientation/removal, pending/permission refusal, immutable
source files, complete fixture review/export, altered bytes, wrong recipe labels,
source-group leakage, oversized and animated inputs. Fixtures cannot produce
saved training artifacts. Permission records are operator attestations, not
independent legal proof. Revocation must cover every exported copy/derivative;
a central live consent/revocation service remains unbuilt.

Previous exact-source CI run 41295308786 passed all 26 Python/four recipe checks,
137 focused member checks (one opt-in skipped), actual Worker dry-run and public
PubMed connectivity. The full member suite retained the two historical CSV
Registration-tail qualification failures (580/582 pass). Existing gates are
preserved. No new cost, licence acceptance, deployment or communications occurred.
Next data dependency remains actual independently grouped recipe photos with
checked ingredients and genuine training/evaluation permission. New source code
belongs in Git; the existing model archive is unchanged because no new weights
were trained during intake development.

## Recipe-photo learning pipeline — subsequent continuation, 1 November 2026 UTC

Matt authorised further development. Existing development-only scope, no spend,
no external communications, no gated licence and no production activation remain.
Feature checkpoint was `ed662ed2962591656de061280b76d0daf8f5aeae`; source branch
was rechecked at that head before this continuation. No AGENTS.md occurs in its
complete recursive source tree. The saved research archive remains version 3;
this stage adds source code, not new real trained weights, so it is not replaced.

Implemented `shift-ai-food-model/recipe_learning.py`: current-recipe/hash and
photo-pair qualification, pinned rights and exact-label evidence, JPEG/metadata
checks, duplicate decoded pixels and conservative cross-split perceptual checks,
and independent capture/dish/source groups. Validation/test admit one photo per
cooked dish. Fixture-only datasets cannot produce or load a saved recipe artifact.
Rights records are human attestations checked by code, not independent legal proof.
No implicit reuse of member meals or corrections is permitted.

The offline learner builds recipe visual prototypes from training photos only
using the existing pinned frozen SigLIP base. It requires at least two recipes,
three independent training dishes and five validation dishes per recipe.
Validation-only similarity/margin calibration needs both non-food and other-food
negatives; every advertised recipe needs measured validation support and precision.
Failure produces abstention, rather than lowering the floor or inventing a match.
Held-out reporting counts wrong recipes, recall, coverage and negative false
accepts. Similarities are not percentage confidence. All outputs remain research
only, with no nutrient prediction or diary writes. Local model loading rechecks
recipe versions, source photos, evidence/permission pins and prototype integrity.

Local verification: 26 Python checks pass, including 15 new recipe-learning
checks; four existing governed-recipe/confirmation Node checks pass. Generated
JPEGs and vector fixtures test mechanics only, not food accuracy. The actual
source readiness audit still has ZERO qualified real current recipe-photo pairs;
no recipe-specific training run or new recipe accuracy result is claimed. Generic
Nutrition5k dishes were not assigned false SHIFT recipe labels. Readiness evidence:
`shift-ai-food-model/evidence/recipe-learning-readiness.json`.

Previous exact-source CI run 41294130920: model/recipe job passed, focused food
checks 137 passed/one opt-in skipped, actual Worker dry-run and public PubMed
connectivity passed; full member regression 580/582 with the two historical
weight-import CSV failures. Both feature failures report the frozen Registration
tail qualifier. The unchanged-base diagnostic's second test additionally encounters
worktree `.git/index` incompatibility, so identical baseline error text is not
claimed. Existing checks are retained, no skips or relaxed release gates added.

Next data dependency: checked real recipe-labelled photos with actual reuse
permission and independent groups. Begin with a small two-recipe engineering
pilot; representative UK and non-food acceptance must follow. This is neither a
member upload/consent flow nor a deployed training/serving/revocation service.
The existing text recipe bank and previous food component models are preserved.

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

## Own food-model development — 1 November 2026, Europe/London

Matt said “Let's go” after the recommendation to train a specialist food model
using a commercially reusable visual base and training images. This authorises
the development/training route, not new paid training, an external subscription,
the gated Llama vision agreement or a production promotion. Existing capture,
confirmed logging and shared AI integration are preserved.

`shift-ai-food-model/` now contains bounded public-data acquisition, rights and
image pins, grouped dataset qualification, local training, validation-only
threshold calibration, held-out reporting and offline JPEG inference. The
published Apache-2.0 DeiT tiny visual base is pinned to
`b3428f18dcc7b543470d07f14b4a4157815d1880`; its publisher's original weight
SHA256 is verified before restricted weights-only loading. Derivatives are
saved as safetensors with base credit/licence and data attribution. No model
code is downloaded/executed by training or inference. No member images are used.

The public Nutrition5k publisher permits commercial adaptation under CC BY 4.0.
The first data preparation downloaded 232,107,575 bytes for 520 real RGB images,
retaining source links and original/transformed SHA256 values. Whole capture
weeks are disjoint across train/validation/test (13/7/7 weeks respectively).
These are custom grouped development splits, not the paper's benchmark.
The initial vocabulary is twelve food components. Ingredient mass annotations
are a visibility proxy; this US cafeteria data cannot validate UK meals.

Completed actual CPU training, with no paid training service or GPU rental:

| Experiment | Training / validation / test images | Calibrated test precision | Calibrated test recall | Scope |
| --- | --- | --- | --- | --- |
| First food head, frozen visual encoder | 320 / 100 / 100 | 68.75% | 7.38% | First research test; ten classes disabled for inadequate validation support |
| Last two visual layers plus food head | 320 / 100 / 100 | 30.77% | 2.68% | Development test previously inspected; eleven classes disabled |

The stronger pass ran 20 epochs and selected epoch 4 by validation loss; its
training took 190.03 seconds on four CPU threads. At an uncalibrated fixed 0.5
threshold it achieved 32.39% precision / 53.69% recall, still unacceptable for
members. Results have not been relabelled or presented as production accuracy.
The first run took 12.44 seconds after data preparation. Neither candidate is
ready for production. Eleven focused data/evaluation/contract checks pass.

The second saved candidate passed 100 real-JPEG round trips; saved-model
probabilities differ from reported evaluation by at most 2.39e-7. It returns no
invented nutrients, rejects member identity fields, and normal invocation refuses
the research candidate. A separate local process diagnostic exercises the
existing shared Shift AI service adapter with actual candidate inference;
this does not provision a service binding or verify production serving.

The expanded experiment is now complete: 1,200 training / 200 validation / 200
development-test images, reusing all 520 verified initial images. It downloaded
458,084,827 additional public-source bytes within its explicit budget. The food
head was warmed up for ten epochs before adapting the final visual layers.
Validation selected epoch 2; early stopping ended the run after epoch 7.
Training took 220.34 seconds on four CPU threads, with no paid training service.

Its validation-selected thresholds achieved 70.00% suggestion precision and
7.24% annotated-component recall on the 200-image development test; nine classes
were disabled. At fixed 0.5 thresholds the same run achieved 39.72% precision,
68.62% recall and F1 0.5032, compared with F1 0.2667 for the fixed two-common-food
baseline. This demonstrates learned food signals but fails member-use quality.
The development test contains previously inspected research examples. It is
not fresh production acceptance, UK-meal validation or evidence of portions.

The third saved model passed 200 actual-JPEG inference round trips, with
maximum probability difference 3.58e-7 against the recorded evaluation. Normal
invocation remains blocked; private identity fields are rejected and nutrient
amounts are not invented. Its warm four-thread CPU forward median was 22.38 ms
on one research image; complete local process startup/adapter timing is a
different measurement and neither is production or installed-phone latency.
The existing Shift AI adapter also executed the actual third candidate through
the local diagnostic process transport. No service binding is provisioned.
An initial third-candidate process diagnostic failed without retaining the
child's status details. Failure reporting was improved; one repeat completed
successfully in 8,385 ms. The 15-second shared delivery deadline and 14-second
child deadline were unchanged. This does not prove production cold-start
reliability; the source diagnostic receipt records its local-only scope.

Training code and candidate evaluations are saved on the existing feature
branch. The trained weights, licences, provenance, evaluations and round-trip
receipts are retained in the model research package. All three experiments
used existing CPU resources and public data; no external model API, paid GPU,
account, subscription or gated Llama agreement was used. No further training
job is running after this checkpoint.

The next substantive model work is a visually verified target-meal dataset and
recognition/label reassessment. A representative UK set and non-food rejection
evidence remain necessary. Public source rights/suitability findings are in
`shift-ai-food-model/data-source-review.md`; category labels and synthetic food
stimuli are not accepted as real UK meal ground truth. These model/data
limitations are distinct from source tests or hosting cost approval.

Hosted source proof at `35c36790cda4e04dd7925132477a06eb67700b31`:
https://github.com/shiftsometimber/shift-core/actions/runs/41289037665
The model job passed all eleven qualification checks. The app job passed 137
focused checks (one existing opt-in real-model probe skipped), actual Worker
dry-run build and public PubMed connectivity. The wider suite passed 580/582,
with only the same two historical CSV qualification failures, both reproduced
on unchanged pre-feature source. Overall CI remains failed; no guard is altered.

Production flags, main, live runtime, native binaries, accounts and commercial
commitments are unchanged. Existing two historical CSV-release failures remain
separate from food-model accuracy. The branch now preserves all seven disjoint
Bloods owner commits from current main `a1741848bd6dca238def63d9ee6f03ff45e8a7ea`.
No public Bloods release is retriggered by this feature-branch reconciliation.

## Shared Shift AI implementation

`shift-ai-capabilities.mjs` is the shared inference boundary used by the existing
Shift AI assistant, Ask Timber and Grub. Existing text model selection and
gateway options are preserved. Calls have a 15-second delivery deadline, honour
request cancellation and never retry automatically. This is our product and
orchestration code; it does not claim to train a foundation model from scratch.

Food vision supports an internal `SHIFT_AI_VISION` Worker service binding as
well as the previously prepared Workers AI adapter. The service receives only
`task`, resized image, caption and output limit at a fixed internal path; it
receives no member cookie, identifier or journey. It must implement
`POST https://shift-ai.internal/recognise-food`, return JSON food items and
optional nutrition, and comply with the same per-scan consent and review flow.
No internal vision service has been provisioned or claimed as running.
No additional photo processor, model licence or spend has been activated.

## Research inside Ask Timber

The existing question form now offers **Find research and sources**, with all
research, evidence review and randomised-trial filters. It calls the existing
`/v1/ai/chat` route with explicit `research:true`. The authenticated Shift AI
chat route can delegate the same opt-in to that route. Urgent signposting and
truthful Matt handoff still take precedence. Normal chat behaviour, saved
journey permissions and common conversation boundaries remain in place.

Research supports fixed general topics: GLP-1 medicines, testosterone,
nutrition/protein, sleep, sleep apnoea, walking and weight management. Only
server-owned topic terms reach NCBI E-utilities; no member wording, blood
results, identifiers, chat history or private record is sent. Requests use
fixed HTTPS endpoints with redirects rejected. The existing D1 binding stores
generic public citation metadata for six hours and enforces at least 600 ms
between individual upstream request starts across isolates. Empty, unavailable
and throttled results are distinguished, and UK source links remain usable.

Cards show original PubMed URLs and PMIDs, indexed publication dates, journal
and study type. Requested IDs are checked against returned IDs. Obvious
retracted/correction records are excluded from the index response. This is
not a complete independent retraction check, critical appraisal, systematic
review, diagnosis or prescribing service. Abstracts/full papers are not copied,
and metadata is not fed to the model as clinical evidence. The interface links
NCBI's required policies/disclaimer and labels references as unappraised.
Research mode makes no inference call and can return guidance without AI.

Authoritative implementation references checked 31 October 2026:
- https://eutilities.github.io/site/API_Key/usageandkey/
- https://www.ncbi.nlm.nih.gov/home/about/policies/
- https://dataguide.nlm.nih.gov/eutilities/utilities.html
- https://www.nice.org.uk/guidance/ng246
- https://www.nhs.uk/conditions/male-menopause/
- https://www.nhs.uk/conditions/sleep-apnoea/

## Grub

### Confirmed food integration — 31 October 2026, Europe/London

Matt required saving food to update the wider logs and shared Shift AI context.
The previous branch saved the diary but left that connection incomplete.

`member_food_entries` is now the single source for confirmed eaten food.
`food-log.mjs` calculates today's and the last seven days' entry counts and
optional nutrition, with known/missing amount coverage. It aggregates the full
date range independently of the 365-entry diary and 12-entry AI display limits.
Actual recorded zeros count; unknown amounts remain absent. Planned meals and
separately entered daily progress totals are never added to food-log amounts.
There is no duplicate write to progress, plans or AI memory.
Counts, amounts and recent foods are read in one SQLite statement snapshot, so
a concurrent deletion cannot pair an earlier count with a different food list.

The existing diary API returns this read model. Connected Today context and
the shared member journey expose the same model to Shift AI and Ask Timber.
Direct questions about today's logged food, protein or energy use current
confirmed records without a model call, including after deletion. Context
rules prohibit restoring deleted entries from chat or presenting partial logs
as a complete day's intake. Unrelated practical questions omit the food list.

Shared Today and Journey cards show recorded food and optional totals. Saves
and deletions emit invalidation signals; other tabs receive no food content or
member identifiers and fetch their own authenticated records. Views verify the
current account before displaying results, cancel stale reads, and clear on
background/navigation. Grub's summary reads the same aggregate rather than
counting a truncated client history. Save acknowledgement remains distinct
from a failed view refresh; simultaneous identical retries count once.

Local checks cover real authenticated SQLite saves, idempotent/concurrent
retries, deletion, consent/pause and changes during reads, account separation,
London dates, missing-versus-zero amounts, full-range totals beyond display
limits, current AI facts and cancelled/mismatched-account view responses.
Hosted checks additionally exercise the actual Ask Timber route and shared
brain. The first logging proof at 76ae5783730faa43935b0618f1e38c63dd1de615
passed 133 checks with one pre-existing opt-in model probe skipped; the Worker
build passed. Regression checks identified summary requests added to the old
UI-only asset; the corrected version serves a separate read-only food-log asset
and keeps that original asset byte-for-byte unchanged. No guard was weakened.
Browser acceptance and the current CI run must be read separately from these
implementation statements. Photo processing remains inactive; no
additional processor, agreement, paid inference or production release is
activated by this logging work.

The existing private food diary is extended with description, packet lookup,
photo-recognition preparation, explicit portion review, recent foods and a
summary of actual saved entries. Recipe plans never count as eaten food.
Nutrition is optional. Unknown amounts stay absent; actual zero stays zero.
No daily calorie target, punitive streak or clinical recommendation is added.

## Implementation

- The shared Grub diary runtime contains the new interface. Web and native
  WebViews use the same hosted source. Native installations have not been
  physically accepted for this change, and no binary or store submission is changed.
- `/v1/grub/capture` authenticates the existing member session and checks
  current optional tracking consent and pause state. POST is same-origin JSON.
- Descriptions create a draft without inference or guessed nutrients.
- Packet lookup validates a GTIN check digit and sends only the barcode to
  Open Food Facts. The fixed upstream receives no session, member identifier,
  meal description or photograph. Results include attribution and remain
  editable; community product data does not establish allergy safety.
  Public product data is cached for 24 hours. Uncached lookups are spaced at
  least 4.1 seconds apart across members/isolates, below the product API's
  15 requests/minute limit. Member consent and daily limits apply on cache hits.
- Packet values retain their stated 100 g / 100 ml basis. A member supplies
  the amount eaten before copying nutrition into the diary. Name-only logging
  is available without numerical tracking.
- Photos are chosen deliberately, resized to 768 px maximum, re-encoded as
  JPEG and stripped of original metadata in the browser. Per-scan AI consent
  is required. Raw photos are not written to the My Timber database or client
  persistent storage. The configured provider still processes the image.
- Recognition returns bounded food names and nutrient estimates only. Nothing
  saves automatically. The member checks and edits the diary draft, then uses
  the existing save route and its operation identifier.
- Additional confirmed nutrition remains inside the existing food record, so
  account export, Journey erasure, deletion and account isolation retain the
  existing storage path. Scan allowances use their own preference branches;
  aggregate model counters have no member identity or food content.
- Cancel, close, navigation and background cleanup remove transient scan
  results. Denied or unavailable features retain manual food entry.

## Photo activation requires a separate decision

Photo inference remains OFF without explicit existing configuration approval.
The canonical Shift AI configuration is:

```
SHIFT_AI_FOOD_PHOTOS_ENABLED=true
SHIFT_AI_VISION_BUDGET_APPROVED=true
SHIFT_AI_VISION_TERMS_APPROVED=true
```

Then either bind the approved internal `SHIFT_AI_VISION` implementation or
select the prepared Workers AI adapter with
`SHIFT_AI_VISION_MODEL=@cf/meta/llama-3.2-11b-vision-instruct`.
Unrecognised model names are rejected. The former Grub values remain accepted
for compatibility, with canonical Shift AI values taking precedence:

```
GRUB_CAPTURE_VISION_ENABLED=true
GRUB_CAPTURE_BUDGET_APPROVED=true
GRUB_CAPTURE_VISION_TERMS_APPROVED=true
GRUB_CAPTURE_VISION_MODEL=@cf/meta/llama-3.2-11b-vision-instruct
```

No code automatically sends the licence acceptance request. Cloudflare's
documentation requires acceptance of the Meta licence and acceptable-use policy
before the first normal model request. Verify any existing account acceptance
before proposing a new acceptance action.

Built-in allowances: at most 5 photo requests per member per UTC day, 50 across the
service per UTC day and 500 across the service per UTC calendar month. Failed
or timed-out calls still consume their reservation; no automatic inference
retry occurs. Maximum model output is 400 tokens.

No new cost or licence has been accepted. The earlier proposed external
photo pilot is not an active purchase request. Model deployment remains an
infrastructure choice behind our shared Shift AI capability; existing text
inference does not automatically authorise a new vision model or its terms.

References:

- https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/data-usage/
- https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE
- https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md
- https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/
- https://world.openfoodfacts.org/terms-of-use

## Verification and remaining acceptance

Local Node/SQLite: 48 checks passed, including the shared model boundary,
generic research caching/throttling, verified citation IDs, existing London calendar
boundary tests, authenticated saves, duplicate prevention, account separation,
current consent, withdrawal during inference, portion scaling and usage caps.
First shared-engine hosted proof at commit
`043fe6bb23ccda35a0635a780d69e8690001f037`: 74/74 focused food, research,
privacy, real-diary and existing Ask Timber conversation checks passed. The
actual Worker dry-run build passed. The wider member suite passed 561/563;
the two failures are the CSV historical-release qualification tests, which
reject the registration tail. Both reproduce on the unchanged pre-feature
source base. No test has been removed, skipped or weakened. The workflow
re-runs these checks on subsequent feature commits and includes the served
form/adapter/research-route and untrusted-link checks.

Provider calls in automated regression checks use synthetic fixtures; no real
member record or real model request is involved. A separate labelled public
connectivity diagnostic queries PubMed for a fixed protein-review topic only.
Its live result must be read separately; a runner/network outage is not model
accuracy evidence or permission to use private wording in a public query.

Browser QA uses a clearly labelled fictional harness. The actual served client
completed packet lookup, a 40 g review, optional nutrient inclusion, draft
editing, explicit save and a three-entry weekly summary. This is interface
evidence; it does not prove live API access, model accuracy or installed-device
camera acceptance.

Before photo activation: approve the cost/licence decision, verify provider
data handling against the current privacy information, test actual food
recognition on consented non-personal samples, and check the photo picker on
current iOS and Android installations. Photo results remain estimates.

Phone-width QA: research results have equal document/content widths at 320,
390 and 430 px frames (305/305, 375/375 and 415/415 after scrollbars), with
working research filter, original links, dates and keyboard navigation. The
Grub 320 px frame and 390 px packet-to-save path were also inspected. These
are fictional interface harnesses, not physical-device acceptance.

Production promotion of the unchanged source base had already failed at run 41223877184 before this feature branch. This source preparation is not a production deployment or App Store release. The feature branch is retained at `feature/grub-food-capture-20261031`; main, live runtime and store state have not been changed.

Logging acceptance completed against runtime commit
`e536fe81d11b3d2791e92b855c6c7ce72161236a` on 31 October 2026,
Europe/London. The recovered local preview used the actual authenticated food
routes, real SQLite storage and shared journey/fact functions with clearly
labelled fictional accounts; no model or real member record was used.

- Initial log: two entries; one known 300 kcal / 18 g protein amount.
- Saving a third entry with 200 kcal / 12 g protein produced three entries and
  500 kcal / 30 g in Today, Journey and the shared AI context, with explicit
  coverage of two out of three entries.
- Deleting that entry returned the counts and totals to two / 300 / 18.
- A second open tab updated on both save and deletion without reloading it.
- Switching to a second fictional account showed only its one entry and 40 g
  protein; switching back restored the first account's two-entry view.
- Expanded summaries fit 320, 390 and 430 px frames without horizontal
  overflow (305/305, 375/375 and 415/415 document/content widths).

The initial HTTP-only preview's UUID limitation and environment interruption
were superseded by this recovered check. The UUID shim exists only in the
local QA fixture; it is not a production code change. This is logging/interface
acceptance, not real-food recognition accuracy or installed-device acceptance.

Hosted logging proof before the final single-statement snapshot refinement:
https://github.com/shiftsometimber/shift-core/actions/runs/41249840429
Focused: 136 passed, zero failed, one existing opt-in real-model practical
evaluation skipped. Actual Worker dry-run build passed. Wider member suite:
579/581 passed, with only the two existing CSV historical-release qualification
failures. Both still reproduce on the unchanged pre-feature source. The original
network-free UI asset guard now passes unchanged; food summaries have their
own private read-only asset. Production deployment and photo-model activation
remain outstanding.

The final snapshot refinement passed 52 local food/capture/date checks,
including a deletion deliberately interleaved with a log read. Its source
revision is rechecked by the same branch workflow; the browser interface and
its accepted save/delete behaviour are unchanged by that query refinement.

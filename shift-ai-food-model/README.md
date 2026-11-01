# Shift AI food model — research candidate

Matt authorised the specialist food-model route on 1 November 2026,
Europe/London. This directory belongs to the existing food-capture branch;
it is not a second app, an external Cal AI integration or a production release.

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

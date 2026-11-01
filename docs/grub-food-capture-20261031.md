# Shift AI: food capture and research

Matt authorised the Cal AI-inspired Grub work on 31 October 2026.
He subsequently instructed that both food recognition and the MediSearch-style
research capability belong inside Shift AI. No competitor trial, subscription
or integration is part of this implementation.

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

# Shift AI: food capture and research

Matt authorised the Cal AI-inspired Grub work on 31 October 2026.
He subsequently instructed that both food recognition and the MediSearch-style
research capability belong inside Shift AI. No competitor trial, subscription
or integration is part of this implementation.

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

Proposed pilot: at most 5 photo requests per member per UTC day, 50 across the
service per UTC day and 500 across the service per UTC calendar month. Failed
or timed-out calls still consume their reservation; no automatic inference
retry occurs. Maximum model output is 400 tokens.

Cloudflare listed $0.0485 per million input tokens and $0.676 per million
output tokens on 31 October 2026. At the model's complete 128,000-token input
context and 400 output tokens, 500 requests would be about $3.24 in model
charges at those rates. This is a conservative token calculation, not a
supplier quote, complete platform bill, monetary account cap or evidence that
real food estimates are accurate. Proposed approval envelope: £5/month for
the photo-inference pilot, with the hard call allowances above. No new cost
or licence has been accepted.

References:

- https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/data-usage/
- https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE
- https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md
- https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/
- https://world.openfoodfacts.org/terms-of-use

## Verification and remaining acceptance

Local Node/SQLite: 34 checks passed, including the existing London calendar
boundary tests, authenticated saves, duplicate prevention, account separation,
current consent, withdrawal during inference, portion scaling and usage caps.
Hosted focused food/diary compatibility checks: 40/40 passed. The wider member suite currently passes 547/549; the two failures are the CSV historical-release qualification tests, which reject the registration tail at the current source head. No test has been removed, skipped or weakened. A baseline diagnostic checks the unchanged source base separately.

Provider calls in these checks use synthetic fixtures; no real member record
or real model request is involved.

Browser QA uses a clearly labelled fictional harness. The actual served client
completed packet lookup, a 40 g review, optional nutrient inclusion, draft
editing, explicit save and a three-entry weekly summary. This is interface
evidence; it does not prove live API access, model accuracy or installed-device
camera acceptance.

Before photo activation: approve the cost/licence decision, verify provider
data handling against the current privacy information, test actual food
recognition on consented non-personal samples, and check the photo picker on
current iOS and Android installations. Photo results remain estimates.

Phone-width QA: the 320 px frame has 305 px of document width after its scrollbar and 305 px of content width (no horizontal overflow). The 390 px interface and packet-to-save path were also inspected. This is not physical-device acceptance.

Production promotion of the unchanged source base had already failed at run 41223877184 before this feature branch. This source preparation is not a production deployment or App Store release. The feature branch is retained at `feature/grub-food-capture-20261031`; main, live runtime and store state have not been changed.

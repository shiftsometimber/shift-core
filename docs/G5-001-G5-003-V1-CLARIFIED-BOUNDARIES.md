# G5-001 / G5-002 / G5-003 — V1 clarified product boundaries

Date: 2026-08-14
Authority: product-owner clarification for V1 commissioning. This narrows implementation/acceptance; it does not invent clinical capability.

## G5-001 — third-party clinical API boundary

Settled product direction: Shift is not the prescribing/dispensing clinical operator. Any treatment service is supplied by a regulated third party through an API/integration.

V1 engineering may therefore complete the provider-agnostic boundary now:

- Shift owns non-clinical discovery, member/lifestyle context and explicitly consented handoff data.
- A future regulated provider owns clinical eligibility decisions, prescribing, dispensing and clinical treatment decisions.
- Provider-specific endpoints/credentials/schema mappings remain configuration/adapters, not a replacement architecture.
- The boundary must be fail-closed: absent provider configuration or unavailable provider must never imply eligibility, prescription, dispensing or treatment success.
- Generic integration state may represent `not_connected`, `handoff_ready`, `submitted`, `provider_review`, `provider_action_required`, `provider_accepted`, `provider_declined`, `provider_unavailable`; Shift must not manufacture clinical conclusions from these states.
- Every provider transition requires provenance/audit timestamp and member isolation.
- Data minimisation/consent applies to outbound handoff. No unrelated Brain/member data is sent by default.
- No clinical provider is required to finish the non-clinical V1; provider-specific activation remains external.

Closure target: prove the provider-neutral contract, fail-closed behaviour, consent/member isolation/audit and adapter seam without representing a live clinical service. Provider-specific clinical commissioning remains a later external acceptance boundary.

## G5-002 — Medication Companion

Settled product direction: provider selection is currently in progress with the product owner and cannot legitimately be selected until the site/product is sufficiently loaded for that decision.

Therefore:

- do not fabricate provider clinical rules;
- do not select a provider in engineering;
- do not block non-clinical V1 on Medication Companion activation;
- retain/build only safe provider-neutral seams where they reduce later integration work;
- any live prescribing, dosing, side-effect triage or clinical escalation remains disabled/fail-closed until the selected provider's governed operating rules are known.

G5-002 remains externally/provider dependent. It must not cause RC regression or expand current V1 scope.

## G5-003 — identity / body-evidence credibility

Settled V1 requirement: the member supplies a front body image and side body image. Those images must be credible body evidence and the visible person should look reasonably similar to the person in the verification-ID photograph.

This is a credibility/similarity workflow, not automated diagnosis and not pixel-derived BMI.

### Required V1 outcomes

Use bounded outcomes such as:

- `credible`
- `needs_review`
- `insufficient_evidence`

Do not automatically accuse a member of fraud on low-confidence similarity.

### Required checks

1. Uploaded front/side/ID evidence is a decodable supported image and is not blank/corrupt.
2. Front and side evidence is sufficiently usable for the credibility check; unusable evidence produces retake/insufficient-evidence rather than false success.
3. Front and side images are mutually plausible as evidence of the same member submission.
4. The person visible in body evidence is reasonably similar to the person represented in the verification-ID photograph.
5. Ambiguous/low-confidence/mismatch outcomes route to `needs_review` rather than an invented definitive identity conclusion.
6. The system must not infer exact weight, BMI or body-fat percentage from photographs.
7. Evidence and decisions are member-isolated, access-controlled and auditable; deletion/retention behaviour must follow the existing privacy boundary.
8. The result must be representable at the future third-party clinical adapter boundary without hard-coding a particular provider.

### Commissioning cases

- valid usable matching ID/front/side -> `credible`;
- corrupt/blank/unusable image -> `insufficient_evidence` / retake;
- ambiguous similarity -> `needs_review`;
- obvious mismatch -> `needs_review`;
- member A cannot read member B evidence/results;
- deletion/retention behaves according to existing privacy controls;
- no photo-derived BMI/weight/body-fat claim appears anywhere.

A future clinical provider may impose stronger/certified ID, liveness or evidence requirements for prescribing. Those requirements supersede this credibility layer for the regulated clinical journey, but do not invalidate the Shift V1 evidence workflow.

## Release interpretation

G5-001 and G5-003 are now technically actionable to their provider-neutral V1 ceilings. G5-002 remains genuinely provider-selection dependent. None of these clarifications permits Shift to imply that a currently unavailable clinical service is live.
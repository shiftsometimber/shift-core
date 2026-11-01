# Appetite → Grub working implementation

Requested by Matt on 1 November 2026 after reviewing the protein-timing advert. This is prepared source and an interactive review, not a deployed feature or a clinically approved nutrition service.

## Implemented

- Member-reported appetite, separate from medicine estimates; no PK input, dose changes, automatic calorie reduction or universal protein target.
- Published recipe suggestions with existing Grub exclusion, preparation and vegetarian checks. Known dietary requirements stop suggestions.
- Explicit planned versus eaten entries; portions recorded by the member. Protein estimates are snapshotted when eaten so later recipe changes cannot rewrite a log. Missing values remain unknown.
- Distinct helpful, unsuitable, tried-without-benefit and missed feedback. A different suggestion is not a dislike. Choosing a meal keeps it visible.
- Authenticated `/v1/grub/appetite-day` route implementation using the existing member authentication, governed catalogue and member preferences. Same-origin writes, idempotent action references and optimistic concurrency. Only the authenticated user's new `appetiteFoodV1` namespace can be updated. Yesterday's appetite is not assumed today.
- A self-contained working review with seven existing, authority-verified and discovery-eligible everyday recipes. It uses the same core and existing Grub helpers. It is memory-only and makes no member/API writes.

## Validation

`node --test appetite-food/core.test.mjs appetite-food/routes.test.mjs` — 15 tests passed.

Browser verification: appetite → selection → half-serving eaten produces the correct rounded recipe estimate; dietary restriction stops suggestions; the 375px content viewport has no horizontal overflow. Physical printing and device acceptance are not claimed.

## Release boundary

The API is not composed into the serving Worker and `APPETITE_FOOD_ENABLED` has not been enabled. No migration, deployment, member write, email or external clinical review has occurred. The review is explicitly a prototype. Member-facing wording and symptom signposting require review before release, including appropriate professional review of nutrition content. Production integration needs current runtime preservation, retention/size policy for history, existing saved-member preference UI integration, full catalogue acceptance and signed-in end-to-end verification.

Rebuild the review: `node appetite-food/build-preview.mjs`.

The recipe snapshot was derived through `verifyEverydayPublication`, `applyGrubDiscovery`, `enrichGrubRecipes` and `memberRecipe`, without editing the original publication.

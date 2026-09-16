# Grub additive publication bridge

The reviewed engineering path is ready; it does not publish content. The checked-in serving manifest is **pending**, with zero additions. Both Grub serving surfaces continue to select the same exact 798 accepted recipes. The original 205 quarantined IDs remain excluded. Existing Fit publication and serving are unchanged.

`grub-expansion-publication-v1.mjs` exports `buildGrubExpansionPublication`, `prepareGrubExpansionBatch`, and `buildGrubHumanAcceptanceTemplate`. The first two contain no credentials, network access or execution call. The separate serving manifest is a reviewed build input, not a member-supplied flag.

The existing rule is concrete: `docs/SHIFT-MEMBER-HUMANNESS-STANDARD.md`, under **Grub industrial gate**, requires human second-person review. Independent AI editorial work records its real reviewer identity and addresses substantive defects, but cannot attest that a human reviewed the result. The old Matt acceptance covers only its original eight immutable families; it cannot authorise changed or additional descendants. There is no need to repeat that accepted review.

The smallest new acceptance unit is one complete existing family, bound to its exact aggregate digest and every descendant ID/content hash. Current candidate families range from one to 102 recipes. Full expansion requires 87 family decisions over 1,873 new recipes. A partial additive release can select explicitly named complete families; it cannot publish an arbitrary subset of descendants.

The bridge takes these inputs:

- `result`: final `grub-additive-candidate.json.gz` contents, with all content, ingredient evidence, timing and family hashes frozen.
- `decisions`: `GRUB_ADDITIVE_EDITORIAL_DECISIONS_V1`, with `recipes` containing exact `id`, `content_hash`, `decision`, `reviewer: {id, kind}`, `author_ids`, `reviewed_at`, `scopes`, and `findings`. `families` contain `template_key`, `template_digest`, `decision`, and all exact descendant `{id, content_hash}` records in `recipes`.
- `authorship`: `GRUB_ADDITIVE_AUTHORSHIP_V1`, with an independently maintained `recipes` roster containing each exact `id`, `content_hash`, and actual `author_ids`. The reviewer cannot be an author; the review's author list must match the roster.
- `humanAcceptance`: `GRUB_ADDITIVE_HUMAN_ACCEPTANCE_V1`, with one real human decision for each selected family. Each row contains its exact `template_key`, `template_digest`, all descendant `recipes`, `decision: "PASS"`, `reviewer: {id: "actual reviewer identity", kind: "human"}`, actual `reviewed_at`, `scopes`, and no unresolved `findings`.
- `existingRows`: a complete read-only `structured_content` snapshot with `id`, `content_type`, `title`, `version`, `status`, `data_json`, `review_json`, `created_at`, and `updated_at`. The bridge checks the original content hashes and rejects every existing addition ID, including drafts.
- Optional `selectedTemplateKeys`: explicit complete families for a smaller release. Omitting it requires the whole candidate set to pass.

Required editorial scopes are `title`, `ingredients`, `method`, `equipment`, `allergens`, `nutrition`, `storage`, `food_safety`, and `serving_metadata`. The human acceptance additionally covers `member_humanness`, including dish-specific usefulness and desirability. `buildGrubHumanAcceptanceTemplate(result)` produces a pending scaffold with the exact hashes and empty reviewer/decision fields; it grants no approval. Record only decisions actually returned by the reviewer. FIX, pending, stale hashes, partial family coverage, missing scopes and technical holds all stop publication.

The bridge also directly accepts the consolidated `GRUB_INDEPENDENT_EDITORIAL_REVIEW_V1` report from `independent-editorial-review.json`. Its normalizer maps `decisions` to recipe decisions and complete family `descendants` to the bridge schema, retaining a SHA-256 of the whole source report. This format conversion preserves `publication_authority: false` and does not create human approval. `authorship.json` is the separate final author roster; `human-acceptance-required.json` is the exact pending 87-family scaffold.

The output contains insertion-only structured records, an exact serving manifest, and the protected original database snapshot. New provenance uses `grub_expansion_acceptance`; it never copies `final_v1_acceptance`, a Matt identity, or a human attestation from the original release. Numeric nutrition, CoFID ingredient evidence, prep/cook/rest/total minutes and reviewed discovery metadata remain bound to the reviewed source.

`prepareGrubExpansionBatch(release)` returns parameterised `{sql, params}` statements. Execute the entire list in **one** transactional D1 `DB.batch`; never loop and execute individual statements. Guard tables check all nine original row fields byte-for-byte and the 798 legacy count immediately before insertion. A changed original row, quarantined publication or addition-ID conflict aborts the transaction. Plain INSERT prevents overwrites; success removes the guard tables. Statements remain below D1's 100-bound-parameter and 100 KB SQL limits. This was exercised with local SQLite transactions, including a collision late in the batch and an original changed after preflight. Production execution remains a separate, authenticated release operation.

Release order after genuine acceptance and required checks:

1. Freeze final candidate, AI decisions, author roster and human family acceptance; obtain and verify the current read-only database snapshot.
2. Build the release and test its candidate serving manifest against a local/staging database containing the unchanged originals plus additions. Check both Grub surfaces, plans, search, shopping, restrictions and timing. There must be no 2,500-row truncation; all 2,671 rows are addressable for the full release.
3. Keep the pending manifest deployed while applying the complete insertion batch through a distinct approved execution path. New database rows remain unserved with the pending manifest.
4. Deploy the exact successful serving manifest, then prove authenticated production serving and original preservation. Deploying an approved manifest before its rows exist fails closed, so reverse ordering is unsafe.

The existing `/v1/commissioning/final-v1-publication` endpoint and workflow intentionally require exactly 2,124 original records (798 recipes plus 1,326 exercises). They are not an expansion endpoint and must not be repurposed by changing payload markers. No new live write endpoint is introduced here.

Both old plan/replace and current search/workspace now use `loadGovernedGrubCatalogue`, with keyset pagination and one shared authority selector. Pending authority serves only the original 798. Approved expansion authority must match every exact data/review hash; missing or tampered authority stops serving. Reviewed total time controls display, Fast plans/search, quicker comparisons, and the old planner time preference, so a six-hour overnight recipe cannot masquerade as a ten-minute meal. Existing accepted recipe timing semantics remain unchanged.

Grub authority is checked before the older planner or replacement route can persist a plan or feedback. The checked catalogue is reused by the downstream handler. Missing/changed originals, database failures, malformed JSON and invalid pagination return a controlled 503 before those writes; ordinary session-access timestamp bookkeeping remains permitted. Fit keeps its existing route path.

The existing read-only predeployment verifier, `member-experience/verify-production-catalogue.mjs`, now runs the same exact authority selector against the remote catalogue query before checking images, search and plan styles. The query must include `review_json` and return the entire published recipe catalogue. It exports no member data and performs no database writes.

Validation: 16 bridge/authority/route tests, including actual regeneration of all 798 original V1 records against the default pending manifest, plus 17 existing Grub tests passed. The four retained V1 human/publication gates passed. The synthetic test reviewers and recipe identities are test fixtures only and are not production evidence.

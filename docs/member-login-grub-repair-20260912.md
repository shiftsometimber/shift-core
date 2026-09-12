# My Timber login and Grub repair — 12 September 2026

## Live sign-in

The reported indefinite `Signing in…` state had an unbounded path: the adapter awaited Turnstile configuration, loading and challenge completion before starting its HTTP timeout. The challenge could also render after the footer.

The repaired client bounds configuration including its body, script loading and challenge completion. It places the challenge inside the active form, restores retry after failures and preserves required server verification. It does not disable Turnstile or change credentials, sessions or account data.

Two serving authorities required the same fix:

- `/member/dashboard` comes from Pages. Exact existing production was patched through the verified Pages workflow, with no employer/member feature release. Pages production commit `d6813b403f7fbca648e089c1e1332a2fed61edac`, successful run `34695474574`, deployment `5a064385.projectshift.pages.dev`, fingerprint `0111ddc13262846355df76dd5f2b3067b02dca9d92716105bf4bf24f9394e665`. The new asset is `/assets/member-login-security-20260912.js`.
- Legacy `/member-login` is served by the Worker's member shell. Narrow production commit `19e037713b36ffa8b7424143e983a50d18e70f83` builds on the previously successful live main `39cd8fa9d3694867ced4acb6012775c25a84709d`. Production run `34695757282` passed. The shell now references `/turnstile-auth-v1.js?v=timeout-20260912`. No workplace or Programme feature branch was promoted.

Browser observation confirmed both live script references. Eleven security/auth tests passed, including stalled configuration bodies, script loading, silent challenges, retry and required-security enforcement. The existing production checks passed.

**Verification limit:** the cloud browser resumed an existing session and hid each login form before a secure credential handoff could validate it. No credentials were entered and no fresh password login is claimed. A displayed member screen from an existing session does not prove fresh authentication.

## Grub recipe trial

The old preview repeated the search as a recipe name and supplied fixed time/protein values. That fixture is removed. Search now uses the existing 798-recipe catalogue, regenerated through its retained eight immutable PASS decisions from August 14. This is separate from the newer, unapproved Programme recipes.

The trial searches the accepted catalogue by ingredients and real filters. Fridge matches disclose all missing ingredients; supplied soy milk does not count as soy sauce. Unknown searches return an empty result. Allergy/exclusion requests are not silently ignored or presented as verified.

Cards expose actual ingredient quantities, servings, numbered methods, allergens, available safety/storage wording and calculated nutrition. Missing timing or nutrition values are omitted. The client retains the existing tab, shortcut and persistence hooks.

Recipe search is the only new network operation in the isolated member review: same-origin POST, bounded input, read-only catalogue lookup. Other review writes remain rejected. Catalogue generation still fails on changed approval digests. The deployment installs the existing CoFID reader explicitly. A regression test executes the bundled renderer to prevent Worker-only helper references leaking into browser JavaScript.

**Scope:** this is the isolated recipe trial, not a release of the member redesign to production. Account saving and week generation in that review remain unavailable. The real member API and its persistence require their own complete integration and authenticated verification before claiming the whole Grub journey is ready.

## Final recipe browser verification

Deployed implementation: `11fd0244ab5227873adfdbd8a41fbf4ef6fe8278`; isolated staging run `34696620173` and isolated checks run `34696620144` both succeeded.

Browser interactions verified:

- Exact screenshot query `Chicken, beef, noodles, bread`: 223 matching catalogue records, 12 displayed. Opened the first recipe and read measured ingredients, four steps, allergens and safety/storage wording. No echoed preview title or fixed nutrition placeholder.
- Fridge entry `chicken, bread`: two chips, actual matching recipes, all missing ingredients disclosed, and working shortcut title navigation.
- Fast with `chicken`: 68 matches, visible returned timings all at most 25 minutes. High protein and Family retained `chicken` and returned 103 and 101 matches respectively.
- Budget with `beans`: opened an actual beans recipe. Vegetarian with `beans`: 42 matches and an actual egg/bean wrap. Incompatible combinations produced an explicit empty result.
- Final expanded recipe at 320px: no horizontal overflow; 411 measured text pairs, zero contrast failures or unmeasured pairs.
- At 1280px: no horizontal overflow; 412 measured text pairs, zero contrast failures or unmeasured pairs.

The browser pass caught two build defects that were fixed before acceptance: serialized functions referring to Worker-only naming helpers, and replacement-string dollar escaping breaking the filter selector. CI now executes the bundled recipe markup and the transformed pinned client including filter clicks and later control installation.

## Source continuity

The latest employer Pages preview remains preserved at commit `2002cc69fc4f399171a60ca039b59a56fd5f6bbd` / `95e283ac.projectshift.pages.dev`. The Pages release branch now records the narrow production login repair; do not replace that live baseline with the employer preview or an old archive. Keep the live Worker hotfix when integrating the feature branch.

The unrelated `act2b-one-shot.yml` validation failure predates this repair and is not used as release evidence.

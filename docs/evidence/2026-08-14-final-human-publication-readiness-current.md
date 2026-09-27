# Shift commissioning — current final-human publication checkpoint

Date: 2026-08-14

This is the newest retained recovery/evidence checkpoint. It does not replace the authoritative 57-row remediation matrix. It reconciles the later human-acceptance, runtime-publication and production-readiness evidence that post-dates older descriptive prose elsewhere.

## Authoritative original-audit state

**57 total / 50 PASS / 4 AMBER / 3 BLOCKED / 0 unmapped.**

The only original-audit AMBER rows remain **G2-002, G2-003, G2-004 and G2-007**. They are no longer waiting for human review. Human review is complete; they remain AMBER only because the exact accepted authority has not yet been published to production D1 and proven through the authenticated production member-serving journey.

The only original-audit BLOCKED rows remain **G5-001, G5-002 and G5-003**, all genuine external clinical/provider/pharmacy dependencies.

Gate 1 is closed. Gate 3 and Gate 4 remain closed. All non-external, automatable Gate-5 original rows remain PASS. Do not reopen earned PASS rows without genuine regression evidence.

## Final human authority — complete

PR #332 recorded the explicit final V1 human acceptance against immutable retained authorities rather than inferring approval from technical QA:

- Grub: review run `31803717241`, artifact `9220287723`, digest `sha256:f02c540a1f6059796ab8615021f8e4747a12f052ce3cd4faa1f14cb0c5f7f7f4`, **798 recipes / 8 immutable decisions / 8 PASS**.
- Fit: review run `31802631318`, artifact `9219877222`, digest `sha256:b0ad06b2badc5ae83a750ec44b360b81f39e8b59407a3c705bb460a17e3012da`, **26 canonical movements / 26 PASS**.

PR #333 then proved the accepted decisions through the post-human publication-authority layer without promoting any audit row from Git evidence alone.

Do not ask Matt to repeat these 34 decisions. The earlier 783/806 Grub packs and earlier Fit schematic/truncated packs are superseded.

## Runtime publication conversion — complete before production

PR #335 caught and repaired a real downstream publication defect before launch: the accepted Grub publication records did not retain runtime-addressable `meal_type` metadata required by the live structured Grub selector. The final publication contract now retains and fail-closes on the required serving metadata. The accepted 798 Grub records partition exactly:

- breakfast: 212
- lunch: 204
- dinner: 195
- snack: 187

PR #334 then bound the final accepted Grub/Fit authority to the existing production `structured_content` publication layer and production-serving proof. It does not introduce parallel architecture.

PR #337 subsequently closed another pre-production serving gap: the exact 26 accepted premium SVG blobs are now copied byte-for-byte into the Worker member-asset binding at their published `assets/fit/premium/*` paths, routed through `shift-core`, source-gated, and required by the production publication proof to return genuine SVG START/MOVE/FINISH content. Its dedicated Fit public-serving, Shift Me source/privacy, member frontend, integration and route gates were GREEN before merge. It also preflights optional Shift Me assets before injection so a missing Shift Me edge cannot contaminate unrelated Today/Gate-3 acceptance; Shift Me's own production proof remains independently fail-closed.

Current code main after #337: `f7b5011bc5c80e401fd4307543787592fc798d4d`.

## Exact production publication readiness — PASS, not production PASS

`Final V1 Publication Readiness` run `31809506731` completed GREEN on the #334/#335 exact publication authority.

Retained artifact: `9222529459` (`final-v1-publication-readiness-evidence`), digest `sha256:626b38ff5720aad5b3560957877bf9bb27bac9f061ad2e0d43f5b32871bc0911`.

The retained summary proves:

- human authority marker: `MATT_V1_FINAL_AUTHORITATIVE_HUMAN_ACCEPTANCE_2026_08_14`;
- Grub: **798** exact accepted reviewed/validated publication rows, **8** accepted decisions, zero held;
- Fit: **1,326** commissioned industrial descendants, exactly **51 descendants for each of the 26 accepted canonical movements**;
- total exact production publication payload: **2,124 rows**;
- publication layer: the existing `structured_content` layer;
- partial publication: **forbidden**;
- `productionPass: false` by design until the production D1 apply and authenticated serving proof complete.

PR #337 adds the accepted-premium-visual HTTP-serving proof to that downstream live gate; it does not promote an audit row from source-green CI.

## Fresh production regression before #337

`Shift Production Commissioning` run `31809506744` on main `9586c6cc...` retained a GREEN ordinary production job (`94796447962`) across Core health/routes, security/privacy, Radar, authenticated isolation and retained state, longitudinal Grub/Fit learning, Progress Picture/Shift AI behaviour, existing M07 structured Grub/Fit serving, Fit duration, unattended Dave and G5-012 performance.

The same run retained the known deployment-drift symptoms rather than a new product defect:

- M04 job `94796447939` completed the real retained member funnel but production still omitted `grub_plan_generated` from the persisted event sequence. Artifact `9222585279`, digest `sha256:75fadf455ef768dacf3457d2c6c3e8fc9fd8ad08f0ae2972c831b96a692f793f`.
- Gate-3 and Today browser jobs still received 404 / `text/html` for `/member-shift-me-premium-v1.css?v=1` and `/member-shift-me-premium-v1.js?v=1` while the surrounding premium forest/cream member estate remained rendered and responsive.
- Fresh G2-013 Progress Picture run `31809506805` encountered the same missing Shift Me asset graph. Its mobile journey nevertheless visibly retained the saved real image across reload and logout/login, preserved cross-member isolation, and retained deletion. This does **not** reopen the previously earned G2-013 PASS; the red is tied to the known stale production asset/deployment graph.

PR #337 now prevents those optional Shift Me assets from contaminating unrelated rendered acceptance once its Worker build is actually deployed. Do not rerun M04/Shift Me/Today/G3/G2-013 merely to manufacture another red before production deployment authority changes.

## Singular Worker deployment blocker

The existing `Cloudflare Production Promote` workflow is the sole intended Worker promotion path. Current-main-at-the-time run `31809506824`, job `94796448931`, reached the credential boundary and failed exactly at `Fail closed when deploy credential is absent`; Wrangler install, production deploy and route/static-asset proof were correctly skipped.

**External action required:** configure the GitHub Actions secret `CLOUDFLARE_API_TOKEN` with permission to deploy Worker `shift-core` through the existing Wrangler configuration. Do not commit the token and do not create another deployment path.

Once that secret exists, run the existing `Cloudflare Production Promote` workflow once against the then-current `main` (now including #337). It must deploy the current Worker/module/static assets and prove the newer restricted routes and Shift Me premium assets are genuinely on live traffic.

`Final V1 Production Publication` correctly remains gated behind successful promotion. On successful promotion, the existing chained workflow is designed to atomically apply the exact **2,124** accepted rows to production D1 and then prove authenticated accepted-authority Grub/Fit serving, exact CoFID evidence, accepted premium SVG HTTP delivery, retained Nays across logout/login and retained plan analytics. Only that demonstrated production outcome can promote G2-002/G2-003/G2-004/G2-007.

## Auto-reconciliation lane

PR #336 proves a useful fail-closed concept: after — and only after — an exact 2,124-row production proof with accepted-authority serving, retained Nays, return state and plan analytics, the final four Gate-2 rows can be automatically reconciled to 54 PASS / 0 AMBER / 3 BLOCKED and A=0. Its original branch now conflicts with #337 because both touch the final production-publication workflow. Preserve the intent, but do not merge stale/conflicting workflow code. Recreate/retarget that reconciliation only on top of current main if it can preserve the newer #337 live visual-serving requirements.

## Other external/manual tail

- Timber Mill / issue #300 remains a separate P0 outside the original 57-row audit. Source authority is recovered; the exact corrected static package still needs publication through the existing Cloudflare static/manual path, followed by one desktop + 390px production visual acceptance. Do not rebuild the shop again.
- G5-001/G5-002/G5-003 remain external BLOCKED and must stay unavailable/accurately qualified rather than holding non-clinical V1 engineering open.
- Final genuine-device hostile acceptance remains a release-pack activity after the four Gate-2 rows genuinely close.

## Next executable state

There is no honest product-code reason to rerun the stale production proofs before Worker promotion. Preserve the locked PASS estate, do not send redundant auth emails, do not create trigger-only rebuild commits, and do not substitute source-green evidence for production acceptance.

After a successful current-main Worker promotion, execute in order:

1. chained exact 2,124-row D1 publication;
2. authenticated accepted-authority Grub/Fit serving + accepted premium SVG HTTP proof;
3. M04 + Shift Me/Today/G3 targeted proof once;
4. reconcile the four Gate-2 rows if — and only if — their production evidence is GREEN;
5. freeze non-clinical RC and run release regression / final genuine-device acceptance;
6. fix release defects only.

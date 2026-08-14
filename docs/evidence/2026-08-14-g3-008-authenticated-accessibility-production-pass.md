# G3-008 — Authenticated accessibility production PASS

Date: 2026-08-14

## Commissioning decision

**PASS** for G3-008 only. This promotion is based on demonstrated merged-production behaviour, not source existence, PR green status or a merge alone.

## Repair and deployment chain

- The production stylesheet publication path was first corrected so the Git-authoritative member P0 CSS is served with `Cache-Control: no-store` / `Pragma: no-cache`, removing stale-cache ambiguity.
- PR #260 then applied the bounded remaining Ask Timber remediation on current main without changing product behaviour, IA or the homepage forest/cream design constitution.
- PR #260 was accepted on its deployed head only after authenticated desktop + 390px browser evidence passed, then squash-merged as `cc298069792da17fb7aa8a4095d888ec8471e336`.
- A separate comment-only evidence pulse, PR #261, reran the unchanged authenticated production acceptance against the merged-main deployment. PR #261 was closed without merge after evidence retention.

## Demonstrated merged-production journey

GitHub Actions run `31776604378`, job `94693238364` exercised representative authenticated member surfaces at desktop and 390px, including the Ask Timber drawer, and returned `failures=[]`.

The member outcome was demonstrated rather than inferred:

- primary Ask action contrast: **6.52:1**;
- Ask textarea/control boundary contrast: **4.52:1**;
- document-root horizontal overflow: **0 px** at desktop and 390px across representative member surfaces;
- visible keyboard focus: **3 px** focus treatment retained;
- required `main` / H1 landmark structure retained;
- reduced-motion acceptance retained;
- representative Today, Grub, Fit and Progress surfaces remained green under the same acceptance;
- homepage-grade forest/cream visual constitution remained intact.

The live CSS fingerprint observed by the final merged-production run was:

`sha256:6486dccb0205269cd342b1306610dc4667e71ca7b054193a69c343a60636e959`

## Retained evidence

- GitHub Actions artifact: `9210113652`
- Artifact digest: `sha256:ae7b88c23cba0363e503037a6dd25ecc2e90d6cdf24b140ebd6c954f14b07ed8`
- Evidence-only PR: #261, closed without merge after the proof completed.

## Scope boundary

This closes **G3-008 Accessibility is not a design-system gate** because the authenticated production journey now demonstrates the commissioned contrast, focus, landmarks, reduced-motion and overflow outcomes on merged production. It does **not** promote G3-001 through G3-007, M01 as a whole, or G5-012 performance. Those remain independently evidence-led.
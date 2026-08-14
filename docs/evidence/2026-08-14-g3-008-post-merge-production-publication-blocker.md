# G3-008 post-merge production re-proof — frontend publication blocker

Date: 2026-08-14

Status: **AMBER — repaired Git authority is not yet the rendered production authority.**

## Acceptance rule

G3-008 is not PASS on source repair, merge, or a green non-rendered gate. PASS requires the authenticated production member journey to render the corrected design-system rules at the commissioned desktop and 390px boundaries with retained evidence.

## Fresh post-merge production proof

The bounded P0 source/preference repair was squash-merged to `main` as commit `8771fdd5dabf5d54649e9be7fad05d7e8c32792a`. A fresh production-only re-proof was then triggered without weakening any acceptance threshold:

- Gate 1 run: `31761840665`
- authenticated G3-008 job: `94649676538`
- retained evidence artifact: `g3-008-accessibility-evidence`, artifact ID `9204907570`
- result: **FAIL**, 36 concrete accessibility failures

The live unversioned `/member-p0-v1.css` returned HTTP 200 and already contained the intended bounded forest-palette repair. Captured identity:

- bytes: `2834`
- SHA-256: `3ffab8ca6b235fccc5618c7bed6dfaa2a06207b65d7ea902be36943d5ff82c25`
- repaired primary/action colour `#53624d`: present
- repaired form/control boundary colour `#6f7869`: present

However, the actual authenticated rendered journey was still loading stale P0 references from the live member shell:

- repeated `member-p0-v1.css?v=3`
- on some Progress transitions, both `?v=2` and `?v=3`
- **no rendered `?v=4` reference**, despite Git-authoritative `frontend/member/member-shell-v33g.js` now canonicalising the asset to `?v=4`

The browser therefore continued to compute the pre-repair visual values on affected controls:

- primary buttons: `rgb(139, 150, 112)` with white text, approximately **3.14:1** — FAIL
- affected input boundaries: `rgb(200, 193, 183)` against the off-white form surface, approximately **1.76:1** — FAIL
- repaired darker select boundaries where applied: `rgb(111, 120, 105)`, approximately **4.52:1** — PASS
- member-surface eyebrow `rgb(83, 98, 77)` on cream: approximately **5.89:1** — PASS
- hero eyebrow on the dark forest gradient: minimum observed approximately **8.4:1** — PASS

The same fresh job retained positive evidence for visible keyboard focus, `main`/`h1` structure and reduced-motion handling on the exercised surfaces. The captured latest cases also showed zero document-root horizontal overflow in the exercised desktop and 390px paths. These successes do not override the real contrast failures.

## Root cause now bounded

The Git-authoritative CSS repair is live at the unversioned root stylesheet, but the Git-authoritative member shell is not yet the rendered production shell. The production member journey is still emitting the older `v2/v3` P0 references.

`frontend/README.md` defines the release boundary explicitly: `frontend/member/member-shell-v33g.js` must be published unchanged at `/member-shell-v33g.js`, and a deployment is accepted only when live source identity and the unchanged authenticated rendered acceptance both pass.

The repository's production commissioning workflow deploys/commissions the Cloudflare Worker/API boundary. It does not constitute proof that the separate root member static asset has been published. The fresh rendered failure is therefore treated as a **frontend publication/deployment blocker**, not as permission to reconcile the row or weaken WCAG thresholds.

## Exact closure action

1. Publish the Git-authoritative `frontend/member/member-shell-v33g.js` from main commit `8771fdd5dabf5d54649e9be7fad05d7e8c32792a` unchanged to production root `/member-shell-v33g.js` using the established public/static deployment path.
2. Confirm the live shell contains `P0_HREF='/member-p0-v1.css?v=4'` and the stale-duplicate removal/`MutationObserver` guard.
3. Re-run the unchanged authenticated G3-008 production acceptance at 1440×900 and 390×844 across My Shift, Today, Grub, Fit and Progress.
4. Require primary/action text contrast >= 4.5:1, meaningful control boundaries >= 3:1, visible focus, landmarks/headings, reduced-motion handling and zero root horizontal overflow.
5. Retain screenshots plus the machine-readable report. Only then reconcile G3-008 from AMBER to PASS.

Until that static publication occurs and the production journey proves it, **G3-008 remains AMBER**.

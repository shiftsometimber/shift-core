# REC-031 preview acceptance — 12 September 2026

Matt explicitly requested deployment and corrected the expected Start Here result to the existing full five-medicine detail workspace with: “Based on your answers, this could perhaps work for you…”. This promotes that correction from the current live Pages baseline; it does not merge this Pages branch into core main.

Preview: https://93c4be98.projectshift.pages.dev

Preview commit: 62634e9bae15186d24875d09bda00dc0904ea46e

Successful workflow: https://github.com/shiftsometimber/shift-core/actions/runs/34714558229

Candidate fingerprint: e3fa4e233a125816d26caf4a2ab392949bc656d3f8cf77f16ea06e541367bb88

The release assembler verified all 872 files, the exact candidate fingerprint and the 457-page SEO integrity check. Exactly three application files plus two manifests differ; the other 867 files are byte-identical to the latest live Pages release.

Browser acceptance used actual controls with fictional preferences, without account, clinical or payment submissions:

- Completing Lose weight → Jabs → Private → £200+ navigated directly from Start Here to `/treatment-order?medicine=mounjaro&view=spec&from=start-here`.
- The exact requested H1 rendered once; the full existing specification and comparison workspace loaded.
- All five medicine switches were activated individually. Each expected medicine H2 was awaited until visible, and its URL matched: Mounjaro, Wegovy injection, Wegovy tablet, Foundayo, Orlistat.
- No-medication → NHS → £0/NHS remained on Start Here, displayed “Build a plan you can actually use.” and the Programme, Grub, Fit, My Timber and NHS links. The medicine card grid was absent from the visible result.
- At the available desktop viewport, document width and scroll width were both 1348px, with no visible broken completed images. The existing 100px header was preserved.
- Stock and continuation remained closed. Price unavailable on the Pages preview is expected; production price rendering is checked after deployment.

Scope: this browser is Chromium at the available desktop viewport. New 360/390px and native Safari runs were not performed. No CSS or responsive structure changes are included. Existing clinical, stock, dose, payment, preference and no-medication logic are otherwise unchanged.

Publication must use this exact candidate and refuse if the current production fingerprint has moved. After publication, verify the custom-domain fingerprint, actual quiz handoff, exact heading, images and medicine switch, and preserve core main b3b86d41d1283d08e7b1e464f72e7aa72fa5b082.

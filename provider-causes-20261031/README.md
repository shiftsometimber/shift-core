# PS2 provider page and Causes mobile repair — 31 October 2026

Matt selected PS2 Changing Provider, asked whether every approved redesign was deployed and mobile-friendly, and reported /our-causes-partners looked awful on his phone. Scope is implementing the selected PS2 visual presentation, repairing Causes presentation/responsiveness, and checking the 32 pages from the approved 27-hero programme plus subsequent page layouts. Do not claim the whole website has been redesigned or tested. Homepage/header exploration remains unselected. All previous approved releases must remain intact.

Read-only preflight source a52ce02a967310b6a281d968155457f6b311c5a1, run 41238837628, artifact 13055704128. Existing 915 routes unchanged. Current owners: provider presentation Worker and Core. This release wraps their serving modules and inherits bindings/assets; it does not deploy the old repository worker over production. Shared cloudflare-production-promote concurrency and exact provider version receipts guard staging, promotion and restoration.

Reproduced Causes problem publicly: dark text on black, almost invisible category labels, explanatory text and controls. Repair uses existing black/cream/ash palette and Arial; phone categories are full-width rows with all five choices visible without horizontal carousel, minimum 44px controls, readable descriptions and an internally scrolling dialog fitted to viewport. All causes content, organisation URLs, independent-service/paid-programme boundaries, scripts and interaction markup are unchanged. No new charity endorsement or partnership is asserted. Clinical/support copy is not rewritten.

PS2 uses native HTML/CSS, selected black split hero with warm library photograph, existing font, cream prescription-independence strip and three cream situation cards. Existing guide content, clinical responsibility wording, scripts and destinations are preserved; query-owner raw HTML is structurally normalised. Built-in image-generation photo: ordinary slightly stocky British man about 48 with dark greying wavy hair, short beard and rust overshirt, calmly reviewing plain papers at a wooden table in a local library, notebook/pen, warm natural light, no medicine/logo/legible text. It is clearly labelled illustrative. WebP bytes are stored in media.mjs and served by existing Core asset owner without new routes.

Verification: exact candidate responses/statuses/redirects on canonical, trailing slash, HTML and tracking query URLs; existing shared shell/scripts/guide content; previous CY3, FS1, PW2, MO3, TC2, MS1, CO1, NR3, LB2, W2, CT3 and protected core/member/calculator pages. Browser QA at 1440, 768, 360, 390 and 430px on both pages with/without tracking query. Causes exercises all five areas, organisation detail dialogs, close controls, paid MAN v FAT detail and independence boundary; PS2 checks image, responsive split/stacked layout and anchor. Rendered-text contrast and no overflow are asserted. All browser mutations are intercepted and aborted; no external links, forms, account changes, outreach or transactions are submitted.

A separate read-only mobile audit checks all 32 approved/revised public routes and tracking-query forms at 390px, saving visible screenshots, current markers, headings, broken hero images and overflow. Audit findings are reported separately from the two-page release; absence of a former marker is a finding to reconcile, not authority to overwrite another newer page. Full source and receipts stay here, with complete workflow screenshots and JSON in the release artifact. Completion is pending staged/live verification.

Staged PS2/Causes preview passed all 20 page/query/viewport interaction checks: source 31bd84c17ee43c7207f1a8380bc0ddbb0ba2fa08, run 41239378925, artifact 13056727650. Screenshots reviewed at phone width. The initial transient browser navigation error from run 41239141509 did not recur; accepted predecessors were restored after that failure. Subsequent browser navigation retries remain bounded and produce diagnostics rather than ignoring persistent failures.

The 32-page/64-URL mobile audit found no horizontal overflow or hidden page headings. It found six real missing query presentations: corporate-wellbeing, guides/retatrutide-uk-guide, husband-help, my-timber-for-providers, nhs-vs-private and surgery-comparison-centre. Their normal URLs already have the approved 20261030 heroes; tracking-query requests fall through to Core's older plain layouts. The Knowledge/Explore Knowledge findings were marker false positives: the current 2026-10-29-v2 Knowledge layout is retained and explicitly recognised. No newer Knowledge design is overwritten.

The final scope restores only the existing approved hero on tracking-query forms of those six routes, using the original selected hero definitions/styles/photo assets from hero-set-20261030. All current opening context, guide content, scripts, actions, links, metadata and shared shell remain intact. All six normal canonical pages are additionally protected byte-for-byte. No new design or medical claim is introduced. A repeated read-only preflight for the expanded scope completed as source 3d5d60e480508105bf19f32270b561234fd17b84, run 41239809835, artifact 13057145830: the same two Workers own all variants; 915 routes still unchanged. Final zero-traffic audit now requires all 64 normal/query checks to pass before promotion. Production/live verification remains pending until its final receipt exists.

## Verified completion — 31 October 2026, 20:44 GMT

The combined release is deployed and verified. Production source 03565e2089ca5397cb1f754513a873cba959446e passed run https://github.com/shiftsometimber/shift-core/actions/runs/41240001463. Final verification completed at 20:44:41 GMT. Full staged/live screenshots, phone dialog/interaction checks and JSON are retained in artifact 13057546326. The final provider receipt is verified-release-20261031.json; the complete 32-page/64-normal-and-tracking-URL mobile result is verified-mobile-audit-20261031.json, with zero findings.

PS2 and Causes passed all 20 normal/query page/viewport checks at 1440, 768, 360, 390 and 430px, both staged and live, including actual category switching, detail dialogs/closing, phone control sizing, readable text, no horizontal overflow, decoded images and provider anchors. All 14 successful page/alias/query responses match exact approved candidates across 30 variants; existing redirects remain unchanged. The six missing tracking-query hero presentations are restored, using their previously approved designs, while the six normal canonical pages are preserved. The newer Knowledge layout is retained. All 47 protected pages/resources and 53 existing bindings are unchanged. All 915 routes remain unchanged; no route was added. All other current Worker modules and existing assets remain intact.

Separate public browser verification confirmed PS2 at /provider-switch and the corrected Causes page at /our-causes-partners. Causes previously had dark text on black and unreadable category labels; these are now visibly readable in the live page. This completion covers the 32-page approved/revised set, not every URL on the entire website and not unselected homepage/header proposals. No signed-off item in this finite set remains pending. No forms, account actions, external communications or transactions were submitted during verification.

## Page selection reconciliation — 31 October 2026

User instruction: work on new pages, do not redo pages changed in the last 48 hours. This is a read-only selection reconciliation, not a new deployment or repeated mobile QA. Retain the completed release receipts and their existing acceptance evidence.

Exclude all 32 routes in audit-paths.json from the next redesign selection:

- `/about`
- `/articles/testosterone-weight-men`
- `/articles/wegovy-cost-uk`
- `/clinic-gone-quiet`
- `/compare-weight-loss-treatments`
- `/contact`
- `/corporate-wellbeing`
- `/explore-knowledge`
- `/guides/mens-health-mot-guide`
- `/guides/retatrutide-uk-guide`
- `/husband-help`
- `/knowledge`
- `/life-back`
- `/male-obesity`
- `/mens-weight-management`
- `/my-timber-for-providers`
- `/nhs-vs-private`
- `/our-causes-partners`
- `/partner-with-us`
- `/provider-switch`
- `/shift-for-work`
- `/shift-health/erectile-dysfunction`
- `/shift-health/fertility`
- `/shift-health/health-mot`
- `/shift-health/shift-measure`
- `/shift-health/stop-smoking`
- `/shift-newsroom`
- `/surgery-comparison-centre`
- `/tools`
- `/treatment-centre/medicines-watch`
- `/weight-loss-support-for-men`
- `/work-with-us`

Also exclude the 42 guide routes in knowledge-health/release-receipt-20261029.json (verified 29 October at 23:43 GMT), Ask Timber (that release and newer main commits on 31 October), and current Newsroom/editorial work. Content or discovery changes count as recent work even without a new hero. Main was inspected through 39499afc51, including current Ask Timber boundary work. No article or guide should be called untouched merely because its presentation marker is older.

Good to Talk (/mens-mental-health) already has the approved mental hero; do not replace it with GTT1. GTT1 was only a newly generated alternative, never implemented or deployed, and the user has now explicitly directed us away from repeat work. How Are You Feeling also has an existing 22/23 October presentation; no new concept or implementation is approved.

Next suitable presentation candidates checked live against the recent design release scope:

- `/downloads-resources`: existing `20261022-public-presentation-v2`, title “Take better questions into the real conversation.” No membership in the recent 32-page redesign set or the 29 October Knowledge guide release. First proposed next page.
- `/family-discussion-guide`: existing `20261022-public-presentation-v2`, title “Support helps. Food policing usually does not.” Same recent-scope exclusion comparison; subsequent candidate.

These older markers describe the presentation observed; they do not establish that every byte of page content has been unchanged since that date. No production changes were made during this reconciliation. Check each proposed page against this exclusion evidence before making further concepts.

# Calculators & Tools presentation

Next visual preview after the completed Contact refresh. Help already has its approved guided design live. This work covers only the `/tools` hub: preserve existing content, links, shared services and every calculator destination. No individual calculator formula, input, result, questionnaire, medical wording or personal data flow is changed.

Use the established Arial font and black, cream and ash-green palette. Bring the existing check-in and eight calculator cards forward. Add a direct in-page calculator link and the missing `calculators` anchor. Move the unchanged, dynamically inserted “What Shift does” panel below the calculator grid in actual DOM order, preserving keyboard order. Keep the nutrition, exercise, guidance and review-checklist links.

Preview preparation is authorised by Matt’s “And next”. Matt approved this completed preview for public deployment with “Agreed” on 22 October 2026. Preview has no production routes, is noindex, blocks writes/private APIs/service workers and redirects calculator pages to their existing live destinations. No health details are entered and no messages are sent.

Homepage, Start Here feedback in another chat and separately paused Medicines Watch/reconciliation/shared-Core work are outside this scope.

## Review-ready checkpoint — 22 October 2026

Qualified preview source: `a5e8ad0ba5a96bf4747fcdea98a91b9195dc80c3`, branch `preview/tools-presentation-20261022`.
Preview: https://shift-tools-presentation-preview-20261022.matobrien.workers.dev/tools
Workflow: https://github.com/shiftsometimber/shift-core/actions/runs/39777675364 — success; job `119820668177`.

Chromium and WebKit each passed at 390px and 1440px: all existing rendered copy and links preserved; all eight tool-card destinations retained; check-in and calculator grid before the explanation; keyboard jump to the calculator grid; no horizontal overflow; 44 contrast checks per view. Each of the eight existing tool destinations returned 200. The no-JavaScript check waits for shared styles/images to load, confirms eight visible tools and no horizontal overflow. The retired menu already hidden in the normal JavaScript presentation is also hidden consistently without JavaScript. The “Why first?” card's inherited decorative stripe is removed so it does not cross mobile text.

The exact accepted runtime/style blobs are pinned in `preview-gate.json`. Artifact `12425990041` (`tools-preview-a5e8ad0ba5a96bf4747fcdea98a91b9195dc80c3`), SHA-256 `212f10778c3cf775c7efe8a38a4143735e44a1342632cb541f4b53028f6cd8b5`, contains the source, rendered preview, route inventories, screenshots, browser results and no-JavaScript geometry. Its downloaded digest was verified. This run supersedes earlier iterations and the test that measured an incompletely styled no-JavaScript page.

Zero production routes were changed; all 204 existing routes were preserved. No health data was entered and no message was sent. Calculator calculations were not retested because this change does not alter or publish those pages.

User-facing desktop/mobile image: `SHIFT-Tools-Preview-2026-10-22.png`, saved as `libfile_6938bc0db83c8191a59d7a6e05f322af`. The browser preview was reopened and confirmed to show the final layout, preview notice and corrected explanation card.

**Publication approved and verified live on 22 October 2026.** The pinned worker/style were deployed without design or copy changes to the six exact hub routes. The existing apex/www `/tools/*` routes remain bound to Core and individual calculator handling is preserved. The verified result is recorded below.

## Approved publication — 22 October 2026

Matt replied “Agreed” to the exact completed Tools preview and desktop/mobile image shown in this chat, in response to “Approve this version for go-live?”. The source starts at review checkpoint `b0a84ce02fe36a7edc67a6ef65bc246c222bf773`. No worker or style change is included in release preparation. The release workflow verifies the pinned source and preview acceptance, qualifies the staged hub, activates only six exact hub routes, checks the actual public hub and restores only owned routes if acceptance fails. Final deployment evidence is recorded below. No messages or health details may be submitted during acceptance.

## Verified live — 22 October 2026

Public hub: https://shiftsometimber.co.uk/tools
Release marker: `20261022-tools-live-v1`.
Release source: `8efaa23b906f360e543253c88389dbd2b68d2cdb` on `release/tools-presentation-20261022`.
Workflow https://github.com/shiftsometimber/shift-core/actions/runs/39778630614 and job `119823900302` completed successfully. Staging passed before activation. Public activation passed at 12:29:51 UTC (13:29:51 BST); actual public browser acceptance passed at 12:30:08 UTC (13:30:08 BST). No rollback was needed.

The exact approved worker/style blobs were retained. Actual public Chromium and WebKit each passed at 390px and 1440px: existing content and links, eight tool cards, check-in and calculator grid before the explanation, keyboard jump, heading height, no horizontal overflow and 44 text-contrast checks per view. All eight existing tool destinations returned 200. The no-JavaScript page loaded its shared assets and passed visibility and overflow checks. No health details were entered and no message was sent. Individual calculator calculations were not changed or retested.

All 12 HTTP/HTTPS, apex/www and hub-path variants resolved with the public release marker. Only the six exact hub routes were added for `shift-tools-presentation-20261022`; all 204 prior route records were preserved, including the existing apex/www `/tools/*` routes bound to Core. Original copy and links, shared header/footer and every calculator destination remain preserved.

Artifact `12426006453`, `tools-presentation-live-8efaa23b906f360e543253c88389dbd2b68d2cdb`, SHA-256 `b8e28f1b65b49874fc056b27ed2728ea457d9525f6d303df95f605f0689a0605`, preserves staging/public results, screenshots, route inventories, source and release evidence. The downloaded digest was verified. The actual public hub was also reloaded in the review browser and confirmed to show all eight cards, the public release marker, the explanation below the tools and no preview notice.

Final desktop/mobile image: `SHIFT-Tools-Live-2026-10-22.png`, saved as `libfile_1e9efe0bd93c81919e12ff1bb6b88ef3`.

The approved Tools hub presentation is complete. No separately paused work was resumed.

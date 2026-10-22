# Calculators & Tools presentation

Next visual preview after the completed Contact refresh. Help already has its approved guided design live. This work covers only the `/tools` hub: preserve existing content, links, shared services and every calculator destination. No individual calculator formula, input, result, questionnaire, medical wording or personal data flow is changed.

Use the established Arial font and black, cream and ash-green palette. Bring the existing check-in and eight calculator cards forward. Add a direct in-page calculator link and the missing `calculators` anchor. Move the unchanged, dynamically inserted “What Shift does” panel below the calculator grid in actual DOM order, preserving keyboard order. Keep the nutrition, exercise, guidance and review-checklist links.

Preview preparation is authorised by Matt’s “And next”. Public deployment requires approval of the completed preview. Preview has no production routes, is noindex, blocks writes/private APIs/service workers and redirects calculator pages to their existing live destinations. No health details are entered and no messages are sent.

Homepage, Start Here feedback in another chat and separately paused Medicines Watch/reconciliation/shared-Core work are outside this scope.

## Review-ready checkpoint — 22 October 2026

Qualified preview source: `a5e8ad0ba5a96bf4747fcdea98a91b9195dc80c3`, branch `preview/tools-presentation-20261022`.
Preview: https://shift-tools-presentation-preview-20261022.matobrien.workers.dev/tools
Workflow: https://github.com/shiftsometimber/shift-core/actions/runs/39777675364 — success; job `119820668177`.

Chromium and WebKit each passed at 390px and 1440px: all existing rendered copy and links preserved; all eight tool-card destinations retained; check-in and calculator grid before the explanation; keyboard jump to the calculator grid; no horizontal overflow; 44 contrast checks per view. Each of the eight existing tool destinations returned 200. The no-JavaScript check waits for shared styles/images to load, confirms eight visible tools and no horizontal overflow. The retired menu already hidden in the normal JavaScript presentation is also hidden consistently without JavaScript. The “Why first?” card's inherited decorative stripe is removed so it does not cross mobile text.

The exact accepted runtime/style blobs are pinned in `preview-gate.json`. Artifact `12425990041` (`tools-preview-a5e8ad0ba5a96bf4747fcdea98a91b9195dc80c3`), SHA-256 `212f10778c3cf775c7efe8a38a4143735e44a1342632cb541f4b53028f6cd8b5`, contains the source, rendered preview, route inventories, screenshots, browser results and no-JavaScript geometry. Its downloaded digest was verified. This run supersedes earlier iterations and the test that measured an incompletely styled no-JavaScript page.

Zero production routes were changed; all 204 existing routes were preserved. No health data was entered and no message was sent. Calculator calculations were not retested because this change does not alter or publish those pages.

User-facing desktop/mobile image: `SHIFT-Tools-Preview-2026-10-22.png`, saved as `libfile_6938bc0db83c8191a59d7a6e05f322af`. The browser preview was reopened and confirmed to show the final layout, preview notice and corrected explanation card.

**Publication awaits Matt's sign-off on this preview.** After that approval, use this pinned worker/style without design or copy changes. Prepare and qualify the existing Cloudflare/GitHub release mechanism, then activate only the exact `/tools`, `/tools/` and `/tools.html` hub paths for apex and www (six exact route patterns). Preserve the existing apex/www `/tools/*` routes bound to Core and all other routes, so individual calculators retain their current handling. Verify public mobile/desktop views, existing content, keyboard jump, eight tool links and aliases, then update this README. Do not publish on “next” alone and do not resume any separately paused work.

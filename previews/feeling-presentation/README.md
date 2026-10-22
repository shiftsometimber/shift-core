# How are you feeling? presentation

Next visual preview after the completed Calculators & Tools refresh. Preserve the existing five questions, all twenty radio options, values and required flags, original flow and result calculation, score bands, priority advice, safety copy and onward links. The existing “Why we put How are you feeling first” rationale and Shift Says wording remain intact. The original flow script already brings the form before the explanation; this presentation uses those existing classes for a compact question card and adjacent desktop explanation, stacked on mobile.

Only scoped CSS and presentation markers are added in production. No question, result text, formula, account or saving behaviour is rewritten. Production continues to use the current Core response and original client assets.

Matt requested “Next?” in the visual-review workflow. Preview preparation is authorised; publication requires sign-off on this completed version. The preview is noindex, has zero production routes, removes analytics/event/feedback/service-worker scripts, blocks writes and private APIs, and enables the preview's initially disabled submit button only when the original local result handler has loaded. Without JavaScript the button stays disabled. Synthetic test answers may be used only on the isolated preview, with outbound writes blocked. No personal health details, account updates or messages are authorised.

Homepage, the separate Start Here work and paused Medicines Watch, reconciliation and shared-Core work remain outside this scope.

## Review-ready checkpoint — 22 October 2026

Qualified preview: https://shift-feeling-presentation-preview-20261022.matobrien.workers.dev/how-are-you-feeling
Source `6a974091cdb33cd75c61978bdf8b349bbc7f0d3a` on `preview/feeling-presentation-20261022`.
Workflow https://github.com/shiftsometimber/shift-core/actions/runs/39780764566 and job `119831114058` completed successfully. This supersedes the first wording assertion that compared text after visual capitalisation.

Chromium and WebKit each passed at 390px and 1440px. All five questions, twenty radio options, values, required flags, rationale, Shift Says wording and links matched the current public page. Initial views passed 20 text-contrast checks each; keyboard selection and Back retained the answer. The three original result bands each passed in every view: twelve synthetic result cases, including the existing support block, five signal rows, correct priority, readable results and no horizontal overflow. Result views passed 35 contrast checks for the heavy band and 32 each for the other bands. The original JavaScript assets for the flow and result handler matched the current public bytes exactly. Without JavaScript the preview retains all twenty options and keeps submission disabled. Write and private-API guards passed.

No public routes were changed; all 210 existing route records and the shared header/footer were preserved. Only synthetic answers were used on the isolated preview. No personal health details were entered, no My Timber record was updated and no message was sent.

Artifact `12427385508`, `feeling-preview-6a974091cdb33cd75c61978bdf8b349bbc7f0d3a`, SHA-256 `ebd53c818f49bfa7554d357507c3d0b28f9c3861c4dc615be6afc13fe6ecbb7b`, preserves original/rendered source, route inventories, client-asset fingerprints, initial screenshots, synthetic example results and browser checks. The downloaded digest was verified. Initial desktop/mobile and example-result screenshots were visually reviewed.

User-facing image: `SHIFT-Feeling-Preview-2026-10-22.png`, saved as `libfile_72d4616a43948191b2af40b2e94e2064`. The image shows the first question with no answers selected. The review browser also shows the initial preview and no live account state.

**Public deployment awaits Matt's sign-off on this version.** After explicit approval, retain the exact pinned worker/style in `preview-gate.json` and use the existing GitHub/Cloudflare release mechanism. Qualify staging before activating only the exact `/how-are-you-feeling`, `/how-are-you-feeling/` and `/how-are-you-feeling.html` paths on apex and www (six exact routes), preserving all earlier routes and current Core/client handling. Verify actual public mobile/desktop presentation, original form and assets, keyboard flow, original result bands and aliases. Use only synthetic answers with outbound writes blocked; never update a member account or send a message. Record the verified release here. This does not authorise changes to the question wording, result calculation, safety copy or any separately paused work.

## Approved release — 22 October 2026 (BST)

Matt replied “Go” to the qualified preview and its publication question. This authorises that exact pinned presentation for the six exact check-in routes. Publication will retain the worker/style blobs in preview-gate.json, original questions, scoring and account behaviour. The live workflow qualifies isolated staging before route activation, then checks the actual public page with synthetic answers and outbound writes blocked. Rollback removes only this release’s owned routes if acceptance fails. All existing exclusions remain in force.

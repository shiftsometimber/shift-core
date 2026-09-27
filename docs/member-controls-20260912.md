# Member control consistency — 12 September 2026

The shared member layer now sizes native checkboxes and radio buttons explicitly and includes dialogs created outside main. It gives actions common spacing, focus indicators, disabled states and primary/secondary styling. Consent and tool sheets share bounded, scrollable surfaces. Dynamic dialogs have accessible headings; Today sheets gain keyboard containment, Escape dismissal and focus return.

The source consent wording, explicit opt-in gate, data routes, API contracts and production bindings are unchanged. No production release was made.

## Verification

- 28 page/viewport checks: Today, Journey, Grub, Fit, Check-in, Saved and Settings at 320, 390, 768 and 1280px.
- 19 open-dialog viewport checks: consent from Settings (12), consent from Check-in (3) and Today’s Life changed sheet (4). All tested overlays stay inside the viewport without horizontal overflow; short views scroll to the actions.
- Native choice controls measure 22 × 22px. Consent requires an explicit tick, resets on reopen, and both dismissal routes recover the underlying check-in controls.
- Journey’s later steps, Grub’s five tabs, Fit failure handling, reminder controls, keyboard navigation and selected states were exercised in the read-only review.
- Isolated checks passed: 38 workplace, 84 Programme, 33 member/existing-tool checks. Worker dry-run passed. Hosted staging deployment and remote workplace persistence/access probe passed.

Implementation: `cdf9b8ec8c37a7130c7885ccc36c524e466f82b5`. Deployed revision with improved dimension measurements: `ff031e0f09ceda84d83c44741307633fcd6b06bf`, tree `83396cff1af20368bd0eea522ba9316b78da2d7a`.

[Preview](https://shift-core-work-staging.matobrien.workers.dev/staging/member/dashboard?review=ff031e#today) · [Responsive checker](https://shift-core-work-staging.matobrien.workers.dev/staging/member/review?review=ff031e) · [Checks](https://github.com/shiftsometimber/shift-core/actions/runs/34692169884) · [Staging](https://github.com/shiftsometimber/shift-core/actions/runs/34692169872)

## Limits

Browser inspection used the provided Chrome browser. Safari/iOS hardware was unavailable. The member preview uses fictional data and blocks saves; this is presentation and interaction evidence, not a fresh authenticated member-write acceptance. Native browser confirmation dialogs keep their browser styling. The unrelated pre-existing act2b-one-shot workflow validation failure is outside this change.

Detailed dimensions and interaction records are in `member-controls-20260912.json` beside this note.

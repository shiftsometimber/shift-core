# Member text contrast and Grub interactions — 12 September 2026

This follow-up corrects a gap in the earlier control review: checking CSS `color` did not check the actual WebKit text fill. Legacy dark-card styles painted cream text over the new cream surfaces. The earlier dimension checks did not establish that every label was readable.

## Changes

- The scoped member layer now aligns painted text with `currentColor`, including dynamically created dialogs and button labels.
- Grub shortcut cards, ingredient chips, shopping controls and shared fields have explicit readable surface/text pairs. Both shortcut headings open the existing Fridge/Week actions; clicking non-interactive card content does the same.
- Search results appear directly below the search. All five preview filters return visibly labelled fictional examples reflecting the selection. Editing the query clears the old selected filter.
- Today, Journey and Check-in labels caught by the wider audit received explicit dark text. Journey's live announcements are visually hidden while remaining available to screen readers.
- The staging checker measures painted text, including `-webkit-text-fill-color`; it reports failures instead of claiming full accessibility conformance.

## Verification

- Seven member screens were audited at phone and desktop widths. Final affected-screen checks at 320 and 1280px found no measured text contrast failures or horizontal overflow on Today, Journey, Check-in and Grub. Fit, Settings and Saved passed the wider 390/1280px audit.
- All five Grub panels passed the text audit. The populated ingredient chip also passed at 320 and 1280px. Selected Journey radio labels passed at 320px.
- Browser clicks confirmed five distinct filter responses, both shortcut headings, ingredient addition/removal and clearing stale filter selection after query editing. The existing five tabs switched panels.
- Browser screenshots visually confirmed the previously unreadable Grub cards and ingredient chip are readable.
- Nine local member tests passed. The isolated checks and hosted staging deployment, including the remote workplace persistence/access probe, passed.

Final implementation: `119287807eb7c8ef236c6a17d92785b3b35743cc`; tree `f7a868f8428bd0cff161aff2861a90b92ccc48d5`.

[Grub preview](https://shift-core-work-staging.matobrien.workers.dev/staging/member/grub?review=1192878) · [Responsive checker](https://shift-core-work-staging.matobrien.workers.dev/staging/member/review?review=1192878) · [Checks](https://github.com/shiftsometimber/shift-core/actions/runs/34694080998) · [Staging](https://github.com/shiftsometimber/shift-core/actions/runs/34694081018)

## Limits

No production deployment was made. The live public homepage responded to a read-only check; authenticated live member save/reload/retrieval was not verified. The preview still uses fictional examples and deliberately blocks account writes and week generation. Its interactions do not establish real recipe matching, clinical content approval or live persistence.

Browser inspection used Chrome; Safari/iOS hardware was unavailable. The contrast diagnostic measures computed text/background pairs and cannot establish full WCAG conformance or assess all images, gradients and overlays. The unrelated pre-existing `act2b-one-shot` workflow validation failure remains outside this change.

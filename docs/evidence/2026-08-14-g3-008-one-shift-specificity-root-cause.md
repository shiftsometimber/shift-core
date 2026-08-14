# G3-008 — One Shift CSS specificity root cause

Date: 2026-08-14

Status: **AMBER — bounded source repair prepared; unchanged production re-proof required after deployment.**

## Fresh production evidence

The unchanged authenticated production accessibility run `31774652627`, job `94687479870`, exercised My Shift, Today, Grub, Fit and Progress at 1440x900 and 390x844. The retained `g3-008-accessibility-evidence` artifact is ID `9209426991`, digest `sha256:69c191572b4dda898dcbe5bc80417116d5f06cf5b8b283f4ac8c39f0e3edd4c4`.

The run proved the current v7 P0 asset is genuinely linked on every exercised surface and the live response contains the commissioned `#53624d` action and `#6f7869` control-boundary repair. It also retained zero root horizontal overflow, required landmarks/headings, reduced-motion handling and visible keyboard focus. G3-008 did **not** pass: the real Grub, Fit and Progress journeys still computed legacy ash `rgb(139,150,112)` primary actions (3.14:1 against white) and legacy `rgb(200,193,183)` non-checkbox input boundaries (1.76:1 against the cream form surface), on both commissioned viewports.

## Root cause

The retained production static-source capture shows the legacy `one-shift-v34.css` rules use `!important` with greater specificity than the original P0 repair:

- legacy `.mp-btn:not(.ghost):not(.secondary)` beats P0 `.mp-btn:not(.ghost)` and therefore keeps the old `--os-ash` action background;
- legacy `input:not([type=checkbox]):not([type=radio]):not([type=range])` beats P0 `.mp-form input` / `.member-form input` and therefore keeps the pale `#c8c1b7` boundary.

The member P0 response is served through the existing `memberContrastStatic` overlay in `member-contrast-static-v1.js`, so this is no longer a stale-publication problem. It is a deterministic author-CSS cascade problem.

## Bounded repair

PR #241 changes only that existing production contrast overlay. The selectors now deliberately outrank the two demonstrated legacy One Shift selectors while retaining the already commissioned forest/cream palette and the unchanged WCAG thresholds. No new visual system, parallel stylesheet architecture or feature is introduced.

## Closure rule

G3-008 remains AMBER until the repair is merged/deployed and the unchanged authenticated production acceptance demonstrates at 1440x900 and 390x844:

1. normal action text contrast >= 4.5:1;
2. meaningful form/control boundaries >= 3:1;
3. zero root horizontal overflow;
4. visible keyboard focus;
5. required landmarks/headings;
6. reduced-motion behaviour;
7. retained screenshots plus machine-readable evidence.

A green merge alone is not PASS.

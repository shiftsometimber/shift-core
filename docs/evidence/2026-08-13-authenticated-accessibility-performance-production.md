# Authenticated accessibility + performance production evidence — 2026-08-13

Status: **AMBER — demonstrated production defects retained; no audit row promoted**

Scope: authenticated My Shift, Today, Grub, Fit, Progress and Shift AI at 1440×900 and 390×844 with reduced-motion enabled, keyboard-focus checks, labels/landmarks, root-overflow checks, measured contrast and route/render timing.

## Retained execution

- Source branch/run: PR #168 (`commissioning/authenticated-a11y-performance-v1`), Gate 1 Rendered Browser run `31736275376`.
- Authenticated accessibility/performance job: `94568558840` — **FAILURE**, as required when measured production acceptance failed.
- Evidence artifact: `9195277536` (`authenticated-a11y-performance`), 13 retained files: `report.json` plus full-page screenshots for six authenticated surfaces at both viewports.
- Proof marker: `V1_AUTHENTICATED_ACCESSIBILITY_PERFORMANCE_V4_CONTRAST_TIMING`.

## Demonstrated performance defect

The production acceptance run measured:

- fixture registration: **20,627 ms** against the declared **800 ms API p95** budget;
- authenticated login: **17,548 ms** against the declared **800 ms API p95** budget.

Authenticated surface transitions after login were generally fast, but that does not cancel the failed registration/login SLO. **G5-012 stays AMBER.**

## Demonstrated accessibility state

The same run proved several important positives on both viewports: no document-root overflow, a usable main/H1 structure, no visible unlabeled controls in the commissioned surfaces, reduced-motion honoured, and a visible keyboard focus treatment.

It also found repeatable contrast problems that are visible in the retained screenshots and measurable in computed styles. The clearest genuine production defects are:

- primary member action buttons (`Build my menu`, `Build my session`, `Save check-in`, Ask actions): white text on `rgb(139,150,112)` measured about **3.14:1**, below the normal-text **4.5:1** requirement;
- light olive section eyebrows (`rgb(174,184,143)`) on cream backgrounds measured about **1.9–2.1:1**, below **4.5:1**;
- form control boundaries (`rgb(200,193,183)`) on near-white controls measured about **1.76:1**, below the **3:1** non-text contrast requirement;
- accessibility toggle boundaries were also below the 3:1 non-text threshold.

The V4 measurement harness additionally reports some hero text and filled-control failures that need classification before any palette change: the hero uses a dark green gradient/background image that the current colour parser does not composite, and the control rule compares a filled control border against the control's own fill. The retained screenshots show why those entries must not be blindly converted into design changes. This is a harness-quality issue, not permission to ignore the genuine failures above.

**G3-008 stays AMBER.** The next safe remediation is to preserve the current premium forest/cream visual constitution while darkening only the genuinely under-contrast olive text/actions/boundaries, then rerun the authenticated production acceptance with corrected background/control measurement. A green source change alone is not PASS; closure still requires the production journey and retained evidence.

## Commissioning conclusion

This evidence turns the previous accessibility/performance uncertainty into bounded, reproducible work. It does **not** promote G3-008 or G5-012. The production defects are now explicit, the already-good keyboard/layout/reduced-motion behaviour is protected, and the remediation target is narrow enough to fix without redesigning the member estate.

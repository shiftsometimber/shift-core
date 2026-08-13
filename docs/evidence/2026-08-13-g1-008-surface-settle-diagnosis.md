# G1-008 — rendered state-system surface-settle diagnosis

Date: 2026-08-13

## Fresh evidence

Gate 1 Rendered Browser Acceptance run `31717922495` was rerun against PR #161 head `f5d199cbd91abee431848560daffe60ed1e949d4` after the earlier navigation/auth harness repairs. The latest state-system artifact is `9188593769`, digest `sha256:fc215288ecb7010db97b8d86d26505933fa25b44106a20218429b0b97e55c193`.

The rerun materially narrowed the failure:

- desktop and 390px registrations returned 201;
- fixture login returned 200;
- `/v1/member-state` returned 200 in-browser;
- `sst_session` was retained;
- root overflow was zero in every captured empty-state case;
- the prior direct-navigation timeout did not recur;
- the remaining reported failures were only `desktop-grub-action`, `desktop-fit-action`, `mobile390-grub-action`, `mobile390-fit-action` (`build action missing`).

## Screenshot diagnosis

The retained screenshots prove those four messages do **not** demonstrate missing product controls.

`desktop-empty-grub.png` visibly contains the real **Build my menu** button on the Shift Grub surface.

More importantly, `mobile390-empty-fit.png` is labelled by the harness as the Fit empty-state capture but visibly still shows **Shift Grub**, its plan-length/preferences form and **Build my menu**. The generic `Ready when you are` matcher therefore allowed the previous surface to satisfy the purported Fit empty-state check before hash navigation had settled.

That same timing defect explains why `generatedState()` can immediately search for the next Grub/Fit build control and report it missing: `open()` changes `location.hash`, waits a fixed 500ms and does not prove that the requested product surface has actually become active.

## Closure target

This is a harness defect, not evidence of a production Grub/Fit regression. Do not weaken G1-008 acceptance and do not promote the row yet.

The bounded repair is:

1. after changing the dashboard hash, wait for a **surface-specific visible control/marker** (Grub: `Build my menu`; Fit: `Build my session`) rather than a fixed delay;
2. require those surface-specific controls before accepting the generic fresh-state copy, so a prior product panel cannot false-PASS another panel;
3. retain the existing strong success proof: explicit in-flight loading copy, disabled action while in flight, HTTP-successful build, settled completion state, at least one returned plan item visibly rendered, zero root overflow;
4. rerun unchanged at desktop and 390px;
5. only cash G1-008 if that corrected proof is GREEN.

No original-audit row is promoted by this diagnosis alone.

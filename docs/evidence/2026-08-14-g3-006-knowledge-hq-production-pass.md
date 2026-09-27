# G3-006 — governed Knowledge HQ production PASS

G3-006 is closed only after the governed editorial lifecycle and the deployed operator presentation were both demonstrated.

The API lifecycle was already proven on merged main by PR #270: both the exact `/v1/hq/articles/:id/publish` action used by HQ and the legacy publication path reject unreviewed publication; named approval survives leave/return; explicit reviewed publication succeeds; and reviewer provenance remains attached after publish. This preserved the existing Knowledge storage/RBAC authority rather than introducing a parallel CMS.

The first deployed HQ presentation pulse exposed a real browser defect instead of being counted as PASS: the production HQ origin could not preflight the editorial API. PR #279 repaired credentialed CORS only for the governed HQ article list/review/publish routes, handles OPTIONS before auth/database work and denies hostile origins.

After that repair, the live HQ presentation journey was rerun unchanged against `https://hq.shiftsometimber.co.uk` on shift-hq main `6629578524a574513c281d27430afbdafc740e22`. Run `31781843657`, rerun job `94723912030`, completed GREEN with `failures: []`. Desktop 1440x900 and mobile 390x844 both rendered the real `Knowledge Hub CMS` desk, the `Useful first. Reviewed before it goes live.` editorial standard, retained-review/publish controls, and the responsive stylesheet. Both cases had `pageErrors: []`, `consoleErrors: []` and zero document-root overflow; the 390px article table is intentionally contained in its own horizontal scroll region rather than overflowing the page.

Retained evidence artifact: `9213770096`; digest `sha256:132e79eec8d93fe0cea19b300215a5b1e4b18ada5d100d0937af24c04ca5e1e5`.

This satisfies the commissioned outcome: an authorised operator has a serious governed Knowledge workflow whose review state and reviewer provenance are retained, premature publication fails closed, reviewed publication uses the real action, and the deployed desk is usable at desktop and 390px under the homepage-level premium design constitution. Adjacent Gate 1 human token lifecycles, Gate 2 human editorial/domain decisions and external Gate 5 dependencies are not promoted by this evidence.
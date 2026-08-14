# G2-015 — My Plans premium manager rendered PASS

Date: 2026-08-14

## Commissioning boundary

G2-015 is not closed by the existence of a plans screen, a merged premium layer, or a green source/CI gate. PASS requires the live authenticated member journey to demonstrate a usable plan manager: a current plan must be visible, open into the real product, be replaceable without losing the prior plan, retain current/history state across leave/return, work at desktop and 390px, preserve the homepage-grade Shift visual constitution, and retain evidence.

## Authoritative production proof

- Workflow: `G2-015 My Plans Premium Production Acceptance`
- Run: `31771170735`
- Job: `94677258683`
- Main SHA tested: `f7080c3ef90762eb5d6c866b3bff9c3fa828e88b`
- Evidence artifact: `9208209981`
- Artifact digest: `sha256:9af821e164f45f9c8dcf655e6b1c58fd192734df12c7380374a6d4722991bb6f`
- Artifact contents retained by the workflow: five evidence files including the structured report and rendered captures.

## Demonstrated member journey

The unchanged production acceptance ran independently at 1440x900 and 390x844.

1. A fresh authenticated member created a real Shift Grub plan.
2. My Plans rendered that plan as the single current plan with the member-facing `CURRENT` treatment and an `Open Shift Grub` action.
3. Opening from My Plans reached the actual Shift Grub member surface rather than a dead link, placeholder or JSON response.
4. The member created a replacement plan.
5. My Plans then rendered the new plan as current and retained the replaced plan in previous-plan history rather than silently overwriting it.
6. Reload preserved the same current/history relationship.
7. Logout followed by a fresh login preserved the same current/history relationship again.
8. Both viewports completed with no browser page errors, no console errors and exactly zero document-root overflow.

## Premium presentation checks

The acceptance measured the live rendered surface rather than inferring quality from source:

- hero background: `rgb(23, 38, 29)`;
- premium rounded container: 28px desktop / 22px at 390px;
- premium shadow present;
- heading: 48px desktop / 34.4px at 390px;
- mobile `Open Shift Grub` action: 328px wide x 48px high;
- desktop and 390px root overflow: 0;
- page errors: 0;
- console errors: 0.

The workflow also fetched the production assets and confirmed the live Git-authoritative markers for `frontend/member/member-plans-premium-v1.js`, `frontend/member/member-plans-premium-v1.css` and `frontend/member/member-shell-v33g.js`, all HTTP 200.

The retained job emitted:

`PASS G2-015 My Plans premium manager: a real authenticated plan is created, rendered as current, opened from My Plans, replaced by a new plan with the old plan retained in history, and that current/history state survives reload and fresh login at desktop and 390px with premium hierarchy, usable touch targets and zero root overflow.`

## Scope discipline

This evidence closes **G2-015 only**. It does not promote the wider Gate 3 shell/navigation/footer/control-system rows, G2-001/G4-008 Today orchestration, the Grub/Fit human domain decisions, the real-inbox Gate 1 lifecycle rows, G5-012 performance, G5-013 Dave human-only legs, G5-014 competitive acceptance, or any external clinical/provider dependency.
# G2-014 — premium Progress Picture rendered PASS

Date: 2026-08-14

## Commissioning boundary

G2-014 is a member-facing presentation requirement. It is not allowed to pass because premium CSS/JS exists, a PR merged, or a screenshot looked plausible. Closure requires the live Git-authoritative presentation to render through the real authenticated member product, preserve the real photo journey, produce an explicit member outcome, work at desktop and 390px, avoid root overflow/browser errors, and retain evidence.

## Authoritative production proof

- Workflow: `G2-014 Progress Picture Premium Production Acceptance`
- Run: `31769074070`
- Job: `94670992621`
- Main SHA tested: `6fdaa6f98413ba5f52004bacebe64d504caba7d6`
- Evidence artifact: `9207452900`
- Artifact digest: `sha256:67f9c510695583640f7f8e25427cdf44a500fda75051434fb1eac62132711b5a`
- Artifact contents: `report.json`, desktop saved-state screenshot, 390px saved-state screenshot

## Live-source authority

The acceptance fetched the production assets before the journey rather than inferring deployment from Git:

- premium JS: HTTP 200, `git:frontend/member/member-progress-picture-premium-v1.js`, expected commissioning marker present;
- P0 CSS: HTTP 200, expected G2-014 premium marker present;
- member shell: HTTP 200, `git:frontend/member/member-shell-v33g.js`, premium loader marker present.

## Demonstrated member journey and presentation

Both 1440x900 and 390x844 cases used a fresh authenticated member and the rendered Progress Picture product.

1. The member opened the real Progress Picture surface and the premium layer was present (`data-progress-picture-premium="v1"`).
2. The live hierarchy rendered `PRIVATE PROGRESS`, `See the change, not just the number.` and the privacy reassurance `Your photo. Your account.` in the Shift forest/cream visual system.
3. A valid real PNG was selected through the styled file control and decoded into a large rounded preview.
4. Weight, waist and consent were entered through the real controls and the rendered `Save original progress photo` action completed.
5. The member saw the explicit outcome `Original progress photo saved to My Shift.` rather than a silent API success.
6. The saved real photo rendered in a premium retained-history card with `SAVED PRIVATELY`, measurement context and a visible delete action.
7. Reloading the page retained the saved-photo history; the rendered returned state still contained the saved photo and delete control.
8. Deleting through the rendered product returned the product to the real empty state.

## Objective presentation checks

Desktop and 390px both passed the automated geometry/quality floor:

- forest hero background `rgb(23, 38, 29)` and rounded premium container;
- large hierarchy: 48px desktop heading and 34.4px at 390px;
- upload control >48px high;
- primary save action 48px high;
- delete action >44px high;
- large photo treatment: 988px rendered saved image on desktop and 334px at 390px;
- premium saved-photo card shadow/radius present;
- document-root overflow exactly 0 at 1440 and 390;
- browser page errors: 0;
- browser console errors: 0;
- report failures: `[]`.

The retained job emitted: `PASS G2-014 Progress Picture premium UI: live Git-authoritative premium assets render the real save/return outcome with homepage-grade forest/cream hierarchy, large photo treatment, deliberate controls and mobile touch targets at desktop and 390px with zero root overflow.`

## Same-SHA persistence regression

G2-013 persistence/reliability remains independently commissioned rather than inferred from presentation. The premium main SHA triggered the full G2-013 production lifecycle again and that separate run completed GREEN:

- G2-013 regression run: `31769074080`
- job: `94670992655`
- same main SHA: `6fdaa6f98413ba5f52004bacebe64d504caba7d6`
- artifact: `9207479805`
- digest: `sha256:5e0e627e1e352c2407f1093691edac04f948a8322ba95f0f8e02a5566746cbc7`

That means the premium presentation passed without trading away the separately commissioned private upload/retention/isolation/delete lifecycle.

## Scope discipline

This closes **G2-014 only** and, because G2-011/G2-012/G2-013 were already PASS, completes the mapped M13 Progress boundary. It does not promote G2-015 My Plans, the Gate 3 estate-wide shell/navigation/footer/control-system rows, Dave, accessibility/performance, Grub/Fit editorial review, or any external clinical requirement.

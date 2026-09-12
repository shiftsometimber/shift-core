# Member experience review — 12 September 2026

Scope: SHIFT for Work member screens and shared workplace form/report styling. The existing My Timber dashboard, Journey, Grub, Fit and check-in tools have not received a complete visual/usability review in this pass. Physical-device/Safari and real-user acceptance remain open.

## Finding

The earlier implementation met several functional requirements but did not meet the same visual/interaction standard as the public site. Returning members saw the joining/privacy form before their programme. A shared public card-hover rule changed panel backgrounds to black while workplace headings and links stayed black. Earlier width tests did not detect that contrast defect; they demonstrated fit, not complete visual quality.

## Changes made

- The returning-member view starts with the current week and its action, using the approved homepage photograph, SHIFT's black/cream/sage palette and existing typography.
- The current weekly review leads the panel, with one obvious check-in link and a separate completion control. Company context, dates and personal review count are visible. No health outcomes or invented activity statistics are shown.
- Four labelled cards connect to existing My Journey, SHIFT Grub, SHIFT Fit and check-in tools. The 12-week record, programme/support details and withdrawal controls are expandable below.
- Returning members can open their privacy/data information or another invitation below their programme. New members still see the entire unchanged workplace notice before the required voluntary joining checkbox.
- Scoped styles prevent shared card hover rules from hiding text in workplace panels. Links and buttons retain explicit hover/focus states.
- Review feedback stays visible when the page is scrolled. Button focus survives an update or refused write; joining moves focus to the newly rendered programme heading.
- The API, storage, authentication, reporting policy, consent version, commissioning gates and testing prohibition are unchanged. Production and the approved employer PDF are unchanged.

## Verification

Implementation: `70865a5342a35057c86837121f643fe7cc9481d1`.

- Isolated CI passed: 38 workplace checks plus 84 Programme checks, run `34688961824`.
- Remote staging/D1 probe passed at `2026-09-12T10:39:39.228Z`, run `34688961817`.
- Browser visual review covered the current-week panel, owned image, mobile tool cards, and the joining form while hovered/focused. The former disappearing-text state is resolved in those inspected controls.
- All three workplace screens passed 320, 375, 390, 768 and 1024px frame widths without horizontal overflow after the redesign.
- A browser click on the fictional current-week review received the deliberate read-only refusal. It showed an error, retained focus on the review control and kept the review count at 3 of 12. No false success appeared.
- New rendering regressions cover returning-member ordering, full first-join notice, upcoming/inactive review restrictions and an already-completed current week.

The latest browser visual checks use fictional read-only data. The real authenticated browser sign-in/claim/save/logout journey is earlier evidence; the revised candidate also passes the real backend account/persistence probes. Neither is a claim that every member tool or every device has been accepted.

Review preview: https://shift-core-work-staging.matobrien.workers.dev/staging/layout/member

This is a temporary fictional staging view. Its tool links and writes are disabled. The older Pages workplace mock is historical and should not be used to judge this revision. Real men trying the whole journey remain the appropriate test of whether the experience is useful and easy to use.

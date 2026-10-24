# My Shift release checkpoint — 24 October 2026 (Europe/London)

Authority: Matt approved the black/cream/ash-green My Shift design, nine-section left navigation, cream-panel inner spacing and continuously pulsing flush green action border, and requested deployment en masse. Purchasing must remain disabled; homepage excluded. No messages, invitations, prescriptions, booking or payments are authorised by this release.

Implementation: additive `/member/my-shift`, `/member/my-shift.html` and `/my-shift` routes and scoped assets. Existing My Timber pages and shop order API are retained. My Orders links into My Shift. Account details reuse the existing audited revision/idempotency-aware profile controls. Reads use existing member-authenticated, no-store APIs; no browser storage. Clear records on sign-out, session failure, pagehide and refresh; reload BFCache restores. No fictional records are shipped.

Connected: signed-in account name/details/GP editor; medicine and shop order summaries, dates, totals, payment/clinical status, secure assessment handoff; recent activity; member-reported recorded measurements with source; responsive navigation; request-attention counts and continuous inset pulse with pause/reduced-motion support.

Not connected: issued prescription document service, clinical evidence workflow in main, appointment booking, new clinician-case decisions or their delivery consumers. These sections explicitly describe availability, not fictitious appointments or prescriptions. Existing separate HQ fictional demo and closed clinical flags are unchanged. No AI identity decision is activated. Clinical approval is never presented as prescription issue/pharmacy acceptance/dispatch.

Verification: four focused tests plus eleven original order/app-layout tests passed. Fictional browser tests at 320/390/1024px passed all nine sections, 22/28px inner padding, no horizontal overflow, safe text rendering, continuous pulse, pause, resolved removal, partial service failure and 401 record clearing. Reduced-motion passed. Zero page errors and GET-only test traffic. Screenshot reviewed at 390px. Full inherited member suite initially failed because dependencies were absent and historical source checks require a clean ordinary Git checkout rather than a linked worktree. Install completed; full clean-checkout rerun is the next step. No safety assertions have been edited.

Status: implemented and locally tested, NOT deployed or production verified. The production workflow and exact-source composition gates must pass before release. No delivery, partner, regulatory or clinical acceptance is implied by UI verification.

Source worktree: `/Users/shiftsometimberltd/SST/my-shift-release-20261024`, branch `feat/my-shift-release-20261024`, based on `44ade5df`. Original partial order work remains untouched in `member-order-hub-20261024`.

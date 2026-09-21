# Independent discovery repair — 21 September 2026

Base: production main `e683723fc114197a55a9e3d8ac31c17a3c104054`, tree `f2cbafa27247d4677ad01c045f819bcc187df516`. The user instructed us to fix the six confirmed findings. This branch contains those repairs, their failure-path regressions and isolated preview acceptance. Production is not yet changed.

| Finding | Repair | Verification required |
|---|---|---|
| D1 crisis wording/dependency bypass | Recognise the audited inflections and punctuation; static signposting precedes AI/DB checks. Preserve safety answers through the public intent client, including mixed food questions. | Missing and throwing dependencies; ordinary/informational wording; public rendered reply in Chromium/WebKit desktop and phone. |
| D2 Pen Day outside privacy lifecycle | Consent gate rechecked inside the write; export notes and legacy events even after withdrawal; erase optional notes and their legacy analytics atomically with other health history. Stop new medication analytics, including client submissions. | Real SQLite lifecycle, race, isolation and clinical-record preservation; hosted Settings erasure and export. |
| D3 missing account-deletion control | Explicit Settings confirmation, cancel/retry and honest received-not-deleted receipt. Atomic request + existing HQ task + current-session revocation; pending request/task deduplication. | SQLite rollback/idempotence; rendered cancellation/failure/receipt; durable preview queue and revoked session. |
| D4 Today offers rejected Fit | Use the same saved-plan guard in Today and Fit. Invalid plans show review rather than start, without exercise instructions or automatic replacement. | Before/after explicit rebuild, reload and new login; preserve plan/history. |
| D5 invisible shared bridge text | Scope actual text-fill and foreground to black on the existing cream main panel; preserve cream CTA on black. | Computed paint and settled screenshot on urgent-help page in both engines/sizes. |
| D6 inaccurate 24-hour report | Use matching canonical ISO lower/upper time bounds for events, members, surfaces and errors. | Exact cutoff ±1 ms, midnight and future-event exclusion using SQLite. |

Local acceptance: 239 tests passed, plus the existing final Today, daily front-door and One Shift Brain source gates. Hosted acceptance is pending. One existing staging test fixture now retains subdirectories when reading explicit current-source assets; no allowed-path checks were removed.

The public intent client was captured from the live `/assets/ask-timber-intent-v2.js?v=1` on 21 September; its only behavioural edit is the early return for safety responses. It now has an explicit source-controlled Worker asset owner. Public Pages remain pinned to `0da69833.projectshift.pages.dev`; no Pages replacement or old archive rollback is needed.

Urgent mental-health signposting was checked against https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/ on 21 September. This is an engineering repair, not certification that keyword matching detects every crisis or that a qualified clinical review is complete.

Operational questions from the independent audit remain separate: actual historical account-deletion completion and named daily queue coverage; real email delivery and external alert response; restore rehearsal; physical devices and field performance; capacity and remaining integration evidence. This repair does not open medicines/tests, make clinical supply promises, introduce payments, send messages, erase customer records during deployment, or expand the product scope.

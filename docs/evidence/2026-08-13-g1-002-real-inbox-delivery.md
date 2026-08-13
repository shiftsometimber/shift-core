# G1-002 production transactional inbox evidence

Date: 2026-08-13

Commissioning decision: **PASS evidence for G1-002 only.** This does not close the token-click journeys in G1-001, G1-003 or G1-004.

A direct read of the connected Shift Gmail inbox confirms genuine production transactional delivery from `welcome@shiftsometimber.co.uk` into real Gmail inbox storage:

- `Welcome to My Shift` received 2026-08-12 18:09:43 UTC for a production commissioning plus-address alias (`DaveB`). Additional independent Welcome receipts are present for separate production commissioning aliases.
- `Reset your My Shift password` received 2026-08-12 11:22:26 UTC for `shiftsometimber+commissioning@gmail.com` (`Dave`). The message states that the reset link expires in 30 minutes.

Both messages are retained as actual Gmail messages, not API delivery mocks or source-level assertions. This demonstrates that the deployed transactional email binding can deliver both Welcome and password-reset mail to a real external inbox.

Remaining boundaries are deliberately not promoted by association:

- G1-001 still requires reset-token click -> new password -> login -> authenticated change-password -> logout/login evidence.
- G1-003/G1-004 still require a fresh registration -> verification inbox receipt/click -> verified-login journey and replay/expiry evidence where specified.

G1-002 can therefore be reconciled independently while those adjacent lifecycle rows remain AMBER.

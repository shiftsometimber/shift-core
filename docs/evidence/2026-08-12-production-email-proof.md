# Production transactional email evidence — 2026-08-12

Observed in the connected Shift Gmail inbox during finish-line commissioning.

- Sender: `Shift Some Timber <welcome@shiftsometimber.co.uk>`
- Recipient: commissioning alias on the Shift Gmail account
- `Welcome to My Shift` messages were actually received in INBOX.
- `Reset your My Shift password` was actually received in INBOX.
- Reset message addressed the synthetic member as Dave, contained a reset-password link on `https://shiftsometimber.co.uk/reset-password.html`, stated a 30-minute expiry, and included the expected unsolicited-request safety copy.
- Secret reset token is intentionally not copied into repository evidence.

Result: the previous uncertainty "forgot-password email is actually received" is CLOSED/PASS. This does not by itself prove token submission, password mutation and subsequent login/change-password; those remain part of B01 until executed end-to-end.

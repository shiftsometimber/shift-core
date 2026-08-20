# Shift shop launch snag list — 20 August 2026

## Proven live today

- Stripe test checkout completes and creates one idempotent paid order.
- Safari return page resolves the Shift order number after payment.
- Paid order is linked to the signed-in member and appears in My Shift.
- My Shift `#orders` links now land on the dynamically loaded order list.
- The same order appears in Shift HQ with customer, delivery and Stripe data.
- HQ accepts carrier, tracking reference and the Dispatched status.
- Dispatch updates the order and sends the branded customer email.
- The tested dispatch email reached Outlook inbox rather than junk.

## Open before public shop launch

| Priority | Item | State | Acceptance |
| --- | --- | --- | --- |
| P0 | Move commerce from Stripe test mode to live mode | Open | Live keys/webhook configured; one controlled live order and refund proven |
| P0 | Real Stripe refund action from HQ | Open | Refund changes the Stripe payment and records the result; status-only changes cannot masquerade as refunds |
| P1 | Make HQ orders usable on mobile | Open | Replace the horizontally clipped table with responsive cards or a complete mobile row; order, customer, status, total and actions visible without sideways scrolling |
| P1 | Show tracking inside My Shift | Open | Dispatched order displays carrier and tracking reference/link as well as the email |
| P1 | Carrier-aware clickable tracking links | Open | Supported carrier + reference generates a safe customer tracking link; unknown carriers remain plain text |
| P1 | Separate test orders from operational reporting | Open | Test/cancelled attempts do not distort live order count, open-order count or paid-revenue reporting |
| P1 | Stock and fulfilment controls | Open | HQ can set stock/availability; checkout cannot oversell; out-of-stock state is clear |
| P2 | Continue sender-reputation monitoring | Monitoring | Fresh Gmail and Outlook confirmations land in inbox; SPF, DKIM and DMARC remain passing |

## Separate medicines-commerce programme

The merchandise shop is operational in Stripe test mode. Medicine purchasing is not launch-complete merely because the T-shirt journey works. It still requires the governed post-payment clinical assessment, secure evidence uploads, prescribing/dispensing workflow, eligibility decision, partial-fee/refund handling, partner integration and medicine-specific stock/dose controls.

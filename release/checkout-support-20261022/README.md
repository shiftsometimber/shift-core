# Approved optional support checkout integration

22 October 2026. Scoped addition to the current treatment-order page. Existing header/footer, catalogue, stock closure, clinical checks and payment handlers retained. Support uses the current selected medicine/dose/HQ price and returns to the exact previous stage. No clinical data or preference is persisted or transmitted by the support client.

Blood tests and nutrition are displayed as optional information, unavailable to add until confirmed product, price, suitability and fulfilment contracts exist. All add-on catalogue entries are held. No public payment API, existing accounts or clinical questionnaire code changes are included. The private clinical workspace is untouched.

Accepted colours: black #050505, cream #E7E3DA, ash green #707762. Prescription-only notice included. Removed recommendation-reason labels remain absent.

Source checks: six passing Node tests covering rules, purchase gates, existing checkout and shell preservation. Preview and live receipts are maintained in the existing checkout integration release folder on SST Mac.

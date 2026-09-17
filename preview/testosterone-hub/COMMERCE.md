# Testosterone home-test preview

SH-TE is a home investigation product, not TRT medication. It uses the existing products, commerce_inventory, orders, order reference registry, Stripe Checkout builder and signed Stripe webhook routes. Price is server-owned. Stock defaults to zero, status to draft, price to unconfirmed. Null inventory is not unlimited for this product.

The public card loads `/v1/commerce/health/SH-TE` and fails closed. Checkout requires a verified account, positive stock, configured price and delivery, active status, a named partner and explicit pathway/fulfilment/sellable flags. It is single-item only. Existing authorised HQ managers can GET/PATCH `/v1/hq/catalogue/health/SH-TE`; PATCH takes pricePence, stockOnHand, deliveryPence (null or integer), status, partner, sellable, pathwayReady and fulfilmentReady. There is no new HQ form in this pass.

The preview uses only `shift-testosterone-preview-db`, no production bindings, and explicitly removes the Stripe key before checkout. It cannot charge. No account provisioning or treatment service is exposed by this scoped preview.

Local SQLite integration tests exercise zero stock, readiness, null stock, last-item reservations, cart and origin restrictions, email verification, server-side price, shared order creation, simulated Stripe Checkout, signed simulated webhook completion/deduplication and failed-checkout release. They are not a real Stripe test transaction.

Before enabling any sale: confirm the partner service and home-test fulfilment, clinical and consent pathway, accurate product/price/delivery terms, operational order handling, and run a real Stripe test checkout/return/webhook with the configured deployment. Matt reviews before partner-facing use as TRT ready. My Timber results integration remains unclaimed. Production deployment is outside this preview change.

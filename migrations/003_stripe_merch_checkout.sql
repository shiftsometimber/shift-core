-- Stripe merchandise checkout infrastructure.
-- Apply once to shift-core-db before enabling the checkout route.

CREATE TABLE IF NOT EXISTS commerce_order_details (
  order_id INTEGER PRIMARY KEY,
  size TEXT NOT NULL,
  delivery_pence INTEGER NOT NULL DEFAULT 0,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_payment_status TEXT NOT NULL DEFAULT 'pending',
  shipping_name TEXT,
  shipping_address_json TEXT,
  last_stripe_event_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS stripe_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  processing_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_commerce_checkout_session ON commerce_order_details(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_commerce_payment_intent ON commerce_order_details(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_received ON stripe_events(received_at);

INSERT INTO products(name,sku,product_type,price_pence,status,description,created_at,updated_at)
VALUES('Shift Some Timber T-shirt','SST-TEE-BLACK-V1','physical',1000,'active','Shift Some Timber branded T-shirt. Sizes XS to 5XL.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(sku) DO UPDATE SET
  name=excluded.name,
  product_type=excluded.product_type,
  price_pence=excluded.price_pence,
  status=excluded.status,
  description=excluded.description,
  updated_at=CURRENT_TIMESTAMP;

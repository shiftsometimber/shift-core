-- Medicine catalogue stock and Stripe order lifecycle.
-- Stock defaults to zero: no medicine checkout can open until HQ adds stock.

CREATE TABLE IF NOT EXISTS medicine_inventory (
  variant_id INTEGER PRIMARY KEY,
  stock_on_hand INTEGER NOT NULL DEFAULT 0 CHECK(stock_on_hand >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(variant_id) REFERENCES medicine_variants(id)
);

CREATE TABLE IF NOT EXISTS medicine_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  medicine_id INTEGER NOT NULL,
  variant_id INTEGER NOT NULL,
  medicine_name TEXT NOT NULL,
  strength_label TEXT NOT NULL,
  unit_price_pence INTEGER NOT NULL,
  discount_code TEXT,
  discount_pence INTEGER NOT NULL DEFAULT 0,
  total_pence INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicine_stripe_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  processing_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_medicine_orders_user ON medicine_orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_variant ON medicine_orders(variant_id, created_at);

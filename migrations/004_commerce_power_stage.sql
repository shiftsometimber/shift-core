CREATE TABLE IF NOT EXISTS commerce_inventory (
  product_id INTEGER NOT NULL,
  size TEXT NOT NULL,
  stock_on_hand INTEGER,
  reserved INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(product_id,size),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS commerce_refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  stripe_refund_id TEXT NOT NULL UNIQUE,
  amount_pence INTEGER NOT NULL,
  reason TEXT,
  environment TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_commerce_refunds_order ON commerce_refunds(order_id);

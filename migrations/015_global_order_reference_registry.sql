-- One privacy-safe SST reference namespace for every commercial rail.
CREATE TABLE IF NOT EXISTS order_reference_registry (
  order_number TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK(channel IN ('apparel','medicine','pharmacy','membership','service','other')),
  source_table TEXT,
  source_id INTEGER,
  user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'reserved',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_reference_source
  ON order_reference_registry(source_table,source_id)
  WHERE source_table IS NOT NULL AND source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_reference_user
  ON order_reference_registry(user_id,created_at);

INSERT OR IGNORE INTO order_reference_registry(order_number,channel,source_table,source_id,user_id,status,created_at,updated_at)
SELECT order_number,'apparel','orders',id,user_id,status,created_at,updated_at FROM orders;

INSERT OR IGNORE INTO order_reference_registry(order_number,channel,source_table,source_id,user_id,status,created_at,updated_at)
SELECT order_number,'medicine','medicine_orders',id,user_id,status,created_at,updated_at FROM medicine_orders;

CREATE TABLE IF NOT EXISTS commerce_product_details (
  product_id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  image_key TEXT NOT NULL,
  featured_colour TEXT NOT NULL,
  colours_json TEXT NOT NULL,
  sizes_json TEXT NOT NULL,
  one_size INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS commerce_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  colour TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_pence INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_commerce_order_items_order ON commerce_order_items(order_id);

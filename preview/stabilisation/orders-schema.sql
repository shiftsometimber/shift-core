-- Fictional preview only: empty shop history for seeded test members.
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,sku TEXT NOT NULL UNIQUE,
 product_type TEXT NOT NULL DEFAULT 'physical',price_pence INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'draft',description TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,order_number TEXT NOT NULL UNIQUE,user_id INTEGER,
 customer_email TEXT,customer_name TEXT,product_id INTEGER,
 quantity INTEGER NOT NULL DEFAULT 1,subtotal_pence INTEGER NOT NULL DEFAULT 0,
 total_pence INTEGER NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'GBP',
 status TEXT NOT NULL DEFAULT 'new',payment_status TEXT NOT NULL DEFAULT 'pending',notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(product_id) REFERENCES products(id)
);
CREATE TABLE IF NOT EXISTS commerce_order_details (
 order_id INTEGER PRIMARY KEY,size TEXT NOT NULL,delivery_pence INTEGER NOT NULL DEFAULT 0,
 stripe_checkout_session_id TEXT UNIQUE,stripe_payment_intent_id TEXT,
 stripe_payment_status TEXT NOT NULL DEFAULT 'pending',shipping_name TEXT,
 shipping_address_json TEXT,last_stripe_event_type TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id)
);
CREATE TABLE IF NOT EXISTS commerce_order_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER NOT NULL,
 sku TEXT NOT NULL,product_name TEXT NOT NULL,colour TEXT NOT NULL,size TEXT NOT NULL,
 quantity INTEGER NOT NULL,unit_price_pence INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(product_id) REFERENCES products(id)
);

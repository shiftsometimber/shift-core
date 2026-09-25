-- Fictional preview only: empty shop history for seeded test members.
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY,name TEXT,sku TEXT);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY,order_number TEXT UNIQUE,user_id INTEGER,customer_email TEXT,
 quantity INTEGER,subtotal_pence INTEGER,total_pence INTEGER,currency TEXT,
 status TEXT,payment_status TEXT,notes TEXT,created_at TEXT,updated_at TEXT,product_id INTEGER
);
CREATE TABLE IF NOT EXISTS commerce_order_details (
 order_id INTEGER PRIMARY KEY,size TEXT,delivery_pence INTEGER,
 shipping_name TEXT,shipping_address_json TEXT,stripe_payment_intent_id TEXT
);
CREATE TABLE IF NOT EXISTS commerce_order_items (
 id INTEGER PRIMARY KEY,order_id INTEGER,sku TEXT,product_name TEXT,
 colour TEXT,size TEXT,quantity INTEGER,unit_price_pence INTEGER
);

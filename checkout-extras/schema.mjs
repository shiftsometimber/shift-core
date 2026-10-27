export const SQL=`CREATE TABLE IF NOT EXISTS supplement_checkout_offers (
 id TEXT PRIMARY KEY,name TEXT NOT NULL,pack_label TEXT NOT NULL,supplier_sku TEXT NOT NULL,
 price_pence INTEGER NOT NULL,delivery_group TEXT NOT NULL,delivery_label TEXT NOT NULL,
 delivery_pence INTEGER NOT NULL,delivery_scope TEXT NOT NULL DEFAULT 'unconfirmed',
 stock_quantity INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved>=0),
 labels_verified INTEGER NOT NULL DEFAULT 0,fulfilment_verified INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 0,valid_until TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS supplement_checkout_orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,order_number TEXT NOT NULL UNIQUE,user_id INTEGER NOT NULL,channel TEXT NOT NULL,quote_json TEXT NOT NULL,
 total_pence INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',stripe_session_id TEXT,
 shipping_json TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS supplement_fulfilment_queue (
 id INTEGER PRIMARY KEY AUTOINCREMENT,order_number TEXT NOT NULL UNIQUE,user_id INTEGER NOT NULL,quote_json TEXT NOT NULL,shipping_json TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'awaiting_supplier',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS supplement_checkout_events (
 event_id TEXT PRIMARY KEY,processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;
export async function ensureExtras(DB){await DB.exec(SQL.replace(/\s+/g,' ').replaceAll(';',';\n'));}

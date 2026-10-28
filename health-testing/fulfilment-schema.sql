CREATE TABLE IF NOT EXISTS testing_fulfilment_config (
 id INTEGER PRIMARY KEY CHECK(id=1),
 revision INTEGER NOT NULL DEFAULT 1,
 template_name TEXT NOT NULL DEFAULT 'Awaiting partner template',
 columns_json TEXT NOT NULL,
 delimiter TEXT NOT NULL DEFAULT ',',
 utf8_bom INTEGER NOT NULL DEFAULT 0 CHECK(utf8_bom IN (0,1)),
 template_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(template_confirmed IN (0,1)),
 delivery_method TEXT NOT NULL DEFAULT 'unconfirmed' CHECK(delivery_method IN ('unconfirmed','email','upload')),
 destination TEXT,
 delivery_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(delivery_confirmed IN (0,1)),
 updated_by TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO testing_fulfilment_config(id,columns_json) VALUES(1,'[{"header":"Order reference","source":"order_reference","required":true},{"header":"Product code","source":"supplier_sku","required":true},{"header":"Quantity","source":"quantity","required":true},{"header":"Recipient","source":"recipient","required":true},{"header":"Address line 1","source":"address_line1","required":true},{"header":"Address line 2","source":"address_line2","required":false},{"header":"Town / city","source":"city","required":true},{"header":"County / region","source":"region","required":false},{"header":"Postcode","source":"postcode","required":true},{"header":"Country","source":"country","required":true}]');
CREATE TABLE IF NOT EXISTS testing_fulfilment_batches (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 id TEXT NOT NULL UNIQUE,
 request_key TEXT NOT NULL UNIQUE,
 request_hash TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('live','test')),
 status TEXT NOT NULL DEFAULT 'prepared' CHECK(status IN ('prepared','submitted','acknowledged','cancelled')),
 revision INTEGER NOT NULL DEFAULT 1,
 config_revision INTEGER NOT NULL,
 config_json TEXT NOT NULL,
 snapshot_json TEXT NOT NULL,
 csv_text TEXT NOT NULL,
 csv_sha256 TEXT NOT NULL,
 row_count INTEGER NOT NULL,
 order_count INTEGER NOT NULL,
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 submitted_by TEXT,
 submitted_at TEXT,
 submission_reference TEXT,
 acknowledged_by TEXT,
 acknowledged_at TEXT,
 acknowledgement_reference TEXT,
 cancelled_by TEXT,
 cancelled_at TEXT,
 cancellation_reason TEXT
);
CREATE TABLE IF NOT EXISTS testing_fulfilment_items (
 batch_id TEXT NOT NULL REFERENCES testing_fulfilment_batches(id),
 source_line_id INTEGER NOT NULL,
 source_order_id INTEGER NOT NULL,
 order_reference TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 PRIMARY KEY(batch_id,source_line_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS testing_fulfilment_once ON testing_fulfilment_items(source_line_id) WHERE active=1;
CREATE INDEX IF NOT EXISTS testing_fulfilment_order ON testing_fulfilment_items(source_order_id,active);
CREATE TABLE IF NOT EXISTS testing_fulfilment_tracking (
 batch_id TEXT NOT NULL REFERENCES testing_fulfilment_batches(id),
 source_order_id INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'awaiting_confirmation' CHECK(status IN ('awaiting_confirmation','accepted','dispatched','exception')),
 revision INTEGER NOT NULL DEFAULT 1,
 carrier TEXT,
 tracking_reference TEXT,
 partner_reference TEXT,
 note TEXT,
 updated_by TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(batch_id,source_order_id)
);
CREATE TABLE IF NOT EXISTS testing_fulfilment_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 batch_id TEXT,
 event TEXT NOT NULL,
 actor TEXT NOT NULL,
 detail_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS testing_fulfilment_event_batch ON testing_fulfilment_events(batch_id,id);

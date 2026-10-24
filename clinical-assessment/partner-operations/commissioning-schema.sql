-- Private synthetic commissioning only. Never join these records into customer queues.
CREATE TABLE IF NOT EXISTS partner_commissioning_orders (
 order_number TEXT PRIMARY KEY CHECK(order_number LIKE 'TEST-%'),
 version INTEGER NOT NULL, state_json TEXT NOT NULL CHECK(json_extract(state_json,'$.synthetic')=1),
 created_by TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS partner_commissioning_events (
 id TEXT PRIMARY KEY, order_number TEXT NOT NULL REFERENCES partner_commissioning_orders(order_number),
 version INTEGER NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, details_json TEXT NOT NULL,
 created_at TEXT NOT NULL, UNIQUE(order_number,version)
);
CREATE TABLE IF NOT EXISTS partner_commissioning_notifications (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES partner_commissioning_events(id),
 order_number TEXT NOT NULL, channel TEXT NOT NULL CHECK(channel IN ('email','whatsapp')),
 template TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL CHECK(status='withheld'),
 created_at TEXT NOT NULL, UNIQUE(event_id,channel)
);
CREATE TRIGGER IF NOT EXISTS partner_commissioning_events_no_update BEFORE UPDATE ON partner_commissioning_events BEGIN SELECT RAISE(ABORT,'immutable_commissioning_audit'); END;
CREATE TRIGGER IF NOT EXISTS partner_commissioning_events_no_delete BEFORE DELETE ON partner_commissioning_events BEGIN SELECT RAISE(ABORT,'immutable_commissioning_audit'); END;

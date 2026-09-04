-- Pharmacy-to-My-Timber treatment lifecycle. Stock remains fail-closed.
ALTER TABLE medicine_orders ADD COLUMN clinical_status TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE medicine_orders ADD COLUMN clinical_reason_code TEXT;
ALTER TABLE medicine_orders ADD COLUMN clinical_updated_at TEXT;
ALTER TABLE medicine_orders ADD COLUMN journey_setup_required INTEGER NOT NULL DEFAULT 0;
ALTER TABLE medicine_orders ADD COLUMN journey_setup_completed_at TEXT;
ALTER TABLE medicine_orders ADD COLUMN reorder_of_order_id INTEGER;
ALTER TABLE medicine_orders ADD COLUMN reorder_eligible_at TEXT;

CREATE INDEX IF NOT EXISTS idx_medicine_orders_member_lifecycle
  ON medicine_orders(user_id, clinical_status, created_at);

CREATE INDEX IF NOT EXISTS idx_medicine_orders_reorder_parent
  ON medicine_orders(reorder_of_order_id);

-- R1 Foundation: commercial control. Unknown values remain NULL with explicit TBC status.
CREATE TABLE IF NOT EXISTS catalogue_suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legal_name TEXT, trading_name TEXT, registered_address TEXT, fulfilment_address TEXT,
  contact_name TEXT, contact_email TEXT, contact_phone TEXT, website TEXT,
  company_number TEXT, vat_number TEXT,
  status TEXT NOT NULL DEFAULT 'tbc' CHECK(status IN ('tbc','review','approved','suspended')),
  evidence_json TEXT, confirmed_at TEXT, reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogue_commercial_control (
  product_id INTEGER PRIMARY KEY,
  supplier_id INTEGER, supplier_sku TEXT,
  actual_cost_pence INTEGER CHECK(actual_cost_pence IS NULL OR actual_cost_pence>=0),
  actual_cost_status TEXT NOT NULL DEFAULT 'tbc' CHECK(actual_cost_status IN ('tbc','proposed','confirmed')),
  cost_basis TEXT NOT NULL DEFAULT 'tbc', vat_treatment TEXT NOT NULL DEFAULT 'tbc',
  p_and_p_cost_pence INTEGER CHECK(p_and_p_cost_pence IS NULL OR p_and_p_cost_pence>=0),
  p_and_p_cost_status TEXT NOT NULL DEFAULT 'tbc' CHECK(p_and_p_cost_status IN ('tbc','proposed','confirmed')),
  payment_cost_pence INTEGER CHECK(payment_cost_pence IS NULL OR payment_cost_pence>=0),
  expected_refund_decline_cost_pence INTEGER CHECK(expected_refund_decline_cost_pence IS NULL OR expected_refund_decline_cost_pence>=0),
  direct_support_cost_pence INTEGER CHECK(direct_support_cost_pence IS NULL OR direct_support_cost_pence>=0),
  contribution_cost_status TEXT NOT NULL DEFAULT 'tbc' CHECK(contribution_cost_status IN ('tbc','proposed','confirmed')),
  lead_time_min_days INTEGER CHECK(lead_time_min_days IS NULL OR lead_time_min_days>=0),
  lead_time_max_days INTEGER CHECK(lead_time_max_days IS NULL OR lead_time_max_days>=lead_time_min_days),
  lead_time_status TEXT NOT NULL DEFAULT 'tbc' CHECK(lead_time_status IN ('tbc','proposed','confirmed')),
  target_gm_bps INTEGER NOT NULL DEFAULT 6000 CHECK(target_gm_bps BETWEEN 0 AND 10000),
  minimum_contribution_pence INTEGER,
  commercial_state TEXT NOT NULL DEFAULT 'blocked' CHECK(commercial_state IN ('blocked','review','approved','suspended')),
  source_reference TEXT, approver TEXT, effective_at TEXT, next_review_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(supplier_id) REFERENCES catalogue_suppliers(id)
);

CREATE INDEX IF NOT EXISTS idx_catalogue_commercial_state ON catalogue_commercial_control(commercial_state);
CREATE INDEX IF NOT EXISTS idx_catalogue_supplier_state ON catalogue_suppliers(status);

INSERT OR IGNORE INTO catalogue_commercial_control(product_id,target_gm_bps,commercial_state)
SELECT id,6000,'blocked' FROM products WHERE product_type='physical';

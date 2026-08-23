-- R1 Foundation: governed hierarchy Treatment family -> Formulation -> Strength -> Offer.
CREATE TABLE IF NOT EXISTS treatment_families (
  id INTEGER PRIMARY KEY AUTOINCREMENT, family_key TEXT NOT NULL UNIQUE, active_ingredient TEXT NOT NULL,
  governance_state TEXT NOT NULL DEFAULT 'tbc' CHECK(governance_state IN ('tbc','review','approved','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS treatment_formulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, family_id INTEGER NOT NULL, formulation_key TEXT NOT NULL,
  route TEXT NOT NULL, routine TEXT NOT NULL,
  governance_state TEXT NOT NULL DEFAULT 'tbc' CHECK(governance_state IN ('tbc','review','approved','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id,formulation_key), FOREIGN KEY(family_id) REFERENCES treatment_families(id)
);
CREATE TABLE IF NOT EXISTS treatment_strengths (
  id INTEGER PRIMARY KEY AUTOINCREMENT, formulation_id INTEGER NOT NULL, strength_label TEXT NOT NULL,
  proposed_price_pence INTEGER NOT NULL CHECK(proposed_price_pence>0), selling_price_pence INTEGER,
  target_gm_bps INTEGER NOT NULL DEFAULT 6000 CHECK(target_gm_bps BETWEEN 0 AND 10000),
  actual_cost_pence INTEGER, cost_status TEXT NOT NULL DEFAULT 'tbc', stock_state TEXT NOT NULL DEFAULT 'tbc',
  stock_source TEXT, stock_confirmed_at TEXT, content_version TEXT, clinical_review_date TEXT,
  claims_state TEXT NOT NULL DEFAULT 'tbc', cta_state TEXT NOT NULL DEFAULT 'blocked',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(formulation_id,strength_label), FOREIGN KEY(formulation_id) REFERENCES treatment_formulations(id)
);
CREATE TABLE IF NOT EXISTS treatment_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, strength_id INTEGER NOT NULL, offer_type TEXT NOT NULL,
  availability_state TEXT NOT NULL DEFAULT 'tbc', switching_requirements TEXT, evidence_requirements TEXT,
  included_services TEXT, partner_id INTEGER, dispensing_cost_pence INTEGER, delivery_cost_pence INTEGER,
  payment_cost_pence INTEGER, expected_refund_decline_cost_pence INTEGER, direct_support_cost_pence INTEGER,
  minimum_contribution_pence INTEGER, commercial_state TEXT NOT NULL DEFAULT 'blocked',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(strength_id,offer_type), FOREIGN KEY(strength_id) REFERENCES treatment_strengths(id),
  FOREIGN KEY(partner_id) REFERENCES catalogue_suppliers(id)
);

CREATE TABLE IF NOT EXISTS catalogue_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, treatment_strength_id INTEGER,
  action TEXT NOT NULL, actor TEXT NOT NULL, request_id TEXT NOT NULL,
  before_json TEXT, after_json TEXT, occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(treatment_strength_id) REFERENCES treatment_strengths(id)
);

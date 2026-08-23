CREATE TABLE IF NOT EXISTS claims_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT, claim_key TEXT NOT NULL, version INTEGER NOT NULL,
  exact_wording TEXT NOT NULL, qualification TEXT, evidence_source TEXT NOT NULL,
  permitted_channel TEXT NOT NULL, permitted_destination TEXT NOT NULL,
  clinical_approval TEXT, regulatory_approval TEXT, owner TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'draft', effective_at TEXT, review_at TEXT NOT NULL, expires_at TEXT,
  withdrawn_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(claim_key,version), CHECK(state IN ('draft','review','approved','withdrawn','expired')),
  CHECK(permitted_channel IN ('public_service','treatment_pathway','factual_product','checkout','member_support','transactional'))
);
CREATE TABLE IF NOT EXISTS claims_render_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, claim_id INTEGER NOT NULL, channel TEXT NOT NULL,
  destination TEXT NOT NULL, correlation_id TEXT NOT NULL, rendered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(claim_id) REFERENCES claims_library(id)
);
CREATE INDEX IF NOT EXISTS idx_claims_lookup ON claims_library(claim_key,permitted_channel,state,review_at);

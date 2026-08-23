-- Governed bulk supplier/cost/stock intake. Imports can never approve or activate medicine sales.
CREATE TABLE IF NOT EXISTS catalogue_supplier_keys (
  external_key TEXT PRIMARY KEY, supplier_id INTEGER NOT NULL UNIQUE,
  FOREIGN KEY(supplier_id) REFERENCES catalogue_suppliers(id)
);
CREATE TABLE IF NOT EXISTS catalogue_intake_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, idempotency_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('applied','rolled_back')),
  actor TEXT NOT NULL, source_reference TEXT NOT NULL, row_count INTEGER NOT NULL,
  rollback_of INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, rolled_back_at TEXT,
  FOREIGN KEY(rollback_of) REFERENCES catalogue_intake_revisions(id)
);
CREATE TABLE IF NOT EXISTS catalogue_intake_rows (
  revision_id INTEGER NOT NULL, row_key TEXT NOT NULL, target_key TEXT NOT NULL,
  treatment_strength_id INTEGER NOT NULL, offer_id INTEGER NOT NULL,
  before_json TEXT NOT NULL, after_json TEXT NOT NULL, blockers_json TEXT NOT NULL,
  PRIMARY KEY(revision_id,row_key), FOREIGN KEY(revision_id) REFERENCES catalogue_intake_revisions(id)
);
CREATE TABLE IF NOT EXISTS catalogue_intake_targets (
  target_key TEXT PRIMARY KEY, last_revision INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(last_revision) REFERENCES catalogue_intake_revisions(id)
);
CREATE INDEX IF NOT EXISTS idx_catalogue_intake_rows_target ON catalogue_intake_rows(target_key,revision_id);

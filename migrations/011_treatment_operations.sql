-- R2 Foundation: neutral, reconciled treatment journey states.
-- No medicine, strength, assessment answer or clinical detail belongs in this operational log.
CREATE TABLE IF NOT EXISTS treatment_journeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER,
  public_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'route_started',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  CHECK(status IN (
    'route_started','options_shown','account_created','selection_saved','terms_accepted',
    'payment_pending','payment_failed','payment_authorised','assessment_in_progress',
    'assessment_submitted','more_information_required','under_clinical_review','prescribed',
    'not_prescribed','refund_pending','refunded','dispensing','pharmacy_unable_to_fulfil',
    'dispatched','delivery_exception','delivered','stock_blocked','maintenance_review',
    'cancelled','expired'
  ))
);
CREATE TABLE IF NOT EXISTS treatment_journey_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  source TEXT NOT NULL,
  reason_code TEXT,
  idempotency_key TEXT NOT NULL,
  revision INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(journey_id,idempotency_key),
  FOREIGN KEY(journey_id) REFERENCES treatment_journeys(id)
);
CREATE INDEX IF NOT EXISTS idx_treatment_journeys_status ON treatment_journeys(status,updated_at);
CREATE INDEX IF NOT EXISTS idx_treatment_journey_events_journey ON treatment_journey_events(journey_id,id);

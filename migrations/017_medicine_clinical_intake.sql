-- Partner-neutral clinical handoff. SHIFT stores consent/audit metadata only;
-- clinical images and answers are streamed to the regulated pharmacy partner.
CREATE TABLE IF NOT EXISTS medicine_clinical_intakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  variant_id INTEGER NOT NULL,
  public_reference TEXT NOT NULL UNIQUE,
  partner_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  gp_contact_consent INTEGER NOT NULL CHECK (gp_contact_consent = 1),
  consent_version TEXT NOT NULL,
  evidence_manifest_json TEXT NOT NULL,
  verification_issued_at TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicine_clinical_intakes_member
  ON medicine_clinical_intakes(user_id, submitted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_medicine_clinical_intakes_partner_reference
  ON medicine_clinical_intakes(partner_reference);

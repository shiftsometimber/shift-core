-- Shift Grub / Shift Fit canonical structured-content store.
-- Additive and compatible with structured-content-v1.js.
CREATE TABLE IF NOT EXISTS structured_content (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  data_json TEXT NOT NULL,
  review_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_structured_content_type_status ON structured_content(content_type,status);
CREATE INDEX IF NOT EXISTS idx_structured_content_updated ON structured_content(updated_at);

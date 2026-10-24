-- Private, immutable preparation only. No tokens, permissions, sender or schedule.
CREATE TABLE IF NOT EXISTS partner_invitation_drafts (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('partner','clinician')),
 org_id TEXT NOT NULL, staff_id TEXT, profile_version INTEGER,
 recipient_name TEXT NOT NULL, recipient_email TEXT NOT NULL,
 subject TEXT NOT NULL, body TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'held_onboarding_closed',
 created_by INTEGER NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(kind,org_id,staff_id,profile_version,recipient_email)
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_invitation_once ON partner_invitation_drafts(kind,org_id,COALESCE(staff_id,''),COALESCE(profile_version,-1),recipient_email);
CREATE TRIGGER IF NOT EXISTS partner_invitation_drafts_no_update BEFORE UPDATE ON partner_invitation_drafts BEGIN SELECT RAISE(ABORT,'immutable_invitation_draft'); END;
CREATE TRIGGER IF NOT EXISTS partner_invitation_drafts_no_delete BEFORE DELETE ON partner_invitation_drafts BEGIN SELECT RAISE(ABORT,'immutable_invitation_draft'); END;

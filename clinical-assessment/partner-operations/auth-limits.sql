-- Pseudonymous, finite-window counters; never stores passwords, codes, IPs or usernames.
CREATE TABLE IF NOT EXISTS partner_auth_limits (
 scope_hash TEXT NOT NULL, window_start INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 attempt_count INTEGER NOT NULL, PRIMARY KEY(scope_hash,window_start)
);
CREATE INDEX IF NOT EXISTS partner_auth_limits_expiry ON partner_auth_limits(expires_at);

-- STUDIOSB6L D1 session table migration (NOT applied automatically).
-- Review against existing schema before applying. No user credentials are stored here.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY NOT NULL CHECK(length(token_hash)=64),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('artist','producer','promoter','venue','company','student','owner')),
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
  mfa_verified INTEGER NOT NULL DEFAULT 0 CHECK(mfa_verified IN (0,1)),
  disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1)),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
-- Future authentication service MUST rotate tokens on login, expire and revoke on logout,
-- and enforce account-level revocation; this schema alone is not a complete auth system.

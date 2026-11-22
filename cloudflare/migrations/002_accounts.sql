-- STUDIOSB6L account schema proposal. NOT applied in production.
-- Existing accounts must be reconciled before migration; do not import plaintext passwords.
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('artist','producer','promoter','venue','company','student','owner')),
  password_hash TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
  disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1)),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_accounts_role ON accounts(role);
-- Never expose accounts or sessions tables from public read APIs.
-- Enforce Cloudflare edge rate limiting before setting RATE_LIMIT_VERIFIED=true.
-- Owner login remains blocked until separately reviewed MFA challenge is implemented.

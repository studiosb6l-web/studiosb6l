-- Additive owner enrollment. Never delete MFA data or reset it on code rollback.
CREATE TABLE IF NOT EXISTS owner_bootstrap (
 id INTEGER PRIMARY KEY CHECK(id=1),
 account_id TEXT NOT NULL,
 token_hash TEXT NOT NULL,
 secret_ciphertext TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 consumed_at INTEGER
);
CREATE TABLE IF NOT EXISTS owner_mfa (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id),
 secret_ciphertext TEXT NOT NULL,
 last_counter INTEGER NOT NULL,
 enrollment_nonce TEXT NOT NULL UNIQUE,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS owner_recovery_codes (
 code_hash TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts(id),
 used_at INTEGER
);
CREATE INDEX IF NOT EXISTS owner_recovery_account ON owner_recovery_codes(account_id);
CREATE TABLE IF NOT EXISTS owner_auth_limits (
 scope TEXT PRIMARY KEY,
 used INTEGER NOT NULL CHECK(used>=0)
);

-- Additive, pending deployment. No changes to existing accounts or passwords.
CREATE TABLE IF NOT EXISTS account_email_verifications (
 token_hash TEXT PRIMARY KEY NOT NULL CHECK(length(token_hash)=64),
 account_id TEXT NOT NULL REFERENCES accounts(id),
 expires_at INTEGER NOT NULL,
 consumed_at INTEGER,
 terms_accepted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_account_email_expiry ON account_email_verifications(expires_at);

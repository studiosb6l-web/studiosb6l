-- Additive; no changes to existing accounts, payments or credentials.
CREATE TABLE IF NOT EXISTS payhip_admission_payments (
 transaction_id TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id),
 paid_at INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS payhip_admission_refunds (
 transaction_id TEXT PRIMARY KEY NOT NULL,
 refunded_at INTEGER NOT NULL
);

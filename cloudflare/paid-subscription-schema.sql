-- Staged only: no production migration until provider contract is verified.
CREATE TABLE IF NOT EXISTS paid_subscription_entitlements (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id),
 provider_subscription_id TEXT NOT NULL UNIQUE,
 plan TEXT NOT NULL CHECK(plan IN ('PRO','PRO_BUSINESS')),
 verified_at INTEGER NOT NULL,
 paid_until INTEGER NOT NULL CHECK(paid_until>verified_at),
 revoked_at INTEGER
);

-- Retain cancellation even when no entitlement has yet been created.
CREATE TABLE IF NOT EXISTS paid_subscription_revocations (
 provider_subscription_id TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts(id),
 observed_at INTEGER NOT NULL CHECK(observed_at>0)
);

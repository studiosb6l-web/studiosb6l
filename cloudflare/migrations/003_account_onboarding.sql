-- Additive onboarding ledger. Existing accounts and artist data are preserved.
CREATE TABLE IF NOT EXISTS account_onboarding (
  account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id),
  checkout_reference_hash TEXT NOT NULL UNIQUE CHECK(length(checkout_reference_hash)=64),
  email_verified_at INTEGER,
  paid_at INTEGER,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  activated_at INTEGER,
  revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS admission_payment_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT,
  payment_intent_id TEXT,
  event_type TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
-- A refund/dispute may arrive before the checkout completion event.
CREATE TABLE IF NOT EXISTS admission_payment_blocks (
  payment_intent_id TEXT PRIMARY KEY NOT NULL,
  blocked_at INTEGER NOT NULL
);

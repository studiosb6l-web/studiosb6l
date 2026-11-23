-- BEN: PRO subscriptions, additive schema only. Review before applying to production.
-- No payment or entitlement is activated by this migration.
CREATE TABLE IF NOT EXISTS account_subscriptions (
  account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'basic' CHECK(plan IN ('basic','pro')),
  billing_interval TEXT CHECK(billing_interval IN ('month','year')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK(subscription_status IN ('inactive','incomplete','trialing','active','past_due','unpaid','canceled')),
  current_period_end INTEGER,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK(cancel_at_period_end IN (0,1)),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK(plan != 'pro' OR stripe_subscription_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_account_subscriptions_status ON account_subscriptions(subscription_status, current_period_end);
CREATE TABLE IF NOT EXISTS subscription_webhook_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  received_at INTEGER NOT NULL DEFAULT (unixepoch())
);
-- Never authorize PRO based solely on plan: verify active status, period and account activation in backend.

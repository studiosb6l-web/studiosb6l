-- Draft migration; apply only after backup and review of existing accounts schema.
CREATE TABLE IF NOT EXISTS hive_notification_preferences (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 consent INTEGER NOT NULL DEFAULT 0 CHECK(consent IN (0,1)),
 categories TEXT NOT NULL DEFAULT '[]',
 country TEXT
);
CREATE TABLE IF NOT EXISTS hive_verified_opportunities (
 canonical_id TEXT PRIMARY KEY,
 category TEXT NOT NULL,
 country TEXT,
 expires_at INTEGER NOT NULL,
 source_verified INTEGER NOT NULL DEFAULT 0 CHECK(source_verified IN (0,1)),
 source_authorized INTEGER NOT NULL DEFAULT 0 CHECK(source_authorized IN (0,1)),
 moderation TEXT NOT NULL DEFAULT 'pending' CHECK(moderation IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS hive_opportunity_expiry ON hive_verified_opportunities(moderation,expires_at);

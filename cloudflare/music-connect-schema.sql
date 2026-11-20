-- B6L Music Connect: migration draft, not applied automatically.
-- Apply to a dedicated D1 database after testing and backups.
CREATE TABLE IF NOT EXISTS mc_accounts (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, email_verified_at TEXT,
 display_name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('musician','recruiter','both')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, disabled_at TEXT
);
CREATE TABLE IF NOT EXISTS mc_sessions (
 id_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES mc_accounts(id) ON DELETE CASCADE,
 expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS mc_sessions_account ON mc_sessions(account_id);
CREATE TABLE IF NOT EXISTS mc_profiles (
 account_id TEXT PRIMARY KEY REFERENCES mc_accounts(id) ON DELETE CASCADE,
 slug TEXT UNIQUE, city TEXT, country TEXT, instruments TEXT NOT NULL DEFAULT '[]',
 genres TEXT NOT NULL DEFAULT '[]', biography TEXT, education TEXT, experience TEXT,
 travel_available INTEGER NOT NULL DEFAULT 0 CHECK(travel_available IN (0,1)),
 available_now INTEGER NOT NULL DEFAULT 0 CHECK(available_now IN (0,1)),
 visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
 moderation TEXT NOT NULL DEFAULT 'pending' CHECK(moderation IN ('pending','approved','rejected')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mc_videos (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES mc_accounts(id) ON DELETE CASCADE,
 storage_key TEXT NOT NULL UNIQUE, title TEXT NOT NULL, rights_confirmed INTEGER NOT NULL DEFAULT 0,
 moderation TEXT NOT NULL DEFAULT 'pending' CHECK(moderation IN ('pending','approved','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS mc_videos_account ON mc_videos(account_id);
CREATE TABLE IF NOT EXISTS mc_organizations (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES mc_accounts(id),
 name TEXT NOT NULL, type TEXT NOT NULL, country TEXT, city TEXT,
 verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mc_opportunities (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES mc_organizations(id),
 title TEXT NOT NULL, instrument TEXT NOT NULL, genre TEXT, city TEXT, country TEXT,
 travel_required INTEGER NOT NULL DEFAULT 0, compensation_text TEXT,
 description TEXT NOT NULL, keywords TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','published','closed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS mc_opportunities_lookup ON mc_opportunities(status,instrument,country);
CREATE TABLE IF NOT EXISTS mc_applications (
 id TEXT PRIMARY KEY, opportunity_id TEXT NOT NULL REFERENCES mc_opportunities(id),
 musician_id TEXT NOT NULL REFERENCES mc_accounts(id),
 message TEXT, status TEXT NOT NULL DEFAULT 'submitted',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(opportunity_id,musician_id)
);
CREATE TABLE IF NOT EXISTS mc_messages (
 id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES mc_accounts(id),
 recipient_id TEXT NOT NULL REFERENCES mc_accounts(id),
 opportunity_id TEXT REFERENCES mc_opportunities(id), body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, read_at TEXT
);
CREATE INDEX IF NOT EXISTS mc_messages_recipient ON mc_messages(recipient_id,created_at);
CREATE TABLE IF NOT EXISTS mc_alert_preferences (
 account_id TEXT PRIMARY KEY REFERENCES mc_accounts(id) ON DELETE CASCADE,
 email_enabled INTEGER NOT NULL DEFAULT 0, instruments TEXT NOT NULL DEFAULT '[]',
 countries TEXT NOT NULL DEFAULT '[]', last_alert_at TEXT
);
CREATE TABLE IF NOT EXISTS mc_subscriptions (
 account_id TEXT PRIMARY KEY REFERENCES mc_accounts(id), plan TEXT NOT NULL DEFAULT 'free'
 CHECK(plan IN ('free','pro_monthly','pro_annual')),
 provider_customer_id TEXT UNIQUE, provider_subscription_id TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'inactive', period_end TEXT, cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mc_audit_events (
 id TEXT PRIMARY KEY, account_id TEXT, action TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

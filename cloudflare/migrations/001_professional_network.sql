-- STUDIOSB6L professional network, D1/SQLite migration 001.
-- Additive only. Existing artists, orders and payments are untouched.
-- Authentication provider must be integrated before exposing private APIs.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS network_accounts (
 id TEXT PRIMARY KEY,
 auth_subject TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('artist','producer','promoter','school','student','company','admin')),
 country TEXT,
 biography TEXT,
 visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
 verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_network_accounts_role_visibility ON network_accounts(role,visibility);
CREATE TABLE IF NOT EXISTS network_opportunities (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES network_accounts(id),
 title TEXT NOT NULL, category TEXT NOT NULL, country TEXT, description TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','published','closed')),
 deadline TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_network_opportunities_status ON network_opportunities(status,category);
CREATE TABLE IF NOT EXISTS network_applications (
 id TEXT PRIMARY KEY, opportunity_id TEXT NOT NULL REFERENCES network_opportunities(id),
 applicant_id TEXT NOT NULL REFERENCES network_accounts(id), message TEXT,
 status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','review','accepted','rejected','withdrawn')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(opportunity_id,applicant_id)
);
CREATE TABLE IF NOT EXISTS network_conversations (
 id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS network_conversation_members (
 conversation_id TEXT NOT NULL REFERENCES network_conversations(id),
 account_id TEXT NOT NULL REFERENCES network_accounts(id),
 PRIMARY KEY(conversation_id,account_id)
);
CREATE TABLE IF NOT EXISTS network_messages (
 id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES network_conversations(id),
 sender_id TEXT NOT NULL REFERENCES network_accounts(id), body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_network_messages_conversation ON network_messages(conversation_id,created_at);
CREATE TABLE IF NOT EXISTS network_proposals (
 id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES network_accounts(id),
 recipient_id TEXT NOT NULL REFERENCES network_accounts(id),
 subject TEXT NOT NULL, details TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','negotiating','accepted','declined','cancelled')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS network_sync_requests (
 id TEXT PRIMARY KEY, requester_id TEXT NOT NULL REFERENCES network_accounts(id),
 work_reference TEXT NOT NULL, intended_use TEXT NOT NULL, territory TEXT,
 status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','review','quoted','licensed','declined')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS network_audit_events (
 id TEXT PRIMARY KEY, actor_id TEXT REFERENCES network_accounts(id),
 action TEXT NOT NULL, object_type TEXT NOT NULL, object_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_network_audit_object ON network_audit_events(object_type,object_id);

-- Additive only. Keep records on rollback; disable routes to pause service.
CREATE TABLE IF NOT EXISTS support_tickets (
 id TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL REFERENCES accounts(id),
 subject TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('payment','access','profile','other')),
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS support_account_updated ON support_tickets(account_id,updated_at);
CREATE INDEX IF NOT EXISTS support_updated ON support_tickets(updated_at);
CREATE TABLE IF NOT EXISTS support_messages (
 id TEXT PRIMARY KEY NOT NULL,
 ticket_id TEXT NOT NULL REFERENCES support_tickets(id),
 author TEXT NOT NULL CHECK(author IN ('user','staff','system')),
 body TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS support_ticket_messages ON support_messages(ticket_id,created_at);
CREATE TABLE IF NOT EXISTS support_usage (
 scope TEXT PRIMARY KEY NOT NULL,
 used INTEGER NOT NULL CHECK(used>=0)
);

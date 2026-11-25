-- Additive. Rollback: disable PRIVATE_INBOX_ENABLED; retain private records.
CREATE TABLE IF NOT EXISTS inbox_preferences (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id), receive_messages INTEGER NOT NULL DEFAULT 0 CHECK(receive_messages IN (0,1))
);
CREATE TABLE IF NOT EXISTS inbox_messages (
 id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES accounts(id), recipient_id TEXT NOT NULL REFERENCES accounts(id),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 3000), created_at INTEGER NOT NULL, read_at INTEGER,
 CHECK(sender_id != recipient_id)
);
CREATE INDEX IF NOT EXISTS inbox_received ON inbox_messages(recipient_id,created_at DESC,id);
CREATE INDEX IF NOT EXISTS inbox_sent ON inbox_messages(sender_id,created_at DESC,id);
CREATE TABLE IF NOT EXISTS inbox_blocks (
 account_id TEXT NOT NULL REFERENCES accounts(id), blocked_id TEXT NOT NULL REFERENCES accounts(id),
 PRIMARY KEY(account_id,blocked_id), CHECK(account_id != blocked_id)
);
CREATE TABLE IF NOT EXISTS inbox_reports (
 message_id TEXT NOT NULL REFERENCES inbox_messages(id), reporter_id TEXT NOT NULL REFERENCES accounts(id),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 500), created_at INTEGER NOT NULL,
 PRIMARY KEY(message_id,reporter_id)
);
CREATE TABLE IF NOT EXISTS inbox_usage (scope TEXT PRIMARY KEY, used INTEGER NOT NULL CHECK(used>=0));

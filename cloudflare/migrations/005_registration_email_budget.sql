-- Additive quota and per-account send guards, pending reviewed deployment.
CREATE TABLE IF NOT EXISTS registration_email_budget (
 day TEXT PRIMARY KEY NOT NULL,
 used INTEGER NOT NULL CHECK(used>=0)
);
CREATE TABLE IF NOT EXISTS account_email_send_locks (
 account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id),
 available_after INTEGER NOT NULL
);

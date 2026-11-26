-- Apply only with 010_ambassador_sessions.sql after D1 recovery checkpoint.
-- A bounded mutation budget, not a replacement for account-wide quota checks.
CREATE TABLE IF NOT EXISTS ambassador_write_budget (
 day TEXT PRIMARY KEY NOT NULL,
 used INTEGER NOT NULL CHECK(used BETWEEN 1 AND 100)
);

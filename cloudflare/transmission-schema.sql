-- Staged schema only; do not apply until quota and rollout review.
CREATE TABLE IF NOT EXISTS transmission_rooms (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL UNIQUE,
 host_account_id TEXT NOT NULL REFERENCES accounts(id),
 started_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 closed_at INTEGER,
 CHECK(expires_at > started_at AND expires_at - started_at <= 2700000),
 CHECK(closed_at IS NULL OR closed_at >= started_at)
);
CREATE INDEX IF NOT EXISTS transmission_rooms_expiry_idx ON transmission_rooms(expires_at,id) WHERE closed_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transmission_rooms_one_active_host ON transmission_rooms(host_account_id) WHERE closed_at IS NULL;

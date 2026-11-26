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

-- Attendance intervals are recorded by trusted server/provider events only.
CREATE TABLE IF NOT EXISTS transmission_attendance (
 id TEXT PRIMARY KEY,
 transmission_id TEXT NOT NULL REFERENCES transmission_rooms(id),
 account_id TEXT NOT NULL REFERENCES accounts(id),
 joined_at INTEGER NOT NULL,
 left_at INTEGER,
 CHECK(left_at IS NULL OR left_at >= joined_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS transmission_attendance_one_active_account ON transmission_attendance(account_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS transmission_attendance_room_idx ON transmission_attendance(transmission_id,joined_at);
CREATE INDEX IF NOT EXISTS transmission_attendance_account_idx ON transmission_attendance(account_id,joined_at);

-- Reservations remain charged until trusted reconciliation confirms release.
CREATE TABLE IF NOT EXISTS transmission_quota_reservations (
 id TEXT PRIMARY KEY,
 transmission_id TEXT NOT NULL REFERENCES transmission_rooms(id),
 metric TEXT NOT NULL,
 units INTEGER NOT NULL CHECK(units>0),
 created_at INTEGER NOT NULL,
 released_at INTEGER,
 CHECK(released_at IS NULL OR released_at>=created_at),
 UNIQUE(transmission_id,metric)
);
CREATE INDEX IF NOT EXISTS transmission_quota_active_idx ON transmission_quota_reservations(metric) WHERE released_at IS NULL;
CREATE TABLE IF NOT EXISTS transmission_invitations (
 transmission_id TEXT NOT NULL REFERENCES transmission_rooms(id),
 account_id TEXT NOT NULL REFERENCES accounts(id),
 created_at INTEGER NOT NULL,
 revoked_at INTEGER,
 PRIMARY KEY(transmission_id,account_id),
 CHECK(revoked_at IS NULL OR revoked_at>=created_at)
);

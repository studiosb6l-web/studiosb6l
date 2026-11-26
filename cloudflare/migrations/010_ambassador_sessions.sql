-- Draft migration: reconcile with deployed D1 schema before applying.
CREATE TABLE IF NOT EXISTS ambassador_invites (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, email TEXT NOT NULL,
 issuer_id TEXT NOT NULL REFERENCES accounts(id), sectors_json TEXT NOT NULL,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 redeemed_at INTEGER, redeemed_by TEXT REFERENCES accounts(id), revoked_at INTEGER,
 CHECK(expires_at>created_at)
);
CREATE TABLE IF NOT EXISTS ambassador_grants (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id),
 invite_id TEXT NOT NULL UNIQUE REFERENCES ambassador_invites(id),
 granted_at INTEGER NOT NULL, revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS ambassador_referrals (
 code TEXT PRIMARY KEY, ambassador_id TEXT NOT NULL REFERENCES accounts(id),
 created_at INTEGER NOT NULL, revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS ambassador_referral_attribution (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id),
 code TEXT NOT NULL REFERENCES ambassador_referrals(code), attributed_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS private_transmissions (
 id TEXT PRIMARY KEY, host_id TEXT NOT NULL REFERENCES accounts(id),
 scheduled_at INTEGER NOT NULL, started_at INTEGER, ended_at INTEGER,
 status TEXT NOT NULL CHECK(status IN ('scheduled','live','ended','cancelled')),
 provider_room_id TEXT UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS private_transmission_live_host ON private_transmissions(host_id) WHERE status='live';
CREATE TABLE IF NOT EXISTS private_transmission_invites (
 transmission_id TEXT NOT NULL REFERENCES private_transmissions(id),
 account_id TEXT NOT NULL REFERENCES accounts(id),
 token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, revoked_at INTEGER,
 PRIMARY KEY(transmission_id,account_id)
);
CREATE TABLE IF NOT EXISTS private_transmission_presence (
 transmission_id TEXT NOT NULL REFERENCES private_transmissions(id),
 account_id TEXT NOT NULL REFERENCES accounts(id), joined_at INTEGER NOT NULL,
 ended_at INTEGER, PRIMARY KEY(transmission_id,account_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS private_transmission_active_attendee ON private_transmission_presence(account_id) WHERE ended_at IS NULL;
CREATE TABLE IF NOT EXISTS private_transmission_cooldowns (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id), blocked_until INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS private_transmission_quota_reservations (
 transmission_id TEXT NOT NULL REFERENCES private_transmissions(id),
 metric TEXT NOT NULL, period_key TEXT NOT NULL, reserved INTEGER NOT NULL CHECK(reserved>=0),
 released_at INTEGER, PRIMARY KEY(transmission_id,metric,period_key)
);
CREATE TABLE IF NOT EXISTS account_embedded_videos (
 account_id TEXT NOT NULL REFERENCES accounts(id), slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 3),
 youtube_id TEXT NOT NULL CHECK(length(youtube_id)=11),
 PRIMARY KEY(account_id,slot), UNIQUE(account_id,youtube_id)
);
CREATE TABLE IF NOT EXISTS ambassador_audit (
 id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES accounts(id),
 event_type TEXT NOT NULL, target_id TEXT NOT NULL, created_at INTEGER NOT NULL
);
-- API must enforce atomic invite redemption, global host/attendee exclusion,
-- participant cap, quota reservation, cooldown and provider termination.
-- Never expose tokens or email addresses in public endpoints.

-- Additive, bounded professional profiles. No uploads, subscriptions or automatic publication.
CREATE TABLE IF NOT EXISTS professional_profiles (
 id TEXT PRIMARY KEY,
 account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id),
 kind TEXT NOT NULL,
 data TEXT NOT NULL CHECK(length(data)<=6000),
 blocked INTEGER NOT NULL DEFAULT 0 CHECK(blocked IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1,
 submission_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS professional_profile_review ON professional_profiles(status,updated_at);
CREATE TABLE IF NOT EXISTS professional_publications (
 profile_id TEXT PRIMARY KEY REFERENCES professional_profiles(id),
 account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id),
 data TEXT NOT NULL CHECK(length(data)<=6000),
 revision INTEGER NOT NULL,
 showcase INTEGER NOT NULL DEFAULT 0,
 matching INTEGER NOT NULL DEFAULT 0,
 country TEXT NOT NULL,
 approved_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS professional_publication_showcase ON professional_publications(showcase,approved_at);
CREATE INDEX IF NOT EXISTS professional_publication_matching ON professional_publications(matching,country,approved_at);
CREATE INDEX IF NOT EXISTS professional_publication_date ON professional_publications(approved_at);
CREATE TABLE IF NOT EXISTS professional_entitlements (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id),
 plan TEXT NOT NULL CHECK(plan IN ('pro_monthly','pro_annual')),
 provider_reference TEXT NOT NULL,
 verified_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 revoked_at INTEGER
);
-- No public endpoint may write professional_entitlements. Admission fee never grants PRO.
CREATE TABLE IF NOT EXISTS professional_review_log (
 id TEXT PRIMARY KEY,
 profile_id TEXT NOT NULL,
 revision INTEGER NOT NULL,
 reviewer_id TEXT NOT NULL,
 decision TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS professional_write_budget (
 day TEXT PRIMARY KEY,
 used INTEGER NOT NULL CHECK(used>=0)
);

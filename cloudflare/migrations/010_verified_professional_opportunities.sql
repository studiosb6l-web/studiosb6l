-- Only trusted ingestion may write; no public write endpoint.
CREATE TABLE IF NOT EXISTS verified_professional_opportunities (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(length(data)<=6000), expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS verified_opportunity_expiry ON verified_professional_opportunities(expires_at);

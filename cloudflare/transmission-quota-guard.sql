-- Staged only. Provider-specific metrics must be populated by trusted reconciliation.
CREATE TABLE IF NOT EXISTS transmission_quota_metrics (
 metric TEXT PRIMARY KEY,
 free_limit INTEGER NOT NULL CHECK(free_limit>0 AND free_limit<=900719925474099),
 used_units INTEGER NOT NULL CHECK(used_units>=0),
 observed_at INTEGER NOT NULL,
 valid_until INTEGER NOT NULL CHECK(valid_until>observed_at)
);
CREATE TRIGGER IF NOT EXISTS transmission_quota_guard
BEFORE INSERT ON transmission_quota_reservations
BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM transmission_quota_metrics m
 WHERE m.metric=NEW.metric
 AND m.observed_at<=NEW.created_at AND m.valid_until>NEW.created_at
 AND m.used_units+NEW.units+COALESCE((SELECT SUM(q.units) FROM transmission_quota_reservations q WHERE q.metric=NEW.metric AND q.released_at IS NULL),0)<=CAST(m.free_limit*7/10 AS INTEGER)
 ) THEN RAISE(ABORT,'capacity unavailable') END;
END;

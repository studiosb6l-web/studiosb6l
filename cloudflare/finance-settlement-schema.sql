-- Apply only via reviewed D1 migration.
CREATE TABLE IF NOT EXISTS hive_finance_settlements (
 provider TEXT NOT NULL,
 settlement_id TEXT NOT NULL,
 period_start INTEGER NOT NULL,
 currency TEXT NOT NULL CHECK(currency='EUR'),
 gross_cents INTEGER NOT NULL CHECK(gross_cents>=0),
 refund_cents INTEGER NOT NULL CHECK(refund_cents>=0),
 fee_cents INTEGER NOT NULL CHECK(fee_cents>=0),
 observed_at INTEGER NOT NULL,
 source_reference TEXT NOT NULL CHECK(length(source_reference)>0),
 verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
 PRIMARY KEY(provider,settlement_id)
);
CREATE INDEX IF NOT EXISTS hive_finance_settlements_period ON hive_finance_settlements(period_start,verified);

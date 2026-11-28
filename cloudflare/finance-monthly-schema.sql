-- Review and apply through existing D1 migration process; no automatic deployment.
CREATE TABLE IF NOT EXISTS hive_finance_monthly (
 period_start INTEGER NOT NULL,
 observed_at INTEGER NOT NULL,
 net_revenue_cents INTEGER NOT NULL CHECK(net_revenue_cents>=0),
 free_cash_cents INTEGER NOT NULL CHECK(free_cash_cents>=0),
 committed_cents INTEGER NOT NULL CHECK(committed_cents>=0),
 spent_cents INTEGER NOT NULL CHECK(spent_cents>=0),
 verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
 source_reference TEXT NOT NULL CHECK(length(source_reference)>0),
 PRIMARY KEY(period_start,observed_at)
);

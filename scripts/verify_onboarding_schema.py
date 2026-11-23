"""Validate D1 onboarding migrations in memory; never touch production."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for name in ("001_sessions.sql", "002_accounts.sql", "003_account_onboarding.sql"):
    sql = (root / "cloudflare" / "migrations" / name).read_text(encoding="utf-8")
    db.executescript(sql)
    db.executescript(sql)  # idempotent migration
required = {"accounts", "sessions", "account_onboarding", "admission_payment_events", "admission_payment_blocks"}
found = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert required <= found, required - found
db.execute("INSERT INTO accounts(id,email,role,password_hash,created_at) VALUES(?,?,?,?,?)",
           ("test-id", "test@example.com", "artist", "fake-hash-not-for-production", 1))
db.execute("INSERT INTO account_onboarding(account_id,checkout_reference_hash) VALUES(?,?)",
           ("test-id", "a"*64))
assert db.execute("SELECT verified FROM accounts WHERE id='test-id'").fetchone() == (0,)
assert db.execute("SELECT paid_at,email_verified_at FROM account_onboarding WHERE account_id='test-id'").fetchone() == (None, None)
try:
    db.execute("INSERT INTO account_onboarding(account_id,checkout_reference_hash) VALUES(?,?)",
               ("nonexistent", "b"*64))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Foreign-key protection is missing")
print("D1 migration checks passed: idempotence, required tables, pending-by-default, foreign keys")

-- Preserve every entitlement while extending the server-only plan constraint.
-- D1 applies migration statements transactionally. No public writer or billing is enabled.
CREATE TABLE professional_entitlements_next (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id),
 plan TEXT NOT NULL CHECK(plan IN ('pro_monthly','pro_annual','master_pro_monthly','master_pro_annual')),
 provider_reference TEXT NOT NULL,
 verified_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 revoked_at INTEGER
);
INSERT INTO professional_entitlements_next SELECT * FROM professional_entitlements;
DROP TABLE professional_entitlements;
ALTER TABLE professional_entitlements_next RENAME TO professional_entitlements;

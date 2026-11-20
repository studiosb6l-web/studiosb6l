-- Migration draft for Cloudflare D1. Apply only after review; not deployed.
CREATE TABLE IF NOT EXISTS professional_contracts (
 id TEXT PRIMARY KEY, client_id TEXT NOT NULL, professional_id TEXT NOT NULL,
 service_type TEXT NOT NULL, currency TEXT NOT NULL DEFAULT 'EUR',
 gross_cents INTEGER NOT NULL CHECK(gross_cents > 0),
 platform_fee_cents INTEGER NOT NULL CHECK(platform_fee_cents >= 0),
 jurisdiction TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft'
 CHECK(status IN ('draft','review','accepted','signature_pending','signed','active','completed','cancelled','disputed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS professional_contract_versions (
 id TEXT PRIMARY KEY, contract_id TEXT NOT NULL REFERENCES professional_contracts(id),
 version INTEGER NOT NULL, template_key TEXT NOT NULL, document_sha256 TEXT NOT NULL,
 terms_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(contract_id,version)
);
CREATE TABLE IF NOT EXISTS professional_contract_events (
 id TEXT PRIMARY KEY, contract_id TEXT NOT NULL REFERENCES professional_contracts(id),
 actor_id TEXT, event_type TEXT NOT NULL, payload_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS professional_contract_signatures (
 id TEXT PRIMARY KEY, contract_id TEXT NOT NULL REFERENCES professional_contracts(id),
 party_id TEXT NOT NULL, provider TEXT NOT NULL, provider_envelope_id TEXT,
 status TEXT NOT NULL DEFAULT 'pending', signed_at TEXT, evidence_reference TEXT
);
CREATE TABLE IF NOT EXISTS professional_contract_payments (
 id TEXT PRIMARY KEY, contract_id TEXT NOT NULL REFERENCES professional_contracts(id),
 processor_reference TEXT UNIQUE, gross_cents INTEGER NOT NULL,
 platform_fee_cents INTEGER NOT NULL, processor_fee_cents INTEGER,
 status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_professional_contracts_client ON professional_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_professional_contracts_provider ON professional_contracts(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_events_contract ON professional_contract_events(contract_id);

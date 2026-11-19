-- STUDIOSB6L artist marketplace. Apply only after D1 backup; no automatic publication.
CREATE TABLE IF NOT EXISTS marketplace_tracks (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 artist_id INTEGER NOT NULL REFERENCES artists(id),
 title TEXT NOT NULL,
 price_cents INTEGER NOT NULL CHECK(price_cents>=49),
 currency TEXT NOT NULL DEFAULT 'EUR' CHECK(currency='EUR'),
 audio_key TEXT, cover_key TEXT,
 rights_confirmed_at TEXT,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','withdrawn')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 approved_at TEXT,
 UNIQUE(artist_id,title)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_tracks_status ON marketplace_tracks(status,artist_id);
CREATE TABLE IF NOT EXISTS marketplace_orders (
 id TEXT PRIMARY KEY,
 provider TEXT NOT NULL,
 provider_payment_id TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','refunded','partially_refunded','cancelled','disputed')),
 currency TEXT NOT NULL DEFAULT 'EUR',
 amount_cents INTEGER NOT NULL CHECK(amount_cents>=0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 paid_at TEXT
);
CREATE TABLE IF NOT EXISTS marketplace_order_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_id TEXT NOT NULL REFERENCES marketplace_orders(id),
 track_id INTEGER NOT NULL REFERENCES marketplace_tracks(id),
 artist_id INTEGER NOT NULL REFERENCES artists(id),
 price_cents INTEGER NOT NULL CHECK(price_cents>=0),
 platform_fee_cents INTEGER NOT NULL DEFAULT 49 CHECK(platform_fee_cents>=0),
 processing_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK(processing_fee_cents>=0),
 artist_due_cents INTEGER NOT NULL CHECK(artist_due_cents>=0),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','refunded','disputed')),
 UNIQUE(order_id,track_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_artist ON marketplace_order_items(artist_id,status);
CREATE TABLE IF NOT EXISTS marketplace_payouts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 artist_id INTEGER NOT NULL REFERENCES artists(id),
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 currency TEXT NOT NULL DEFAULT 'EUR',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','paid','failed')),
 provider_reference TEXT UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 paid_at TEXT
);
-- Payment webhook must authenticate provider signature and use idempotent transaction.
-- Never infer a paid order from browser redirects or user-submitted values.
-- Fee allocation, tax, refunds and artist settlement require agreed contract and provider configuration.

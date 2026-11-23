# Cloudflare Preview D1 — BEN safe setup

The 2026-11-23 Cloudflare preview failed because Wrangler reported a missing `previews` block. Do **not** reuse the production database ID.

1. In the Cloudflare account owning `studiosb6l-artists-api`, create a **new empty D1 database** named `studiosb6l-artists-preview-db`. Confirm that creating it stays within the free quota and will not activate a paid plan.
2. Record the newly assigned UUID (not the production database UUID).
3. Add to `wrangler.toml`:

```toml
[[previews.d1_databases]]
binding = "DB"
database_name = "studiosb6l-artists-preview-db"
database_id = "<UUID-OF-NEW-ISOLATED-PREVIEW-D1>"
```

4. Replace the placeholder with the actual new UUID, then run `node scripts/check-preview-d1.mjs`. It must pass before retrying `npx wrangler preview`.
5. Apply reviewed migrations to **preview only**, seed synthetic test accounts, and confirm no real Stripe keys or webhook secrets are bound to previews. Keep real registration and payments disabled until validated.
6. Verify preview deploy, D1 schema, API tests, MFA and STOP_SERVICE; review PR before any production merge.

**Current status:** no separate preview D1 UUID is available to this repository. The configuration cannot be completed safely by guessing an ID. This document and guard are preparatory; they do not provision a database or fix the remote build on their own.

# B6L MUSIC CONNECT — Implementation and release checklist

## Already in repository
- `music-connect/index.html`: public informational landing page (no live registration).
- `cloudflare/music-connect-schema.sql`: D1 tables, not migrated.
- `cloudflare/music-connect-core.mjs`: deterministic matching and plan definitions.
- `tests/music-connect.test.mjs`: pricing and matching tests, included in daily workflow.
- Homepage split panel and gold styling in `assets/artist-marketplace.js`. Deployment remains unverified.

## Mandatory steps before accepting real users
1. Create a dedicated Cloudflare D1 database, apply and verify the schema, establish backups and data retention policy.
2. Implement secure email verification and login using an identity provider or vetted authentication implementation; use httpOnly Secure SameSite cookies, CSRF protection, rate limits and session revocation. Never store plaintext passwords.
3. Implement authenticated CRUD for the user's own musician profile, organizations and opportunities. Enforce ownership on every API route; moderation for public pages.
4. Implement upload flow with R2 presigned URLs, file-type/size limits, malware checks, content review, video processing and a hard cap of 1 FREE / 5 PRO approved videos.
5. Build private messaging with abuse reporting, block/mute and anti-spam rules. Do not expose personal email addresses.
6. Create matching alerts only for verified, opted-in accounts, with unsubscribe and throttling; never mass-email scraped artists.
7. Connect payment provider with server-side checkout, verified webhooks, idempotency, subscription state, invoices, cancellation, and annual renewal disclosure. Never trust client-side payment state. Prices: EUR 4.99 monthly / EUR 49.90 yearly. No live checkout until verified.
8. Implement account export, deletion requests, privacy notice, consent logging, terms, consumer rights and GDPR review.
9. Confirm GitHub Pages/Cloudflare deployment path and test published version on mobile before claiming live status.
10. Run end-to-end tests: create account, verify email, edit profile, create listing, apply, message, match, upgrade, cancel, expire, delete.

## Release policy
Do not enable public registration or billing until security, privacy, moderation, payment and deployment checks pass. Avoid claims that the platform already provides these services.

## Billing decision — Stripe + PayPal (2026-11-20)
- Reuse the existing STUDIOSB6L music-store payment accounts where provider access and merchant configuration permit; do not modify existing music-store checkout or payouts.
- FREE musician registration and free organization listings. PRO: EUR 4.99 monthly or EUR 49.90 annually.
- `cloudflare/music-connect-billing.mjs` records provider/plan configuration, rejects unknown plans and requires verified paid active subscription state. Production checkout is intentionally disabled.
- Stripe connection currently verified in **test mode only**. Existing production Stripe merchant, linked payout bank and live subscription permissions are **not verified**.
- Existing PayPal one-time payments are user-reported; PayPal recurring subscription API credentials, webhook endpoint and merchant eligibility are **not verified**.
- Implement two server-side provider adapters, checkout sessions/approval, signed webhook validation, idempotency, subscription lifecycle and cancellation. Never use browser redirect as proof of payment.
- Before live billing, confirm Spanish tax registration/IVA treatment, subscription consumer disclosures, and both providers' live status. No automatic recurring charges until these checks pass.

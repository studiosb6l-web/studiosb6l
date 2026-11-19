# STUDIOSB6L — artist marketplace rollout

## Confirmed commercial rule
STUDIOSB6L earns a fixed EUR 0.49 per paid track item; processing costs and applicable taxes must be explicitly agreed in the artist contract. Never describe the remaining amount as net guaranteed before fee allocation and tax rules are settled.

## Deployment checklist (not yet executed)
1. Back up existing Cloudflare D1. Apply `cloudflare/artist-marketplace-schema.sql` to the same database that contains `artists`.
2. Deploy `cloudflare/artist-marketplace-catalog-worker.js` with D1 binding `DB`; attach an appropriate domain/route and configure CORS only for the site origin. Test `/health` and `/api/catalog`.
3. Add authenticated artist accounts and upload storage (R2) with size/type checks, malware scanning, quota controls and verified ownership/rights declarations. Submission creates pending records; it does NOT publish.
4. Add authenticated admin approval for both artist and each track, recording who approved and when. Only approved artist + approved track + rights confirmation is publicly listed.
5. Select a payment provider with marketplace support and permitted artist payouts. Complete KYC, terms, refund/tax policies and a signed webhook endpoint. Verify webhook signatures and use idempotent database transactions to create paid orders and items.
6. Allocate EUR 0.49 per paid track to STUDIOSB6L, track processing fees/tax separately, and compute artist balances from settled orders minus refunds/chargebacks and payouts. Never trust amounts or ownership from browser requests.
7. Create private administration reports (sales by artist, payout due, refunded/disputed, payout history) behind real authentication, not a secret embedded in public HTML.
8. Enable purchase buttons only after end-to-end sandbox tests: multi-item carts, prior Payhip cart residue, refunds, replayed webhooks, duplicate events, permissions, tax, payouts.
9. Add public, canonical, server-rendered artist/track detail URLs only for approved content. Generate XML sitemap entries from approved pages; update sitemap index and request indexing in verified webmaster consoles. Robots and sitemaps do not guarantee indexing.
10. Review and translate all customer-facing strings in every supported language, including errors, accessibility labels, consent and receipts.

## Current state
GitHub stores the D1 schema and read-only public catalog Worker; deployment, payment integration, R2 uploads, administration, automatic catalog feed, verified artist accounts and indexing submissions are NOT confirmed. Existing Payhip store must remain independent until a supported marketplace payment flow is ready.

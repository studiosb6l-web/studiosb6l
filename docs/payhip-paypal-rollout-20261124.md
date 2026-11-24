# Payhip + PayPal: admission rollout

The owner selected Payhip checkout and PayPal payments for all platform services.
This change implements **account admission only**; music, donations, marketplace,
subscriptions and payouts are not automatically activated by this patch.

## Implemented and locally verified

- Email confirmation returns only the configured Payhip product URL, with no
  personal information or account reference added to the URL.
- Buyer must use the same email for Payhip checkout and platform registration.
- Authenticated Payhip `paid` notification validates a single admission item,
  EUR 299 cents, quantity one, and a pre-existing verified email. Gift purchases,
  other products, currencies, amounts, owners and disabled accounts cannot enable access.
- Transaction/account uniqueness, transactional D1 writes, replay protection,
  refunds arriving before payment, session revocation on full refund.
- STOP rejects new admission activation; refund handling remains available.
- Public Stripe webhook route returns 404. Its legacy module/tests remain for
  historical regression coverage; it is not imported by the production router.
- Preview remains isolated. No production migration, email, payment or deployment
  was performed. This is not proof of live checkout, settlement or delivery.

## Production prerequisites (not yet verified)

1. Create/confirm a dedicated one-time admission product at 2.99 EUR in Payhip.
   Do not substitute a music download or donation product. Validate tax treatment
   and receipt, access conditions and refund handling before publishing the offer.
2. Confirm PayPal receiving account, checkout options and fees. Payhip settings
   currently show both PayPal and a legacy Stripe connection. No processor was
   disconnected. PayPal-only store configuration remains to be validated.
3. Authenticate to Cloudflare; preserve the currently deployed version for rollback.
   Apply additive migration 006 after verifying 001–005 and backing up D1.
4. Store PAYHIP_WEBHOOK_API_KEY privately as a Worker Secret; never put its value
   or its hash in code, PRs, logs or browser-facing responses. The Payhip signature
   is SHA256(API key), a reusable bearer value, not a body-specific HMAC. Use HTTPS
   and restrict access to payloads and logging. Renew credentials if exposed.
5. Set PAYHIP_ADMISSION_PRODUCT_KEY and PAYHIP_ADMISSION_CHECKOUT_URL to the
   same real product. Set PAYHIP_ACTIVATION_VERIFIED=true only after checking
   migration, product, webhook, PayPal, account-wide free quotas and recovery.
   The flag is an operator acknowledgement; it does not measure global quotas.
6. Email readiness remains mandatory: verified sender, server credential, daily
   budget <=70% of the free quota and verified headroom including other senders.
7. Configure Payhip's webhook URL to the deployed Worker path
   /api/billing/payhip/webhook and select paid AND refunded. Preserve any other
   existing endpoints. Do not point production Payhip at isolated previews.
8. Run approved end-to-end checks of email, checkout, payment settlement, activation,
   login, refund, revocation and duplicates. Local fixtures do not establish that
   Payhip's live payload/currency/price and VAT match these expected values.
9. Only then enable REGISTRATION_ENABLED=true and publish the account page.
   No real test charge is authorized with a specified payer/payment method yet.

## Rollback

Disable REGISTRATION_ENABLED and PAYHIP_ACTIVATION_VERIFIED; retain payment/refund
records. Restore the saved previous Worker deployment and account page if needed.
Do not roll back the additive tables destructively or reconnect Stripe automatically.
Refund obligations remain, and must be processed/reconciled while new access is paused.

## Validation

150 tests passed, including offline registration → email confirmation → Payhip
payment fixture (PayPal) → login; provider signature failures, wrong product/amount,
duplicates, wrong buyer, owners, disabled accounts, refund ordering and STOP.
Wrangler 4.166.0 production bundle dry-run succeeded without deployment.
Official contracts: https://help.payhip.com/article/115-webhooks and
https://payhip.com/api-reference.

# Payhip + Stripe + PayPal rollout

Official contract: https://help.payhip.com/article/115-webhooks and https://help.payhip.com/article/303-set-up-recurring-payments

Keep Payhip and PayPal admission checkout. Enable Stripe for recurring memberships only after authenticated configuration and test verification. Do not create duplicate independent Stripe charges.

Payhip events: paid, refunded, subscription.created, subscription.deleted. The documented signature is SHA256 of the API key alone, not a signature binding the event body. Treat it as a secret bearer value, never log it. Subscription creation does not document a paid-through timestamp or payment transaction ID. Never grant membership solely from that event or matching email. Require independently verified provider subscription and paid invoice, configured product/price mapping, verified account ownership, admission payment, and idempotent reconciliation. Cancellation and refund handling must not permit stale events to restore access.

Before production: confirm actual Payhip product keys, Stripe price IDs, renewal amounts and intervals; verify authenticated account linking and webhook delivery; test paid renewal, duplicate events, cancellation, refund, failed payment, expiry and cross-account attempts. Keep PAID_SUBSCRIPTIONS_VERIFIED off until complete. Preserve ambassador-only exemption. No fixed charges or paid infrastructure activation. No deployment until quota and rollback checks pass.

## Approved EUR commercial amounts
Admission: 299 cents once. PRO: 499 cents monthly or 4990 cents annually. PRO BUSINESS: 999 cents monthly or 9990 cents annually. Ambassador: no admission or subscription charge, verified founder invitation only. These amounts are approved configuration targets, not proof of live provider prices. Verify actual provider IDs and amounts before enabling.

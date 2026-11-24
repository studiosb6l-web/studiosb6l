# Payhip admission product: verified checkpoint

Created on 24 November 2026 in the existing authenticated STUDIOSB6L Payhip store.

- Title: STUDIOSB6L — Acesso à plataforma
- Product key: UJ0tF
- Owner edit URL: https://payhip.com/product/edit/UJ0tF
- Future checkout/product URL: https://payhip.com/b/UJ0tF
- Fixed price: EUR 2.99; no recurring subscription configured.
- Visibility: **Invisible — Nobody except you can see this product**. Confirmed
  by reopening the saved edit page, not only by observing the creation success.
- File: STUDIOSB6L-instrucoes-de-acesso.txt, 828 bytes, source preserved under
  assets/payhip/. This is an instruction file, not a password or entitlement.
- The store contains 262 products after creation (previously 261).
- No order, charge, refund, customer email, payment-processor reconnection or
  public offer was executed. Tax settings were left unchanged; no tax exemption
  or reduced ebook rate was selected. Mailing-list auto-subscribe remains off.
- The product description explicitly states that this is an internal draft
  pending validation of account activation. Review this text before launch.

The real product key and URL are now staged in wrangler.toml on the Payhip PR.
This changes source only. Nothing was deployed to the production Worker and no
secret values were retrieved. Preview isolation remains enabled and validated.

Email check: a targeted Gmail search for Brevo domain/sender confirmation notices
in the last 30 days returned no messages. This is not proof of sender status.
The remote Worker diagnostic previously established that BREVO_API_KEY is present,
but REGISTRATION_FROM_EMAIL and sender/budget verification are not configured.

## Still blocked

The existing Cloudflare token reads Worker settings and deployments successfully;
D1 schema query returned 403. Only the account holder can extend that token's
permissions from an authenticated Cloudflare account. Do not recreate the token
or paste its value into chat. Confirm the D1 permission needed before backup and
schema/migration work. No base-table assumption is based on screenshots alone.

Still needed: securely supply Payhip webhook credential, verify email sender and
free quota headroom, validate D1 and migrations after backup, publish reviewed
code, configure paid/refunded webhook, and run real delivery/activation/refund
checks before enabling registration or exposing this product. The existing
PayPal connection is preserved; legacy Stripe connection was not disconnected.

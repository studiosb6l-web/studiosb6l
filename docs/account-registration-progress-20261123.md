# Registration and payments — verified progress, 2026-11-23

## Production observations

- Public navigation was published in commit 2a76b1d59bd710fc37a07a3e8bb7b0a8600d0afe. GitHub Pages deployment succeeded and changed content was read back via HTTPS.
- Payhip product https://payhip.com/b/5Cx8b shows Salve Regina at EUR 2.99 with WAV delivery description. Buy Now opened a live checkout offering card and PayPal. No payment, purchase, delivery or refund was executed or verified.
- Stripe account exposed by the connected tool differs from the Stripe connected account visible in Payhip checkout. Do not change payment routing or recipients based on display name alone.
- No Payment Links were returned from the connected Stripe account in live mode.
- Cloudflare sign-in returned an error after Google verification. No authenticated access to settings, usage, migrations, secrets or build logs was obtained. Shell probes to Worker endpoints returned 403; the cause is not established by those probes.

## Implemented locally, not deployed

- Rate-limited, origin-checked registration with bounded JSON body, permitted ordinary roles, explicit consent, password hashing, and inactive accounts.
- Hashed email tokens with 30-minute validity and single-use confirmation; a private email service binding must be configured before registration can be enabled.
- Verification returns a configured Stripe Payment Link with client_reference_id matching the existing signed-webhook activation ledger. Neither registration nor email verification grants access.
- Pending accounts can request another confirmation with the same credentials after email delivery failure; duplicate email addresses receive generic responses without overwriting credentials.
- Additive migration 004_account_email_verifications.sql, not applied anywhere.
- Account page registration form stays hidden unless the production API explicitly confirms registration readiness. Confirmation removes the token from the address bar and requires a deliberate click before contacting the backend. No browser return URL grants access.
- Monthly subscriptions remain unimplemented and disabled. Admission is a one-time EUR 2.99, independent of music downloads. Do not create an unspecified recurring plan.

## Validation

132 offline tests passed, including registration → email confirmation → signed simulated paid event → successful login with Secure/HttpOnly/Strict cookie. Tests also cover forged/expired tokens, duplicate emails, email failure retry, privilege escalation, rate limiting and oversized input. Simulated Stripe events do not prove production payment readiness. Wrangler dry-run compiled without uploading. JS syntax and git diff checks passed.

## Required before enabling

1. Resolve Cloudflare access and inspect actual build failure, routing, quotas and deployment settings.
2. Review and apply the additive schema to the verified database after backup; preserve existing accounts and sessions.
3. Configure and verify transactional email delivery, including sender identity and available free quota. No email provider has been provisioned.
4. Verify the payment recipient and one-time admission product/price; configure matching payment URL, Payment Link ID and signed webhook secret on the correct live account. No live Payment Link was created.
5. Review published privacy/access/refund conditions against the actual product before accepting payments for platform access.
6. Enable only after sandbox and production readiness checks; verify registration email delivery and activation without charging users for unavailable service. Never claim the monthly subscription is active.

## Rollback

Changes are isolated on feat/verified-account-registration. Production remains unchanged by this registration work. Registration defaults off; unset REGISTRATION_ENABLED to prevent new onboarding. Existing webhook refund/revocation handling remains in place. No migration rollback or destructive production operation was executed.

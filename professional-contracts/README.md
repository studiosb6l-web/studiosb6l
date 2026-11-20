# STUDIOSB6L Professional Contracts — development foundation

**NOT LIVE.** This folder provides draft schema and pure validation/calculation logic only. It does not create contracts with legal force, sign documents, handle user authentication, connect to Stripe, or deploy Workers.

## Commercial rule
Client pays agreed contract price. Platform commission = 5% of gross, deducted from professional payout, before applicable taxes and processor fees. Amounts use integer cents. EUR only until currencies and rounding are reviewed.

## Next integration gates
- Independent legal review of jurisdiction-specific templates, IP and moral rights, cancellation, employment classification, GDPR and consumer protections.
- Authenticated role-based Worker API with authorization checks for every resource, D1 migration plan, backups, audit evidence, rate limits, idempotency and encryption.
- Signature provider selection, identity proofing and eIDAS audit evidence; no simulated signature may be treated as binding.
- Stripe Connect onboarding, webhook verification, separate fee ledger, taxes, refunds, partial payments and chargebacks.
- Translation review and accessibility tests.
- Staging integration tests; production feature flag disabled pending explicit approval.

Reference: GitHub issue #11.

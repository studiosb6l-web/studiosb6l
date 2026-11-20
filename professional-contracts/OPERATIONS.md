# STUDIOSB6L — professional contracts operational requirements
Status: IMPLEMENTATION PLAN; not live. Related issue #11 and draft PR #12.

## Contract lifecycle
1. Authenticated client and professional agree on a quote, scope, delivery schedule, rights, jurisdiction, cancellation and dispute terms. Store versioned draft, not an issued contract.
2. Professional identity and Stripe Connect onboarding verified to the degree required by the payment provider and applicable law.
3. Create server-side Stripe Checkout session tied to contract ID, amount and EUR currency. Client never supplies trusted price or payee data.
4. Confirm completed payment using verified Stripe webhook plus server-side reconciliation, deduplicate event IDs and use transactional state transitions. Failed, off-platform, refunded, disputed or mismatched payments cannot authorize issuance.
5. Generate immutable versioned PDF after verified payment; route to approved e-signature provider and store signature evidence. Payment alone does not constitute acceptance/signature.
6. Delivery, acceptance, disputes, refund, invoicing and payout follow contractual and legal rules. Record ledger events and issue completion certificate only after confirmed completion.

## Commercial terms
- Platform commission: 5% of contract gross deducted from professional proceeds, no surcharge to client.
- Payment processing fees and taxes accounted for separately and transparently.
- Track sales keep existing distinct €0.49 arrangement.

## Payout rules for design and legal review
- Preferred: release after delivery and client acceptance with reasonable deadlines and dispute mechanism.
- Large projects: optional milestones, with separate recorded payments and acceptance conditions.
- Stripe Connect transfers/payouts are not escrow. Check provider holding limits, regional capabilities, refunds, reversals, negative balances and seller liabilities before selecting charge type.
- Never promise indefinite fund retention or a guaranteed reversal.

## Remaining implementation work
Authenticated RBAC API, Cloudflare D1 migrations and rollback, verified webhook persistence, KYC/AML checks, Stripe Connect flows, approved e-signatures and legal templates, PDFs, dispute workflow, refund ledger, invoices/receipts, notifications, translation review, fraud monitoring, accessible client/professional dashboards, real-transaction-only ratings, completion certificates, security and end-to-end tests.

## Release gates
Feature flag off by default. Require legal counsel review of Spanish/EU and cross-border service rules, GDPR/eIDAS, Stripe account capability confirmation, independent security review, passing tests, staging signoff and explicit production approval. Do not alter existing store or live payments while developing.

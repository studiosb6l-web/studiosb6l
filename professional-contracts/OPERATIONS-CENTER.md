# STUDIOSB6L — Centro de Operações (foundation)
This is a **proposal and non-deployed foundation**, not a live dashboard.
## Required server architecture
- Private /admin/operations route with verified session, admin role, MFA and CSRF protection.
- Fetch aggregated metrics from D1/Stripe with server-side permission checks; never expose tokens or raw identity documents.
- 36 bot statuses from actual execution logs; never display registry entries as running jobs.
- Payments, contracts, security alerts, incidents, support tickets, translation coverage and audit events.
- Retry queue with idempotency keys, dead-letter queue, backoff and human review for money/legal operations.
- Critical alert notifications with deduplication, severity, acknowledgment and escalation.
- Accessibility, mobile layout, locale support and right-to-left Arabic.
- Minimize personal data, enforce retention, role-based access, rate limits and audit trails.
## Release gates
Tests in staging; Cloudflare D1 migrations reviewed; Stripe test-mode reconciliation; security review; legal approval; explicit authorization before real payments or production changes.

# Private support centre

- `/ajuda/` on the Worker serves searchable, curated Portuguese FAQs and authenticated private tickets on the same origin as the session cookie. Website `/ajuda/` links to it. Account portal and home page link to help.
- Verified active account holders can create/read/reply to their own tickets. People unable to log in have an explicit email fallback to studiosb6l@gmail.com.
- Automatic category-specific acknowledgements are stored and clearly labelled. They do not confirm payments or promise refunds, response times, or unsupported features.
- Owner list/reply/close requires the existing verified server-side owner session with MFA. Existing owner login is blocked until an independently verified MFA flow is configured; this release does not remove that protection or provision owner sessions.
- Email notifications contain the submitted text and the verified account email as Reply-To. The owner may answer directly from their mailbox. Email replies remain in email and are not imported into the platform history. In-platform staff replies are stored and notify the account email.
- Browser renders message text with textContent; strict CSP hash, no user HTML, no attachments, no external scripts. JSON size, subject and message length are bounded. No cross-account access or browser-supplied staff role.
- Ten mutations per account/day and 100 globally/day, plus the existing edge limiter. Up to 50 tickets and 200 latest messages returned. Notifications share the existing verified email daily budget (20/day currently), capped below 70% of the declared free allowance. A saved ticket remains available if email is unavailable or quota is exhausted; refresh to see replies.
- New additive schema is 007_support.sql. Deployment saves a D1 Time Travel bookmark and the previous Worker version/quota evidence before applying it. No paid resource or new third-party service is introduced.
- Rollback: set SUPPORT_ENABLED=false and restore the previous Worker version if needed. Preserve support tables and messages; do not delete customer requests or restore the whole database over newer payments.

Validation: 166 tests and Wrangler production dry-run passed. SQLite-backed support tests cover ownership, MFA, idempotent retries, quotas, CSRF, STOP, preview, bounded input, notifications and CSP. No real account credentials, charge, customer email or owner MFA session was used for tests. Live deployment checks verify the public help page and denial of anonymous ticket access, not an end-to-end administrative login or real notification delivery.

# AMBASSADOR invitation generator

## Implemented in this change

- Private owner entry at `/administracao/convites/`, linked from the existing administrative portal; owner MFA is required in the API as well as the page.
- Issue, list and revoke APIs under `/api/ambassador/admin/`. The issuing actor is mapped from the trusted session `userId`, not browser data.
- Invites last seven days, are restricted to one verified email and may include any existing professional sectors. Only the SHA-256 digest is stored; the complete link is returned once.
- Generated links target the account Worker `/ambassador/#invite=…` route. The fragment is removed immediately from the address bar and kept only in memory. No automatic email is sent.
- Existing active, email-verified ordinary accounts can accept at `/api/ambassador/redeem`. Acceptance is atomic and does not set `paid_at` or create a payment. Revocation removes the associated grant.
- No referral/angariação link is presented as an exemption. Existing referral attribution remains a separate integration.
- Feature flag, STOP, isolated Preview, rate limiter, current account state, JSON size limits and a shared 100-mutation daily ceiling apply. This ceiling does not prove account-wide free quota availability.

## Production gates still pending

The feature stays off unless `AMBASSADOR_ENABLED=true` is explicitly configured. No deployment, migration or environment update is performed by this change.

Before enabling: inspect the current D1 schema and account-wide free quotas (70% ceiling and 30% reserve), preserve the Worker version and D1 recovery bookmark, then apply additive migrations `010_ambassador_sessions.sql` and `011_ambassador_write_budget.sql` and deploy the tested source. Verify anonymous rejection and access with the founder's own authenticated session. Do not send an invitation to a real recipient as a smoke test without an explicit recipient instruction.

New-account admission exemption is not yet integrated with email verification and onboarding. The recipient page states this and tells invited users not to pay to accept. Complete and test that path before inviting someone without an active account. Professional plan consumers must also recognize active server-side grants before PRO BUSINESS benefits can be described as available. Video sessions and persistent transmission counters remain separate pending work.

Rollback: set `AMBASSADOR_ENABLED=false` and restore the previous Worker version if necessary. Leave additive tables and audit records intact; do not drop user data. Disable the flag before rollback if deploying a version without these routes. No billing or paid infrastructure is enabled here.

# Professional network foundation (draft)

This is the **first additive database migration**, not a deployed feature. It preserves the existing `artists` table and payment flows.

## Deployment gate
1. Back up production D1; test migration on a staging D1 database first.
2. Integrate a trusted authentication provider and map verified subjects to `network_accounts.auth_subject`. Never accept a role or subject supplied by the browser.
3. Implement server-side authorization on every private read/write. For conversations verify membership; for opportunities verify owner/admin; for applications verify applicant and opportunity owner; for sales use existing reconciled payment records, not new synthetic totals.
4. Add request validation, rate limits, CSRF protections where applicable, moderation, reporting, deletion/export, retention and privacy notices.
5. Test cross-account isolation, mobile layouts and all supported translations before rollout.
6. Do not expose these tables directly or advertise registration, messaging, contracting or sync licensing as operational until API tests pass.

## Future API routes (not yet implemented)
- `/api/network/me` authenticated profile
- `/api/network/talents` public opted-in verified talent search
- `/api/network/opportunities` published opportunities
- `/api/network/applications` authorized submissions
- `/api/network/conversations` private messaging
- `/api/network/proposals` professional proposals
- `/api/network/sync-requests` licensing enquiries

Related implementation tracking: #4.

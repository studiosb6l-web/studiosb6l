# Professional inbox and opportunity rollout

The current account/session service owns inbox access. No parallel account database or payment service is introduced.

## Runtime controls

- `PRIVATE_INBOX_ENABLED=true`: `/mensagens/` and `/api/inbox/*`.
- `PROFESSIONAL_PROFILES_ENABLED=true`: existing sector-specific profiles and professional matches.
- `PROFESSIONAL_OPPORTUNITIES_ENABLED=true`: private opportunities, authorized administrative ingestion and MASTER summary.
- `STOP_SERVICE=true` or `PREVIEW_ISOLATED=true`: inbox and opportunity operations stop.
- Receiving messages defaults to off. Both sender and recipient must opt in. Either participant's block prevents delivery in both directions.
- Server-side professional entitlements determine limits; client-supplied plans never grant access. BASIC sends at most 5 messages/day, PRO 50, MASTER 100. Preferences/read/block/report writes have their own per-user limit. All inbox writes share a conservative 100-operation daily global budget. Failed attempts consume reservations. The message table stops at 10,000 records. These feature caps supplement, and do not establish, a platform-wide quota guarantee.
- Inbox notifications are unread counts in the private page. No email, background polling, scheduled report, source fetch or paid service is activated.

## Sources and intelligence

An administrator with MFA can POST at most 20 records to `/api/profiles/admin/ingest`. The server's `PROFESSIONAL_SOURCE_REGISTRY` must contain the source ID with `authorized: true` and exact HTTPS `allowedOrigins`. No source is authorized by default. Accepted batches are normalized, bounded, deduplicated and audited. Invalid records reject the batch. The database retains at most 5,000 opportunities; ingestion removes at most 100 expired rows per request.

Offers match services the profile seeks; requests match services it provides. BASIC receives local results/general news; PRO adds eligible remote international and sector news; MASTER also receives commercial records. `/api/profiles/intelligence` summarizes only the current user's eligible top 30. It is an opportunity summary, not a revenue forecast or cross-user analytics report. The MASTER profile editor exposes the summary button. It requires a published matching-consented profile.

## Validation and publication

208 local tests passed before the release request. Worker dry run: 169.21 KiB, gzip 42.71 KiB. Coverage includes authentication, consent, disabled accounts, cross-user isolation, blocks, reports, unread counts, idempotency, BASIC/PRO/MASTER caps, source allowlists, matching direction and migration rollback.

The `professional-inbox-deploy.yml` workflow uses the existing Cloudflare secret and shared production concurrency group. Before schema changes it requires quota/storage headroom, a saved previous Worker version, and D1 Time Travel recovery metadata. It runs tests and compiles first. It applies migrations 009–012 and preserves existing account admission settings. Post-deployment checks verify health, account readiness, links and anonymous access rejection. A failed post-deployment check rolls the Worker back. Existing private records are retained on code rollback; pause the new routes with the feature flags.

Repository backups: `backup/pre-58-60-validated-20261126`, `backup/pre-private-inbox-20261125`. Source PR: #62. A workflow attempt is not evidence of successful production deployment; inspect its terminal result and logs.

## Remaining acceptance

MP3 storage and upload enforcement are not connected to the current Worker: wrangler declares D1 and the authentication limiter, without a media bucket. The existing `feature/52-mp3-limits` work is a separate backend/policy and is not an operational 49-track account upload system. Do not enable that backend's upload flag before authenticated storage and quota accounting are integrated.

Subscription reconciliation, expiry/revocation from actual provider events, approved external source configuration, scheduled delivery, opt-in email delivery and authenticated production acceptance across the three plans remain separate gates. Existing admission payment code is preserved. MASTER billing remains disabled; nothing in this release proves live subscription payments.

## Observed production result — 25 November 2026

Workflow https://github.com/studiosb6l-web/studiosb6l/actions/runs/45721926127 completed successfully. It ran the tests/build, saved rollback and D1 recovery artifacts, applied the migrations, published the Worker and passed unauthenticated production smoke tests. The automatic rollback step was skipped because those checks passed.

- Published source: c8d10ce5915cb50d5c2a0b9aa8fd210bed3baffa.
- Worker version: c9a264b3-7fd8-4e45-88ff-058cce812aa9.
- Account-wide preflight at 23:31:11 UTC: 22 Worker requests, 13 D1 rows read, 21 rows written; database 303,104 bytes. These are preflight measurements, not a guarantee of future account-wide consumption.
- Private account entry: https://studiosb6l-artists-api.studiosb6l.workers.dev/conta/
- Private inbox: https://studiosb6l-artists-api.studiosb6l.workers.dev/mensagens/
- Production check reported profilesEnabled=true, registrationEnabled=true and anonymousSessionBlocked=true. Anonymous inbox/opportunity requests returned 401; the inbox page required login.
- No real payment, email delivery, paid subscription activation or authenticated production conversation was attempted. External authorized feeds remain unconfigured. The remaining acceptance gates above still apply.

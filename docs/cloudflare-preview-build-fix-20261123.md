# Confirmed Preview build failure and bounded fix

Evidence: owner's screenshot of Cloudflare build aac3d9d9-cf9d-4eb4-909f-e3ef6bc1a50e on commit 469523d, supplied 2026-11-23. Initialization, cloning and dependency installation succeeded. The configured deploy command was `npx wrangler preview`; Wrangler 4.167.0 reported that the configuration was missing a `previews` block. This establishes the cause of this build, not necessarily every earlier Cloudflare failure.

Cloudflare documentation confirms that the block is required and production vars/storage bindings are not inherited into it:
https://developers.cloudflare.com/workers/previews/configuration/
https://developers.cloudflare.com/workers/previews/get-started/

The fix adds an explicit build-only previews block with no D1 or service bindings. Authentication and registration are disabled. PREVIEW_ISOLATED makes the router reject all requests except a non-mutating health response before webhook processing, protecting even against accidental Preview Base bindings/secrets. This is not a functional registration Preview. An isolated test database and test-only dependencies must be verified before enabling preview operations. No database identifier was invented or copied from production into Preview.

Wrangler 4.166.0 is pinned locally with lockfile (supports the documented Preview command); check:worker bundles without deployment. Production settings and database binding remain unchanged. No database migration, email delivery, paid plan, payment, or production deploy was performed by this fix. Only the PR branch receives this change; its automatic preview build is inspected separately.

Rollback: revert this commit on the PR branch. Production is unaffected. Do not substitute `wrangler deploy` for the Preview command merely to turn a check green; that could deploy to production.

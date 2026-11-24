# Alternative access: GitHub Actions with a scoped Cloudflare API token

## Verified state

GitHub repository settings were accessible on 2026-11-24. The repository had
only YOUTUBE_API_KEY and no environment secrets. CLOUDFLARE_API_TOKEN was absent.
Cloudflare managed Workers Builds already built the Payhip preview successfully,
but its managed build token is not available to this agent or GitHub Actions.
It must not be extracted, printed or reused by modifying a build to expose it.

## Prepared route

The manual workflow cloudflare-api-deploy.yml supports verify-access (default)
and deploy-paused. It tests the selected checked-out branch, compiles the Worker,
performs only GET checks of the fixed approved Worker, confirms its D1 binding
and records current version identifiers for rollback. Deploy-paused then deploys
with REGISTRATION_ENABLED=false and PAYHIP_ACTIVATION_VERIFIED=false. It refuses
to suspend registrations that are already enabled. No migration is included.

A deployment token is exposed only to the fixed preflight and Wrangler steps.
It is not supplied to tests, npm install, artifacts or job summaries. The workflow
has only contents:read on GitHub and runs solely by manual dispatch. It requires
explicit verification that global quotas plus this operation remain <=70% of
free allowances. This is an operator acknowledgement, not a quota measurement
or automatic enforcement mechanism. Do not attest without checking usage.

153 tests and local Worker dry-run passed. The YAML parsed successfully. These
checks do not verify any real API credential, production deployment, payment,
email, quota or base-table migration. The new workflow remains in a review branch;
GitHub manual dispatch requires the workflow to exist on the default branch.
Merge/reconcile the workflow and its dependencies before attempting dispatch.

## One-time credential setup still required

An authorized account holder must obtain a Cloudflare API token from an
already-authenticated session. Scope it to the existing STUDIOSB6L account and
only the permissions required for the existing Worker (Workers Scripts Edit;
read access is needed for settings and deployments). No Global API Key is needed.
Review any additional permission requested by Wrangler before broadening access.

Save the value in GitHub Settings -> Secrets and variables -> Actions as
CLOUDFLARE_API_TOKEN. Never put its value in chat, source, PR text or plaintext
Actions variables. Creating a token still requires authentication to Cloudflare;
this route replaces repeated browser login for later operations, not initial
authorization. It is currently impossible to run this route without that token.

Run verify-access first after verifying free quota headroom. Only a successful
result establishes token access. Deploy-paused is a later separate operation.
After deployment, complete the Payhip product, payment webhook, email, schema,
real payment and refund checks in payhip-paypal-rollout-20261124.md before enabling
paid registrations. This workflow intentionally cannot mark the full service live.

## Recovery

The artifact contains only account/Worker/database IDs, previous version IDs and
registration status; it is not a database backup. Keep the previous deployment
records and a separately verified D1 backup before applying any migration.
Restore the recorded previous version through authenticated Wrangler/API if a
paused rollout fails health checks. Never delete the database or payment ledger.

Official route: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

# Payhip private credential setup

The owner must copy the Payhip API key directly from https://payhip.com/settings/developer into GitHub Actions Secrets as PAYHIP_WEBHOOK_API_KEY. Do not send it in chat, screenshots, source or PR text. The agent prepared the Name field in a live GitHub form; no key was entered or saved by the agent.

This operational branch runs four isolated tests and then reads only its named GitHub secrets. If either credential is absent, it stops before any Cloudflare request. With both present, it confirms the approved Worker/D1 binding and requires registration/payment activation to remain disabled, then adds only absent PAYHIP_WEBHOOK_API_KEY and ADMISSION_REFERENCE_SECRET Worker secrets. Existing values are never overwritten/rotated automatically; the random reference secret is generated inside the runner and never printed. Result logs include names/presence only, never values.

The Cloudflare secrets PUT operation can create a new Worker version/configuration even without uploading application code. No public registration flag, callback URL, billing plan, email provider setting or payment processor is enabled by this workflow. Registration remains unavailable until the remaining email/quotas/publishing/webhook and real-payment checks pass. No direct Payhip credential transfer has been completed yet.

The workflow runs only on pushes to ops/payhip-secret-setup-20261124. If the key is added after a missing-secret failure, rerun that job after verifying current prerequisites. The payload is transmitted only from the authorized runner to Cloudflare's fixed Worker secrets endpoint.

# Owner access with TOTP

The owner portal is `/administracao/` on the production Worker origin. It adds no paid service or subscription.

## First activation

Only the server-configured `studiosb6l@gmail.com` mailbox can receive initial activation. The request endpoint never accepts a recipient or a role. An existing disabled account or a different owner blocks bootstrap. A valid pending link is not replaced by repeated requests. Requests and email sends are limited and share the existing verified daily email budget.

The random 256-bit activation token is stored only as a SHA-256 hash, expires after 15 minutes, and is consumed by one D1 transaction. The link uses a URL fragment which the page immediately clears from history. Only a POST carrying the valid link token can reveal the pending seed. Email scanners cannot complete enrollment by visiting a URL.

The owner chooses a 12–128 character password and proves possession of the new authenticator seed with a live TOTP code. The server creates or reconciles only the nominated email account, stores the existing scrypt password format, encrypts the TOTP seed with AES-256-GCM and a separately installed private Worker secret, and creates a 15-minute verified owner session. No operator or assistant needs to see credentials, seeds or codes.

Eight random 128-bit recovery codes are shown once to the owner and stored as domain-separated SHA-256 hashes. The owner must save them privately. Login always requires the password plus a current unused TOTP or an unused recovery code. TOTP uses RFC 6238 SHA1, 6 digits, 30 seconds, a ±1-step window, five attempts per five minutes across the owner endpoint, and atomic replay protection. Bootstrap is limited to five guesses per activation token.

An enrolled factor cannot be replaced through an email-only reset or another bootstrap request. The ordinary user login still rejects owner sessions. All administrative privileges continue to require a trusted server-generated MFA-verified session. Loss of both authenticator and recovery codes, forgotten owner password, or disabled-account reconciliation requires a separately verified recovery procedure; this release does not provide an automatic reset.

## Deployment and rollback

Migration 008 adds owner bootstrap, encrypted-factor, hashed-recovery and attempt-budget tables. The deployment preserves previous Worker version and D1 Time Travel bookmark before additive migrations, verifies account-wide quota margin, installs an encryption secret only when absent and never outputs or replaces it, then validates schema and crypto on the deployed Worker. Do not rotate/delete `OWNER_MFA_ENCRYPTION_KEY` without migrating encrypted seeds. Do not restore a whole older database over newer payments.

Pause owner entry with OWNER_ADMIN_ENABLED=false and revoke owner sessions when needed. Preserve factor and recovery tables on rollback. Bootstrap must remain blocked after any owner factor exists. PREVIEW_ISOLATED blocks every mutation. STOP blocks setup and email delivery; already-enrolled owners can still authenticate for future administrative recovery, while support retains its STOP policy.

## Verification

SQLite-backed tests cover fixed-email ownership proof, existing-account reconciliation, disabled and foreign owners, single-use/expired links, failed guesses, CSRF, preview, STOP, email budget, MFA session capabilities, password/TOTP/recovery login, replay denial, ordinary-login MFA bypass denial, encryption context isolation and portal CSP. TOTP output is checked against all six published RFC SHA1 test vectors. Deployment status exercises AES-GCM, HKDF, TOTP and the existing scrypt runtime probe without writing a user or sending an email.

The owner's real mailbox delivery, authenticator enrollment and first administrative login remain user actions and are not claimed as tested. Email replies to support remain outside platform ticket history.

References: https://www.rfc-editor.org/rfc/rfc6238 and https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html

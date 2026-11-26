# Transmission provider rollout — blocked pending authenticated verification

CI run 270 passed for commit bc44dd33fafe0a65aa2e80722dd8f525df12ff52.
Do not enable TRANSMISSIONS_ENABLED or deploy staged SQL until all gates pass.

- Identify the actual provider and verify free allowances, billing controls and all billable metrics in its authenticated dashboard.
- Implement trusted provider adapter for room creation, enforced 45-minute expiry, closure and cumulative usage snapshots with explicit covered room IDs.
- Never release reservations based only on local closure or an unverified snapshot.
- Verify 70% ceiling for every metric, 30% reserve, STOP, atomic admission, host and attendee limits, and fail-closed behavior.
- Wire authenticated API routes and customer portal, keeping operational metrics admin-only.
- Apply staged migrations only after backup, staging validation and rollback rehearsal.
- Run controlled end-to-end tests; do not enable paid plans or automatic overages.
- Publish only after all gates are evidenced. If any gate fails, keep transmissions disabled.

Provider integration and production deployment have not been performed.

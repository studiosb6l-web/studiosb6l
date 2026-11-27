// Pure policy calculation; no billing or external side effects.
// All monetary inputs are verified EUR cents from a trusted server ledger.
export function financePolicy({netRevenueCents, freeCashCents, committedCents, spentCents, verified, stopped} = {}) {
  const values = [netRevenueCents, freeCashCents, committedCents, spentCents];
  if (verified !== true || stopped !== false || !values.every(v => Number.isSafeInteger(v) && v >= 0))
    return { ceilingCents: 0, availableCents: 0, requiresFounderApproval: true };
  const ceilingCents = netRevenueCents > 1000000 ? Math.floor(netRevenueCents / 20) : 0;
  const availableCents = Math.max(0, Math.min(freeCashCents, ceilingCents - committedCents - spentCents));
  return { ceilingCents, availableCents, requiresFounderApproval: true };
}
// Reserve is not permission to exceed provider quotas.
export function quotaPolicy({used, limit, requested, stopped} = {}) {
  if (stopped !== false || ![used, limit, requested].every(v => Number.isSafeInteger(v) && v >= 0) || limit === 0)
    return { allowed: false, warning: true };
  const ceiling = Math.floor(limit * 0.7);
  return { allowed: used <= ceiling && requested <= ceiling - used, warning: used >= limit * 0.6 || requested >= limit * 0.6 - used };
}

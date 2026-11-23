// BEN: fail-closed entitlement evaluation. Pure helper; no Stripe or D1 writes.
// Caller must verify the authenticated account and read the row from D1.
// This module does not activate subscriptions or authorize payment collection.
export function proEntitled({accountActive = false, subscription = null, now = Math.floor(Date.now() / 1000)} = {}) {
  if (accountActive !== true || !subscription || typeof subscription !== 'object') return false;
  if (subscription.plan !== 'pro' || subscription.subscription_status !== 'active') return false;
  if (typeof subscription.stripe_subscription_id !== 'string' || !subscription.stripe_subscription_id.startsWith('sub_')) return false;
  const expiry = subscription.current_period_end;
  if (!Number.isSafeInteger(expiry) || expiry <= now) return false;
  return true;
}
export function effectivePlan(input = {}) {
  return proEntitled(input) ? 'pro' : 'basic';
}

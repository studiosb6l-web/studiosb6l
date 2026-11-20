// B6L MUSIC CONNECT — payment-provider configuration (no secrets).
// The music shop checkout remains independent. Never activate PRO from browser redirects.
export const MUSIC_CONNECT_BILLING = Object.freeze({
 currency: 'EUR',
 plans: Object.freeze({
  pro_monthly: Object.freeze({amountCents:499, interval:'month'}),
  pro_annual: Object.freeze({amountCents:4990, interval:'year'})
 }),
 providers: Object.freeze(['stripe','paypal']),
 checkoutEnabled: false, // Turn on only after production, tax, legal and webhook verification.
});
export function validatePlan(provider, plan) {
 if (!MUSIC_CONNECT_BILLING.providers.includes(provider)) throw new Error('Unsupported payment provider');
 if (!Object.hasOwn(MUSIC_CONNECT_BILLING.plans, plan)) throw new Error('Unsupported subscription plan');
 return {provider, plan, ...MUSIC_CONNECT_BILLING.plans[plan], currency:'EUR'};
}
export function canGrantPro({provider, eventVerified, subscriptionActive, paymentSettled}) {
 return MUSIC_CONNECT_BILLING.providers.includes(provider) &&
  eventVerified === true && subscriptionActive === true && paymentSettled === true;
}
// Server implementation requirements:
// Stripe: Checkout subscription mode, webhook signature verification and idempotency.
// PayPal: Subscriptions API, verify webhook signature, check subscription status.
// Both: persist provider subscription IDs and lifecycle, support cancellation.
// Never store card credentials or assume successful payment from a return URL.

// STUDIOSB6L Rule #1: fail closed on unverified costs.
// Pure policy helpers only. NOT a payment integration or production enforcement.
export const ENTRY_FEE_CENTS = 299;
export const ENTRY_CURRENCY = "eur";
export const ENTRY_RECURRING = false;

export function evaluateEntry({ paymentVerified=false, paymentCurrency, amountReceivedCents, alreadyPaid=false, refunded=false, disputed=false }={}) {
  if (alreadyPaid && !refunded && !disputed) return {allow:true,reason:"existing_verified_membership",chargeAgain:false};
  if (!paymentVerified || paymentCurrency !== ENTRY_CURRENCY || !Number.isSafeInteger(amountReceivedCents) || amountReceivedCents < ENTRY_FEE_CENTS || refunded || disputed)
    return {allow:false,reason:"entry_payment_not_verified",chargeAgain:false};
  return {allow:true,reason:"verified_one_time_entry",chargeAgain:false};
}

export function evaluateCost({ providerCostCents, paymentFeesCents, taxReserveCents, refundRiskReserveCents, otherCostCents=0, allocatedRevenueCents, requiredMarginCents=1, providerHardCapConfirmed=false, reservationAtomic=false, meteringReliable=false }={}) {
  const amounts=[providerCostCents,paymentFeesCents,taxReserveCents,refundRiskReserveCents,otherCostCents,allocatedRevenueCents,requiredMarginCents];
  if (!amounts.every(n=>Number.isSafeInteger(n)&&n>=0)) return {allow:false,reason:"unknown_or_invalid_amount"};
  if (!providerHardCapConfirmed || !reservationAtomic || !meteringReliable) return {allow:false,reason:"uncontrolled_provider_or_usage"};
  const totalCostCents=providerCostCents+paymentFeesCents+taxReserveCents+refundRiskReserveCents+otherCostCents;
  if (!Number.isSafeInteger(totalCostCents) || allocatedRevenueCents < totalCostCents+requiredMarginCents) return {allow:false,reason:"insufficient_margin",totalCostCents};
  return {allow:true,reason:"margin_and_caps_verified",totalCostCents,estimatedMarginCents:allocatedRevenueCents-totalCostCents};
}

export function selectCheapestSafeOption(options=[]) {
  return options.filter(o=>o && o.verified===true && o.noOverage===true && Number.isSafeInteger(o.totalCostCents) && o.totalCostCents>=0).sort((a,b)=>a.totalCostCents-b.totalCostCents)[0] ?? null;
}

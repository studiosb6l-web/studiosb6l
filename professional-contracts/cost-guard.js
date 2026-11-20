// STUDIOSB6L fail-closed cost guard — pure policy foundation, not connected to billing.
// Monetary units: integer minor units (euro cents). No automatic charges.
export const COST_POLICY=Object.freeze({
 currency:'EUR',defaultDailySpendLimitCents:0,defaultMonthlySpendLimitCents:0,
 paidFeaturesRequireExplicitApproval:true,unknownUsage:'deny',
 actionAtLimit:'block',customerChargeRequiresPublishedPriceAndConsent:true
});
export function authorizeUsage({feature,estimatedCostCents=0,usedTodayCents=0,usedMonthCents=0,dailyLimitCents=0,monthlyLimitCents=0,explicitApproval=false,pricePublished=false,customerConsent=false,chargeCustomer=false}={}){
 const values=[estimatedCostCents,usedTodayCents,usedMonthCents,dailyLimitCents,monthlyLimitCents];
 if(!feature||values.some(n=>!Number.isSafeInteger(n)||n<0))return {allowed:false,reason:'invalid_or_unknown_usage'};
 if(estimatedCostCents>0&&!explicitApproval)return {allowed:false,reason:'paid_service_requires_approval'};
 if(chargeCustomer&&(!pricePublished||!customerConsent))return {allowed:false,reason:'customer_price_and_consent_required'};
 if(usedTodayCents+estimatedCostCents>dailyLimitCents)return {allowed:false,reason:'daily_limit'};
 if(usedMonthCents+estimatedCostCents>monthlyLimitCents)return {allowed:false,reason:'monthly_limit'};
 return {allowed:true,reason:'within_limits'};
}
// IMPORTANT: Production enforcement requires atomic reservations in D1/Durable Objects,
// trusted metering and vendor-side hard caps; this helper alone cannot stop external bills.

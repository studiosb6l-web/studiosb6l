// STUDIOSB6L usage metering and paid-tier eligibility: pure decision logic.
// No payment collection or provider API calls. Enforce atomically on server before deployment.
export function usageDecision({registeredUsers,activeUsers,providerFreeUnits,providerUsedUnits,userIncludedUnits,userUsedUnits,requestedUnits=1,paidServiceConfigured=false,publishedPriceCents=null,userAcceptedPrice=false,paymentConfirmed=false,providerCostCovered=false,providerHardCapConfirmed=false}={}){
 const nums=[registeredUsers,activeUsers,providerFreeUnits,providerUsedUnits,userIncludedUnits,userUsedUnits,requestedUnits];
 if(nums.some(n=>!Number.isSafeInteger(n)||n<0)||requestedUnits===0||activeUsers>registeredUsers)return {action:'block',reason:'unverified_usage'};
 if(!providerHardCapConfirmed)return {action:'block',reason:'no_provider_hard_cap'};
 const remaining=Math.max(0,providerFreeUnits-providerUsedUnits);
 const userRemaining=Math.max(0,userIncludedUnits-userUsedUnits);
 if(remaining>=requestedUnits&&userRemaining>=requestedUnits)return {action:'allow_free',reason:'within_free_quotas'};
 if(!paidServiceConfigured||!Number.isSafeInteger(publishedPriceCents)||publishedPriceCents<=0)return {action:'block',reason:'paid_tier_unavailable'};
 if(!userAcceptedPrice||!paymentConfirmed||!providerCostCovered)return {action:'offer_paid',reason:'explicit_prepaid_payment_required'};
 return {action:'allow_prepaid',reason:'paid_and_cost_covered'};
}
export function capacityForecast({remainingFreeUnits,averageUnitsPerActiveUser}={}){
 if(!Number.isSafeInteger(remainingFreeUnits)||remainingFreeUnits<0||!Number.isFinite(averageUnitsPerActiveUser)||averageUnitsPerActiveUser<=0)return null;
 return Math.floor(remainingFreeUnits/averageUnitsPerActiveUser);
}
// Never call a billable provider without an independent hard spending cap and reserved funds.
// Prices require owner approval, taxes, refunds, checkout, fraud checks and user consent.

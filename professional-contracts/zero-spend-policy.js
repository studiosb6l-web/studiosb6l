// STUDIOSB6L: zero incremental spend policy; pure fail-closed gate.
// Deploy only after provider-level billing limits and trusted atomic usage counters are configured.
export const ZERO_SPEND_POLICY=Object.freeze({maxIncrementalSpendCents:0,allowPaidUpgrade:false,unknownCost:'deny',limitBehavior:'suspend_feature'});
export function mayRunFreeOperation({providerFreeTierConfirmed=false,providerHardCapConfirmed=false,usageKnown=false,remainingFreeUnits=0,unitsNeeded=1,possibleBillableCost=false}={}){
 if(!providerFreeTierConfirmed)return {allowed:false,reason:'free_tier_unconfirmed'};
 if(!providerHardCapConfirmed)return {allowed:false,reason:'provider_hard_cap_unconfirmed'};
 if(!usageKnown||!Number.isSafeInteger(remainingFreeUnits)||remainingFreeUnits<0)return {allowed:false,reason:'usage_unknown'};
 if(!Number.isSafeInteger(unitsNeeded)||unitsNeeded<1)return {allowed:false,reason:'invalid_units'};
 if(possibleBillableCost)return {allowed:false,reason:'billable_operation'};
 if(remainingFreeUnits<unitsNeeded)return {allowed:false,reason:'free_quota_exhausted'};
 return {allowed:true,reason:'free_quota_available'};
}
export function shouldResumeAfterReset({quotaResetVerified=false,...rest}={}){
 if(!quotaResetVerified)return {allowed:false,reason:'quota_reset_unverified'};
 return mayRunFreeOperation(rest);
}
// NOTE: A supplier without enforceable hard caps must be disabled, even if it has a free tier.
// This module alone cannot control provider billing or existing subscriptions.

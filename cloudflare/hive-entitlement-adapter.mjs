// Explicit adapter for existing verified professional subscriptions.
// Do not infer BASIC or PRO BUSINESS from a missing or unknown entitlement.
export function digestEntitlement(row,subject,now){
 if(typeof subject!=='string'||!subject||!Number.isSafeInteger(now)||!row||!['pro_monthly','pro_annual'].includes(row.plan)||typeof row.provider_reference!=='string'||!row.provider_reference.trim()||!Number.isSafeInteger(row.verified_at)||row.verified_at<=0||row.verified_at>now||!Number.isSafeInteger(row.expires_at)||row.expires_at<=now||row.revoked_at!==null)return null;
 return {subject,plan:'pro',verified:true,revoked:false,expiresAt:row.expires_at};
}

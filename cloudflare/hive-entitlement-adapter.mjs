// Explicit adapter for existing verified professional subscriptions.
// Do not infer BASIC or PRO BUSINESS from a missing or unknown entitlement.
export function digestEntitlement(row,subject,now){
 if(typeof subject!=='string'||!subject||!Number.isSafeInteger(now)||!row||!['pro_monthly','pro_annual'].includes(row.plan)||typeof row.provider_reference!=='string'||!row.provider_reference.trim()||!Number.isSafeInteger(row.verified_at)||row.verified_at<=0||row.verified_at>now||!Number.isSafeInteger(row.expires_at)||row.expires_at<=now||row.revoked_at!==null)return null;
 return {subject,plan:'pro',verified:true,revoked:false,expiresAt:row.expires_at};
}

// Admission is separate from recurring subscription. Never infer payment from session alone.
export function accountDigestEntitlement({account,admission,subscription,now}={}){
 if(!Number.isSafeInteger(now)||now<0||!account||typeof account.id!=='string'||!account.id||account.verified!==1||account.disabled!==0||account.role==='owner')return null;
 if(!admission||admission.account_id!==account.id||admission.revoked_at!==null||![admission.email_verified_at,admission.paid_at,admission.activated_at].every(v=>Number.isSafeInteger(v)&&v>0&&v<=now))return null;
 return digestEntitlement(subscription,account.id,now)||{subject:account.id,plan:'basic',verified:true,revoked:false,expiresAt:Number.MAX_SAFE_INTEGER};
}

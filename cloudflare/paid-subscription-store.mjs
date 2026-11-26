// Only trusted, verified provider reconciliation may populate this ledger.
export async function loadPaidMembership(accountId,env,now=Date.now()){
 if(env?.PAID_SUBSCRIPTIONS_VERIFIED!=='true'||env.STOP_SERVICE==='true'||env.PREVIEW_ISOLATED==='true'||!env.DB||typeof accountId!=='string'||!accountId)return null;
 const row=await env.DB.prepare("SELECT s.plan,s.paid_until FROM paid_subscription_entitlements s JOIN accounts a ON a.id=s.account_id JOIN account_onboarding o ON o.account_id=a.id JOIN payhip_admission_payments p ON p.account_id=a.id WHERE a.id=? AND a.verified=1 AND a.disabled=0 AND o.email_verified_at IS NOT NULL AND o.paid_at IS NOT NULL AND o.revoked_at IS NULL AND p.revoked_at IS NULL AND s.revoked_at IS NULL AND s.verified_at<=? AND s.paid_until>? LIMIT 1").bind(accountId,now,now).first();
 if(!row||!['PRO','PRO_BUSINESS'].includes(row.plan)||!Number.isFinite(row.paid_until)||row.paid_until<=now)return null;
 return {disabled:false,paymentVerified:true,plan:row.plan,paidUntil:row.paid_until};
}

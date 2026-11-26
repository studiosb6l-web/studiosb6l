import {recurringEntitlement} from './recurring-entitlement-policy.mjs';
// Call only with independently verified provider data and trusted account mapping.
export async function persistRecurringEntitlement(db,snapshot,mapping,now=Date.now()){
 const next=recurringEntitlement(snapshot,mapping,null,now);
 if(!next)return false;
 const {accountId,subscriptionId,observedAt}=next;
 if(next.revokedAt!==null){
 const result=await db.prepare("UPDATE paid_subscription_entitlements SET revoked_at=?,verified_at=? WHERE account_id=? AND provider_subscription_id=? AND verified_at<?").bind(observedAt,observedAt,accountId,subscriptionId,observedAt).run();
 return Number(result.meta?.changes)===1;
 }
 const result=await db.prepare("INSERT INTO paid_subscription_entitlements(account_id,provider_subscription_id,plan,verified_at,paid_until,revoked_at) SELECT ?,?,?,?,?,NULL WHERE EXISTS(SELECT 1 FROM accounts a JOIN account_onboarding o ON o.account_id=a.id JOIN payhip_admission_payments p ON p.account_id=a.id WHERE a.id=? AND a.verified=1 AND a.disabled=0 AND o.email_verified_at IS NOT NULL AND o.paid_at IS NOT NULL AND o.revoked_at IS NULL AND p.revoked_at IS NULL) ON CONFLICT(account_id) DO UPDATE SET plan=excluded.plan,verified_at=excluded.verified_at,paid_until=excluded.paid_until,revoked_at=NULL WHERE paid_subscription_entitlements.provider_subscription_id=excluded.provider_subscription_id AND paid_subscription_entitlements.verified_at<excluded.verified_at").bind(accountId,subscriptionId,next.plan,observedAt,next.paidUntil,accountId).run();
 return Number(result.meta?.changes)===1;
}

import {recurringEntitlement} from './recurring-entitlement-policy.mjs';
// Call only with independently verified provider data and trusted account mapping.
export async function persistRecurringEntitlement(db,snapshot,mapping,now=Date.now()){
 const next=recurringEntitlement(snapshot,mapping,null,now);
 if(!next)return false;
 const {accountId,subscriptionId,observedAt}=next;
 if(next.revokedAt!==null){
 const marker=await db.prepare("INSERT INTO paid_subscription_revocations VALUES(?,?,?) ON CONFLICT(provider_subscription_id) DO UPDATE SET observed_at=excluded.observed_at WHERE account_id=excluded.account_id AND observed_at<excluded.observed_at").bind(subscriptionId,accountId,observedAt).run();
 const result=await db.prepare("UPDATE paid_subscription_entitlements SET revoked_at=? WHERE account_id=? AND provider_subscription_id=? AND MAX(verified_at,COALESCE(revoked_at,0))<?").bind(observedAt,accountId,subscriptionId,observedAt).run();
 return Number(marker.meta?.changes)===1||Number(result.meta?.changes)===1;
 }
 const result=await db.prepare("INSERT INTO paid_subscription_entitlements(account_id,provider_subscription_id,plan,verified_at,paid_until,revoked_at) SELECT ?,?,?,?,?,NULL WHERE NOT EXISTS(SELECT 1 FROM paid_subscription_revocations WHERE provider_subscription_id=? AND (account_id<>? OR observed_at>=?)) AND EXISTS(SELECT 1 FROM accounts a JOIN account_onboarding o ON o.account_id=a.id JOIN payhip_admission_payments p ON p.account_id=a.id WHERE a.id=? AND a.verified=1 AND a.disabled=0 AND o.email_verified_at IS NOT NULL AND o.paid_at IS NOT NULL AND o.revoked_at IS NULL AND p.revoked_at IS NULL) ON CONFLICT(account_id) DO UPDATE SET plan=excluded.plan,verified_at=excluded.verified_at,paid_until=excluded.paid_until,revoked_at=NULL WHERE paid_subscription_entitlements.provider_subscription_id=excluded.provider_subscription_id AND MAX(paid_subscription_entitlements.verified_at,COALESCE(paid_subscription_entitlements.revoked_at,0))<excluded.verified_at").bind(accountId,subscriptionId,next.plan,observedAt,next.paidUntil,subscriptionId,accountId,observedAt,accountId).run();
 return Number(result.meta?.changes)===1;
}

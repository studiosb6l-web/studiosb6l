import {authorizeProCapability} from './pro-access-policy.mjs';

// Trusted server-side D1 access. Do not expose this as a public endpoint without
// authentication, rate limiting, and the existing session resolver.
export async function checkProAccess({db,session,capability,now=Math.floor(Date.now()/1000)}={}){
  if(!db?.prepare || !session?.userId || typeof session.userId!=='string')return false;
  // First reject invalid sessions and unknown capabilities without a database query.
  if(!authorizeProCapability({session,subscription:{plan:'pro',subscription_status:'active',stripe_subscription_id:'sub_precheck',current_period_end:now+1},capability,now}))return false;
  try {
    const onboarding=await db.prepare(
      'SELECT activated_at, revoked_at FROM account_onboarding WHERE account_id = ? LIMIT 1'
    ).bind(session.userId).first();
    if(!onboarding || !Number.isSafeInteger(onboarding.activated_at) || onboarding.activated_at<=0 || onboarding.revoked_at!==null && onboarding.revoked_at!==undefined)return false;
    const subscription=await db.prepare(
      'SELECT plan, subscription_status, stripe_subscription_id, current_period_end FROM account_subscriptions WHERE account_id = ? LIMIT 1'
    ).bind(session.userId).first();
    return authorizeProCapability({session,subscription,capability,now});
  } catch {
    // Missing migration, unavailable D1, or unexpected row: never grant PRO.
    return false;
  }
}

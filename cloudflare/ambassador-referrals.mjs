import {activeAmbassador} from './ambassador-access.mjs';
// Internal service. Account IDs must originate from authenticated backend context.
export async function createReferral(env,accountId){
 if(!await activeAmbassador(env,accountId))throw new Error('Forbidden');
 const code=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 const result=await env.DB.prepare(`INSERT INTO ambassador_referrals(code,ambassador_id,created_at)
 SELECT ?,g.account_id,? FROM ambassador_grants g JOIN ambassador_invites i ON i.id=g.invite_id
 JOIN accounts a ON a.id=g.account_id JOIN account_onboarding o ON o.account_id=a.id
 WHERE g.account_id=? AND g.revoked_at IS NULL AND i.revoked_at IS NULL AND a.disabled=0 AND o.revoked_at IS NULL AND o.email_verified_at IS NOT NULL`).bind(code,Date.now(),accountId).run();
 if(result.meta?.changes!==1)throw new Error('Forbidden');
 return {code,url:'https://www.studiosb6l.com/conta/?ref='+code};
}
export async function attributeReferral(env,accountId,code){
 if(env?.AMBASSADOR_ENABLED!=='true'||!env.DB||typeof accountId!=='string'||typeof code!=='string'||!/^[a-f0-9]{32}$/.test(code))return false;
 // Only verified, non-owner accounts before admission payment; first attribution wins.
 const result=await env.DB.prepare(`INSERT INTO ambassador_referral_attribution(account_id,code,attributed_at)
 SELECT a.id,r.code,? FROM ambassador_referrals r
 JOIN ambassador_grants g ON g.account_id=r.ambassador_id
 JOIN ambassador_invites i ON i.id=g.invite_id
 JOIN accounts host ON host.id=g.account_id
 JOIN account_onboarding ho ON ho.account_id=host.id
 JOIN accounts a ON a.id=? JOIN account_onboarding o ON o.account_id=a.id
 WHERE r.code=? AND r.revoked_at IS NULL AND g.revoked_at IS NULL AND i.revoked_at IS NULL
 AND host.disabled=0 AND ho.revoked_at IS NULL AND ho.email_verified_at IS NOT NULL
 AND a.id<>r.ambassador_id AND a.role<>'owner' AND a.disabled=0
 AND o.email_verified_at IS NOT NULL AND o.paid_at IS NULL AND o.revoked_at IS NULL
 ON CONFLICT(account_id) DO NOTHING`).bind(Date.now(),accountId,code).run();
 return result.meta?.changes===1;
}
// Attribution never grants free access, changes prices or confirms payment.

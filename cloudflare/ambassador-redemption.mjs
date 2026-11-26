import {digestInvite} from './ambassador-invite-crypto.mjs';
// Internal service only: trusted authenticated account ID from backend.
// Email verification must precede redemption. Never mark an account as paid.
export async function redeemAmbassadorInvite(env,accountId,token){
 if(env?.AMBASSADOR_ENABLED!=='true'||!env.DB)throw new Error('Unavailable');
 if(typeof accountId!=='string'||!accountId)throw new Error('Forbidden');
 const hash=await digestInvite(token),now=Date.now(),attempt=crypto.randomUUID();
 // D1 batch is atomic; unique constraints roll back conflicting grants.
 // Audit nonce identifies this transaction rather than relying on timestamp uniqueness.
 const results=await env.DB.batch([
 env.DB.prepare(`INSERT INTO ambassador_audit(id,actor_id,event_type,target_id,created_at)
 SELECT ?,a.id,'invite_redeemed',i.id,? FROM ambassador_invites i
 JOIN accounts a ON a.id=? AND a.email=i.email AND a.disabled=0 AND a.role<>'owner'
 JOIN account_onboarding o ON o.account_id=a.id AND o.email_verified_at IS NOT NULL AND o.revoked_at IS NULL
 WHERE i.token_hash=? AND i.redeemed_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>?
 AND NOT EXISTS(SELECT 1 FROM ambassador_grants g WHERE g.account_id=a.id)`).bind(attempt,now,accountId,hash,now),
 env.DB.prepare(`INSERT INTO ambassador_grants(account_id,invite_id,granted_at)
 SELECT actor_id,target_id,created_at FROM ambassador_audit WHERE id=?`).bind(attempt),
 env.DB.prepare(`UPDATE ambassador_invites SET redeemed_at=?,redeemed_by=?
 WHERE id=(SELECT target_id FROM ambassador_audit WHERE id=?)`).bind(now,accountId,attempt)
 ]);
 return results[0]?.meta?.changes===1;
}
// Existing login/onboarding gates must explicitly recognize an active grant.
// This service does not activate accounts or change payment records by itself.

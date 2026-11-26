// Read only from server-side persistence. No role-specific professional exclusions.
export async function loadActiveAmbassadorGrant(env,accountId){
 if(env?.AMBASSADOR_ENABLED!=='true'||env.STOP_SERVICE==='true'||env.PREVIEW_ISOLATED==='true')return false;
 if(!env.DB||typeof accountId!=='string'||!accountId)throw new TypeError('Invalid entitlement lookup');
 const row=await env.DB.prepare(`SELECT g.account_id FROM ambassador_grants g JOIN ambassador_invites i ON i.id=g.invite_id JOIN accounts a ON a.id=g.account_id JOIN account_onboarding o ON o.account_id=a.id WHERE g.account_id=? AND g.revoked_at IS NULL AND i.revoked_at IS NULL AND i.redeemed_by=a.id AND i.redeemed_at IS NOT NULL AND a.disabled=0 AND a.verified=1 AND a.role<>'owner' AND o.email_verified_at IS NOT NULL AND o.revoked_at IS NULL LIMIT 1`).bind(accountId).first();
 return row?.account_id===accountId;
}

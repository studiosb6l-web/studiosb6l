import {canIssueAmbassadorInvite} from './ambassador-session-policy.mjs';
// Trusted account ID only. No client-supplied plan or payment flags.
export async function activeAmbassador(env,accountId){
 if(env?.AMBASSADOR_ENABLED!=='true'||!env.DB||typeof accountId!=='string'||!accountId)return null;
 const row=await env.DB.prepare(`SELECT g.account_id,i.sectors_json FROM ambassador_grants g
 JOIN ambassador_invites i ON i.id=g.invite_id
 JOIN accounts a ON a.id=g.account_id
 JOIN account_onboarding o ON o.account_id=a.id
 WHERE g.account_id=? AND g.revoked_at IS NULL AND i.revoked_at IS NULL
 AND a.disabled=0 AND o.email_verified_at IS NOT NULL AND o.revoked_at IS NULL`).bind(accountId).first();
 if(!row)return null;
 return {accountId:row.account_id,plan:'PRO_BUSINESS',ambassadorActive:true,disabled:false,sectors:JSON.parse(row.sectors_json),admissionExempt:true,subscriptionExempt:true};
}
export async function revokeAmbassador(env,session,accountId){
 if(env?.AMBASSADOR_ENABLED!=='true'||!env.DB)throw new Error('Unavailable');
 if(!canIssueAmbassadorInvite(session)||typeof session.accountId!=='string'||typeof accountId!=='string')throw new Error('Forbidden');
 const now=Date.now(),audit=crypto.randomUUID();
 const result=await env.DB.batch([
 env.DB.prepare(`INSERT INTO ambassador_audit(id,actor_id,event_type,target_id,created_at)
 SELECT ?,?,'grant_revoked',account_id,? FROM ambassador_grants WHERE account_id=? AND revoked_at IS NULL`).bind(audit,session.accountId,now,accountId),
 env.DB.prepare(`UPDATE ambassador_grants SET revoked_at=? WHERE account_id=? AND EXISTS(SELECT 1 FROM ambassador_audit WHERE id=?)`).bind(now,accountId,audit)
 ]);
 return result[0]?.meta?.changes===1;
}
// Integration must recheck entitlements on every privileged request and revoke
// provider access on grant withdrawal. Ordinary paid entitlements remain separate.

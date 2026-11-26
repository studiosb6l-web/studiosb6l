import {canIssueAmbassadorInvite} from './ambassador-session-policy.mjs';
import {newInvite,normalizeInviteEmail} from './ambassador-invite-crypto.mjs';
import {SECTORS} from './professional-profile-schema.mjs';
import {ACCOUNT_ORIGIN} from './auth-origins.mjs';
// Internal service: caller must authenticate session, enforce origin/rate limits,
// and deliver the token privately. Never log the returned URL.
export async function issueAmbassadorInvite(env,session,{email,sectors}={}){
 if(env?.AMBASSADOR_ENABLED!=='true'||!env.DB)throw new Error('Unavailable');
 if(!canIssueAmbassadorInvite(session)||typeof session.accountId!=='string')throw new Error('Forbidden');
 const normalized=normalizeInviteEmail(email);
 if(!Array.isArray(sectors)||!sectors.length||sectors.length>Object.keys(SECTORS).length||sectors.some(s=>typeof s!=='string'||!Object.hasOwn(SECTORS,s)))throw new TypeError('Invalid sectors');
 const unique=[...new Set(sectors)];
 const invite=await newInvite(),id=crypto.randomUUID();
 await env.DB.batch([
 env.DB.prepare('INSERT INTO ambassador_invites(id,token_hash,email,issuer_id,sectors_json,created_at,expires_at) VALUES(?,?,?,?,?,?,?)').bind(id,invite.tokenHash,normalized,session.accountId,JSON.stringify(unique),invite.createdAt,invite.expiresAt),
 env.DB.prepare('INSERT INTO ambassador_audit(id,actor_id,event_type,target_id,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),session.accountId,'invite_issued',id,invite.createdAt)
 ]);
 return {id,expiresAt:invite.expiresAt,url:ACCOUNT_ORIGIN+'/ambassador/#invite='+invite.token};
}

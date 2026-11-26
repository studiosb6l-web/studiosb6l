import {canIssueAmbassadorInvite} from './ambassador-session-policy.mjs';
export async function ambassadorDashboard(env,session,{limit=25,offset=0}={}){
 if(env?.AMBASSADOR_ENABLED!=='true'||!env.DB)throw new Error('Unavailable');
 if(!canIssueAmbassadorInvite(session))throw new Error('Forbidden');
 if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(offset)||offset<0)throw new TypeError('Invalid pagination');
 const rows=await env.DB.prepare(`SELECT g.account_id,a.email,g.granted_at,g.revoked_at,i.sectors_json,
 CASE WHEN g.revoked_at IS NULL AND i.revoked_at IS NULL AND a.disabled=0 AND o.revoked_at IS NULL AND o.email_verified_at IS NOT NULL THEN 1 ELSE 0 END AS active,
 (SELECT COUNT(*) FROM ambassador_referral_attribution t JOIN ambassador_referrals r ON r.code=t.code WHERE r.ambassador_id=g.account_id) AS referrals,
 (SELECT COUNT(*) FROM ambassador_referral_attribution t JOIN ambassador_referrals r ON r.code=t.code JOIN account_onboarding p ON p.account_id=t.account_id WHERE r.ambassador_id=g.account_id AND p.paid_at IS NOT NULL AND p.revoked_at IS NULL) AS admission_paid_accounts
 FROM ambassador_grants g JOIN accounts a ON a.id=g.account_id JOIN ambassador_invites i ON i.id=g.invite_id
 JOIN account_onboarding o ON o.account_id=a.id ORDER BY g.granted_at DESC,g.account_id LIMIT ? OFFSET ?`).bind(limit,offset).all();
 return {items:rows.results??[],limit,offset,revenue:null,revenueStatus:'Requires reconciled payment ledger'};
}
// Do not infer subscription revenue from referral counts or list prices.
// Expose only through authenticated owner MFA routes, with no-store responses.

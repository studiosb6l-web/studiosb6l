import {resolveSession} from './session-guard.mjs';
import {accountDigestEntitlement} from './hive-entitlement-adapter.mjs';
import {selectOpportunityDigest} from './hive-opportunity-digest.mjs';
import {reserveHiveQuota} from './hive-quota-reservation.mjs';
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// Read-only endpoint. No client-supplied identity, plan, preferences or source trust.
export async function privateOpportunityApi(request,env={}){
 if(request.method!=='GET')return reply(405,{success:false});
 if(env.HIVE_PRIVATE_OPPORTUNITIES!=='true'||env.STOP_SERVICE==='true'||env.PREVIEW_ISOLATED==='true'||!env.DB)return reply(503,{success:false});
 const now=Date.now(),db=env.DB;
 // Reserve a conservative upper bound for the bounded read workload.
 if(!await reserveHiveQuota(db,{service:'private-opportunity-reads',windowId:env.HIVE_PRIVATE_QUOTA_WINDOW,units:110,now}))return reply(503,{success:false});
 const session=await resolveSession(request,env);
 if(!session)return reply(401,{success:false});
 try{
 const account=await db.prepare('SELECT id,verified,disabled,role FROM accounts WHERE id=?').bind(session.userId).first();
 const admission=await db.prepare('SELECT account_id,email_verified_at,paid_at,activated_at,revoked_at FROM account_onboarding WHERE account_id=?').bind(session.userId).first();
 const subscription=await db.prepare('SELECT plan,provider_reference,verified_at,expires_at,revoked_at FROM professional_entitlements WHERE account_id=?').bind(session.userId).first();
 const entitlement=accountDigestEntitlement({account,admission,subscription,now});
 if(!entitlement)return reply(403,{success:false});
 const pref=await db.prepare('SELECT consent,categories,country FROM hive_notification_preferences WHERE account_id=?').bind(session.userId).first();
 if(pref?.consent!==1)return reply(200,{success:true,items:[]});
 const categories=JSON.parse(pref.categories);
 const rows=await db.prepare("SELECT canonical_id,category,country,expires_at FROM hive_verified_opportunities WHERE source_verified=1 AND source_authorized=1 AND moderation='approved' AND expires_at>? ORDER BY expires_at,canonical_id LIMIT 100").bind(now).all();
 const records=(rows.results||[]).map(r=>({canonicalId:r.canonical_id,category:r.category,country:r.country,expiresAtMs:r.expires_at,sourceVerified:true,sourceAuthorized:true,moderation:'approved'}));
 const items=selectOpportunityDigest({viewer:{id:session.userId,notificationConsent:true,categories,country:pref.country},entitlement,records,now,stopped:false});
 return reply(200,{success:true,items});
 }catch{return reply(503,{success:false});}
}

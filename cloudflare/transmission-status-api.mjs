import {loadActiveAmbassadorGrant} from './ambassador-entitlement-store.mjs';
import {resolveSession} from './session-guard.mjs';
import {checkAuthRate} from './auth-readiness.mjs';
import {trustedAuthOrigin} from './auth-origins.mjs';
import {effectivePlan,attendanceLimits,LIMITS} from './ambassador-session-policy.mjs';
import {transmissionUsage} from './transmission-usage.mjs';
import {publicTransmissionStatus} from './transmission-public-status.mjs';
export async function transmissionStatusApi(request,env,{loadMembership,loadAvailability}={}){
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 const unavailable=()=>reply(503,{error:'Service temporarily unavailable'});
 if(request.method!=='GET')return reply(405,{error:'Method not allowed'});
 const origin=request.headers.get('Origin');
 if(origin&&!trustedAuthOrigin(origin))return reply(403,{error:'Forbidden'});
 if(env.PREVIEW_ISOLATED==='true'||env.TRANSMISSIONS_ENABLED!=='true'||!env.DB||!loadMembership||!loadAvailability)return unavailable();
 try{
 const limited=await checkAuthRate(request,env);if(limited)return reply(limited,{error:'Try again later'});
 const session=await resolveSession(request,env);if(!session)return reply(401,{error:'Authentication required'});
 const account=await env.DB.prepare('SELECT id,role,verified,disabled FROM accounts WHERE id=?').bind(session.userId).first();
 if(!account||account.disabled!==0||account.verified!==1||account.role!==session.role)return reply(403,{error:'Forbidden'});
 const now=Date.now();
 const ambassadorActive=await loadActiveAmbassadorGrant(env,account.id);
 const admission=ambassadorActive?null:await env.DB.prepare("SELECT p.account_id FROM payhip_admission_payments p JOIN account_onboarding o ON o.account_id=p.account_id WHERE p.account_id=? AND p.revoked_at IS NULL AND o.revoked_at IS NULL AND o.paid_at IS NOT NULL AND o.email_verified_at IS NOT NULL LIMIT 1").bind(account.id).first();
 const paid=!ambassadorActive&&admission?.account_id===account.id?await loadMembership(account.id,env):null;
 const membership={...paid,disabled:false,ambassadorActive};
 const plan=effectivePlan(membership,now);
 if(!plan)return reply(200,{canAttend:false,canHost:false});
 const date=new Date(now),from=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1),periodEnd=Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1);
 const budget=attendanceLimits(membership,now).monthly*LIMITS.durationMs/60000;
 const usage=now===from?{usedMs:0,usedMinutes:0,remainingMs:budget*60000,remainingMinutes:budget}:await transmissionUsage(env.DB,account.id,from,now,budget);
 const room=await env.DB.prepare('SELECT r.started_at AS startedAt,r.expires_at AS expiresAt FROM transmission_rooms r WHERE r.closed_at IS NULL AND r.started_at<=? AND r.expires_at>? AND (r.host_account_id=? OR EXISTS(SELECT 1 FROM transmission_attendance a WHERE a.transmission_id=r.id AND a.account_id=? AND a.left_at IS NULL)) LIMIT 1').bind(now,now,account.id,account.id).first();
 return reply(200,publicTransmissionStatus({plan,usage,periodEnd,session:room,available:env.STOP_SERVICE!=='true'&&usage.remainingMs>0&&await loadAvailability(env)===true},now));
 }catch{return unavailable();}
}

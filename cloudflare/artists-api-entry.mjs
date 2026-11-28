import {readVerifiedFinanceLedger,readFinanceHistory} from './finance-ledger-read.mjs';
import {financeOwnerPanel} from './finance-owner-panel.mjs';
import {privateFinanceSnapshot} from './hive-finance-dashboard.mjs';
import {privateOpportunityApi} from './hive-private-opportunities.mjs';
import {professionalProfilesApi} from './professional-profiles-api.mjs';
import {professionalProfilePortal} from './professional-profile-portal.mjs';
import {SECTORS} from './professional-profile-schema.mjs';
import {authorize} from './authorization-policy.mjs';
import {ownerAuth} from './owner-auth.mjs';
import {ownerPortal} from './owner-portal.mjs';
import {supportApi} from './support-api.mjs';
import {supportPortal} from './support-portal.mjs';
import {queueIncident} from './incident-alerts.mjs';
import {accountRegistration,registrationConfigured} from './account-registration.mjs';
import {payhipWebhook} from './payhip-admission.mjs';
import {authReadiness,checkAuthRate} from './auth-readiness.mjs';
// Unified entry point for studiosb6l-artists-api. Deployment configuration and
// the existing D1 binding must be verified before enabling repository builds.
import {trustedAuthOrigin,authResponseOrigin} from './auth-origins.mjs';
import {accountPortal} from './account-portal.mjs';
import {resolveSession} from './session-guard.mjs';
import {login} from './login-worker.mjs';
import logout from './logout-worker.mjs';
import applications from './artists-registration-worker.js';
const ORIGIN='https://www.studiosb6l.com';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Vary':'Origin'};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
async function dispatch(request,env={},ctx){
  const path=new URL(request.url).pathname;
  // Preview blocks all mutations, including signed webhooks, even if a base
  // configuration unexpectedly supplies production bindings or secrets.
  if(env.PREVIEW_ISOLATED==='true'){
    if(path==='/health'&&request.method==='GET')return reply(200,{ok:true,service:'studiosb6l-artists-api',environment:'preview',operationsEnabled:false});
    return reply(503,{success:false,error:'Preview operations are disabled'});
  }
  if(['/administracao','/administracao/'].includes(path)&&request.method==='GET')return ownerPortal();
  if(['/api/admin/finance','/administracao/financas/'].includes(path)){
    if(request.method!=='GET')return reply(405,{error:'Method not allowed'});
    const origin=request.headers.get('Origin');
    if(origin&&!trustedAuthOrigin(origin))return reply(403,{error:'Forbidden'});
    const session=await resolveSession(request,env);
    if(!authorize(session,'admin:read'))return reply(403,{error:'Forbidden'});
    // No trusted live ledger adapter yet: never fabricate financial figures.
    const now=Date.now();
    const monthStart=Date.UTC(new Date(now).getUTCFullYear(),new Date(now).getUTCMonth(),1);
    let admission={status:'unavailable'};
    if(env.DB&&env.PAYHIP_ACTIVATION_VERIFIED==='true'){
      try{
        const row=await env.DB.prepare('SELECT COUNT(*) AS paid_count FROM payhip_admission_payments WHERE paid_at>=? AND paid_at<=? AND revoked_at IS NULL').bind(monthStart,now).first();
        const count=row?.paid_count;
        if(Number.isSafeInteger(count)&&count>=0&&Number.isSafeInteger(count*299))
          admission={status:'recorded',currency:'EUR',periodStart:monthStart,observedAt:now,activeAdmissionCount:count,grossAdmissionCents:count*299,scope:'recorded non-revoked admission payments only; excludes fees, other sales and settlement'};
      }catch{/* Missing database or schema must not be reported as zero. */}
    }
    // Read existing verified quota windows; ceiling is a policy cap, not the provider limit.
    let quotaWindows=[];
    try{
      const result=await env.DB.prepare('SELECT service, window_id, used, reserved, ceiling, observed_at, expires_at, verified, stopped FROM hive_quota_windows WHERE expires_at>? ORDER BY service, window_id LIMIT 100').bind(now).all();
      quotaWindows=(result.results||[]).map(q=>{
        const valid=q.verified===1&&Number.isSafeInteger(q.observed_at)&&q.observed_at<=now&&now-q.observed_at<=300000&&[q.used,q.reserved,q.ceiling].every(v=>Number.isSafeInteger(v)&&v>=0)&&q.ceiling>0&&Number.isSafeInteger(q.used+q.reserved);
        return {service:q.service,windowId:q.window_id,status:valid?'verified':'unavailable',...(valid?{used:q.used,reserved:q.reserved,ceiling:q.ceiling,observedAt:q.observed_at,stopped:q.stopped!==0}:{})};
      });
    }catch{/* No verified quota windows available. */}
    const ledger=await readVerifiedFinanceLedger(env.DB,now);
    if(ledger&&env.STOP_SERVICE==='true')ledger.stopped=true;
    const history=await readFinanceHistory(env.DB,now);
    const snapshot={...privateFinanceSnapshot(session,{now,ledger}),admission,quotaWindows,history,stopService:env.STOP_SERVICE==='true'};
    return path==='/administracao/financas/'?financeOwnerPanel(snapshot):reply(200,snapshot);
  }
  if(path.startsWith('/api/admin/'))return ownerAuth(request,env,ctx);
  if(['/ajuda','/ajuda/'].includes(path)&&request.method==='GET')return supportPortal();
  if(path.startsWith('/api/support/'))return supportApi(request,env,ctx);
  if(path==='/api/billing/payhip/webhook')return payhipWebhook(request,env);
  if(path.startsWith('/api/billing/stripe/'))return reply(404,{error:'Not found'});
  const origin=request.headers.get('Origin');
  if(origin&&!trustedAuthOrigin(origin))return reply(403,{error:'Forbidden'});
  if(env.STOP_SERVICE==='true')return reply(503,{error:'Serviço suspenso'});
  if(path==='/api/hive/opportunities')return privateOpportunityApi(request,env);
  if(path.startsWith('/api/profiles/'))return professionalProfilesApi(request,env,ctx);
  if(['/perfis/editar/','/perfis/revisao/'].includes(path)&&request.method==='GET'){
    if(env.PROFESSIONAL_PROFILES_ENABLED!=='true')return reply(503,{error:'Perfis profissionais em preparação.'});
    const session=await resolveSession(request,env),admin=path==='/perfis/revisao/';
    if(!session)return Response.redirect(new URL('/conta/'+new URL(request.url).search,request.url).href,302);
    if(!authorize(session,admin?'applications:review':'profile:edit'))return reply(403,{error:'Forbidden'});
    return professionalProfilePortal({admin});
  }
  if(['/conta','/conta/'].includes(path)&&request.method==='GET'){
    const readiness=await authReadiness(env);
    return accountPortal({...env,RUNTIME_READY:readiness.enabled,REGISTRATION_READY:readiness.enabled&&registrationConfigured(env),PROFILE_AREA:Object.hasOwn(SECTORS,new URL(request.url).searchParams.get('area'))?new URL(request.url).searchParams.get('area'):''});
  }
  if(path==='/api/auth/status'&&request.method==='GET'){
    const limited=await checkAuthRate(request,env);
    if(limited)return reply(limited,{success:false,error:'Service unavailable'});
    const readiness=await authReadiness(env);
    return reply(200,{success:true,...readiness,registrationEnabled:readiness.enabled&&registrationConfigured(env),profilesEnabled:env.PROFESSIONAL_PROFILES_ENABLED==='true'});
  }
  if(path==='/api/auth/session'&&request.method==='GET'){
    const session=await resolveSession(request,env);
    return session?reply(200,{success:true,user:{id:session.userId,role:session.role}}):reply(401,{success:false,error:'Unauthorized'});
  }
  if(path==='/health'&&request.method==='GET')return reply(200,{ok:true,service:'studiosb6l-artists-api'});
  if(path.startsWith('/api/auth/')){
    if(!['/api/auth/login','/api/auth/logout','/api/auth/register','/api/auth/verify-email'].includes(path))return reply(404,{error:'Not found'});
    if(request.method==='OPTIONS'){
      if(!trustedAuthOrigin(origin))return reply(403,{error:'Forbidden'});
      return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
    }
    if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
    if(path==='/api/auth/login'){
      const limited=await checkAuthRate(request,env);
      if(limited)return reply(limited,{success:false,error:limited===429?'Too many attempts':'Login unavailable'});
      if(!(await authReadiness(env)).enabled)return reply(503,{success:false,error:'Login unavailable'});
      return login(request,{...env,RATE_LIMIT_VERIFIED:'true'});
    }
    if(path==='/api/auth/logout')return logout.fetch(request,env);
    return accountRegistration(request,env);
  }
  return applications.fetch(request,env);
}
export default {async fetch(request,env={},ctx){
 let response;
 try{response=await dispatch(request,env,ctx);}catch{response=reply(503,{error:'Service unavailable'});}
 const path=new URL(request.url).pathname;
 if(response.status>=500&&env.PREVIEW_ISOLATED!=='true'&&env.STOP_SERVICE!=='true'&&['/api/auth/login','/api/auth/register','/api/auth/verify-email','/api/billing/payhip/webhook','/api/support/tickets'].includes(path)){
  const pending=queueIncident(env,ctx,'service-error');
  if(!ctx?.waitUntil)await pending;
 }
 return response;
}};

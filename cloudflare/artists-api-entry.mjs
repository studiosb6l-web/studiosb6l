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

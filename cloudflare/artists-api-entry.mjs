import {admissionWebhook} from './admission-billing.mjs';
import {checkProAccess} from './pro-d1-access.mjs';
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
export default {async fetch(request,env={}){
  const path=new URL(request.url).pathname;
  if(path==='/api/billing/stripe/webhook')return admissionWebhook(request,env);
  const origin=request.headers.get('Origin');
  if(origin&&!trustedAuthOrigin(origin))return reply(403,{error:'Forbidden'});
  if(env.STOP_SERVICE==='true')return reply(503,{error:'Serviço suspenso'});
  if(['/conta','/conta/'].includes(path)&&request.method==='GET')return accountPortal({...env,RUNTIME_READY:(await authReadiness(env)).enabled});
  if(path==='/api/auth/status'&&request.method==='GET'){
    // Public, read-only readiness probe: never requires a client IP or consumes
    // authentication rate-limit quota. Real login stays rate-limited and fail-closed.
    const {enabled}=await authReadiness(env);
    return reply(200,{success:true,enabled});
  }
  if(path==='/api/pro/access'&&request.method==='GET'){
    const limited=await checkAuthRate(request,env);
    if(limited)return reply(limited,{success:false,error:'Service unavailable'});
    const session=await resolveSession(request,env);
    if(!session)return reply(401,{success:false,error:'Unauthorized'});
    const capability=new URL(request.url).searchParams.get('capability');
    const allowed=await checkProAccess({db:env.DB,session,capability});
    return reply(200,{success:true,allowed});
  }
  if(path==='/api/auth/session'&&request.method==='GET'){
    const session=await resolveSession(request,env);
    return session?reply(200,{success:true,user:{id:session.userId,role:session.role}}):reply(401,{success:false,error:'Unauthorized'});
  }
  if(path==='/health'&&request.method==='GET')return reply(200,{ok:true,service:'studiosb6l-artists-api'});
  if(path.startsWith('/api/auth/')){
    if(!['/api/auth/login','/api/auth/logout','/api/auth/register'].includes(path))return reply(404,{error:'Not found'});
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
    // Account registration needs verified identity and payment provisioning.
    return reply(503,{success:false,error:'O registo de contas ainda não está disponível.'});
  }
  return applications.fetch(request,env);
}};

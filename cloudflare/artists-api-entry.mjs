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
  if(['/administracao/painel','/administracao/painel/'].includes(path)&&request.method==='GET'){
    const session=await resolveSession(request,env);
    if(!authorize(session,'admin:read'))return reply(403,{error:'Forbidden'});
    const stopped=env.STOP_SERVICE==='true';
    const count=async(sql,...args)=>{try{const row=await env.DB.prepare(sql).bind(...args).first();return Number.isSafeInteger(row?.n)&&row.n>=0?String(row.n):'Dados indisponíveis';}catch{return 'Dados indisponíveis';}};
    const [users,active,newUsers,payments,tickets]=await Promise.all([
      count("SELECT COUNT(*) AS n FROM accounts WHERE role!='owner'"),
      count("SELECT COUNT(*) AS n FROM accounts WHERE role!='owner' AND verified=1 AND disabled=0"),
      count("SELECT COUNT(*) AS n FROM accounts WHERE role!='owner' AND created_at>=?",Date.now()-30*86400000),
      count("SELECT COUNT(*) AS n FROM payhip_admission_payments WHERE revoked_at IS NULL"),
      count("SELECT COUNT(*) AS n FROM support_tickets WHERE status='open'")
    ]);
    const today=new Date();today.setUTCHours(0,0,0,0);
    const days=Array.from({length:7},(_,i)=>today.getTime()-(6-i)*86400000);
    let series=null;
    try{
      const rows=await env.DB.prepare("SELECT CAST(created_at / 86400000 AS INTEGER) AS day, COUNT(*) AS n FROM accounts WHERE role!='owner' AND created_at>=? AND created_at<? GROUP BY day ORDER BY day").bind(days[0],today.getTime()+86400000).all();
      if(Array.isArray(rows.results)&&rows.results.every(x=>Number.isSafeInteger(x.day)&&Number.isSafeInteger(x.n)&&x.n>=0))series=days.map(d=>rows.results.find(x=>x.day===d/86400000)?.n??0);
    }catch{}
    const chart=series===null?'Dados indisponíveis':days.map((d,i)=>'<div>'+new Date(d).toISOString().slice(5,10)+' — '+series[i]+' <span style="display:inline-block;background:#e1bf78;height:10px;width:'+Math.round(100*series[i]/Math.max(1,...series))+'%"></span></div>').join('');
    const html='<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>STUDIOSB6L | Centro de comando</title><style>body{background:#0a1019;color:#f4f0e8;font:17px system-ui;margin:24px}main{max-width:1000px;margin:auto}h1,h2,a{color:#e1bf78}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}article{background:#142337;border:1px solid #75623b;border-radius:12px;padding:18px}</style><main><h1>STUDIOSB6L — Centro de comando</h1><p>Sessão administrativa verificada. Indicadores não integrados são apresentados como indisponíveis.</p><p>Consulta: '+new Date().toISOString()+' UTC · <a href="/administracao/painel/">Atualizar indicadores</a></p><section><article><h2>STOP_SERVICE</h2><p>'+ (stopped?'Ativo':'Inativo') +'</p><p>Estado da configuração; não representa todas as automações.</p></article><article><h2>Visitas</h2><p>Dados indisponíveis</p></article><article><h2>Utilizadores</h2><p>Total: '+users+'</p><p>Contas verificadas e habilitadas: '+active+'</p><p>Novos (30 dias): '+newUsers+'</p></article><article><h2>Novos registos — 7 dias UTC</h2>'+chart+'</article><article><h2>Receitas</h2><p>Pagamentos de entrada não revogados: '+payments+'</p><p>Receitas reconciliadas: indisponíveis</p><p>Despesas verificadas: indisponíveis</p><p>Lucro: indisponível</p></article><article><h2>Consumos por fornecedor</h2><p>Cloudflare Workers: indisponível</p><p>D1: indisponível</p><p>Armazenamento: indisponível</p><p>Brevo: indisponível</p><p>Robôs e APIs: indisponível</p><p>Limite operacional 70% — reserva 30%</p></article><article><h2>Suporte e perfis</h2><p>Pedidos abertos: '+tickets+'</p><p><a href="/ajuda/">Suporte</a> · <a href="/perfis/revisao/">Moderação</a></p></article></section><p><a href="/administracao/">Voltar à administração</a></p></main></html>';
    return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});
  }
  if(path.startsWith('/api/admin/'))return ownerAuth(request,env,ctx);
  if(['/ajuda','/ajuda/'].includes(path)&&request.method==='GET')return supportPortal();
  if(path.startsWith('/api/support/'))return supportApi(request,env,ctx);
  if(path==='/api/billing/payhip/webhook')return payhipWebhook(request,env);
  if(path.startsWith('/api/billing/stripe/'))return reply(404,{error:'Not found'});
  const origin=request.headers.get('Origin');
  if(origin&&!trustedAuthOrigin(origin))return reply(403,{error:'Forbidden'});
  if(env.STOP_SERVICE==='true')return reply(503,{error:'Serviço suspenso'});
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

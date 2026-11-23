// Unified entry point for studiosb6l-artists-api. Deployment configuration and
// the existing D1 binding must be verified before enabling repository builds.
import {login} from './login-worker.mjs';
import logout from './logout-worker.mjs';
import applications from './artists-registration-worker.js';
const ORIGIN='https://www.studiosb6l.com';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Vary':'Origin'};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
export default {async fetch(request,env={}){
  const path=new URL(request.url).pathname;
  const origin=request.headers.get('Origin');
  if(origin&&origin!==ORIGIN)return reply(403,{error:'Forbidden'});
  if(env.STOP_SERVICE==='true')return reply(503,{error:'Serviço suspenso'});
  if(path==='/health'&&request.method==='GET')return reply(200,{ok:true,service:'studiosb6l-artists-api'});
  if(path.startsWith('/api/auth/')){
    if(!['/api/auth/login','/api/auth/logout','/api/auth/register'].includes(path))return reply(404,{error:'Not found'});
    if(request.method==='OPTIONS'){
      if(origin!==ORIGIN)return reply(403,{error:'Forbidden'});
      return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
    }
    if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
    if(path==='/api/auth/login')return login(request,env);
    if(path==='/api/auth/logout')return logout.fetch(request,env);
    // Account registration needs verified identity and payment provisioning.
    return reply(503,{success:false,error:'O registo de contas ainda não está disponível.'});
  }
  return applications.fetch(request,env);
}};

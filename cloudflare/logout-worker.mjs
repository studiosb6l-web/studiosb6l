// STUDIOSB6L — logout endpoint for a verified opaque cookie or API bearer session.
// This endpoint does not create sessions or handle passwords.
import {resolveSession} from './session-guard.mjs';
import {requestSessionToken,hashSessionToken,clearSessionCookie} from './session-tokens.mjs';
export default {async fetch(request,env){
  const url=new URL(request.url);
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'https://www.studiosb6l.com','Access-Control-Allow-Credentials':'true','Vary':'Origin'};
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if(url.pathname!=='/api/auth/logout'||request.method!=='POST')return reply(404,{error:'Not found'});
  if(request.headers.get('Origin')!=='https://www.studiosb6l.com')return reply(403,{error:'Forbidden'});
  if(!env?.DB)return reply(503,{error:'Service unavailable'});
  const session=await resolveSession(request,env);
  if(!session)return reply(401,{error:'Unauthorized'});
  const token=requestSessionToken(request);
  if(!token)return reply(401,{error:'Unauthorized'});
  const hash=await hashSessionToken(token);
  try{
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ? AND user_id = ?').bind(hash,session.userId).run();
    headers['Set-Cookie']=clearSessionCookie();
    return reply(200,{success:true});
  }catch{return reply(503,{error:'Service unavailable'})}
}};

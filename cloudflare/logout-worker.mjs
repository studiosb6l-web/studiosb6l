// STUDIOSB6L — logout endpoint for a verified opaque bearer session.
// This endpoint does not create sessions or handle passwords.
import {resolveSession} from './session-guard.mjs';
export default {async fetch(request,env){
  const url=new URL(request.url);
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if(url.pathname!=='/api/auth/logout'||request.method!=='POST')return reply(404,{error:'Not found'});
  if(request.headers.get('Origin')!=='https://www.studiosb6l.com')return reply(403,{error:'Forbidden'});
  if(!env?.DB)return reply(503,{error:'Service unavailable'});
  const session=await resolveSession(request,env);
  if(!session)return reply(401,{error:'Unauthorized'});
  const match=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.get('Authorization')||'');
  if(!match)return reply(401,{error:'Unauthorized'});
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(match[1])));
  const hash=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  try{
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ? AND user_id = ?').bind(hash,session.userId).run();
    return reply(200,{success:true});
  }catch{return reply(503,{error:'Service unavailable'})}
}};

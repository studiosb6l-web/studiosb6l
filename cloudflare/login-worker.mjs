// STUDIOSB6L login backend. Requires D1 migrations, owner MFA provider and edge rate limits.
// Browser deployment requires /api/auth/* on the official origin (or a same-site API host).
// The current workers.dev frontend URL is cross-site and cannot use this Strict cookie.
// NOT DEPLOYED. Owner accounts are fail-closed until MFA has been verified by a trusted provider.
import {verifyPassword} from './password-verifier.mjs';
import {createSessionToken,sessionCookie} from './session-tokens.mjs';
const ORIGIN='https://www.studiosb6l.com';
const reply=(status,body,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Access-Control-Allow-Credentials':'true',...headers}});
const emailPattern=/^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{2,50}$/;
export async function login(request,env){
  if(request.method!=='POST'||new URL(request.url).pathname!=='/api/auth/login')return reply(404,{error:'Not found'});
  if(request.headers.get('Origin')!==ORIGIN)return reply(403,{error:'Forbidden'});
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply(415,{error:'JSON required'});
  if(!env?.DB||env.LOGIN_ENABLED!=='true'||env.RATE_LIMIT_VERIFIED!=='true')return reply(503,{error:'Login unavailable'});
  const len=Number(request.headers.get('Content-Length'));if(Number.isFinite(len)&&len>2048)return reply(413,{error:'Too large'});
  let raw;try{raw=await request.text()}catch{return reply(400,{error:'Invalid request'})}
  if(raw.length>2048)return reply(413,{error:'Too large'});
  let data;try{data=JSON.parse(raw)}catch{return reply(400,{error:'Invalid request'})}
  if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.email!=='string'||typeof data.password!=='string')return reply(400,{error:'Invalid request'});
  const email=data.email.trim().toLowerCase();
  if(!emailPattern.test(email)||data.password.length>128)return reply(401,{error:'Invalid credentials'});
  try{
    const account=await env.DB.prepare('SELECT id,role,password_hash,verified,disabled FROM accounts WHERE email = ? LIMIT 1').bind(email).first();
    // Always return the same generic error for unknown, disabled and wrong-password accounts.
    if(!account||account.verified!==1||account.disabled===1||!await verifyPassword(data.password,account.password_hash))return reply(401,{error:'Invalid credentials'});
    // Owner MFA must be completed through a separately verified server-side challenge.
    // This endpoint never accepts a browser-supplied MFA success flag.
    if(account.role==='owner')return reply(403,{error:'Additional verification required'});
    const allowed=['artist','producer','promoter','venue','company','student'];
    if(!allowed.includes(account.role))return reply(403,{error:'Forbidden'});
    const {token,hash}=await createSessionToken();
    const expiry=Date.now()+30*60*1000;
    await env.DB.prepare('INSERT INTO sessions (token_hash,user_id,role,verified,mfa_verified,disabled,expires_at) VALUES (?,?,?,?,?,?,?)').bind(hash,account.id,account.role,1,0,0,expiry).run();
    return reply(200,{success:true,user:{id:account.id,role:account.role},expiresAt:expiry},{'Set-Cookie':sessionCookie(token)});
  }catch{return reply(503,{error:'Login unavailable'})}
}
export default {fetch:login};

// STUDIOSB6L: account registration remains pending until email verification and payment.
// No account is activated from an untrusted browser redirect.
import {hashPassword} from './password-verifier.mjs';
import {trustedAuthOrigin} from './auth-origins.mjs';
const roles=new Set(['artist','producer','promoter','venue','company','student']);
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function register(request,env){
  if(request.method!=='POST')return response(405,{success:false,error:'Method not allowed'});
  if(!trustedAuthOrigin(request.headers.get('Origin')))return response(403,{success:false,error:'Forbidden'});
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return response(415,{success:false,error:'JSON required'});
  // Fail closed: the operator must confirm that verified email delivery,
  // migrations and billing reconciliation are available before public rollout.
  if(env.REGISTRATION_ENABLED!=='true'||env.EMAIL_VERIFICATION_READY!=='true'||env.BILLING_RECONCILIATION_READY!=='true'||!env.DB)return response(503,{success:false,error:'Inscrições temporariamente indisponíveis'});
  const length=Number(request.headers.get('Content-Length'));
  if(Number.isFinite(length)&&length>2048)return response(413,{success:false,error:'Too large'});
  let raw;try{raw=await request.text()}catch{return response(400,{success:false,error:'Invalid request'});}
  if(raw.length>2048)return response(413,{success:false,error:'Too large'});
  let data;try{data=JSON.parse(raw)}catch{return response(400,{success:false,error:'Invalid JSON'});}
  if(!data||typeof data!=='object'||Array.isArray(data))return response(400,{success:false,error:'Invalid data'});
  const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
  if(!/^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{2,50}$/.test(email)||!roles.has(data.role)||typeof data.password!=='string'||data.password.length<12||data.password.length>128)return response(400,{success:false,error:'Dados de inscrição inválidos'});
  const id=crypto.randomUUID();
  const reference=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  const referenceHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(reference))),x=>x.toString(16).padStart(2,'0')).join('');
  let passwordHash;try{passwordHash=await hashPassword(data.password);}catch{return response(503,{success:false,error:'Temporarily unavailable'});}
  try{
    await env.DB.batch([
      env.DB.prepare('INSERT INTO accounts (id,email,role,password_hash,verified,disabled,created_at) VALUES (?,?,?,?,0,0,?)').bind(id,email,data.role,passwordHash,Date.now()),
      env.DB.prepare('INSERT INTO account_onboarding (account_id,checkout_reference_hash) VALUES (?,?)').bind(id,referenceHash)
    ]);
  }catch{return response(409,{success:false,error:'Não foi possível criar a inscrição. Verifica os dados ou contacta o apoio.'});}
  // Reference is intentionally not returned until a verified email delivery
  // integration can send it through an authenticated server-side channel.
  return response(202,{success:true,status:'pending_verification',message:'Inscrição recebida. Aguarda confirmação por email antes do pagamento.'});
}

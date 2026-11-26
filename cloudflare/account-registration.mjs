import {redeemAmbassadorInvite} from './ambassador-redemption.mjs';
import {SECTORS} from './professional-profile-schema.mjs';
import {payhipConfigured,payhipCheckout} from './payhip-admission.mjs';
import {emailConfigured,reserveEmail,sendVerificationEmail} from './registration-email.mjs';
import {trustedAuthOrigin,authResponseOrigin} from './auth-origins.mjs';
import {authReadiness,checkAuthRate} from './auth-readiness.mjs';
import {hashPassword,verifyPassword} from './password-verifier.mjs';
import {createSessionToken,hashSessionToken} from './session-tokens.mjs';
const roles=new Set(['artist','producer','promoter','venue','company','student']);
const accepted={success:true,message:'Se o pedido puder ser aceite, receberás um email para continuar.'};
async function admissionReference(id,secret){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('studiosb6l-admission-v1:'+id)));
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function registrationConfigured(env){return typeof env?.ADMISSION_REFERENCE_SECRET==='string'&&env.ADMISSION_REFERENCE_SECRET.length>=32&&env?.REGISTRATION_ENABLED==='true'&&!!env.DB&&emailConfigured(env)&&payhipConfigured(env);}
async function readJson(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return {status:415};
 const reader=request.body?.getReader();if(!reader)return {status:400};
 const chunks=[];let n=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;n+=value.byteLength;if(n>2048){await reader.cancel();return {status:413};}chunks.push(value);}
 const bytes=new Uint8Array(n);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const data=JSON.parse(new TextDecoder().decode(bytes));return data&&typeof data==='object'&&!Array.isArray(data)?{data}:{status:400};}catch{return {status:400};}
}
export async function accountRegistration(request,env={}){
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Vary':'Origin'}});
 if(!trustedAuthOrigin(request.headers.get('Origin')))return reply(403,{success:false,error:'Forbidden'});
 if(request.method!=='POST')return reply(405,{success:false,error:'Method not allowed'});
 if(!registrationConfigured(env))return reply(503,{success:false,error:'Registration unavailable'});
 const limited=await checkAuthRate(request,env);if(limited)return reply(limited,{success:false,error:'Service unavailable'});
 if(!(await authReadiness(env)).enabled)return reply(503,{success:false,error:'Registration unavailable'});
 const input=await readJson(request);if(input.status)return reply(input.status,{success:false,error:'Invalid request'});
 const data=input.data,path=new URL(request.url).pathname;
 if(path==='/api/auth/verify-email'){
  if(typeof data.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.token))return reply(400,{success:false,error:'Invalid verification'});
  try{
   const hash=await hashSessionToken(data.token),now=Date.now();
   const token=await env.DB.prepare('SELECT account_id FROM account_email_verifications WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?').bind(hash,now).first();
   if(!token)return reply(400,{success:false,error:'Invalid or expired verification'});
   // The transaction consumes the token once; it never accepts a client-supplied
   // verification flag, role, paid state, or return-page activation.
   const results=await env.DB.batch([
    env.DB.prepare('UPDATE account_email_verifications SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?').bind(now,hash,now),
    env.DB.prepare('UPDATE account_onboarding SET email_verified_at=COALESCE(email_verified_at,?) WHERE account_id=? AND EXISTS(SELECT 1 FROM account_email_verifications WHERE token_hash=? AND consumed_at=?)').bind(now,token.account_id,hash,now)
   ]);
   if(Number(results[0]?.meta?.changes)!==1)return reply(400,{success:false,error:'Invalid or expired verification'});
   if(env.AMBASSADOR_ENABLED==='true'&&typeof data.inviteToken==='string'&&/^[a-f0-9]{64}$/.test(data.inviteToken)){
    const redeemed=await redeemAmbassadorInvite(env,token.account_id,data.inviteToken);
    if(redeemed)return reply(200,{success:true,emailVerified:true,ambassadorActive:true,amount:0});
   }
   const url=payhipCheckout(env);
   return reply(200,{success:true,emailVerified:true,checkoutUrl:url.href,amount:299,currency:'eur',paymentProvider:'payhip',sameEmailRequired:true,...(data.inviteToken!==undefined?{invitationAccepted:false}:{})});
  }catch{return reply(503,{success:false,error:'Verification unavailable'});}
 }
 if(path!=='/api/auth/register')return reply(404,{success:false,error:'Not found'});
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(!/^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{2,50}$/.test(email)||email.length>254||!roles.has(data.role)||typeof data.password!=='string'||data.password.length<12||data.password.length>128||new TextEncoder().encode(data.password).length>512||data.acceptTerms!==true)return reply(400,{success:false,error:'Invalid registration'});
 try{
  // Generic responses prevent disclosing which email addresses have accounts.
  const existing=await env.DB.prepare('SELECT a.id,a.password_hash,a.verified,a.disabled,o.email_verified_at,o.paid_at FROM accounts a LEFT JOIN account_onboarding o ON o.account_id=a.id WHERE a.email=? LIMIT 1').bind(email).first();
  if(existing&&(existing.verified!==0||existing.disabled!==0||existing.paid_at!==null||!await verifyPassword(data.password,existing.password_hash)))return reply(202,accepted);
  const id=existing?.id||crypto.randomUUID(),{token,hash}=await createSessionToken(),now=Date.now();
  const reference=await admissionReference(id,env.ADMISSION_REFERENCE_SECRET),referenceHash=await hashSessionToken(reference);
  let reservation;
  if(existing){
   const lock=await env.DB.prepare('SELECT available_after FROM account_email_send_locks WHERE account_id=?').bind(id).first();
   if(lock&&lock.available_after>now)return reply(202,accepted);
   reservation=await reserveEmail(env,id,now);
   if(!reservation.allowed)return reply(202,accepted);
   await env.DB.batch([
    env.DB.prepare('DELETE FROM account_email_verifications WHERE account_id=?').bind(id),
    env.DB.prepare('UPDATE account_onboarding SET checkout_reference_hash=? WHERE account_id=? AND paid_at IS NULL').bind(referenceHash,id),
    env.DB.prepare('INSERT INTO account_email_verifications(token_hash,account_id,expires_at,terms_accepted_at) VALUES(?,?,?,?)').bind(hash,id,now+30*60*1000,now)
   ]);
  }else{
   const passwordHash=await hashPassword(data.password);
   await env.DB.batch([
    env.DB.prepare('INSERT INTO accounts(id,email,role,password_hash,verified,disabled,created_at) VALUES(?,?,?,?,0,0,?)').bind(id,email,data.role,passwordHash,now),
    env.DB.prepare('INSERT INTO account_onboarding(account_id,checkout_reference_hash) VALUES(?,?)').bind(id,referenceHash),
    env.DB.prepare('INSERT INTO account_email_verifications(token_hash,account_id,expires_at,terms_accepted_at) VALUES(?,?,?,?)').bind(hash,id,now+30*60*1000,now)
   ]);
  }
  reservation=reservation||await reserveEmail(env,id,now);
  if(!reservation.allowed)return reply(503,{success:false,error:'Email temporarily unavailable'});
  const delivered=await sendVerificationEmail(env,{to:email,verificationUrl:'https://www.studiosb6l.com/conta/'+(Object.hasOwn(SECTORS,data.area)?'?area='+encodeURIComponent(data.area):'')+'#verify='+token});
  if(!delivered){
   await env.DB.prepare('DELETE FROM account_email_send_locks WHERE account_id=? AND available_after=?').bind(id,reservation.until).run();
   return reply(503,{success:false,error:'Email delivery unavailable'});
  }
  return reply(202,accepted);
 }catch(error){const emailFailure=/^Email provider (invalid-header|timeout|transport)$/.exec(error?.message||'');if(emailFailure)return reply(503,{success:false,error:'Email delivery unavailable',code:emailFailure[1]});if(/UNIQUE constraint failed/i.test(String(error)))return reply(202,accepted);return reply(503,{success:false,error:'Registration unavailable'});}
}

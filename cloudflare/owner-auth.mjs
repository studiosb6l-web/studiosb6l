import {checkAuthRate,authReadiness} from './auth-readiness.mjs';
import {trustedAuthOrigin,authResponseOrigin} from './auth-origins.mjs';
import {hashPassword,verifyPassword} from './password-verifier.mjs';
import {createSessionToken,hashSessionToken,sessionCookie} from './session-tokens.mjs';
import {newTotpSecret,encryptSeed,decryptSeed,matchTotp,newRecoveryCodes,hashRecovery,totp} from './owner-crypto.mjs';
import {ownerEmail} from './owner-email.mjs';
export function ownerConfigured(env){return env.OWNER_ADMIN_ENABLED==='true'&&env.OWNER_EMAIL==='studiosb6l@gmail.com'&&typeof env.OWNER_MFA_ENCRYPTION_KEY==='string'&&env.OWNER_MFA_ENCRYPTION_KEY.length>=43&&!!env.DB;}
async function readJson(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return null;
 const reader=request.body?.getReader();if(!reader)return null;const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();return null;}chunks.push(value);}
 const bytes=new Uint8Array(size);let i=0;for(const v of chunks){bytes.set(v,i);i+=v.length;}
 try{const d=JSON.parse(new TextDecoder().decode(bytes));return d&&typeof d==='object'&&!Array.isArray(d)?d:null;}catch{return null;}
}
async function reserve(env,scope,cap){const r=await env.DB.prepare('INSERT INTO owner_auth_limits(scope,used) VALUES(?,1) ON CONFLICT(scope) DO UPDATE SET used=used+1 WHERE owner_auth_limits.used<?').bind(scope,cap).run();return Number(r?.meta?.changes)===1;}
export async function ownerAuth(request,env={},ctx){
 const reply=(status,body,extra={})=>new Response(status===204?null:JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Vary':'Origin',...extra}});
 if(env.PREVIEW_ISOLATED==='true'||!ownerConfigured(env))return reply(503,{error:'Acesso administrativo indisponível.'});
 const path=new URL(request.url).pathname;
 if(request.method==='OPTIONS')return trustedAuthOrigin(request.headers.get('Origin'))?reply(204,null,{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}):reply(403,{error:'Forbidden'});
 const limited=await checkAuthRate(request,env);if(limited)return reply(limited,{error:'Aguarda antes de tentar novamente.'});
 if(path==='/api/admin/status'&&request.method==='GET'){
  try{await env.DB.prepare('SELECT COUNT(*) n FROM owner_mfa').first();const fixture='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';const encrypted=await encryptSeed(env,fixture,'runtime-canary');if(await decryptSeed(env,encrypted,'runtime-canary')!==fixture||await totp(fixture,1,8)!=='94287082'||!(await authReadiness(env)).enabled)throw Error('Runtime unavailable');return reply(200,{success:true,configured:true});}catch{return reply(503,{error:'Configuração administrativa indisponível.'});}
 }
 if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
 if(!trustedAuthOrigin(request.headers.get('Origin')))return reply(403,{error:'Forbidden'});
 if(!['/api/admin/bootstrap/request','/api/admin/bootstrap/info','/api/admin/bootstrap/complete','/api/admin/login'].includes(path))return reply(404,{error:'Not found'});
 if(env.STOP_SERVICE==='true'&&path!=='/api/admin/login')return reply(503,{error:'Serviço suspenso.'});
 let data;try{data=await readJson(request);}catch{}if(!data)return reply(400,{error:'Pedido inválido.'});
 const now=Date.now(),db=env.DB;
 try{
  if(path==='/api/admin/bootstrap/request'){
   const accepted={success:true,message:'Se a ativação inicial estiver disponível, a ligação será enviada para o email oficial. Verifica também o spam. Se já ativaste o acesso, usa Entrar.'};
   if(env.OWNER_BOOTSTRAP_ENABLED!=='true')return reply(202,accepted);
   if(await db.prepare('SELECT account_id FROM owner_mfa LIMIT 1').first())return reply(202,accepted);
   const owners=await db.prepare("SELECT email FROM accounts WHERE role='owner' LIMIT 2").all();if(owners.results.some(a=>a.email!==env.OWNER_EMAIL))return reply(202,accepted);
   const account=await db.prepare('SELECT id,disabled FROM accounts WHERE email=?').bind(env.OWNER_EMAIL).first();if(account?.disabled===1)return reply(202,accepted);
   const pending=await db.prepare('SELECT expires_at,consumed_at FROM owner_bootstrap WHERE id=1').first();if(pending&&!pending.consumed_at&&pending.expires_at>now)return reply(202,accepted);
   if(!await reserve(env,'bootstrap:'+new Date(now).toISOString().slice(0,10),3))return reply(429,{error:'Limite diário de ativações atingido. Tenta mais tarde.'});
   const accountId=account?.id||crypto.randomUUID(),{token,hash}=await createSessionToken(),encrypted=await encryptSeed(env,newTotpSecret(),accountId);
   const r=await db.prepare('INSERT INTO owner_bootstrap VALUES(1,?,?,?,?,0,NULL) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id,token_hash=excluded.token_hash,secret_ciphertext=excluded.secret_ciphertext,expires_at=excluded.expires_at,attempts=0,consumed_at=NULL WHERE owner_bootstrap.expires_at<=? AND NOT EXISTS(SELECT 1 FROM owner_mfa)').bind(accountId,hash,encrypted,now+900000,now).run();
   if(Number(r?.meta?.changes)!==1)return reply(202,accepted);
   if(!await ownerEmail(env,{token})){await db.prepare('UPDATE owner_bootstrap SET expires_at=? WHERE id=1 AND token_hash=? AND consumed_at IS NULL').bind(now,hash).run();return reply(503,{error:'Não foi possível confirmar o envio do email. Aguarda e tenta novamente.'});}
   return reply(202,accepted);
  }
  if(path.startsWith('/api/admin/bootstrap/')){
   if(env.OWNER_BOOTSTRAP_ENABLED!=='true'||typeof data.token!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(data.token))return reply(400,{error:'Ligação inválida ou expirada.'});
   const hash=await hashSessionToken(data.token),b=await db.prepare('SELECT * FROM owner_bootstrap WHERE id=1 AND token_hash=? AND consumed_at IS NULL AND expires_at>? AND attempts<5').bind(hash,now).first();
   if(!b||await db.prepare('SELECT account_id FROM owner_mfa LIMIT 1').first())return reply(400,{error:'Ligação inválida, já usada ou expirada.'});
   const secret=await decryptSeed(env,b.secret_ciphertext,b.account_id);
   if(path==='/api/admin/bootstrap/info')return reply(200,{success:true,secret,email:env.OWNER_EMAIL,expiresAt:b.expires_at});
   if(typeof data.password!=='string'||data.password.length<12||data.password.length>128||new TextEncoder().encode(data.password).length>512)return reply(400,{error:'Escolhe uma palavra-passe com 12 a 128 caracteres.'});
   const attempted=await db.prepare('UPDATE owner_bootstrap SET attempts=attempts+1 WHERE id=1 AND token_hash=? AND consumed_at IS NULL AND expires_at>? AND attempts<5').bind(hash,now).run();if(Number(attempted?.meta?.changes)!==1)return reply(400,{error:'Ligação inválida ou expirada.'});
   const counter=await matchTotp(secret,data.code,now);if(counter===null)return reply(401,{error:'Código inválido. Usa o código atual da aplicação autenticadora.'});
   if(!(await authReadiness(env)).enabled)return reply(503,{error:'Autenticação temporariamente indisponível.'});
   const passwordHash=await hashPassword(data.password),nonce=crypto.randomUUID(),session=await createSessionToken(),expiry=now+900000,codes=newRecoveryCodes(),codeHashes=await Promise.all(codes.map(hashRecovery));
   // A single D1 transaction binds one account and factor to the consumed link.
   // Conditions are repeated so concurrent completions cannot replace the factor.
   const results=await db.batch([
    db.prepare("INSERT INTO accounts(id,email,role,password_hash,verified,disabled,created_at) SELECT account_id,?,'owner',?,1,0,? FROM owner_bootstrap WHERE id=1 AND token_hash=? AND consumed_at IS NULL AND expires_at>? AND attempts<=5 AND NOT EXISTS(SELECT 1 FROM owner_mfa) ON CONFLICT(email) DO UPDATE SET role='owner',password_hash=excluded.password_hash,verified=1 WHERE accounts.id=excluded.id AND accounts.disabled=0").bind(env.OWNER_EMAIL,passwordHash,now,hash,now),
    db.prepare("INSERT INTO owner_mfa SELECT b.account_id,b.secret_ciphertext,?,?,? FROM owner_bootstrap b JOIN accounts a ON a.id=b.account_id WHERE b.id=1 AND b.token_hash=? AND b.consumed_at IS NULL AND b.expires_at>? AND b.attempts<=5 AND a.email=? AND a.role='owner' AND a.disabled=0 AND NOT EXISTS(SELECT 1 FROM owner_mfa)").bind(counter,nonce,now,hash,now,env.OWNER_EMAIL),
    db.prepare('UPDATE owner_bootstrap SET consumed_at=? WHERE id=1 AND token_hash=? AND EXISTS(SELECT 1 FROM owner_mfa WHERE enrollment_nonce=?)').bind(now,hash,nonce),
    db.prepare('DELETE FROM sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM owner_mfa WHERE enrollment_nonce=?)').bind(b.account_id,nonce),
    ...codeHashes.map(code=>db.prepare('INSERT INTO owner_recovery_codes SELECT ?,account_id,NULL FROM owner_mfa WHERE enrollment_nonce=?').bind(code,nonce)),
    db.prepare("INSERT INTO sessions SELECT ?,account_id,'owner',1,1,0,? FROM owner_mfa WHERE enrollment_nonce=?").bind(session.hash,expiry,nonce)
   ]);
   if(Number(results[1]?.meta?.changes)!==1)return reply(409,{error:'A ativação já foi concluída ou deixou de estar disponível. Usa Entrar.'});
   const notification=ownerEmail(env,{kind:'activated'});if(ctx?.waitUntil)ctx.waitUntil(notification);else await notification;
   return reply(200,{success:true,recoveryCodes:codes,expiresAt:expiry},{'Set-Cookie':sessionCookie(session.token,900)});
  }
  if(!await reserve(env,'login:'+Math.floor(now/300000),5))return reply(429,{error:'Aguarda cinco minutos antes de tentar novamente.'});
  const account=await db.prepare("SELECT a.id,a.password_hash,m.secret_ciphertext,m.last_counter FROM accounts a JOIN owner_mfa m ON m.account_id=a.id WHERE a.email=? AND a.role='owner' AND a.verified=1 AND a.disabled=0").bind(env.OWNER_EMAIL).first();
  const denied=()=>reply(401,{error:'Palavra-passe ou código inválido. Usa um código atual ou um código de recuperação ainda não usado.'});
  if(!account||!await verifyPassword(data.password,account.password_hash))return denied();
  const session=await createSessionToken(),expiry=now+900000;let statements;
  if(typeof data.recoveryCode==='string'&&/^[a-f0-9]{32}$/.test(data.recoveryCode.replace(/[ -]/g,'').toLowerCase())){
   const hash=await hashRecovery(data.recoveryCode.replace(/[ -]/g,'').toLowerCase());
   statements=[db.prepare("INSERT INTO sessions SELECT ?,a.id,'owner',1,1,0,? FROM accounts a JOIN owner_recovery_codes c ON c.account_id=a.id WHERE a.id=? AND a.role='owner' AND a.verified=1 AND a.disabled=0 AND c.code_hash=? AND c.used_at IS NULL").bind(session.hash,expiry,account.id,hash),db.prepare('UPDATE owner_recovery_codes SET used_at=? WHERE code_hash=? AND account_id=? AND used_at IS NULL AND EXISTS(SELECT 1 FROM sessions WHERE token_hash=?)').bind(now,hash,account.id,session.hash)];
  }else{
   const secret=await decryptSeed(env,account.secret_ciphertext,account.id),counter=await matchTotp(secret,data.code,now,account.last_counter);if(counter===null)return denied();
   statements=[db.prepare("INSERT INTO sessions SELECT ?,a.id,'owner',1,1,0,? FROM accounts a JOIN owner_mfa m ON m.account_id=a.id WHERE a.id=? AND a.role='owner' AND a.verified=1 AND a.disabled=0 AND m.last_counter<?").bind(session.hash,expiry,account.id,counter),db.prepare('UPDATE owner_mfa SET last_counter=? WHERE account_id=? AND last_counter<? AND EXISTS(SELECT 1 FROM sessions WHERE token_hash=?)').bind(counter,account.id,counter,session.hash)];
  }
  const results=await db.batch(statements);if(Number(results[0]?.meta?.changes)!==1||Number(results[1]?.meta?.changes)!==1)return denied();
  return reply(200,{success:true,expiresAt:expiry},{'Set-Cookie':sessionCookie(session.token,900)});
 }catch{return reply(503,{error:'Acesso administrativo temporariamente indisponível. Não partilhes credenciais por email.'});}
}

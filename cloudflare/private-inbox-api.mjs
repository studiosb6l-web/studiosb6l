import {resolveSession} from './session-guard.mjs';
import {authorize} from './authorization-policy.mjs';
import {checkAuthRate} from './auth-readiness.mjs';
import {trustedAuthOrigin,authResponseOrigin} from './auth-origins.mjs';
import {effectiveProfilePlan} from './professional-profile-matching.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
async function body(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return null;
 const reader=request.body?.getReader();if(!reader)return null;let size=0;const parts=[];
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>14000){await reader.cancel();return null;}parts.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
 try{const data=JSON.parse(new TextDecoder().decode(bytes));return data&&typeof data==='object'&&!Array.isArray(data)?data:null;}catch{return null;}
}
// Reservations count failed attempts conservatively. They never refund uncertain writes.
async function reserve(db,user,cap,kind='write'){
 const day=new Date().toISOString().slice(0,10);
 const stmt=(scope,limit)=>db.prepare('INSERT INTO inbox_usage(scope,used) VALUES(?,1) ON CONFLICT(scope) DO UPDATE SET used=used+1 WHERE used<?').bind(scope,limit);
 const results=await db.batch([stmt('global:'+day,100),stmt('user:'+user+':'+kind+':'+day,cap)]);
 return results.every(r=>Number(r?.meta?.changes)===1);
}
export async function privateInboxApi(request,env={}){
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Vary':'Origin'}});
 if(env.PREVIEW_ISOLATED==='true'||env.STOP_SERVICE==='true'||env.PRIVATE_INBOX_ENABLED!=='true'||!env.DB)return reply(503,{error:'Mensagens em preparação.'});
 if(request.method==='OPTIONS')return trustedAuthOrigin(request.headers.get('Origin'))?new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}}):reply(403,{error:'Forbidden'});
 if(!['GET','POST'].includes(request.method))return reply(405,{error:'Method not allowed'});
 if(request.method==='POST'&&!trustedAuthOrigin(request.headers.get('Origin')))return reply(403,{error:'Forbidden'});
 const rate=await checkAuthRate(request,env);if(rate)return reply(rate,{error:'Aguarda antes de tentar novamente.'});
 const session=await resolveSession(request,env);if(!authorize(session,'profile:read'))return reply(401,{error:'Sessão necessária.'});
 const db=env.DB,user=session.userId,path=new URL(request.url).pathname;
 try{
  // Session records alone must not bypass a disabled or unverified account.
  const active=await db.prepare('SELECT id FROM accounts WHERE id=? AND verified=1 AND disabled=0').bind(user).first();if(!active)return reply(401,{error:'Sessão necessária.'});
  if(path==='/api/inbox/admin/reports'&&request.method==='GET'){
   if(!authorize(session,'applications:review'))return reply(403,{error:'Moderação reservada ao administrador com MFA.'});
   const reports=await db.prepare('SELECT r.message_id,r.reason,r.created_at,m.body FROM inbox_reports r JOIN inbox_messages m ON m.id=r.message_id ORDER BY r.created_at DESC LIMIT 50').all();return reply(200,{success:true,reports:reports.results||[]});
  }
  if(path==='/api/inbox/preferences'&&request.method==='GET'){
   const row=await db.prepare('SELECT receive_messages FROM inbox_preferences WHERE account_id=?').bind(user).first();return reply(200,{success:true,receiveMessages:row?.receive_messages===1});
  }
  if(path==='/api/inbox/messages'&&request.method==='GET'){
   const messages=await db.prepare(`SELECT m.id,m.body,m.created_at,m.read_at,CASE WHEN m.sender_id=? THEN 'sent' ELSE 'received' END direction,p.id peerProfileId,COALESCE(json_extract(p.data,'$.name'),'Utilizador') peerName FROM inbox_messages m LEFT JOIN professional_profiles p ON p.account_id=CASE WHEN m.sender_id=? THEN m.recipient_id ELSE m.sender_id END WHERE m.sender_id=? OR m.recipient_id=? ORDER BY m.created_at DESC,m.id DESC LIMIT 50`).bind(user,user,user,user).all();
   const unread=await db.prepare('SELECT COUNT(*) count FROM inbox_messages WHERE recipient_id=? AND read_at IS NULL').bind(user).first();
   return reply(200,{success:true,unread:unread.count,messages:messages.results||[]});
  }
  if(request.method!=='POST')return reply(404,{error:'Not found'});
  const data=await body(request);if(!data)return reply(400,{error:'Pedido inválido.'});
  const entitlement=await db.prepare('SELECT plan,provider_reference,verified_at,expires_at,revoked_at FROM professional_entitlements WHERE account_id=?').bind(user).first();
  const plan=effectiveProfilePlan(entitlement),cap=plan==='master_pro'?100:plan==='pro'?50:5;
  if(path==='/api/inbox/preferences'){
   if(typeof data.receiveMessages!=='boolean')return reply(400,{error:'Escolhe se queres receber mensagens.'});
   if(!await reserve(db,user,100))return reply(429,{error:'Limite diário atingido.'});
   await db.prepare('INSERT INTO inbox_preferences VALUES(?,?) ON CONFLICT(account_id) DO UPDATE SET receive_messages=excluded.receive_messages').bind(user,data.receiveMessages?1:0).run();return reply(200,{success:true,receiveMessages:data.receiveMessages});
  }
  if(path==='/api/inbox/messages'){
   if(!uuid(data.id)||!uuid(data.toProfile)||typeof data.body!=='string'||!data.body.trim()||data.body.length>3000)return reply(400,{error:'Indica o perfil e uma mensagem até 3000 caracteres.'});
   const prior=await db.prepare('SELECT sender_id,recipient_id,body FROM inbox_messages WHERE id=?').bind(data.id).first();
   if(prior){const target=await db.prepare('SELECT account_id FROM professional_profiles WHERE id=?').bind(data.toProfile).first();return prior.sender_id===user&&prior.recipient_id===target?.account_id&&prior.body===data.body.trim()?reply(200,{success:true,id:data.id}):reply(409,{error:'Identificador já utilizado.'});}
   // Consent, block and account checks are repeated inside the INSERT to close races.
   const target=await db.prepare('SELECT account_id FROM professional_profiles WHERE id=? AND blocked=0').bind(data.toProfile).first();
   if(!target||target.account_id===user)return reply(403,{error:'Não é possível enviar a este perfil.'});
   if(!await reserve(db,user,cap,'send'))return reply(429,{error:'Limite diário de mensagens atingido.'});
   const r=await db.prepare(`INSERT INTO inbox_messages(id,sender_id,recipient_id,body,created_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM inbox_messages)<10000 AND EXISTS(SELECT 1 FROM inbox_preferences WHERE account_id=? AND receive_messages=1) AND EXISTS(SELECT 1 FROM inbox_preferences WHERE account_id=? AND receive_messages=1) AND EXISTS(SELECT 1 FROM accounts WHERE id=? AND verified=1 AND disabled=0) AND EXISTS(SELECT 1 FROM professional_profiles WHERE id=? AND account_id=? AND blocked=0) AND NOT EXISTS(SELECT 1 FROM inbox_blocks WHERE (account_id=? AND blocked_id=?) OR (account_id=? AND blocked_id=?))`).bind(data.id,user,target.account_id,data.body.trim(),Date.now(),user,target.account_id,target.account_id,data.toProfile,target.account_id,user,target.account_id,target.account_id,user).run();
   if(Number(r?.meta?.changes)!==1)return reply(403,{error:'Não é possível enviar a este perfil. Verifica as autorizações de mensagens.'});
   return reply(201,{success:true,id:data.id,plan});
  }
  if(path==='/api/inbox/read'){
   if(!uuid(data.id))return reply(400,{error:'Mensagem inválida.'});
   if(!await reserve(db,user,100))return reply(429,{error:'Limite diário atingido.'});
   const r=await db.prepare('UPDATE inbox_messages SET read_at=COALESCE(read_at,?) WHERE id=? AND recipient_id=?').bind(Date.now(),data.id,user).run();return Number(r?.meta?.changes)===1?reply(200,{success:true}):reply(404,{error:'Not found'});
  }
  if(path==='/api/inbox/block'){
   if(!uuid(data.profileId)||typeof data.blocked!=='boolean')return reply(400,{error:'Perfil inválido.'});
   const target=await db.prepare('SELECT account_id FROM professional_profiles WHERE id=?').bind(data.profileId).first();if(!target||target.account_id===user)return reply(404,{error:'Not found'});
   if(!await reserve(db,user,100))return reply(429,{error:'Limite diário atingido.'});
   if(data.blocked)await db.prepare('INSERT INTO inbox_blocks VALUES(?,?) ON CONFLICT DO NOTHING').bind(user,target.account_id).run();
   else await db.prepare('DELETE FROM inbox_blocks WHERE account_id=? AND blocked_id=?').bind(user,target.account_id).run();return reply(200,{success:true});
  }
  if(path==='/api/inbox/report'){
   if(!uuid(data.id)||typeof data.reason!=='string'||!data.reason.trim()||data.reason.length>500)return reply(400,{error:'Indica o motivo até 500 caracteres.'});
   if(!await reserve(db,user,100))return reply(429,{error:'Limite diário atingido.'});
   const r=await db.prepare('INSERT INTO inbox_reports SELECT id,?,?,? FROM inbox_messages WHERE id=? AND recipient_id=? ON CONFLICT DO NOTHING').bind(user,data.reason.trim(),Date.now(),data.id,user).run();return Number(r?.meta?.changes)===1?reply(201,{success:true}):reply(404,{error:'Not found'});
  }
  return reply(404,{error:'Not found'});
 }catch{return reply(503,{error:'Mensagens temporariamente indisponíveis.'});}
}

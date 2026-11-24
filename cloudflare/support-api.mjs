import {resolveSession} from './session-guard.mjs';
import {authorize} from './authorization-policy.mjs';
import {trustedAuthOrigin,authResponseOrigin} from './auth-origins.mjs';
import {checkAuthRate} from './auth-readiness.mjs';
import {supportEmail} from './support-email.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export const autoReplies={payment:'Se já pagaste, não voltes a pagar. Confirma se usaste o mesmo email no Payhip e na inscrição. Guarda o comprovativo; o suporte irá verificar o pedido.',access:'Usa o email da inscrição e confirma primeiro o email recebido. Se já pagaste e não consegues entrar, não efetues outro pagamento. Nunca envies a tua palavra-passe.',profile:'Indica a página e descreve a alteração ou dificuldade. Não envies dados pessoais desnecessários.',other:'Recebemos o teu pedido. Descreve o que tentaste fazer e o que aconteceu. Esta é uma resposta automática; uma pessoa poderá continuar a conversa.'};
async function readBody(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return null;
 const reader=request.body?.getReader();if(!reader)return null;let size=0;const chunks=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return null;}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const v of chunks){bytes.set(v,at);at+=v.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{return null;}
}
async function reserve(env,userId){
 const day=new Date().toISOString().slice(0,10);
 const stmt=(scope,cap)=>env.DB.prepare('INSERT INTO support_usage(scope,used) VALUES(?,1) ON CONFLICT(scope) DO UPDATE SET used=used+1 WHERE support_usage.used<?').bind(scope,cap);
 const rows=await env.DB.batch([stmt('global:'+day,100),stmt('user:'+userId+':'+day,10)]);
 return rows.every(r=>Number(r?.meta?.changes)===1);
}
export async function supportApi(request,env,ctx){
 const respond=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Vary':'Origin'}});
 if(env.PREVIEW_ISOLATED==='true'||env.STOP_SERVICE==='true'||env.SUPPORT_ENABLED!=='true')return respond(503,{error:'Suporte temporariamente indisponível. Contacta studiosb6l@gmail.com.'});
 if(request.method==='OPTIONS')return trustedAuthOrigin(request.headers.get('Origin'))?new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}}):respond(403,{error:'Forbidden'});
 if(!['GET','POST'].includes(request.method))return respond(405,{error:'Method not allowed'});
 if(request.method==='POST'&&!trustedAuthOrigin(request.headers.get('Origin')))return respond(403,{error:'Forbidden'});
 const limited=await checkAuthRate(request,env);if(limited)return respond(limited,{error:'Demasiados pedidos ou serviço indisponível. Tenta mais tarde.'});
 const session=await resolveSession(request,env);if(!authorize(session,'support:create'))return respond(401,{error:'Entra na tua conta. Se não consegues entrar, contacta studiosb6l@gmail.com.'});
 const staff=authorize(session,'support:reply'),path=new URL(request.url).pathname;
 const match=/^\/api\/support\/tickets(?:\/([a-f0-9-]{36})(?:\/(messages|close))?)?$/.exec(path);
 if(!match)return respond(404,{error:'Not found'});
 const [,id,action]=match;
 try{
  if(request.method==='GET'&&!action){
   if(!id){const rows=await env.DB.prepare(staff?'SELECT id,subject,category,status,created_at,updated_at FROM support_tickets ORDER BY updated_at DESC LIMIT 50':'SELECT id,subject,category,status,created_at,updated_at FROM support_tickets WHERE account_id=? ORDER BY updated_at DESC LIMIT 50');const result=await (staff?rows:rows.bind(session.userId)).all();return respond(200,{success:true,staff,tickets:result.results});}
   const ticket=await env.DB.prepare('SELECT * FROM support_tickets WHERE id=?').bind(id).first();
   if(!ticket||(!staff&&ticket.account_id!==session.userId))return respond(404,{error:'Not found'});
   const messages=await env.DB.prepare('SELECT id,author,body,created_at FROM support_messages WHERE ticket_id=? ORDER BY created_at DESC,id DESC LIMIT 200').bind(id).all();
   return respond(200,{success:true,staff,ticket:{id:ticket.id,subject:ticket.subject,status:ticket.status},messages:messages.results.reverse()});
  }
  if(request.method!=='POST')return respond(405,{error:'Method not allowed'});
  const data=await readBody(request);if(!data||typeof data!=='object'||Array.isArray(data))return respond(400,{error:'Pedido inválido ou demasiado longo.'});
  if(!id){
   if(!uuid.test(data.id)||typeof data.subject!=='string'||data.subject.trim().length<3||data.subject.length>120||typeof data.body!=='string'||!data.body.trim()||data.body.length>3000||!Object.hasOwn(autoReplies,data.category))return respond(400,{error:'Preenche assunto, categoria e mensagem (máximo 3000 caracteres).'});
   const existing=await env.DB.prepare('SELECT account_id FROM support_tickets WHERE id=?').bind(data.id).first();
   if(existing)return existing.account_id===session.userId?respond(200,{success:true,id:data.id}):respond(409,{error:'Pedido já existente.'});
   if(!await reserve(env,session.userId))return respond(429,{error:'Limite diário de mensagens atingido. Contacta studiosb6l@gmail.com.'});
   const now=Date.now();await env.DB.batch([
    env.DB.prepare('INSERT INTO support_tickets VALUES(?,?,?,?,?,?,?)').bind(data.id,session.userId,data.subject.trim(),data.category,'open',now,now),
    env.DB.prepare('INSERT INTO support_messages VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),data.id,'user',data.body.trim(),now),
    env.DB.prepare('INSERT INTO support_messages VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),data.id,'system','Resposta automática: '+autoReplies[data.category],now+1)
   ]);
   const account=await env.DB.prepare('SELECT email FROM accounts WHERE id=?').bind(session.userId).first();
   const pending=supportEmail(env,{to:'studiosb6l@gmail.com',replyTo:account?.email,ticketId:data.id,kind:'new',subject:data.subject.trim(),message:data.body.trim()});if(ctx?.waitUntil)ctx.waitUntil(pending);else await pending;
   return respond(201,{success:true,id:data.id});
  }
  const ticket=await env.DB.prepare('SELECT * FROM support_tickets WHERE id=?').bind(id).first();
  if(!ticket||(!staff&&ticket.account_id!==session.userId))return respond(404,{error:'Not found'});
  if(action==='close'){
   if(!staff)return respond(403,{error:'Forbidden'});
   if(!await reserve(env,session.userId))return respond(429,{error:'Limite diário atingido.'});
   await env.DB.prepare("UPDATE support_tickets SET status='closed',updated_at=? WHERE id=?").bind(Date.now(),id).run();return respond(200,{success:true});
  }
  if(action!=='messages')return respond(404,{error:'Not found'});
  if(ticket.status!=='open')return respond(409,{error:'Pedido encerrado. Cria um novo pedido se precisares de ajuda.'});
  if(!uuid.test(data.id)||typeof data.body!=='string'||!data.body.trim()||data.body.length>3000)return respond(400,{error:'Mensagem inválida (máximo 3000 caracteres).'});
  const prior=await env.DB.prepare('SELECT id FROM support_messages WHERE id=? AND ticket_id=?').bind(data.id,id).first();if(prior)return respond(200,{success:true,id});
  if(!await reserve(env,session.userId))return respond(429,{error:'Limite diário de mensagens atingido.'});
  const now=Date.now();await env.DB.batch([env.DB.prepare('INSERT INTO support_messages VALUES(?,?,?,?,?)').bind(data.id,id,staff?'staff':'user',data.body.trim(),now),env.DB.prepare('UPDATE support_tickets SET updated_at=? WHERE id=?').bind(now,id)]);
  const sender=await env.DB.prepare('SELECT email FROM accounts WHERE id=?').bind(session.userId).first();
  let to='studiosb6l@gmail.com';if(staff){const account=await env.DB.prepare('SELECT email FROM accounts WHERE id=?').bind(ticket.account_id).first();to=account?.email;}
  const pending=supportEmail(env,{to:to||'',replyTo:staff?'studiosb6l@gmail.com':sender?.email,ticketId:id,kind:staff?'reply':'new',subject:ticket.subject,message:data.body.trim()});if(ctx?.waitUntil)ctx.waitUntil(pending);else await pending;
  return respond(201,{success:true,id});
 }catch{return respond(503,{error:'Não foi possível guardar o pedido. Tenta novamente ou contacta studiosb6l@gmail.com.'});}
}

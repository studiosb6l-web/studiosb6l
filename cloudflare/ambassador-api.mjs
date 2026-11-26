import {resolveSession} from './session-guard.mjs';
import {checkAuthRate} from './auth-readiness.mjs';
import {trustedAuthOrigin,authResponseOrigin} from './auth-origins.mjs';
import {canIssueAmbassadorInvite} from './ambassador-session-policy.mjs';
import {issueAmbassadorInvite} from './ambassador-invite-service.mjs';
import {redeemAmbassadorInvite} from './ambassador-redemption.mjs';

async function input(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return null;
 const reader=request.body?.getReader();if(!reader)return null;
 const chunks=[];let length=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>2048){await reader.cancel();return null;}chunks.push(value);}
 const bytes=new Uint8Array(length);let at=0;for(const v of chunks){bytes.set(v,at);at+=v.byteLength;}
 const data=JSON.parse(new TextDecoder().decode(bytes));return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
 }catch{return null;}
}
export async function ambassadorApi(request,env={}){
 const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Vary':'Origin'}});
 if(env.PREVIEW_ISOLATED==='true'||env.STOP_SERVICE==='true'||env.AMBASSADOR_ENABLED!=='true'||!env.DB)return reply(503,{success:false,error:'Convites temporariamente indisponíveis.'});
 const path=new URL(request.url).pathname;
 const methods={'/api/ambassador/admin/invites':'GET','/api/ambassador/admin/issue':'POST','/api/ambassador/admin/revoke':'POST','/api/ambassador/redeem':'POST'};
 if(!Object.hasOwn(methods,path))return reply(404,{success:false,error:'Not found'});
 if(request.method==='OPTIONS')return trustedAuthOrigin(request.headers.get('Origin'))?new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':authResponseOrigin(request),'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}}):reply(403,{success:false,error:'Forbidden'});
 if(request.method!==methods[path])return reply(405,{success:false,error:'Method not allowed'});
 const origin=request.headers.get('Origin');
 if((request.method==='POST'||origin)&&!trustedAuthOrigin(origin))return reply(403,{success:false,error:'Forbidden'});
 const limited=await checkAuthRate(request,env);if(limited)return reply(limited,{success:false,error:'Aguarda antes de tentar novamente.'});
 const session=await resolveSession(request,env);
 if(!session)return reply(401,{success:false,error:'Inicia sessão para continuar.'});
 const admin=path.startsWith('/api/ambassador/admin/');
 if(admin&&!canIssueAmbassadorInvite(session))return reply(403,{success:false,error:'Forbidden'});
 if(!admin&&session.role==='owner')return reply(403,{success:false,error:'Forbidden'});
 try{
  // A suspended account must not retain privileged access through an old cookie.
  const account=await env.DB.prepare('SELECT id,role,verified,disabled FROM accounts WHERE id=?').bind(session.userId).first();
  if(!account||account.disabled!==0||account.verified!==1||account.role!==session.role)return reply(403,{success:false,error:'Forbidden'});
  if(request.method==='GET'){
   const rows=await env.DB.prepare(`SELECT id,email,sectors_json,created_at,expires_at,redeemed_at,revoked_at FROM ambassador_invites ORDER BY created_at DESC,id LIMIT 50`).all();
   return reply(200,{success:true,items:(rows.results||[]).map(r=>({id:r.id,email:r.email,sectors:JSON.parse(r.sectors_json),createdAt:r.created_at,expiresAt:r.expires_at,redeemedAt:r.redeemed_at,revokedAt:r.revoked_at})),limit:50});
  }
  const data=await input(request);if(!data)return reply(400,{success:false,error:'Pedido inválido.'});
  // Shared daily mutation cap. Counts failed attempts too, so errors cannot open
  // an unlimited write loop. Global quota readiness remains a deployment gate.
  const budget=await env.DB.prepare('INSERT INTO ambassador_write_budget(day,used) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET used=used+1 WHERE used<100').bind(new Date().toISOString().slice(0,10)).run();
  if(Number(budget?.meta?.changes)!==1)return reply(429,{success:false,error:'Limite diário atingido. Tenta mais tarde.'});
  if(path.endsWith('/issue')){
   if(Object.keys(data).some(k=>!['email','sectors'].includes(k)))return reply(400,{success:false,error:'Pedido inválido.'});
   const invite=await issueAmbassadorInvite(env,{...session,accountId:session.userId},data);
   return reply(201,{success:true,...invite});
  }
  if(path.endsWith('/revoke')){
   if(Object.keys(data).some(k=>k!=='id')||typeof data.id!=='string'||!/^[-a-f0-9]{36}$/.test(data.id))return reply(400,{success:false,error:'Convite inválido.'});
   const nonce=crypto.randomUUID(),now=Date.now();
   const results=await env.DB.batch([
    env.DB.prepare("INSERT INTO ambassador_audit(id,actor_id,event_type,target_id,created_at) SELECT ?,?,'invite_revoked',id,? FROM ambassador_invites WHERE id=? AND revoked_at IS NULL").bind(nonce,session.userId,now,data.id),
    env.DB.prepare('UPDATE ambassador_invites SET revoked_at=? WHERE id=? AND EXISTS(SELECT 1 FROM ambassador_audit WHERE id=?)').bind(now,data.id,nonce),
    env.DB.prepare('UPDATE ambassador_grants SET revoked_at=COALESCE(revoked_at,?) WHERE invite_id=? AND EXISTS(SELECT 1 FROM ambassador_audit WHERE id=?)').bind(now,data.id,nonce)
   ]);
   return reply(200,{success:true,revoked:results[0]?.meta?.changes===1});
  }
  if(Object.keys(data).some(k=>k!=='token'))return reply(400,{success:false,error:'Pedido inválido.'});
  const redeemed=await redeemAmbassadorInvite(env,session.userId,data.token);
  return redeemed?reply(200,{success:true,ambassadorActive:true}):reply(400,{success:false,error:'Convite inválido, expirado, já utilizado ou destinado a outro email.'});
 }catch(error){
  return error instanceof TypeError?reply(400,{success:false,error:'Verifica o email, as áreas profissionais e a ligação.'}):reply(503,{success:false,error:'Não foi possível concluir. Tenta novamente mais tarde.'});
 }
}

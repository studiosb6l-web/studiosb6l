import {resolveSession} from './session-guard.mjs';
import {authorize} from './authorization-policy.mjs';
import {checkAuthRate} from './auth-readiness.mjs';
import {trustedAuthOrigin,authResponseOrigin} from './auth-origins.mjs';
import {validateProfile,publicProfile,SECTORS} from './professional-profile-schema.mjs';
import {loadProfessionalMembership} from './professional-membership.mjs';
import {effectivePlan} from './ambassador-session-policy.mjs';
import {rankProfessionalProfiles,countryKey} from './professional-profile-matching.mjs';
// Preserve the existing matching API's basic/pro contract for every sector.
async function matchingPlan(accountId,env){
 const plan=effectivePlan(await loadProfessionalMembership(accountId,env));
 return plan==='PRO'||plan==='PRO_BUSINESS'?'pro':'basic';
}
const validId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id);
function response(request,body,status=200,publicRead=false){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':publicRead&&status===200?'public, max-age=60':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':authResponseOrigin(request),'Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});}
async function input(request){if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return null;const reader=request.body?.getReader();if(!reader)return null;const chunks=[];let length=0;for(;;){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>9000){await reader.cancel();return null;}chunks.push(value);}const bytes=new Uint8Array(length);let at=0;for(const v of chunks){bytes.set(v,at);at+=v.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{return null;}}
async function reserve(db){const day=new Date().toISOString().slice(0,10);const r=await db.prepare('INSERT INTO professional_write_budget(day,used) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET used=used+1 WHERE used<100').bind(day).run();return Number(r?.meta?.changes)===1;}
const publicQuery="SELECT p.profile_id,p.data,p.revision FROM professional_publications p JOIN accounts a ON a.id=p.account_id WHERE a.verified=1 AND a.disabled=0";
function decoded(row){try{const data=validateProfile(JSON.parse(row.data));return data?.publishConsent?publicProfile(row.profile_id,data):null;}catch{return null;}}
export async function professionalProfilesApi(request,env={},ctx){
 const url=new URL(request.url),path=url.pathname,reply=(b,s=200,p=false)=>response(request,b,s,p);
 if(env.PROFESSIONAL_PROFILES_ENABLED!=='true'||!env.DB)return reply({success:false,error:'Serviço de perfis ainda indisponível.'},503);
 if(request.method==='OPTIONS')return trustedAuthOrigin(request.headers.get('Origin'))?reply({success:true},200):reply({error:'Forbidden'},403);
 if(path==='/api/profiles/public'&&request.method==='GET'){
  try{
   const id=url.searchParams.get('id');if(id&&!validId(id))return reply({error:'Perfil inválido.'},400);
   const cache=globalThis.caches?.default,keyUrl=new URL('/api/profiles/public',url.origin);
   if(id)keyUrl.searchParams.set('id',id);else if(url.searchParams.get('showcase')==='1')keyUrl.searchParams.set('showcase','1');
   keyUrl.searchParams.set('origin',authResponseOrigin(request));const cacheKey=new Request(keyUrl.href);
   if(cache){const cached=await cache.match(cacheKey);if(cached)return cached;}
   const rate=await checkAuthRate(request,env);if(rate)return reply({error:'Consulta temporariamente limitada.'},rate);
   const publicReply=body=>{const result=reply(body,200,true);if(cache){const write=cache.put(cacheKey,result.clone()).catch(()=>{});if(ctx?.waitUntil)ctx.waitUntil(write);}return result;};
   if(id){const row=await env.DB.prepare(publicQuery+' AND p.profile_id=? LIMIT 1').bind(id).first();const profile=row&&decoded(row);return profile?publicReply({success:true,profile}):reply({error:'Perfil não publicado.'},404);}
   const rows=await env.DB.prepare(publicQuery+(url.searchParams.get('showcase')==='1'?' AND p.showcase=1':'')+' ORDER BY p.approved_at DESC LIMIT 135').all();
   const profiles=(rows.results||[]).map(decoded).filter(Boolean);
   return publicReply({success:true,profiles,artists:profiles.filter(p=>SECTORS[p.kind].person&&p.showcaseConsent&&p.photoUrl&&p.photoRights).map(p=>({...p,approved:true}))});
  }catch{return reply({error:'Não foi possível consultar os perfis.'},503);}
 }
 const limited=await checkAuthRate(request,env);if(limited)return reply({error:'Aguarda antes de tentar novamente.'},limited);
 const session=await resolveSession(request,env);if(!authorize(session,'profile:read'))return reply({error:'Sessão necessária.'},401);
 if(request.method==='POST'&&!trustedAuthOrigin(request.headers.get('Origin')))return reply({error:'Forbidden'},403);
 const db=env.DB;
 try{
  if(path==='/api/profiles/me'&&request.method==='GET'){
   const row=await db.prepare('SELECT id,data,revision,status,blocked FROM professional_profiles WHERE account_id=?').bind(session.userId).first();
   const plan=await matchingPlan(session.userId,env);
   return reply({success:true,plan,profile:row?{id:row.id,...JSON.parse(row.data),revision:row.revision,status:row.status,blocked:row.blocked===1}:null});
  }
  if(path==='/api/profiles/me'&&request.method==='POST'){
   if(!authorize(session,'profile:edit'))return reply({error:'Forbidden'},403);
   const body=await input(request),data=validateProfile(body?.profile);if(!data||!Number.isSafeInteger(body?.revision)||body.revision<0)return reply({error:'Verifica os campos e as autorizações da ficha.'},400);
   const existing=await db.prepare('SELECT id,revision,data,blocked FROM professional_profiles WHERE account_id=?').bind(session.userId).first();
   if(existing?.blocked===1)return reply({error:'Esta ficha está suspensa. Contacta o apoio para corrigir a situação.'},403);
   if((existing?.revision||0)!==body.revision)return reply({error:'A ficha foi alterada. Atualiza a página antes de voltar a guardar.'},409);
   if(!await reserve(db))return reply({error:'O limite diário de alterações foi atingido. Tenta mais tarde.'},429);
   const id=existing?.id||crypto.randomUUID(),nonce=crypto.randomUUID(),now=Date.now(),revision=body.revision+1;
   const write=existing?db.prepare("UPDATE professional_profiles SET kind=?,data=?,revision=?,submission_id=?,status='pending',updated_at=? WHERE account_id=? AND revision=?").bind(data.kind,JSON.stringify(data),revision,nonce,now,session.userId,body.revision):db.prepare("INSERT INTO professional_profiles(id,account_id,kind,data,revision,submission_id,status,updated_at) SELECT ?,?,?,?,?,?,'pending',? WHERE (SELECT COUNT(*) FROM professional_profiles)<15000").bind(id,session.userId,data.kind,JSON.stringify(data),revision,nonce,now);
   const statements=[write];
   if(data.publishConsent){
    statements.push(db.prepare("INSERT INTO professional_publications(profile_id,account_id,data,revision,approved_at,showcase,matching,country) SELECT id,account_id,data,revision,?,?,?,? FROM professional_profiles WHERE id=? AND submission_id=? AND blocked=0 ON CONFLICT(profile_id) DO UPDATE SET data=excluded.data,revision=excluded.revision,approved_at=excluded.approved_at,showcase=excluded.showcase,matching=excluded.matching,country=excluded.country").bind(now,SECTORS[data.kind].person&&data.showcaseConsent&&data.photoUrl&&data.photoRights?1:0,data.matchingConsent?1:0,countryKey(data.country),id,nonce));
    statements.push(db.prepare("INSERT INTO professional_review_log(id,profile_id,revision,reviewer_id,decision,created_at) SELECT ?,id,revision,'system','auto-publish',? FROM professional_profiles WHERE id=? AND submission_id=? AND blocked=0").bind(crypto.randomUUID(),now,id,nonce));
    statements.push(db.prepare("UPDATE professional_profiles SET status='approved' WHERE id=? AND submission_id=? AND blocked=0").bind(id,nonce));
   }else statements.push(db.prepare('DELETE FROM professional_publications WHERE profile_id=? AND EXISTS(SELECT 1 FROM professional_profiles WHERE id=? AND submission_id=?)').bind(id,id,nonce));
   const out=await db.batch(statements);if(Number(out[0]?.meta?.changes)!==1)return reply({error:'Não foi possível guardar. Atualiza a página ou contacta o apoio.'},409);
   return reply({success:true,id,revision,status:data.publishConsent?'approved':'pending',published:data.publishConsent,message:data.publishConsent?'Ficha validada e publicada automaticamente.':'Ficha guardada em privado. Autoriza a publicação quando estiver pronta.'});
  }

  if(path==='/api/profiles/matches'&&request.method==='GET'){
   const own=await db.prepare(publicQuery+' AND p.account_id=? LIMIT 1').bind(session.userId).first();const viewer=own&&decoded(own);
   if(!viewer?.matchingConsent)return reply({success:true,items:[],message:'Publica uma ficha aprovada e autoriza os cruzamentos para receber correspondências.'});
   const plan=await matchingPlan(session.userId,env);
   // All approved sectors participate. Bounded reads, no background robot or automatic messages.
   const rows=plan==='pro'?await db.prepare(publicQuery+' AND p.account_id!=? AND p.matching=1 ORDER BY p.approved_at DESC LIMIT 200').bind(session.userId).all():await db.prepare(publicQuery+' AND p.account_id!=? AND p.matching=1 AND p.country=? ORDER BY p.approved_at DESC LIMIT 200').bind(session.userId,countryKey(viewer.country)).all();
   const candidates=(rows.results||[]).map(decoded).filter(Boolean);return reply({success:true,plan,items:rankProfessionalProfiles(viewer,candidates,{plan})});
  }
  if(path.startsWith('/api/profiles/admin/')){
   if(!authorize(session,'applications:review'))return reply({error:'Moderação reservada ao administrador autenticado com MFA.'},403);
   if(path==='/api/profiles/admin/list'&&request.method==='GET'){
    const rows=await db.prepare("SELECT id,data,revision,status,blocked,updated_at FROM professional_profiles ORDER BY updated_at DESC LIMIT 50").all();return reply({success:true,profiles:(rows.results||[]).map(r=>({id:r.id,profile:JSON.parse(r.data),revision:r.revision,status:r.status,blocked:r.blocked===1,updatedAt:r.updated_at}))});
   }
   if(path==='/api/profiles/admin/review'&&request.method==='POST'){
    const body=await input(request);if(!validId(body?.id)||!Number.isSafeInteger(body?.revision)||!['unpublish','release'].includes(body?.decision))return reply({error:'Revisão inválida.'},400);
    const row=await db.prepare('SELECT revision FROM professional_profiles WHERE id=?').bind(body.id).first();
    if(!row||row.revision!==body.revision)return reply({error:'A ficha mudou. Atualiza a lista antes de decidir.'},409);
    if(!await reserve(db))return reply({error:'Limite diário atingido.'},429);
    const now=Date.now(),blocked=body.decision==='unpublish'?1:0;
    const results=await db.batch([
     db.prepare('INSERT INTO professional_review_log(id,profile_id,revision,reviewer_id,decision,created_at) SELECT ?,id,revision,?,?,? FROM professional_profiles WHERE id=? AND revision=?').bind(crypto.randomUUID(),session.userId,body.decision,now,body.id,body.revision),
     db.prepare('DELETE FROM professional_publications WHERE profile_id=? AND EXISTS(SELECT 1 FROM professional_profiles WHERE id=? AND revision=?)').bind(body.id,body.id,body.revision),
     db.prepare('UPDATE professional_profiles SET blocked=?,status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(blocked,blocked?'rejected':'pending',now,body.id,body.revision)
    ]);
    if(Number(results.at(-1)?.meta?.changes)!==1)return reply({error:'A ficha mudou. Atualiza a lista.'},409);
    return reply({success:true,published:false,blocked:blocked===1});
   }
  }
  return reply({error:'Not found'},404);
 }catch{return reply({error:'Serviço de perfis temporariamente indisponível.'},503);}
}

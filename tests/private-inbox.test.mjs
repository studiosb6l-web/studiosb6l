import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from '../cloudflare/artists-api-entry.mjs';
import {privateInboxPortal} from '../cloudflare/private-inbox-portal.mjs';
const origin='https://studiosb6l-artists-api.studiosb6l.workers.dev';
const tokens={a:'a'.repeat(43),b:'b'.repeat(43),c:'c'.repeat(43)};
function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
 for(const name of ['001_sessions','002_accounts','009_professional_profiles','011_master_professional_entitlements','012_private_inbox'])sql.exec(readFileSync('cloudflare/migrations/'+name+'.sql','utf8'));
 const profiles={};for(const user of ['a','b','c']){
  profiles[user]=crypto.randomUUID();
  sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run(user,user+'@example.test','artist','fixture',1,0,1);
  sql.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?)').run(createHash('sha256').update(tokens[user]).digest('hex'),user,'artist',1,0,0,Date.now()+600000);
  sql.prepare('INSERT INTO professional_profiles(id,account_id,kind,data,submission_id,updated_at) VALUES(?,?,?,?,?,?)').run(profiles[user],user,'musician',JSON.stringify({name:'Artista '+user}),'fixture',1);
 }
 const wrap=(q,args=[])=>({bind(...values){return wrap(q,values);},first:async()=>sql.prepare(q).get(...args)||null,all:async()=>({results:sql.prepare(q).all(...args)}),run:async()=>({meta:{changes:Number(sql.prepare(q).run(...args).changes)}})});
 const DB={prepare:q=>wrap(q),batch:async stmts=>{sql.exec('BEGIN');try{const r=[];for(const stmt of stmts)r.push(await stmt.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,profiles,env:{DB,PRIVATE_INBOX_ENABLED:'true',AUTH_RATE_LIMIT:{limit:async()=>({success:true})}}};
}
function req(path,user='a',data){return new Request(origin+path,{method:data===undefined?'GET':'POST',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json',...(user?{Cookie:'__Host-b6l_session='+tokens[user]}:{})},body:data===undefined?undefined:JSON.stringify(data)});}
const call=(env,path,user,data)=>worker.fetch(req('/api/inbox/'+path,user,data),env);
function consent(sql,...users){for(const user of users)sql.prepare('INSERT INTO inbox_preferences VALUES(?,1)').run(user);}
function payload(profiles){return {id:crypto.randomUUID(),toProfile:profiles.b,body:'Olá, procuro um músico para colaborar.'};}
test('private messaging requires active session, flags, origins, STOP and explicit consent',async()=>{
 const {env,sql,profiles}=setup(),data=payload(profiles);
 assert.equal((await call(env,'messages',null)).status,401);
 assert.equal((await call({...env,PRIVATE_INBOX_ENABLED:'false'},'messages')).status,503);
 assert.equal((await call({...env,STOP_SERVICE:'true'},'messages')).status,503);
 assert.equal((await call({...env,PREVIEW_ISOLATED:'true'},'messages')).status,503);
 const foreign=req('/api/inbox/preferences','a',{receiveMessages:true});foreign.headers.set('Origin','https://evil.example');assert.equal((await worker.fetch(foreign,env)).status,403);
 assert.equal((await call(env,'messages','a',data)).status,403);
 assert.equal((await call(env,'preferences','a',{receiveMessages:true})).status,200);
 assert.equal((await call(env,'messages','a',data)).status,403);
 await call(env,'preferences','b',{receiveMessages:true});
 assert.equal((await call(env,'messages','a',data)).status,201);
 sql.prepare("UPDATE accounts SET disabled=1 WHERE id='a'").run();assert.equal((await call(env,'messages')).status,401);
});
test('inbox isolation, idempotency, read ownership and unread notifications',async()=>{
 const {env,sql,profiles}=setup();consent(sql,'a','b','c');const data=payload(profiles);
 assert.equal((await call(env,'messages','a',data)).status,201);assert.equal((await call(env,'messages','a',data)).status,200);
 assert.equal((await call(env,'messages','c',data)).status,409);
 let feed=await(await call(env,'messages','b')).json();assert.equal(feed.messages.length,1);assert.equal(feed.unread,1);assert.equal(feed.messages[0].peerProfileId,profiles.a);assert.ok(!JSON.stringify(feed).includes('@example.test'));
 assert.equal((await(await call(env,'messages','c')).json()).messages.length,0);
 assert.equal((await call(env,'read','c',{id:data.id})).status,404);assert.equal((await call(env,'read','a',{id:data.id})).status,404);
 assert.equal((await call(env,'read','b',{id:data.id})).status,200);feed=await(await call(env,'messages','b')).json();assert.equal(feed.unread,0);
 assert.equal((await call(env,'messages','a',{...data,body:'Alterada'})).status,409);
});
test('blocking is bidirectional; recipient can report; consent withdrawal stops delivery',async()=>{
 const {env,sql,profiles}=setup();consent(sql,'a','b','c');const data=payload(profiles);await call(env,'messages','a',data);
 assert.equal((await call(env,'report','c',{id:data.id,reason:'Spam'})).status,404);
 assert.equal((await call(env,'report','b',{id:data.id,reason:'Spam'})).status,201);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM inbox_reports').get().n,1);
 await call(env,'block','b',{profileId:profiles.a,blocked:true});
 assert.equal((await call(env,'messages','a',payload(profiles))).status,403);
 assert.equal((await call(env,'messages','b',{id:crypto.randomUUID(),toProfile:profiles.a,body:'Outro sentido'})).status,403);
 await call(env,'block','b',{profileId:profiles.a,blocked:false});assert.equal((await call(env,'messages','a',payload(profiles))).status,201);
 await call(env,'preferences','b',{receiveMessages:false});assert.equal((await call(env,'messages','a',payload(profiles))).status,403);
});
test('server plan determines BASIC/PRO/MASTER message caps; global budget fails closed',async()=>{
 for(const [plan,cap] of [[null,5],['pro_monthly',50],['master_pro_annual',100]]){
  const {env,sql,profiles}=setup();consent(sql,'a','b');const day=new Date().toISOString().slice(0,10);
  if(plan)sql.prepare('INSERT INTO professional_entitlements VALUES(?,?,?,?,?,NULL)').run('a',plan,'fixture',1,Date.now()+60000);
  sql.prepare('INSERT INTO inbox_usage VALUES(?,?)').run('user:a:send:'+day,cap-1);
  assert.equal((await call(env,'messages','a',{...payload(profiles),plan:'master_pro'})).status,201);
  assert.equal((await call(env,'messages','a',payload(profiles))).status,429);
 }
 const {env,sql,profiles}=setup();consent(sql,'a','b');sql.prepare('INSERT INTO inbox_usage VALUES(?,100)').run('global:'+new Date().toISOString().slice(0,10));assert.equal((await call(env,'messages','a',payload(profiles))).status,429);assert.equal(sql.prepare('SELECT COUNT(*) n FROM inbox_messages').get().n,0);
});
test('portal requires login, uses matching CSP and text rendering, rejects large payloads',async()=>{
 const {env,profiles}=setup();assert.equal((await worker.fetch(req('/mensagens/',null),env)).status,302);
 const page=await worker.fetch(req('/mensagens/'),env);assert.equal(page.status,200);const html=await page.text(),script=html.split('<script>')[1].split('</script>')[0];assert.ok(page.headers.get('Content-Security-Policy').includes(createHash('sha256').update(script).digest('base64')));assert.ok(script.includes('p.textContent=m.body'));assert.ok(!script.includes('innerHTML'));
 assert.equal((await call(env,'messages','a',{...payload(profiles),body:'x'.repeat(15000)})).status,400);
 assert.equal((await call(env,'preferences','a',{receiveMessages:'true'})).status,400);
});

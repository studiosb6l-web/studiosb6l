import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import worker from '../cloudflare/artists-api-entry.mjs';
import {ambassadorPortal} from '../cloudflare/ambassador-portal.mjs';
import {activeAmbassador} from '../cloudflare/ambassador-access.mjs';
const origin='https://studiosb6l-artists-api.studiosb6l.workers.dev';
const tokens={owner:'a'.repeat(43),user:'b'.repeat(43),other:'c'.repeat(43)};
function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
 for(const file of ['001_sessions.sql','002_accounts.sql','003_account_onboarding.sql','010_ambassador_sessions.sql','011_ambassador_write_budget.sql'])sql.exec(readFileSync('cloudflare/migrations/'+file,'utf8'));
 const now=Date.now();
 for(const id of ['owner','user','other']){
  const role=id==='owner'?'owner':'artist';
  sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run(id,id+'@invalid.example',role,'not-a-password',1,0,now);
  sql.prepare('INSERT INTO account_onboarding(account_id,checkout_reference_hash,email_verified_at) VALUES(?,?,?)').run(id,id.repeat(64).slice(0,64),now);
  sql.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?)').run(createHash('sha256').update(tokens[id]).digest('hex'),id,role,1,id==='owner'?1:0,0,now+60000);
 }
 const wrap=(query,args=[])=>({bind(...values){return wrap(query,values);},first:async()=>sql.prepare(query).get(...args)||null,all:async()=>({results:sql.prepare(query).all(...args)}),run:async()=>({meta:{changes:Number(sql.prepare(query).run(...args).changes)}})});
 const DB={prepare:q=>wrap(q),batch:async stmts=>{sql.exec('BEGIN');try{const rows=[];for(const stmt of stmts)rows.push(await stmt.run());sql.exec('COMMIT');return rows;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,env:{DB,AMBASSADOR_ENABLED:'true',AUTH_RATE_LIMIT:{limit:async()=>({success:true})}}};
}
function req(path,body,who='owner',method=body===undefined?'GET':'POST',requestOrigin=origin){
 return new Request(origin+path,{method,headers:{...(requestOrigin?{Origin:requestOrigin}:{}),'CF-Connecting-IP':'192.0.2.1',...(who?{Cookie:'__Host-b6l_session='+tokens[who]}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
}
async function issue(env,email='user@invalid.example'){
 const r=await worker.fetch(req('/api/ambassador/admin/issue',{email,sectors:['teacher','company']}),env);
 assert.equal(r.status,201);return r.json();
}
const tokenOf=invite=>new URL(invite.url).hash.slice('#invite='.length);
test('MFA owner generates private, hashed, expiring universal invite with persisted audit',async()=>{
 const {env,sql}=setup(),invite=await issue(env,' USER@invalid.example '),token=tokenOf(invite);
 assert.match(invite.url,new RegExp('^'+origin.replaceAll('.','\\.')+'/ambassador/#invite=[a-f0-9]{64}$'));
 const row=sql.prepare('SELECT * FROM ambassador_invites').get();
 assert.equal(row.email,'user@invalid.example');assert.equal(row.issuer_id,'owner');
 assert.equal(row.token_hash,createHash('sha256').update(token).digest('hex'));assert.notEqual(row.token_hash,token);
 assert.equal(row.expires_at-row.created_at,7*24*60*60000);
 assert.deepEqual(JSON.parse(row.sectors_json),['teacher','company']);
 assert.equal(sql.prepare('SELECT event_type FROM ambassador_audit').get().event_type,'invite_issued');
 const r=await worker.fetch(req('/api/ambassador/admin/invites'),env),listed=await r.text();
 assert.equal(r.headers.get('Cache-Control'),'no-store');assert.ok(!listed.includes(token));assert.ok(!listed.includes(row.token_hash));
 assert.equal(JSON.parse(listed).items.length,1);
 assert.equal(sql.prepare('SELECT paid_at FROM account_onboarding WHERE account_id=?').get('user').paid_at,null);
});
test('generator and list deny visitors, ordinary users, stale MFA and disabled accounts',async()=>{
 const {env,sql}=setup();
 for(const who of [null,'user'])for(const [path,body] of [['/api/ambassador/admin/invites',undefined],['/api/ambassador/admin/issue',{email:'user@invalid.example',sectors:['teacher']}],['/api/ambassador/admin/revoke',{id:crypto.randomUUID()}]])assert.equal((await worker.fetch(req(path,body,who),env)).status,who?403:401);
 sql.prepare("UPDATE sessions SET mfa_verified=0 WHERE user_id='owner'").run();assert.equal((await worker.fetch(req('/api/ambassador/admin/invites'),env)).status,403);
 sql.prepare("UPDATE sessions SET mfa_verified=1 WHERE user_id='owner'").run();sql.prepare("UPDATE accounts SET disabled=1 WHERE id='owner'").run();assert.equal((await worker.fetch(req('/api/ambassador/admin/invites'),env)).status,403);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM ambassador_invites').get().n,0);
});
test('STOP, Preview, feature switch, missing limiter, exhausted budget and CSRF fail closed',async()=>{
 const {env,sql}=setup(),request=()=>req('/api/ambassador/admin/issue',{email:'user@invalid.example',sectors:['teacher']});
 for(const patch of [{STOP_SERVICE:'true'},{PREVIEW_ISOLATED:'true'},{AMBASSADOR_ENABLED:'false'},{AUTH_RATE_LIMIT:null}])assert.equal((await worker.fetch(request(),{...env,...patch})).status,503);
 assert.equal((await worker.fetch(request(),{...env,AUTH_RATE_LIMIT:{limit:async()=>({success:false})}})).status,429);
 for(const suppliedOrigin of [null,'https://evil.example'])assert.equal((await worker.fetch(req('/api/ambassador/admin/issue',{email:'user@invalid.example',sectors:['teacher']},'owner','POST',suppliedOrigin),env)).status,403);
 sql.prepare('INSERT INTO ambassador_write_budget VALUES(?,100)').run(new Date().toISOString().slice(0,10));assert.equal((await worker.fetch(request(),env)).status,429);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM ambassador_invites').get().n,0);
});
test('malformed requests cannot issue forged benefits, unknown sectors or invalid emails',async()=>{
 const {env,sql}=setup();
 for(const body of [{email:'bad',sectors:['teacher']},{email:'user@invalid.example',sectors:['__proto__']},{email:'user@invalid.example',sectors:[]},{email:'user@invalid.example',sectors:['teacher'],paymentVerified:true},null,[]])assert.equal((await worker.fetch(req('/api/ambassador/admin/issue',body),env)).status,400);
 assert.equal((await worker.fetch(req('/api/ambassador/admin/issue'),env)).status,405);
 assert.equal((await worker.fetch(req('/api/ambassador/admin/unknown',{}),env)).status,404);
 assert.equal((await worker.fetch(req('/api/ambassador/admin/issue',{email:'x'.repeat(3000),sectors:['teacher']}),env)).status,400);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM ambassador_invites').get().n,0);
});
test('issued invitation reaches recipient route and binds once to correct verified account without a charge',async()=>{
 const {env,sql}=setup(),invite=await issue(env),token=tokenOf(invite);
 assert.equal((await worker.fetch(req('/ambassador/',undefined,null),env)).status,200);
 assert.equal((await worker.fetch(req('/api/ambassador/redeem',{token},null),env)).status,401);
 assert.equal((await worker.fetch(req('/api/ambassador/redeem',{token},'other'),env)).status,400);
 assert.equal((await worker.fetch(req('/api/ambassador/redeem',{token},'user'),env)).status,200);
 assert.equal((await activeAmbassador(env,'user')).ambassadorActive,true);
 assert.equal((await worker.fetch(req('/api/ambassador/redeem',{token},'user'),env)).status,400);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM ambassador_grants').get().n,1);
 assert.equal(sql.prepare('SELECT paid_at FROM account_onboarding WHERE account_id=?').get('user').paid_at,null);
});
test('expiry, missing email verification and invite revocation prevent acceptance',async()=>{
 for(const mode of ['expiry','email','revoked']){
  const {env,sql}=setup(),invite=await issue(env),token=tokenOf(invite);
  if(mode==='expiry')sql.prepare('UPDATE ambassador_invites SET created_at=?,expires_at=?').run(Date.now()-10000,Date.now()-1);
  if(mode==='email')sql.prepare("UPDATE account_onboarding SET email_verified_at=NULL WHERE account_id='user'").run();
  if(mode==='revoked')assert.equal((await worker.fetch(req('/api/ambassador/admin/revoke',{id:invite.id}),env)).status,200);
  assert.equal((await worker.fetch(req('/api/ambassador/redeem',{token},'user'),env)).status,400);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM ambassador_grants').get().n,0);
 }
});
test('owner revokes invitation and associated grant atomically and idempotently',async()=>{
 const {env,sql}=setup(),invite=await issue(env),token=tokenOf(invite);
 await worker.fetch(req('/api/ambassador/redeem',{token},'user'),env);
 const r=await worker.fetch(req('/api/ambassador/admin/revoke',{id:invite.id}),env);assert.equal((await r.json()).revoked,true);
 assert.equal(await activeAmbassador(env,'user'),null);
 assert.equal(sql.prepare("SELECT COUNT(*) n FROM ambassador_audit WHERE event_type='invite_revoked'").get().n,1);
 const again=await worker.fetch(req('/api/ambassador/admin/revoke',{id:invite.id}),env);assert.equal((await again.json()).revoked,false);
});
test('database failure rolls invitation issuance back instead of returning a broken link',async()=>{
 const {env,sql}=setup();sql.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON ambassador_audit BEGIN SELECT RAISE(ABORT,'fixture failure'); END;");
 const r=await worker.fetch(req('/api/ambassador/admin/issue',{email:'user@invalid.example',sectors:['teacher']}),env);
 assert.equal(r.status,503);assert.equal(sql.prepare('SELECT COUNT(*) n FROM ambassador_invites').get().n,0);
});
test('admin entry, private generator page, scripts and invitation fragment handling are wired',async()=>{
 const {env}=setup();
 const entry=await(await worker.fetch(req('/administracao/'),env)).text();assert.ok(entry.includes('Gerador de convites AMBASSADOR'));
 assert.equal((await worker.fetch(req('/administracao/convites/',undefined,null),env)).status,302);
 assert.equal((await worker.fetch(req('/administracao/convites/',undefined,'user'),env)).status,403);
 assert.equal((await worker.fetch(req('/administracao/convites/'),env)).status,200);
 for(const admin of [true,false]){
  const r=await ambassadorPortal({admin}),html=await r.text(),script=html.split('<script>')[1].split('</script>')[0];
  assert.doesNotThrow(()=>new Script(script));assert.ok(r.headers.get('Content-Security-Policy').includes(createHash('sha256').update(script).digest('base64')));
  assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');assert.equal(r.headers.get('Cache-Control'),'no-store');
  assert.ok(!/localStorage|sessionStorage|innerHTML/.test(script));
  if(!admin)assert.ok(script.includes('history.replaceState'));
 }
});

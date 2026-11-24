import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import {ownerAuth} from '../cloudflare/owner-auth.mjs';
import {ownerPortal} from '../cloudflare/owner-portal.mjs';
import {totp,matchTotp,encodeBase32,encryptSeed,decryptSeed} from '../cloudflare/owner-crypto.mjs';
import {supportApi} from '../cloudflare/support-api.mjs';
import {login} from '../cloudflare/login-worker.mjs';
const origin='https://studiosb6l-artists-api.studiosb6l.workers.dev',password='Fixture owner private password 2026';
async function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const p of ['001_sessions','002_accounts','005_registration_email_budget','007_support','008_owner_mfa'])sql.exec(readFileSync('cloudflare/migrations/'+p+'.sql','utf8'));
 const DB={prepare(q){const bound=args=>({first:async()=>sql.prepare(q).get(...args)||null,all:async()=>({results:sql.prepare(q).all(...args)}),run:async()=>({meta:{changes:Number(sql.prepare(q).run(...args).changes)}})});return {...bound([]),bind:(...args)=>bound(args)};},async batch(stmts){sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,env:{DB,OWNER_ADMIN_ENABLED:'true',OWNER_BOOTSTRAP_ENABLED:'true',OWNER_EMAIL:'studiosb6l@gmail.com',OWNER_MFA_ENCRYPTION_KEY:'fixture-only-encryption-key-not-real-1234567890',LOGIN_ENABLED:'true',SUPPORT_ENABLED:'true',AUTH_RATE_LIMIT:{limit:async()=>({success:true})},REGISTRATION_EMAIL_PROVIDER:'brevo',BREVO_API_KEY:'fixture-only-provider-key',BREVO_SENDER_VERIFIED:'true',REGISTRATION_FROM_EMAIL:'studiosb6l@gmail.com',EMAIL_BUDGET_VERIFIED:'true',EMAIL_FREE_DAILY_QUOTA:'300',EMAIL_DAILY_BUDGET:'20'}};
}
function req(path,data,headers={}){return new Request(origin+'/api/admin/'+path,{method:data===undefined?'GET':'POST',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)});}
async function withMail(fn){const prior=globalThis.fetch,emails=[];globalThis.fetch=async(u,o)=>{assert.equal(u,'https://api.brevo.com/v3/smtp/email');emails.push(JSON.parse(o.body));return new Response('{}',{status:201});};try{return await fn(emails);}finally{globalThis.fetch=prior;}}
async function start(env,emails){const r=await ownerAuth(req('bootstrap/request',{}),env);assert.equal(r.status,202);const token=/#setup=([A-Za-z0-9_-]{43})/.exec(emails.at(-1).textContent)[1];const info=await (await ownerAuth(req('bootstrap/info',{token}),env)).json();assert.ok(info.success);return {token,secret:info.secret};}
async function enroll(env,emails){const b=await start(env,emails),code=await totp(b.secret,Math.floor(Date.now()/30000));const r=await ownerAuth(req('bootstrap/complete',{token:b.token,password,code}),env);assert.equal(r.status,200,await r.clone().text());return {...b,response:r,data:await r.json()};}
test('RFC 6238 SHA1 vectors, validation window, replay and encrypted seed isolation',async()=>{
 const secret=encodeBase32(new TextEncoder().encode('12345678901234567890'));
 for(const [time,code]of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']])assert.equal(await totp(secret,Math.floor(time/30),8),code);
 const code=await totp(secret,10);assert.equal(await matchTotp(secret,code,300000),10);assert.equal(await matchTotp(secret,code,300000,10),null);assert.equal(await matchTotp(secret,code,420000),null);
 const {env}=await setup(),a=await encryptSeed(env,secret,'u1'),b=await encryptSeed(env,secret,'u1');assert.notEqual(a,b);assert.equal(await decryptSeed(env,a,'u1'),secret);await assert.rejects(()=>decryptSeed(env,a,'u2'));await assert.rejects(()=>decryptSeed({...env,OWNER_MFA_ENCRYPTION_KEY:'z'.repeat(43)},a,'u1'));
});
test('email ownership + password + live TOTP enrolls fixed owner; setup is one-use',async()=>withMail(async emails=>{
 const {env,sql}=await setup();const e=await enroll(env,emails);const account=sql.prepare('SELECT * FROM accounts').get();assert.equal(account.email,'studiosb6l@gmail.com');assert.equal(account.role,'owner');assert.ok(account.password_hash.startsWith('scrypt$'));assert.notEqual(account.password_hash,password);
 assert.equal(e.data.recoveryCodes.length,8);for(const c of e.data.recoveryCodes)assert.equal(sql.prepare('SELECT COUNT(*) n FROM owner_recovery_codes WHERE code_hash=?').get(c).n,0);
 assert.equal(sql.prepare('SELECT mfa_verified FROM sessions').get().mfa_verified,1);assert.ok(e.response.headers.get('Set-Cookie').includes('HttpOnly; Secure; SameSite=Strict'));
 assert.equal((await ownerAuth(req('bootstrap/info',{token:e.token}),env)).status,400);assert.equal((await ownerAuth(req('bootstrap/complete',{token:e.token,password,code:'000000'}),env)).status,400);
 const count=emails.length;await ownerAuth(req('bootstrap/request',{}),env);assert.equal(emails.length,count);assert.equal(sql.prepare('SELECT COUNT(*) n FROM owner_mfa').get().n,1);
 const cookie=e.response.headers.get('Set-Cookie').split(';')[0];const support=await supportApi(new Request(origin+'/api/support/tickets',{headers:{Cookie:cookie,'CF-Connecting-IP':'192.0.2.1'}}),env);assert.equal((await support.json()).staff,true);
}));
test('owner login requires password and unused TOTP or one-use recovery code',async()=>withMail(async emails=>{
 const {env,sql}=await setup();const e=await enroll(env,emails),counter=Math.floor(Date.now()/30000)+1,code=await totp(e.secret,counter);
 assert.equal((await ownerAuth(req('login',{password:'wrong password fixture',code}),env)).status,401);
 const ok=await ownerAuth(req('login',{password,code}),env);assert.equal(ok.status,200);assert.equal((await ownerAuth(req('login',{password,code}),env)).status,401);
 assert.equal((await ownerAuth(req('login',{password,recoveryCode:e.data.recoveryCodes[0]}),env)).status,200);assert.equal((await ownerAuth(req('login',{password,recoveryCode:e.data.recoveryCodes[0]}),env)).status,401);
 assert.equal((await ownerAuth(req('login',{password,code}),env)).status,429);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM sessions').get().n,3);
 const regular=await login(new Request(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'studiosb6l@gmail.com',password,mfaVerified:true})}),{...env,RATE_LIMIT_VERIFIED:'true'});assert.equal(regular.status,403);
}));
test('invalid/expired enrollment, seed never exposed without link; five guesses exhaust enrollment',async()=>withMail(async emails=>{
 const {env,sql}=await setup();assert.equal((await ownerAuth(req('bootstrap/info',{token:'x'.repeat(43)}),env)).status,400);const b=await start(env,emails);
 const real=await totp(b.secret,Math.floor(Date.now()/30000)),bad=real==='000000'?'111111':'000000';
 assert.equal((await ownerAuth(req('bootstrap/complete',{token:b.token,password:'short',code:real}),env)).status,400);
 for(let i=0;i<5;i++)assert.equal((await ownerAuth(req('bootstrap/complete',{token:b.token,password,code:bad}),env)).status,401);
 assert.equal((await ownerAuth(req('bootstrap/complete',{token:b.token,password,code:real}),env)).status,400);assert.equal(sql.prepare('SELECT COUNT(*) n FROM accounts').get().n,0);
 sql.prepare('UPDATE owner_bootstrap SET attempts=0,expires_at=1').run();assert.equal((await ownerAuth(req('bootstrap/info',{token:b.token}),env)).status,400);
}));
test('CSRF, preview, missing encryption, disabled/foreign owners, STOP and email budget are enforced',async()=>withMail(async emails=>{
 for(const patch of [{PREVIEW_ISOLATED:'true'},{OWNER_ADMIN_ENABLED:'false'},{OWNER_MFA_ENCRYPTION_KEY:''},{OWNER_EMAIL:'attacker@example.test'},{STOP_SERVICE:'true'}]){const {env}=await setup();assert.equal((await ownerAuth(req('bootstrap/request',{}),{...env,...patch})).status,503);}
 const {env,sql}=await setup();assert.equal((await ownerAuth(req('bootstrap/request',{}, {Origin:'https://evil.example'}),env)).status,403);
 assert.equal((await ownerAuth(req('bootstrap/request',{}, {Origin:''}),env)).status,403);
 sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run('other','other@example.test','owner','fixture',1,0,1);await ownerAuth(req('bootstrap/request',{}),env);assert.equal(emails.length,0);sql.prepare('DELETE FROM accounts').run();
 sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run('disabled','studiosb6l@gmail.com','owner','fixture',1,1,1);await ownerAuth(req('bootstrap/request',{}),env);assert.equal(emails.length,0);sql.prepare('DELETE FROM accounts').run();
 sql.prepare('INSERT INTO registration_email_budget VALUES(?,20)').run(new Date().toISOString().slice(0,10));assert.equal((await ownerAuth(req('bootstrap/request',{}),env)).status,503);assert.equal(emails.length,0);
}));
test('existing ordinary official-email account is enrolled only through email proof; pending links not replaced',async()=>withMail(async emails=>{
 const {env,sql}=await setup();sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run('official','studiosb6l@gmail.com','artist','fixture',0,0,1);
 const b=await start(env,emails);await ownerAuth(req('bootstrap/request',{}),env);assert.equal(emails.length,1);assert.equal(sql.prepare('SELECT role FROM accounts').get().role,'artist');
 const code=await totp(b.secret,Math.floor(Date.now()/30000));assert.equal((await ownerAuth(req('bootstrap/complete',{token:b.token,password,code}),env)).status,200);assert.equal(sql.prepare('SELECT id FROM accounts').get().id,'official');assert.equal(sql.prepare('SELECT role FROM accounts').get().role,'owner');
}));
test('portal CSP matches inline script; no secret in HTML, storage or query string',async()=>{
 const r=ownerPortal(),html=await r.text(),script=/<script>([\s\S]*?)<\/script>/.exec(html)[1],hash=createHash('sha256').update(script).digest('base64');assert.doesNotThrow(()=>new Script(script));assert.ok(r.headers.get('Content-Security-Policy').includes(hash));assert.ok(script.includes('history.replaceState'));assert.ok(!/localStorage|sessionStorage|innerHTML/.test(script));assert.ok(!html.includes('fixture-only-encryption'));const {env}=await setup();assert.equal((await ownerAuth(req('status'),env)).status,200);assert.equal((await ownerAuth(req('bootstrap/request',{},{}),{...env,AUTH_RATE_LIMIT:{limit:async()=>({success:false})}})).status,429);assert.equal((await ownerAuth(new Request(origin+'/api/admin/login',{method:'OPTIONS',headers:{Origin:origin}}),env)).status,204);
});

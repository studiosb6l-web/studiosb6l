import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {hashSessionToken} from '../cloudflare/session-tokens.mjs';
import {supportApi} from '../cloudflare/support-api.mjs';
import {supportPortal} from '../cloudflare/support-portal.mjs';
import {supportEmail} from '../cloudflare/support-email.mjs';
import router from '../cloudflare/artists-api-entry.mjs';
import {createHash} from 'node:crypto';
const token='a'.repeat(43),origin='https://studiosb6l-artists-api.studiosb6l.workers.dev';
async function setup({role='artist',mfa=0}={}){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const p of ['001_sessions','002_accounts','005_registration_email_budget','007_support'])sql.exec(readFileSync('cloudflare/migrations/'+p+'.sql','utf8'));
 for(const id of ['u1','u2'])sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run(id,id+'@example.test',id==='u1'?role:'artist','fixture',1,0,1);
 sql.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?)').run(await hashSessionToken(token),'u1',role,1,mfa,0,Date.now()+600000);
 const DB={prepare(q){const bound=args=>({first:async()=>sql.prepare(q).get(...args)||null,all:async()=>({results:sql.prepare(q).all(...args)}),run:async()=>({meta:{changes:Number(sql.prepare(q).run(...args).changes)}})});return {...bound([]),bind:(...args)=>bound(args)};},async batch(stmts){sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,env:{DB,SUPPORT_ENABLED:'true',AUTH_RATE_LIMIT:{limit:async()=>({success:true})}}};
}
function request(path='',data,patch={}){return new Request(origin+'/api/support/tickets'+path,{method:data?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer '+token,'CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json',...patch},body:data?JSON.stringify(data):undefined});}
const payload=()=>({id:crypto.randomUUID(),subject:'Pagamento e acesso',category:'payment',body:'Paguei mas não consigo entrar.'});
test('create private ticket, automatic reply, append and retry without duplicate',async()=>{
 const {env,sql}=await setup();const p=payload();assert.equal((await supportApi(request('',p),env)).status,201);assert.equal((await supportApi(request('',p),env)).status,200);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM support_messages').get().n,2);
 const j=await (await supportApi(request('/'+p.id),env)).json();assert.equal(j.messages[1].author,'system');assert.match(j.messages[1].body,/não voltes a pagar/i);
 const m={id:crypto.randomUUID(),body:'Outra informação.'};for(let i=0;i<2;i++)assert.ok((await supportApi(request('/'+p.id+'/messages',m),env)).ok);assert.equal(sql.prepare('SELECT COUNT(*) n FROM support_messages').get().n,3);
 assert.equal((await (await supportApi(request(),env)).json()).tickets.length,1);
});
test('another account cannot read, reply or close a private ticket',async()=>{
 const {env,sql}=await setup();const p=payload();await supportApi(request('',p),env);sql.prepare('UPDATE support_tickets SET account_id=? WHERE id=?').run('u2',p.id);
 for(const [path,data]of [['/'+p.id],['/'+p.id+'/messages',{id:crypto.randomUUID(),body:'steal'}],['/'+p.id+'/close',{}]])assert.equal((await supportApi(request(path,data),env)).status,404);
 assert.equal((await (await supportApi(request(),env)).json()).tickets.length,0);
});
test('staff requires verified owner MFA; staff can reply and close',async()=>{
 const {env,sql}=await setup({role:'owner',mfa:1});const p=payload();sql.prepare('INSERT INTO support_tickets VALUES(?,?,?,?,?,?,?)').run(p.id,'u2',p.subject,'payment','open',1,1);
 assert.equal((await (await supportApi(request(),env)).json()).staff,true);
 assert.equal((await supportApi(request('/'+p.id+'/messages',{id:crypto.randomUUID(),body:'Vamos verificar.'}),env)).status,201);assert.equal(sql.prepare('SELECT author FROM support_messages').get().author,'staff');
 assert.equal((await supportApi(request('/'+p.id+'/close',{}),env)).status,200);
 assert.equal((await supportApi(request('/'+p.id+'/messages',{id:crypto.randomUUID(),body:'late'}),env)).status,409);
 sql.prepare('UPDATE sessions SET mfa_verified=0').run();assert.equal((await supportApi(request(),env)).status,401);
});
test('non-admin cannot close; expired sessions, CSRF, preview, STOP and quotas blocked',async()=>{
 const {env,sql}=await setup();const p=payload();await supportApi(request('',p),env);assert.equal((await supportApi(request('/'+p.id+'/close',{}),env)).status,403);
 assert.equal((await supportApi(request('',payload(),{Origin:'https://evil.example'}),env)).status,403);
 for(const patch of [{PREVIEW_ISOLATED:'true'},{STOP_SERVICE:'true'},{SUPPORT_ENABLED:'false'}])assert.equal((await supportApi(request('',payload()),{...env,...patch})).status,503);
 sql.prepare('UPDATE support_usage SET used=100').run();assert.equal((await supportApi(request('',payload()),env)).status,429);
 sql.prepare('UPDATE sessions SET expires_at=1').run();assert.equal((await supportApi(request(),env)).status,401);
});
test('bounded input, unavailable database and email failure do not misreport ticket storage',async()=>{
 const {env,sql}=await setup();assert.equal((await supportApi(request('',{...payload(),body:'x'.repeat(9000)}),env)).status,400);
 assert.equal((await supportApi(request('',{...payload(),category:'toString'}),env)).status,400);
 const failing={...env,DB:{prepare(){throw Error('private db details');}}};const r=await supportApi(request(),failing);assert.equal(r.status,401);assert.doesNotMatch(await r.text(),/private db details/);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM support_tickets').get().n,0);
});
test('portal CSP matches script and renders untrusted content via textContent',async()=>{
 const r=supportPortal(),html=await r.text();const script=/<script>([\s\S]*?)<\/script>/.exec(html)[1];const hash=createHash('sha256').update(script).digest('base64');assert.ok(r.headers.get('Content-Security-Policy').includes(hash));assert.ok(!script.includes('innerHTML'));assert.ok(html.includes('mailto:studiosb6l@gmail.com'));assert.ok((await router.fetch(new Request(origin+'/ajuda/'),{})).ok);
});
test('notification includes safe reply address, shares daily quota and never sends in preview',async()=>{
 const {env,sql}=await setup();Object.assign(env,{REGISTRATION_EMAIL_PROVIDER:'brevo',BREVO_API_KEY:'fixture-private-brevo-key',BREVO_SENDER_VERIFIED:'true',REGISTRATION_FROM_EMAIL:'studiosb6l@gmail.com',EMAIL_BUDGET_VERIFIED:'true',EMAIL_FREE_DAILY_QUOTA:'300',EMAIL_DAILY_BUDGET:'20'});
 const msg={to:'studiosb6l@gmail.com',replyTo:'u1@example.test',ticketId:crypto.randomUUID(),kind:'new',message:'Ajuda',subject:'Acesso'};let sent=0;const send=async(u,o)=>{sent++;assert.equal(JSON.parse(o.body).replyTo.email,'u1@example.test');return new Response('{}',{status:201});};
 assert.equal(await supportEmail(env,msg,send),true);assert.equal(await supportEmail({...env,PREVIEW_ISOLATED:'true'},msg,send),false);sql.prepare('UPDATE registration_email_budget SET used=20').run();assert.equal(await supportEmail(env,msg,send),false);assert.equal(sent,1);
});

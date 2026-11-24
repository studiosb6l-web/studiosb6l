import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomBytes} from 'node:crypto';
import Stripe from 'stripe';
import {admissionWebhook} from '../cloudflare/admission-billing.mjs';
import router from '../cloudflare/artists-api-entry.mjs';
const stripe=new Stripe(undefined,{authenticator:async()=>{throw Error('No external API calls in tests')}});
const secret='whsec_'+randomBytes(32).toString('hex');
const token='x'.repeat(43),ref=createHash('sha256').update(token).digest('hex');
function database({emailVerified=true,disabled=0,role='artist'}={}){
 const sql=new DatabaseSync(':memory:');
 for(const p of ['002_accounts.sql','001_sessions.sql','003_account_onboarding.sql'])sql.exec(readFileSync('cloudflare/migrations/'+p,'utf8'));
 sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run('u1','fixture@invalid.example',role,'unused',0,disabled,Date.now());
 sql.prepare('INSERT INTO account_onboarding(account_id,checkout_reference_hash,email_verified_at) VALUES(?,?,?)').run('u1',ref,emailVerified?Date.now():null);
 const db={sql,failAt:-1,prepare(query){return {bind(...args){return {run:()=>sql.prepare(query).run(...args),first:()=>sql.prepare(query).get(...args)}}}},async batch(statements){sql.exec('BEGIN');try{const results=statements.map((s,i)=>{if(i===db.failAt)throw Error('Simulated database failure');return s.run()});sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}};return db;
}
const event=(patch={})=>({id:'evt_fixture',type:'checkout.session.completed',livemode:true,data:{object:{object:'checkout.session',id:'cs_fixture',payment_intent:'pi_fixture',mode:'payment',status:'complete',payment_status:'paid',currency:'eur',amount_total:299,payment_link:'plink_fixture',client_reference_id:token,...patch}}});
function request(e,opts={}){const payload=JSON.stringify(e);const signature=stripe.webhooks.generateTestHeaderString({payload,secret:opts.secret||secret,timestamp:opts.timestamp||Math.floor(Date.now()/1000)});return new Request('https://worker.example/api/billing/stripe/webhook',{method:'POST',headers:{'Content-Type':'application/json','Stripe-Signature':signature},body:payload});}
const env=DB=>({DB,STRIPE_ADMISSION_WEBHOOK_SECRET:secret,STRIPE_ADMISSION_PAYMENT_LINK_ID:'plink_fixture'});
const account=db=>db.sql.prepare('SELECT * FROM accounts').get();
const ledger=db=>db.sql.prepare('SELECT * FROM account_onboarding').get();
test('paid admission activates an email-verified ordinary account',async()=>{const db=database();assert.equal((await admissionWebhook(request(event()),env(db))).status,200);assert.equal(account(db).verified,1);assert.ok(ledger(db).activated_at);assert.equal(ledger(db).stripe_payment_intent_id,'pi_fixture')});
test('payment alone cannot verify an unconfirmed email',async()=>{const db=database({emailVerified:false});await admissionWebhook(request(event()),env(db));assert.equal(account(db).verified,0);assert.ok(ledger(db).paid_at);assert.equal(ledger(db).activated_at,null)});
test('duplicate paid events are idempotent',async()=>{const db=database();await admissionWebhook(request(event()),env(db));const first=ledger(db).activated_at;await admissionWebhook(request(event()),env(db));assert.equal(ledger(db).activated_at,first);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM admission_payment_events').get().n,1)});
test('invalid and expired signatures cause no database changes',async()=>{for(const opts of [{secret:'different-fixture'}, {timestamp:Math.floor(Date.now()/1000)-1000}]){const db=database();assert.equal((await admissionWebhook(request(event(),opts),env(db))).status,400);assert.equal(account(db).verified,0);assert.equal(ledger(db).paid_at,null)}});
test('price, currency, link, status and payment mode are enforced',async()=>{for(const patch of [{amount_total:298},{amount_total:300},{currency:'usd'},{payment_link:'plink_other'},{payment_status:'unpaid'},{payment_status:'no_payment_required'},{mode:'subscription'},{status:'open'}]){const db=database();await admissionWebhook(request(event(patch)),env(db));assert.equal(account(db).verified,0);assert.equal(ledger(db).paid_at,null)}});
test('test-mode events cannot activate production accounts',async()=>{const db=database();const e=event();e.livemode=false;assert.equal((await admissionWebhook(request(e),env(db))).status,400);assert.equal(account(db).verified,0)});
test('payments cannot enable disabled or administrative accounts',async()=>{for(const options of [{disabled:1},{role:'owner'}]){const db=database(options);await admissionWebhook(request(event()),env(db));assert.equal(account(db).verified,0);assert.equal(ledger(db).activated_at,null)}});
test('unknown checkout references cannot activate another account',async()=>{const db=database();await admissionWebhook(request(event({client_reference_id:'y'.repeat(43)})),env(db));assert.equal(account(db).verified,0);assert.equal(ledger(db).paid_at,null)});
test('failed transaction rolls back both event and entitlement',async()=>{const db=database();db.failAt=2;assert.equal((await admissionWebhook(request(event()),env(db))).status,503);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM admission_payment_events').get().n,0);assert.equal(ledger(db).paid_at,null);assert.equal(account(db).verified,0)});
test('legacy Stripe webhook is unreachable even during STOP',async()=>{const db=database();assert.equal((await router.fetch(request(event()),{...env(db),STOP_SERVICE:'true'})).status,404);assert.equal(account(db).verified,0)});
test('a full refund revokes access and a replay cannot restore it',async()=>{const db=database();await admissionWebhook(request(event()),env(db));db.sql.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?)').run('a'.repeat(64),'u1','artist',1,0,0,Date.now()+1000);const refund={id:'evt_refund',type:'charge.refunded',livemode:true,data:{object:{object:'charge',payment_intent:'pi_fixture',amount:299,amount_refunded:299}}};await admissionWebhook(request(refund),env(db));assert.equal(account(db).verified,0);assert.ok(ledger(db).revoked_at);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,0);await admissionWebhook(request(event()),env(db));assert.equal(account(db).verified,0)});
test('payment disputes revoke ordinary account access',async()=>{const db=database();await admissionWebhook(request(event()),env(db));const dispute={id:'evt_dispute',type:'charge.dispute.created',livemode:true,data:{object:{object:'dispute',payment_intent:'pi_fixture'}}};await admissionWebhook(request(dispute),env(db));assert.equal(account(db).verified,0);assert.ok(ledger(db).revoked_at)});
test('missing webhook configuration fails closed',async()=>{assert.equal((await admissionWebhook(request(event()),{})).status,503)});

test('a refund arriving before completion prevents later activation',async()=>{const db=database();const refund={id:'evt_early_refund',type:'charge.refunded',livemode:true,data:{object:{object:'charge',payment_intent:'pi_fixture',amount:299,amount_refunded:299}}};assert.equal((await admissionWebhook(request(refund),env(db))).status,200);await admissionWebhook(request(event()),env(db));assert.equal(account(db).verified,0);assert.ok(ledger(db).revoked_at)});
test('async payment success activates only after settlement',async()=>{const db=database();await admissionWebhook(request(event({payment_status:'unpaid'})),env(db));assert.equal(account(db).verified,0);const paid=event();paid.id='evt_async_success';paid.type='checkout.session.async_payment_succeeded';await admissionWebhook(request(paid),env(db));assert.equal(account(db).verified,1)});
test('oversize signed body is rejected before processing',async()=>{const db=database();const e=event();e.padding='x'.repeat(70000);assert.equal((await admissionWebhook(request(e),env(db))).status,413);assert.equal(ledger(db).paid_at,null)});

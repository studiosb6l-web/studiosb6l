import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {persistRecurringEntitlement} from '../cloudflare/recurring-entitlement-reconcile.mjs';
test('verified subscription persistence rejects duplicates and older renewal after cancellation',async()=>{
 const sql=new DatabaseSync(':memory:');
 try{
 sql.exec("CREATE TABLE accounts(id TEXT PRIMARY KEY,verified INTEGER,disabled INTEGER); CREATE TABLE account_onboarding(account_id TEXT,email_verified_at INTEGER,paid_at INTEGER,revoked_at INTEGER); CREATE TABLE payhip_admission_payments(account_id TEXT,revoked_at INTEGER); INSERT INTO accounts VALUES('a',1,0); INSERT INTO account_onboarding VALUES('a',1,2,NULL);");
 sql.exec(readFileSync('cloudflare/paid-subscription-schema.sql','utf8'));
 const db={prepare(q){return {bind(...args){return {run:async()=>({meta:{changes:Number(sql.prepare(q).run(...args).changes)}})}}}}};
 const mapping={p:{plan:'PRO',interval:'month'}};
 const s={subscriptionId:'s',accountId:'a',observedAt:900,status:'active',invoicePaid:true,admissionVerified:true,paidUntil:2000,price:{id:'p',active:true,currency:'eur',type:'recurring',unit_amount:499,recurring:{interval:'month',interval_count:1}}};
 const save=x=>persistRecurringEntitlement(db,x,mapping,1000);
 assert.equal(await save(s),false);
 sql.exec("INSERT INTO payhip_admission_payments VALUES('a',NULL)");
 assert.equal(await save({...s,subscriptionId:'early',status:'canceled',observedAt:950}),true);
 assert.equal(await save({...s,subscriptionId:'early',observedAt:940}),false);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM paid_subscription_entitlements').get().n,0);
 assert.equal(await save(s),true);
 assert.equal(await save(s),false);
 assert.equal(await save({...s,status:'canceled',observedAt:950}),true);
 assert.equal(await save({...s,observedAt:940}),false);
 assert.equal(sql.prepare('SELECT revoked_at FROM paid_subscription_entitlements').get().revoked_at,950);
 }finally{sql.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {loadPaidMembership} from '../cloudflare/paid-subscription-store.mjs';
test('paid membership requires admission, verified subscription and no revocation',async()=>{
 const sql=new DatabaseSync(':memory:');
 try{
 sql.exec("CREATE TABLE accounts(id TEXT PRIMARY KEY,verified INTEGER,disabled INTEGER); CREATE TABLE account_onboarding(account_id TEXT,email_verified_at INTEGER,paid_at INTEGER,revoked_at INTEGER); CREATE TABLE payhip_admission_payments(account_id TEXT,revoked_at INTEGER); INSERT INTO accounts VALUES('a',1,0); INSERT INTO account_onboarding VALUES('a',1,2,NULL);");
 sql.exec(readFileSync('cloudflare/paid-subscription-schema.sql','utf8'));
 sql.exec("INSERT INTO paid_subscription_entitlements VALUES('a','fixture','PRO_BUSINESS',10,2000,NULL)");
 const env={PAID_SUBSCRIPTIONS_VERIFIED:'true',DB:{prepare(q){return {bind(...args){return {first:async()=>sql.prepare(q).get(...args)}}}}}};
 const load=()=>loadPaidMembership('a',env,1000);
 assert.equal(await load(),null);
 sql.exec("INSERT INTO payhip_admission_payments VALUES('a',NULL)");
 assert.equal((await load()).plan,'PRO_BUSINESS');
 sql.exec("UPDATE paid_subscription_entitlements SET revoked_at=900");
 assert.equal(await load(),null);
 sql.exec("UPDATE paid_subscription_entitlements SET revoked_at=NULL,paid_until=1000");
 assert.equal(await load(),null);
 sql.exec("UPDATE paid_subscription_entitlements SET paid_until=2000; UPDATE payhip_admission_payments SET revoked_at=900");
 assert.equal(await load(),null);
 }finally{sql.close();}
});

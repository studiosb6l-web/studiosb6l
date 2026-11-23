import test from 'node:test';
import assert from 'node:assert/strict';
import {checkProAccess} from '../cloudflare/pro-d1-access.mjs';
const now=Math.floor(Date.now()/1000);
const session={userId:'account-1',role:'artist',verified:true,disabled:false,expiresAt:Date.now()+600000};
const subscription={plan:'pro',subscription_status:'active',stripe_subscription_id:'sub_test',current_period_end:now+3600};
function db(onboarding={activated_at:now-60,revoked_at:null},sub=subscription){
  const calls=[];
  return {calls,prepare(sql){calls.push(sql);return {bind(id){assert.equal(id,'account-1');return {async first(){return sql.includes('account_onboarding')?onboarding:sub;}};}};}};
}
const capability='opportunities:alerts';
test('paid and activated account with active PRO is allowed',async()=>{
  const database=db();assert.equal(await checkProAccess({db:database,session,capability,now}),true);assert.equal(database.calls.length,2);
});
test('unactivated or revoked admission denies PRO',async()=>{
  for(const row of [null,{activated_at:null,revoked_at:null},{activated_at:now,revoked_at:now}]){
    const database=db(row);assert.equal(await checkProAccess({db:database,session,capability,now}),false);assert.equal(database.calls.length,1);
  }
});
test('expired subscription, missing D1 or query failure deny PRO',async()=>{
  assert.equal(await checkProAccess({db:db(undefined,{...subscription,current_period_end:now}),session,capability,now}),false);
  assert.equal(await checkProAccess({session,capability,now}),false);
  assert.equal(await checkProAccess({db:{prepare(){throw Error('D1 unavailable')}},session,capability,now}),false);
});
test('unknown capability or invalid session is denied before D1 access',async()=>{
  const database=db();
  assert.equal(await checkProAccess({db:database,session,capability:'admin:read',now}),false);
  assert.equal(await checkProAccess({db:database,session:{...session,verified:false},capability,now}),false);
  assert.equal(database.calls.length,0);
});

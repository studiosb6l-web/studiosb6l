import test from 'node:test';
import assert from 'node:assert/strict';
import {proEntitled,effectivePlan} from '../cloudflare/pro-entitlements.mjs';
const now=2000000000;
const active={plan:'pro',subscription_status:'active',stripe_subscription_id:'sub_123',current_period_end:now+3600};
test('only active verified PRO with future period gets PRO',()=>{
  assert.equal(proEntitled({accountActive:true,subscription:active,now}),true);
  assert.equal(effectivePlan({accountActive:true,subscription:active,now}),'pro');
});
test('default is BASIC and missing account activation fails closed',()=>{
  assert.equal(proEntitled({subscription:active,now}),false);
  assert.equal(effectivePlan({now}),'basic');
});
test('rejects expired and boundary period',()=>{
  assert.equal(proEntitled({accountActive:true,subscription:{...active,current_period_end:now},now}),false);
  assert.equal(proEntitled({accountActive:true,subscription:{...active,current_period_end:now-1},now}),false);
});
test('rejects canceled, unpaid, past due and incomplete subscriptions',()=>{
  for(const status of ['canceled','unpaid','past_due','incomplete','trialing','inactive']){
    assert.equal(proEntitled({accountActive:true,subscription:{...active,subscription_status:status},now}),false);
  }
});
test('rejects malformed subscription and invalid Stripe identifier',()=>{
  for(const subscription of [null,{}, {...active,plan:'basic'}, {...active,stripe_subscription_id:'fake'}, {...active,current_period_end:'2099'}, {...active,current_period_end:Infinity}]){
    assert.equal(proEntitled({accountActive:true,subscription,now}),false);
  }
});

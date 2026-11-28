import test from 'node:test';
import assert from 'node:assert/strict';
import {APPROVED_PLANS,CURRENCY} from '../cloudflare/approved-plan-catalog.mjs';
test('approved EUR prices are exact integer cents',()=>{
 assert.equal(CURRENCY,'EUR');
 assert.deepEqual(APPROVED_PLANS,{VISITOR:{oneTime:0},BASIC:{oneTime:299},PRO:{monthly:499,annual:4990},PRO_PLUS:{monthly:999,annual:9990},PRO_BUSINESS:{monthly:1499,annual:14990}});
});
test('annual subscriptions cost ten monthly payments',()=>{
 for(const key of ['PRO','PRO_PLUS','PRO_BUSINESS']){
  const plan=APPROVED_PLANS[key];
  assert.equal(plan.annual,10*plan.monthly);
  assert.ok(Object.isFrozen(plan));
 }
 assert.ok(Object.isFrozen(APPROVED_PLANS));
});

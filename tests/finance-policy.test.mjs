import test from 'node:test';
import assert from 'node:assert/strict';
import { financePolicy, quotaPolicy } from '../cloudflare/finance-policy.mjs';
const base = {verified:true, stopped:false, freeCashCents:1000000, committedCents:0, spentCents:0};
test('strict monthly revenue threshold', () => {
 for (const n of [0,999999,1000000]) assert.equal(financePolicy({...base,netRevenueCents:n}).availableCents,0);
 assert.equal(financePolicy({...base,netRevenueCents:1000001}).availableCents,50000);
});
test('cash and commitments constrain budget', () => {
 assert.equal(financePolicy({...base,netRevenueCents:1200000,committedCents:10000,spentCents:20000,freeCashCents:20000}).availableCents,20000);
});
test('fail closed and always require approval', () => {
 for (const patch of [{verified:false},{stopped:true},{netRevenueCents:NaN},{freeCashCents:-1}]) {
 const r=financePolicy({...base,netRevenueCents:1200000,...patch});
 assert.equal(r.availableCents,0); assert.equal(r.requiresFounderApproval,true);
 }
});
test('quota warning and hard ceiling', () => {
 assert.deepEqual(quotaPolicy({used:59,limit:100,requested:1,stopped:false}),{allowed:true,warning:true});
 assert.equal(quotaPolicy({used:69,limit:100,requested:2,stopped:false}).allowed,false);
 assert.equal(quotaPolicy({used:69,limit:100,requested:1,stopped:false}).allowed,true);
 assert.equal(quotaPolicy({used:0,limit:100,requested:1,stopped:true}).allowed,false);
});

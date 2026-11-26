import test from 'node:test';
import assert from 'node:assert/strict';
import {effectivePlan,canHost,attendanceLimits,canReserveQuota} from '../cloudflare/ambassador-session-policy.mjs';
const now=1000;
test('ambassador benefits are role-independent at policy layer and revocation preserves paid plan',()=>{
 for(const role of ['artist','producer','promoter','venue','company','student']){
 const member={role,disabled:false,ambassadorActive:true,paymentVerified:false};
 assert.equal(effectivePlan(member,now),'PRO_BUSINESS');
 assert.equal(canHost(member,now),true);
 assert.deepEqual(attendanceLimits(member,now),{monthly:8,weekly:2});
 assert.equal(effectivePlan({...member,ambassadorActive:false},now),null);
 assert.equal(effectivePlan({...member,ambassadorActive:false,paymentVerified:true,paidUntil:now+1,plan:'PRO'},now),'PRO');
 assert.equal(effectivePlan({...member,disabled:true},now),null);
 }
});
test('quota policy rejects missing metrics and reservations above 70 percent',()=>{
 assert.equal(canReserveQuota([]),false);
 assert.equal(canReserveQuota([{used:60,reserved:9,requested:1,freeLimit:100}]),true);
 assert.equal(canReserveQuota([{used:60,reserved:9,requested:2,freeLimit:100}]),false);
});

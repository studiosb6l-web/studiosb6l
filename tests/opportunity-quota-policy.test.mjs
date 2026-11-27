import test from 'node:test';
import assert from 'node:assert/strict';
import {mayCollect} from '../cloudflare/opportunity-quota-policy.mjs';
const now=100000;
const base={stopped:false,freeTier:true,quota:100,used:60,reserved:9,cost:1,windowEndsAt:200000,observedAt:now};
test('70 percent ceiling includes reservations',()=>{
 assert.equal(mayCollect(base,now),true);
 assert.equal(mayCollect({...base,cost:2},now),false);
});
test('unknown, stale, paid, stopped or expired quotas fail closed',()=>{
 for(const patch of [{quota:undefined},{observedAt:now-60001},{freeTier:false},{stopped:true},{stopped:undefined},{windowEndsAt:now},{cost:-1},{reserved:NaN},{observedAt:now+1}])assert.equal(mayCollect({...base,...patch},now),false);
});

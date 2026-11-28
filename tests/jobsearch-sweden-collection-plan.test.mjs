import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planSwedishCollection} from '../cloudflare/jobsearch-sweden-collection-plan.mjs';
const now=1700000000000;
const source={name:'Arbetsförmedlingen JobSearch',enabled:true,authorized:true,apiOrigin:'https://jobsearch.api.jobtechdev.se'};
const quota={stopped:false,freeTier:true,quota:100,used:60,reserved:3,windowEndsAt:now+60000,observedAt:now};
test('batch fits exactly within 70 percent',()=>{
 const plan=planSwedishCollection(source,quota,now);
 assert.equal(plan.reservationUnits,7);
 assert.equal(plan.requests.length,7);
});
test('reject unsafe source or quota state',()=>{
 for(const patch of [{enabled:false},{authorized:false},{apiOrigin:'https://example.com'}])
  assert.equal(planSwedishCollection({...source,...patch},quota,now),null);
 for(const patch of [{stopped:true},{freeTier:false},{used:61},{quota:undefined},{observedAt:now-60001},{windowEndsAt:now}])
  assert.equal(planSwedishCollection(source,{...quota,...patch},now),null);
 assert.equal(planSwedishCollection(source,undefined,now),null);
});

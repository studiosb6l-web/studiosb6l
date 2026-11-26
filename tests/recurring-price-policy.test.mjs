import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedRecurringPrice} from '../cloudflare/recurring-price-policy.mjs';
test('only configured active EUR recurring prices with exact amounts qualify',()=>{
 const mapping={price_fixture:{plan:'PRO_BUSINESS',interval:'month'}};
 const price={id:'price_fixture',active:true,currency:'eur',type:'recurring',unit_amount:999,recurring:{interval:'month',interval_count:1}};
 assert.deepEqual(verifiedRecurringPrice(price,mapping),{plan:'PRO_BUSINESS',interval:'month',amount:999});
 for(const patch of [{unit_amount:499},{currency:'usd'},{active:false},{id:'unknown'},{type:'one_time'},{recurring:{interval:'year',interval_count:1}},{recurring:{interval:'month',interval_count:2}}])assert.equal(verifiedRecurringPrice({...price,...patch},mapping),null);
 assert.equal(verifiedRecurringPrice(price,{}),null);
});

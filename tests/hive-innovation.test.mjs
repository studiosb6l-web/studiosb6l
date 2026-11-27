import test from 'node:test';
import assert from 'node:assert/strict';
import {screenInnovation} from '../cloudflare/hive-innovation.mjs';
const base={verified:true,distinctRequests:30,estimatedRevenueCents:10000,estimatedCostCents:0,freeCapacityVerified:true};
test('free pilot is advisory only',()=>assert.deepEqual(screenInnovation(base),{status:'consider_free_pilot',estimatedMarginCents:10000,authorized:false}));
test('cost or unknown capacity requires review',()=>{for(const p of [{estimatedCostCents:1},{freeCapacityVerified:false}])assert.equal(screenInnovation({...base,...p}).status,'review_required');});
test('reject weak demand and negative economics',()=>{assert.equal(screenInnovation({...base,distinctRequests:2}).status,'collect_evidence');assert.equal(screenInnovation({...base,estimatedCostCents:20000}).status,'reject_economics');assert.equal(screenInnovation({...base,verified:false}).status,'insufficient_data');});

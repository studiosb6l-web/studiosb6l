import test from 'node:test';
import assert from 'node:assert/strict';
import {retentionInsights} from '../cloudflare/hive-retention.mjs';
const base={verified:true,consent:true,opportunities:0,matches:0,confirmedOutcomes:0,periodDays:30};
test('missing evidence or consent denies assessment',()=>{for(const p of [{verified:false},{consent:false},{periodDays:0},{matches:-1}])assert.equal(retentionInsights({...base,...p}).status,'unavailable');});
test('recommend service improvement rather than pressure',()=>assert.deepEqual(retentionInsights(base).recommendations,['review_opportunity_coverage','offer_optional_profile_review','offer_optional_feedback']));
test('verified positive outcomes',()=>assert.deepEqual(retentionInsights({...base,opportunities:5,matches:2,confirmedOutcomes:1}).recommendations,[]));

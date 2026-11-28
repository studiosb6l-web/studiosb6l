import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateEngine} from '../cloudflare/hive-evaluation.mjs';
test('missing evidence is not success',()=>assert.equal(evaluateEngine().status,'insufficient_data'));
test('reject inconsistent counts',()=>assert.equal(evaluateEngine({verified:true,observed:2,successful:2,failed:1,costCents:0}).status,'insufficient_data'));
test('verified metrics and review',()=>assert.deepEqual(evaluateEngine({verified:true,observed:10,successful:8,failed:2,costCents:40}),{status:'measured',successRate:0.8,costPerSuccessCents:5,recommendation:'review_failures'}));
test('no successes means undefined unit cost',()=>assert.equal(evaluateEngine({verified:true,observed:3,successful:0,failed:3,costCents:10}).costPerSuccessCents,null));

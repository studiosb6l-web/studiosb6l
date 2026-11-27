import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewHive} from '../cloudflare/hive-central-review.mjs';
test('unverified or stopped central review blocks all engines',()=>{assert.equal(reviewHive().status,'blocked');assert.equal(reviewHive({verified:true,stopped:true,now:1}).status,'blocked');});
test('unknown health prevents downstream processing',()=>{const r=reviewHive({verified:true,stopped:false,now:1});assert.equal(r.status,'review_required');assert.equal(r.executionAuthorized,false);assert.equal(r.opportunities,undefined);});

test('verified healthy snapshot reaches advisory engines',()=>{const r=reviewHive({verified:true,stopped:false,now:1,health:{verified:true,checks:[{id:'site',kind:'availability',status:'healthy'}]},assessment:{ledger:{verified:true,stopped:false,netRevenueCents:0,freeCashCents:0,committedCents:0,spentCents:0},quota:{verified:true,stopped:false,used:0,limit:100},jobs:[]}});assert.equal(r.status,'advisory');assert.equal(r.executionAuthorized,false);assert.deepEqual(r.opportunities,[]);});

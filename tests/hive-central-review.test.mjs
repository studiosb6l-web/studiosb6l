import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewHive} from '../cloudflare/hive-central-review.mjs';
test('unverified or stopped central review blocks all engines',()=>{assert.equal(reviewHive().status,'blocked');assert.equal(reviewHive({verified:true,stopped:true,now:1}).status,'blocked');});
test('unknown health prevents downstream processing',()=>{const r=reviewHive({verified:true,stopped:false,now:1});assert.equal(r.status,'review_required');assert.equal(r.executionAuthorized,false);assert.equal(r.opportunities,undefined);});

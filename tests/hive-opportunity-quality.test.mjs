import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleOpportunities} from '../cloudflare/hive-opportunity-quality.mjs';
test('only verified authorized current unique approved records',()=>{
 const a={canonicalId:'a',sourceVerified:true,sourceAuthorized:true,moderation:'approved',expiresAtMs:200};
 assert.deepEqual(eligibleOpportunities([a,a,{...a,canonicalId:'b',expiresAtMs:100},{...a,canonicalId:'c',sourceVerified:false},{...a,canonicalId:'d',sourceAuthorized:false},{...a,canonicalId:'e',moderation:'pending'}],100),[a]);
});
test('missing clock fails closed',()=>assert.deepEqual(eligibleOpportunities([],undefined),[]));

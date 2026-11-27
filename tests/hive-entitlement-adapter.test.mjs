import test from 'node:test';
import assert from 'node:assert/strict';
import {digestEntitlement} from '../cloudflare/hive-entitlement-adapter.mjs';
const row={plan:'pro_monthly',provider_reference:'verified-ref',verified_at:1,expires_at:100,revoked_at:null};
test('maps existing verified pro only',()=>{assert.equal(digestEntitlement(row,'a',10).plan,'pro');for(const r of [null,{...row,plan:'free'},{...row,plan:'pro_business'},{...row,revoked_at:2},{...row,expires_at:10}])assert.equal(digestEntitlement(r,'a',10),null);});

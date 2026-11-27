import test from 'node:test';
import assert from 'node:assert/strict';
import {digestEntitlement} from '../cloudflare/hive-entitlement-adapter.mjs';
const row={plan:'pro_monthly',provider_reference:'verified-ref',verified_at:1,expires_at:100,revoked_at:null};
test('maps existing verified pro only',()=>{assert.equal(digestEntitlement(row,'a',10).plan,'pro');for(const r of [null,{...row,plan:'free'},{...row,plan:'pro_business'},{...row,revoked_at:2},{...row,expires_at:10}])assert.equal(digestEntitlement(r,'a',10),null);});

import {accountDigestEntitlement} from '../cloudflare/hive-entitlement-adapter.mjs';
test('paid activated admission grants basic, verified recurring grants pro',()=>{const x={account:{id:'a',verified:1,disabled:0,role:'artist'},admission:{account_id:'a',email_verified_at:1,paid_at:2,activated_at:3,revoked_at:null},now:10};assert.equal(accountDigestEntitlement(x).plan,'basic');assert.equal(accountDigestEntitlement({...x,subscription:row}).plan,'pro');assert.equal(accountDigestEntitlement({...x,admission:{...x.admission,paid_at:null}}),null);assert.equal(accountDigestEntitlement({...x,admission:{...x.admission,account_id:'b'}}),null);});

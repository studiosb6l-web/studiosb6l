import test from 'node:test';
import assert from 'node:assert/strict';
import {loadActiveAmbassadorGrant} from '../cloudflare/ambassador-entitlement-store.mjs';
test('disabled, isolated or stopped service does not query database',async()=>{
 const DB={prepare(){throw new Error('unexpected query')}};
 for(const env of [{DB},{DB,AMBASSADOR_ENABLED:'true',STOP_SERVICE:'true'},{DB,AMBASSADOR_ENABLED:'true',PREVIEW_ISOLATED:'true'}])assert.equal(await loadActiveAmbassadorGrant(env,'a'),false);
});
test('lookup binds trusted account and requires active verified grant',async()=>{
 let sql,bound;
 const env={AMBASSADOR_ENABLED:'true',DB:{prepare(q){sql=q;return {bind(id){bound=id;return {first:async()=>({account_id:'a'})}}}}}};
 assert.equal(await loadActiveAmbassadorGrant(env,'a'),true);
 assert.equal(bound,'a');
 for(const predicate of ['g.revoked_at IS NULL','i.revoked_at IS NULL','a.disabled=0','a.verified=1','o.email_verified_at IS NOT NULL'])assert.ok(sql.includes(predicate));
 assert.equal(await loadActiveAmbassadorGrant(env,'b'),false);
 await assert.rejects(loadActiveAmbassadorGrant(env,''));
});

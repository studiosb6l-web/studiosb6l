import test from 'node:test';
import assert from 'node:assert/strict';
import {authorize} from '../cloudflare/authorization-policy.mjs';
test('verified visitor can read opportunities only',()=>{
 const session={role:'visitor',verified:true,expiresAt:Date.now()+60000};
 assert.equal(authorize(session,'opportunities:read'),true);
 for(const capability of ['profile:read','profile:edit','support:create','admin:read','applications:review','support:reply','emergency:control','messages:send','upload:create']) assert.equal(authorize(session,capability),false);
 for(const invalid of [{verified:false},{disabled:true},{expiresAt:0}]) assert.equal(authorize({...session,...invalid},'opportunities:read'),false);
});

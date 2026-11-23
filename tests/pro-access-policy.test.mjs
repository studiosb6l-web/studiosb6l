import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeProCapability} from '../cloudflare/pro-access-policy.mjs';
const now=Math.floor(Date.now()/1000);
const session={role:'artist',verified:true,disabled:false,expiresAt:Date.now()+3600000};
const subscription={plan:'pro',subscription_status:'active',stripe_subscription_id:'sub_test',current_period_end:now+3600};
const allowed='opportunities:alerts';
test('valid PRO artist may receive premium alerts',()=>assert.equal(authorizeProCapability({session,subscription,capability:allowed,now}),true));
test('no subscription or BASIC cannot access premium capabilities',()=>{
  assert.equal(authorizeProCapability({session,capability:allowed,now}),false);
  assert.equal(authorizeProCapability({session,subscription:{...subscription,plan:'basic'},capability:allowed,now}),false);
});
test('unverified, disabled or expired sessions are rejected',()=>{
  for(const invalid of [{...session,verified:false},{...session,disabled:true},{...session,expiresAt:Date.now()-1000}]){
    assert.equal(authorizeProCapability({session:invalid,subscription,capability:allowed,now}),false);
  }
});
test('owner must have MFA even with PRO',()=>{
  assert.equal(authorizeProCapability({session:{...session,role:'owner',mfaVerified:false},subscription,capability:allowed,now}),false);
});
test('unknown premium capability fails closed',()=>assert.equal(authorizeProCapability({session,subscription,capability:'admin:read',now}),false));

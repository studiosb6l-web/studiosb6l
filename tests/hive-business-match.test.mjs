import test from 'node:test';
import assert from 'node:assert/strict';
import {businessMatches} from '../cloudflare/hive-business-match.mjs';
test('unverified or expired entitlement denies matching',()=>{
 const v={id:'a',publishConsent:true,matchingConsent:true};
 const e={verified:true,subject:'a',revoked:false,expiresAt:100,plan:'pro'};
 for(const x of [null,{...e,verified:false},{...e,subject:'b'},{...e,expiresAt:10},{...e,plan:'visitor'}])assert.deepEqual(businessMatches(v,[],x,10),[]);
});
test('missing consent denies matching',()=>assert.deepEqual(businessMatches({id:'a'},[],{verified:true,subject:'a',revoked:false,expiresAt:100,plan:'basic'},10),[]));

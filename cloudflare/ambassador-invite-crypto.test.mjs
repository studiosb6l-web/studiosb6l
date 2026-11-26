import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {newInvite,digestInvite,normalizeInviteEmail,INVITE_TTL_MS} from './ambassador-invite-crypto.mjs';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
test('random tokens are unique and digests reproducible',async()=>{
 const a=await newInvite(1000),b=await newInvite(1000);
 assert.match(a.token,/^[a-f0-9]{64}$/);
 assert.notEqual(a.token,b.token);
 assert.notEqual(a.token,a.tokenHash);
 assert.equal(await digestInvite(a.token),a.tokenHash);
 assert.equal(a.expiresAt,1000+INVITE_TTL_MS);
});
test('invalid tokens and timestamps rejected',async()=>{
 await assert.rejects(digestInvite('invalid'),TypeError);
 await assert.rejects(newInvite(-1),TypeError);
});
test('email normalization and validation',()=>{
 assert.equal(normalizeInviteEmail(' Test@Example.com '),'test@example.com');
 for(const v of [null,'a','a@b','a b@example.com'])assert.throws(()=>normalizeInviteEmail(v),TypeError);
});

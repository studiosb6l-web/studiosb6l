import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionToken,hashSessionToken} from '../cloudflare/session-tokens.mjs';
test('session token is 43 URL-safe characters',async()=>{const {token}=await createSessionToken();assert.match(token,/^[A-Za-z0-9_-]{43}$/)});
test('session hash is SHA-256 hex',async()=>{const {hash}=await createSessionToken();assert.match(hash,/^[a-f0-9]{64}$/)});
test('generated hash matches token',async()=>{const {token,hash}=await createSessionToken();assert.equal(await hashSessionToken(token),hash)});
test('two generated tokens differ',async()=>{const a=await createSessionToken(),b=await createSessionToken();assert.notEqual(a.token,b.token);assert.notEqual(a.hash,b.hash)});
test('malformed token rejected',async()=>{await assert.rejects(hashSessionToken('bad'));await assert.rejects(hashSessionToken('A'.repeat(44)))});

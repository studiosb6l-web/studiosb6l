import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,passwordRuntimeProbe} from '../cloudflare/password-verifier.mjs';
const password='Correct-Horse-Example-2026!';
test('password hash has salt and expected algorithm metadata',async()=>{const v=await hashPassword(password);assert.match(v,/^scrypt\$32768\$8\$3\$[0-9a-f]{32}\$[0-9a-f]{64}$/)});
test('correct password verifies',async()=>{const v=await hashPassword(password);assert.equal(await verifyPassword(password,v),true)});
test('wrong password denied',async()=>{const v=await hashPassword(password);assert.equal(await verifyPassword('Incorrect-Horse-2026!',v),false)});
test('different salts produce different hashes',async()=>{const a=await hashPassword(password),b=await hashPassword(password);assert.notEqual(a,b)});
test('weak password refused',async()=>{await assert.rejects(hashPassword('12345678'))});
test('malformed verifier denied',async()=>{assert.equal(await verifyPassword(password,'not-a-verifier'),false)});

test('native scrypt agrees with an independent Python vector',async()=>{assert.equal(await passwordRuntimeProbe(),true)});
test('attacker-selected work factors are rejected',async()=>{for(const params of ['2$8$3','32768$8$1','1073741824$8$3'])assert.equal(await verifyPassword(password,'scrypt$'+params+'$'+'00'.repeat(16)+'$'+'00'.repeat(32)),false)});
test('legacy PBKDF2 verification retains the original work factor',async()=>{const salt=new Uint8Array(16);const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const digest=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},key,256));const value='pbkdf2-sha256$310000$'+'00'.repeat(16)+'$'+Buffer.from(digest).toString('hex');assert.equal(await verifyPassword(password,value),true);assert.equal(await verifyPassword(password,value.replace('$310000$','$100000$')),false)});

import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/logout-worker.mjs';
const token='A'.repeat(43);
const origin='https://www.studiosb6l.com';
const req=(headers={},method='POST',path='/api/auth/logout')=>new Request('https://api.example.test'+path,{method,headers:{Origin:origin,Authorization:'Bearer '+token,...headers}});
function DB(){const calls=[];return {calls,prepare(sql){return {bind(...args){return {first:async()=>({user_id:'u1',role:'artist',verified:1,mfa_verified:0,disabled:0,expires_at:Date.now()+60000}),run:async()=>{calls.push({sql,args})}}}}}}}
test('valid logout revokes only current token',async()=>{const db=DB();const r=await worker.fetch(req(),{DB:db});assert.equal(r.status,200);assert.equal(db.calls.length,1);assert.match(db.calls[0].sql,/DELETE FROM sessions/);assert.match(db.calls[0].args[0],/^[a-f0-9]{64}$/);assert.equal(db.calls[0].args[1],'u1')});
test('foreign origin cannot log out',async()=>{const db=DB();const r=await worker.fetch(req({Origin:'https://evil.test'}),{DB:db});assert.equal(r.status,403);assert.equal(db.calls.length,0)});
test('missing database fails closed',async()=>{const r=await worker.fetch(req(),{});assert.equal(r.status,503)});
test('invalid token cannot log out',async()=>{const db=DB();const r=await worker.fetch(req({Authorization:'Bearer bad'}),{DB:db});assert.equal(r.status,401);assert.equal(db.calls.length,0)});
test('unsupported route does not revoke',async()=>{const db=DB();const r=await worker.fetch(req({},'POST','/api/admin'),{DB:db});assert.equal(r.status,404);assert.equal(db.calls.length,0)});

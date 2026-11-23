import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/artists-api-entry.mjs';
const base='https://ben-pro-entitlements-schema-studiosb6l-artists-api.studiosb6l.workers.dev';
test('public auth status is read-only and does not require client IP or limiter',async()=>{
  const response=await worker.fetch(new Request(base+'/api/auth/status'),{});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{success:true,enabled:false});
});
test('auth status does not leak internal binding details',async()=>{
  const response=await worker.fetch(new Request(base+'/api/auth/status'),{LOGIN_ENABLED:'true'});
  const json=await response.json();
  assert.deepEqual(Object.keys(json).sort(),['enabled','success']);
});
test('login still fails closed without limiter and client IP',async()=>{
  const response=await worker.fetch(new Request(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),{LOGIN_ENABLED:'true'});
  assert.equal(response.status,503);
});
test('STOP_SERVICE still blocks status checks',async()=>{
  const response=await worker.fetch(new Request(base+'/api/auth/status'),{STOP_SERVICE:'true'});
  assert.equal(response.status,503);
});

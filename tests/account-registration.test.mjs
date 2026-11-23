import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from '../cloudflare/account-registration.mjs';

const endpoint='https://studiosb6l-artists-api.studiosb6l.workers.dev/api/auth/register';
function req(body,origin='https://www.studiosb6l.com'){
  return new Request(endpoint,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
}
const valid={email:'artist@example.com',password:'A long unique password 2026!',role:'artist'};
test('registration refuses untrusted origins',async()=>{
  const r=await register(req(valid,'https://untrusted.example'),{});
  assert.equal(r.status,403);
});
test('registration stays unavailable until all verified integrations are ready',async()=>{
  const r=await register(req(valid),{REGISTRATION_ENABLED:'true',DB:{}});
  assert.equal(r.status,503);
  assert.match((await r.json()).error,/indisponíveis/);
});
test('registration does not accept GET',async()=>{
  const r=await register(new Request(endpoint),{});
  assert.equal(r.status,405);
});
test('registration rejects non-JSON',async()=>{
  const r=await register(new Request(endpoint,{method:'POST',headers:{Origin:'https://www.studiosb6l.com','Content-Type':'text/plain'},body:'hello'}),{});
  assert.equal(r.status,415);
});
test('registration never activates a pending account without email and billing readiness',async()=>{
  let calls=0;
  const db={batch:async()=>{calls++;}};
  const r=await register(req(valid),{DB:db,REGISTRATION_ENABLED:'true',EMAIL_VERIFICATION_READY:'true'});
  assert.equal(r.status,503);
  assert.equal(calls,0);
});

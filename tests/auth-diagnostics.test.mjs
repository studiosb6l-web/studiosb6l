import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectAuthBindings} from '../cloudflare/auth-diagnostics.mjs';
test('missing preview bindings and client IP are explicitly diagnosed',()=>{
  assert.deepEqual({...inspectAuthBindings({},new Request('https://example.test'))},{
    d1Bound:false,rateLimitBound:false,loginFlagEnabled:false,clientIpPresent:false,emergencyStop:false
  });
});
test('diagnostic recognizes correctly configured dependencies',()=>{
  const env={DB:{prepare(){}},AUTH_RATE_LIMIT:{limit(){}},LOGIN_ENABLED:'true'};
  const request=new Request('https://example.test',{headers:{'CF-Connecting-IP':'192.0.2.10'}});
  const result=inspectAuthBindings(env,request);
  assert.equal(result.d1Bound,true);
  assert.equal(result.rateLimitBound,true);
  assert.equal(result.loginFlagEnabled,true);
  assert.equal(result.clientIpPresent,true);
});
test('emergency STOP is recognized and diagnostic never returns secrets',()=>{
  const result=inspectAuthBindings({STOP_SERVICE:'true',STRIPE_SECRET_KEY:'secret'},null);
  assert.equal(result.emergencyStop,true);
  assert.equal(JSON.stringify(result).includes('secret'),false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {accountPortal} from '../cloudflare/account-portal.mjs';
test('transmission panel is gated by readiness and feature flag',async()=>{
 for(const env of [{},{RUNTIME_READY:true},{TRANSMISSIONS_ENABLED:'true'}]){
 const response=accountPortal(env);
 assert.ok(!(await response.text()).includes('id="transmissionStatus"'));
 }
 const response=accountPortal({RUNTIME_READY:true,TRANSMISSIONS_ENABLED:'true'});
 const html=await response.text();
 assert.match(html,/id="transmissionStatus"/);
 assert.match(html,/MutationObserver/);
 const script=html.match(/<script nonce="([^"]+)">([\s\S]*?)<\/script>/);
 assert.ok(script);
 assert.ok(response.headers.get('Content-Security-Policy').includes("'nonce-"+script[1]+"'"));
 assert.doesNotThrow(()=>new Function(script[2]));
 assert.equal(response.headers.get('Cache-Control'),'no-store');
});

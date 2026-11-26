import test from 'node:test';
import assert from 'node:assert/strict';
import {accountPortal} from '../cloudflare/account-portal.mjs';
const ready={RUNTIME_READY:true,REGISTRATION_READY:true,AMBASSADOR_ENABLED:'true'};
test('ambassador registration hidden when feature disabled or runtime unavailable',async()=>{
 for(const env of [{...ready,AMBASSADOR_ENABLED:'false'},{...ready,RUNTIME_READY:false},{...ready,REGISTRATION_READY:false}]){
  assert.doesNotMatch(await accountPortal(env).text(),/id="inviteRegistration"/);
 }
});
test('ambassador form uses a fresh CSP script nonce and verification endpoint',async()=>{
 const a=accountPortal(ready),b=accountPortal(ready);
 const html=await a.text(),other=await b.text();
 const nonce=html.match(/<script nonce="([a-f0-9]+)">/)[1];
 const directive=a.headers.get('Content-Security-Policy').split(';').find(x=>x.trim().startsWith('script-src'));
 assert.ok(directive.includes("'nonce-"+nonce+"'"));
 assert.notEqual(nonce,other.match(/<script nonce="([a-f0-9]+)">/)[1]);
 assert.match(html,/id="inviteRegistration"/);
 assert.match(html,/id="inviteVerify"/);
 assert.match(html,/\/api\/auth\/verify-email/);
 assert.match(html,/invitation|Convite não aceite/);
 assert.doesNotMatch(directive,/unsafe-inline/);
 assert.equal(a.headers.get('Cache-Control'),'no-store');
});

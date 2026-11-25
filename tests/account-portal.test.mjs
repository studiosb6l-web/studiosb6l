import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../cloudflare/artists-api-entry.mjs';
import {ACCOUNT_ORIGIN,trustedAuthOrigin} from '../cloudflare/auth-origins.mjs';
import {login} from '../cloudflare/login-worker.mjs';
import {hashPassword} from '../cloudflare/password-verifier.mjs';
import {requestSessionToken} from '../cloudflare/session-tokens.mjs';
const request=(path,init={})=>new Request(ACCOUNT_ORIGIN+path,init);
test('portal serves first-party login without external fetches',async()=>{const r=await worker.fetch(request('/conta/'));const h=await r.text();assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/text\/html/);assert.match(h,/fetch\(path/);assert.match(h,/credentials:'same-origin'/);assert.match(h,/<fieldset disabled/);assert.doesNotMatch(h,/localStorage|sessionStorage/);const script=h.split('<script>')[1].split('</script>')[0];const hash=createHash('sha256').update(script).digest('base64');assert.ok(r.headers.get('Content-Security-Policy').includes("'sha256-"+hash+"'"));assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/)});
test('portal enables login only when both prerequisites are enabled',async()=>{for(const env of [{LOGIN_ENABLED:'true'},{RATE_LIMIT_VERIFIED:'true'},{}])assert.match(await (await worker.fetch(request('/conta/'),env)).text(),/<fieldset disabled/);assert.doesNotMatch(await(await worker.fetch(request('/conta/'),{LOGIN_ENABLED:'true',DB:{},AUTH_RATE_LIMIT:{limit:async()=>({success:true})}})).text(),/<fieldset disabled/)});
test('lookalike origins never become trusted',()=>{assert.equal(trustedAuthOrigin(ACCOUNT_ORIGIN),true);for(const origin of [ACCOUNT_ORIGIN+'.evil.test','http://studiosb6l-artists-api.studiosb6l.workers.dev','https://unknown.studiosb6l.workers.dev',null])assert.equal(trustedAuthOrigin(origin),false)});
test('first-party portal supports login and its Strict cookie',async()=>{const password='Safe-Example-Password-2026!';const user={id:'u1',role:'artist',verified:1,disabled:0,password_hash:await hashPassword(password)};const DB={prepare(){return {bind(){return {first:async()=>user,run:async()=>({success:true})}}}}};const r=await login(request('/api/auth/login',{method:'POST',headers:{Origin:ACCOUNT_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({email:'artist@example.com',password})}),{DB,LOGIN_ENABLED:'true',RATE_LIMIT_VERIFIED:'true'});assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),ACCOUNT_ORIGIN);assert.match(r.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Strict/);const token=/^__Host-b6l_session=([^;]+)/.exec(r.headers.get('Set-Cookie'))[1];assert.equal(requestSessionToken(request('/api/auth/logout',{method:'POST',headers:{Origin:ACCOUNT_ORIGIN,Cookie:'__Host-b6l_session='+token}})),token)});
test('session endpoint rejects visitors with no session',async()=>{assert.equal((await worker.fetch(request('/api/auth/session'))).status,401)});
test('STOP also suspends the account portal',async()=>{assert.equal((await worker.fetch(request('/conta/'),{STOP_SERVICE:'true'})).status,503)});
test('registration links follow server readiness rather than a permanent unavailable message',async()=>{
 const base={LOGIN_ENABLED:'true',DB:{},AUTH_RATE_LIMIT:{limit:async()=>({success:true})}};
 const configured={...base,REGISTRATION_ENABLED:'true',ADMISSION_REFERENCE_SECRET:'test-reference-secret-at-least-32-chars',PAYHIP_ACTIVATION_VERIFIED:'true',PAYHIP_WEBHOOK_API_KEY:'test-payhip-secret-at-least-32-characters',PAYHIP_ADMISSION_PRODUCT_KEY:'fixture',PAYHIP_ADMISSION_CHECKOUT_URL:'https://payhip.com/b/fixture',EMAIL_SERVICE:{fetch:async()=>new Response(null,{status:202})},EMAIL_BUDGET_VERIFIED:'true',EMAIL_FREE_DAILY_QUOTA:'300',EMAIL_DAILY_BUDGET:'20'};
 const ready=await(await worker.fetch(request('/conta/'),configured)).text();
 assert.match(ready,/Criar conta · acesso único de 2,99 €/);
 assert.match(ready,/https:\/\/www\.studiosb6l\.com\/conta\/#registration-panel/);
 assert.doesNotMatch(ready,/Novas inscrições ainda indisponíveis/);
 for(const patch of [{REGISTRATION_ENABLED:'false'},{PAYHIP_WEBHOOK_API_KEY:''},{AUTH_RATE_LIMIT:undefined}]){
  const unavailable=await(await worker.fetch(request('/conta/'),{...configured,...patch})).text();
  assert.match(unavailable,/Novas inscrições temporariamente indisponíveis/);
  assert.doesNotMatch(unavailable,/Criar conta · acesso único/);
 }
});
test('authenticated account panel points to the manual artist application step',async()=>{
 const body=await(await worker.fetch(request('/conta/'))).text();
 assert.match(body,/https:\/\/www\.studiosb6l\.com\/artistas\/#candidatura/);
 assert.match(body,/publicação de um perfil é um passo separado/);
 assert.match(body,/aprovação manual/);
 assert.match(body,/id="account" hidden/);
});

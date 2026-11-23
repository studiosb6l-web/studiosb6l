import test from 'node:test';
import assert from 'node:assert/strict';
import {login} from '../cloudflare/login-worker.mjs';
import logout from '../cloudflare/logout-worker.mjs';
import {resolveSession} from '../cloudflare/session-guard.mjs';
import {hashPassword} from '../cloudflare/password-verifier.mjs';
import {requestSessionToken} from '../cloudflare/session-tokens.mjs';
const origin='https://www.studiosb6l.com';
const password='Safe-Example-Password-2026!';
const token='A'.repeat(43);
const req=(cookie,originHeader=origin)=>new Request(origin+'/api/auth/logout',{method:'POST',headers:{Cookie:cookie,Origin:originHeader}});
function database(account){
 const sessions=new Map();
 return {sessions,prepare(sql){return {bind(...args){return {
  async first(){return sql.includes('FROM accounts')?account:sessions.get(args[0])||null},
  async run(){
   if(sql.startsWith('INSERT INTO sessions'))sessions.set(args[0],{user_id:args[1],role:args[2],verified:args[3],mfa_verified:args[4],disabled:args[5],expires_at:args[6]});
   else if(sql.startsWith('DELETE FROM sessions')&&sessions.get(args[0])?.user_id===args[1])sessions.delete(args[0]);
   return {success:true};
  }
 }}}}};
}
test('cookie login resolves server identity and logout revokes the same session',async()=>{
 const DB=database({id:'artist-1',role:'artist',verified:1,disabled:0,password_hash:await hashPassword(password)});
 const env={DB,LOGIN_ENABLED:'true',RATE_LIMIT_VERIFIED:'true'};
 const response=await login(new Request(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'artist@example.com',password})}),env);
 assert.equal(response.status,200);
 const cookie=response.headers.get('Set-Cookie').split(';')[0];
 const body=await response.json();assert.equal(body.token,undefined);assert.equal(body.user.id,'artist-1');
 assert.equal((await resolveSession(req(cookie),env)).userId,'artist-1');
 const result=await logout.fetch(req(cookie),env);assert.equal(result.status,200);
 assert.match(result.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Strict; Max-Age=0$/);
 assert.equal(DB.sessions.size,0);assert.equal(await resolveSession(req(cookie),env),null);
});
test('duplicate session cookies fail closed',()=>assert.equal(requestSessionToken(req(`__Host-b6l_session=${token}; __Host-b6l_session=${token}`)),null));
test('invalid authorization cannot fall back to cookie',()=>{
 const r=new Request(origin+'/api/auth/logout',{headers:{Authorization:'Bearer invalid',Cookie:`__Host-b6l_session=${token}`}});
 assert.equal(requestSessionToken(r),null);
});
test('foreign-origin cookie logout does not revoke session',async()=>{
 const DB=database(null);DB.sessions.set('unused',{user_id:'u1'});
 const response=await logout.fetch(req(`__Host-b6l_session=${token}`,'https://evil.example'),{DB});
 assert.equal(response.status,403);assert.equal(DB.sessions.size,1);assert.equal(response.headers.get('Set-Cookie'),null);
});
test('expired cookie sessions cannot resolve',async()=>{
 const DB={prepare(){return {bind(){return {first:async()=>({user_id:'u1',role:'artist',verified:1,disabled:0,expires_at:Date.now()-1})}}}}};
 assert.equal(await resolveSession(req(`__Host-b6l_session=${token}`),{DB}),null);
});
test('database failure on logout does not falsely clear a live cookie',async()=>{
 const DB={prepare(){return {bind(){return {first:async()=>({user_id:'u1',role:'artist',verified:1,disabled:0,expires_at:Date.now()+60000}),run:async()=>{throw Error('offline')}}}}}};
 const r=await logout.fetch(req(`__Host-b6l_session=${token}`),{DB});
 assert.equal(r.status,503);assert.equal(r.headers.get('Set-Cookie'),null);
});

test('cookie mutations reject missing and foreign Origin before resolving session',()=>{
 assert.equal(requestSessionToken(req(`__Host-b6l_session=${token}`,'https://evil.example')),null);
 const r=new Request(origin+'/private',{method:'POST',headers:{Cookie:`__Host-b6l_session=${token}`}});
 assert.equal(requestSessionToken(r),null);
});

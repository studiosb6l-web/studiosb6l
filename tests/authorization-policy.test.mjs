import test from 'node:test';
import assert from 'node:assert/strict';
import {authorize,requireCapability,ROLES} from '../cloudflare/authorization-policy.mjs';
const valid=(role)=>({role,verified:true,expiresAt:Date.now()+60000,mfaVerified:true});
test('six public profiles have no administrative privileges',()=>{for(const role of ROLES.filter(x=>x!=='owner'&&x!=='visitor')){assert.equal(authorize(valid(role),'admin:read'),false);assert.equal(authorize(valid(role),'emergency:control'),false);assert.equal(authorize(valid(role),'profile:edit'),true)}});
test('owner requires MFA for every capability',()=>{assert.equal(authorize({...valid('owner'),mfaVerified:false},'admin:read'),false);assert.equal(authorize(valid('owner'),'admin:read'),true)});
test('unverified or expired sessions denied',()=>{assert.equal(authorize({...valid('owner'),verified:false},'admin:read'),false);assert.equal(authorize({...valid('owner'),expiresAt:Date.now()-100},'admin:read'),false)});
test('unknown role and unknown permission denied',()=>{assert.equal(authorize(valid('administrator'),'admin:read'),false);assert.equal(authorize(valid('owner'),'unknown:operation'),false)});
test('missing session denied',()=>{assert.equal(authorize(null,'profile:read'),false);assert.equal(authorize({},'profile:read'),false)});
test('disabled accounts denied',()=>{assert.equal(authorize({...valid('artist'),disabled:true},'profile:read'),false)});
test('requireCapability denies with no-store',()=>{const r=requireCapability(valid('student'),'admin:read');assert.equal(r.status,403);assert.equal(r.headers.get('Cache-Control'),'no-store')});

test('visitor is not a public editable profile and has only opportunity access',()=>{
 assert.equal(authorize(valid('visitor'),'opportunities:read'),true);
 for(const capability of ['profile:read','profile:edit','support:create','admin:read','applications:review','support:reply','emergency:control']) assert.equal(authorize(valid('visitor'),capability),false);
 assert.equal(authorize({...valid('visitor'),verified:false},'opportunities:read'),false);
});

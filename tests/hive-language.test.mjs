import test from 'node:test';
import assert from 'node:assert/strict';
import {translationPlan} from '../cloudflare/hive-language.mjs';
const p={source:'pt',target:'ja',consent:true,providerAuthorized:true,freeCapacityVerified:true,stopped:false};
test('translation candidate never authorizes execution',()=>{const r=translationPlan(p);assert.equal(r.status,'candidate');assert.equal(r.executionAuthorized,false);assert.equal(r.requiresQuotaReservation,true);});
test('stop, consent and unsupported language block',()=>{for(const x of [{stopped:true},{consent:false},{target:'xx'}])assert.equal(translationPlan({...p,...x}).status,'blocked');});
test('same language and missing capacity',()=>{assert.equal(translationPlan({...p,target:'pt'}).status,'not_needed');assert.equal(translationPlan({...p,freeCapacityVerified:false}).status,'manual_review');});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../cloudflare/membership-checkout-worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const endpoint='https://api.example.test';
const configured={DB:{},STRIPE_SECRET_KEY:'sk_test_placeholder',STRIPE_WEBHOOK_SECRET:'whsec_placeholder'};
function req(path,body,headers={}){return new Request(endpoint+path,{method:'POST',headers:{origin:'https://www.studiosb6l.com','content-type':'application/json',...headers},body:JSON.stringify(body)});}
test('no infrastructure: never initiate checkout',async()=>{const r=await worker.fetch(req('/api/membership/checkout',{email:'a@example.com',acceptTerms:true}),{});assert.equal(r.status,503)});
test('configured but unauthenticated: checkout remains disabled',async()=>{const r=await worker.fetch(req('/api/membership/checkout',{email:'a@example.com',acceptTerms:true}),configured);assert.equal(r.status,503);assert.match(await r.text(),/disabled/)});
test('missing consent rejected',async()=>{const r=await worker.fetch(req('/api/membership/checkout',{email:'a@example.com'}),configured);assert.equal(r.status,422)});
test('invalid origin rejected',async()=>{const r=await worker.fetch(req('/api/membership/checkout',{email:'a@example.com',acceptTerms:true},{origin:'https://attacker.example'}),configured);assert.equal(r.status,403)});
test('null payload rejected without crash',async()=>{const r=await worker.fetch(req('/api/membership/checkout',null),configured);assert.equal(r.status,400)});
test('unsigned webhook rejected',async()=>{const r=await worker.fetch(req('/api/membership/webhook',{type:'checkout.session.completed'}),configured);assert.equal(r.status,400)});
test('no live charge API call in checkout implementation',()=>{assert.match(source,/checkout disabled/);assert.doesNotMatch(source,/return json\(\{url:session\.url/);});

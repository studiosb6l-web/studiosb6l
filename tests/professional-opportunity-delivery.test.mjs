import test from 'node:test';
import assert from 'node:assert/strict';
import {selectProfessionalOpportunities as select} from '../cloudflare/professional-opportunity-delivery.mjs';
const now=1000;
const profile={kind:'singer',country:'Portugal',workMode:'both',matchingConsent:true,services:['singing'],seeking:[],details:{genres:['rock']}};
const pro={plan:'pro_monthly',verified_at:1,expires_at:2000,provider_reference:'verified'};
const record=(id,extra={})=>({id,type:'offer',sourceAuthorized:true,public:true,status:'verified',url:'https://example.com/opportunity',expiresAt:2000,sectors:['singer'],country:'PT',...extra});
test('basic receives local opportunities and general news only',()=>{
 const rows=[record('local'),record('foreign',{country:'ES',remote:true}),record('sector',{type:'news'}),record('general',{type:'news',general:true})];
 assert.deepEqual(select(profile,rows,null,now).map(x=>x.id).sort(),['general','local']);
 assert.equal(select(profile,rows,pro,now).length,4);
});
test('expired entitlement cannot grant PRO and consent is mandatory',()=>{
 const rows=[record('foreign',{country:'ES',remote:true})];
 assert.deepEqual(select(profile,rows,{...pro,expires_at:now},now),[]);
 assert.deepEqual(select({...profile,matchingConsent:false},rows,pro,now),[]);
});
test('unverified, expired and unrelated records are excluded; duplicates and caps enforced',()=>{
 const rows=[record('bad',{sourceAuthorized:false}),record('expired',{expiresAt:now}),record('other',{sectors:['teacher']}),...Array.from({length:40},(_,i)=>record(String(i))),record('0')];
 assert.equal(select(profile,rows,null,now).length,3);
 const selected=select(profile,rows,pro,now);
 assert.equal(selected.length,30);
 assert.equal(new Set(selected.map(x=>x.id)).size,30);
 assert.ok(!selected.some(x=>['bad','expired','other'].includes(x.id)));
});

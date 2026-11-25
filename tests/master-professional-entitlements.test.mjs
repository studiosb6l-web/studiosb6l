import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {effectiveProfilePlan,matchProfessionalProfiles} from '../cloudflare/professional-profile-matching.mjs';
import {selectProfessionalOpportunities} from '../cloudflare/professional-opportunity-delivery.mjs';
const now=1000;
const master={plan:'master_pro_monthly',verified_at:1,expires_at:2000,provider_reference:'fixture'};
test('MASTER is verified server state and inherits international matching',()=>{
 assert.equal(effectiveProfilePlan(master,now),'master_pro');
 assert.equal(effectiveProfilePlan({...master,plan:'master_pro_annual'},now),'master_pro');
 for(const patch of [{expires_at:now},{revoked_at:1},{verified_at:NaN},{verified_at:Infinity},{verified_at:now+1},{provider_reference:' '},{plan:'master'}])assert.equal(effectiveProfilePlan({...master,...patch},now),'free');
 const a={id:'a',kind:'singer',country:'PT',publishConsent:true,matchingConsent:true,services:['singing'],seeking:['mixing'],workMode:'both'};
 const b={...a,id:'b',kind:'audio_engineer',country:'ES',services:['mixing'],seeking:[]};
 assert.ok(matchProfessionalProfiles(a,b,{plan:'master_pro'}));
 assert.equal(matchProfessionalProfiles(a,b,{plan:'free'}),null);
 const record={id:'x',type:'offer',sourceAuthorized:true,public:true,status:'verified',url:'https://example.com/x',expiresAt:2000,sectors:['singer'],country:'ES',remote:true};
 assert.equal(selectProfessionalOpportunities(a,[record],master,now).length,1);
 assert.equal(selectProfessionalOpportunities(a,[record],{...master,revoked_at:1},now).length,0);
});
test('migration preserves PRO records and constraints while adding MASTER; transaction rollback restores old schema',()=>{
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON; CREATE TABLE accounts(id TEXT PRIMARY KEY); INSERT INTO accounts VALUES (\'a\');');
 db.exec(readFileSync('cloudflare/migrations/009_professional_profiles.sql','utf8'));
 db.prepare('INSERT INTO professional_entitlements VALUES(?,?,?,?,?,NULL)').run('a','pro_monthly','existing',1,2000);
 db.exec('BEGIN');db.exec(readFileSync('cloudflare/migrations/011_master_professional_entitlements.sql','utf8'));
 assert.equal(db.prepare('SELECT provider_reference FROM professional_entitlements').get().provider_reference,'existing');
 db.prepare('UPDATE professional_entitlements SET plan=?').run('master_pro_annual');
 assert.throws(()=>db.prepare('UPDATE professional_entitlements SET plan=?').run('client-invented'));
 db.exec('ROLLBACK');
 assert.equal(db.prepare('SELECT plan FROM professional_entitlements').get().plan,'pro_monthly');
 assert.throws(()=>db.prepare('UPDATE professional_entitlements SET plan=?').run('master_pro_annual'));
 db.close();
});

test('directional matching distinguishes offers and requests; commercial information is MASTER-only',async()=>{
 const {commercialOpportunitySummary}=await import('../cloudflare/professional-opportunity-delivery.mjs');
 const profile={kind:'singer',country:'PT',matchingConsent:true,services:['singing'],seeking:['mixing']};
 const record=(id,patch={})=>({id,type:'offer',sourceAuthorized:true,public:true,status:'verified',url:'https://example.com/x',expiresAt:2000,sectors:['singer'],country:'PT',...patch});
 const rows=[record('offer',{services:['mixing']}),record('wrong-offer',{services:['singing']}),record('request',{type:'request',services:['singing']}),record('wrong-request',{type:'request',services:['mixing']}),record('commercial',{type:'news',general:true,commercial:true})];
 assert.deepEqual(selectProfessionalOpportunities(profile,rows,null,now).map(r=>r.id),['offer','request']);
 const summary=commercialOpportunitySummary(profile,rows,master,now);assert.equal(summary.total,3);assert.equal(summary.commercial,1);assert.equal(summary.offers,1);assert.equal(summary.requests,1);
 assert.equal(commercialOpportunitySummary(profile,rows,null,now),null);
 assert.equal(selectProfessionalOpportunities(profile,rows,{...master,plan:'pro_monthly'},now).length,2);
});

import test from 'node:test';import assert from 'node:assert/strict';import {enforceProhibitions,PROHIBITION_IDS} from './prohibitions-gate.js';
const base={costVerified:true,noLossVerified:true};
test('all 20 rules enumerated',()=>assert.deepEqual(PROHIBITION_IDS,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]));
const cases=[
['charge',{priceApproved:false},3],['charge',{priceApproved:true,userConsent:true,amountCents:299,currency:'eur'},4],
['grant_paid_access',{},5],['payment_webhook',{},7],['publish_profile',{},8],['disclose_private_data',{},9],['admin_action',{},10],
['change_terms',{},11],['payout',{},12],['publish_media',{},13],['approve_application',{},14],['bot_activity',{},15],
['external_ai_data',{},16],['critical_release',{},18],['delete_audit',{},19],['claim_live',{},20]];
for(const [op,extra,rule] of cases)test('block '+op+' rule '+rule,()=>assert.equal(enforceProhibitions(op,{...base,...extra}).rule,rule));
test('financial unknown blocked',()=>assert.equal(enforceProhibitions('charge',{}).rule,1));
test('bot paid blocked',()=>assert.equal(enforceProhibitions('bot_activity',{...base,bot:true,incrementalCostCents:1,hardCapVerified:true}).rule,2));
test('unapproved external spend blocked',()=>assert.equal(enforceProhibitions('anything',{...base,externalSpend:true}).rule,17));
test('verified charge allowed',()=>assert.equal(enforceProhibitions('charge',{...base,priceApproved:true,userConsent:true,amountCents:299,currency:'eur',idempotencyVerified:true}).allowed,true));

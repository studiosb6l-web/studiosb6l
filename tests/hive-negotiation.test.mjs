import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewProposal} from '../cloudflare/hive-negotiation.mjs';
const p={senderId:'a',recipientId:'b',scope:'Composition',amountMinor:10000,currency:'EUR',expiresAt:100,entitlementVerified:true,contactConsent:true};
test('valid proposal remains a draft',()=>assert.deepEqual(reviewProposal(p,10),{status:'draft_ready_for_review',authorized:false,requiresExplicitAcceptance:true}));
test('reject invalid or unauthorized proposals',()=>{for(const x of [{contactConsent:false},{entitlementVerified:false},{expiresAt:10},{amountMinor:-1},{recipientId:'a'},{currency:'XXX'}])assert.equal(reviewProposal({...p,...x},10).status,'invalid');});

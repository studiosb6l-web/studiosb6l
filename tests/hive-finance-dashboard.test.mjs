import test from 'node:test';
import assert from 'node:assert/strict';
import {privateFinanceSnapshot} from '../cloudflare/hive-finance-dashboard.mjs';
const owner={verified:true,role:'owner',mfaVerified:true,expiresAt:Date.now()+60000};
test('only authenticated owner can see finances',()=>{assert.equal(privateFinanceSnapshot(null).status,'forbidden');assert.equal(privateFinanceSnapshot({...owner,mfaVerified:false}).status,'forbidden');});
test('missing or stale telemetry is unavailable not zero',()=>{const r=privateFinanceSnapshot(owner,{now:400000,ledger:{verified:true,observedAt:1},quotas:[{service:'D1'}]});assert.equal(r.finance.status,'unavailable');assert.equal(r.services[0].status,'unavailable');});
test('verified data and quota alert',()=>{const r=privateFinanceSnapshot(owner,{now:100,ledger:{verified:true,observedAt:100,stopped:false,netRevenueCents:1200000,freeCashCents:60000,committedCents:0,spentCents:0},quotas:[{service:'D1',verified:true,observedAt:100,used:65,limit:100,stopped:false}]});assert.equal(r.finance.availableCents,60000);assert.equal(r.services[0].warning,true);assert.equal(r.executionAuthorized,false);});

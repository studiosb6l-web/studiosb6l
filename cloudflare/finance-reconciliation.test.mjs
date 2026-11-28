import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileSettlements} from './finance-reconciliation.mjs';
const r={verified:true,currency:'EUR',provider:'test',id:'1',grossCents:299,refundCents:0,feeCents:49};
test('net settlement excludes fees and refunds',()=>assert.deepEqual(reconcileSettlements([r,{...r,id:'2',refundCents:299}]),{status:'reconciled',grossCents:598,refundCents:299,feeCents:98,netCents:201,recordCount:2,executionAuthorized:false}));
test('reject duplicates and unverified or missing data',()=>{for(const records of [[],[r,r],[{...r,verified:false}],[{...r,currency:'USD'}],[{...r,feeCents:undefined}]])assert.equal(reconcileSettlements(records).status,'unavailable');});

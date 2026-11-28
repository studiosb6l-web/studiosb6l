import test from 'node:test';
import assert from 'node:assert/strict';
import {assessHive} from '../cloudflare/hive-assessment.mjs';
const ledger={verified:true,stopped:false,netRevenueCents:0,freeCashCents:0,committedCents:0,spentCents:0};
const quota={verified:true,stopped:false,used:0,limit:100};
const jobs=[{id:'a',engine:'SECURITY',paid:false,units:1}];
test('advisory free candidate, never execution permission',()=>{const r=assessHive({ledger,quota,jobs});assert.deepEqual(r.candidates,['a']);assert.equal(r.budget.availableCents,0);assert.equal(r.executionAuthorized,false);});
test('stop or missing ledger blocks candidates',()=>{assert.deepEqual(assessHive({ledger:{...ledger,stopped:true},quota,jobs}).candidates,[]);assert.deepEqual(assessHive({quota,jobs}).candidates,[]);});

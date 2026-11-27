import test from 'node:test';
import assert from 'node:assert/strict';
import {reputationSummary} from '../cloudflare/hive-reputation.mjs';
const records=Array.from({length:5},(_,i)=>({subject:'a',transactionId:String(i),verified:true,consent:true,disputed:false,rating:4}));
test('verified distinct feedback only',()=>assert.deepEqual(reputationSummary([...records,records[0],{...records[0],transactionId:'x',disputed:true,rating:1}],'a'),{status:'measured',count:5,rating:4}));
test('insufficient evidence is not a negative rating',()=>assert.equal(reputationSummary(records.slice(0,4),'a').rating,null));
test('other subjects excluded',()=>assert.equal(reputationSummary(records,'b').count,0));

import test from 'node:test';
import assert from 'node:assert/strict';
import {marketGaps} from '../cloudflare/hive-competitive.mjs';
const rows=Array.from({length:20},(_,i)=>({evidenceId:String(i),category:'Film Music',verified:true,sourceAuthorized:true,aggregateUseAllowed:true,observedAt:100,unmet:i<12}));
test('aggregates distinct authorized observations',()=>assert.deepEqual(marketGaps([...rows,rows[0]],100),[{category:'film music',observations:20,unmet:12,unmetShare:.6,authorized:false}]));
test('insufficient or unauthorized evidence excluded',()=>{assert.deepEqual(marketGaps(rows.slice(1),100),[]);assert.deepEqual(marketGaps(rows.map(r=>({...r,sourceAuthorized:false})),100),[]);assert.deepEqual(marketGaps(rows,100+91*86400000),[]);});

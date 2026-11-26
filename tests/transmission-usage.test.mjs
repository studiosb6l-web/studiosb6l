import test from 'node:test';
import assert from 'node:assert/strict';
import {transmissionUsage} from '../cloudflare/transmission-usage.mjs';
const db=used_ms=>({prepare:()=>({bind:()=>({first:async()=>({used_ms})})})});
test('usage rounds conservatively and never returns negative balance',async()=>{
 assert.deepEqual(await transmissionUsage(db(61000),'a',0,100000,3),{usedMs:61000,usedMinutes:2,remainingMs:119000,remainingMinutes:1});
 assert.equal((await transmissionUsage(db(200000),'a',0,300000,3)).remainingMs,0);
});
test('missing or invalid usage cannot authorize consumption',async()=>{
 await assert.rejects(transmissionUsage(db(null),'a',0,100000,3));
 await assert.rejects(transmissionUsage(db(-1),'a',0,100000,3));
 await assert.rejects(transmissionUsage(db(0),'a',100,0,3));
});

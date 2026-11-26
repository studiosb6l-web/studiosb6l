import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveTransmission} from '../cloudflare/transmission-admission.mjs';
const now=1000;
const state={stop:false,metricsFresh:true,metrics:[{used:60,reserved:9,requested:1,freeLimit:100}],membership:{disabled:false,ambassadorActive:true},activeElsewhere:false,hostBudgetAvailable:true};
const run=s=>reserveTransmission({accountId:'a',sessionId:'s',action:'host',now,store:{atomicReserve:async(_,check)=>{const reservation=check(s);return reservation?{allowed:true,...reservation}:{allowed:false};}}});
test('host admission limits duration and participants',async()=>{
 assert.deepEqual(await run(state),{allowed:true,maxParticipants:20,expiresAt:now+45*60000,warningAt:now+35*60000});
});
test('host admission denies STOP, stale metrics, exhausted budget and quota overflow',async()=>{
 for(const s of [{...state,stop:true},{...state,metricsFresh:false},{...state,hostBudgetAvailable:false},{...state,metrics:[{used:70,reserved:0,requested:1,freeLimit:100}]}])assert.deepEqual(await run(s),{allowed:false});
 assert.deepEqual(await reserveTransmission({}),{allowed:false});
});

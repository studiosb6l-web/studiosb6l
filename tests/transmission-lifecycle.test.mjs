import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileExpiredTransmissions} from '../cloudflare/transmission-lifecycle.mjs';
test('disabled reconciliation never accesses provider or storage',async()=>{
 const fail=()=>{throw Error('unexpected call')};
 assert.deepEqual(await reconcileExpiredTransmissions({store:{listExpired:fail,confirmClosed:fail},provider:{closeRoom:fail}}),{closed:0,pending:0,enabled:false});
});
test('only confirmed expired rooms are closed in storage',async()=>{
 const confirmed=[],calls=[];
 const rows=[{id:'a',roomId:'a',expiresAt:10},{id:'b',roomId:'b',expiresAt:10},{id:'c',roomId:'c',expiresAt:30},{id:'d',roomId:'d',expiresAt:10}];
 const result=await reconcileExpiredTransmissions({enabled:true,now:20,store:{listExpired:async()=>rows,confirmClosed:async(id)=>confirmed.push(id)},provider:{closeRoom:async(id)=>{calls.push(id);if(id==='d')throw Error('offline');return {closed:id==='a'};}}});
 assert.deepEqual(confirmed,['a']);assert.deepEqual(calls,['a','b','d']);assert.deepEqual(result,{closed:1,pending:2,enabled:true});
});

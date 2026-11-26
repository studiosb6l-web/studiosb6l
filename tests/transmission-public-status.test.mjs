import test from 'node:test';
import assert from 'node:assert/strict';
import {publicTransmissionStatus} from '../cloudflare/transmission-public-status.mjs';
const now=2100000;
const input={plan:'PRO_BUSINESS',usage:{usedMs:60000,remainingMs:120000,cost:99},periodEnd:9999999,session:{startedAt:0,expiresAt:2700000,roomId:'private'},available:true,quota:70,stop:false};
test('customer status exposes only allowed fields',()=>{
 assert.deepEqual(publicTransmissionStatus(input,now),{canAttend:true,canHost:true,usedMinutes:1,remainingMinutes:2,renewsAt:9999999,available:true,session:{elapsedSeconds:2100,remainingSeconds:600,warning:true}});
});
test('basic cannot access usage and PRO cannot host',()=>{
 assert.deepEqual(publicTransmissionStatus({plan:'BASIC'},now),{canAttend:false,canHost:false});
 assert.equal(publicTransmissionStatus({...input,plan:'PRO'},now).canHost,false);
});
test('expired session and invalid balance',()=>{
 assert.equal(publicTransmissionStatus(input,2700000).session,null);
 assert.throws(()=>publicTransmissionStatus({...input,usage:null},now));
});

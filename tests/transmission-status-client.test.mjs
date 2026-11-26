import test from 'node:test';
import assert from 'node:assert/strict';
import {mountTransmissionStatus} from '../cloudflare/transmission-status-client.mjs';
test('hidden page avoids requests and authorization loss clears account display',async()=>{
 let calls=0,clears=0;
 const listeners=new Map();
 const doc={visibilityState:'hidden',addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const root={ownerDocument:doc,replaceChildren(){clears++}};
 const stop=mountTransmissionStatus(root,{}, {fetcher:async()=>{calls++;return {status:401,ok:false}}});
 try{
 assert.equal(calls,0);
 doc.visibilityState='visible';
 await listeners.get('visibilitychange')();
 assert.equal(calls,1);
 assert.equal(clears,1);
 assert.equal(listeners.has('visibilitychange'),false);
 }finally{stop()}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {demandSignal} from '../cloudflare/hive-demand-signal.mjs';
test('small or unverified samples do not produce trends',()=>{assert.equal(demandSignal({verified:true,previous:1,current:100,windowDays:30}).status,'insufficient_data');assert.equal(demandSignal({verified:false,previous:100,current:150,windowDays:30}).status,'insufficient_data');});
test('observed change is not a forecast',()=>assert.deepEqual(demandSignal({verified:true,previous:100,current:125,windowDays:30}),{status:'observed',change:0.25,direction:'rising',forecast:false}));

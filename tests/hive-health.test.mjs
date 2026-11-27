import test from 'node:test';
import assert from 'node:assert/strict';
import {healthTriage} from '../cloudflare/hive-health.mjs';
test('stop and missing telemetry fail closed',()=>{assert.equal(healthTriage({stopped:true}).status,'stopped');assert.equal(healthTriage({stopped:false,verified:true,checks:[]}).status,'unknown');});
test('security prioritized without executing repairs',()=>{const r=healthTriage({verified:true,stopped:false,checks:[{id:'site',kind:'availability',status:'failed'},{id:'auth',kind:'security',status:'degraded'}]});assert.equal(r.actions[0].id,'auth');assert.equal(r.executionAuthorized,false);});
test('healthy verified checks',()=>assert.equal(healthTriage({verified:true,stopped:false,checks:[{id:'site',kind:'availability',status:'healthy'}]}).status,'healthy'));

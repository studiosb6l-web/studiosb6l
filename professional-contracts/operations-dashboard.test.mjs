import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOperationsSnapshot,assertAdminRole} from './operations-dashboard.js';
test('dashboard does not assume live status',()=>{const s=buildOperationsSnapshot();assert.equal(s.bots.defined,36);assert.equal(s.bots.active,0);assert.equal(s.live,false);});
test('admin requires MFA',()=>{assert.throws(()=>assertAdminRole({authenticated:true,role:'admin'}));assert.throws(()=>assertAdminRole({authenticated:true,role:'user',mfaVerified:true}));assert.equal(assertAdminRole({authenticated:true,role:'admin',mfaVerified:true}),true);});

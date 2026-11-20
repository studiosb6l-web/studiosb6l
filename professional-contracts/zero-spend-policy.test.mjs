import test from 'node:test';
import assert from 'node:assert/strict';
import {mayRunFreeOperation,shouldResumeAfterReset} from './zero-spend-policy.js';
const ok={providerFreeTierConfirmed:true,providerHardCapConfirmed:true,usageKnown:true,remainingFreeUnits:5,unitsNeeded:1};
test('confirmed free operation is permitted',()=>assert.equal(mayRunFreeOperation(ok).allowed,true));
test('unknown billing or no hard cap blocks',()=>{assert.equal(mayRunFreeOperation({...ok,providerHardCapConfirmed:false}).allowed,false);assert.equal(mayRunFreeOperation({...ok,possibleBillableCost:true}).allowed,false);});
test('exhausted quota suspends',()=>assert.equal(mayRunFreeOperation({...ok,remainingFreeUnits:0}).reason,'free_quota_exhausted'));
test('resume requires verified quota reset',()=>{assert.equal(shouldResumeAfterReset(ok).allowed,false);assert.equal(shouldResumeAfterReset({...ok,quotaResetVerified:true}).allowed,true);});

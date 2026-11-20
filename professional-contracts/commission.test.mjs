import assert from 'node:assert/strict';
import { calculateContractSplit, validateContractDraft } from './commission.js';
for (const [gross,fee,net] of [[10000,500,9500],[50000,2500,47500],[100000,5000,95000],[500000,25000,475000]]) {
 assert.deepEqual(calculateContractSplit(gross),{grossCents:gross,platformFeeCents:fee,professionalBeforeOtherFeesCents:net,commissionBasisPoints:500});
}
assert.throws(()=>calculateContractSplit(-1),RangeError);
assert.equal(validateContractDraft({}).valid,false);

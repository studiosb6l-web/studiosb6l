import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeUsage} from './cost-guard.js';
test('default zero-budget blocks paid usage',()=>assert.equal(authorizeUsage({feature:'translation',estimatedCostCents:1}).allowed,false));
test('approval alone cannot exceed daily cap',()=>assert.equal(authorizeUsage({feature:'video',estimatedCostCents:1,explicitApproval:true}).reason,'daily_limit'));
test('charge requires informed consent',()=>assert.equal(authorizeUsage({feature:'call',chargeCustomer:true}).reason,'customer_price_and_consent_required'));
test('free usage allowed with known zero cost',()=>assert.equal(authorizeUsage({feature:'search'}).allowed,true));
test('unknown or invalid amounts fail closed',()=>assert.equal(authorizeUsage({feature:'x',estimatedCostCents:NaN}).allowed,false));

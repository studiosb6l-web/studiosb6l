import test from 'node:test';
import assert from 'node:assert/strict';
import {usageDecision,capacityForecast} from './usage-billing-policy.js';
const base={registeredUsers:100,activeUsers:30,providerFreeUnits:1000,providerUsedUnits:900,userIncludedUnits:20,userUsedUnits:10,providerHardCapConfirmed:true};
test('free usage remains free',()=>assert.equal(usageDecision(base).action,'allow_free'));
test('free exhaustion blocks absent approved paid plan',()=>assert.equal(usageDecision({...base,userUsedUnits:20}).action,'block'));
test('paid tier requires consent and verified prepaid coverage',()=>{const paid={...base,userUsedUnits:20,paidServiceConfigured:true,publishedPriceCents:299};assert.equal(usageDecision(paid).action,'offer_paid');assert.equal(usageDecision({...paid,userAcceptedPrice:true,paymentConfirmed:true,providerCostCovered:true}).action,'allow_prepaid');});
test('provider cap is mandatory',()=>assert.equal(usageDecision({...base,providerHardCapConfirmed:false}).action,'block'));
test('capacity forecast',()=>assert.equal(capacityForecast({remainingFreeUnits:120,averageUnitsPerActiveUser:3}),40));

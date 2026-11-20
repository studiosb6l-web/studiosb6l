import test from 'node:test';
import assert from 'node:assert/strict';
import {canIssueContract,assertMayIssueContract} from './issuance-policy.js';
const contract={id:'c1',status:'accepted',grossCents:50000,currency:'EUR'};
const payment={contractId:'c1',provider:'stripe_connect',platform:'STUDIOSB6L',verifiedByServer:true,webhookSignatureValid:true,status:'succeeded',refunded:false,disputed:false,amountCents:50000,currency:'EUR',processorPaymentId:'pi_test'};
test('verified platform payment unlocks issuance',()=>assert.equal(canIssueContract({contract,payment}),true));
for(const [name,change] of Object.entries({unpaid:{status:'pending'},outside:{platform:'external'},unverified:{verifiedByServer:false},invalidSignature:{webhookSignatureValid:false},wrongAmount:{amountCents:49999},wrongContract:{contractId:'c2'},refunded:{refunded:true},disputed:{disputed:true}})){
 test(name+' blocks issuance',()=>{assert.equal(canIssueContract({contract,payment:{...payment,...change}}),false);assert.throws(()=>assertMayIssueContract({contract,payment:{...payment,...change}}));});
}

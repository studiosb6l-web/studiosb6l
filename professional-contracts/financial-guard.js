// STUDIOSB6L financial controls — pure, fail-closed, not wired to production.
// Amounts are integer euro cents. Tax/fees/reserves are required, not guessed.
const valid=n=>Number.isSafeInteger(n)&&n>=0;
export function evaluateTransaction(input={}){
 const keys=['grossCents','processingFeeCents','taxCents','providerCostCents','refundReserveCents','chargebackReserveCents','otherCostCents','minimumMarginCents'];
 if(!keys.every(k=>valid(input[k])))return {allow:false,reason:'unverified_costs'};
 if(input.providerHardCapConfirmed!==true||input.usageMeteringConfirmed!==true||input.atomicBudgetReservation!==true)return {allow:false,reason:'uncontrolled_spend'};
 const costs=keys.slice(1,-1).reduce((s,k)=>s+input[k],0);
 if(!valid(costs)||!valid(input.grossCents-costs))return {allow:false,reason:'cost_exceeds_revenue',costs};
 const margin=input.grossCents-costs;
 if(margin<input.minimumMarginCents)return {allow:false,reason:'insufficient_margin',costs,margin};
 return {allow:true,reason:'verified_positive_margin',costs,margin};
}
export function evaluateBudget({approvedCapCents,spentCents,reservedCents,nextCostCents,providerHardCapConfirmed=false}={}){
 if(![approvedCapCents,spentCents,reservedCents,nextCostCents].every(valid)||!providerHardCapConfirmed)return {allow:false,reason:'unknown_budget_or_hard_cap'};
 return spentCents+reservedCents+nextCostCents<=approvedCapCents?{allow:true}:{allow:false,reason:'budget_exceeded'};
}
export function flagRegistrationRisk({sameIdentityAccounts,failedPayments24h,disputes,verifiedIdentity=false}={}){
 if(![sameIdentityAccounts,failedPayments24h,disputes].every(valid))return {review:true,reason:'unknown_risk'};
 if(!verifiedIdentity||sameIdentityAccounts>1||failedPayments24h>=3||disputes>0)return {review:true,reason:'manual_review'};
 return {review:false};
}
export function chooseLowerCostAlternative(options=[]){
 return options.filter(o=>o?.verified===true&&o?.hardCap===true&&valid(o?.totalCostCents)).sort((a,b)=>a.totalCostCents-b.totalCostCents)[0]??null;
}
export function financialSnapshot(entries=[]){
 if(!entries.every(e=>valid(e.revenueCents)&&valid(e.costCents)&&typeof e.status==='string'))return {verified:false};
 const paid=entries.filter(e=>e.status==='settled');
 const revenueCents=paid.reduce((s,e)=>s+e.revenueCents,0);
 const costCents=entries.reduce((s,e)=>s+e.costCents,0);
 return {verified:true,revenueCents,costCents,estimatedMarginCents:revenueCents-costCents,pendingCount:entries.filter(e=>e.status==='pending').length};
}

// Advisory innovation screening; never launches services or authorizes spending.
export function screenInnovation({verified,distinctRequests,estimatedRevenueCents,estimatedCostCents,freeCapacityVerified}={}){
 if(verified!==true||![distinctRequests,estimatedRevenueCents,estimatedCostCents].every(v=>Number.isSafeInteger(v)&&v>=0))return {status:'insufficient_data',authorized:false};
 const margin=estimatedRevenueCents-estimatedCostCents;
 const status=distinctRequests<20?'collect_evidence':margin<=0?'reject_economics':estimatedCostCents!==0||freeCapacityVerified!==true?'review_required':'consider_free_pilot';
 return {status,estimatedMarginCents:margin,authorized:false};
}

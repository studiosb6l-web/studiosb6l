// Translation routing only. Never transmits text or invokes a paid provider.
const supported=new Set(['en','pt','es','fr','de','it','nl','sv','ja','zh','ar','ru','uk','ko']);
export function translationPlan({source,target,consent,providerAuthorized,freeCapacityVerified,stopped}={}){
 const base={executionAuthorized:false,preserveOriginal:true};
 if(stopped!==false||consent!==true||!supported.has(source)||!supported.has(target))return {...base,status:'blocked'};
 if(source===target)return {...base,status:'not_needed'};
 if(providerAuthorized!==true||freeCapacityVerified!==true)return {...base,status:'manual_review'};
 return {...base,status:'candidate',source,target,requiresQuotaReservation:true,requiresHumanReviewForContracts:true};
}

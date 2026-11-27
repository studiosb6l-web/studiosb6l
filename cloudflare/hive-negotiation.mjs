// Draft validation only; never sends, accepts or executes an agreement.
export function reviewProposal(p,now){
 const invalid={status:'invalid',authorized:false};
 if(!p||!Number.isSafeInteger(now)||now<0||p.entitlementVerified!==true||p.contactConsent!==true)return invalid;
 if(![p.senderId,p.recipientId,p.scope].every(v=>typeof v==='string'&&v.trim().length>0)||p.senderId===p.recipientId||p.scope.length>4000)return invalid;
 if(!Number.isSafeInteger(p.amountMinor)||p.amountMinor<=0||!['EUR','USD','GBP','CAD','BRL'].includes(p.currency)||!Number.isSafeInteger(p.expiresAt)||p.expiresAt<=now)return invalid;
 return {status:'draft_ready_for_review',authorized:false,requiresExplicitAcceptance:true};
}

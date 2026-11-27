// Read-only value assessment; no messaging, tracking or renewal actions.
export function retentionInsights({verified,consent,opportunities,matches,confirmedOutcomes,periodDays}={}){
 if(verified!==true||consent!==true||![opportunities,matches,confirmedOutcomes,periodDays].every(v=>Number.isSafeInteger(v)&&v>=0)||periodDays<1||periodDays>90)return {status:'unavailable'};
 const recommendations=[];
 if(opportunities===0)recommendations.push('review_opportunity_coverage');
 if(matches===0)recommendations.push('offer_optional_profile_review');
 if(confirmedOutcomes===0)recommendations.push('offer_optional_feedback');
 return {status:'measured',periodDays,opportunities,matches,confirmedOutcomes,recommendations};
}

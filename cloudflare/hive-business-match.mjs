import {rankProfessionalProfiles} from './professional-profile-matching.mjs';
// Advisory adapter: entitlement must originate from a trusted server.
export function businessMatches(viewer,candidates,entitlement,now){
 if(!Number.isSafeInteger(now)||now<0||!Array.isArray(candidates)||!viewer||typeof viewer.id!=='string')return [];
 if(!entitlement||entitlement.verified!==true||entitlement.subject!==viewer.id||entitlement.revoked!==false||!Number.isSafeInteger(entitlement.expiresAt)||entitlement.expiresAt<=now)return [];
 const plan=entitlement.plan;
 if(!['basic','pro','pro_business'].includes(plan))return [];
 const safe=candidates.filter(c=>c&&typeof c.id==='string'&&c.id&&c.publishConsent===true&&c.matchingConsent===true);
 if(viewer.publishConsent!==true||viewer.matchingConsent!==true)return [];
 return rankProfessionalProfiles(viewer,safe,{plan:plan==='basic'?'free':'pro'}).map(({profile,match})=>({profileId:profile.id,score:match.score,reasons:match.reasons}));
}

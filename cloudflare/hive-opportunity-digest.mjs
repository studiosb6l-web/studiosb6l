import {eligibleOpportunities} from './hive-opportunity-quality.mjs';
// Internal selection only. Identity, entitlement and preferences must come from trusted storage.
export function selectOpportunityDigest({viewer,entitlement,records,now,stopped}={}){
 if(stopped!==false||!Number.isSafeInteger(now)||now<0||!viewer||typeof viewer.id!=='string'||viewer.notificationConsent!==true||!Array.isArray(viewer.categories)||!entitlement||entitlement.verified!==true||entitlement.subject!==viewer.id||entitlement.revoked!==false||!Number.isSafeInteger(entitlement.expiresAt)||entitlement.expiresAt<=now)return [];
 const limits={basic:3,pro:15,pro_business:30};
 if(!Object.hasOwn(limits,entitlement.plan))return [];
 const categories=new Set(viewer.categories.filter(c=>typeof c==='string'&&c.trim()).map(c=>c.trim().toLowerCase()));
 return eligibleOpportunities(records,now).filter(r=>typeof r.category==='string'&&categories.has(r.category.trim().toLowerCase())&&(entitlement.plan!=='basic'||(typeof viewer.country==='string'&&viewer.country.trim()&&r.country===viewer.country))).slice(0,limits[entitlement.plan]).map(r=>r.canonicalId);
}

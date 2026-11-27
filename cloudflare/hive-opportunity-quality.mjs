// Advisory eligibility filter; verification must come from trusted ingestion.
export function eligibleOpportunities(records, nowMs) {
 if(!Array.isArray(records)||!Number.isSafeInteger(nowMs)||nowMs<0)return [];
 const seen=new Set(),out=[];
 for(const r of records){
 if(!r||r.sourceVerified!==true||r.sourceAuthorized!==true||r.moderation!=='approved'||typeof r.canonicalId!=='string'||!r.canonicalId.trim()||!Number.isSafeInteger(r.expiresAtMs)||r.expiresAtMs<=nowMs||seen.has(r.canonicalId))continue;
 seen.add(r.canonicalId);out.push(r);
 }
 return out;
}

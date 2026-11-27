// Pure preflight only. Caller must atomically reserve quota before external requests.
export function mayCollect({stopped,freeTier,quota,used,reserved,cost,windowEndsAt,observedAt}={},now=Date.now()){
 if(stopped!==false||freeTier!==true)return false;
 if(![quota,used,reserved,cost,windowEndsAt,observedAt,now].every(Number.isSafeInteger))return false;
 if(quota<=0||used<0||reserved<0||cost<=0||windowEndsAt<=now||observedAt>now||now-observedAt>60000)return false;
 return BigInt(used)+BigInt(reserved)+BigInt(cost)<=BigInt(quota)*7n/10n;
}

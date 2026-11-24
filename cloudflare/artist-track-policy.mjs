// Pure entitlement policy. Only trusted server-side subscription records may be passed.
export function artistTrackLimit(subscription, now=Date.now()) {
  return subscription?.plan==='PRO' && subscription?.status==='active' &&
    Number.isSafeInteger(subscription.paidThrough) && subscription.paidThrough>now ? 49 : 5;
}
export function checkArtistTrackCapacity(existing, incoming, subscription, now=Date.now()) {
  if (!Number.isSafeInteger(existing)||existing<0||!Number.isSafeInteger(incoming)||incoming<1) return {allowed:false,reason:'invalid-count'};
  const limit=artistTrackLimit(subscription,now);
  if(incoming>49-existing) return {allowed:false,reason:'maximum-49',limit};
  if(incoming>limit-existing) return {allowed:false,reason:'pro-required',limit};
  return {allowed:true,limit};
}

import { mayCollect } from './opportunity-quota-policy.mjs';
import { swedishJobSearchRequests } from './jobsearch-sweden.mjs';

// Planning only: never fetch here. Executor must atomically reserve the full batch
// and recheck STOP before dispatch. Unknown configuration fails closed.
export function planSwedishCollection(source, quota, now = Date.now()) {
  if (source?.name !== 'Arbetsförmedlingen JobSearch' ||
      source.enabled !== true || source.authorized !== true ||
      source.apiOrigin !== 'https://jobsearch.api.jobtechdev.se') return null;
  const requests = swedishJobSearchRequests();
  if (!mayCollect({...quota, cost: requests.length}, now)) return null;
  return {requests, reservationUnits: requests.length};
}

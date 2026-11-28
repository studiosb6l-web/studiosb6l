// Official public CC0 API: https://data.arbetsformedlingen.se/dataservice/jobsearch/
// Pure request builder: no network or automatic spending. Caller must reserve quota atomically.
const TERMS = Object.freeze(['musiker','musiklärare','ljudtekniker','kompositör','orkester','opera','filmproducent']);
export function swedishJobSearchRequests() {
  return TERMS.map(q => {
    const url = new URL('https://jobsearch.api.jobtechdev.se/search');
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '10');
    return url.href;
  });
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { swedishJobSearchRequests } from '../cloudflare/jobsearch-sweden.mjs';

test('Swedish search uses seven unique bounded official requests', () => {
  const requests = swedishJobSearchRequests();
  assert.equal(requests.length, 7);
  assert.equal(new Set(requests).size, 7);
  const terms = requests.map(request => {
    const url = new URL(request);
    assert.equal(url.origin, 'https://jobsearch.api.jobtechdev.se');
    assert.equal(url.pathname, '/search');
    assert.equal(url.searchParams.get('limit'), '10');
    assert.deepEqual([...url.searchParams.keys()].sort(), ['limit', 'q']);
    return url.searchParams.get('q');
  });
  assert.deepEqual(terms, ['musiker','musiklärare','ljudtekniker','kompositör','orkester','opera','filmproducent']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {privateOpportunityApi} from '../cloudflare/hive-private-opportunities.mjs';
test('disabled and preview endpoints do not access storage',async()=>{const DB={prepare(){throw Error('unexpected');}};for(const env of [{DB},{DB,HIVE_PRIVATE_OPPORTUNITIES:'true',PREVIEW_ISOLATED:'true'},{DB,HIVE_PRIVATE_OPPORTUNITIES:'true',STOP_SERVICE:'true'}])assert.equal((await privateOpportunityApi(new Request('https://example.com/api/hive/opportunities'),env)).status,503);});
test('missing quota blocks request',async()=>{assert.equal((await privateOpportunityApi(new Request('https://example.com/api/hive/opportunities'),{DB:{},HIVE_PRIVATE_OPPORTUNITIES:'true'})).status,503);});

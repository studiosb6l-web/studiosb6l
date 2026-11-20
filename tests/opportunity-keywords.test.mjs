import assert from 'node:assert/strict';
import {classifyPublicOpportunity,eligibleForPublicDiscovery} from '../cloudflare/opportunity-keywords.mjs';
const cases=[
 ['Hiring musicians for a film','employment'],
 ['Procura-se músico para festival de música','employment'],
 ['Audición de violín','employment'],
 ['Appel à candidatures pour un concert','performance'],
 ['Music for film sync licensing','licensing'],
 ['Escola de música procura professor de música','education'],
 ['Divulgação musical para artistas','promotion'],
 ['Looking for producer collaboration','collaboration']
];
for(const [text,category] of cases) assert(classifyPublicOpportunity(text).categories.some(x=>x.category===category),text);
assert.equal(classifyPublicOpportunity('hello world').relevant,false);
assert.equal(eligibleForPublicDiscovery({sourceAuthorized:true,public:true,status:'verified',url:'https://example.org/'}),true);
assert.equal(eligibleForPublicDiscovery({sourceAuthorized:false,public:true,status:'verified',url:'https://example.org/'}),false);
assert.equal(eligibleForPublicDiscovery({sourceAuthorized:true,public:true,status:'pending',url:'https://example.org/'}),false);
assert.equal(eligibleForPublicDiscovery({sourceAuthorized:true,public:true,status:'verified',url:'http://example.org/'}),false);
console.log('Opportunity keyword classification and authorized-publication checks passed');

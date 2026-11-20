import test from 'node:test';
import assert from 'node:assert/strict';
import {rankOpportunities} from './opportunity-matching.js';
test('only published open opportunities are ranked',()=>{
 const p={skills:['Baritone'],countries:['ES']};
 const out=rankOpportunities(p,[{id:'a',published:true,status:'open',requiredSkills:['baritone'],country:'ES'},{id:'b',published:false,status:'open',requiredSkills:['baritone']}]);
 assert.deepEqual(out.map(x=>x.id),['a']);assert.equal(out[0].score,100);
});
test('no private data in match result',()=>{const r=rankOpportunities({skills:[]},[{id:'1',published:true,status:'open',requiredSkills:[],email:'secret@example.com'}]);assert.equal(JSON.stringify(r).includes('secret@example.com'),false);});

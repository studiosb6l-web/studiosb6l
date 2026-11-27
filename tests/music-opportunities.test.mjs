import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFeed} from '../scripts/validate-music-opportunities.mjs';
const source={name:'Test source',origin:'https://example.org',authorized:true};
const item={id:'1',title:'Test role',country:'Test country',source:source.name,sourceUrl:'https://example.org/job',expiresAt:'2030-01-01T00:00:00Z',verified:true};
const now=Date.parse('2026-11-27');
test('empty disabled feed is safe',()=>assert.equal(validateFeed({enabled:false,items:[]},[],now),true));
test('only approved current unique entries pass',()=>{
 const feed={enabled:true,items:[item]};
 assert.equal(validateFeed(feed,[source],now),true);
 assert.throws(()=>validateFeed(feed,[],now));
 assert.throws(()=>validateFeed({...feed,items:[item,item]},[source],now));
 assert.throws(()=>validateFeed({...feed,items:[{...item,verified:false}]},[source],now));
 assert.throws(()=>validateFeed({...feed,items:[{...item,expiresAt:'2020-01-01'}]},[source],now));
});

test('duplicate source URLs with distinct IDs or fragments are rejected',()=>assert.throws(()=>validateFeed({enabled:true,items:[item,{...item,id:'2',sourceUrl:item.sourceUrl+'#details'}]},[source],now),/Duplicate opportunity source URL/));

import test from 'node:test';
import assert from 'node:assert/strict';
import {checkArtistTrackCapacity as check} from '../cloudflare/artist-track-policy.mjs';
const now=1000, pro={plan:'PRO',status:'active',paidThrough:2000};
test('free fifth allowed, sixth blocked',()=>{assert.equal(check(4,1,null,now).allowed,true);assert.equal(check(5,1,null,now).reason,'pro-required')});
test('paid PRO sixth and 49th allowed, 50th blocked',()=>{assert.equal(check(5,1,pro,now).allowed,true);assert.equal(check(48,1,pro,now).allowed,true);assert.equal(check(49,1,pro,now).reason,'maximum-49')});
test('expired or cancelled subscription cannot add sixth',()=>{for(const s of [{...pro,paidThrough:now},{...pro,status:'cancelled'},null])assert.equal(check(5,1,s,now).allowed,false)});
test('invalid counts and batch bypass blocked',()=>{assert.equal(check(-1,1,pro,now).allowed,false);assert.equal(check(4,2,null,now).allowed,false);assert.equal(check(48,2,pro,now).allowed,false)});

// Offline matching safety checks. Does not prove worldwide opportunity ingestion.
import assert from 'node:assert/strict';
import {matchOpportunity} from '../cloudflare/music-connect-core.mjs';
const artist={moderation:'approved',instruments:['Violino'],genres:['Clássica'],country:'Portugal',city:'Lisboa',travel_available:true};
const london={status:'published',instrument:'violino',genre:'classica',country:'Reino Unido',city:'Londres',travel_required:true};
assert.equal(matchOpportunity(artist,london)?.score,70, 'Approved travelling musician can match abroad');
assert.equal(matchOpportunity({...artist,travel_available:false},london),null, 'Travel constraints must be respected');
assert.equal(matchOpportunity({...artist,moderation:'pending'},london),null, 'Pending profiles must not be matched');
assert.equal(matchOpportunity(artist,{...london,status:'draft'}),null, 'Draft opportunities must not be exposed');
assert.equal(matchOpportunity(artist,{...london,instrument:'Oboé'}),null, 'Unrelated instruments must not match');
assert.equal(matchOpportunity({...artist,instruments:['VIOLÍNO']},london)?.score,70, 'Accent and case normalization must work');
console.log('Worldwide matching safety regression passed (offline; instrument-based matching only)');

import test from 'node:test';
import assert from 'node:assert/strict';
import {contractBots,botSummary} from './bots-registry.js';
import {planBotRun,assertProductionBlocked} from './bot-runner.js';
test('registry has unique ids and all bots disabled',()=>{
 assert.equal(contractBots.length,36);
 assert.equal(new Set(contractBots.map(b=>b.id)).size,36);
 assert.deepEqual(botSummary(),{total:36,enabled:0});
});
test('runner requires staging and authorization',()=>{
 assert.throws(()=>planBotRun({enabledIds:['payment_signature'],context:{environment:'production',authorized:true}}));
 assert.throws(()=>planBotRun({enabledIds:['payment_signature'],context:{environment:'staging'}}));
 assert.deepEqual(planBotRun({enabledIds:['payment_signature'],context:{environment:'staging',authorized:true}}),[{id:'payment_signature',mode:'dry-run',action:'block',decision:'not-executed'}]);
 assert.throws(assertProductionBlocked);
});

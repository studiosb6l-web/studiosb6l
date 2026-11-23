import test from 'node:test';
import assert from 'node:assert/strict';
import {experimental_readRawConfig} from 'wrangler';
test('preview configuration exists and explicitly excludes production data and enables the runtime isolation guard',()=>{
 const {rawConfig:config}=experimental_readRawConfig({config:'wrangler.toml'});
 assert.ok(config.previews,'wrangler preview requires its own configuration block');
 assert.deepEqual(config.previews.d1_databases,[]);
 assert.deepEqual(config.previews.services,[]);
 assert.equal(config.previews.vars.PREVIEW_ISOLATED,'true');
 assert.equal(config.previews.vars.LOGIN_ENABLED,'false');
 assert.equal(config.previews.vars.REGISTRATION_ENABLED,'false');
 assert.equal(config.previews.vars.STOP_SERVICE,'true');
 assert.equal(config.d1_databases[0].database_id,'f53175d9-50a7-4b6a-a868-1b10c997efc8');
});

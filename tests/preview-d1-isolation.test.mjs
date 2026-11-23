import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const config=readFileSync(new URL('../wrangler.toml',import.meta.url),'utf8');
const guard=new URL('../scripts/check-preview-d1.mjs',import.meta.url).pathname;
const run=(content)=>{
  const dir=mkdtempSync(join(tmpdir(),'b6l-preview-'));
  try{const path=join(dir,'wrangler.toml');writeFileSync(path,content);return spawnSync(process.execPath,[guard,path],{encoding:'utf8'});}
  finally{rmSync(dir,{recursive:true,force:true});}
};
test('preview D1 isolation guard accepts reviewed configuration',()=>{
  const result=run(config);
  assert.equal(result.status,0,result.stderr);
});
test('preview D1 cannot silently reuse production database',()=>{
  const prod='f53175d9-50a7-4b6a-a868-1b10c997efc8';
  const preview='89908805-b194-4a1b-8250-b17090dc1499';
  assert.notEqual(prod,preview);
  const result=run(config.replace(preview,prod));
  assert.notEqual(result.status,0);
});
test('preview D1 must be explicitly configured',()=>{
  const stripped=config.replace(/\[\[previews\.d1_databases\]\][\s\S]*?(?=\n\[vars\])/,'');
  assert.notEqual(run(stripped).status,0);
});
test('preview binding must use DB and not a different name',()=>{
  const broken=config.replace(/(\[\[previews\.d1_databases\]\]\s*binding\s*=\s*)"DB"/,'$1"OTHER"');
  assert.notEqual(run(broken).status,0);
});

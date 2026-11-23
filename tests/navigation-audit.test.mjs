import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('offline audit resolves equivalent destinations and encoded names without treating external schemes as files', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'b6l-navigation-'));
  try {
    fs.mkdirSync(path.join(root,'area'));
    fs.writeFileSync(path.join(root,'area/index.html'),'<h1 id="details">Area</h1>');
    fs.writeFileSync(path.join(root,'with space.html'),'<h1>Space</h1>');
    fs.writeFileSync(path.join(root,'index.html'),`<a href="/area/">Area</a>
      <a href="/area/index.html?lang=pt#details">Area</a>
      <a href="//example.test/external">External</a>
      <a href="sms:+123">SMS</a><a href="#local">Local</a><a href="#absent">Absent</a><a href="#%ZZ">Bad fragment</a><a id="local"></a>
      <a href="/with%20space.html">Space</a>
      <a href="/missing/">Missing</a><a href="/%ZZ">Invalid</a>`);
    const script=fileURLToPath(new URL('../scripts/audit-navigation.mjs',import.meta.url));
    const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
    assert.equal(run.status,1,run.stderr);
    const report=JSON.parse(fs.readFileSync(path.join(root,'reports/navigation-audit.json'),'utf8'));
    assert.equal(report.pages,3);
    assert.equal(report.links,7);
    assert.deepEqual(report.failures.map(x=>x.reason).sort(),['invalid-fragment-encoding','invalid-url-encoding','missing-local-target']);
    assert.equal(report.duplicateLabelsWithDifferentDestinations.length,0);
    assert.deepEqual(report.missingStaticFragments.map(x=>x.fragment),['absent']);
    assert.equal(report.links,7);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

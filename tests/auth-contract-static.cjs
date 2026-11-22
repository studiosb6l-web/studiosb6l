#!/usr/bin/env node
// Offline contract checks only: no requests, credentials, charges or deployments.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const account=fs.readFileSync('conta/index.html','utf8');
const admin=fs.readFileSync('admin/index.html','utf8');
const checks=[
  ['login endpoint',/\/api\/auth\/login/.test(account)],
  ['registration endpoint',/\/api\/auth\/register/.test(account)],
  ['logout endpoint',/\/api\/auth\/logout/.test(account)],
  ['server response checked',/response\.ok/.test(account)],
  ['login requires server-confirmed user',/path===['"]\/api\/auth\/login['"]&&\(!data\.user/.test(account)],
  ['cookie-capable request',/credentials:\s*['"]include['"]/.test(account)],
  ['no client-side localStorage auth',!/localStorage\s*\./.test(account)],
  ['admin placeholder clearly marked',/Integração pendente|Aguardando base de dados/.test(admin)],
];
let failed=0;
for(const [label,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+label);if(!ok)failed++;}
console.log('NOTE: Offline source checks cannot establish that Worker routes, database, CORS, session cookies, RBAC or MFA work in production.');
process.exitCode=failed?1:0;

#!/usr/bin/env node
// Auditoria de navegação estática STUDIOSB6L. Sem rede, pagamentos ou serviços externos.
// Executar: node scripts/audit-navigation.mjs
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), pages=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','dist'].includes(item.name))continue;const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(/\.html?$/i.test(item.name))pages.push(p);}}
walk(root);
const failures=[], edges=[], labels=new Map();
for(const file of pages){
 const source=fs.readFileSync(file,'utf8');
 const re=/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
 for(const match of source.matchAll(re)){
  const href=match[1].trim(), label=match[2].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(!href||href==='#'||/^javascript:/i.test(href)){failures.push({page:path.relative(root,file),href,label,reason:'empty-or-placeholder'});continue;}
  if(/^(https?:|mailto:|tel:|data:|#)/i.test(href))continue;
  const target=href.split(/[?#]/)[0];if(!target)continue;
  const resolved=target.startsWith('/')?path.join(root,target.slice(1)):path.resolve(path.dirname(file),target);
  const candidates=[resolved,path.join(resolved,'index.html')];
  const exists=candidates.some(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  const origin=path.relative(root,file);
  edges.push({origin,href,label,target:path.relative(root,resolved)});
  if(!exists)failures.push({page:origin,href,label,reason:'missing-local-target'});
  if(label){const key=label.toLocaleLowerCase('pt');const arr=labels.get(key)||[];arr.push({page:origin,href});labels.set(key,arr);}
 }
}
const duplicates=[...labels].filter(([,v])=>v.length>1&&new Set(v.map(x=>x.href)).size>1).map(([label,locations])=>({label,locations}));
const report={generatedAt:new Date().toISOString(),pages:pages.length,links:edges.length,failures,duplicateLabelsWithDifferentDestinations:duplicates};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/navigation-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pages:report.pages,links:report.links,broken:failures.length,ambiguousLabels:duplicates.length},null,2));
if(failures.length)process.exitCode=1;

#!/usr/bin/env node
// Auditoria de navegação estática STUDIOSB6L. Sem rede, pagamentos ou serviços externos.
// Executar: node scripts/audit-navigation.mjs
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), pages=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','dist'].includes(item.name))continue;const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(/\.html?$/i.test(item.name))pages.push(p);}}
walk(root);
const failures=[], edges=[], labels=new Map(), missingStaticFragments=[], anchors=new Map();
function pageAnchors(file){
 if(!anchors.has(file)){
  const html=fs.readFileSync(file,'utf8');
  anchors.set(file,new Set([...html.matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1])));
 }
 return anchors.get(file);
}
for(const file of pages){
 const source=fs.readFileSync(file,'utf8');
 const re=/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
 for(const match of source.matchAll(re)){
  const href=match[1].trim(), label=match[2].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(!href||href==='#'||/^javascript:/i.test(href)){failures.push({page:path.relative(root,file),href,label,reason:'empty-or-placeholder'});continue;}
  if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href))continue;
  let target;try{target=decodeURIComponent(href.split(/[?#]/)[0]);}catch{failures.push({page:path.relative(root,file),href,label,reason:'invalid-url-encoding'});continue;}if(!target)target=path.relative(path.dirname(file),file);
  const resolved=target.startsWith('/')?path.join(root,target.slice(1)):path.resolve(path.dirname(file),target);
  const candidates=[resolved,path.join(resolved,'index.html')];
  const canonical=candidates.find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  const exists=Boolean(canonical);
  const origin=path.relative(root,file);
  edges.push({origin,href,label,target:path.relative(root,canonical||resolved)});
  if(exists&&/\.html?$/i.test(canonical)&&href.includes('#')){
   let fragment;try{fragment=decodeURIComponent(href.slice(href.indexOf('#')+1));}catch{failures.push({page:origin,href,label,reason:'invalid-fragment-encoding'});continue;}
   if(fragment&&!fragment.startsWith(':~:text=')&&!pageAnchors(canonical).has(fragment))missingStaticFragments.push({page:origin,href,label,target:path.relative(root,canonical),fragment});
  }
  if(!exists)failures.push({page:origin,href,label,reason:'missing-local-target'});
  if(label){const key=label.toLocaleLowerCase('pt');const arr=labels.get(key)||[];arr.push({page:origin,href,target:path.relative(root,canonical||resolved)});labels.set(key,arr);}
 }
}
const duplicates=[...labels].filter(([,v])=>v.length>1&&new Set(v.map(x=>x.target)).size>1).map(([label,locations])=>({label,locations}));
const report={generatedAt:new Date().toISOString(),pages:pages.length,links:edges.length,failures,missingStaticFragments,duplicateLabelsWithDifferentDestinations:duplicates};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/navigation-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pages:report.pages,links:report.links,broken:failures.length,ambiguousLabels:duplicates.length,missingStaticFragments:missingStaticFragments.length},null,2));
if(failures.length)process.exitCode=1;

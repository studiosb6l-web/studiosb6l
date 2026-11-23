#!/usr/bin/env node
// Read-only repository audit. No network calls, credentials, billing or deployment.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [], warnings = [];
function check(condition, message) { if (!condition) errors.push(message); }
check(/<html\b/i.test(html), 'index.html must contain an HTML root');
check(/<meta\s+charset=/i.test(html), 'index.html must declare charset');
check(/name=["']viewport["']/i.test(html), 'index.html must declare viewport');
check(/<title>/i.test(html), 'index.html must declare title');
const viewport = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/i)?.[0] || '';
if (/width=1024/i.test(viewport)) warnings.push('Mobile viewport fixed at 1024px; verify visual behavior on phones before modifying.');
const form = html.match(/<form\b[^>]*id=["']b6l-private-form["'][\s\S]*?<\/form>/i);
if (form) {
  const handler = html.match(/f\.addEventListener\(['"]submit['"][\s\S]{0,700}/);
  if (handler && /preventDefault\(\)/.test(handler[0]) && !/fetch\s*\(|XMLHttpRequest/.test(handler[0])) {
    warnings.push('Private access form appears to be a nonfunctional demo. Do not enter real credentials.');
  }
}
// Report unverified backend integration without treating visual placeholders as live features.
for (const [relative, name] of [['conta/index.html', 'Account'], ['admin/index.html', 'Administration'], ['rede/index.html', 'Opportunities network']]) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { warnings.push(name + ' page is missing: ' + relative); continue; }
  const page = fs.readFileSync(file, 'utf8');
  if (relative === 'conta/index.html') {
    if (!/\/api\/auth\/login/.test(page) || !/\/api\/auth\/register/.test(page))
      warnings.push('Account page lacks expected login or registration API calls.');
    else warnings.push('Account page references authentication API; live sessions, CORS and RBAC remain unverified.');
  }
  if (relative === 'admin/index.html' && /Integração pendente|Aguardando base de dados/.test(page))
    warnings.push('Administration dashboard contains unconnected indicators; do not present as operational.');
  if (relative === 'rede/index.html' && /mailto:/.test(page))
    warnings.push('Opportunities requests use email handoff; no persistent messaging verified.');
}
const links = [...html.matchAll(/\bhref=["'](\/[^"'?#]*)(?:[?#][^"']*)?["']/g)]
  .map(m => m[1]).filter(p => !p.startsWith('//'));
const missing = [...new Set(links)].filter(p => {
  if (p === '/') return false;
  let decoded;
  try { decoded = decodeURIComponent(p); }
  catch { warnings.push('Malformed URL encoding in local link: ' + p); return false; }
  const relative = decoded.replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) {
    warnings.push('Local link escapes repository root: ' + p);
    return false;
  }
  return !fs.existsSync(target);
});
if (missing.length) warnings.push('Unresolved local links (may be dynamic routes): ' + missing.slice(0, 30).join(', '));
console.log('STUDIOSB6L static audit (read-only)');
console.log('Checked homepage, private login demo, viewport and ' + links.length + ' root-relative links.');
warnings.forEach(x => console.log('WARNING: ' + x));
errors.forEach(x => console.error('ERROR: ' + x));
console.log(errors.length ? 'FAIL' : 'PASS (static checks only; no backend or live login tested)');
process.exitCode = errors.length ? 1 : 0;

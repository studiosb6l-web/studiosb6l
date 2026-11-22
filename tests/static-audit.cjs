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
const links = [...html.matchAll(/\bhref=["'](\/[^"'?#]*)(?:[?#][^"']*)?["']/g)]
  .map(m => m[1]).filter(p => !p.startsWith('//'));
const missing = [...new Set(links)].filter(p => p !== '/' && !fs.existsSync(path.join(root, decodeURIComponent(p).replace(/^\//, ''))));
if (missing.length) warnings.push('Unresolved local links (may be dynamic routes): ' + missing.slice(0, 30).join(', '));
console.log('STUDIOSB6L static audit (read-only)');
console.log('Checked homepage, private login demo, viewport and ' + links.length + ' root-relative links.');
warnings.forEach(x => console.log('WARNING: ' + x));
errors.forEach(x => console.error('ERROR: ' + x));
console.log(errors.length ? 'FAIL' : 'PASS (static checks only; no backend or live login tested)');
process.exitCode = errors.length ? 1 : 0;

#!/usr/bin/env python3
"""Offline same-site relative link audit; ignores external URLs and JS routes."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json
ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':
   href=dict(attrs).get('href','')
   if href:self.links.append(href)
errors=[];checked=0
for file in ROOT.rglob('*.html'):
 if '.git' in file.parts or 'node_modules' in file.parts or file.stat().st_size>2_000_000:continue
 parser=Links()
 try:parser.feed(file.read_text(encoding='utf-8',errors='replace'))
 except Exception:continue
 for href in parser.links:
  parsed=urlsplit(href)
  if parsed.scheme or parsed.netloc or href.startswith(('#','mailto:','tel:','javascript:','//')):continue
  if not parsed.path or '{' in parsed.path or '}' in parsed.path:continue
  path=unquote(parsed.path)
  target=(ROOT/path.lstrip('/')) if path.startswith('/') else file.parent/path
  checked+=1
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append({'page':str(file.relative_to(ROOT)),'href':href[:250]})
report={'scope':'static relative links only; dynamic routes and external sites not tested','links_checked':checked,'broken_count':len(errors),'sample':errors[:150]}
(ROOT/'internal-link-audit.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'checked':checked,'broken':len(errors)}))
# Informational baseline: existing links may be generated dynamically.

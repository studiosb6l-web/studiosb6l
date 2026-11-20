#!/usr/bin/env python3
"""Informational static HTML accessibility audit, not WCAG certification."""
from html.parser import HTMLParser
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.lang='';self.images=0;self.missing_alt=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang','')
  if tag=='img':
   self.images+=1
   if 'alt' not in a:self.missing_alt+=1
pages=0;missing_lang=0;missing_alt=0;images=0
for path in ROOT.rglob('*.html'):
 if '.git' in path.parts or 'node_modules' in path.parts or path.stat().st_size>2_000_000:continue
 p=Page()
 try:p.feed(path.read_text(encoding='utf-8',errors='replace'))
 except Exception:continue
 pages+=1;missing_lang+=not bool(p.lang);images+=p.images;missing_alt+=p.missing_alt
report={'scope':'static source audit only; does not validate translations or WCAG compliance','pages':pages,'pages_without_lang':missing_lang,'images':images,'images_without_alt':missing_alt}
(ROOT/'international-accessibility.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))

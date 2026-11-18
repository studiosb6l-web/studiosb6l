#!/usr/bin/env python3
"""Audit published HTML metadata and discoverable internal links without fabricating SEO results."""
from pathlib import Path
from html.parser import HTMLParser
import json,re
ROOT=Path(__file__).resolve().parents[1]
SKIP={'.git','node_modules','vendor'}
class Page(HTMLParser):
 def __init__(self):super().__init__();self.title='';self.in_title=False;self.description='';self.canonical='';self.lang='';self.hreflangs=set();self.structured=0;self.links=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang','')
  if tag=='title':self.in_title=True
  if tag=='meta' and a.get('name','').lower()=='description':self.description=a.get('content','')
  if tag=='link':
   if a.get('rel','').lower()=='canonical':self.canonical=a.get('href','')
   if a.get('rel','').lower()=='alternate' and a.get('hreflang'):self.hreflangs.add(a['hreflang'])
  if tag=='script' and a.get('type','').lower()=='application/ld+json':self.structured+=1
  if tag=='a' and a.get('href','').startswith(('/','#')):self.links+=1
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
 def handle_data(self,data):
  if self.in_title:self.title+=data
issues=[];totals={'pages':0,'missing_titles':0,'missing_descriptions':0,'missing_lang':0,'missing_canonical':0,'without_schema':0}
for p in ROOT.rglob('*.html'):
 if any(x in SKIP for x in p.parts):continue
 if p.stat().st_size>3_000_000:continue
 page=Page()
 try:page.feed(p.read_text(encoding='utf-8',errors='replace'))
 except Exception as e:issues.append({'file':str(p.relative_to(ROOT)),'error':str(e)});continue
 totals['pages']+=1
 flags=[]
 for field,key in [('title','missing_titles'),('description','missing_descriptions'),('lang','missing_lang'),('canonical','missing_canonical')]:
  if not getattr(page,field).strip():totals[key]+=1;flags.append(key)
 if not page.structured:totals['without_schema']+=1;flags.append('without_schema')
 if flags:issues.append({'file':str(p.relative_to(ROOT)),'issues':flags})
report={'scope':'local technical/content SEO audit, not search ranking or indexed count','totals':totals,'sample_issues':issues[:100],'issue_count':len(issues)}
(ROOT/'seo-content-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'totals':totals,'issue_count':len(issues)},ensure_ascii=False))

#!/usr/bin/env python3
"""Public SEO discovery readiness checks; does not claim search-engine indexation."""
import json, re, urllib.request, urllib.error, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
BASE='https://www.studiosb6l.com'
checks=[]
def add(name,ok,detail):
    checks.append({'check':name,'ok':bool(ok),'detail':str(detail)[:500]})
def fetch(path):
    req=urllib.request.Request(BASE+path,headers={'User-Agent':'STUDIOSB6L-SEO-Audit/1.0'})
    with urllib.request.urlopen(req,timeout=20) as response:
        return response.status,response.read(12000000).decode('utf-8','replace')
for path in ['/','/robots.txt','/sitemap.xml','/sitemap-artistas.xml','/concertos/artistas/','/instrumentos/','/parceiros-awin/','/music-store.html']:
    try:
        status,body=fetch(path)
        add('HTTP '+path,status==200,f'Status {status}, {len(body)} characters')
        if path.endswith('.xml'):
            root=ET.fromstring(body)
            urls=root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
            add('XML sitemap '+path,len(urls)>0,f'{len(urls)} discoverable URLs')
        if path in ('/instrumentos/','/parceiros-awin/','/music-store.html'):\n            add('Canonical '+path,bool(re.search(r'<link[^>]+rel=[\"\\\']canonical[\"\\\']',body,re.I)),'Canonical on commerce page')\n            add('Title '+path,bool(re.search(r'<title>[^<]+</title>',body,re.I)),'Page title present')\n        if path=='/robots.txt':
            add('Robots lists both sitemaps',all(x in body for x in ['sitemap.xml','sitemap-artistas.xml']),'Robots sitemap declarations')
        if path=='/':
            add('Homepage canonical',bool(re.search(r'rel=["\\\']canonical["\\\']',body,re.I)),'Canonical present')
    except Exception as exc:
        add('HTTP '+path,False,type(exc).__name__+': '+str(exc))
try:
    catalog=json.loads(Path('concertos/artistas/catalogo.json').read_text(encoding='utf-8'))
    add('Catalog size',len(catalog)>0,f'{len(catalog)} entries')
    add('Unique slugs',len({r.get('slug') for r in catalog})==len(catalog),'Catalog slugs unique')
except Exception as exc:
    add('Local catalog',False,str(exc))
report={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'site':BASE,'scope':'technical crawl readiness only; not actual Google/Bing indexed counts or organic visits','checks':checks,'passed':sum(x['ok'] for x in checks),'total':len(checks)}
Path('seo-health-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\\n',encoding='utf-8')
print(json.dumps(report,indent=2,ensure_ascii=False))
if any(not x['ok'] for x in checks):raise SystemExit('SEO readiness check failed; review report')

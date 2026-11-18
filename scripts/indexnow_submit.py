#!/usr/bin/env python3
"""Notify participating IndexNow engines of genuinely changed pages only."""
import json, os, urllib.request, urllib.error
from pathlib import Path
from urllib.parse import urlsplit
BASE='https://www.studiosb6l.com'
KEY='4c800f986c182484dc50b93b03344326b07de76a'
ROOT=Path(__file__).resolve().parents[1]
changed=os.environ.get('CHANGED_FILES','').splitlines()
urls=[]
for raw in changed:
    path=raw.strip().lstrip('/')
    if not path or path.startswith(('.github/','scripts/')): continue
    if path=='index.html': url=BASE+'/'
    elif path.endswith('/index.html'): url=BASE+'/'+path[:-10]
    elif path.endswith('.html'): url=BASE+'/'+path
    elif path in ('sitemap.xml','sitemap-artistas.xml'): continue
    else: continue
    if url not in urls: urls.append(url)
# Only send pages changed in this commit. Do not repeatedly ping unchanged catalog URLs.
if not urls:
    print('No changed HTML pages to notify.');raise SystemExit(0)
if not (ROOT/(KEY+'.txt')).exists():raise SystemExit('IndexNow verification file missing')
print('Notifying IndexNow of',len(urls),'changed pages')
endpoint='https://api.indexnow.org/indexnow'
for i in range(0,len(urls),1000):
    batch=urls[i:i+1000]
    payload=json.dumps({'host':'www.studiosb6l.com','key':KEY,'keyLocation':BASE+'/'+KEY+'.txt','urlList':batch}).encode()
    req=urllib.request.Request(endpoint,data=payload,headers={'Content-Type':'application/json; charset=utf-8','User-Agent':'STUDIOSB6L-IndexNow/1.0'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            print('IndexNow response:',response.status,'URLs:',len(batch))
            if response.status not in (200,202):raise SystemExit(1)
    except urllib.error.HTTPError as exc:
        print('IndexNow HTTP error',exc.code,exc.read(400).decode('utf-8','replace'));raise

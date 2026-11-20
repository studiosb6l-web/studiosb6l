import json,urllib.request,hashlib
from html.parser import HTMLParser
from datetime import datetime,timezone
from pathlib import Path
sources={'SoundCloud':'https://soundcloud.com/company/newsroom/','Bandcamp':'https://bandcamp.com/artists','Vampr':'https://www.vampr.me/','BandLab':'https://www.bandlab.com/','Audiomack':'https://audiomack.com/','ReverbNation':'https://www.reverbnation.com/','DistroKid':'https://distrokid.com/','TuneCore':'https://www.tunecore.com/','Songtradr':'https://www.songtradr.com/','Stage 32':'https://www.stage32.com/','SoundBetter':'https://soundbetter.com/','Music Gateway':'https://www.musicgateway.com/'}
class Page(HTMLParser):
 def __init__(self):super().__init__();self.title='';self.inside=False;self.headings=[]
 def handle_starttag(self,tag,attrs):
  if tag=='title':self.inside=True
 def handle_endtag(self,tag):
  if tag=='title':self.inside=False
 def handle_data(self,data):
  if self.inside:self.title+=data
results=[]
for name,url in sources.items():
 item={'platform':name,'url':url}
 try:
  request=urllib.request.Request(url,headers={'User-Agent':'STUDIOSB6L-Public-Research/1.0'})
  with urllib.request.urlopen(request,timeout=15) as response:
   html=response.read(200000).decode('utf-8','replace')
   if response.status!=200:raise ValueError('HTTP status not 200')
  p=Page();p.feed(html)
  item.update({'status':'fetched','title':p.title.strip()[:200],'fingerprint':hashlib.sha256(p.title.encode()).hexdigest()[:20]})
 except Exception as e:item.update({'status':'unavailable','error':str(e)[:160]})
 results.append(item)
report={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'scope':'Read-only public official pages; title changes are not verified feature launches','results':results}
Path('competitor-intelligence-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps({'fetched':sum(x['status']=='fetched' for x in results),'total':len(results)}))
if all(x['status']!='fetched' for x in results):raise SystemExit('All sources unavailable')

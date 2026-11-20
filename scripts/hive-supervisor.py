#!/usr/bin/env python3
"""Read-only hive supervision of STUDIOSB6L automation coverage."""
import json, os, subprocess
from datetime import datetime, timezone
from pathlib import Path

GROUPS={
 'search_discovery':['global-search-performance.yml','opportunity-intelligence.yml'],
 'professional_matching':['global-matching-regression.yml','solution-proposals.yml'],
 'competitor_research':['competitor-intelligence.yml'],
 'seo_indexation':['indexnow.yml','seo-health.yml','seo-content-audit.yml','publish-artist-sitemap.yml'],
 'site_reliability':['hourly-production-monitor.yml','platform-health.yml'],
 'artists_content':['build-artists.yml','music-news.yml','youtube-videos.yml','update-studio-live.yml'],
 'application':['android-app.yml'],
 'master_supervision':['master-automation-audit.yml']
}
def get(path):
 p=subprocess.run(['gh','api',path],capture_output=True,text=True,timeout=40,check=True)
 return json.loads(p.stdout)
repo=os.environ['GH_REPO']
workflows=get('repos/'+repo+'/actions/workflows?per_page=100')['workflows']
by_path={w['path'].split('/')[-1]:w for w in workflows}
coverage={}
issues=[]
for area,expected in GROUPS.items():
 entries=[]
 for name in expected:
  w=by_path.get(name)
  state=w['state'] if w else 'missing'
  entries.append({'workflow':name,'state':state})
  if state!='active':issues.append(area+': '+name+' '+state)
 coverage[area]=entries
report={'time_utc':datetime.now(timezone.utc).isoformat(),'scope':'GitHub workflow coverage only, not proof of live service health','groups':coverage,'issues':issues,'total_workflows':len(workflows)}
Path('hive-supervisor-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'total_workflows':len(workflows),'areas':len(coverage),'issues':issues},ensure_ascii=False))
if issues:raise SystemExit('Missing or inactive automation')

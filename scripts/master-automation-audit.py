#!/usr/bin/env python3
"""Read-only GitHub Actions supervisor. No auto-merging, deployment or bot execution."""
import json, os, subprocess
from pathlib import Path
from datetime import datetime, timezone, timedelta

def gh(endpoint):
    result=subprocess.run(['gh','api',endpoint],capture_output=True,text=True,timeout=45,check=True)
    return json.loads(result.stdout)

repo=os.environ.get('GH_REPO','')
if not repo or '/' not in repo:
    raise SystemExit('GH_REPO must identify the current repository')
workflow_data=gh(f'repos/{repo}/actions/workflows?per_page=100')
workflows=workflow_data.get('workflows',[])
now=datetime.now(timezone.utc)
results=[]
critical=[]
for workflow in workflows:
    name=workflow.get('name','')
    path=workflow.get('path','')
    status=workflow.get('state','unknown')
    if path.endswith('master-automation-audit.yml'):
        continue
    wid=workflow['id']
    runs=gh(f'repos/{repo}/actions/workflows/{wid}/runs?per_page=1').get('workflow_runs',[])
    last=runs[0] if runs else None
    conclusion=last.get('conclusion') if last else None
    created=last.get('created_at') if last else None
    entry={'name':name,'path':path,'state':status,'last_conclusion':conclusion,'last_run':created,'last_url':last.get('html_url') if last else None}
    results.append(entry)
    if status != 'active':
        critical.append(f'{name}: state={status}')
    if conclusion in ('failure','timed_out','action_required'):
        critical.append(f'{name}: last run {conclusion}')
report={'checked_at':now.isoformat(),'scope':'GitHub workflow registration and latest run only; does not prove Cloudflare, payments, indexing or real matching','workflows_checked':len(results),'workflows':results,'issues':critical}
Path('master-automation-audit.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'workflows_checked':len(results),'issues':critical},ensure_ascii=False))
if critical:
    raise SystemExit('Master automation audit found issues')

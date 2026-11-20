import json
from pathlib import Path
from datetime import datetime,timezone
root=Path(__file__).resolve().parents[1]
checks={'registration':'cloudflare/artists-registration-worker.js','D1 migration':'cloudflare/connect-schema.sql','matching':'cloudflare/music-connect-core.mjs','matching tests':'tests/music-connect.test.mjs','opportunity discovery':'cloudflare/opportunity-keywords.mjs','solution proposals':'cloudflare/solution-proposals.mjs','competitive intelligence':'scripts/competitor-intelligence.py','production monitor':'.github/workflows/hourly-production-monitor.yml'}
report={'checked_at':datetime.now(timezone.utc).isoformat(),'scope':'Code inventory only; does not establish live deployment','capabilities':[{'name':name,'file':path,'present':(root/path).is_file(),'production_verified':False} for name,path in checks.items()],'next_steps':['Verify Cloudflare Worker and D1','End-to-end artist registration and moderation','Live opt-in matching','Payment webhook reconciliation','First-party analytics and accessibility']}
(root/'platform-transformation-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))

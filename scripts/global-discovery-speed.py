#!/usr/bin/env python3
"""Read-only public endpoint speed checks; not a guarantee of global search performance."""
import json, time, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path

base = 'https://www.studiosb6l.com'
paths = ['/', '/concertos/artistas/', '/sitemap.xml', '/sitemap-artistas.xml', '/robots.txt']
results = []
for path in paths:
    url = base + path
    start = time.monotonic()
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'STUDIOSB6L-Discovery-Monitor/1.0'})
        with urllib.request.urlopen(req, timeout=20) as response:
            response.read(4096)
            status = response.status
        elapsed = round((time.monotonic() - start) * 1000)
        results.append({'url': url, 'http_status': status, 'response_ms': elapsed, 'ok': status == 200, 'slow': elapsed > 4000})
    except Exception as exc:
        results.append({'url': url, 'http_status': None, 'response_ms': round((time.monotonic()-start)*1000), 'ok': False, 'error': str(exc)[:200]})
report = {'checked_at': datetime.now(timezone.utc).isoformat(), 'scope': 'GitHub runner network only; no private search, matching, or D1 latency tested', 'results': results}
Path('global-discovery-speed.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
if any(not r['ok'] for r in results):
    raise SystemExit('Public discovery endpoint unavailable')

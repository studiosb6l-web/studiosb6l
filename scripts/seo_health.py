#!/usr/bin/env python3
"""Bounded public crawl-readiness audit. Search-engine index counts require the consoles."""
import json
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

BASE = 'https://www.studiosb6l.com'
MAX_BYTES = 2 * 1024 * 1024
MAX_URLS = 60
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = None
        self.robots = ''
        self.title = ''
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.robots = attrs.get('content', '').lower()
        if tag == 'title':
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, value):
        if self.in_title:
            self.title += value


def fetch(url):
    if urlsplit(url).scheme != 'https' or urlsplit(url).netloc != 'www.studiosb6l.com':
        raise ValueError('Unexpected sitemap domain')
    request = urllib.request.Request(url, headers={'User-Agent': 'STUDIOSB6L-SEO-Audit/1.0'})
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError('Response exceeds bounded audit size')
        return response.status, response.geturl(), body.decode('utf-8', 'replace')


def main():
    checks = []

    def add(name, ok, detail):
        checks.append({'check': name, 'ok': bool(ok), 'detail': str(detail)[:500]})

    urls = []
    try:
        status, _, robots = fetch(BASE + '/robots.txt')
        add('Robots declares main sitemap', status == 200 and 'Sitemap: ' + BASE + '/sitemap.xml' in robots,
            'Artist sitemap is not newly submitted by this audit; publication review remains separate')
        status, _, sitemap = fetch(BASE + '/sitemap.xml')
        root = ET.fromstring(sitemap)
        urls = [n.text.strip() for n in root.findall(NS + 'url/' + NS + 'loc') if n.text]
        add('Main sitemap valid and bounded', status == 200 and 0 < len(urls) <= MAX_URLS,
            str(len(urls)) + ' declared URLs; audit maximum ' + str(MAX_URLS))
        add('Main sitemap URLs unique', len(urls) == len(set(urls)), 'No duplicate canonical URLs')
    except Exception as error:
        add('Robots and main sitemap', False, type(error).__name__ + ': ' + str(error))

    def inspect(url):
        try:
            status, target, html = fetch(url)
            metadata = Metadata()
            metadata.feed(html)
            return url, status, target, metadata, None
        except Exception as error:
            return url, None, None, None, type(error).__name__ + ': ' + str(error)

    with ThreadPoolExecutor(max_workers=4) as pool:
        for url, status, target, metadata, error in pool.map(inspect, list(dict.fromkeys(urls))[:MAX_URLS]):
            add('HTTP ' + url, status == 200, error or 'Status ' + str(status))
            if metadata is None:
                continue
            add('Title ' + url, bool(metadata.title.strip()), metadata.title)
            add('Canonical ' + url, metadata.canonical == url and target == url,
                'Canonical: ' + str(metadata.canonical) + '; final URL: ' + str(target))
            add('Indexable ' + url, 'noindex' not in metadata.robots and 'none' not in metadata.robots.split(','),
                'Public sitemap page must permit indexing; meta robots: ' + (metadata.robots or 'default'))

    try:
        catalog = json.loads(Path('concertos/artistas/catalogo.json').read_text(encoding='utf-8'))
        add('Catalog size', len(catalog) > 0, str(len(catalog)) + ' local entries; not an indexed-page count')
        add('Catalog slugs unique', len({row.get('slug') for row in catalog}) == len(catalog), 'Catalog slugs unique')
    except Exception as error:
        add('Local catalog', False, str(error))

    report = {'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'site': BASE,
              'scope': 'public crawl readiness only; not actual Google/Bing indexed counts or organic visits',
              'checks': checks, 'passed': sum(row['ok'] for row in checks), 'total': len(checks)}
    Path('seo-health-report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'passed': report['passed'], 'total': report['total'],
                      'failures': [row for row in checks if not row['ok']]}, indent=2, ensure_ascii=False))
    if any(not row['ok'] for row in checks):
        raise SystemExit('SEO readiness check failed; review seo-health-report.json')


if __name__ == '__main__':
    main()

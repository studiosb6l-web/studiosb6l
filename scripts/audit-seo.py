#!/usr/bin/env python3
"""Read-only SEO audit for STUDIOSB6L; no publishing or network writes."""
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

BASE = "https://www.studiosb6l.com/"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
results = {}
sets = {}
for filename in ("sitemap.xml", "sitemap-artistas.xml"):
    root = ET.parse(filename).getroot()
    urls = [n.text.strip() for n in root.findall("s:url/s:loc", NS) if n.text]
    duplicates = len(urls) - len(set(urls))
    offsite = [u for u in urls if not u.startswith(BASE)]
    sets[filename] = set(urls)
    results[filename] = {"urls": len(urls), "duplicates": duplicates, "offsite": len(offsite)}
    assert not duplicates, f"Duplicate URLs in {filename}: {duplicates}"
    assert not offsite, f"Unexpected domains in {filename}: {offsite[:3]}"
overlap = sets["sitemap.xml"] & sets["sitemap-artistas.xml"]
results["cross_sitemap_duplicates"] = len(overlap)
# A sitemap entry is not proof of a real profile, affiliation, rights, or an indexable page.
results["artist_profile_verification"] = "NOT VERIFIED: requires live URL checks and editorial review"
results["note"] = "Discovered URLs do not equal indexed pages or real artist partnerships."
print(json.dumps(results, indent=2, ensure_ascii=False))
assert not overlap, f"Cross-sitemap duplicate URLs: {sorted(overlap)[:5]}"

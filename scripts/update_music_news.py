"""Collect attributed public music headlines; never invent breaking news."""
import datetime as dt
import email.utils
import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

DEST = pathlib.Path("assets/music-news.json")
QUERIES = [
    ("concerts", '("concert cancelled" OR "concert postponed" OR "tour announced" OR "festival lineup") music when:2d'),
    ("festivals", '("music festival" OR "festival de música" OR "festival cancelado") when:2d'),
    ("artists", '("music artist" OR "musician" OR "banda" OR "cantor") when:2d'),
    ("opera", '("opera house" OR "ópera" OR "orchestra") when:2d'),
]
now = dt.datetime.now(dt.timezone.utc)
items = {}
for category, query in QUERIES:
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({
        "q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"
    })
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "STUDIOSB6L-news/1.0 (public RSS reader)"})
        with urllib.request.urlopen(req, timeout=18) as resp:
            root = ET.fromstring(resp.read(900000))
        for entry in root.findall(".//channel/item")[:35]:
            title = (entry.findtext("title") or "").strip()
            link = (entry.findtext("link") or "").strip()
            source = (entry.findtext("source") or "Google News").strip()
            raw_date = entry.findtext("pubDate") or ""
            if not title or not link.startswith("https://news.google.com/"):
                continue
            try:
                published = email.utils.parsedate_to_datetime(raw_date).astimezone(dt.timezone.utc)
            except (TypeError, ValueError):
                continue
            if not (now - dt.timedelta(hours=50) <= published <= now + dt.timedelta(minutes=10)):
                continue
            key = link
            if key not in items:
                items[key] = {"title": title[:220], "url": link, "source": source[:100],
                              "published": published.isoformat(), "categories": [category]}
            elif category not in items[key]["categories"]:
                items[key]["categories"].append(category)
    except Exception as exc:
        print("Feed unavailable:", category, type(exc).__name__)

ordered = sorted(items.values(), key=lambda x: x["published"], reverse=True)[:100]
if ordered:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps({"updated": now.isoformat(), "items": ordered},
                               ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Saved", len(ordered), "attributed headlines")
else:
    print("No valid recent items; preserving previous file")

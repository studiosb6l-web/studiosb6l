"""Fetch latest embeddable uploads from official studio channels using YouTube Data API.
Requires repository secret YOUTUBE_API_KEY; no guessing or scraping videos.
"""
import datetime as dt
import json
import os
import pathlib
import urllib.parse
import urllib.error
import urllib.request

OUT=pathlib.Path("assets/studio-videos.json")
key=os.getenv("YOUTUBE_API_KEY","").strip()
channels={
 "disney":[("Disney","Disney"),("WaltDisneyStudios","Walt Disney Studios")],
 "warner":[("UCjmJDM5pRKbUlVIzDYYWb6g","Warner Bros."),("UCU09q55eK-7tVcaYxuH2AfQ","Warner Bros. Pictures")]
}
def api(endpoint,params):
 url="https://www.googleapis.com/youtube/v3/"+endpoint+"?"+urllib.parse.urlencode(dict(params,key=key))
 with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"STUDIOSB6L/1.0"}),timeout=15) as r:
  return json.load(r)
if not key:
 print("YOUTUBE_API_KEY secret missing; keeping existing video catalog")
 raise SystemExit(0)
output={"updated":dt.datetime.now(dt.timezone.utc).isoformat(),"channels":{}}
try:
 previous=json.loads(OUT.read_text(encoding="utf-8")).get("channels",{})
except (OSError,ValueError):
 previous={}
for group,handles in channels.items():
 entries=[]
 for handle,label in handles:
  try:
   data=api("channels",{"part":"contentDetails,snippet",**({"id":handle} if handle.startswith("UC") and len(handle)==24 else {"forHandle":handle})})
   matches=data.get("items",[])
   if not matches:continue
   channel=matches[0]
   uploads=channel["contentDetails"]["relatedPlaylists"]["uploads"]
   listed=api("playlistItems",{"part":"snippet,contentDetails","playlistId":uploads,"maxResults":12})
   ids=[x.get("contentDetails",{}).get("videoId") for x in listed.get("items",[])]
   ids=[x for x in ids if x]
   if not ids:continue
   details=api("videos",{"part":"status,snippet,contentDetails","id":",".join(ids)})
   for video in details.get("items",[]):
    status=video.get("status",{})
    if status.get("privacyStatus")!="public" or status.get("embeddable") is not True:continue
    sn=video.get("snippet",{})
    if sn.get("channelId")!=channel.get("id"):continue
    entries.append({"youtubeId":video["id"],"title":sn.get("title","")[:180],
      "source":label,"published":sn.get("publishedAt",""),"videoVerified":True,
      "url":"https://www.youtube.com/watch?v="+video["id"]})
  except urllib.error.HTTPError as exc:
   try:
    detail=json.loads(exc.read().decode("utf-8","replace")).get("error",{})
    reason="; ".join(e.get("reason","") for e in detail.get("errors",[]))
    message=detail.get("message","")
   except (ValueError,UnicodeError):
    reason,message="",""
   print(f"{group} {handle} fetch failed: HTTP {exc.code}; reason={reason}; message={message[:250]}")
  except Exception as exc:
   print(group,handle,"fetch failed:",type(exc).__name__,str(exc)[:250])
 entries.sort(key=lambda x:x["published"],reverse=True)
 unique={x["youtubeId"]:x for x in entries}
 output["channels"][group]=list(unique.values())[:20] or previous.get(group,[])
if any(output["channels"].values()):
 OUT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Published official embeddable video catalog")
else:print("No confirmed embeddable videos; keeping previous catalog")

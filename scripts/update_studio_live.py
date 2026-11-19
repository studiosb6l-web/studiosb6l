#!/usr/bin/env python3
"""Discover officially published, embeddable YouTube live streams. Fail closed."""
import json, os, urllib.parse, urllib.request, datetime
from pathlib import Path
API=os.environ.get("YOUTUBE_API_KEY","")
OUT=Path("assets/studio-live.json")
CHANNELS={"disney":["UC_5niPa-d35gg88HaS7RrIw"],"warner":["UCjmJDM5pRKbUlVIzDYYWb6g"]}
def api(endpoint,params):
    url="https://www.googleapis.com/youtube/v3/"+endpoint+"?"+urllib.parse.urlencode({**params,"key":API})
    with urllib.request.urlopen(url,timeout=15) as r:return json.load(r)
def find_live(channels):
    for channel in channels:
        result=api("search",{"part":"id","channelId":channel,"eventType":"live","type":"video","maxResults":10})
        ids=[v.get("id",{}).get("videoId") for v in result.get("items",[]) if v.get("id",{}).get("videoId")]
        if not ids:continue
        details=api("videos",{"part":"status,liveStreamingDetails,snippet","id":",".join(ids)})
        for video in details.get("items",[]):
            status=video.get("status",{})
            live=video.get("liveStreamingDetails",{})
            if status.get("embeddable") is True and status.get("privacyStatus")=="public" and live.get("actualStartTime") and not live.get("actualEndTime") and video.get("snippet",{}).get("channelId")==channel:
                return video["id"]
    return None
def main():
    if not API:
        print("YOUTUBE_API_KEY missing: leaving existing configuration unchanged")
        return
    state={"channels":{}}
    for key,channels in CHANNELS.items():
        try:
            video=find_live(channels)
        except Exception as e:
            print(key,"API unavailable:",e,"; leaving existing configuration unchanged")
            return
        state["channels"][key]={"enabled":bool(video),"verified":bool(video),"youtubeId":video or "","expiresAt":None}
    OUT.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("Checked official live streams; active:",[k for k,v in state["channels"].items() if v["enabled"]])
if __name__=="__main__":main()

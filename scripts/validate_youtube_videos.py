#!/usr/bin/env python3
"""Conservative YouTube Data API enrichment; runs on GitHub Actions, not in visitors' browsers."""
import json,os,re,time,urllib.parse,urllib.request,pathlib
root=pathlib.Path("concertos/artistas")
key=os.environ["YOUTUBE_API_KEY"]
catalog=json.loads((root/"catalogo.json").read_text(encoding="utf-8"))
output=root/"videos-validados.json"
data=json.loads(output.read_text(encoding="utf-8")) if output.exists() else {}
start=int(os.environ.get("START_INDEX","0"))
limit=min(100,int(os.environ.get("BATCH_SIZE","50")))
def api(endpoint,**params):
    params["key"]=key
    req=urllib.request.Request("https://www.googleapis.com/youtube/v3/"+endpoint+"?"+urllib.parse.urlencode(params),headers={"User-Agent":"STUDIOSB6L-VideoCatalog/1.0"})
    with urllib.request.urlopen(req,timeout=25) as response:return json.load(response)
def norm(s):return re.sub(r"[^a-z0-9]+"," ",s.casefold()).strip()
for index,artist in enumerate(catalog[start:start+limit],start):
    name=artist.get("name","").strip()
    slug=artist.get("slug","")
    if not name or not slug or slug in data:continue
    try:
        search=api("search",part="snippet",q=name+" official music video",type="video",videoEmbeddable="true",maxResults=10)
        ids=[x.get("id",{}).get("videoId") for x in search.get("items",[]) if x.get("id",{}).get("videoId")]
        if not ids:continue
        details=api("videos",part="snippet,status",id=",".join(ids))
        accepted=[]
        for item in details.get("items",[]):
            sn=item.get("snippet",{});st=item.get("status",{})
            title=norm(sn.get("title",""));channel=norm(sn.get("channelTitle",""));target=norm(name)
            # A search match is not proof of an official artist channel.
            # Require exact artist name in title and channel, with no impersonation claims.
            if st.get("embeddable") is not True or st.get("privacyStatus")!="public":continue
            if target not in title or target not in channel:continue
            if any(x in channel for x in ("fan","tribute","reaction","karaoke","cover")):continue
            accepted.append({"id":item["id"],"title":sn.get("title",""),"channel":sn.get("channelTitle",""),"status":"candidate-review"})
        if accepted:data[slug]={"name":name,"videos":accepted[:3],"reviewed":False}
        print(index,name,len(accepted))
    except Exception as exc:print("Skipped",index,name,type(exc).__name__,str(exc)[:120])
    time.sleep(.15)
output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Candidates stored:",len(data))

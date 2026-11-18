#!/usr/bin/env python3
"""Build up to 10,000 independent artist directory pages from Wikidata."""
import json, os, re, time, html, urllib.parse, urllib.request, unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"concertos"/"artistas"
TARGET=1500
HEADERS={"User-Agent":"STUDIOSB6L-ArtistDirectory/1.0 (https://www.studiosb6l.com/)","Accept":"application/sparql-results+json"}
QUERY='''SELECT ?artist ?artistLabel WHERE {
  ?artist wdt:P106 wd:Q177220 .
  ?artist rdfs:label ?artistLabel .
  FILTER(LANG(?artistLabel)="en")
}'''
def fetch(offset,limit=100):
    query=QUERY+" LIMIT "+str(limit)+" OFFSET "+str(offset)
    url="https://query.wikidata.org/sparql?"+urllib.parse.urlencode({"query":query,"format":"json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=110) as r:
                return json.load(r)["results"]["bindings"]
        except Exception as exc:
            print("Request retry",offset,attempt,str(exc),flush=True)
            time.sleep(min(45,5*(attempt+1)))
    raise RuntimeError("Wikidata temporarily unavailable; no fabricated artist records")
def slug(name,qid):
    name=unicodedata.normalize("NFKD",name).encode("ascii","ignore").decode().lower()
    name=re.sub("[^a-z0-9]+","-",name).strip("-")[:65] or "artista"
    return name+"-"+qid.lower()
def page(record):
    name=html.escape(record["name"]); country=html.escape(record["country"])
    url="https://www.studiosb6l.com/concertos/artistas/"+record["slug"]+"/"
    desc=f"Perfil editorial de {record['name']} no diretório internacional STUDIOSB6L. Descobre artistas e concertos."
    ld=json.dumps({"@context":"https://schema.org","@type":"ProfilePage","url":url,"name":record["name"]+" — STUDIOSB6L","mainEntity":{"@type":"Person","name":record["name"],"identifier":record["qid"]}},ensure_ascii=False).replace("<","\\u003c")
    return f'''<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name} | Artistas — STUDIOSB6L</title><meta name="description" content="{html.escape(desc,quote=True)}"><link rel="canonical" href="{url}"><meta name="robots" content="index,follow"><style>body{{margin:0;background:#0b121e;color:#f6f0e5;font:17px/1.7 system-ui,sans-serif}}header,main,footer{{max-width:1000px;margin:auto;padding:22px}}header{{border-bottom:1px solid #ad925e}}a{{color:#e8c98b}}h1{{font:clamp(2rem,6vw,4rem) Georgia,serif}}section{{background:#15243a;border:1px solid #44536c;border-radius:12px;padding:24px;margin:22px 0}}.tag{{color:#d8bd85;letter-spacing:.12em;text-transform:uppercase}}.links a{{display:inline-block;padding:12px 16px;border:1px solid #ad925e;border-radius:8px;margin:5px;text-decoration:none}}</style><script type="application/ld+json">{ld}</script></head><body><header><a href="/">STUDIOS B6L</a> · <a href="/concertos/artistas/">Artistas internacionais</a></header><main><p class="tag">Diretório editorial internacional</p><h1>{name}</h1><p>{country} · Artista musical</p><section><h2>Perfil do artista</h2><p>{name} consta do diretório internacional de artistas da STUDIOSB6L. Os dados de identificação provêm de registos públicos do Wikidata. Esta ficha editorial não constitui um perfil oficial nem implica representação, autorização ou parceria com o artista.</p></section><section style="border-color:#d8bd85;text-align:center"><p class="tag">Em breve na STUDIOSB6L</p><h2>🚧 Página em construção — Aguarde</h2><p>Estamos a preparar novas experiências musicais e informações para este perfil. Entretanto, descobre a nossa seleção de música cinematográfica, ópera e obras clássicas.</p><div class="links"><a href="/#playlists">🎧 Ouvir música na STUDIOSB6L</a><a href="/concertos/artistas/">🌍 Descobrir outros artistas</a><a href="/#newsletter">✉️ Receber novidades</a></div></section><section><h2>Concertos e eventos</h2><p>Não existem datas de concertos confirmadas nesta ficha. Consulta a agenda da plataforma para descobrir eventos disponíveis.</p><div class="links"><a href="/concertos/">Agenda internacional</a><a href="/concertos/artistas/">Outros artistas</a><a href="/">Descobrir música STUDIOSB6L</a></div></section></main><footer>© STUDIOSB6L · Diretório editorial independente · Dados de identificação: Wikidata (CC0)</footer></body></html>'''
def main():
    checkpoint=ROOT/"artist-import-checkpoint.json"
    records=json.loads(checkpoint.read_text(encoding="utf-8")) if checkpoint.exists() else []
    seen={r["qid"] for r in records}
    next_offset=int((ROOT/"artist-import-offset.txt").read_text()) if (ROOT/"artist-import-offset.txt").exists() else 0
    for offset in range(0,10000,100):
        if len(records)>=TARGET:break
        if offset<next_offset:continue
        batch=fetch(offset,100)
        if not batch:break
        for row in batch:
            uri=row.get("artist",{}).get("value","")
            qid=uri.rsplit("/",1)[-1]
            name=row.get("artistLabel",{}).get("value","").strip()
            if not re.fullmatch("Q[0-9]+",qid) or not name or qid in seen:continue
            seen.add(qid)
            country=row.get("countryLabel",{}).get("value","Internacional")
            records.append({"qid":qid,"name":name,"country":country,"slug":slug(name,qid)})
            if len(records)>=TARGET:break
        if True:
            checkpoint.write_text(json.dumps(records,ensure_ascii=False),encoding="utf-8")
            print("Saved checkpoint:",len(records),"artists",flush=True)
        (ROOT/"artist-import-offset.txt").write_text(str(offset+100))
        print("Collected",len(records),"after",offset+len(batch),flush=True)
        time.sleep(3)
    if len(records)<TARGET:raise RuntimeError("Only "+str(len(records))+" verified records; target "+str(TARGET)+" not reached")
    for record in records:
        directory=DEST/record["slug"];directory.mkdir(parents=True,exist_ok=True)
        (directory/"index.html").write_text(page(record),encoding="utf-8")
    (DEST/"catalogo.json").write_text(json.dumps(records,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    sitemap='<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n'+''.join('<url><loc>https://www.studiosb6l.com/concertos/artistas/'+r["slug"]+'/</loc></url>\\n' for r in records)+'</urlset>'
    (ROOT/"sitemap-artistas.xml").write_text(sitemap,encoding="utf-8")
    print("GENERATED",len(records),"verified independent profiles",flush=True)
if __name__=="__main__":main()

#!/usr/bin/env python3
"""Build up to 10,000 independent artist directory pages from Wikidata."""
import json, os, re, time, html, urllib.parse, urllib.request, unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"concertos"/"artistas"
TARGET=5552
HEADERS={"User-Agent":"STUDIOSB6L-ArtistDirectory/1.0 (https://www.studiosb6l.com/)","Accept":"application/sparql-results+json"}
QUERY='''SELECT ?artist ?artistLabel WHERE {
  ?artist wdt:P106 wd:Q177220 .
  ?artist rdfs:label ?artistLabel .
  FILTER(LANG(?artistLabel)="en")
}'''
def fetch(offset,limit=100):
    query=QUERY+" LIMIT "+str(limit)+" OFFSET "+str(offset)
    url="https://query.wikidata.org/sparql?"+urllib.parse.urlencode({"query":query,"format":"json"})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=35) as r:
                return json.load(r)["results"]["bindings"]
        except Exception as exc:
            print("Request retry",offset,attempt,str(exc),flush=True)
            time.sleep(4*(attempt+1))
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
    return f'''<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name} | Artistas — STUDIOSB6L</title><meta name="description" content="{html.escape(desc,quote=True)}"><link rel="canonical" href="{url}"><meta name="robots" content="index,follow"><style>body{{margin:0;background:#0b121e;color:#f6f0e5;font:17px/1.7 system-ui,sans-serif}}header,main,footer{{max-width:1000px;margin:auto;padding:22px}}header{{border-bottom:1px solid #ad925e}}a{{color:#e8c98b}}h1{{font:clamp(2rem,6vw,4rem) Georgia,serif}}section{{background:#15243a;border:1px solid #44536c;border-radius:12px;padding:24px;margin:22px 0}}.tag{{color:#d8bd85;letter-spacing:.12em;text-transform:uppercase}}.links a{{display:inline-block;padding:12px 16px;border:1px solid #ad925e;border-radius:8px;margin:5px;text-decoration:none}}</style><script type="application/ld+json">{ld}</script></head><body><header><a href="/">STUDIOS B6L</a> · <a href="/concertos/artistas/">Artistas internacionais</a></header><main><p class="tag">Diretório editorial internacional</p><h1>{name}</h1><p>{country} · Artista musical</p><section><h2>Quem é {name}?</h2><p>Conhece a atividade musical, os géneros, os instrumentos e as fontes biográficas disponíveis sobre {name}. Os dados desta página são associados ao registo público individual do artista e atualizados a partir das fontes identificadas abaixo.</p><p><small>Ficha editorial independente: não representa uma conta oficial, uma colaboração ou um vínculo comercial com o artista.</small></p></section><section id="verified-details"><h2>Informações verificadas sobre {name}</h2><p id="artist-summary">A consultar dados públicos disponíveis para este artista.</p><div id="artist-facts"></div><div id="artist-image"></div><p id="artist-sources"></p></section><script>
(async function(){{
 const qid={json.dumps(record["qid"])};
 const summary=document.getElementById("artist-summary"),facts=document.getElementById("artist-facts"),picture=document.getElementById("artist-image"),sources=document.getElementById("artist-sources");
 const wd="https://www.wikidata.org/wiki/"+encodeURIComponent(qid);
 const a=document.createElement("a");a.href=wd;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Consultar ficha de origem no Wikidata";sources.append(a);
 try{{
  const endpoint="https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+encodeURIComponent(qid)+"&props=descriptions|claims|sitelinks&languages=pt|en|es&format=json&origin=*";
  const res=await fetch(endpoint);if(!res.ok)throw Error("source unavailable");
  const obj=await res.json(),entity=obj.entities?.[qid];if(!entity||entity.missing!==undefined)throw Error("missing");
  const description=entity.descriptions?.pt?.value||entity.descriptions?.en?.value||entity.descriptions?.es?.value;
  if(description)summary.textContent=description.charAt(0).toUpperCase()+description.slice(1)+".";
  else summary.textContent="Informação biográfica adicional ainda não disponível nesta fonte.";
  const claims=entity.claims||{{}};
  const val=p=>claims[p]?.[0]?.mainsnak?.datavalue?.value;
  const ids=[];for(const p of ["P27","P19","P136","P1303","P106","P264","P463"]){{
    for(const c of (claims[p]||[]).slice(0,4)){{
      const id=c.mainsnak?.datavalue?.value?.id;if(id&&/^Q[0-9]+$/.test(id))ids.push(id);
    }}
  }}
  const labels={{}};
  if(ids.length){{
   const lr=await fetch("https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+encodeURIComponent([...new Set(ids)].join("|"))+"&props=labels&languages=pt|en|es&format=json&origin=*");
   if(lr.ok){{const d=await lr.json();Object.entries(d.entities||{{}}).forEach(([id,e])=>labels[id]=e.labels?.pt?.value||e.labels?.en?.value||e.labels?.es?.value||"");}}
  }}
  const groups=[["P27","Nacionalidade"],["P19","Local de nascimento"],["P136","Géneros musicais"],["P1303","Instrumentos"],["P106","Atividade profissional"],["P264","Editora discográfica"],["P463","Associações"]];
  for(const [prop,title] of groups){{
   const values=[...new Set((claims[prop]||[]).slice(0,4).map(c=>labels[c.mainsnak?.datavalue?.value?.id]).filter(Boolean))];
   if(values.length){{const p=document.createElement("p");const b=document.createElement("strong");b.textContent=title+": ";p.append(b,document.createTextNode(values.join(", ")));facts.append(p);}}
  }}
  const website=val("P856");if(typeof website==="string"&&/^https?:\/\//.test(website)){{const p=document.createElement("p"),link=document.createElement("a");link.href=website;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Visitar página oficial indicada no Wikidata";p.append(link);facts.append(p);const events=document.getElementById("official-events");if(events){{const e=document.createElement("a");e.href=website;e.target="_blank";e.rel="noopener noreferrer";e.textContent="Consultar o site oficial de "+{json.dumps(record["name"],ensure_ascii=False)}+" para verificar a agenda";events.append(e);}}}}
  const image=val("P18");if(typeof image==="string"&&image){{
   const img=document.createElement("img");img.loading="lazy";img.alt="Fotografia de "+{json.dumps(record["name"],ensure_ascii=False)};img.style.cssText="max-width:240px;width:100%;height:auto;border-radius:12px";img.onerror=()=>img.remove();
   img.src="https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(image)+"?width=480";
   picture.append(img);const credit=document.createElement("p"),link=document.createElement("a");link.href="https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(image.replaceAll(" ","_"));link.textContent="Ver autor e licença da fotografia no Wikimedia Commons";link.target="_blank";link.rel="noopener noreferrer";credit.append(link);picture.append(credit);
  }}
  const enwiki=entity.sitelinks?.enwiki?.title,ptwiki=entity.sitelinks?.ptwiki?.title;
  const article=ptwiki?["pt",ptwiki]:enwiki?["en",enwiki]:null;
  if(article){{const link=document.createElement("a");link.href="https://"+article[0]+".wikipedia.org/wiki/"+encodeURIComponent(article[1].replaceAll(" ","_"));link.target="_blank";link.rel="noopener noreferrer";link.textContent="Ler mais sobre o artista na Wikipédia";sources.append(document.createTextNode(" · "),link);}}
 }}catch(e){{summary.textContent="Dados adicionais temporariamente indisponíveis. Consulta a fonte pública acima para obter mais informações.";}}
}})();
</script><section style="border-color:#d8bd85;text-align:center"><p class="tag">Em breve na STUDIOSB6L</p><h2>Novas informações em preparação</h2><p>O perfil de {name} será enriquecido à medida que forem identificadas fontes públicas fiáveis. Entretanto, explora a seleção de música cinematográfica, ópera e obras clássicas da STUDIOSB6L.</p><div class="links"><a href="/#playlists">🎧 Ouvir música na STUDIOSB6L</a><a href="/concertos/artistas/">🌍 Descobrir outros artistas</a><a href="/#newsletter">✉️ Receber novidades</a></div></section><section id="artist-discography"><h2>Discografia de {name}</h2><p>Álbuns e lançamentos associados ao registo do artista, apresentados aqui na STUDIOSB6L.</p><div id="artist-releases" aria-live="polite"><p>A consultar os lançamentos disponíveis…</p></div><p><small>Dados de catálogo: MusicBrainz. As datas e créditos dependem dos registos disponibilizados pela fonte.</small></p></section><section id="artist-news"><h2>Notícias e novidades de {name}</h2><p id="artist-news-status">Estamos a preparar notícias, entrevistas e lançamentos confirmados sobre este artista. Só serão publicados aqui conteúdos com data e fonte identificada.</p><div class="links"><a href="#artist-discography">🎼 Ver discografia nesta página</a><a href="#artist-events">🎟️ Consultar concertos nesta página</a></div></section><section id="artist-events"><h2>Concertos e eventos de {name}</h2><p>Ainda não existem concertos futuros verificados para esta ficha. Quando forem confirmados, serão apresentados diretamente aqui, com data, local e bilhetes de parceiros autorizados.</p><p id="official-events"></p><div class="links"><a href="/concertos/">🎟️ Agenda internacional STUDIOSB6L</a><a href="/concertos/artistas/">🌍 Outros artistas</a><a href="/">🎧 Ouvir música STUDIOSB6L</a></div></section><script>
(async function(){{
 const target=document.getElementById("artist-releases"),qid={json.dumps(record["qid"])};
 try{{
  const wd=await fetch("https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+encodeURIComponent(qid)+"&props=claims&format=json&origin=*");
  if(!wd.ok)throw Error("wikidata");
  const data=await wd.json();
  const mbid=data.entities?.[qid]?.claims?.P434?.[0]?.mainsnak?.datavalue?.value;
  if(typeof mbid!=="string"||!/^[a-f0-9-]{{36}}$/i.test(mbid)){{target.textContent="Discografia ainda não associada a um identificador musical confirmado.";return;}}
  const response=await fetch("https://musicbrainz.org/ws/2/release-group?artist="+encodeURIComponent(mbid)+"&type=album|ep|single&limit=30&fmt=json");
  if(!response.ok)throw Error("musicbrainz");
  const releases=(await response.json())["release-groups"]||[];
  target.replaceChildren();
  if(!releases.length){{target.textContent="Ainda não foram encontrados lançamentos verificados neste catálogo.";return;}}
  const ul=document.createElement("ul");ul.style.cssText="padding-left:22px;line-height:1.8";
  for(const r of releases){{
   const li=document.createElement("li"),strong=document.createElement("strong");
   strong.textContent=r.title||"Lançamento sem título";li.append(strong);
   const meta=[r["first-release-date"],r["primary-type"]].filter(Boolean).join(" · ");
   if(meta)li.append(document.createTextNode(" — "+meta));
   ul.append(li);
  }}
  target.append(ul);
 }}catch(e){{target.textContent="A discografia está temporariamente indisponível. Podes continuar a explorar os outros conteúdos da STUDIOSB6L.";}}
}})();
</script></main><footer>© STUDIOSB6L · Diretório editorial independente · Dados de identificação: Wikidata (CC0)</footer></body></html>'''
def main():
    checkpoint=ROOT/"artist-import-checkpoint.json"
    records=json.loads(checkpoint.read_text(encoding="utf-8")) if checkpoint.exists() else []
    seen={r["qid"] for r in records}
    next_offset=int((ROOT/"artist-import-offset.txt").read_text()) if (ROOT/"artist-import-offset.txt").exists() else 0
    for offset in range(0,10000,100):
        if len(records)>=TARGET:break
        if offset<next_offset:continue
        try:
            batch=fetch(offset,100)
        except Exception as exc:
            print("Source unavailable; publishing saved verified records:",exc,flush=True)
            break
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
    if len(records)<TARGET:
        print("Partial batch:",len(records),"verified records; target",TARGET,"will continue in a later run",flush=True)
    for record in records:
        directory=DEST/record["slug"];directory.mkdir(parents=True,exist_ok=True)
        (directory/"index.html").write_text(page(record),encoding="utf-8")
    (DEST/"catalogo.json").write_text(json.dumps(records,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>https://www.studiosb6l.com/concertos/artistas/'+r["slug"]+'/</loc></url>\n' for r in records)+'</urlset>'
    (ROOT/"sitemap-artistas.xml").write_text(sitemap,encoding="utf-8")
    print("GENERATED",len(records),"verified independent profiles",flush=True)
if __name__=="__main__":main()

/* STUDIOSB6L — descoberta de vídeos oficiais, sem reprodução automática nem anúncios sobre o player. */
(function(){
  "use strict";
  function render(root){
  if(!root)return;
  const name=(root.dataset.artistName||document.querySelector("h1")?.textContent||"").trim();
  if(!name)return;
  const title=document.createElement("h2");title.textContent="Vídeos e atuações";
  const info=document.createElement("p");info.textContent="Descobre atuações e vídeos do artista. Apenas vídeos oficiais autorizados para incorporação serão reproduzidos aqui. A STUDIOSB6L é um diretório independente.";
  const search=document.createElement("a");
  search.href="https://www.youtube.com/results?search_query="+encodeURIComponent(name+" official music video");
  search.target="_blank";search.rel="noopener noreferrer";search.textContent="Procurar vídeos oficiais no YouTube";
  search.style.cssText="display:inline-block;padding:12px 18px;border:1px solid #d8bd85;border-radius:8px;color:#f3d89d;text-decoration:none;margin:8px 0";
  root.replaceChildren(title,info);
  const ids=(root.dataset.videoIds||"").split(",").map(s=>s.trim()).filter(s=>/^[A-Za-z0-9_-]{11}$/.test(s));
  for(const id of ids.slice(0,3)){
    const frame=document.createElement("iframe");
    frame.src="https://www.youtube-nocookie.com/embed/"+id;
    frame.title="Vídeo do YouTube — "+name;
    frame.loading="lazy";frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen=true;
    frame.style.cssText="display:block;width:100%;max-width:760px;aspect-ratio:16/9;border:0;border-radius:10px;margin:16px 0";
    root.append(frame);
  }
  if(!ids.length){const pending=document.createElement("p");pending.textContent="Seleção de vídeos oficiais em preparação.";root.append(pending);}
  root.append(search);
  const more=document.createElement("p");const link=document.createElement("a");
  link.href="/concertos/artistas/";link.textContent="Explorar outros artistas e bandas na STUDIOSB6L";
  more.append(link);root.append(more);
})();
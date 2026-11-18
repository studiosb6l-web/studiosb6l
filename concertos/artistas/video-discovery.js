/* STUDIOSB6L — vídeos oficiais e revisão individual do catálogo. */
(function(){
"use strict";
const curated={"Andrea Bocelli":["Ng7JKZQXnWw"],"Metallica":["tAGnKpE4NCI"],"Queen":["fJ9rUzIMcZQ"],"Nirvana":["hTWKbfoikeg"],"Michael Jackson":["sOnqjkJTMaA"],"Rick Astley":["dQw4w9WgXcQ"],"PSY":["9bZkp7q19f0"],"Adele":["YQHsXMglC9A"],"Coldplay":["dvgZkm1xWPE"],"Lady Gaga":["qrO4YZeyl0I"],"Ed Sheeran":["JGwWNGJdvx8"],"Taylor Swift":["e-ORhEE9VVg"],"BTS":["gdZLi9oWNZg"],"BLACKPINK":["IHNzOHi8sJs"],"Shakira":["pRpeEdMmmQ0"],"Linkin Park":["eVTXPUF4Oz4"],"Guns N’ Roses":["1w7OgIMMRc4"],"Guns N' Roses":["1w7OgIMMRc4"],"U2":["ftjEcrrf7r0"],"The Beatles":["A_MjCqQoLLA"],"AC/DC":["v2AC41dglnM"],"Bon Jovi":["lDK9QqIzhwk"],"Imagine Dragons":["ktvTqknDobU"],"Radiohead":["XFkzRNyygfk"],"The Weeknd":["4NRXx6U8ABQ"]};
function parseId(value){
 try{
  const url=new URL(value);
  if(url.hostname==="youtu.be"||url.hostname==="www.youtu.be")return /^[\w-]{11}$/.test(url.pathname.slice(1))?url.pathname.slice(1):null;
  if(["youtube.com","www.youtube.com","m.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(url.hostname)){
   const id=url.searchParams.get("v")||(url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)||[])[1];
   return /^[\w-]{11}$/.test(id||"")?id:null;
  }
 }catch(e){}
 return null;
}
function render(root){
 if(!root)return;
 const name=(root.dataset.artistName||document.querySelector("h1")?.textContent||"").trim();
 if(!name)return;
 root.replaceChildren();
 const h=document.createElement("h2");h.textContent="Vídeos e atuações — "+name;root.append(h);
 const desc=document.createElement("p");desc.textContent="Vídeos incorporados do YouTube, quando disponíveis e permitidos pelo titular. Diretório editorial independente; a inclusão não representa parceria.";root.append(desc);
 const videoArea=document.createElement("div");root.append(videoArea);
 function addVideo(id){
  const frame=document.createElement("iframe");frame.src="https://www.youtube-nocookie.com/embed/"+id;
  frame.title="Vídeo de "+name;frame.loading="lazy";frame.allowFullscreen=true;
  frame.referrerPolicy="strict-origin-when-cross-origin";
  frame.allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.style.cssText="display:block;width:100%;max-width:760px;aspect-ratio:16/9;border:0;border-radius:10px;margin:14px 0";
  videoArea.append(frame);
 }
 const ids=(root.dataset.videoIds||curated[name]||[]).toString().split(",").map(s=>s.trim()).filter(s=>/^[\w-]{11}$/.test(s));
 ids.slice(0,3).forEach(addVideo);
 if(!ids.length){
  const pending=document.createElement("p");pending.textContent="Vídeo oficial ainda por confirmar. Podes pesquisar e experimentar um vídeo nesta página.";root.append(pending);
 }
 const search=document.createElement("a");
 search.href="https://www.youtube.com/results?search_query="+encodeURIComponent(name+" official music video");
 search.target="_blank";search.rel="noopener noreferrer";search.textContent="Pesquisar vídeo oficial no YouTube";
 search.style.cssText="display:inline-block;margin:8px 0;color:#e8d1a1";root.append(search);
 const label=document.createElement("label");label.textContent="Verificar um vídeo: cola aqui a ligação do YouTube";label.style.cssText="display:block;margin:12px 0 5px";root.append(label);
 const input=document.createElement("input");input.type="url";input.placeholder="https://www.youtube.com/watch?v=...";
 input.style.cssText="width:min(100%,520px);box-sizing:border-box;padding:10px;background:#101d2c;color:#fff;border:1px solid #d8bd85;border-radius:6px";label.append(input);
 const button=document.createElement("button");button.type="button";button.textContent="Ver vídeo nesta página";
 button.style.cssText="display:block;margin:10px 0;padding:10px 15px;border:1px solid #d8bd85;border-radius:6px;background:#d8bd85;color:#101b2c;cursor:pointer";root.append(button);
 const feedback=document.createElement("p");feedback.setAttribute("aria-live","polite");root.append(feedback);
 button.addEventListener("click",()=>{
  const id=parseId(input.value.trim());
  if(!id){feedback.textContent="Introduz uma ligação válida do YouTube.";return;}
  videoArea.replaceChildren();addVideo(id);
  feedback.textContent="Pré-visualização carregada. Esta escolha não é publicada para os outros visitantes.";
 });
 const more=document.createElement("p");const link=document.createElement("a");
 link.href="/concertos/artistas/";link.textContent="Descobrir outros artistas e bandas";more.append(link);root.append(more);
}
window.B6LVideoDiscovery=render;
document.querySelectorAll("[data-b6l-video-discovery]").forEach(render);
})();
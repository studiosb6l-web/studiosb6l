/* STUDIOSB6L attributed news alerts. No ads, no unverified claims, no overlays on players. */
(function(){
'use strict';
const path=location.pathname;
if(!path.includes('/concertos/'))return;
const isProfile=/\/concertos\/artistas\/[^/]+\/?$/.test(path);
const artist=isProfile?(document.querySelector('main h1')?.textContent||'').trim():'';
const category=path.includes('/festiv')?'festivals':path.includes('/artistas/')?'artists':'concerts';
const style=document.createElement('style');
style.textContent='#b6l-news-alert{position:fixed;right:16px;bottom:18px;z-index:900;max-width:min(350px,calc(100vw - 32px));box-sizing:border-box;padding:15px 17px;background:#142238;color:#f7f2e9;border:1px solid #d8bd85;border-radius:13px;box-shadow:0 8px 25px #0007;font:14px/1.5 system-ui,sans-serif}#b6l-news-alert a{color:#f5d79a;text-decoration:underline}#b6l-news-alert button{float:right;background:transparent;border:0;color:white;font-size:22px;cursor:pointer}#b6l-news-alert small{display:block;color:#c9cbd1;margin:6px 0}#b6l-news-alert[hidden]{display:none!important}@media(max-width:600px){#b6l-news-alert{right:10px;bottom:10px;max-width:min(280px,calc(100vw - 20px));font-size:12px}}';
document.head.append(style);
let closed=false,shown=new Set();
function clean(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function select(items){
 const recent=items.filter(x=>x&&x.title&&x.url&&x.source&&x.published&&Date.now()-Date.parse(x.published)<50*3600000);
 if(isProfile){const name=clean(artist);return recent.filter(x=>name.length>=3&&clean(x.title).includes(name));}
 const local=recent.filter(x=>(x.categories||[]).includes(category));const studio=recent.filter(x=>(x.categories||[]).some(c=>c==='disney'||c==='warner'));return [...local,...studio.filter(x=>!local.includes(x))];
}
function display(item){
 if(closed||document.hidden||document.querySelector('iframe:focus'))return;
 const old=document.getElementById('b6l-news-alert');if(old)old.remove();
 const panel=document.createElement('aside');panel.id='b6l-news-alert';panel.setAttribute('aria-label','Notícia musical recente');
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar notícias');close.onclick=()=>{closed=true;panel.remove();};
 const header=document.createElement('strong');header.textContent='📰 STUDIOSB6L · Notícias recentes';
 const title=document.createElement('p');title.textContent=item.title;
 const source=document.createElement('small');source.textContent=item.source+' · '+new Date(item.published).toLocaleString();
 const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Consultar fonte original';
 panel.append(close,header,title,source);
 // Only use a supplied, vetted YouTube ID. News RSS articles are not automatically videos.
 if(item.youtubeId && /^[A-Za-z0-9_-]{11}$/.test(item.youtubeId) && item.videoVerified===true){
  const frame=document.createElement('iframe');
  frame.src='https://www.youtube-nocookie.com/embed/'+item.youtubeId+'?autoplay=1&mute=1&playsinline=1';
  frame.title='Notícia em vídeo: '+item.title;
  frame.loading='lazy';frame.allow='autoplay; encrypted-media; picture-in-picture';
  frame.allowFullscreen=true;frame.style.cssText='width:100%;aspect-ratio:16/9;border:0;border-radius:8px';
  panel.append(frame);
  const audio=document.createElement('button');audio.type='button';audio.textContent='Ativar som no vídeo';audio.style.cssText='float:none;font-size:13px;border:1px solid #d8bd85;padding:7px;border-radius:6px;margin:6px 0';
  audio.onclick=()=>{frame.src='https://www.youtube-nocookie.com/embed/'+item.youtubeId+'?autoplay=1&mute=0&playsinline=1';audio.remove();panel.dataset.engaged='1';};
  panel.append(audio);
  frame.addEventListener('pointerdown',()=>{panel.dataset.engaged='1';},{once:true});
 }
 panel.append(link);document.body.append(panel);
 setTimeout(()=>{if(panel.dataset.engaged!=='1')panel.remove();},30000);
}
async function refresh(){
 try{
  const r=await fetch('/assets/music-news.json',{cache:'no-store'});if(!r.ok)return;
  const data=await r.json();const available=select(data.items||[]).filter(x=>!shown.has(x.url));
  if(available.length&&!closed){const item=available[0];shown.add(item.url);display(item);}
 }catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
setInterval(refresh,300000);
})();

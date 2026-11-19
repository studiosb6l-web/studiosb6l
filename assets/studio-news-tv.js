(function(){
'use strict';
const root=document.getElementById('b6l-studio-news');if(!root)return;
const storageKey='b6l-hide-studio-news';const restore=document.getElementById('b6l-tv-restore');
const categories=[{key:'disney',name:'Disney',symbol:'✦'},{key:'warner',name:'Warner Bros. Discovery',symbol:'◈'}];
const grid=root.querySelector('.b6l-tv-grid');
function hide(){root.hidden=true;restore.classList.add('is-visible');try{localStorage.setItem(storageKey,'1')}catch(e){}}
function show(){root.hidden=false;restore.classList.remove('is-visible');try{localStorage.removeItem(storageKey)}catch(e){}}
root.querySelector('[data-hide-all]').addEventListener('click',hide);restore.addEventListener('click',show);
try{if(localStorage.getItem(storageKey)==='1')hide()}catch(e){}
function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e}
// Keep the two-screen TV visible as a compact, dismissible mini-player while scrolling.
const anchorNode=document.createElement('div');anchorNode.id='b6l-tv-anchor';root.parentNode.insertBefore(anchorNode,root);
let floating=false;
function updateDock(){
 const shouldFloat=!root.hidden&&anchorNode.getBoundingClientRect().top < -80;
 if(shouldFloat===floating)return;
 floating=shouldFloat;root.classList.toggle('b6l-tv-floating',floating);
}
window.addEventListener('scroll',updateDock,{passive:true});
window.addEventListener('resize',updateDock,{passive:true});
root.querySelector('[data-hide-all]').addEventListener('click',()=>{floating=false;root.classList.remove('b6l-tv-floating')});
restore.addEventListener('click',updateDock);
const panels={};
for(const c of categories){
 const card=node('article','b6l-tv');const top=node('div','b6l-tv-top');top.append(node('span','',c.name));
 const toggle=node('button','','Ocultar');toggle.type='button';toggle.setAttribute('aria-label','Ocultar notícias '+c.name);top.append(toggle);
 const screen=node('div','b6l-tv-screen');screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','','A procurar notícias recentes…'));
 const meta=node('div','b6l-tv-meta','Atualização automática de notícias');
 const actions=node('div','b6l-tv-actions');const link=node('a','','Consultar notícia');link.hidden=true;link.target='_blank';link.rel='noopener noreferrer';
 const sound=node('button','','Ativar som');sound.type='button';sound.hidden=true;actions.append(link,sound);
 card.append(top,screen,meta,actions);grid.append(card);panels[c.key]={card,screen,meta,link,sound};
 toggle.onclick=()=>{if(activeChannel===c.key)setTvAudio(null);card.hidden=true;const b=root.querySelector('[data-restore-'+c.key+']');if(b)b.hidden=false};
 const button=node('button','', 'Mostrar '+c.name);button.type='button';button.hidden=true;button.setAttribute('data-restore-'+c.key,'');button.onclick=()=>{card.hidden=false;button.hidden=true};root.querySelector('.b6l-tv-head').append(button);
}
const playing={};
let activeChannel=null;
function sendPlayer(frame,func){if(!frame?.contentWindow)return;frame.contentWindow.postMessage(JSON.stringify({event:'command',func,args:[]}), 'https://www.youtube-nocookie.com');}
function setTvAudio(key){
 activeChannel=key;window.b6lTvAudioActive=!!key;
 for(const c of categories){const p=panels[c.key];const frame=p.screen.querySelector('iframe');if(frame)sendPlayer(frame,c.key===key?'unMute':'mute');p.sound.hidden=!frame;p.sound.textContent=c.key===key?'Silenciar':'Ativar som';}
 window.dispatchEvent(new CustomEvent('b6l-tv-audio',{detail:{active:!!key,channel:key}}));
}

let latestItems=[],latestVideos={channels:{}};
const NEWS_DURATION=120000,NEWS_CYCLE=900000;
function newsWindow(){return Date.now()%NEWS_CYCLE<NEWS_DURATION;}

function draw(items,videos){
 for(const c of categories){
  const p=panels[c.key];
  const clips=(videos.channels&&videos.channels[c.key]||[]).filter(x=>x.videoVerified===true&&/^[A-Za-z0-9_-]{11}$/.test(x.youtubeId||''));
  const article=items.find(x=>Array.isArray(x.categories)&&x.categories.includes(c.key)&&x.title&&x.url);
  const clip=clips[0];
  const showNews=!!article&&newsWindow();
  const signature=showNews?'news:'+article.url:clip?'video:'+clip.youtubeId:c.key==='warner'?'warner:official-uploads':article?'news:'+article.url:'empty';
  if(playing[c.key]===signature)continue;
  if(activeChannel===c.key)setTvAudio(null);
  playing[c.key]=signature;p.screen.replaceChildren();p.sound.hidden=true;p.sound.onclick=null;
  const chosen=showNews?article:(clip||article);p.link.hidden=!chosen;
  if(chosen){p.link.href=chosen.url;p.meta.textContent=(chosen.source||c.name)+' · '+(chosen.published?new Date(chosen.published).toLocaleDateString():'');}
  else p.meta.textContent='A aguardar vídeos oficiais e notícias verificadas';
  if(showNews){p.screen.append(node('div','b6l-tv-symbol','◉'),node('p','',article.title));p.meta.textContent='Notícias · '+(article.source||c.name)+' · regressa aos vídeos em breve';}
  else if(clip){
   const frame=node('iframe');frame.title='Vídeo oficial '+c.name;frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   const playlist=clips.map(x=>x.youtubeId).slice(1,15).join(',');
   const base='https://www.youtube-nocookie.com/embed/'+clip.youtubeId+'?autoplay=1&mute=1&playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin)+'&loop=1&playlist='+encodeURIComponent(playlist||clip.youtubeId);
   frame.src=base;p.screen.append(frame);p.sound.hidden=false;
   p.sound.textContent='Ativar som';
   p.sound.onclick=()=>setTvAudio(activeChannel===c.key?null:c.key);
  }else if(c.key==='warner'){
   // Fallback to the official Warner Bros. uploads playlist until API validation populates clips.
   const frame=node('iframe');frame.title='Warner Bros. — vídeos oficiais';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.src='https://www.youtube-nocookie.com/embed/videoseries?list=UUjmJDM5pRKbUlVIzDYYWb6g&autoplay=1&mute=1&playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin);
   p.screen.append(frame);p.sound.hidden=false;p.sound.textContent='Ativar som';p.sound.onclick=()=>setTvAudio(activeChannel===c.key?null:c.key);
   p.meta.textContent='Canal oficial Warner Bros. · vídeos recentes';p.link.hidden=false;p.link.href='https://www.youtube.com/channel/UCjmJDM5pRKbUlVIzDYYWb6g';
  }else if(article){p.screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','',article.title))}
  else p.screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','','A aguardar vídeos oficiais disponíveis para incorporação.'));
 }
}
async function refresh(){
 try{
  const [news,video]=await Promise.all([
   fetch('/assets/music-news.json',{cache:'no-store'}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),
   fetch('/assets/studio-videos.json',{cache:'no-store'}).then(r=>r.ok?r.json():{channels:{}}).catch(()=>({channels:{}}))
  ]);
  latestItems=news.items||[];latestVideos=video;draw(latestItems,latestVideos);
 }catch(e){}
}
refresh();updateDock();setInterval(refresh,300000);
setInterval(()=>draw(latestItems,latestVideos),10000);
})();

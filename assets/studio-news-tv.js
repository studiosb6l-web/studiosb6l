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
const channelLabel=node('div','b6l-tv-channel-label','CANAL DE TV · STUDIOS B6L');channelLabel.setAttribute('aria-label','Canal de TV STUDIOS B6L');root.append(channelLabel);
const translations={
pt:['CANAL DE TV · STUDIOS B6L','Ocultar','Mostrar','Ativar som','Silenciar','Vídeos oficiais','Ocultar janelas','Mostrar notícias Disney & Warner'],
en:['STUDIOS B6L · TV CHANNEL','Hide','Show','Enable sound','Mute','Official videos','Hide screens','Show Disney & Warner'],
es:['CANAL DE TV · STUDIOS B6L','Ocultar','Mostrar','Activar sonido','Silenciar','Vídeos oficiales','Ocultar pantallas','Mostrar Disney y Warner'],
fr:['CHAÎNE TV · STUDIOS B6L','Masquer','Afficher','Activer le son','Couper le son','Vidéos officielles','Masquer les écrans','Afficher Disney et Warner'],
de:['STUDIOS B6L · TV-KANAL','Ausblenden','Anzeigen','Ton einschalten','Stummschalten','Offizielle Videos','Bildschirme ausblenden','Disney & Warner anzeigen'],
ja:['STUDIOS B6L · TVチャンネル','非表示','表示','音声をオン','ミュート','公式動画','画面を隠す','DisneyとWarnerを表示'],
zh:['STUDIOS B6L · 电视频道','隐藏','显示','开启声音','静音','官方视频','隐藏屏幕','显示迪士尼和华纳'],
ar:['قناة تلفزيون · STUDIOS B6L','إخفاء','إظهار','تشغيل الصوت','كتم الصوت','فيديوهات رسمية','إخفاء الشاشات','عرض ديزني ووارنر'],
ru:['ТЕЛЕКАНАЛ · STUDIOS B6L','Скрыть','Показать','Включить звук','Без звука','Официальные видео','Скрыть экраны','Показать Disney и Warner'],
uk:['ТЕЛЕКАНАЛ · STUDIOS B6L','Сховати','Показати','Увімкнути звук','Без звуку','Офіційні відео','Сховати екрани','Показати Disney і Warner']};
function words(){const picker=document.getElementById('language');let lang=picker?.value||new URLSearchParams(location.search).get('lang')||document.documentElement.lang;try{lang=picker?.value||localStorage.getItem('b6l-language')||lang}catch(e){}return translations[String(lang).split('-')[0]]||translations.en}
const panels={};
for(const c of categories){
 const card=node('article','b6l-tv');const top=node('div','b6l-tv-top');top.append(node('span','',c.name));
 const toggle=node('button','','Ocultar');toggle.type='button';toggle.setAttribute('aria-label','Ocultar notícias '+c.name);top.append(toggle);
 const screen=node('div','b6l-tv-screen');screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','','A procurar notícias recentes…'));
 const meta=node('div','b6l-tv-meta','Atualização automática de notícias');
 const actions=node('div','b6l-tv-actions');const link=node('a','','Consultar notícia');link.hidden=true;link.target='_blank';link.rel='noopener noreferrer';
 const sound=node('button','','Ativar som');sound.type='button';sound.hidden=true;link.hidden=true;actions.append(sound);
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
 updateLanguage();window.dispatchEvent(new CustomEvent('b6l-tv-audio',{detail:{active:!!key,channel:key}}));
}

let latestItems=[],latestVideos={channels:{}},liveConfig={channels:{}};

function draw(items,videos){
 for(const c of categories){
  const p=panels[c.key];
  const clips=(videos.channels&&videos.channels[c.key]||[]).filter(x=>x.videoVerified===true&&/^[A-Za-z0-9_-]{11}$/.test(x.youtubeId||''));
  const article=items.find(x=>Array.isArray(x.categories)&&x.categories.includes(c.key)&&x.title&&x.url);
  const live=liveConfig.channels?.[c.key];const liveId=live?.enabled===true&&live?.verified===true&&/^[A-Za-z0-9_-]{11}$/.test(live.youtubeId||'')&&(!live.expiresAt||Date.parse(live.expiresAt)>Date.now())?live.youtubeId:null;
  const clip=clips[0];
  const showNews=false; // Video channels must never be interrupted by text news.
  const signature=liveId?'live:'+liveId:(clip?'video:'+clip.youtubeId:c.key+':official-uploads');
  if(playing[c.key]===signature)continue;
  if(activeChannel===c.key)setTvAudio(null);
  playing[c.key]=signature;p.screen.replaceChildren();p.sound.hidden=true;p.sound.onclick=null;
  const chosen=clip||null;p.link.hidden=true;
  if(chosen){p.link.href=chosen.url;p.meta.textContent=(chosen.source||c.name)+' · '+(chosen.published?new Date(chosen.published).toLocaleDateString():'');}
  else p.meta.textContent='A aguardar vídeos oficiais e notícias verificadas';
  if(liveId){
   const frame=node('iframe');frame.title='Emissão oficial em direto · '+c.name;frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.src='https://www.youtube-nocookie.com/embed/'+liveId+'?autoplay=1&mute=1&playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin);
   p.screen.append(frame);p.sound.hidden=false;p.sound.textContent='Ativar som';p.sound.onclick=()=>setTvAudio(activeChannel===c.key?null:c.key);p.meta.textContent='Emissão oficial em direto · '+c.name;
  }else if(clip){
   const frame=node('iframe');frame.title='Vídeo oficial '+c.name;frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   const playlist=clips.map(x=>x.youtubeId).slice(1,15).join(',');
   const base='https://www.youtube-nocookie.com/embed/'+clip.youtubeId+'?autoplay=1&mute=1&playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin)+'&loop=1&playlist='+encodeURIComponent(playlist||clip.youtubeId);
   frame.src=base;p.screen.append(frame);p.sound.hidden=false;
   p.sound.textContent='Ativar som';
   p.sound.onclick=()=>setTvAudio(activeChannel===c.key?null:c.key);
  }else if(c.key==='warner'||c.key==='disney'){
   // Fallback to the official Warner Bros. uploads playlist until API validation populates clips.
   const frame=node('iframe');frame.title=c.name+' — vídeos oficiais';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.src='https://www.youtube-nocookie.com/embed/videoseries?list='+(c.key==='warner'?'UUjmJDM5pRKbUlVIzDYYWb6g':'UU_5niPa-d35gg88HaS7RrIw')+'&autoplay=1&mute=1&playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin);
   p.screen.append(frame);p.sound.hidden=false;p.sound.textContent='Ativar som';p.sound.onclick=()=>setTvAudio(activeChannel===c.key?null:c.key);
   p.meta.textContent='Canal oficial '+c.name+' · vídeos recentes';p.link.hidden=true;p.link.href=c.key==='warner'?'https://www.youtube.com/channel/UCjmJDM5pRKbUlVIzDYYWb6g':'https://www.youtube.com/@Disney';
  }else if(article){p.screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','',article.title))}
  else p.screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','','A aguardar vídeos oficiais disponíveis para incorporação.'));
 }
}
async function refresh(){
 try{
  const [news,video,live]=await Promise.all([
   fetch('/assets/music-news.json',{cache:'no-store'}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),
   fetch('/assets/studio-videos.json',{cache:'no-store'}).then(r=>r.ok?r.json():{channels:{}}).catch(()=>({channels:{}})),
   fetch('/assets/studio-live.json',{cache:'no-store'}).then(r=>r.ok?r.json():{channels:{}}).catch(()=>({channels:{}}))
  ]);
  latestItems=news.items||[];latestVideos=video;liveConfig=live;draw(latestItems,latestVideos);updateLanguage();
 }catch(e){}
}
function updateLanguage(){
 const t=words();channelLabel.textContent=t[0];
 root.querySelector('[data-hide-all]').textContent=t[6];restore.textContent=t[7];
 for(const c of categories){const p=panels[c.key];const top=p.card.querySelector('.b6l-tv-top button');if(top){top.textContent=t[1];top.setAttribute('aria-label',t[1]+' '+c.name)}
 const restoreButton=root.querySelector('[data-restore-'+c.key+']');if(restoreButton)restoreButton.textContent=t[2]+' '+c.name;
 p.sound.textContent=activeChannel===c.key?t[4]:t[3];
 if(p.screen.querySelector('iframe'))p.meta.textContent=t[5]+' · '+c.name;
 }
}
document.getElementById('language')?.addEventListener('change',updateLanguage);
window.addEventListener('pageshow',updateLanguage);
refresh();updateDock();updateLanguage();setInterval(refresh,300000);
setInterval(()=>draw(latestItems,latestVideos),10000);
})();

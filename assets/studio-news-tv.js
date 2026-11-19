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
const panels={};
for(const c of categories){
 const card=node('article','b6l-tv');const top=node('div','b6l-tv-top');top.append(node('span','',c.name));
 const toggle=node('button','','Ocultar');toggle.type='button';toggle.setAttribute('aria-label','Ocultar notícias '+c.name);top.append(toggle);
 const screen=node('div','b6l-tv-screen');screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','','A procurar notícias recentes…'));
 const meta=node('div','b6l-tv-meta','Atualização automática de notícias');
 const actions=node('div','b6l-tv-actions');const link=node('a','','Consultar notícia');link.hidden=true;link.target='_blank';link.rel='noopener noreferrer';
 const sound=node('button','','Ativar som');sound.type='button';sound.hidden=true;actions.append(link,sound);
 card.append(top,screen,meta,actions);grid.append(card);panels[c.key]={card,screen,meta,link,sound};
 toggle.onclick=()=>{card.hidden=true;const b=root.querySelector('[data-restore-'+c.key+']');if(b)b.hidden=false};
 const button=node('button','', 'Mostrar '+c.name);button.type='button';button.hidden=true;button.setAttribute('data-restore-'+c.key,'');button.onclick=()=>{card.hidden=false;button.hidden=true};root.querySelector('.b6l-tv-head').append(button);
}
const playing={};
function draw(items,videos){
 for(const c of categories){
  const p=panels[c.key];
  const clips=(videos.channels&&videos.channels[c.key]||[]).filter(x=>x.videoVerified===true&&/^[A-Za-z0-9_-]{11}$/.test(x.youtubeId||''));
  const article=items.find(x=>Array.isArray(x.categories)&&x.categories.includes(c.key)&&x.title&&x.url);
  const clip=clips[0];
  const signature=clip?'video:'+clip.youtubeId:article?'news:'+article.url:'empty';
  if(playing[c.key]===signature)continue;
  playing[c.key]=signature;p.screen.replaceChildren();p.sound.hidden=true;p.sound.onclick=null;
  const chosen=clip||article;p.link.hidden=!chosen;
  if(chosen){p.link.href=chosen.url;p.meta.textContent=(chosen.source||c.name)+' · '+(chosen.published?new Date(chosen.published).toLocaleDateString():'');}
  else p.meta.textContent='A aguardar vídeos oficiais e notícias verificadas';
  if(clip){
   const frame=node('iframe');frame.title='Vídeo oficial '+c.name;frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   const playlist=clips.map(x=>x.youtubeId).slice(1,15).join(',');
   const base='https://www.youtube-nocookie.com/embed/'+clip.youtubeId+'?autoplay=1&mute=1&playsinline=1&loop=1&playlist='+encodeURIComponent(playlist||clip.youtubeId);
   frame.src=base;p.screen.append(frame);p.sound.hidden=false;
   p.sound.onclick=()=>{frame.src=base.replace('mute=1','mute=0');p.sound.hidden=true};
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
  draw(news.items||[],video);
 }catch(e){}
}
refresh();setInterval(refresh,300000);
})();

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
function draw(items){
 for(const c of categories){
  const p=panels[c.key];const item=items.find(x=>Array.isArray(x.categories)&&x.categories.includes(c.key)&&x.title&&x.url);
  p.screen.replaceChildren();p.sound.hidden=true;p.sound.onclick=null;p.link.hidden=!item;
  if(!item){p.screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','','Sem notícias recentes verificadas.'));p.meta.textContent='A aguardar atualização das fontes';continue}
  p.link.href=item.url;p.meta.textContent=(item.source||'Fonte pública')+' · '+new Date(item.published).toLocaleDateString();
  if(item.videoVerified===true&&/^[\w-]{11}$/.test(item.youtubeId||'')){
   const frame=node('iframe');frame.title='Notícia '+c.name;frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;
   const url='https://www.youtube-nocookie.com/embed/'+item.youtubeId+'?autoplay=1&mute=1&playsinline=1';
   frame.src=url;p.screen.append(frame);p.sound.hidden=false;
   p.sound.onclick=()=>{frame.src='https://www.youtube-nocookie.com/embed/'+item.youtubeId+'?autoplay=1&mute=0&playsinline=1';p.sound.hidden=true};
  }else{p.screen.append(node('div','b6l-tv-symbol',c.symbol),node('p','',item.title))}
 }
}
async function refresh(){try{const r=await fetch('/assets/music-news.json',{cache:'no-store'});if(r.ok){const data=await r.json();draw(data.items||[])}}catch(e){}}
refresh();setInterval(refresh,300000);
})();
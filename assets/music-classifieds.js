(()=>{'use strict';
const translations={
pt:['CLASSIFICADOS MUSICAIS','Ofertas e procuras da comunidade musical','Ver anúncio','Ver todos os classificados','Ainda não existem anúncios aprovados. Publica uma oportunidade para análise.','Oferta e procura'],
es:['ANUNCIOS CLASIFICADOS MUSICALES','Ofertas y búsquedas de la comunidad musical','Ver anuncio','Ver todos los anuncios','Todavía no hay anuncios aprobados. Publica una oportunidad para revisión.','Ofertas y demandas'],
en:['MUSIC CLASSIFIEDS','Jobs and opportunities across the music community','View listing','Explore all classifieds','No approved listings yet. Submit an opportunity for review.','Opportunities'],
fr:['PETITES ANNONCES MUSICALES','Offres et recherches dans la communauté musicale','Voir l’annonce','Toutes les annonces','Aucune annonce approuvée pour le moment.','Opportunités'],
de:['MUSIK-KLEINANZEIGEN','Angebote und Gesuche aus der Musikwelt','Anzeige ansehen','Alle Anzeigen','Noch keine freigegebenen Anzeigen vorhanden.','Angebote']};
const lang=(document.documentElement.lang||'en').slice(0,2);const t=translations[lang]||translations.en;
const style=document.createElement('style');style.textContent=`
#b6l-classifieds{max-width:1120px;margin:34px auto;padding:clamp(17px,3vw,30px);border:1px solid #bc9559;border-radius:18px;background:linear-gradient(135deg,#14283a,#0b1727 75%);box-shadow:0 12px 34px #0005;color:#f7eddb;position:relative;isolation:isolate}
#b6l-classifieds .b6l-cl-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
#b6l-classifieds h2{font:600 clamp(18px,2.6vw,25px)/1.25 Georgia,serif;color:#e8c78b;margin:0}
#b6l-classifieds p{margin:7px 0 0;color:#cbd4df}
#b6l-classifieds .b6l-cl-item{margin-top:18px;min-height:132px;padding:18px;border-radius:12px;background:#20374a;border:1px solid #b99b6877;transition:opacity .45s ease,transform .45s ease}
#b6l-classifieds .b6l-cl-item.fade{opacity:0;transform:translateY(7px)}
#b6l-classifieds .b6l-cl-kind{color:#e8c78b;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
#b6l-classifieds h3{font-size:clamp(17px,2vw,22px);margin:8px 0;color:#fff}
#b6l-classifieds .b6l-cl-actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:15px}
#b6l-classifieds a{color:#f3d394;text-decoration:underline;text-underline-offset:3px}
@media(max-width:600px){#b6l-classifieds{margin:20px 12px}#b6l-classifieds .b6l-cl-item{min-height:145px}}
@media(prefers-reduced-motion:reduce){#b6l-classifieds .b6l-cl-item{transition:none}}
`;document.head.append(style);
const section=document.createElement('section');section.id='b6l-classifieds';section.setAttribute('aria-label',t[0]);section.innerHTML='<div class="b6l-cl-head"><div><h2></h2><p></p></div><span aria-hidden="true">✦</span></div><div class="b6l-cl-item"><div class="b6l-cl-kind"></div><h3></h3><p class="b6l-cl-detail"></p><div class="b6l-cl-actions"><a class="b6l-cl-view" href="/oportunidades/"></a></div></div><div class="b6l-cl-actions"><a href="/oportunidades/"></a></div>';
section.querySelector('h2').textContent=t[0];section.querySelector('.b6l-cl-head p').textContent=t[1];section.querySelector('.b6l-cl-actions:last-child a').textContent=t[3];
const anchor=document.querySelector('#newsletter-entry')||document.querySelector('main');if(anchor&&anchor.parentNode){anchor.parentNode.insertBefore(section,anchor)}else{document.body.append(section)}
const card=section.querySelector('.b6l-cl-item');let items=[],position=0;
function render(o){card.querySelector('.b6l-cl-kind').textContent=o.category||o.type||t[5];card.querySelector('h3').textContent=o.title||'';card.querySelector('.b6l-cl-detail').textContent=o.description||'';const link=card.querySelector('.b6l-cl-view');link.textContent=t[2];link.href=o.url||'/oportunidades/';link.hidden=!o.url}
function valid(o){if(!o||o.approved!==true||!o.title||!o.description)return false;if(o.expiresAt&&Date.parse(o.expiresAt)<Date.now())return false;if(o.url){try{const u=new URL(o.url,location.origin);if(u.origin!==location.origin||!u.pathname.startsWith('/oportunidades/'))return false}catch{return false}}return true}
fetch('/assets/approved-marketplace.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('fetch');return r.json()}).then(d=>{items=(Array.isArray(d.opportunities)?d.opportunities:[]).filter(valid);if(!items.length){render({title:t[4],description:'',category:t[5]});return}render(items[0]);if(items.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches){setInterval(()=>{if(document.hidden)return;card.classList.add('fade');setTimeout(()=>{position=(position+1)%items.length;render(items[position]);card.classList.remove('fade')},450)},7000)}}).catch(()=>render({title:t[4],description:'',category:t[5]}));
})();
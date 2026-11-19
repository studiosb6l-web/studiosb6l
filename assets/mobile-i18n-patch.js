/* Translation patch for late-loaded homepage modules and video controls. */
(()=>{'use strict';
const dictionary={
'Distribuidores Musicais Internacionais':{en:'International Music Distributors',fr:'Distributeurs de musique internationaux',es:'Distribuidores musicales internacionales',de:'Internationale Musikvertriebe',pt:'Distribuidores Musicais Internacionais',ja:'国際音楽ディストリビューター',zh:'国际音乐发行商',ar:'موزعو الموسيقى الدوليون',ru:'Международные музыкальные дистрибьюторы',uk:'Міжнародні музичні дистриб’ютори'},
'Empresas, editoras e distribuição musical':{en:'Companies, labels and music distribution',fr:'Entreprises, labels et distribution musicale',es:'Empresas, sellos y distribución musical',de:'Unternehmen, Labels und Musikvertrieb'},
'Descubra Artistas de Todo o Mundo':{en:'Discover Artists From Around the World',fr:'Découvrez des artistes du monde entier',es:'Descubre artistas de todo el mundo',de:'Entdecke Künstler aus aller Welt'},
'Explore o diretório internacional de artistas na nossa plataforma':{en:'Explore our international artist directory',fr:'Explorez notre répertoire international d’artistes',es:'Explora nuestro directorio internacional de artistas',de:'Entdecke unser internationales Künstlerverzeichnis'},
'EXPLORAR ARTISTAS ›':{en:'EXPLORE ARTISTS ›',fr:'DÉCOUVRIR LES ARTISTES ›',es:'EXPLORAR ARTISTAS ›',de:'KÜNSTLER ENTDECKEN ›'},
'Artistas em destaque':{en:'Featured Artists',fr:'Artistes à la une',es:'Artistas destacados',de:'Vorgestellte Künstler'},
'Novas vozes. Novas oportunidades.':{en:'New voices. New opportunities.',fr:'De nouvelles voix. De nouvelles opportunités.',es:'Nuevas voces. Nuevas oportunidades.',de:'Neue Stimmen. Neue Chancen.'},
'Ainda não existem inscrições aprovadas para esta montra.':{en:'No artist registrations have been approved for this showcase yet.',fr:'Aucune inscription d’artiste n’a encore été approuvée pour cette vitrine.',es:'Todavía no hay inscripciones de artistas aprobadas para este escaparate.',de:'Für dieses Schaufenster wurden noch keine Künstlerregistrierungen genehmigt.'},
'Inscrever artista':{en:'Register as an artist',fr:'Inscrire un artiste',es:'Registrar artista',de:'Als Künstler registrieren'},
'Explorar oportunidades':{en:'Explore opportunities',fr:'Explorer les opportunités',es:'Explorar oportunidades',de:'Chancen entdecken'},
'Oportunidades criativas':{en:'Creative opportunities',fr:'Opportunités créatives',es:'Oportunidades creativas',de:'Kreative Möglichkeiten'},
'Canais de vídeo · Disney & Warner':{en:'Video channels · Disney & Warner',fr:'Chaînes vidéo · Disney et Warner',es:'Canales de vídeo · Disney y Warner',de:'Videokanäle · Disney & Warner'},
'◉ Canais de vídeo · Disney & Warner':{en:'◉ Video channels · Disney & Warner',fr:'◉ Chaînes vidéo · Disney et Warner',es:'◉ Canales de vídeo · Disney y Warner',de:'◉ Videokanäle · Disney & Warner'},
'INSTALAR APP':{en:'INSTALL APP',fr:'INSTALLER L’APP',es:'INSTALAR APP',de:'APP INSTALLIEREN'},
'EXPLORAR ›':{en:'EXPLORE ›',fr:'EXPLORER ›',es:'EXPLORAR ›',de:'ENTDECKEN ›'}
};
const originals=new WeakMap();
for(const key of Object.keys(dictionary)){const upper=key.toUpperCase();if(!dictionary[upper])dictionary[upper]=Object.fromEntries(Object.entries(dictionary[key]).map(([lang,value])=>[lang,value.toUpperCase()]));}
let pending=false;
function current(){let l=document.getElementById('language')?.value||new URLSearchParams(location.search).get('lang');try{l=l||localStorage.getItem('b6l-language')}catch(e){}return (l||document.documentElement.lang||'en').split('-')[0]}
function apply(){pending=false;const lang=current();document.documentElement.lang=lang;const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,option,iframe,[contenteditable]'))continue;const value=node.nodeValue,trim=value.trim();let original=originals.get(node)||trim;if(!dictionary[original]){if(dictionary[trim]){original=trim;originals.set(node,trim)}else continue}const translated=dictionary[original][lang]||dictionary[original].en||original;const next=value.replace(trim,translated);if(value!==next)node.nodeValue=next;}}
function schedule(){if(!pending){pending=true;requestAnimationFrame(apply)}}
document.addEventListener('DOMContentLoaded',()=>{schedule();new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('change',e=>{if(e.target?.id==='language'||e.target?.id==='b6l-directory-lang')schedule()},true)});
})();
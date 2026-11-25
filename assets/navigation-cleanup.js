(() => {
  'use strict';
  const root = document.getElementById('b6l-find');
  if (!root) return;
  const copy = {
    pt:['A tua plataforma musical','O que procuras?','Artistas e bandas','Descobre perfis e música','Concertos e bilhetes','Consulta a agenda','Classificados musicais','Músicos e oportunidades','Educação e talentos','Escolas e formação','Procurar um serviço','Artistas, concertos, escolas…','Pesquisar','Promotores','Empresas','Mixagem e masterização','Distribuidores','Mais','Instalar app','Contacto e colaborações','Ajuda e feedback','Sem correspondências. Escolhe uma das áreas acima.'],
    es:['Tu plataforma musical','¿Qué buscas?','Artistas y bandas','Descubre perfiles y música','Conciertos y entradas','Consulta la agenda','Clasificados musicales','Músicos y oportunidades','Educación y talentos','Escuelas y formación','Buscar un servicio','Artistas, conciertos, escuelas…','Buscar','Promotores','Empresas','Mezcla y masterización','Distribuidores','Más','Instalar app','Contacto y colaboraciones','Ayuda y comentarios','Sin resultados. Elige una de las áreas de arriba.'],
    en:['Your music platform','What are you looking for?','Artists & bands','Discover profiles and music','Concerts & tickets','Explore the calendar','Music classifieds','Musicians and opportunities','Education & talent','Schools and training','Find a service','Artists, concerts, schools…','Search','Promoters','Businesses','Mixing & mastering','Distributors','More','Install app','Contact & collaborations','Help & feedback','No matches. Choose one of the areas above.'],
    fr:['Votre plateforme musicale','Que cherchez-vous ?','Artistes et groupes','Profils et musique','Concerts et billets','Consulter l’agenda','Petites annonces','Musiciens et opportunités','Éducation et talents','Écoles et formation','Trouver un service','Artistes, concerts, écoles…','Rechercher','Organisateurs','Entreprises','Mixage et mastering','Distributeurs','Plus','Installer l’app','Contact et collaborations','Aide et commentaires','Aucun résultat. Choisissez une rubrique ci-dessus.'],
    de:['Deine Musikplattform','Was suchst du?','Künstler & Bands','Profile und Musik entdecken','Konzerte & Tickets','Termine entdecken','Musik-Kleinanzeigen','Musiker und Möglichkeiten','Bildung & Talente','Schulen und Ausbildung','Angebot suchen','Künstler, Konzerte, Schulen…','Suchen','Veranstalter','Unternehmen','Mixing & Mastering','Vertriebe','Mehr','App installieren','Kontakt & Kooperationen','Hilfe & Feedback','Keine Treffer. Wähle einen Bereich oben.'],
    ja:['あなたの音楽プラットフォーム','何をお探しですか？','アーティストとバンド','プロフィールと音楽','公演とチケット','公演情報を見る','音楽の募集情報','音楽家とチャンス','教育と才能','学校とトレーニング','サービスを探す','アーティスト、公演、学校…','検索','主催者','企業','ミキシングとマスタリング','配信会社','その他','アプリをインストール','お問い合わせと協業','ヘルプとご意見','上のカテゴリーからお選びください。'],
    zh:['你的音乐平台','你在寻找什么？','艺人与乐队','探索资料和音乐','演出和门票','查看演出日程','音乐分类信息','音乐人与机会','教育与人才','学校与培训','查找服务','艺人、演出、学校…','搜索','主办方','企业','混音与母带处理','发行商','更多','安装应用','联系与合作','帮助与反馈','没有匹配结果。请选择上方的栏目。'],
    ar:['منصتك الموسيقية','عمّ تبحث؟','الفنانون والفرق','اكتشف الملفات والموسيقى','الحفلات والتذاكر','استكشف المواعيد','إعلانات موسيقية','موسيقيون وفرص','التعليم والمواهب','المدارس والتدريب','ابحث عن خدمة','الفنانون والحفلات والمدارس…','بحث','المنظمون','الشركات','المزج والماسترينغ','الموزعون','المزيد','تثبيت التطبيق','التواصل والتعاون','المساعدة والملاحظات','لا توجد نتائج. اختر أحد الأقسام أعلاه.'],
    ru:['Твоя музыкальная платформа','Что вы ищете?','Артисты и группы','Профили и музыка','Концерты и билеты','Посмотреть афишу','Музыкальные объявления','Музыканты и возможности','Образование и таланты','Школы и обучение','Найти сервис','Артисты, концерты, школы…','Поиск','Организаторы','Компании','Сведение и мастеринг','Дистрибьюторы','Ещё','Установить приложение','Контакты и сотрудничество','Помощь и отзывы','Нет совпадений. Выберите раздел выше.'],
    uk:['Твоя музична платформа','Що ви шукаєте?','Артисти та гурти','Профілі та музика','Концерти та квитки','Переглянути афішу','Музичні оголошення','Музиканти та можливості','Освіта та таланти','Школи та навчання','Знайти сервіс','Артисти, концерти, школи…','Пошук','Організатори','Компанії','Зведення та мастеринг','Дистриб’ютори','Ще','Встановити застосунок','Контакти та співпраця','Допомога та відгуки','Немає збігів. Виберіть розділ вище.']
  };
  function language(){return (document.getElementById('language')?.value || document.documentElement.lang || 'en').slice(0,2);}
  const words = () => copy[language()] || copy.en;
  const href = path => {const url=new URL(path,location.origin);url.searchParams.set('lang',language());return url.pathname+url.search+url.hash;};
  const primary=['/concertos/artistas/','/concertos/','/music-connect/','/educacao/'];
  const secondary=['/promotores/','/empresas/','/audio-profissionais.html','/distribuidores/'];
  root.innerHTML='<div class="b6l-find-inner"><div class="eyebrow" data-hub="0"></div><h2 data-hub="1"></h2><nav class="b6l-service-grid" aria-label="Services"></nav><nav class="b6l-service-secondary" aria-label="Professionals"></nav><form class="b6l-service-search" role="search"><label for="b6l-service-query" data-hub="10"></label><div><input id="b6l-service-query" type="search" maxlength="100"><button type="submit" data-hub="12"></button></div><div class="b6l-service-results" role="status" aria-live="polite" hidden></div></form></div>';
  const grid=root.querySelector('.b6l-service-grid'), secondaryNav=root.querySelector('.b6l-service-secondary');
  primary.forEach((path,i)=>{const a=document.createElement('a');a.dataset.route=path;a.innerHTML=`<strong data-hub="${2+i*2}"></strong><span data-hub="${3+i*2}"></span>`;grid.append(a);});
  secondary.forEach((path,i)=>{const a=document.createElement('a');a.dataset.route=path;a.dataset.hub=String(13+i);secondaryNav.append(a);});
  // Put optional tools in one small menu instead of separate floating banners.
  const tools=document.createElement('nav');tools.id='b6l-quick-tools';tools.setAttribute('aria-label','STUDIOSB6L');
  const restore=document.getElementById('b6l-tv-restore');if(restore)tools.append(restore);
  const more=document.createElement('details');more.id='b6l-more-tools';
  more.innerHTML='<summary data-tool="17">More</summary><div class="b6l-tools-menu"></div>';
  tools.append(more);document.body.append(tools);const menu=more.querySelector('.b6l-tools-menu');
  const connect=document.querySelector('.b6l-connect-link');
  if(connect){connect.dataset.tool='19';connect.dataset.route='/connect.html';menu.append(connect);}
  const install=document.querySelector('#b6l-install-app');
  const instructions=[...document.querySelectorAll('a[href="/instalar.html"][style]')].find(a=>a.style.position==='fixed');
  if(instructions){instructions.dataset.tool='18';instructions.dataset.route='/instalar.html';menu.append(instructions);}
  if(install){install.dataset.tool='18';menu.append(install);new MutationObserver(()=>{if(instructions)instructions.hidden=!install.hidden;}).observe(install,{attributes:true,attributeFilter:['hidden']});if(instructions)instructions.hidden=!install.hidden;}
  const feedback=[...document.querySelectorAll('a[href="/beta.html"]')].find(a=>a.style.position==='fixed');
  if(feedback){feedback.dataset.tool='20';feedback.dataset.route='/beta.html';menu.append(feedback);}
  more.addEventListener('click',e=>{if(e.target.closest('a'))more.open=false;});
  document.addEventListener('click',e=>{if(!tools.contains(e.target))more.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&more.open){more.open=false;more.querySelector('summary').focus();}});
  const form=root.querySelector('form'),input=root.querySelector('input'),results=root.querySelector('.b6l-service-results');
  const aliases=['artist artista artistas banda bandas musician musicien künstler','concert concerto concertos concierto conciertos bilhete bilhetes tickets agenda','classificados classificados musicais musico músicos oportunidades opportunities classifieds','educacao educação conservatorio conservatório escola escolas education school','promotor promotores promoter','empresa empresas business company cinema film tv','mixagem mistura masterizacao masterização mastering audio estúdio estudio sound engineer','distribuidor distribuidores distribution distributor'];
  function normalize(value){return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function search(){const query=normalize(input.value.trim());results.replaceChildren();results.hidden=!query;if(!query)return;const routes=[...primary,...secondary],labels=[2,4,6,8,13,14,15,16];routes.forEach((path,i)=>{if(normalize(aliases[i]+' '+Object.values(copy).map(t=>t[labels[i]]+' '+(i<4?t[labels[i]+1]:'')).join(' ')).includes(query)){const a=document.createElement('a');a.href=href(path);a.textContent=words()[labels[i]];results.append(a);}});if(!results.children.length)results.textContent=words()[21];}
  form.addEventListener('submit',e=>{e.preventDefault();search();});input.addEventListener('input',()=>{if(!input.value)search();});
  function render(){const t=words();root.setAttribute('aria-label',t[1]);grid.setAttribute('aria-label',t[0]);secondaryNav.setAttribute('aria-label',t[13]+' · '+t[14]);root.querySelectorAll('[data-hub]').forEach(el=>{el.textContent=t[Number(el.dataset.hub)];});input.placeholder=t[11];tools.querySelectorAll('[data-tool]').forEach(el=>{el.textContent=t[Number(el.dataset.tool)];if(el.matches('a'))el.setAttribute('aria-label',el.textContent);});document.querySelectorAll('[data-route]').forEach(el=>{el.href=href(el.dataset.route);});if(input.value)search();}
  render();document.getElementById('language')?.addEventListener('change',render);
})();

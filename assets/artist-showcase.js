(() => {
  'use strict';
  const root = document.getElementById('artist-window');
  if (!root) return;
  const copy = {
    pt: ['DESCOBRIR TALENTOS','Artistas à descoberta','Ver perfil','Perfil editorial do diretório','Artista da comunidade','Cidade de nascimento','Anterior','Seguinte','Pausar','Continuar','Fotografia','A preparar a montra de artistas.'],
    es: ['DESCUBRE TALENTOS','Artistas por descubrir','Ver perfil','Perfil editorial del directorio','Artista de la comunidad','Ciudad de nacimiento','Anterior','Siguiente','Pausar','Continuar','Fotografía','Preparando la selección de artistas.'],
    en: ['DISCOVER TALENT','Artists to discover','View profile','Editorial directory profile','Community artist','Birthplace','Previous','Next','Pause','Resume','Photo','Preparing the artist showcase.'],
    fr: ['DÉCOUVRIR DES TALENTS','Des artistes à découvrir','Voir le profil','Profil éditorial du répertoire','Artiste de la communauté','Ville de naissance','Précédent','Suivant','Pause','Reprendre','Photo','Préparation de la sélection.'],
    de: ['TALENTE ENTDECKEN','Künstler entdecken','Profil ansehen','Redaktionelles Verzeichnisprofil','Community-Künstler','Geburtsort','Zurück','Weiter','Pause','Fortsetzen','Foto','Die Künstlerauswahl wird vorbereitet.']
  };
  function language() {
    let lang = new URLSearchParams(location.search).get('lang');
    try { lang ||= localStorage.getItem('b6l-language'); } catch {}
    return (lang || document.documentElement.lang || 'en').slice(0,2);
  }
  let artists = [], index = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hovered = false, focused = false, generation = 0;
  const picture = root.querySelector('[data-picture]');
  const text = key => root.querySelector(`[data-${key}]`);
  const c = () => copy[language()] || copy.en;
  const local = value => typeof value === 'string' ? value : value?.[language()] || value?.en || value?.pt || '';
  function safeUrl(value, internalOnly = false) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value, location.origin);
      if (url.protocol !== 'https:' && url.origin !== location.origin) return '';
      if (internalOnly && url.origin !== location.origin) return '';
      return url.href;
    } catch { return ''; }
  }
  function eligible(a) { return a && a.name && safeUrl(a.photoUrl) && safeUrl(a.profileUrl, true); }
  function labels() {
    const t = c();
    text('label').textContent = t[0]; text('title').textContent = t[1];
    text('previous').ariaLabel = t[6]; text('next').ariaLabel = t[7];
    text('pause').textContent = paused ? t[9] : t[8];
    text('pause').setAttribute('aria-pressed', String(paused));
  }
  async function show(next = index, attempts = 0) {
    labels();
    if (!artists.length || attempts >= artists.length) {
      root.hidden = true; return;
    }
    index = (next + artists.length) % artists.length;
    const a = artists[index], token = ++generation;
    const img = new Image(); img.alt = a.name; img.decoding = 'async';
    const loaded = new Promise(resolve => { img.onload = () => resolve(true); img.onerror = () => resolve(false); });
    img.src = safeUrl(a.photoUrl);
    const ok = await Promise.race([loaded, new Promise(resolve => setTimeout(() => resolve(false), 8000))]);
    if (token !== generation) return;
    if (!ok) { await show(index + 1, attempts + 1); return; }
    picture.replaceChildren(img);
    text('name').textContent = a.name;
    text('location').textContent = [local(a.country), local(a.city)].filter(Boolean).join(' · ');
    text('location').hidden = !text('location').textContent;
    text('origin').textContent = !a.community && local(a.city) ? c()[5] : '';
    text('bio').textContent = local(a.highlight || a.bio || a.biography).slice(0, 260);
    text('kind').textContent = a.community ? c()[4] : c()[3];
    text('profile').href = safeUrl(a.profileUrl, true); text('profile').textContent = c()[2];
    text('credit').textContent = a.photoCredit ? `${c()[10]}: ${a.photoCredit} · ${a.photoLicense || ''}` : '';
    text('counter').textContent = `${index + 1} / ${artists.length}`;
    text('previous').disabled = text('next').disabled = artists.length < 2;
    root.hidden = false;
  }
  text('previous').addEventListener('click', () => show(index - 1));
  text('next').addEventListener('click', () => show(index + 1));
  text('pause').addEventListener('click', () => { paused = !paused; labels(); });
  root.addEventListener('mouseenter', () => { hovered = true; });
  root.addEventListener('mouseleave', () => { hovered = false; });
  root.addEventListener('focusin', () => { focused = true; });
  root.addEventListener('focusout', e => { focused = root.contains(e.relatedTarget); });
  document.getElementById('language')?.addEventListener('change', () => setTimeout(() => show(), 0));
  async function read(path) {
    try { const r = await fetch(path); return r.ok ? await r.json() : {}; } catch { return {}; }
  }
  Promise.all([read('/assets/approved-marketplace.json'), read('/assets/artist-showcase.json')]).then(([approved, editorial]) => {
    const community = (Array.isArray(approved.artists) ? approved.artists : [])
      .filter(a => a?.approved === true && eligible(a)).map(a => ({...a, community:true}));
    const registered = new Set(community.map(a => String(a.name).trim().toLocaleLowerCase()));
    const fallback = (Array.isArray(editorial.artists) ? editorial.artists : [])
      .filter(a => eligible(a) && !registered.has(String(a.name).trim().toLocaleLowerCase()));
    // Each published community profile replaces one editorial place; never limit community profiles.
    const day = Math.floor(Date.now() / 86400000);
    if (fallback.length) fallback.push(...fallback.splice(0, day % fallback.length));
    artists = [...community, ...fallback.slice(0, Math.max(0, 6 - community.length))];
    show(0);
    if (artists.length > 1) setInterval(() => {
      if (!paused && !hovered && !focused && !document.hidden) show(index + 1);
    }, 7000);
  });
})();

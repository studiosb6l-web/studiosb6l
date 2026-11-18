(() => {
  const container = document.getElementById('b6l-opening');
  if (!container) return;

  const playlist = 'https://soundcloud.com/banda6latinos/sets/banda-6-latinos-beethoven';
  const key = 'b6l-beethoven-player';
  const labels = {
    pt: ['Ouvir Beethoven', 'Pausar a música', 'Volume', 'Abrir no SoundCloud'],
    es: ['Escuchar Beethoven', 'Pausar la música', 'Volumen', 'Abrir en SoundCloud'],
    en: ['Play Beethoven', 'Pause music', 'Volume', 'Open in SoundCloud'],
    fr: ['Écouter Beethoven', 'Mettre en pause', 'Volume', 'Ouvrir sur SoundCloud'],
    de: ['Beethoven hören', 'Musik pausieren', 'Lautstärke', 'Auf SoundCloud öffnen'],
    ja: ['ベートーヴェンを聴く', '音楽を一時停止', '音量', 'SoundCloudで開く'],
    zh: ['播放贝多芬作品', '暂停音乐', '音量', '在 SoundCloud 打开'],
    ar: ['استمع إلى بيتهوفن', 'إيقاف الموسيقى مؤقتًا', 'مستوى الصوت', 'افتح على ساوند كلاود']
  };

  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(key)) || {}; } catch {}
  const fromSite = document.referrer.startsWith(location.origin + '/');
  let trackIndex = fromSite && Number.isInteger(saved.trackIndex) && saved.trackIndex >= 0 ? saved.trackIndex : 0;
  let position = fromSite && Number.isFinite(saved.position) && saved.position >= 0 ? saved.position : 0;
  let resume = position;
  let shouldPlay = !fromSite || saved.shouldPlay !== false;
  let ready = false;
  let playing = false;
  let triedGesture = false;
  let count = 0;
  let pendingAdvance = 0;
  let fallbackTimer = 0;
  let startupTimer = 0;
  let startupAttempts = 0;
  let advanced = false;

  const title = container.querySelector('.b6l-opening-title');
  const link = container.querySelector('a');
  const button = document.createElement('button');
  const controls = document.createElement('div');
  const volumeLabel = document.createElement('label');
  const volumeText = document.createElement('span');
  const volume = document.createElement('input');
  const frame = document.createElement('iframe');

  button.type = 'button';
  button.hidden = true;
  controls.className = 'b6l-opening-controls';
  volume.type = 'range';
  volume.min = '0';
  volume.max = '100';
  volume.value = Number.isFinite(saved.volume) ? String(saved.volume) : '22';
  volumeLabel.hidden = true;
  volumeLabel.append(volumeText, volume);
  controls.append(button, volumeLabel);
  container.prepend(controls);
  // Premium compact player: keep the original SoundCloud widget and playback logic.
  const premiumStyle = document.createElement('style');
  premiumStyle.textContent = `#b6l-opening.b6l-premium{position:relative;background:linear-gradient(125deg,#071426,#12243a 70%,#08101d);border:1px solid #c7a45d;border-radius:17px;box-shadow:0 8px 32px #0008,0 0 14px #c7a45d33;padding:14px;color:#f6ecd5;max-width:740px;width:100%;box-sizing:border-box}#b6l-opening.b6l-premium .b6l-opening-controls{display:flex;flex-wrap:wrap;align-items:center;gap:9px}#b6l-opening.b6l-premium .b6l-opening-title{display:block;margin:9px 0 6px;font-weight:600;color:#f2d8a3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#b6l-opening.b6l-premium .b6l-premium-head{display:flex;gap:12px;align-items:center}#b6l-opening.b6l-premium .b6l-premium-cover{width:62px;height:62px;border-radius:9px;object-fit:cover;border:1px solid #c7a45d;flex-shrink:0}#b6l-opening.b6l-premium .b6l-premium-brand{font:600 16px Georgia,serif;letter-spacing:2px;color:#e9c67e}#b6l-opening.b6l-premium .b6l-premium-sub{font-size:11px;letter-spacing:1.4px;color:#d4c6ac}#b6l-opening.b6l-premium .b6l-premium-extras{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:9px}#b6l-opening.b6l-premium .b6l-premium-extras button{border:1px solid #c7a45d;background:#111f30;color:#f5dfae;border-radius:8px;padding:7px 10px;cursor:pointer}#b6l-opening.b6l-premium .b6l-premium-progress{flex:1;min-width:100px;accent-color:#e8bf6b}#b6l-opening.b6l-premium .b6l-premium-time{font-size:11px;color:#ddd}#b6l-opening.b6l-premium .b6l-premium-list{margin-top:9px;max-height:190px;overflow:auto;border-top:1px solid #a7895144;padding-top:8px}#b6l-opening.b6l-premium .b6l-premium-list button{display:block;width:100%;text-align:left;background:transparent;border:0;color:#f0e3cc;padding:9px;cursor:pointer;border-radius:6px}#b6l-opening.b6l-premium .b6l-premium-list button:hover,#b6l-opening.b6l-premium .b6l-premium-list button[aria-current=true]{background:#a98a5033}#b6l-opening.b6l-premium .b6l-opening-controls button{border-radius:9px;background:#e4bf78;color:#142033;font-weight:700}#b6l-opening.b6l-premium .b6l-opening-controls input{accent-color:#e4bf78}@media(max-width:500px){#b6l-opening.b6l-premium{padding:10px;max-width:calc(100vw - 24px)}#b6l-opening.b6l-premium .b6l-premium-cover{width:46px;height:46px}#b6l-opening.b6l-premium .b6l-premium-brand{font-size:13px}#b6l-opening.b6l-premium .b6l-premium-extras button{padding:6px 8px}}`;
  document.head.append(premiumStyle);
  container.classList.add('b6l-premium');
  const head = document.createElement('div');
  head.className = 'b6l-premium-head';
  const cover = document.createElement('img');
  cover.className = 'b6l-premium-cover';
  cover.style.display = 'none';
  cover.alt = 'BANDA 6 LATINOS';
  const identity = document.createElement('div');
  identity.innerHTML = '<div class="b6l-premium-brand">STUDIOSB6L</div><div class="b6l-premium-sub">BANDA 6 LATINOS · BEETHOVEN</div>';
  head.append(cover, identity);
  container.prepend(head);
  const extras = document.createElement('div');
  extras.className = 'b6l-premium-extras';
  const prev = document.createElement('button'); prev.type='button'; prev.textContent='⏮'; prev.title='Previous track';
  const next = document.createElement('button'); next.type='button'; next.textContent='⏭'; next.title='Next track';
  const progress = document.createElement('input'); progress.type='range'; progress.min='0'; progress.max='1000'; progress.value='0'; progress.className='b6l-premium-progress'; progress.setAttribute('aria-label','Track progress');
  const time = document.createElement('span'); time.className='b6l-premium-time'; time.textContent='0:00';
  const listToggle = document.createElement('button'); listToggle.type='button'; listToggle.textContent='♫ Playlist ▾'; listToggle.setAttribute('aria-expanded','false');
  const list = document.createElement('div'); list.className='b6l-premium-list'; list.hidden=true;
  extras.append(prev,next,progress,time,listToggle);
  container.append(extras,list);
  const formatTime = ms => {const s=Math.floor(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  listToggle.addEventListener('click',()=>{list.hidden=!list.hidden;listToggle.setAttribute('aria-expanded',String(!list.hidden));listToggle.textContent=list.hidden?'♫ Playlist ▾':'♫ Playlist ▴'});

  frame.title = 'Beethoven · B6L — SoundCloud';
  frame.allow = 'autoplay; encrypted-media';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');

  const embed = new URL('https://w.soundcloud.com/player/');
  embed.search = new URLSearchParams({
    url: 'https://api.soundcloud.com/playlists/2298582144', start_track: String(trackIndex),
    auto_play: String(shouldPlay), color: '#d9b978',
    show_artwork: 'false', hide_related: 'true', show_comments: 'false',
    show_reposts: 'false', show_teaser: 'false', single_active: 'false'
  }).toString();
  link.href = playlist;
  frame.src = embed.href;
  container.append(frame);

  function render() {
    const language = document.documentElement.lang.toLowerCase().split('-')[0];
    const [play, pause, volumeName, open] = labels[language] || labels.en;
    button.textContent = playing ? 'Ⅱ ' + pause : '▶ ' + play;
    button.setAttribute('aria-pressed', String(playing));
    volumeText.textContent = volumeName;
    link.textContent = open;
  }

  function save() {
    try {
      sessionStorage.setItem(key, JSON.stringify({ trackIndex, position, shouldPlay, volume: Number(volume.value) }));
    } catch {}
  }

  function showEmbeddedPlayer() {
    container.classList.add('b6l-opening-expanded');
    frame.removeAttribute('aria-hidden');
    frame.removeAttribute('tabindex');
    link.hidden = false;
  }

  const anchor = container.parentElement;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      container.classList.toggle('b6l-opening-docked', !entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    }).observe(anchor);
  }

  const cart = document.getElementById('cart');
  if (cart) {
    const fitAboveCart = () => container.style.setProperty('--b6l-opening-cart-height', cart.offsetHeight + 'px');
    fitAboveCart();
    new ResizeObserver(fitAboveCart).observe(cart);
  }
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();

  if (!window.SC?.Widget) {
    showEmbeddedPlayer();
    return;
  }

  const widget = window.SC.Widget(frame);
  const events = window.SC.Widget.Events;
  button.hidden = false;
  link.hidden = true;
  fallbackTimer = setTimeout(() => {
    if (!ready) showEmbeddedPlayer();
  }, 8000);

  function play() {
    widget.setVolume(Number(volume.value));
    widget.play();
  }

  function retryStartup() {
    clearTimeout(startupTimer);
    if (!shouldPlay || advanced || startupAttempts >= 2) return;
    startupTimer = setTimeout(() => {
      if (!shouldPlay || advanced) return;
      startupAttempts += 1;
      play();
      retryStartup();
    }, startupAttempts === 0 ? 650 : 1600);
  }

  function pause() {
    clearTimeout(startupTimer);
    shouldPlay = false;
    playing = false;
    clearTimeout(pendingAdvance);
    pendingAdvance = 0;
    clearTimeout(fallbackTimer);
    if (ready) widget.pause();
    render();
    save();
  }

  widget.bind(events.READY, () => {
    if (ready) return;
    ready = true;
    clearTimeout(fallbackTimer);
    volumeLabel.hidden = false;
    widget.getSounds(sounds => {
      count = sounds?.length || 0;
      list.replaceChildren();
      (sounds || []).forEach((sound,i)=>{
        const item=document.createElement('button'); item.type='button';
        item.textContent=(i+1)+'. '+(sound.title||'B6L Track '+(i+1));
        item.addEventListener('click',()=>{widget.skip(i);play();list.hidden=true;listToggle.setAttribute('aria-expanded','false');listToggle.textContent='♫ Playlist ▾'});
        list.append(item);
      });
    });
    widget.setVolume(Number(volume.value));
    retryStartup();
  });

  widget.bind(events.PLAY, () => {
    clearTimeout(fallbackTimer);
    clearTimeout(pendingAdvance);
    pendingAdvance = 0;
    playing = true;
    shouldPlay = true;
    if (resume > 0) widget.seekTo(resume);
    resume = 0;
    widget.getCurrentSoundIndex(index => {
      if (Number.isInteger(index) && index >= 0 && index !== trackIndex) {
        trackIndex = index;
        position = 0;
      }
      save();
    });
    widget.getCurrentSound(sound => {
      if (sound?.title) title.textContent = sound.title + ' · Beethoven — B6L';
      if (sound?.artwork_url) { cover.src = sound.artwork_url.replace('-large','-t300x300'); cover.style.display='block'; }
      else cover.style.display='none';
    });
    render();
  });

  widget.bind(events.PLAY_PROGRESS, event => {
    if (!Number.isFinite(event.currentPosition)) return;
    position = event.currentPosition;
    if(Number.isFinite(event.relativePosition))progress.value=String(Math.round(event.relativePosition*1000));
    time.textContent=formatTime(position);
    if (!advanced && position > 0) {
      advanced = true;
      clearTimeout(startupTimer);
    }
  });

  widget.bind(events.PAUSE, () => {
    playing = false;
    render();
    save();
  });

  widget.bind(events.FINISH, () => {
    // The playlist advances on its own when possible. Resume it if that
    // transition stalls, and wrap from the last track to the first.
    const finished = trackIndex;
    playing = false;
    position = 0;
    clearTimeout(pendingAdvance);
    if (!shouldPlay) return;
    pendingAdvance = setTimeout(() => {
      widget.getCurrentSoundIndex(index => {
        if (playing || !shouldPlay) return;
        if (index === finished) {
          if (count === 1) widget.seekTo(0);
          else if (count > 1) widget.skip((finished + 1) % count);
          else widget.next();
        }
        play();
      });
    }, 500);
  });

  widget.bind(events.ERROR, () => {
    clearTimeout(startupTimer);
    clearTimeout(pendingAdvance);
    pendingAdvance = 0;
    playing = false;
    render();
    showEmbeddedPlayer();
  });

  button.addEventListener('click', () => {
    if (playing || pendingAdvance) {
      pause();
      return;
    }
    shouldPlay = true;
    triedGesture = true;
    if (ready) play();
    else showEmbeddedPlayer();
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (!playing) showEmbeddedPlayer();
    }, 1400);
  });

  prev.addEventListener('click',()=>{if(ready){widget.prev();play()}});
  next.addEventListener('click',()=>{if(ready){widget.next();play()}});
  progress.addEventListener('change',()=>{if(ready)widget.getCurrentSound(sound=>{const duration=sound?.duration||0;if(duration>0)widget.seekTo(duration*Number(progress.value)/1000)})});

  volume.addEventListener('input', () => {
    if (ready) widget.setVolume(Number(volume.value));
    save();
  });

  document.addEventListener('click', event => {
    const target = event.target;
    if (container.contains(target)) return;
    if (target.closest('#b6l-reel-open, [data-play], [data-play-url], .track-row button[aria-expanded]')) {
      pause();
      return;
    }
    if (event.isTrusted && shouldPlay && !playing && !triedGesture) {
      triedGesture = true;
      if (ready) play();
    }
  });

  document.addEventListener('play', event => {
    if (event.target instanceof HTMLMediaElement) pause();
  }, true);

  window.addEventListener('pagehide', save);
})();

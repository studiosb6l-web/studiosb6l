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

  // Keep the original minimal player, regardless of previously cached premium styles.
  const compactStyle = document.createElement('style');
  compactStyle.textContent = `#b6l-opening,#b6l-opening.b6l-premium{box-sizing:border-box!important;width:max-content!important;max-width:calc(100vw - 32px)!important;min-height:0!important;padding:8px 11px!important;border-radius:11px!important;display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:7px!important;background:#101e2e!important;border:1px solid #bda16b!important;box-shadow:0 3px 12px #0004!important}#b6l-opening .b6l-opening-controls{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important}#b6l-opening .b6l-opening-controls button{white-space:nowrap!important;font-size:12px!important;padding:6px 9px!important}#b6l-opening .b6l-opening-controls label{display:flex!important;align-items:center!important;gap:5px!important;font-size:11px!important}#b6l-opening .b6l-opening-controls input{width:64px!important;max-width:64px!important}#b6l-opening .b6l-opening-title,#b6l-opening .b6l-premium-head,#b6l-opening .b6l-premium-extras,#b6l-opening .b6l-premium-list{display:none!important}#b6l-opening iframe{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}#b6l-opening a[hidden]{display:none!important}@media(max-width:480px){#b6l-opening,#b6l-opening.b6l-premium{max-width:calc(100vw - 24px)!important;padding:7px!important}}`;
  document.head.append(compactStyle);
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
    widget.getSounds(sounds => { count = sounds?.length || 0; });
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
    });
    render();
  });

  widget.bind(events.PLAY_PROGRESS, event => {
    if (!Number.isFinite(event.currentPosition)) return;
    position = event.currentPosition;
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

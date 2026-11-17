(() => {
  const container = document.getElementById('b6l-opening');
  if (!container) return;

  const track = 'https://soundcloud.com/banda6latinos/the-seventh-apogee';
  const labels = {
    pt: ['Ouvir a obra de abertura', 'Pausar a música', 'Volume', 'Abrir no SoundCloud'],
    es: ['Escuchar la obra de apertura', 'Pausar la música', 'Volumen', 'Abrir en SoundCloud'],
    en: ['Play the opening piece', 'Pause music', 'Volume', 'Open in SoundCloud'],
    fr: ['Écouter le morceau d’ouverture', 'Mettre en pause', 'Volume', 'Ouvrir sur SoundCloud'],
    de: ['Eröffnungsstück anhören', 'Musik pausieren', 'Lautstärke', 'Auf SoundCloud öffnen'],
    ja: ['オープニング曲を聴く', '音楽を一時停止', '音量', 'SoundCloudで開く'],
    zh: ['播放开场曲', '暂停音乐', '音量', '在 SoundCloud 打开'],
    ar: ['استمع إلى المقطوعة الافتتاحية', 'إيقاف الموسيقى مؤقتًا', 'مستوى الصوت', 'افتح على ساوند كلاود']
  };
  const link = container.querySelector('a');
  const button = document.createElement('button');
  const controls = document.createElement('div');
  const volumeLabel = document.createElement('label');
  const volumeText = document.createElement('span');
  const volume = document.createElement('input');
  const frame = document.createElement('iframe');
  let widget;
  let ready = false;
  let playing = false;
  let hasPlayed = false;
  let autoStart = true;
  let fallbackTimer;

  button.type = 'button';
  button.hidden = true;
  controls.className = 'b6l-opening-controls';
  volume.type = 'range';
  volume.min = '0';
  volume.max = '100';
  volume.value = '22';
  volumeLabel.hidden = true;
  volumeLabel.append(volumeText, volume);
  controls.append(button, volumeLabel);
  container.prepend(controls);
  frame.title = 'The Seventh Apogee — BANDA 6 LATINOS · SoundCloud';
  frame.allow = 'autoplay; encrypted-media';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  container.append(frame);

  function render() {
    const [play, pause, volumeName, open] = labels[document.documentElement.lang] || labels.en;
    button.textContent = playing ? 'Ⅱ ' + pause : '▶ ' + play;
    button.setAttribute('aria-pressed', String(playing));
    volumeText.textContent = volumeName;
    link.textContent = open;
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
      container.classList.toggle('b6l-opening-docked', hasPlayed && !entry.isIntersecting &&
        entry.boundingClientRect.bottom < 0);
    }).observe(anchor);
  }

  document.getElementById('language')?.addEventListener('change', render);
  render();
  const embed = new URL('https://w.soundcloud.com/player/');
  embed.search = new URLSearchParams({
    url: track, auto_play: 'false', color: '#d9b978', show_artwork: 'false',
    hide_related: 'true', show_comments: 'false', show_reposts: 'false'
  }).toString();
  frame.src = embed.href;

  if (!window.SC?.Widget) {
    showEmbeddedPlayer();
    return;
  }

  widget = SC.Widget(frame);
  const events = SC.Widget.Events;
  button.hidden = false;
  link.hidden = true;
  fallbackTimer = setTimeout(() => {
    if (!ready) showEmbeddedPlayer();
  }, 8000);

  function play() {
    widget.setVolume(Number(volume.value));
    widget.play();
  }

  widget.bind(events.READY, () => {
    if (ready) return;
    ready = true;
    clearTimeout(fallbackTimer);
    volumeLabel.hidden = false;
    if (autoStart) play();
  });
  widget.bind(events.PLAY, () => {
    clearTimeout(fallbackTimer);
    playing = true;
    hasPlayed = true;
    render();
  });
  function markPaused() {
    playing = false;
    render();
  }
  widget.bind(events.PAUSE, markPaused);
  widget.bind(events.FINISH, markPaused);
  widget.bind(events.ERROR, showEmbeddedPlayer);

  button.addEventListener('click', () => {
    if (playing) {
      widget.pause();
      return;
    }
    if (ready) play();
    else showEmbeddedPlayer();
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (!playing) showEmbeddedPlayer();
    }, 1200);
  });
  volume.addEventListener('input', () => widget.setVolume(Number(volume.value)));

  document.addEventListener('click', event => {
    if (event.target.closest('#b6l-reel-open, [data-vip-listen], [data-detail-open], [data-play], [data-play-url]')) {
      autoStart = false;
      if (ready) widget.pause();
    }
  });
})();
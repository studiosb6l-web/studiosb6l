(() => {
  const translations = {
    pt: ['Concertos e bilhetes', 'Estamos a preparar uma agenda de concertos em Portugal e Espanha.', 'Portugal', 'Espanha', 'Em breve'],
    es: ['Conciertos y entradas', 'Estamos preparando una agenda de conciertos en Portugal y España.', 'Portugal', 'España', 'Próximamente'],
    en: ['Concerts and tickets', 'We’re putting together a concert guide for Portugal and Spain.', 'Portugal', 'Spain', 'Coming soon'],
    fr: ['Concerts et billets', 'Nous préparons un agenda des concerts au Portugal et en Espagne.', 'Portugal', 'Espagne', 'Bientôt'],
    de: ['Konzerte und Tickets', 'Wir bereiten einen Konzertkalender für Portugal und Spanien vor.', 'Portugal', 'Spanien', 'In Kürze'],
    ja: ['コンサートとチケット', 'ポルトガルとスペインのコンサート情報を準備しています。', 'ポルトガル', 'スペイン', '近日公開'],
    zh: ['演出与购票', '我们正在整理葡萄牙和西班牙的音乐会演出信息。', '葡萄牙', '西班牙', '即将推出'],
    ar: ['الحفلات والتذاكر', 'نعمل على إعداد دليل للحفلات الموسيقية في البرتغال وإسبانيا.', 'البرتغال', 'إسبانيا', 'قريبًا']
  };

  const root = document.documentElement;
  const shortcut = document.querySelector('.b6l-concert-shortcut');
  const section = document.getElementById('concertos');
  const labels = ['title', 'description', 'portugal', 'spain', 'soon'];

  function translate() {
    const requested = root.lang.toLowerCase().split('-')[0];
    const language = Object.hasOwn(translations, requested) ? requested : 'en';
    const copy = translations[language];
    shortcut.querySelector('span').textContent = copy[0];

    if (section) {
      labels.forEach((label, index) => {
        section.querySelectorAll('[data-concert="' + label + '"]').forEach(element => {
          element.textContent = copy[index];
        });
      });
    } else {
      shortcut.href = 'music-store.html?lang=' + language + '#concertos';
    }
  }

  translate();
  new MutationObserver(translate).observe(root, { attributes: true, attributeFilter: ['lang'] });

  const cart = document.getElementById('cart');
  if (cart) {
    const fitAboveCart = () => {
      shortcut.style.setProperty('--b6l-cart-height', cart.offsetHeight + 'px');
    };
    fitAboveCart();
    new ResizeObserver(fitAboveCart).observe(cart);
  }

  let scrollFrame = 0;

  function moveWithPage() {
    scrollFrame = 0;
    const maxScroll = root.scrollHeight - window.innerHeight;
    const offset = Math.max(0, Math.min(window.scrollY, maxScroll));
    const progress = maxScroll > 0 ? offset / maxScroll : 0;
    const range = Math.min(110, window.innerHeight * 0.17);
    const lift = range * (0.55 * (1 - Math.exp(-offset / 260)) + 0.45 * progress);
    shortcut.style.setProperty('--b6l-scroll-range', range + 'px');
    shortcut.style.setProperty('--b6l-scroll-lift', lift.toFixed(1) + 'px');
  }

  function scheduleMovement() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(moveWithPage);
  }

  window.addEventListener('scroll', scheduleMovement, { passive: true });
  window.addEventListener('resize', scheduleMovement);
  moveWithPage();
})();

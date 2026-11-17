(() => {
  const translations = {
    pt: ['Concertos e bilhetes', 'Concertos, ópera e festivais em Portugal, Espanha e no resto do mundo.', 'Portugal', 'Espanha', 'Em breve'],
    es: ['Conciertos y entradas', 'Conciertos, ópera y festivales en Portugal, España y el resto del mundo.', 'Portugal', 'España', 'Próximamente'],
    en: ['Concerts and tickets', 'Concerts, opera and festivals in Portugal, Spain and around the world.', 'Portugal', 'Spain', 'Coming soon'],
    fr: ['Concerts et billets', 'Concerts, opéras et festivals au Portugal, en Espagne et dans le monde.', 'Portugal', 'Espagne', 'Bientôt'],
    de: ['Konzerte und Tickets', 'Konzerte, Oper und Festivals in Portugal, Spanien und weltweit.', 'Portugal', 'Spanien', 'In Kürze'],
    ja: ['コンサートとチケット', 'ポルトガル、スペイン、世界各地のコンサート、オペラ、音楽フェスティバル。', 'ポルトガル', 'スペイン', '近日公開'],
    zh: ['演出与购票', '葡萄牙、西班牙及全球各地的音乐会、歌剧和音乐节。', '葡萄牙', '西班牙', '即将推出'],
    ar: ['الحفلات والتذاكر', 'حفلات موسيقية وأوبرا ومهرجانات في البرتغال وإسبانيا وحول العالم.', 'البرتغال', 'إسبانيا', 'قريبًا']
  };

  const guideActions = {
    pt: 'Ver agenda', es: 'Ver agenda', en: 'View concert guide', fr: 'Voir l’agenda',
    de: 'Zum Konzertkalender', ja: '公演情報を見る', zh: '查看演出指南', ar: 'عرض دليل الحفلات'
  };
  const root = document.documentElement;
  const shortcut = document.querySelector('.b6l-concert-shortcut');
  const section = document.getElementById('concertos');
  const highlight = document.getElementById('concerts-highlight');
  const labels = ['title', 'description', 'portugal', 'spain', 'soon'];
  const international = {"pt": "Agenda internacional", "es": "Agenda internacional", "en": "International concert guide", "fr": "Agenda international", "de": "Internationale Konzerttermine", "ja": "世界の公演情報", "zh": "国际演出指南", "ar": "دليل الحفلات الدولي"};

  function translate() {
    const requested = root.lang.toLowerCase().split('-')[0];
    const language = Object.hasOwn(translations, requested) ? requested : 'en';
    const copy = translations[language];
    shortcut.querySelector('span').textContent = copy[0];

    if (section) {
      section.querySelector('[data-concert="international"]').textContent = international[language];
      labels.forEach((label, index) => {
        section.querySelectorAll('[data-concert="' + label + '"]').forEach(element => {
          element.textContent = copy[index];
        });
      });
    } else {
      shortcut.href = 'music-store.html?lang=' + language + '#concertos';
      if (highlight) {
        highlight.querySelector('h2').textContent = copy[0];
        highlight.querySelector('p').textContent = copy[1];
        highlight.querySelector('a').href = shortcut.href;
        highlight.querySelector('a span').textContent = guideActions[language];
      }
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

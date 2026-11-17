/* STUDIOSB6L: optional analytics, loaded only after consent */
(function(){
const key='studiosb6l_analytics_consent',id='G-5R9B2QN6V1';
const strings={
pt:['Privacidade e estatísticas','Utilizamos cookies opcionais do Google Analytics para compreender as visitas ao nosso site. Pode aceitar ou recusar e alterar a sua escolha a qualquer momento.','Informações de privacidade da Google','Recusar','Aceitar','Preferências de privacidade'],
es:['Privacidad y estadísticas','Utilizamos cookies opcionales de Google Analytics para comprender las visitas a nuestro sitio. Puede aceptar o rechazar y cambiar su elección en cualquier momento.','Información de privacidad de Google','Rechazar','Aceptar','Preferencias de privacidad'],
en:['Privacy & analytics','We use optional Google Analytics cookies to understand visits to our website. You can accept or reject and change your choice at any time.','Google privacy information','Reject','Accept','Privacy preferences'],
fr:['Confidentialité et statistiques','Nous utilisons des cookies Google Analytics facultatifs pour comprendre les visites sur notre site. Vous pouvez accepter ou refuser et modifier votre choix à tout moment.','Confidentialité chez Google','Refuser','Accepter','Préférences de confidentialité'],
de:['Datenschutz und Statistiken','Wir verwenden optionale Google-Analytics-Cookies, um Besuche auf unserer Website zu verstehen. Sie können zustimmen oder ablehnen und Ihre Auswahl jederzeit ändern.','Datenschutz bei Google','Ablehnen','Akzeptieren','Datenschutzeinstellungen']
};
function lang(){var v=document.documentElement.lang||'es';return strings[v]?v:'es'}
function load(){if(window.b6lAnalyticsLoaded)return;window.b6lAnalyticsLoaded=true;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',id);var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.appendChild(s)}
function choice(){try{return localStorage.getItem(key)}catch(e){return null}}
function panel(){if(document.getElementById('b6l-consent-panel'))return;var t=strings[lang()],p=document.createElement('section');p.id='b6l-consent-panel';p.setAttribute('role','dialog');p.setAttribute('aria-label',t[0]);p.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:490px;margin:auto;z-index:2147483647;background:linear-gradient(145deg,#182536,#0d1522);color:#f7f4ec;border:1px solid #c3a36b;border-radius:14px;padding:22px;box-sizing:border-box;font:14px/1.6 Arial,sans-serif;box-shadow:0 12px 36px #0009';
var title=document.createElement('strong');title.textContent='STUDIOSB6L · '+t[0];title.style.cssText='display:block;font-size:16px;color:#e6c78b;margin-bottom:9px';p.appendChild(title);
var desc=document.createElement('p');desc.textContent=t[1];desc.style.cssText='margin:0 0 10px';p.appendChild(desc);
var link=document.createElement('a');link.href='https://policies.google.com/privacy';link.target='_blank';link.rel='noopener noreferrer';link.textContent=t[2];link.style.cssText='color:#e6c78b;text-decoration:underline;display:inline-block;margin-bottom:16px';p.appendChild(link);
var buttons=document.createElement('div');buttons.style.cssText='display:flex;gap:12px;flex-wrap:wrap';[['no',t[3]],['yes',t[4]]].forEach(function(pair){var b=document.createElement('button');b.type='button';b.textContent=pair[1];b.style.cssText='flex:1;min-width:110px;padding:11px 20px;border:1px solid #c3a36b;border-radius:7px;cursor:pointer;font-weight:700;background:'+(pair[0]==='yes'?'#c3a36b':'transparent')+';color:'+(pair[0]==='yes'?'#101722':'#f7f4ec');b.addEventListener('click',function(){try{localStorage.setItem(key,pair[0])}catch(e){}p.remove();if(pair[0]==='yes')load();else if(window.b6lAnalyticsLoaded)location.reload()});buttons.appendChild(b)});p.appendChild(buttons);document.body.appendChild(p)}
function init(){if(choice()==='yes')load();else if(choice()!=='no')panel();var b=document.createElement('button');b.type='button';b.id='b6l-privacy-settings';b.style.cssText='display:block;margin:16px auto;padding:9px 15px;background:transparent;color:#e6c78b;border:1px solid #b99b62;border-radius:7px;cursor:pointer;font:13px Arial,sans-serif';function translate(){b.textContent=strings[lang()][5];var p=document.getElementById('b6l-consent-panel');if(p){p.remove();panel()}}translate();b.addEventListener('click',panel);document.body.appendChild(b);var selector=document.getElementById('language');if(selector)selector.addEventListener('change',function(){setTimeout(translate,0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[data-analytics-event]');
  if (!link || !window.b6lAnalyticsLoaded) return;
  window.gtag('event', link.dataset.analyticsEvent, { link_url: link.href });
});

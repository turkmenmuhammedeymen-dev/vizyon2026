(function () {
'use strict';
var REPLACEMENTS = [
  [/V[İIıi]ZYON\s*2027\b/gi, 'AETHRION'],
  [/V[İIıi]ZYON\s*AL\b/gi, 'AETHRION AI'],
  [/V[İIıi]ZYON\s*AI\b/gi, 'AETHRION AI'],
  [/\bV27\s*KOÇ(?:\s*ASİSTANI)?\b/gi, 'AETHRION Coach'],
  [/\bV27\s*API\b/gi, 'A27 API'],
  [/\bV27\b/gi, 'A27'],
  [/V[İIıi]ZYON2027\b/gi, 'AETHRION'],
  [/\bLGS\s*\/\s*YKS\s*Sınav Hazırlığı\b/gi, 'Öğrenme rehberi'],
  [/\bLGS\b/gi, 'öğrenme'],
  [/\bYKS\b/gi, 'öğrenme']
];
function brand(value) {
  var out = String(value == null ? '' : value);
  REPLACEMENTS.forEach(function (rule) { out = out.replace(rule[0], rule[1]); });
  return out;
}
function skipElement(el) {
  return !el || !!(el.closest && el.closest('script,style,code,pre,textarea,noscript,svg,math'));
}
function scan(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    if (skipElement(root.parentElement)) return;
    var oldText = root.nodeValue || '';
    var newText = brand(oldText);
    if (newText !== oldText) root.nodeValue = newText;
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE && root.matches('script,style,code,pre,textarea,noscript,svg,math')) return;
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var nodes = [], node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(function (textNode) {
    if (skipElement(textNode.parentElement)) return;
    var oldText = textNode.nodeValue || '';
    var newText = brand(oldText);
    if (newText !== oldText) textNode.nodeValue = newText;
  });
}
function loadLateTheme() {
  if (!document.body || document.body.querySelector('link[data-aethrion-late-theme]')) return;
  var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
  links.forEach(function (link) {
    if ((link.getAttribute('href') || '').indexOf('aethrion-experience.css') !== -1 && link.parentNode) link.parentNode.removeChild(link);
  });
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/aethrion-experience.css?v=20261022-light';
  link.setAttribute('data-aethrion-late-theme', 'true');
  document.body.appendChild(link);
}
function updateBrandMetadata() {
  if (document.title) document.title = brand(document.title);
  document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) { meta.setAttribute('content', '#ffffff'); });
  document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"],meta[name="description"]').forEach(function (meta) {
    var content = meta.getAttribute('content');
    if (!content) return;
    var next = brand(content);
    if (meta.getAttribute('property') === 'og:site_name') next = 'AETHRION';
    if (next !== content) meta.setAttribute('content', next);
  });
  var canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && /vizyon2026\.vercel\.app\/vizyon-(ai|al)\.html/i.test(canonical.href)) {
    canonical.href = canonical.href.replace('/vizyon-ai.html', '/aethrion-ai.html').replace('/vizyon-al.html', '/aethrion-assistant.html');
  }
}
function updateFriendlyRoutes() {
  document.querySelectorAll('a[href]').forEach(function (a) {
    var raw = a.getAttribute('href');
    if (!raw) return;
    try {
      var u = new URL(raw, location.href);
      if (u.origin !== location.origin && u.hostname !== 'vizyon2026.vercel.app') return;
      var routeMap = {
        '/vizyon-ai.html': '/aethrion-ai.html',
        '/vizyon-al.html': '/aethrion-assistant.html',
        '/vizyonekibi.html': '/aethrion-ekibi.html'
      };
      if (routeMap[u.pathname]) a.setAttribute('href', routeMap[u.pathname] + u.search + u.hash);
      else if (u.hostname === 'vizyon2026.vercel.app' && u.pathname !== '/') {
        a.setAttribute('href', u.pathname + u.search + u.hash);
      }
    } catch (e) {}
  });
}
function ensurePolicyLinks() {
  var footer = document.querySelector('footer,.site-footer,.footer');
  if (!footer || footer.querySelector('[data-ae-policy-nav]')) return;
  var existing = footer.querySelectorAll('a[href*="gizlilik"],a[href*="kullanici-sozlesmesi"],a[href*="kvkk"],a[href*="api-kullanim"]');
  if (existing.length >= 4) return;
  var nav = document.createElement('nav');
  nav.className = 'ae-legal-nav';
  nav.setAttribute('aria-label', 'Yasal ve güvenlik belgeleri');
  nav.setAttribute('data-ae-policy-nav', '');
  nav.innerHTML =
    '<div><strong>Yasal ve güvenlik belgeleri</strong><small>Gizlilik, hesap, API ve hizmet koşullarını inceleyin.</small></div>' +
    '<div class="ae-legal-links">' +
    '<a href="/gizlilik.html">Gizlilik Politikası</a>' +
    '<a href="/iade-ve-iptal-politikasi.html">İptal ve İade Politikası</a>' +
    '<a href="/kullanici-sozlesmesi.html">Kullanıcı Sözleşmesi</a>' +
    '<a href="/cerez-politikasi.html">Çerez Politikası</a>' +
    '<a href="/kvkk-aydinlatma.html">KVKK Aydınlatma</a>' +
    '<a href="/api-kullanim-kosullari.html">A27 API Koşulları</a>' +
    '<a href="/api-belgelendirme.html">API Belgeleri</a>' +
    '<a href="/ai-kullanim-politikasi.html">AI Kullanım Politikası</a>' +
    '<a href="/guvenlik-politikasi.html">Güvenlik Politikası</a>' +
    '<a href="/hesap-ve-oturum-guvenligi.html">Hesap ve Oturum Güvenliği</a>' +
    '<a href="/veri-saklama-silme-politikasi.html">Veri Saklama ve Silme</a>' +
    '<a href="/icerik-ve-fikri-mulkiyet.html">İçerik ve Fikri Mülkiyet</a>' +
    '<a href="/kabul-edilebilir-kullanim.html">Kabul Edilebilir Kullanım</a>' +
    '<a href="/ucuncu-taraf-hizmetler.html">Üçüncü Taraf Hizmetler</a>' +
    '<a href="/erisilebilirlik.html">Erişilebilirlik</a>' +
    '<a href="/sorumlu-aciklama.html">Sorumlu Açıklama</a>' +
    '<a href="/iletisim-ve-basvuru.html">Destek ve Başvuru</a>' +
    '</div>';
  footer.appendChild(nav);
}
function enableScrollMotion() {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var selector = '#mainSite .hero-copy,#mainSite .hero-visual,#mainSite .section-header,#mainSite .feature-card,#mainSite .category-card,#mainSite .model-mini-card,#mainSite .model-tile,#mainSite .price-card,.api-hero,.guide-hero,.legal-hero,.policy-card';
  var items = document.querySelectorAll(selector);
  if (!items.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('ae-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -35px 0px', threshold: 0.05 });
  items.forEach(function (el, i) {
    if (el.closest('#splashScreen')) return;
    el.classList.add('ae-reveal');
    el.style.transitionDelay = (i % 5) * 45 + 'ms';
    observer.observe(el);
  });
}
function polish() {
  loadLateTheme();
  updateBrandMetadata();
  updateFriendlyRoutes();
  ensurePolicyLinks();
  if (document.body) scan(document.body);
  enableScrollMotion();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polish, { once: true });
else polish();
if (document.body && window.MutationObserver) {
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      Array.prototype.forEach.call(record.addedNodes || [], function (node) {
        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) scan(node);
      });
    });
  });
  observer.observe(document.body, { subtree: true, childList: true });
}
})();
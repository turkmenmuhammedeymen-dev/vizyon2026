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
  link.href = '/aethrion-experience.css?v=20261022-authfix2';
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

function closeGoogleBridge() {
  var overlay = document.getElementById('aethrionGoogleBridge');
  if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  window._googleLoginInProgress = false;
}
function googleBridgeNotice(message) {
  var note = document.getElementById('aethrionGoogleBridgeNotice');
  if (note) { note.textContent = message; note.style.display = 'block'; }
}
function ensureGoogleBridge() {
  var overlay = document.getElementById('aethrionGoogleBridge');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'aethrionGoogleBridge';
  overlay.className = 'ae-google-bridge';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'aethrionGoogleBridgeTitle');
  overlay.innerHTML =
    '<div class="ae-google-bridge-card">' +
      '<button type="button" class="ae-google-bridge-close" aria-label="Kapat">×</button>' +
      '<div class="ae-google-bridge-mark" aria-hidden="true">A</div>' +
      '<p class="ae-google-bridge-eyebrow">AETHRION ACCOUNT</p>' +
      '<h2 id="aethrionGoogleBridgeTitle">Google ile devam et</h2>' +
      '<p class="ae-google-bridge-copy">Sözleşme ve gizlilik onayınız alındı. Google hesabınızı seçmek için aşağıdaki güvenli Google düğmesine dokunun.</p>' +
      '<div id="aethrionGoogleButtonMount" class="ae-google-button-mount"></div>' +
      '<p id="aethrionGoogleBridgeNotice" class="ae-google-bridge-notice" role="status" style="display:none"></p>' +
      '<p class="ae-google-bridge-foot">Google kimlik doğrulaması, AETHRION sunucu doğrulamasıyla tamamlanır.</p>' +
    '</div>';
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay || (event.target && event.target.closest && event.target.closest('.ae-google-bridge-close'))) closeGoogleBridge();
  });
  document.body.appendChild(overlay);
  return overlay;
}
function renderGoogleBridge(attempt) {
  attempt = attempt || 0;
  var overlay = ensureGoogleBridge();
  var mount = document.getElementById('aethrionGoogleButtonMount');
  if (!mount) return;
  if (window.google && google.accounts && google.accounts.id && window._googleGISReady) {
    try {
      mount.innerHTML = '';
      google.accounts.id.renderButton(mount, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: Math.min(340, Math.max(240, Math.floor((window.innerWidth || 360) - 76)))
      });
      overlay.setAttribute('data-google-ready', 'true');
      var button = mount.querySelector('iframe');
      if (button) button.setAttribute('title', 'Google ile güvenli giriş');
      return;
    } catch (error) {
      console.error('[AETHRION] Google düğmesi oluşturulamadı:', error);
      googleBridgeNotice('Google giriş düğmesi hazırlanamadı. Google Identity Services ve izinli alan adı ayarlarını kontrol edin.');
      return;
    }
  }
  if (typeof window.handleGoogleLibraryLoad === 'function') {
    try { window.handleGoogleLibraryLoad(); } catch (e) {}
  }
  if (attempt < 20) {
    window.setTimeout(function () { renderGoogleBridge(attempt + 1); }, 350);
  } else {
    googleBridgeNotice('Google hizmeti yüklenemedi. Bağlantıyı kontrol edip yeniden deneyin. Sorun sürerse Google Cloud Console içindeki izinli alan adlarını ve AETHRION sunucu doğrulama işlevini kontrol etmek gerekir.');
    var retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'ae-google-bridge-retry';
    retry.textContent = 'Yeniden dene';
    retry.addEventListener('click', function () {
      retry.remove();
      googleBridgeNotice('Google hizmeti yeniden yükleniyor…');
      renderGoogleBridge(0);
    });
    overlay.querySelector('.ae-google-bridge-card').appendChild(retry);
  }
}
function installAuthFeedbackRepair() {
  if (typeof window.showNotification === 'function' && !window.showNotification.__aeAuthFeedbackRepair) {
    var originalNotify = window.showNotification;
    var emailFallbackShown = false;
    var repairedNotify = function (message, type) {
      var msg = String(message == null ? '' : message);
      if (type === 'warning' && /Kayıt başarılı!\s*Doğrulama kodunuz:/i.test(msg)) emailFallbackShown = true;
      if (emailFallbackShown && /Kayıt başarılı!\s*Doğrulama kodunuz mail adresinize gönderildi/i.test(msg)) {
        emailFallbackShown = false;
        return;
      }
      if (type === 'error') {
        if (/username.*(?:already taken|taken)|(?:already taken|taken).*username/i.test(msg)) {
          msg = 'Bu kullanıcı adı zaten kullanılıyor. Farklı bir kullanıcı adı deneyin.';
        } else if (/email.*(?:already taken|already exists|taken)|(?:already taken|already exists|taken).*email/i.test(msg)) {
          msg = 'Bu e-posta adresiyle zaten hesap var. Giriş yapmayı veya şifre sıfırlamayı deneyin.';
        } else if (/invalid email|email address is invalid/i.test(msg)) {
          msg = 'E-posta adresi geçerli görünmüyor. Adresi kontrol edip tekrar deneyin.';
        } else if (/failed to fetch|network request failed|network error|connection.*(?:failed|error)|timed? out/i.test(msg)) {
          msg = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
        } else if (/verifyGoogleToken|Google.*(?:Cloud Code|server).*function/i.test(msg)) {
          msg = 'Google hesabı alındı ancak sunucu doğrulaması tamamlanamadı. Back4App Cloud Code içindeki verifyGoogleToken işlevinin dağıtımını ve günlüklerini kontrol etmek gerekiyor.';
        } else if (/sendEmail|verifyUser|Cloud Code function/i.test(msg)) {
          msg = 'Hesap hizmetindeki sunucu işlevi yanıt vermedi. Back4App Cloud Code dağıtımını ve işlev günlüklerini kontrol etmek gerekiyor.';
        }
      }
      return originalNotify.call(this, msg, type);
    };
    repairedNotify.__aeAuthFeedbackRepair = true;
    window.showNotification = repairedNotify;
  }
}
function installAuthSubmitGuards() {
  [
    { name: 'handleRegister', selector: '#formRegister button[onclick*="handleRegister"]', busy: 'Hesap oluşturuluyor…', idle: 'Kayıt Ol' },
    { name: 'handleLogin', selector: '#formLogin button[onclick*="handleLogin"]', busy: 'Giriş yapılıyor…', idle: 'Giriş Yap' }
  ].forEach(function (config) {
    var original = window[config.name];
    if (typeof original !== 'function' || original.__aeSubmitGuard) return;
    var wrapped = function () {
      var button = document.querySelector(config.selector);
      if (button && button.disabled) return;
      var previousText = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = config.busy;
      }
      var result;
      try { result = original.apply(this, arguments); }
      catch (error) {
        if (button) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = previousText || config.idle; }
        throw error;
      }
      return Promise.resolve(result).finally(function () {
        window.setTimeout(function () {
          if (!button) return;
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.textContent = previousText || config.idle;
        }, 250);
      });
    };
    wrapped.__aeSubmitGuard = true;
    wrapped.__aeOriginal = original;
    window[config.name] = wrapped;
  });
}
function installGoogleLoginRepair() {
  if (typeof window.handleGoogleLoginResponse === 'function' && !window.handleGoogleLoginResponse.__aeBridgeWrapped) {
    var originalResponse = window.handleGoogleLoginResponse;
    var wrappedResponse = async function () {
      window._googleLoginInProgress = true;
      try { return await originalResponse.apply(this, arguments); }
      finally { window.setTimeout(closeGoogleBridge, 150); }
    };
    wrappedResponse.__aeBridgeWrapped = true;
    wrappedResponse.__aeOriginal = originalResponse;
    window.handleGoogleLoginResponse = wrappedResponse;
  }
  if (typeof window.loginWithGoogle === 'function' && !window.loginWithGoogle.__aeGoogleButtonRepair) {
    var repairedGoogleLogin = function () {
      if (!document.body) return;
      closeGoogleBridge();
      ensureGoogleBridge();
      window._googleLoginInProgress = false;
      renderGoogleBridge(0);
    };
    repairedGoogleLogin.__aeGoogleButtonRepair = true;
    window.loginWithGoogle = repairedGoogleLogin;
  }
}
function installAuthRepairs() {
  installAuthFeedbackRepair();
  installAuthSubmitGuards();
  installGoogleLoginRepair();
}

function polish() {
  loadLateTheme();
  updateBrandMetadata();
  updateFriendlyRoutes();
  ensurePolicyLinks();
  if (document.body) scan(document.body);
  enableScrollMotion();
  installAuthRepairs();
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
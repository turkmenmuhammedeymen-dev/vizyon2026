/* AETHRION Back4App client bootstrap.
 * These are public Parse client credentials; never place master keys here.
 * The Parse SDK is loaded by index.html before this bundle.
 */
(function initAETHRIONBack4App(global) {
  'use strict';
  var APPLICATION_ID = 'Dr9SODgMburZ54QvC8RnIHc9dbjreozBbKLOpMjX';
  var JAVASCRIPT_KEY = 'dCXRvnEcCcOFvpzVDAV9AAJnYvdrqaP1JFRkJzvv';
  var SERVER_URL = 'https://parseapi.back4app.com';

  global.initBack4app = async function () {
    if (!global.Parse || !global.Parse.User) {
      throw new Error('Back4App SDK yüklenemedi. İnternet bağlantısını ve Parse SDK kaynağını kontrol edin.');
    }
    if (global.Parse.applicationId && global.Parse.applicationId !== APPLICATION_ID) {
      throw new Error('Back4App Application ID uyuşmazlığı. Sayfayı yenileyin ve önbelleği temizleyin.');
    }
    if (!global.parseInitialized && !global.Parse.applicationId) {
      global.Parse.initialize(APPLICATION_ID, JAVASCRIPT_KEY);
    }
    global.Parse.serverURL = SERVER_URL;
    global.parseInitialized = true;
    return true;
  };

  // Initialize early; auth recovery also calls initBack4app defensively.
  try {
    if (global.Parse && global.Parse.User) {
      global.Parse.initialize(APPLICATION_ID, JAVASCRIPT_KEY);
      global.Parse.serverURL = SERVER_URL;
      global.parseInitialized = true;
    }
  } catch (error) {
    global.parseInitialized = false;
    console.error('[AETHRION] Back4App bootstrap failed:', error);
  }
})(window);


/* ===== AETHRION CORE AUTH RESTORE (2026-10-28) =====
 * The HTML auth controls call these globals. Keep this compatibility layer
 * before feature modules so registration, sign-in and email verification exist.
 */
(function aethrionCoreAuth(global) {
  'use strict';
  if (global.__aethrionCoreAuthInstalled) return;
  global.__aethrionCoreAuthInstalled = true;

  function byId(id) { return document.getElementById(id); }
  function value(id) { var el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function emailValue(id) { return value(id).toLowerCase(); }
  function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function setVisible(id, visible) {
    var el = byId(id);
    if (el) el.style.display = visible ? '' : 'none';
  }
  function notify(message, type) {
    if (typeof global.showNotification === 'function' && !global.showNotification.__aeCoreFallback) {
      try { global.showNotification(message, type || 'info'); return; } catch (e) {}
    }
    var toast = byId('aeCoreAuthToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'aeCoreAuthToast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:2147483646;width:min(560px,calc(100vw - 28px));padding:14px 18px;border-radius:14px;border:1px solid rgba(212,175,55,.45);background:#0b1220;color:#f7f9fc;box-shadow:0 18px 55px rgba(0,0,0,.35);font:500 14px/1.5 Inter,system-ui,sans-serif;display:none;';
      document.body.appendChild(toast);
    }
    toast.textContent = String(message || '');
    toast.style.display = 'block';
    toast.style.borderColor = type === 'error' ? '#ef4444' : (type === 'success' ? '#22c55e' : 'rgba(212,175,55,.45)');
    if (toast.__aeHideTimer) global.clearTimeout(toast.__aeHideTimer);
    toast.__aeHideTimer = global.setTimeout(function () { toast.style.display = 'none'; }, 6500);
  }
  if (typeof global.showNotification !== 'function') {
    var fallbackNotify = function (message, type) { notify(message, type); };
    fallbackNotify.__aeCoreFallback = true;
    global.showNotification = fallbackNotify;
  }
  function authModal(show) {
    var modal = byId('authModal');
    if (!modal) return;
    modal.style.display = show ? 'flex' : 'none';
    modal.setAttribute('aria-hidden', show ? 'false' : 'true');
  }
  if (typeof global.openModal !== 'function') {
    global.openModal = function (id) {
      var el = byId(id);
      if (el) { el.style.display = 'flex'; el.setAttribute('aria-hidden', 'false'); }
    };
  }
  if (typeof global.closeModal !== 'function') {
    global.closeModal = function (id) {
      var el = byId(id);
      if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); }
    };
  }
  if (typeof global.switchTab !== 'function') {
    global.switchTab = function (tab) {
      tab = ['login', 'register', 'verify'].indexOf(tab) >= 0 ? tab : 'login';
      setVisible('formLogin', tab === 'login');
      setVisible('formRegister', tab === 'register');
      setVisible('formVerify', tab === 'verify');
      var modal = byId('authModal');
      if (modal) {
        modal.querySelectorAll('.modal-tab').forEach(function (button) {
          var text = (button.textContent || '').toLocaleLowerCase('tr');
          var active = (tab === 'login' && text.indexOf('giriş') >= 0) ||
            (tab === 'register' && text.indexOf('kayıt') >= 0) ||
            (tab === 'verify' && text.indexOf('doğrula') >= 0);
          button.classList.toggle('active', active);
        });
      }
      authModal(true);
      if (tab === 'verify') {
        var email = value('rEmail') || value('lEmail');
        if (email && byId('verifyEmail')) byId('verifyEmail').value = email;
      }
      return true;
    };
  }
  if (typeof global.openAuthModal !== 'function') {
    global.openAuthModal = function (tab) { global.switchTab(tab || 'login'); };
  }
  async function ensureParse() {
    if (!global.Parse || !global.Parse.User || !global.Parse.Cloud) {
      throw new Error('Back4App SDK yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.');
    }
    if (typeof global.initBack4app === 'function') await global.initBack4app();
    if (!global.Parse.applicationId) throw new Error('Back4App bağlantısı başlatılamadı.');
  }
  async function cloudRun(name, params, timeoutMs) {
    var timer;
    var request = global.Parse.Cloud.run(name, params || {});
    var timeout = new Promise(function (_, reject) {
      timer = global.setTimeout(function () {
        reject(new Error('Sunucu isteği zaman aşımına uğradı. Biraz sonra tekrar deneyin.'));
      }, timeoutMs || 18000);
    });
    try { return await Promise.race([request, timeout]); }
    finally { if (timer) global.clearTimeout(timer); }
  }
  function accepted(id, message) {
    var el = byId(id);
    return !!(el && el.checked) || (notify(message, 'warning'), false);
  }
  function dashboard() {
    var area = byId('dashboardArea');
    if (area) area.style.display = 'block';
    document.body.classList.add('aethrion-authenticated');
    authModal(false);
    if (typeof global.onAethrionLoginSuccess === 'function') {
      try { global.onAethrionLoginSuccess(global.Parse.User.current()); } catch (e) {}
    }
    try { global.dispatchEvent(new CustomEvent('aethrion:authenticated', { detail: { user: global.Parse.User.current() } })); } catch (e) {}
  }

  if (typeof global.handleRegister !== 'function') {
    global.handleRegister = async function () {
      var name = value('rName');
      var email = emailValue('rEmail');
      var displayUsername = value('rUsername');
      var password = value('rPass');
      var confirm = value('rPass2');
      if (!name || !email || !password || !confirm) { notify('Ad, e-posta ve şifre alanlarını doldurun.', 'warning'); return false; }
      if (!validEmail(email)) { notify('Geçerli bir e-posta adresi girin.', 'warning'); return false; }
      if (password.length < 8) { notify('Şifre en az 8 karakter olmalı.', 'warning'); return false; }
      if (password !== confirm) { notify('Şifreler eşleşmiyor.', 'warning'); return false; }
      if (!accepted('registerTermsCheck', 'Kayıt olmak için Kullanıcı Sözleşmesi’ni kabul edin.')) return false;
      if (!accepted('registerPrivacyCheck', 'Kayıt olmak için Gizlilik Politikası’nı kabul edin.')) return false;
      await ensureParse();
      var user = new global.Parse.User();
      // Email is the canonical Parse username so the visible email login works.
      user.set('username', email);
      user.set('email', email);
      user.set('password', password);
      user.set('name', name);
      user.set('displayUsername', displayUsername || email.split('@')[0]);
      user.set('role', 'member');
      user.set('plan', 'free');
      user.set('isVerified', false);
      var referral = value('rReferralCode');
      if (referral) user.set('referralCodeUsed', referral);
      await user.signUp();
      if (byId('verifyEmail')) byId('verifyEmail').value = email;
      if (byId('verifyCode')) byId('verifyCode').value = '';
      global.switchTab('verify');
      try {
        var sent = await cloudRun('resendAccountVerification', { email: email }, 20000);
        if (sent && sent.success) {
          notify('Hesabınız oluşturuldu. E-posta doğrulama kodunu gelen kutunuzdan alın ve doğrulama ekranına girin.', 'success');
        } else {
          notify('Hesabınız oluşturuldu ancak kod gönderimi doğrulanamadı. “Yeni Kod Gönder” seçeneğini kullanın.', 'warning');
        }
      } catch (mailError) {
        console.error('[AETHRION] Verification email send failed:', mailError);
        notify('Hesabınız oluşturuldu; doğrulama e-postası gönderilemedi. E-posta servisi ayarlarını kontrol edin ve “Yeni Kod Gönder” seçeneğini deneyin.', 'warning');
      }
      return true;
    };
  }
  if (typeof global.handleLogin !== 'function') {
    global.handleLogin = async function () {
      var email = emailValue('lEmail');
      var password = value('lPass');
      if (!email || !password) { notify('E-posta ve şifrenizi girin.', 'warning'); return false; }
      if (!validEmail(email)) { notify('Giriş için geçerli e-posta adresi girin.', 'warning'); return false; }
      if (!accepted('loginTermsCheck', 'Devam etmek için Kullanıcı Sözleşmesi’ni kabul edin.')) return false;
      if (!accepted('loginPrivacyCheck', 'Devam etmek için Gizlilik Politikası’nı kabul edin.')) return false;
      await ensureParse();
      var user;
      try {
        user = await global.Parse.User.logIn(email, password);
      } catch (firstError) {
        // Older accounts may have a separate username rather than email as username.
        throw firstError;
      }
      if (user && user.get('isVerified') === false) {
        await global.Parse.User.logOut();
        if (byId('verifyEmail')) byId('verifyEmail').value = email;
        global.switchTab('verify');
        notify('Hesabınız henüz doğrulanmadı. E-postanıza gelen 6 haneli kodu girin.', 'warning');
        return true;
      }
      dashboard();
      notify('Giriş başarılı. AETHRION çalışma alanınız açılıyor.', 'success');
      return true;
    };
  }
  if (typeof global.verifyAccount !== 'function') {
    global.verifyAccount = async function () {
      var email = emailValue('verifyEmail');
      var code = value('verifyCode').replace(/\s/g, '');
      if (!validEmail(email) || !/^\d{6}$/.test(code)) {
        notify('Geçerli e-posta adresi ve 6 haneli doğrulama kodu girin.', 'warning');
        return false;
      }
      await ensureParse();
      var result = await cloudRun('verifyUser', { email: email, code: code }, 18000);
      if (!result || result.success !== true) {
        throw new Error((result && result.error) || 'Doğrulama başarısız. Kodu kontrol edin veya yeni kod isteyin.');
      }
      global.switchTab('login');
      if (byId('lEmail')) byId('lEmail').value = email;
      if (byId('lPass')) byId('lPass').value = '';
      notify('E-posta doğrulandı. Şimdi e-posta ve şifrenizle giriş yapabilirsiniz.', 'success');
      return true;
    };
  }
  if (typeof global.resendAccountVerification !== 'function') {
    global.resendAccountVerification = async function () {
      var email = emailValue('verifyEmail') || emailValue('rEmail');
      if (!validEmail(email)) { notify('Önce geçerli e-posta adresinizi girin.', 'warning'); return false; }
      await ensureParse();
      var result = await cloudRun('resendAccountVerification', { email: email }, 18000);
      if (result && result.success) {
        notify(result.message || 'Hesap uygunsa yeni doğrulama kodu gönderildi. E-postanızı kontrol edin.', 'success');
        return true;
      }
      throw new Error((result && result.error) || 'Yeni doğrulama kodu gönderilemedi.');
    };
  }
  if (typeof global.logout !== 'function') {
    global.logout = async function () {
      try { if (global.Parse && global.Parse.User) await global.Parse.User.logOut(); } catch (e) {}
      authModal(true);
      global.switchTab('login');
      if (byId('dashboardArea')) byId('dashboardArea').style.display = 'none';
    };
  }
})(window);
/* ===== END AETHRION CORE AUTH RESTORE ===== */


/* AETHRION unified first-party JavaScript bundle. Keep module order unchanged. */

/* ===== aethrion-schema.js ===== */
/**
 * AETHRION — JSON-LD structured data fallback
 * Version: 2026-10-23
 *
 * The homepage contains its primary, crawlable JSON-LD graph inline. This file
 * must not append a second Organization/WebSite graph when that inline graph
 * already exists. It only supplies a fallback for pages that have no AETHRION
 * graph at all.
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  function hasAethrionGraph() {
    var nodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < nodes.length; i++) {
      try {
        var parsed = JSON.parse(nodes[i].textContent || '');
        var graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
        if (graph.some(function (node) {
          return node && node['@type'] === 'Organization' && node.name === 'AETHRION';
        })) return true;
      } catch (e) {}
    }
    return false;
  }

  if (document.querySelector('script[data-aethrion-jsonld="true"]') || hasAethrionGraph()) return;

  var siteUrl = 'https://vizyon2026.vercel.app/';
  var graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': siteUrl + '#organization',
        name: 'AETHRION',
        url: siteUrl,
        description: 'A browser-based AI, developer and creative productivity ecosystem.',
        logo: { '@type': 'ImageObject', url: siteUrl + 'logo.svg' },
        sameAs: [
          'https://www.instagram.com/aethrion.official/',
          'https://whatsapp.com/channel/0029VbCpnvuG8l5FQVQMLy1U'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': siteUrl + '#website',
        url: siteUrl,
        name: 'AETHRION',
        alternateName: 'AETHRION — Intelligence Without Limits',
        description: 'AI conversation, browser-supported voice interaction, developer resources and creative workspaces.',
        inLanguage: ['tr', 'en'],
        publisher: { '@id': siteUrl + '#organization' }
      },
      {
        '@type': 'WebApplication',
        '@id': siteUrl + '#webapplication',
        name: 'AETHRION',
        alternateName: ['AETHRION AI', 'AETHRION JARVIS'],
        url: siteUrl,
        description: 'A browser-based AI and productivity ecosystem with conversational AI, browser-supported voice input and speech output, task planning, developer tools and creative workspaces.',
        applicationCategory: 'ProductivityApplication',
        applicationSubCategory: 'AI assistant, voice interaction and creative productivity tools',
        operatingSystem: 'Any device with a modern web browser',
        browserRequirements: 'JavaScript enabled; microphone and speech features depend on browser support and user permission. Some features require an account or supported third-party provider.',
        inLanguage: ['tr', 'en'],
        isAccessibleForFree: true,
        publisher: { '@id': siteUrl + '#organization' },
        featureList: [
          'AETHRION AI conversational assistant',
          'AETHRION JARVIS task-assistant mode and task planning',
          'Browser-supported voice input using speech recognition where available',
          'Speech output using browser text-to-speech where available',
          'AI model catalogue and A27 API documentation',
          'AI modes including normal chat, deep-thinking, agent and coding modes where available',
          'Screen reading and screen-related assistant tools where enabled',
          'File analysis and presentation-related workflows where available',
          '3D Studio and creative project tools',
          'Code editor and developer resources',
          'Video tools',
          'Team collaboration interfaces and project workflows',
          'Developer Platform API key management and diagnostics where enabled',
          'Privacy-conscious sanitized security diagnostics where enabled',
          'Community features and learning resources',
          'Account and security controls'
        ]
      },
      {
        '@type': 'WebPage',
        '@id': siteUrl + 'aethrion-jarvis.html',
        url: siteUrl + 'aethrion-jarvis.html',
        name: 'AETHRION JARVIS — Voice AI and Task Planning',
        description: 'A browser-based voice interaction and task-planning interface. Speech features depend on browser support and user permission. This page does not enable desktop control, screen sharing or autonomous external actions.',
        inLanguage: ['tr', 'en'],
        isPartOf: { '@id': siteUrl + '#website' },
        about: { '@id': siteUrl + '#webapplication' }
      }
    ]
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-aethrion-jsonld', 'true');
  script.textContent = JSON.stringify(graph);
  (document.head || document.documentElement).appendChild(script);
})();


/* ===== aethrion-identity.js ===== */
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
  link.href = '/aethrion-experience.css?v=20261022-corporate5';
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

function loadOpsStyles() {
  if (document.querySelector('link[data-aethrion-ops-css]')) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/aethrion-ops.css?v=20261023-2';
  link.setAttribute('data-aethrion-ops-css', 'true');
  document.head.appendChild(link);
}
function installAuditTelemetry() {
  var P = window.Parse;
  if (!P || !P.Cloud || typeof P.Cloud.run !== 'function' || P.Cloud.run.__aeAuditWrapped) return;
  var originalRun = P.Cloud.run;
  var actionRules = [
    [/share.*project|project.*share/i, 'project_shared'],
    [/unshare.*project|project.*unshare/i, 'project_unshared'],
    [/create.*project|project.*create/i, 'project_created'],
    [/delete.*project|remove.*project|project.*delete/i, 'project_deleted'],
    [/update.*project|save.*project|edit.*project|project.*update/i, 'project_updated'],
    [/add.*member|invite.*member|member.*add/i, 'member_added'],
    [/remove.*member|member.*remove/i, 'member_removed'],
    [/change.*role|update.*role|role.*change/i, 'role_changed'],
    [/upload.*file|file.*upload/i, 'file_uploaded'],
    [/remove.*file|delete.*file|file.*remove/i, 'file_removed'],
    [/add.*comment|create.*comment|comment.*add/i, 'comment_added'],
    [/update.*setting|save.*setting|setting.*update/i, 'settings_changed'],
    [/export.*project|project.*export/i, 'export_requested']
  ];
  var wrapped = function (name, params, options) {
    var promise = originalRun.call(this, name, params, options);
    var rule = null;
    for (var i = 0; i < actionRules.length; i++) {
      if (actionRules[i][0].test(String(name || ''))) { rule = actionRules[i]; break; }
    }
    if (rule && !/^aethrion(?:RecordProjectAudit|GetProjectAudit|GetDiagnostics)$/i.test(String(name || ''))) {
      Promise.resolve(promise).then(function () {
        try {
          var user = P.User && P.User.current ? P.User.current() : null;
          if (!user) return;
          var args = params && typeof params === 'object' ? params : {};
          var teamId = args.teamId || args.team_id || args.teamID || user.get('teamId');
          if (!teamId) return;
          var targetId = args.projectId || args.project_id || args.targetId || args.id || args.objectId || '';
          var targetLabel = args.projectName || args.project_name || args.name || args.title || '';
          return originalRun.call(P.Cloud, 'aethrionRecordProjectAudit', {
            teamId: String(teamId).slice(0, 128),
            action: rule[1],
            targetId: String(targetId).slice(0, 128),
            targetLabel: String(targetLabel).slice(0, 120)
          }).catch(function () {});
        } catch (ignore) {}
      }).catch(function () {});
    }
    return promise;
  };
  wrapped.__aeAuditWrapped = true;
  wrapped.__aeAuditOriginal = originalRun;
  P.Cloud.run = wrapped;
}
function installOpsFeatureCards() {
  if (!document.querySelector('#mainSite, #dashboard, #mainDashboard')) return;
  if (document.querySelector('[data-aethrion-ops-cards]')) return;
  var P = window.Parse;
  var user = P && P.User && typeof P.User.current === 'function' ? P.User.current() : null;
  if (!user) return;
  var role = String(user.get('role') || 'user').toLowerCase();
  var privileged = role === 'founder' || role === 'admin';
  var nav = document.querySelector('#featuresMenu, #featureMenu, #features-menu, #feature-menu, .features-menu, .feature-menu, [data-feature-menu], #sidebar, .sidebar, .dashboard-sidebar, .side-menu, .sidebar-menu, nav[aria-label*="özellik" i], nav[aria-label*="feature" i]');
  var section = document.createElement('section');
  section.className = 'ae-tool-grid';
  section.setAttribute('data-aethrion-ops-cards', 'true');
  section.setAttribute('aria-label', 'AETHRION platform araçları');
  function makeCard(title, description, href, iconPath) {
    var card = document.createElement('article'); card.className = 'ae-tool-card';
    var iconNode = document.createElement('div'); iconNode.className = 'ae-tool-icon';
    var img = document.createElement('img'); img.src = iconPath; img.alt = ''; img.width = 28; img.height = 28; img.loading = 'lazy'; iconNode.appendChild(img);
    var h = document.createElement('h3'); h.textContent = title;
    var p = document.createElement('p'); p.textContent = description;
    var a = document.createElement('a'); a.href = href; a.textContent = 'Aç →'; a.setAttribute('aria-label', title + ' sayfasını aç');
    card.append(iconNode, h, p, a); return card;
  }
  section.appendChild(makeCard('AETHRION Developer Platform', 'API belgeleri, anahtar izinleri ve kullanım istatistikleri.', '/aethrion-developer.html', '/aethrion-status-icon.svg'));
  section.appendChild(makeCard('AETHRION Teams', 'Takımlar, üyeler, rol yönetimi ve denetlenebilir işlem geçmişi.', '/aethrion-teams.html', '/aethrion-audit-icon.svg'));
  if (privileged) {
    section.appendChild(makeCard('Proje denetim kaydı', 'Takım projelerindeki kayıtlı olayları incele.', '/aethrion-project-audit.html', '/aethrion-audit-icon.svg'));
    section.appendChild(makeCard('AETHRION Status & Diagnostics', 'Cloud Code, oturum, veri deposu, model ve dağıtım kontrolleri.', '/aethrion-status.html', '/aethrion-status-icon.svg'));
  }
  var heading = document.createElement('h2'); heading.className = 'ae-tool-eyebrow'; heading.textContent = 'AETHRION PLATFORM ARAÇLARI';
  var wrapper = document.createElement('section'); wrapper.className = 'ae-ops-navigation'; wrapper.setAttribute('data-aethrion-ops-wrapper', 'true'); wrapper.append(heading, section);
  if (nav) nav.appendChild(wrapper);
  else {
    // Menu selector is absent on this app variant: expose a compact, keyboard-accessible tools drawer, not a panel at the page bottom.
    var launcher = document.createElement('button'); launcher.type = 'button'; launcher.className = 'ae-ops-drawer-launcher'; launcher.textContent = 'AETHRION Araçları'; launcher.setAttribute('aria-expanded', 'false');
    var drawer = document.createElement('aside'); drawer.className = 'ae-ops-drawer'; drawer.hidden = true; drawer.setAttribute('aria-label', 'AETHRION platform araçları'); drawer.appendChild(wrapper);
    launcher.addEventListener('click', function () { drawer.hidden = !drawer.hidden; launcher.setAttribute('aria-expanded', drawer.hidden ? 'false' : 'true'); });
    document.body.append(launcher, drawer);
  }
}
function loadJarvisAssistant() {
  if (!document.querySelector('#mainSite, #splashScreen, #dashboard, #mainDashboard')) return;
  if (document.querySelector('script[data-aethrion-jarvis]')) return;
  var script = document.createElement('script');
  script.src = '/aethrion-jarvis.js?v=20261022-1';
  script.defer = true;
  script.setAttribute('data-aethrion-jarvis', 'true');
  document.head.appendChild(script);
}
function polish() {
  loadLateTheme();
  loadOpsStyles();
  updateBrandMetadata();
  updateFriendlyRoutes();
  ensurePolicyLinks();
  if (document.body) scan(document.body);
  enableScrollMotion();
  installAuthRepairs();
  installAuditTelemetry();
  loadJarvisAssistant();
  installOpsFeatureCards();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polish, { once: true });
else polish();
if (document.body && window.MutationObserver) {
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      Array.prototype.forEach.call(record.addedNodes || [], function (node) {
        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) scan(node);
      });
      installOpsFeatureCards();
      installAuditTelemetry();
    });
  });
  observer.observe(document.body, { subtree: true, childList: true });
}
})();

/* ===== aethrion-experience.js ===== */
(function () {
'use strict';
var GROUP_LABELS = { CORE: 'YAPAY ZEKÂ', CREATE: 'ÜRETİM ARAÇLARI', PLATFORM: 'PLATFORM', ADVANCED: 'GELİŞTİRİCİ ARAÇLARI', ACCOUNT: 'HESAP', OTHER: 'DİĞER ÖZELLİKLER' };
var FALLBACK_FEATURES = [
 {group:'CORE',icon:'✦',name:'AETHRION AI',desc:'Yapay zekâ çalışma alanı',action:'openFullAIPanel'},
 {group:'CORE',icon:'◈',name:'AETHRION Agents',desc:'Ajan, ekran okuma ve dosya araçları',action:'openAethrionAlPanel'},
 {group:'CORE',icon:'◎',name:'AETHRION Coach',desc:'Kişisel AI asistanı',action:'openKocPanel'},
 {group:'CORE',icon:'◉',name:'Model Kataloğu',desc:'Tanımlı model seçeneklerini incele',action:'openModelsShowcase'},
 {group:'CREATE',icon:'◇',name:'3D Studio',desc:'Üç boyutlu tasarım araçları',action:'open3DBuilder',href:'/3d-studio.html'},
 {group:'CREATE',icon:'▶',name:'Video Editör',desc:'Video düzenleme çalışma alanı',action:'openVideoEditor'},
 {group:'CREATE',icon:'▣',name:'Video Stüdyosu',desc:'Video fikirleri ve üretim araçları',action:'openVideoStudio'},
 {group:'PLATFORM',icon:'⌂',name:'Topluluk ve Takımlar',desc:'Takım ve ortak proje alanları',action:'toggleTeamPage',href:'/topluluk.html'},
 {group:'PLATFORM',icon:'▤',name:'Projelerim',desc:'Projelerine ve kayıtlarına eriş',action:'scrollToProjects'},
 {group:'ADVANCED',icon:'⌘',name:'A27 API Anahtarı',desc:'API erişim seçenekleri',action:'openA27ApiKeyGenerator',href:'/api.html#keys'},
 {group:'ADVANCED',icon:'↗',name:'A27 API Rehberi',desc:'API belgeleri ve örnekler',action:'openA27ApiGuide',href:'/api.html'},
 {group:'ADVANCED',icon:'▥',name:'Dokümantasyon',desc:'Teknik belgeler ve kullanım rehberi',action:'openDocumentation',href:'/dokumantasyon.html'},
 {group:'ACCOUNT',icon:'⚙',name:'Ayarlar',desc:'Hesap ve uygulama tercihleri',action:'openSettingsModal'},
 {group:'ACCOUNT',icon:'◌',name:'Hesap bilgilerim',desc:'Profil, üyelik ve cihaz bilgileri',action:'openAccountInfo'}
];
var ROUTES = {
 openAethrionAlPanel:'/aethrion-assistant.html', openVizyonAlPanel:'/aethrion-assistant.html',
 openFullAIPanel:'/aethrion-ai.html', openAethrionAI:'/aethrion-ai.html', openKocPanel:'/aethrion-assistant.html',
 open3DBuilder:'/3d-studio.html', openA27ApiGuide:'/api.html', openV27ApiGuide:'/api.html',
 openA27ApiKeyGenerator:'/api.html#keys', createA27ApiKey:'/api.html#keys',
 openVideoEditor:'/index.html#features', openVideoStudio:'/index.html#features',
 openModelsShowcase:'/aethrion-ai.html#models', toggleTeamPage:'/topluluk.html',
 openContestPage:'/topluluk.html', scrollToAcademy:'/bana-ogret.html', openAcademy:'/bana-ogret.html',
 openDocumentation:'/dokumantasyon.html', openBlog:'/blog.html', openAbout:'/hakkimizda.html'
};
var splashDone = false;
var menuReady = false;
var welcomeReady = false;
function qs(sel, root) { return (root || document).querySelector(sel); }
function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]); }); }
function getAttr(user, key) {
 try { if (user && typeof user.get === 'function') return user.get(key) || ''; } catch (e) {}
 try { return user && user[key] || ''; } catch (e2) { return ''; }
}
function parseSavedUser() {
 try { return JSON.parse(localStorage.getItem('aethrion_user') || 'null'); } catch (e) { return null; }
}
function authUser() {
 try { if (window.currentUser) return window.currentUser; } catch (e) {}
 try { if (window.Parse && Parse.User && typeof Parse.User.current === 'function') { var u = Parse.User.current(); if (u) return u; } } catch (e2) {}
 if (document.body && document.body.classList.contains('logged-in-user')) return parseSavedUser();
 return null;
}
function userName() {
 var user = authUser();
 var name = getAttr(user, 'name') || getAttr(user, 'fullName') || getAttr(user, 'username');
 if (!name) name = [getAttr(user, 'firstName'), getAttr(user, 'lastName')].filter(Boolean).join(' ');
 if (!name) { var email = getAttr(user, 'email'); if (email) name = email.split('@')[0]; }
 if (!name) { var saved = parseSavedUser(); if (saved && saved.name) name = saved.name; }
 return String(name || 'Kullanıcı').trim();
}
function userRole() {
 var user = authUser(), role = getAttr(user, 'role') || 'user', plan = getAttr(user, 'plan');
 var roles = { founder:'Kurucu', admin:'Yönetici', moderator:'Moderatör / Tasarımcı', beta:'Beta üyesi', user:'Üye' };
 return (roles[String(role).toLowerCase()] || 'Üye') + (plan ? ' · ' + String(plan).toUpperCase() + ' plan' : '');
}
function getFeatures() {
 var source = Array.isArray(window.FEATURE_LIST) && window.FEATURE_LIST.length ? window.FEATURE_LIST : FALLBACK_FEATURES;
 var seen = Object.create(null), items = [];
 source.forEach(function (feature) {
  if (!feature || !(feature.name || feature.title)) return;
  var name = String(feature.name || feature.title);
  var action = String(feature.action || feature.onclick || '');
  var key = String(feature.group || 'OTHER') + '|' + name + '|' + action;
  if (seen[key]) return;
  seen[key] = true;
  items.push({
   group:String(feature.group || 'OTHER'), icon:String(feature.icon || '✦'),
   name:name, desc:String(feature.desc || feature.description || 'AETHRION çalışma alanını aç'),
   action:action, href:String(feature.href || feature.url || '')
  });
 });
 return items.length ? items : FALLBACK_FEATURES.slice();
}
function ensureDrawer() {
 var backdrop = qs('#aethrionExperienceBackdrop');
 if (!backdrop) {
  backdrop = document.createElement('div');
  backdrop.id = 'aethrionExperienceBackdrop';
  backdrop.addEventListener('click', closeDrawer);
  document.body.appendChild(backdrop);
 }
 var drawer = qs('#aethrionExperienceDrawer');
 if (!drawer) {
  drawer = document.createElement('aside');
  drawer.id = 'aethrionExperienceDrawer';
  drawer.setAttribute('aria-label', 'AETHRION özellikler menüsü');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML =
   '<div class="aed-head"><div class="aed-brand"><div class="aed-mark">A</div><div><h2 class="aed-title">AETHRION</h2><span class="aed-subtitle">Özellikler ve çalışma alanları</span></div></div><button class="aed-close" type="button" aria-label="Menüyü kapat">×</button></div>' +
   '<div class="aed-list" id="aedList"></div><div class="aed-foot">Seçilen özellik, kullanılabilir uygulama paneline veya ilgili sayfasına yönlendirir. Erişim bazı özelliklerde oturum ya da plana bağlı olabilir.</div>';
  qs('.aed-close', drawer).addEventListener('click', closeDrawer);
  document.body.appendChild(drawer);
 }
 menuReady = true;
 return drawer;
}
function renderDrawerItems(query) {
 var drawer = ensureDrawer(), list = qs('#aedList', drawer);
 var q = String(query || '').trim().toLocaleLowerCase('tr-TR');
 var items = getFeatures().filter(function (feature) {
  return !q || (feature.name + ' ' + feature.desc + ' ' + feature.group).toLocaleLowerCase('tr-TR').indexOf(q) !== -1;
 });
 var grouped = Object.create(null);
 items.forEach(function (feature) { (grouped[feature.group] || (grouped[feature.group] = [])).push(feature); });
 var html = '';
 Object.keys(grouped).forEach(function (group) {
  html += '<div class="aed-group-title">' + escapeHtml(GROUP_LABELS[group] || group) + '</div>';
  grouped[group].forEach(function (feature) {
   html += '<button type="button" class="aed-item" data-ae-action="' + escapeHtml(feature.action) + '" data-ae-name="' + escapeHtml(feature.name) + '" data-ae-href="' + escapeHtml(feature.href) + '">' +
    '<span class="aed-icon">' + escapeHtml(feature.icon) + '</span><span class="aed-item-text"><strong>' + escapeHtml(feature.name) + '</strong><small>' + escapeHtml(feature.desc) + '</small></span><span class="aed-chevron" aria-hidden="true">›</span></button>';
  });
 });
 list.innerHTML = html || '<div class="aed-empty">Bu aramayla eşleşen özellik bulunamadı.</div>';
}
function openDrawer() {
 var drawer = ensureDrawer(), backdrop = qs('#aethrionExperienceBackdrop');
 renderDrawerItems('');
 drawer.classList.add('open');
 drawer.setAttribute('aria-hidden', 'false');
 backdrop.classList.add('show');
 document.body.classList.add('aethrion-experience-menu-open');
}
function closeDrawer() {
 var drawer = qs('#aethrionExperienceDrawer'), backdrop = qs('#aethrionExperienceBackdrop');
 if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
 if (backdrop) backdrop.classList.remove('show');
 if (document.body) document.body.classList.remove('aethrion-experience-menu-open');
}
function ensureTrigger() {
 if (!document.body) return;
 if (document.body.classList.contains('ae-shell-on')) {
  qsa('#aethrionFeaturesTrigger').forEach(function(node){if(node.parentNode)node.parentNode.removeChild(node)});
  return;
 }
 var user = authUser();
 var logged = !!user || document.body.classList.contains('logged-in-user');
 var buttons = qsa('#aethrionFeaturesTrigger');
 var trigger = buttons[0] || null;
 buttons.slice(1).forEach(function (node) { node.remove(); });
 if (!trigger && logged) {
  trigger = document.createElement('button');
  trigger.id = 'aethrionFeaturesTrigger';
  trigger.type = 'button';
  trigger.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(trigger);
 }
 if (trigger) {
  trigger.type = 'button';
  trigger.title = 'AETHRION özellikler menüsünü aç';
  trigger.setAttribute('aria-label', 'AETHRION özellikler menüsünü aç');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.onclick = null;
  trigger.style.removeProperty('display');
 }
}
function showWelcome() {
 var user = authUser(), dashboard = qs('#dashboardArea');
 if (!user || !dashboard) return false;
 var wrapper = qs('.dashboard-content-wrapper', dashboard) || qs('.dashboard-content', dashboard) || dashboard;
 var welcome = qs('#aethrionExperienceWelcome');
 if (!welcome) {
  welcome = document.createElement('section');
  welcome.id = 'aethrionExperienceWelcome';
  welcome.setAttribute('aria-labelledby', 'aewName');
  wrapper.insertBefore(welcome, wrapper.firstChild);
 } else if (welcome.parentElement !== wrapper) wrapper.insertBefore(welcome, wrapper.firstChild);
 var name = userName(), role = userRole();
 welcome.innerHTML =
  '<div class="aew-eyebrow"><span class="aew-dot"></span> AETHRION · PERSONAL WORKSPACE</div>' +
  '<p class="aew-greeting">Oturumunuz başarıyla açıldı.</p>' +
  '<h1 class="aew-name" id="aewName">Hoş geldiniz,<br><em>' + escapeHtml(name) + '</em></h1>' +
  '<div class="aew-role">◈ ' + escapeHtml(role) + '</div>' +
  '<p class="aew-copy">AETHRION çalışma alanınız hazır. Yapay zekâ, üretim araçları, geliştirici belgeleri ve hesap hizmetleri tek bir merkezde.</p>' +
  '<div class="aew-grid">' +
   '<button type="button" class="aew-shortcut" data-ae-quick="menu"><span class="aew-shortcut-icon">⌘</span><span class="aew-shortcut-copy"><strong>Tüm özellikler</strong><small>Çalışma alanlarını görüntüleyin</small></span><span class="aew-shortcut-arrow">›</span></button>' +
   '<button type="button" class="aew-shortcut" data-ae-quick="ai"><span class="aew-shortcut-icon">✦</span><span class="aew-shortcut-copy"><strong>AETHRION AI</strong><small>Yapay zekâ araçlarını açın</small></span><span class="aew-shortcut-arrow">›</span></button>' +
   '<button type="button" class="aew-shortcut" data-ae-quick="api"><span class="aew-shortcut-icon">⌘</span><span class="aew-shortcut-copy"><strong>A27 API</strong><small>Geliştirici araçları ve belgeler</small></span><span class="aew-shortcut-arrow">›</span></button>' +
  '</div><div class="aew-actions"><button class="aew-primary" type="button" data-ae-quick="menu">Özellikleri keşfet <span aria-hidden="true">↗</span></button><button class="aew-secondary" type="button" data-ae-quick="account">Hesap bilgilerim</button></div>';
 welcome.style.display = 'block';
 document.body.classList.add('logged-in-user');
 document.body.classList.add('aethrion-experience-welcome-active');
 dashboard.style.setProperty('display', 'block', 'important');
 dashboard.style.setProperty('visibility', 'visible', 'important');
 dashboard.style.setProperty('opacity', '1', 'important');
 var main = qs('#mainSite');
 if (main) main.style.setProperty('display', 'none', 'important');
 Array.prototype.forEach.call(wrapper.children, function (el) {
  if (el === welcome) return;
  if (!el.hasAttribute('data-ae-display-saved')) {
   el.setAttribute('data-ae-display-saved', JSON.stringify({
    value:el.style.getPropertyValue('display'),
    priority:el.style.getPropertyPriority('display')
   }));
  }
  el.style.setProperty('display', 'none', 'important');
 });
 var nameEl = qs('#navbarAvatarName');
 if (nameEl) nameEl.textContent = name;
 var roleEl = qs('#dashboardUserName');
 if (roleEl) roleEl.textContent = name;
 ensureTrigger();
 welcomeReady = true;
 return true;
}
function leaveWelcome() {
 var welcome = qs('#aethrionExperienceWelcome');
 if (welcome) welcome.style.display = 'none';
 var wrapper = welcome && welcome.parentElement;
 if (wrapper) Array.prototype.forEach.call(wrapper.children, function (el) {
  if (el === welcome || !el.hasAttribute('data-ae-display-saved')) return;
  var previous = {};
  try { previous = JSON.parse(el.getAttribute('data-ae-display-saved') || '{}'); } catch (e) {}
  if (previous.value) el.style.setProperty('display', previous.value, previous.priority || '');
  else el.style.removeProperty('display');
  el.removeAttribute('data-ae-display-saved');
 });
 document.body.classList.remove('aethrion-experience-welcome-active');
}
function scrollToTarget(selectors) {
 for (var i = 0; i < selectors.length; i++) {
  var el = qs(selectors[i]);
  if (el) { leaveWelcome(); closeDrawer(); el.scrollIntoView({ behavior:'smooth', block:'start' }); return true; }
 }
 return false;
}
function runAction(action, name, href) {
 action = String(action || '');
 name = String(name || '');
 closeDrawer();
 if (action === 'goHome' || action === 'showWelcome' || action === 'renderWelcome') { showWelcome(); return; }
 if (action === 'doLogout') {
  if (typeof window.logout === 'function') { window.logout(); return; }
  try { if (window.Parse && Parse.User) { Parse.User.logOut().then(function () { location.reload(); }).catch(function () { location.reload(); }); return; } } catch (e) {}
  location.reload(); return;
 }
 leaveWelcome();
 if (href && href !== 'javascript:void(0)') { location.href = href; return; }
 if (action === 'scrollToAcademy' || /academy|akademi|öğren/i.test(name)) {
  if (scrollToTarget(['#academy','#academySection','#academy-section','#aethrionAcademy','#courseList'])) return;
 }
 if (action === 'scrollToProjects' || /proje/i.test(name)) {
  if (scrollToTarget(['#projects','#projectsSection','#myProjects','#projects-section','#projectsList'])) return;
 }
 if (action === 'scrollToImageGen' || /görsel üret|image gen/i.test(name)) {
  if (scrollToTarget(['#imageGen','#imageGeneration','#image-generator','#imageGenSection','#imagePrompt'])) return;
 }
 var aliases = {
  openAethrionAlPanel:['openAethrionAlPanel','openVizyonAlPanel','openAethrionAI'],
  openVizyonAlPanel:['openVizyonAlPanel','openAethrionAlPanel'],
  openFullAIPanel:['openFullAIPanel','openAethrionAI'],
  openKocPanel:['openKocPanel','openAethrionCoach','openCoachPanel'],
  open3DBuilder:['open3DBuilder','open3DStudio','open3DStudioPanel'],
  openA27ApiGuide:['openA27ApiGuide','openV27ApiGuide'],
  openA27ApiKeyGenerator:['openA27ApiKeyGenerator','createA27ApiKey'],
  openVideoEditor:['openVideoEditor','openVideoEditorModal'],
  openVideoStudio:['openVideoStudio','openVideoStudioModal'],
  openModelsShowcase:['openModelsShowcase','showModelsShowcase'],
  toggleTeamPage:['toggleTeamPage','openTeamPage'],
  openContestPage:['openContestPage','toggleContestPage']
 };
 var candidates = aliases[action] || [action], fn = null;
 for (var i = 0; i < candidates.length; i++) {
  if (candidates[i] && typeof window[candidates[i]] === 'function' &&
      window[candidates[i]] !== runAction && window[candidates[i]] !== openDrawer) {
   fn = window[candidates[i]]; break;
  }
 }
 if (fn) {
  try {
   var result = fn.call(window);
   if (result && typeof result.then === 'function') result.catch(function (error) {
    console.error('[AETHRION] Özellik başlatılamadı:', error);
    fallbackAction(action, name);
   });
   return;
  } catch (error) { console.error('[AETHRION] Özellik başlatılamadı:', error); }
 }
 fallbackAction(action, name);
}
function fallbackAction(action, name) {
 var route = ROUTES[action] || '';
 if (!route) {
  if (/3d|üç boyut/i.test(name)) route = '/3d-studio.html';
  else if (/api|anahtar/i.test(name)) route = '/api.html';
  else if (/coach|koç|asistan/i.test(name)) route = '/aethrion-assistant.html';
  else if (/ai|yapay zekâ|yapay zeka|model/i.test(name)) route = '/aethrion-ai.html';
  else if (/topluluk|takım|community/i.test(name)) route = '/topluluk.html';
  else if (/video/i.test(name)) route = '/index.html#features';
  else if (/blog/i.test(name)) route = '/blog.html';
  else if (/doküman|belge/i.test(name)) route = '/dokumantasyon.html';
 }
 if (route) { location.href = route; return; }
 if (typeof window.showNotification === 'function') window.showNotification('Bu özelliğin açılış noktası bulunamadı. Lütfen özelliğin bağlantısını kontrol edin.', 'warning');
 else console.warn('[AETHRION] Özellik yönlendirmesi bulunamadı:', action, name);
}
function installClickRouter() {
 if (document.body && document.body.hasAttribute('data-ae-router-installed')) return;
 document.body.setAttribute('data-ae-router-installed', 'true');
 document.addEventListener('click', function (event) {
  var target = event.target && event.target.closest ? event.target.closest('button,a,[role="button"]') : null;
  if (!target) return;
  if (target.closest('#aethrionExperienceDrawer')) {
   var item = target.closest('[data-ae-action]');
   if (item) {
    event.preventDefault(); event.stopImmediatePropagation();
    runAction(item.getAttribute('data-ae-action'), item.getAttribute('data-ae-name'), item.getAttribute('data-ae-href'));
   }
   return;
  }
  var quick = target.getAttribute('data-ae-quick');
  if (quick) {
   event.preventDefault(); event.stopImmediatePropagation();
   if (quick === 'menu') openDrawer();
   else if (quick === 'ai') runAction('openFullAIPanel', 'AETHRION AI');
   else if (quick === 'api') { location.href = '/api.html'; }
   else if (quick === 'account') {
    if (typeof window.openAccountInfo === 'function') window.openAccountInfo();
    else runAction('openAccountInfo', 'Hesap bilgilerim');
   }
   return;
  }
  if (target.id === 'aethrionFeaturesTrigger' || target.id === 'aethrionFeaturesButton' ||
      target.hasAttribute('data-aethrion-features-trigger')) {
   event.preventDefault(); event.stopImmediatePropagation(); openDrawer(); return;
  }
  var text = ((target.innerText || target.textContent || '') + ' ' +
   (target.getAttribute('aria-label') || '') + ' ' + (target.getAttribute('title') || '')).toLocaleLowerCase('tr-TR');
  if (document.body.classList.contains('logged-in-user') &&
      /özellikler menüsü|özellikler paneli|tüm özellikler|features menu|feature menu/.test(text)) {
   event.preventDefault(); event.stopImmediatePropagation(); openDrawer();
  }
 }, true);
 document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeDrawer(); });
}
function initSplash() {
 var splash = qs('#splashScreen');
 if (!splash || splashDone) return;
 splashDone = true;
 var exiting = false;
 function forceVisible() {
  if (exiting) return;
  splash.classList.remove('hide', 'hidden', 'aethrion-splash-exit');
  if (splash.style.getPropertyValue('display') !== 'flex' || splash.style.getPropertyPriority('display') !== 'important') splash.style.setProperty('display', 'flex', 'important');
  if (splash.style.getPropertyValue('visibility') !== 'visible' || splash.style.getPropertyPriority('visibility') !== 'important') splash.style.setProperty('visibility', 'visible', 'important');
  if (splash.style.getPropertyValue('opacity') !== '1' || splash.style.getPropertyPriority('opacity') !== 'important') splash.style.setProperty('opacity', '1', 'important');
  splash.style.setProperty('pointer-events', 'auto', 'important');
 }
 forceVisible();
 var observer = null;
 if (window.MutationObserver) {
  observer = new MutationObserver(function () {
   if (exiting) return;
   if (splash.classList.contains('hide') || splash.classList.contains('hidden') || splash.style.getPropertyValue('display') === 'none' || splash.style.getPropertyValue('visibility') === 'hidden') forceVisible();
  });
  observer.observe(splash, { attributes:true, attributeFilter:['class','style'] });
 }
 var status = qs('#splashStatus'), stage = qs('#splashStage'), percent = qs('#splashPercent'), bar = qs('#splashProgressBar'), ready = qs('#splashReady');
 var start = (window.performance && performance.now) ? performance.now() : Date.now();
 function tick(now) {
  if (exiting) return;
  var t = Math.min(1, ((now || Date.now()) - start) / 2450);
  var p = Math.round((1 - Math.pow(1 - t, 2.2)) * 100);
  if (percent) percent.textContent = p + '%';
  if (bar) bar.style.width = p + '%';
  var label = p < 24 ? 'AETHRION ARAYÜZÜ BAŞLATILIYOR' : p < 52 ? 'ÇALIŞMA ALANI HAZIRLANIYOR' : p < 80 ? 'GÜVENLİK VE TERCİHLER KONTROL EDİLİYOR' : p < 100 ? 'SON DÜZENLEMELER UYGULANIYOR' : 'ARAYÜZ HAZIR';
  if (status) status.textContent = label;
  if (stage) stage.textContent = label;
  if (ready) ready.textContent = p < 100 ? 'AETHRION ÇALIŞMA ALANI HAZIRLANIYOR' : 'AETHRION · INTELLIGENCE WITHOUT LIMITS';
  if (t < 1) window.requestAnimationFrame(tick);
 }
 window.requestAnimationFrame(tick);
 window.setTimeout(function () {
  exiting = true;
  if (observer) observer.disconnect();
  splash.classList.remove('hide', 'hidden');
  splash.classList.add('aethrion-splash-exit');
  splash.style.setProperty('opacity', '0', 'important');
  splash.style.setProperty('visibility', 'hidden', 'important');
  splash.style.setProperty('pointer-events', 'none', 'important');
 }, 2850);
}
function wrapDashboard() {
 var original = window.showDashboard;
 if (typeof original !== 'function' || original.__aeWrapped) return;
 var wrapped = function () {
  var result = original.apply(this, arguments);
  function finish() { setTimeout(function () { if (authUser()) showWelcome(); }, 160); }
  if (result && typeof result.then === 'function') result.then(finish, finish);
  else finish();
  return result;
 };
 wrapped.__aeWrapped = true;
 wrapped.__aeOriginal = original;
 window.showDashboard = wrapped;
}
function applyOverrides() {
 /* Workspace v6 owns the authenticated dashboard: never let this legacy drawer/router overwrite it. */
 if (document.body && document.body.classList.contains('ae-shell-on')) {
  qsa('#aethrionFeaturesTrigger,#aethrionFeaturesButton,#aethrionFeaturesPanel,#aethrionExperienceDrawer,#aethrionExperienceBackdrop').forEach(function(node){if(node.parentNode)node.parentNode.removeChild(node)});
  return;
 }
 window.openAethrionFeaturesPanel = openDrawer;
 window.closeAethrionFeaturesPanel = closeDrawer;
 window.toggleAethrionFeaturesPanel = function () {
  var panel = qs('#aethrionExperienceDrawer');
  if (panel && panel.classList.contains('open')) closeDrawer(); else openDrawer();
 };
 window.toggleAethrionSidebar = window.toggleAethrionFeaturesPanel;
 window.closeAethrionSidebar = closeDrawer;
 window.safeFeatureCall = runAction;
 window.showWelcomeScreen = showWelcome;
 window.showWelcome = showWelcome;
 window.renderWelcome = showWelcome;
 window.goHome = showWelcome;
 wrapDashboard();
 ensureDrawer();
 ensureTrigger();
}
function observeSession() {
 var lastLogged = document.body.classList.contains('logged-in-user');
 function maybeWelcome() {
  if (!authUser()) return;
  var dash = qs('#dashboardArea');
  if (!dash) return;
  window.setTimeout(function () { if (authUser()) showWelcome(); }, 220);
 }
 if (window.MutationObserver) {
  var observer = new MutationObserver(function (records) {
   records.forEach(function (record) {
    if (record.type === 'attributes' && record.target === document.body && record.attributeName === 'class') {
     var logged = document.body.classList.contains('logged-in-user');
     if (logged && !lastLogged) maybeWelcome();
     lastLogged = logged;
    }
    if (record.type === 'childList') {
     Array.prototype.forEach.call(record.addedNodes || [], function (node) {
      if (node.nodeType === Node.ELEMENT_NODE && (node.id === 'dashboardArea' || (node.querySelector && node.querySelector('#dashboardArea')))) maybeWelcome();
     });
    }
   });
  });
  observer.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['class'] });
 }
}
function start() {
 applyOverrides();
 installClickRouter();
 initSplash();
 observeSession();
 var attempts = 0;
 function restoreSession() {
  attempts++;
  if (authUser()) { showWelcome(); applyOverrides(); return; }
  if (attempts < 8) setTimeout(restoreSession, Math.min(750 * attempts, 3000));
 }
 setTimeout(restoreSession, 500);
 [500,1200,2100,3300,4800,6200].forEach(function (delay) {
  setTimeout(function () { applyOverrides(); ensureTrigger(); }, delay);
 });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
else start();
window.addEventListener('load', function () {
 [100,700,1700,3200].forEach(function (delay) {
  setTimeout(function () { applyOverrides(); ensureTrigger(); if (authUser()) showWelcome(); }, delay);
 });
});

/* AETHRION Workspace shell loader — ensure the persistent sidebar is mounted. */
function loadWorkspaceShell() {
 try {
  function ensureCss(id, href) {
   if (document.getElementById(id) || document.querySelector('link[href*="' + href + '"]')) return;
   var link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; link.href = '/' + href; document.head.appendChild(link);
  }
  ensureCss('aethrionWorkspaceV5Css','aethrion-workspace-v5.css');
  ensureCss('aethrionWorkspaceV6Css','aethrion-workspace-v6.css');
  function loadV6() {
   if (document.querySelector('script[src*="aethrion-workspace-v6.js"]')) return;
   var v6 = document.createElement('script'); v6.id = 'aethrionWorkspaceV6Script'; v6.src = '/aethrion-workspace-v6.js'; v6.async = true; document.head.appendChild(v6);
  }
  var core = document.querySelector('script[src*="aethrion-workspace-v5.js"]');
  if (!core) {
   core = document.createElement('script'); core.id = 'aethrionWorkspaceV5Script'; core.src = '/aethrion-workspace-v5.js'; core.async = false;
   core.addEventListener('load', loadV6, {once:true}); document.head.appendChild(core);
  } else if (window.__aewsClicks) {
   loadV6();
  } else {
   core.addEventListener('load', loadV6, {once:true});
   window.setTimeout(loadV6, 900);
  }
 } catch (error) { console.error('[AETHRION] Çalışma alanı menüsü yüklenemedi:', error); }
}
loadWorkspaceShell();
})();

/* ===== aethrion-file-tools.js ===== */
/* AETHRION universal AI file preparation: image/PDF/media + UTF-8 text + DOCX/XLSX extraction. */
(function () {
  'use strict';
  var MAX_BYTES = 8 * 1024 * 1024;
  var scriptLoads = Object.create(null);

  function loadScript(url, ready) {
    if (ready()) return Promise.resolve();
    if (scriptLoads[url]) return scriptLoads[url];
    scriptLoads[url] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = function () { ready() ? resolve() : reject(new Error('Dosya çözümleme kütüphanesi yüklenemedi.')); };
      script.onerror = function () { delete scriptLoads[url]; reject(new Error('Dosya çözümleme kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.')); };
      document.head.appendChild(script);
    });
    return scriptLoads[url];
  }

  function base64FromBytes(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, bytes.length)));
    }
    return btoa(binary);
  }

  async function fileToBase64(file) {
    var dataUrl = await new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Dosya okunamadı.')); };
      reader.readAsDataURL(file);
    });
    var comma = dataUrl.indexOf(',');
    if (comma < 0) throw new Error('Dosya içeriği okunamadı.');
    return dataUrl.slice(comma + 1);
  }

  async function officeText(file, extension) {
    if (extension === 'docx') {
      await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js', function () { return !!window.mammoth; });
      var doc = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return String(doc && doc.value || '');
    }
    if (extension === 'xlsx' || extension === 'xls') {
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', function () { return !!window.XLSX; });
      var workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      return workbook.SheetNames.map(function (name) {
        return 'Sayfa: ' + name + '\n' + window.XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
      }).join('\n\n').slice(0, 15000);
    }
    throw new Error('Bu dosya türü doğrudan okunamıyor. DOCX, XLSX/XLS, PDF, görsel, metin veya kod dosyası kullanın.');
  }

  async function prepareFile(file) {
    if (!file) throw new Error('Önce bir dosya seçin.');
    if (file.size > MAX_BYTES) throw new Error('Dosya en fazla 8 MB olabilir.');
    var name = String(file.name || 'dosya').slice(0, 180);
    var extMatch = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
    var ext = extMatch ? extMatch[1] : '';
    var type = String(file.type || '').toLowerCase();
    if (!type) { if (ext === 'pdf') type = 'application/pdf'; else if (/^(mp3|wav|ogg|m4a|aac)$/.test(ext)) type = 'audio/' + ext; else if (/^(mp4|mov|avi|mkv|webm)$/.test(ext)) type = 'video/' + ext; }
    if (type.indexOf('image/') === 0 || type === 'application/pdf' || type.indexOf('audio/') === 0 || type.indexOf('video/') === 0 || ext === 'pdf') {
      return { fileBase64: await fileToBase64(file), fileName: name, fileType: type || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream') };
    }

    var text = '';
    if (ext === 'docx' || ext === 'xlsx' || ext === 'xls') {
      text = await officeText(file, ext);
    } else if (/^(txt|md|csv|json|js|ts|jsx|tsx|py|html|css|xml|ya?ml|log|sql|sh|c|cpp|h|java|php|rb|go|rs|ipynb)$/i.test(ext) || type.indexOf('text/') === 0 || /^(application\/(json|xml|javascript|x-javascript))$/.test(type)) {
      text = await file.text();
    } else {
      throw new Error('Bu dosya türü henüz desteklenmiyor. Görsel, PDF, ses/video, DOCX, XLSX/XLS, TXT, MD, CSV, JSON veya kod dosyası kullanın.');
    }
    text = String(text || '').replace(/\u0000/g, '').slice(0, 15000);
    if (!text.trim()) throw new Error('Dosyadan okunabilir metin çıkarılamadı.');
    var bytes = new TextEncoder().encode('Dosya: ' + name + '\n\n' + text);
    return { fileBase64: base64FromBytes(bytes), fileName: name, fileType: 'text/plain' };
  }

  window.aethrionPrepareFileForAI = prepareFile;
})();

/* ===== aethrion-auth-recovery.js ===== */
/* AETHRION auth recovery — single dispatcher, reliable overlay stacking, no competing handlers. */
(function () {
  'use strict';
  var busy = Object.create(null);
  var overlay = null;
  var statusNode = null;
  var progressNode = null;

  function notify(message, type) {
    try {
      if (typeof window.showNotification === 'function') window.showNotification(message, type || 'error');
      else console.warn('[AETHRION Auth]', message);
    } catch (e) { console.warn('[AETHRION Auth]', message); }
  }

  function installStyles() {
    if (document.getElementById('aethrion-auth-recovery-styles')) return;
    var style = document.createElement('style');
    style.id = 'aethrion-auth-recovery-styles';
    style.textContent = [
      '#authModal,#socialAuthTermsModal,#profileCompletionModal,#recoveryLoginModal{z-index:2147483001!important;pointer-events:auto!important}',
      '#authModal input,#authModal button,#authModal label,#authModal a{pointer-events:auto!important}',
      '#authModal input.form-input{position:relative;z-index:1;pointer-events:auto!important;touch-action:manipulation;user-select:text;-webkit-user-select:text;caret-color:currentColor}',
      '#aeAuthProgressOverlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:none!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(3,8,18,.78)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;pointer-events:auto!important}',
      '#aeAuthProgressOverlay.is-visible{display:flex!important}',
      '#aeAuthProgressOverlay .ae-auth-progress-card{width:min(440px,100%);padding:28px;border:1px solid rgba(212,175,55,.45);border-radius:24px;background:#0a1221;color:#f7f9fc;box-shadow:0 24px 90px rgba(0,0,0,.55);text-align:center;font-family:Inter,system-ui,sans-serif}',
      '#aeAuthProgressOverlay .ae-auth-progress-brand{font-weight:800;letter-spacing:.22em;color:#e4ca83;margin-bottom:24px}',
      '#aeAuthProgressOverlay .ae-auth-progress-track{height:5px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin:18px 0}',
      '#aeAuthProgressOverlay .ae-auth-progress-track-fill{display:block;width:8%;height:100%;border-radius:99px;background:linear-gradient(90deg,#d4af37,#8b7cff);transition:width .35s ease}',
      '#aeAuthProgressOverlay .ae-auth-progress-status{color:#c4ccda;line-height:1.6;margin:0}',
      '#aeAuthProgressOverlay .ae-auth-progress-foot{display:block;margin-top:20px;font-size:10px;letter-spacing:.16em;color:#8c98ac}',
      '.ae-auth-busy{opacity:.8!important;cursor:wait!important}',
      '@media(prefers-reduced-motion:reduce){#aeAuthProgressOverlay .ae-auth-progress-track-fill{transition:none!important}}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureOverlay() {
    if (overlay && overlay.isConnected) return overlay;
    overlay = document.getElementById('aeAuthProgressOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'aeAuthProgressOverlay';
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      overlay.innerHTML = '<div class="ae-auth-progress-card"><div class="ae-auth-progress-brand">AETHRION</div><div class="ae-auth-progress-track"><span class="ae-auth-progress-track-fill"></span></div><h2 class="ae-auth-progress-title">Güvenli işlem</h2><p class="ae-auth-progress-status">Lütfen bekleyin…</p><span class="ae-auth-progress-foot">SECURE ACCOUNT</span></div>';
      document.body.appendChild(overlay);
    }
    // Keep the progress layer in the top-level stacking context and above the auth modal.
    if (document.body && overlay.parentNode !== document.body) document.body.appendChild(overlay);
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '2147483647';
    overlay.style.inset = '0';
    var authModal = document.getElementById('authModal');
    if (authModal) authModal.style.zIndex = '2147483001';
    statusNode = overlay.querySelector('.ae-auth-progress-status');
    progressNode = overlay.querySelector('.ae-auth-progress-track-fill');
    return overlay;
  }

  function showProgress(message) {
    var el = ensureOverlay();
    // Re-append before showing so no later-created modal can paint over progress.
    if (document.body && el.parentNode !== document.body) document.body.appendChild(el);
    el.style.zIndex = '2147483647';
    el.classList.add('is-visible');
    if (statusNode) statusNode.textContent = message;
    if (progressNode) { progressNode.style.width = '8%'; window.requestAnimationFrame(function () { if (progressNode) progressNode.style.width = '72%'; }); }
  }

  function hideProgress(success) {
    if (!overlay) return;
    if (success && statusNode) statusNode.textContent = 'İşlem tamamlandı.';
    if (progressNode) progressNode.style.width = success ? '100%' : '8%';
    window.setTimeout(function () {
      if (overlay) overlay.classList.remove('is-visible');
      if (progressNode) progressNode.style.width = '8%';
    }, success ? 220 : 0);
  }

  async function ensureParseReady() {
    if (!window.Parse || !window.Parse.User) throw new Error('Kimlik doğrulama bileşeni yüklenemedi. Sayfayı yenileyip tekrar deneyin.');
    if (window.parseInitialized || window.Parse.applicationId) return true;
    if (typeof window.initBack4app !== 'function') throw new Error('Sunucu bağlantısı henüz hazır değil.');
    var result = await window.initBack4app();
    if (result === false || (!window.parseInitialized && !window.Parse.applicationId)) throw new Error('Back4App bağlantısı başlatılamadı.');
    return true;
  }

  function resolveAction(kind) {
    if (kind === 'register') return { fn: window.handleRegister, label: 'Kayıt', message: 'Hesabınız oluşturuluyor…' };
    if (kind === 'login') return { fn: window.handleLogin, label: 'Giriş', message: 'Kimlik bilgileriniz doğrulanıyor…' };
    if (kind === 'verify') return { fn: window.verifyAccount, label: 'Doğrulama', message: 'Doğrulama kodu kontrol ediliyor…' };
    return null;
  }

  async function runAction(kind, button) {
    var action = resolveAction(kind);
    if (!action || typeof action.fn !== 'function') {
      notify('Kimlik doğrulama işlevi yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'error');
      return false;
    }
    if (busy[kind]) return false;
    busy[kind] = true;
    var oldText = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.classList.add('ae-auth-busy');
      button.textContent = action.message;
    }
    showProgress(action.message);
    var timeoutId;
    try {
      await ensureParseReady();
      var task = Promise.resolve().then(function () { return action.fn.call(button || window); });
      var timeout = new Promise(function (_, reject) {
        timeoutId = window.setTimeout(function () { reject(new Error('Kimlik doğrulama 35 saniye içinde tamamlanmadı. Sunucu yanıt vermedi veya sağlayıcı ayarı eksik. Tekrar deneyin; sorun sürerse Back4App Cloud Code günlüklerini kontrol edin.')); }, 35000);
      });
      var result = await Promise.race([task, timeout]);
      hideProgress(result === true);
      return result !== false;
    } catch (error) {
      console.error('[AETHRION Auth]', kind, error);
      hideProgress(false);
      notify(action.label + ' işlemi tamamlanamadı: ' + (error && error.message ? error.message : 'Bilinmeyen hata'), 'error');
      return false;
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      busy[kind] = false;
      if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.classList.remove('ae-auth-busy');
        button.textContent = oldText;
      }
    }
  }

  function actionForTarget(target) {
    if (!target || !target.closest) return null;
    var button = target.closest('#formRegister .btn-primary');
    if (button) return { kind: 'register', button: button };
    button = target.closest('#formLogin .btn-primary');
    if (button) return { kind: 'login', button: button };
    button = target.closest('#formVerify button[onclick*="verifyAccount"]');
    if (button) return { kind: 'verify', button: button };
    return null;
  }

  function prepareFields() {
    [
      ['rName', 'text', 'name'], ['rEmail', 'email', 'email'], ['rUsername', 'text', 'username'],
      ['rPass', 'password', 'new-password'], ['rPass2', 'password', 'new-password'],
      ['lEmail', 'email', 'username'], ['lPass', 'password', 'current-password'],
      ['verifyEmail', 'email', 'email'], ['verifyCode', 'text', 'one-time-code']
    ].forEach(function (item) {
      var field = document.getElementById(item[0]);
      if (!field) return;
      field.type = item[1];
      field.autocomplete = item[2];
      field.disabled = false;
      field.readOnly = false;
      field.style.pointerEvents = 'auto';
      if (item[1] === 'email') {
        field.inputMode = 'email';
        field.autocapitalize = 'none';
        field.spellcheck = false;
      }
    });
  }

  function boot() {
    installStyles();
    prepareFields();
    ensureOverlay();
    var auth = document.getElementById('authModal');
    if (auth && auth.parentElement !== document.body) document.body.appendChild(auth);
    ['socialAuthTermsModal', 'profileCompletionModal', 'recoveryLoginModal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.parentElement !== document.body) document.body.appendChild(el);
    });
  }

  /* One click path only: prevents the previous stack of competing click guards and busy overlays. */
  document.addEventListener('click', function (event) {
    var found = actionForTarget(event.target);
    if (!found) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    runAction(found.kind, found.button);
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' || !event.target || event.target.id !== 'lPass') return;
    event.preventDefault();
    var button = document.querySelector('#formLogin .btn-primary');
    if (button && !button.disabled) runAction('login', button);
  }, true);

  window.__aethrionSafeAuthAction = function (kind, button) {
    return runAction(kind, button || document.querySelector(kind === 'register' ? '#formRegister .btn-primary' : '#formLogin .btn-primary'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.addEventListener('load', prepareFields, { once: true });
})();

/* ===== aethrion-jarvis.js ===== */
(function(){
'use strict';
if(window.__aethrionJarvisMounted)return;window.__aethrionJarvisMounted=true;
var mode='normal',recognition=null,listening=false,busy=false,selectedFile=null;
function node(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function status(text,state){var s=document.getElementById('aeJvStatus');if(s){s.textContent=text;s.dataset.state=state||'idle';}}
function message(role,text){var list=document.getElementById('aeJvMessages');if(!list)return;var box=node('div','ae-jv-message ae-jv-'+role);box.appendChild(node('span','ae-jv-label',role==='user'?'SİZ':'AETHRION'));box.appendChild(node('p','ae-jv-body',text));list.appendChild(box);list.scrollTop=list.scrollHeight;}
function stopVoice(){if(recognition){try{recognition.stop();}catch(e){}}listening=false;var b=document.getElementById('aeJvMic');if(b){b.textContent='🎙️';b.classList.remove('is-listening');}}
function speak(text){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang=(navigator.language||'tr-TR').toLowerCase().indexOf('en')===0?'en-US':'tr-TR';window.speechSynthesis.speak(u);}
function init(){
if(!document.querySelector('#mainSite,#splashScreen,#dashboard,#mainDashboard')||document.getElementById('aeJvLauncher'))return;
var css=document.createElement('link');css.rel='stylesheet';css.href='/aethrion-jarvis.css?v=20261022-1';document.head.appendChild(css);
var launcher=node('button','ae-jv-launcher');launcher.type='button';launcher.setAttribute('aria-controls','aeJvPanel');launcher.setAttribute('aria-expanded','false');launcher.innerHTML='<span class="ae-jv-orb">A</span><span><b>AETHRION</b><small>AI · JARVIS</small></span>';
var panel=node('section','ae-jv-panel');panel.id='aeJvPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','aeJvTitle');
panel.innerHTML='<header class="ae-jv-head"><div><small>AETHRION INTELLIGENCE</small><h2 id="aeJvTitle">Sesli asistan</h2><p>Metin ve sesli sohbet</p></div><button id="aeJvClose" type="button" aria-label="Kapat">×</button></header><div class="ae-jv-modes"><button type="button" data-mode="normal" class="active" aria-pressed="true">AETHRION AI<small>Normal sohbet</small></button><button type="button" data-mode="agent" aria-pressed="false">AETHRION JARVIS<small>Görev asistanı</small></button></div><p id="aeJvNotice" class="ae-jv-notice">Mikrofon yalnızca ses düğmesine bastığında etkinleşir. Mesajın AI hizmetine gönderilebilir.</p><div id="aeJvStatus" class="ae-jv-status" role="status" aria-live="polite">Hazır. Mesajını yaz veya sesle konuş.</div><div id="aeJvMessages" class="ae-jv-messages"><div class="ae-jv-message ae-jv-assistant"><span class="ae-jv-label">AETHRION</span><p class="ae-jv-body">Merhaba! AETHRION AI ile sohbet edebilir veya JARVIS görev modunu seçebilirsin.</p></div></div><form id="aeJvForm" class="ae-jv-form"><textarea id="aeJvInput" maxlength="4000" rows="2" placeholder="Mesajını yaz…" aria-label="Mesajın"></textarea><div class="ae-jv-actions"><input id="aeJvFileInput" type="file" accept="image/*,application/pdf,audio/*,video/*,.docx,.xlsx,.xls,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.xml,.yaml,.yml,.log" hidden><button id="aeJvAttach" type="button" aria-label="Dosya ekle" title="Dosya ekle">📎 Dosya</button><button id="aeJvMic" type="button" aria-label="Sesle konuş">🎙️</button><span id="aeJvFileLabel">Yanıtları önemli konularda doğrula.</span><button id="aeJvSend" type="submit">Gönder ↗</button></div></form><footer>AETHRION · Intelligence Without Limits</footer>';
document.body.appendChild(launcher);document.body.appendChild(panel);
launcher.addEventListener('click',function(){panel.hidden=!panel.hidden;launcher.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)document.getElementById('aeJvInput').focus();});
document.getElementById('aeJvClose').addEventListener('click',function(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');stopVoice();if(window.speechSynthesis)window.speechSynthesis.cancel();});
panel.querySelectorAll('[data-mode]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.mode==='agent'?'agent':'normal';panel.querySelectorAll('[data-mode]').forEach(function(x){x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});document.getElementById('aeJvNotice').textContent=mode==='agent'?'JARVIS görev modu: sohbet ve planlama kullanılabilir. Bilgisayar kontrolü, ekran akışı ve gerçek araç yürütme için ayrı backend entegrasyonu gerekir.':'Mikrofon yalnızca ses düğmesine bastığında etkinleşir. Mesajın AI hizmetine gönderilebilir.';});});
document.getElementById('aeJvMic').addEventListener('click',function(){
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){status('Bu tarayıcı ses tanımayı desteklemiyor; mesajını yazabilirsin.','error');return;}if(listening){stopVoice();return;}
recognition=new SR();recognition.lang=(navigator.language||'tr-TR').toLowerCase().indexOf('en')===0?'en-US':'tr-TR';recognition.interimResults=false;recognition.continuous=false;
recognition.onstart=function(){listening=true;var b=document.getElementById('aeJvMic');b.textContent='⏹';b.classList.add('is-listening');status('Dinliyorum…','listening');};
recognition.onresult=function(e){var t=e.results&&e.results[0]&&e.results[0][0]?e.results[0][0].transcript:'';var input=document.getElementById('aeJvInput');if(input&&t){input.value=t;send();}};
recognition.onerror=function(e){status(e.error==='not-allowed'?'Mikrofon izni verilmedi. Mesajını yazabilirsin.':'Ses tanınamadı; tekrar dene veya yaz.','error');};recognition.onend=stopVoice;try{recognition.start();}catch(e){status('Mikrofon başlatılamadı.','error');}
});

document.getElementById('aeJvAttach').addEventListener('click',function(){document.getElementById('aeJvFileInput').click();});
document.getElementById('aeJvFileInput').addEventListener('change',function(){
 var f=this.files&&this.files[0];if(!f){selectedFile=null;return;}
 if(f.size>8*1024*1024){status('Dosya en fazla 8 MB olabilir.','error');this.value='';selectedFile=null;return;}
 var allowed=/^(image\/|application\/pdf|audio\/|video\/|text\/|application\/json)/i.test(f.type)||/\.(docx|xlsx|xls|txt|md|csv|json|js|ts|py|html|css|xml|ya?ml|log)$/i.test(f.name);
 if(!allowed){status('Bu dosya türü desteklenmiyor. Görsel, PDF, ses/video, DOCX, XLSX, metin veya kod dosyası seç.','error');this.value='';selectedFile=null;return;}
 selectedFile=f;var label=document.getElementById('aeJvFileLabel');if(label)label.textContent='📎 '+f.name;
 status('Dosya eklendi. Gönder’e basınca AETHRION AI dosyayı analiz edecek.','success');
});

document.getElementById('aeJvForm').addEventListener('submit',function(e){e.preventDefault();send();});
}

/* Browser-safe local tools: timers, reminders, date/time. OS-level actions require a trusted desktop companion. */
var reminderStorageKey='aethrion_jarvis_reminders';
function readReminders(){try{var v=JSON.parse(localStorage.getItem(reminderStorageKey)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
function writeReminders(items){try{localStorage.setItem(reminderStorageKey,JSON.stringify(items.slice(-100)))}catch(e){status('Hatırlatıcılar bu tarayıcıda kaydedilemedi.','error')}}
function notifyLocal(title,body){
  if('Notification' in window&&Notification.permission==='granted'){try{new Notification(title,{body:body,tag:'aethrion-jarvis-'+Date.now()})}catch(e){}}
  message('assistant',body);status(body,'success');speak(body);
}
function requestReminderPermission(){
  if(!('Notification' in window)||Notification.permission!=='default')return;
  try{Notification.requestPermission()}catch(e){}
}
function checkDueReminders(){
  var now=Date.now(),items=readReminders(),remaining=[],changed=false;
  items.forEach(function(item){if(item&&Number(item.dueAt)<=now){notifyLocal('AETHRION JARVIS',item.text||'Hatırlatıcın var.');changed=true}else if(item&&Number(item.dueAt)>now)remaining.push(item)});
  if(changed)writeReminders(remaining);
}
function durationFrom(text){
  var m=String(text).match(/(\d{1,6})\s*(saniye|saniyelik|sn|dakika|dk|saat|sa|hour|hours|minute|minutes|second|seconds)/i);
  if(!m)return null;var n=Number(m[1]),unit=m[2].toLowerCase();if(!Number.isFinite(n)||n<1)return null;
  var multiplier=/^(saniye|saniyelik|sn|second|seconds)$/.test(unit)?1000:/^(dakika|dk|minute|minutes)$/.test(unit)?60000:3600000;
  var ms=n*multiplier;return ms>0&&ms<=86400000?{ms:ms,label:m[0]}:null;
}
function handleLocalCommand(raw){
  var text=String(raw||'').trim(),low=text.toLocaleLowerCase('tr-TR');
  if(/^(saat kaç|saat kac|şu an saat kaç|su an saat kac|what time is it)\??$/.test(low)){
    notifyLocal('AETHRION JARVIS','Şu an saat '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})+'.');return true;
  }
  if(/^(bugün tarih ne|bugun tarih ne|bugünün tarihi ne|bugunun tarihi ne|tarih kaç|tarih kac|what is today's date)\??$/.test(low)){
    notifyLocal('AETHRION JARVIS','Bugünün tarihi '+new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'.');return true;
  }
  if(/(zamanlayıcı|zamanlayici|timer|geri sayım|geri sayim)/i.test(text)){
    var d=durationFrom(text);if(!d){message('assistant','Zamanlayıcı için süre belirt. Örnek: “5 dakika zamanlayıcı başlat”.');status('Süre bekleniyor.','idle');return true;}
    var label='Zamanlayıcı tamamlandı ('+d.label+').';status(d.label+' için zamanlayıcı başladı.','success');message('assistant',d.label+' için zamanlayıcı başlatıldı.');
    window.setTimeout(function(){notifyLocal('AETHRION JARVIS',label)},Math.min(d.ms,2147483647));return true;
  }
  if(/hatırlat|hatirlat|hatırlatıcı|hatirlatici|remind me/i.test(text)){
    var d2=durationFrom(text),items=readReminders();
    if(!d2){message('assistant','Hatırlatıcı için süre belirt. Örnek: “10 dakika sonra su içmeyi hatırlat”.');status('Hatırlatıcı için süre bekleniyor.','idle');return true;}
    var reminderText=text
      .replace(/hatırlatıcı|hatirlatici|hatırlat|hatirlat|remind me/ig,'')
      .replace(/\d{1,6}\s*(saniye|saniyelik|sn|dakika|dk|saat|sa|hour|hours|minute|minutes|second|seconds)/ig,'')
      .replace(/sonra|in/ig,'').replace(/^[\s:,-]+|[\s:,-]+$/g,'').trim();
    if(!reminderText)reminderText='Planladığın işi yap';
    items.push({id:String(Date.now()),text:reminderText,dueAt:Date.now()+d2.ms});writeReminders(items);requestReminderPermission();
    var due=new Date(Date.now()+d2.ms).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    message('assistant','Hatırlatıcı kuruldu: “'+reminderText+'” — yaklaşık '+due+'. Sayfa açıkken kontrol edilir.');status('Hatırlatıcı kaydedildi.','success');return true;
  }
  return false;
}

async function send(){
if(busy)return;var input=document.getElementById('aeJvInput'),button=document.getElementById('aeJvSend'),text=input?input.value.trim():'';if(!text&&!selectedFile)return;
if(!selectedFile&&handleLocalCommand(text)){input.value='';return;}
var P=window.Parse;if(!P||!P.Cloud||typeof P.Cloud.run!=='function'){status('AI bağlantısı hazır değil; bu modül ana uygulamadaki Parse bağlantısını gerektirir.','error');return;}
if(!P.User||!P.User.current||!P.User.current()){status('Önce AETHRION hesabına giriş yap.','error');return;}
busy=true;input.value='';button.disabled=true;message('user',text);status(mode==='agent'?'JARVIS görevi değerlendiriyor…':'AETHRION AI yanıt hazırlıyor…','busy');
try{
var answer='';
if(selectedFile){
 var file=selectedFile;
 if(!text)text='Bu dosyayı oku, özetle ve önemli noktalarını açıkla.';
 message('user','📎 '+file.name+(text?' — '+text:''));
 var prepared=typeof window.aethrionPrepareFileForAI==='function'?await window.aethrionPrepareFileForAI(file):null;
 if(!prepared){var dataUrl=await new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(String(reader.result||''))};reader.onerror=function(){reject(new Error('Dosya okunamadı.'))};reader.readAsDataURL(file)});var base64=dataUrl.split(',')[1];if(!base64)throw new Error('Dosya içeriği okunamadı.');prepared={fileBase64:base64,fileName:file.name,fileType:file.type||'application/octet-stream'};}
 status('Dosya AI tarafından analiz ediliyor…','busy');
 var fr=await P.Cloud.run('vizyonAlFileAnalyze',{fileBase64:prepared.fileBase64,fileName:prepared.fileName||file.name,fileType:prepared.fileType||file.type||'application/octet-stream',question:text});
 if(!fr||fr.success!==true)throw new Error(fr&&fr.error||'Dosya analizi tamamlanamadı.');
 answer=fr.reply||'Dosya analiz edildi ancak metin yanıtı dönmedi.';
 selectedFile=null;var fi=document.getElementById('aeJvFileInput');if(fi)fi.value='';var fl=document.getElementById('aeJvFileLabel');if(fl)fl.textContent='Yanıtları önemli konularda doğrula.';
}else{
 message('user',text);
 var r=await P.Cloud.run('vizyonAlChat',{message:text,mode:mode});answer=typeof r==='string'?r:r&&(r.reply||r.response||r.text||r.message);if(!answer&&r&&r.success===false)throw new Error(r.error||'AI isteği başarısız oldu.');answer=answer||'AI yanıt döndürmedi. Daha sonra tekrar dene.';
}
message('assistant',String(answer));status('Yanıt hazır.','success');speak(String(answer));
}
catch(e){message('assistant','İstek tamamlanamadı. Bağlantıyı veya AI hizmetini kontrol edip tekrar dene.');status(String(e&&e.message||e||'Bilinmeyen hata').slice(0,180),'error');}
finally{busy=false;button.disabled=false;input.focus();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
checkDueReminders();window.setInterval(checkDueReminders,15000);window.addEventListener('focus',checkDueReminders);
})();

/* ===== aethrion-workspace-v5.js ===== */
(function(){'use strict';
var CORE=[
['YAPAY ZEKÂ','✦','AETHRION AI','Birleşik yapay zekâ çalışma alanı','openFullAIPanel','/aethrion-ai.html'],['YAPAY ZEKÂ','◈','AETHRION Agents','Ajanlar, ekran ve dosya araçları','openAethrionAlPanel','/aethrion-assistant.html'],['YAPAY ZEKÂ','◎','AETHRION Coach','Kişisel yapay zekâ koçu','openKocPanel','/aethrion-assistant.html'],['YAPAY ZEKÂ','◉','Model Kataloğu','Tanımlı modelleri incele','openModelsShowcase','/aethrion-ai.html#models'],['ÜRETİM','◇','3D Studio','Üç boyutlu tasarım alanı','open3DBuilder','/3d-studio.html'],['ÜRETİM','▶','Video Editör','Video düzenleme araçları','openVideoEditor','/index.html#features'],['ÜRETİM','▣','Video Stüdyosu','Video üretim çalışma alanı','openVideoStudio','/index.html#features'],['ÜRETİM','▧','Görsel Üretimi','Görsel üretim alanı','scrollToImageGen','/index.html#features'],['ÜRETİM','⌘','Kod Editörü','Kod geliştirme araçları','openCodeEditor','/kod-editoru.html'],['PLATFORM','◇','Topluluk','Topluluk ve takımlar','toggleTeamPage','/topluluk.html'],['PLATFORM','▤','Projelerim','Projeler ve kayıtlar','scrollToProjects',''],['PLATFORM','✎','Akademi','Öğrenme alanı','openAcademy','/bana-ogret.html'],['GELİŞTİRİCİ','⌘','A27 API','API anahtarları ve erişim','openA27ApiKeyGenerator','/api.html#keys'],['GELİŞTİRİCİ','↗','API Belgeleri','Geliştirici rehberi','openA27ApiGuide','/api.html'],['GELİŞTİRİCİ','▥','Dokümantasyon','Teknik rehberler','openDocumentation','/dokumantasyon.html'],['HESAP','⚙','Ayarlar','Uygulama tercihleri','openSettingsModal',''],['HESAP','◌','Hesap bilgilerim','Profil ve hesap ayrıntıları','openAccountInfo',''],['HESAP','↪','Oturumu kapat','Güvenli çıkış','doLogout','']];
function q(s,r){return(r||document).querySelector(s)}function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function logged(){try{return!!((window.Parse&&Parse.User&&Parse.User.current())||window.currentUser||document.body.classList.contains('logged-in-user'))}catch(e){return document.body.classList.contains('logged-in-user')}}
function uname(){try{var u=window.currentUser||(window.Parse&&Parse.User&&Parse.User.current());return(u&&(u.get('name')||u.get('username_display')||u.get('email')))||'AETHRION Üyesi'}catch(e){return'AETHRION Üyesi'}}
function features(){var out=CORE.slice(),src=Array.isArray(window.FEATURE_LIST)?window.FEATURE_LIST:[];src.forEach(function(x){if(!x)return;var n=String(x.name||x.title||'');if(!n||out.some(function(a){return a[2].toLocaleLowerCase('tr-TR')===n.toLocaleLowerCase('tr-TR')}))return;out.push([String(x.group||'DİĞER'),String(x.icon||'✦'),n,String(x.desc||x.description||'Çalışma alanını aç'),String(x.action||x.onclick||''),String(x.href||x.url||'')])});return out}
function navRender(filter){
var nav=q('#aewsNav');if(!nav)return;
var f=String(filter||'').toLocaleLowerCase('tr-TR'),groups={};
features().forEach(function(a){if((a[2]+' '+a[3]+' '+a[0]).toLocaleLowerCase('tr-TR').indexOf(f)<0)return;(groups[a[0]]||(groups[a[0]]=[])).push(a)});
var labels={CORE:'YAPAY ZEKÂ',CREATE:'ÜRETİM ARAÇLARI',PLATFORM:'PLATFORM',ADVANCED:'GELİŞTİRİCİ ARAÇLARI',ACCOUNT:'HESAP',OTHER:'DİĞER ÖZELLİKLER',AI:'YAPAY ZEKÂ',TOOLS:'ÜRETİM ARAÇLARI',DEVELOPER:'GELİŞTİRİCİ ARAÇLARI'};
var preferred=['YAPAY ZEKÂ','YAPAY ZEKA','ÜRETİM','ÜRETİM ARAÇLARI','PLATFORM','GELİŞTİRİCİ','GELİŞTİRİCİ ARAÇLARI','HESAP','DİĞER','DİĞER ÖZELLİKLER'];
var collapsed=window.__aewsCollapsedGroups||(window.__aewsCollapsedGroups={});
var keys=Object.keys(groups).sort(function(a,b){var aa=preferred.indexOf(a.toLocaleUpperCase('tr-TR'));var bb=preferred.indexOf(b.toLocaleUpperCase('tr-TR'));if(aa<0)aa=999;if(bb<0)bb=999;return aa-bb||a.localeCompare(b,'tr')});
var html='<div class="aews-section">ÇALIŞMA ALANI</div><button class="aews-link is-active" type="button" data-aews-home><span class="aews-icon">⌂</span><span>Ana ekran</span></button><button class="aews-link" type="button" data-aews-back><span class="aews-icon">←</span><span>Geri dön</span></button>';
keys.forEach(function(g){
 var groupName=labels[g]||g;
 var isOpen=!!f||(Object.prototype.hasOwnProperty.call(collapsed,g)?!collapsed[g]:(g==='YAPAY ZEKÂ'||g==='YAPAY ZEKA'));
 html+='<button class="aews-section aews-section-toggle" type="button" data-aews-group-toggle="'+esc(g)+'" aria-expanded="'+String(isOpen)+'"><span>'+esc(groupName)+'</span><span class="aews-section-meta"><span class="aews-group-count">'+groups[g].length+'</span><span class="aews-group-chevron">'+(isOpen?'⌄':'›')+'</span></span></button>';
 html+='<div class="aews-group-items" data-aews-group-items="'+esc(g)+'"'+(isOpen?'':' hidden')+'>';
 groups[g].forEach(function(a){html+='<button type="button" class="aews-link" data-aews-feature="'+esc(a[2])+'" aria-label="'+esc(a[2])+' aç"><span class="aews-icon">'+esc(a[1])+'</span><span>'+esc(a[2])+'</span></button>'});
 html+='</div>';
});
nav.innerHTML=html;
Array.prototype.forEach.call(nav.querySelectorAll('[data-aews-group-toggle]'),function(btn){
 btn.addEventListener('click',function(){
  var g=btn.getAttribute('data-aews-group-toggle'),items=Array.prototype.slice.call(nav.querySelectorAll('[data-aews-group-items]')).filter(function(el){return el.getAttribute('data-aews-group-items')===g})[0];
  if(!items)return;
  var open=items.hidden;
  if(String(filter||'').trim())return;
  items.hidden=!open;collapsed[g]=!open;btn.setAttribute('aria-expanded',String(open));
  var icon=btn.querySelector('.aews-group-chevron');if(icon)icon.textContent=open?'⌄':'›';
 });
});
}function sidebar(){var existing=q('#aeWorkspaceSidebar');if(existing&&q('#aewsNav',existing))return;if(existing)existing.remove();var oldToggle=q('#aewsMobileToggle');if(oldToggle)oldToggle.remove();var oldShade=q('#aewsMobileShade');if(oldShade)oldShade.remove();var shade=document.createElement('div');shade.id='aewsMobileShade';shade.setAttribute('aria-hidden','true');shade.onclick=function(){document.body.classList.remove('aews-nav-open')};document.body.appendChild(shade);var toggle=document.createElement('button');toggle.id='aewsMobileToggle';toggle.type='button';toggle.setAttribute('aria-label','Yan menüyü aç');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰';toggle.onclick=function(){var open=document.body.classList.toggle('aews-nav-open');toggle.setAttribute('aria-expanded',String(open))};document.body.appendChild(toggle);var s=document.createElement('aside');s.id='aeWorkspaceSidebar';s.setAttribute('aria-label','AETHRION çalışma alanı menüsü');s.innerHTML='<div class="aews-brand"><div class="aews-logo">A</div><div><strong>AETHRION</strong><small>INTELLIGENCE WITHOUT LIMITS</small></div><button class="aews-close" type="button" aria-label="Menüyü kapat">×</button></div><nav class="aews-nav" id="aewsNav"></nav><div class="aews-footer"><div class="aews-avatar" id="aewsAvatar">A</div><div class="aews-user"><strong id="aewsUserName">AETHRION Üyesi</strong><small>Güvenli çalışma alanı</small></div></div>';document.body.appendChild(s);var close=q('.aews-close',s);if(close)close.onclick=function(){document.body.classList.remove('aews-nav-open');toggle.setAttribute('aria-expanded','false')};navRender('')}
function active(label){Array.prototype.forEach.call(document.querySelectorAll('.aews-link'),function(b){b.classList.toggle('is-active',b.hasAttribute('data-aews-home')?label==='Ana ekran':b.getAttribute('data-aews-feature')===label)})}
function welcome(){if(!logged())return;document.body.classList.add('ae-shell-on','aews-home-view');document.body.classList.remove('aews-feature-view','aews-nav-open');sidebar();var w=q('#aethrionExperienceWelcome');if(w){var grid=q('.aew-grid',w),actions=q('.aew-actions',w);if(grid)grid.remove();if(actions)actions.remove();var g=q('.aew-greeting',w),c=q('.aew-copy',w),t=q('.aew-name',w);if(g)g.textContent='Kişisel çalışma alanınız hazır.';if(c)c.textContent='Yapay zekâ, üretim ve geliştirici araçlarına sol menüden ulaşın. Her özellik kendi çalışma alanında açılır.';if(t)t.innerHTML='Hoş geldiniz,<br><em>'+esc(uname())+'</em>';if(!q('.aews-home-cta',w)){var note=document.createElement('div');note.className='aews-home-cta';note.textContent='Çalışma alanınızı sol menüden seçin  →';w.appendChild(note)}}var un=q('#aewsUserName'),av=q('#aewsAvatar');if(un)un.textContent=uname();if(av)av.textContent=uname().slice(0,1).toUpperCase();var main=q('#mainSite');if(main)main.style.setProperty('display','none','important')}
function home(){document.body.classList.remove('aews-nav-open','aews-feature-view');document.body.classList.add('aews-home-view');if(typeof window.showWelcome==='function'&&!window.showWelcome.__aewsWrap)window.showWelcome();welcome();active('Ana ekran')}
function findMatchingControl(label){var nodes=document.querySelectorAll('button,a,[role="button"],[data-action],[onclick]');var wanted=String(label||'').toLocaleLowerCase('tr-TR');for(var i=0;i<nodes.length;i++){var n=nodes[i];if(n.closest('#aeWorkspaceSidebar'))continue;var txt=(n.innerText||n.textContent||'').trim().toLocaleLowerCase('tr-TR');if(txt&&((txt===wanted)||(txt.indexOf(wanted)>=0&&txt.length<100))&&(n.hasAttribute('onclick')||n.hasAttribute('data-action')||n.getAttribute('role')==='button'||n.tagName==='BUTTON'))return n}return null}
function callAction(action,label){var aliases={openKocPanel:['openKocPanel','openCoachPanel','openAethrionCoach','openKocOverlay'],openAethrionAlPanel:['openAethrionAlPanel','openAethrionAssistant','openAethrionAgents','openAssistantPanel'],openFullAIPanel:['openFullAIPanel','openAethrionAI','openAIAssistant'],openModelsShowcase:['openModelsShowcase','showModelsShowcase'],open3DBuilder:['open3DBuilder','open3DStudio'],openVideoEditor:['openVideoEditor','openVideoStudio'],openVideoStudio:['openVideoStudio','openVideoEditor'],scrollToImageGen:['scrollToImageGen','openImageGenerator'],openCodeEditor:['openCodeEditor','openKodEditor'],toggleTeamPage:['toggleTeamPage','openCommunityPage'],scrollToProjects:['scrollToProjects','openProjects'],openAcademy:['openAcademy','openAethrionAcademy'],openA27ApiKeyGenerator:['openA27ApiKeyGenerator','openApiKeyGenerator'],openA27ApiGuide:['openA27ApiGuide','openApiDocs'],openDocumentation:['openDocumentation','openDocs'],openSettingsModal:['openSettingsModal','openSettings'],openAccountInfo:['openAccountInfo','openProfile']};var list=aliases[action]||[action];for(var i=0;i<list.length;i++){var fn=window[list[i]];if(typeof fn==='function'){fn();return true}}if(typeof window.safeFeatureCall==='function'){try{var safeResult=window.safeFeatureCall(action,label,'');if(safeResult===true)return true;if(safeResult===false||safeResult===undefined)return false;return true}catch(e){}}var match=findMatchingControl(label);if(match){try{match.click();return true}catch(e){}}return false}
function openFeature(label){var f=features().filter(function(a){return a[2]===label})[0];if(!f)return;document.body.classList.remove('aews-nav-open','aews-home-view');document.body.classList.add('aews-feature-view');active(label);var toggle=q('#aewsMobileToggle');if(toggle)toggle.setAttribute('aria-expanded','false');if(f[4]==='doLogout'){if(typeof window.logout==='function'){window.logout();return}if(window.Parse&&Parse.User){Parse.User.logOut().then(function(){location.reload()}).catch(function(){location.reload()});return}location.href='/';return}if(/^scrollTo/.test(f[4])){var main=q('#mainSite');if(main)main.style.removeProperty('display')}var ok=callAction(f[4],f[2]);if(!ok&&f[5]){location.href=f[5];return}if(!ok&&typeof window.showNotification==='function')window.showNotification('Bu özellik henüz bağlanmamış. Lütfen geliştirici bağlantısını kontrol edin.','warning')}
function goBack(){document.body.classList.remove('aews-nav-open');var toggle=q('#aewsMobileToggle');if(toggle)toggle.setAttribute('aria-expanded','false');var dialogs=document.querySelectorAll('[aria-modal="true"],[role="dialog"],.modal-overlay,.modal.show,#kocPanelOverlay,#vizyonAlPanel,#aethrionAiPanel');for(var i=dialogs.length-1;i>=0;i--){var d=dialogs[i];if(d.closest('#aeWorkspaceSidebar'))continue;var st=window.getComputedStyle(d);if(st.display==='none'||st.visibility==='hidden'||st.opacity==='0')continue;var close=d.querySelector('[data-dismiss],[data-bs-dismiss],.modal-close,.close-modal,.close-btn,[aria-label*="kapat" i],[aria-label*="close" i],button[title*="kapat" i],button[title*="close" i]');if(close){close.click();return}d.classList.remove('show','active','open');d.style.setProperty('display','none','important');d.setAttribute('aria-hidden','true');return}if(document.body.classList.contains('aews-feature-view')){home();return}if(window.history&&window.history.length>1){window.history.back()}else{home()}}
function wire(){sidebar();if(!window.__aewsClicks){window.__aewsClicks=true;document.addEventListener('click',function(e){var h=e.target.closest&&e.target.closest('[data-aews-home]');if(h){e.preventDefault();home();return}var back=e.target.closest&&e.target.closest('[data-aews-back]');if(back){e.preventDefault();goBack();return}var f=e.target.closest&&e.target.closest('[data-aews-feature]');if(f){e.preventDefault();openFeature(f.getAttribute('data-aews-feature'))}});document.addEventListener('click',function(e){var n=e.target.closest&&e.target.closest('[data-aews-back],.aethrion-back-button,.btn-back,[data-action="back"],[onclick*="history.back"],[onclick*="goBack"]');if(n&&!n.closest('#aeWorkspaceSidebar')){e.preventDefault();e.stopImmediatePropagation();goBack()}},true);document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('aews-nav-open')){document.body.classList.remove('aews-nav-open');var t=q('#aewsMobileToggle');if(t)t.setAttribute('aria-expanded','false')}})}var old=window.showWelcome;if(typeof old==='function'&&!old.__aewsWrap){var wrapped=function(){if(document.body.classList.contains('aews-feature-view'))return false;var result=old.apply(this,arguments);setTimeout(function(){if(!document.body.classList.contains('aews-feature-view'))welcome()},0);return result};wrapped.__aewsWrap=true;window.showWelcome=wrapped;window.showWelcomeScreen=wrapped;window.renderWelcome=wrapped;window.goHome=wrapped}if(logged()&&!document.body.classList.contains('aews-feature-view'))welcome()}
})();

/* ===== aethrion-workspace-v6.js ===== */
/* AETHRION Workspace v6 — one welcome screen, one full-height feature rail */
(function(){
'use strict';
var fallback={
'AETHRION AI':['openFullAIPanel','/aethrion-ai.html'],
'AETHRION Agents':['openAethrionAlPanel','/aethrion-assistant.html'],
'AETHRION Coach':['openKocPanel','/aethrion-assistant.html'],
'Model Kataloğu':['openModelsShowcase','/aethrion-ai.html#models'],
'3D Studio':['open3DBuilder','/3d-studio.html'],
'Video Editör':['openVideoEditor',''],
'Video Stüdyosu':['openVideoStudio',''],
'Görsel Üretimi':['scrollToImageGen',''],
'Kod Editörü':['openCodeEditor','/kod-editoru.html'],
'Topluluk':['toggleTeamPage','/topluluk.html'],
'Projelerim':['scrollToProjects',''],
'Akademi':['openAcademy','/bana-ogret.html'],
'A27 API':['openA27ApiKeyGenerator','/api.html#keys'],
'API Belgeleri':['openA27ApiGuide','/api.html'],
'Dokümantasyon':['openDocumentation','/dokumantasyon.html'],
'Ayarlar':['openSettingsModal',''],
'Hesap bilgilerim':['openAccountInfo',''],
'Oturumu kapat':['doLogout','']
};
function q(s,r){return(r||document).querySelector(s)}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function logged(){try{return!!((window.Parse&&Parse.User&&Parse.User.current())||window.currentUser||(document.body&&document.body.classList.contains('logged-in-user')))}catch(e){return!!(document.body&&document.body.classList.contains('logged-in-user'))}}
function userName(){try{var u=window.currentUser||(window.Parse&&Parse.User&&Parse.User.current());if(u&&typeof u.get==='function')return u.get('name')||u.get('username_display')||(u.get('email')||'').split('@')[0]||'Üye'}catch(e){}try{var v=JSON.parse(localStorage.getItem('aethrion_user')||'null');return v&&(v.name||v.username)||'Üye'}catch(e){return'Üye'}}
function feature(label){var list=Array.isArray(window.FEATURE_LIST)?window.FEATURE_LIST:[];for(var i=0;i<list.length;i++){var f=list[i];if(f&&String(f.name||f.title||'')===label)return{action:String(f.action||f.onclick||''),href:String(f.href||f.url||'')};}var v=fallback[label]||['',''];return{action:v[0],href:v[1]}}
function setActive(label){qa('.aews-link').forEach(function(b){var home=b.hasAttribute('data-aews-home');b.classList.toggle('is-active',home?label==='Ana ekran':b.getAttribute('data-aews-feature')===label)})}
function hideTrigger(){['#aethrionFeaturesTrigger','#aethrionFeaturesButton','#aethrionExperienceDrawer','#aethrionExperienceBackdrop','#aethrionFeaturesPanel','#aethrionFeaturesBackdrop','#aethrionWelcomeScreen','.aethrion-sidebar','.aethrion-sidebar-toggle','.aethrion-sidebar-backdrop'].forEach(function(s){qa(s).forEach(function(el){if(el.id==='aeWorkspaceSidebar'||el.id==='aewsMobileToggle'||el.id==='aewsMobileShade')return;if(el.parentNode)el.parentNode.removeChild(el)})})}
function customWelcome(){
 if(!logged()||document.body.classList.contains('aews-feature-view'))return;
 document.body.classList.add('ae-shell-on','logged-in-user');
 var w=q('#aethrionExperienceWelcome'),dash=q('#dashboardArea');
 if(!w||!dash)return;
 var name=String(userName()).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
 var title=q('.aew-name',w);
 if(!w.dataset.aeV6Built){
  w.innerHTML='<div class="aew-eyebrow"><span class="aew-dot"></span>AETHRION · PERSONAL WORKSPACE</div><p class="aew-greeting">Çalışma alanınıza hoş geldiniz.</p><h1 class="aew-name" id="aewName">Hoş geldiniz,<br><em>'+name+'</em></h1><div class="aew-role">◈ Kişisel çalışma alanı</div><p class="aew-copy">Yapay zekâ, üretim araçları ve geliştirici kaynaklarınız tek bir düzenli çalışma alanında. Başlamak için soldaki menüden bir özellik seçin.</p><div class="aew-v6-hint"><b>⌘</b><span><strong>Çalışma alanları</strong><br>İhtiyacınız olan aracı sol menüden açın. Ana ekranınız sade kalır.</span></div>';
  w.dataset.aeV6Built='1';
 }else if(title){title.innerHTML='Hoş geldiniz,<br><em>'+name+'</em>'}
 qa('.aew-grid,.aew-actions,.aews-home-cta',w).forEach(function(el){el.remove()});
 var wrap=q('.dashboard-content-wrapper',dash)||q('.dashboard-content',dash)||dash;
 Array.prototype.forEach.call(wrap.children,function(el){if(el===w)return;if(el.id==='aethrionWorkspaceStage'){el.style.setProperty('display','none','important');return}if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));el.style.setProperty('display','none','important')});
 w.style.setProperty('display','flex','important');
 var main=q('#mainSite');if(main)main.style.setProperty('display','none','important');
 var n=q('#aewsUserName');if(n)n.textContent=userName();
 var av=q('#aewsAvatar');if(av)av.textContent=userName().slice(0,1).toUpperCase();
 hideTrigger();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="/aethrion-mark.svg" alt="AETHRION" draggable="false">';
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function stageHost(){
 var w=q('#aethrionExperienceWelcome'),wrap=w&&(q('.dashboard-content-wrapper')||q('.dashboard-content')||w.parentElement);
 if(!wrap)return null;
 var stage=q('#aethrionWorkspaceStage');
 if(!stage){stage=document.createElement('section');stage.id='aethrionWorkspaceStage';stage.className='ae-ws-stage';wrap.appendChild(stage)}
 return {stage:stage,wrap:wrap,w:w};
}
function isolateStage(){
 var h=stageHost();if(!h)return;
 h.w.style.setProperty('display','none','important');
 Array.prototype.forEach.call(h.wrap.children,function(el){
  if(el===h.stage){el.style.setProperty('display','flex','important');return}
  if(el===h.w){el.style.setProperty('display','none','important');return}
  if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));
  el.style.setProperty('display','none','important');
 });
}
function showStage(label,desc,href){
 var h=stageHost();if(!h)return;
 var safeHref=String(href||'');
 var isFrame=!!safeHref&&safeHref.charAt(0)==='/'&&safeHref!=='/index.html#features'&&safeHref!=='#features';
 var detail=desc||'Bu çalışma alanı seçiminiz için hazırlandı.';
 h.stage.innerHTML='<div class="ae-ws-stage-head"><div><div class="ae-ws-stage-kicker">AETHRION WORKSPACE</div><h2>'+esc(label)+'</h2><p>'+esc(detail)+'</p></div>'+(isFrame?'<a class="ae-ws-open-tab" href="'+esc(safeHref)+'" target="_blank" rel="noopener noreferrer">Yeni sekmede aç ↗</a>':'<span class="ae-ws-stage-state"><i></i> Çalışma alanı</span>')+'</div>'+(isFrame?'<iframe class="ae-ws-stage-frame" title="'+esc(label)+'" src="'+esc(safeHref)+'" loading="eager" allow="microphone; camera; clipboard-read; clipboard-write; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>':'<div class="ae-ws-stage-empty"><div class="ae-ws-stage-emblem">A</div><h3>'+esc(label)+'</h3><p>Bu özellik uygulama paneli üzerinden açılır. Açılan paneli kapattığınızda sol menüden başka bir çalışma alanına geçebilir veya Ana ekran’a dönebilirsiniz.</p></div>');
 h.stage.style.setProperty('display','flex','important');
 var frame=q('.ae-ws-stage-frame',h.stage);
 if(frame)frame.addEventListener('load',function(){try{var d=frame.contentDocument;if(!d)return;var st=d.createElement('style');st.textContent='html,body{min-height:100%!important;background:#f5f8fc!important;color:#172b43!important}body{padding:0 0 20px!important;overflow-x:hidden!important}#aeWorkspaceSidebar,#aewsMobileToggle,#aewsMobileShade,#aethrionWorkspaceSidebar,#aethrionWorkspaceMobileToggle,#aethrionWorkspaceScrim{display:none!important}body.ae-shell-on #mainSite{display:block!important}body.ae-shell-on #dashboardArea{width:100%!important;max-width:none!important;margin:0!important;padding:12px!important}body.ae-shell-on #dashboardArea .dashboard-content-wrapper{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}.navbar,.top-nav,.main-nav,header.site-header,.site-header,footer,.site-footer{box-shadow:none!important}';d.head.appendChild(st)}catch(e){}},{once:true});
 isolateStage();
}
function goBack(){var selectors='[aria-modal="true"],[role="dialog"],.modal-overlay,.modal.show,#kocPanelOverlay,#vizyonAlPanel,#aethrionAiPanel';var list=qa(selectors);for(var i=list.length-1;i>=0;i--){var el=list[i];var st=window.getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden'||st.opacity==='0')continue;var close=q('[data-dismiss],[data-bs-dismiss],.modal-close,.close-modal,.close-btn,[aria-label*="kapat" i],[aria-label*="close" i]',el);if(close){close.click();return}el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true');return}home()}
function home(){document.body.classList.remove('aews-nav-open','aews-feature-view');var stage=q('#aethrionWorkspaceStage');if(stage)stage.style.setProperty('display','none','important');if(typeof window.showWelcome==='function')window.showWelcome();setTimeout(customWelcome,35);setActive('Ana ekran')}
function openFeature(label){
 var f=feature(label);document.body.classList.remove('aews-nav-open');setActive(label);
 if(label==='Oturumu kapat'){if(typeof window.logout==='function')return window.logout();if(window.Parse&&Parse.User)return Parse.User.logOut().then(function(){location.reload()});location.reload();return}
 var desc=(Array.isArray(window.FEATURE_LIST)?window.FEATURE_LIST:[]).filter(function(x){return x&&String(x.name||x.title||'')===label})[0];
 desc=desc&&String(desc.desc||desc.description||'')||'Bu özellik AETHRION çalışma alanı üzerinden kullanılabilir.';
 if(f.href&&f.href!=='/index.html#features'&&f.href!=='#features'){document.body.classList.add('aews-feature-view');showStage(label,'Özelliğin çalışma alanı açılıyor.',f.href);return}
 if(/^scrollTo/.test(f.action||'')){
  document.body.classList.remove('aews-feature-view');var stage=q('#aethrionWorkspaceStage');if(stage)stage.style.setProperty('display','none','important');
  var main=q('#mainSite');if(main)main.style.removeProperty('display');
  var dash=q('#dashboardArea');if(dash)dash.style.removeProperty('display');
  if(typeof window.safeFeatureCall==='function')window.safeFeatureCall(f.action,label,'');else if(typeof window[f.action]==='function')window[f.action]();
  return;
 }
 if(f.action&&typeof window.safeFeatureCall==='function'){
  document.body.classList.remove('aews-feature-view');var stage2=q('#aethrionWorkspaceStage');if(stage2)stage2.style.setProperty('display','none','important');
  window.safeFeatureCall(f.action,label,'');
  return;
 }
 if(f.action&&typeof window[f.action]==='function'){
  document.body.classList.remove('aews-feature-view');var stage3=q('#aethrionWorkspaceStage');if(stage3)stage3.style.setProperty('display','none','important');
  window[f.action]();return;
 }
 document.body.classList.add('aews-feature-view');showStage(label,desc,'');
 if(typeof window.showNotification==='function')window.showNotification('Bu özellik için doğrudan açılış bağlantısı tanımlanmamış.','warning');
}
function installRouter(){
 if(document.body.dataset.aeV6Router==='1')return;document.body.dataset.aeV6Router='1';
 document.addEventListener('click',function(e){
  var backBtn=e.target.closest&&e.target.closest('[data-aews-back]');
  if(backBtn){e.preventDefault();e.stopImmediatePropagation();goBack();return}
  var homeBtn=e.target.closest&&e.target.closest('[data-aews-home]');
  if(homeBtn){e.preventDefault();e.stopImmediatePropagation();home();return}
  var featureBtn=e.target.closest&&e.target.closest('[data-aews-feature]');
  if(featureBtn){e.preventDefault();e.stopImmediatePropagation();openFeature(featureBtn.getAttribute('data-aews-feature'))}
 },true);
}
function patchWelcome(){
 if(typeof window.showWelcome==='function'&&!window.showWelcome.__aeV6Wrapped){
  var original=window.showWelcome;
  var wrapped=function(){if(document.body.classList.contains('aews-feature-view'))return false;var r=original.apply(this,arguments);setTimeout(function(){if(!document.body.classList.contains('aews-feature-view'))customWelcome()},35);return r};
  wrapped.__aeV6Wrapped=true;wrapped.__aeV6Original=original;window.showWelcome=wrapped;
  window.showWelcomeScreen=wrapped;window.renderWelcome=wrapped;window.goHome=wrapped;
 }
}
function overlayIsVisible(el){
 if(!el)return false;var s=window.getComputedStyle(el);
 return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&el.getAttribute('aria-hidden')!=='true';
}
function syncOverlayState(){
 var selectors=['#fullAIPanel','#kocPanelOverlay','#vizyonAlPanel','#aethrionAlPanel','#full3DBuilder','#videoEditorOverlay','#voiceChatFullscreen','#vzVoiceFullscreen','.modal-overlay.open'];
 var active=selectors.some(function(sel){return qa(sel).some(overlayIsVisible)});
 document.body.classList.toggle('ae-overlay-active',active);
}
function restoreWorkspaceAfterClose(){
 if(!logged()||overlayStillOpen())return;
 document.body.classList.remove('aews-feature-view','aews-nav-open');
 document.body.classList.add('ae-shell-on','logged-in-user','aews-home-view');
 var dash=q('#dashboardArea'),main=q('#mainSite'),stage=q('#aethrionWorkspaceStage');
 if(dash){dash.style.setProperty('display','block','important');dash.style.setProperty('visibility','visible','important')}
 if(main)main.style.setProperty('display','none','important');
 if(stage)stage.style.setProperty('display','none','important');
 customWelcome();syncOverlayState();
}
function overlayStillOpen(){
 var selectors=['#fullAIPanel','#kocPanelOverlay','#vizyonAlPanel','#aethrionAlPanel','#full3DBuilder','#videoEditorOverlay','#voiceChatFullscreen','#vzVoiceFullscreen','.modal-overlay.open'];
 return selectors.some(function(sel){return qa(sel).some(overlayIsVisible)});
}
function installCloseRecovery(){
 ['closeFullAIPanel','closeAethrionAlPanel','closeVizyonAlPanel','closeKocPanel','close3DBuilder','closeVideoEditor','closeVideoStudio','closeVoiceChatFullscreen','closeVizyonAlScreenRead','closeAethrionAiPanel'].forEach(function(name){
  var original=window[name];if(typeof original!=='function'||original.__aeV6CloseWrapped)return;
  var wrapped=function(){var result=original.apply(this,arguments);setTimeout(restoreWorkspaceAfterClose,90);return result};
  wrapped.__aeV6CloseWrapped=true;wrapped.__aeV6Original=original;window[name]=wrapped;
 });
}
function repairWorkspaceSurface(){
 if(!logged()||!document.body.classList.contains('ae-shell-on'))return;
 var sidebars=qa('#aeWorkspaceSidebar');
 if(sidebars.length>1)sidebars.slice(1).forEach(function(node){if(node.parentNode)node.parentNode.removeChild(node)});
 var sidebar=q('#aeWorkspaceSidebar');
 if(!sidebar)return;
 var brand=q('.aews-brand',sidebar),search=q('.aews-search',sidebar),nav=q('.aews-nav',sidebar),foot=q('.aews-footer',sidebar);
 if(search&&brand&&brand.nextElementSibling!==search)brand.insertAdjacentElement('afterend',search);
 if(search){
  search.setAttribute('aria-label','Özellik arama');
  var input=q('input[type="search"]',search);
  if(input){input.id='aewsSearch';input.placeholder='Özellik ara…';input.setAttribute('aria-label','Özellik ara');input.autocomplete='off'}
 }
 if(nav&&search&&search.nextElementSibling!==nav)search.insertAdjacentElement('afterend',nav);
 if(foot&&nav&&nav.nextElementSibling!==foot)nav.insertAdjacentElement('afterend',foot);
 qa('#aewsSearch').forEach(function(node){if(!search||!search.contains(node))node.removeAttribute('id')});
 qa('#aethrionFeaturesTrigger,#aethrionFeaturesButton,#aethrionFeaturesPanel,#aethrionExperienceDrawer,#aethrionExperienceBackdrop').forEach(function(node){if(node&&node.parentNode)node.parentNode.removeChild(node)});
 sidebar.setAttribute('aria-label','AETHRION özellik menüsü');
}
function boot(){installRouter();patchWelcome();installCloseRecovery();if(logged()){document.body.classList.add('ae-shell-on');hideTrigger();customWelcome();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="/aethrion-mark.svg" alt="AETHRION" draggable="false">'}repairWorkspaceSurface();syncOverlayState()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
[150,500,1000,1800,3000,5000].forEach(function(t){setTimeout(boot,t)});
if(window.MutationObserver&&document.body)new MutationObserver(function(){syncOverlayState();if(logged()){patchWelcome();installCloseRecovery();if(!document.body.classList.contains('aews-feature-view'))customWelcome();hideTrigger();repairWorkspaceSurface()}}).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
})();

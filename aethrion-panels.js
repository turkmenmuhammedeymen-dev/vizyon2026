/* AETHRION Panel Router v1
 * Giriş yaptıktan sonra yan menüdeki her özelliği, menünün yanındaki çalışma alanında açar.
 *  - Hiçbir özellik seçilmemişse karşılama ekranı (28 AI Modeli Tek Yerde) görünür.
 *  - Bir özelliğe basınca karşılama gider; o özelliğin kendi paneli gelir.
 *  - "Ana ekran" / "Geri dön" karşılama ekranına döndürür.
 * Üç tür panel vardır:
 *   card    : eski dashboard'daki kart (örn. en üstteki AETHRION AI sohbeti) çalışma alanına taşınır.
 *   frame   : kendi sayfası olan özellikler (3D Studio, Kod Editörü, API...) menüyü kaybetmeden gömülür.
 *   overlay : uygulamanın kendi açma fonksiyonu (Jarvis, Video Editör, Model Kataloğu...) çağrılır;
 *             açılan panel menünün yanına oturtulur ve gizli kalmaz.
 * Bu dosya diğer betiklerden sonra yüklenir ve yan menü tıklamalarının tek sahibidir.
 */
(function (w, d) {
  'use strict';
  if (w.__aethrionPanelRouter) return;
  w.__aethrionPanelRouter = true;

  var STAGE_ID = 'aePanelStage';
  var state = { opened: [], label: null, card: null, placeholder: null, guard: false, token: 0 };

  /* ---- Hangi özellik hangi panelde açılır ---- */
  var CARD_MAP = {
    'AETHRION AI': { find: /AETHRION AI ASISTAN/i },
    'Canlı Web Arama': { find: /AETHRION AI ASISTAN/i },
    'AI Kişisel Asistan': { cls: 'assistant-card' },
    'AETHRION Agents': { find: /AETHRION AGENT/i },
    'Sesli Sohbet': { find: /AGENTS İLE SESLİ/i },
    'Sesli AI Girişi': { find: /AGENTS İLE SESLİ/i },
    'Logs Sistemi': { find: /SİSTEM LOG/i },
    'Admin Logs Paneli': { find: /SİSTEM LOG/i },
    'Video Stüdyosu': { find: /VİDEO STÜDYOSU/i },
    'Pro Video Stüdyosu': { find: /VİDEO STÜDYOSU/i },
    'Ekran Okuma': { find: /AETHRION AI ASISTAN/i, then: 'startScreenReading' },
    'Sohbet ve İşlem Geçmişi': { find: /AETHRION AI ASISTAN/i, then: 'toggleConversationHistory' }
  };
  var FRAME_MAP = {
    
    'Kod Editörü': './kod-editoru.html',
    'Topluluk ve Takımlar': './topluluk.html',
    'Yorumlar ve Topluluk': './topluluk.html',
    'AETHRION Akademi': './bana-ogret.html',
    'A27 API Anahtarı': './aethrion-developer.html',
    'Beta API Yönetimi': './aethrion-developer.html',
    'API Belgeleri': './api.html',
    'Dokümantasyon': './dokumantasyon.html',
    'Güvenlik ve Ebeveyn Ayarları': './hesap-ve-oturum-guvenligi.html',
    'Güvenlik Ayarları': './hesap-ve-oturum-guvenligi.html',
    'Team Ortak Çalışma': './aethrion-teams.html',
    'Takım Alanım': './aethrion-teams.html'
  };
  /* Bu özellikler için uygulamanın kendi kapatma fonksiyonları (varsa). */
  var CLOSERS = ['closeJarvisMode', 'closeVideoEditor', 'closeModelsShowcase', 'closeJobMarket', 'closeJobCreateForm',
    'closeJobDetail', 'closeCategoryPanel', 'closeKocPanel', 'closeVizyonAlPanel', 'closeAethrionAlPanel', 'closeContestPage',
    'closeMarket', 'closeVoiceChatFullscreen', 'closeNotificationPanel', 'closeSettingsModal', 'closeAethrionInbox'];
  var OVERLAY_SELECTORS = '#vizyonAlPanel,#vizyonAlBackdrop,#aaVoiceFullscreen,#videoEditorOverlay,#modelsShowcaseOverlay,' +
    '#aethrionJarvisOverlay,#jobMarketOverlay,#jobCreateOverlay,#jobDetailOverlay,#categoryPanelModal,#kocPanelOverlay,' +
    '#contestPage,#marketModal,#downloadModal,#aethrionNotificationPanel,#aethrionInboxPanel,#settingsModal,#moderatorVideoToolModal,#aethrionAccountProfileModal,#profileModal';

  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function features() { return Array.isArray(w.__aethrionWorkspaceMenuFeatures) ? w.__aethrionWorkspaceMenuFeatures : []; }
  function meta(label) {
    var list = features();
    for (var i = 0; i < list.length; i++) if (list[i][2] === label) return list[i];
    return null;
  }
  function toast(msg, type) {
    if (typeof w.showNotification === 'function') { try { w.showNotification(msg, type || 'warning'); return; } catch (_) {} }
    console.warn('[AETHRION panel]', msg);
  }

  /* ---- Stil ---- */
  function installStyles() {
    if ($('#aePanelStyles')) return;
    var s = d.createElement('style');
    s.id = 'aePanelStyles';
    s.textContent = [
      /* Yan menü yazıları: beyaz zemin üzerinde beyaz yazı olmasın */
      'body.ae-shell-on #aeWorkspaceSidebar #aewsNav{background:transparent!important;box-shadow:none!important;border:0!important}',
      'body.ae-shell-on #aeWorkspaceSidebar .aews-link{color:#e8f0f8!important}',
      'body.ae-shell-on #aeWorkspaceSidebar .aews-link span:last-child{color:#e8f0f8!important}',
      'body.ae-shell-on #aeWorkspaceSidebar .aews-link:hover{background:rgba(255,255,255,.09)!important}',
      'body.ae-shell-on #aeWorkspaceSidebar .aews-link.is-active{background:linear-gradient(135deg,#2c64d8,#3d86ff)!important;color:#fff!important}',
      'body.ae-shell-on #aeWorkspaceSidebar .aews-link.is-active span:last-child{color:#fff!important}',
      'body.ae-shell-on #aeWorkspaceSidebar .aews-section{color:#9db6cf!important}',
      'body.aep-panel-on #aethrionExperienceWelcome{visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}',
      'body.aep-panel-on{overflow:hidden!important}',
      /* Karşılama (ana ekran) içeriği yan menünün altında kalmasın */
      '@media(min-width:1001px){body.ae-shell-on{padding-left:var(--a6-sidebar,286px)!important;box-sizing:border-box}body.ae-shell-on #dashboardArea{margin-left:0!important}}',
      /* Ana ekrandaki "28 AI Modeli" bölümü: koyu metin renkleri açık zemin için tasarlanmış, koyu zeminde okunmuyordu */
      'body.ae-shell-on #ai .ai-showcase,body.ae-shell-on #ai .ai-left,body.ae-shell-on #ai .ai-right{background:#f7faff!important;background-image:none!important}',
      'body.ae-shell-on #ai .ai-showcase{border:1px solid #d6e2ef!important;box-shadow:0 24px 70px rgba(16,36,58,.12)!important}',
      'body.ae-shell-on #ai .ai-right{border-left:1px solid #d6e2ef!important}',
      'body.ae-shell-on #ai .ai-chat-msg{background:#fff!important;background-image:none!important;border:1px solid #d6e2ef!important;box-shadow:0 6px 22px rgba(16,36,58,.07)!important;color:#25384f!important}',
      'body.ae-shell-on #ai .ai-chat-msg.user{background:#eef4fb!important}',
      'body.ae-shell-on #ai .ai-chat-msg .role{color:#2459a8!important}',
      'body.ae-shell-on #ai .ai-chat-code{background:#10243a!important;color:#d8e6f6!important;border:1px solid #1d3a5c!important}',
      'body.ae-shell-on #ai .ai-left h2,body.ae-shell-on #ai .ai-left h3{color:#10243a!important}',
      'body.ae-shell-on #ai .ai-left p{color:#3e5066!important}',
      /* Çalışma alanı */
      '#' + STAGE_ID + '{position:fixed;top:0;right:0;bottom:0;left:var(--a6-sidebar,286px);z-index:99000;display:none;flex-direction:column;background:#0b1220;color:#e8eef7;overflow:hidden}',
      '#' + STAGE_ID + '.on{display:flex}',
      '#' + STAGE_ID + ' .aep-head{flex:0 0 auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 22px;border-bottom:1px solid rgba(255,255,255,.1);background:#101a2e}',
      '#' + STAGE_ID + ' .aep-title{margin:0;font:800 18px/1.2 Inter,system-ui,sans-serif;color:#fff;flex:1 1 auto;min-width:0}',
      '#' + STAGE_ID + ' .aep-title small{display:block;margin-top:3px;font:500 12px/1.4 Inter,system-ui,sans-serif;color:#94a8c2}',
      '#' + STAGE_ID + ' .aep-btn{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#e8eef7;border-radius:10px;padding:8px 13px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap}',
      '#' + STAGE_ID + ' .aep-btn:hover{background:rgba(255,255,255,.14)}',
      '#' + STAGE_ID + ' .aep-body{flex:1 1 auto;min-height:0;overflow:auto;padding:18px 22px 40px;-webkit-overflow-scrolling:touch}',
      '#' + STAGE_ID + ' .aep-body.is-frame{padding:0;overflow:hidden;background:#fff}',
      '#' + STAGE_ID + ' .aep-frame{display:block;width:100%;height:100%;border:0;background:#fff}',
      '#' + STAGE_ID + ' .aep-body>.dashboard-card{display:block!important;max-width:1100px;margin:0 auto}',
      '#' + STAGE_ID + ' .aep-card{max-width:980px;margin:0 auto;background:#fff;color:#172b43;border-radius:18px;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25)}',
      '#' + STAGE_ID + ' .aep-card h3{margin:0 0 8px;font:800 20px Inter,system-ui,sans-serif;color:#10243a}',
      '#' + STAGE_ID + ' .aep-muted{color:#5d738b;font:500 13px/1.5 Inter,system-ui,sans-serif}',
      '#' + STAGE_ID + ' .aep-input{width:100%;box-sizing:border-box;margin:10px 0;padding:12px 14px;border:1px solid #c9d6e3;border-radius:12px;font:500 15px/1.5 Inter,system-ui,sans-serif;color:#172b43;background:#f7f9fc;resize:vertical}',
      '#' + STAGE_ID + ' .aep-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0}',
      '#' + STAGE_ID + ' .aep-card .aep-btn{border-color:#c9d6e3;background:#f2f6fb;color:#172b43}',
      '#' + STAGE_ID + ' .aep-card .aep-btn:hover{background:#e4edf7}',
      '#' + STAGE_ID + ' .aep-card .aep-primary{background:linear-gradient(135deg,#2c64d8,#3d86ff);border-color:transparent;color:#fff}',
      '#' + STAGE_ID + ' .aep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:14px}',
      '#' + STAGE_ID + ' .aep-fig{margin:0;padding:10px;border:1px solid #dbe5ef;border-radius:14px;background:#fff;display:flex;flex-direction:column;gap:8px}',
      '#' + STAGE_ID + ' .aep-fig img{width:100%;border-radius:10px;display:block}',
      '#' + STAGE_ID + ' .aep-fig figcaption{font:500 12px/1.4 Inter,system-ui,sans-serif;color:#5d738b}',
      '#' + STAGE_ID + ' .aep-tool{padding:14px 12px;font-size:14px;text-align:left}',
      '#' + STAGE_ID + ' .aep-list{display:flex;flex-direction:column;gap:8px;margin:12px 0}',
      '#' + STAGE_ID + ' .aep-item{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;padding:10px 12px;border:1px solid #dbe5ef;border-radius:12px;background:#f9fbfe}',
      '#' + STAGE_ID + ' .aep-item-name{font:700 14px Inter,system-ui,sans-serif;color:#172b43;min-width:0;overflow-wrap:anywhere}',
      '#' + STAGE_ID + ' .aep-item-act{display:flex;gap:6px;flex-wrap:wrap}',
      /* Menünün yanında açılan paneller */
      'body.ae-shell-on .ae-sb-offset{left:var(--a6-sidebar,286px)!important;width:auto!important;right:0!important;max-width:none!important}',
      'body.ae-shell-on #vizyonAlBackdrop.ae-sb-offset{left:var(--a6-sidebar,286px)!important}',
      '@media(max-width:1000px){',
      ' #' + STAGE_ID + '{left:0}',
      ' #' + STAGE_ID + ' .aep-head{padding-left:64px}',
      ' body.ae-shell-on .ae-sb-offset{left:0!important}',
      '}'
    ].join('\n');
    (d.head || d.documentElement).appendChild(s);
  }

  /* ---- Gizli kapsayıcılardan çıkar: paneller giriş sonrası da açılabilsin ---- */
  function relocate() {
    var nodes = $$(OVERLAY_SELECTORS);
    nodes.forEach(function (el) {
      if (el.parentNode !== d.body && el.id !== STAGE_ID && !el.closest('#' + STAGE_ID)) d.body.appendChild(el);
    });
    /* Kendi kimliği olmayan ama sabit konumlu tam ekran katmanlar (dashboard içinde) */
    $$('#dashboardArea .dashboard-content-wrapper > [class*="overlay"], #mainSite > [class*="overlay"]').forEach(function (el) {
      var pos = ''; try { pos = w.getComputedStyle(el).position; } catch (_) {}
      if (pos === 'fixed') d.body.appendChild(el);
    });
    nodes.forEach(function (el) { el.classList.add('ae-sb-offset'); });
  }

  /* ---- Çalışma alanı kabuğu ---- */
  function stage() {
    var st = $('#' + STAGE_ID);
    if (st) return st;
    st = d.createElement('section');
    st.id = STAGE_ID;
    st.setAttribute('aria-label', 'AETHRION çalışma alanı');
    st.innerHTML = '<div class="aep-head"><h2 class="aep-title"></h2><span class="aep-actions"></span>' +
      '<button type="button" class="aep-btn" data-aep-home>⌂ Ana ekran</button></div><div class="aep-body"></div>';
    d.body.appendChild(st);
    return st;
  }
  function setHead(st, label, desc, extra) {
    $('.aep-title', st).innerHTML = esc(label) + (desc ? '<small>' + esc(desc) + '</small>' : '');
    $('.aep-actions', st).innerHTML = extra || '';
  }
  function setActive(label) {
    $$('.aews-link').forEach(function (b) {
      var home = b.hasAttribute('data-aews-home');
      b.classList.toggle('is-active', home ? !label : b.getAttribute('data-aews-feature') === label);
    });
  }
  function welcomeEl() { return $('#aethrionExperienceWelcome'); }

  /* ---- Kapat / temizle ---- */
  function giveBackCard() {
    if (state.card && state.placeholder && state.placeholder.parentNode) {
      state.placeholder.parentNode.insertBefore(state.card, state.placeholder);
      state.placeholder.parentNode.removeChild(state.placeholder);
    }
    state.card = null; state.placeholder = null;
  }
  function closeEl(el) {
    var btn = el.querySelector('[data-dismiss],[data-bs-dismiss],.modal-close,.close-modal,.close-btn,[aria-label*="apat" i],[onclick*="close" i],[onclick*="Close"]');
    if (btn) { try { btn.click(); } catch (_) {} }
    ['open', 'active', 'show', 'visible'].forEach(function (c) { el.classList.remove(c); });
    var cs = w.getComputedStyle(el);
    if (cs.display !== 'none') { el.style.setProperty('display', 'none', 'important'); el.setAttribute('data-aep-closed', '1'); }
  }
  /* Ekranda büyük, sabit konumlu (modal/panel) katmanlar */
  function visibleFixed() {
    var out = [];
    var all = d.body.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest('#aeWorkspaceSidebar') || e.id === STAGE_ID || e.closest('#' + STAGE_ID)) continue;
      var cs = w.getComputedStyle(e);
      if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.3) continue;
      var r = e.getBoundingClientRect();
      if (r.width > 280 && r.height > 220) out.push(e);
    }
    return out;
  }
  function closeOverlays() {
    CLOSERS.forEach(function (n) { if (typeof w[n] === 'function') { try { w[n](); } catch (_) {} } });
    state.opened.forEach(function (el) { if (el && el.isConnected) closeEl(el); });
    state.opened = [];
    $$(OVERLAY_SELECTORS).forEach(function (el) {
      ['open', 'active', 'show', 'visible'].forEach(function (c) { el.classList.remove(c); });
      var cs = w.getComputedStyle(el);
      if (cs.display !== 'none') {
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute('data-aep-closed', '1');
      }
    });
    d.body.style.overflow = '';
    d.body.classList.remove('ae-overlay-active');
  }
  function clearStage() {
    var st = $('#' + STAGE_ID);
    giveBackCard();
    if (st) {
      var fr = $('iframe', st); if (fr) { try { fr.src = 'about:blank'; } catch (_) {} }
      $('.aep-body', st).innerHTML = '';
      $('.aep-body', st).classList.remove('is-frame');
      st.classList.remove('on');
    }
  }
  function showHome() {
    state.token++;
    state.label = null;
    clearStage();
    closeOverlays();
    d.body.classList.remove('aews-feature-view', 'aews-nav-open', 'aep-panel-on');
    var wel = welcomeEl();
    if (wel) wel.style.setProperty('display', 'block', 'important');
    setActive(null);
    try { w.scrollTo(0, 0); } catch (_) {}
  }

  /* ---- Panel türleri ---- */
  function openCard(label, rule, m) {
    var cards = $$('.dashboard-card');
    var card = null;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (rule.cls && c.classList.contains(rule.cls)) { card = c; break; }
      if (rule.find) {
        var h = c.querySelector('h3,h2');
        if (h && rule.find.test(h.textContent || '')) { card = c; break; }
      }
    }
    if (!card) return false;
    var st = stage();
    setHead(st, label, m && m[3] || '');
    var body = $('.aep-body', st);
    state.placeholder = d.createComment('aep-card');
    card.parentNode.insertBefore(state.placeholder, card);
    state.card = card;
    body.appendChild(card);
    card.style.removeProperty('display');
    var fixed = card.parentNode;
    if (fixed) fixed.scrollTop = 0;
    st.classList.add('on');
    if (rule.then) {
      var tok = state.token;
      setTimeout(function () {
        if (tok !== state.token || typeof w[rule.then] !== 'function') return;
        try { w[rule.then](); } catch (e) { console.error('[AETHRION]', e); }
      }, 350);
    }
    return true;
  }
  function openFrame(label, href, m) {
    var st = stage();
    var abs = href;
    try { abs = new URL(href, w.location.href).toString(); } catch (_) {}
    setHead(st, label, m && m[3] || '',
      '<a class="aep-btn" href="' + esc(abs) + '" target="_blank" rel="noopener noreferrer">Yeni sekmede aç ↗</a> ');
    var body = $('.aep-body', st);
    body.classList.add('is-frame');
    body.innerHTML = '<iframe class="aep-frame" title="' + esc(label) + '" src="' + esc(abs) +
      '" allow="microphone; camera; clipboard-read; clipboard-write; fullscreen; autoplay" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    st.classList.add('on');
    return true;
  }
  function rescueHidden() {
    $$('[data-aep-closed]').forEach(function (el) { el.removeAttribute('data-aep-closed'); });
    $$('[data-ae-display-saved]').forEach(function (el) {
      var cls = el.className && el.className.toString ? el.className.toString() : '';
      if (/(^|\s)(open|active|show)(\s|$)/.test(cls) && el.style.display === 'none') {
        el.style.removeProperty('display');
        el.removeAttribute('data-ae-display-saved');
      }
    });
  }
  /* Satır içi "göster" denmiş ama stil dosyası .open sınıfı olmadığı için gizlemişse sınıfı ekle. */
  function fixHiddenModals() {
    $$(OVERLAY_SELECTORS).forEach(function (el) {
      var inl = el.style.getPropertyValue('display');
      if (!inl || inl === 'none') return;
      var cs = w.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) {
        el.classList.add('open', 'active');
        el.setAttribute('aria-hidden', 'false');
      }
    });
  }
  function openOverlay(label, m) {
    $$('[data-aep-closed]').forEach(function (el) { el.style.removeProperty('display'); el.removeAttribute('data-aep-closed'); });
    /* Uygulamanın kapatma işlevleri satır içi gizleme bırakır; açmadan önce temizle. */
    $$(OVERLAY_SELECTORS).forEach(function (el) {
      if (el.style.getPropertyValue('visibility') === 'hidden') el.style.removeProperty('visibility');
      if (el.style.getPropertyValue('pointer-events') === 'none') el.style.removeProperty('pointer-events');
      if (el.style.getPropertyValue('display') === 'none') el.style.removeProperty('display');
    });
    var fn = m && m[4] && w[m[4]];
    if (typeof fn !== 'function') return false;
    var before = visibleFixed();
    state.guard = true;
    var ok = true;
    var threw = false;
    try { ok = fn.call(w, m[6]) !== false; } catch (e) { console.error('[AETHRION] Özellik açılamadı:', label, e); ok = false; threw = true; }
    var tok = state.token;
    if (!ok && !threw) {
      /* Bazı işlevler false döndürse de paneli açar; gerçekten bir şey göründü mü diye bak. */
      setTimeout(function () {
        if (tok !== state.token) return;
        var now = visibleFixed().filter(function (e) { return before.indexOf(e) < 0; });
        if (now.length) { state.label = label; d.body.classList.add('aep-panel-on'); state.opened = now; }
        else { showHome(); toast('"' + label + '" paneli şu anda açılamadı.', 'warning'); }
      }, 700);
      return true;
    }
    setTimeout(function () { state.guard = false; }, 600);
    [30, 250, 700].forEach(function (t) { setTimeout(function () { if (tok === state.token) { rescueHidden(); relocate(); fixHiddenModals(); } }, t); });
    setTimeout(function () {
      if (tok !== state.token) return;
      state.opened = visibleFixed().filter(function (e) { return before.indexOf(e) < 0; });
    }, 900);
    return ok;
  }

  /* Bir özellik başka sayfaya yönlendirmeye çalışırsa onu çalışma alanında göster. */
  function installNavGuard() {
    if (!w.navigation || typeof w.navigation.addEventListener !== 'function') return;
    w.navigation.addEventListener('navigate', function (e) {
      if (!state.guard || !e.cancelable || e.hashChange || e.downloadRequest !== null && e.downloadRequest !== undefined) return;
      var url; try { url = new URL(e.destination.url); } catch (_) { return; }
      if (url.origin !== w.location.origin) return;
      var here = w.location.pathname.replace(/\/index\.html$/, '/');
      var there = url.pathname.replace(/\/index\.html$/, '/');
      if (there === here) return;
      e.preventDefault();
      var label = state.pending || 'Çalışma alanı';
      state.guard = false;
      var tok = ++state.token;
      closeOverlays();
      clearStage();
      openFrame(label, url.pathname + url.search + url.hash, meta(label));
      d.body.classList.add('aews-feature-view', 'aep-panel-on');
      var wel = welcomeEl(); if (wel) wel.style.setProperty('display', 'none', 'important');
      void tok;
    });
  }


  /* ---- Yerleşik paneller: eski kodda olup güncel sitede paneli kaybolan özellikler ---- */
  function cloud(name, params) {
    if (!w.Parse || !w.Parse.Cloud) return Promise.reject(new Error('Sunucu bağlantısı (Parse) yüklenemedi.'));
    return w.Parse.Cloud.run(name, params || {});
  }
  function curUser() { try { return w.currentUser || (w.Parse && w.Parse.User && w.Parse.User.current()); } catch (_) { return null; } }
  function note(msg, type) { toast(msg, type); }

  function buildImagePanel(label, m) {
    var st = stage();
    setHead(st, label, m && m[3] || 'Yazdığın açıklamadan yapay zeka ile görsel üret');
    var body = $('.aep-body', st);
    body.innerHTML =
      '<div class="aep-card"><h3>🖼️ Görsel Üretimi</h3>' +
      '<p class="aep-muted">Ne görmek istediğini ayrıntılı yaz. Örnek: "gün batımında dağ gölü, sinematik ışık, ultra detaylı".</p>' +
      '<textarea id="aepImgPrompt" class="aep-input" rows="4" maxlength="800" placeholder="Görseli anlat…"></textarea>' +
      '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aepImgGo">✨ Görsel üret</button>' +
      '<button type="button" class="aep-btn" id="aepImgClear">Temizle</button><span class="aep-muted" id="aepImgState"></span></div>' +
      '<div class="aep-grid" id="aepImgOut"></div></div>';
    var go = $('#aepImgGo', body), out = $('#aepImgOut', body), stt = $('#aepImgState', body), ta = $('#aepImgPrompt', body);
    var busy = false;
    go.addEventListener('click', function () {
      var prompt = ta.value.trim();
      if (!prompt) { note('Lütfen bir açıklama yaz.', 'error'); ta.focus(); return; }
      if (busy) return;
      busy = true; go.disabled = true; stt.textContent = '⏳ Görsel üretiliyor, 10-40 sn sürebilir…';
      cloud('generateImageWithHF', { prompt: prompt }).then(function (res) {
        if (!res || res.success !== true || !res.imageBase64) throw new Error(res && res.error || 'Görsel üretilemedi.');
        var src = 'data:image/png;base64,' + res.imageBase64;
        var fig = d.createElement('figure'); fig.className = 'aep-fig';
        fig.innerHTML = '<img alt="Üretilen görsel" src="' + src + '"><figcaption>' + esc(prompt.slice(0, 120)) + '</figcaption>' +
          '<a class="aep-btn" download="aethrion-gorsel-' + Date.now() + '.png" href="' + src + '">⬇ İndir</a>';
        out.insertBefore(fig, out.firstChild);
        stt.textContent = '✅ Görsel hazır.';
      }).catch(function (e) {
        stt.textContent = '❌ ' + (e && e.message || 'Görsel üretilemedi.');
      }).then(function () { busy = false; go.disabled = false; });
    });
    $('#aepImgClear', body).addEventListener('click', function () { out.innerHTML = ''; ta.value = ''; stt.textContent = ''; });
    st.classList.add('on');
    return true;
  }

  function buildProjectsPanel(label, m) {
    var st = stage();
    var initialTab = label === 'Arşivim' ? 'archived' : (label === 'Çöp Kutusu' ? 'trash' : 'active');
    setHead(st, label, '3D, kod ve görsel çalışmaların · arşiv ve çöp kutusu yönetimi',
      '<button type="button" class="aep-btn" id="aepPrjRefresh">↻ Yenile</button>');
    var body = $('.aep-body', st);
    body.innerHTML =
      '<div class="aep-card"><h3>▤ Proje Alanım</h3>' +
      '<p class="aep-muted">Projelerin, favorilerin, arşivin ve çöp kutun aynı çalışma alanında.</p>' +
      '<div class="aep-row" id="aepPrjTabs">' +
      '<button type="button" class="aep-btn" data-tab="active">Aktif projeler</button>' +
      '<button type="button" class="aep-btn" data-tab="favorites">★ Favoriler</button>' +
      '<button type="button" class="aep-btn" data-tab="archived">🗄️ Arşiv</button>' +
      '<button type="button" class="aep-btn" data-tab="trash">🗑️ Çöp kutusu</button></div>' +
      '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aepPrjNew3D">◇ 3D Studio</button>' +
      '<button type="button" class="aep-btn" id="aepPrjNewCode">⌘ Kod Editörü</button>' +
      '<button type="button" class="aep-btn" id="aepPrjNewImage">🖼️ Görsel üret</button></div>' +
      '<div id="aepPrjList" class="aep-list" aria-live="polite">Projeler yükleniyor…</div></div>';
    var list = $('#aepPrjList', body), tabs = $('#aepPrjTabs', body);
    var selectedTab = initialTab, projects = [], busy = false;
    function queryProjects() {
      var user = curUser();
      if (!w.Parse || !user || !user.get('email')) throw new Error('Projelerini görmek için giriş yapmalısın.');
      var query = new w.Parse.Query('Project');
      query.equalTo('user_email', user.get('email'));
      query.descending('createdAt');
      query.limit(100);
      return query.find();
    }
    function mutate(id, operation) {
      if (busy) return;
      busy = true;
      var button = list.querySelector('[data-id="' + id + '"] button');
      if (button) button.disabled = true;
      var query = new w.Parse.Query('Project');
      query.get(id).then(function (project) {
        if (project.get('user_email') !== (curUser() && curUser().get('email'))) throw new Error('Bu proje hesabına ait değil.');
        operation(project);
        return project.save();
      }).then(load, function (error) {
        note('Proje işlemi yapılamadı: ' + String(error && error.message || error), 'error');
      }).then(function () { busy = false; });
    }
    function render() {
      Array.prototype.forEach.call(tabs.querySelectorAll('[data-tab]'), function (button) {
        var active = button.getAttribute('data-tab') === selectedTab;
        button.classList.toggle('aep-primary', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      var filtered = projects.filter(function (project) {
        var archived = project.get('is_archived') === true;
        var trashed = project.get('is_trashed') === true;
        if (trashed) return selectedTab === 'trash';
        if (selectedTab === 'trash') return false;
        if (selectedTab === 'archived') return archived;
        if (archived) return false;
        if (selectedTab === 'favorites') return project.get('is_favorite') === true;
        return true;
      });
      list.textContent = '';
      if (!filtered.length) {
        var empty = d.createElement('p'); empty.className = 'aep-muted';
        empty.textContent = selectedTab === 'trash' ? 'Çöp kutusu boş.' :
          selectedTab === 'archived' ? 'Arşivinde proje bulunmuyor.' :
          selectedTab === 'favorites' ? 'Henüz favori projen yok.' : 'Henüz kayıtlı projen yok. 3D Studio, Kod Editörü veya Görsel Üretimi ile ilk çalışmanı oluştur.';
        list.appendChild(empty); return;
      }
      filtered.forEach(function (project) {
        var type = String(project.get('type') || 'Dosya');
        var icon = type === '3D' ? '🧊' : type === 'Kod' ? '⌨️' : type === 'Görsel' ? '🖼️' : '📄';
        var card = d.createElement('article'); card.className = 'aep-item'; card.setAttribute('data-id', project.id);
        var title = d.createElement('span'); title.className = 'aep-item-name';
        title.textContent = icon + ' ' + String(project.get('name') || 'İsimsiz proje').slice(0, 100);
        card.appendChild(title);
        var actions = d.createElement('span'); actions.className = 'aep-item-act';
        function actionButton(text, action, primary) {
          var b = d.createElement('button'); b.type = 'button'; b.className = 'aep-btn' + (primary ? ' aep-primary' : '');
          b.textContent = text; b.setAttribute('data-a', action); actions.appendChild(b);
        }
        if (selectedTab === 'trash') {
          actionButton('↩ Geri yükle', 'restore-trash', false);
          actionButton('Kalıcı sil', 'purge', false);
        } else if (selectedTab === 'archived') {
          actionButton('↩ Arşivden çıkar', 'restore-archive', true);
          actionButton('🗑️ Çöpe taşı', 'trash', false);
        } else {
          actionButton('Aç', 'open', true);
          actionButton(project.get('is_favorite') ? '★ Favori' : '☆ Favorile', 'favorite', false);
          actionButton('🗄️ Arşivle', 'archive', false);
          actionButton('🗑️ Çöpe taşı', 'trash', false);
        }
        card.appendChild(actions);
        var fileUrl = project.get('content_file_url');
        if (fileUrl && /^https?:\/\//i.test(fileUrl)) {
          var link = d.createElement('a'); link.className = 'aep-muted'; link.href = fileUrl;
          link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Kaydedilmiş dosyayı aç ↗';
          card.appendChild(link);
        }
        list.appendChild(card);
      });
    }
    function load() {
      list.textContent = 'Projeler yükleniyor…';
      queryProjects().then(function (rows) {
        projects = rows || [];
        render();
      }).catch(function (error) {
        list.textContent = 'Projeler yüklenemedi: ' + String(error && error.message || error);
      });
    }
    tabs.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-tab]');
      if (!button) return;
      selectedTab = button.getAttribute('data-tab'); render();
    });
    list.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-a]');
      var card = button && button.closest('[data-id]');
      if (!button || !card) return;
      var id = card.getAttribute('data-id'), action = button.getAttribute('data-a');
      if (action === 'open') {
        var project = projects.filter(function (item) { return item.id === id; })[0];
        var type = project && project.get('type');
        openFeature(type === 'Kod' ? 'Kod Editörü' : type === 'Görsel' ? 'Görsel Üretimi' : '3D Studio');
      } else if (action === 'favorite') mutate(id, function (p) { p.set('is_favorite', p.get('is_favorite') !== true); });
      else if (action === 'archive') mutate(id, function (p) { p.set('is_archived', true); p.set('is_trashed', false); });
      else if (action === 'trash') {
        if (w.confirm('Bu proje çöp kutusuna taşınsın mı?')) mutate(id, function (p) { p.set('is_trashed', true); });
      } else if (action === 'restore-archive') mutate(id, function (p) { p.set('is_archived', false); });
      else if (action === 'restore-trash') mutate(id, function (p) { p.set('is_trashed', false); });
      else if (action === 'purge') {
        if (w.confirm('Bu proje kalıcı olarak silinsin mi? Bu işlem geri alınamaz.')) {
          busy = true;
          new w.Parse.Query('Project').get(id).then(function (p) {
            if (p.get('user_email') !== (curUser() && curUser().get('email'))) throw new Error('Bu proje hesabına ait değil.');
            return p.destroy();
          }).then(load, function (error) { note('Silinemedi: ' + String(error && error.message || error), 'error'); }).then(function () { busy = false; });
        }
      }
    });
    $('#aepPrjRefresh', st).addEventListener('click', load);
    $('#aepPrjNew3D', body).addEventListener('click', function () { openFeature('3D Studio'); });
    $('#aepPrjNewCode', body).addEventListener('click', function () { openFeature('Kod Editörü'); });
    $('#aepPrjNewImage', body).addEventListener('click', function () { openFeature('Görsel Üretimi'); });
    st.classList.add('on'); load(); return true;
  }

  function build3DStudioPanel(label, m) {
    var st = stage();
    setHead(st, label, 'Üç boyutlu tasarım alanı · sahne, proje ve dışa aktarma');
    var body = $('.aep-body', st);
    body.classList.add('is-frame');
    body.innerHTML = '<iframe class="aep-frame" title="AETHRION 3D Studio" src="./3d-studio.html#demo" allow="fullscreen; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    st.classList.add('on'); return true;
  }

  function buildProjectRequestCreatePanel(label, m) {
    var st = stage();
    setHead(st, label, 'Proje fikrini moderatörlere, yoksa admin ve kuruculara ilet');
    var body = $('.aep-body', st);
    body.innerHTML = '<div class="aep-card"><h3>📨 Yeni proje talebi</h3>' +
      '<label class="aep-muted" for="aepReqTitle">Proje adı</label><input class="aep-input" id="aepReqTitle" maxlength="100" placeholder="Örn. 3D bilim merkezi modeli">' +
      '<label class="aep-muted" for="aepReqType">Proje türü</label><select class="aep-input" id="aepReqType"><option value="3D">🧊 3D tasarım</option><option value="Kod">⌨️ Kod projesi</option><option value="Görsel">🖼️ Görsel tasarım</option></select>' +
      '<label class="aep-muted" for="aepReqDesc">Açıklama</label><textarea class="aep-input" id="aepReqDesc" rows="5" maxlength="3000" placeholder="İstediğin projeyi, gerekli özellikleri ve teslim beklentini açıkla."></textarea>' +
      '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aepReqSend">Talebi gönder</button><span class="aep-muted" id="aepReqState" role="status"></span></div></div>';
    var title = $('#aepReqTitle', body), type = $('#aepReqType', body), desc = $('#aepReqDesc', body);
    var send = $('#aepReqSend', body), stateText = $('#aepReqState', body);
    send.addEventListener('click', function () {
      if (!title.value.trim() || !desc.value.trim()) { note('Proje adı ve açıklamasını doldur.', 'warning'); return; }
      send.disabled = true; stateText.textContent = 'Talep iletiliyor…';
      cloud('createProjectRequest', { title: title.value.trim(), type: type.value, description: desc.value.trim() })
        .then(function (result) {
          if (!result || result.success !== true) throw new Error(result && result.error || 'Talep oluşturulamadı.');
          stateText.textContent = result.message || 'Talep gönderildi.';
          title.value = ''; desc.value = '';
          note(result.message || 'Proje talebi gönderildi.', 'success');
        }).catch(function (error) {
          stateText.textContent = String(error && error.message || error);
          note(stateText.textContent, 'error');
        }).then(function () { send.disabled = false; });
    });
    st.classList.add('on'); return true;
  }

  function buildProjectRequestsPanel(label, m) {
    var st = stage();
    setHead(st, label, 'Gelen proje talepleri · kabul et, reddet, devret veya projeyi teslim et',
      '<button type="button" class="aep-btn" id="aepReqRefresh">↻ Yenile</button>');
    var body = $('.aep-body', st);
    body.innerHTML = '<div class="aep-card"><h3>📨 Proje talep kuyruğu</h3><div id="aepReqList" class="aep-list" aria-live="polite">Talepler yükleniyor…</div></div>';
    var list = $('#aepReqList', body), busyIds = {};
    function load() {
      list.textContent = 'Talepler yükleniyor…';
      cloud('getInboxItems', {}).then(function (items) {
        var requests = (Array.isArray(items) ? items : []).filter(function (item) { return item.type === 'project_request'; });
        list.textContent = '';
        if (!requests.length) { var empty = d.createElement('p'); empty.className = 'aep-muted'; empty.textContent = 'Sana atanmış proje talebi bulunmuyor.'; list.appendChild(empty); return; }
        requests.forEach(function (item) {
          var card = d.createElement('article'); card.className = 'aep-item'; card.style.alignItems = 'flex-start';
          var detail = d.createElement('div'); detail.style.flex = '1 1 280px';
          var heading = d.createElement('strong'); heading.textContent = (item.project_type || 'Proje') + ' · ' + (item.project_title || 'Başlıksız talep'); detail.appendChild(heading);
          var meta = d.createElement('p'); meta.className = 'aep-muted'; meta.textContent = 'Talep eden: ' + (item.sender_email || 'Kullanıcı') + ' · Durum: ' + (item.status || 'pending'); detail.appendChild(meta);
          var description = d.createElement('p'); description.textContent = item.project_description || item.message || ''; detail.appendChild(description);
          card.appendChild(detail);
          var actions = d.createElement('div'); actions.className = 'aep-item-act';
          function actionButton(text, action, primary) {
            var button = d.createElement('button'); button.type = 'button'; button.className = 'aep-btn' + (primary ? ' aep-primary' : '');
            button.textContent = text; button.disabled = !!busyIds[item.request_id]; actions.appendChild(button);
            button.addEventListener('click', function () {
              if (busyIds[item.request_id]) return;
              busyIds[item.request_id] = true; button.disabled = true;
              cloud('handleProjectRequest', { requestId: item.request_id, action: action })
                .then(function (result) { if (!result || result.success === false) throw new Error(result && result.message || 'İşlem tamamlanamadı.'); note(result.message || 'Talep güncellendi.', 'success'); })
                .catch(function (error) { note(String(error && error.message || error), 'error'); })
                .then(function () { delete busyIds[item.request_id]; load(); });
            });
          }
          if (item.status === 'pending') {
            actionButton('✓ Kabul et', 'accept', true);
            actionButton('Reddet', 'reject', false);
            actionButton('Devret', 'delegate', false);
          } else if (item.status === 'accepted') {
            var select = d.createElement('select'); select.className = 'aep-input'; select.style.maxWidth = '260px';
            var placeholder = d.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Teslim edilecek projeyi seç'; select.appendChild(placeholder);
            var sendButton = d.createElement('button'); sendButton.type = 'button'; sendButton.className = 'aep-btn aep-primary'; sendButton.textContent = 'Projeyi gönder'; sendButton.disabled = true;
            (function () {
              var q = new w.Parse.Query('Project'), user = curUser();
              if (!user) return Promise.reject(new Error('Oturum bulunamadı.'));
              q.equalTo('user_email', user.get('email')); q.equalTo('type', item.project_type);
              q.descending('createdAt'); q.limit(100);
              return q.find();
            })().then(function (projects) {
              projects.forEach(function (project) {
                var option = d.createElement('option'); option.value = project.id; option.textContent = project.get('name') || 'İsimsiz proje'; select.appendChild(option);
              });
              if (!projects.length) { var opt=d.createElement('option'); opt.disabled=true; opt.textContent='Bu türde aktif proje bulunamadı'; select.appendChild(opt); }
              sendButton.disabled = !select.value;
            }).catch(function (error) { note('Projeler yüklenemedi: ' + String(error && error.message || error), 'error'); });
            select.addEventListener('change', function () { sendButton.disabled = !select.value; });
            sendButton.addEventListener('click', function () {
              if (!select.value || busyIds[item.request_id]) return;
              busyIds[item.request_id] = true; sendButton.disabled = true;
              cloud('handleProjectRequest', { requestId: item.request_id, action: 'send', projectId: select.value })
                .then(function (result) { if (!result || result.success === false) throw new Error(result && result.message || 'Proje gönderilemedi.'); note(result.message || 'Proje gönderildi.', 'success'); })
                .catch(function (error) { note(String(error && error.message || error), 'error'); })
                .then(function () { delete busyIds[item.request_id]; load(); });
            });
            actions.appendChild(select); actions.appendChild(sendButton);
          }
          if (actions.childNodes.length) card.appendChild(actions);
          list.appendChild(card);
        });
      }).catch(function (error) { list.textContent = 'Proje talepleri yüklenemedi: ' + String(error && error.message || error); });
    }
    $('#aepReqRefresh', st).addEventListener('click', load);
    st.classList.add('on'); load(); return true;
  }

  function buildDailyTasksPanel(label, m) {
    var st = stage();
    setHead(st, label, 'Günlük görevlerin ve devam serin');
    var body = $('.aep-body', st);
    body.innerHTML = '<div class="aep-card"><h3>📋 Günlük görevler</h3><div id="aepDailyTasks" class="aep-list">Yükleniyor…</div>' +
      '<hr><h3>🔥 Günlük seri</h3><p id="aepStreakInfo" class="aep-muted">Seri bilgisi yükleniyor…</p>' +
      '<button type="button" id="aepClaimStreak" class="aep-btn aep-primary">Günlük ödülü al</button></div>';
    var taskHost = $('#aepDailyTasks', body), streakInfo = $('#aepStreakInfo', body), claim = $('#aepClaimStreak', body);
    function load() {
      taskHost.textContent = 'Günlük görevler yükleniyor…'; streakInfo.textContent = 'Seri bilgisi yükleniyor…';
      Promise.all([cloud('getDailyTasks', {}), cloud('getStreakStatus', {})]).then(function (values) {
        var tasks = Array.isArray(values[0]) ? values[0] : [], streak = values[1] || {};
        taskHost.textContent = '';
        if (!tasks.length) { var empty=d.createElement('p'); empty.className='aep-muted'; empty.textContent='Bugün için görev tanımlanmamış.'; taskHost.appendChild(empty); }
        tasks.forEach(function (task) {
          var row=d.createElement('div'); row.className='aep-item';
          var text=d.createElement('span'); text.className='aep-item-name'; text.textContent=(task.completed?'✅ ':'📌 ')+(task.task_text||'Günlük görev')+' · '+String(task.points||0)+' puan'; row.appendChild(text);
          if (!task.completed) {
            var button=d.createElement('button'); button.type='button'; button.className='aep-btn aep-primary'; button.textContent='Tamamla';
            button.addEventListener('click', function () { button.disabled=true; cloud('completeDailyTask',{taskId:task.id}).then(function (result) { note(result.message||'Görev tamamlandı.','success'); load(); }).catch(function(error){note(String(error&&error.message||error),'error');button.disabled=false;}); });
            row.appendChild(button);
          }
          taskHost.appendChild(row);
        });
        streakInfo.textContent='Seri: '+String(streak.streakCount||0)+' gün · Bugünkü ödül: '+String(streak.todayReward||10)+' puan · '+(streak.claimedToday?'Bugün alındı':'Bugün alınabilir');
        claim.disabled=!!streak.claimedToday;
        claim.textContent=streak.claimedToday?'Bugünkü ödül alındı':'🔥 '+String(streak.todayReward||10)+' puanı al';
      }).catch(function(error){taskHost.textContent='Görevler yüklenemedi: '+String(error&&error.message||error);streakInfo.textContent='Seri bilgisi alınamadı.';claim.disabled=true;});
    }
    claim.addEventListener('click',function(){claim.disabled=true;cloud('claimDailyStreak',{}).then(function(result){note(result.message||'Günlük seri ödülü işlendi.','success');load();}).catch(function(error){note(String(error&&error.message||error),'error');claim.disabled=false;});});
    st.classList.add('on'); load(); return true;
  }

  function buildQuizPanel(label, m) {
    var st=stage(); setHead(st,label,'Günlük zeka testi · doğru yanıtlarla puan kazan');
    var body=$('.aep-body',st); body.innerHTML='<div class="aep-card"><h3>🧠 Günlük zeka testi</h3><div id="aepQuizList" class="aep-list">Sorular yükleniyor…</div></div>';
    var host=$('#aepQuizList',body), answered={};
    function load(){
      host.textContent='Sorular yükleniyor…';
      cloud('getQuizQuestions',{}).then(function(questions){
        host.textContent='';
        (Array.isArray(questions)?questions:[]).forEach(function(question,index){
          var card=d.createElement('section'); card.className='aep-card'; card.style.margin='10px 0';
          var title=d.createElement('h3'); title.textContent=(index+1)+'. '+(question.question||'Soru'); card.appendChild(title);
          var choices=d.createElement('div'); choices.className='aep-list';
          (question.options||[]).forEach(function(option,optionIndex){
            var label=d.createElement('label'); label.className='aep-item'; var radio=d.createElement('input'); radio.type='radio'; radio.name='aepQuiz_'+question.id; radio.value=String(optionIndex);
            radio.disabled=!!answered[question.id]; label.appendChild(radio);
            var span=d.createElement('span'); span.textContent=String(option); label.appendChild(span); choices.appendChild(label);
          });
          var send=d.createElement('button'); send.type='button'; send.className='aep-btn aep-primary'; send.textContent='Yanıtı gönder'; send.disabled=!!answered[question.id]; card.appendChild(choices); card.appendChild(send);
          var status=d.createElement('p'); status.className='aep-muted'; card.appendChild(status);
          send.addEventListener('click',function(){
            var picked=card.querySelector('input[type=radio]:checked');
            if(!picked){status.textContent='Önce bir yanıt seç.';return}
            send.disabled=true;
            cloud('submitQuizAnswer',{quizId:question.id,answerIndex:Number(picked.value)}).then(function(result){
              answered[question.id]=true; status.textContent=result.correct?'✅ Doğru! '+String(result.points_reward||0)+' puan kazandın.':'Bu yanıt doğru değil.';
              choices.querySelectorAll('input').forEach(function(input){input.disabled=true});
            }).catch(function(error){status.textContent='Yanıt gönderilemedi: '+String(error&&error.message||error);send.disabled=false});
          });
          host.appendChild(card);
        });
        if(!questions||!questions.length)host.textContent='Bugün soru bulunmuyor.';
      }).catch(function(error){host.textContent='Sorular yüklenemedi: '+String(error&&error.message||error)});
    }
    st.classList.add('on');load();return true;
  }

  function buildPointsPanel(label,m){
    var st=stage();setHead(st,label,'Puan, seviye ve davet kodun');
    var body=$('.aep-body',st);body.innerHTML='<div class="aep-card"><h3>⭐ Puan hesabım</h3><p id="aepPointInfo" class="aep-muted">Yükleniyor…</p><div class="aep-row"><input id="aepReferralCode" class="aep-input" readonly placeholder="Davet kodu"><button id="aepReferralCopy" class="aep-btn">Kopyala</button></div><h3>🏆 Davet sıralaması</h3><div id="aepReferralBoard" class="aep-list">Yükleniyor…</div></div>';
    var info=$('#aepPointInfo',body),code=$('#aepReferralCode',body),board=$('#aepReferralBoard',body);
    Promise.all([cloud('getUserPoints',{}),cloud('generateReferralCode',{}),cloud('getReferralLeaderboard',{})]).then(function(values){
      info.textContent='Puan: '+String(values[0]&&values[0].points||0)+' · Seviye: '+String(values[0]&&values[0].level||'Çaylak');
      code.value=values[1]&&values[1].referral_code||'';
      board.textContent='';
      (Array.isArray(values[2])?values[2]:[]).slice(0,20).forEach(function(user,index){
        var row=d.createElement('div');row.className='aep-item';row.textContent=(index+1)+'. '+String(user.name||'Kullanıcı')+' · '+String(user.count||0)+' davet';board.appendChild(row);
      });
      if(!board.childNodes.length)board.textContent='Henüz sıralama verisi yok.';
    }).catch(function(error){info.textContent='Puan bilgisi alınamadı: '+String(error&&error.message||error);board.textContent='Davet tablosu yüklenemedi.'});
    $('#aepReferralCopy',body).addEventListener('click',function(){if(code.value&&navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code.value).then(function(){note('Davet kodu kopyalandı.','success')}).catch(function(){note('Kopyalama başarısız.','warning')});});
    st.classList.add('on');return true;
  }

  function buildCommunityPanel(label,m){
    var st=stage();setHead(st,label,'Aktif anket ve son duyurular');
    var body=$('.aep-body',st);body.innerHTML='<div class="aep-card"><h3>🗳️ Aktif anket</h3><div id="aepPollHost" class="aep-list">Yükleniyor…</div><hr><h3>📢 Son duyurular</h3><div id="aepAnnouncements" class="aep-list">Yükleniyor…</div></div>';
    var pollHost=$('#aepPollHost',body),annHost=$('#aepAnnouncements',body);
    Promise.all([cloud('getActivePoll',{}),cloud('getAnnouncements',{})]).then(function(values){
      var poll=values[0],ann=Array.isArray(values[1])?values[1]:[];
      pollHost.textContent='';
      if(!poll){pollHost.textContent='Şu anda aktif anket yok.';}else{
        var h=d.createElement('strong');h.textContent=poll.question||'Aktif anket';pollHost.appendChild(h);
        (poll.options||[]).forEach(function(option,index){
          var button=d.createElement('button');button.type='button';button.className='aep-btn';button.textContent=String(option)+' · '+String((poll.votes||[])[index]||0)+' oy';
          button.addEventListener('click',function(){button.disabled=true;cloud('votePoll',{optionIndex:index}).then(function(){note('Oyun kaydedildi. +20 puan.','success');button.textContent+=' · Verildi';}).catch(function(error){button.disabled=false;note(String(error&&error.message||error),'error');});});
          pollHost.appendChild(button);
        });
      }
      annHost.textContent='';
      ann.forEach(function(item){var row=d.createElement('article');row.className='aep-item';var title=d.createElement('strong');title.textContent=item.title||'Duyuru';row.appendChild(title);var text=d.createElement('p');text.textContent=item.content||'';row.appendChild(text);annHost.appendChild(row);});
      if(!ann.length)annHost.textContent='Henüz duyuru bulunmuyor.';
    }).catch(function(error){pollHost.textContent='Topluluk verileri alınamadı: '+String(error&&error.message||error);});
    st.classList.add('on');return true;
  }

  /* ---- Kategori panelleri (9 kategori · 80+ özellik) ---- */
  var CATEGORIES = {"assistant": {"title": "AI Kişisel Asistan", "icon": "🤖", "description": "Günlük planlama ve kişisel yardımcı araçları.", "items": ["Günlük Özet", "Hatırlatıcı", "AI Avatar", "Sesli Asistan", "Dosya Analiz + Sunum", "Canlı Web Arama"]}, "education": {"title": "Eğitim & Öğrenme", "icon": "📚", "description": "Öğrenme, sınav ve üretkenlik destek araçları.", "items": ["AI Dil", "Öğrenme Planı", "Ödev Yardımı", "Sesli Kitap", "Hikâye", "Şiir"]}, "gamification": {"title": "Oyunlaştırma & Sosyal", "icon": "🎮", "description": "Etkileşim, meydan okuma ve takım etkinlikleri.", "items": ["Canlı Savaşlar", "Meydan Okuma", "Takım Savaşı", "Sesli Düello", "Sanal Oda", "Günlük Seri (Streak)", "Uzay Modu (x2 Puan)", "Savaş Modu + Çoklu AI"]}, "creative": {"title": "Yaratıcı Araçlar", "icon": "🎨", "description": "Dijital içerik ve yaratıcı üretim fikirleri.", "items": ["Video Editör", "Ses Klonlama", "Müzik", "Anime Selfie", "Logo Tasarımı", "Instagram Bio"]}, "professional": {"title": "Profesyonel Araçlar", "icon": "💼", "description": "İş ve belge üretimi için yardımcı araçlar.", "items": ["CV Hazırlama", "İş Mektubu", "Sözleşme Analizi", "Sunum Oluşturma", "E-posta", "Fatura"]}, "health": {"title": "Sağlık & Yaşam", "icon": "🌿", "description": "Genel yaşam düzeni ve iyi oluş desteği.", "items": ["Beslenme Bilgisi", "Hareket Planı", "Uyku Günlüğü", "Meditasyon", "Tarif Önerileri", "Su Hatırlatıcısı"]}, "social": {"title": "Sosyal Sorumluluk", "icon": "🌍", "description": "Toplumsal katkı ve öğrenme fikirleri.", "items": ["Çevre", "Bağış Bilgisi", "Gönüllülük", "Kodlama", "Blog", "GIF + DM Sistemi"]}, "surprise": {"title": "“Vay Be!” Özellikler", "icon": "🎁", "description": "Yaratıcı keşif ve kişisel düşünme araçları.", "items": ["Rüya Üzerine Düşünme", "Astroloji Hakkında Bilgi", "Karakter Analizi", "İlişki İletişimi", "Vizyon Haritası", "Anı Defteri"]}, "earn": {"title": "Para Kazandıran Araçlar", "icon": "💰", "description": "İş, girişim ve dijital ürün fikirleri.", "items": ["Freelance", "Reklam Fikirleri", "Kurs Pazarı", "Şablonlar", "API Bayilik", "Sponsorluk", "Puan Mağazası + Cüzdan"]}};
  function buildCategoryPanel(label, m) {
    var key = String(m && m[6] || '').toLowerCase();
    var cat = CATEGORIES[key];
    if (!cat) return false;
    var st = stage();
    setHead(st, cat.icon + ' ' + cat.title, cat.description);
    var body = $('.aep-body', st);
    body.innerHTML = '<div class="aep-card"><h3>' + esc(cat.icon + ' ' + cat.title) + '</h3><p class="aep-muted">' + esc(cat.description) +
      ' Bir araca basınca AETHRION AI o iş için hazır bir istekle açılır.</p><div class="aep-grid aep-tools"></div></div>';
    var grid = $('.aep-tools', body);
    cat.items.forEach(function (name) {
      var b = d.createElement('button');
      b.type = 'button'; b.className = 'aep-btn aep-tool'; b.textContent = name;
      b.addEventListener('click', function () {
        openFeature('AETHRION AI');
        var prompt = cat.title + ' kategorisinden "' + name + '" için bana yardım et.';
        [350, 900].forEach(function (t) {
          setTimeout(function () {
            var inp = $('#dashboardAiInput');
            if (inp && !inp.value) { inp.value = prompt; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.focus(); }
          }, t);
        });
      });
      grid.appendChild(b);
    });
    st.classList.add('on');
    return true;
  }
  var BUILTIN = { 'Görsel Üretimi': buildImagePanel, 'Projelerim': buildProjectsPanel, 'Arşivim': buildProjectsPanel, 'Çöp Kutusu': buildProjectsPanel, '3D Studio': build3DStudioPanel, 'Proje Talebi Oluştur': buildProjectRequestCreatePanel, 'Proje Talepleri': buildProjectRequestsPanel, 'Günlük Görevler ve Seri': buildDailyTasksPanel, 'Zeka Testi': buildQuizPanel, 'Puan ve Davet': buildPointsPanel, 'Anketler ve Duyurular': buildCommunityPanel };
  function builtinFor(label, m) {
    if (BUILTIN[label]) return BUILTIN[label];
    if (m && m[4] === 'openCategoryPanel') return buildCategoryPanel;
    return null;
  }

  /* ---- Ana giriş: özelliği aç ---- */
  function openFeature(label) {
    var m = meta(label);
    if (!m) { toast('Bu özellik bulunamadı: ' + label, 'warning'); return; }
    var action = m[4];
    if (action === 'doLogout') {
      if (typeof w.logout === 'function') return w.logout();
      if (w.Parse && w.Parse.User) return w.Parse.User.logOut().then(function () { w.location.reload(); }, function () { w.location.reload(); });
      return w.location.reload();
    }
    state.token++;
    state.pending = label;
    clearStage();
    closeOverlays();
    installStyles(); relocate();
    d.body.classList.remove('aews-nav-open');
    d.body.classList.add('aews-feature-view');
    var wel = welcomeEl();
    if (wel) wel.style.setProperty('display', 'none', 'important');
    setActive(label);
    var done = false;
    var bf = builtinFor(label, m);
    if (bf) done = bf(label, m);
    if (!done && CARD_MAP[label]) done = openCard(label, CARD_MAP[label], m);
    if (!done && FRAME_MAP[label]) done = openFrame(label, FRAME_MAP[label], m);
    if (!done && action) done = openOverlay(label, m);
    if (!done && m[5] && m[5].charAt(0) === '.') done = openFrame(label, m[5], m);
    if (!done) {
      /* Hiçbir panel açılamadıysa boş ekran bırakma: karşılama ekranına dön ve söyle. */
      showHome();
      toast('"' + label + '" paneli şu anda açılamadı.', 'warning');
      return;
    }
    state.label = label;
    d.body.classList.add('aep-panel-on');
  }

  /* ---- Tıklamalar (yakalama aşamasında; eski yönlendiricilerden önce) ---- */
  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var home = t.closest('[data-aews-home],[data-aep-home]');
    if (home) { e.preventDefault(); e.stopImmediatePropagation(); showHome(); return; }
    var back = t.closest('[data-aews-back]');
    if (back && !back.closest('#' + STAGE_ID)) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (state.label) showHome();
      else if (w.history && w.history.length > 1) w.history.back();
      return;
    }
    var f = t.closest('[data-aews-feature]');
    if (f) {
      e.preventDefault(); e.stopImmediatePropagation();
      openFeature(f.getAttribute('data-aews-feature'));
    }
  }

  function init() {
    installStyles();
    installNavGuard();
    d.addEventListener('click', onClick, true);
    w.aethrionOpenFeature = openFeature;
    w.aethrionShowHome = showHome;
    [200, 1200, 3500].forEach(function (t) { setTimeout(relocate, t); });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(window, document);

/* AETHRION — oturum koruyucu
 * 1) Giriş yapılınca sayfa yenilemeden menü + çalışma alanı kurulmazsa sayfa bir kez otomatik yenilenir
 *    (oturum Parse tarafından saklandığı için kullanıcı giriş yapmış olarak açılır).
 * 2) Giriş yapmamış ziyaretçi için AI: günde 25 mesaj (giriş yapan ücretsiz kullanıcı: 100). Sınır dolunca giriş istenir.
 *    Sunucu tarafı sınırı back4app/main.js (aethrionChat) içinde ayrıca uygulanır.
 */
(function (w, d) {
  'use strict';
  if (w.__aethrionSessionGuard) return;
  w.__aethrionSessionGuard = true;

  var GUEST_LIMIT = 25;

  function who() {
    try {
      var u = (w.Parse && w.Parse.User && w.Parse.User.current && w.Parse.User.current()) || w.currentUser || null;
      if (!u) return '';
      return String((u.get && (u.get('email') || u.id)) || u.id || 'user');
    } catch (_) { return ''; }
  }
  function isGuest() { return !who(); }
  function notify(m, t) { if (typeof w.showNotification === 'function') { try { w.showNotification(m, t || 'warning'); return; } catch (_) {} } }

  /* ---------- 1) Giriş sonrası kabuk kontrolü ---------- */
  var last = who(), checking = false;
  function shellReady() {
    return d.body.classList.contains('ae-shell-on') && !!d.querySelector('#aeWorkspaceSidebar [data-aews-feature]');
  }
  function onLogin() {
    if (checking) return;
    checking = true;
    var key = 'aeLoginReload:' + who();
    try {
      if (w.sessionStorage.getItem(key)) { checking = false; return; }
      w.sessionStorage.setItem(key, '1');
    } catch (_) {}
    /* A stale guest shell can look "ready" while still containing the old menu.
       Rebuild the authenticated workspace once after Parse has persisted the session. */
    w.setTimeout(function () {
      checking = false;
      try { w.location.reload(); } catch (_) {}
    }, 900);
  }
  setInterval(function () {
    var now = who();
    if (!last && now) onLogin();
    if (last && !now) { try { w.sessionStorage.removeItem('aeLoginReload:' + last); } catch (_) {} }
    last = now;
  }, 500);

  /* ---------- 2) Misafir AI hakkı ---------- */
  function dayKey() { var t = new Date(); return 'aeGuestAi:' + t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate(); }
  function used() { try { return parseInt(w.localStorage.getItem(dayKey()) || '0', 10) || 0; } catch (_) { return 0; } }
  function bump() { try { w.localStorage.setItem(dayKey(), String(used() + 1)); } catch (_) {} }
  function openLogin() {
    try {
      if (typeof w.openAuthModal === 'function') return w.openAuthModal('login');
      if (typeof w.openModal === 'function') return w.openModal('authModal');
    } catch (_) {}
  }
  function paintGuest() {
    var panel = d.getElementById('vizyonAlPanel');
    if (!panel) return;
    var left = Math.max(0, GUEST_LIMIT - used());
    var q = d.getElementById('aeAIDailyQuota');
    if (isGuest()) {
      if (q) q.textContent = 'Misafir: kalan ' + left + '/' + GUEST_LIMIT;
      var b = d.getElementById('aeGuestBanner');
      if (!b) {
        b = d.createElement('div');
        b.id = 'aeGuestBanner';
        b.style.cssText = 'margin:8px 14px;padding:9px 12px;border-radius:12px;border:1px solid rgba(226,190,91,.4);background:rgba(226,190,91,.1);color:#f0dfa8;font:600 13px Inter,system-ui,sans-serif;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
        b.innerHTML = '<span></span><button type="button" style="margin-left:auto;border:0;border-radius:9px;padding:7px 12px;background:linear-gradient(135deg,#2c64d8,#3d86ff);color:#fff;font:700 12px Inter,system-ui,sans-serif;cursor:pointer">Giriş yap / Kayıt ol</button>';
        b.lastChild.addEventListener('click', openLogin);
        var header = panel.querySelector('.vizyon-al-header');
        if (header && header.parentNode) header.parentNode.insertBefore(b, header.nextSibling); else panel.insertBefore(b, panel.firstChild);
      }
      b.firstChild.textContent = '👤 Misafir modu: günde ' + GUEST_LIMIT + ' mesaj hakkın var (kalan: ' + left + '). Giriş yapınca daha fazla hak ve geçmiş kaydı gelir.';
    } else {
      var old = d.getElementById('aeGuestBanner'); if (old) old.remove();
    }
  }

  function wrapAI() {
    var send = w.sendVizyonAlMessage;
    if (typeof send === 'function' && !send.__aeGuest) {
      var wrapped = async function () {
        if (isGuest()) {
          if (used() >= GUEST_LIMIT) {
            notify('Misafir günlük mesaj hakkın (' + GUEST_LIMIT + ') doldu. Devam etmek için giriş yap.', 'warning');
            paintGuest(); openLogin(); return false;
          }
          var input = d.getElementById('vzInput');
          if (!input || !String(input.value || '').trim()) return send.apply(this, arguments);
          var ok = await send.apply(this, arguments);
          if (ok) bump();
          paintGuest();
          return ok;
        }
        return send.apply(this, arguments);
      };
      wrapped.__aeGuest = true;
      w.sendVizyonAlMessage = wrapped;
    }
    ['openFullAIPanel', 'openAethrionAI', 'openAethrionAlPanel', 'openVizyonAlPanel'].forEach(function (n) {
      var f = w[n];
      if (typeof f !== 'function' || f.__aeGuest) return;
      var g = function () { var r = f.apply(this, arguments); setTimeout(paintGuest, 120); setTimeout(paintGuest, 700); return r; };
      g.__aeGuest = true; w[n] = g;
    });
  }
  [0, 600, 1800, 4000, 8000].forEach(function (t) { setTimeout(wrapAI, t); });
  setInterval(wrapAI, 5000);
})(window, document);

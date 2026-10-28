/* AETHRION auth/dashboard recovery hotfix — bounded UI waits and verified-account routing. */
(function (window, document) {
  'use strict';
  function notify(message, type) {
    try { if (typeof window.showNotification === 'function') window.showNotification(message, type || 'error'); else console.warn('[AETHRION Auth Recovery]', message); }
    catch (_) { console.warn('[AETHRION Auth Recovery]', message); }
  }
  function hideBusyLayers() {
    ['aeAuthProgressOverlay', 'aethrionAuthBusyOverlay'].forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      node.classList.remove('is-visible');
      node.setAttribute('aria-hidden', 'true');
      node.style.setProperty('display', 'none', 'important');
      node.style.pointerEvents = 'none';
    });
    document.querySelectorAll('#formRegister button, #formLogin button, #formVerify button').forEach(function (button) {
      if (button.getAttribute('aria-busy') === 'true') {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.classList.remove('ae-auth-busy');
      }
    });
  }
  function showAuthenticatedDashboard() {
    var user = null;
    try { user = window.Parse && window.Parse.User && window.Parse.User.current(); } catch (_) {}
    if (!user) return false;
    var dashboard = document.getElementById('dashboardArea');
    var main = document.getElementById('mainSite');
    var auth = document.getElementById('authModal');
    if (dashboard) {
      dashboard.style.setProperty('display', 'block', 'important');
      dashboard.style.setProperty('visibility', 'visible', 'important');
      dashboard.style.setProperty('opacity', '1', 'important');
      dashboard.style.setProperty('pointer-events', 'auto', 'important');
    }
    if (main) main.style.setProperty('display', 'none', 'important');
    if (auth) { auth.style.setProperty('display', 'none', 'important'); auth.setAttribute('aria-hidden', 'true'); }
    if (document.body) document.body.classList.add('logged-in-user');
    hideBusyLayers();
    return true;
  }

  // Several legacy scripts wrap showDashboard and await unrelated initializers.
  // Never let a non-critical dashboard initializer hold a valid login hostage.
  if (typeof window.showDashboard === 'function' && !window.showDashboard.__aeBounded) {
    var originalShowDashboard = window.showDashboard;
    var boundedShowDashboard = async function () {
      var task;
      try {
        task = Promise.resolve().then(function () { return originalShowDashboard.apply(this, arguments); }.bind(this));
        await Promise.race([
          task,
          new Promise(function (resolve) { window.setTimeout(resolve, 5000); })
        ]);
      } catch (error) {
        console.warn('[AETHRION Auth Recovery] Dashboard initializer failed; using authenticated fallback.', String(error && error.message || error).slice(0, 180));
      }
      if (showAuthenticatedDashboard()) {
        // Legacy timers/guards can run after the initial dashboard promise settles.
        // Re-assert the authenticated view briefly while those old initializers drain.
        [250, 800, 1600, 3000, 6000].forEach(function (delay) {
          window.setTimeout(showAuthenticatedDashboard, delay);
        });
        return true;
      }
      hideBusyLayers();
      return false;
    };
    boundedShowDashboard.__aeBounded = true;
    window.showDashboard = boundedShowDashboard;
  }

  // The old verification handler was local to a legacy script, while the HTML calls
  // window.verifyAccount(). Expose a working public handler if it was not exported.
  if (typeof window.verifyAccount !== 'function') {
    window.verifyAccount = async function () {
      var emailField = document.getElementById('verifyEmail');
      var codeField = document.getElementById('verifyCode');
      var email = emailField ? emailField.value.trim().toLowerCase() : '';
      var code = codeField ? codeField.value.trim() : '';
      if (!email || !/^\d{6}$/.test(code)) {
        notify('Geçerli e-posta adresi ve 6 haneli doğrulama kodu girin.', 'error');
        return false;
      }
      var timeoutId;
      try {
        if (!window.Parse || !window.Parse.Cloud) throw new Error('Kimlik doğrulama servisi hazır değil. Sayfayı yenileyin.');
        var result = await Promise.race([
          window.Parse.Cloud.run('verifyUser', { email: email, code: code }),
          new Promise(function (_, reject) { timeoutId = window.setTimeout(function () { reject(new Error('Doğrulama sunucusu 15 saniye içinde yanıt vermedi. Tekrar deneyin.')); }, 15000); })
        ]);
        if (!result || result.success !== true) throw new Error((result && result.error) || 'Doğrulama başarısız.');
        notify('Hesabınız doğrulandı. Şimdi giriş yapabilirsiniz.', 'success');
        if (typeof window.switchTab === 'function') window.switchTab('login');
        return true;
      } catch (error) {
        notify('Doğrulama tamamlanamadı: ' + String(error && error.message || error), 'error');
        return false;
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        hideBusyLayers();
      }
    };
  }

  // A stuck/failed async path must always release the loading layer and buttons.
  window.addEventListener('unhandledrejection', function () { window.setTimeout(hideBusyLayers, 0); });
  window.addEventListener('error', function () { window.setTimeout(hideBusyLayers, 0); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var overlay = document.getElementById('aeAuthProgressOverlay');
      if (overlay && overlay.classList.contains('is-visible')) {
        // The active handler owns the actual operation; only release stale overlays.
        window.setTimeout(function () {
          if (overlay && overlay.classList.contains('is-visible')) hideBusyLayers();
        }, 36000);
      }
    }
  });
  window.setTimeout(function () {
    try { if (window.Parse && window.Parse.User && window.Parse.User.current()) showAuthenticatedDashboard(); }
    catch (_) {}
  }, 0);
})(window, document);

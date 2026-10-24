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
        timeoutId = window.setTimeout(function () { reject(new Error('İşlem 45 saniyeyi aştı. Bağlantıyı kontrol edip tekrar deneyin.')); }, 45000);
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
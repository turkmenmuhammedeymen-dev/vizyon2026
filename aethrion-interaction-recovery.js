/* AETHRION interaction recovery: independent auth entry points and visible feedback. */
(function (w, d) {
  'use strict';
  if (w.__aethrionInteractionRecovery) return;
  w.__aethrionInteractionRecovery = true;

  function notify(message, type) {
    if (typeof w.showNotification === 'function') {
      try { w.showNotification(message, type || 'warning'); return; } catch (_) {}
    }
    console.warn('[AETHRION UI]', message);
  }

  function openAuth(tab) {
    tab = ['login', 'register', 'verify'].indexOf(tab) >= 0 ? tab : 'login';
    var modal = d.getElementById('authModal');
    if (!modal) { notify('Giriş penceresi bulunamadı. index.html içindeki authModal bağlantısını kontrol edin.', 'error'); return false; }
    if (typeof w.switchTab === 'function') {
      try { w.switchTab(tab); } catch (error) { console.error('[AETHRION] switchTab failed', error); }
    }
    [['login','formLogin'],['register','formRegister'],['verify','formVerify']].forEach(function (item) {
      var form = d.getElementById(item[1]);
      if (form) form.style.setProperty('display', item[0] === tab ? 'block' : 'none', 'important');
    });
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    modal.setAttribute('aria-hidden', 'false');
    var first = modal.querySelector(tab === 'login' ? '#lEmail' : (tab === 'register' ? '#rName' : '#verifyEmail'));
    if (first) w.setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (_) {} }, 40);
    return true;
  }

  if (typeof w.openModal !== 'function') {
    w.openModal = function (id) {
      if (id === 'login' || id === 'register' || id === 'verify') return openAuth(id);
      var modal = d.getElementById(id);
      if (!modal) { notify('Açılacak pencere bulunamadı: ' + id, 'warning'); return false; }
      modal.style.setProperty('display', 'flex', 'important');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      return true;
    };
  }
  if (typeof w.closeModal !== 'function') {
    w.closeModal = function (id) {
      var modal = d.getElementById(id);
      if (!modal) return false;
      modal.style.setProperty('display', 'none', 'important');
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      return true;
    };
  }
  if (typeof w.openFullAIPanel !== 'function') {
    w.openFullAIPanel = function () {
      notify('AETHRION AI çalışma alanı yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'error');
      return false;
    };
  }

  function bind() {
    d.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('button,a,[role="button"]') : null;
      if (!target) return;
      if (target.id === 'navbarLoginBtn' || target.matches('[data-aethrion-open-login]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openAuth('login');
        return;
      }
      if (target.id === 'navbarRegisterBtn' || target.matches('[data-aethrion-open-register]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openAuth('register');
        return;
      }
      if (target.matches('[data-aethrion-open-ai]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        try { w.openFullAIPanel(); } catch (error) { console.error('[AETHRION AI]', error); notify('AETHRION AI açılamadı: ' + String(error && error.message || error), 'error'); }
      }
    }, true);

    // Ensure stale full-screen loading layers cannot permanently intercept taps.
    [2800, 5000, 8000].forEach(function (delay) {
      w.setTimeout(function () {
        var splash = d.getElementById('splashScreen');
        if (splash && d.readyState === 'complete') {
          splash.style.setProperty('pointer-events', 'none', 'important');
          splash.style.setProperty('visibility', 'hidden', 'important');
          splash.style.setProperty('opacity', '0', 'important');
          splash.style.setProperty('display', 'none', 'important');
        }
      }, delay);
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  w.openAethrionAuth = openAuth;
})(window, document);

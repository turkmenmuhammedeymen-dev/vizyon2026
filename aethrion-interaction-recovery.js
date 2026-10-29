/* AETHRION interaction recovery: route legacy controls to real UI and real AI endpoints. */
(function (w, d) {
  'use strict';
  if (w.__aethrionInteractionRecovery) return;
  w.__aethrionInteractionRecovery = true;

  var originalOpenModal = typeof w.openModal === 'function' ? w.openModal : null;
  var originalSwitchTab = typeof w.switchTab === 'function' ? w.switchTab : null;
  var sending = false;
  var currentMode = 'normal';

  function byId(id) { return d.getElementById(id); }
  function notify(message, type) {
    if (typeof w.showNotification === 'function') {
      try { w.showNotification(message, type || 'warning'); return; } catch (_) {}
    }
    console.warn('[AETHRION UI]', message);
  }
  function revealAuth(tab) {
    tab = ['login', 'register', 'verify'].indexOf(tab) >= 0 ? tab : 'login';
    var modal = byId('authModal');
    if (!modal) { notify('Giriş penceresi bulunamadı. Lütfen sayfayı yenileyin.', 'error'); return false; }
    [['login','formLogin'],['register','formRegister'],['verify','formVerify']].forEach(function (item) {
      var form = byId(item[1]);
      if (form) form.style.setProperty('display', item[0] === tab ? 'block' : 'none', 'important');
    });
    modal.classList.add('open');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    modal.style.setProperty('z-index', '2147483001', 'important');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelectorAll('.modal-tab').forEach(function (button) {
      var text = String(button.textContent || '').toLocaleLowerCase('tr');
      var active = (tab === 'login' && text.indexOf('giriş') >= 0) ||
        (tab === 'register' && text.indexOf('kayıt') >= 0) ||
        (tab === 'verify' && text.indexOf('doğrula') >= 0);
      button.classList.toggle('active', active);
    });
    var input = byId(tab === 'login' ? 'lEmail' : (tab === 'register' ? 'rName' : 'verifyEmail'));
    if (tab === 'verify') {
      var email = (byId('rEmail') && byId('rEmail').value) || (byId('lEmail') && byId('lEmail').value) || '';
      if (input && !input.value && email) input.value = email.trim().toLowerCase();
    }
    if (input) w.setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (_) {} }, 40);
    return true;
  }
  function openAuth(tab) {
    if (originalSwitchTab) {
      try { originalSwitchTab(tab); } catch (error) { console.warn('[AETHRION] legacy tab switch failed', error); }
    }
    return revealAuth(tab);
  }

  // Wrap existing core functions too; defining fallbacks only when missing caused
  // openModal('login') to silently do nothing because no element has id="login".
  w.openModal = function (id) {
    if (id === 'login' || id === 'register' || id === 'verify') return openAuth(id);
    if (id === 'authModal') return openAuth('register');
    if (originalOpenModal) {
      try { originalOpenModal(id); } catch (error) { console.error('[AETHRION] openModal failed', error); }
    }
    var modal = byId(id);
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      modal.setAttribute('aria-hidden', 'false');
      return true;
    }
    return false;
  };
  w.switchTab = function (tab) {
    if (originalSwitchTab) {
      try { originalSwitchTab(tab); } catch (error) { console.warn('[AETHRION] switchTab failed', error); }
    }
    return revealAuth(tab);
  };
  w.openAuthModal = openAuth;
  w.openAethrionAuth = openAuth;

  function addMessage(role, text) {
    var chat = byId('vzChat');
    if (!chat) return null;
    var item = d.createElement('div');
    item.className = 'vz-msg ' + (role === 'user' ? 'user' : 'bot');
    var label = d.createElement('div');
    label.className = 'vz-role';
    label.textContent = role === 'user' ? 'SEN' : 'AETHRION AI · 28 MODEL';
    var body = d.createElement('div');
    body.className = 'vz-message-body';
    body.style.whiteSpace = 'pre-wrap';
    body.textContent = String(text || '');
    item.appendChild(label);
    item.appendChild(body);
    chat.appendChild(item);
    chat.scrollTop = chat.scrollHeight;
    return item;
  }
  function setQuota(result) {
    var p = byId('aeAIDailyQuota');
    if (!p) {
      var header = d.querySelector('#vizyonAlPanel .vizyon-al-header');
      if (!header) return;
      p = d.createElement('span');
      p.id = 'aeAIDailyQuota';
      p.setAttribute('role', 'status');
      p.style.cssText = 'margin-left:auto;margin-right:10px;padding:6px 10px;border:1px solid rgba(226,190,91,.35);border-radius:999px;color:#e7d49a;font-size:12px;white-space:nowrap;';
      header.insertBefore(p, header.lastElementChild || null);
    }
    if (result && result.remaining !== undefined) {
      p.textContent = result.remaining === 'Sınırsız' ? 'Günlük hak: Sınırsız' : 'Günlük kalan: ' + result.remaining + '/' + (result.limit || 24);
    } else {
      p.textContent = 'Ücretsiz: 24 mesaj/gün';
    }
  }
  async function ensureParse() {
    if (!w.Parse || !w.Parse.Cloud) throw new Error('AI servisi yüklenmedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.');
    if (typeof w.initBack4app === 'function') await w.initBack4app();
  }
  async function refreshQuota() {
    try {
      await ensureParse();
      var result = await w.Parse.Cloud.run('getAethrionAIQuota', {});
      if (result && result.success) setQuota(result);
    } catch (error) {
      setQuota(null);
      console.warn('[AETHRION] quota check unavailable:', String(error && error.message || error));
    }
  }
  w.sendVizyonAlMessage = async function () {
    var input = byId('vzInput');
    var button = byId('vzSendBtn');
    var message = input ? String(input.value || '').trim() : '';
    if (!message || sending) return false;
    if (message.length > 8000) { notify('Mesaj en fazla 8000 karakter olabilir.', 'warning'); return false; }
    sending = true;
    if (input) { input.value = ''; input.disabled = true; }
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    addMessage('user', message);
    var pending = addMessage('bot', 'Yanıt hazırlanıyor…');
    try {
      await ensureParse();
      var result = await Promise.race([
        w.Parse.Cloud.run('aethrionChat', { message: message, mode: currentMode }),
        new Promise(function (_, reject) { w.setTimeout(function () { reject(new Error('AI yanıtı zaman aşımına uğradı. Tekrar deneyin.')); }, 60000); })
      ]);
      if (!result || result.success !== true) {
        var errorText = result && result.error ? result.error : 'AETHRION AI yanıt üretemedi.';
        if (pending) pending.querySelector('.vz-message-body').textContent = errorText;
        if (result && result.remaining !== undefined) setQuota(result);
        notify(errorText, 'warning');
        return false;
      }
      if (pending) pending.querySelector('.vz-message-body').textContent = String(result.reply || 'Yanıt alınamadı.');
      setQuota(result);
      return true;
    } catch (error) {
      var msg = String(error && error.message || error);
      if (pending) pending.querySelector('.vz-message-body').textContent = 'Bağlantı sorunu: ' + msg;
      notify('AETHRION AI yanıt veremedi: ' + msg, 'error');
      return false;
    } finally {
      sending = false;
      if (input) { input.disabled = false; input.focus(); }
      if (button) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
  };
  w.setVizyonAlMode = function (mode) {
    currentMode = ['normal','deep','agent','developer'].indexOf(mode) >= 0 ? mode : 'normal';
    w.aethrionCurrentMode = currentMode;
    d.querySelectorAll('#vizyonAlPanel [data-mode]').forEach(function (button) {
      var active = button.getAttribute('data-mode') === currentMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { w.sessionStorage.setItem('aethrion_ai_mode', currentMode); } catch (_) {}
    return currentMode;
  };
  w.handleVizyonAlResponsibility = function () {
    var check = byId('aaResponsibilityCheckbox');
    var button = byId('aaStartBtn');
    if (button) button.disabled = !(check && check.checked);
    return !!(check && check.checked);
  };

  function bind() {
    d.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('button,a,[role="button"]') : null;
      if (!target) return;
      if (target.matches('#authModal .modal-tab')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var text = String(target.textContent || '').toLocaleLowerCase('tr');
        openAuth(text.indexOf('doğrula') >= 0 ? 'verify' : (text.indexOf('kayıt') >= 0 ? 'register' : 'login'));
        return;
      }
      if (target.id === 'navbarLoginBtn' || target.matches('[data-aethrion-open-login]')) {
        event.preventDefault(); event.stopImmediatePropagation(); openAuth('login'); return;
      }
      if (target.id === 'navbarRegisterBtn' || target.matches('[data-aethrion-open-register]')) {
        event.preventDefault(); event.stopImmediatePropagation(); openAuth('register'); return;
      }
    }, true);
    d.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && event.target && event.target.id === 'vzInput' && !event.shiftKey) {
        event.preventDefault();
        w.sendVizyonAlMessage();
      }
    }, true);
    [2800, 5000, 8000].forEach(function (delay) {
      w.setTimeout(function () {
        var splash = byId('splashScreen');
        if (splash && d.readyState === 'complete') {
          splash.style.setProperty('pointer-events', 'none', 'important');
          splash.style.setProperty('visibility', 'hidden', 'important');
          splash.style.setProperty('opacity', '0', 'important');
          splash.style.setProperty('display', 'none', 'important');
        }
      }, delay);
    });
    var panel = byId('vizyonAlPanel');
    if (panel) panel.addEventListener('click', function (event) {
      var close = event.target && event.target.closest ? event.target.closest('.vizyon-al-close') : null;
      if (close) { event.preventDefault(); event.stopImmediatePropagation(); if (typeof w.closeAethrionWorkspace === 'function') w.closeAethrionWorkspace(); }
    }, true);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  w.openAethrionAuth = openAuth;
  w.closeAethrionAuth = function () {
    var modal = byId('authModal');
    if (modal) { modal.classList.remove('open'); modal.style.setProperty('display','none','important'); modal.setAttribute('aria-hidden','true'); }
  };
})(window, document);

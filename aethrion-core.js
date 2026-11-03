/* AETHRION core compatibility runtime — restores homepage actions after the HTML split.
 * Only supplies missing handlers; never replaces a real feature implementation.
 */
(function (w, d) {
  'use strict';
  if (w.__aethrionCoreRuntimeReady) return;
  w.__aethrionCoreRuntimeReady = true;
  function byId(id) { return d.getElementById(id); }
  function scrollTo(id) {
    var node = byId(id);
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    return false;
  }
  function go(path) { if (path) w.location.href = path; }
  function openSettingsPanel() {
    var modal = byId('settingsModal');
    if (!modal) {
      modal = d.createElement('section');
      modal.id = 'settingsModal';
      modal.className = 'modal-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'aeSettingsTitle');
      modal.innerHTML = '<div class="modal-content" style="width:min(760px,94vw);max-height:88vh;overflow:auto;background:var(--card,#111827);color:var(--text,#f4f6fb);border:1px solid var(--border,#334155);border-radius:20px;padding:24px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><small style="letter-spacing:.16em;color:var(--accent2,#d8bd6a)">AETHRION ACCOUNT</small><h2 id="aeSettingsTitle" style="margin:6px 0">Ayarlar</h2><p style="margin:0;color:var(--text3,#9ca3af)">Hesap ve uygulama tercihleri</p></div><button type="button" data-ae-settings-close aria-label="Kapat">✕</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:22px"><label>Dil<select id="aeSettingsLanguage" style="display:block;width:100%;padding:12px;margin-top:7px"><option value="tr">Türkçe</option><option value="en">English</option><option value="es">Español</option><option value="ru">Русский</option><option value="fr">Français</option></select></label><label>Görünüm<select id="aeSettingsTheme" style="display:block;width:100%;padding:12px;margin-top:7px"><option value="dark">Koyu tema</option><option value="light">Açık tema</option></select></label></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:22px"><button type="button" data-ae-settings-save class="btn-primary">Tercihleri kaydet</button><button type="button" data-ae-settings-security class="btn-secondary">Hesap ve oturum güvenliği</button><button type="button" data-ae-settings-logs class="btn-secondary">Sistem kayıtları</button></div><p style="font-size:12px;color:var(--text3,#9ca3af);margin-top:16px">Değişiklikler bu tarayıcıda saklanır. Hesap ve sunucu güvenliği ayarları ilgili yetkili servisler üzerinden yönetilir.</p></div>';
      d.body.appendChild(modal);
      modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.closest('[data-ae-settings-close]')) { modal.style.display='none'; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
        if (e.target.closest('[data-ae-settings-save]')) {
          var lang=byId('aeSettingsLanguage'), theme=byId('aeSettingsTheme');
          if(lang){try{localStorage.setItem('aethrion_language',lang.value)}catch(_){} if(typeof w.changeLanguage==='function')w.changeLanguage(lang.value)}
          if(theme){d.documentElement.setAttribute('data-theme',theme.value);d.body.classList.toggle('dark-theme',theme.value==='dark');try{localStorage.setItem('aethrion_theme',theme.value)}catch(_){}}
          w.showNotification&&w.showNotification('Tercihler kaydedildi.','success');
        }
        if (e.target.closest('[data-ae-settings-security]')) w.openParentSettings();
        if (e.target.closest('[data-ae-settings-logs]')) w.openLogsPanel();
      });
    }
    var lang=byId('aeSettingsLanguage'),theme=byId('aeSettingsTheme');
    try{if(lang)lang.value=localStorage.getItem('aethrion_language')||'tr';if(theme)theme.value=localStorage.getItem('aethrion_theme')||'dark'}catch(_){}
    modal.style.display='flex';modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    return true;
  }
  function install(name, fn) { if (typeof w[name] !== 'function') w[name] = fn; }
  function closeDrawer() {
    var drawer = byId('aethrionExperienceDrawer'), backdrop = byId('aethrionExperienceBackdrop');
    if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
    if (backdrop) { backdrop.classList.remove('show'); backdrop.style.setProperty('pointer-events', 'none', 'important'); }
    if (d.body) d.body.classList.remove('aethrion-experience-menu-open');
  }
  install('openModal', function (name) {
    if (name === 'login' || name === 'register' || name === 'verify') {
      if (typeof w.switchTab === 'function') return w.switchTab(name);
      var auth = byId('authModal');
      if (auth) { auth.style.display = 'flex'; auth.setAttribute('aria-hidden', 'false'); }
      return;
    }
    var modal = byId(name);
    if (modal) { modal.style.display = 'flex'; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
  });
  install('closeModal', function (name) {
    var modal = byId(name);
    if (modal) { modal.style.display = 'none'; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
    if (name === 'authModal') closeDrawer();
  });
  install('openAuthModal', function (tab) { if (typeof w.switchTab === 'function') w.switchTab(tab || 'login'); else w.openModal('authModal'); });
  install('openFullAIPanel', function () { go('/aethrion-ai.html'); });
  install('openAethrionAI', function () { go('/aethrion-ai.html'); });
  install('openAethrionAlPanel', function () { go('/aethrion-assistant.html'); });
  install('openVizyonAlPanel', function () { go('/aethrion-assistant.html'); });
  install('openKocPanel', function () { go('/aethrion-assistant.html'); });
  install('openModelsShowcase', function () { var p = byId('modelsShowcaseOverlay'); if (!p) { go('/aethrion-ai.html#models'); return false; } p.classList.add('open', 'active'); p.style.setProperty('display', 'flex', 'important'); p.style.setProperty('visibility', 'visible', 'important'); p.style.setProperty('pointer-events', 'auto', 'important'); p.style.setProperty('position', 'fixed', 'important'); p.style.setProperty('inset', '0', 'important'); p.style.setProperty('z-index', '2147482000', 'important'); d.body.style.overflow = 'hidden'; return true; });
  install('smartTranslate', function () { if (typeof w.openFullAIPanel === 'function') w.openFullAIPanel(); else go('/aethrion-ai.html'); var input = byId('vzInput'); if (input) { input.value = 'Akıllı çeviri: Çevirmemi istediğim metin için kaynak ve hedef dili sor, ardından anlamı ve tonu koruyarak çevir.'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); } });
  install('open3DBuilder', function () { go('/3d-studio.html'); });
  install('open3DStudio', function () { go('/3d-studio.html'); });
  install('openVideoEditor', function () { var p = byId('videoEditorOverlay'); if (!p) { go('/index.html#features'); return false; } p.classList.add('open', 'active'); p.style.setProperty('display', 'flex', 'important'); p.style.setProperty('visibility', 'visible', 'important'); p.style.setProperty('pointer-events', 'auto', 'important'); p.style.setProperty('position', 'fixed', 'important'); p.style.setProperty('inset', '0', 'important'); p.style.setProperty('z-index', '2147482000', 'important'); p.style.setProperty('overflow', 'auto', 'important'); d.body.style.overflow = 'hidden'; return true; });
  install('openVideoStudio', function () { var opened = w.openVideoEditor(); var title = d.querySelector('#videoEditorOverlay .video-editor-title span'); if (title) title.textContent = 'VİDEO STÜDYOSU'; return opened; });
  install('openCodeEditor', function () { go('/kod-editoru.html'); });
  install('openAcademy', function () { go('/bana-ogret.html'); });
  install('openDocumentation', function () { go('/dokumantasyon.html'); });
  install('openA27ApiGuide', function () { go('/api.html'); });
  install('openV27ApiGuide', function () { go('/api.html'); });
  install('openV27ApiKeyGenerator', function () { go('/api.html#keys'); });
  install('openA27ApiKeyGenerator', function () { go('/api.html#keys'); });
  install('openJobMarket', function () { var p = byId('jobMarketOverlay'); if (!p) { go('/index.html#features'); return false; } p.classList.add('open', 'active'); p.style.setProperty('display', 'flex', 'important'); p.style.setProperty('visibility', 'visible', 'important'); p.style.setProperty('pointer-events', 'auto', 'important'); p.style.setProperty('position', 'fixed', 'important'); p.style.setProperty('inset', '0', 'important'); p.style.setProperty('z-index', '2147482000', 'important'); p.style.setProperty('overflow', 'auto', 'important'); d.body.style.overflow = 'hidden'; return true; });
  install('toggleTeamPage', function () { go('/topluluk.html'); });
  install('openPersonalAssistant', function () { go('/aethrion-assistant.html'); });
  install('openContestPage', function () { go('/topluluk.html#contest'); });
  install('openSettingsModal', openSettingsPanel);
  install('openAccountInfo', function () { if (!scrollTo('accountInfoModal')) go('/hesap.html'); });
  install('openProfileModal', function () { if (!scrollTo('profileModal')) go('/hesap.html'); });
  install('toggleTheme', function () {
    var dark = d.documentElement.getAttribute('data-theme') !== 'dark';
    d.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    d.body.classList.toggle('dark-theme', dark);
    try { localStorage.setItem('aethrion_theme', dark ? 'dark' : 'light'); } catch (e) {}
  });
  install('showDownloadOptions', function () {
    var modal = byId('downloadModal');
    if (modal) { modal.style.display = 'flex'; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
    else go('/indir.html');
  });
  install('closeDownloadOptions', function () {
    var modal = byId('downloadModal');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
  });
  install('scrollToImageGen', function () { if (!scrollTo('imageGen') && !scrollTo('features')) go('/aethrion-ai.html'); });
  install('scrollToProjects', function () { if (!scrollTo('projects')) go('/topluluk.html'); });
  install('openCategory', function (category) {
    var modal = byId('categoryPanelModal');
    var title = byId('categoryPanelTitle');
    var body = byId('categoryPanelBody');
    if (title) title.textContent = String(category || 'AETHRION').replace(/(^|[-_ ])\w/g, function (x) { return x.toUpperCase(); });
    if (body) body.textContent = 'Bu kategori için çalışma alanını açmak üzere aşağıdaki bağlantılardan devam edin.';
    if (modal) { modal.style.display = 'flex'; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
    else go('/aethrion-ai.html');
  });
  install('logout', function () {
    var P = w.Parse;
    if (P && P.User && typeof P.User.logOut === 'function') {
      return P.User.logOut().finally(function () { try { localStorage.removeItem('aethrion_user'); } catch (e) {} w.location.reload(); });
    }
    try { localStorage.removeItem('aethrion_user'); } catch (e) {}
    w.location.reload();
  });
  install('doLogout', w.logout);
  install('closeAethrionFeaturesPanel', closeDrawer);
  install('closeAethrionSidebar', closeDrawer);
  install('toggleAethrionSidebar', function () {
    var drawer = byId('aethrionExperienceDrawer');
    if (drawer && drawer.classList.contains('open')) closeDrawer();
    else if (typeof w.openAethrionFeaturesPanel === 'function') w.openAethrionFeaturesPanel();
  });
  install('openJobMarket', function () { go('/topluluk.html'); });
  install('openProfileModal', function () { if (!w.openModal('profileModal')) go('/hesap-ve-oturum-guvenligi.html'); });
  install('openAvatarCreator', function () { if (!scrollTo('avatarCreatorModal')) go('/hesap-ve-oturum-guvenligi.html'); });
  install('openSettingsModal', openSettingsPanel);
  install('openVizyonAlPanel', function () { go('/aethrion-assistant.html'); });
  install('closeVizyonAlPanel', function () { var p = byId('vizyonAlPanel'); if (p) p.style.display = 'none'; else go('/aethrion-assistant.html'); });
  install('startVizyonAl', function () { go('/aethrion-assistant.html'); });
  install('setVizyonAlMode', function (mode) {
    d.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-mode') === String(mode)); });
    try { sessionStorage.setItem('aethrion_ai_mode', String(mode || 'normal')); } catch (e) {}
  });
  install('removeVizyonAlFile', function () { var f = byId('vzFileInput'); if (f) f.value = ''; var p = byId('vzFilePreview'); if (p) p.style.display = 'none'; });
  function aiCloud(name, params) {
    if (!w.Parse || !w.Parse.Cloud || typeof w.Parse.Cloud.run !== 'function') {
      return Promise.reject(new Error('AETHRION bulut servisine ulaşılamıyor.'));
    }
    return w.Parse.Cloud.run(name, params || {});
  }
  function aiPanel() { return byId('vizyonAlPanel'); }
  function aiChat() { return byId('vzChat'); }
  function aiMessages() {
    if (!Array.isArray(w.__aethrionAIChatMessages)) w.__aethrionAIChatMessages = [];
    return w.__aethrionAIChatMessages;
  }
  function aiAppend(role, content) {
    var chat = aiChat();
    var item = { role: role === 'user' ? 'user' : 'assistant', text: String(content || ''), at: new Date().toISOString() };
    aiMessages().push(item);
    if (chat) {
      var row = d.createElement('div');
      row.className = 'vz-msg ' + (item.role === 'user' ? 'user' : 'bot');
      var label = d.createElement('div');
      label.className = 'vz-role';
      label.textContent = item.role === 'user' ? 'SİZ' : '✨ AETHRION AI · 28 MODEL';
      var body = d.createElement('div');
      body.className = 'vz-message-body';
      body.textContent = item.text;
      body.style.whiteSpace = 'pre-wrap';
      row.appendChild(label); row.appendChild(body); chat.appendChild(row);
      chat.scrollTop = chat.scrollHeight;
    }
    return item;
  }
  function aiRender(messages) {
    var chat = aiChat(); if (!chat) return;
    chat.innerHTML = '';
    w.__aethrionAIChatMessages = [];
    (Array.isArray(messages) ? messages : []).forEach(function (m) {
      if (!m) return;
      var role = m.role || (m.is_ai ? 'assistant' : (m.from === 'user' ? 'user' : 'assistant'));
      var text = m.text || m.content || m.message || '';
      if (text) aiAppend(role === 'user' || role === 'human' ? 'user' : 'assistant', text);
    });
    if (!aiMessages().length) {
      var welcome = d.createElement('div'); welcome.className = 'vz-msg bot';
      welcome.innerHTML = '<div class="vz-role">✨ AETHRION AI · 28 MODEL</div><div class="vz-message-body">Merhaba! AETHRION AI sohbetine hoş geldin. Mesajını yazıp gönderebilirsin.</div>';
      chat.appendChild(welcome);
    }
  }
  function aiSaveHistory() {
    var messages = aiMessages().map(function (m) { return { role: m.role, text: m.text, at: m.at }; });
    return aiCloud('saveChatHistory', { messages: messages }).catch(function (e) {
      console.warn('[AETHRION] Sohbet geçmişi kaydedilemedi:', e);
    });
  }
  function aiHistoryPanel() {
    var panel = aiPanel(); if (!panel) return null;
    var history = byId('aeVizyonAIHistory');
    if (!history) {
      history = d.createElement('section'); history.id = 'aeVizyonAIHistory';
      history.style.cssText = 'display:none;flex:0 0 auto;max-height:38vh;overflow:auto;padding:12px 16px;border-bottom:1px solid var(--border,rgba(255,255,255,.12));background:var(--card,#111827)';
      history.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px"><strong style="color:var(--text,#fff)">Sohbet geçmişi</strong><button type="button" id="aeVizyonAIHistoryClose" aria-label="Geçmişi kapat">✕</button></div><div id="aeVizyonAIHistoryItems"></div>';
      var main = byId('vzMainArea') || panel;
      main.insertBefore(history, main.firstChild);
      byId('aeVizyonAIHistoryClose').addEventListener('click', function () { history.style.display = 'none'; });
    }
    return history;
  }
  function aiLoadHistory() {
    return aiCloud('getChatHistory', {}).then(function (result) {
      var messages = result && Array.isArray(result.messages) ? result.messages : [];
      if (messages.length) aiRender(messages);
      return messages;
    }).catch(function (e) {
      console.warn('[AETHRION] Sohbet geçmişi yüklenemedi:', e);
      return [];
    });
  }
  install('loadConversationHistory', aiLoadHistory);
  install('startConversation', function () { return w.newConversation(); });
  install('newConversation', async function () {
    var current = aiMessages().slice();
    if (current.length) {
      var archives = [];
      try { archives = JSON.parse(w.localStorage.getItem('aethrion_ai_archives_v1') || '[]') || []; } catch (_) {}
      archives.unshift({ id: 'local-' + Date.now(), title: current.find(function (m) { return m.role === 'user'; })?.text?.slice(0, 54) || 'Önceki sohbet', createdAt: new Date().toISOString(), messages: current });
      try { w.localStorage.setItem('aethrion_ai_archives_v1', JSON.stringify(archives.slice(0, 30))); } catch (_) {}
    }
    w.__aethrionAIChatMessages = [];
    aiRender([]);
    w.__aethrionAIHistoryLoaded = true;
    try { await aiCloud('saveChatHistory', { messages: [] }); } catch (e) { console.warn('[AETHRION] Yeni sohbet başlatıldı ancak bulut geçmişi sıfırlanamadı:', e); }
    if (typeof w.openFullAIPanel === 'function') w.openFullAIPanel();
    var input = byId('vzInput'); if (input) input.focus();
    return true;
  });
  install('toggleConversationHistory', function () {
    var panel = aiHistoryPanel(); if (!panel) { w.showNotification && w.showNotification('AETHRION sohbet paneli bulunamadı.', 'error'); return false; }
    var opening = panel.style.display === 'none';
    panel.style.display = opening ? 'block' : 'none';
    if (!opening) return true;
    var list = byId('aeVizyonAIHistoryItems'); if (!list) return true;
    list.innerHTML = '';
    var archives = [];
    try { archives = JSON.parse(w.localStorage.getItem('aethrion_ai_archives_v1') || '[]') || []; } catch (_) {}
    if (!archives.length) { list.textContent = 'Bu cihazda arşivlenmiş sohbet bulunmuyor.'; return true; }
    archives.forEach(function (entry) {
      var button = d.createElement('button'); button.type = 'button';
      button.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 12px;margin:5px 0;border:1px solid var(--border,rgba(255,255,255,.12));border-radius:10px;background:transparent;color:var(--text,#fff);cursor:pointer';
      button.textContent = (entry.title || 'Önceki sohbet') + ' · ' + new Date(entry.createdAt).toLocaleString('tr-TR');
      button.addEventListener('click', function () {
        w.__aethrionAIChatMessages = [];
        aiRender(entry.messages || []);
        panel.style.display = 'none';
        if (typeof w.openFullAIPanel === 'function') w.openFullAIPanel();
      });
      list.appendChild(button);
    });
    return true;
  });
  install('toggleChatHistory', function () { return w.toggleConversationHistory(); });
  install('sendVizyonAlMessage', async function () {
    var input = byId('vzInput'), button = byId('vzSendBtn');
    var message = input ? input.value.trim() : '';
    if (!message) { if (input) input.focus(); return false; }
    if (message.length > 4000) { w.showNotification && w.showNotification('Mesaj en fazla 4000 karakter olabilir.', 'warning'); return false; }
    var activeMode = 'normal';
    var selected = d.querySelector('#vizyonAlPanel [data-mode].active');
    try { activeMode = (selected && selected.getAttribute('data-mode')) || w.sessionStorage.getItem('aethrion_ai_mode') || 'normal'; } catch (_) {}
    if (input) input.value = '';
    if (button) { button.disabled = true; button.textContent = 'Yanıt hazırlanıyor…'; }
    aiAppend('user', message);
    aiSaveHistory();
    try {
      var result = await aiCloud('vizyonAlChat', { message: message, mode: activeMode });
      if (!result || result.success !== true) throw new Error(result && result.error || 'AETHRION AI yanıt üretemedi.');
      aiAppend('assistant', result.reply || 'Yanıt alınamadı.');
      await aiSaveHistory();
      if (typeof w.refreshAethrionAIQuota === 'function') w.refreshAethrionAIQuota();
    } catch (e) {
      aiAppend('assistant', 'Mesaj gönderilemedi: ' + (e && e.message || 'Bilinmeyen hata'));
      await aiSaveHistory();
      w.showNotification && w.showNotification(e && e.message || 'AETHRION AI şu anda yanıt veremiyor.', 'error');
    } finally {
      if (button) { button.disabled = false; button.textContent = '⚡ Gönder'; }
      if (input) input.focus();
    }
    return true;
  });
  install('startScreenReading', async function () {
    if (!w.navigator.mediaDevices || typeof w.navigator.mediaDevices.getDisplayMedia !== 'function') {
      w.showNotification && w.showNotification('Bu tarayıcı ekran paylaşımı desteklemiyor.', 'error'); return false;
    }
    try {
      var stream = await w.navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1 }, audio: false });
      var track = stream.getVideoTracks()[0], settings = track && track.getSettings ? track.getSettings() : {};
      var video = d.createElement('video'); video.muted = true; video.srcObject = stream; video.playsInline = true;
      await video.play();
      await new Promise(function (resolve) { if (video.videoWidth) resolve(); else video.onloadedmetadata = resolve; });
      var scale = Math.min(1, 1600 / (video.videoWidth || 1600), 900 / (video.videoHeight || 900));
      var canvas = d.createElement('canvas'); canvas.width = Math.max(1, Math.round((video.videoWidth || 1280) * scale)); canvas.height = Math.max(1, Math.round((video.videoHeight || 720) * scale));
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach(function (t) { t.stop(); });
      var data = canvas.toDataURL('image/jpeg', 0.72).split(',')[1];
      aiAppend('user', 'Ekran görüntüsünü analiz et.');
      var result = await aiCloud('vizyonAlScreenRead', { imageBase64: data, question: 'Ekrandaki içeriği açıkla; görünen metinleri, arayüz bölümlerini ve önemli bilgileri özetle.' });
      if (!result || result.success !== true) throw new Error(result && result.error || 'Ekran analizi tamamlanamadı.');
      aiAppend('assistant', result.reply || 'Ekran analizi yanıtı boş döndü.');
      await aiSaveHistory();
      return true;
    } catch (e) {
      w.showNotification && w.showNotification(e && e.message || 'Ekran okunamadı.', 'error');
      return false;
    }
  });
  install('startVizyonAlVoiceInput', function () {
    if (typeof w.startVoiceInput === 'function') return w.startVoiceInput();
    w.showNotification && w.showNotification('Sesli giriş bu tarayıcıda henüz bağlanmamış.', 'warning');
    return false;
  });
  install('openVoiceChatFullscreen', function () { go('/aethrion-assistant.html'); });
  install('closeVoiceChatFullscreen', function () { var p = byId('voiceChatFullscreen') || byId('vzVoiceFullscreen'); if (p) p.style.display = 'none'; else go('/aethrion-assistant.html'); });
  install('buyPackage', function () { w.showNotification && w.showNotification('Paket seçimi için önce hesabınıza giriş yapın.', 'warning'); w.openModal('register'); });
  install('contactFounder', function () { go('mailto:aethrion.official@gmail.com?subject=AETHRION%20Kurucu%20ile%20Iletisim'); });
  install('mainSubscribe', function () {
    var email = byId('subscribeEmail') || d.querySelector('input[type="email"][name*="subscribe" i]');
    if (!email || !email.value.trim()) { w.showNotification && w.showNotification('Abonelik için e-posta adresinizi girin.', 'warning'); if (email) email.focus(); return; }
    go('mailto:aethrion.official@gmail.com?subject=AETHRION%20Bulten%20Aboneligi&body=' + encodeURIComponent(email.value.trim()));
  });
  install('closeDownloadOptions', function () { var m = byId('downloadModal'); if (m) { m.style.display = 'none'; m.classList.remove('open'); } });
  install('openV27ApiGuide', function () { go('/api.html'); });
  install('openVizyonSupport', function () { go('/iletisim.html'); });
  install('togglePassword', function (id, button) {
    var input = byId(id); if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    if (button) button.setAttribute('aria-pressed', input.type === 'text' ? 'true' : 'false');
  });
  install('openResetPasswordModal', function () {
    var email = (byId('lEmail') && byId('lEmail').value || '').trim();
    if (!email) { w.showNotification && w.showNotification('Önce e-posta adresinizi girin.', 'warning'); if (byId('lEmail')) byId('lEmail').focus(); return; }
    if (w.Parse && w.Parse.User && typeof w.Parse.User.requestPasswordReset === 'function') {
      return w.Parse.User.requestPasswordReset(email).then(function () { w.showNotification && w.showNotification('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', 'success'); }).catch(function (e) { w.showNotification && w.showNotification(e.message || 'Şifre sıfırlama isteği başarısız oldu.', 'error'); });
    }
    w.showNotification && w.showNotification('Şifre sıfırlama servisi hazır değil.', 'error');
  });
  install('goToAethrionHome', function () { go('/'); });
  install('openVideoEditor', function () { go('/index.html#features'); });
  install('openVideoStudio', function () { go('/index.html#features'); });
  install('open3DBuilder', function () { go('/3d-studio.html'); });
  install('openMarket', function () { go('/topluluk.html'); });
  install('openPersonalAssistant', function () { go('/aethrion-assistant.html'); });
  install('openContestPage', function () { go('/topluluk.html'); });
  install('openV27ApiKeyGenerator', function () { go('/api.html#keys'); });
  install('openLogsPanel', function () { go('/aethrion-status.html'); });
  install('openParentSettings', function () { go('/hesap-ve-oturum-guvenligi.html'); });
  install('startJarvisMode', function () { go('/aethrion-jarvis.html'); });
  install('toggleNotificationPanel', function () { var p = byId('notificationPanel'); if (p) p.hidden = !p.hidden; else w.showNotification && w.showNotification('Bildirim paneli bu sayfada bulunmuyor.', 'warning'); });
  install('toggleChatHistory', function () { var p = byId('conversationHistoryList') || byId('conversationHistoryItems'); if (p) p.hidden = !p.hidden; else w.showNotification && w.showNotification('Sohbet geçmişi bu sayfada bulunmuyor.', 'warning'); });
  install('startVoiceInput', function () { go('/aethrion-assistant.html'); });
  install('scrollToProjectRequests', function () { if (!scrollTo('projectRequests')) go('/topluluk.html'); });
  install('newConversation', function () { go('/aethrion-ai.html'); });
  install('toggleConversationHistory', function () { var p = byId('conversationHistoryList') || byId('conversationHistoryItems'); if (p) p.hidden = !p.hidden; else go('/aethrion-ai.html'); });
  install('shareCurrentConversation', function () { w.showNotification && w.showNotification('Paylaşmak için önce bir sohbet açın.', 'warning'); });
  install('deleteCurrentConversation', function () { w.showNotification && w.showNotification('Silmek için önce bir sohbet seçin.', 'warning'); });
  install('renameCurrentConversation', function () { w.showNotification && w.showNotification('Yeniden adlandırmak için önce bir sohbet seçin.', 'warning'); });
  install('switchToSiteAI', function () { go('/aethrion-ai.html'); });
  install('openApiKeySelectionModal', function () { go('/api.html#keys'); });
  install('sendDashboardAI', function () { go('/aethrion-ai.html'); });
  install('speakLastAIResponse', function () { w.showNotification && w.showNotification('Önce AI yanıtı oluşturun.', 'warning'); });
  install('stopAIResponse', function () { if (w.speechSynthesis) w.speechSynthesis.cancel(); });
  install('setAssistantReminder', function () { w.showNotification && w.showNotification('Hatırlatıcı panelini açmak için AETHRION Assistant bölümüne gidin.', 'warning'); });
  install('openAssistantSettings', function () { go('/hesap-ve-oturum-guvenligi.html'); });
  install('refreshAssistantSummary', function () { w.location.reload(); });
  install('exportVideo', function () { w.showNotification && w.showNotification('Önce video çalışma alanını açın.', 'warning'); });
  install('saveVideoDraft', function () { w.showNotification && w.showNotification('Önce video çalışma alanını açın.', 'warning'); });
  install('closeVideoEditor', function () { var p = byId('videoEditorOverlay'); if (p) { p.style.setProperty('display', 'none', 'important'); p.style.setProperty('visibility', 'hidden', 'important'); p.style.setProperty('pointer-events', 'none', 'important'); p.classList.remove('open', 'active'); } d.body.style.overflow = ''; });
  install('videoEditorPlay', function () { var v = byId('videoPreview'); if (v && v.play) v.play(); });
  install('videoEditorPause', function () { var v = byId('videoPreview'); if (v && v.pause) v.pause(); });
  install('videoEditorReset', function () { var v = byId('videoPreview'); if (v) { v.pause(); v.currentTime = 0; } });
  install('videoEditorTrim', function () { w.showNotification && w.showNotification('Önce video çalışma alanını açın.', 'warning'); });
  install('openCategory', function (category) {
    var data = {
      assistant: { title: 'AI Kişisel Asistan', icon: '🤖', description: 'Günlük planlama ve kişisel yardımcı araçları.', items: ['Günlük Özet', 'Hatırlatıcı', 'AI Avatar', 'Sesli Asistan', 'Dosya Analiz + Sunum', 'Canlı Web Arama'] },
      education: { title: 'Eğitim & Öğrenme', icon: '📚', description: 'Öğrenme, sınav ve üretkenlik destek araçları.', items: ['AI Dil', 'Öğrenme Planı', 'Ödev Yardımı', 'Sesli Kitap', 'Hikâye', 'Şiir'] },
      gamification: { title: 'Oyunlaştırma & Sosyal', icon: '🎮', description: 'Etkileşim, meydan okuma ve takım etkinlikleri.', items: ['Canlı Savaşlar', 'Meydan Okuma', 'Takım Savaşı', 'Sesli Düello', 'Sanal Oda', 'Günlük Seri (Streak)', 'Uzay Modu (x2 Puan)', 'Savaş Modu + Çoklu AI'] },
      creative: { title: 'Yaratıcı Araçlar', icon: '🎨', description: 'Dijital içerik ve yaratıcı üretim fikirleri.', items: ['Video Editör', 'Ses Klonlama', 'Müzik', 'Anime Selfie', 'Logo Tasarımı', 'Instagram Bio'] },
      professional: { title: 'Profesyonel Araçlar', icon: '💼', description: 'İş ve belge üretimi için yardımcı araçlar.', items: ['CV Hazırlama', 'İş Mektubu', 'Sözleşme Analizi', 'Sunum Oluşturma', 'E-posta', 'Fatura'] },
      health: { title: 'Sağlık & Yaşam', icon: '🌿', description: 'Genel yaşam düzeni ve iyi oluş desteği.', items: ['Beslenme Bilgisi', 'Hareket Planı', 'Uyku Günlüğü', 'Meditasyon', 'Tarif Önerileri', 'Su Hatırlatıcısı'] },
      social: { title: 'Sosyal Sorumluluk', icon: '🌍', description: 'Toplumsal katkı ve öğrenme fikirleri.', items: ['Çevre', 'Bağış Bilgisi', 'Gönüllülük', 'Kodlama', 'Blog', 'GIF + DM Sistemi'] },
      surprise: { title: '“Vay Be!” Özellikler', icon: '🎁', description: 'Yaratıcı keşif ve kişisel düşünme araçları.', items: ['Rüya Üzerine Düşünme', 'Astroloji Hakkında Bilgi', 'Karakter Analizi', 'İlişki İletişimi', 'Vizyon Haritası', 'Anı Defteri'] },
      earn: { title: 'Para Kazandıran Araçlar', icon: '💰', description: 'İş, girişim ve dijital ürün fikirleri.', items: ['Freelance', 'Reklam Fikirleri', 'Kurs Pazarı', 'Şablonlar', 'API Bayilik', 'Sponsorluk', 'Puan Mağazası + Cüzdan'] }
    };
    var selected = data[String(category || '').toLowerCase()];
    var modal = byId('categoryPanelModal'), title = byId('categoryPanelTitle'), body = byId('categoryPanelBody');
    if (!selected || !modal || !body) {
      if (w.showNotification) w.showNotification('Bu kategori paneli şu anda kullanılamıyor.', 'warning');
      return false;
    }
    if (title) title.textContent = selected.icon + ' ' + selected.title;
    body.replaceChildren();
    var intro = d.createElement('p');
    intro.textContent = selected.description + ' Bir aracı seçtiğinde AETHRION AI ilgili çalışma isteğini hazırlar.';
    intro.style.cssText = 'margin:0 0 20px;color:var(--text2);line-height:1.75';
    body.appendChild(intro);
    var grid = d.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px';
    selected.items.forEach(function (item) {
      var button = d.createElement('button');
      button.type = 'button';
      button.className = 'category-feature-launch';
      button.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:58px;padding:14px 16px;border:1px solid var(--border2);border-radius:13px;background:var(--card-bg,rgba(120,140,170,.08));color:var(--text);text-align:left;cursor:pointer';
      var label = d.createElement('span');
      label.textContent = item;
      label.style.cssText = 'font-weight:700';
      var action = d.createElement('span');
      action.textContent = 'AI ile başlat →';
      action.style.cssText = 'flex:0 0 auto;color:var(--accent);font-size:11px;font-weight:700';
      button.append(label, action);
      button.addEventListener('click', function () {
        var prompt = selected.title + ' / ' + item + ': Bu konuda bana yardımcı ol. Önce ihtiyacımı netleştir, ardından uygulanabilir bir çalışma başlat.';
        if (typeof w.closeCategoryPanel === 'function') w.closeCategoryPanel();
        if (typeof w.openFullAIPanel === 'function') w.openFullAIPanel();
        else { go('/aethrion-ai.html'); return; }
        w.setTimeout(function () {
          var input = byId('vzInput');
          if (input) { input.value = prompt; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); }
          else go('/aethrion-ai.html');
        }, 100);
      });
      grid.appendChild(button);
    });
    body.appendChild(grid);
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    return true;
  });
  install('openCategoryPanel', function (name) { return w.openCategory(name); });
  install('openJobCreateForm', function () { var p = byId('jobCreateOverlay'); if (!p) return w.openJobMarket(); p.classList.add('open', 'active'); p.style.setProperty('display', 'flex', 'important'); p.style.setProperty('visibility', 'visible', 'important'); p.style.setProperty('pointer-events', 'auto', 'important'); p.style.setProperty('position', 'fixed', 'important'); p.style.setProperty('inset', '0', 'important'); p.style.setProperty('z-index', '2147482001', 'important'); p.style.setProperty('overflow', 'auto', 'important'); d.body.style.overflow = 'hidden'; return true; });
  install('closeJobMarket', function () { var p = byId('jobMarketOverlay'); if (p) { p.style.setProperty('display', 'none', 'important'); p.style.setProperty('visibility', 'hidden', 'important'); p.style.setProperty('pointer-events', 'none', 'important'); p.classList.remove('open', 'active'); } d.body.style.overflow = ''; });
  install('loadJobMarket', function () { go('/topluluk.html'); });
  install('closeJobCreateForm', function () { var p = byId('jobCreateOverlay'); if (p) { p.style.setProperty('display', 'none', 'important'); p.style.setProperty('visibility', 'hidden', 'important'); p.style.setProperty('pointer-events', 'none', 'important'); p.classList.remove('open', 'active'); } d.body.style.overflow = ''; });
  install('submitJobCreate', function () { w.showNotification && w.showNotification('İlan oluşturmak için Topluluk bölümünü açın.', 'warning'); go('/topluluk.html'); });
  install('openJobEdit', function () { go('/topluluk.html'); });
  install('deleteJobListing', function () { go('/topluluk.html'); });
  install('closeJobDetail', function () { var p = byId('jobDetailModal'); if (p) p.style.display = 'none'; });
  install('acceptJobListing', function () { go('/topluluk.html'); });
  install('closeModelsShowcase', function () { var p = byId('modelsShowcaseModal'); if (p) p.style.display = 'none'; });
  install('closeCategoryPanel', function () { var p = byId('categoryPanelModal'); if (p) { p.style.setProperty('display', 'none', 'important'); p.style.setProperty('visibility', 'hidden', 'important'); p.style.setProperty('pointer-events', 'none', 'important'); p.classList.remove('open'); } });
  install('closeJarvisMode', function () { go('/aethrion-jarvis.html'); });
  install('jarvisQuickCommand', function () { go('/aethrion-jarvis.html'); });
  install('toggleJarvisListening', function () { go('/aethrion-jarvis.html'); });
  install('jarvisToggleMute', function () { if (w.speechSynthesis) w.speechSynthesis.cancel(); });
  install('jarvisClearTranscript', function () { var p = byId('aeJvMessages'); if (p) p.replaceChildren(); });
  install('openModeratorVideoTool', function () { var m = byId('moderatorVideoToolModal'); if (m) { m.style.display = 'flex'; m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); } else go('/aethrion-status.html'); });
  install('closeAethrionResponsibilityModal', function () { var m = byId('aethrionResponsibilityModal'); if (m) m.style.display = 'none'; });
  install('confirmAethrionResponsibilityAction', function () { var m = byId('aethrionResponsibilityModal'); if (m) { m.style.display = 'none'; m.setAttribute('aria-hidden', 'true'); } });
  // If a previous runtime left the drawer/backdrop open, remove that stale blocker on startup.
  function clearStaleDrawer() {
    var drawer = byId('aethrionExperienceDrawer'), backdrop = byId('aethrionExperienceBackdrop');
    if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); drawer.style.setProperty('pointer-events', 'none', 'important'); }
    if (backdrop) { backdrop.classList.remove('show'); backdrop.style.setProperty('pointer-events', 'none', 'important'); backdrop.style.setProperty('visibility', 'hidden', 'important'); }
    if (d.body) d.body.classList.remove('aethrion-experience-menu-open');
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', clearStaleDrawer, { once: true });
  else clearStaleDrawer();
})(window, document);

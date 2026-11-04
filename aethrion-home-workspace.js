/* AETHRION workspace router.
 * The homepage's legacy 28-model chat panel is the actual chat UI; do not route
 * the primary AI button to the marketing/catalog page.
 */
(function (w, d) {
  'use strict';
  if (w.__aethrionWorkspaceLauncher) return;
  w.__aethrionWorkspaceLauncher = true;
  var panel = null;
  var priorOverflow = '';

  function node(id) { return d.getElementById(id); }
  function notify(message, type) {
    if (typeof w.showNotification === 'function') {
      try { w.showNotification(message, type || 'warning'); return; } catch (_) {}
    }
    console.warn('[AETHRION workspace]', message);
  }
  function installStyles() {
    if (node('aeWorkspaceLauncherStyles')) return;
    var style = d.createElement('style');
    style.id = 'aeWorkspaceLauncherStyles';
    style.textContent = [
      '#vizyonAlPanel.ae-fullscreen-ai.open{position:fixed!important;inset:0!important;left:0!important;right:0!important;top:0!important;bottom:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;max-width:none!important;min-width:0!important;max-height:none!important;margin:0!important;transform:none!important;border-radius:0!important;z-index:2147483000!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '#vizyonAlPanel.ae-fullscreen-ai .vizyon-al-header{flex:0 0 auto!important;padding:12px 16px!important;padding-top:max(12px,env(safe-area-inset-top))!important}',
      '#vizyonAlPanel.ae-fullscreen-ai #vzMainArea{display:flex!important;flex:1 1 auto!important;min-height:0!important;overflow:hidden!important}',
      '#vizyonAlPanel.ae-fullscreen-ai #vzChat{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important}',
      '#vizyonAlPanel.ae-fullscreen-ai .vizyon-al-input-area{flex:0 0 auto!important;padding-bottom:max(12px,env(safe-area-inset-bottom))!important}',
      '#vizyonAlPanel.ae-fullscreen-ai #vzInput{max-height:25vh!important}',
      '#vizyonAlPanel.ae-fullscreen-ai #aaResponsibilityArea[hidden]{display:none!important}',
      '@media(max-width:600px){#vizyonAlPanel.ae-fullscreen-ai .vizyon-al-header{padding-left:12px!important;padding-right:12px!important}#vizyonAlPanel.ae-fullscreen-ai .vizyon-al-input-area{gap:6px!important}}'
    ].join('');
    (d.head || d.documentElement).appendChild(style);
  }
  function getPanel() {
    panel = node('vizyonAlPanel');
    if (!panel) return null;
    installStyles();
    return panel;
  }
  function showChat(kind) {
    var p = getPanel();
    if (!p) {
      notify('Eski AETHRION sohbet paneli bulunamadı. index.html içindeki #vizyonAlPanel bağlantısı eksik.', 'error');
      return false;
    }
    priorOverflow = d.body.style.overflow || '';
    p.classList.add('ae-fullscreen-ai', 'open');
    p.style.setProperty('display', 'flex', 'important');
    p.style.setProperty('visibility', 'visible', 'important');
    p.style.setProperty('opacity', '1', 'important');
    p.style.setProperty('pointer-events', 'auto', 'important');
    d.body.style.overflow = 'hidden';

    var title = p.querySelector('.vz-title');
    if (title) title.textContent = kind === 'agents' ? 'AETHRION AGENTS' : 'AETHRION AI';
    // Sohbet yönetimi ana menüden çıkarıldı; yalnızca AETHRION AI panelinin içinde bulunur.
    var aiTools = node('aeInlineAIControls');
    if (!aiTools) {
      aiTools = d.createElement('div');
      aiTools.id = 'aeInlineAIControls';
      aiTools.setAttribute('role', 'toolbar');
      aiTools.setAttribute('aria-label', 'AETHRION AI sohbet araçları');
      aiTools.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:8px 14px;border-bottom:1px solid var(--border,rgba(255,255,255,.1));background:var(--card,transparent)';
      var header = p.querySelector('.vizyon-al-header') || p.firstElementChild || p;
      header.insertAdjacentElement('afterend', aiTools);
      function toolButton(id, label, title) {
        var b = d.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.title = title;
        b.style.cssText = 'padding:8px 12px;border:1px solid var(--border,rgba(255,255,255,.18));border-radius:10px;background:transparent;color:inherit;font:inherit;cursor:pointer';
        return b;
      }
      var fresh = toolButton('aeInlineNewChat', '＋ Yeni Sohbet', 'Yeni AETHRION AI sohbeti başlat');
      var history = toolButton('aeInlineChatHistory', '▤ Sohbet Geçmişi', 'Önceki AETHRION AI sohbetlerini aç');
      fresh.addEventListener('click', function () { if (typeof w.newConversation === 'function') w.newConversation(); else notify('Yeni sohbet işlevi yüklenemedi.', 'error'); });
      history.addEventListener('click', function () { if (typeof w.toggleConversationHistory === 'function') w.toggleConversationHistory(); else notify('Sohbet geçmişi işlevi yüklenemedi.', 'error'); });
      aiTools.appendChild(fresh); aiTools.appendChild(history);
    }
    aiTools.style.display = kind === 'ai' ? 'flex' : 'none';
    var responsibility = node('aaResponsibilityArea');
    var main = node('vzMainArea');
    if (kind === 'agents') {
      if (responsibility) { responsibility.hidden = false; responsibility.style.removeProperty('display'); }
      if (main) main.style.setProperty('display', 'none', 'important');
    } else {
      // Normal chat is available without enabling screen-reading or agent actions.
      if (responsibility) { responsibility.hidden = true; responsibility.style.setProperty('display', 'none', 'important'); }
      if (main) main.style.setProperty('display', 'flex', 'important');
      var screenRead = node('vzScreenReadBtn');
      if (screenRead) {
        screenRead.setAttribute('aria-label', 'Ekran okuma Agents modunda kullanılabilir');
        screenRead.title = 'Ekran okuma için AETHRION Agents modunu açın';
      }
    }
    if (kind === 'ai' && typeof w.refreshAethrionAIQuota === 'function') w.refreshAethrionAIQuota();
    var chat = node('vzChat');
    if (chat && chat.children.length <= 1) {
      var first = chat.querySelector('.vz-msg.bot');
      if (first) {
        first.innerHTML = kind === 'agents'
          ? '<div class="vz-role">✨ AETHRION AGENTS · 28 MODEL</div><div class="vz-message-body">AETHRION Agents alanına hoş geldin. Ajan araçları ve ekran izinleri için önce sorumluluk onayını tamamla.</div>'
          : '<div class="vz-role">✨ AETHRION AI · 28 MODEL</div><div class="vz-message-body">Merhaba! 13 Ollama + 7 NVIDIA NIM + 8 bulut API olmak üzere 28 modelle çalışan AETHRION AI sohbetine hoş geldin. Ücretsiz kullanım hakkı günlük 24 mesajdır. Mesajını yazıp Gönder düğmesine basabilirsin.</div>';
      }
    }
    if (kind === 'ai' && typeof w.refreshAethrionAIQuota === 'function') w.refreshAethrionAIQuota();
    var input = node('vzInput');
    if (input) w.setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (_) {} }, 80);
    return true;
  }
  function close() {
    var p = getPanel();
    if (p) {
      p.classList.remove('open', 'ae-fullscreen-ai');
      p.style.setProperty('display', 'none', 'important');
      p.style.removeProperty('visibility');
      p.style.removeProperty('opacity');
      p.style.removeProperty('pointer-events');
    }
    d.body.style.overflow = priorOverflow;
    return true;
  }

  // Keep the legacy chat UI and its existing IDs; only change its presentation/routing.
  w.openVoiceChatFullscreen = function () {
    var p=node('aaVoiceFullscreen');
    if(!p){notify('Tam ekran sesli sohbet paneli index.html içinde bulunamadı.','error');return false;}
    if(!node('aaVoiceMicBtn')){
      var mic=d.createElement('button');mic.type='button';mic.id='aaVoiceMicBtn';mic.setAttribute('aria-pressed','false');
      mic.textContent='🎤 Konuşmaya başla';
      mic.style.cssText='display:block;margin:22px auto 28px;padding:14px 24px;border:1px solid rgba(212,175,55,.45);border-radius:999px;background:linear-gradient(135deg,rgba(212,175,55,.18),rgba(124,92,255,.16));color:inherit;font-weight:700;cursor:pointer';
      mic.addEventListener('click',function(){if(typeof w.toggleAethrionVoiceInput==='function')w.toggleAethrionVoiceInput();});
      p.appendChild(mic);
    }
    p.style.setProperty('display','flex','important');p.classList.add('open','active');
    p.setAttribute('aria-hidden','false');d.body.style.overflow='hidden';
    return true;
  };
  w.closeVoiceChatFullscreen = function () {
    var p=node('aaVoiceFullscreen');if(p){p.style.setProperty('display','none','important');p.classList.remove('open','active');p.setAttribute('aria-hidden','true');}
    try{if(w.speechSynthesis)w.speechSynthesis.cancel();var mic=node('aaVoiceMicBtn');if(mic&&typeof mic.click==='function'&&mic.getAttribute('aria-pressed')==='true')mic.click();}catch(_){}
    d.body.style.overflow='';return true;
  };
  w.startJarvisMode = function () {
    var p=node('aethrionJarvisOverlay');
    if(p){p.style.setProperty('display','flex','important');p.classList.add('open','active');p.setAttribute('aria-hidden','false');d.body.style.overflow='hidden';return true;}
    var launcher=d.querySelector('.ae-jv-launcher');
    if(launcher){launcher.click();return true;}
    notify('JARVIS tam ekran paneli bulunamadı.','error');return false;
  };
  w.openFullAIPanel = function () {
    var opened = showChat('ai');
    if (opened && !w.__aethrionAIHistoryLoaded && typeof w.loadConversationHistory === 'function') {
      w.__aethrionAIHistoryLoaded = true;
      w.__aethrionAIHistoryPromise = w.loadConversationHistory();
    }
    return opened;
  };
  w.openFullAIPanel = function () { return showChat('ai'); };
  w.openAethrionAI = w.openFullAIPanel;
  w.openAethrionAlPanel = w.openFullAIPanel;
  w.openVizyonAlPanel = w.openAethrionAlPanel;
  w.openAethrionAgentsPanel = function () { return showChat('agents'); };
  w.openKocPanel = function () {
    var koc = node('kocPanelOverlay');
    if (koc) { koc.classList.add('open'); koc.style.setProperty('display', 'flex', 'important'); return true; }
    notify('AETHRION Coach paneli bulunamadı.', 'error');
    return false;
  };
  w.closeAethrionWorkspace = close;
  w.closeVizyonAlPanel = close;
  w.closeAethrionAlPanel = close;
  w.startVizyonAl = function () {
    var check = node('aaResponsibilityCheckbox');
    if (!check || !check.checked) {
      notify('AETHRION Agents modunu başlatmak için sorumluluk onayını işaretleyin.', 'warning');
      return false;
    }
    var responsibility = node('aaResponsibilityArea');
    var main = node('vzMainArea');
    if (responsibility) responsibility.style.setProperty('display', 'none', 'important');
    if (main) main.style.setProperty('display', 'flex', 'important');
    return true;
  };
  w.showDownloadOptions = w.showDownloadOptions || function () {
    notify('Uygulama indirme bağlantısı bu sürümde tanımlı değil.', 'warning');
    return false;
  };

  // Legacy links may still point to these pages; intercept them only when appropriate.
  d.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target.toLowerCase() === '_blank') return;
    var url;
    try { url = new URL(link.getAttribute('href') || '', w.location.href); } catch (_) { return; }
    if (url.origin !== w.location.origin) return;
    var path = url.pathname.toLowerCase().replace(/\/+$/, '');
    if (path.endsWith('/aethrion-ai.html')) { event.preventDefault(); event.stopImmediatePropagation(); w.openFullAIPanel(); }
    else if (path.endsWith('/aethrion-assistant.html')) { event.preventDefault(); event.stopImmediatePropagation(); w.openAethrionAgentsPanel(); } else if (path.endsWith('/vizyon-al.html')) { event.preventDefault(); event.stopImmediatePropagation(); w.openFullAIPanel(); }
  }, true);

  d.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && panel && panel.classList.contains('ae-fullscreen-ai')) close();
  });
})(window, document);

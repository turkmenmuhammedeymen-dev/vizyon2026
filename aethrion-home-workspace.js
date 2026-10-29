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
  w.openFullAIPanel = function () { return showChat('ai'); };
  w.openAethrionAI = w.openFullAIPanel;
  w.openAethrionAlPanel = function () { return showChat('agents'); };
  w.openVizyonAlPanel = w.openAethrionAlPanel;
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
    var path = url.pathname.toLowerCase();
    if (path === '/aethrion-ai.html') { event.preventDefault(); event.stopImmediatePropagation(); w.openFullAIPanel(); }
    else if (path === '/aethrion-assistant.html' || path === '/vizyon-al.html') { event.preventDefault(); event.stopImmediatePropagation(); w.openAethrionAlPanel(); }
  }, true);

  d.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && panel && panel.classList.contains('ae-fullscreen-ai')) close();
  });
})(window, document);

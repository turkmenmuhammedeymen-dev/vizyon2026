/* AETHRION in-page workspace launcher.
 * Keeps the home page mounted and opens workspace routes in an accessible full-screen shell.
 */
(function (w, d) {
  'use strict';
  if (w.__aethrionWorkspaceLauncher) return;
  w.__aethrionWorkspaceLauncher = true;
  var overlay = null, frame = null, previousFocus = null;

  var routes = {
    ai: { url: '/aethrion-ai.html', title: 'AETHRION AI', subtitle: 'Intelligence Without Limits.' },
    coach: { url: '/aethrion-assistant.html', title: 'AETHRION Coach', subtitle: 'Kişisel çalışma alanın' },
    agents: { url: '/aethrion-assistant.html', title: 'AETHRION Agents', subtitle: 'Akıllı görev ve üretim alanı' }
  };

  function build() {
    if (overlay && overlay.isConnected) return overlay;
    var style = d.createElement('style');
    style.id = 'aeWorkspaceLauncherStyles';
    style.textContent = [
      '#aeWorkspaceOverlay{position:fixed;inset:0;z-index:2147483000;display:block;background:#060913;color:#f7f8fc;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility .18s ease;font-family:Inter,system-ui,sans-serif}',
      '#aeWorkspaceOverlay.ae-open{opacity:1;visibility:visible;pointer-events:auto}',
      '#aeWorkspaceFrame{position:absolute;inset:0;display:block;width:100%;height:100%;min-height:100%;border:0;background:#080d18}',
      '#aeWorkspaceClose{position:absolute;z-index:4;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 15px;border:1px solid rgba(226,190,91,.55);border-radius:13px;background:rgba(8,13,24,.88);backdrop-filter:blur(16px);color:#f8fafc;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;touch-action:manipulation;box-shadow:0 8px 28px rgba(0,0,0,.28)}',
      '#aeWorkspaceClose:hover{background:rgba(226,190,91,.16);border-color:#e2be5b}',
      '#aeWorkspaceLoading{position:absolute;z-index:2;inset:0;display:grid;place-content:center;justify-items:center;gap:14px;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,rgba(226,190,91,.08),transparent 55%),#080d18;color:#c7d0df;font-size:13px;letter-spacing:.08em;transition:opacity .25s}',
      '#aeWorkspaceLoading:before{content:"";width:27px;height:27px;border:2px solid rgba(226,190,91,.22);border-top-color:#e2be5b;border-radius:50%;animation:aeWorkspaceSpin .8s linear infinite}',
      '@keyframes aeWorkspaceSpin{to{transform:rotate(360deg)}}',
      '@media(max-width:600px){#aeWorkspaceClose{min-height:40px;padding:0 12px;font-size:12px}}',
      '@media(prefers-reduced-motion:reduce){#aeWorkspaceOverlay,#aeWorkspaceClose{transition:none}#aeWorkspaceLoading:before{animation:none}}'
    ].join('');
    (d.head || d.documentElement).appendChild(style);

    overlay = d.createElement('section');
    overlay.id = 'aeWorkspaceOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-label', 'AETHRION çalışma alanı');
    overlay.innerHTML = '<button id="aeWorkspaceClose" type="button" aria-label="Ana ekrana dön">✕ <span>Ana ekrana dön</span></button><div id="aeWorkspaceLoading">AETHRION AI YÜKLENİYOR</div><iframe id="aeWorkspaceFrame" title="AETHRION AI tam ekran çalışma alanı" allow="clipboard-read; clipboard-write; microphone; camera; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    d.body.appendChild(overlay);
    frame = overlay.querySelector('#aeWorkspaceFrame');
    overlay.querySelector('#aeWorkspaceClose').addEventListener('click', close);
    overlay.addEventListener('click', function (event) { if (event.target === overlay) close(); });
    frame.addEventListener('load', function () {
      var loading = d.getElementById('aeWorkspaceLoading');
      if (loading) loading.style.opacity = '0';
      w.setTimeout(function () { if (loading && loading.isConnected) loading.style.display = 'none'; }, 280);
    });

  // Intercept legacy same-site links (including hard-coded Vercel URLs) so AI workspaces
  // open over the homepage instead of navigating away from it.
  d.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target.toLowerCase() === '_blank') return;
    var raw = link.getAttribute('href') || '';
    var url;
    try { url = new URL(raw, w.location.href); } catch (_) { return; }
    if (url.origin !== w.location.origin) return;
    var path = url.pathname.toLowerCase();
    var kind = null;
    if (path === '/aethrion-ai.html' || path === '/vizyon-al.html') kind = path === '/aethrion-ai.html' ? 'ai' : 'agents';
    else if (path === '/aethrion-assistant.html') kind = 'coach';
    if (!kind) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(kind);
  }, true);

    d.addEventListener('keydown', function (event) { if (event.key === 'Escape' && overlay.classList.contains('ae-open')) close(); });
    return overlay;
  }

  function open(kind) {
    var item = routes[kind] || routes.ai;
    build();
    previousFocus = d.activeElement;
    var title = overlay.querySelector('#aeWorkspaceTitle');
    var subtitle = overlay.querySelector('#aeWorkspaceSubtitle');
    var loading = overlay.querySelector('#aeWorkspaceLoading');
    if (title) title.textContent = item.title;
    if (subtitle) subtitle.textContent = item.subtitle;
    if (loading) { loading.style.display = 'grid'; loading.style.opacity = '1'; }
    overlay.classList.add('ae-open');
    overlay.setAttribute('aria-hidden', 'false');
    d.body.style.overflow = 'hidden';
    if (frame.getAttribute('src') !== item.url) frame.setAttribute('src', item.url);
    overlay.querySelector('#aeWorkspaceClose').focus({ preventScroll: true });
    return true;
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('ae-open');
    overlay.setAttribute('aria-hidden', 'true');
    d.body.style.overflow = '';
    if (frame) frame.setAttribute('src', 'about:blank');
    if (previousFocus && typeof previousFocus.focus === 'function') {
      try { previousFocus.focus({ preventScroll: true }); } catch (_) {}
    }
    return true;
  }

  // Register navigation interception before the first click.
  // build() only creates a hidden shell; it does not open or navigate anywhere.
  build();

  w.openFullAIPanel = function () { return open('ai'); };
  w.openAethrionAI = w.openFullAIPanel;
  w.openKocPanel = function () { return open('coach'); };
  w.openAethrionAlPanel = function () { return open('agents'); };
  w.openVizyonAlPanel = w.openAethrionAlPanel;
  w.closeAethrionWorkspace = close;
  w.showDownloadOptions = w.showDownloadOptions || function () {
    var url = 'https://vizyon2026.vercel.app/';
    if (typeof w.showNotification === 'function') w.showNotification('Uygulama indirme bağlantısı bu sürümde tanımlı değil. Destek bölümünden güncel kurulum bağlantısını kontrol edin.', 'warning');
    else w.alert('Uygulama indirme bağlantısı bu sürümde tanımlı değil.');
    return false;
  };
})(window, document);

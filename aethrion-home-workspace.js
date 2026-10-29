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
      '#aeWorkspaceOverlay{position:fixed;inset:0;z-index:2147483000;display:grid;grid-template-rows:auto minmax(0,1fr);background:#060913;color:#f7f8fc;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(12px) scale(.995);transition:opacity .22s ease,transform .22s ease,visibility .22s ease;font-family:Inter,system-ui,sans-serif}',
      '#aeWorkspaceOverlay.ae-open{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1)}',
      '#aeWorkspaceBar{display:flex;align-items:center;gap:14px;min-height:68px;padding:12px clamp(14px,3vw,34px);border-bottom:1px solid rgba(226,190,91,.24);background:linear-gradient(110deg,rgba(18,26,45,.98),rgba(7,11,22,.98));box-shadow:0 10px 35px rgba(0,0,0,.25)}',
      '#aeWorkspaceBrand{display:flex;align-items:center;gap:12px;min-width:0;flex:1}',
      '#aeWorkspaceMark{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border:1px solid rgba(231,195,100,.62);border-radius:13px;color:#f1d58c;font-weight:900;letter-spacing:-.08em;background:linear-gradient(145deg,rgba(226,190,91,.18),rgba(255,255,255,.025));box-shadow:inset 0 0 22px rgba(226,190,91,.07),0 0 28px rgba(226,190,91,.08)}',
      '#aeWorkspaceTitle{margin:0;font-size:clamp(14px,2vw,18px);font-weight:800;letter-spacing:.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#aeWorkspaceSubtitle{margin:3px 0 0;color:#9aa7bf;font-size:11px;letter-spacing:.04em}',
      '#aeWorkspaceClose{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 15px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.055);color:#f8fafc;font:700 13px inherit;cursor:pointer;touch-action:manipulation;transition:background .18s,border-color .18s,transform .18s}',
      '#aeWorkspaceClose:hover{background:rgba(226,190,91,.14);border-color:rgba(226,190,91,.55);transform:translateY(-1px)}',
      '#aeWorkspaceFrame{display:block;width:100%;height:100%;min-height:0;border:0;background:#080d18}',
      '#aeWorkspaceLoading{position:absolute;inset:68px 0 0;display:grid;place-items:center;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,rgba(226,190,91,.08),transparent 55%),#080d18;color:#c7d0df;font-size:13px;letter-spacing:.08em;transition:opacity .25s}',
      '#aeWorkspaceLoading:before{content:"";width:27px;height:27px;margin-bottom:14px;border:2px solid rgba(226,190,91,.22);border-top-color:#e2be5b;border-radius:50%;animation:aeWorkspaceSpin .8s linear infinite}',
      '#aeWorkspaceLoading{align-content:center;gap:0}',
      '@keyframes aeWorkspaceSpin{to{transform:rotate(360deg)}}',
      '@media(max-width:600px){#aeWorkspaceBar{min-height:60px;padding:9px 12px;gap:8px}#aeWorkspaceMark{width:34px;height:34px;flex-basis:34px;border-radius:10px}#aeWorkspaceSubtitle{font-size:10px}#aeWorkspaceClose{min-height:40px;padding:0 11px;font-size:12px}#aeWorkspaceClose span{display:none}#aeWorkspaceLoading{inset:60px 0 0}}',
      '@media(prefers-reduced-motion:reduce){#aeWorkspaceOverlay,#aeWorkspaceClose{transition:none}#aeWorkspaceLoading:before{animation:none}}'
    ].join('');
    (d.head || d.documentElement).appendChild(style);

    overlay = d.createElement('section');
    overlay.id = 'aeWorkspaceOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-label', 'AETHRION çalışma alanı');
    overlay.innerHTML = '<header id="aeWorkspaceBar"><div id="aeWorkspaceBrand"><div id="aeWorkspaceMark" aria-hidden="true">A27</div><div style="min-width:0"><h2 id="aeWorkspaceTitle">AETHRION</h2><p id="aeWorkspaceSubtitle">Intelligence Without Limits.</p></div></div><button id="aeWorkspaceClose" type="button" aria-label="Çalışma alanını kapat">✕ <span>Kapat</span></button></header><div style="position:relative;min-height:0"><div id="aeWorkspaceLoading">ÇALIŞMA ALANI HAZIRLANIYOR</div><iframe id="aeWorkspaceFrame" title="AETHRION çalışma alanı" allow="clipboard-read; clipboard-write; microphone; camera; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
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

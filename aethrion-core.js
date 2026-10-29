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
  install('openModelsShowcase', function () { go('/aethrion-ai.html#models'); });
  install('open3DBuilder', function () { go('/3d-studio.html'); });
  install('open3DStudio', function () { go('/3d-studio.html'); });
  install('openVideoEditor', function () { go('/video-editor.html'); });
  install('openVideoStudio', function () { go('/video-studio.html'); });
  install('openCodeEditor', function () { go('/kod-editoru.html'); });
  install('openAcademy', function () { go('/bana-ogret.html'); });
  install('openDocumentation', function () { go('/dokumantasyon.html'); });
  install('openA27ApiGuide', function () { go('/api.html'); });
  install('openV27ApiGuide', function () { go('/api.html'); });
  install('openV27ApiKeyGenerator', function () { go('/api.html#keys'); });
  install('openA27ApiKeyGenerator', function () { go('/api.html#keys'); });
  install('openJobMarket', function () { go('/is-ilanlari.html'); });
  install('toggleTeamPage', function () { go('/topluluk.html'); });
  install('openPersonalAssistant', function () { go('/aethrion-assistant.html'); });
  install('openContestPage', function () { go('/topluluk.html#contest'); });
  install('openSettingsModal', function () { if (!w.openModal('settingsModal')) go('/ayarlar.html'); });
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

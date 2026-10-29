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
  install('openJobMarket', function () { go('/topluluk.html'); });
  install('openProfileModal', function () { if (!w.openModal('profileModal')) go('/hesap-ve-oturum-guvenligi.html'); });
  install('openAvatarCreator', function () { if (!scrollTo('avatarCreatorModal')) go('/hesap-ve-oturum-guvenligi.html'); });
  install('openSettingsModal', function () { if (!scrollTo('settingsModal')) go('/hesap-ve-oturum-guvenligi.html'); });
  install('openVizyonAlPanel', function () { go('/aethrion-assistant.html'); });
  install('closeVizyonAlPanel', function () { var p = byId('vizyonAlPanel'); if (p) p.style.display = 'none'; else go('/aethrion-assistant.html'); });
  install('startVizyonAl', function () { go('/aethrion-assistant.html'); });
  install('setVizyonAlMode', function (mode) {
    d.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-mode') === String(mode)); });
    try { sessionStorage.setItem('aethrion_ai_mode', String(mode || 'normal')); } catch (e) {}
  });
  install('removeVizyonAlFile', function () { var f = byId('vzFileInput'); if (f) f.value = ''; var p = byId('vzFilePreview'); if (p) p.style.display = 'none'; });
  install('startScreenReading', function () { go('/aethrion-assistant.html'); });
  install('startVizyonAlVoiceInput', function () { go('/aethrion-assistant.html'); });
  install('sendVizyonAlMessage', function () { go('/aethrion-assistant.html'); });
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
  install('closeVideoEditor', function () { var p = byId('videoEditorModal'); if (p) p.style.display = 'none'; else go('/index.html#features'); });
  install('videoEditorPlay', function () { var v = byId('videoPreview'); if (v && v.play) v.play(); });
  install('videoEditorPause', function () { var v = byId('videoPreview'); if (v && v.pause) v.pause(); });
  install('videoEditorReset', function () { var v = byId('videoPreview'); if (v) { v.pause(); v.currentTime = 0; } });
  install('videoEditorTrim', function () { w.showNotification && w.showNotification('Önce video çalışma alanını açın.', 'warning'); });
  install('openCategoryPanel', function (name) { w.openCategory(name); });
  install('openJobCreateForm', function () { go('/topluluk.html'); });
  install('closeJobMarket', function () { var p = byId('jobMarketModal'); if (p) p.style.display = 'none'; else go('/topluluk.html'); });
  install('loadJobMarket', function () { go('/topluluk.html'); });
  install('closeJobCreateForm', function () { var p = byId('jobCreateModal'); if (p) p.style.display = 'none'; else go('/topluluk.html'); });
  install('submitJobCreate', function () { w.showNotification && w.showNotification('İlan oluşturmak için Topluluk bölümünü açın.', 'warning'); go('/topluluk.html'); });
  install('openJobEdit', function () { go('/topluluk.html'); });
  install('deleteJobListing', function () { go('/topluluk.html'); });
  install('closeJobDetail', function () { var p = byId('jobDetailModal'); if (p) p.style.display = 'none'; });
  install('acceptJobListing', function () { go('/topluluk.html'); });
  install('closeModelsShowcase', function () { var p = byId('modelsShowcaseModal'); if (p) p.style.display = 'none'; });
  install('closeCategoryPanel', function () { var p = byId('categoryPanelModal'); if (p) p.style.display = 'none'; });
  install('closeJarvisMode', function () { go('/aethrion-jarvis.html'); });
  install('jarvisQuickCommand', function () { go('/aethrion-jarvis.html'); });
  install('toggleJarvisListening', function () { go('/aethrion-jarvis.html'); });
  install('jarvisToggleMute', function () { if (w.speechSynthesis) w.speechSynthesis.cancel(); });
  install('jarvisClearTranscript', function () { var p = byId('aeJvMessages'); if (p) p.replaceChildren(); });
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

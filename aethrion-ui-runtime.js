/* AETHRION UI runtime repairs recovered from the last known complete homepage revision.
 * Loaded after core features and module enhancements so compatibility actions are available.
 */

(function () {
  'use strict';
  var toastTimer = null;
  function getToast() {
    var node = document.getElementById('notification');
    if (!node) {
      node = document.createElement('div');
      node.id = 'notification';
      node.className = 'notification';
    }
    if (node.parentNode !== document.body) document.body.appendChild(node);
    node.style.zIndex = '2147483647';
    node.setAttribute('aria-atomic', 'true');
    return node;
  }
  window.showNotification = function (message, type) {
    var node = getToast();
    if (toastTimer) window.clearTimeout(toastTimer);
    var kind = type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success');
    var prefix = kind === 'error' ? '✕ ' : (kind === 'warning' ? '⚠ ' : '✓ ');
    node.replaceChildren();
    node.className = 'notification show ' + kind;
    node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    node.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
    var text = document.createElement('span');
    text.className = 'aethrion-toast-message';
    text.textContent = prefix + String(message == null ? '' : message);
    node.appendChild(text);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'aethrion-toast-close';
    close.setAttribute('aria-label', 'Bildirimi kapat');
    close.textContent = '×';
    close.addEventListener('click', function () {
      node.classList.remove('show');
      if (toastTimer) window.clearTimeout(toastTimer);
      toastTimer = null;
    });
    node.appendChild(close);
    toastTimer = window.setTimeout(function () {
      node.classList.remove('show');
      toastTimer = null;
    }, kind === 'error' ? 10000 : (kind === 'warning' ? 8500 : 6500));
  };

  window.closeNavbarAvatarMenu = function () {
    var wrapper = document.getElementById('navbarAvatarWrapper');
    if (wrapper) wrapper.classList.remove('menu-open');
    var menu = document.getElementById('navbarAvatarMenu');
    if (menu) menu.setAttribute('aria-hidden', 'true');
  };
  window.toggleNavbarAvatarMenu = function (event) {
    if (event && event.target && event.target.closest && event.target.closest('#navbarAvatarMenu')) return;
    if (event && event.stopPropagation) event.stopPropagation();
    var wrapper = document.getElementById('navbarAvatarWrapper');
    var menu = document.getElementById('navbarAvatarMenu');
    if (!wrapper || !menu) {
      window.showNotification('Profil menüsü bu görünümde kullanılamıyor.', 'warning');
      return;
    }
    var opening = !wrapper.classList.contains('menu-open');
    wrapper.classList.toggle('menu-open', opening);
    menu.setAttribute('aria-hidden', opening ? 'false' : 'true');
  };
  if (!window.__aethrionAvatarMenuEventsBound) {
    window.__aethrionAvatarMenuEventsBound = true;
    document.addEventListener('click', function (event) {
      var wrapper = document.getElementById('navbarAvatarWrapper');
      if (wrapper && !wrapper.contains(event.target)) window.closeNavbarAvatarMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') window.closeNavbarAvatarMenu();
    });
  }

  function focusField(id) {
    var field = document.getElementById(id);
    if (!field) return false;
    var overlay = field.closest && field.closest('.modal-overlay');
    if (overlay) {
      overlay.classList.add('open');
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
    }
    field.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    try { field.focus({ preventScroll: true }); } catch (e) { try { field.focus(); } catch (_) {} }
    return true;
  }
  function parseCall(name, params) {
    if (!window.Parse || !window.Parse.Cloud || typeof window.Parse.Cloud.run !== 'function') {
      window.showNotification('Sunucu bağlantısı hazır değil. Biraz sonra tekrar deneyin.', 'error');
      return Promise.resolve(null);
    }
    return window.Parse.Cloud.run(name, params || {}).then(function (result) {
      if (result && result.success === false) window.showNotification(result.message || result.error || 'İşlem tamamlanamadı.', 'error');
      return result;
    }).catch(function (error) {
      window.showNotification(error && error.message ? error.message : 'İşlem tamamlanamadı. Sunucu günlüklerini kontrol edin.', 'error');
      return null;
    });
  }
  function isFallbackStub(fn) {
    if (typeof fn !== 'function') return true;
    try { return /Fonksiyon eksik/.test(Function.prototype.toString.call(fn)); } catch (e) { return false; }
  }
  function install(name, handler) {
    if (isFallbackStub(window[name])) window[name] = handler;
  }

  install('openAethrionAlPanel', function () {
    if (typeof window.openFullAIPanel === 'function') return window.openFullAIPanel();
    window.location.href = '/aethrion-assistant.html';
  });
  install('startJarvisMode', function () {
    if (typeof window.openFullAIPanel === 'function') window.openFullAIPanel();
    var voiceButton = document.querySelector('[onclick*="Jarvis"], [onclick*="Voice"], [onclick*="voice"], [data-action*="voice"]');
    if (voiceButton) voiceButton.click();
    else window.showNotification('AI paneli açıldı. Sesli mod kontrolü bu sürümde görünür değil.', 'warning');
  });
  install('openVoiceChatFullscreen', function () {
    if (typeof window.openFullAIPanel === 'function') window.openFullAIPanel();
    var voiceButton = document.querySelector('[onclick*="Voice"], [onclick*="voice"], [data-action*="voice"]');
    if (voiceButton) voiceButton.click();
    else window.showNotification('AI paneli açıldı. Sesli sohbet düğmesi bulunamadı.', 'warning');
  });
  install('createProjectWizard', function () { window.location.href = '/3d-studio.html'; });
  install('openMarket', function () {
    var panel = document.getElementById('marketOverlay') || document.getElementById('marketModal') || document.querySelector('.market-overlay');
    if (panel) { panel.style.display = 'flex'; panel.classList.add('open'); return; }
    var target = document.getElementById('store') || document.getElementById('pricingSection') || document.getElementById('pricing');
    if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    else window.location.href = '/topluluk.html';
  });
  install('toggleTeamPage', function () { window.location.href = '/topluluk.html'; });
  install('openPersonalAssistant', function () {
    if (typeof window.openFullAIPanel === 'function') return window.openFullAIPanel();
    window.location.href = '/aethrion-assistant.html';
  });
  install('openContestPage', function () {
    var target = document.getElementById('contestSection') || document.getElementById('contestContainer') || document.querySelector('[id*="contest"]');
    if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    else window.location.href = '/topluluk.html#contest';
  });
  install('openAdminAssign', function () {
    if (focusField('roleAssignEmail')) return;
    if (typeof window.assignAdminByEmail === 'function') return window.assignAdminByEmail();
    window.showNotification('Admin atama alanı bulunamadı; yönetici panelini kontrol edin.', 'warning');
  });
  install('openBetaAssign', function () {
    if (focusField('betaEmailInput')) return;
    if (typeof window.assignBetaByEmail === 'function') return window.assignBetaByEmail();
    window.showNotification('Beta atama alanı bulunamadı; yönetici panelini kontrol edin.', 'warning');
  });
  install('openPollCreator', function () {
    if (!focusField('pollQuestionInput')) window.showNotification('Anket oluşturma alanı bulunamadı.', 'warning');
  });
  install('openAnnouncementCreator', function () {
    if (!focusField('announcementTitle')) window.showNotification('Duyuru oluşturma alanı bulunamadı.', 'warning');
  });
  install('openUserManagement', function () {
    if (typeof window.loadUserList === 'function') window.loadUserList();
    if (!focusField('userSearchInput')) focusField('userList');
  });
  install('newConversation', function () {
    if (typeof window.startConversation === 'function') return window.startConversation();
    window.showNotification('Yeni sohbet başlatma alanı bu görünümde bulunamadı.', 'warning');
  });
  install('toggleConversationHistory', function () {
    var panel = document.getElementById('conversationHistoryList') || document.getElementById('conversationHistoryItems');
    if (!panel) {
      if (typeof window.loadConversationHistory === 'function') return window.loadConversationHistory();
      window.showNotification('Sohbet geçmişi alanı bulunamadı.', 'warning');
      return;
    }
    var opening = panel.hidden || panel.style.display === 'none';
    panel.hidden = !opening;
    panel.style.display = opening ? '' : 'none';
    if (opening && typeof window.loadConversationHistory === 'function') window.loadConversationHistory();
  });
  install('shareCurrentConversation', async function () {
    var id = window.fullAIConversationId || window.currentConversationId || window.kocConversationId;
    if (!id) return window.showNotification('Önce paylaşılacak bir sohbet açın.', 'warning');
    var result = await parseCall('shareConversation', {conversationId:id});
    if (result && result.success && result.shareUrl) {
      try { await navigator.clipboard.writeText(result.shareUrl); window.showNotification('Paylaşım bağlantısı kopyalandı.', 'success'); }
      catch (e) { window.prompt('Sohbet bağlantısı:', result.shareUrl); }
    }
  });
  install('deleteCurrentConversation', async function () {
    var id = window.fullAIConversationId || window.currentConversationId || window.kocConversationId;
    if (!id) return window.showNotification('Önce silinecek bir sohbet açın.', 'warning');
    if (!window.confirm('Bu sohbet ve ilişkili mesajlar kalıcı olarak silinsin mi?')) return;
    var result = await parseCall('deleteConversation', {conversationId:id});
    if (result && result.success) {
      window.fullAIConversationId = null; window.currentConversationId = null; window.kocConversationId = null;
      if (typeof window.loadConversationHistory === 'function') window.loadConversationHistory();
      window.showNotification('Sohbet silindi.', 'success');
    }
  });
  install('renameCurrentConversation', async function () {
    var id = window.fullAIConversationId || window.currentConversationId || window.kocConversationId;
    if (!id) return window.showNotification('Önce yeniden adlandırılacak bir sohbet açın.', 'warning');
    var name = window.prompt('Yeni sohbet adı:');
    if (!name || !name.trim()) return;
    var result = await parseCall('renameConversation', {conversationId:id, name:name.trim().slice(0,100)});
    if (result && result.success) {
      if (typeof window.loadConversationHistory === 'function') window.loadConversationHistory();
      window.showNotification('Sohbet adı güncellendi.', 'success');
    }
  });
  install('showDownloadOptions', function () {
    var modal = document.getElementById('downloadModal');
    if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; modal.setAttribute('aria-hidden','false'); }
    else window.showNotification('İndirme penceresi bulunamadı.', 'warning');
  });
  install('closeDownloadOptions', function () {
    if (typeof window.closeModal === 'function') window.closeModal('downloadModal');
    else { var modal=document.getElementById('downloadModal'); if(modal){modal.classList.remove('open');modal.style.display='none';} }
  });
  install('buyPackage', function () {
    var target = document.getElementById('pricingSection') || document.getElementById('pricing') || document.querySelector('[id*="pricing"]');
    if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    else window.showNotification('Paketler alanı bulunamadı. Ödeme işlemi ayrıca yapılandırılmalıdır.', 'warning');
  });
  install('sendBlogNotification', async function () {
    var subject = window.prompt('Blog bildirimi başlığı:');
    if (!subject || !subject.trim()) return;
    var message = window.prompt('Abonelere gönderilecek mesaj:');
    if (!message || !message.trim()) return;
    var result = await parseCall('sendBlogUpdateToSubscribers', {subject:subject.trim().slice(0,160), message:message.trim().slice(0,4000)});
    if (result && result.success) window.showNotification('Blog bildirimi gönderildi: ' + (result.sentCount || 0) + ' alıcı.', 'success');
  });
  install('sendSystemNotification', async function () {
    var version = window.prompt('Sistem sürümü:');
    if (!version || !version.trim()) return;
    var changes = window.prompt('Güncelleme açıklaması:');
    if (!changes || !changes.trim()) return;
    var result = await parseCall('sendSystemUpdateToSubscribers', {version:version.trim().slice(0,40), changes:changes.trim().slice(0,4000)});
    if (result && result.success) window.showNotification('Sistem bildirimi gönderildi: ' + (result.sentCount || 0) + ' alıcı.', 'success');
  });
  install('banUserByEmail', async function () {
    var email = window.prompt('Engellenecek kullanıcının e-postası:');
    if (email && typeof window.banUserEmail === 'function') await window.banUserEmail(email.trim());
    else if (email) window.showNotification('Kullanıcı engelleme işlevi bulunamadı.', 'warning');
  });
  install('unbanUserByEmail', async function () {
    var email = window.prompt('Engeli kaldırılacak kullanıcının e-postası:');
    if (email && typeof window.unbanUserEmail === 'function') await window.unbanUserEmail(email.trim());
    else if (email) window.showNotification('Engel kaldırma işlevi bulunamadı.', 'warning');
  });
  install('closeAethrionResponsibilityModal', function () {
    if (typeof window.closeModal === 'function') window.closeModal('aethrionResponsibilityModal');
    var modal = document.getElementById('aethrionResponsibilityModal');
    if (modal) { modal.classList.remove('open'); modal.style.display='none'; }
  });
  install('confirmAethrionResponsibilityAction', function () {
    var check = document.getElementById('aaResponsibilityCheckbox');
    if (check && !check.checked) return window.showNotification('Devam etmek için sorumluluk onayını işaretleyin.', 'warning');
    window.vizyonAlResponsibilityAccepted = true;
    if (typeof window.handleVizyonAlResponsibility === 'function') window.handleVizyonAlResponsibility();
    else if (typeof window.showVizyonAlMainArea === 'function') window.showVizyonAlMainArea();
    window.closeNavbarAvatarMenu();
  });
  install('openJobEdit', function () {
    if (typeof window.editJobListing === 'function') return window.editJobListing();
    var button = document.getElementById('jobDetailEditBtn');
    if (button) button.click();
    else window.showNotification('İlan düzenleme alanı bulunamadı.', 'warning');
  });

  window.updateStats = async function () {
    try {
      if (!window.Parse || !window.Parse.Cloud || !window.parseInitialized) return;
      var result = await window.Parse.Cloud.run('getPublicStats', {});
      if (!result || !result.success) return;
      var c1 = document.getElementById('counter1');
      var c2 = document.getElementById('counter2');
      var c3 = document.getElementById('counter3');
      if (c1 && Number.isFinite(Number(result.activeUsers))) c1.textContent = Number(result.activeUsers).toLocaleString('tr-TR');
      if (c2 && Number.isFinite(Number(result.totalQueries))) c2.textContent = Number(result.totalQueries).toLocaleString('tr-TR');
      if (c3 && Number.isFinite(Number(result.completedProjects))) c3.textContent = Number(result.completedProjects).toLocaleString('tr-TR');
    } catch (e) {
      console.warn('[AETHRION Stats] Public counters could not be refreshed.');
    }
  };
})();

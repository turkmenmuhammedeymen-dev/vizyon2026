(function () {
'use strict';
var GROUP_LABELS = { CORE: 'YAPAY ZEKÂ', CREATE: 'ÜRETİM ARAÇLARI', PLATFORM: 'PLATFORM', ADVANCED: 'GELİŞTİRİCİ ARAÇLARI', ACCOUNT: 'HESAP', OTHER: 'DİĞER ÖZELLİKLER' };
var FALLBACK_FEATURES = [
 {group:'CORE',icon:'✦',name:'AETHRION AI',desc:'Yapay zekâ çalışma alanı',action:'openFullAIPanel'},
 {group:'CORE',icon:'◈',name:'AETHRION Agents',desc:'Ajan, ekran okuma ve dosya araçları',action:'openAethrionAlPanel'},
 {group:'CORE',icon:'◎',name:'AETHRION Coach',desc:'Kişisel AI asistanı',action:'openKocPanel'},
 {group:'CORE',icon:'◉',name:'Model Kataloğu',desc:'Tanımlı model seçeneklerini incele',action:'openModelsShowcase'},
 {group:'CREATE',icon:'◇',name:'3D Studio',desc:'Üç boyutlu tasarım araçları',action:'open3DBuilder',href:'/3d-studio.html'},
 {group:'CREATE',icon:'▶',name:'Video Editör',desc:'Video düzenleme çalışma alanı',action:'openVideoEditor'},
 {group:'CREATE',icon:'▣',name:'Video Stüdyosu',desc:'Video fikirleri ve üretim araçları',action:'openVideoStudio'},
 {group:'PLATFORM',icon:'⌂',name:'Topluluk ve Takımlar',desc:'Takım ve ortak proje alanları',action:'toggleTeamPage',href:'/topluluk.html'},
 {group:'PLATFORM',icon:'▤',name:'Projelerim',desc:'Projelerine ve kayıtlarına eriş',action:'scrollToProjects'},
 {group:'ADVANCED',icon:'⌘',name:'A27 API Anahtarı',desc:'API erişim seçenekleri',action:'openA27ApiKeyGenerator',href:'/api.html#keys'},
 {group:'ADVANCED',icon:'↗',name:'A27 API Rehberi',desc:'API belgeleri ve örnekler',action:'openA27ApiGuide',href:'/api.html'},
 {group:'ADVANCED',icon:'▥',name:'Dokümantasyon',desc:'Teknik belgeler ve kullanım rehberi',action:'openDocumentation',href:'/dokumantasyon.html'},
 {group:'ACCOUNT',icon:'⚙',name:'Ayarlar',desc:'Hesap ve uygulama tercihleri',action:'openSettingsModal'},
 {group:'ACCOUNT',icon:'◌',name:'Hesap bilgilerim',desc:'Profil, üyelik ve cihaz bilgileri',action:'openAccountInfo'}
];
var ROUTES = {
 openAethrionAlPanel:'/aethrion-assistant.html', openVizyonAlPanel:'/aethrion-assistant.html',
 openFullAIPanel:'/aethrion-ai.html', openAethrionAI:'/aethrion-ai.html', openKocPanel:'/aethrion-assistant.html',
 open3DBuilder:'/3d-studio.html', openA27ApiGuide:'/api.html', openV27ApiGuide:'/api.html',
 openA27ApiKeyGenerator:'/api.html#keys', createA27ApiKey:'/api.html#keys',
 openVideoEditor:'/index.html#features', openVideoStudio:'/index.html#features',
 openModelsShowcase:'/aethrion-ai.html#models', toggleTeamPage:'/topluluk.html',
 openContestPage:'/topluluk.html', scrollToAcademy:'/bana-ogret.html', openAcademy:'/bana-ogret.html',
 openDocumentation:'/dokumantasyon.html', openBlog:'/blog.html', openAbout:'/hakkimizda.html'
};
var splashDone = false;
var menuReady = false;
var welcomeReady = false;
function qs(sel, root) { return (root || document).querySelector(sel); }
function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]); }); }
function getAttr(user, key) {
 try { if (user && typeof user.get === 'function') return user.get(key) || ''; } catch (e) {}
 try { return user && user[key] || ''; } catch (e2) { return ''; }
}
function parseSavedUser() {
 try { return JSON.parse(localStorage.getItem('aethrion_user') || 'null'); } catch (e) { return null; }
}
function authUser() {
 try { if (window.currentUser) return window.currentUser; } catch (e) {}
 try { if (window.Parse && Parse.User && typeof Parse.User.current === 'function') { var u = Parse.User.current(); if (u) return u; } } catch (e2) {}
 if (document.body && document.body.classList.contains('logged-in-user')) return parseSavedUser();
 return null;
}
function userName() {
 var user = authUser();
 var name = getAttr(user, 'name') || getAttr(user, 'fullName') || getAttr(user, 'username');
 if (!name) name = [getAttr(user, 'firstName'), getAttr(user, 'lastName')].filter(Boolean).join(' ');
 if (!name) { var email = getAttr(user, 'email'); if (email) name = email.split('@')[0]; }
 if (!name) { var saved = parseSavedUser(); if (saved && saved.name) name = saved.name; }
 return String(name || 'Kullanıcı').trim();
}
function userRole() {
 var user = authUser(), role = getAttr(user, 'role') || 'user', plan = getAttr(user, 'plan');
 var roles = { founder:'Kurucu', admin:'Yönetici', moderator:'Moderatör / Tasarımcı', beta:'Beta üyesi', user:'Üye' };
 return (roles[String(role).toLowerCase()] || 'Üye') + (plan ? ' · ' + String(plan).toUpperCase() + ' plan' : '');
}
function getFeatures() {
 var source = Array.isArray(window.FEATURE_LIST) && window.FEATURE_LIST.length ? window.FEATURE_LIST : FALLBACK_FEATURES;
 var seen = Object.create(null), items = [];
 source.forEach(function (feature) {
  if (!feature || !(feature.name || feature.title)) return;
  var name = String(feature.name || feature.title);
  var action = String(feature.action || feature.onclick || '');
  var key = String(feature.group || 'OTHER') + '|' + name + '|' + action;
  if (seen[key]) return;
  seen[key] = true;
  items.push({
   group:String(feature.group || 'OTHER'), icon:String(feature.icon || '✦'),
   name:name, desc:String(feature.desc || feature.description || 'AETHRION çalışma alanını aç'),
   action:action, href:String(feature.href || feature.url || '')
  });
 });
 return items.length ? items : FALLBACK_FEATURES.slice();
}
function ensureDrawer() {
 var backdrop = qs('#aethrionExperienceBackdrop');
 if (!backdrop) {
  backdrop = document.createElement('div');
  backdrop.id = 'aethrionExperienceBackdrop';
  backdrop.addEventListener('click', closeDrawer);
  document.body.appendChild(backdrop);
 }
 var drawer = qs('#aethrionExperienceDrawer');
 if (!drawer) {
  drawer = document.createElement('aside');
  drawer.id = 'aethrionExperienceDrawer';
  drawer.setAttribute('aria-label', 'AETHRION özellikler menüsü');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML =
   '<div class="aed-head"><div class="aed-brand"><div class="aed-mark">A</div><div><h2 class="aed-title">AETHRION</h2><span class="aed-subtitle">Özellikler ve çalışma alanları</span></div></div><button class="aed-close" type="button" aria-label="Menüyü kapat">×</button></div>' +
   '<div class="aed-search"><input id="aedSearch" type="search" autocomplete="off" placeholder="Özellik ara…" aria-label="Özellik ara"></div>' +
   '<div class="aed-list" id="aedList"></div><div class="aed-foot">Seçilen özellik, kullanılabilir uygulama paneline veya ilgili sayfasına yönlendirir. Erişim bazı özelliklerde oturum ya da plana bağlı olabilir.</div>';
  qs('.aed-close', drawer).addEventListener('click', closeDrawer);
  qs('#aedSearch', drawer).addEventListener('input', function () { renderDrawerItems(this.value); });
  document.body.appendChild(drawer);
 }
 menuReady = true;
 return drawer;
}
function renderDrawerItems(query) {
 var drawer = ensureDrawer(), list = qs('#aedList', drawer);
 var q = String(query || '').trim().toLocaleLowerCase('tr-TR');
 var items = getFeatures().filter(function (feature) {
  return !q || (feature.name + ' ' + feature.desc + ' ' + feature.group).toLocaleLowerCase('tr-TR').indexOf(q) !== -1;
 });
 var grouped = Object.create(null);
 items.forEach(function (feature) { (grouped[feature.group] || (grouped[feature.group] = [])).push(feature); });
 var html = '';
 Object.keys(grouped).forEach(function (group) {
  html += '<div class="aed-group-title">' + escapeHtml(GROUP_LABELS[group] || group) + '</div>';
  grouped[group].forEach(function (feature) {
   html += '<button type="button" class="aed-item" data-ae-action="' + escapeHtml(feature.action) + '" data-ae-name="' + escapeHtml(feature.name) + '" data-ae-href="' + escapeHtml(feature.href) + '">' +
    '<span class="aed-icon">' + escapeHtml(feature.icon) + '</span><span class="aed-item-text"><strong>' + escapeHtml(feature.name) + '</strong><small>' + escapeHtml(feature.desc) + '</small></span><span class="aed-chevron" aria-hidden="true">›</span></button>';
  });
 });
 list.innerHTML = html || '<div class="aed-empty">Bu aramayla eşleşen özellik bulunamadı.</div>';
}
function openDrawer() {
 var drawer = ensureDrawer(), backdrop = qs('#aethrionExperienceBackdrop');
 renderDrawerItems(qs('#aedSearch', drawer).value);
 drawer.classList.add('open');
 drawer.setAttribute('aria-hidden', 'false');
 backdrop.classList.add('show');
 document.body.classList.add('aethrion-experience-menu-open');
 var input = qs('#aedSearch', drawer);
 if (input) setTimeout(function () { try { input.focus({ preventScroll:true }); } catch (e) { input.focus(); } }, 120);
}
function closeDrawer() {
 var drawer = qs('#aethrionExperienceDrawer'), backdrop = qs('#aethrionExperienceBackdrop');
 if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
 if (backdrop) backdrop.classList.remove('show');
 if (document.body) document.body.classList.remove('aethrion-experience-menu-open');
}
function ensureTrigger() {
 if (!document.body) return;
 var user = authUser();
 var logged = !!user || document.body.classList.contains('logged-in-user');
 var buttons = qsa('#aethrionFeaturesTrigger');
 var trigger = buttons[0] || null;
 buttons.slice(1).forEach(function (node) { node.remove(); });
 if (!trigger && logged) {
  trigger = document.createElement('button');
  trigger.id = 'aethrionFeaturesTrigger';
  trigger.type = 'button';
  trigger.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(trigger);
 }
 if (trigger) {
  trigger.type = 'button';
  trigger.title = 'AETHRION özellikler menüsünü aç';
  trigger.setAttribute('aria-label', 'AETHRION özellikler menüsünü aç');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.onclick = null;
  trigger.style.removeProperty('display');
 }
}
function showWelcome() {
 var user = authUser(), dashboard = qs('#dashboardArea');
 if (!user || !dashboard) return false;
 var wrapper = qs('.dashboard-content-wrapper', dashboard) || qs('.dashboard-content', dashboard) || dashboard;
 var welcome = qs('#aethrionExperienceWelcome');
 if (!welcome) {
  welcome = document.createElement('section');
  welcome.id = 'aethrionExperienceWelcome';
  welcome.setAttribute('aria-labelledby', 'aewName');
  wrapper.insertBefore(welcome, wrapper.firstChild);
 } else if (welcome.parentElement !== wrapper) wrapper.insertBefore(welcome, wrapper.firstChild);
 var name = userName(), role = userRole();
 welcome.innerHTML =
  '<div class="aew-eyebrow"><span class="aew-dot"></span> AETHRION · PERSONAL WORKSPACE</div>' +
  '<p class="aew-greeting">Oturumunuz başarıyla açıldı.</p>' +
  '<h1 class="aew-name" id="aewName">Hoş geldiniz,<br><em>' + escapeHtml(name) + '</em></h1>' +
  '<div class="aew-role">◈ ' + escapeHtml(role) + '</div>' +
  '<p class="aew-copy">AETHRION çalışma alanınız hazır. Yapay zekâ, üretim araçları, geliştirici belgeleri ve hesap hizmetleri tek bir merkezde.</p>' +
  '<div class="aew-grid">' +
   '<button type="button" class="aew-shortcut" data-ae-quick="menu"><span class="aew-shortcut-icon">⌘</span><span class="aew-shortcut-copy"><strong>Tüm özellikler</strong><small>Çalışma alanlarını görüntüleyin</small></span><span class="aew-shortcut-arrow">›</span></button>' +
   '<button type="button" class="aew-shortcut" data-ae-quick="ai"><span class="aew-shortcut-icon">✦</span><span class="aew-shortcut-copy"><strong>AETHRION AI</strong><small>Yapay zekâ araçlarını açın</small></span><span class="aew-shortcut-arrow">›</span></button>' +
   '<button type="button" class="aew-shortcut" data-ae-quick="api"><span class="aew-shortcut-icon">⌘</span><span class="aew-shortcut-copy"><strong>A27 API</strong><small>Geliştirici araçları ve belgeler</small></span><span class="aew-shortcut-arrow">›</span></button>' +
  '</div><div class="aew-actions"><button class="aew-primary" type="button" data-ae-quick="menu">Özellikleri keşfet <span aria-hidden="true">↗</span></button><button class="aew-secondary" type="button" data-ae-quick="account">Hesap bilgilerim</button></div>';
 welcome.style.display = 'block';
 document.body.classList.add('logged-in-user');
 document.body.classList.add('aethrion-experience-welcome-active');
 dashboard.style.setProperty('display', 'block', 'important');
 dashboard.style.setProperty('visibility', 'visible', 'important');
 dashboard.style.setProperty('opacity', '1', 'important');
 var main = qs('#mainSite');
 if (main) main.style.setProperty('display', 'none', 'important');
 Array.prototype.forEach.call(wrapper.children, function (el) {
  if (el === welcome) return;
  if (!el.hasAttribute('data-ae-display-saved')) {
   el.setAttribute('data-ae-display-saved', JSON.stringify({
    value:el.style.getPropertyValue('display'),
    priority:el.style.getPropertyPriority('display')
   }));
  }
  el.style.setProperty('display', 'none', 'important');
 });
 var nameEl = qs('#navbarAvatarName');
 if (nameEl) nameEl.textContent = name;
 var roleEl = qs('#dashboardUserName');
 if (roleEl) roleEl.textContent = name;
 ensureTrigger();
 welcomeReady = true;
 return true;
}
function leaveWelcome() {
 var welcome = qs('#aethrionExperienceWelcome');
 if (welcome) welcome.style.display = 'none';
 var wrapper = welcome && welcome.parentElement;
 if (wrapper) Array.prototype.forEach.call(wrapper.children, function (el) {
  if (el === welcome || !el.hasAttribute('data-ae-display-saved')) return;
  var previous = {};
  try { previous = JSON.parse(el.getAttribute('data-ae-display-saved') || '{}'); } catch (e) {}
  if (previous.value) el.style.setProperty('display', previous.value, previous.priority || '');
  else el.style.removeProperty('display');
  el.removeAttribute('data-ae-display-saved');
 });
 document.body.classList.remove('aethrion-experience-welcome-active');
}
function scrollToTarget(selectors) {
 for (var i = 0; i < selectors.length; i++) {
  var el = qs(selectors[i]);
  if (el) { leaveWelcome(); closeDrawer(); el.scrollIntoView({ behavior:'smooth', block:'start' }); return true; }
 }
 return false;
}
function runAction(action, name, href) {
 action = String(action || '');
 name = String(name || '');
 closeDrawer();
 if (action === 'goHome' || action === 'showWelcome' || action === 'renderWelcome') { showWelcome(); return; }
 if (action === 'doLogout') {
  if (typeof window.logout === 'function') { window.logout(); return; }
  try { if (window.Parse && Parse.User) { Parse.User.logOut().then(function () { location.reload(); }).catch(function () { location.reload(); }); return; } } catch (e) {}
  location.reload(); return;
 }
 leaveWelcome();
 if (href && href !== 'javascript:void(0)') { location.href = href; return; }
 if (action === 'scrollToAcademy' || /academy|akademi|öğren/i.test(name)) {
  if (scrollToTarget(['#academy','#academySection','#academy-section','#aethrionAcademy','#courseList'])) return;
 }
 if (action === 'scrollToProjects' || /proje/i.test(name)) {
  if (scrollToTarget(['#projects','#projectsSection','#myProjects','#projects-section','#projectsList'])) return;
 }
 if (action === 'scrollToImageGen' || /görsel üret|image gen/i.test(name)) {
  if (scrollToTarget(['#imageGen','#imageGeneration','#image-generator','#imageGenSection','#imagePrompt'])) return;
 }
 var aliases = {
  openAethrionAlPanel:['openAethrionAlPanel','openVizyonAlPanel','openAethrionAI'],
  openVizyonAlPanel:['openVizyonAlPanel','openAethrionAlPanel'],
  openFullAIPanel:['openFullAIPanel','openAethrionAI'],
  openKocPanel:['openKocPanel','openAethrionCoach','openCoachPanel'],
  open3DBuilder:['open3DBuilder','open3DStudio','open3DStudioPanel'],
  openA27ApiGuide:['openA27ApiGuide','openV27ApiGuide'],
  openA27ApiKeyGenerator:['openA27ApiKeyGenerator','createA27ApiKey'],
  openVideoEditor:['openVideoEditor','openVideoEditorModal'],
  openVideoStudio:['openVideoStudio','openVideoStudioModal'],
  openModelsShowcase:['openModelsShowcase','showModelsShowcase'],
  toggleTeamPage:['toggleTeamPage','openTeamPage'],
  openContestPage:['openContestPage','toggleContestPage']
 };
 var candidates = aliases[action] || [action], fn = null;
 for (var i = 0; i < candidates.length; i++) {
  if (candidates[i] && typeof window[candidates[i]] === 'function' &&
      window[candidates[i]] !== runAction && window[candidates[i]] !== openDrawer) {
   fn = window[candidates[i]]; break;
  }
 }
 if (fn) {
  try {
   var result = fn.call(window);
   if (result && typeof result.then === 'function') result.catch(function (error) {
    console.error('[AETHRION] Özellik başlatılamadı:', error);
    fallbackAction(action, name);
   });
   return;
  } catch (error) { console.error('[AETHRION] Özellik başlatılamadı:', error); }
 }
 fallbackAction(action, name);
}
function fallbackAction(action, name) {
 var route = ROUTES[action] || '';
 if (!route) {
  if (/3d|üç boyut/i.test(name)) route = '/3d-studio.html';
  else if (/api|anahtar/i.test(name)) route = '/api.html';
  else if (/coach|koç|asistan/i.test(name)) route = '/aethrion-assistant.html';
  else if (/ai|yapay zekâ|yapay zeka|model/i.test(name)) route = '/aethrion-ai.html';
  else if (/topluluk|takım|community/i.test(name)) route = '/topluluk.html';
  else if (/video/i.test(name)) route = '/index.html#features';
  else if (/blog/i.test(name)) route = '/blog.html';
  else if (/doküman|belge/i.test(name)) route = '/dokumantasyon.html';
 }
 if (route) { location.href = route; return; }
 if (typeof window.showNotification === 'function') window.showNotification('Bu özelliğin açılış noktası bulunamadı. Lütfen özelliğin bağlantısını kontrol edin.', 'warning');
 else console.warn('[AETHRION] Özellik yönlendirmesi bulunamadı:', action, name);
}
function installClickRouter() {
 if (document.body && document.body.hasAttribute('data-ae-router-installed')) return;
 document.body.setAttribute('data-ae-router-installed', 'true');
 document.addEventListener('click', function (event) {
  var target = event.target && event.target.closest ? event.target.closest('button,a,[role="button"]') : null;
  if (!target) return;
  if (target.closest('#aethrionExperienceDrawer')) {
   var item = target.closest('[data-ae-action]');
   if (item) {
    event.preventDefault(); event.stopImmediatePropagation();
    runAction(item.getAttribute('data-ae-action'), item.getAttribute('data-ae-name'), item.getAttribute('data-ae-href'));
   }
   return;
  }
  var quick = target.getAttribute('data-ae-quick');
  if (quick) {
   event.preventDefault(); event.stopImmediatePropagation();
   if (quick === 'menu') openDrawer();
   else if (quick === 'ai') runAction('openFullAIPanel', 'AETHRION AI');
   else if (quick === 'api') { location.href = '/api.html'; }
   else if (quick === 'account') {
    if (typeof window.openAccountInfo === 'function') window.openAccountInfo();
    else runAction('openAccountInfo', 'Hesap bilgilerim');
   }
   return;
  }
  if (target.id === 'aethrionFeaturesTrigger' || target.id === 'aethrionFeaturesButton' ||
      target.hasAttribute('data-aethrion-features-trigger')) {
   event.preventDefault(); event.stopImmediatePropagation(); openDrawer(); return;
  }
  var text = ((target.innerText || target.textContent || '') + ' ' +
   (target.getAttribute('aria-label') || '') + ' ' + (target.getAttribute('title') || '')).toLocaleLowerCase('tr-TR');
  if (document.body.classList.contains('logged-in-user') &&
      /özellikler menüsü|özellikler paneli|tüm özellikler|features menu|feature menu/.test(text)) {
   event.preventDefault(); event.stopImmediatePropagation(); openDrawer();
  }
 }, true);
 document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeDrawer(); });
}
function initSplash() {
 var splash = qs('#splashScreen');
 if (!splash || splashDone) return;
 splashDone = true;
 var exiting = false;
 function forceVisible() {
  if (exiting) return;
  splash.classList.remove('hide', 'hidden', 'aethrion-splash-exit');
  if (splash.style.getPropertyValue('display') !== 'flex' || splash.style.getPropertyPriority('display') !== 'important') splash.style.setProperty('display', 'flex', 'important');
  if (splash.style.getPropertyValue('visibility') !== 'visible' || splash.style.getPropertyPriority('visibility') !== 'important') splash.style.setProperty('visibility', 'visible', 'important');
  if (splash.style.getPropertyValue('opacity') !== '1' || splash.style.getPropertyPriority('opacity') !== 'important') splash.style.setProperty('opacity', '1', 'important');
  splash.style.setProperty('pointer-events', 'auto', 'important');
 }
 forceVisible();
 var observer = null;
 if (window.MutationObserver) {
  observer = new MutationObserver(function () {
   if (exiting) return;
   if (splash.classList.contains('hide') || splash.classList.contains('hidden') || splash.style.getPropertyValue('display') === 'none' || splash.style.getPropertyValue('visibility') === 'hidden') forceVisible();
  });
  observer.observe(splash, { attributes:true, attributeFilter:['class','style'] });
 }
 var status = qs('#splashStatus'), stage = qs('#splashStage'), percent = qs('#splashPercent'), bar = qs('#splashProgressBar'), ready = qs('#splashReady');
 var start = (window.performance && performance.now) ? performance.now() : Date.now();
 function tick(now) {
  if (exiting) return;
  var t = Math.min(1, ((now || Date.now()) - start) / 2450);
  var p = Math.round((1 - Math.pow(1 - t, 2.2)) * 100);
  if (percent) percent.textContent = p + '%';
  if (bar) bar.style.width = p + '%';
  var label = p < 24 ? 'AETHRION ARAYÜZÜ BAŞLATILIYOR' : p < 52 ? 'ÇALIŞMA ALANI HAZIRLANIYOR' : p < 80 ? 'GÜVENLİK VE TERCİHLER KONTROL EDİLİYOR' : p < 100 ? 'SON DÜZENLEMELER UYGULANIYOR' : 'ARAYÜZ HAZIR';
  if (status) status.textContent = label;
  if (stage) stage.textContent = label;
  if (ready) ready.textContent = p < 100 ? 'AETHRION ÇALIŞMA ALANI HAZIRLANIYOR' : 'AETHRION · INTELLIGENCE WITHOUT LIMITS';
  if (t < 1) window.requestAnimationFrame(tick);
 }
 window.requestAnimationFrame(tick);
 window.setTimeout(function () {
  exiting = true;
  if (observer) observer.disconnect();
  splash.classList.remove('hide', 'hidden');
  splash.classList.add('aethrion-splash-exit');
  splash.style.setProperty('opacity', '0', 'important');
  splash.style.setProperty('visibility', 'hidden', 'important');
  splash.style.setProperty('pointer-events', 'none', 'important');
 }, 2850);
}
function wrapDashboard() {
 var original = window.showDashboard;
 if (typeof original !== 'function' || original.__aeWrapped) return;
 var wrapped = function () {
  var result = original.apply(this, arguments);
  function finish() { setTimeout(function () { if (authUser()) showWelcome(); }, 160); }
  if (result && typeof result.then === 'function') result.then(finish, finish);
  else finish();
  return result;
 };
 wrapped.__aeWrapped = true;
 wrapped.__aeOriginal = original;
 window.showDashboard = wrapped;
}
function applyOverrides() {
 window.openAethrionFeaturesPanel = openDrawer;
 window.closeAethrionFeaturesPanel = closeDrawer;
 window.toggleAethrionFeaturesPanel = function () {
  var panel = qs('#aethrionExperienceDrawer');
  if (panel && panel.classList.contains('open')) closeDrawer(); else openDrawer();
 };
 window.toggleAethrionSidebar = window.toggleAethrionFeaturesPanel;
 window.closeAethrionSidebar = closeDrawer;
 window.safeFeatureCall = runAction;
 window.showWelcomeScreen = showWelcome;
 window.showWelcome = showWelcome;
 window.renderWelcome = showWelcome;
 window.goHome = showWelcome;
 wrapDashboard();
 ensureDrawer();
 ensureTrigger();
}
function observeSession() {
 var lastLogged = document.body.classList.contains('logged-in-user');
 function maybeWelcome() {
  if (!authUser()) return;
  var dash = qs('#dashboardArea');
  if (!dash) return;
  window.setTimeout(function () { if (authUser()) showWelcome(); }, 220);
 }
 if (window.MutationObserver) {
  var observer = new MutationObserver(function (records) {
   records.forEach(function (record) {
    if (record.type === 'attributes' && record.target === document.body && record.attributeName === 'class') {
     var logged = document.body.classList.contains('logged-in-user');
     if (logged && !lastLogged) maybeWelcome();
     lastLogged = logged;
    }
    if (record.type === 'childList') {
     Array.prototype.forEach.call(record.addedNodes || [], function (node) {
      if (node.nodeType === Node.ELEMENT_NODE && (node.id === 'dashboardArea' || (node.querySelector && node.querySelector('#dashboardArea')))) maybeWelcome();
     });
    }
   });
  });
  observer.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['class'] });
 }
}
function start() {
 applyOverrides();
 installClickRouter();
 initSplash();
 observeSession();
 var attempts = 0;
 function restoreSession() {
  attempts++;
  if (authUser()) { showWelcome(); applyOverrides(); return; }
  if (attempts < 8) setTimeout(restoreSession, Math.min(750 * attempts, 3000));
 }
 setTimeout(restoreSession, 500);
 [500,1200,2100,3300,4800,6200].forEach(function (delay) {
  setTimeout(function () { applyOverrides(); ensureTrigger(); }, delay);
 });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
else start();
window.addEventListener('load', function () {
 [100,700,1700,3200].forEach(function (delay) {
  setTimeout(function () { applyOverrides(); ensureTrigger(); if (authUser()) showWelcome(); }, delay);
 });
});

/* AETHRION Workspace shell loader — ensure the persistent sidebar is mounted. */
function loadWorkspaceShell() {
 try {
  if (!document.querySelector('link[href*="aethrion-workspace-v5.css"]')) {
   var css = document.createElement('link');
   css.id = 'aethrionWorkspaceV5Css';
   css.rel = 'stylesheet';
   css.href = '/aethrion-workspace-v5.css';
   document.head.appendChild(css);
  }
  if (!document.querySelector('script[src*="aethrion-workspace-v5.js"]')) {
   var script = document.createElement('script');
   script.id = 'aethrionWorkspaceV5Script';
   script.src = '/aethrion-workspace-v5.js';
   script.async = true;
   document.head.appendChild(script);
  }
 } catch (error) { console.error('[AETHRION] Çalışma alanı menüsü yüklenemedi:', error); }
}

loadWorkspaceShell();
})();
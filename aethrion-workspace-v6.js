/* AETHRION Workspace v6 — one welcome screen, one full-height feature rail */
(function(){
'use strict';
var fallback={
'AETHRION AI':['openFullAIPanel','/aethrion-ai.html'],
'AETHRION Agents':['openAethrionAlPanel','/aethrion-assistant.html'],
'AETHRION Coach':['openKocPanel','/aethrion-assistant.html'],
'Model Kataloğu':['openModelsShowcase','/aethrion-ai.html#models'],
'3D Studio':['open3DBuilder','/3d-studio.html'],
'Video Editör':['openVideoEditor',''],
'Video Stüdyosu':['openVideoStudio',''],
'Görsel Üretimi':['scrollToImageGen',''],
'Kod Editörü':['openCodeEditor','/kod-editoru.html'],
'Topluluk':['toggleTeamPage','/topluluk.html'],
'Projelerim':['scrollToProjects',''],
'Akademi':['openAcademy','/bana-ogret.html'],
'A27 API':['openA27ApiKeyGenerator','/api.html#keys'],
'API Belgeleri':['openA27ApiGuide','/api.html'],
'Dokümantasyon':['openDocumentation','/dokumantasyon.html'],
'Ayarlar':['openSettingsModal',''],
'Hesap bilgilerim':['openAccountInfo',''],
'Oturumu kapat':['doLogout','']
};
function q(s,r){return(r||document).querySelector(s)}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function logged(){try{return!!((window.Parse&&Parse.User&&Parse.User.current())||window.currentUser||(document.body&&document.body.classList.contains('logged-in-user')))}catch(e){return!!(document.body&&document.body.classList.contains('logged-in-user'))}}
function userName(){try{var u=window.currentUser||(window.Parse&&Parse.User&&Parse.User.current());if(u&&typeof u.get==='function')return u.get('name')||u.get('username_display')||(u.get('email')||'').split('@')[0]||'Üye'}catch(e){}try{var v=JSON.parse(localStorage.getItem('aethrion_user')||'null');return v&&(v.name||v.username)||'Üye'}catch(e){return'Üye'}}
function feature(label){var list=Array.isArray(window.FEATURE_LIST)?window.FEATURE_LIST:[];for(var i=0;i<list.length;i++){var f=list[i];if(f&&String(f.name||f.title||'')===label)return{action:String(f.action||f.onclick||''),href:String(f.href||f.url||'')};}var v=fallback[label]||['',''];return{action:v[0],href:v[1]}}
function setActive(label){qa('.aews-link').forEach(function(b){var home=b.hasAttribute('data-aews-home');b.classList.toggle('is-active',home?label==='Ana ekran':b.getAttribute('data-aews-feature')===label)})}
function hideTrigger(){['#aethrionFeaturesTrigger','#aethrionFeaturesButton','#aethrionExperienceDrawer','#aethrionExperienceBackdrop','#aethrionFeaturesPanel','#aethrionFeaturesBackdrop','#aethrionWelcomeScreen','.aethrion-sidebar','.aethrion-sidebar-toggle','.aethrion-sidebar-backdrop'].forEach(function(s){qa(s).forEach(function(el){if(el.id==='aeWorkspaceSidebar'||el.id==='aewsMobileToggle'||el.id==='aewsMobileShade')return;if(el.parentNode)el.parentNode.removeChild(el)})})}
function customWelcome(){
 if(!logged()||document.body.classList.contains('aews-feature-view'))return;
 document.body.classList.add('ae-shell-on','logged-in-user');
 var w=q('#aethrionExperienceWelcome'),dash=q('#dashboardArea');
 if(!w||!dash)return;
 var name=String(userName()).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
 var title=q('.aew-name',w);
 if(!w.dataset.aeV6Built){
  w.innerHTML='<div class="aew-eyebrow"><span class="aew-dot"></span>AETHRION · PERSONAL WORKSPACE</div><p class="aew-greeting">Çalışma alanınıza hoş geldiniz.</p><h1 class="aew-name" id="aewName">Hoş geldiniz,<br><em>'+name+'</em></h1><div class="aew-role">◈ Kişisel çalışma alanı</div><p class="aew-copy">Yapay zekâ, üretim araçları ve geliştirici kaynaklarınız tek bir düzenli çalışma alanında. Başlamak için soldaki menüden bir özellik seçin.</p><div class="aew-v6-hint"><b>⌘</b><span><strong>Çalışma alanları</strong><br>İhtiyacınız olan aracı sol menüden açın. Ana ekranınız sade kalır.</span></div>';
  w.dataset.aeV6Built='1';
 }else if(title){title.innerHTML='Hoş geldiniz,<br><em>'+name+'</em>'}
 qa('.aew-grid,.aew-actions,.aews-home-cta',w).forEach(function(el){el.remove()});
 var wrap=q('.dashboard-content-wrapper',dash)||q('.dashboard-content',dash)||dash;
 Array.prototype.forEach.call(wrap.children,function(el){if(el===w)return;if(el.id==='aethrionWorkspaceStage'){el.style.setProperty('display','none','important');return}if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));el.style.setProperty('display','none','important')});
 w.style.setProperty('display','flex','important');
 var main=q('#mainSite');if(main)main.style.setProperty('display','none','important');
 var n=q('#aewsUserName');if(n)n.textContent=userName();
 var av=q('#aewsAvatar');if(av)av.textContent=userName().slice(0,1).toUpperCase();
 hideTrigger();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="/aethrion-mark.svg" alt="AETHRION" draggable="false">';
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function stageHost(){
 var w=q('#aethrionExperienceWelcome'),wrap=w&&(q('.dashboard-content-wrapper')||q('.dashboard-content')||w.parentElement);
 if(!wrap)return null;
 var stage=q('#aethrionWorkspaceStage');
 if(!stage){stage=document.createElement('section');stage.id='aethrionWorkspaceStage';stage.className='ae-ws-stage';wrap.appendChild(stage)}
 return {stage:stage,wrap:wrap,w:w};
}
function isolateStage(){
 var h=stageHost();if(!h)return;
 h.w.style.setProperty('display','none','important');
 Array.prototype.forEach.call(h.wrap.children,function(el){
  if(el===h.stage){el.style.setProperty('display','flex','important');return}
  if(el===h.w){el.style.setProperty('display','none','important');return}
  if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));
  el.style.setProperty('display','none','important');
 });
}
function showStage(label,desc,href){
 var h=stageHost();if(!h)return;
 var safeHref=String(href||'');
 var isFrame=!!safeHref&&safeHref.charAt(0)==='/'&&safeHref!=='/index.html#features'&&safeHref!=='#features';
 var detail=desc||'Bu çalışma alanı seçiminiz için hazırlandı.';
 h.stage.innerHTML='<div class="ae-ws-stage-head"><div><div class="ae-ws-stage-kicker">AETHRION WORKSPACE</div><h2>'+esc(label)+'</h2><p>'+esc(detail)+'</p></div>'+(isFrame?'<a class="ae-ws-open-tab" href="'+esc(safeHref)+'" target="_blank" rel="noopener noreferrer">Yeni sekmede aç ↗</a>':'<span class="ae-ws-stage-state"><i></i> Çalışma alanı</span>')+'</div>'+(isFrame?'<iframe class="ae-ws-stage-frame" title="'+esc(label)+'" src="'+esc(safeHref)+'" loading="eager" allow="microphone; camera; clipboard-read; clipboard-write; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>':'<div class="ae-ws-stage-empty"><div class="ae-ws-stage-emblem">A</div><h3>'+esc(label)+'</h3><p>Bu özellik uygulama paneli üzerinden açılır. Açılan paneli kapattığınızda sol menüden başka bir çalışma alanına geçebilir veya Ana ekran’a dönebilirsiniz.</p></div>');
 h.stage.style.setProperty('display','flex','important');
 var frame=q('.ae-ws-stage-frame',h.stage);
 if(frame)frame.addEventListener('load',function(){try{var d=frame.contentDocument;if(!d)return;var st=d.createElement('style');st.textContent='html,body{min-height:100%!important;background:#f5f8fc!important;color:#172b43!important}body{padding:0 0 20px!important;overflow-x:hidden!important}#aeWorkspaceSidebar,#aewsMobileToggle,#aewsMobileShade,#aethrionWorkspaceSidebar,#aethrionWorkspaceMobileToggle,#aethrionWorkspaceScrim{display:none!important}body.ae-shell-on #mainSite{display:block!important}body.ae-shell-on #dashboardArea{width:100%!important;max-width:none!important;margin:0!important;padding:12px!important}body.ae-shell-on #dashboardArea .dashboard-content-wrapper{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}.navbar,.top-nav,.main-nav,header.site-header,.site-header,footer,.site-footer{box-shadow:none!important}';d.head.appendChild(st)}catch(e){}},{once:true});
 isolateStage();
}
function goBack(){var selectors='[aria-modal="true"],[role="dialog"],.modal-overlay,.modal.show,#kocPanelOverlay,#vizyonAlPanel,#aethrionAiPanel';var list=qa(selectors);for(var i=list.length-1;i>=0;i--){var el=list[i];var st=window.getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden'||st.opacity==='0')continue;var close=q('[data-dismiss],[data-bs-dismiss],.modal-close,.close-modal,.close-btn,[aria-label*="kapat" i],[aria-label*="close" i]',el);if(close){close.click();return}el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true');return}home()}
function home(){document.body.classList.remove('aews-nav-open','aews-feature-view');var stage=q('#aethrionWorkspaceStage');if(stage)stage.style.setProperty('display','none','important');if(typeof window.showWelcome==='function')window.showWelcome();setTimeout(customWelcome,35);setActive('Ana ekran')}
function openFeature(label){
 var f=feature(label);document.body.classList.remove('aews-nav-open');setActive(label);
 if(label==='Oturumu kapat'){if(typeof window.logout==='function')return window.logout();if(window.Parse&&Parse.User)return Parse.User.logOut().then(function(){location.reload()});location.reload();return}
 var desc=(Array.isArray(window.FEATURE_LIST)?window.FEATURE_LIST:[]).filter(function(x){return x&&String(x.name||x.title||'')===label})[0];
 desc=desc&&String(desc.desc||desc.description||'')||'Bu özellik AETHRION çalışma alanı üzerinden kullanılabilir.';
 if(f.href&&f.href!=='/index.html#features'&&f.href!=='#features'){document.body.classList.add('aews-feature-view');showStage(label,'Özelliğin çalışma alanı açılıyor.',f.href);return}
 if(/^scrollTo/.test(f.action||'')){
  document.body.classList.remove('aews-feature-view');var stage=q('#aethrionWorkspaceStage');if(stage)stage.style.setProperty('display','none','important');
  var main=q('#mainSite');if(main)main.style.removeProperty('display');
  var dash=q('#dashboardArea');if(dash)dash.style.removeProperty('display');
  if(typeof window.safeFeatureCall==='function')window.safeFeatureCall(f.action,label,'');else if(typeof window[f.action]==='function')window[f.action]();
  return;
 }
 if(f.action&&typeof window.safeFeatureCall==='function'){
  document.body.classList.remove('aews-feature-view');var stage2=q('#aethrionWorkspaceStage');if(stage2)stage2.style.setProperty('display','none','important');
  window.safeFeatureCall(f.action,label,'');
  return;
 }
 if(f.action&&typeof window[f.action]==='function'){
  document.body.classList.remove('aews-feature-view');var stage3=q('#aethrionWorkspaceStage');if(stage3)stage3.style.setProperty('display','none','important');
  window[f.action]();return;
 }
 document.body.classList.add('aews-feature-view');showStage(label,desc,'');
 if(typeof window.showNotification==='function')window.showNotification('Bu özellik için doğrudan açılış bağlantısı tanımlanmamış.','warning');
}
function installRouter(){
 if(document.body.dataset.aeV6Router==='1')return;document.body.dataset.aeV6Router='1';
 document.addEventListener('click',function(e){
  var backBtn=e.target.closest&&e.target.closest('[data-aews-back]');
  if(backBtn){e.preventDefault();e.stopImmediatePropagation();goBack();return}
  var homeBtn=e.target.closest&&e.target.closest('[data-aews-home]');
  if(homeBtn){e.preventDefault();e.stopImmediatePropagation();home();return}
  var featureBtn=e.target.closest&&e.target.closest('[data-aews-feature]');
  if(featureBtn){e.preventDefault();e.stopImmediatePropagation();openFeature(featureBtn.getAttribute('data-aews-feature'))}
 },true);
}
function patchWelcome(){
 if(typeof window.showWelcome==='function'&&!window.showWelcome.__aeV6Wrapped){
  var original=window.showWelcome;
  var wrapped=function(){if(document.body.classList.contains('aews-feature-view'))return false;var r=original.apply(this,arguments);setTimeout(function(){if(!document.body.classList.contains('aews-feature-view'))customWelcome()},35);return r};
  wrapped.__aeV6Wrapped=true;wrapped.__aeV6Original=original;window.showWelcome=wrapped;
  window.showWelcomeScreen=wrapped;window.renderWelcome=wrapped;window.goHome=wrapped;
 }
}
function overlayIsVisible(el){
 if(!el)return false;var s=window.getComputedStyle(el);
 return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&el.getAttribute('aria-hidden')!=='true';
}
function syncOverlayState(){
 var selectors=['#fullAIPanel','#kocPanelOverlay','#vizyonAlPanel','#aethrionAlPanel','#full3DBuilder','#videoEditorOverlay','#voiceChatFullscreen','#vzVoiceFullscreen','.modal-overlay.open'];
 var active=selectors.some(function(sel){return qa(sel).some(overlayIsVisible)});
 document.body.classList.toggle('ae-overlay-active',active);
}
function restoreWorkspaceAfterClose(){
 if(!logged()||overlayStillOpen())return;
 document.body.classList.remove('aews-feature-view','aews-nav-open');
 document.body.classList.add('ae-shell-on','logged-in-user','aews-home-view');
 var dash=q('#dashboardArea'),main=q('#mainSite'),stage=q('#aethrionWorkspaceStage');
 if(dash){dash.style.setProperty('display','block','important');dash.style.setProperty('visibility','visible','important')}
 if(main)main.style.setProperty('display','none','important');
 if(stage)stage.style.setProperty('display','none','important');
 customWelcome();syncOverlayState();
}
function overlayStillOpen(){
 var selectors=['#fullAIPanel','#kocPanelOverlay','#vizyonAlPanel','#aethrionAlPanel','#full3DBuilder','#videoEditorOverlay','#voiceChatFullscreen','#vzVoiceFullscreen','.modal-overlay.open'];
 return selectors.some(function(sel){return qa(sel).some(overlayIsVisible)});
}
function installCloseRecovery(){
 ['closeFullAIPanel','closeAethrionAlPanel','closeVizyonAlPanel','closeKocPanel','close3DBuilder','closeVideoEditor','closeVideoStudio','closeVoiceChatFullscreen','closeVizyonAlScreenRead','closeAethrionAiPanel'].forEach(function(name){
  var original=window[name];if(typeof original!=='function'||original.__aeV6CloseWrapped)return;
  var wrapped=function(){var result=original.apply(this,arguments);setTimeout(restoreWorkspaceAfterClose,90);return result};
  wrapped.__aeV6CloseWrapped=true;wrapped.__aeV6Original=original;window[name]=wrapped;
 });
}
function boot(){installRouter();patchWelcome();installCloseRecovery();if(logged()){document.body.classList.add('ae-shell-on');hideTrigger();customWelcome();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="/aethrion-mark.svg" alt="AETHRION" draggable="false">'}syncOverlayState()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
[150,500,1000,1800,3000,5000].forEach(function(t){setTimeout(boot,t)});
if(window.MutationObserver&&document.body)new MutationObserver(function(){syncOverlayState();if(logged()){patchWelcome();installCloseRecovery();if(!document.body.classList.contains('aews-feature-view'))customWelcome();hideTrigger()}}).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
})();
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
function hideTrigger(){['#aethrionFeaturesTrigger','#aethrionFeaturesButton','#aethrionExperienceDrawer','#aethrionExperienceBackdrop','#aethrionFeaturesPanel','.aethrion-sidebar','.aethrion-sidebar-toggle','.aethrion-sidebar-backdrop'].forEach(function(s){qa(s).forEach(function(el){el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true')})})}
function customWelcome(){
 if(!logged())return;
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
 Array.prototype.forEach.call(wrap.children,function(el){if(el===w)return;if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));el.style.setProperty('display','none','important')});
 w.style.setProperty('display','flex','important');
 var main=q('#mainSite');if(main)main.style.setProperty('display','none','important');
 var n=q('#aewsUserName');if(n)n.textContent=userName();
 var av=q('#aewsAvatar');if(av)av.textContent=userName().slice(0,1).toUpperCase();
 hideTrigger();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="/aethrion-mark.svg" alt="AETHRION" draggable="false">';
}
function restoreWelcomeOnly(){
 var w=q('#aethrionExperienceWelcome'),wrap=w&&(q('.dashboard-content-wrapper')||q('.dashboard-content')||w.parentElement);
 if(!w||!wrap)return;
 w.style.setProperty('display','none','important');
 Array.prototype.forEach.call(wrap.children,function(el){if(el===w)return;if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));el.style.setProperty('display','none','important')});
}
function home(){document.body.classList.remove('aews-nav-open');if(typeof window.showWelcome==='function')window.showWelcome();setTimeout(customWelcome,30);setActive('Ana ekran')}
function openFeature(label){
 var f=feature(label);document.body.classList.remove('aews-nav-open');setActive(label);
 if(label==='Oturumu kapat'){if(typeof window.logout==='function')return window.logout();if(window.Parse&&Parse.User)return Parse.User.logOut().then(function(){location.reload()});location.reload();return}
 if(f.href&&f.href!=='/index.html#features'&&f.href!=='#features'){location.href=f.href;return}
 if(f.action&&/^scrollTo/.test(f.action)){
  if(typeof window.safeFeatureCall==='function')window.safeFeatureCall(f.action,label,f.href);
  else if(typeof window[f.action]==='function')window[f.action]();
  return;
 }
 if(f.action&&typeof window.safeFeatureCall==='function'){window.safeFeatureCall(f.action,label,'');setTimeout(restoreWelcomeOnly,100);return}
 if(f.action&&typeof window[f.action]==='function'){window[f.action]();setTimeout(restoreWelcomeOnly,100);return}
 if(typeof window.showNotification==='function')window.showNotification('Bu özellik için açılış bağlantısı henüz tanımlanmamış.','warning');
}
function installRouter(){
 if(document.body.dataset.aeV6Router==='1')return;document.body.dataset.aeV6Router='1';
 document.addEventListener('click',function(e){
  var homeBtn=e.target.closest&&e.target.closest('[data-aews-home]');
  if(homeBtn){e.preventDefault();e.stopImmediatePropagation();home();return}
  var featureBtn=e.target.closest&&e.target.closest('[data-aews-feature]');
  if(featureBtn){e.preventDefault();e.stopImmediatePropagation();openFeature(featureBtn.getAttribute('data-aews-feature'))}
 },true);
}
function patchWelcome(){
 if(typeof window.showWelcome==='function'&&!window.showWelcome.__aeV6Wrapped){
  var original=window.showWelcome;
  var wrapped=function(){var r=original.apply(this,arguments);setTimeout(customWelcome,35);return r};
  wrapped.__aeV6Wrapped=true;wrapped.__aeV6Original=original;window.showWelcome=wrapped;
  window.showWelcomeScreen=wrapped;window.renderWelcome=wrapped;window.goHome=wrapped;
 }
}
function boot(){document.body.classList.add('ae-shell-on');installRouter();patchWelcome();hideTrigger();if(logged())customWelcome();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="/aethrion-mark.svg" alt="AETHRION" draggable="false">'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
[150,500,1000,1800,3000,5000].forEach(function(t){setTimeout(boot,t)});
if(window.MutationObserver&&document.body)new MutationObserver(function(){if(logged()){patchWelcome();customWelcome();hideTrigger()}}).observe(document.body,{attributes:true,attributeFilter:['class']});
})();

/* AETHRION Workspace v6 — one welcome screen, one full-height feature rail */
(function(){
'use strict';
var fallback={
'AETHRION AI':['openFullAIPanel','/aethrion-ai.html'],
'AETHRION Agents':['openAethrionAgentsPanel','/aethrion-assistant.html'],
'AETHRION Coach':['openKocPanel','/aethrion-assistant.html'],
'Model Kataloğu':['openModelsShowcase',''],
'3D Studio':['open3DBuilder','/3d-studio.html'],
'Video Editör':['openVideoEditor',''],
'Video Stüdyosu':['openVideoStudio',''],
'Görsel Üretimi':['scrollToImageGen',''],
'Kod Editörü':['openCodeEditor','/kod-editoru.html'],
'Topluluk':['toggleTeamPage','./topluluk.html'],
'Team Ortak Çalışma':['openTeamWorkspace','./aethrion-teams.html'],
'Projelerim':['scrollToProjects',''],
'Akademi':['openAcademy','/bana-ogret.html'],
'A27 API':['openA27ApiKeyGenerator','/aethrion-developer.html'],
'API Belgeleri':['openA27ApiGuide','/api.html'],
'Dokümantasyon':['openDocumentation','/dokumantasyon.html'],
'Ayarlar':['openSettingsModal',''],
'Hesap bilgilerim':['openAccountInfo',''],
'Oturumu kapat':['doLogout','']
};
function q(s,r){return(r||document).querySelector(s)}
function sitePath(path){try{return new URL(String(path||'').replace(/^\/+/,''),window.location.href).toString()}catch(_){return String(path||'')}}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function logged(){try{return!!((window.Parse&&Parse.User&&Parse.User.current())||window.currentUser||(document.body&&document.body.classList.contains('logged-in-user')))}catch(e){return!!(document.body&&document.body.classList.contains('logged-in-user'))}}
function userName(){try{var u=window.currentUser||(window.Parse&&Parse.User&&Parse.User.current());if(u&&typeof u.get==='function')return u.get('name')||u.get('username_display')||(u.get('email')||'').split('@')[0]||'Üye'}catch(e){}try{var v=JSON.parse(localStorage.getItem('aethrion_user')||'null');return v&&(v.name||v.username)||'Üye'}catch(e){return'Üye'}}
function feature(label){var list=Array.isArray(window.FEATURE_LIST)?window.FEATURE_LIST:[];for(var i=0;i<list.length;i++){var f=list[i];if(f&&String(f.name||f.title||'')===label)return{action:String(f.action||f.onclick||''),href:String(f.href||f.url||'')};}var v=fallback[label]||['',''];return{action:v[0],href:v[1]}}
function setActive(label){qa('.aews-link').forEach(function(b){var home=b.hasAttribute('data-aews-home');b.classList.toggle('is-active',home?label==='Ana ekran':b.getAttribute('data-aews-feature')===label)})}
function hideTrigger(){['#aethrionFeaturesTrigger','#aethrionFeaturesButton','#aethrionExperienceDrawer','#aethrionExperienceBackdrop','#aethrionFeaturesPanel','#aethrionFeaturesBackdrop','#aethrionWelcomeScreen','.aethrion-sidebar','.aethrion-sidebar-toggle','.aethrion-sidebar-backdrop'].forEach(function(s){qa(s).forEach(function(el){if(el.id==='aeWorkspaceSidebar'||el.id==='aewsMobileToggle'||el.id==='aewsMobileShade')return;if(el.parentNode)el.parentNode.removeChild(el)})})}
function customWelcome(){
 if(!logged()||document.body.classList.contains('aews-feature-view'))return;
 document.body.classList.add('ae-shell-on','logged-in-user','aews-home-view');
 var dash=q('#dashboardArea');if(!dash)return;
 var wrap=q('.dashboard-content-wrapper',dash)||q('.dashboard-content',dash)||dash;
 var w=q('#aethrionExperienceWelcome');
 if(!w){w=document.createElement('section');w.id='aethrionExperienceWelcome';w.className='aethrion-workspace-welcome';w.setAttribute('aria-label','AETHRION karşılama ekranı');wrap.insertBefore(w,wrap.firstChild);}
 if(w.parentElement!==wrap)wrap.insertBefore(w,wrap.firstChild);
 var name=esc(userName()),current=window.currentUser||(window.Parse&&window.Parse.User&&window.Parse.User.current()),saved={};
 try{saved=JSON.parse(localStorage.getItem('aethrion_user')||'{}')||{}}catch(_){}
 function attr(key){try{return current&&typeof current.get==='function'?(current.get(key)||''):((current&&current[key])||'')}catch(_){return''}}
 var role=String(attr('role')||attr('accountRole')||saved.role||saved.accountRole||'member').toLowerCase();
 var plan=String(attr('plan')||attr('subscriptionPlan')||attr('package')||saved.plan||saved.subscriptionPlan||saved.package||'free').toUpperCase();
 var roles={founder:'KURUCU',owner:'KURUCU',admin:'ADMIN',superadmin:'ADMIN',moderator:'MODERATÖR',designer:'MODERATÖR / TASARIMCI',beta:'BETA ÜYESİ',member:'ÜYE',user:'ÜYE'};
 if(!w.dataset.aeV6Built){
  w.innerHTML='<div class="aew-eyebrow"><span class="aew-dot"></span>AETHRION · PERSONAL WORKSPACE</div><p class="aew-greeting">Oturumunuz başarıyla açıldı.</p><h1 class="aew-name" id="aewName">Hoş geldiniz,<br><em>'+name+'</em></h1><div class="aew-role">◈ '+esc((roles[role]||'ÜYE')+' · '+(plan==='FREE'?'ÜCRETSİZ':plan)+' PAKET')+'</div><p class="aew-copy">AETHRION özelliklerini aşağıdaki listede inceleyin. Yalnızca ilgili Bak düğmesine bastığınızda seçtiğiniz çalışma alanı açılır.</p><div class="aews-home-cta">Tüm çalışma alanları aşağıda. Açmak için Bak düğmesini kullanın.</div><section id="aewHomeCatalog" class="aew-home-catalog" aria-label="AETHRION tüm özellikler"></section>';
  w.dataset.aeV6Built='1';
 }else{
  var title=q('.aew-name',w);if(title)title.innerHTML='Hoş geldiniz,<br><em>'+name+'</em>';
 }
 var copy=q('.aew-copy',w);if(copy)copy.textContent='AETHRION özelliklerini aşağıdaki listede inceleyin. Yalnızca ilgili Bak düğmesine bastığınızda seçtiğiniz çalışma alanı açılır.';
 var catalog=q('#aewHomeCatalog',w);if(!catalog){catalog=document.createElement('section');catalog.id='aewHomeCatalog';catalog.className='aew-home-catalog';catalog.setAttribute('aria-label','AETHRION tüm özellikler');w.appendChild(catalog);}
 var source=Array.isArray(window.__aethrionWorkspaceMenuFeatures)?window.__aethrionWorkspaceMenuFeatures:[];
 if(!source.length&&Array.isArray(window.FEATURE_LIST))source=window.FEATURE_LIST.map(function(x){return[String(x.group||'DİĞER'),String(x.icon||'✦'),String(x.name||x.title||''),String(x.desc||x.description||''),String(x.action||x.onclick||''),String(x.href||x.url||''),String(x.arg||''),String(x.access||x.role||x.plan||'')]});
 var groups=Object.create(null),labels={CORE:'YAPAY ZEKÂ',CREATE:'ÜRETİM ARAÇLARI',PLATFORM:'PLATFORM',ADVANCED:'GELİŞTİRİCİ ARAÇLARI',ACCOUNT:'HESAP',KURUCU:'KURUCU ARAÇLARI',ADMIN:'YÖNETİM ARAÇLARI',MODERATOR:'MODERATÖR ARAÇLARI',OTHER:'DİĞER ÖZELLİKLER',AI:'YAPAY ZEKÂ',TOOLS:'ÜRETİM ARAÇLARI',DEVELOPER:'GELİŞTİRİCİ ARAÇLARI','YAPAY ZEKÂ':'YAPAY ZEKÂ','ÜRETİM':'ÜRETİM ARAÇLARI','GELİŞTİRİCİ':'GELİŞTİRİCİ ARAÇLARI','MODERATÖR':'MODERATÖR ARAÇLARI','BETA':'BETA ÖZELLİKLERİ','TEAM PAKETİ':'TEAM ÇALIŞMA ALANI','PRO PAKETİ':'PRO ÖZELLİKLERİ'};
 source.forEach(function(item){if(!Array.isArray(item))return;var group=String(item[0]||'OTHER'),name=String(item[2]||'').trim();if(!name)return;(groups[group]||(groups[group]=[])).push({icon:String(item[1]||'✦'),name:name,desc:String(item[3]||'' )})});
 var keys=Object.keys(groups),rank=['YAPAY ZEKÂ','CORE','AI','CREATE','ÜRETİM','TOOLS','PLATFORM','ADVANCED','GELİŞTİRİCİ','DEVELOPER','ACCOUNT','HESAP','KURUCU','ADMIN','MODERATÖR','MODERATOR','BETA','TEAM PAKETİ','PRO PAKETİ','OTHER'];
 keys.sort(function(a,b){var x=rank.indexOf(a.toUpperCase()),y=rank.indexOf(b.toUpperCase());if(x<0)x=999;if(y<0)y=999;return x-y||a.localeCompare(b,'tr')});
 var html='';keys.forEach(function(group){html+='<section class="aew-home-group"><h2>'+esc(labels[group]||group)+'</h2><div class="aew-home-grid">';groups[group].forEach(function(item){html+='<article class="aew-home-card"><span class="aew-home-icon" aria-hidden="true">'+esc(item.icon)+'</span><div class="aew-home-copy"><h3>'+esc(item.name)+'</h3><p>'+esc(item.desc)+'</p></div><button type="button" class="aew-home-open" data-aews-feature="'+esc(item.name)+'">Bak <span aria-hidden="true">↗</span></button></article>'});html+='</div></section>'});
 catalog.innerHTML=html||'<p class="aew-home-empty">Özellik kataloğu yüklenemedi. Menü verisi bulunamadı.</p>';
 if(!document.getElementById('aewHomeCatalogStyles')){var style=document.createElement('style');style.id='aewHomeCatalogStyles';style.textContent='.aew-home-catalog{width:100%;max-width:1180px;margin:26px auto 40px;text-align:left}.aew-home-group{margin-top:28px}.aew-home-group>h2{margin:0 0 13px;color:var(--text2,#d7dce7);font-size:12px;letter-spacing:.15em;text-transform:uppercase}.aew-home-grid{display:grid;grid-template-columns:1fr;gap:12px}.aew-home-card{min-width:0;display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:13px;padding:16px;border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))}.aew-home-icon{width:38px;height:38px;display:grid;place-items:center;border:1px solid rgba(217,189,105,.2);border-radius:12px;background:rgba(217,189,105,.07);font-size:19px}.aew-home-copy{min-width:0}.aew-home-copy h3{margin:0;color:var(--text,#f4f6fb);font-size:14px}.aew-home-copy p{margin:5px 0 0;color:var(--text3,#9ca3af);font-size:12px}.aew-home-open{padding:9px 12px;border:1px solid rgba(217,189,105,.38);border-radius:10px;background:rgba(217,189,105,.09);color:var(--accent,#d9bd69);font-weight:700;cursor:pointer}@media(max-width:560px){.aew-home-card{grid-template-columns:34px minmax(0,1fr);gap:10px;padding:13px}.aew-home-open{grid-column:2;justify-self:start}}';document.head.appendChild(style)}
 var stage=q('#aethrionWorkspaceStage');if(stage)stage.style.setProperty('display','none','important');
 Array.prototype.forEach.call(wrap.children,function(el){if(el===w)return;if(el.id==='aethrionWorkspaceStage'){el.style.setProperty('display','none','important');return}if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));el.style.setProperty('display','none','important')});
 w.style.setProperty('display','block','important');var main=q('#mainSite');if(main)main.style.setProperty('display','none','important');
 var n=q('#aewsUserName');if(n)n.textContent=userName();var av=q('#aewsAvatar');if(av)av.textContent=userName().slice(0,1).toUpperCase();
 hideTrigger();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="'+sitePath("aethrion-mark.svg")+'" alt="AETHRION" draggable="false">';
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
 var safeHref=String(href||''); if(safeHref && !/^https?:\/\//i.test(safeHref) && safeHref.charAt(0)==='/') safeHref=sitePath(safeHref);
 var isFrame=!!safeHref&&!/^javascript:/i.test(safeHref)&&safeHref!=='/index.html#features'&&safeHref!=='./index.html#features'&&safeHref!=='#features';
 var detail=desc||'Bu çalışma alanı seçiminiz için hazırlandı.';
 h.stage.innerHTML='<div class="ae-ws-stage-head"><div><div class="ae-ws-stage-kicker">AETHRION WORKSPACE</div><h2>'+esc(label)+'</h2><p>'+esc(detail)+'</p></div>'+(isFrame?'<a class="ae-ws-open-tab" href="'+esc(safeHref)+'" target="_blank" rel="noopener noreferrer">Yeni sekmede aç ↗</a>':'<span class="ae-ws-stage-state"><i></i> Çalışma alanı</span>')+'</div>'+(isFrame?'<iframe class="ae-ws-stage-frame" title="'+esc(label)+'" src="'+esc(safeHref)+'" loading="eager" allow="microphone; camera; clipboard-read; clipboard-write; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>':'<div class="ae-ws-stage-empty"><div class="ae-ws-stage-emblem">A</div><h3>'+esc(label)+'</h3><p>Bu özellik uygulama paneli üzerinden açılır. Açılan paneli kapattığınızda sol menüden başka bir çalışma alanına geçebilir veya Ana ekran’a dönebilirsiniz.</p></div>');
 h.stage.style.setProperty('display','flex','important');
 var frame=q('.ae-ws-stage-frame',h.stage);
 if(frame)frame.addEventListener('load',function(){try{var d=frame.contentDocument;if(!d)return;var st=d.createElement('style');st.textContent='html,body{min-height:100%!important;background:#f5f8fc!important;color:#172b43!important}body{padding:0 0 20px!important;overflow-x:hidden!important}#aeWorkspaceSidebar,#aewsMobileToggle,#aewsMobileShade,#aethrionWorkspaceSidebar,#aethrionWorkspaceMobileToggle,#aethrionWorkspaceScrim{display:none!important}body.ae-shell-on #mainSite{display:block!important}body.ae-shell-on #dashboardArea{width:100%!important;max-width:none!important;margin:0!important;padding:12px!important}body.ae-shell-on #dashboardArea .dashboard-content-wrapper{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}.navbar,.top-nav,.main-nav,header.site-header,.site-header,footer,.site-footer{box-shadow:none!important}';d.head.appendChild(st)}catch(e){}},{once:true});
 isolateStage();
}
function goBack(){var selectors='[aria-modal="true"],[role="dialog"],.modal-overlay,.modal.show,#kocPanelOverlay,#vizyonAlPanel,#aethrionAiPanel,#modelsShowcaseOverlay,#modelsShowcaseModal';var list=qa(selectors);for(var i=list.length-1;i>=0;i--){var el=list[i];var st=window.getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden'||st.opacity==='0')continue;var close=q('[data-dismiss],[data-bs-dismiss],.modal-close,.close-modal,.close-btn,[aria-label*="kapat" i],[aria-label*="close" i]',el);if(close){close.click();return}el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true');return}home()}
function home(){document.body.classList.remove('aews-nav-open','aews-feature-view');var stage=q('#aethrionWorkspaceStage');if(stage)stage.style.setProperty('display','none','important');if(typeof window.showWelcome==='function')window.showWelcome();setTimeout(customWelcome,35);setActive('Ana ekran')}
function openFeature(label){
 var f=feature(label);document.body.classList.remove('aews-nav-open');setActive(label);
 if(label==='Oturumu kapat'){if(typeof window.logout==='function')return window.logout();if(window.Parse&&Parse.User)return Parse.User.logOut().then(function(){location.reload()});location.reload();return}
 var desc=(Array.isArray(window.FEATURE_LIST)?window.FEATURE_LIST:[]).filter(function(x){return x&&String(x.name||x.title||'')===label})[0];
 desc=desc&&String(desc.desc||desc.description||'')||'Bu özellik AETHRION çalışma alanı üzerinden kullanılabilir.';
 if(/^scrollTo/.test(f.action||'')){
  document.body.classList.remove('aews-feature-view');var stage=q('#aethrionWorkspaceStage');if(stage)stage.style.setProperty('display','none','important');
  var main=q('#mainSite');if(main)main.style.removeProperty('display');
  var dash=q('#dashboardArea');if(dash)dash.style.removeProperty('display');
  if(typeof window.safeFeatureCall==='function'){window.safeFeatureCall(f.action,label,'');return}
  if(typeof window[f.action]==='function'){window[f.action]();return}
 }
 if(f.action&&typeof window.safeFeatureCall==='function'){
  document.body.classList.remove('aews-feature-view');var stage2=q('#aethrionWorkspaceStage');if(stage2)stage2.style.setProperty('display','none','important');
  window.safeFeatureCall(f.action,label,'');return;
 }
 if(f.action&&typeof window[f.action]==='function'){
  document.body.classList.remove('aews-feature-view');var stage3=q('#aethrionWorkspaceStage');if(stage3)stage3.style.setProperty('display','none','important');
  window[f.action]();return;
 }
 var href=String(f.href||'');
 if(/^https?:\/\/vizyon2026\.vercel\.app(?=\/|$)/i.test(href))href=href.replace(/^https?:\/\/vizyon2026\.vercel\.app/i,'');
 if(href&&href!=='/index.html#features'&&href!=='./index.html#features'&&href!=='#features'){ href=href.charAt(0)==='/'?sitePath(href):href;
  document.body.classList.add('aews-feature-view');showStage(label,'Özelliğin çalışma alanı açılıyor.',href);return;
 }
 document.body.classList.add('aews-feature-view');showStage(label,desc,'');
 if(typeof window.showNotification==='function')window.showNotification('Bu özelliğin paneli bulunamadı. Harici veya alakasız bir adrese yönlendirme yapılmadı.','warning');
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
 var selectors=['#fullAIPanel','#kocPanelOverlay','#vizyonAlPanel','#aethrionAlPanel','#full3DBuilder','#videoEditorOverlay','#voiceChatFullscreen','#vzVoiceFullscreen','#modelsShowcaseOverlay','#modelsShowcaseModal','.modal-overlay.open'];
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
 var selectors=['#fullAIPanel','#kocPanelOverlay','#vizyonAlPanel','#aethrionAlPanel','#full3DBuilder','#videoEditorOverlay','#voiceChatFullscreen','#vzVoiceFullscreen','#modelsShowcaseOverlay','#modelsShowcaseModal','.modal-overlay.open'];
 return selectors.some(function(sel){return qa(sel).some(overlayIsVisible)});
}
function installCloseRecovery(){
 ['closeFullAIPanel','closeAethrionAlPanel','closeVizyonAlPanel','closeKocPanel','close3DBuilder','closeVideoEditor','closeVideoStudio','closeVoiceChatFullscreen','closeVizyonAlScreenRead','closeAethrionAiPanel'].forEach(function(name){
  var original=window[name];if(typeof original!=='function'||original.__aeV6CloseWrapped)return;
  var wrapped=function(){var result=original.apply(this,arguments);setTimeout(restoreWorkspaceAfterClose,90);return result};
  wrapped.__aeV6CloseWrapped=true;wrapped.__aeV6Original=original;window[name]=wrapped;
 });
}
function repairWorkspaceSurface(){
 if(!logged()||!document.body.classList.contains('ae-shell-on'))return;
 var sidebars=qa('#aeWorkspaceSidebar');
 if(sidebars.length>1)sidebars.slice(1).forEach(function(node){if(node.parentNode)node.parentNode.removeChild(node)});
 var sidebar=q('#aeWorkspaceSidebar');
 if(!sidebar)return;
 var brand=q('.aews-brand',sidebar),search=q('.aews-search',sidebar),nav=q('.aews-nav',sidebar),foot=q('.aews-footer',sidebar);
 if(search&&brand&&brand.nextElementSibling!==search)brand.insertAdjacentElement('afterend',search);
 if(search){
  search.setAttribute('aria-label','Özellik arama');
  var input=q('input[type="search"]',search);
  if(input){input.id='aewsSearch';input.placeholder='Özellik ara…';input.setAttribute('aria-label','Özellik ara');input.autocomplete='off'}
 }
 if(nav&&search&&search.nextElementSibling!==nav)search.insertAdjacentElement('afterend',nav);
 if(foot&&nav&&nav.nextElementSibling!==foot)nav.insertAdjacentElement('afterend',foot);
 qa('#aewsSearch').forEach(function(node){if(!search||!search.contains(node))node.removeAttribute('id')});
 qa('#aethrionFeaturesTrigger,#aethrionFeaturesButton,#aethrionFeaturesPanel,#aethrionExperienceDrawer,#aethrionExperienceBackdrop').forEach(function(node){if(node&&node.parentNode)node.parentNode.removeChild(node)});
 sidebar.setAttribute('aria-label','AETHRION özellik menüsü');
}
function boot(){installRouter();patchWelcome();installCloseRecovery();if(logged()){document.body.classList.add('ae-shell-on');hideTrigger();customWelcome();var logo=q('.aews-logo');if(logo&&!q('img',logo))logo.innerHTML='<img src="'+sitePath("aethrion-mark.svg")+'" alt="AETHRION" draggable="false">'}repairWorkspaceSurface();syncOverlayState()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
[150,500,1000,1800,3000,5000].forEach(function(t){setTimeout(boot,t)});
document.addEventListener('click',function(){window.setTimeout(syncOverlayState,80)},true);window.addEventListener('focus',syncOverlayState);
})();
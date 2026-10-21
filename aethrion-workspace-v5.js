/* AETHRION Workspace v5 — persistent navigation, single home, mobile-first layout */
(function () {
 'use strict';
 var VERSION='5.0.0', mode='home', activeFeature=null, booted=false, observer=null, renderQueued=false;
 var ROUTES={
  openFullAIPanel:'/aethrion-ai.html',
  openAethrionAI:'/aethrion-ai.html',
  openModelsShowcase:'/aethrion-ai.html#models',
  openAethrionAlPanel:'/aethrion-assistant.html',
  openVizyonAlPanel:'/aethrion-assistant.html',
  openKocPanel:'/aethrion-assistant.html',
  openA27ApiGuide:'/api.html',
  openV27ApiGuide:'/api.html',
  openA27ApiKeyGenerator:'/api.html#keys',
  createA27ApiKey:'/api.html#keys',
  open3DBuilder:'/3d-studio.html',
  openDocumentation:'/dokumantasyon.html',
  openBlog:'/blog.html',
  openAbout:'/hakkimizda.html',
  openContact:'/iletisim.html',
  openCareer:'/kariyer.html',
  toggleTeamPage:'/topluluk.html',
  openContestPage:'/topluluk.html',
  openAcademy:'/bana-ogret.html',
  scrollToAcademy:'/bana-ogret.html'
 };
 var FALLBACK=[
  {group:'CORE',icon:'✦',name:'AETHRION AI',desc:'Yapay zekâ çalışma alanı',action:'openFullAIPanel'},
  {group:'CORE',icon:'◈',name:'AETHRION Agents',desc:'Ajan, ekran okuma ve dosya araçları',action:'openAethrionAlPanel'},
  {group:'CORE',icon:'◎',name:'AETHRION Coach',desc:'Kişisel AI asistanı',action:'openKocPanel'},
  {group:'CORE',icon:'◉',name:'Model Kataloğu',desc:'AI modellerini incele',action:'openModelsShowcase'},
  {group:'CREATE',icon:'◇',name:'3D Studio',desc:'Üç boyutlu tasarım alanı',action:'open3DBuilder'},
  {group:'CREATE',icon:'▶',name:'Video Editör',desc:'Video düzenleme araçları',action:'openVideoEditor'},
  {group:'CREATE',icon:'▣',name:'Video Stüdyosu',desc:'Video fikirleri ve üretim',action:'openVideoStudio'},
  {group:'PLATFORM',icon:'⌂',name:'Topluluk ve Takımlar',desc:'Takım ve ortak projeler',action:'toggleTeamPage'},
  {group:'PLATFORM',icon:'▤',name:'Projelerim',desc:'Projeler ve kayıtlar',action:'scrollToProjects'},
  {group:'ADVANCED',icon:'⌘',name:'A27 API Anahtarı',desc:'API erişim seçenekleri',action:'openA27ApiKeyGenerator'},
  {group:'ADVANCED',icon:'↗',name:'A27 API Rehberi',desc:'Teknik belgeler ve örnekler',action:'openA27ApiGuide'},
  {group:'ADVANCED',icon:'▥',name:'Dokümantasyon',desc:'Kullanım rehberleri',action:'openDocumentation'},
  {group:'ACCOUNT',icon:'⚙',name:'Ayarlar',desc:'Dil, tema ve tercihler',action:'openSettingsModal'},
  {group:'ACCOUNT',icon:'◌',name:'Hesap bilgilerim',desc:'Profil ve üyelik',action:'openAccountInfo'}
 ];
 var GROUPS={CORE:'YAPAY ZEKÂ',CREATE:'ÜRETİM ARAÇLARI',PLATFORM:'PLATFORM',ADVANCED:'GELİŞTİRİCİ ARAÇLARI',ACCOUNT:'HESAP',OTHER:'DİĞER ÖZELLİKLER'};
 function qs(s,r){return (r||document).querySelector(s);}
 function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function user(){
  try{if(window.currentUser)return window.currentUser;}catch(e){}
  try{if(window.Parse&&Parse.User&&Parse.User.current()){window.currentUser=Parse.User.current();return window.currentUser;}}catch(e){}
  try{var u=JSON.parse(localStorage.getItem('aethrion_user')||'null');if(u&&(u.id||u.email))return u;}catch(e){}
  return null;
 }
 function value(u,key){
  try{if(u&&typeof u.get==='function')return u.get(key)||'';}catch(e){}
  try{return u&&u[key]||'';}catch(e){return '';}
 }
 function nameOf(u){return value(u,'name')||value(u,'fullName')||value(u,'username_display')||value(u,'username')||((value(u,'email')||'').split('@')[0])||'Kullanıcı';}
 function roleOf(u){var r=String(value(u,'role')||'user').toLowerCase(),p=String(value(u,'plan')||'free').toUpperCase();var m={founder:'Kurucu',admin:'Yönetici',moderator:'Moderatör',beta:'Beta üyesi',user:'Üye'};return (m[r]||'Üye')+' · '+p+' PLAN';}
 function features(){
  var source=Array.isArray(window.FEATURE_LIST)&&window.FEATURE_LIST.length?window.FEATURE_LIST:FALLBACK, seen=Object.create(null), out=[];
  source.forEach(function(f){
   if(!f)return;var name=String(f.name||f.title||'').trim(),action=String(f.action||f.onclick||'').trim();
   if(!name)return;
   var key=String(f.group||'OTHER')+'|'+name+'|'+action;if(seen[key])return;seen[key]=1;
   out.push({group:String(f.group||'OTHER'),icon:String(f.icon||'✦'),name:name,desc:String(f.desc||f.description||'AETHRION çalışma alanını aç'),action:action,href:String(f.href||f.url||'')});
  });
  return out.length?out:FALLBACK.slice();
 }
 function wrapper(){
  var dash=qs('#dashboardArea');
  return dash?(qs('.dashboard-content-wrapper',dash)||qs('.dashboard-content',dash)||dash):null;
 }
 function hoistOverlays(w){
  if(!w)return;
  var nodes=qsa('.modal-overlay, [id$="Overlay"]',w);
  nodes.forEach(function(n){
   if(!n||n===qs('#aethrionExperienceWelcome')||n===qs('#aeWorkspaceSidebar')||n.parentElement===document.body)return;
   if(n.id==='aethrionExperienceWelcome'||n.id==='aeWorkspaceSidebar')return;
   try{document.body.appendChild(n);}catch(e){}
  });
 }
 function ensureWelcome(w){
  var home=qs('#aethrionExperienceWelcome',w);
  if(!home){home=document.createElement('section');home.id='aethrionExperienceWelcome';w.insertBefore(home,w.firstChild);}
  else if(home.parentElement!==w)w.insertBefore(home,w.firstChild);
  return home;
 }
 function ensureSidebar(){
  var side=qs('#aeWorkspaceSidebar');
  if(!side){
   side=document.createElement('aside');side.id='aeWorkspaceSidebar';side.setAttribute('aria-label','AETHRION çalışma alanı menüsü');
   side.innerHTML=
    '<div class="ae-ws-brand"><div class="ae-ws-mark">A</div><div class="ae-ws-brand-copy"><strong>AETHRION</strong><small>INTELLIGENCE WITHOUT LIMITS</small></div><button type="button" class="ae-ws-close" aria-label="Menüyü kapat">×</button></div>'+
    '<button type="button" class="ae-ws-home" data-ae-ws-home><span class="ae-ws-home-icon">⌂</span><span><strong>Ana Ekran</strong><small>Karşılama ve genel bakış</small></span></button>'+
    '<label class="ae-ws-search"><span>⌕</span><input id="aeWorkspaceSearch" type="search" placeholder="Özellik ara…" autocomplete="off" aria-label="Özellik ara"></label>'+
    '<nav class="ae-ws-nav" id="aeWorkspaceNav" aria-label="Tüm özellikler"></nav>'+
    '<div class="ae-ws-footer"><span class="ae-ws-status-dot"></span><span>Çalışma alanı hazır</span><span class="ae-ws-user" id="aeWorkspaceUser"></span></div>';
   document.body.appendChild(side);
   var close=qs('.ae-ws-close',side);if(close)close.addEventListener('click',closeMobile);
   var home=qs('[data-ae-ws-home]',side);if(home)home.addEventListener('click',function(){mode='home';activeFeature=null;paint();closeMobile();});
   var search=qs('#aeWorkspaceSearch',side);if(search)search.addEventListener('input',function(){renderNav(this.value);});
  }
  var u=user(),uname=nameOf(u),userEl=qs('#aeWorkspaceUser',side);if(userEl)userEl.textContent=uname;
  renderNav(qs('#aeWorkspaceSearch',side)?qs('#aeWorkspaceSearch',side).value:'');
  return side;
 }
 function renderNav(query){
  var nav=qs('#aeWorkspaceNav');if(!nav)return;
  var q=String(query||'').trim().toLocaleLowerCase('tr-TR'),list=features().filter(function(f){return !q||(f.name+' '+f.desc+' '+f.group).toLocaleLowerCase('tr-TR').indexOf(q)>=0;});
  var groups=Object.create(null);list.forEach(function(f){(groups[f.group]||(groups[f.group]=[])).push(f);});
  var html='',index=0;
  Object.keys(groups).forEach(function(group){
   html+='<div class="ae-ws-group">'+esc(GROUPS[group]||group)+'</div>';
   groups[group].forEach(function(f){
    var active=mode==='feature'&&activeFeature&&activeFeature.name===f.name;
    html+='<button type="button" class="ae-ws-item'+(active?' is-active':'')+'" data-ae-ws-index="'+index+'"><span class="ae-ws-icon">'+esc(f.icon)+'</span><span class="ae-ws-item-copy"><strong>'+esc(f.name)+'</strong><small>'+esc(f.desc)+'</small></span><span class="ae-ws-chevron">›</span></button>';
    index++;
   });
  });
  nav.innerHTML=html||'<div class="ae-ws-empty">Eşleşen özellik bulunamadı.</div>';
  qsa('[data-ae-ws-index]',nav).forEach(function(btn){
   btn.addEventListener('click',function(){
    var idx=Number(btn.getAttribute('data-ae-ws-index')),f=list[idx];
    if(!f)return;activeFeature=f;mode='feature';paint();closeMobile();launchFeature(f);
   });
  });
 }
 function getRoute(f){
  if(ROUTES[f.action])return ROUTES[f.action];
  var href=String(f.href||'').trim();
  if(!href||href==='javascript:void(0)'||href==='#'||href==='/index.html'||href.indexOf('/index.html#')===0||href.charAt(0)==='#')return '';
  try{var u=new URL(href,location.origin);if(u.origin===location.origin)return u.pathname+u.search+u.hash;}catch(e){}
  return '';
 }
 function paint(){
  var w=wrapper();if(!w)return;
  hoistOverlays(w);
  var home=ensureWelcome(w);
  qsa('#aethrionWelcomeScreen, #dashboardSimplifiedHome',w).forEach(function(n){n.remove();});
  Array.prototype.forEach.call(w.children,function(el){
   if(el===home)return;
   el.style.setProperty('display','none','important');
  });
  home.style.setProperty('display','block','important');
  home.dataset.aeWorkspaceVersion=VERSION;
  document.body.classList.add('logged-in-user','ae-workspace-active');
  var dash=qs('#dashboardArea');if(dash){dash.style.setProperty('display','block','important');dash.style.setProperty('visibility','visible','important');}
  var main=qs('#mainSite');if(main)main.style.setProperty('display','none','important');
  var side=ensureSidebar();side.classList.add('is-ready');
  qsa('#aethrionFeaturesTrigger,#aethrionFeaturesPanel,#aethrionFeaturesBackdrop,#aethrionExperienceDrawer,#aethrionExperienceBackdrop').forEach(function(n){n.style.setProperty('display','none','important');n.setAttribute('aria-hidden','true');});
  var u=user(),name=nameOf(u),role=roleOf(u);
  var head='<div class="ae-ws-view-head"><div><span class="ae-ws-eyebrow">AETHRION WORKSPACE</span><h1>'+(mode==='home'?'Hoş geldiniz, '+esc(name):esc(activeFeature?activeFeature.name:'Çalışma alanı'))+'</h1><p>'+(mode==='home'?'Tüm araçlarınız tek bir çalışma alanında. Sol menüden bir özellik seçerek doğrudan açabilirsiniz.':esc(activeFeature?activeFeature.desc:'Seçilen özellik'))+'</p></div>'+(mode==='feature'?'<span class="ae-ws-current-badge">AÇIK ÇALIŞMA ALANI</span>':'<span class="ae-ws-role">'+esc(role)+'</span>')+'</div>';
  if(mode==='home'){
   home.innerHTML='<div class="ae-workspace-shell"><main class="ae-workspace-main"><section class="ae-ws-home-view"><div class="ae-ws-home-mark" aria-hidden="true"><img src="/aethrion-mark.svg" alt=""></div><div class="ae-ws-home-copy"><div class="ae-ws-eyebrow"><span class="ae-ws-status-dot"></span> PERSONAL WORKSPACE</div><h1>Hoş geldiniz,<br><em>'+esc(name)+'</em></h1><div class="ae-ws-role">'+esc(role)+'</div><p>Çalışma alanınız hazır. Yapay zekâ, üretim araçları, geliştirici hizmetleri ve hesap ayarları sol menüde tek bir yerde toplandı.</p><div class="ae-ws-home-note"><span>✦</span><span>Başlamak için soldaki menüden bir özellik seçin.</span></div></div></section></main></div>';
  }else{
   var f=activeFeature||{name:'Çalışma alanı',desc:'Seçilen özellik'};
   var route=getRoute(f);
   home.innerHTML='<div class="ae-workspace-shell"><main class="ae-workspace-main">'+head+'<section class="ae-ws-feature-view" id="aeWorkspaceFeatureView">'+
    (route?'<div class="ae-ws-iframe-wrap"><div class="ae-ws-iframe-top"><span><i></i><i></i><i></i></span><strong>'+esc(f.name)+'</strong><a href="'+esc(route)+'" target="_blank" rel="noopener">Yeni sekmede aç ↗</a></div><iframe class="ae-ws-feature-frame" title="'+esc(f.name)+'" src="'+esc(route)+'" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"></iframe></div>':'<div class="ae-ws-launch-card"><div class="ae-ws-launch-icon">'+esc(f.icon||'✦')+'</div><h2>'+esc(f.name)+'</h2><p>'+esc(f.desc)+'</p><div class="ae-ws-launch-status" id="aeWorkspaceLaunchStatus">Özellik başlatılıyor…</div></div>')+
    '</section></main></div>';
  }
  if(mode==='home'){
   var nameEl=qs('#dashboardUserName');if(nameEl)nameEl.textContent=name;
  }
  renderNav(qs('#aeWorkspaceSearch')?qs('#aeWorkspaceSearch').value:'');
 }
 function launchFeature(f){
  var route=getRoute(f);
  if(route)return;
  var aliases={
   openAethrionAlPanel:['openAethrionAlPanel','openVizyonAlPanel'],
   openVizyonAlPanel:['openVizyonAlPanel','openAethrionAlPanel'],
   openFullAIPanel:['openFullAIPanel','openAethrionAI'],
   openKocPanel:['openKocPanel','openAethrionCoach','openCoachPanel'],
   open3DBuilder:['open3DBuilder','open3DStudio','open3DStudioPanel'],
   openA27ApiGuide:['openA27ApiGuide','openV27ApiGuide'],
   openA27ApiKeyGenerator:['openA27ApiKeyGenerator','createA27ApiKey'],
   toggleTeamPage:['toggleTeamPage','openTeamPage'],
   openContestPage:['openContestPage','toggleContestPage']
  };
  var names=aliases[f.action]||[f.action],fn=null;
  for(var i=0;i<names.length;i++){if(names[i]&&typeof window[names[i]]==='function'){fn=window[names[i]];break;}}
  if(fn){
   try{var result=fn.call(window);if(result&&typeof result.then==='function')result.catch(function(e){showLaunchError(e);});return;}
   catch(e){showLaunchError(e);return;}
  }
  if(f.action==='scrollToProjects'){
   var t=qs('#projects')||qs('#projectsSection')||qs('#myProjects')||qs('#projectsList');if(t){t.style.display='block';t.scrollIntoView({behavior:'smooth'});return;}
  }
  showLaunchError(new Error('Bu özellik için doğrudan bir açılış fonksiyonu bulunamadı.'));
 }
 function showLaunchError(error){
  var el=qs('#aeWorkspaceLaunchStatus');if(el)el.textContent='Açılış bilgisi: '+String(error&&error.message||error||'Bilinmeyen hata');
  if(typeof window.showNotification==='function')window.showNotification('Özellik açılamadı: '+String(error&&error.message||error||'Bilinmeyen hata'),'warning');
 }
 function closeMobile(){var side=qs('#aeWorkspaceSidebar');if(side)side.classList.remove('is-mobile-open');document.body.classList.remove('ae-ws-mobile-open');}
 function toggleMobile(){var side=ensureSidebar();side.classList.toggle('is-mobile-open');document.body.classList.toggle('ae-ws-mobile-open',side.classList.contains('is-mobile-open'));}
 function ensureToggle(){
  var btn=qs('#aeWorkspaceMobileToggle');if(btn)return;
  btn=document.createElement('button');btn.id='aeWorkspaceMobileToggle';btn.type='button';btn.setAttribute('aria-label','Özellikler menüsünü aç');btn.innerHTML='<span></span><span></span><span></span>';
  btn.addEventListener('click',toggleMobile);document.body.appendChild(btn);
 }
 function setup(){
  if(!document.body)return;
  var u=user(),logged=!!u||document.body.classList.contains('logged-in-user');
  if(!logged){var s=qs('#aeWorkspaceSidebar');if(s)s.classList.remove('is-ready');document.body.classList.remove('ae-workspace-active');return;}
  if(!wrapper())return;
  booted=true;ensureToggle();paint();
  var w=wrapper(),home=qs('#aethrionExperienceWelcome',w);
  if(w&&window.MutationObserver&&!observer){
   observer=new MutationObserver(function(){
    if(renderQueued)return;
    var current=qs('#aethrionExperienceWelcome',w);
    if(!current||!current.querySelector('.ae-workspace-shell')||current.dataset.aeWorkspaceVersion!==VERSION){
     renderQueued=true;window.setTimeout(function(){renderQueued=false;if(user())paint();},0);
    }
   });
   observer.observe(w,{subtree:true,childList:true});
  }
 }
 function start(){
  setup();
  [250,800,1600,2800,4500,6500].forEach(function(ms){setTimeout(setup,ms);});
  if(window.MutationObserver){var bodyObserver=new MutationObserver(function(){if(user())setup();});bodyObserver.observe(document.body,{childList:true,attributes:true,attributeFilter:['class']});}
  window.addEventListener('resize',function(){if(window.innerWidth>820)closeMobile();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.addEventListener('load',function(){setTimeout(setup,300);setTimeout(setup,1200);});
})();

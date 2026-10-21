(function () {
  'use strict';
  var FALLBACK_FEATURES = [
    {group:'CORE',icon:'✦',name:'AETHRION AI',desc:'Yapay zekâ çalışma alanı',action:'openFullAIPanel'},
    {group:'CORE',icon:'◈',name:'AETHRION AI Paneli',desc:'Dört modlu AI paneli',action:'openAethrionAlPanel'},
    {group:'CORE',icon:'◎',name:'AETHRION Coach',desc:'Kişisel AI asistanı',action:'openKocPanel'},
    {group:'CORE',icon:'◉',name:'Model Kataloğu',desc:'Kullanılabilir modelleri incele',action:'openModelsShowcase'},
    {group:'CREATE',icon:'◇',name:'3D Studio',desc:'Üç boyutlu tasarım araçları',action:'open3DBuilder'},
    {group:'CREATE',icon:'▶',name:'Video Editör',desc:'Video düzenleme alanı',action:'openVideoEditor'},
    {group:'CREATE',icon:'▣',name:'Video Stüdyosu',desc:'Video fikirleri ve üretim araçları',action:'openVideoStudio'},
    {group:'PLATFORM',icon:'⌂',name:'Topluluk ve Takımlar',desc:'Takım ve ortak proje alanları',action:'toggleTeamPage'},
    {group:'PLATFORM',icon:'◫',name:'Projelerim',desc:'Projelerine ve kayıtlarına eriş',action:'scrollToProjects'},
    {group:'ADVANCED',icon:'⌘',name:'A27 API Anahtarı',desc:'API erişim seçenekleri',action:'openA27ApiKeyGenerator'},
    {group:'ADVANCED',icon:'↗',name:'A27 API Rehberi',desc:'API belgeleri ve örnekler',action:'openA27ApiGuide'},
    {group:'ACCOUNT',icon:'⚙',name:'Ayarlar',desc:'Hesap ve uygulama tercihleri',action:'openSettingsModal'}
  ];
  var GROUPS = {CORE:'ÇEKİRDEK',CREATE:'ÜRETİM ARAÇLARI',PLATFORM:'PLATFORM',ADVANCED:'GELİŞMİŞ ARAÇLAR',ACCOUNT:'HESAP'};
  var ROUTES = {
    open3DBuilder:'3d-studio.html', openA27ApiGuide:'api.html', openA27ApiKeyGenerator:'api.html#keys',
    openAethrionAlPanel:'aethrion-ai.html', openFullAIPanel:'aethrion-ai.html', openKocPanel:'aethrion-assistant.html',
    openModelsShowcase:'aethrion-ai.html#models', toggleTeamPage:'topluluk.html', openContestPage:'topluluk.html',
    scrollToAcademy:'bana-ogret.html', openAcademy:'bana-ogret.html', scrollToProjects:'share.html',
    openBlog:'blog.html', openDocumentation:'dokumantasyon.html', openAbout:'hakkimizda.html'
  };
  function qs(sel, root){return (root||document).querySelector(sel);}
  function qsa(sel, root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function authUser(){
    try{if(window.currentUser)return window.currentUser;}catch(e){}
    try{if(window.Parse&&Parse.User&&typeof Parse.User.current==='function')return Parse.User.current();}catch(e){}
    return null;
  }
  function attr(user,key){
    try{if(user&&typeof user.get==='function')return user.get(key)||'';}catch(e){}
    try{if(user&&user[key])return user[key];}catch(e){}
    return '';
  }
  function userName(){
    var u=authUser(), name=attr(u,'name')||attr(u,'fullName')||attr(u,'username');
    if(!name){var first=attr(u,'firstName'),last=attr(u,'lastName');name=[first,last].filter(Boolean).join(' ');}
    if(!name){var email=attr(u,'email');if(email)name=email.split('@')[0];}
    if(!name){
      try{
        var saved=JSON.parse(localStorage.getItem('aethrion_user')||'null');
        if(saved&&saved.name&&(document.body.classList.contains('logged-in-user')||qs('#dashboardArea')&&qs('#dashboardArea').style.display!=='none'))name=saved.name;
      }catch(e){}
    }
    return name||'Kullanıcı';
  }
  function userRole(){
    var u=authUser(), role=attr(u,'role')||'user';
    var map={founder:'Kurucu',admin:'Yönetici',moderator:'Moderatör / Tasarımcı',beta:'Beta üyesi',user:'Üye'};
    var plan=attr(u,'plan');
    return (map[role]||'Üye')+(plan?' · '+String(plan).toUpperCase()+' plan':'');
  }
  function featureItems(){
    var src=Array.isArray(window.FEATURE_LIST)&&window.FEATURE_LIST.length?window.FEATURE_LIST:FALLBACK_FEATURES;
    var seen={}, out=[];
    src.forEach(function(f){
      if(!f||!f.name)return;
      var action=String(f.action||f.onclick||'');
      var key=String(f.group||'OTHER')+'|'+String(f.name)+'|'+action;
      if(seen[key])return;seen[key]=true;
      out.push({group:String(f.group||'OTHER'),icon:String(f.icon||'✦'),name:String(f.name),desc:String(f.desc||f.description||'AETHRION çalışma alanını aç'),action:action,color:f.color||'',href:f.href||f.url||''});
    });
    return out.length?out:FALLBACK_FEATURES.slice();
  }
  function ensureDrawer(){
    var back=qs('#aethrionExperienceBackdrop');
    if(!back){back=document.createElement('div');back.id='aethrionExperienceBackdrop';back.addEventListener('click',closeDrawer);document.body.appendChild(back);}
    var panel=qs('#aethrionExperienceDrawer');
    if(!panel){
      panel=document.createElement('aside');panel.id='aethrionExperienceDrawer';panel.setAttribute('aria-label','AETHRION özellikler menüsü');panel.setAttribute('aria-hidden','true');
      panel.innerHTML='<div class="aed-head"><div class="aed-brand"><div class="aed-mark">A</div><div><h2 class="aed-title">AETHRION</h2><span class="aed-subtitle">Çalışma alanları ve özellikler</span></div></div><button class="aed-close" type="button" aria-label="Menüyü kapat">×</button></div><div class="aed-search"><input id="aedSearch" type="search" autocomplete="off" placeholder="Özellik ara…" aria-label="Özellik ara"></div><div class="aed-list" id="aedList"></div><div class="aed-foot">Bir özelliği seçtiğinizde ilgili çalışma alanı açılır. Kullanılabilir özellikler hesabınıza ve hizmet durumuna göre değişebilir.</div>';
      panel.querySelector('.aed-close').addEventListener('click',closeDrawer);
      panel.querySelector('#aedSearch').addEventListener('input',function(){renderDrawerItems(this.value);});
      document.body.appendChild(panel);
    }
    return panel;
  }
  function renderDrawerItems(query){
    var panel=ensureDrawer(), list=panel.querySelector('#aedList'), q=String(query||'').trim().toLocaleLowerCase('tr-TR');
    var items=featureItems().filter(function(f){return !q||(f.name+' '+f.desc+' '+f.group).toLocaleLowerCase('tr-TR').indexOf(q)!==-1;});
    var grouped={};
    items.forEach(function(f){(grouped[f.group]||(grouped[f.group]=[])).push(f);});
    var html='';
    Object.keys(grouped).forEach(function(group){
      html+='<div class="aed-group-title">'+esc(GROUPS[group]||group)+'</div>';
      grouped[group].forEach(function(f){
        html+='<button type="button" class="aed-item" data-ae-action="'+esc(f.action)+'" data-ae-name="'+esc(f.name)+'" data-ae-href="'+esc(f.href)+'"><span class="aed-icon">'+esc(f.icon)+'</span><span class="aed-item-text"><strong>'+esc(f.name)+'</strong><small>'+esc(f.desc)+'</small></span><span class="aed-chevron" aria-hidden="true">›</span></button>';
      });
    });
    list.innerHTML=html||'<div class="aed-empty">Bu aramayla eşleşen özellik bulunamadı.</div>';
  }
  function openDrawer(){
    var panel=ensureDrawer(), back=qs('#aethrionExperienceBackdrop');
    renderDrawerItems(qs('#aedSearch',panel).value);
    panel.classList.add('open');panel.setAttribute('aria-hidden','false');back.classList.add('show');document.body.classList.add('aethrion-experience-menu-open');
    setTimeout(function(){var input=qs('#aedSearch',panel);if(input)input.focus({preventScroll:true});},180);
  }
  function closeDrawer(){
    var panel=qs('#aethrionExperienceDrawer'),back=qs('#aethrionExperienceBackdrop');
    if(panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}
    if(back)back.classList.remove('show');
    document.body.classList.remove('aethrion-experience-menu-open');
  }
  function leaveWelcome(){
    document.body.classList.remove('aethrion-experience-welcome-active');
    var welcome=qs('#aethrionExperienceWelcome');
    if(welcome)welcome.style.display='none';
    var parent=welcome&&welcome.parentElement;
    if(parent)Array.prototype.forEach.call(parent.children,function(el){
      if(el===welcome)return;
      if(el.hasAttribute('data-ae-display-saved')){
        var saved={};try{saved=JSON.parse(el.getAttribute('data-ae-display-saved')||'{}');}catch(e){}
        if(saved.value)el.style.setProperty('display',saved.value,saved.priority||'');else el.style.removeProperty('display');
        el.removeAttribute('data-ae-display-saved');
      }
    });
  }
  function renderWelcome(){
    var dash=qs('#dashboardArea');
    if(!dash){return false;}
    var wrapper=qs('.dashboard-content-wrapper',dash)||qs('.dashboard-content',dash)||dash;
    var welcome=qs('#aethrionExperienceWelcome');
    if(!welcome){
      welcome=document.createElement('section');welcome.id='aethrionExperienceWelcome';welcome.setAttribute('aria-labelledby','aewName');
      wrapper.insertBefore(welcome,wrapper.firstChild);
    }else if(welcome.parentElement!==wrapper){wrapper.insertBefore(welcome,wrapper.firstChild);}
    var name=userName(), role=userRole(), safeName=esc(name);
    welcome.innerHTML='<div class="aew-eyebrow"><span class="aew-dot"></span> AETHRION · PERSONAL WORKSPACE</div>'+
      '<p class="aew-greeting">Hesabınıza güvenli şekilde giriş yaptınız.</p>'+
      '<h1 class="aew-name" id="aewName">Hoş geldiniz,<br><em>'+safeName+'</em></h1>'+
      '<div class="aew-role">◈ '+esc(role)+'</div>'+
      '<p class="aew-copy">AETHRION çalışma alanınız hazır. Yapay zekâ, üretim araçları, API ve hesap hizmetlerinize tek bir merkezden erişebilirsiniz.</p>'+
      '<div class="aew-grid">'+
      '<button type="button" class="aew-shortcut" data-ae-quick="menu"><span class="aew-shortcut-icon">⌘</span><span class="aew-shortcut-copy"><strong>Tüm özellikler</strong><small>Çalışma alanlarını görüntüleyin</small></span><span class="aew-shortcut-arrow">›</span></button>'+
      '<button type="button" class="aew-shortcut" data-ae-quick="ai"><span class="aew-shortcut-icon">✦</span><span class="aew-shortcut-copy"><strong>AETHRION AI</strong><small>Yapay zekâ araçlarınızı açın</small></span><span class="aew-shortcut-arrow">›</span></button>'+
      '<button type="button" class="aew-shortcut" data-ae-quick="api"><span class="aew-shortcut-icon">⌘</span><span class="aew-shortcut-copy"><strong>A27 API</strong><small>Geliştirici araçları ve belgeler</small></span><span class="aew-shortcut-arrow">›</span></button>'+
      '</div><div class="aew-actions"><button class="aew-primary" type="button" data-ae-quick="menu">Özellikler menüsünü aç <span aria-hidden="true">↗</span></button><button class="aew-secondary" type="button" data-ae-quick="account">Hesap bilgilerim</button></div>';
    welcome.style.display='block';
    document.body.classList.add('aethrion-experience-welcome-active');
    Array.prototype.forEach.call(wrapper.children,function(el){
      if(el===welcome)return;
      if(!el.hasAttribute('data-ae-display-saved'))el.setAttribute('data-ae-display-saved',JSON.stringify({value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')}));
      el.style.setProperty('display','none','important');
    });
    try{dash.style.display='block';dash.style.visibility='visible';dash.style.opacity='1';}catch(e){}
    var main=qs('#mainSite');if(main)main.style.display='none';
    document.body.classList.add('logged-in-user');
    return true;
  }
  function scrollToFirst(selectors){
    for(var i=0;i<selectors.length;i++){
      var el=qs(selectors[i]);if(el){leaveWelcome();closeDrawer();el.scrollIntoView({behavior:'smooth',block:'start'});return true;}
    }
    return false;
  }
  function runAction(action,name,href){
    action=String(action||'');name=String(name||'');
    closeDrawer();leaveWelcome();
    if(action==='goHome'||action==='showWelcome'||action==='renderWelcome'){renderWelcome();return;}
    if(action==='doLogout'){if(typeof window.logout==='function'){window.logout();return;}if(window.Parse&&Parse.User){Parse.User.logOut().then(function(){location.reload();}).catch(function(){location.reload();});return;}location.reload();return;}
    if(href){location.href=href;return;}
    var aliases={
      openAethrionAlPanel:['openAethrionAlPanel','openVizyonAlPanel','openAethrionAI','openFullAIPanel'],
      openFullAIPanel:['openFullAIPanel','openAethrionAI','openAethrionAlPanel'],
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
    var candidates=aliases[action]||[action], fn=null;
    for(var j=0;j<candidates.length;j++){if(candidates[j]&&typeof window[candidates[j]]==='function'){fn=window[candidates[j]];break;}}
    if(fn&&fn!==runAction&&fn!==openDrawer&&fn!==closeDrawer){
      try{var result=fn.call(window);if(result&&typeof result.then==='function')result.catch(function(err){console.error('[AETHRION] Özellik açılamadı:',err);fallbackAction(action,name);});return;}
      catch(err){console.error('[AETHRION] Özellik açılamadı:',err);}
    }
    fallbackAction(action,name);
  }
  function fallbackAction(action,name){
    if(action==='scrollToAcademy'||/academy|akademi|öğren/i.test(name)){if(scrollToFirst(['#academy','#academySection','#academy-section','#aethrionAcademy']))return;}
    if(action==='scrollToProjects'||/proje/i.test(name)){if(scrollToFirst(['#projects','#projectsSection','#myProjects','#projects-section']))return;}
    if(action==='scrollToImageGen'||/görsel üret|image gen/i.test(name)){if(scrollToFirst(['#imageGen','#imageGeneration','#image-generator','#imageGenSection']))return;}
    if(action==='openAccountInfo'){if(typeof window.openAccountInfo==='function'){try{window.openAccountInfo();return;}catch(e){}}}
    var route=ROUTES[action];
    if(!route){
      if(/3d|üç boyut/i.test(name))route='3d-studio.html';
      else if(/api|anahtar/i.test(name))route='api.html';
      else if(/coach|koç|asistan/i.test(name))route='aethrion-assistant.html';
      else if(/ai|yapay zekâ|yapay zeka|model/i.test(name))route='aethrion-ai.html';
      else if(/topluluk|takım|community/i.test(name))route='topluluk.html';
      else if(/blog/i.test(name))route='blog.html';
      else if(/doküman|belge/i.test(name))route='dokumantasyon.html';
    }
    if(route){location.href=route;return;}
    if(typeof window.showNotification==='function')window.showNotification('Bu özellik için kullanılabilir bir açılış noktası bulunamadı. İlgili sayfayı ve bağlantıyı kontrol edin.','warning');
  }
  function initSplash(){
    var splash=qs('#splashScreen');if(!splash)return;
    splash.classList.remove('hide','hidden');
    splash.style.removeProperty('display');splash.style.removeProperty('visibility');splash.style.removeProperty('opacity');splash.style.removeProperty('pointer-events');
    window.setTimeout(function(){if(splash&&!splash.classList.contains('hide'))splash.classList.add('hide');},3100);
  }
  function initFeatureButtons(){
    document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest?e.target.closest('[data-ae-quick]'):null;
      if(t){
        e.preventDefault();e.stopImmediatePropagation();
        var quick=t.getAttribute('data-ae-quick');
        if(quick==='menu')openDrawer();
        else if(quick==='ai')runAction('openFullAIPanel','AETHRION AI');
        else if(quick==='api')runAction('openA27ApiGuide','A27 API');
        else if(quick==='account')runAction('openAccountInfo','Hesap bilgilerim');
        return;
      }
      var item=e.target&&e.target.closest?e.target.closest('#aethrionExperienceDrawer [data-ae-action]'):null;
      if(item){
        e.preventDefault();e.stopImmediatePropagation();
        runAction(item.getAttribute('data-ae-action'),item.getAttribute('data-ae-name'),item.getAttribute('data-ae-href'));return;
      }
      var trigger=e.target&&e.target.closest?e.target.closest('#aethrionFeaturesTrigger,#aethrionFeaturesButton,[data-aethrion-features-trigger],button,a,[role="button"]'):null;
      if(!trigger||trigger.closest('#aethrionExperienceDrawer'))return;
      var text=((trigger.innerText||trigger.textContent||'')+' '+(trigger.getAttribute('aria-label')||'')+' '+(trigger.getAttribute('title')||'')+' '+(trigger.id||'')).toLocaleLowerCase('tr-TR');
      var explicitTrigger=(trigger.id==='aethrionFeaturesTrigger'||trigger.id==='aethrionFeaturesButton'||trigger.hasAttribute('data-aethrion-features-trigger'));var menuLabel=/aethrionfeaturestrigger|aethrionfeaturesbutton|tüm özellikler|features menu|feature menu|sidebar|özellik menüsü|özellik paneli/.test(text);var inDashboard=!!trigger.closest('#dashboardArea')||document.body.classList.contains('logged-in-user');if(explicitTrigger||menuLabel||(inDashboard&&/özellikler|features/.test(text))){
        e.preventDefault();e.stopImmediatePropagation();openDrawer();
      }
    },true);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDrawer();});
  }
  function wrapDashboard(){
    var original=window.showDashboard;
    if(typeof original!=='function'||original.__aethrionExperienceWrapped)return;
    var wrapped=function(){
      var result;
      try{result=original.apply(this,arguments);}catch(err){throw err;}
      var after=function(){window.setTimeout(function(){if(authUser())renderWelcome();},180);};
      if(result&&typeof result.then==='function')result.then(after,after);else after();
      return result;
    };
    wrapped.__aethrionExperienceWrapped=true;wrapped.__aethrionOriginal=original;window.showDashboard=wrapped;
  }
  function applyOverrides(){
    window.openAethrionFeaturesPanel=openDrawer;
    window.closeAethrionFeaturesPanel=closeDrawer;
    window.toggleAethrionFeaturesPanel=function(){var p=qs('#aethrionExperienceDrawer');if(p&&p.classList.contains('open'))closeDrawer();else openDrawer();};
    window.toggleAethrionSidebar=window.toggleAethrionFeaturesPanel;
    window.safeFeatureCall=runAction;
    window.showWelcomeScreen=renderWelcome;window.showWelcome=renderWelcome;window.renderWelcome=renderWelcome;window.goHome=renderWelcome;
    wrapDashboard();
  }
  function start(){
    applyOverrides();initFeatureButtons();initSplash();ensureDrawer();
    var attempts=0;
    function checkSession(){
      attempts++;var u=authUser();
      if(u){renderWelcome();return;}
      if(attempts<9)window.setTimeout(checkSession,Math.min(900*attempts,3500));
    }
    window.setTimeout(checkSession,650);
    window.setTimeout(applyOverrides,1250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('load',function(){window.setTimeout(function(){applyOverrides();},450);});
})();
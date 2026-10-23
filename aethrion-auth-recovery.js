(function(){
'use strict';
function notify(message,type){
 try{if(typeof window.showNotification==='function')window.showNotification(message,type||'warning');else console.warn('[AETHRION]',message)}catch(e){console.warn(message)}
}
function ensureGoogleFallback(){
 var original=document.querySelector('#authModal .btn-google');
 if(!original)return null;
 var host=document.getElementById('aethrionGoogleFallback');
 if(!host){host=document.createElement('div');host.id='aethrionGoogleFallback';original.insertAdjacentElement('afterend',host)}
 return {original:original,host:host};
}
function installGoogleRecovery(){
 if(typeof window.loginWithGoogle!=='function'||window.__aethrionGoogleRecoveryInstalled)return;
 window.__aethrionGoogleRecoveryInstalled=true;
 window.loginWithGoogle=function(){
  var pair=ensureGoogleFallback();
  if(!pair){notify('Google giriş alanı bulunamadı. Sayfayı yenileyip tekrar deneyin.','error');return}
  if(typeof google==='undefined'||!google.accounts||!google.accounts.id){
   notify('Google güvenli giriş bileşeni henüz yüklenmedi. Birkaç saniye sonra tekrar deneyin.','warning');
   var tries=0;var retry=setInterval(function(){tries++;if(typeof google!=='undefined'&&google.accounts&&google.accounts.id){clearInterval(retry);window.loginWithGoogle()}else if(tries>=8)clearInterval(retry)},500);
   return;
  }
  try{
   if(!pair.host.dataset.rendered){
    pair.host.innerHTML='';
    google.accounts.id.renderButton(pair.host,{type:'standard',theme:'outline',size:'large',shape:'rectangular',text:'continue_with',logo_alignment:'left',width:320});
    pair.host.dataset.rendered='1';
   }
   pair.host.classList.add('is-visible');
   pair.original.style.display='none';
   notify('Google’ın güvenli giriş düğmesi hazır. Girişi tamamlamak için Google düğmesine dokunun.','info');
  }catch(e){console.error('[AETHRION] Google GIS render failed',e);notify('Google giriş bileşeni açılamadı: '+(e.message||'bilinmeyen hata'),'error')}
 };
}
function improveAuthForms(){
 var formFields=[
  ['rName','name','name'],['rEmail','email','email'],['rUsername','text','username'],
  ['rPass','password','new-password'],['rPass2','password','new-password'],
  ['lEmail','email','email'],['lPass','password','current-password'],['verifyEmail','email','email']
 ];
 formFields.forEach(function(row){var el=document.getElementById(row[0]);if(!el)return;el.setAttribute('type',row[1]);el.setAttribute('autocomplete',row[2]);if(row[0].indexOf('Email')>=0||row[0]==='rEmail'||row[0]==='lEmail')el.setAttribute('inputmode','email')});
 var register=document.querySelector('#formRegister .btn-primary');
 if(register&&!register.dataset.aeBusyGuard){
  register.dataset.aeBusyGuard='1';
  register.addEventListener('click',function(){
   if(register.dataset.busy==='1')return;
   register.dataset.busy='1';var old=register.textContent;register.textContent='Hesap oluşturuluyor…';register.setAttribute('aria-busy','true');
   setTimeout(function(){register.dataset.busy='0';register.textContent=old;register.removeAttribute('aria-busy')},12000);
  },true);
 }
}
function boot(){installGoogleRecovery();improveAuthForms()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,800);setTimeout(boot,2200);
})();

(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='/aethrion-workspace-v6.css?v=20261022-workspace9';document.head.appendChild(l);var s=document.createElement('script');s.src='/aethrion-workspace-v6.js?v=20261022-workspace9';s.async=true;document.body.appendChild(s)})();


/* AETHRION auth guard v4: prevent duplicate submissions and wait for GIS initialization */
(function(){
 'use strict';
 var wrapped=Object.create(null);
 function notify(message,type){
  try{if(typeof window.showNotification==='function')window.showNotification(message,type||'warning');else console.warn('[AETHRION Auth]',message)}catch(e){}
 }
 function wrapSubmit(name,selector,label){
  var original=window[name];
  if(typeof original!=='function'||original.__aeSubmitGuard)return;
  var busy=false;
  var guarded=async function(){
   if(busy){notify('İşlem devam ediyor; lütfen tamamlanmasını bekleyin.','info');return;}
   busy=true;
   var button=document.querySelector(selector),oldText='';
   if(button){oldText=button.textContent;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=label;button.classList.add('ae-auth-busy');}
   try{return await original.apply(this,arguments);}
   catch(error){notify((name==='handleRegister'?'Kayıt':'Giriş')+' işlemi tamamlanamadı: '+(error&&error.message||'Bilinmeyen hata'),'error');throw error;}
   finally{
    busy=false;
    if(button){button.disabled=false;button.removeAttribute('aria-busy');button.classList.remove('ae-auth-busy');button.textContent=oldText;}
   }
  };
  guarded.__aeSubmitGuard=true;guarded.__aeOriginal=original;window[name]=guarded;wrapped[name]=true;
 }
 function install(){
  wrapSubmit('handleRegister','#formRegister .btn-primary','Hesap oluşturuluyor…');
  wrapSubmit('handleLogin','#formLogin .btn-primary','Giriş yapılıyor…');
  wrapSubmit('verifyAccount','#formVerify .btn-primary','Doğrulanıyor…');
 }
 install();setTimeout(install,400);setTimeout(install,1400);setTimeout(install,2800);
})();


/* Google Identity Services: render the real Google button up front, not after a second click. */
(function(){
 'use strict';
 var mountBusy=false;
 function notify(msg,type){try{if(typeof window.showNotification==='function')window.showNotification(msg,type||'warning')}catch(e){}}
 function mountGoogleButton(){
  var original=document.querySelector('#authModal .btn-google');
  if(!original||!document.body)return false;
  var host=document.getElementById('aethrionGoogleFallback');
  if(!host){host=document.createElement('div');host.id='aethrionGoogleFallback';original.insertAdjacentElement('afterend',host)}
  if(host.dataset.rendered==='1'){host.classList.add('is-visible');original.style.display='none';return true}
  if(typeof window.google==='undefined'||!google.accounts||!google.accounts.id){return false}
  if(!window._googleGISReady){
   try{if(typeof window.handleGoogleLibraryLoad==='function')window.handleGoogleLibraryLoad()}catch(e){}
   return false;
  }
  if(mountBusy)return false;
  mountBusy=true;
  try{
   host.innerHTML='';
   var width=Math.floor((original.parentElement&&original.parentElement.clientWidth)||320);
   width=Math.max(240,Math.min(360,width));
   google.accounts.id.renderButton(host,{type:'standard',theme:'outline',size:'large',shape:'rectangular',text:'continue_with',logo_alignment:'left',width:width,locale:'tr'});
   host.dataset.rendered='1';
   host.classList.add('is-visible');
   original.style.display='none';
   original.setAttribute('aria-hidden','true');
   return true;
  }catch(e){
   console.error('[AETHRION] Google button render failed:',e);
   host.dataset.rendered='0';
   notify('Google giriş düğmesi oluşturulamadı. Google istemci kimliği ve yetkili alan adları kontrol edilmeli.','error');
   return false;
  }finally{mountBusy=false}
 }
 window.loginWithGoogle=function(){
  if(mountGoogleButton())return;
  notify('Google güvenli giriş bileşeni hazırlanıyor. Birkaç saniye sonra tekrar deneyin.','info');
  [250,700,1300,2200,3500].forEach(function(t){setTimeout(mountGoogleButton,t)});
 };
 function boot(){
  mountGoogleButton();
  [350,900,1600,2800,4500,7000].forEach(function(t){setTimeout(mountGoogleButton,t)});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 if(window.MutationObserver&&document.body)new MutationObserver(function(){if(!document.getElementById('aethrionGoogleFallback')||!document.getElementById('aethrionGoogleFallback').dataset.rendered)setTimeout(mountGoogleButton,150)}).observe(document.body,{subtree:true,childList:true});
})();


/* Ensure Parse/Back4App is initialized before email auth or Google-token verification. */
(function(){
 'use strict';
 function notify(msg,type){try{if(typeof window.showNotification==='function')window.showNotification(msg,type||'error');else console.error('[AETHRION Auth]',msg)}catch(e){}}
 async function ensureParseReady(){
  if(typeof window.Parse==='undefined'||!window.Parse.User)throw new Error('Kimlik doğrulama bileşeni yüklenemedi. Sayfayı yenileyip tekrar deneyin.');
  if(window.parseInitialized||window.Parse.applicationId)return true;
  if(typeof window.initBack4app!=='function')throw new Error('Sunucu bağlantısı henüz hazır değil. Birkaç saniye sonra tekrar deneyin.');
  var result=await window.initBack4app();
  if(result===false||(!window.parseInitialized&&!window.Parse.applicationId))throw new Error('Sunucu bağlantısı kurulamadı. İnternet bağlantısını ve sunucu yapılandırmasını kontrol edin.');
  return true;
 }
 function guard(name,label){
  var original=window[name];
  if(typeof original!=='function'||original.__aeParseReadyGuard)return;
  var wrapped=async function(){
   try{await ensureParseReady();return await original.apply(this,arguments)}
   catch(e){console.error('[AETHRION] '+label+' auth setup failed:',e);notify(label+' işlemi başlatılamadı: '+(e&&e.message||'Bilinmeyen hata'),'error');return undefined}
  };
  wrapped.__aeParseReadyGuard=true;wrapped.__aeOriginal=original;window[name]=wrapped;
 }
 function install(){guard('handleRegister','Kayıt');guard('handleLogin','Giriş');guard('verifyAccount','Doğrulama');guard('handleGoogleLoginResponse','Google ile giriş')}
 install();[400,1000,2200,4200].forEach(function(t){setTimeout(install,t)});
})();


/* AETHRION Auth Flow v5 — pass the real event, show progress, and navigate only after a session exists. */
(function(){
 'use strict';
 var active=Object.create(null), overlay=null, statusNode=null, fillNode=null, timer=null;
 var actions=[
  {selector:'#formLogin .btn-primary',form:'#formLogin',fn:'handleLogin',label:'Giriş'},
  {selector:'#formRegister .btn-primary',form:'#formRegister',fn:'handleRegister',label:'Kayıt'},
  {selector:'#formVerify .btn-primary',form:'#formVerify',fn:'verifyAccount',label:'Doğrulama'}
 ];
 function notify(message,type){
  try{if(typeof window.showNotification==='function')window.showNotification(message,type||'error');else console.error('[AETHRION Auth]',message)}catch(e){console.error(message)}
 }
 function ensureOverlay(){
  if(overlay&&overlay.isConnected)return overlay;
  overlay=document.getElementById('aeAuthProgressOverlay');
  if(!overlay){
   overlay=document.createElement('div');overlay.id='aeAuthProgressOverlay';overlay.className='ae-auth-progress';overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
   overlay.innerHTML='<div class="ae-auth-progress-card"><div class="ae-auth-progress-brand"><span class="ae-auth-progress-mark" aria-hidden="true"></span><span class="ae-auth-progress-word">AETHRION</span></div><div class="ae-auth-progress-track"><span class="ae-auth-progress-track-fill"></span></div><h2 class="ae-auth-progress-title">Güvenli oturum başlatılıyor</h2><p class="ae-auth-progress-status">Kimlik bilgileriniz doğrulanıyor…</p><span class="ae-auth-progress-foot">GÜVENLİ KİMLİK DOĞRULAMA</span></div>';
   document.body.appendChild(overlay);
  }
  statusNode=overlay.querySelector('.ae-auth-progress-status');fillNode=overlay.querySelector('.ae-auth-progress-track-fill');
  return overlay;
 }
 function showProgress(message){
  var el=ensureOverlay();el.classList.remove('is-success','is-error');el.classList.add('is-visible');
  if(statusNode)statusNode.textContent=message||'Kimlik bilgileriniz doğrulanıyor…';
  if(fillNode){fillNode.style.transition='none';fillNode.style.width='8%';void fillNode.offsetWidth;fillNode.style.transition='width 850ms cubic-bezier(.2,.75,.2,1)';fillNode.style.width='68%'}
  document.body.classList.add('ae-auth-progress-open');
 }
 function setProgress(message,percent,success){
  if(statusNode)statusNode.textContent=message;
  if(fillNode)fillNode.style.width=percent+'%';
  if(overlay)overlay.classList.toggle('is-success',!!success);
 }
 function hideProgress(){
  if(timer){clearTimeout(timer);timer=null}
  if(overlay)overlay.classList.remove('is-visible','is-success','is-error');
  if(document.body)document.body.classList.remove('ae-auth-progress-open');
 }
 function sessionExists(){
  try{if(window.Parse&&Parse.User&&typeof Parse.User.current==='function'&&Parse.User.current())return true}catch(e){}
  try{if(window.currentUser)return true}catch(e){}
  return false;
 }
 function handlerFor(action){
  var fn=window[action.fn];
  if(typeof fn!=='function')return null;
  if(fn.__aeAuthDispatch)return fn.__aeAuthDispatch;
  return fn;
 }
 function restoreButton(button,oldText){
  if(!button)return;
  button.disabled=false;button.removeAttribute('aria-busy');button.classList.remove('ae-auth-busy');
  if(oldText)button.textContent=oldText;
 }
 async function dispatch(action,button,event){
  if(event){event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation()}
  if(active[action.fn])return;
  var fn=handlerFor(action);
  if(!fn){notify(action.label+' işlemi başlatılamadı: gerekli işlev yüklenmemiş. Lütfen sayfayı yenileyin.','error');return}
  active[action.fn]=true;
  var oldText=button?button.textContent:'';
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.classList.add('ae-auth-busy');button.textContent=action.fn==='handleLogin'?'Giriş yapılıyor…':action.fn==='handleRegister'?'Hesap oluşturuluyor…':'Doğrulanıyor…'}
  var isLogin=action.fn==='handleLogin';
  if(isLogin)showProgress('Kimlik bilgileriniz doğrulanıyor…');
  var completed=false, errorSeen=null;
  var startAt=Date.now();
  try{
   /* Important: the original event is passed through. Some legacy handlers require it. */
   var result=fn.call(button||window,event);
   result=await Promise.resolve(result);
   if(isLogin && result===false){
    hideProgress();
    return;
   }
   if(isLogin){
    while(Date.now()-startAt<14000){
     if(sessionExists()){completed=true;break}
     await new Promise(function(resolve){setTimeout(resolve,250)})
    }
    if(completed){
     setProgress('Hesabınız açılıyor…',100,true);
     await new Promise(function(resolve){setTimeout(resolve,900)});
     /* The app dashboard is initialized on page load; reload only after a real session exists. */
     hideProgress();
     if(window.location.hash!=='#dashboardArea')window.location.hash='dashboardArea';
     return;
    }
    hideProgress();
    var authDetail = String(window.__aethrionLastAuthError || '').trim();
    notify(authDetail ? 'Giriş tamamlanamadı: ' + authDetail : 'Giriş tamamlanamadı. E-posta/şifrenizi kontrol edin; sorun sürerse sunucu yanıtını ve Back4App kimlik doğrulama ayarlarını incelemek gerekir.','error');
   }
  }catch(error){
   errorSeen=error;
   console.error('[AETHRION] '+action.label+' işlemi başarısız:',error);
   if(isLogin)hideProgress();
   notify(action.label+' işlemi tamamlanamadı: '+((error&&error.message)||'Beklenmeyen bir hata oluştu.'),'error');
  }finally{
   active[action.fn]=false;restoreButton(button,oldText);
  }
 }
 function findAction(target){
  if(!target||!target.closest)return null;
  for(var i=0;i<actions.length;i++){var button=target.closest(actions[i].selector);if(button)return{action:actions[i],button:button}}
  return null;
 }
 document.addEventListener('click',function(event){
  var found=findAction(event.target);if(!found)return;
  dispatch(found.action,found.button,event);
 },true);
 document.addEventListener('submit',function(event){
  var form=event.target;if(!form||!form.matches)return;
  for(var i=0;i<actions.length;i++)if(form.matches(actions[i].form)){
   dispatch(actions[i],form.querySelector('.btn-primary'),event);return;
  }
 },true);
})();

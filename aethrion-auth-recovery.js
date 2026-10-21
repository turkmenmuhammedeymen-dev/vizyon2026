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

(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='/aethrion-workspace-v6.css?v=20261022-workspace7';document.head.appendChild(l);var s=document.createElement('script');s.src='/aethrion-workspace-v6.js?v=20261022-workspace7';s.async=true;document.body.appendChild(s)})();


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

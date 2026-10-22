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


/* AETHRION Auth Flow v7 — explicit validation, visible progress, robust assistant panel. */
(function(){
 'use strict';
 var active=Object.create(null),overlay=null,statusNode=null,fillNode=null;
 var actions=[
  {selector:'#formLogin .btn-primary',form:'#formLogin',fn:'handleLogin',label:'Giriş'},
  {selector:'#formRegister .btn-primary',form:'#formRegister',fn:'handleRegister',label:'Kayıt'},
  {selector:'#formVerify .btn-primary',form:'#formVerify',fn:'verifyAccount',label:'Doğrulama'}
 ];
 function notify(message,type){
  try{if(typeof window.showNotification==='function')window.showNotification(message,type||'error');else console.error('[AETHRION Auth]',message)}
  catch(e){console.error('[AETHRION Auth]',message)}
 }
 function ensureOverlay(){
  if(overlay&&overlay.isConnected)return overlay;
  overlay=document.getElementById('aeAuthProgressOverlay');
  if(!overlay){
   overlay=document.createElement('div');overlay.id='aeAuthProgressOverlay';overlay.className='ae-auth-progress';
   overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
   overlay.innerHTML='<div class="ae-auth-progress-card"><div class="ae-auth-progress-brand"><span class="ae-auth-progress-mark" aria-hidden="true"></span><span class="ae-auth-progress-word">AETHRION</span></div><div class="ae-auth-progress-track"><span class="ae-auth-progress-track-fill"></span></div><h2 class="ae-auth-progress-title">Güvenli işlem başlatılıyor</h2><p class="ae-auth-progress-status">Bilgileriniz kontrol ediliyor…</p><span class="ae-auth-progress-foot">GÜVENLİ KİMLİK DOĞRULAMA</span></div>';
   document.body.appendChild(overlay);
  }
  statusNode=overlay.querySelector('.ae-auth-progress-status');fillNode=overlay.querySelector('.ae-auth-progress-track-fill');
  return overlay;
 }
 function showProgress(message){
  var el=ensureOverlay();el.classList.remove('is-success','is-error');el.classList.add('is-visible');
  var title=el.querySelector('.ae-auth-progress-title');
  if(title)title.textContent=message&&/hesap|kayıt/i.test(message)?'Hesabınız güvenle oluşturuluyor':'Güvenli oturum başlatılıyor';
  if(statusNode)statusNode.textContent=message||'Bilgileriniz kontrol ediliyor…';
  if(fillNode){fillNode.style.transition='none';fillNode.style.width='8%';void fillNode.offsetWidth;fillNode.style.transition='width 850ms cubic-bezier(.2,.75,.2,1)';fillNode.style.width='62%'}
  document.body.classList.add('ae-auth-progress-open');
 }
 function setProgress(message,percent,success){
  if(statusNode)statusNode.textContent=message;
  if(fillNode)fillNode.style.width=percent+'%';
  if(overlay)overlay.classList.toggle('is-success',!!success);
 }
 function hideProgress(){
  if(overlay)overlay.classList.remove('is-visible','is-success','is-error');
  if(document.body)document.body.classList.remove('ae-auth-progress-open');
 }
 function showInline(form,message,type){
  if(!form)return;
  var box=form.querySelector('.ae-auth-inline-status');
  if(!box){box=document.createElement('div');box.className='ae-auth-inline-status';box.setAttribute('role','alert');box.setAttribute('aria-live','polite');form.insertBefore(box,form.firstChild)}
  box.textContent=message;box.dataset.type=type||'error';box.style.display='block';
 }
 function clearInline(form){
  if(!form)return;var box=form.querySelector('.ae-auth-inline-status');if(box){box.textContent='';box.style.display='none'}
  form.querySelectorAll('.ae-field-invalid').forEach(function(el){el.classList.remove('ae-field-invalid')});
 }
 function invalid(form,element,message){
  showInline(form,message,'error');
  if(element){element.classList.add('ae-field-invalid');try{element.scrollIntoView({behavior:'smooth',block:'center'});element.focus({preventScroll:true})}catch(e){}}
  return false;
 }
 function validate(action){
  var form=document.querySelector(action.form);
  if(!form)return true;
  clearInline(form);
  if(action.fn==='handleRegister'){
   var name=form.querySelector('#rName'),email=form.querySelector('#rEmail'),username=form.querySelector('#rUsername'),p1=form.querySelector('#rPass'),p2=form.querySelector('#rPass2');
   var terms=form.querySelector('#registerTermsCheck'),privacy=form.querySelector('#registerPrivacyCheck');
   if(!name||!name.value.trim())return invalid(form,name,'Ad soyad alanını doldurun.');
   if(!email||!email.value.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))return invalid(form,email,'Geçerli bir e-posta adresi girin.');
   if(!username||!username.value.trim())return invalid(form,username,'Bir kullanıcı adı belirleyin.');
   if(!p1||p1.value.length<8)return invalid(form,p1,'Şifre en az 8 karakter olmalı.');
   if(!p2||p2.value!==p1.value)return invalid(form,p2,'Şifreler birbiriyle eşleşmiyor.');
   if(!terms||!terms.checked)return invalid(form,terms,'Kayıt için Kullanıcı Sözleşmesi onayını işaretleyin.');
   if(!privacy||!privacy.checked)return invalid(form,privacy,'Kayıt için Gizlilik Politikası onayını işaretleyin.');
  }else if(action.fn==='handleLogin'){
   var le=form.querySelector('#lEmail'),lp=form.querySelector('#lPass'),lt=form.querySelector('#loginTermsCheck'),lv=form.querySelector('#loginPrivacyCheck');
   if(!le||!le.value.trim())return invalid(form,le,'E-posta adresinizi girin.');
   if(!lp||!lp.value)return invalid(form,lp,'Şifrenizi girin.');
   if(!lt||!lt.checked)return invalid(form,lt,'Giriş için Kullanıcı Sözleşmesi onayını işaretleyin.');
   if(!lv||!lv.checked)return invalid(form,lv,'Giriş için Gizlilik Politikası onayını işaretleyin.');
  }else if(action.fn==='verifyAccount'){
   var ve=form.querySelector('#verifyEmail'),vc=form.querySelector('#verifyCode');
   if(!ve||!ve.value.trim())return invalid(form,ve,'Doğrulama için e-posta adresinizi girin.');
   if(!vc||!vc.value.trim())return invalid(form,vc,'E-postanıza gelen doğrulama kodunu girin.');
  }
  return true;
 }
 function sessionExists(){
  try{if(window.Parse&&Parse.User&&typeof Parse.User.current==='function'&&Parse.User.current())return true}catch(e){}
  try{if(window.currentUser)return true}catch(e){}
  return false;
 }
 function restoreButton(button,oldText,oldDisabled){
  if(!button)return;button.disabled=!!oldDisabled;button.removeAttribute('aria-busy');button.classList.remove('ae-auth-busy');
  if(oldText)button.textContent=oldText;
 }
 function handlerFor(action){var fn=window[action.fn];return typeof fn==='function'?fn:null}
 async function dispatch(action,button,event){
  if(event){event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation()}
  if(active[action.fn])return;
  if(!validate(action))return;
  var form=document.querySelector(action.form);clearInline(form);
  var fn=handlerFor(action);
  if(!fn){notify(action.label+' işlemi başlatılamadı: gerekli işlev yüklenmemiş. Sayfayı yenileyip tekrar deneyin.','error');showInline(form,'İşlem başlatılamadı. Gerekli bileşen yüklenmemiş; sayfayı yenileyin.','error');return}
  active[action.fn]=true;
  var oldText=button?button.textContent:'',oldDisabled=button?button.disabled:false;
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.classList.add('ae-auth-busy');button.textContent=action.fn==='handleLogin'?'Giriş yapılıyor…':action.fn==='handleRegister'?'Hesap oluşturuluyor…':'Doğrulanıyor…'}
  var needsProgress=action.fn==='handleLogin'||action.fn==='handleRegister';
  if(needsProgress)showProgress(action.fn==='handleRegister'?'Hesap oluşturuluyor, lütfen bekleyin…':'Kimlik bilgileriniz doğrulanıyor…');
  var startAt=Date.now();
  try{
   var result=fn.call(button||window,event);
   await Promise.resolve(result);
   if(action.fn==='handleRegister'){
    var verifyForm=document.getElementById('formVerify'),verifyEmail=document.getElementById('verifyEmail');
    var switched=verifyForm&&getComputedStyle(verifyForm).display!=='none'&&verifyEmail&&verifyEmail.value.trim()===(document.getElementById('rEmail')||{}).value?.trim();
    if(switched){setProgress('Hesabınız oluşturuldu. E-posta doğrulamasına geçiliyor…',100,true);await new Promise(function(resolve){setTimeout(resolve,650)})}
    hideProgress();
   }else if(action.fn==='handleLogin'){
    while(Date.now()-startAt<14000){
     if(sessionExists())break;
     await new Promise(function(resolve){setTimeout(resolve,250)});
    }
    if(sessionExists()){
     setProgress('Hesabınız açılıyor…',100,true);
     await new Promise(function(resolve){setTimeout(resolve,650)});
     hideProgress();
     if(typeof window.showDashboard==='function')await Promise.resolve(window.showDashboard());
     var dash=document.getElementById('dashboardArea');
     if(dash){dash.style.removeProperty('display');dash.style.visibility='visible'}
     document.body.classList.add('logged-in-user');
    }else{
     hideProgress();
     var verify=document.getElementById('formVerify'),verifyVisible=verify&&getComputedStyle(verify).display!=='none';
     if(!verifyVisible)notify('Giriş tamamlanamadı. E-posta/şifreyi kontrol edin. Devam ederse Back4App kimlik doğrulama yanıtı incelenmeli.','error');
    }
   }
  }catch(error){
   console.error('[AETHRION] '+action.label+' işlemi başarısız:',error);
   if(needsProgress)hideProgress();
   showInline(form,(error&&error.message)?'İşlem tamamlanamadı: '+error.message:'İşlem tamamlanamadı. Lütfen tekrar deneyin.','error');
   notify(action.label+' işlemi tamamlanamadı: '+((error&&error.message)||'Beklenmeyen bir hata oluştu.'),'error');
  }finally{
   active[action.fn]=false;restoreButton(button,oldText,oldDisabled);
  }
 }
 function findAction(target){
  if(!target||!target.closest)return null;
  for(var i=0;i<actions.length;i++){var button=target.closest(actions[i].selector);if(button)return{action:actions[i],button:button}}
  return null;
 }
 document.addEventListener('click',function(event){var found=findAction(event.target);if(found)dispatch(found.action,found.button,event)},true);
 document.addEventListener('submit',function(event){
  var form=event.target;if(!form||!form.matches)return;
  for(var i=0;i<actions.length;i++)if(form.matches(actions[i].form)){dispatch(actions[i],form.querySelector('.btn-primary'),event);return}
 },true);
 /* AETHRION Agents: keep the legacy panel visible when its open action succeeds. */
 function patchAgents(){
  var open=window.openAethrionAlPanel||window.openVizyonAlPanel;
  if(typeof open==='function'&&!open.__aeV7Wrapped){
   var wrapped=function(){
    var result=open.apply(this,arguments);
    window.setTimeout(function(){
     var panel=document.getElementById('vizyonAlPanel')||document.getElementById('aethrionAlPanel');
     if(panel&&panel.classList.contains('open')){
      panel.style.setProperty('display','flex','important');panel.style.setProperty('visibility','visible','important');
      panel.style.setProperty('opacity','1','important');panel.style.setProperty('pointer-events','auto','important');
      panel.style.setProperty('position','fixed','important');panel.style.setProperty('z-index','2147482000','important');
      panel.style.setProperty('inset','0','important');panel.style.setProperty('width','100vw','important');panel.style.setProperty('height','100dvh','important');
      panel.style.setProperty('max-width','none','important');panel.style.setProperty('max-height','none','important');
      var area=document.getElementById('vzResponsibilityArea');if(area&&getComputedStyle(area).display==='none'&&document.getElementById('vzMainArea'))document.getElementById('vzMainArea').style.setProperty('display','flex','important');
     }
    },60);
    return result;
   };
   wrapped.__aeV7Wrapped=true;wrapped.__aeV7Original=open;
   if(typeof window.openAethrionAlPanel==='function')window.openAethrionAlPanel=wrapped;
   if(typeof window.openVizyonAlPanel==='function')window.openVizyonAlPanel=wrapped;
  }
 }
 patchAgents();[250,800,1700,3200,5200].forEach(function(t){setTimeout(patchAgents,t)});
})();

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

(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='/aethrion-workspace-v2.css?v=20261022-v1';document.head.appendChild(l);var s=document.createElement('script');s.src='/aethrion-workspace-v2.js?v=20261022-v1';s.defer=true;document.body.appendChild(s)})();

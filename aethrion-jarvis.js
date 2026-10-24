(function(){
'use strict';
if(window.__aethrionJarvisMounted)return;window.__aethrionJarvisMounted=true;
var mode='normal',recognition=null,listening=false,busy=false,selectedFile=null;
function node(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function status(text,state){var s=document.getElementById('aeJvStatus');if(s){s.textContent=text;s.dataset.state=state||'idle';}}
function message(role,text){var list=document.getElementById('aeJvMessages');if(!list)return;var box=node('div','ae-jv-message ae-jv-'+role);box.appendChild(node('span','ae-jv-label',role==='user'?'SİZ':'AETHRION'));box.appendChild(node('p','ae-jv-body',text));list.appendChild(box);list.scrollTop=list.scrollHeight;}
function stopVoice(){if(recognition){try{recognition.stop();}catch(e){}}listening=false;var b=document.getElementById('aeJvMic');if(b){b.textContent='🎙️';b.classList.remove('is-listening');}}
function speak(text){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang=(navigator.language||'tr-TR').toLowerCase().indexOf('en')===0?'en-US':'tr-TR';window.speechSynthesis.speak(u);}
function init(){
if(!document.querySelector('#mainSite,#splashScreen,#dashboard,#mainDashboard')||document.getElementById('aeJvLauncher'))return;
var css=document.createElement('link');css.rel='stylesheet';css.href='/aethrion-jarvis.css?v=20261022-1';document.head.appendChild(css);
var launcher=node('button','ae-jv-launcher');launcher.type='button';launcher.setAttribute('aria-controls','aeJvPanel');launcher.setAttribute('aria-expanded','false');launcher.innerHTML='<span class="ae-jv-orb">A</span><span><b>AETHRION</b><small>AI · JARVIS</small></span>';
var panel=node('section','ae-jv-panel');panel.id='aeJvPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','aeJvTitle');
panel.innerHTML='<header class="ae-jv-head"><div><small>AETHRION INTELLIGENCE</small><h2 id="aeJvTitle">Sesli asistan</h2><p>Metin ve sesli sohbet</p></div><button id="aeJvClose" type="button" aria-label="Kapat">×</button></header><div class="ae-jv-modes"><button type="button" data-mode="normal" class="active" aria-pressed="true">AETHRION AI<small>Normal sohbet</small></button><button type="button" data-mode="agent" aria-pressed="false">AETHRION JARVIS<small>Görev asistanı</small></button></div><p id="aeJvNotice" class="ae-jv-notice">Mikrofon yalnızca ses düğmesine bastığında etkinleşir. Mesajın AI hizmetine gönderilebilir.</p><div id="aeJvStatus" class="ae-jv-status" role="status" aria-live="polite">Hazır. Mesajını yaz veya sesle konuş.</div><div id="aeJvMessages" class="ae-jv-messages"><div class="ae-jv-message ae-jv-assistant"><span class="ae-jv-label">AETHRION</span><p class="ae-jv-body">Merhaba! AETHRION AI ile sohbet edebilir veya JARVIS görev modunu seçebilirsin.</p></div></div><form id="aeJvForm" class="ae-jv-form"><textarea id="aeJvInput" maxlength="4000" rows="2" placeholder="Mesajını yaz…" aria-label="Mesajın"></textarea><div class="ae-jv-actions"><input id="aeJvFileInput" type="file" accept="image/*,application/pdf,audio/*,video/*,.docx,.xlsx,.xls,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.xml,.yaml,.yml,.log" hidden><button id="aeJvAttach" type="button" aria-label="Dosya ekle" title="Dosya ekle">📎 Dosya</button><button id="aeJvMic" type="button" aria-label="Sesle konuş">🎙️</button><span id="aeJvFileLabel">Yanıtları önemli konularda doğrula.</span><button id="aeJvSend" type="submit">Gönder ↗</button></div></form><footer>AETHRION · Intelligence Without Limits</footer>';
document.body.appendChild(launcher);document.body.appendChild(panel);
launcher.addEventListener('click',function(){panel.hidden=!panel.hidden;launcher.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)document.getElementById('aeJvInput').focus();});
document.getElementById('aeJvClose').addEventListener('click',function(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');stopVoice();if(window.speechSynthesis)window.speechSynthesis.cancel();});
panel.querySelectorAll('[data-mode]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.mode==='agent'?'agent':'normal';panel.querySelectorAll('[data-mode]').forEach(function(x){x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});document.getElementById('aeJvNotice').textContent=mode==='agent'?'JARVIS görev modu: sohbet ve planlama kullanılabilir. Bilgisayar kontrolü, ekran akışı ve gerçek araç yürütme için ayrı backend entegrasyonu gerekir.':'Mikrofon yalnızca ses düğmesine bastığında etkinleşir. Mesajın AI hizmetine gönderilebilir.';});});
document.getElementById('aeJvMic').addEventListener('click',function(){
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){status('Bu tarayıcı ses tanımayı desteklemiyor; mesajını yazabilirsin.','error');return;}if(listening){stopVoice();return;}
recognition=new SR();recognition.lang=(navigator.language||'tr-TR').toLowerCase().indexOf('en')===0?'en-US':'tr-TR';recognition.interimResults=false;recognition.continuous=false;
recognition.onstart=function(){listening=true;var b=document.getElementById('aeJvMic');b.textContent='⏹';b.classList.add('is-listening');status('Dinliyorum…','listening');};
recognition.onresult=function(e){var t=e.results&&e.results[0]&&e.results[0][0]?e.results[0][0].transcript:'';var input=document.getElementById('aeJvInput');if(input&&t){input.value=t;send();}};
recognition.onerror=function(e){status(e.error==='not-allowed'?'Mikrofon izni verilmedi. Mesajını yazabilirsin.':'Ses tanınamadı; tekrar dene veya yaz.','error');};recognition.onend=stopVoice;try{recognition.start();}catch(e){status('Mikrofon başlatılamadı.','error');}
});

document.getElementById('aeJvAttach').addEventListener('click',function(){document.getElementById('aeJvFileInput').click();});
document.getElementById('aeJvFileInput').addEventListener('change',function(){
 var f=this.files&&this.files[0];if(!f){selectedFile=null;return;}
 if(f.size>8*1024*1024){status('Dosya en fazla 8 MB olabilir.','error');this.value='';selectedFile=null;return;}
 var allowed=/^(image\/|application\/pdf|audio\/|video\/|text\/|application\/json)/i.test(f.type)||/\.(docx|xlsx|xls|txt|md|csv|json|js|ts|py|html|css|xml|ya?ml|log)$/i.test(f.name);
 if(!allowed){status('Bu dosya türü desteklenmiyor. Görsel, PDF, ses/video, DOCX, XLSX, metin veya kod dosyası seç.','error');this.value='';selectedFile=null;return;}
 selectedFile=f;var label=document.getElementById('aeJvFileLabel');if(label)label.textContent='📎 '+f.name;
 status('Dosya eklendi. Gönder’e basınca AETHRION AI dosyayı analiz edecek.','success');
});

document.getElementById('aeJvForm').addEventListener('submit',function(e){e.preventDefault();send();});
}

/* Browser-safe local tools: timers, reminders, date/time. OS-level actions require a trusted desktop companion. */
var reminderStorageKey='aethrion_jarvis_reminders';
function readReminders(){try{var v=JSON.parse(localStorage.getItem(reminderStorageKey)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
function writeReminders(items){try{localStorage.setItem(reminderStorageKey,JSON.stringify(items.slice(-100)))}catch(e){status('Hatırlatıcılar bu tarayıcıda kaydedilemedi.','error')}}
function notifyLocal(title,body){
  if('Notification' in window&&Notification.permission==='granted'){try{new Notification(title,{body:body,tag:'aethrion-jarvis-'+Date.now()})}catch(e){}}
  message('assistant',body);status(body,'success');speak(body);
}
function requestReminderPermission(){
  if(!('Notification' in window)||Notification.permission!=='default')return;
  try{Notification.requestPermission()}catch(e){}
}
function checkDueReminders(){
  var now=Date.now(),items=readReminders(),remaining=[],changed=false;
  items.forEach(function(item){if(item&&Number(item.dueAt)<=now){notifyLocal('AETHRION JARVIS',item.text||'Hatırlatıcın var.');changed=true}else if(item&&Number(item.dueAt)>now)remaining.push(item)});
  if(changed)writeReminders(remaining);
}
function durationFrom(text){
  var m=String(text).match(/(\d{1,6})\s*(saniye|saniyelik|sn|dakika|dk|saat|sa|hour|hours|minute|minutes|second|seconds)/i);
  if(!m)return null;var n=Number(m[1]),unit=m[2].toLowerCase();if(!Number.isFinite(n)||n<1)return null;
  var multiplier=/^(saniye|saniyelik|sn|second|seconds)$/.test(unit)?1000:/^(dakika|dk|minute|minutes)$/.test(unit)?60000:3600000;
  var ms=n*multiplier;return ms>0&&ms<=86400000?{ms:ms,label:m[0]}:null;
}
function handleLocalCommand(raw){
  var text=String(raw||'').trim(),low=text.toLocaleLowerCase('tr-TR');
  if(/^(saat kaç|saat kac|şu an saat kaç|su an saat kac|what time is it)\??$/.test(low)){
    notifyLocal('AETHRION JARVIS','Şu an saat '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})+'.');return true;
  }
  if(/^(bugün tarih ne|bugun tarih ne|bugünün tarihi ne|bugunun tarihi ne|tarih kaç|tarih kac|what is today's date)\??$/.test(low)){
    notifyLocal('AETHRION JARVIS','Bugünün tarihi '+new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'.');return true;
  }
  if(/(zamanlayıcı|zamanlayici|timer|geri sayım|geri sayim)/i.test(text)){
    var d=durationFrom(text);if(!d){message('assistant','Zamanlayıcı için süre belirt. Örnek: “5 dakika zamanlayıcı başlat”.');status('Süre bekleniyor.','idle');return true;}
    var label='Zamanlayıcı tamamlandı ('+d.label+').';status(d.label+' için zamanlayıcı başladı.','success');message('assistant',d.label+' için zamanlayıcı başlatıldı.');
    window.setTimeout(function(){notifyLocal('AETHRION JARVIS',label)},Math.min(d.ms,2147483647));return true;
  }
  if(/hatırlat|hatirlat|hatırlatıcı|hatirlatici|remind me/i.test(text)){
    var d2=durationFrom(text),items=readReminders();
    if(!d2){message('assistant','Hatırlatıcı için süre belirt. Örnek: “10 dakika sonra su içmeyi hatırlat”.');status('Hatırlatıcı için süre bekleniyor.','idle');return true;}
    var reminderText=text
      .replace(/hatırlatıcı|hatirlatici|hatırlat|hatirlat|remind me/ig,'')
      .replace(/\d{1,6}\s*(saniye|saniyelik|sn|dakika|dk|saat|sa|hour|hours|minute|minutes|second|seconds)/ig,'')
      .replace(/sonra|in/ig,'').replace(/^[\s:,-]+|[\s:,-]+$/g,'').trim();
    if(!reminderText)reminderText='Planladığın işi yap';
    items.push({id:String(Date.now()),text:reminderText,dueAt:Date.now()+d2.ms});writeReminders(items);requestReminderPermission();
    var due=new Date(Date.now()+d2.ms).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    message('assistant','Hatırlatıcı kuruldu: “'+reminderText+'” — yaklaşık '+due+'. Sayfa açıkken kontrol edilir.');status('Hatırlatıcı kaydedildi.','success');return true;
  }
  return false;
}

async function send(){
if(busy)return;var input=document.getElementById('aeJvInput'),button=document.getElementById('aeJvSend'),text=input?input.value.trim():'';if(!text&&!selectedFile)return;
if(!selectedFile&&handleLocalCommand(text)){input.value='';return;}
var P=window.Parse;if(!P||!P.Cloud||typeof P.Cloud.run!=='function'){status('AI bağlantısı hazır değil; bu modül ana uygulamadaki Parse bağlantısını gerektirir.','error');return;}
if(!P.User||!P.User.current||!P.User.current()){status('Önce AETHRION hesabına giriş yap.','error');return;}
busy=true;input.value='';button.disabled=true;message('user',text);status(mode==='agent'?'JARVIS görevi değerlendiriyor…':'AETHRION AI yanıt hazırlıyor…','busy');
try{
var answer='';
if(selectedFile){
 var file=selectedFile;
 if(!text)text='Bu dosyayı oku, özetle ve önemli noktalarını açıkla.';
 message('user','📎 '+file.name+(text?' — '+text:''));
 var prepared=typeof window.aethrionPrepareFileForAI==='function'?await window.aethrionPrepareFileForAI(file):null;
 if(!prepared){var dataUrl=await new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(String(reader.result||''))};reader.onerror=function(){reject(new Error('Dosya okunamadı.'))};reader.readAsDataURL(file)});var base64=dataUrl.split(',')[1];if(!base64)throw new Error('Dosya içeriği okunamadı.');prepared={fileBase64:base64,fileName:file.name,fileType:file.type||'application/octet-stream'};}
 status('Dosya AI tarafından analiz ediliyor…','busy');
 var fr=await P.Cloud.run('vizyonAlFileAnalyze',{fileBase64:prepared.fileBase64,fileName:prepared.fileName||file.name,fileType:prepared.fileType||file.type||'application/octet-stream',question:text});
 if(!fr||fr.success!==true)throw new Error(fr&&fr.error||'Dosya analizi tamamlanamadı.');
 answer=fr.reply||'Dosya analiz edildi ancak metin yanıtı dönmedi.';
 selectedFile=null;var fi=document.getElementById('aeJvFileInput');if(fi)fi.value='';var fl=document.getElementById('aeJvFileLabel');if(fl)fl.textContent='Yanıtları önemli konularda doğrula.';
}else{
 message('user',text);
 var r=await P.Cloud.run('vizyonAlChat',{message:text,mode:mode});answer=typeof r==='string'?r:r&&(r.reply||r.response||r.text||r.message);if(!answer&&r&&r.success===false)throw new Error(r.error||'AI isteği başarısız oldu.');answer=answer||'AI yanıt döndürmedi. Daha sonra tekrar dene.';
}
message('assistant',String(answer));status('Yanıt hazır.','success');speak(String(answer));
}
catch(e){message('assistant','İstek tamamlanamadı. Bağlantıyı veya AI hizmetini kontrol edip tekrar dene.');status(String(e&&e.message||e||'Bilinmeyen hata').slice(0,180),'error');}
finally{busy=false;button.disabled=false;input.focus();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
checkDueReminders();window.setInterval(checkDueReminders,15000);window.addEventListener('focus',checkDueReminders);
})();
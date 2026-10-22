(function(){
'use strict';
if(window.__aethrionJarvisMounted)return;window.__aethrionJarvisMounted=true;
var mode='normal',recognition=null,listening=false,busy=false;
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
panel.innerHTML='<header class="ae-jv-head"><div><small>AETHRION INTELLIGENCE</small><h2 id="aeJvTitle">Sesli asistan</h2><p>Metin ve sesli sohbet</p></div><button id="aeJvClose" type="button" aria-label="Kapat">×</button></header><div class="ae-jv-modes"><button type="button" data-mode="normal" class="active" aria-pressed="true">AETHRION AI<small>Normal sohbet</small></button><button type="button" data-mode="agent" aria-pressed="false">AETHRION JARVIS<small>Görev asistanı</small></button></div><p id="aeJvNotice" class="ae-jv-notice">Mikrofon yalnızca ses düğmesine bastığında etkinleşir. Mesajın AI hizmetine gönderilebilir.</p><div id="aeJvStatus" class="ae-jv-status" role="status" aria-live="polite">Hazır. Mesajını yaz veya sesle konuş.</div><div id="aeJvMessages" class="ae-jv-messages"><div class="ae-jv-message ae-jv-assistant"><span class="ae-jv-label">AETHRION</span><p class="ae-jv-body">Merhaba! AETHRION AI ile sohbet edebilir veya JARVIS görev modunu seçebilirsin.</p></div></div><form id="aeJvForm" class="ae-jv-form"><textarea id="aeJvInput" maxlength="4000" rows="2" placeholder="Mesajını yaz…" aria-label="Mesajın"></textarea><div class="ae-jv-actions"><button id="aeJvMic" type="button" aria-label="Sesle konuş">🎙️</button><span>Yanıtları önemli konularda doğrula.</span><button id="aeJvSend" type="submit">Gönder ↗</button></div></form><footer>AETHRION · Intelligence Without Limits</footer>';
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
document.getElementById('aeJvForm').addEventListener('submit',function(e){e.preventDefault();send();});
}
async function send(){
if(busy)return;var input=document.getElementById('aeJvInput'),button=document.getElementById('aeJvSend'),text=input?input.value.trim():'';if(!text)return;
var P=window.Parse;if(!P||!P.Cloud||typeof P.Cloud.run!=='function'){status('AI bağlantısı hazır değil; bu modül ana uygulamadaki Parse bağlantısını gerektirir.','error');return;}
if(!P.User||!P.User.current||!P.User.current()){status('Önce AETHRION hesabına giriş yap.','error');return;}
busy=true;input.value='';button.disabled=true;message('user',text);status(mode==='agent'?'JARVIS görevi değerlendiriyor…':'AETHRION AI yanıt hazırlıyor…','busy');
try{var r=await P.Cloud.run('vizyonAlChat',{message:text,mode:mode});var answer=typeof r==='string'?r:r&&(r.reply||r.response||r.text||r.message);if(!answer&&r&&r.success===false)throw new Error(r.error||'AI isteği başarısız oldu.');answer=answer||'AI yanıt döndürmedi. Daha sonra tekrar dene.';message('assistant',String(answer));status('Yanıt hazır.','success');speak(String(answer));}
catch(e){message('assistant','İstek tamamlanamadı. Bağlantıyı veya AI hizmetini kontrol edip tekrar dene.');status(String(e&&e.message||e||'Bilinmeyen hata').slice(0,180),'error');}
finally{busy=false;button.disabled=false;input.focus();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
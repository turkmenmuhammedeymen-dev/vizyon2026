/* AETHRION AI: standalone full-screen workspace, separate from Agents and Coach. */
(function(w,d){
'use strict';
if(w.__aethrionFullAIInstalled)return;
w.__aethrionFullAIInstalled=true;
var state={conversationId:null,requestId:0,busy:false,mode:'normal',oldOverflow:'',historyLoaded:false};
function el(id){return d.getElementById(id);}
function user(){try{return w.Parse&&w.Parse.User&&w.Parse.User.current?w.Parse.User.current():null;}catch(e){return null;}}
function cloud(name,params){if(!w.Parse||!w.Parse.Cloud||!w.Parse.Cloud.run)return Promise.reject(new Error('Parse/Back4App bağlantısı bulunamadı.'));return w.Parse.Cloud.run(name,params||{});}
function notify(msg,type){try{if(w.showNotification)w.showNotification(msg,type||'info');else console.warn('[AETHRION AI]',msg);}catch(e){}}
function styles(){
 if(el('aeFullAIStyles'))return;
 var s=d.createElement('style');s.id='aeFullAIStyles';
 s.textContent=
 '#fullAIPanel.ae-full-ai{position:fixed!important;inset:0!important;z-index:2147483001!important;display:none;flex-direction:column!important;overflow:hidden!important;background:#080d17!important;color:#f4f7fc!important;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif!important;box-sizing:border-box!important}'+
 '#fullAIPanel.ae-full-ai *{box-sizing:border-box}#fullAIPanel.open{display:flex!important}'+
 '#fullAIPanel .ae-ai-header{min-height:70px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 18px;background:linear-gradient(110deg,#111a2b,#101827 60%,#17152b);border-bottom:1px solid rgba(185,199,222,.17);flex-shrink:0}'+
 '#fullAIPanel .ae-ai-brand{display:flex;align-items:center;gap:11px;min-width:0}#fullAIPanel .ae-ai-mark{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(135deg,#e9c76b,#9db2d1 55%,#8d79e9);color:#0a1020;font-size:22px;font-weight:900}'+
 '#fullAIPanel .ae-ai-brand strong{display:block;font-size:16px;letter-spacing:.12em;color:#f8fafc}#fullAIPanel .ae-ai-brand small{display:block;margin-top:3px;color:#aebbd0;font-size:10px}'+
 '#fullAIPanel .ae-ai-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap}#fullAIPanel button{font:inherit;cursor:pointer}'+
 '#fullAIPanel .ae-ai-btn{border:1px solid rgba(190,205,228,.24);border-radius:10px;padding:8px 11px;background:#182337;color:#eaf0fa;font-size:12px;font-weight:650}#fullAIPanel .ae-ai-btn:hover{background:#22324b;border-color:#d8bd75}'+
 '#fullAIPanel .ae-ai-btn.primary{border-color:#e3c36f;background:linear-gradient(135deg,#e7c66f,#b7c3d8);color:#101725}#fullAIPanel .ae-ai-btn.close{width:38px;height:38px;padding:0;font-size:18px}'+
 '#fullAIPanel .ae-ai-quota{color:#cbd5e1;font-size:10px;white-space:nowrap;padding:7px 9px;border-radius:9px;background:rgba(255,255,255,.055);border:1px solid rgba(190,205,228,.13)}'+
 '#fullAIPanel .ae-ai-body{display:flex;min-height:0;flex:1}#fullAIPanel .ae-ai-history{width:260px;flex:0 0 260px;overflow:auto;padding:15px 12px;background:#0c1422;border-right:1px solid rgba(185,199,222,.13)}'+
 '#fullAIPanel .ae-ai-history-title{margin:0 4px 12px;color:#dce5f3;font-size:11px;font-weight:800;letter-spacing:.08em}#fullAIPanel .ae-ai-history-list{display:flex;flex-direction:column;gap:7px}'+
 '#fullAIPanel .ae-ai-history-item{width:100%;text-align:left;border:1px solid rgba(190,205,228,.12);border-radius:10px;padding:10px;background:#111d30;color:#e6edf8}#fullAIPanel .ae-ai-history-item:hover{border-color:#d8bd75;background:#17263b}'+
 '#fullAIPanel .ae-ai-history-item strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}#fullAIPanel .ae-ai-history-item small{display:block;margin-top:5px;color:#aebbd0;font-size:10px}#fullAIPanel .ae-ai-empty{padding:12px;color:#aebbd0;font-size:12px;line-height:1.6}'+
 '#fullAIPanel .ae-ai-main{display:flex;flex:1;min-width:0;min-height:0;flex-direction:column;background:radial-gradient(ellipse at 75% 0%,rgba(94,83,157,.12),transparent 38%),#080d17}'+
 '#fullAIPanel .ae-ai-modes{display:flex;gap:8px;flex-wrap:wrap;padding:12px 18px;border-bottom:1px solid rgba(185,199,222,.12);background:#0e1624}#fullAIPanel .ae-ai-mode{border:1px solid rgba(190,205,228,.19);border-radius:999px;padding:8px 12px;background:#111d2e;color:#c8d4e5;font-size:12px;font-weight:650}#fullAIPanel .ae-ai-mode[aria-pressed=true]{border-color:#e0c16e;background:rgba(224,193,110,.14);color:#f4d98f}'+
 '#fullAIPanel .ae-ai-chat{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:13px;padding:22px clamp(14px,4vw,52px)}#fullAIPanel .ae-ai-message{width:fit-content;max-width:min(900px,92%);padding:13px 15px;border-radius:15px;line-height:1.65;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}'+
 '#fullAIPanel .ae-ai-message.assistant{align-self:flex-start;background:#121e30;border:1px solid rgba(185,199,222,.16);border-left:3px solid #d6bd79;color:#f0f4fb}#fullAIPanel .ae-ai-message.user{align-self:flex-end;background:#1b2b42;border:1px solid rgba(140,170,208,.28);color:#f5f8fd}'+
 '#fullAIPanel .ae-ai-role{display:block;margin-bottom:6px;color:#e7cc81;font-size:10px;font-weight:800;letter-spacing:.1em}#fullAIPanel .ae-ai-message.user .ae-ai-role{color:#b9cde9;text-align:right}'+
 '#fullAIPanel .ae-ai-composer-wrap{padding:11px clamp(10px,3vw,30px) 9px;border-top:1px solid rgba(185,199,222,.15);background:#0c1422;flex-shrink:0}#fullAIPanel .ae-ai-composer{display:flex;align-items:flex-end;gap:8px;max-width:1200px;margin:auto}'+
 '#fullAIPanel .ae-ai-composer textarea{flex:1;min-width:0;min-height:52px;max-height:180px;resize:vertical;padding:12px;border:1px solid rgba(190,205,228,.24);border-radius:12px;background:#080f1c;color:#f4f7fc;font:inherit;font-size:14px;line-height:1.5}#fullAIPanel textarea::placeholder{color:#95a4ba}'+
 '#fullAIPanel .ae-ai-status{max-width:1200px;margin:7px auto 0;color:#aebbd0;font-size:10px;min-height:15px}#fullAIPanel .ae-ai-status.error{color:#ffaaa8}#fullAIPanel .ae-ai-status.ok{color:#a8dfc2}#fullAIPanel .ae-ai-status.warn{color:#f0d58b}'+
 '#fullAIPanel .ae-ai-file{display:flex;align-items:center;gap:9px;margin:0 auto 9px;max-width:1200px;padding:8px 11px;border:1px solid rgba(190,205,228,.18);border-radius:9px;background:#121e30;color:#dce5f3;font-size:12px}#fullAIPanel .ae-ai-file[hidden]{display:none}#fullAIPanel .ae-ai-file button{margin-left:auto;border:0;background:transparent;color:#e7c978;font-size:18px}'+
 '#fullAIPanel .ae-ai-diagnostics{display:none;max-height:28vh;overflow:auto;margin:8px 18px;padding:11px;border:1px solid rgba(190,205,228,.18);border-radius:10px;background:#111d2e;color:#dce5f3;font:11px/1.6 ui-monospace,monospace;white-space:pre-wrap}#fullAIPanel .ae-ai-diagnostics.open{display:block}'+
 '@media(max-width:800px){#fullAIPanel .ae-ai-header{align-items:flex-start;padding:9px 10px;min-height:unset}#fullAIPanel .ae-ai-brand{gap:7px}#fullAIPanel .ae-ai-mark{width:34px;height:34px}#fullAIPanel .ae-ai-brand strong{font-size:12px}#fullAIPanel .ae-ai-brand small{font-size:8px}#fullAIPanel .ae-ai-actions{gap:4px}#fullAIPanel .ae-ai-actions .ae-ai-btn{padding:7px 8px;font-size:10px}#fullAIPanel .ae-ai-quota{font-size:9px;padding:5px}#fullAIPanel .ae-ai-history{display:none;position:absolute;z-index:3;left:0;top:55px;bottom:0;width:min(290px,85vw);box-shadow:18px 0 42px rgba(0,0,0,.4)}#fullAIPanel.history-open .ae-ai-history{display:block}#fullAIPanel .ae-ai-modes{padding:9px 10px;gap:5px}#fullAIPanel .ae-ai-mode{padding:7px 8px;font-size:10px}#fullAIPanel .ae-ai-chat{padding:14px 10px}#fullAIPanel .ae-ai-message{max-width:96%;font-size:13px;padding:11px}#fullAIPanel .ae-ai-composer-wrap{padding:8px 8px calc(8px + env(safe-area-inset-bottom))}#fullAIPanel .ae-ai-composer{gap:5px}#fullAIPanel .ae-ai-composer textarea{min-height:46px;padding:9px;font-size:13px}#fullAIPanel .ae-ai-composer .ae-ai-btn{min-height:40px;padding:7px 8px}}';
 d.head.appendChild(s);
}
function status(msg,kind){var n=el('fullAIStatus');if(n){n.textContent=msg||'';n.className='ae-ai-status'+(kind?' '+kind:'');}}
function append(role,text){
 var chat=el('fullAIChat');if(!chat)return;
 var row=d.createElement('article');row.className='ae-ai-message '+(role==='user'?'user':'assistant');
 var label=d.createElement('span');label.className='ae-ai-role';label.textContent=role==='user'?'SİZ':'AETHRION AI · 28 MODEL';
 var body=d.createElement('div');body.textContent=String(text==null?'':text);row.appendChild(label);row.appendChild(body);chat.appendChild(row);chat.scrollTop=chat.scrollHeight;
}
function welcome(){var chat=el('fullAIChat');if(chat){chat.textContent='';append('assistant','Merhaba! Ben AETHRION AI. Normal, Derin Düşünme, Ajan ve Yazılımcı modlarında yardımcı olabilirim. Mesajını yazabilir veya dosya ekleyebilirsin.');}}
function setMode(mode){
 var modes=['normal','deep','agent','developer'];state.mode=modes.indexOf(mode)>=0?mode:'normal';
 try{w.sessionStorage.setItem('aethrion_ai_mode',state.mode);}catch(e){}
 var buttons=d.querySelectorAll('#fullAIPanel [data-full-ai-mode]');
 for(var i=0;i<buttons.length;i++)buttons[i].setAttribute('aria-pressed',buttons[i].getAttribute('data-full-ai-mode')===state.mode?'true':'false');
}
function quota(result){var b=el('fullAIQueryBadge');if(b&&result&&result.remaining!==undefined)b.textContent=result.remaining==='Sınırsız'?'Sınırsız kullanım':'Kalan hak: '+result.remaining;}
function ensurePanel(){
 styles();var p=el('fullAIPanel');if(p)return p;
 p=d.createElement('section');p.id='fullAIPanel';p.className='ae-full-ai';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label','AETHRION AI sohbet');p.setAttribute('aria-hidden','true');
 p.innerHTML=
 "<header class='ae-ai-header'><div class='ae-ai-brand'><span class='ae-ai-mark'>✦</span><div><strong>AETHRION AI</strong><small>INTELLIGENCE WITHOUT LIMITS · 28 MODEL HAVUZU</small></div></div><div class='ae-ai-actions'><span class='ae-ai-quota' id='fullAIQueryBadge'>Kullanım hakkı yükleniyor…</span><button type='button' class='ae-ai-btn' id='fullAINewChatBtn'>＋ Yeni sohbet</button><button type='button' class='ae-ai-btn' id='fullAIHistoryToggle'>☷ Geçmiş</button><button type='button' class='ae-ai-btn' id='fullAIDiagnosticsBtn' hidden>Tanılama</button><button type='button' class='ae-ai-btn close' id='fullAICloseBtn' aria-label='Kapat'>×</button></div></header>"+
 "<div class='ae-ai-body'><aside class='ae-ai-history' id='fullAIHistory'><div class='ae-ai-history-title'>ÖNCEKİ SOHBETLER</div><div class='ae-ai-history-list' id='fullAIHistoryList'><div class='ae-ai-empty'>Sohbet geçmişi yükleniyor…</div></div></aside>"+
 "<main class='ae-ai-main'><nav class='ae-ai-modes' aria-label='AETHRION AI modları'><button type='button' class='ae-ai-mode' data-full-ai-mode='normal' aria-pressed='true'>🌐 Normal</button><button type='button' class='ae-ai-mode' data-full-ai-mode='deep' aria-pressed='false'>🧠 Derin Düşünme</button><button type='button' class='ae-ai-mode' data-full-ai-mode='agent' aria-pressed='false'>🕵️ Ajan</button><button type='button' class='ae-ai-mode' data-full-ai-mode='developer' aria-pressed='false'>💻 Yazılımcı</button></nav>"+
 "<div class='ae-ai-chat' id='fullAIChat' aria-live='polite'></div><div class='ae-ai-diagnostics' id='fullAIDiagnostics'></div><div class='ae-ai-composer-wrap'><div class='ae-ai-file' id='fullAIFilePreview' hidden><span>📎</span><span id='fullAIFileName'></span><button type='button' id='fullAIRemoveFileBtn' aria-label='Dosyayı kaldır'>×</button></div>"+
 "<form class='ae-ai-composer' id='fullAIComposer'><input type='file' id='fullAIFileInput' hidden accept='.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.yaml,.yml,.log,.sql,.sh,.c,.cpp,.h,.java,.php,.rb,.go,.rs,.ipynb,.pdf,.docx,.xlsx,.xls,image/*,audio/*,video/*'><button type='button' class='ae-ai-btn' id='fullAIAttachBtn' title='Dosya ekle'>📎</button><textarea id='fullAIInput' rows='2' maxlength='4000' placeholder=\"AETHRION AI'ya mesajını yaz… (Enter: gönder · Shift+Enter: yeni satır)\" aria-label='Mesajın'></textarea><button type='submit' class='ae-ai-btn primary' id='fullAISendBtn'>⚡ Gönder</button><button type='button' class='ae-ai-btn' id='fullAIStopBtn' hidden>■ Durdur</button></form><div class='ae-ai-status' id='fullAIStatus' role='status'>AETHRION AI hazır.</div></div></main></div>";
 d.body.appendChild(p);
 el('fullAICloseBtn').addEventListener('click',close);
 el('fullAINewChatBtn').addEventListener('click',newChat);
 el('fullAIHistoryToggle').addEventListener('click',function(){p.classList.toggle('history-open');loadHistory();});
 el('fullAIComposer').addEventListener('submit',function(e){e.preventDefault();send();});
 el('fullAIInput').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
 el('fullAIAttachBtn').addEventListener('click',function(){el('fullAIFileInput').click();});
 el('fullAIFileInput').addEventListener('change',function(){var f=this.files&&this.files[0];if(f)upload(f);this.value='';});
 el('fullAIRemoveFileBtn').addEventListener('click',function(){el('fullAIFilePreview').hidden=true;el('fullAIFileName').textContent='';});
 el('fullAIStopBtn').addEventListener('click',stop);
 el('fullAIDiagnosticsBtn').addEventListener('click',diagnostics);
 var modes=d.querySelectorAll('#fullAIPanel [data-full-ai-mode]');
 for(var i=0;i<modes.length;i++)modes[i].addEventListener('click',function(){setMode(this.getAttribute('data-full-ai-mode'));});
 try{var u=user(),r=u&&u.get?String(u.get('role')||'').toLowerCase():'';if(r==='founder'||r==='admin')el('fullAIDiagnosticsBtn').hidden=false;}catch(e){}
 welcome();try{setMode(w.sessionStorage.getItem('aethrion_ai_mode')||'normal');}catch(e){setMode('normal');}
 return p;
}
async function ensureConversation(){
 if(!user())return null;if(state.conversationId)return state.conversationId;
 var created=await cloud('startConversation',{});
 if(!created||!created.success||!created.conversationId)throw new Error(created&&created.error||'Sohbet kaydı oluşturulamadı.');
 state.conversationId=created.conversationId;
 try{await cloud('renameConversation',{conversationId:state.conversationId,name:'AETHRION AI | Yeni Sohbet'});}catch(e){}
 return state.conversationId;
}
async function saveConversation(question,answer){
 if(!user())return;var id=await ensureConversation();
 await cloud('sendMessage',{conversationId:id,text:question});
 await cloud('sendAIMessage',{conversationId:id,text:answer,fromName:'AETHRION AI · 28 MODEL'});
}
async function send(){
 if(state.busy)return false;var input=el('fullAIInput'),message=input?input.value.trim():'';
 if(!message){if(input)input.focus();return false;}if(message.length>4000){notify('Mesaj en fazla 4000 karakter olabilir.','warning');return false;}
 var rid=++state.requestId;state.busy=true;input.value='';input.disabled=true;el('fullAISendBtn').disabled=true;el('fullAIStopBtn').hidden=false;
 status('AETHRION AI yanıt hazırlıyor…','warn');append('user',message);
 try{
  var result=await cloud('aethrionChat',{message:message,mode:state.mode});
  if(rid!==state.requestId)return false;
  if(!result||result.success!==true)throw new Error(result&&result.error||'AI sağlayıcılarının hiçbiri yanıt veremedi.');
  var answer=String(result.reply||'').trim();if(!answer)throw new Error('AI boş yanıt döndürdü.');
  append('assistant',answer);quota(result);status('Yanıt hazır.','ok');
  try{await saveConversation(message,answer);loadHistory();}catch(saveErr){console.warn('[AETHRION AI] Geçmiş kaydedilemedi:',saveErr);status('Yanıt hazır · Sohbet geçmişi kaydedilemedi.','warn');}
 }catch(err){if(rid===state.requestId){append('assistant','Yanıt alınamadı: '+String(err&&err.message||err));status('AI bağlantısı veya sağlayıcı hatası.','error');notify(err&&err.message||'AETHRION AI yanıt veremiyor.','error');}}
 finally{if(rid===state.requestId){state.busy=false;input.disabled=false;el('fullAISendBtn').disabled=false;el('fullAIStopBtn').hidden=true;input.focus();}}
 return true;
}
function stop(){
 if(!state.busy)return false;state.requestId++;state.busy=false;
 if(el('fullAIInput'))el('fullAIInput').disabled=false;if(el('fullAISendBtn'))el('fullAISendBtn').disabled=false;if(el('fullAIStopBtn'))el('fullAIStopBtn').hidden=true;
 status('Yanıt görüntüleme durduruldu; sunucu isteği tamamlanmaya devam edebilir.','warn');return true;
}
async function upload(file){
 if(!file)return false;el('fullAIFileName').textContent=file.name+' · '+Math.max(1,Math.round(file.size/1024))+' KB';el('fullAIFilePreview').hidden=false;status('Dosya hazırlanıyor…','warn');
 try{
  if(!user())throw new Error('Dosya analizi için önce giriş yapın.');
  if(file.size>8*1024*1024)throw new Error('Dosya en fazla 8 MB olabilir.');
  if(typeof w.aethrionPrepareFileForAI!=='function')throw new Error('Dosya hazırlama modülü yüklenmemiş; sayfayı yenileyin.');
  var f=await w.aethrionPrepareFileForAI(file);
  var r=await cloud('vizyonAlFileAnalyze',{fileBase64:f.fileBase64,fileName:f.fileName,fileType:f.fileType,question:'Bu dosyayı analiz et, önemli noktalarını açıkla ve Türkçe özetle.'});
  if(!r||r.success!==true)throw new Error(r&&r.error||'Dosya analiz edilemedi.');
  append('user','📎 Dosya analizi: '+file.name);append('assistant',r.reply||'Dosya analizi tamamlandı.');status('Dosya analizi tamamlandı.','ok');
  try{await saveConversation('📎 Dosya analizi: '+file.name,r.reply||'');loadHistory();}catch(e){}
  return true;
 }catch(err){status('Dosya analizi başarısız.','error');notify(err&&err.message||'Dosya analiz edilemedi.','error');return false;}
}
async function loadHistory(){
 var list=el('fullAIHistoryList');if(!list)return false;
 if(!user()){list.textContent='Sohbet geçmişi için giriş yapın.';return false;}
 list.textContent='Sohbetler yükleniyor…';
 try{
  var rows=await cloud('getConversations',{});rows=Array.isArray(rows)?rows:[];
  rows=rows.filter(function(x){return String(x.customName||'').indexOf('AETHRION AI | ')===0;});
  list.textContent='';
  if(!rows.length){var empty=d.createElement('div');empty.className='ae-ai-empty';empty.textContent='Henüz AETHRION AI sohbetin yok. İlk mesajından sonra geçmişin burada görünecek.';list.appendChild(empty);state.historyLoaded=true;return true;}
  rows.forEach(function(x){var b=d.createElement('button');b.type='button';b.className='ae-ai-history-item';var t=d.createElement('strong');t.textContent=String(x.customName||'').replace(/^AETHRION AI \| /,'')||'AETHRION AI sohbeti';var date=d.createElement('small');date.textContent=x.lastMessageTime?new Date(x.lastMessageTime).toLocaleString('tr-TR'):'Tarih yok';b.appendChild(t);b.appendChild(date);b.addEventListener('click',function(){openConversation(x.id);});list.appendChild(b);});
  state.historyLoaded=true;return true;
 }catch(e){list.textContent='Sohbet geçmişi yüklenemedi: '+String(e&&e.message||e);return false;}
}
async function openConversation(id){
 try{
  var r=await cloud('getConversationMessages',{conversationId:id});if(!r||!Array.isArray(r.messages))throw new Error('Sohbet mesajları alınamadı.');
  state.conversationId=id;el('fullAIChat').textContent='';var u=user(),email=u&&u.get?String(u.get('email')||''):'';
  r.messages.forEach(function(m){var ai=m.is_ai===true||(m.from_user&&m.from_user.id&&m.from_user.id!==email);append(ai?'assistant':'user',m.text||'');});
  if(!r.messages.length)welcome();status('Kayıtlı sohbet açıldı.','ok');el('fullAIPanel').classList.remove('history-open');return true;
 }catch(e){notify(e&&e.message||'Sohbet açılamadı.','error');return false;}
}
function newChat(){
 state.conversationId=null;state.requestId++;state.busy=false;
 if(el('fullAIInput')){el('fullAIInput').value='';el('fullAIInput').disabled=false;}
 if(el('fullAISendBtn'))el('fullAISendBtn').disabled=false;if(el('fullAIStopBtn'))el('fullAIStopBtn').hidden=true;
 if(el('fullAIDiagnostics'))el('fullAIDiagnostics').classList.remove('open');welcome();status('Yeni sohbet hazır.','ok');return true;
}
async function diagnostics(){
 var out=el('fullAIDiagnostics');if(!out)return false;out.classList.add('open');out.textContent='Sağlayıcı yapılandırmaları kontrol ediliyor…';
 try{var r=await cloud('aethrionGetDiagnostics',{});if(!r||!r.success)throw new Error(r&&r.error||'Tanılama yanıtı alınamadı.');out.textContent='AETHRION SİSTEM TANILAMASI\n'+(r.checks||[]).map(function(c){return(c.status==='ok'?'✓':c.status==='bad'?'✕':'!')+' '+c.name+': '+c.detail;}).join('\n')+'\n\nBu kontrol yapılandırma ve uç noktaları denetler; model yanıtını garanti etmez.';}catch(e){out.textContent='Tanılama çalıştırılamadı: '+String(e&&e.message||e);}return true;
}
function open(){
 var p=ensurePanel();state.oldOverflow=d.body.style.overflow||'';p.classList.add('open');p.setAttribute('aria-hidden','false');d.body.style.overflow='hidden';
 if(!state.historyLoaded)loadHistory();var input=el('fullAIInput');if(input)w.setTimeout(function(){try{input.focus({preventScroll:true});}catch(e){input.focus();}},80);return true;
}
function close(){var p=el('fullAIPanel');if(!p)return false;p.classList.remove('open','history-open');p.setAttribute('aria-hidden','true');d.body.style.overflow=state.oldOverflow;return true;}
w.openFullAIPanel=open;w.openAethrionAI=open;w.closeFullAIPanel=close;w.sendFullAI=send;w.uploadFullFile=function(input){return input&&input.files&&input.files[0]?upload(input.files[0]):false;};w.newFullAIConversation=newChat;w.loadFullAIHistory=loadHistory;w.stopFullAIResponse=stop;w.openFullAIDiagnostics=diagnostics;
d.addEventListener('keydown',function(e){var p=el('fullAIPanel');if(e.key==='Escape'&&p&&p.classList.contains('open'))close();});
})(window,document);

/* AETHRION Coach — restored dedicated workspace backed by kocChat Cloud Code. */
(function(w,d){
 'use strict';
 if(w.__aethrionCoachRuntime)return;
 w.__aethrionCoachRuntime=true;
 var state={conversationId:null,history:[],requestId:0,overflow:'',lastShareUrl:'',lastSharePassword:''};
 function byId(id){return d.getElementById(id)}
 function notify(message,type){if(typeof w.showNotification==='function')w.showNotification(message,type||'warning');else console.warn('[AETHRION Coach]',message)}
 function user(){try{return w.currentUser||(w.Parse&&w.Parse.User&&w.Parse.User.current&&w.Parse.User.current())}catch(_){return null}}
 function cloud(name,params){if(!w.Parse||!w.Parse.Cloud||typeof w.Parse.Cloud.run!=='function')return Promise.reject(new Error('Back4App bağlantısı kullanılamıyor.'));return w.Parse.Cloud.run(name,params||{})}
 function make(tag,cls,text){var el=d.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
 function installStyles(){
  if(byId('aethrionCoachStyles'))return;
  var style=d.createElement('style');style.id='aethrionCoachStyles';
  style.textContent=
   '#kocPanelOverlay{position:fixed!important;inset:0!important;z-index:2147483000!important;display:none;align-items:center;justify-content:center;padding:clamp(8px,2vw,22px);background:rgba(3,7,18,.82);backdrop-filter:blur(16px)}#kocPanelOverlay.open{display:flex!important}#kocPanelOverlay .koc-shell{width:min(1320px,100%);height:min(900px,96dvh);min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;border:1px solid rgba(217,189,105,.24);border-radius:22px;background:#0b1020;color:#edf1fa;box-shadow:0 28px 100px rgba(0,0,0,.5)}#kocPanelOverlay .koc-head{display:flex;align-items:center;gap:14px;padding:15px 18px;border-bottom:1px solid rgba(255,255,255,.09);background:linear-gradient(120deg,rgba(217,189,105,.09),rgba(124,92,255,.07))}#kocPanelOverlay .koc-brand{min-width:0;flex:1}#kocPanelOverlay .koc-brand strong{display:block;font-size:15px;letter-spacing:.1em}#kocPanelOverlay .koc-brand small{display:block;margin-top:4px;color:#a9b2c5;font-size:10px;letter-spacing:.12em}#kocPanelOverlay .koc-head-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#kocPanelOverlay .koc-btn{border:1px solid rgba(217,189,105,.28);border-radius:10px;padding:9px 12px;background:rgba(217,189,105,.08);color:#e8d08a;font-weight:700;font-size:12px;cursor:pointer}#kocPanelOverlay .koc-btn:hover{background:rgba(217,189,105,.16)}#kocPanelOverlay .koc-btn:disabled{opacity:.45;cursor:not-allowed}#kocPanelOverlay .koc-close{font-size:20px;padding:6px 11px}#kocPanelOverlay .koc-layout{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:0}#kocPanelOverlay .koc-side{min-height:0;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.018)}#kocPanelOverlay .koc-side-top{padding:15px;border-bottom:1px solid rgba(255,255,255,.07)}#kocPanelOverlay .koc-side-top strong{font-size:12px;letter-spacing:.1em}#kocPanelOverlay .koc-history{min-height:0;overflow:auto;padding:10px}#kocPanelOverlay .koc-history-item{width:100%;display:block;text-align:left;padding:11px;margin-bottom:7px;border:1px solid transparent;border-radius:11px;background:rgba(255,255,255,.035);color:#e8edf7;cursor:pointer}#kocPanelOverlay .koc-history-item.active{border-color:rgba(217,189,105,.45);background:rgba(217,189,105,.08)}#kocPanelOverlay .koc-history-item small{display:block;margin-top:5px;color:#8f9bb0;font-size:10px}#kocPanelOverlay .koc-main{min-width:0;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto}#kocPanelOverlay .koc-topic{padding:13px 20px;border-bottom:1px solid rgba(255,255,255,.06);color:#dce3f1;font-size:13px;font-weight:700}#kocPanelOverlay .koc-messages{min-height:0;overflow:auto;padding:22px clamp(14px,3vw,34px);display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain}#kocPanelOverlay .koc-msg{max-width:min(820px,92%);padding:14px 16px;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:rgba(255,255,255,.045);line-height:1.7;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}#kocPanelOverlay .koc-msg.user{align-self:flex-end;border-color:rgba(124,92,255,.28);background:rgba(124,92,255,.1)}#kocPanelOverlay .koc-msg.coach{align-self:flex-start;border-color:rgba(217,189,105,.2)}#kocPanelOverlay .koc-msg-role{margin-bottom:6px;color:#d9bd69;font-size:10px;font-weight:800;letter-spacing:.12em}#kocPanelOverlay .koc-msg.user .koc-msg-role{color:#b9a7ff}#kocPanelOverlay .koc-thinking{align-self:flex-start;color:#aeb8ca;font-size:12px;padding:10px 14px}#kocPanelOverlay .koc-compose{display:flex;gap:10px;align-items:flex-end;padding:14px 18px calc(14px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02)}#kocPanelOverlay #kocInput{flex:1;min-width:0;min-height:48px;max-height:150px;resize:vertical;padding:13px 14px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:#10182b;color:#f5f7fc;font:inherit;font-size:14px;outline:none}#kocPanelOverlay #kocInput:focus{border-color:rgba(217,189,105,.6)}#kocPanelOverlay .koc-empty{padding:18px;text-align:center;color:#8e9ab0;font-size:12px;line-height:1.7}#kocPanelOverlay .koc-share{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,7,18,.82);z-index:2}#kocPanelOverlay .koc-share.open{display:flex}#kocPanelOverlay .koc-share-card{width:min(460px,100%);padding:22px;border:1px solid rgba(217,189,105,.3);border-radius:18px;background:#10182b;box-shadow:0 20px 70px rgba(0,0,0,.45)}#kocPanelOverlay .koc-share-card h3{margin:0 0 8px;font-size:17px}#kocPanelOverlay .koc-share-card p{color:#aeb8ca;font-size:12px;line-height:1.6}#kocPanelOverlay .koc-share-card input[type=password]{width:100%;box-sizing:border-box;padding:12px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:#0b1020;color:#fff;margin:10px 0}#kocPanelOverlay .koc-share-result{display:none;margin-top:14px;padding:12px;border:1px solid rgba(217,189,105,.2);border-radius:12px;background:rgba(217,189,105,.06);overflow-wrap:anywhere;font-size:12px}#kocPanelOverlay .koc-share-result.show{display:block}#kocPanelOverlay .koc-share-result code{display:block;margin:7px 0;color:#e7d49c;white-space:normal;overflow-wrap:anywhere}#kocPanelOverlay .koc-limit{color:#c7d0e0;font-size:11px;white-space:nowrap}@media(max-width:760px){#kocPanelOverlay{padding:0}#kocPanelOverlay .koc-shell{width:100%;height:100dvh;max-height:none;border-radius:0;border-left:0;border-right:0}#kocPanelOverlay .koc-layout{grid-template-columns:1fr}#kocPanelOverlay .koc-side{display:none}#kocPanelOverlay .koc-head{padding:12px}#kocPanelOverlay .koc-head-actions{gap:5px}#kocPanelOverlay .koc-btn{padding:8px 9px;font-size:11px}#kocPanelOverlay .koc-compose{padding:10px}#kocPanelOverlay .koc-msg{max-width:96%}}';
  d.head.appendChild(style);
 }
 function ensurePanel(){
  var overlay=byId('kocPanelOverlay');if(overlay)return overlay;
  installStyles();
  overlay=make('div','modal-overlay');overlay.id='kocPanelOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','AETHRION Coach');
  var shell=make('section','koc-shell');
  var head=make('header','koc-head'),brand=make('div','koc-brand'),brandName=make('strong','', 'AETHRION COACH'),brandSub=make('small','', 'PERSONAL GUIDANCE · SECURE WORKSPACE');
  brand.appendChild(brandName);brand.appendChild(brandSub);
  var actions=make('div','koc-head-actions');
  var limit=make('span','koc-limit','Haftalık kullanım yükleniyor…');limit.id='kocPanelLimitBadge';
  var fresh=make('button','koc-btn','＋ Yeni sohbet');fresh.type='button';fresh.addEventListener('click',newConversation);
  var share=make('button','koc-btn','Paylaş');share.type='button';share.addEventListener('click',openKocShareModal);
  var closeBtn=make('button','koc-btn koc-close','×');closeBtn.type='button';closeBtn.setAttribute('aria-label','Coach panelini kapat');closeBtn.addEventListener('click',closeKocPanel);
  actions.appendChild(limit);actions.appendChild(fresh);actions.appendChild(share);actions.appendChild(closeBtn);head.appendChild(brand);head.appendChild(actions);
  var layout=make('div','koc-layout'),side=make('aside','koc-side'),sideTop=make('div','koc-side-top','SOHBET GEÇMİŞİ'),history=make('div','koc-history');history.id='kocHistoryList';
  side.appendChild(sideTop);side.appendChild(history);
  var main=make('main','koc-main'),topic=make('div','koc-topic','Yeni sohbet');topic.id='kocCurrentTopic';
  var messages=make('div','koc-messages');messages.id='kocChatMessages';
  var compose=make('form','koc-compose'),input=make('textarea');input.id='kocInput';input.placeholder='AETHRION Coach’a mesajını yaz…';input.rows=1;input.maxLength=2000;input.setAttribute('aria-label','Coach mesajı');
  var send=make('button','koc-btn','Gönder');send.id='kocSendBtn';send.type='submit';
  var stop=make('button','koc-btn','Durdur');stop.id='kocStopBtn';stop.type='button';stop.style.display='none';stop.addEventListener('click',stopKocResponse);
  compose.addEventListener('submit',function(e){e.preventDefault();sendKocMessage()});
  input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendKocMessage()}});
  compose.appendChild(input);compose.appendChild(send);compose.appendChild(stop);
  main.appendChild(topic);main.appendChild(messages);main.appendChild(compose);layout.appendChild(side);layout.appendChild(main);
  var shareLayer=make('div','koc-share');shareLayer.id='kocShareModalOverlay';
  var shareCard=make('div','koc-share-card'),shareTitle=make('h3','','Sohbeti güvenli paylaş'),shareDesc=make('p','','Paylaşım bağlantısı parola ile korunur. Bağlantıyı yalnızca güvendiğin kişilerle paylaş.');
  var responsibility=make('label');var checkbox=make('input');checkbox.type='checkbox';checkbox.id='kocResponsibilityCheckbox';responsibility.appendChild(checkbox);responsibility.appendChild(d.createTextNode(' Paylaşım bağlantısını ve parolayı güvenli biçimde ileteceğimi onaylıyorum.'));
  var password=make('input');password.type='password';password.id='kocSharePasswordInput';password.placeholder='En az 4 karakterli parola';password.minLength=4;password.maxLength=64;password.autocomplete='new-password';
  var shareActions=make('div');shareActions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:8px';
  var create=make('button','koc-btn','Bağlantı oluştur');create.type='button';create.id='kocShareCreateBtn';create.disabled=true;create.addEventListener('click',createKocShareLink);
  var cancel=make('button','koc-btn','Vazgeç');cancel.type='button';cancel.addEventListener('click',closeKocShareModal);
  checkbox.addEventListener('change',updateShareButton);password.addEventListener('input',updateShareButton);
  shareActions.appendChild(create);shareActions.appendChild(cancel);
  var result=make('div','koc-share-result');result.id='kocShareResult';
  var linkLabel=make('strong','','Paylaşım bağlantısı');var link=make('code');link.id='kocShareResultLink';
  var copyLink=make('button','koc-btn','Linki kopyala');copyLink.type='button';copyLink.addEventListener('click',copyKocShareLink);
  var pwLabel=make('strong','','Parola');var pw=make('code');pw.id='kocShareResultPassword';
  var copyPw=make('button','koc-btn','Parolayı kopyala');copyPw.type='button';copyPw.addEventListener('click',copyKocSharePassword);
  result.appendChild(linkLabel);result.appendChild(link);result.appendChild(copyLink);result.appendChild(d.createElement('br'));result.appendChild(pwLabel);result.appendChild(pw);result.appendChild(copyPw);
  shareCard.appendChild(shareTitle);shareCard.appendChild(shareDesc);shareCard.appendChild(responsibility);shareCard.appendChild(password);shareCard.appendChild(shareActions);shareCard.appendChild(result);shareLayer.appendChild(shareCard);
  overlay.appendChild(shell);shell.appendChild(head);shell.appendChild(layout);shell.appendChild(shareLayer);
  overlay.addEventListener('click',function(e){if(e.target===overlay)closeKocPanel();if(e.target===shareLayer)closeKocShareModal()});
  d.body.appendChild(overlay);return overlay;
 }
 function appendMessage(role,text,createdAt){
  var box=byId('kocChatMessages');if(!box)return;
  var row=make('article','koc-msg '+(role==='user'?'user':'coach'));
  var label=make('div','koc-msg-role',role==='user'?'SİZ':'AETHRION COACH');
  var body=make('div','',String(text||''));body.style.whiteSpace='pre-wrap';
  row.appendChild(label);row.appendChild(body);
  if(createdAt){var date=new Date(createdAt);if(!isNaN(date.getTime()))row.appendChild(make('small','',date.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})))}
  box.appendChild(row);box.scrollTop=box.scrollHeight;
 }
 function showWelcome(){
  var box=byId('kocChatMessages');if(!box)return;
  box.textContent='';appendMessage('coach','Merhaba! Ben AETHRION Coach. Hedeflerini netleştirmene, çalışma planı oluşturmana ve sorularına adım adım yaklaşmana yardımcı olabilirim. Nereden başlamak istersin?');
 }
 function updateShareButton(){var cb=byId('kocResponsibilityCheckbox'),pw=byId('kocSharePasswordInput'),btn=byId('kocShareCreateBtn');if(btn)btn.disabled=!(cb&&cb.checked&&pw&&pw.value.trim().length>=4)}
 async function updateKocLimitBadge(){
  var badge=byId('kocPanelLimitBadge');if(!badge)return;
  try{var result=await cloud('getKocUsage',{});if(!result||result.success!==true)throw new Error('Limit bilgisi alınamadı');badge.textContent=result.limit===-1?'Haftalık: sınırsız':'Kalan: '+Math.max(0,Number(result.remaining)||0)+' / '+(Number(result.limit)||0);badge.title='Bu hafta kullanılan: '+(Number(result.used)||0)}
  catch(e){badge.textContent='Kullanım bilgisi alınamadı';badge.title=e.message||''}
 }
 async function loadKocHistory(){
  var host=byId('kocHistoryList');if(host)host.textContent='Geçmiş yükleniyor…';
  try{var result=await cloud('getKocHistory',{});state.history=result&&Array.isArray(result.conversations)?result.conversations:[];w.kocHistoryCache=state.history;
   if(!host)return;host.textContent='';
   if(!state.history.length){host.appendChild(make('div','koc-empty','Henüz sohbet yok. İlk mesajını yazarak başla.'));return}
   state.history.forEach(function(item){
    var btn=make('button','koc-history-item'+(item.id===state.conversationId?' active':''));btn.type='button';
    btn.appendChild(make('span','',String(item.title||item.topic||'Sohbet')));
    var date=item.updatedAt||item.createdAt;var when=date?new Date(date).toLocaleDateString('tr-TR'):'';
    btn.appendChild(make('small','',(item.messageCount||0)+' mesaj · '+when));
    btn.addEventListener('click',function(){loadKocConversationById(item.id)});host.appendChild(btn);
   });
  }catch(e){if(host)host.textContent='Sohbet geçmişi yüklenemedi: '+String(e.message||e);console.warn('[AETHRION Coach] history',e)}
 }
 async function loadKocConversationById(id){
  if(!id)return false;var box=byId('kocChatMessages');if(box)box.textContent='Sohbet yükleniyor…';
  try{var result=await cloud('getKocConversationMessages',{conversationId:id});if(!result||result.success!==true)throw new Error('Sohbet mesajları alınamadı');
   state.conversationId=id;w.kocConversationId=id;try{w.localStorage.setItem('aethrion_koc_conv_id',id)}catch(_){}
   var item=state.history.find(function(x){return x.id===id});var topic=byId('kocCurrentTopic');if(topic)topic.textContent=item&&item.title||'Sohbet';
   if(box)box.textContent='';
   (result.messages||[]).forEach(function(m){appendMessage(m.sender==='user'?'user':'coach',m.text,m.createdAt)});
   await loadKocHistory();return true;
  }catch(e){if(box)box.textContent='Sohbet yüklenemedi: '+String(e.message||e);return false}
 }
 function newConversation(){
  state.conversationId=null;w.kocConversationId=null;try{w.localStorage.removeItem('aethrion_koc_conv_id')}catch(_){}
  var topic=byId('kocCurrentTopic');if(topic)topic.textContent='Yeni sohbet';
  showWelcome();var input=byId('kocInput');if(input)input.focus();loadKocHistory();
 }
 async function sendKocMessage(){
  var input=byId('kocInput'),send=byId('kocSendBtn'),stop=byId('kocStopBtn'),box=byId('kocChatMessages');
  if(!user()){notify('Coach kullanmak için giriş yapmalısın.','warning');return false}
  if(!input||!box)return false;
  var message=input.value.trim();if(!message){notify('Önce bir mesaj yaz.','warning');return false}
  if(message.length>2000){notify('Mesaj 2000 karakteri geçemez.','warning');return false}
  appendMessage('user',message);input.value='';input.disabled=true;if(send)send.disabled=true;if(stop)stop.style.display='inline-flex';
  var id=++state.requestId,thinking=make('div','koc-thinking','AETHRION Coach yanıt hazırlıyor…');box.appendChild(thinking);box.scrollTop=box.scrollHeight;
  try{
   var result=await cloud('kocChat',{message:message,conversationId:state.conversationId||null});
   if(id!==state.requestId)return false;
   thinking.remove();if(!result||result.success!==true)throw new Error(result&&result.error||'Coach şu anda yanıt veremedi.');
   state.conversationId=result.conversationId||state.conversationId;w.kocConversationId=state.conversationId;
   if(state.conversationId)try{w.localStorage.setItem('aethrion_koc_conv_id',state.conversationId)}catch(_){}
   appendMessage('coach',result.reply||'Yanıt alınamadı.');
   var topic=byId('kocCurrentTopic');if(topic&&result.conversationTitle)topic.textContent=result.conversationTitle;
   await Promise.all([loadKocHistory(),updateKocLimitBadge()]);
   return true;
  }catch(e){if(id===state.requestId){if(thinking.parentNode)thinking.remove();appendMessage('coach','İşlem tamamlanamadı: '+String(e.message||e));notify(String(e.message||'Coach bağlantı hatası.'),'error')}return false}
  finally{if(id===state.requestId){input.disabled=false;if(send)send.disabled=false;if(stop)stop.style.display='none';input.focus()}}
 }
 function stopKocResponse(){state.requestId++;var box=byId('kocChatMessages'),input=byId('kocInput'),send=byId('kocSendBtn'),stop=byId('kocStopBtn');if(box){var thinking=box.querySelector('.koc-thinking');if(thinking)thinking.remove();appendMessage('coach','Yanıt bekleme durduruldu. İstersen yeni bir mesaj gönderebilirsin.')}if(input)input.disabled=false;if(send)send.disabled=false;if(stop)stop.style.display='none'}
 function openKocShareModal(){
  if(!state.conversationId){notify('Paylaşmadan önce bir Coach sohbeti başlat.','warning');return false}
  var layer=byId('kocShareModalOverlay');if(!layer)return false;
  var cb=byId('kocResponsibilityCheckbox'),pw=byId('kocSharePasswordInput'),result=byId('kocShareResult');
  if(cb)cb.checked=false;if(pw)pw.value='';if(result)result.classList.remove('show');updateShareButton();layer.classList.add('open');return true;
 }
 function closeKocShareModal(){var layer=byId('kocShareModalOverlay');if(layer)layer.classList.remove('open')}
 async function createKocShareLink(){
  var btn=byId('kocShareCreateBtn'),pw=byId('kocSharePasswordInput'),password=pw?pw.value.trim():'';
  if(!state.conversationId||password.length<4){notify('En az 4 karakterli bir parola gir.','warning');return false}
  if(!byId('kocResponsibilityCheckbox')||!byId('kocResponsibilityCheckbox').checked){notify('Paylaşım sorumluluğu onayını işaretle.','warning');return false}
  if(btn){btn.disabled=true;btn.textContent='Oluşturuluyor…'}
  try{
   var result=await cloud('shareKocConversation',{conversationId:state.conversationId,password:password});
   if(!result||result.success!==true||!result.shareId)throw new Error(result&&result.error||'Paylaşım bağlantısı oluşturulamadı.');
   var base=w.location.origin;
   if(w.location.pathname.indexOf('/vizyon2026/')===0)base+='/vizyon2026';
   state.lastShareUrl=base+'/share.html?id='+encodeURIComponent(result.shareId)+'&password_required=1';state.lastSharePassword=password;
   w.kocLastSharedLink=state.lastShareUrl;w.kocLastSharedPassword=password;
   var link=byId('kocShareResultLink'),pass=byId('kocShareResultPassword'),out=byId('kocShareResult');
   if(link)link.textContent=state.lastShareUrl;if(pass)pass.textContent=password;if(out)out.classList.add('show');
   notify('Parola korumalı paylaşım bağlantısı oluşturuldu.','success');return true;
  }catch(e){notify(String(e.message||e),'error');return false}
  finally{if(btn){btn.disabled=false;btn.textContent='Bağlantı oluştur';updateShareButton()}}
 }
 async function copyText(value,label){
  try{if(w.navigator&&w.navigator.clipboard&&w.navigator.clipboard.writeText)await w.navigator.clipboard.writeText(value);else{var area=make('textarea');area.value=value;d.body.appendChild(area);area.select();d.execCommand('copy');area.remove()}notify(label+' kopyalandı.','success')}
  catch(_){notify(label+' kopyalanamadı.','warning')}
 }
 function copyKocShareLink(){if(state.lastShareUrl)copyText(state.lastShareUrl,'Bağlantı')}
 function copyKocSharePassword(){if(state.lastSharePassword)copyText(state.lastSharePassword,'Parola')}
 async function openKocPanel(){
  if(!user()){notify('AETHRION Coach için önce giriş yap.','warning');return false}
  var panel=ensurePanel();state.overflow=d.body.style.overflow||'';panel.classList.add('open');panel.setAttribute('aria-hidden','false');d.body.style.overflow='hidden';
  var saved='';try{saved=w.localStorage.getItem('aethrion_koc_conv_id')||''}catch(_){}
  await Promise.all([updateKocLimitBadge(),loadKocHistory()]);
  var target=saved&&state.history.some(function(c){return c.id===saved})?saved:(state.history[0]&&state.history[0].id);
  if(target)await loadKocConversationById(target);else{state.conversationId=null;w.kocConversationId=null;showWelcome()}
  var input=byId('kocInput');if(input)input.focus();return true;
 }
 function closeKocPanel(){var panel=byId('kocPanelOverlay');if(panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true')}d.body.style.overflow=state.overflow||''}
 w.openKocPanel=openKocPanel;w.closeKocPanel=closeKocPanel;w.sendKocMessage=sendKocMessage;w.stopKocResponse=stopKocResponse;
 w.loadKocHistory=loadKocHistory;w.loadKocConversationById=loadKocConversationById;w.loadKocDashboardHistory=loadKocHistory;
 w.updateKocLimitBadge=updateKocLimitBadge;w.openKocShareModal=openKocShareModal;w.closeKocShareModal=closeKocShareModal;
 w.createKocShareLink=createKocShareLink;w.copyKocShareLink=copyKocShareLink;w.copyKocSharePassword=copyKocSharePassword;
 w.kocHistoryCache=state.history;w.kocConversationId=null;w.kocLastSharedLink='';w.kocLastSharedPassword='';
 d.addEventListener('keydown',function(e){if(e.key==='Escape'){var p=byId('kocPanelOverlay');if(p&&p.classList.contains('open'))closeKocPanel()}});
})(window,document);

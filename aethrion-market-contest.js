/* AETHRION points market and monthly contest workspace recovery. */
(function(w,d){
 'use strict';
 if(w.__aethrionMarketContestRuntime)return;
 w.__aethrionMarketContestRuntime=true;
 var state={market:[],contest:null,participant:false,projects:[],previousOverflow:''};
 function byId(id){return d.getElementById(id)}
 function user(){try{return w.currentUser||(w.Parse&&w.Parse.User&&w.Parse.User.current&&w.Parse.User.current())}catch(_){return null}}
 function role(){var u=user();try{return u&&u.get?String(u.get('role')||'user'):String(u&&u.role||'user')}catch(_){return'user'}}
 function email(){var u=user();try{return u&&u.get?String(u.get('email')||''):String(u&&u.email||'')}catch(_){return''}}
 function cloud(name,params){if(!w.Parse||!w.Parse.Cloud||typeof w.Parse.Cloud.run!=='function')return Promise.reject(new Error('Back4App bağlantısı kullanılamıyor.'));return w.Parse.Cloud.run(name,params||{})}
 function notify(message,type){if(typeof w.showNotification==='function')w.showNotification(message,type||'warning');else console.warn('[AETHRION Market/Contest]',message)}
 function el(tag,cls,text){var n=d.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
 function safeImage(url){return typeof url==='string'&&/^https?:\/\//i.test(url)}
 function addStyles(){
  if(byId('aethrionMarketContestStyles'))return;
  var s=el('style');s.id='aethrionMarketContestStyles';s.textContent=
   '.ae-mc-overlay{position:fixed!important;inset:0!important;z-index:2147482500!important;display:none;align-items:center;justify-content:center;padding:clamp(8px,2vw,22px);background:rgba(3,7,18,.84);backdrop-filter:blur(15px)}.ae-mc-overlay.open{display:flex!important}.ae-mc-shell{position:relative;width:min(1180px,100%);height:min(900px,95dvh);overflow:auto;border:1px solid rgba(217,189,105,.24);border-radius:20px;background:#0b1020;color:#eef2fb;box-shadow:0 24px 90px rgba(0,0,0,.48);padding:clamp(16px,2.5vw,26px)}.ae-mc-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}.ae-mc-head h2{flex:1;margin:0;font-size:clamp(18px,2vw,24px);letter-spacing:.02em}.ae-mc-muted{color:#98a4ba;font-size:12px;line-height:1.6}.ae-mc-btn{border:1px solid rgba(217,189,105,.32);border-radius:10px;padding:9px 13px;background:rgba(217,189,105,.09);color:#ead49a;font-weight:700;font-size:12px;cursor:pointer}.ae-mc-btn:hover{background:rgba(217,189,105,.17)}.ae-mc-btn:disabled{opacity:.45;cursor:not-allowed}.ae-mc-close{font-size:20px;padding:5px 11px}.ae-mc-controls{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:16px}.ae-mc-controls input,.ae-mc-controls select,.ae-mc-form input,.ae-mc-form textarea,.ae-mc-score{min-width:0;padding:11px 12px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:#10182b;color:#f4f6fb;font:inherit;font-size:13px}.ae-mc-controls input[type=search]{flex:1;min-width:180px}.ae-mc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,235px),1fr));gap:13px}.ae-mc-card{min-width:0;padding:15px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.015))}.ae-mc-card img{width:100%;height:140px;object-fit:cover;border-radius:10px;margin-bottom:10px}.ae-mc-card h3{margin:0 0 6px;font-size:14px}.ae-mc-card p{margin:5px 0;color:#aeb8ca;font-size:12px;line-height:1.55;overflow-wrap:anywhere}.ae-mc-price{margin:10px 0;color:#e8cf87;font-weight:800;font-size:14px}.ae-mc-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.ae-mc-empty{grid-column:1/-1;padding:30px;text-align:center;border:1px dashed rgba(255,255,255,.14);border-radius:14px;color:#9ba7bb;font-size:13px}.ae-mc-section{margin-top:20px;padding:16px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.025)}.ae-mc-section h3{margin:0 0 12px;font-size:15px}.ae-mc-ranking{display:grid;gap:8px}.ae-mc-rank{display:flex;justify-content:space-between;gap:12px;padding:11px 13px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.03);font-size:13px}.ae-mc-rank strong{color:#e6d08d}.ae-mc-form{display:grid;gap:10px;margin-top:12px}.ae-mc-form textarea{width:100%;min-height:150px;resize:vertical;box-sizing:border-box}.ae-mc-form input{width:100%;box-sizing:border-box}.ae-mc-founder{display:none}.ae-mc-founder.show{display:block}.ae-mc-project{padding:13px;margin:8px 0;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.03)}.ae-mc-project pre{max-height:220px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px;border-radius:8px;background:#080d18;color:#c9d3e6;font-size:11px}.ae-mc-score{width:100px}.ae-mc-status{margin:10px 0;color:#b7c2d4;font-size:12px}@media(max-width:640px){.ae-mc-overlay{padding:0}.ae-mc-shell{height:100dvh;max-height:none;border-radius:0;border:0;padding:15px}.ae-mc-controls input[type=search]{min-width:100%}.ae-mc-grid{grid-template-columns:1fr}.ae-mc-head h2{font-size:18px}}';
  d.head.appendChild(s);
 }
 function makeOverlay(id,title){
  var old=byId(id);if(old)return old;addStyles();
  var overlay=el('div','ae-mc-overlay');overlay.id=id;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',title);
  var shell=el('section','ae-mc-shell'),head=el('header','ae-mc-head'),h=el('h2','',title),close=el('button','ae-mc-btn ae-mc-close','×');
  close.type='button';close.setAttribute('aria-label','Kapat');close.addEventListener('click',function(){if(id==='marketModal')w.closeMarket();else w.closeContestPage()});
  head.appendChild(h);head.appendChild(close);shell.appendChild(head);overlay.appendChild(shell);
  overlay.addEventListener('click',function(e){if(e.target===overlay){if(id==='marketModal')w.closeMarket();else w.closeContestPage()}});
  d.body.appendChild(overlay);return overlay;
 }
 function openOverlay(overlay){state.previousOverflow=d.body.style.overflow||'';overlay.classList.add('open');overlay.style.setProperty('display','flex','important');overlay.setAttribute('aria-hidden','false');d.body.style.overflow='hidden'}
 function closeOverlay(overlay){if(!overlay)return;overlay.classList.remove('open');overlay.style.setProperty('display','none','important');overlay.setAttribute('aria-hidden','true');d.body.style.overflow=state.previousOverflow||''}
 function ensureMarket(){
  var overlay=makeOverlay('marketModal','🛒 A27 Puan Pazarı'),shell=overlay.querySelector('.ae-mc-shell');
  if(byId('marketItems'))return overlay;
  var controls=el('div','ae-mc-controls'),search=el('input');search.id='marketSearchInput';search.type='search';search.placeholder='Proje ara…';
  var type=el('select');type.id='marketTypeFilter';[['all','Tüm türler'],['3D','3D'],['Kod','Kod'],['Görsel','Görsel']].forEach(function(x){var o=el('option','',x[1]);o.value=x[0];type.appendChild(o)});
  var min=el('input');min.id='marketPriceMin';min.type='number';min.min='0';min.placeholder='Min puan';min.style.width='110px';
  var max=el('input');max.id='marketPriceMax';max.type='number';max.min='0';max.placeholder='Maks. puan';max.style.width='110px';
  var refresh=el('button','ae-mc-btn','Yenile');refresh.type='button';refresh.addEventListener('click',w.loadMarket);
  [search,type,min,max].forEach(function(x){x.addEventListener('input',w.filterMarket);x.addEventListener('change',w.filterMarket)});
  controls.appendChild(search);controls.appendChild(type);controls.appendChild(min);controls.appendChild(max);controls.appendChild(refresh);
  var note=el('p','ae-mc-muted','Projeler A27 puanlarıyla listelenir. Satın alma işlemleri hesabının puan bakiyesinden yapılır; gerçek para ödemesi içermez.');
  var items=el('div','ae-mc-grid');items.id='marketItems';
  shell.appendChild(controls);shell.appendChild(note);shell.appendChild(items);return overlay;
 }
 function renderMarketItems(items){
  var host=byId('marketItems');if(!host)return;host.textContent='';
  if(!items||!items.length){host.appendChild(el('div','ae-mc-empty','Bu filtrelerle eşleşen satılık proje bulunamadı.'));return}
  items.forEach(function(item){
   var card=el('article','ae-mc-card');
   if(safeImage(item.imageUrl)){var img=el('img');img.src=item.imageUrl;img.alt=String(item.title||'Proje');img.loading='lazy';card.appendChild(img)}
   var title=el('h3','',String(item.title||'İsimsiz proje'));var owner=el('p','', 'Oluşturan: '+String(item.owner_name||'AETHRION üyesi'));var desc=el('p','',String(item.description||'Açıklama eklenmemiş.'));var type=el('p','', 'Tür: '+String(item.type||'Proje'));var price=el('div','ae-mc-price','⭐ '+Number(item.price_points||0).toLocaleString('tr-TR')+' A27 puan');
   card.appendChild(title);card.appendChild(owner);card.appendChild(desc);card.appendChild(type);card.appendChild(price);
   var actions=el('div','ae-mc-actions'),buy=el('button','ae-mc-btn','Satın al');buy.type='button';buy.addEventListener('click',function(){w.buyMarketProject(item.id)});
   actions.appendChild(buy);
   if(email()&&email()===item.owner_email||role()==='founder'){var remove=el('button','ae-mc-btn','Mağazadan kaldır');remove.type='button';remove.addEventListener('click',function(){w.removeFromMarket(item.id)});actions.appendChild(remove)}
   card.appendChild(actions);host.appendChild(card);
  });
 }
 async function loadMarket(){
  var host=byId('marketItems');if(host)host.textContent='Pazar projeleri yükleniyor…';
  try{var result=await cloud('getMarketProjects',{});state.market=Array.isArray(result)?result:[];w.marketItemsCache=state.market;w.filterMarket()}
  catch(e){if(host)host.textContent='Pazar yüklenemedi: '+String(e.message||e);notify(String(e.message||e),'error')}
 }
 function filterMarket(){
  var search=(byId('marketSearchInput')&&byId('marketSearchInput').value||'').trim().toLocaleLowerCase('tr-TR');
  var type=byId('marketTypeFilter')&&byId('marketTypeFilter').value||'all';
  var min=Number(byId('marketPriceMin')&&byId('marketPriceMin').value||0);
  var maxRaw=byId('marketPriceMax')&&byId('marketPriceMax').value;var max=maxRaw===''||maxRaw==null?Infinity:Number(maxRaw);
  var filtered=state.market.filter(function(x){var text=[x.title,x.description,x.owner_name].join(' ').toLocaleLowerCase('tr-TR');var price=Number(x.price_points||0);return(!search||text.includes(search))&&(type==='all'||x.type===type)&&price>=min&&price<=max});
  renderMarketItems(filtered);
 }
 async function buyMarketProject(id){
  if(!user()){notify('Satın almak için AETHRION hesabına giriş yap.','warning');return false}
  if(!w.confirm('Bu projeyi A27 puanlarınla satın almak istiyor musun?'))return false;
  try{var result=await cloud('buyMarketProject',{marketProjectId:id});if(!result||result.success!==true)throw new Error(result&&result.error||'Satın alma tamamlanamadı.');
   try{if(w.Parse&&w.Parse.User&&w.Parse.User.current()){w.Parse.User.current().set('points',result.remaining_points)}}catch(_){}
   if(typeof w.updatePointsBadge==='function')w.updatePointsBadge(result.remaining_points);if(typeof w.loadUserPoints==='function')w.loadUserPoints();
   notify(result.message||'Proje satın alındı.','success');await loadMarket();return true;
  }catch(e){notify(String(e.message||e),'error');return false}
 }
 async function removeFromMarket(id){
  if(!user()||!w.confirm('Bu projeyi mağazadan kaldırmak istiyor musun?'))return false;
  try{var result=await cloud('removeFromMarket',{marketId:id});notify(result&&result.message||'Proje kaldırıldı.','success');await loadMarket();return true}
  catch(e){notify(String(e.message||e),'error');return false}
 }
 function openMarket(){var overlay=ensureMarket();openOverlay(overlay);loadMarket();return true}
 function closeMarket(){closeOverlay(byId('marketModal'))}
 function ensureContest(){
  var overlay=makeOverlay('contestPage','🏆 AETHRION Aylık Yarışma'),shell=overlay.querySelector('.ae-mc-shell');
  if(byId('contestJoinStatusContent'))return overlay;
  var intro=el('p','ae-mc-muted','Projeni gönder, sıralamada yer al ve aylık ödüller için yarış. Katılım ve puanlama sunucu tarafından doğrulanır.');
  var meta=el('div','ae-mc-status','Yarışma bilgileri yükleniyor…');meta.id='contestMeta';
  var join=el('div','ae-mc-section');join.id='contestJoinStatusContent';
  var submit=el('button','ae-mc-btn','Proje gönder');submit.type='button';submit.id='contestSubmitProjectBtn';submit.style.display='none';submit.addEventListener('click',w.openContestProjectForm);
  var form=el('div','ae-mc-section');form.id='contestProjectForm';form.style.display='none';form.appendChild(el('h3','','Yarışma projesi gönder'));
  var formGrid=el('div','ae-mc-form'),name=el('input');name.id='contestProjectNameInput';name.placeholder='Proje adı';name.maxLength=100;
  var code=el('textarea');code.id='contestProjectCodeInput';code.placeholder='Projenin kodunu veya açıklayıcı kaynak içeriğini buraya ekle…';code.maxLength=20000;
  var formActions=el('div','ae-mc-actions'),send=el('button','ae-mc-btn','Projeyi gönder');send.type='button';send.addEventListener('click',w.submitContestProject);
  var cancel=el('button','ae-mc-btn','Vazgeç');cancel.type='button';cancel.addEventListener('click',w.closeContestProjectForm);
  formActions.appendChild(send);formActions.appendChild(cancel);formGrid.appendChild(name);formGrid.appendChild(code);formGrid.appendChild(formActions);form.appendChild(formGrid);
  var ranking=el('section','ae-mc-section');ranking.appendChild(el('h3','','🏅 Güncel sıralama'));var list=el('div','ae-mc-ranking');list.id='contestRankingList';ranking.appendChild(list);
  var founder=el('section','ae-mc-section ae-mc-founder');founder.id='contestFounderPanel';founder.appendChild(el('h3','','Kurucu değerlendirme paneli'));var projects=el('div');projects.id='contestProjectsFounderList';founder.appendChild(projects);
  var finalize=el('button','ae-mc-btn','Yarışmayı tamamla ve ödülleri işle');finalize.type='button';finalize.id='contestFinalizeBtn';finalize.addEventListener('click',w.finalizeContest);founder.appendChild(finalize);
  shell.appendChild(intro);shell.appendChild(meta);shell.appendChild(join);shell.appendChild(submit);shell.appendChild(form);shell.appendChild(ranking);shell.appendChild(founder);return overlay;
 }
 function renderJoinStatus(){
  var host=byId('contestJoinStatusContent'),submit=byId('contestSubmitProjectBtn');if(!host)return;host.textContent='';
  if(state.participant){host.appendChild(el('h3','','✅ Yarışmaya katıldın'));host.appendChild(el('p','ae-mc-muted','Artık projenin kaynak içeriğini gönderebilirsin.'));if(submit)submit.style.display='inline-flex'}
  else{host.appendChild(el('h3','','Henüz katılmadın'));host.appendChild(el('p','ae-mc-muted','Katılımı onayladığında bu ayın yarışmasına dahil olursun.'));var join=el('button','ae-mc-btn','Yarışmaya katıl');join.type='button';join.addEventListener('click',w.openContestJoinWarning);host.appendChild(join);if(submit)submit.style.display='none'}
 }
 async function loadContestRankingV2(){
  var host=byId('contestRankingList');if(!host)return;host.textContent='Sıralama yükleniyor…';
  try{var result=await cloud('getContestRankingV2',{}),ranking=result&&Array.isArray(result.ranking)?result.ranking:[];host.textContent='';
   if(!ranking.length){host.appendChild(el('div','ae-mc-empty','Henüz katılımcı yok. İlk katılan sen olabilirsin.'));return}
   ranking.forEach(function(item,index){var row=el('div','ae-mc-rank');var name=el('span','',String(index+1)+'. '+String(item.user_name||'Katılımcı'));var points=el('strong','',Number(item.total_points||0).toLocaleString('tr-TR')+' puan');row.appendChild(name);row.appendChild(points);host.appendChild(row)});
  }catch(e){host.textContent='Sıralama yüklenemedi: '+String(e.message||e)}
 }
 async function loadContestProjectsForFounder(){
  var host=byId('contestProjectsFounderList');if(!host||role()!=='founder')return;host.textContent='Projeler yükleniyor…';
  try{var result=await cloud('getContestProjectsForFounder',{});state.projects=result&&Array.isArray(result.projects)?result.projects:[];w.contestProjectsFounderCache=state.projects;host.textContent='';
   if(!state.projects.length){host.appendChild(el('div','ae-mc-empty','Henüz değerlendirme bekleyen proje yok.'));return}
   state.projects.forEach(function(p){var card=el('article','ae-mc-project');card.appendChild(el('h4','',String(p.project_name||'İsimsiz proje')));card.appendChild(el('p','ae-mc-muted','Katılımcı: '+String(p.user_name||'Üye')+' · '+(p.reviewed?'Değerlendirildi':'Değerlendirme bekliyor')));
    var pre=el('pre','',String(p.code||''));card.appendChild(pre);
    var actions=el('div','ae-mc-actions'),score=el('input','ae-mc-score');score.type='number';score.min='1';score.max='10000';score.value=String(p.points||100);score.setAttribute('aria-label','Proje puanı');
    var save=el('button','ae-mc-btn','Puanı kaydet');save.type='button';save.addEventListener('click',function(){w.saveContestScore(p.id,score.value)});actions.appendChild(score);actions.appendChild(save);card.appendChild(actions);host.appendChild(card);
   });
  }catch(e){host.textContent='Kurucu proje listesi yüklenemedi: '+String(e.message||e)}
 }
 async function loadContestPageData(){
  var meta=byId('contestMeta');if(meta)meta.textContent='Yarışma bilgileri yükleniyor…';
  try{var contest=await cloud('getActiveContest',{});state.contest=contest;w.currentContestData=contest;
   var check=await cloud('checkContestParticipation',{});state.participant=!!(check&&check.isParticipant);w.contestIsParticipant=state.participant;
   if(meta){var end=contest&&contest.end_date?new Date(contest.end_date).toLocaleDateString('tr-TR'):'belirlenmedi';meta.textContent=(contest&&contest.title||'Aylık Yarışma')+' · Bitiş: '+end+' · Ay: '+String(contest&&contest.month||'')}
   renderJoinStatus();await loadContestRankingV2();
   var founder=byId('contestFounderPanel');if(founder&&role()==='founder'){founder.classList.add('show');await loadContestProjectsForFounder()}
  }catch(e){if(meta)meta.textContent='Yarışma verileri yüklenemedi: '+String(e.message||e);notify(String(e.message||e),'error')}
 }
 async function openContestPage(){if(!user()){notify('Yarışmaya katılmak için giriş yap.','warning');return false}var overlay=ensureContest();openOverlay(overlay);await loadContestPageData();return true}
 function closeContestPage(){closeOverlay(byId('contestPage'))}
 async function confirmContestJoin(){
  try{var result=await cloud('joinContest',{});if(!result||result.success!==true)throw new Error(result&&result.error||'Yarışmaya katılım tamamlanamadı.');notify(result.message||'Yarışmaya katıldın.','success');await loadContestPageData();return true}
  catch(e){notify(String(e.message||e),'error');return false}
 }
 function openContestJoinWarning(){if(!user()){notify('Önce giriş yap.','warning');return false}if(!w.confirm('Bu ayın AETHRION yarışmasına katılmak istiyor musun?'))return false;return confirmContestJoin()}
 function openContestProjectForm(){if(!state.participant){notify('Önce yarışmaya katılmalısın.','warning');return false}var form=byId('contestProjectForm');if(form)form.style.display='block';var name=byId('contestProjectNameInput');if(name)name.focus();return true}
 function closeContestProjectForm(){var form=byId('contestProjectForm');if(form)form.style.display='none'}
 async function submitContestProject(){
  var name=byId('contestProjectNameInput'),code=byId('contestProjectCodeInput'),projectName=name?name.value.trim():'',source=code?code.value.trim():'';
  if(!projectName||!source){notify('Proje adı ve kaynak içeriği gerekli.','warning');return false}
  try{var result=await cloud('createContestProject',{projectName:projectName,code:source});if(!result||result.success!==true)throw new Error(result&&result.error||'Proje gönderilemedi.');notify(result.message||'Projen kurucuya gönderildi.','success');if(name)name.value='';if(code)code.value='';closeContestProjectForm();if(role()==='founder')await loadContestProjectsForFounder();return true}
  catch(e){notify(String(e.message||e),'error');return false}
 }
 async function saveContestScore(projectId,points){
  var value=Number(points);if(!Number.isInteger(value)||value<1||value>10000){notify('Puan 1 ile 10000 arasında olmalı.','warning');return false}
  try{var result=await cloud('scoreContestProject',{projectId:projectId,points:value});notify(result&&result.message||'Puan kaydedildi.','success');await Promise.all([loadContestProjectsForFounder(),loadContestRankingV2()]);return true}
  catch(e){notify(String(e.message||e),'error');return false}
 }
 async function finalizeContest(){
  if(role()!=='founder'){notify('Bu işlem yalnızca kurucu hesabına açık.','warning');return false}
  if(!w.confirm('Yarışmayı tamamlayıp kazanan ödüllerini işlemek istediğine emin misin? Bu işlem geri alınamaz.'))return false;
  try{var result=await cloud('finalizeContest',{});notify(result&&result.message||'Yarışma tamamlandı.','success');await loadContestPageData();return true}
  catch(e){notify(String(e.message||e),'error');return false}
 }
 function reviewContestProject(id){var p=state.projects.find(function(x){return x.id===id});if(!p)return false;notify('Proje kodu değerlendirme kartında görüntüleniyor.','info');return true}
 function openContestScore(id){var card=Array.from((byId('contestProjectsFounderList')||d).querySelectorAll('.ae-mc-project')).find(function(x){return x.querySelector('button')&&x.textContent.includes(id)});if(card){var input=card.querySelector('input');if(input)input.focus()}}
 w.openMarket=openMarket;w.closeMarket=closeMarket;w.loadMarket=loadMarket;w.renderMarketItems=renderMarketItems;w.filterMarket=filterMarket;w.buyMarketProject=buyMarketProject;w.removeFromMarket=removeFromMarket;w.viewMarketProject=function(id){var p=state.market.find(function(x){return x.id===id});if(p)notify(String(p.title||'Proje')+' · '+String(p.description||''),'info')};
 w.openContestPage=openContestPage;w.closeContestPage=closeContestPage;w.loadContestPageData=loadContestPageData;w.loadContestRankingV2=loadContestRankingV2;
 w.openContestJoinWarning=openContestJoinWarning;w.confirmContestJoin=confirmContestJoin;w.openContestProjectForm=openContestProjectForm;w.closeContestProjectForm=closeContestProjectForm;w.submitContestProject=submitContestProject;
 w.loadContestProjectsForFounder=loadContestProjectsForFounder;w.reviewContestProject=reviewContestProject;w.openContestScore=openContestScore;w.saveContestScore=saveContestScore;w.finalizeContest=finalizeContest;
 w.marketItemsCache=state.market;w.contestProjectsFounderCache=state.projects;
 d.addEventListener('keydown',function(e){if(e.key==='Escape'){var m=byId('marketModal');if(m&&m.classList.contains('open'))closeMarket();var c=byId('contestPage');if(c&&c.classList.contains('open'))closeContestPage()}});
})(window,document);

(function(){
'use strict';
var rules=[
  [/\bVizyon\s*2027\b/gi,'AETHRION'],
  [/\bVizyon\s*Al\b/gi,'AETHRION AI'],
  [/\bVizyon\s*AI\b/gi,'AETHRION AI'],
  [/\bV27\s*API\b/gi,'A27 API'],
  [/\bV27\b/g,'A27'],
  [/\bVizyon2027\b/gi,'AETHRION']
];
function brand(text){var out=text;rules.forEach(function(r){out=out.replace(r[0],r[1]);});return out;}
function scan(root){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){
    var p=root.parentElement;
    if(!p||p.closest('script,style,code,pre,textarea,noscript,svg,math'))return;
    var next=brand(root.nodeValue||'');
    if(next!==(root.nodeValue||''))root.nodeValue=next;
    return;
  }
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE&&root.matches('script,style,code,pre,textarea,noscript,svg,math'))return;
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  var nodes=[],n;while((n=walker.nextNode()))nodes.push(n);
  nodes.forEach(function(t){var p=t.parentElement;if(!p||p.closest('script,style,code,pre,textarea,noscript,svg,math'))return;var old=t.nodeValue||'',next=brand(old);if(next!==old)t.nodeValue=next;});
}
function loadLateTheme(){
  if(!document.body||document.body.querySelector('link[data-aethrion-late-theme]'))return;
  var first=Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]')).find(function(l){return (l.getAttribute('href')||'').indexOf('aethrion-experience.css')!==-1;});
  if(first&&first.parentNode)first.parentNode.removeChild(first);
  var link=document.createElement('link');link.rel='stylesheet';link.href='/aethrion-experience.css?v=20261021';link.setAttribute('data-aethrion-late-theme','true');document.body.appendChild(link);
}
function updateFriendlyRoutes(){
  document.querySelectorAll('a[href]').forEach(function(a){
    var raw=a.getAttribute('href');if(!raw)return;
    try{
      var u=new URL(raw,location.href);if(u.origin!==location.origin)return;
      var map={'/vizyon-ai.html':'/aethrion-ai.html','/vizyon-al.html':'/aethrion-assistant.html','/vizyonekibi.html':'/aethrion-ekibi.html'};
      if(map[u.pathname])a.setAttribute('href',map[u.pathname]+u.search+u.hash);
    }catch(e){}
  });
}
function ensurePolicyLinks(){
  var footer=document.querySelector('footer,.site-footer,.footer');
  if(!footer||footer.querySelector('[data-ae-policy-nav]'))return;
  var known=footer.querySelectorAll('a[href*="gizlilik"],a[href*="kullanici-sozlesmesi"],a[href*="kvkk"],a[href*="api-kullanim"]');
  if(known.length>=4)return;
  var nav=document.createElement('nav');nav.className='ae-legal-nav';nav.setAttribute('aria-label','Yasal ve güvenlik belgeleri');nav.setAttribute('data-ae-policy-nav','');
  nav.innerHTML='<div><strong>Yasal ve güvenlik belgeleri</strong><small>Gizlilik, hesap, API ve hizmet koşullarını inceleyin.</small></div><div class="ae-legal-links">'+
    '<a href="/gizlilik.html">Gizlilik Politikası</a><a href="/kullanici-sozlesmesi.html">Kullanıcı Sözleşmesi</a><a href="/cerez-politikasi.html">Çerez Politikası</a><a href="/kvkk-aydinlatma.html">KVKK Aydınlatma</a><a href="/api-kullanim-kosullari.html">A27 API Koşulları</a><a href="/api-belgelendirme.html">API Belgeleri</a><a href="/ai-kullanim-politikasi.html">AI Kullanım Politikası</a><a href="/guvenlik-politikasi.html">Güvenlik Politikası</a><a href="/hesap-ve-oturum-guvenligi.html">Hesap ve Oturum Güvenliği</a><a href="/veri-saklama-silme-politikasi.html">Veri Saklama ve Silme</a><a href="/icerik-ve-fikri-mulkiyet.html">İçerik ve Fikri Mülkiyet</a><a href="/kabul-edilebilir-kullanim.html">Kabul Edilebilir Kullanım</a><a href="/ucuncu-taraf-hizmetler.html">Üçüncü Taraf Hizmetler</a><a href="/erisilebilirlik.html">Erişilebilirlik</a><a href="/sorumlu-aciklama.html">Sorumlu Açıklama</a><a href="/iletisim-ve-basvuru.html">Destek ve Başvuru</a></div>';
  footer.appendChild(nav);
}
function polish(){
  loadLateTheme();updateFriendlyRoutes();ensurePolicyLinks();
  if(document.title)document.title=brand(document.title);
  var theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.setAttribute('content','#0b1018');
  document.querySelectorAll('[aria-label],[title],[alt]').forEach(function(el){
    ['aria-label','title','alt'].forEach(function(k){var v=el.getAttribute(k);if(v){var n=brand(v);if(n!==v)el.setAttribute(k,n);}});
  });
  scan(document.body);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',polish,{once:true});else polish();
if(document.body&&window.MutationObserver){
  var observer=new MutationObserver(function(records){
    records.forEach(function(r){Array.prototype.forEach.call(r.addedNodes||[],function(node){if(node.nodeType===Node.TEXT_NODE)scan(node);else if(node.nodeType===Node.ELEMENT_NODE)scan(node);});});
  });
  observer.observe(document.body,{subtree:true,childList:true});
}
})();
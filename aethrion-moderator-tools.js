/* AETHRION Moderator Tools — authenticated clip records backed by Cloud Code RBAC. */
(function (w, d) {
  'use strict';
  if (w.__aethrionModeratorToolsReady) return;
  w.__aethrionModeratorToolsReady = true;
  function byId(id) { return d.getElementById(id); }
  function notify(message, type) {
    if (typeof w.showNotification === 'function') w.showNotification(message, type || 'info');
    else console.info('[AETHRION moderator]', message);
  }
  function currentRole() {
    try {
      var u = w.Parse && w.Parse.User && w.Parse.User.current();
      return String(u && u.get('role') || '').toLowerCase();
    } catch (e) { return ''; }
  }
  function cloud(name, params) {
    if (!w.Parse || !w.Parse.Cloud || typeof w.Parse.Cloud.run !== 'function') return Promise.reject(new Error('Back4App bağlantısı hazır değil.'));
    return w.Parse.Cloud.run(name, params || {});
  }
  function node(tag, cls, value) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (value !== undefined) n.textContent = String(value);
    return n;
  }
  function ensureModal() {
    var modal = byId('moderatorVideoToolModal');
    if (modal) return modal;
    modal = node('div', 'modal-overlay');
    modal.id = 'moderatorVideoToolModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'moderatorVideoToolTitle');
    modal.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,8,18,.82);backdrop-filter:blur(10px);overflow:auto';
    var panel = node('section', 'modal');
    panel.style.cssText = 'width:min(900px,100%);max-height:calc(100dvh - 36px);overflow:auto;padding:24px;border:1px solid rgba(128,164,205,.3);border-radius:20px;background:#101827;color:#e9f1fb;box-shadow:0 28px 90px rgba(0,0,0,.5)';
    var header = node('div', '');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px';
    var title = node('h2', '', '🎬 Moderatör · Video Kesit Aracı');
    title.id = 'moderatorVideoToolTitle';
    title.style.cssText = 'margin:0;font-size:20px;font-weight:800';
    var close = node('button', 'btn-secondary btn-sm', '✕ Kapat');
    close.type = 'button';
    close.addEventListener('click', w.closeModeratorVideoTool);
    header.append(title, close);
    var intro = node('p', '', 'Video bağlantısını, başlangıç/bitiş saniyelerini ve analiz notunu kaydet. Sunucu rol yetkisini ayrıca doğrular.');
    intro.style.cssText = 'margin:0 0 18px;color:#9fb2ca;line-height:1.7;font-size:13px';
    var form = node('form', '');
    form.id = 'moderatorVideoClipForm';
    form.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px';
    function field(labelText, id, type, placeholder, required) {
      var wrap = node('label', '');
      wrap.style.cssText = 'display:grid;gap:7px;color:#b8c8da;font-size:12px;font-weight:700';
      wrap.appendChild(node('span', '', labelText));
      var input = type === 'textarea' ? node('textarea', '') : node('input', '');
      input.id = id;
      input.name = id;
      if (type !== 'textarea') input.type = type;
      input.placeholder = placeholder || '';
      input.required = !!required;
      input.style.cssText = 'width:100%;box-sizing:border-box;min-height:' + (type === 'textarea' ? '92px' : '42px') + ';padding:11px 12px;border:1px solid rgba(148,170,200,.25);border-radius:10px;background:#0b1320;color:#eef5ff;font:500 13px/1.5 inherit;outline:none';
      wrap.appendChild(input);
      return wrap;
    }
    var url = field('Video URL', 'moderatorClipUrl', 'url', 'https://…', true);
    url.style.gridColumn = '1 / -1';
    var start = field('Başlangıç (saniye)', 'moderatorClipStart', 'number', '0', true);
    var end = field('Bitiş (saniye)', 'moderatorClipEnd', 'number', '30', true);
    var note = field('Kesit notu / tavsiye', 'moderatorClipNote', 'textarea', 'Bu kesit neden paylaşılıyor?', true);
    note.style.gridColumn = '1 / -1';
    var analysis = field('Analiz (isteğe bağlı)', 'moderatorClipAnalysis', 'textarea', 'Kısa analiz ve öneriler…', false);
    analysis.style.gridColumn = '1 / -1';
    var submit = node('button', 'btn-primary', '🎬 Kesit Kaydını Paylaş');
    submit.id = 'moderatorClipSubmit';
    submit.type = 'submit';
    submit.style.cssText = 'min-height:44px;grid-column:1 / -1';
    var status = node('p', '');
    status.id = 'moderatorClipStatus';
    status.setAttribute('role', 'status');
    status.style.cssText = 'grid-column:1 / -1;margin:0;color:#91a8c4;font-size:12px';
    form.append(url, start, end, note, analysis, submit, status);
    var divider = node('div', '');
    divider.style.cssText = 'height:1px;background:rgba(148,170,200,.18);margin:22px 0';
    var listTitle = node('h3', '', 'Son paylaşılan kesit kayıtları');
    listTitle.style.cssText = 'margin:0 0 12px;font-size:15px';
    var list = node('div', '');
    list.id = 'moderatorVideoClipList';
    list.style.cssText = 'display:grid;gap:10px';
    form.addEventListener('submit', submitClip);
    panel.append(header, intro, form, divider, listTitle, list);
    modal.appendChild(panel);
    modal.addEventListener('click', function (event) { if (event.target === modal) w.closeModeratorVideoTool(); });
    d.body.appendChild(modal);
    return modal;
  }
  function renderClips(clips) {
    var list = byId('moderatorVideoClipList');
    if (!list) return;
    list.replaceChildren();
    if (!clips || !clips.length) {
      list.appendChild(node('p', '', 'Henüz paylaşılan kesit kaydı yok.'));
      return;
    }
    clips.forEach(function (clip) {
      var card = node('article', '');
      card.style.cssText = 'padding:13px;border:1px solid rgba(148,170,200,.18);border-radius:12px;background:rgba(255,255,255,.035)';
      var top = node('div', '', (clip.moderator_name || 'Moderatör') + ' · ' + String(clip.start_time) + '–' + String(clip.end_time) + ' sn');
      top.style.cssText = 'font-size:12px;font-weight:800;color:#dce9f8';
      var note = node('p', '', clip.note || '');
      note.style.cssText = 'margin:8px 0;color:#aebfd3;font-size:12px;line-height:1.6';
      var link = node('a', '', 'Kaynak videoyu aç ↗');
      link.href = clip.video_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.cssText = 'color:#8ec8ff;font-size:12px;font-weight:700';
      card.append(top, note, link);
      if (clip.analysis) card.appendChild(node('p', '', 'Analiz: ' + clip.analysis));
      list.appendChild(card);
    });
  }
  w.loadModeratorVideoClips = function () {
    var list = byId('moderatorVideoClipList');
    if (list) { list.replaceChildren(); list.appendChild(node('p', '', 'Kesit kayıtları yükleniyor…')); }
    return cloud('getVideoClips', { limit: 50 }).then(function (result) {
      renderClips(result && result.clips || []);
      return result;
    }).catch(function (error) {
      if (list) { list.replaceChildren(); list.appendChild(node('p', '', error.message || 'Kesit kayıtları yüklenemedi.')); }
      return null;
    });
  };
  async function submitClip(event) {
    event.preventDefault();
    var url = byId('moderatorClipUrl').value.trim();
    var start = Number(byId('moderatorClipStart').value);
    var end = Number(byId('moderatorClipEnd').value);
    var note = byId('moderatorClipNote').value.trim();
    var analysis = byId('moderatorClipAnalysis').value.trim();
    var status = byId('moderatorClipStatus'), button = byId('moderatorClipSubmit');
    if (!/^https?:\/\//i.test(url) || !isFinite(start) || !isFinite(end) || start < 0 || end <= start || !note) {
      if (status) status.textContent = 'Geçerli bir HTTPS/HTTP video URL’si, saniye aralığı ve kesit notu girin.';
      return false;
    }
    if (button) { button.disabled = true; button.textContent = 'Kaydediliyor…'; }
    if (status) status.textContent = 'Sunucu yetkileri doğrulanıyor ve kesit kaydı oluşturuluyor…';
    try {
      var result = await cloud('createVideoClip', { videoUrl: url, startTime: start, endTime: end, note: note, analysis: analysis });
      if (status) status.textContent = result && result.message || 'Kesit kaydı paylaşıldı.';
      byId('moderatorVideoClipForm').reset();
      await w.loadModeratorVideoClips();
      notify(result && result.message || 'Kesit kaydı paylaşıldı.', 'success');
      return true;
    } catch (error) {
      if (status) status.textContent = error.message || 'Kesit kaydı oluşturulamadı.';
      notify(error.message || 'Kesit kaydı oluşturulamadı.', 'error');
      return false;
    } finally {
      if (button) { button.disabled = false; button.textContent = '🎬 Kesit Kaydını Paylaş'; }
    }
  }
  w.openModeratorVideoTool = function () {
    var role = currentRole();
    if (['moderator', 'admin', 'founder'].indexOf(role) < 0) {
      notify('Bu araç yalnızca moderatör, admin veya kurucu hesaplarına açıktır.', 'warning');
      return false;
    }
    var modal = ensureModal();
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.setAttribute('aria-hidden', 'false');
    d.body.style.overflow = 'hidden';
    w.loadModeratorVideoClips();
    return true;
  };
  w.closeModeratorVideoTool = function () {
    var modal = byId('moderatorVideoToolModal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.setAttribute('aria-hidden', 'true');
    }
    d.body.style.overflow = '';
  };
})(window, document);

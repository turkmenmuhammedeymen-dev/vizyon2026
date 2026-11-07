/* AETHRION — Yan menüdeki özellikler için sayfa içi paneller.
 * Eski sitede paneli olmayan / paneli kaybolan özellikler (3D Studio, Projelerim, Takım, Akademi, Mağaza,
 * Görevler, Gelen Kutusu, Yarışma, Yorumlar, Kod Editörü, API Anahtarı, Belgeler) burada yeniden tasarlandı.
 * Hiçbiri başka bir sayfaya / Vercel bağlantısına gitmez; panel menünün yanında açılır.
 * Router: aethrion-panels.js  (window.__aethrionPanels API'sini sağlar)
 */
(function (w, d) {
  'use strict';
  if (w.__aethrionStudioPanels) return;
  w.__aethrionStudioPanels = true;

  function boot() {
    var P = w.__aethrionPanels;
    if (!P) return false;
    var esc = P.esc, $ = P.$, $$ = P.$$;

    /* ---------- yardımcılar ---------- */
    function call(name, params) { return P.cloud(name, params || {}); }
    function note(m, t) { P.note(m, t || 'success'); }
    function err(m) { P.note(m, 'error'); }
    function user() { return P.curUser(); }
    function msgOf(e) { return (e && (e.message || e.error)) || String(e || 'Bilinmeyen hata'); }
    function fdate(v) { try { var x = new Date(v); return isNaN(x) ? '' : x.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }); } catch (_) { return ''; } }
    function open(label, m, desc, extra) {
      var st = P.stage();
      P.setHead(st, label, desc || (m && m[3]) || '', extra || '');
      var body = $('.aep-body', st);
      body.className = 'aep-body';
      st.classList.add('on');
      return body;
    }
    function loginCard(body, what) {
      body.innerHTML = '<div class="aep-card"><h3>🔒 Giriş gerekli</h3><p class="aep-muted">' + esc(what || 'Bu paneli kullanmak') +
        ' için hesabına giriş yapmalısın. Giriş yaptıktan sonra bu özelliği yan menüden tekrar seç.</p></div>';
    }
    function tabs(body, list, first) {
      body.innerHTML = '<div class="aes-wrap"><div class="aes-tabs" role="tablist"></div><div class="aes-pane"></div></div>';
      var bar = $('.aes-tabs', body), pane = $('.aes-pane', body), cur = null;
      list.forEach(function (t) {
        var b = d.createElement('button');
        b.type = 'button'; b.className = 'aes-tab'; b.textContent = t.label; b.setAttribute('role', 'tab'); b.dataset.id = t.id;
        b.addEventListener('click', function () { show(t.id); });
        bar.appendChild(b);
      });
      function show(id) {
        var t = list.filter(function (x) { return x.id === id; })[0]; if (!t) return;
        cur = id;
        $$('.aes-tab', bar).forEach(function (b) { b.classList.toggle('on', b.dataset.id === id); b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'); });
        pane.innerHTML = '';
        try { t.render(pane); } catch (e) { pane.innerHTML = '<div class="aep-card"><p class="aep-muted">Panel açılamadı: ' + esc(msgOf(e)) + '</p></div>'; }
      }
      show(first || list[0].id);
      return { show: show, current: function () { return cur; } };
    }
    function empty(t) { return '<p class="aep-muted aes-empty">' + esc(t) + '</p>'; }
    function busyBtn(btn, p) {
      if (btn) btn.disabled = true;
      return p.then(function (r) { if (btn) btn.disabled = false; return r; }, function (e) { if (btn) btn.disabled = false; throw e; });
    }

    /* ---------- stiller ---------- */
    function styles() {
      if ($('#aesStyles')) return;
      var S = '#aePanelStage ', s = d.createElement('style'); s.id = 'aesStyles';
      s.textContent = [
        S + '.aes-wrap{max-width:1080px;margin:0 auto}',
        S + '.aes-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}',
        S + '.aes-tab{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#dbe7f5;border-radius:999px;padding:8px 16px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}',
        S + '.aes-tab.on{background:linear-gradient(135deg,#2c64d8,#3d86ff);border-color:transparent;color:#fff}',
        S + '.aes-pane>.aep-card{margin-bottom:16px;max-width:none}',
        S + '.aes-empty{padding:14px;text-align:center}',
        S + '.aes-two{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px;align-items:start}',
        S + '.aes-3col{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}',
        '@media(max-width:900px){' + S + '.aes-two,' + S + '.aes-3col{grid-template-columns:1fr}}',
        S + '.aes-field{display:flex;flex-direction:column;gap:4px;margin:8px 0;font:600 13px Inter,system-ui,sans-serif;color:#35506b}',
        S + '.aes-field input,' + S + '.aes-field select,' + S + '.aes-field textarea{padding:10px 12px;border:1px solid #c9d6e3;border-radius:10px;font:500 14px Inter,system-ui,sans-serif;background:#f7f9fc;color:#172b43;box-sizing:border-box;width:100%}',
        S + '.aes-stat{display:flex;flex-direction:column;gap:2px;padding:14px;border-radius:14px;background:#f2f6fb;border:1px solid #dbe5ef}',
        S + '.aes-stat b{font:800 22px Inter,system-ui,sans-serif;color:#10243a}',
        S + '.aes-stat span{font:600 12px Inter,system-ui,sans-serif;color:#5d738b}',
        S + '.aes-pill{display:inline-block;padding:2px 9px;border-radius:999px;background:#e6eefb;color:#2459a8;font:700 11px Inter,system-ui,sans-serif}',
        S + '.aes-pill.ok{background:#dff5e7;color:#1c7a3d}',
        S + '.aes-pill.bad{background:#fde6e6;color:#b42424}',
        S + '.aes-chat{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow:auto;padding:10px;border:1px solid #dbe5ef;border-radius:12px;background:#f9fbfe}',
        S + '.aes-msg{padding:8px 11px;border-radius:12px;background:#fff;border:1px solid #e1e9f2;font:500 14px/1.45 Inter,system-ui,sans-serif;color:#172b43;overflow-wrap:anywhere}',
        S + '.aes-msg.me{background:#e8f0ff;border-color:#c7d9ff;align-self:flex-end}',
        S + '.aes-msg small{display:block;font:600 11px Inter,system-ui,sans-serif;color:#6a8097;margin-bottom:2px}',
        S + '.aes-code{width:100%;min-height:300px;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid #1d3a5c;background:#0f1b2d;color:#d8e6f6;font:500 13px/1.55 ui-monospace,Menlo,Consolas,monospace;resize:vertical;tab-size:2}',
        S + '.aes-frame{width:100%;height:300px;border:1px solid #dbe5ef;border-radius:12px;background:#fff}',
        S + '.aes-doc h1,' + S + '.aes-doc h2,' + S + '.aes-doc h3{color:#10243a;margin:16px 0 6px;font-family:Inter,system-ui,sans-serif}',
        S + '.aes-doc p,' + S + '.aes-doc li{color:#34495f;font:500 14px/1.6 Inter,system-ui,sans-serif}',
        S + '.aes-doc pre,' + S + '.aes-doc code{background:#0f1b2d;color:#d8e6f6;border-radius:8px;padding:2px 6px;font:500 13px ui-monospace,Menlo,Consolas,monospace}',
        S + '.aes-doc pre{padding:12px;overflow:auto}',
        /* 3D Studio */
        S + '.a3d{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px;max-width:1280px;margin:0 auto}',
        '@media(max-width:1100px){' + S + '.a3d{grid-template-columns:1fr}}',
        S + '.a3d-main{display:flex;flex-direction:column;gap:12px;min-width:0}',
        S + '.a3d-view{position:relative;height:min(58vh,520px);min-height:300px;border-radius:16px;overflow:hidden;background:radial-gradient(circle at 50% 30%,#1b2c4a,#0a1220);border:1px solid rgba(255,255,255,.12)}',
        S + '.a3d-view canvas{display:block;width:100%;height:100%}',
        S + '.a3d-hud{position:absolute;left:12px;bottom:10px;font:600 12px Inter,system-ui,sans-serif;color:#9db6cf;pointer-events:none}',
        S + '.a3d-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
        S + '.a3d-bar textarea{flex:1 1 280px;min-height:46px;max-height:120px;padding:11px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.2)!important;background:rgba(255,255,255,.08)!important;color:#fff!important;font:500 14px Inter,system-ui,sans-serif;resize:vertical}',
        S + '.a3d-bar textarea::placeholder{color:#8ea4bd}',
        S + '.a3d-shapes{display:flex;gap:6px;flex-wrap:wrap;max-height:190px;overflow:auto;padding:6px;border:1px solid rgba(255,255,255,.1);border-radius:10px}',
        S + '.a3d-shape-search{flex:1 1 100%;min-width:0;padding:10px 12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:#0b1424;color:#eef4fb;font:500 13px Inter,system-ui,sans-serif}',
        S + '.a3d-side{display:flex;flex-direction:column;gap:12px;min-width:0}',
        S + '.a3d-box{border:1px solid rgba(255,255,255,.12);background:#101a2e;border-radius:14px;padding:12px}',
        S + '.a3d-box h4{margin:0 0 8px;font:800 14px Inter,system-ui,sans-serif;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:8px}',
        S + '.a3d-box .aep-list{margin:0}',
        S + '.a3d-box .aep-item{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);padding:8px 10px}',
        S + '.a3d-box .aep-item-name{color:#e8eef7;font-size:13px}',
        S + '.a3d-box .aep-btn{padding:5px 9px;font-size:12px}',
        S + '.a3d-box .aep-muted{color:#94a8c2}',
        S + '.a3d-concept{width:100%;border-radius:10px;margin-top:6px}',
        S + '.a3d input[type=color]{width:42px;height:38px;padding:2px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:transparent;cursor:pointer}'
      ].join('\n');
      (d.head || d.documentElement).appendChild(s);
    }

    /* ======================================================================
     *  PROJELER (3D Studio yan kutuları + Projelerim paneli ortak kullanır)
     * ==================================================================== */
    var FILTERS = {
      active: { label: 'Projeler', archived: false, trashed: false, empty: 'Henüz proje yok. Yeni bir proje oluştur.' },
      fav: { label: 'Favoriler', archived: false, trashed: false, fav: true, empty: 'Favori projen yok. Bir projeyi ☆ ile favorile.' },
      arch: { label: 'Arşiv', archived: true, trashed: false, empty: 'Arşivde proje yok.' },
      trash: { label: 'Çöp', archived: false, trashed: true, empty: 'Çöp kutusu boş.' }
    };
    function projectQuery(f) {
      var u = user(); if (!w.Parse || !u) throw new Error('Projeleri görmek için giriş yapmalısın.');
      var q = new w.Parse.Query('Project');
      q.equalTo('user_email', u.get('email'));
      /* Legacy Project rows may not have is_archived/is_trashed fields yet.
         Fetch the user's bounded set and filter in memory so old projects remain visible. */
      q.descending('createdAt'); q.limit(100);
      return q;
    }
    function typeIcon(t) { return t === '3D' ? '🧊' : t === 'Kod' ? '⌨️' : t === 'Görsel' ? '🖼️' : '📄'; }
    /* list: kapsayıcı; filterKey: FILTERS anahtarı; opts: {compact, onOpen(project), onChange()} */
    function renderProjects(list, filterKey, opts) {
      opts = opts || {};
      var f = FILTERS[filterKey];
      list.innerHTML = '<p class="aep-muted">Yükleniyor…</p>';
      var q; try { q = projectQuery(f); } catch (e) { list.innerHTML = empty(msgOf(e)); return; }
      q.find().then(function (rows) {
        rows = rows.filter(function (p) {
          var archived = p.get('is_archived') === true;
          var trashed = p.get('is_trashed') === true;
          var favorite = p.get('is_favorite') === true;
          if (filterKey === 'trash') return trashed;
          if (filterKey === 'arch') return archived && !trashed;
          if (filterKey === 'fav') return favorite && !archived && !trashed;
          return !archived && !trashed;
        });
        if (!rows.length) { list.innerHTML = empty(f.empty); return; }
        list.innerHTML = rows.map(function (p) {
          var t = p.get('type') || '', acts = '';
          if (filterKey === 'trash') acts = '<button type="button" class="aep-btn" data-a="restore">↩ Geri al</button><button type="button" class="aep-btn" data-a="purge">Sil</button>';
          else {
            acts = '<button type="button" class="aep-btn" data-a="open">Aç</button>' +
              '<button type="button" class="aep-btn" data-a="fav" title="Favori">' + (p.get('is_favorite') ? '★' : '☆') + '</button>' +
              (filterKey === 'arch' ? '<button type="button" class="aep-btn" data-a="unarch" title="Arşivden çıkar">↩</button>' : '<button type="button" class="aep-btn" data-a="arch" title="Arşivle">🗄️</button>') +
              '<button type="button" class="aep-btn" data-a="rename" title="Yeniden adlandır">✏️</button>' +
              '<button type="button" class="aep-btn" data-a="del" title="Çöpe taşı">🗑️</button>';
          }
          return '<div class="aep-item" data-id="' + esc(p.id) + '"><span class="aep-item-name">' + typeIcon(t) + ' ' +
            esc(String(p.get('name') || 'İsimsiz proje').slice(0, 60)) + (opts.compact ? '' : ' <span class="aes-pill">' + esc(t || 'Proje') + '</span>') +
            '</span><span class="aep-item-act">' + acts + '</span></div>';
        }).join('');
        list._rows = rows;
      }, function (e) { list.innerHTML = empty('Projeler yüklenemedi: ' + msgOf(e)); });
      if (list._bound) return; list._bound = true;
      list.addEventListener('click', function (ev) {
        var b = ev.target.closest('button[data-a]'); if (!b) return;
        var item = b.closest('.aep-item'), id = item.getAttribute('data-id'), a = b.getAttribute('data-a');
        var row = (list._rows || []).filter(function (r) { return r.id === id; })[0];
        function done(p) { return p.then(function () { if (opts.onChange) opts.onChange(); else renderProjects(list, filterKey, opts); }, function (e) { err('İşlem başarısız: ' + msgOf(e)); }); }
        if (a === 'open') { if (opts.onOpen && row) opts.onOpen(row); else P.openFeature((row && row.get('type') === 'Kod') ? 'Kod Editörü' : '3D Studio'); }
        else if (a === 'fav') done(call('favoriteProject', { projectId: id }));
        else if (a === 'arch') done(call('archiveProject', { projectId: id }));
        else if (a === 'unarch') done(call('unarchiveProject', { projectId: id }));
        else if (a === 'restore') done(call('restoreProject', { projectId: id }));
        else if (a === 'del') { if (w.confirm('Proje çöp kutusuna taşınsın mı?')) done(call('trashProject', { projectId: id })); }
        else if (a === 'purge') { if (w.confirm('Proje kalıcı olarak silinsin mi? Bu geri alınamaz.')) done(call('deletePermanently', { projectId: id })); }
        else if (a === 'rename') {
          var nn = w.prompt('Yeni proje adı:', row ? row.get('name') : ''); if (!nn || !nn.trim()) return;
          done(call('editProject', { projectId: id, name: nn.trim(), content: row ? row.get('content') : undefined }));
        }
      });
    }

    function buildProjects(label, m) {
      styles();
      var body = open(label, m, 'Projelerin, favorilerin, arşivin ve çöp kutun');
      if (!user()) { loginCard(body, 'Projelerini görmek'); return true; }
      var T = tabs(body, [
        { id: 'active', label: '▤ Projeler', render: function (p) { projectPane(p, 'active'); } },
        { id: 'fav', label: '★ Favoriler', render: function (p) { projectPane(p, 'fav'); } },
        { id: 'arch', label: '🗄️ Arşiv', render: function (p) { projectPane(p, 'arch'); } },
        { id: 'trash', label: '🗑️ Çöp', render: function (p) { projectPane(p, 'trash'); } },
        { id: 'new', label: '＋ Yeni proje', render: newProjectPane },
        { id: 'req', label: '✉ Proje talepleri', render: requestsPane }
      ]);
      function projectPane(p, key) {
        p.innerHTML = '<div class="aep-card"><h3>' + esc(FILTERS[key].label) + '</h3><div class="aep-list"></div></div>';
        renderProjects($('.aep-list', p), key, { onChange: function () { T.show(key); } });
      }
      function newProjectPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>＋ Yeni proje</h3>' +
          '<label class="aes-field">Proje adı<input id="aesNpName" maxlength="60" placeholder="Örn. Uzay istasyonu"></label>' +
          '<label class="aes-field">Proje türü<select id="aesNpType"><option value="3D">🧊 3D Model</option><option value="Kod">⌨️ Kod</option><option value="Görsel">🖼️ Görsel</option><option value="Belge">📄 Belge</option></select></label>' +
          '<label class="aes-field">Kısa not (isteğe bağlı)<textarea id="aesNpNote" rows="3" maxlength="500"></textarea></label>' +
          '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesNpGo">Projeyi oluştur</button></div></div>';
        $('#aesNpGo', p).addEventListener('click', function () {
          var name = $('#aesNpName', p).value.trim(), type = $('#aesNpType', p).value;
          if (!name) { err('Lütfen proje adı yaz.'); return; }
          busyBtn(this, call('saveProject', { name: name, type: type, content: JSON.stringify({ note: $('#aesNpNote', p).value.trim(), created: Date.now() }) }))
            .then(function () { note('Proje oluşturuldu.'); T.show('active'); }, function (e) { err(msgOf(e)); });
        });
      }
      function requestsPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>✉ Proje talebi gönder</h3><p class="aep-muted">Yapılmasını istediğin bir proje için talep oluştur; takım ve yetkililer görür.</p>' +
          '<label class="aes-field">Başlık<input id="aesRqTitle" maxlength="80"></label>' +
          '<label class="aes-field">Tür<select id="aesRqType"><option value="3D">🧊 3D Model</option><option value="Kod">⌨️ Kod / Web</option><option value="Görsel">🖼️ Görsel</option></select></label>' +
          '<label class="aes-field">Açıklama<textarea id="aesRqDesc" rows="4" maxlength="1500"></textarea></label>' +
          '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesRqGo">Talebi gönder</button></div></div>' +
          '<div class="aep-card"><h3>Taleplerim</h3><div class="aep-list" id="aesRqList"><p class="aep-muted">Yükleniyor…</p></div></div>';
        function load() {
          var q = new w.Parse.Query('ProjectRequest'); q.equalTo('user_email', user().get('email')); q.descending('createdAt'); q.limit(50);
          q.find().then(function (rows) {
            $('#aesRqList', p).innerHTML = rows.length ? rows.map(function (r) {
              var st = r.get('status') || 'pending';
              return '<div class="aep-item"><span class="aep-item-name">' + esc(r.get('title') || 'Talep') + ' <span class="aes-pill">' + esc(r.get('type') || '') + '</span></span><span class="aes-pill ' + (st === 'accepted' ? 'ok' : st === 'rejected' ? 'bad' : '') + '">' + esc(st) + '</span></div>';
            }).join('') : empty('Henüz proje talebin yok.');
          }, function (e) { $('#aesRqList', p).innerHTML = empty('Yüklenemedi: ' + msgOf(e)); });
        }
        $('#aesRqGo', p).addEventListener('click', function () {
          var t = $('#aesRqTitle', p).value.trim(), de = $('#aesRqDesc', p).value.trim();
          if (!t || !de) { err('Başlık ve açıklama gerekli.'); return; }
          busyBtn(this, call('createProjectRequest', { title: t, type: $('#aesRqType', p).value, description: de }))
            .then(function (r) { note((r && r.message) || 'Talep gönderildi.'); $('#aesRqTitle', p).value = ''; $('#aesRqDesc', p).value = ''; load(); }, function (e) { err(msgOf(e)); });
        });
        load();
      }
      return true;
    }

    /* ======================================================================
     *  YETKİLİ PROJE TALEPLERİ — Moderatör / Admin / Kurucu
     * ==================================================================== */
    function buildStaffProjectRequests(label, m) {
      styles();
      var body = open(label, m, 'Sana atanmış proje taleplerini incele, kabul et, reddet veya devret');
      var current = user();
      if (!current) { loginCard(body, 'Proje taleplerini yönetmek'); return true; }
      var role = String(current.get('role') || '').toLowerCase();
      if (['admin', 'founder', 'moderator'].indexOf(role) === -1) {
        body.innerHTML = '<div class="aep-card"><h3>🔒 Yetkili erişimi gerekli</h3><p class="aep-muted">Bu alan yalnızca Moderatör, Admin ve Kurucu hesaplarına açıktır.</p></div>';
        return true;
      }
      body.innerHTML =
        '<div class="aep-card"><div class="aep-row" style="justify-content:space-between"><div><h3>📨 Atanmış proje talepleri</h3><p class="aep-muted">Talepler önce moderatörlere yönlendirilir. Moderatör yoksa Admin ve Kuruculara iletilir. İlk kabul eden talebi üstlenir.</p></div><button type="button" class="aep-btn" id="aesStaffReqRefresh">↻ Yenile</button></div>' +
        '<div class="aep-list" id="aesStaffReqList"><p class="aep-muted">Talepler yükleniyor…</p></div></div>';

      var host = $('#aesStaffReqList', body);
      function getProjects() {
        if (!w.Parse || !w.Parse.Query) return Promise.resolve([]);
        var q = new w.Parse.Query('Project');
        q.equalTo('user_email', current.get('email'));
        q.descending('createdAt');
        q.limit(100);
        return q.find().then(function (rows) {
          return rows.filter(function (project) { return project.get('is_trashed') !== true && project.get('is_archived') !== true; });
        }).catch(function () { return []; });
      }
      function button(text, action, requestId, projectSelect) {
        var b = d.createElement('button');
        b.type = 'button'; b.className = 'aep-btn'; b.textContent = text;
        b.addEventListener('click', function () {
          var params = { requestId: requestId, action: action };
          if (action === 'send') {
            params.projectId = projectSelect && projectSelect.value;
            if (!params.projectId) { err('Önce göndereceğin tamamlanmış projeyi seç.'); return; }
          }
          busyBtn(b, call('handleProjectRequest', params)).then(function (r) {
            note((r && r.message) || 'İşlem tamamlandı.');
            load();
          }, function (e) { err(msgOf(e)); });
        });
        return b;
      }
      function load() {
        host.textContent = 'Proje talepleri yükleniyor…';
        Promise.all([call('getInboxItems'), getProjects()]).then(function (values) {
          var all = Array.isArray(values[0]) ? values[0] : [];
          var projects = Array.isArray(values[1]) ? values[1] : [];
          var items = all.filter(function (x) {
            var status = String(x.status || 'pending').toLowerCase();
            return x.type === 'project_request' && ['pending', 'accepted'].indexOf(status) !== -1;
          });
          host.replaceChildren();
          if (!items.length) {
            host.textContent = role === 'moderator'
              ? 'Şu anda sana atanmış bekleyen proje talebi yok.'
              : 'Şu anda hesabına atanmış proje talebi yok. Aktif moderatör varsa talepler önce moderatörlere gider.';
            return;
          }
          items.forEach(function (item) {
            var card = d.createElement('article'); card.className = 'aep-item'; card.style.display = 'block';
            var title = d.createElement('h4'); title.className = 'aep-item-name'; title.textContent = item.project_title || 'İsimsiz proje talebi';
            var meta = d.createElement('p'); meta.className = 'aep-muted';
            meta.textContent = 'Tür: ' + (item.project_type || 'Belirtilmedi') + ' · Gönderen: ' + (item.sender_email || 'Bilinmiyor');
            var desc = d.createElement('p'); desc.className = 'aep-muted'; desc.textContent = item.project_description || item.message || 'Açıklama bulunmuyor.';
            var status = d.createElement('span'); status.className = 'aes-pill'; status.textContent = String(item.status || 'pending').toUpperCase();
            var actions = d.createElement('div'); actions.className = 'aep-row';
            card.appendChild(title); card.appendChild(meta); card.appendChild(desc); card.appendChild(status); card.appendChild(actions);
            if (String(item.status || 'pending').toLowerCase() === 'pending') {
              actions.appendChild(button('✓ Kabul et', 'accept', item.request_id));
              actions.appendChild(button('Reddet', 'reject', item.request_id));
              actions.appendChild(button('↗ Devret', 'delegate', item.request_id));
            } else {
              var select = d.createElement('select'); select.className = 'aep-input'; select.style.flex = '1';
              var emptyOption = d.createElement('option'); emptyOption.value = ''; emptyOption.textContent = 'Tamamlanan projeyi seç…'; select.appendChild(emptyOption);
              projects.forEach(function (project) {
                var opt = d.createElement('option'); opt.value = project.id; opt.textContent = project.get('name') || project.get('title') || 'İsimsiz proje'; select.appendChild(opt);
              });
              actions.appendChild(select);
              actions.appendChild(button('Projeyi talep edene gönder', 'send', item.request_id, select));
            }
            host.appendChild(card);
          });
        }).catch(function (e) {
          host.textContent = 'Proje talepleri yüklenemedi: ' + msgOf(e);
        });
      }
      $('#aesStaffReqRefresh', body).addEventListener('click', load);
      load();
      return true;
    }

    /* ======================================================================
     *  SAVAŞ MODU + ÇOKLU AI
     * ==================================================================== */
    function buildBattlePanel(label, m) {
      styles();
      var body = open(label, m, 'İki modeli karşılaştır veya aynı soruyu dört farklı AI sağlayıcısına yönelt');
      if (!user()) { loginCard(body, 'Savaş Modu ve Çoklu AI kullanmak'); return true; }
      var modelNames = ['Groq', 'DeepSeek', 'OpenAI', 'OpenRouter', 'Cohere', 'Cerebras', 'Gemini', 'DeepInfra'];
      tabs(body, [
        { id: 'battle', label: '⚔️ Savaş Modu', render: battlePane },
        { id: 'multi', label: '🧠 Çoklu AI', render: multiPane }
      ]);
      function battlePane(p) {
        p.innerHTML = '<div class="aep-card"><h3>⚔️ AI vs AI</h3><label class="aes-field">Karşılaştırma konusu<textarea id="aesBattlePrompt" rows="3" maxlength="2000" placeholder="İki modelin karşılaştırmasını istediğin konuyu yaz…"></textarea></label><div class="aes-two"><label class="aes-field">Model 1<select id="aesBattleM1"></select></label><label class="aes-field">Model 2<select id="aesBattleM2"></select></label></div><button type="button" class="aep-btn aep-primary" id="aesBattleGo">⚔️ Karşılaştırmayı başlat</button><div id="aesBattleOut" style="margin-top:14px"></div></div>';
        var one = $('#aesBattleM1', p), two = $('#aesBattleM2', p);
        modelNames.forEach(function (name) { [one, two].forEach(function (select) { var opt = d.createElement('option'); opt.value = name; opt.textContent = name; select.appendChild(opt); }); });
        one.value = 'Groq'; two.value = 'Gemini';
        $('#aesBattleGo', p).addEventListener('click', function () {
          var prompt = $('#aesBattlePrompt', p).value.trim(), out = $('#aesBattleOut', p);
          if (!prompt) { err('Önce karşılaştırma konusunu yaz.'); return; }
          out.textContent = 'İki model yanıt üretiyor…';
          busyBtn(this, call('battleMode', { prompt: prompt, model1: one.value, model2: two.value })).then(function (r) {
            if (!r || r.success !== true) throw new Error(r && r.error || 'Karşılaştırma tamamlanamadı.');
            out.innerHTML = '';
            var winner = d.createElement('p'); winner.className = 'aes-pill ok'; winner.textContent = '🏆 Uzunluk ölçütüne göre: ' + (r.winner || 'Belirlenemedi'); out.appendChild(winner);
            [[one.value, r.model1_response], [two.value, r.model2_response]].forEach(function (entry) {
              var card = d.createElement('div'); card.className = 'aep-card';
              var heading = d.createElement('h4'); heading.textContent = entry[0];
              var answer = d.createElement('p'); answer.style.whiteSpace = 'pre-wrap'; answer.textContent = String(entry[1] || 'Yanıt alınamadı.');
              card.appendChild(heading); card.appendChild(answer); out.appendChild(card);
            });
          }).catch(function (e) { out.textContent = 'Karşılaştırma hatası: ' + msgOf(e); });
        });
      }
      function multiPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>🧠 Çoklu AI karşılaştırması</h3><label class="aes-field">Sorun / istem<textarea id="aesMultiPrompt" rows="3" maxlength="2000" placeholder="Aynı soruyu seçtiğin modellere gönder…"></textarea></label><p class="aep-muted">2–4 sağlayıcı seçebilirsin.</p><div class="aes-3col" id="aesMultiModels"></div><button type="button" class="aep-btn aep-primary" id="aesMultiGo">⚡ Seçili modellere gönder</button><div id="aesMultiOut" style="margin-top:14px"></div></div>';
        var modelBox = $('#aesMultiModels', p);
        modelNames.forEach(function (name, index) {
          var labelEl = d.createElement('label'); labelEl.className = 'aes-field'; labelEl.style.cssText = 'flex-direction:row;align-items:center;gap:8px;padding:8px;border:1px solid #dbe5ef;border-radius:10px;background:#f7f9fc;color:#172b43';
          var checkbox = d.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = name; checkbox.checked = ['Groq', 'DeepSeek', 'OpenAI', 'Gemini'].indexOf(name) !== -1; checkbox.dataset.model = name;
          var textEl = d.createElement('span'); textEl.textContent = name;
          labelEl.appendChild(checkbox); labelEl.appendChild(textEl); modelBox.appendChild(labelEl);
        });
        $('#aesMultiGo', p).addEventListener('click', function () {
          var prompt = $('#aesMultiPrompt', p).value.trim(), out = $('#aesMultiOut', p);
          var selected = Array.prototype.slice.call(modelBox.querySelectorAll('input[data-model]:checked')).map(function (el) { return el.value; });
          if (!prompt) { err('Önce bir soru yaz.'); return; }
          if (selected.length < 2 || selected.length > 4) { err('En az 2, en fazla 4 model seç.'); return; }
          out.textContent = selected.length + ' model yanıt üretiyor…';
          busyBtn(this, call('multiAI', { prompt: prompt, models: selected })).then(function (r) {
            if (!r || r.success !== true) throw new Error(r && r.error || 'Çoklu AI yanıtı alınamadı.');
            out.innerHTML = '';
            selected.forEach(function (name) {
              var card = d.createElement('div'); card.className = 'aep-card';
              var heading = d.createElement('h4'); heading.textContent = name;
              var answer = d.createElement('p'); answer.style.whiteSpace = 'pre-wrap'; answer.textContent = String((r.responses && r.responses[name]) || 'Yanıt alınamadı.');
              card.appendChild(heading); card.appendChild(answer); out.appendChild(card);
            });
          }).catch(function (e) { out.textContent = 'Çoklu AI hatası: ' + msgOf(e); });
        });
      }
      return true;
    }

    /* ======================================================================
     *  3D STUDIO
     * ==================================================================== */
    var SHAPES = {
      'Küp': function (T) { return new T.BoxGeometry(1, 1, 1); },
      'Küre': function (T) { return new T.SphereGeometry(.6, 32, 24); },
      'Silindir': function (T) { return new T.CylinderGeometry(.5, .5, 1, 32); },
      'Koni': function (T) { return new T.ConeGeometry(.55, 1, 32); },
      'Halka': function (T) { return new T.TorusGeometry(.5, .18, 16, 48); },
      'Piramit': function (T) { return new T.ConeGeometry(.7, 1, 4); },
      'Kapsül': function (T) { return new T.CylinderGeometry(.35, .35, 1, 24); },
      'Elmas': function (T) { return new T.OctahedronGeometry(.7); },
      'Düğüm': function (T) { return new T.TorusKnotGeometry(.4, .14, 80, 12); },
      'Düzlem': function (T) { return new T.BoxGeometry(2, .06, 2); }
    };
    /* 90+ gerçek geometrik varyant: Three.js primitive'leriyle yerel katalog.
       Bunlar AI servisi kullanılamasa bile sahnede doğrudan oluşturulabilir. */
    for (var sides = 3; sides <= 18; sides++) {
      (function (n) {
        SHAPES['Prizma ' + n + ' Kenar'] = function (T) { return new T.CylinderGeometry(.62, .62, 1, n, 1, false); };
        SHAPES['Piramit ' + n + ' Kenar'] = function (T) { return new T.ConeGeometry(.66, 1, n, 1, false); };
      })(sides);
    }
    for (var sphereSegments = 8; sphereSegments <= 30; sphereSegments += 2) {
      (function (n) {
        SHAPES['Küre ' + n + ' Segment'] = function (T) { return new T.SphereGeometry(.62, n, Math.max(6, Math.floor(n * .75))); };
      })(sphereSegments);
    }
    for (var torusVariant = 0; torusVariant < 10; torusVariant++) {
      (function (n) {
        SHAPES['Torus Varyant ' + (n + 1)] = function (T) { return new T.TorusGeometry(.34 + n * .035, .06 + n * .009, 8 + n, 24 + n * 4); };
      })(torusVariant);
      (function (n) {
        SHAPES['Düğüm Varyant ' + (n + 1)] = function (T) { return new T.TorusKnotGeometry(.36, .07 + n * .012, 48 + n * 8, 6 + n, 2 + (n % 4), 3 + (n % 5)); };
      })(torusVariant);
    }
    for (var boxVariant = 0; boxVariant < 12; boxVariant++) {
      (function (n) {
        SHAPES['Dikdörtgen Kutu ' + (n + 1)] = function (T) { return new T.BoxGeometry(.55 + n * .07, .65 + ((n * 3) % 7) * .12, .5 + ((n * 5) % 9) * .09); };
      })(boxVariant);
    }
    for (var flatVariant = 0; flatVariant < 4; flatVariant++) {
      (function (n) {
        SHAPES['Halka Plaka ' + (n + 1)] = function (T) { return new T.RingGeometry(.18 + n * .04, .55 + n * .05, 20 + n * 8); };
        SHAPES['Düzlem ' + (n + 1)] = function (T) { return new T.PlaneGeometry(1 + n * .25, .8 + n * .2, 1 + n, 1 + n); };
      })(flatVariant);
    }
    function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function rng(seed) { var a = seed || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    /* Açıklamaya göre ilkellerden oluşan model tarifleri: [şekil, renk, x,y,z, sx,sy,sz, rx,ry,rz] */
    var RECIPES = [
      { k: /araba|araç|otomobil|car|taksi/i, parts: [['Küp', '#d33', 0, .35, 0, 2.2, .5, 1], ['Küp', '#9ad', 0, .8, 0, 1.1, .45, .9], ['Silindir', '#222', -.7, .12, .55, .45, .2, .45, 90, 0, 0], ['Silindir', '#222', .7, .12, .55, .45, .2, .45, 90, 0, 0], ['Silindir', '#222', -.7, .12, -.55, .45, .2, .45, 90, 0, 0], ['Silindir', '#222', .7, .12, -.55, .45, .2, .45, 90, 0, 0]] },
      { k: /ev|bina|house|kule|tower|kale|castle/i, parts: [['Küp', '#e7d3a8', 0, .5, 0, 1.6, 1, 1.4], ['Piramit', '#b5452f', 0, 1.35, 0, 2.1, .8, 2.1, 0, 45, 0], ['Küp', '#6b4a2b', 0, .32, .72, .35, .6, .05], ['Küp', '#8cc7ff', .5, .65, .72, .3, .3, .05]] },
      { k: /ağaç|tree|orman|çam/i, parts: [['Silindir', '#7a4b2a', 0, .45, 0, .3, .9, .3], ['Koni', '#2f8f46', 0, 1.3, 0, 1.3, 1.1, 1.3], ['Koni', '#3aa655', 0, 1.9, 0, 1, .9, 1]] },
      { k: /robot|android|bot/i, parts: [['Küp', '#8fa3b8', 0, .9, 0, .9, 1.1, .5], ['Küp', '#b7c6d6', 0, 1.8, 0, .6, .5, .5], ['Küre', '#3d86ff', -.15, 1.85, .27, .12, .12, .12], ['Küre', '#3d86ff', .15, 1.85, .27, .12, .12, .12], ['Silindir', '#6c7f94', -.65, .9, 0, .2, .9, .2], ['Silindir', '#6c7f94', .65, .9, 0, .2, .9, .2], ['Silindir', '#6c7f94', -.25, .1, 0, .25, .5, .25], ['Silindir', '#6c7f94', .25, .1, 0, .25, .5, .25]] },
      { k: /roket|uzay|rocket|ship|gemi/i, parts: [['Silindir', '#e8eef7', 0, 1, 0, .7, 1.8, .7], ['Koni', '#d33', 0, 2.2, 0, .7, .8, .7], ['Piramit', '#3d86ff', .5, .35, 0, .5, .6, .15], ['Piramit', '#3d86ff', -.5, .35, 0, .5, .6, .15], ['Küre', '#8cc7ff', 0, 1.3, .33, .22, .22, .1]] },
      { k: /masa|sandalye|table|chair|mobilya/i, parts: [['Küp', '#a8743c', 0, .8, 0, 1.6, .1, 1], ['Küp', '#8a5d2e', -.7, .4, -.4, .1, .8, .1], ['Küp', '#8a5d2e', .7, .4, -.4, .1, .8, .1], ['Küp', '#8a5d2e', -.7, .4, .4, .1, .8, .1], ['Küp', '#8a5d2e', .7, .4, .4, .1, .8, .1]] },
      { k: /kardan adam|snow/i, parts: [['Küre', '#fff', 0, .5, 0, 1.2, 1.2, 1.2], ['Küre', '#fff', 0, 1.3, 0, .9, .9, .9], ['Küre', '#fff', 0, 1.95, 0, .6, .6, .6], ['Koni', '#f80', 0, 1.95, .35, .1, .35, .1, 90, 0, 0]] }
    ];
    function partsFromPrompt(prompt) {
      for (var i = 0; i < RECIPES.length; i++) if (RECIPES[i].k.test(prompt)) return RECIPES[i].parts;
      var r = rng(hash(prompt)), names = Object.keys(SHAPES), out = [], n = 5 + Math.floor(r() * 5);
      for (var j = 0; j < n; j++) {
        var col = 'hsl(' + Math.floor(r() * 360) + ',65%,58%)';
        out.push([names[Math.floor(r() * (names.length - 1))], col, (r() - .5) * 3, r() * 2, (r() - .5) * 3, .5 + r(), .5 + r(), .5 + r(), r() * 90, r() * 90, 0]);
      }
      return out;
    }

    function build3D(label, m) {
      styles();
      var body = open(label, m, '94+ şekil kütüphanesi · Yazıdan 3D model oluştur · Projelerini kaydet ve GLB indir');
      var u = user();
      body.innerHTML =
        '<div class="a3d"><div class="a3d-main">' +
        '<div class="a3d-bar"><textarea id="a3dPrompt" maxlength="400" placeholder="Ne üretmek istiyorsun? Örn. kırmızı araba, uzay roketi, ağaç, robot, ev…"></textarea>' +
        '<button type="button" class="aep-btn aep-primary" id="a3dGen">✨ 3D Oluştur</button></div>' +
        '<div class="a3d-view" id="a3dView"><div class="a3d-hud" id="a3dHud">Sürükle: döndür · Tekerlek: yakınlaştır</div></div>' +
        '<div class="a3d-bar"><input class="a3d-shape-search" id="a3dShapeSearch" type="search" placeholder="94+ şekil içinde ara…" aria-label="Şekil ara"><div class="a3d-shapes" id="a3dShapes"></div></div>' +
        '<div class="a3d-bar"><input type="color" id="a3dColor" value="#3d86ff" title="Yeni şekil rengi" aria-label="Renk">' +
        '<button type="button" class="aep-btn" id="a3dSpin">⟳ Otomatik döndür</button>' +
        '<button type="button" class="aep-btn" id="a3dWire">▦ Tel kafes</button>' +
        '<button type="button" class="aep-btn" id="a3dUndo">↶ Son şekli sil</button>' +
        '<button type="button" class="aep-btn" id="a3dClear">✕ Sahneyi temizle</button>' +
        '<button type="button" class="aep-btn" id="a3dSave">💾 Projeye kaydet</button>' +
        '<button type="button" class="aep-btn aep-primary" id="a3dDl">⬇ GLB indir</button></div>' +
        '<div class="aep-muted" id="a3dState" style="color:#94a8c2"></div></div>' +
        '<aside class="a3d-side">' +
        '<div class="a3d-box"><h4>🧊 3D Projelerim <button type="button" class="aep-btn" id="a3dRef">↻</button></h4><div class="aep-list" id="a3dList"></div></div>' +
        '<div class="a3d-box"><h4>★ Favoriler</h4><div class="aep-list" id="a3dFav"></div></div>' +
        '<div class="a3d-box"><h4>🗄️ Arşiv</h4><div class="aep-list" id="a3dArch"></div></div>' +
        '<div class="a3d-box"><h4>🗑️ Çöp</h4><div class="aep-list" id="a3dTrash"></div></div>' +
        '<div class="a3d-box" id="a3dConceptBox" style="display:none"><h4>🖼️ AI konsept görseli</h4><img class="a3d-concept" id="a3dConcept" alt="AI konsept görseli"></div>' +
        '</aside></div>';
      var T = w.THREE, view = $('#a3dView', body), stateEl = $('#a3dState', body), promptEl = $('#a3dPrompt', body);
      function setState(t) { stateEl.textContent = t || ''; }

      /* ---- yan kutular ---- */
      var curProject = null;
      function loadBoxes() {
        if (!user()) { ['#a3dList', '#a3dFav', '#a3dArch', '#a3dTrash'].forEach(function (s) { $(s, body).innerHTML = empty('Giriş yapınca burada görünür.'); }); return; }
        var o = { compact: true, onChange: loadBoxes, onOpen: openProject };
        renderProjects($('#a3dList', body), 'active', o);
        renderProjects($('#a3dFav', body), 'fav', o);
        renderProjects($('#a3dArch', body), 'arch', o);
        renderProjects($('#a3dTrash', body), 'trash', o);
      }
      $('#a3dRef', body).addEventListener('click', loadBoxes);

      if (!T) {
        view.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;color:#c8d6e8;font:600 14px Inter,system-ui,sans-serif">3D motoru (three.js) yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.</div>';
        loadBoxes(); return true;
      }

      /* ---- sahne ---- */
      var scene = new T.Scene(), group = new T.Group(); scene.add(group);
      var cam = new T.PerspectiveCamera(50, 1, .1, 200); cam.position.set(3.2, 2.6, 4.2);
      var ren = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
      ren.setPixelRatio(Math.min(w.devicePixelRatio || 1, 2));
      view.insertBefore(ren.domElement, view.firstChild);
      scene.add(new T.AmbientLight(0xffffff, .65));
      var sun = new T.DirectionalLight(0xffffff, .9); sun.position.set(4, 6, 3); scene.add(sun);
      var grid = new T.GridHelper(8, 16, 0x4a6a96, 0x2a3f61); scene.add(grid);
      var ctl = null;
      if (T.OrbitControls) { ctl = new T.OrbitControls(cam, ren.domElement); ctl.enableDamping = true; ctl.target.set(0, .9, 0); }
      var spin = false, wire = false, shapesLog = [];
      function size() { var r = view.getBoundingClientRect(); var wd = Math.max(200, r.width), ht = Math.max(200, r.height); ren.setSize(wd, ht, false); cam.aspect = wd / ht; cam.updateProjectionMatrix(); }
      size();
      var ro = w.ResizeObserver ? new w.ResizeObserver(size) : null; if (ro) ro.observe(view); else w.addEventListener('resize', size);
      (function loop() {
        if (!view.isConnected) { if (ro) ro.disconnect(); try { ren.dispose(); } catch (_) {} return; }
        if (spin) group.rotation.y += .01;
        if (ctl) ctl.update();
        ren.render(scene, cam);
        w.requestAnimationFrame(loop);
      })();

      function addShape(name, color, p, s, r, noLog) {
        var g = SHAPES[name] ? SHAPES[name](T) : SHAPES['Küp'](T);
        var mesh = new T.Mesh(g, new T.MeshStandardMaterial({ color: new T.Color(color || '#3d86ff'), roughness: .5, metalness: .15, wireframe: wire }));
        p = p || [0, .5, 0]; s = s || [1, 1, 1]; r = r || [0, 0, 0];
        mesh.position.set(p[0], p[1], p[2]); mesh.scale.set(s[0], s[1], s[2]);
        mesh.rotation.set(T.MathUtils.degToRad(r[0]), T.MathUtils.degToRad(r[1]), T.MathUtils.degToRad(r[2]));
        group.add(mesh);
        if (!noLog) shapesLog.push({ shape: name, color: color, p: p, s: s, r: r });
        return mesh;
      }
      function clearScene() {
        while (group.children.length) { var c = group.children.pop(); if (c.geometry) c.geometry.dispose(); if (c.material && c.material.dispose) c.material.dispose(); }
        shapesLog = []; group.rotation.set(0, 0, 0);
      }
      function addParts(parts) {
        parts.forEach(function (p) { addShape(p[0], p[1], [p[2], p[3], p[4]], [p[5], p[6], p[7]], [p[8] || 0, p[9] || 0, p[10] || 0]); });
      }
      var shapesBox = $('#a3dShapes', body), shapeSearch = $('#a3dShapeSearch', body), shapeButtons = [];
      Object.keys(SHAPES).forEach(function (n) {
        var b = d.createElement('button'); b.type = 'button'; b.className = 'aep-btn'; b.textContent = '＋ ' + n;
        b.addEventListener('click', function () {
          var k = shapesLog.length;
          addShape(n, $('#a3dColor', body).value, [((k % 4) - 1.5) * 1.1, .5 + Math.floor(k / 4) * .9, 0]);
          setState(n + ' eklendi (' + shapesLog.length + ' şekil).');
        });
        shapesBox.appendChild(b);
        shapeButtons.push({ name: n.toLocaleLowerCase('tr-TR'), button: b });
      });
      if (shapeSearch) shapeSearch.addEventListener('input', function () {
        var term = String(shapeSearch.value || '').toLocaleLowerCase('tr-TR').trim();
        shapeButtons.forEach(function (entry) { entry.button.hidden = !!term && entry.name.indexOf(term) === -1; });
      });
      setState(Object.keys(SHAPES).length + ' şekil hazır.');
      $('#a3dSpin', body).addEventListener('click', function () { spin = !spin; setState(spin ? 'Otomatik döndürme açık.' : 'Otomatik döndürme kapalı.'); });
      $('#a3dWire', body).addEventListener('click', function () { wire = !wire; group.traverse(function (o) { if (o.material) o.material.wireframe = wire; }); });
      $('#a3dUndo', body).addEventListener('click', function () {
        var c = group.children[group.children.length - 1]; if (!c) return;
        group.remove(c); shapesLog.pop(); setState('Son şekil silindi.');
      });
      $('#a3dClear', body).addEventListener('click', function () { clearScene(); curProject = null; setState('Sahne temizlendi.'); });

      /* ---- AI + yedek üretim ---- */
      function b64ToBuf(b64) { var bin = atob(b64), n = bin.length, a = new Uint8Array(n); for (var i = 0; i < n; i++) a[i] = bin.charCodeAt(i); return a.buffer; }
      var genBtn = $('#a3dGen', body);
      genBtn.addEventListener('click', function () {
        var prompt = promptEl.value.trim();
        if (!prompt) { err('Lütfen ne üretmek istediğini yaz.'); promptEl.focus(); return; }
        if (!user()) { err('3D üretmek için giriş yapmalısın.'); return; }
        genBtn.disabled = true; setState('⏳ 3D model hazırlanıyor…');
        clearScene(); curProject = null;
        var tok = {}; build3D.tok = tok;
        call('generate3DWithHF', { prompt: prompt }).then(function (res) {
          if (build3D.tok !== tok) return;
          if (res && res.glbBase64 && T.GLTFLoader) {
            new T.GLTFLoader().parse(b64ToBuf(res.glbBase64), '', function (g) { group.add(g.scene); setState('✅ AI ile model oluşturuldu.'); }, function () { fallback(prompt, 'GLB okunamadı'); });
            return;
          }
          if (res && res.imageBase64) { $('#a3dConcept', body).src = 'data:image/png;base64,' + res.imageBase64; $('#a3dConceptBox', body).style.display = 'block'; }
          fallback(prompt, res && res.imageBase64 ? 'AI konsept görseli hazır; model parçalardan kuruldu.' : '');
        }, function (e) { if (build3D.tok === tok) fallback(prompt, 'AI şu an yanıt vermedi (' + msgOf(e) + '); yerel üretim kullanıldı.'); })
          .then(function () { genBtn.disabled = false; });
      });
      function fallback(prompt, msg) {
        clearScene(); addParts(partsFromPrompt(prompt));
        setState('✅ Model hazır. ' + (msg || ''));
      }

      /* ---- kaydet / indir / aç ---- */
      function sceneJSON() { return JSON.stringify({ v: 1, prompt: promptEl.value.trim(), objects: shapesLog }); }
      function openProject(p) {
        var data = null; try { data = JSON.parse(p.get('content') || '{}'); } catch (_) {}
        clearScene(); curProject = p.id;
        if (data && Array.isArray(data.objects) && data.objects.length) {
          data.objects.forEach(function (o) { addShape(o.shape, o.color, o.p, o.s, o.r); });
          promptEl.value = data.prompt || '';
          setState('📂 "' + (p.get('name') || 'Proje') + '" açıldı.');
        } else setState('📂 "' + (p.get('name') || 'Proje') + '" boş bir proje; şekil ekleyip kaydedebilirsin.');
      }
      $('#a3dSave', body).addEventListener('click', function () {
        if (!user()) { err('Kaydetmek için giriş yapmalısın.'); return; }
        if (!group.children.length) { err('Önce sahneye bir şey ekle.'); return; }
        var btn = this;
        if (curProject) {
          busyBtn(btn, call('editProject', { projectId: curProject, content: sceneJSON() })).then(function () { note('Proje güncellendi.'); loadBoxes(); }, function (e) { err(msgOf(e)); });
          return;
        }
        var name = w.prompt('Proje adı:', (promptEl.value.trim() || '3D proje').slice(0, 40)); if (!name || !name.trim()) return;
        busyBtn(btn, call('saveProject', { name: name.trim(), type: '3D', content: sceneJSON() })).then(function (r) { curProject = r && r.projectId; note('Proje kaydedildi.'); loadBoxes(); }, function (e) { err(msgOf(e)); });
      });
      $('#a3dDl', body).addEventListener('click', function () {
        if (!group.children.length) { err('İndirilecek model yok.'); return; }
        if (!T.GLTFExporter) { err('GLB dışa aktarıcı yüklenemedi.'); return; }
        new T.GLTFExporter().parse(group, function (res) {
          var blob = res instanceof ArrayBuffer ? new Blob([res], { type: 'model/gltf-binary' }) : new Blob([JSON.stringify(res)], { type: 'model/gltf+json' });
          var a = d.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = 'aethrion-model-' + Date.now() + (res instanceof ArrayBuffer ? '.glb' : '.gltf');
          d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          setState('⬇ Model indirildi.');
        }, function (e) { err('Dışa aktarma hatası: ' + msgOf(e)); }, { binary: true });
      });
      loadBoxes();
      if (!u) setState('Üretmek ve kaydetmek için giriş yapmalısın; şekilleri denemek serbest.');
      addParts([['Küp', '#3d86ff', 0, .5, 0, 1, 1, 1], ['Küre', '#ffb020', 1.2, .6, 0, 1, 1, 1]]);
      return true;
    }

    /* ======================================================================
     *  TAKIM
     * ==================================================================== */
    function buildTeam(label, m) {
      styles();
      var body = open(label, m, 'Takımını kur, üyelerle yazış, görevlerini ve projelerini yönet');
      if (!user()) { loginCard(body, 'Takım özelliklerini kullanmak'); return true; }
      var teamId = user().get('teamId');
      if (!teamId) {
        body.innerHTML = '<div class="aes-wrap"><div class="aes-two">' +
          '<div class="aep-card"><h3>👥 Takım kur</h3><p class="aep-muted">Takım sahibi olarak üyeleri davet edebilir, ortak sohbet ve görev alanı kullanabilirsin.</p>' +
          '<label class="aes-field">Takım adı<input id="aesTmName" maxlength="40"></label><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesTmCreate">Takımı oluştur</button></div></div>' +
          '<div class="aep-card"><h3>🔑 Koda ile katıl</h3><p class="aep-muted">Takım sahibinin verdiği kodu gir.</p>' +
          '<label class="aes-field">Takım kodu<input id="aesTmCode" maxlength="20" autocapitalize="characters"></label><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesTmJoin">Takıma katıl</button></div></div></div></div>';
        function after() { return Promise.resolve(user().fetch ? user().fetch() : null).catch(function () {}).then(function () { buildTeam(label, m); }); }
        $('#aesTmCreate', body).addEventListener('click', function () {
          var n = $('#aesTmName', body).value.trim(); if (!n) { err('Takım adı gerekli.'); return; }
          busyBtn(this, call('createTeam', { name: n })).then(function (r) { note((r && r.message) || 'Takım oluşturuldu.'); return after(); }, function (e) { err(msgOf(e)); });
        });
        $('#aesTmJoin', body).addEventListener('click', function () {
          var c = $('#aesTmCode', body).value.trim(); if (!c) { err('Takım kodu gerekli.'); return; }
          busyBtn(this, call('joinTeamWithCode', { teamCode: c })).then(function (r) { note((r && r.message) || 'Takıma katıldın.'); return after(); }, function (e) { err(msgOf(e)); });
        });
        return true;
      }
      var meEmail = user().get('email'), chatTimer = null;
      tabs(body, [
        { id: 'chat', label: '💬 Sohbet', render: chatPane },
        { id: 'members', label: '👥 Üyeler', render: membersPane },
        { id: 'tasks', label: '✅ Takım görevleri', render: tasksPane },
        { id: 'proj', label: '▤ Projeler', render: function (p) { p.innerHTML = '<div class="aep-card"><h3>Takım projeleri</h3><p class="aep-muted">Projelerini oluşturup yönetmek için Projelerim panelini kullan.</p><div class="aep-row"><button type="button" class="aep-btn aep-primary" data-go="Projelerim">Projelerim\'i aç</button><button type="button" class="aep-btn" data-go="3D Studio">3D Studio</button></div></div>'; } },
        { id: 'invite', label: '✉ Davet / Ayrıl', render: invitePane }
      ]);
      body.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g) P.openFeature(g.getAttribute('data-go')); });
      function stopTimer() { if (chatTimer) { clearInterval(chatTimer); chatTimer = null; } }
      function chatPane(p) {
        stopTimer();
        p.innerHTML = '<div class="aep-card"><h3>💬 Takım sohbeti</h3><div class="aes-chat" id="aesTcChat"><p class="aep-muted">Yükleniyor…</p></div>' +
          '<div class="aep-row"><input class="aep-input" id="aesTcInput" maxlength="1000" placeholder="Mesaj yaz…" style="flex:1;margin:0"><button type="button" class="aep-btn aep-primary" id="aesTcSend">Gönder</button></div></div>';
        var box = $('#aesTcChat', p);
        function load() {
          if (!box.isConnected) { stopTimer(); return; }
          call('aethrionGetTeamMessages', { teamId: teamId, limit: 60 }).then(function (r) {
            var ms = (r && r.messages) || [];
            var stick = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
            box.innerHTML = ms.length ? ms.map(function (x) {
              return '<div class="aes-msg' + (x.userEmail === meEmail ? ' me' : '') + '"><small>' + esc(x.userName) + ' · ' + esc(fdate(x.createdAt)) + '</small>' +
                esc(x.message) + (x.fileUrl ? ' <a href="' + esc(x.fileUrl) + '" target="_blank" rel="noopener noreferrer">📎 ' + esc(x.fileName || 'dosya') + '</a>' : '') + '</div>';
            }).join('') : empty('Henüz mesaj yok. İlk mesajı sen yaz.');
            if (stick) box.scrollTop = box.scrollHeight;
          }, function (e) { box.innerHTML = empty('Sohbet yüklenemedi: ' + msgOf(e)); });
        }
        function send() {
          var inp = $('#aesTcInput', p), t = inp.value.trim(); if (!t) return;
          busyBtn($('#aesTcSend', p), call('aethrionSendTeamMessage', { teamId: teamId, message: t })).then(function () { inp.value = ''; load(); }, function (e) { err(msgOf(e)); });
        }
        $('#aesTcSend', p).addEventListener('click', send);
        $('#aesTcInput', p).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
        load(); chatTimer = setInterval(load, 8000);
      }
      function membersPane(p) {
        stopTimer();
        p.innerHTML = '<div class="aep-card"><h3>👥 Üyeler</h3><div class="aep-list" id="aesTmList"><p class="aep-muted">Yükleniyor…</p></div></div>';
        call('getTeamMembers').then(function (r) {
          var ms = (r && r.members) || [];
          $('#aesTmList', p).innerHTML = ms.length ? ms.map(function (x) {
            return '<div class="aep-item"><span class="aep-item-name">' + esc(x.name) + ' <small class="aep-muted">' + esc(x.email) + '</small></span><span>' +
              (x.isOwner ? '<span class="aes-pill ok">Sahip</span>' : x.isManager ? '<span class="aes-pill">Yönetici</span>' : '<span class="aes-pill">Üye</span>') + '</span></div>';
          }).join('') : empty('Üye bulunamadı.');
        }, function (e) { $('#aesTmList', p).innerHTML = empty('Üyeler yüklenemedi: ' + msgOf(e)); });
      }
      function tasksPane(p) {
        stopTimer();
        p.innerHTML = '<div class="aep-card"><h3>✅ Takım görevleri</h3><div class="aep-list" id="aesTtList"><p class="aep-muted">Yükleniyor…</p></div></div>';
        function load() {
          call('getTeamTasks').then(function (r) {
            var ts = Array.isArray(r) ? r : (r && r.tasks) || [];
            $('#aesTtList', p).innerHTML = ts.length ? ts.map(function (t) {
              return '<div class="aep-item"><span class="aep-item-name">' + esc(t.task_text || t.title || 'Görev') + (t.points ? ' <span class="aes-pill">+' + esc(t.points) + ' puan</span>' : '') + '</span>' +
                (t.completed ? '<span class="aes-pill ok">Tamamlandı</span>' : '<button type="button" class="aep-btn" data-id="' + esc(t.id) + '">Tamamla</button>') + '</div>';
            }).join('') : empty('Şu an takım görevi yok.');
          }, function (e) { $('#aesTtList', p).innerHTML = empty('Görevler yüklenemedi: ' + msgOf(e)); });
        }
        $('#aesTtList', p).addEventListener('click', function (ev) {
          var b = ev.target.closest('button[data-id]'); if (!b) return;
          busyBtn(b, call('completeTeamTask', { taskId: b.getAttribute('data-id') })).then(function (r) { note((r && r.message) || 'Görev tamamlandı.'); load(); }, function (e) { err(msgOf(e)); });
        });
        load();
      }
      function invitePane(p) {
        stopTimer();
        p.innerHTML = '<div class="aep-card"><h3>✉ Takıma davet et</h3><label class="aes-field">E-posta<input id="aesInvMail" type="email" maxlength="120"></label>' +
          '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesInvGo">Davet gönder</button></div></div>' +
          '<div class="aep-card"><h3>Takımdan ayrıl</h3><p class="aep-muted">Takım sahibi ayrılamaz. Ayrılırsan takım sohbetine ve görevlerine erişimin kapanır.</p><div class="aep-row"><button type="button" class="aep-btn" id="aesLeave">Takımdan ayrıl</button></div></div>';
        $('#aesInvGo', p).addEventListener('click', function () {
          var mail = $('#aesInvMail', p).value.trim(); if (!mail) { err('E-posta gerekli.'); return; }
          busyBtn(this, call('inviteToTeam', { email: mail })).then(function (r) { note((r && r.message) || 'Davet gönderildi.'); $('#aesInvMail', p).value = ''; }, function (e) { err(msgOf(e)); });
        });
        $('#aesLeave', p).addEventListener('click', function () {
          if (!w.confirm('Takımdan ayrılmak istediğine emin misin?')) return;
          busyBtn(this, call('leaveTeam')).then(function () { note('Takımdan ayrıldın.'); try { user().set('teamId', null); } catch (_) {} buildTeam(label, m); }, function (e) { err(msgOf(e)); });
        });
      }
      return true;
    }

    /* ======================================================================
     *  AKADEMİ
     * ==================================================================== */
    function buildAcademy(label, m) {
      styles();
      var body = open(label, m, 'Kurslar, dersler ve bilgi yarışması; her adımda puan kazan');
      tabs(body, [
        { id: 'courses', label: '🎓 Kurslar', render: coursesPane },
        { id: 'quiz', label: '❓ Quiz', render: quizPane }
      ], label === 'Zeka Testi ve Quiz' ? 'quiz' : 'courses');
      function coursesPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>🎓 Kurslar</h3><div class="aep-grid" id="aesCrs"><p class="aep-muted">Yükleniyor…</p></div></div><div id="aesLessons"></div>';
        call('getCourses').then(function (cs) {
          var box = $('#aesCrs', p);
          box.innerHTML = (cs && cs.length) ? cs.map(function (c) {
            return '<div class="aep-fig"><b>' + esc(c.title) + '</b><span class="aep-muted">' + esc(c.description || '') + '</span><span class="aes-pill">' + esc(c.total_lessons) + ' ders</span><button type="button" class="aep-btn aep-primary" data-id="' + esc(c.id) + '">Kursa başla</button></div>';
          }).join('') : empty('Henüz kurs yok.');
        }, function (e) { $('#aesCrs', p).innerHTML = empty('Kurslar yüklenemedi: ' + msgOf(e)); });
        $('#aesCrs', p).addEventListener('click', function (ev) {
          var b = ev.target.closest('button[data-id]'); if (!b) return;
          busyBtn(b, call('getCourseDetails', { courseId: b.getAttribute('data-id') })).then(function (c) {
            var ls = (c && c.lessons) || [], box = $('#aesLessons', p);
            box.innerHTML = '<div class="aep-card"><h3>' + esc(c.title || 'Kurs') + '</h3><p class="aep-muted">' + esc(c.description || '') + '</p><div class="aep-list">' + (ls.length ? ls.map(function (l) {
              return '<div class="aep-item" style="align-items:flex-start"><span class="aep-item-name">' + esc(l.title) + '<br><small class="aep-muted">' + esc(l.content || '') + '</small></span>' +
                '<button type="button" class="aep-btn" data-l="' + esc(l.id) + '">Tamamla (+' + esc(l.points_reward || 0) + ')</button></div>';
            }).join('') : empty('Bu kursta ders yok.')) + '</div></div>';
            box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            box.onclick = function (e2) {
              var lb = e2.target.closest('button[data-l]'); if (!lb) return;
              if (!user()) { err('Ders tamamlamak için giriş yapmalısın.'); return; }
              busyBtn(lb, call('completeLesson', { lessonId: lb.getAttribute('data-l') })).then(function (r) { note((r && r.message) || 'Ders tamamlandı.'); lb.textContent = '✓ Tamamlandı'; lb.disabled = true; }, function (e3) { err(msgOf(e3)); });
            };
          }, function (e) { err(msgOf(e)); });
        });
      }
      function quizPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>❓ Bilgi yarışması</h3><div id="aesQz"><p class="aep-muted">Yükleniyor…</p></div></div>';
        var qs = [], i = 0, score = 0;
        function show() {
          var box = $('#aesQz', p);
          if (i >= qs.length) { box.innerHTML = '<p><b>Quiz bitti!</b> Kazandığın puan: <span class="aes-pill ok">' + score + '</span></p><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesQzAgain">Tekrar başla</button></div>'; $('#aesQzAgain', p).onclick = function () { i = 0; score = 0; show(); }; return; }
          var q = qs[i];
          box.innerHTML = '<p class="aep-muted">Soru ' + (i + 1) + ' / ' + qs.length + '</p><h4 style="margin:6px 0 10px;color:#10243a">' + esc(q.question) + '</h4><div class="aep-list">' +
            (q.options || []).map(function (o, k) { return '<button type="button" class="aep-btn" style="text-align:left" data-k="' + k + '">' + esc(o) + '</button>'; }).join('') + '</div><p class="aep-muted" id="aesQzMsg"></p>';
          $$('button[data-k]', box).forEach(function (b) {
            b.onclick = function () {
              if (!user()) { err('Cevap vermek için giriş yapmalısın.'); return; }
              $$('button[data-k]', box).forEach(function (x) { x.disabled = true; });
              call('submitQuizAnswer', { quizId: q.id, answerIndex: Number(b.getAttribute('data-k')) }).then(function (r) {
                if (r && r.correct) { score += r.points_reward || 0; b.style.background = '#dff5e7'; $('#aesQzMsg', box).textContent = '✅ Doğru! +' + (r.points_reward || 0) + ' puan'; }
                else { b.style.background = '#fde6e6'; $('#aesQzMsg', box).textContent = '❌ Yanlış cevap.'; }
                setTimeout(function () { i++; show(); }, 1100);
              }, function (e) { $('#aesQzMsg', box).textContent = msgOf(e); $$('button[data-k]', box).forEach(function (x) { x.disabled = false; }); });
            };
          });
        }
        call('getQuizQuestions').then(function (r) { qs = Array.isArray(r) ? r : []; if (!qs.length) $('#aesQz', p).innerHTML = empty('Şu an soru yok.'); else show(); }, function (e) { $('#aesQz', p).innerHTML = empty('Sorular yüklenemedi: ' + msgOf(e)); });
      }
      return true;
    }

    /* ======================================================================
     *  PUAN MAĞAZASI + CÜZDAN
     * ==================================================================== */
    function buildStore(label, m) {
      styles();
      var body = open(label, m, 'Puanlarınla ürün al, cüzdan bakiyeni gör');
      var T = tabs(body, [
        { id: 'store', label: '🛒 Puan mağazası', render: storePane },
        { id: 'wallet', label: '👛 Cüzdan', render: walletPane },
        { id: 'market', label: '🏪 Proje pazarı', render: marketPane }
      ]);
      function storePane(p) {
        p.innerHTML = '<div class="aep-card"><h3>🛒 Puan mağazası</h3><div class="aes-3col" id="aesPts"></div><div class="aep-grid" id="aesStore"><p class="aep-muted">Yükleniyor…</p></div></div>';
        if (user()) call('getUserPoints').then(function (r) { $('#aesPts', p).innerHTML = '<div class="aes-stat"><b>' + esc(r.points) + '</b><span>Puanın</span></div><div class="aes-stat"><b>' + esc(r.level) + '</b><span>Seviye</span></div>'; }, function () {});
        call('getStoreItems').then(function (it) {
          $('#aesStore', p).innerHTML = (it && it.length) ? it.map(function (x) {
            return '<div class="aep-fig"><b>' + esc(x.icon || '🎁') + ' ' + esc(x.name) + '</b><span class="aes-pill">' + esc(x.price_points) + ' puan</span><button type="button" class="aep-btn aep-primary" data-id="' + esc(x.id) + '">Satın al</button></div>';
          }).join('') : empty('Mağazada henüz ürün yok.');
        }, function (e) { $('#aesStore', p).innerHTML = empty('Mağaza yüklenemedi: ' + msgOf(e)); });
        $('#aesStore', p).addEventListener('click', function (ev) {
          var b = ev.target.closest('button[data-id]'); if (!b) return;
          if (!user()) { err('Satın almak için giriş yapmalısın.'); return; }
          if (!w.confirm('Bu ürünü puanlarınla satın almak istiyor musun?')) return;
          busyBtn(b, call('purchaseStoreItem', { itemId: b.getAttribute('data-id') })).then(function (r) { note((r && r.message) || 'Satın alındı.'); T.show('store'); }, function (e) { err(msgOf(e)); });
        });
      }
      function walletPane(p) {
        if (!user()) { loginCard(p, 'Cüzdanını görmek'); return; }
        p.innerHTML = '<div class="aep-card"><h3>👛 Cüzdan</h3><div class="aes-3col"><div class="aes-stat"><b id="aesBal">…</b><span>Bakiye (TL)</span></div></div>' +
          '<label class="aes-field">Çekim tutarı (TL)<input id="aesWd" type="number" min="1" step="1"></label><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesWdGo">Çekim talebi gönder</button></div></div>';
        function bal() { call('getWalletBalance').then(function (r) { $('#aesBal', p).textContent = Number(r.balance || 0).toLocaleString('tr-TR'); }, function (e) { $('#aesBal', p).textContent = '—'; err(msgOf(e)); }); }
        $('#aesWdGo', p).addEventListener('click', function () {
          var a = Number($('#aesWd', p).value); if (!(a > 0)) { err('Geçerli bir tutar gir.'); return; }
          busyBtn(this, call('withdrawFunds', { amount: a })).then(function (r) { note((r && r.message) || 'Talep alındı.'); bal(); }, function (e) { err(msgOf(e)); });
        });
        bal();
      }
      function marketPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>🏪 Proje pazarı</h3><div class="aep-grid" id="aesMk"><p class="aep-muted">Yükleniyor…</p></div></div>';
        call('getMarketProjects').then(function (r) {
          var it = Array.isArray(r) ? r : (r && (r.projects || r.items)) || [];
          $('#aesMk', p).innerHTML = it.length ? it.map(function (x) {
            return '<div class="aep-fig"><b>' + esc(x.title || x.name || 'Proje') + '</b><span class="aep-muted">' + esc(String(x.description || '').slice(0, 120)) + '</span>' +
              (x.price != null ? '<span class="aes-pill">' + esc(x.price) + '</span>' : '') + (x.id ? '<button type="button" class="aep-btn aep-primary" data-id="' + esc(x.id) + '">Satın al</button>' : '') + '</div>';
          }).join('') : empty('Pazarda henüz proje yok.');
        }, function (e) { $('#aesMk', p).innerHTML = empty('Pazar yüklenemedi: ' + msgOf(e)); });
        $('#aesMk', p).addEventListener('click', function (ev) {
          var b = ev.target.closest('button[data-id]'); if (!b) return;
          if (!user()) { err('Satın almak için giriş yapmalısın.'); return; }
          if (!w.confirm('Bu projeyi satın almak istiyor musun?')) return;
          busyBtn(b, call('buyMarketProject', { projectId: b.getAttribute('data-id') })).then(function (r) { note((r && r.message) || 'Satın alındı.'); }, function (e) { err(msgOf(e)); });
        });
      }
      return true;
    }

    /* ======================================================================
     *  GÖREVLER + SERİ
     * ==================================================================== */
    function buildTasks(label, m) {
      styles();
      var body = open(label, m, 'Günlük ve sosyal görevleri tamamla, seri ödülünü al');
      if (!user()) { loginCard(body, 'Görevleri görmek'); return true; }
      tabs(body, [
        { id: 'daily', label: '📅 Günlük', render: dailyPane },
        { id: 'social', label: '🌐 Sosyal', render: socialPane },
        { id: 'streak', label: '🔥 Günlük seri', render: streakPane }
      ], label === 'Günlük Seri ve Uzay Modu' ? 'streak' : 'daily');
      function listPane(p, title, fn, doneFn, textKey) {
        p.innerHTML = '<div class="aep-card"><h3>' + title + '</h3><div class="aep-list"><p class="aep-muted">Yükleniyor…</p></div></div>';
        var box = $('.aep-list', p);
        function load() {
          call(fn).then(function (ts) {
            ts = Array.isArray(ts) ? ts : (ts && ts.tasks) || [];
            box.innerHTML = ts.length ? ts.map(function (t) {
              var tx = t[textKey] || t.task_text || t.platform || 'Görev';
              return '<div class="aep-item"><span class="aep-item-name">' + esc(tx) + ' <span class="aes-pill">+' + esc(t.points || t.points_reward || 0) + ' puan</span>' +
                (t.url && t.url !== '#' ? ' <a href="' + esc(t.url) + '" target="_blank" rel="noopener noreferrer">Aç ↗</a>' : '') + '</span>' +
                (t.completed ? '<span class="aes-pill ok">Tamamlandı</span>' : '<button type="button" class="aep-btn" data-id="' + esc(t.id) + '">Tamamla</button>') + '</div>';
            }).join('') : empty('Bugün için görev yok.');
          }, function (e) { box.innerHTML = empty('Görevler yüklenemedi: ' + msgOf(e)); });
        }
        box.addEventListener('click', function (ev) {
          var b = ev.target.closest('button[data-id]'); if (!b) return;
          busyBtn(b, call(doneFn, { taskId: b.getAttribute('data-id') })).then(function (r) { note((r && r.message) || 'Görev tamamlandı.'); load(); }, function (e) { err(msgOf(e)); });
        });
        load();
      }
      function dailyPane(p) { listPane(p, '📅 Günlük görevler', 'getDailyTasks', 'completeDailyTask', 'task_text'); }
      function socialPane(p) { listPane(p, '🌐 Sosyal görevler', 'getSocialTasks', 'verifySocialFollow', 'platform'); }
      function streakPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>🔥 Günlük seri</h3><div class="aes-3col" id="aesSt"><p class="aep-muted">Yükleniyor…</p></div><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesStClaim">Bugünkü ödülü al</button></div></div>';
        function load() {
          call('getStreakStatus').then(function (r) {
            r = r || {};
            $('#aesSt', p).innerHTML = '<div class="aes-stat"><b>' + esc(r.streakCount != null ? r.streakCount : (r.streak != null ? r.streak : 0)) + '</b><span>Gün serisi</span></div>' +
              '<div class="aes-stat"><b>' + esc(r.todayReward != null ? r.todayReward : (r.reward != null ? r.reward : '—')) + '</b><span>Bugünkü ödül (puan)</span></div>' +
              '<div class="aes-stat"><b>' + (r.claimedToday ? '✓' : '—') + '</b><span>Bugün alındı mı</span></div>';
          }, function (e) { $('#aesSt', p).innerHTML = empty('Seri yüklenemedi: ' + msgOf(e)); });
        }
        $('#aesStClaim', p).addEventListener('click', function () {
          busyBtn(this, call('claimDailyStreak')).then(function (r) { note((r && (r.message || r.error)) || 'Ödül alındı.'); load(); }, function (e) { err(msgOf(e)); });
        });
        load();
      }
      return true;
    }

    /* ======================================================================
     *  GELEN KUTUSU
     * ==================================================================== */
    function buildInbox(label, m) {
      styles();
      var body = open(label, m, 'Davetler, talepler ve sistem bildirimleri');
      if (!user()) { loginCard(body, 'Gelen kutunu görmek'); return true; }
      body.innerHTML = '<div class="aes-wrap"><div class="aep-card"><h3>📥 Gelen kutusu</h3><div class="aep-row"><button type="button" class="aep-btn" id="aesInbRef">↻ Yenile</button></div><div class="aep-list" id="aesInb"><p class="aep-muted">Yükleniyor…</p></div></div></div>';
      var box = $('#aesInb', body);
      function load() {
        call('getInboxItems').then(function (it) {
          it = Array.isArray(it) ? it : [];
          box.innerHTML = it.length ? it.map(function (x) {
            var inv = x.type === 'team_invite';
            return '<div class="aep-item" style="align-items:flex-start"><span class="aep-item-name"><span class="aes-pill">' + esc(x.type) + '</span> ' +
              esc(x.message || x.project_title || x.team_name || '') + '<br><small class="aep-muted">' + esc(x.sender_email) + ' · ' + esc(fdate(x.created_at)) + '</small></span>' +
              (inv ? '<span class="aep-item-act"><button type="button" class="aep-btn aep-primary" data-a="acc" data-id="' + esc(x.id) + '" data-team="' + esc(x.team_id || '') + '">Kabul</button><button type="button" class="aep-btn" data-a="rej" data-id="' + esc(x.id) + '">Reddet</button></span>' : '') + '</div>';
          }).join('') : empty('Gelen kutun boş.');
        }, function (e) { box.innerHTML = empty('Gelen kutusu yüklenemedi: ' + msgOf(e)); });
      }
      box.addEventListener('click', function (ev) {
        var b = ev.target.closest('button[data-a]'); if (!b) return;
        var fn = b.getAttribute('data-a') === 'acc' ? 'acceptTeamInvite' : 'rejectTeamInvite';
        busyBtn(b, call(fn, { inboxId: b.getAttribute('data-id'), teamId: b.getAttribute('data-team') || '' })).then(function (r) { note((r && r.message) || 'Tamam.'); load(); }, function (e) { err(msgOf(e)); });
      });
      $('#aesInbRef', body).addEventListener('click', load);
      load();
      return true;
    }

    /* ======================================================================
     *  YORUMLAR VE TOPLULUK + DUYURULAR
     * ==================================================================== */
    function buildCommunity(label, m) {
      styles();
      var body = open(label, m, 'Topluluk yorumları ve duyurular');
      if (label === 'Duyurular') {
        annPane(body);
        return true;
      }
      tabs(body, [
        { id: 'comments', label: '💬 Yorumlar', render: commentsPane },
        { id: 'teams', label: '👥 Takımlar', render: function (p) { p.innerHTML = '<div class="aep-card"><h3>👥 Takımlar</h3><p class="aep-muted">Takım kur, koda katıl, üyelerle yazış.</p><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesGoTeam">Takım panelini aç</button></div></div>'; $('#aesGoTeam', p).onclick = function () { P.openFeature('Takım'); }; } }
      ], 'comments');

      function currentRole() {
        var u = user();
        try { return String(u && (typeof u.get === 'function' ? u.get('role') : u.role) || '').toLowerCase(); }
        catch (_) { return ''; }
      }

      function commentsPane(p) {
        p.innerHTML = '<div class="aep-card"><h3>💬 Yorum yaz</h3><label class="aes-field">Puan<select id="aesCmR"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select></label>' +
          '<textarea class="aep-input" id="aesCmT" rows="3" maxlength="500" placeholder="Düşüncelerini paylaş…"></textarea><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesCmGo">Gönder</button></div></div>' +
          '<div class="aep-card"><h3>Son yorumlar</h3><div class="aep-list" id="aesCmL"><p class="aep-muted">Yükleniyor…</p></div></div>';
        function load() {
          call('getComments').then(function (r) {
            var cs = (r && r.comments) || [];
            $('#aesCmL', p).innerHTML = cs.length ? cs.map(function (c) {
              return '<div class="aep-item" style="align-items:flex-start"><span class="aep-item-name">' + esc(c.user_name || 'Kullanıcı') + ' <span class="aes-pill">' + '★'.repeat(Math.max(0, Math.min(5, c.rating || 0))) + '</span><br><small style="font-weight:500">' + esc(c.comment) + '</small></span><small class="aep-muted">' + esc(fdate(c.createdAt)) + '</small></div>';
            }).join('') : empty('Henüz yorum yok.');
          }, function (e) { $('#aesCmL', p).innerHTML = empty('Yorumlar yüklenemedi: ' + msgOf(e)); });
        }
        $('#aesCmGo', p).addEventListener('click', function () {
          if (!user()) { err('Yorum yazmak için giriş yapmalısın.'); return; }
          var t = $('#aesCmT', p).value.trim(); if (!t) { err('Yorum boş olamaz.'); return; }
          busyBtn(this, call('addComment', { comment: t, rating: Number($('#aesCmR', p).value) })).then(function () { note('Yorumun eklendi.'); $('#aesCmT', p).value = ''; load(); }, function (e) { err(msgOf(e)); });
        });
        load();
      }

      function annPane(p) {
        var role = currentRole();
        var canManage = role === 'admin' || role === 'founder';
        var formHtml = canManage
          ? '<div class="aep-card"><h3>📢 Duyuru oluştur / düzenle</h3><form id="aesAnForm">' +
            '<input type="hidden" id="aesAnId" value="">' +
            '<label class="aes-field">Başlık<input id="aesAnTitle" maxlength="120" required placeholder="Duyuru başlığı"></label>' +
            '<label class="aes-field">Duyuru içeriği<textarea class="aep-input" id="aesAnContent" rows="4" maxlength="4000" required placeholder="Duyurunun içeriğini yaz…"></textarea></label>' +
            '<div class="aep-row"><button type="submit" class="aep-btn aep-primary" id="aesAnSave">📢 Duyuruyu yayınla</button><button type="button" class="aep-btn" id="aesAnCancel" hidden>Vazgeç</button></div>' +
            '<p class="aep-muted">Bu işlem ana sayfadaki Son Duyurular bölümünü de yeniler. Yetki sunucuda ayrıca doğrulanır.</p></form></div>'
          : '';
        p.innerHTML = formHtml + '<div class="aep-card"><div class="aep-row" style="justify-content:space-between"><h3 style="margin:0">📢 Son duyurular</h3><button type="button" class="aep-btn" id="aesAnRefresh">↻ Yenile</button></div><div class="aep-list" id="aesAn"><p class="aep-muted">Yükleniyor…</p></div></div>';

        var announcements = [];
        function resetForm() {
          if (!canManage) return;
          $('#aesAnId', p).value = '';
          $('#aesAnTitle', p).value = '';
          $('#aesAnContent', p).value = '';
          $('#aesAnSave', p).textContent = '📢 Duyuruyu yayınla';
          $('#aesAnCancel', p).hidden = true;
        }
        function load() {
          var list = $('#aesAn', p);
          list.innerHTML = '<p class="aep-muted">Duyurular yükleniyor…</p>';
          return call('getAnnouncements').then(function (rows) {
            announcements = Array.isArray(rows) ? rows : [];
            list.innerHTML = announcements.length ? announcements.map(function (item) {
              var actions = canManage
                ? '<span class="aep-item-act"><button type="button" class="aep-btn" data-a="edit" data-id="' + esc(item.id) + '">✏️ Düzenle</button><button type="button" class="aep-btn" data-a="delete" data-id="' + esc(item.id) + '">🗑️ Sil</button></span>'
                : '';
              return '<article class="aep-item" style="align-items:flex-start"><div style="min-width:0;flex:1"><strong class="aep-item-name">' + esc(item.title || 'Duyuru') + '</strong><p style="margin:7px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;color:#425a72;font:500 13px/1.6 Inter,system-ui,sans-serif">' + esc(item.content || '') + '</p><small class="aep-muted">' + esc(fdate(item.createdAt)) + '</small></div>' + actions + '</article>';
            }).join('') : empty('Henüz duyuru yok.');
            if (typeof w.loadAnnouncements === 'function') w.loadAnnouncements();
            if (typeof w.refreshAethrionHomeCommunity === 'function') w.refreshAethrionHomeCommunity();
            return announcements;
          }, function (e) {
            list.innerHTML = empty('Duyurular yüklenemedi: ' + msgOf(e));
            throw e;
          });
        }
        if (canManage) {
          $('#aesAnForm', p).addEventListener('submit', function (ev) {
            ev.preventDefault();
            var id = $('#aesAnId', p).value.trim();
            var title = $('#aesAnTitle', p).value.trim();
            var content = $('#aesAnContent', p).value.trim();
            if (!title || !content) { err('Başlık ve duyuru içeriği boş olamaz.'); return; }
            if (title.length > 120 || content.length > 4000) { err('Duyuru alanlarından biri izin verilen uzunluğu aşıyor.'); return; }
            var save = $('#aesAnSave', p);
            var operation = id ? 'editAnnouncement' : 'addAnnouncement';
            var params = { title: title, content: content };
            if (id) params.announcementId = id;
            busyBtn(save, call(operation, params)).then(function () {
              note(id ? 'Duyuru güncellendi.' : 'Duyuru yayınlandı.');
              resetForm();
              load().catch(function () {});
            }, function (e) { err(msgOf(e)); });
          });
          $('#aesAnCancel', p).addEventListener('click', resetForm);
          $('#aesAn', p).addEventListener('click', function (ev) {
            var button = ev.target.closest('button[data-a]');
            if (!button) return;
            var item = announcements.filter(function (x) { return String(x.id) === String(button.getAttribute('data-id')); })[0];
            if (!item) { err('Duyuru kaydı bulunamadı. Listeyi yenileyin.'); return; }
            if (button.getAttribute('data-a') === 'edit') {
              $('#aesAnId', p).value = item.id;
              $('#aesAnTitle', p).value = item.title || '';
              $('#aesAnContent', p).value = item.content || '';
              $('#aesAnSave', p).textContent = 'Değişiklikleri kaydet';
              $('#aesAnCancel', p).hidden = false;
              $('#aesAnTitle', p).focus();
              return;
            }
            if (button.getAttribute('data-a') === 'delete') {
              if (!w.confirm('Bu duyuru kalıcı olarak silinsin mi?')) return;
              busyBtn(button, call('deleteAnnouncement', { announcementId: item.id })).then(function () {
                note('Duyuru silindi.');
                if ($('#aesAnId', p).value === item.id) resetForm();
                load().catch(function () {});
              }, function (e) { err(msgOf(e)); });
            }
          });
          $('#aesAnRefresh', p).addEventListener('click', function () { load().catch(function (e) { err(msgOf(e)); }); });
        } else {
          $('#aesAnRefresh', p).addEventListener('click', function () { load().catch(function (e) { err(msgOf(e)); }); });
        }
        load().catch(function (e) { err(msgOf(e)); });
      }
      return true;
    }

    /* ======================================================================
     *  AYLIK YARIŞMA
     * ==================================================================== */
    function buildContest(label, m) {
      styles();
      var body = open(label, m, 'Aylık yarışma sıralaması ve katılım');
      body.innerHTML = '<div class="aes-wrap"><div class="aep-card"><h3>🏆 Aylık yarışma</h3><div class="aes-3col" id="aesCtInfo"></div><div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesCtJoin">Yarışmaya katıl</button></div></div>' +
        '<div class="aep-card"><h3>Sıralama</h3><div class="aep-list" id="aesCtRank"><p class="aep-muted">Yükleniyor…</p></div></div></div>';
      call('getActiveContest').then(function (c) {
        c = c || {};
        $('#aesCtInfo', body).innerHTML = '<div class="aes-stat"><b>' + esc(c.title || '—') + '</b><span>Yarışma</span></div><div class="aes-stat"><b>' + esc(c.month || '—') + '</b><span>Ay</span></div><div class="aes-stat"><b>' + esc(c.end_date ? fdate(c.end_date) : '—') + '</b><span>Bitiş</span></div>';
      }, function () { $('#aesCtInfo', body).innerHTML = empty('Aktif yarışma bilgisi alınamadı.'); });
      call('getContestRankingV2').then(function (r) {
        var rk = (r && r.ranking) || [];
        $('#aesCtRank', body).innerHTML = rk.length ? rk.map(function (x) {
          return '<div class="aep-item"><span class="aep-item-name">#' + esc(x.rank) + ' ' + esc(x.user_name) + '</span><span class="aes-pill">' + esc(x.total_points) + ' puan</span></div>';
        }).join('') : empty('Henüz katılımcı yok.');
      }, function (e) { $('#aesCtRank', body).innerHTML = empty('Sıralama yüklenemedi: ' + msgOf(e)); });
      $('#aesCtJoin', body).addEventListener('click', function () {
        if (!user()) { err('Katılmak için giriş yapmalısın.'); return; }
        busyBtn(this, call('joinContest')).then(function (r) { note((r && r.message) || 'Yarışmaya katıldın.'); P.openFeature(label); }, function (e) { err(msgOf(e)); });
      });
      return true;
    }

    /* ======================================================================
     *  KOD EDİTÖRÜ
     * ==================================================================== */
    function buildCode(label, m) {
      styles();
      var body = open(label, m, 'Yaz, çalıştır, kaydet ve indir');
      var tpl = {
        html: '<!doctype html>\n<html lang="tr">\n<head>\n  <meta charset="utf-8">\n  <title>Sayfam</title>\n  <style>body{font-family:system-ui;text-align:center;padding:40px}h1{color:#2c64d8}</style>\n</head>\n<body>\n  <h1>Merhaba AETHRION 👋</h1>\n  <button onclick="this.textContent=\'Tıklandı!\'">Bana tıkla</button>\n</body>\n</html>',
        js: 'const toplam = [1, 2, 3, 4].reduce((a, b) => a + b, 0);\ndocument.body.style.fontFamily = "system-ui";\ndocument.body.innerHTML = "<h2>Toplam: " + toplam + "</h2>";\nconsole.log("Hesaplandı:", toplam);'
      };
      body.innerHTML = '<div class="aes-wrap"><div class="aep-card"><h3>⌨️ Kod editörü</h3>' +
        '<div class="aep-row"><label class="aes-field" style="margin:0">Dil<select id="aesCdLang"><option value="html">HTML / CSS / JS</option><option value="js">JavaScript</option></select></label>' +
        '<button type="button" class="aep-btn aep-primary" id="aesCdRun">▶ Çalıştır</button><button type="button" class="aep-btn" id="aesCdSave">💾 Projeye kaydet</button><button type="button" class="aep-btn" id="aesCdDl">⬇ İndir</button><button type="button" class="aep-btn" id="aesCdAi">✨ AI\'dan yardım iste</button></div>' +
        '<textarea class="aes-code" id="aesCdSrc" spellcheck="false"></textarea>' +
        '<h4 style="margin:12px 0 6px;color:#10243a">Önizleme</h4><iframe class="aes-frame" id="aesCdOut" title="Önizleme" sandbox="allow-scripts"></iframe></div></div>';
      var src = $('#aesCdSrc', body), lang = $('#aesCdLang', body), out = $('#aesCdOut', body);
      src.value = tpl.html;
      lang.addEventListener('change', function () { if (!src.value.trim() || src.value === tpl.html || src.value === tpl.js) src.value = tpl[lang.value]; });
      src.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') { e.preventDefault(); var s = src.selectionStart; src.value = src.value.slice(0, s) + '  ' + src.value.slice(src.selectionEnd); src.selectionStart = src.selectionEnd = s + 2; }
      });
      function run() {
        var code = src.value;
        out.srcdoc = lang.value === 'js' ? '<!doctype html><meta charset="utf-8"><body><script>try{' + code.replace(/<\/script/gi, '<\\/script') + '}catch(e){document.body.innerHTML="<pre style=color:#b42424>"+e+"</pre>"}<\/script>' : code;
      }
      $('#aesCdRun', body).addEventListener('click', run);
      $('#aesCdDl', body).addEventListener('click', function () {
        var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([src.value], { type: 'text/plain;charset=utf-8' }));
        a.download = 'aethrion-kod-' + Date.now() + (lang.value === 'js' ? '.js' : '.html'); d.body.appendChild(a); a.click(); a.remove();
      });
      $('#aesCdSave', body).addEventListener('click', function () {
        if (!user()) { err('Kaydetmek için giriş yapmalısın.'); return; }
        var n = w.prompt('Proje adı:', 'Kod projesi'); if (!n || !n.trim()) return;
        busyBtn(this, call('saveProject', { name: n.trim(), type: 'Kod', content: JSON.stringify({ lang: lang.value, code: src.value }) })).then(function () { note('Kod projesi kaydedildi.'); }, function (e) { err(msgOf(e)); });
      });
      $('#aesCdAi', body).addEventListener('click', function () {
        P.openFeature('AETHRION AI');
        setTimeout(function () { var inp = $('#dashboardAiInput'); if (inp) { inp.value = 'Şu kodu incele ve iyileştir:\n' + src.value.slice(0, 1500); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.focus(); } }, 500);
      });
      run();
      return true;
    }

    /* ======================================================================
     *  A27 API ANAHTARI
     * ==================================================================== */
    function buildApiKeys(label, m) {
      styles();
      var body = open(label, m, 'A27 API anahtarlarını oluştur, listele ve iptal et');
      if (!user()) { loginCard(body, 'API anahtarlarını yönetmek'); return true; }
      body.innerHTML = '<div class="aes-wrap"><div class="aep-card"><h3>🔑 Yeni anahtar</h3>' +
        '<label class="aes-field">Anahtar adı<input id="aesKName" maxlength="40"></label>' +
        '<label class="aes-field">Süre<select id="aesKDur"><option value="1w">1 hafta</option><option value="1m">1 ay</option><option value="1y">1 yıl</option><option value="unlimited">Süresiz</option></select></label>' +
        '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesKGo">Anahtar oluştur</button></div><div id="aesKNew"></div></div>' +
        '<div class="aep-card"><h3>Anahtarlarım</h3><div class="aep-list" id="aesKList"><p class="aep-muted">Yükleniyor…</p></div></div></div>';
      var box = $('#aesKList', body);
      function load() {
        call('getMyV27ApiKeys').then(function (r) {
          var ks = (r && r.keys) || (Array.isArray(r) ? r : []);
          box.innerHTML = ks.length ? ks.map(function (k) {
            return '<div class="aep-item"><span class="aep-item-name">' + esc(k.key_name) + ' <small class="aep-muted">' + esc(k.key_masked || k.key_prefix || '') + '</small> <span class="aes-pill ' + (k.is_active ? 'ok' : 'bad') + '">' + (k.is_active ? 'Aktif' : 'Pasif') + '</span> <span class="aes-pill">' + esc(k.durationLabel || k.duration || '') + '</span></span>' +
              (k.is_active ? '<button type="button" class="aep-btn" data-id="' + esc(k.id || k.objectId) + '">İptal et</button>' : '') + '</div>';
          }).join('') : empty('Henüz API anahtarın yok.');
        }, function (e) { box.innerHTML = empty('Anahtarlar yüklenemedi: ' + msgOf(e)); });
      }
      $('#aesKGo', body).addEventListener('click', function () {
        var n = $('#aesKName', body).value.trim(); if (!n) { err('Anahtar adı gerekli.'); return; }
        busyBtn(this, call('createV27ApiKey', { keyName: n, duration: $('#aesKDur', body).value, scopes: ['chat'] })).then(function (r) {
          var k = r && (r.plainKey || r.apiKey || r.key);
          $('#aesKNew', body).innerHTML = k ? '<p class="aep-muted">Anahtarını şimdi kopyala; bir daha tam olarak gösterilmeyebilir:</p><input class="aep-input" readonly value="' + esc(k) + '" onclick="this.select()">' : '<p class="aep-muted">' + esc((r && r.message) || 'Anahtar oluşturuldu.') + '</p>';
          note('API anahtarı oluşturuldu.'); load();
        }, function (e) { err(msgOf(e)); });
      });
      box.addEventListener('click', function (ev) {
        var b = ev.target.closest('button[data-id]'); if (!b) return;
        if (!w.confirm('Bu anahtar iptal edilsin mi?')) return;
        busyBtn(b, call('revokeV27ApiKey', { keyId: b.getAttribute('data-id') })).then(function () { note('Anahtar iptal edildi.'); load(); }, function (e) { err(msgOf(e)); });
      });
      load();
      return true;
    }

    /* ======================================================================
     *  BELGELER (API Belgeleri / Dokümantasyon / Güvenlik): yerel sayfanın
     *  içeriği panelin içinde gösterilir (ayrı sayfaya / iframe'e gidilmez)
     * ==================================================================== */
    function docPanel(url) {
      return function (label, m) {
        styles();
        var body = open(label, m, m && m[3]);
        body.innerHTML = '<div class="aes-wrap"><div class="aep-card aes-doc"><p class="aep-muted">Yükleniyor…</p></div></div>';
        var card = $('.aes-doc', body);
        fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          $$('script,style,link,iframe,object,embed,nav,header,footer,form,button,input,[onclick]', doc).forEach(function (n) { n.remove(); });
          var root = doc.querySelector('main') || doc.body;
          $$('*', root).forEach(function (n) {
            Array.prototype.slice.call(n.attributes).forEach(function (a) {
              if (/^on/i.test(a.name) || a.name === 'style' || a.name === 'class' || a.name === 'id') n.removeAttribute(a.name);
              else if ((a.name === 'href' || a.name === 'src') && /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
            });
            if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
          });
          var txt = (root.textContent || '').trim();
          if (txt.length < 40) throw new Error('İçerik boş');
          card.innerHTML = root.innerHTML;
        }).catch(function (e) { card.innerHTML = '<h3>' + esc(label) + '</h3><p class="aep-muted">İçerik yüklenemedi (' + esc(msgOf(e)) + ').</p>'; });
        return true;
      };
    }

    function buildSecurity(label, m) {
      styles();
      var body = open(label, m, 'Hesap güvenliği ve ebeveyn denetimi');
      if (!user()) { loginCard(body, 'Güvenlik ayarlarını görmek'); return true; }
      body.innerHTML = '<div class="aes-wrap"><div class="aep-card"><h3>🔐 Hesap güvenliği</h3><div class="aes-3col" id="aesSc"></div><p class="aep-muted">E-posta doğrulaması, şifre yenileme ve ebeveyn denetimi hesap güvenliği ve oturum sayfasından yönetilir.</p>' +
        '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesScPw">Şifre sıfırlama e-postası gönder</button><a class="aep-btn" href="./hesap-ve-oturum-guvenligi.html" target="_blank" rel="noopener noreferrer">Ayrıntılı güvenlik sayfası ↗</a></div></div>' +
        '<div class="aep-card"><h3>👨‍👩‍👧 Ebeveyn ayarları</h3><div id="aesPar"><p class="aep-muted">Yükleniyor…</p></div></div></div>';
      var u = user();
      $('#aesSc', body).innerHTML = '<div class="aes-stat"><b>' + esc(u.get('email') || '—') + '</b><span>E-posta</span></div><div class="aes-stat"><b>' + (u.get('emailVerified') ? '✓ Doğrulandı' : '✗ Doğrulanmadı') + '</b><span>Doğrulama</span></div><div class="aes-stat"><b>' + esc(u.get('role') || 'user') + '</b><span>Rol</span></div>';
      $('#aesScPw', body).addEventListener('click', function () {
        if (!w.Parse || !w.Parse.User || !w.Parse.User.requestPasswordReset) { err('Bu işlem şu an kullanılamıyor.'); return; }
        busyBtn(this, w.Parse.User.requestPasswordReset(u.get('email'))).then(function () { note('Şifre sıfırlama e-postası gönderildi.'); }, function (e) { err(msgOf(e)); });
      });
      call('getParentSettings').then(function (r) {
        $('#aesPar', body).innerHTML = '<p class="aep-muted">' + ((r && (r.has_parent || r.hasParent || r.parent_email)) ? 'Ebeveyn denetimi bu hesapta etkin.' : 'Bu hesapta ebeveyn denetimi etkin değil.') + '</p>';
      }, function () { $('#aesPar', body).innerHTML = '<p class="aep-muted">Bu hesapta ebeveyn denetimi etkin değil.</p>'; });
      return true;
    }

    /* ======================================================================
     *  DAVET LİDERLİK TABLOSU + ANKETLER
     * ==================================================================== */
    function buildReferral(label, m) {
      styles();
      var body = open(label, m, 'Davet kodun, davet edenlerin sıralaması ve kod kullanma');
      body.innerHTML = '<div class="aes-wrap"><div class="aep-card"><h3>🎁 Davet kodun</h3><div class="aes-3col"><div class="aes-stat"><b id="aesRfCode">—</b><span>Kodun</span></div></div>' +
        '<div class="aep-row"><button type="button" class="aep-btn aep-primary" id="aesRfGen">Kodumu göster / oluştur</button><button type="button" class="aep-btn" id="aesRfCopy">Kopyala</button></div>' +
        '<label class="aes-field">Bir davet kodu kullan<input id="aesRfIn" maxlength="30"></label><div class="aep-row"><button type="button" class="aep-btn" id="aesRfApply">Kodu kullan</button></div></div>' +
        '<div class="aep-card"><h3>🏅 Liderlik tablosu</h3><div class="aep-list" id="aesRfList"><p class="aep-muted">Yükleniyor…</p></div></div></div>';
      call('getReferralLeaderboard').then(function (r) {
        var it = Array.isArray(r) ? r : (r && (r.leaderboard || r.items || r.users)) || [];
        $('#aesRfList', body).innerHTML = it.length ? it.map(function (x, i) {
          return '<div class="aep-item"><span class="aep-item-name">#' + esc(x.rank || i + 1) + ' ' + esc(x.name || 'İsimsiz') + '</span><span class="aes-pill">' + esc(x.count || 0) + ' davet</span></div>';
        }).join('') : empty('Henüz sıralama yok.');
      }, function (e) { $('#aesRfList', body).innerHTML = empty('Sıralama yüklenemedi: ' + msgOf(e)); });
      $('#aesRfGen', body).addEventListener('click', function () {
        if (!user()) { err('Giriş yapmalısın.'); return; }
        busyBtn(this, call('generateReferralCode')).then(function (r) { $('#aesRfCode', body).textContent = (r && r.referral_code) || '—'; }, function (e) { err(msgOf(e)); });
      });
      $('#aesRfCopy', body).addEventListener('click', function () {
        var c = $('#aesRfCode', body).textContent; if (!c || c === '—') { err('Önce kodunu oluştur.'); return; }
        try { navigator.clipboard.writeText(c).then(function () { note('Kod kopyalandı.'); }); } catch (_) { err('Kopyalanamadı.'); }
      });
      $('#aesRfApply', body).addEventListener('click', function () {
        if (!user()) { err('Giriş yapmalısın.'); return; }
        var c = $('#aesRfIn', body).value.trim(); if (!c) { err('Kod gir.'); return; }
        busyBtn(this, call('applyReferral', { code: c })).then(function (r) { note((r && r.message) || 'Kod uygulandı.'); }, function (e) { err(msgOf(e)); });
      });
      return true;
    }
    function buildPolls(label, m) {
      styles();
      var body = open(label, m, 'Aktif topluluk anketi');
      var currentRole = (function () {
        var u = user();
        try { return String(u && (typeof u.get === 'function' ? u.get('role') : u.role) || '').toLowerCase(); }
        catch (_) { return ''; }
      })();
      var isFounder = currentRole === 'founder';
      var formHtml = isFounder
        ? '<div class="aep-card"><h3>🗳️ Kurucu anket yönetimi</h3><form id="aesPollForm">' +
          '<input type="hidden" id="aesPollId" value="">' +
          '<label class="aes-field">Anket sorusu<input id="aesPollQuestion" maxlength="240" required placeholder="Topluluğa ne sormak istiyorsun?"></label>' +
          '<div class="aes-field"><span>Seçenekler (2–8)</span><div id="aesPollOptions"></div></div>' +
          '<div class="aep-row"><button type="button" class="aep-btn" id="aesPollAdd">＋ Seçenek ekle</button><label class="aes-field" style="margin:0">Süre<select id="aesPollDuration"><option value="1">1 gün</option><option value="3" selected>3 gün</option><option value="7">7 gün</option><option value="14">14 gün</option><option value="30">30 gün</option></select></label></div>' +
          '<div class="aep-row"><button type="submit" class="aep-btn aep-primary" id="aesPollSave">Anketi yayınla</button><button type="button" class="aep-btn" id="aesPollCancel" hidden>Vazgeç</button></div>' +
          '<p class="aep-muted">Seçenekler düzenlenirse önceki oylar sıfırlanır. Anket oluşturma ve yönetme yetkisi yalnızca kurucudadır.</p></form></div>'
        : '';
      body.innerHTML = '<div class="aes-wrap">' + formHtml + '<div class="aep-card"><div class="aep-row" style="justify-content:space-between"><h3 style="margin:0">🗳️ Aktif anket</h3><button type="button" class="aep-btn" id="aesPollRefresh">↻ Yenile</button></div><div id="aesPl"><p class="aep-muted">Yükleniyor…</p></div></div></div>';

      var activePoll = null;
      var optionsHost = isFounder ? $('#aesPollOptions', body) : null;
      function setOptions(values) {
        if (!isFounder) return;
        var items = Array.isArray(values) && values.length ? values : ['', ''];
        optionsHost.innerHTML = '';
        items.slice(0, 8).forEach(function (value) {
          var row = d.createElement('div');
          row.className = 'aes-option-row';
          row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:7px 0';
          var input = d.createElement('input');
          input.type = 'text';
          input.className = 'aep-input';
          input.style.cssText = 'flex:1;min-width:0;margin:0';
          input.maxLength = 100;
          input.placeholder = 'Seçenek';
          input.value = String(value || '');
          input.required = true;
          var remove = d.createElement('button');
          remove.type = 'button';
          remove.className = 'aep-btn';
          remove.textContent = 'Sil';
          remove.setAttribute('aria-label', 'Seçeneği kaldır');
          remove.setAttribute('data-remove-option', '1');
          row.appendChild(input);
          row.appendChild(remove);
          optionsHost.appendChild(row);
        });
        updateRemoveButtons();
      }
      function updateRemoveButtons() {
        if (!isFounder) return;
        var rows = optionsHost.querySelectorAll('.aes-option-row');
        Array.prototype.forEach.call(rows, function (row) {
          var remove = row.querySelector('[data-remove-option]');
          if (remove) remove.disabled = rows.length <= 2;
        });
      }
      function resetForm() {
        if (!isFounder) return;
        $('#aesPollId', body).value = '';
        $('#aesPollQuestion', body).value = '';
        $('#aesPollDuration', body).value = '3';
        $('#aesPollSave', body).textContent = 'Anketi yayınla';
        $('#aesPollCancel', body).hidden = true;
        setOptions(['', '']);
      }
      function load() {
        var box = $('#aesPl', body);
        box.innerHTML = '<p class="aep-muted">Aktif anket yükleniyor…</p>';
        return call('getActivePoll').then(function (poll) {
          activePoll = poll || null;
          if (!activePoll) {
            box.innerHTML = empty('Şu anda aktif anket yok.');
            if (isFounder) resetForm();
            if (typeof w.loadPoll === 'function') w.loadPoll();
            if (typeof w.refreshAethrionHomeCommunity === 'function') w.refreshAethrionHomeCommunity();
            return null;
          }
          var options = Array.isArray(activePoll.options) ? activePoll.options : [];
          var votes = Array.isArray(activePoll.votes) ? activePoll.votes : [];
          var total = votes.reduce(function (sum, value) { return sum + (Number(value) || 0); }, 0);
          var hasVoted = activePoll.hasVoted === true;
          var loggedIn = !!user();
          var rows = options.map(function (option, index) {
            var count = Number(votes[index]) || 0;
            var percent = total ? Math.round(count * 100 / total) : 0;
            var disabled = !loggedIn || hasVoted;
            var label = !loggedIn ? 'Giriş yapın' : (hasVoted ? 'Oy kullanıldı' : 'Oy ver');
            return '<div class="aep-item"><div style="min-width:0;flex:1"><strong class="aep-item-name">' + esc(option) + '</strong><div style="height:7px;margin-top:7px;background:#e5edf5;border-radius:99px;overflow:hidden"><div style="height:100%;width:' + percent + '%;background:linear-gradient(90deg,#2c64d8,#6e9cff);border-radius:99px"></div></div><small class="aep-muted">' + count + ' oy · %' + percent + '</small></div><button type="button" class="aep-btn" data-i="' + index + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button></div>';
          }).join('');
          var manage = isFounder
            ? '<div class="aep-row"><button type="button" class="aep-btn" id="aesPollEdit">✏️ Anketi düzenle</button><button type="button" class="aep-btn" id="aesPollDelete">🗑️ Anketi sil</button></div>'
            : '';
          box.innerHTML = '<h4 style="margin:0 0 10px;color:#10243a">' + esc(activePoll.question) + '</h4><div class="aep-list">' + rows + '</div>' +
            '<p class="aep-muted">' + total + ' oy kullanıldı.' + (activePoll.end_date ? ' · Bitiş: ' + esc(fdate(activePoll.end_date)) : '') + '</p>' +
            (hasVoted ? '<p class="aep-muted">Bu ankette oyunu kullandın.</p>' : (!loggedIn ? '<p class="aep-muted">Oy kullanmak için giriş yapmalısın.</p>' : '')) + manage;

          if (isFounder) {
            $('#aesPollEdit', box).addEventListener('click', function () {
              $('#aesPollId', body).value = activePoll.id || '';
              $('#aesPollQuestion', body).value = activePoll.question || '';
              $('#aesPollDuration', body).value = '3';
              $('#aesPollSave', body).textContent = 'Değişiklikleri kaydet';
              $('#aesPollCancel', body).hidden = false;
              setOptions(options);
              $('#aesPollQuestion', body).focus();
            });
            $('#aesPollDelete', box).addEventListener('click', function () {
              if (!w.confirm('Aktif anket kalıcı olarak silinsin mi?')) return;
              busyBtn(this, call('deletePoll', { pollId: activePoll.id })).then(function () {
                note('Anket silindi.');
                resetForm();
                load();
              }, function (e) { err(msgOf(e)); });
            });
          }
          if (typeof w.loadPoll === 'function') w.loadPoll();
          if (typeof w.refreshAethrionHomeCommunity === 'function') w.refreshAethrionHomeCommunity();
          return activePoll;
        }, function (e) {
          box.innerHTML = empty('Anket yüklenemedi: ' + msgOf(e));
          throw e;
        });
      }

      if (isFounder) {
        setOptions(['', '']);
        $('#aesPollAdd', body).addEventListener('click', function () {
          var rows = optionsHost.querySelectorAll('.aes-option-row');
          if (rows.length >= 8) { err('En fazla 8 seçenek ekleyebilirsin.'); return; }
          var values = Array.prototype.map.call(rows, function (row) { return row.querySelector('input').value; });
          values.push('');
          setOptions(values);
        });
        optionsHost.addEventListener('click', function (ev) {
          if (!ev.target.closest('[data-remove-option]')) return;
          var rows = optionsHost.querySelectorAll('.aes-option-row');
          if (rows.length <= 2) return;
          ev.target.closest('.aes-option-row').remove();
          updateRemoveButtons();
        });
        $('#aesPollCancel', body).addEventListener('click', resetForm);
        $('#aesPollForm', body).addEventListener('submit', function (ev) {
          ev.preventDefault();
          var question = $('#aesPollQuestion', body).value.trim();
          var rows = optionsHost.querySelectorAll('.aes-option-row input');
          var options = Array.prototype.map.call(rows, function (input) { return input.value.trim(); }).filter(Boolean);
          var unique = Object.create(null);
          options = options.filter(function (option) {
            var key = option.toLocaleLowerCase('tr-TR');
            if (unique[key]) return false;
            unique[key] = true;
            return true;
          });
          var duration = Number($('#aesPollDuration', body).value);
          if (!question) { err('Anket sorusu gerekli.'); return; }
          if (options.length < 2 || options.length > 8) { err('2 ile 8 arasında geçerli seçenek gir.'); return; }
          if (!Number.isInteger(duration) || duration < 1 || duration > 30) { err('Anket süresi 1–30 gün arasında olmalı.'); return; }
          var pollId = $('#aesPollId', body).value.trim();
          var operation = pollId ? 'editPoll' : 'createPoll';
          busyBtn($('#aesPollSave', body), call(operation, { pollId: pollId || undefined, question: question, options: options, duration: duration })).then(function (result) {
            note(pollId ? (result && result.votesReset ? 'Anket güncellendi; seçenekler değiştiği için oylar sıfırlandı.' : 'Anket güncellendi.') : 'Anket yayınlandı.');
            resetForm();
            load();
          }, function (e) { err(msgOf(e)); });
        });
      }
      $('#aesPollRefresh', body).addEventListener('click', function () { load().catch(function (e) { err(msgOf(e)); }); });
      $('#aesPl', body).addEventListener('click', function (ev) {
        var button = ev.target.closest('button[data-i]');
        if (!button) return;
        if (!user()) { err('Oy vermek için giriş yapmalısın.'); return; }
        if (!activePoll || activePoll.hasVoted) { err('Bu ankette daha önce oy kullanmış olabilirsin. Listeyi yenile.'); return; }
        busyBtn(button, call('votePoll', { pollId: activePoll.id, optionIndex: Number(button.getAttribute('data-i')) })).then(function () {
          note('Oyun kaydedildi.');
          load();
        }, function (e) { err(msgOf(e)); });
      });
      load().catch(function (e) { err(msgOf(e)); });
      return true;
    }


    /* ---------- kayıt ---------- */
    var B = P.builtin;
    B['3D Studio'] = build3D;
    B['Projelerim'] = buildProjects;
    B['Takım'] = buildTeam;
    B['Team Ortak Çalışma'] = buildTeam;
    B['Topluluk ve Takımlar'] = buildTeam;
    B['AETHRION Akademi'] = buildAcademy;
    B['Puan Mağazası + Cüzdan'] = buildStore;
    B['Günlük ve Sosyal Görevler'] = buildTasks;
    B['Yorumlar ve Topluluk'] = buildCommunity;
    B['Duyurular'] = buildCommunity;
    B['Aylık Yarışma'] = buildContest;
    B['Davet Liderlik Tablosu'] = buildReferral;
    B['Anketler'] = buildPolls;
    B['Proje Talepleri'] = buildStaffProjectRequests;
    B['Günlük Görevler ve Puan'] = buildTasks;
    B['Günlük Seri ve Uzay Modu'] = buildTasks;
    B['Zeka Testi ve Quiz'] = buildAcademy;
    B['Savaş Modu + Çoklu AI'] = buildBattlePanel;
    B['Kazanç Araçları'] = buildStore;
    B['Davet Kodu'] = buildReferral;
    w.openProjectRequestsPanel = function () { return P.openFeature('Proje Talepleri') === true; };
    B['Kod Editörü'] = buildCode;
    B['A27 API Anahtarı'] = buildApiKeys;
    B['Beta API Yönetimi'] = buildApiKeys;
    B['API Belgeleri'] = docPanel('./api.html');
    B['Dokümantasyon'] = docPanel('./dokumantasyon.html');
    B['Güvenlik ve Ebeveyn Ayarları'] = buildSecurity;
    B['Güvenlik Ayarları'] = buildSecurity;
    w.__aethrionStudioReady = true;
    return true;
  }

  if (!boot()) {
    var n = 0, t = setInterval(function () { if (boot() || ++n > 80) clearInterval(t); }, 100);
  }
})(window, document);

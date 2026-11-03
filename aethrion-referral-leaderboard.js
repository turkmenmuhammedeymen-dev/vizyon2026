/* AETHRION public referral leaderboard.
 * Loads the existing public Cloud Code endpoint and always exits the loading state.
 */
(function (window, document) {
  'use strict';
  if (window.__aethrionReferralLeaderboardInstalled) return;
  window.__aethrionReferralLeaderboardInstalled = true;

  var endpoint = 'getReferralLeaderboard';
  var containerId = 'referralLeaderboard';

  function node() { return document.getElementById(containerId); }
  function message(text, isError) {
    var host = node();
    if (!host) return;
    host.replaceChildren();
    var line = document.createElement('div');
    line.textContent = text;
    line.style.cssText = 'padding:22px;text-align:center;color:' + (isError ? '#fca5a5' : 'var(--text3, #9ca3af)');
    host.appendChild(line);
    host.setAttribute('aria-live', 'polite');
  }
  function withTimeout(promise, ms) {
    var timer;
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        timer = window.setTimeout(function () {
          var error = new Error('Davet sıralaması sunucusu zaman aşımına uğradı.');
          error.code = 'AETHRION_TIMEOUT';
          reject(error);
        }, ms);
      })
    ]).finally(function () { window.clearTimeout(timer); });
  }
  function render(rows) {
    var host = node();
    if (!host) return;
    host.replaceChildren();
    if (!Array.isArray(rows)) throw new Error('Sunucudan beklenmeyen davet sıralaması yanıtı alındı.');
    var sorted = rows.filter(function (row) {
      return row && typeof row === 'object';
    }).map(function (row) {
      return {
        name: String(row.name || 'AETHRION Üyesi').slice(0, 80),
        email: String(row.email || '').slice(0, 120),
        count: Math.max(0, Number(row.count) || 0),
        isCurrentUser: row.isCurrentUser === true
      };
    }).filter(function (row) { return row.count > 0; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 50);

    if (!sorted.length) {
      message('Henüz doğrulanmış davet kaydı bulunmuyor.', false);
      return;
    }

    var list = document.createElement('ol');
    list.style.cssText = 'display:grid;gap:10px;list-style:none;margin:0;padding:0';
    sorted.forEach(function (row, index) {
      var item = document.createElement('li');
      item.style.cssText = 'display:flex;align-items:center;gap:12px;padding:13px 15px;border:1px solid var(--border2, rgba(255,255,255,.12));border-radius:12px;background:rgba(255,255,255,.025)';
      var rank = document.createElement('span');
      rank.textContent = String(index + 1).padStart(2, '0');
      rank.style.cssText = 'min-width:34px;font-weight:800;color:var(--accent, #d4af37)';
      var identity = document.createElement('span');
      identity.style.cssText = 'min-width:0;flex:1;display:grid;gap:3px';
      var name = document.createElement('strong');
      name.textContent = row.name + (row.isCurrentUser ? ' · Siz' : '');
      name.style.cssText = 'overflow-wrap:anywhere;color:var(--text, #fff)';
      identity.appendChild(name);
      if (row.email) {
        var email = document.createElement('small');
        email.textContent = row.email;
        email.style.cssText = 'overflow-wrap:anywhere;color:var(--text3, #9ca3af)';
        identity.appendChild(email);
      }
      var count = document.createElement('strong');
      count.textContent = row.count.toLocaleString('tr-TR') + ' davet';
      count.style.cssText = 'white-space:nowrap;color:var(--accent, #d4af37);font-size:13px';
      item.append(rank, identity, count);
      list.appendChild(item);
    });
    host.appendChild(list);
  }

  async function load() {
    if (!node()) return;
    if (!window.Parse || !window.Parse.Cloud || typeof window.Parse.Cloud.run !== 'function') {
      message('Davet sıralaması şu anda yüklenemiyor: Back4App istemcisi hazır değil.', true);
      return;
    }
    try {
      if (typeof window.initBack4app === 'function') await withTimeout(window.initBack4app(), 8000);
      var rows = await withTimeout(window.Parse.Cloud.run(endpoint, {}), 12000);
      render(rows);
    } catch (error) {
      console.error('[AETHRION Referral Leaderboard] Load failed:', error);
      var detail = String(error && error.message || error);
      message(/invalid function/i.test(detail)
        ? 'Davet sıralaması servisi Back4App Cloud Code üzerinde henüz etkin değil. Güncel main.js dosyasını deploy edin.'
        : 'Davet sıralaması yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.', true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
  window.addEventListener('aethrion:backend-status', function (event) {
    if (event && event.detail && event.detail.state === 'connected') load();
  });
})(window, document);

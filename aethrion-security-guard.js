(function () {
  'use strict';
  if (window.__aethrionSecurityGuardStarted) return;
  window.__aethrionSecurityGuardStarted = true;

  function checkingPage() {
    if (document.getElementById('aethrionVpnChecking')) return;
    var root = document.createElement('section');
    root.id = 'aethrionVpnChecking';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#0b1726;color:#f5f8fc;font:500 16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;';
    root.innerHTML = '<div style="width:min(560px,100%);padding:32px;box-sizing:border-box;border:1px solid rgba(180,205,230,.25);border-radius:20px;background:linear-gradient(145deg,#142a42,#0d1d30);text-align:center"><div style="margin:0 0 10px;color:#d8bd79;font-size:12px;font-weight:800;letter-spacing:.2em">AETHRION SECURITY</div><h1 style="margin:0 0 12px;font-size:clamp(25px,5vw,36px);line-height:1.15;color:#f5f8fc">Bağlantı doğrulanıyor</h1><p style="margin:0;color:#c0cfdf">Güvenli erişim kontrolü yapılıyor. Lütfen bekleyin.</p></div>';
    document.body.appendChild(root);
    document.documentElement.style.overflow = 'hidden';
  }

  function clearChecking() {
    var root = document.getElementById('aethrionVpnChecking');
    if (root) root.remove();
    document.documentElement.style.overflow = '';
  }

  function blockPage(reason) {
    clearChecking();
    if (document.getElementById('aethrionVpnBlock')) return;
    var root = document.createElement('section');
    root.id = 'aethrionVpnBlock';
    root.setAttribute('role', 'alertdialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'aeVpnTitle');
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#0b1726;color:#f5f8fc;font:500 16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;';
    var isVpn = reason === 'VPN_PROXY_OR_TOR';
    var message = isVpn
      ? 'Bu bağlantı VPN, proxy veya Tor olarak işaretlendi. AETHRION’a erişmek için bu bağlantıyı kapatıp normal internet bağlantınızla tekrar deneyin.'
      : 'Güvenlik kontrolü doğrulanamadı. Bağlantı veya sunucu ayarları doğrulanana kadar erişim güvenlik nedeniyle durduruldu. Lütfen daha sonra yeniden deneyin.';
    root.innerHTML = '<div style="width:min(560px,100%);padding:32px;box-sizing:border-box;border:1px solid rgba(180,205,230,.25);border-radius:20px;background:linear-gradient(145deg,#142a42,#0d1d30);box-shadow:0 25px 80px rgba(0,0,0,.45)"><div style="margin:0 0 10px;color:#d8bd79;font-size:12px;font-weight:800;letter-spacing:.2em">AETHRION SECURITY</div><h1 id="aeVpnTitle" style="margin:0 0 12px;font-size:clamp(25px,5vw,36px);line-height:1.15;letter-spacing:-.03em;color:#f5f8fc">Bağlantıya izin verilmiyor</h1><p id="aeVpnMessage" style="margin:0 0 20px;color:#c0cfdf"></p><button type="button" id="aeVpnRetry" style="min-height:44px;padding:0 18px;border:1px solid #cdb16c;border-radius:10px;background:#d7bd7b;color:#13243a;font-weight:800;cursor:pointer">Yeniden kontrol et</button></div>';
    document.body.appendChild(root);
    var msg = document.getElementById('aeVpnMessage');
    if (msg) msg.textContent = message;
    document.documentElement.style.overflow = 'hidden';
    var btn = document.getElementById('aeVpnRetry');
    if (btn) btn.addEventListener('click', function () { location.reload(); });
    if (!isVpn) console.warn('[AETHRION Security] Confirmed block reason:', reason || 'UNKNOWN');
  }

  function run() {
    checkingPage();
    var started = Date.now();
    function attempt() {
      var SDK = window.Parse;
      if (!SDK || !SDK.Cloud || typeof SDK.Cloud.run !== 'function') {
        if (Date.now() - started > 15000) { console.warn('[AETHRION Security] Parse SDK unavailable; site remains accessible in degraded mode.'); clearChecking(); }
        else setTimeout(attempt, 250);
        return;
      }
      SDK.Cloud.run('aethrionSecurityCheck', {}).then(function (result) {
        if (result && result.blocked === true && result.code === 'VPN_PROXY_OR_TOR') {
          blockPage('VPN_PROXY_OR_TOR');
          return;
        }
        if (!result || result.ok !== true || result.configured !== true || result.degraded === true) {
          console.warn('[AETHRION Security] Reputation check unavailable/degraded; allowing access on an unconfirmed result.', result && result.code ? result.code : 'INVALID_SECURITY_RESPONSE');
        }
        clearChecking();
      }).catch(function (error) {
        console.warn('[AETHRION Security] Cloud check failed; allowing access in degraded mode.', error && error.message ? error.message : 'UNKNOWN');
        clearChecking();
      });
    }
    attempt();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();

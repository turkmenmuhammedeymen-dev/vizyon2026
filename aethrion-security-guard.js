(function () {
  'use strict';
  if (window.__aethrionSecurityGuardStarted) return;
  window.__aethrionSecurityGuardStarted = true;

  function blockPage() {
    if (document.getElementById('aethrionVpnBlock')) return;
    var root = document.createElement('section');
    root.id = 'aethrionVpnBlock';
    root.setAttribute('role', 'alertdialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'aeVpnTitle');
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#0b1726;color:#f5f8fc;font:500 16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;';
    root.innerHTML = '<div style="width:min(560px,100%);padding:32px;box-sizing:border-box;border:1px solid rgba(180,205,230,.25);border-radius:20px;background:linear-gradient(145deg,#142a42,#0d1d30);box-shadow:0 25px 80px rgba(0,0,0,.45)"><div style="margin:0 0 10px;color:#d8bd79;font-size:12px;font-weight:800;letter-spacing:.2em">AETHRION SECURITY</div><h1 id="aeVpnTitle" style="margin:0 0 12px;font-size:clamp(25px,5vw,36px);line-height:1.15;letter-spacing:-.03em;color:#f5f8fc">Bağlantıya izin verilmiyor</h1><p style="margin:0 0 20px;color:#c0cfdf">Bu bağlantı VPN, proxy veya Tor olarak işaretlendi. AETHRION’a erişmek için VPN/proxy bağlantısını kapatıp normal internet bağlantınızla tekrar deneyin.</p><button type="button" id="aeVpnRetry" style="min-height:44px;padding:0 18px;border:1px solid #cdb16c;border-radius:10px;background:#d7bd7b;color:#13243a;font-weight:800;cursor:pointer">Yeniden kontrol et</button></div>';
    document.body.appendChild(root);
    document.documentElement.style.overflow = 'hidden';
    var btn = document.getElementById('aeVpnRetry');
    if (btn) btn.addEventListener('click', function () { location.reload(); });
  }

  function run() {
    fetch('/api/security-check?ts=' + Date.now(), {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    }).then(function (response) {
      return response.json().catch(function () {
        return { ok: false, configured: true, blocked: true, code: 'INVALID_SECURITY_RESPONSE' };
      });
    }).then(function (result) {
      if (result && result.blocked === true) {
        blockPage();
      } else if (result && result.configured === false) {
        // Fail closed: do not allow site use until the provider key is configured.
        blockPage();
      } else {
        // Unknown or malformed responses are not treated as an allow decision.
        blockPage();
      }
    }).catch(function () {
      // Fail closed when the reputation endpoint cannot be reached.
      blockPage();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
/* AETHRION social authentication bridge.
 * Uses server-verified provider tokens and converts returned Parse session tokens
 * into a browser session. Provider secrets must remain in Back4App, never here.
 */
(function (window, document) {
  'use strict';
  var GOOGLE_CLIENT_ID = '648997195148-eoo5683g1ar0gmlckgq4b79tv91dkuut.apps.googleusercontent.com';
  var pendingProvider = '';
  var modal = null;

  function notify(message, type) {
    try {
      if (typeof window.showNotification === 'function') window.showNotification(message, type || 'error');
      else console.warn('[AETHRION Social Auth]', message);
    } catch (_) { console.warn('[AETHRION Social Auth]', message); }
  }
  function ensureParse() {
    if (!window.Parse || !window.Parse.User || !window.Parse.Cloud) throw new Error('Back4App bağlantısı hazır değil. Sayfayı yenileyip tekrar deneyin.');
    if (typeof window.initBack4app === 'function') return Promise.resolve(window.initBack4app());
    return Promise.resolve(true);
  }
  function showDashboard() {
    var user = window.Parse && window.Parse.User && window.Parse.User.current();
    if (!user) throw new Error('Sağlayıcı doğrulandı ancak AETHRION oturumu oluşturulamadı.');
    var auth = document.getElementById('authModal');
    var main = document.getElementById('mainSite');
    var dash = document.getElementById('dashboardArea');
    if (auth) { auth.style.setProperty('display', 'none', 'important'); auth.setAttribute('aria-hidden', 'true'); }
    if (main) main.style.setProperty('display', 'none', 'important');
    if (dash) {
      dash.style.setProperty('display', 'block', 'important');
      dash.style.setProperty('visibility', 'visible', 'important');
      dash.style.setProperty('opacity', '1', 'important');
      dash.style.setProperty('pointer-events', 'auto', 'important');
    }
    document.body.classList.add('logged-in-user');
    if (typeof window.showDashboard === 'function') {
      try { Promise.race([Promise.resolve(window.showDashboard()), new Promise(function (resolve) { window.setTimeout(resolve, 5000); })]).catch(function () {}); } catch (_) {}
    }
    if (dash) dash.style.setProperty('display', 'block', 'important');
  }
  async function acceptSession(result, provider) {
    if (!result || result.success !== true || !result.sessionToken) {
      throw new Error((result && result.error) || provider + ' girişi için Back4App geçerli oturum döndürmedi. Cloud Code dağıtımını kontrol edin.');
    }
    await window.Parse.User.become(result.sessionToken);
    showDashboard();
    if (modal) { modal.remove(); modal = null; }
    notify(provider + ' ile giriş başarılı. AETHRION çalışma alanın açıldı.', 'success');
  }
  function ensureModal() {
    if (modal && modal.isConnected) return modal;
    modal = document.createElement('div');
    modal.id = 'aethrionSocialConsent';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(3,8,18,.82);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,system-ui,sans-serif;';
    modal.innerHTML =
      '<section style="width:min(460px,100%);background:#0b1220;color:#f8fafc;border:1px solid rgba(212,175,55,.4);border-radius:22px;padding:24px;box-shadow:0 25px 80px #0008">' +
      '<button type="button" data-close style="float:right;background:transparent;color:#cbd5e1;border:0;font-size:25px">×</button>' +
      '<p style="color:#d4af37;letter-spacing:.16em;font-size:11px;font-weight:800">AETHRION ACCOUNT</p>' +
      '<h2 style="margin:8px 0 10px;font-size:23px">Güvenli sosyal giriş</h2>' +
      '<p style="color:#b9c4d5;font-size:13px;line-height:1.6">Devam etmeden önce kullanıcı sözleşmesini ve gizlilik politikasını kabul et. Kimlik doğrulaması sunucuda kontrol edilir.</p>' +
      '<label style="display:flex;gap:10px;align-items:flex-start;margin:15px 0;font-size:13px"><input id="aeSocialTerms" type="checkbox" style="margin-top:3px"><span><a href="/kullanici-sozlesmesi.html" target="_blank" style="color:#e4ca83">Kullanıcı Sözleşmesi</a>ni kabul ediyorum.</span></label>' +
      '<label style="display:flex;gap:10px;align-items:flex-start;margin:15px 0;font-size:13px"><input id="aeSocialPrivacy" type="checkbox" style="margin-top:3px"><span><a href="/gizlilik.html" target="_blank" style="color:#e4ca83">Gizlilik Politikası</a>nı kabul ediyorum.</span></label>' +
      '<p id="aeSocialError" role="status" style="display:none;color:#fca5a5;font-size:12px;line-height:1.5"></p>' +
      '<button type="button" data-continue style="width:100%;border:0;border-radius:12px;padding:13px;background:linear-gradient(110deg,#d4af37,#f3df9a);color:#101827;font-weight:800">Devam Et</button>' +
      '<button type="button" data-cancel style="width:100%;margin-top:9px;border:1px solid #334155;border-radius:12px;padding:11px;background:transparent;color:#cbd5e1">İptal</button>' +
      '<div id="aeSocialProviderMount" style="margin-top:14px"></div></section>';
    document.body.appendChild(modal);
    modal.querySelector('[data-close]').onclick = closeModal;
    modal.querySelector('[data-cancel]').onclick = closeModal;
    modal.querySelector('[data-continue]').onclick = async function () {
      if (!modal.querySelector('#aeSocialTerms').checked || !modal.querySelector('#aeSocialPrivacy').checked) {
        showError('Devam etmek için iki kutucuğu da işaretlemelisin.');
        return;
      }
      modal.querySelector('[data-continue]').disabled = true;
      modal.querySelector('[data-continue]').textContent = 'Bağlantı hazırlanıyor…';
      try {
        await ensureParse();
        if (pendingProvider === 'google') renderGoogleButton();
        else if (pendingProvider === 'facebook') await startFacebookLogin();
      } catch (e) {
        showError(String(e && e.message || e));
        modal.querySelector('[data-continue]').disabled = false;
        modal.querySelector('[data-continue]').textContent = 'Tekrar Dene';
      }
    };
    return modal;
  }
  function showError(message) {
    var e = modal && modal.querySelector('#aeSocialError');
    if (e) { e.textContent = message; e.style.display = 'block'; }
  }
  function closeModal() { if (modal) modal.remove(); modal = null; pendingProvider = ''; }
  function renderGoogleButton() {
    var mount = modal && modal.querySelector('#aeSocialProviderMount');
    if (!mount) return;
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      showError('Google hizmeti yüklenemedi. İnternet bağlantısını ve izinli alan adı ayarlarını kontrol edin.');
      return;
    }
    mount.innerHTML = '<p style="text-align:center;color:#b9c4d5;font-size:12px;margin-bottom:8px">Google hesabını seçmek için aşağıdaki düğmeye dokun.</p><div id="aeGoogleGISButton" style="display:flex;justify-content:center"></div>';
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: window.handleGoogleLoginResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      window.google.accounts.id.renderButton(document.getElementById('aeGoogleGISButton'), {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 300
      });
    } catch (e) { showError('Google düğmesi hazırlanamadı: ' + String(e.message || e)); }
  }
  window.handleGoogleLoginResponse = async function (response) {
    try {
      if (!response || !response.credential) throw new Error('Google kimlik belirteci alınamadı.');
      await ensureParse();
      var result = await window.Parse.Cloud.run('verifyGoogleToken', {
        idToken: response.credential, termsAccepted: true, privacyAccepted: true
      });
      await acceptSession(result, 'Google');
    } catch (e) {
      showError(String(e && e.message || e));
      notify('Google girişi tamamlanamadı: ' + String(e && e.message || e), 'error');
    }
  };
  async function getFacebookAppId() {
    var id = window.AETHRION_FACEBOOK_APP_ID || window.FACEBOOK_APP_ID || '';
    if (id) return String(id).trim();
    try {
      var config = await window.Parse.Config.get();
      id = config.get('AETHRION_FACEBOOK_APP_ID') || config.get('FACEBOOK_APP_ID') || '';
    } catch (_) {}
    return String(id || '').trim();
  }
  async function startFacebookLogin() {
    var appId = await getFacebookAppId();
    if (!appId) throw new Error('Facebook App ID Back4App Parse Config içinde AETHRION_FACEBOOK_APP_ID olarak tanımlı değil. Facebook uygulama kimliğini ekleyin.');
    if (!window.FB) throw new Error('Facebook SDK yüklenemedi. Bağlantıyı ve Facebook SDK ayarlarını kontrol edin.');
    window.FB.init({ appId: appId, cookie: true, xfbml: false, version: 'v19.0' });
    window.FB.login(async function (response) {
      try {
        if (!response || !response.authResponse) throw new Error('Facebook girişi iptal edildi veya izin verilmedi.');
        var auth = response.authResponse;
        var result = await window.Parse.Cloud.run('facebookLogin', {
          accessToken: auth.accessToken, userID: auth.userID,
          termsAccepted: true, privacyAccepted: true
        });
        await acceptSession(result, 'Facebook');
      } catch (e) {
        showError(String(e && e.message || e));
        notify('Facebook girişi tamamlanamadı: ' + String(e && e.message || e), 'error');
      }
    }, { scope: 'public_profile,email' });
  }
  window.requireSocialTerms = function (provider) {
    provider = String(provider || '').toLowerCase();
    if (provider !== 'google' && provider !== 'facebook') {
      notify('Desteklenmeyen giriş sağlayıcısı.', 'error'); return false;
    }
    pendingProvider = provider;
    ensureModal();
    return true;
  };
  window.loginWithGoogle = function () { return window.requireSocialTerms('google'); };
  window.loginWithFacebook = function () { return window.requireSocialTerms('facebook'); };
})(window, document);

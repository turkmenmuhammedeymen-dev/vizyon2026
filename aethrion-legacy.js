/* AETHRION Legacy Backfill — otomatik üretildi.
 * Eski tam sürümde (eski dosyalar) bulunan ama güncel sitede kaybolan fonksiyonları geri getirir.
 * Yalnızca güncel sitede tanımsız olanlar eklenir; mevcut çalışan kod ezilmez (OVERRIDE listesi hariç).
 */
(function(){
var __OVER=["openLogsPanel","openApiKeySelectionModal","createProjectWizard","openPersonalAssistant","openJobMarket","open3DBuilder","toggleTeamPage","openVizyonSupport","openA27ApiKeyGenerator","openV27ApiKeyGenerator","scrollToProjectRequests","scrollToProjects","scrollToImageGen","openAvatarCreator","openAssistantSettings","refreshAssistantSummary"];
try{ if(typeof window._googleGISReady==="undefined") window._googleGISReady=false;}catch(e){console.warn("[legacy] _googleGISReady",e);}
try{ if(typeof window.GOOGLE_CLIENT_ID==="undefined") window.GOOGLE_CLIENT_ID='648997195148-eoo5683g1ar0gmlckgq4b79tv91dkuut.apps.googleusercontent.com';}catch(e){console.warn("[legacy] GOOGLE_CLIENT_ID",e);}
try{ if(typeof window.fbAsyncInit!=="function"||__OVER.indexOf("fbAsyncInit")>=0) window.fbAsyncInit=function() {
    FB.init({
      appId            : '2479376715807455',
      cookie           : true,
      xfbml            : true,
      version          : 'v18.0'
    });
    console.log('✅ Facebook SDK başlatıldı (App ID: 2479376715807455, v18.0)');
  };}catch(e){console.warn("[legacy] fbAsyncInit",e);}
try{ if(typeof window.voiceChatRecognition==="undefined") window.voiceChatRecognition=null;}catch(e){console.warn("[legacy] voiceChatRecognition",e);}
try{ if(typeof window.filePreviewData==="undefined") window.filePreviewData=null;}catch(e){console.warn("[legacy] filePreviewData",e);}
try{ if(typeof window.videoStudioActive==="undefined") window.videoStudioActive=false;}catch(e){console.warn("[legacy] videoStudioActive",e);}
try{ if(typeof window.videoEditorActive==="undefined") window.videoEditorActive=false;}catch(e){console.warn("[legacy] videoEditorActive",e);}
try{ if(typeof window.videoEditorData==="undefined") window.videoEditorData=null;}catch(e){console.warn("[legacy] videoEditorData",e);}
try{ if(typeof window.videoEditorTrimStart==="undefined") window.videoEditorTrimStart=0;}catch(e){console.warn("[legacy] videoEditorTrimStart",e);}
try{ if(typeof window.videoEditorTrimEnd==="undefined") window.videoEditorTrimEnd=0;}catch(e){console.warn("[legacy] videoEditorTrimEnd",e);}
try{ if(typeof window.videoEditorDuration==="undefined") window.videoEditorDuration=0;}catch(e){console.warn("[legacy] videoEditorDuration",e);}
try{ if(typeof window.V27_MODELS_TOTAL==="undefined") window.V27_MODELS_TOTAL=28;}catch(e){console.warn("[legacy] V27_MODELS_TOTAL",e);}
try{ if(typeof window.V27_OLLAMA_MODELS==="undefined") window.V27_OLLAMA_MODELS=[
    'granite3.3:2b', 'qwen2.5vl:3b', 'phi4-mini-reasoning', 'gemma3:4b',
    'qwen3:8b', 'qwen3:4b', 'qwen2.5-coder:latest', 'mistral:latest',
    'phi3.5:latest', 'gemma2:latest', 'llama3.2:latest', 'qwen2.5:latest',
    'deepseek-r1:latest'
];}catch(e){console.warn("[legacy] V27_OLLAMA_MODELS",e);}
try{ if(typeof window.V27_NVIDIA_MODELS==="undefined") window.V27_NVIDIA_MODELS=[
    'meta/llama-3.3-70b-instruct',
    'meta/llama-3.1-8b-instruct',
    'qwen/qwen2.5-7b-instruct',
    'qwen/qwen2.5-coder-32b-instruct',
    'deepseek-ai/deepseek-r1-distill-llama-8b',
    'google/gemma-2-2b-instruct',
    'microsoft/phi-3.5-moe-instruct'
];}catch(e){console.warn("[legacy] V27_NVIDIA_MODELS",e);}
try{ if(typeof window.V27_CLOUD_MODELS==="undefined") window.V27_CLOUD_MODELS=[
    'Groq (Llama 3.3 70B)', 'Gemini 2.0 Flash', 'DeepSeek Chat',
    'DeepInfra (Llama 3.1 70B)', 'OpenAI GPT-4o-mini',
    'Cerebras (Llama 3.3 70B)', 'OpenRouter', 'Cohere Command R Plus'
];}catch(e){console.warn("[legacy] V27_CLOUD_MODELS",e);}
try{ if(typeof window.A27_MODELS_TOTAL==="undefined") window.A27_MODELS_TOTAL=28;}catch(e){console.warn("[legacy] A27_MODELS_TOTAL",e);}
try{ if(typeof window.A27_OLLAMA_MODELS==="undefined") window.A27_OLLAMA_MODELS=window.V27_OLLAMA_MODELS;}catch(e){console.warn("[legacy] A27_OLLAMA_MODELS",e);}
try{ if(typeof window.A27_NVIDIA_MODELS==="undefined") window.A27_NVIDIA_MODELS=window.V27_NVIDIA_MODELS;}catch(e){console.warn("[legacy] A27_NVIDIA_MODELS",e);}
try{ if(typeof window.A27_CLOUD_MODELS==="undefined") window.A27_CLOUD_MODELS=window.V27_CLOUD_MODELS;}catch(e){console.warn("[legacy] A27_CLOUD_MODELS",e);}
try{ if(typeof window.checkExistingSession!=="function"||__OVER.indexOf("checkExistingSession")>=0) window.checkExistingSession=async function () {
    try {
        if (typeof Parse === 'undefined') return null;
        var user = Parse.User.current();
        if (!user) return null;

        await user.fetch();

        if (user.get('isBanned')) {
            await Parse.User.logOut();
            localStorage.removeItem('aethrion_user');
            console.warn('⚠️ Yasaklı kullanıcı oturumu kapatıldı');
            return null;
        }

        window.currentUser = user;
        if (typeof currentUser !== 'undefined') currentUser = user;

        localStorage.setItem('aethrion_user', JSON.stringify({
            id: user.id,
            name: user.get('name'),
            email: user.get('email'),
            role: user.get('role'),
            plan: user.get('plan'),
            teamId: user.get('teamId')
        }));

        console.log('✅ Oturum aktif:', user.get('email'));
        return user;
    } catch (e) {
        console.warn('Oturum kontrolü hatası:', e.message);
        try { await Parse.User.logOut(); } catch (e2) {}
        localStorage.removeItem('aethrion_user');
        return null;
    }
};}catch(e){console.warn("[legacy] checkExistingSession",e);}
function animateCounter(el, target, duration) {
    if (!el) return;
    var startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var current = Math.floor(progress * target);
        el.textContent = current.toLocaleString('tr-TR');
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target.toLocaleString('tr-TR');
        }
    }
    requestAnimationFrame(step);
}
if(typeof window.animateCounter!=="function"||__OVER.indexOf("animateCounter")>=0)window.animateCounter=animateCounter;
function initCounters() {
    var c1 = document.getElementById('counter1');
    var c2 = document.getElementById('counter2');
    var c3 = document.getElementById('counter3');
    if (c1) animateCounter(c1, 15840, 2000);
    if (c2) animateCounter(c2, 247500, 2500);
    if (c3) animateCounter(c3, 8920, 2200);
}
if(typeof window.initCounters!=="function"||__OVER.indexOf("initCounters")>=0)window.initCounters=initCounters;
try{ if(typeof window.startStatsInterval!=="function"||__OVER.indexOf("startStatsInterval")>=0) window.startStatsInterval=function () {
    if (window.statsInterval) clearInterval(window.statsInterval);
    window.statsInterval = setInterval(function () {
        window.updateStats();
    }, 60000);
};}catch(e){console.warn("[legacy] startStatsInterval",e);}
try{ if(typeof window.stopStatsInterval!=="function"||__OVER.indexOf("stopStatsInterval")>=0) window.stopStatsInterval=function () {
    if (window.statsInterval) {
        clearInterval(window.statsInterval);
        window.statsInterval = null;
    }
};}catch(e){console.warn("[legacy] stopStatsInterval",e);}
try{ if(typeof window.applyTheme!=="function"||__OVER.indexOf("applyTheme")>=0) window.applyTheme=function () {
    var saved = 'dark';
    try { saved = localStorage.getItem('aethrion_theme') || 'dark'; } catch (e) {}
    document.body.setAttribute('data-theme', saved);
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    var btn = document.querySelector('.theme-toggle-btn');
    if (btn) btn.textContent = saved === 'dark' ? '🌙' : '☀️';
};}catch(e){console.warn("[legacy] applyTheme",e);}
try{ if(typeof window.checkSpaceMode!=="function"||__OVER.indexOf("checkSpaceMode")>=0) window.checkSpaceMode=function () {
    var hour = new Date().getHours();
    var isSpace = (hour >= 2 && hour < 5);
    if (isSpace) {
        document.body.classList.add('space-mode');
        var badge = document.getElementById('spaceModeBadge');
        if (!badge) {
            var nav = document.querySelector('nav .button-group');
            if (nav) {
                var sb = document.createElement('span');
                sb.id = 'spaceModeBadge';
                sb.className = 'space-badge';
                sb.style.cssText = 'font-size:11px; padding:4px 12px; border-radius:20px;';
                sb.textContent = '🚀 UZAY MODU x2';
                sb.title = 'Uzay Modu aktif — 02:00-05:00 arası tüm puanlar x2!';
                nav.insertBefore(sb, nav.firstChild);
            }
        }
    } else {
        document.body.classList.remove('space-mode');
        var existing = document.getElementById('spaceModeBadge');
        if (existing) existing.remove();
    }
};}catch(e){console.warn("[legacy] checkSpaceMode",e);}
try{ if(typeof window.updateVersion!=="function"||__OVER.indexOf("updateVersion")>=0) window.updateVersion=function (v) {
    var el = document.getElementById('versionDisplay');
    if (el) el.textContent = v;
    var splashV = document.querySelector('.splash-version');
    if (splashV) splashV.textContent = v;
};}catch(e){console.warn("[legacy] updateVersion",e);}
try{ if(typeof window.applyAethrionBranding!=="function"||__OVER.indexOf("applyAethrionBranding")>=0) window.applyAethrionBranding=function () {
    if (document.title.indexOf('VİZYON') !== -1 || document.title.indexOf('Vizyon') !== -1) {
        document.title = document.title
            .replace(/VİZYON 2027/g, 'AETHRION')
            .replace(/Vizyon 2027/g, 'AETHRION')
            .replace(/VİZYON AI/g, 'AETHRION AI')
            .replace(/Vizyon AI/g, 'AETHRION AI')
            .replace(/V27/g, 'A27');
    }

    try {
        var oldTheme = localStorage.getItem('vizyon_theme');
        if (oldTheme && !localStorage.getItem('aethrion_theme')) {
            localStorage.setItem('aethrion_theme', oldTheme);
        }
        var oldUser = localStorage.getItem('vizyon_user');
        if (oldUser && !localStorage.getItem('aethrion_user')) {
            localStorage.setItem('aethrion_user', oldUser);
        }
        var oldLang = localStorage.getItem('vizyon_language');
        if (oldLang && !localStorage.getItem('aethrion_language')) {
            localStorage.setItem('aethrion_language', oldLang);
        }
        var oldResp = localStorage.getItem('vizyon_al_responsibility_v8');
        if (oldResp && !localStorage.getItem('aethrion_agents_responsibility_v1')) {
            localStorage.setItem('aethrion_agents_responsibility_v1', oldResp);
        }
    } catch (e) {}

    console.log('✅ AETHRION marka override uygulandı — Intelligence Without Limits.');
};}catch(e){console.warn("[legacy] applyAethrionBranding",e);}
try{ if(typeof window._pendingSocialProvider==="undefined") window._pendingSocialProvider=null;}catch(e){console.warn("[legacy] _pendingSocialProvider",e);}
try{ if(typeof window._googleLoginInProgress==="undefined") window._googleLoginInProgress=false;}catch(e){console.warn("[legacy] _googleLoginInProgress",e);}
try{ if(typeof window.handleGoogleLibraryLoad!=="function"||__OVER.indexOf("handleGoogleLibraryLoad")>=0) window.handleGoogleLibraryLoad=function () {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        window._googleGISReady = true;
        console.log('✅ Google Identity Services hazır (AETHRION)');

        try {
            var clientId = window.GOOGLE_CLIENT_ID ||
                '648997195148-eoo5683g1ar0gmlckgq4b79tv91dkuut.apps.googleusercontent.com';

            google.accounts.id.initialize({
                client_id: clientId,
                callback: window.handleGoogleLoginResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                ux_mode: 'popup'
            });
            console.log('✅ Google GIS initialize edildi (AETHRION)');
        } catch (e) {
            console.warn('⚠️ Google GIS initialize hatası:', e.message);
        }
    } else {
        setTimeout(window.handleGoogleLibraryLoad, 1000);
    }
};}catch(e){console.warn("[legacy] handleGoogleLibraryLoad",e);}
try{ if(typeof window.confirmSocialAuthTerms!=="function"||__OVER.indexOf("confirmSocialAuthTerms")>=0) window.confirmSocialAuthTerms=function () {
    var provider = window._pendingSocialProvider;
    if (!provider) {
        window.closeModal('socialAuthTermsModal');
        return;
    }

    var termsCheck = document.getElementById('socialTermsCheck');
    var privacyCheck = document.getElementById('socialPrivacyCheck');
    var errBox = document.getElementById('socialAuthTermsError');

    function showErr(msg) {
        if (errBox) {
            errBox.textContent = '❌ ' + msg;
            errBox.style.display = 'block';
        }
        showNotification('❌ ' + msg, 'error');
    }

    if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }

    if (!termsCheck || !termsCheck.checked) {
        return showErr('Kullanıcı Sözleşmesi\'ni kabul etmelisiniz.');
    }
    if (!privacyCheck || !privacyCheck.checked) {
        return showErr('Gizlilik Politikası\'nı kabul etmelisiniz.');
    }

    try {
        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('Sosyal giriş sözleşme onayı verildi: ' + provider);
        }
    } catch (e) {}

    window.closeModal('socialAuthTermsModal');
    window._pendingSocialProvider = null;

    if (provider === 'google') {
        if (typeof window.loginWithGoogle === 'function') {
            window.loginWithGoogle();
        } else {
            showNotification('Google giriş fonksiyonu yüklenmedi!', 'error');
        }
    } else if (provider === 'facebook') {
        if (typeof window.loginWithFacebook === 'function') {
            window.loginWithFacebook();
        } else {
            showNotification('Facebook giriş fonksiyonu yüklenmedi!', 'error');
        }
    }
};}catch(e){console.warn("[legacy] confirmSocialAuthTerms",e);}
try{ if(typeof window.openProfileCompletionModal!=="function"||__OVER.indexOf("openProfileCompletionModal")>=0) window.openProfileCompletionModal=function () {
    var modal = document.getElementById('profileCompletionModal');
    if (!modal) {
        console.warn('profileCompletionModal bulunamadı!');
        return;
    }

    var nameInput = document.getElementById('pcName');
    if (nameInput && window._fbPendingProfile && window._fbPendingProfile.name) {
        nameInput.value = window._fbPendingProfile.name;
    }

    var emailHintEl = document.getElementById('pcRecoveryEmail');
    if (emailHintEl && window._fbPendingEmail) {
        emailHintEl.placeholder = 'Örn: ' + window._fbPendingEmail + ' (veya farklı bir mail)';
    }

    var errBox = document.getElementById('pcErrorBox');
    if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }

    modal.classList.add('open');
    modal.style.display = 'flex';

    setTimeout(function () {
        var nameInp = document.getElementById('pcName');
        if (nameInp) nameInp.focus();
    }, 200);
};}catch(e){console.warn("[legacy] openProfileCompletionModal",e);}
try{ if(typeof window.submitProfileCompletion!=="function"||__OVER.indexOf("submitProfileCompletion")>=0) window.submitProfileCompletion=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');

    var nameInput = document.getElementById('pcName');
    var emailInput = document.getElementById('pcEmail');
    var usernameInput = document.getElementById('pcUsername');
    var passInput = document.getElementById('pcPassword');
    var pass2Input = document.getElementById('pcPassword2');
    var recoveryInput = document.getElementById('pcRecoveryEmail');
    var errBox = document.getElementById('pcErrorBox');

    var name = nameInput ? nameInput.value.trim() : '';
    var newEmail = emailInput ? emailInput.value.trim() : '';
    var newUsername = usernameInput ? usernameInput.value.trim() : '';
    var pass = passInput ? passInput.value : '';
    var pass2 = pass2Input ? pass2Input.value : '';
    var recoveryEmail = recoveryInput ? recoveryInput.value.trim() : '';

    function showError(msg) {
        if (errBox) {
            errBox.textContent = '❌ ' + msg;
            errBox.style.display = 'block';
        }
        showNotification('❌ ' + msg, 'error');
        if (typeof window.addLogWarning === 'function') {
            window.addLogWarning('Profil tamamlama hatası: ' + msg);
        }
    }
    if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }

    if (!name || name.length < 2) return showError('Lütfen geçerli bir ad girin (min 2 karakter).');
    if (!newEmail) return showError('E-posta gerekli.');
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return showError('Geçerli bir e-posta adresi girin.');
    if (!newUsername || newUsername.length < 2) return showError('Kullanıcı adı gerekli (min 2 karakter).');
    if (!pass || pass.length < 8) return showError('Şifre en az 8 karakter olmalı.');
    if (pass !== pass2) return showError('Şifreler eşleşmiyor.');
    if (!recoveryEmail) return showError('Kurtarma maili gerekli.');
    if (!emailRegex.test(recoveryEmail)) return showError('Geçerli bir kurtarma maili girin.');

    try {
        showNotification('⏳ Hesap tamamlanıyor...', 'success');

        var provider = window._fbPendingProvider || 'social';
        var cloudFn = provider === 'google' ? 'completeGoogleProfile' : 'completeFacebookProfile';

        var result;
        try {
            result = await Parse.Cloud.run(cloudFn, {
                name: name,
                email: newEmail,
                username: newUsername,
                password: pass,
                recoveryEmail: recoveryEmail
            });
        } catch (cloudErr) {
            // Fallback: eski fonksiyon
            console.warn(cloudFn + ' yoksa eski fonksiyonu dene:', cloudErr.message);
            result = await Parse.Cloud.run('completeFacebookProfile', {
                name: name,
                email: newEmail,
                username: newUsername,
                password: pass,
                recoveryEmail: recoveryEmail
            });
        }

        if (!result || !result.success) {
            throw new Error(result && result.error ? result.error : 'Hesap tamamlanamadı.');
        }

        await window.currentUser.fetch();
        window.currentUser.set('name', name);
        if (typeof currentUser !== 'undefined') currentUser = window.currentUser;

        localStorage.setItem('aethrion_user', JSON.stringify({
            id: window.currentUser.id,
            name: window.currentUser.get('name'),
            email: window.currentUser.get('email'),
            role: window.currentUser.get('role'),
            plan: window.currentUser.get('plan'),
            teamId: window.currentUser.get('teamId')
        }));

        closeModal('profileCompletionModal');

        var nameEl = document.getElementById('dashboardUserName');
        if (nameEl) nameEl.textContent = name;

        showNotification('🎉 Hesabınız tamamlandı! Artık kurtarma maili ile giriş yapabilirsiniz.', 'success');
        if (typeof window.addLogSuccess === 'function') {
            window.addLogSuccess('Sosyal medya profili tamamlandı: ' + recoveryEmail);
        }

        window._fbPendingProfile = null;
        window._fbPendingEmail = null;
        window._fbPendingProvider = null;
    } catch (e) {
        console.error('Profil tamamlama hatası:', e);
        showError(e.message || 'Bilinmeyen hata');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Profil tamamlama hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] submitProfileCompletion",e);}
try{ if(typeof window.openRecoveryLoginModal!=="function"||__OVER.indexOf("openRecoveryLoginModal")>=0) window.openRecoveryLoginModal=function () {
    var modal = document.getElementById('recoveryLoginModal');
    if (!modal) {
        console.warn('recoveryLoginModal bulunamadı!');
        return;
    }
    var errBox = document.getElementById('rlErrorBox');
    if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }
    var emailInp = document.getElementById('rlEmail');
    var passInp = document.getElementById('rlPassword');
    if (emailInp) emailInp.value = '';
    if (passInp) passInp.value = '';

    modal.classList.add('open');
    modal.style.display = 'flex';

    setTimeout(function () {
        if (emailInp) emailInp.focus();
    }, 200);
};}catch(e){console.warn("[legacy] openRecoveryLoginModal",e);}
try{ if(typeof window.submitRecoveryLogin!=="function"||__OVER.indexOf("submitRecoveryLogin")>=0) window.submitRecoveryLogin=async function () {
    var emailInput = document.getElementById('rlEmail');
    var passInput = document.getElementById('rlPassword');
    var errBox = document.getElementById('rlErrorBox');

    var email = emailInput ? emailInput.value.trim() : '';
    var pass = passInput ? passInput.value : '';

    function showError(msg) {
        if (errBox) {
            errBox.textContent = '❌ ' + msg;
            errBox.style.display = 'block';
        }
        showNotification('❌ ' + msg, 'error');
        if (typeof window.addLogWarning === 'function') {
            window.addLogWarning('Kurtarma girişi hatası: ' + msg);
        }
    }
    if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }

    if (!email || !pass) return showError('E-posta ve şifre gerekli.');

    try {
        showNotification('⏳ Giriş yapılıyor...', 'success');

        var result = await Parse.Cloud.run('loginWithRecoveryEmail', {
            recoveryEmail: email,
            password: pass
        });

        if (!result || !result.success) {
            throw new Error(result && result.error ? result.error : 'Giriş başarısız.');
        }

        var user = await Parse.User.become(result.sessionToken);
        if (!user) {
            throw new Error('Oturum açılamadı.');
        }

        if (user.get('isBanned')) {
            await Parse.User.logOut();
            showError('Hesabınız yasaklanmıştır!');
            return;
        }

        window.currentUser = user;
        if (typeof currentUser !== 'undefined') currentUser = user;

        localStorage.setItem('aethrion_user', JSON.stringify({
            id: user.id,
            name: user.get('name'),
            email: user.get('email'),
            role: user.get('role'),
            plan: user.get('plan'),
            teamId: user.get('teamId')
        }));

        closeModal('recoveryLoginModal');
        closeModal('authModal');
        await window.showDashboard();
        if (typeof window.updateCommentUI === 'function') window.updateCommentUI();
        if (typeof window.loadComments === 'function') await window.loadComments();
        if (typeof window.checkAndShowSubscriptionCard === 'function') {
            await window.checkAndShowSubscriptionCard();
        }

        if (typeof window.refreshUserLimits === 'function') {
            window.refreshUserLimits();
        }

        showNotification('✅ Giriş başarılı! AETHRION\'a hoş geldin, ' + (user.get('name') || 'Kullanıcı'), 'success');
        if (typeof window.addLogSuccess === 'function') {
            window.addLogSuccess('Kurtarma maili ile giriş: ' + email);
        }
    } catch (e) {
        console.error('Kurtarma girişi hatası:', e);
        showError(e.message || 'Bilinmeyen hata');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Kurtarma girişi hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] submitRecoveryLogin",e);}
try{ if(typeof window.sendVerificationCode!=="function"||__OVER.indexOf("sendVerificationCode")>=0) window.sendVerificationCode=async function () {
    var email = document.getElementById('resetEmail').value.trim();
    if (!email) return showNotification('E-posta adresi girin!', 'error');
    try {
        var result = await Parse.Cloud.run('sendVerificationCode', { email: email });
        if (result.success) {
            document.getElementById('resetStep1').style.display = 'none';
            document.getElementById('resetStep2').style.display = 'block';
            showNotification('Doğrulama kodu gönderildi!', 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('Şifre sıfırlama kodu gönderildi: ' + email);
            }
        } else {
            showNotification('Hata: ' + result.error, 'error');
            if (typeof window.addLogWarning === 'function') {
                window.addLogWarning('Şifre sıfırlama kodu hatası: ' + result.error);
            }
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Şifre sıfırlama kodu hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] sendVerificationCode",e);}
try{ if(typeof window.resetPasswordWithCode!=="function"||__OVER.indexOf("resetPasswordWithCode")>=0) window.resetPasswordWithCode=async function () {
    var email = document.getElementById('resetEmail').value.trim();
    var code = document.getElementById('resetCode').value.trim();
    var newPass = document.getElementById('resetNewPass').value;
    var newPass2 = document.getElementById('resetNewPass2').value;
    if (!email || !code || !newPass) return showNotification('Tüm alanları doldurun!', 'error');
    if (newPass.length < 8) return showNotification('Şifre en az 8 karakter olmalı!', 'error');
    if (newPass !== newPass2) return showNotification('Şifreler eşleşmiyor!', 'error');
    try {
        var result = await Parse.Cloud.run('resetPasswordWithCode', {
            email: email,
            code: code,
            newPassword: newPass
        });
        if (result.success) {
            showNotification('Şifre başarıyla değiştirildi!', 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('Şifre sıfırlandı: ' + email);
            }
            closeModal('resetPasswordModal');
        } else {
            showNotification('Hata: ' + result.error, 'error');
            if (typeof window.addLogWarning === 'function') {
                window.addLogWarning('Şifre sıfırlama hatası: ' + result.error);
            }
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Şifre sıfırlama hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] resetPasswordWithCode",e);}
try{ if(typeof window.changePassword!=="function"||__OVER.indexOf("changePassword")>=0) window.changePassword=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    var newPass = prompt('Yeni şifrenizi girin (8+ karakter):');
    if (!newPass || newPass.length < 8) return showNotification('Şifre en az 8 karakter olmalı!', 'error');
    var confirmPass = prompt('Yeni şifreyi tekrar girin:');
    if (newPass !== confirmPass) return showNotification('Şifreler eşleşmiyor!', 'error');
    try {
        window.currentUser.set('password', newPass);
        await window.currentUser.save();
        showNotification('Şifre başarıyla değiştirildi!', 'success');
        if (typeof window.addLogSuccess === 'function') {
            window.addLogSuccess('Şifre değiştirildi');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Şifre değiştirme hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] changePassword",e);}
try{ if(typeof window.deleteAccount!=="function"||__OVER.indexOf("deleteAccount")>=0) window.deleteAccount=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    var password = prompt('Hesabınızı silmek için şifrenizi girin (8+ karakter):');
    if (!password) return showNotification('İşlem iptal edildi.', 'warning');
    try {
        await Parse.User.logIn(window.currentUser.get('email'), password);
        if (!confirm('AETHRION hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
        if (typeof window.addLogWarning === 'function') {
            window.addLogWarning('Hesap silme: ' + window.currentUser.get('email'));
        }
        await window.currentUser.destroy();
        await Parse.User.logOut();
        localStorage.removeItem('aethrion_user');
        window.currentUser = null;
        if (typeof currentUser !== 'undefined') currentUser = null;
        location.reload();
        showNotification('Hesabınız silindi.', 'success');
    } catch (e) {
        if (e.code === 101) {
            showNotification('Şifre yanlış! Lütfen tekrar deneyin.', 'error');
        } else {
            showNotification('Hata: ' + e.message, 'error');
            if (typeof window.addLogError === 'function') {
                window.addLogError('Hesap silme hatası: ' + e.message);
            }
        }
    }
};}catch(e){console.warn("[legacy] deleteAccount",e);}
try{ if(typeof window.leaveAdminRole!=="function"||__OVER.indexOf("leaveAdminRole")>=0) window.leaveAdminRole=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm('Admin rolünden ayrılmak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('leaveAdminRole', {});
        showNotification(result.message || 'Admin rolünden ayrıldınız.', 'success');
        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('Admin rolünden ayrıldı');
        }
        await window.currentUser.fetch();
        var roleEl = document.getElementById('userRoleBadge');
        if (roleEl) roleEl.innerHTML = '👤 KULLANICI';
        location.reload();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Admin rol ayrılma hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] leaveAdminRole",e);}
try{ if(typeof window.leaveBetaRole!=="function"||__OVER.indexOf("leaveBetaRole")>=0) window.leaveBetaRole=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm('Beta rolünden ayrılmak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('leaveBetaRole', {});
        showNotification(result.message || 'Beta rolünden ayrıldınız.', 'success');
        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('Beta rolünden ayrıldı');
        }
        await window.currentUser.fetch();
        var roleEl2 = document.getElementById('userRoleBadge');
        if (roleEl2) roleEl2.innerHTML = '👤 KULLANICI';
        location.reload();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Beta rol ayrılma hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] leaveBetaRole",e);}
try{ if(typeof window.loadProjects!=="function"||__OVER.indexOf("loadProjects")>=0) window.loadProjects=async function () {
    if (!window.currentUser) return;
    try {
        var Project = Parse.Object.extend('Project');
        var query = new Parse.Query(Project);
        query.equalTo('user_email', window.currentUser.get('email'));
        query.equalTo('is_archived', false);
        query.equalTo('is_trashed', false);
        query.descending('createdAt');
        var projects = await query.find();
        var container = document.getElementById('projectsList');
        if (!container) return;
        if (projects.length === 0) {
            container.innerHTML = '<div class="project-item">Henüz proje yok.</div>';
        } else {
            var html = '';
            for (var i = 0; i < projects.length; i++) {
                var p = projects[i];
                var projName = p.get('name') || 'İsimsiz Proje';
                var projType = p.get('type') || '';
                var typeIcon = projType === '3D' ? '🧊 ' : (projType === 'Kod' ? '⌨️ ' : (projType === 'Görsel' ? '🖼️ ' : '📄 '));
                var safeName = window.escapeHtml(projName.substring(0, 30));
                html += '<div class="project-item">';
                html += '<span style="cursor:pointer; flex:1;" onclick="window.openProjectEditor(\'' + p.id + '\')" title="Düzenlemek için tıkla">' + typeIcon + safeName + '</span>';
                html += '<div class="project-actions">';
                html += '<span onclick="window.editProject(\'' + p.id + '\')" title="Düzenle">✏️</span>';
                html += '<span onclick="window.deleteProject(\'' + p.id + '\')" title="Sil">🗑️</span>';
                html += '<span onclick="window.favoriteProject(\'' + p.id + '\')" title="Favori">⭐</span>';
                html += '<span onclick="window.archiveProject(\'' + p.id + '\')" title="Arşivle">🗄️</span>';
                html += '<span onclick="window.publishProjectToStore(\'' + p.id + '\')" title="Mağazaya Sat" style="color:var(--gold);">💰</span>';
                html += '</div></div>';
            }
            container.innerHTML = html;
        }
    } catch (e) {
        console.error('Projeler yüklenirken hata:', e);
        if (typeof window.addLogError === 'function') {
            window.addLogError('Projeler yüklenemedi: ' + e.message);
        }
        var pc = document.getElementById('projectsList');
        if (pc) pc.innerHTML = '<div class="project-item">⚠️ Projeler yüklenemedi.</div>';
    }
};}catch(e){console.warn("[legacy] loadProjects",e);}
try{ if(typeof window.editProject!=="function"||__OVER.indexOf("editProject")>=0) window.editProject=function (id) {
    if (typeof window.openProjectEditor === 'function') {
        window.openProjectEditor(id);
    } else {
        window.editProjectLegacy(id);
    }
};}catch(e){console.warn("[legacy] editProject",e);}
try{ if(typeof window.editProjectLegacy!=="function"||__OVER.indexOf("editProjectLegacy")>=0) window.editProjectLegacy=async function (id) {
    var newName = prompt('Yeni proje adı:');
    if (!newName || !newName.trim()) return;
    try {
        var query = new Parse.Query('Project');
        var project = await query.get(id);
        project.set('name', newName.trim());
        await project.save();
        await window.loadProjects();
        showNotification('Proje güncellendi!', 'success');
        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('Proje güncellendi: ' + id);
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Proje güncelleme hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] editProjectLegacy",e);}
try{ if(typeof window.deleteProject!=="function"||__OVER.indexOf("deleteProject")>=0) window.deleteProject=async function (id) {
    if (!confirm('Projeyi silmek istediğinize emin misiniz?')) return;
    try {
        var query = new Parse.Query('Project');
        var project = await query.get(id);
        await project.destroy();
        await window.loadProjects();
        if (typeof window.loadArchive === 'function') await window.loadArchive();
        if (typeof window.loadTrash === 'function') await window.loadTrash();
        showNotification('Proje silindi!', 'success');
        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('Proje silindi: ' + id);
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Proje silme hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] deleteProject",e);}
try{ if(typeof window.favoriteProject!=="function"||__OVER.indexOf("favoriteProject")>=0) window.favoriteProject=async function (id) {
    try {
        var query = new Parse.Query('Project');
        var project = await query.get(id);
        project.set('is_favorite', !project.get('is_favorite'));
        await project.save();
        await window.loadProjects();
        if (typeof window.loadFavorites === 'function') await window.loadFavorites();
        showNotification(project.get('is_favorite') ? '⭐ Favorilere eklendi!' : '⭐ Favorilerden çıkarıldı!', 'success');
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Favori işlemi hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] favoriteProject",e);}
try{ if(typeof window.archiveProject!=="function"||__OVER.indexOf("archiveProject")>=0) window.archiveProject=async function (id) {
    try {
        var query = new Parse.Query('Project');
        var project = await query.get(id);
        project.set('is_archived', true);
        await project.save();
        await window.loadProjects();
        if (typeof window.loadArchive === 'function') await window.loadArchive();
        showNotification('🗄️ Proje arşivlendi!', 'success');
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Arşivleme hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] archiveProject",e);}
try{ if(typeof window.unarchiveProject!=="function"||__OVER.indexOf("unarchiveProject")>=0) window.unarchiveProject=async function (id) {
    try {
        var query = new Parse.Query('Project');
        var project = await query.get(id);
        project.set('is_archived', false);
        await project.save();
        await window.loadProjects();
        if (typeof window.loadArchive === 'function') await window.loadArchive();
        showNotification('📤 Proje arşivden çıkarıldı!', 'success');
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] unarchiveProject",e);}
try{ if(typeof window.restoreProject!=="function"||__OVER.indexOf("restoreProject")>=0) window.restoreProject=async function (id) {
    try {
        var query = new Parse.Query('Project');
        var project = await query.get(id);
        project.set('is_trashed', false);
        await project.save();
        await window.loadProjects();
        if (typeof window.loadTrash === 'function') await window.loadTrash();
        showNotification('↩️ Proje geri yüklendi!', 'success');
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] restoreProject",e);}
try{ if(typeof window.loadFavorites!=="function"||__OVER.indexOf("loadFavorites")>=0) window.loadFavorites=async function () {
    if (!window.currentUser) return;
    try {
        var Project = Parse.Object.extend('Project');
        var query = new Parse.Query(Project);
        query.equalTo('user_email', window.currentUser.get('email'));
        query.equalTo('is_favorite', true);
        query.equalTo('is_trashed', false);
        var projects = await query.find();
        var container = document.getElementById('favList');
        if (!container) return;
        if (projects.length === 0) {
            container.innerHTML = '<div class="project-item">Henüz favori proje yok.</div>';
        } else {
            var html = '';
            for (var i = 0; i < projects.length; i++) {
                var p = projects[i];
                var projName = p.get('name') || 'İsimsiz';
                var safeName = window.escapeHtml(projName.substring(0, 25));
                html += '<div class="project-item">';
                html += '<span style="cursor:pointer; flex:1;" onclick="window.openProjectEditor(\'' + p.id + '\')" title="Düzenlemek için tıkla">⭐ ' + safeName + '</span>';
                html += '<div class="project-actions"><span onclick="window.favoriteProject(\'' + p.id + '\')" title="Favoriden çıkar">★</span></div>';
                html += '</div>';
            }
            container.innerHTML = html;
        }
    } catch (e) {
        console.error('Favoriler yüklenirken hata:', e);
    }
};}catch(e){console.warn("[legacy] loadFavorites",e);}
try{ if(typeof window.loadArchive!=="function"||__OVER.indexOf("loadArchive")>=0) window.loadArchive=async function () {
    if (!window.currentUser) return;
    try {
        var Project = Parse.Object.extend('Project');
        var query = new Parse.Query(Project);
        query.equalTo('user_email', window.currentUser.get('email'));
        query.equalTo('is_archived', true);
        query.equalTo('is_trashed', false);
        var projects = await query.find();
        var container = document.getElementById('archiveList');
        if (!container) return;
        if (projects.length === 0) {
            container.innerHTML = '<div class="project-item">Arşivde proje yok.</div>';
        } else {
            var html = '';
            for (var i = 0; i < projects.length; i++) {
                var p = projects[i];
                var projName = p.get('name') || 'İsimsiz';
                var safeName = window.escapeHtml(projName.substring(0, 25));
                html += '<div class="project-item">';
                html += '<span style="cursor:pointer; flex:1;" onclick="window.openProjectEditor(\'' + p.id + '\')" title="Düzenlemek için tıkla">🗄️ ' + safeName + '</span>';
                html += '<div class="project-actions"><span onclick="window.unarchiveProject(\'' + p.id + '\')" title="Arşivden çıkar">📤</span><span onclick="window.deleteProject(\'' + p.id + '\')" title="Sil">🗑️</span></div>';
                html += '</div>';
            }
            container.innerHTML = html;
        }
    } catch (e) {
        console.error('Arşiv yüklenirken hata:', e);
    }
};}catch(e){console.warn("[legacy] loadArchive",e);}
try{ if(typeof window.loadTrash!=="function"||__OVER.indexOf("loadTrash")>=0) window.loadTrash=async function () {
    if (!window.currentUser) return;
    try {
        var Project = Parse.Object.extend('Project');
        var query = new Parse.Query(Project);
        query.equalTo('user_email', window.currentUser.get('email'));
        query.equalTo('is_trashed', true);
        var projects = await query.find();
        var container = document.getElementById('trashList');
        if (!container) return;
        if (projects.length === 0) {
            container.innerHTML = '<div class="project-item">Çöp kutusu boş.</div>';
        } else {
            var html = '';
            for (var i = 0; i < projects.length; i++) {
                var p = projects[i];
                var projName = p.get('name') || 'İsimsiz';
                var safeName = window.escapeHtml(projName.substring(0, 25));
                html += '<div class="project-item">';
                html += '<span style="cursor:pointer; flex:1;" onclick="window.openProjectEditor(\'' + p.id + '\')" title="Düzenlemek için tıkla">🗑️ ' + safeName + '</span>';
                html += '<div class="project-actions"><span onclick="window.restoreProject(\'' + p.id + '\')" title="Geri yükle">↩️</span><span onclick="window.deleteProject(\'' + p.id + '\')" title="Kalıcı sil">🔥</span></div>';
                html += '</div>';
            }
            container.innerHTML = html;
        }
    } catch (e) {
        console.error('Çöp kutusu yüklenirken hata:', e);
    }
};}catch(e){console.warn("[legacy] loadTrash",e);}
try{ if(typeof window.loadProjectRequests!=="function"||__OVER.indexOf("loadProjectRequests")>=0) window.loadProjectRequests=async function () {
    if (!window.currentUser) return;
    try {
        var Request = Parse.Object.extend('ProjectRequest');
        var query = new Parse.Query(Request);
        query.equalTo('user_email', window.currentUser.get('email'));
        query.descending('createdAt');
        var requests = await query.find();
        var container = document.getElementById('projectRequestsList');
        if (!container) return;
        if (requests.length === 0) {
            container.innerHTML = '<div class="project-item">Henüz proje talebiniz yok.</div>';
        } else {
            var html = '';
            for (var i = 0; i < requests.length; i++) {
                var r = requests[i];
                var name = r.get('title') || r.get('name') || 'İsimsiz Proje';
                var status = r.get('status') || 'Beklemede';
                var safeName = window.escapeHtml(name.substring(0, 25));
                var statusColor = status === 'pending' ? 'var(--gold)' : (status === 'accepted' ? 'var(--accent2)' : 'var(--danger)');
                html += '<div class="project-item" style="border-left-color: ' + statusColor + ';">';
                html += '<span>📨 ' + safeName + '</span>';
                html += '<span style="font-size:10px;color:var(--text3);">' +
                        (status === 'pending' ? '⏳ Beklemede' :
                         status === 'accepted' ? '✅ Kabul Edildi' :
                         status === 'rejected' ? '❌ Reddedildi' :
                         status === 'completed' ? '✅ Tamamlandı' : window.escapeHtml(status)) + '</span>';
                if (status === 'pending') {
                    html += '<button class="btn-danger btn-sm" onclick="window.cancelProjectRequest(\'' + r.id + '\')" style="font-size:9px;padding:2px 8px;">🗑️ İptal</button>';
                }
                html += '</div>';
            }
            container.innerHTML = html;
        }
    } catch (e) {
        console.error('Proje talepleri yüklenirken hata:', e);
        var prc = document.getElementById('projectRequestsList');
        if (prc) prc.innerHTML = '<div class="project-item">⚠️ Talepler yüklenemedi.</div>';
    }
};}catch(e){console.warn("[legacy] loadProjectRequests",e);}
try{ if(typeof window.cancelProjectRequest!=="function"||__OVER.indexOf("cancelProjectRequest")>=0) window.cancelProjectRequest=async function (requestId) {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm('Bu proje talebini iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    try {
        var result = await Parse.Cloud.run('cancelProjectRequest', { requestId: requestId });
        if (result.success) {
            showNotification('✅ Proje talebi iptal edildi.', 'success');
            if (typeof window.addLogInfo === 'function') {
                window.addLogInfo('Proje talebi iptal edildi: ' + requestId);
            }
            window.loadProjectRequests();
        } else {
            showNotification('❌ ' + result.error, 'error');
            if (typeof window.addLogWarning === 'function') {
                window.addLogWarning('Proje talebi iptal hatası: ' + result.error);
            }
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Proje talebi iptal hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] cancelProjectRequest",e);}
try{ if(typeof window.getMyReferralCode!=="function"||__OVER.indexOf("getMyReferralCode")>=0) window.getMyReferralCode=function () {
    if (!window.currentUser) return '';
    return window.currentUser.get('referral_code') || '';
};}catch(e){console.warn("[legacy] getMyReferralCode",e);}
try{ if(typeof window.showMyReferralCode!=="function"||__OVER.indexOf("showMyReferralCode")>=0) window.showMyReferralCode=function () {
    if (!window.currentUser) {
        showNotification('Önce giriş yapın!', 'error');
        return;
    }
    var code = window.currentUser.get('referral_code');
    if (!code) {
        showNotification('Davet kodunuz henüz oluşturulmamış.', 'warning');
        return;
    }
    var shareUrl = 'https://vizyon2026.vercel.app/?ref=' + encodeURIComponent(code);
    alert('📍 Sizin AETHRION Davet Kodunuz:\n\n' + code + '\n\n🔗 Davet Linki:\n' + shareUrl +
        '\n\nBu linki arkadaşlarınızla paylaşın. Her kullanımda 1000 puan kazanırsınız! (Maks. 2 kişi)\n\nAETHRION — Intelligence Without Limits.');
};}catch(e){console.warn("[legacy] showMyReferralCode",e);}
try{ if(typeof window.enterReferralCode!=="function"||__OVER.indexOf("enterReferralCode")>=0) window.enterReferralCode=async function () {
    if (!window.currentUser) {
        showNotification('Önce giriş yapın!', 'error');
        return;
    }
    var codeInput = document.getElementById('referralCodeInput');
    if (!codeInput) return;
    var code = codeInput.value.trim();
    if (!code) {
        showNotification('Lütfen bir davet kodu girin!', 'warning');
        return;
    }
    var msgDiv = document.getElementById('referralMessage');
    try {
        var result = await Parse.Cloud.run('applyReferral', { code: code });
        if (result.success) {
            if (msgDiv) {
                msgDiv.innerHTML = '✅ ' + result.message;
                msgDiv.style.color = 'var(--accent2)';
            }
            codeInput.value = '';
            await window.currentUser.fetch();
            if (typeof window.updatePointsBadge === 'function') {
                window.updatePointsBadge(window.currentUser.get('points') || 0);
            }
            if (typeof window.loadReferralLeaderboard === 'function') {
                window.loadReferralLeaderboard();
            }
            showNotification('✅ ' + result.message, 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('Davet kodu kullanıldı: ' + code);
            }
        } else {
            if (msgDiv) {
                msgDiv.innerHTML = '❌ ' + (result.error || result.message || 'Geçersiz kod!');
                msgDiv.style.color = 'var(--danger)';
            }
            showNotification('❌ ' + (result.error || result.message), 'error');
            if (typeof window.addLogWarning === 'function') {
                window.addLogWarning('Davet kodu hatası: ' + (result.error || result.message));
            }
        }
    } catch (e) {
        if (msgDiv) {
            msgDiv.innerHTML = '❌ Hata: ' + e.message;
            msgDiv.style.color = 'var(--danger)';
        }
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Davet kodu hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] enterReferralCode",e);}
try{ if(typeof window.generateReferralCode!=="function"||__OVER.indexOf("generateReferralCode")>=0) window.generateReferralCode=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('generateReferralCode', {});
        if (result && result.referral_code) {
            showNotification('✅ Davet kodunuz: ' + result.referral_code, 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('Davet kodu oluşturuldu: ' + result.referral_code);
            }
            await window.currentUser.fetch();
            if (typeof window.loadReferralLeaderboard === 'function') {
                window.loadReferralLeaderboard();
            }
            var pm = document.getElementById('profileModal');
            if (pm && pm.classList.contains('open')) {
                window.openProfileModal();
            }
        } else {
            showNotification('Kod oluşturulamadı.', 'warning');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Davet kodu oluşturma hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] generateReferralCode",e);}
try{ if(typeof window.openRandomSupport!=="function"||__OVER.indexOf("openRandomSupport")>=0) window.openRandomSupport=function () {
    window.location.href = 'mailto:aethrion.official@gmail.com?subject=AETHRION%20Destek';
};}catch(e){console.warn("[legacy] openRandomSupport",e);}
try{ if(typeof window.shareSite!=="function"||__OVER.indexOf("shareSite")>=0) window.shareSite=function () {
    if (navigator.share) {
        navigator.share({
            title: 'AETHRION — Intelligence Without Limits.',
            text: 'AETHRION ile yapay zekanın gücünü keşfet! 28 model tek platformda.',
            url: 'https://vizyon2026.vercel.app'
        }).catch(function () {});
    } else {
        var dummy = document.createElement('input');
        dummy.value = 'https://vizyon2026.vercel.app';
        document.body.appendChild(dummy);
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        showNotification('Site linki kopyalandı!', 'success');
    }
};}catch(e){console.warn("[legacy] shareSite",e);}
try{ if(typeof window.isUserModerator!=="function"||__OVER.indexOf("isUserModerator")>=0) window.isUserModerator=function (user) {
    if (!user) user = window.currentUser;
    if (!user) return false;
    return user.get('role') === 'moderator';
};}catch(e){console.warn("[legacy] isUserModerator",e);}
try{ if(typeof window.getUserRoleLabel!=="function"||__OVER.indexOf("getUserRoleLabel")>=0) window.getUserRoleLabel=function (user) {
    if (!user) user = window.currentUser;
    if (!user) return '👤 KULLANICI';
    var role = user.get('role') || 'user';
    switch (role) {
        case 'founder': return '👑 KURUCU';
        case 'admin': return '⚙️ ADMIN';
        case 'beta': return '🔬 BETA';
        case 'moderator': return '🎨 MODERATÖR / TASARIMCI';
        default: return '👤 KULLANICI';
    }
};}catch(e){console.warn("[legacy] getUserRoleLabel",e);}
try{ if(typeof window.getReferralCodeFromUrl!=="function"||__OVER.indexOf("getReferralCodeFromUrl")>=0) window.getReferralCodeFromUrl=function () {
    try {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref') || urlParams.get('referral') || '';
    } catch (e) {
        return '';
    }
};}catch(e){console.warn("[legacy] getReferralCodeFromUrl",e);}
try{ if(typeof window.currentAIRequestId==="undefined") window.currentAIRequestId=null;}catch(e){console.warn("[legacy] currentAIRequestId",e);}
try{ if(typeof window.currentAIMode==="undefined") window.currentAIMode='site';}catch(e){console.warn("[legacy] currentAIMode",e);}
try{ if(typeof window.customAIMode==="undefined") window.customAIMode=null;}catch(e){console.warn("[legacy] customAIMode",e);}
try{ if(typeof window._selectedNvidiaModel==="undefined") window._selectedNvidiaModel=null;}catch(e){console.warn("[legacy] _selectedNvidiaModel",e);}
function cleanClientResponse(text) {
    if (!text) return text;

    // Kod bloklarını ayrıştır (\r\n desteği)
    var withCopy = text.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, function (match, lang, code) {
        return '<div class="code-block"><pre><code class="language-' + (lang || '') + '">' + code + '</code></pre><button class="copy-btn" onclick="copyCode(this)">📋 Kopyala</button></div>';
    });

    if (withCopy === text) {
        return text
            .replace(/\\n/g, '<br>')
            .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    return withCopy
        .replace(/\\n/g, '<br>')
        .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}
if(typeof window.cleanClientResponse!=="function"||__OVER.indexOf("cleanClientResponse")>=0)window.cleanClientResponse=cleanClientResponse;
function copyCode(btn) {
    var codeBlock = btn.parentElement.querySelector('code');
    if (!codeBlock) return;
    var code = codeBlock.textContent;
    var originalText = btn.innerHTML;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
            btn.innerHTML = '✅ Kopyalandı!';
            btn.style.borderColor = '#b8c0d0';
            btn.style.color = '#b8c0d0';
            setTimeout(function () {
                btn.innerHTML = originalText;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 2000);
        }).catch(function () { fallbackCopy(code, btn); });
    } else {
        fallbackCopy(code, btn);
    }
}
if(typeof window.copyCode!=="function"||__OVER.indexOf("copyCode")>=0)window.copyCode=copyCode;
function fallbackCopy(code, btn) {
    var textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        var originalText = btn.innerHTML;
        btn.innerHTML = '✅ Kopyalandı!';
        btn.style.borderColor = '#b8c0d0';
        btn.style.color = '#b8c0d0';
        setTimeout(function () {
            btn.innerHTML = originalText;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    } catch (e) {
        alert('Kopyalanamadı. Lütfen manuel kopyalayın.');
    }
    document.body.removeChild(textarea);
}
if(typeof window.fallbackCopy!=="function"||__OVER.indexOf("fallbackCopy")>=0)window.fallbackCopy=fallbackCopy;
try{ if(typeof window.selectNvidiaModel!=="function"||__OVER.indexOf("selectNvidiaModel")>=0) window.selectNvidiaModel=function (modelId) {
    window._selectedNvidiaModel = modelId || null;
    var statusEl = document.getElementById('nvidiaModelStatus');
    if (statusEl) {
        if (modelId) {
            statusEl.textContent = '✅ ' + modelId.split('/').pop();
            statusEl.style.color = 'var(--nvidia)';
        } else {
            statusEl.textContent = '🟢 Otomatik (28 model)';
            statusEl.style.color = 'var(--nvidia)';
        }
    }
    if (typeof window.addLogInfo === 'function') {
        window.addLogInfo('NVIDIA model seçildi: ' + (modelId || 'otomatik'));
    }
};}catch(e){console.warn("[legacy] selectNvidiaModel",e);}
async function callAllAIModels(prompt, conversationId) {
    try {
        var history = [];
        if (conversationId) {
            try {
                var result = await Parse.Cloud.run('getConversationMessages', { conversationId: conversationId });
                if (result && result.messages) {
                    history = result.messages.map(function (m) {
                        return {
                            role: (m.from_user && m.from_user.id === window.currentUser.get('email')) ? 'user' : 'assistant',
                            content: m.text || ''
                        };
                    });
                }
            } catch (e) { console.log('Geçmiş alınamadı:', e); }
        }

        var fullPrompt = prompt;
        if (history.length > 0) {
            var context = "Sohbet geçmişi:\n";
            history.forEach(function (h) {
                context += (h.role === 'user' ? 'Kullanıcı: ' : 'AI: ') + h.content + '\n';
            });
            fullPrompt = context + "\nKullanıcının son sorusu: " + prompt;
        }

        // ===== ÖNCELİK 1: NVIDIA MODEL SEÇİLİYSE =====
        if (window._selectedNvidiaModel) {
            try {
                var nvidiaResult = await Parse.Cloud.run('callNvidiaNIM', {
                    prompt: fullPrompt,
                    model: window._selectedNvidiaModel
                });
                if (nvidiaResult && nvidiaResult.success && nvidiaResult.reply) {
                    return nvidiaResult.reply;
                } else if (nvidiaResult && nvidiaResult.reply) {
                    return nvidiaResult.reply;
                }
            } catch (e) {
                console.warn('NVIDIA NIM hatası, site moduna geçiliyor:', e.message);
                showNotification('⚠️ NVIDIA model hatası, site modu kullanılıyor', 'warning');
            }
        }

        // ===== ÖNCELİK 2: KULLANICI API MODU =====
        if (window.currentAIMode === 'custom') {
            try {
                var keyIdsParam = window.customAIKeyIds === 'all' ? 'all' : (window.customAIKeyIds || 'all');
                var customResult = await Parse.Cloud.run('callCustomAIWithKeys', {
                    prompt: fullPrompt,
                    keyIds: keyIdsParam
                });
                if (customResult && customResult.success && customResult.reply) {
                    return customResult.reply;
                } else if (customResult && customResult.reply) {
                    return customResult.reply;
                } else {
                    console.warn('Custom AI yanıt vermedi, site moduna geçiliyor.');
                    showNotification('⚠️ Kendi API başarısız, site modu kullanılıyor', 'warning');
                }
            } catch (e) {
                console.warn('Custom AI hatası:', e);
                try {
                    var fallbackResult = await Parse.Cloud.run('callCustomAI', { prompt: fullPrompt });
                    if (fallbackResult && fallbackResult.success && fallbackResult.reply) {
                        return fallbackResult.reply;
                    } else if (fallbackResult && fallbackResult.reply) {
                        return fallbackResult.reply;
                    }
                } catch (e2) { console.warn('Fallback custom AI hatası:', e2); }
                showNotification('⚠️ Kendi API hatası: ' + e.message + ' — site modu denenecek', 'warning');
            }
        }

        // ===== ÖNCELİK 3: SİTE MODU (28 model) =====
        return await callSiteAI(fullPrompt);
    } catch (e) {
        console.error('AI hatası:', e);
        if (typeof window.addLogError === 'function') {
            window.addLogError('AI genel hatası: ' + e.message);
        }
        return '🧠 AETHRION AI: "' + prompt + '" hakkında yardımcı olabilirim. Detaylı yanıt için lütfen daha spesifik bir soru sorun.';
    }
}
if(typeof window.callAllAIModels!=="function"||__OVER.indexOf("callAllAIModels")>=0)window.callAllAIModels=callAllAIModels;
async function callSiteAI(prompt) {
    try {
        var result = await Parse.Cloud.run('superAI', { prompt: prompt });
        return result;
    } catch (e) {
        console.error('Site AI hatası:', e);
        if (typeof window.addLogError === 'function') {
            window.addLogError('Site AI hatası: ' + e.message);
        }
        return '🧠 AETHRION AI: Şu anda cevap veremiyorum. Lütfen daha sonra tekrar deneyin.';
    }
}
if(typeof window.callSiteAI!=="function"||__OVER.indexOf("callSiteAI")>=0)window.callSiteAI=callSiteAI;
async function webSearch(query) {
    try {
        var result = await Parse.Cloud.run('webSearch', { query: query });
        return result || '"' + query + '" için sonuç bulunamadı.';
    } catch (e) {
        return '"' + query + '" için arama yapılamadı.';
    }
}
if(typeof window.webSearch!=="function"||__OVER.indexOf("webSearch")>=0)window.webSearch=webSearch;
async function saveAIMessageToConversation(conversationId, userText, aiText) {
    if (!conversationId || !window.currentUser) return;
    try {
        await Parse.Cloud.run('sendMessage', {
            conversationId: conversationId,
            text: userText,
            fileUrl: null,
            fileName: null
        });
    } catch (e) { console.warn('Kullanıcı mesajı kaydedilemedi:', e); }

    try {
        await Parse.Cloud.run('sendAIMessage', {
            conversationId: conversationId,
            text: aiText,
            fromEmail: 'system@aethrion.com',
            fromName: '🧠 AETHRION AI'
        });
    } catch (e) {
        console.warn('AI mesajı sendAIMessage ile kaydedilemedi, fallback:', e);
        try {
            await Parse.Cloud.run('sendMessage', {
                conversationId: conversationId,
                text: aiText,
                fileUrl: null,
                fileName: null
            });
        } catch (e2) { console.warn('Fallback de başarısız:', e2); }
    }
}
if(typeof window.saveAIMessageToConversation!=="function"||__OVER.indexOf("saveAIMessageToConversation")>=0)window.saveAIMessageToConversation=saveAIMessageToConversation;
function getUserDisplayName() {
    if (!window.currentUser) return 'Misafir';
    return window.currentUser.get('name') || window.currentUser.get('username') || 'Kullanıcı';
}
if(typeof window.getUserDisplayName!=="function"||__OVER.indexOf("getUserDisplayName")>=0)window.getUserDisplayName=getUserDisplayName;
function renderUserMessage(text) {
    var userName = getUserDisplayName();
    return '<div class="ai-message user">' +
           '<div class="role">👤 ' + window.escapeHtml(userName) + '</div>' +
           text.replace(/</g, '&lt;') +
           '</div>';
}
if(typeof window.renderUserMessage!=="function"||__OVER.indexOf("renderUserMessage")>=0)window.renderUserMessage=renderUserMessage;
function renderBotMessage(cleanedHtml, msgId) {
    var idAttr = msgId ? ' id="' + msgId + '"' : '';
    var actions = msgId ? (
        '<div class="ai-msg-actions-container">' +
        '<button class="btn-edit" onclick="window.editAIMessage(\'' + msgId + '\', \'dashboard\')" title="Bu cevabı sil ve mesajı düzenle">✏️ Düzenle</button>' +
        '<button class="btn-copy" onclick="window.copyAIMessageText(\'' + msgId + '\')" title="Cevabı kopyala">📋 Kopyala</button>' +
        '</div>'
    ) : '';
    return '<div class="ai-message bot"' + idAttr + '>' +
           '<div class="role">🧠 AETHRION AI</div>' +
           cleanedHtml + actions +
           '</div>';
}
if(typeof window.renderBotMessage!=="function"||__OVER.indexOf("renderBotMessage")>=0)window.renderBotMessage=renderBotMessage;
try{ if(typeof window.editAIMessage!=="function"||__OVER.indexOf("editAIMessage")>=0) window.editAIMessage=function (msgId, source) {
    window.stopAIResponse(source);

    var container = (source === 'full') ? document.getElementById('fullAIChat') : document.getElementById('dashboardAiMessages');
    if (!container) return;

    var userMessages = container.querySelectorAll('.ai-message.user, .ai-msg.user');
    if (userMessages.length === 0) {
        showNotification('Düzenlenecek mesaj bulunamadı!', 'warning');
        return;
    }
    var lastUserMsg = userMessages[userMessages.length - 1];
    var originalText = lastUserMsg.textContent.trim();
    var roleDiv = lastUserMsg.querySelector('.role');
    if (roleDiv) {
        originalText = originalText.replace(roleDiv.textContent, '').trim();
    }

    var botMessages = container.querySelectorAll('.ai-message.bot, .ai-msg.bot');
    if (botMessages.length > 0) {
        var lastBotMsg = botMessages[botMessages.length - 1];
        if (lastBotMsg.compareDocumentPosition(lastUserMsg) & Node.DOCUMENT_POSITION_PRECEDING) {
            lastBotMsg.remove();
        }
    }

    lastUserMsg.remove();

    var input = (source === 'full') ? document.getElementById('fullAIInput') : document.getElementById('dashboardAiInput');
    if (input) {
        input.value = originalText;
        input.focus();
    }

    showNotification('✏️ Mesaj düzenleme modunda — değiştirip tekrar gönderebilirsiniz.', 'success');
};}catch(e){console.warn("[legacy] editAIMessage",e);}
try{ if(typeof window.copyAIMessageText!=="function"||__OVER.indexOf("copyAIMessageText")>=0) window.copyAIMessageText=function (msgId) {
    var el = document.getElementById(msgId);
    if (!el) return;
    var clone = el.cloneNode(true);
    var actions = clone.querySelector('.ai-msg-actions-container');
    if (actions) actions.remove();
    var roleEl = clone.querySelector('.role');
    if (roleEl) roleEl.remove();
    var text = clone.textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            showNotification('📋 Cevap kopyalandı!', 'success');
        }).catch(function () {
            fallbackCopyText(text);
        });
    } else {
        fallbackCopyText(text);
    }
};}catch(e){console.warn("[legacy] copyAIMessageText",e);}
function fallbackCopyText(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification('📋 Cevap kopyalandı!', 'success');
    } catch (e) {
        showNotification('Kopyalanamadı', 'error');
    }
    document.body.removeChild(textarea);
}
if(typeof window.fallbackCopyText!=="function"||__OVER.indexOf("fallbackCopyText")>=0)window.fallbackCopyText=fallbackCopyText;
function closeFullAIPanel() {
    var panel = document.getElementById('fullAIPanel');
    if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('fullscreen');
    }

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.width = '';

    document.getElementById('mainSite').style.display = 'block';
    if (window.currentUser) {
        document.getElementById('dashboardArea').style.display = 'none';
        var userPanel = document.getElementById('userPanel');
        if (userPanel) userPanel.style.display = 'none';
    }
    var widget = document.querySelector('.ai-widget');
    if (widget) widget.style.display = 'block';
}
if(typeof window.closeFullAIPanel!=="function"||__OVER.indexOf("closeFullAIPanel")>=0)window.closeFullAIPanel=closeFullAIPanel;
function updateGuestQueryBadge(result) {
    var remaining = result ? result.remaining : 25;
    var badge = document.querySelector('#fullAIPanel .vizyon-ai-header span');
    if (badge) {
        badge.textContent = '🔋 ' + (remaining || 25) + ' sorgu kaldı';
    }
}
if(typeof window.updateGuestQueryBadge!=="function"||__OVER.indexOf("updateGuestQueryBadge")>=0)window.updateGuestQueryBadge=updateGuestQueryBadge;
async function sendFullAI() {
    try {
        var result = await Parse.Cloud.run('useQuery', {});
        if (result && result.remaining !== undefined && result.remaining <= 0) {
            showNotification('⚠️ Günlük sorgu hakkınız doldu!', 'error');
            return;
        }
        if (!window.currentUser) {
            updateGuestQueryBadge(result);
        } else {
            if (typeof updateQueryBadge === 'function') updateQueryBadge(result);
        }
    } catch (e) {
        if (e.message && e.message.includes('limit')) {
            showNotification('⚠️ ' + e.message, 'error');
            return;
        }
    }

    var inp = document.getElementById('fullAIInput');
    var chat = document.getElementById('fullAIChat');
    if (!inp || !chat) {
        showNotification('Sohbet alanı bulunamadı!', 'error');
        return;
    }

    var msg = inp.value.trim();
    if (!msg) {
        showNotification('Lütfen bir mesaj yazın!', 'warning');
        return;
    }

    var thisRequestId = 'req_full_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    window.currentAIRequestId = thisRequestId;

    var userName = getUserDisplayName();
    chat.innerHTML += '<div class="ai-msg user" style="padding:10px 14px;font-size:13px;max-width:90%;border-radius:12px;background:linear-gradient(135deg, rgba(212,175,55,0.18), rgba(124,92,255,0.12));border:1px solid rgba(212,175,55,0.25);align-self:flex-end;text-align:right;"><div class="role">👤 ' + window.escapeHtml(userName) + '</div>' + msg.replace(/</g, '&lt;') + '</div>';
    inp.value = '';
    chat.scrollTop = chat.scrollHeight;

    var stopBtn = document.getElementById('fullAIStopBtn');
    if (stopBtn) stopBtn.style.display = 'inline-block';

    var thinkingId = 'thinking_full_' + thisRequestId;
    chat.innerHTML += '<div class="ai-msg bot ai-thinking-indicator" id="' + thinkingId + '" style="align-self:flex-start;"><span class="dot"></span><span class="dot"></span><span class="dot"></span> <span style="margin-left:6px;">AETHRION AI düşünüyor...</span></div>';
    chat.scrollTop = chat.scrollHeight;

    if (!window.fullAIConversationId) {
        var storedFullConvId = localStorage.getItem('aethrion_full_ai_conv_id');
        if (storedFullConvId) {
            window.fullAIConversationId = storedFullConvId;
        } else {
            try {
                var result2 = await Parse.Cloud.run('startConversation', {});
                if (result2.success) {
                    window.fullAIConversationId = result2.conversationId;
                    localStorage.setItem('aethrion_full_ai_conv_id', window.fullAIConversationId);
                }
            } catch (e) { console.log('Konuşma başlatılamadı:', e); }
        }
    }

    var response;
    if (msg.indexOf('dolar') !== -1 || msg.indexOf('haber') !== -1 || msg.indexOf('hava') !== -1 || msg.indexOf('arama') !== -1) {
        response = await webSearch(msg);
    } else {
        response = await callAllAIModels(msg, window.fullAIConversationId);
    }

    if (window.currentAIRequestId !== thisRequestId) {
        var thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.remove();
        return;
    }

    var thinkingEl2 = document.getElementById(thinkingId);
    if (thinkingEl2) thinkingEl2.remove();

    if (stopBtn) stopBtn.style.display = 'none';

    var cleaned = cleanClientResponse(response);
    var botMsgId = 'botmsg_full_' + thisRequestId;
    chat.innerHTML +=
        '<div class="ai-msg bot" id="' + botMsgId + '" style="padding:10px 14px;font-size:13px;max-width:90%;border-radius:12px;background:linear-gradient(135deg, rgba(184,192,208,0.08), rgba(212,175,55,0.06));border-left:3px solid #b8c0d0;border:1px solid rgba(184,192,208,0.15);">' +
            '<div class="role">🧠 AETHRION AI</div>' + cleaned +
            '<div class="ai-msg-actions-container">' +
                '<button class="btn-edit" onclick="window.editAIMessage(\'' + botMsgId + '\', \'full\')" title="Bu cevabı sil ve mesajı düzenle">✏️ Düzenle</button>' +
                '<button class="btn-copy" onclick="window.copyAIMessageText(\'' + botMsgId + '\')" title="Cevabı kopyala">📋 Kopyala</button>' +
            '</div>' +
        '</div>';
    chat.scrollTop = chat.scrollHeight;

    if (window.fullAIConversationId && window.currentUser) {
        await saveAIMessageToConversation(window.fullAIConversationId, msg, response);
        if (typeof window.loadConversationHistory === 'function') {
            try { window.loadConversationHistory(); } catch (e) {}
        }
    }
}
if(typeof window.sendFullAI!=="function"||__OVER.indexOf("sendFullAI")>=0)window.sendFullAI=sendFullAI;
async function uploadFullFile(input) {
    var file = input.files[0];
    if (!file) return;

    // Plan limit kontrolü
    if (typeof window.checkFeatureLimit === 'function') {
        var limitCheck = window.checkFeatureLimit('fileAnalyzePerDay', 'day');
        if (!limitCheck.allowed) {
            if (typeof window.showLimitModal === 'function') {
                window.showLimitModal('fileAnalyzePerDay', limitCheck);
            }
            input.value = '';
            return;
        }
    }

    showNotification('📤 Dosya yükleniyor: ' + file.name, 'success');
    try {
        var parseFile = new Parse.File(file.name, file);
        await parseFile.save();
        var url = parseFile.url();
        showNotification('✅ Dosya yüklendi!', 'success');
        if (typeof window.addLogSuccess === 'function') {
            window.addLogSuccess('Dosya yüklendi (Full AI): ' + file.name);
        }

        // Container garantile
        var container = document.getElementById('fullAIFilePreviewContainer');
        if (!container) {
            console.warn('fullAIFilePreviewContainer bulunamadı, yeni oluşturuluyor...');
            container = document.createElement('div');
            container.id = 'fullAIFilePreviewContainer';
            container.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; padding:8px 12px; background:rgba(0,0,0,0.2); min-height:0; border-top:1px solid rgba(212,175,55,0.15);';
            var fullAIChat = document.getElementById('fullAIChat');
            if (fullAIChat && fullAIChat.parentNode) {
                fullAIChat.parentNode.insertBefore(container, fullAIChat.nextSibling);
            } else {
                document.body.appendChild(container);
            }
        }

        var card = document.createElement('div');
        card.style.cssText = 'width:80px; height:80px; border:1px solid var(--border2); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg); position:relative;';

        var fileType = file.type;
        var isImage = fileType && fileType.startsWith('image/');
        var isVideo = fileType && fileType.startsWith('video/');
        if (isImage) {
            var img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            card.appendChild(img);
        } else if (isVideo) {
            var video = document.createElement('video');
            video.src = url;
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.preload = 'metadata';
            card.appendChild(video);
        } else {
            var icon = document.createElement('div');
            icon.style.fontSize = '30px';
            icon.textContent = '📄';
            card.appendChild(icon);
            var nameSpan = document.createElement('div');
            nameSpan.textContent = file.name.substring(0, 6) + '..';
            nameSpan.style.cssText = 'font-size:8px; color:var(--text3); text-align:center; max-width:70px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;';
            card.appendChild(nameSpan);
        }

        var delBtn = document.createElement('button');
        delBtn.innerHTML = '×';
        delBtn.style.cssText = 'position:absolute; top:2px; right:4px; background:var(--danger); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:12px; cursor:pointer; line-height:1;';
        delBtn.onclick = function (e) {
            e.stopPropagation();
            card.remove();
            if (container.children.length === 0) container.style.display = 'none';
        };
        card.appendChild(delBtn);

        container.style.display = 'flex';
        container.appendChild(card);

        // Dosya içeriğini oku ve input'a yerleştir
        var reader = new FileReader();
        reader.onload = async function (event) {
            var content = event.target.result;
            var inputArea = document.getElementById('fullAIInput');
            if (inputArea) {
                var fileSize = (file.size / 1024).toFixed(1);
                var fileMsg = '📄 Dosya: ' + file.name + '\n📁 Boyut: ' + fileSize + ' KB\n📋 Tür: ' + (fileType || 'Bilinmiyor') + '\n\n';
                if (isImage) {
                    fileMsg += '🖼️ Bu bir görsel dosyası. Lütfen görseli analiz et ve içeriğini detaylıca açıkla.\n\n(Görsel verisi: ' + content.substring(0, 500) + '...)';
                } else if (isVideo) {
                    fileMsg += '🎬 Bu bir video dosyası. Lütfen video içeriğini analiz et ve özetle.';
                } else if (fileType === 'application/pdf') {
                    fileMsg += '📄 Bu bir PDF dosyası. Lütfen içeriğini analiz et ve özetle.\n\nİçerik:\n' + content.substring(0, 2000);
                } else {
                    fileMsg += '📝 İçeriği analiz et ve özetle:\n\n' + content.substring(0, 2000);
                }
                inputArea.value = fileMsg;

                if (typeof window.incrementUsage === 'function') {
                    window.incrementUsage('fileAnalyzePerDay', 'day', 1);
                }

                sendFullAI();
            }
        };
        if (isImage || isVideo) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    } catch (e) {
        console.error('Dosya yükleme hatası:', e);
        showNotification('❌ Dosya yüklenemedi: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Dosya yükleme hatası: ' + e.message);
        }
    }
    input.value = '';
}
if(typeof window.uploadFullFile!=="function"||__OVER.indexOf("uploadFullFile")>=0)window.uploadFullFile=uploadFullFile;
function toggleAiPanel() {
    var panel = document.getElementById('aiPanel');
    if (panel) panel.classList.toggle('open');
}
if(typeof window.toggleAiPanel!=="function"||__OVER.indexOf("toggleAiPanel")>=0)window.toggleAiPanel=toggleAiPanel;
function quickAsk(q) {
    var inp = document.getElementById('aiInput');
    if (inp) {
        inp.value = q;
        sendAiMessage();
    }
}
if(typeof window.quickAsk!=="function"||__OVER.indexOf("quickAsk")>=0)window.quickAsk=quickAsk;
async function sendAiMessage() {
    try {
        var result = await Parse.Cloud.run('useQuery', {});
        if (result && result.remaining !== undefined && result.remaining <= 0) {
            showNotification('⚠️ Günlük sorgu hakkınız doldu!', 'error');
            return;
        }
    } catch (e) {
        if (e.message && e.message.includes('limit')) {
            showNotification('⚠️ ' + e.message, 'error');
            return;
        }
    }

    var inp = document.getElementById('aiInput');
    var msg = inp.value.trim();
    if (!msg) return;
    var msgs = document.getElementById('aiMessages');
    msgs.innerHTML += '<div class="ai-msg user"><div class="role">👤 Sen</div>' + msg.replace(/</g, '&lt;') + '</div>';
    inp.value = '';
    msgs.scrollTop = msgs.scrollHeight;

    var response;
    if (msg.indexOf('dolar') !== -1 || msg.indexOf('haber') !== -1) {
        response = await webSearch(msg);
    } else {
        response = await callAllAIModels(msg);
    }
    var cleaned = cleanClientResponse(response);
    msgs.innerHTML += '<div class="ai-msg bot"><div class="role">🧠 AETHRION AI</div>' + cleaned + '</div>';
    msgs.scrollTop = msgs.scrollHeight;
}
if(typeof window.sendAiMessage!=="function"||__OVER.indexOf("sendAiMessage")>=0)window.sendAiMessage=sendAiMessage;
try{ if(typeof window.generateImage!=="function"||__OVER.indexOf("generateImage")>=0) window.generateImage=async function () {
    var promptEl = document.getElementById('imagePrompt');
    if (!promptEl) return;
    var prompt = promptEl.value.trim();
    if (!prompt) return showNotification('Lütfen bir açıklama yazın!', 'error');

    showNotification('⏳ Görsel üretiliyor (Hugging Face)...', 'success');
    try {
        var result = await Parse.Cloud.run('generateImageWithHF', { prompt: prompt });
        if (result.success) {
            var img = document.createElement('img');
            img.src = 'data:image/png;base64,' + result.imageBase64;
            img.style.width = '200px';
            img.style.height = '200px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            img.style.border = '1px solid var(--border2)';
            var resultsEl = document.getElementById('imageResults');
            if (resultsEl) resultsEl.appendChild(img);
            showNotification('✅ Görsel Hugging Face ile oluşturuldu!', 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('Görsel oluşturuldu');
            }
            var dlBtn = document.getElementById('downloadImageBtn');
            if (dlBtn) dlBtn.style.display = 'inline-block';
        } else {
            showNotification('❌ Görsel üretilemedi: ' + (result.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (e) {
        console.error('Görsel üretme hatası:', e);
        showNotification('❌ Görsel üretilemedi: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Görsel üretme hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] generateImage",e);}
try{ if(typeof window.downloadCurrentImage!=="function"||__OVER.indexOf("downloadCurrentImage")>=0) window.downloadCurrentImage=function () {
    var images = document.querySelectorAll('#imageResults img');
    if (!images || images.length === 0) {
        return showNotification('İndirilecek görsel yok', 'warning');
    }
    var lastImg = images[images.length - 1];
    var url = lastImg.src;
    var fileName = 'aethrion-gorsel-' + Date.now() + '.png';
    try {
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('📥 Görsel indirildi', 'success');
    } catch (e) {
        window.open(url, '_blank');
        showNotification('ℹ️ Görsel yeni sekmede açıldı', 'success');
    }
};}catch(e){console.warn("[legacy] downloadCurrentImage",e);}
try{ if(typeof window.proTool!=="function"||__OVER.indexOf("proTool")>=0) window.proTool=function (tool) {
    window.selectedProTool = tool;
    document.querySelectorAll('.pro-tool-btn').forEach(function (btn) {
        if (btn.getAttribute('data-tool') === tool) {
            btn.style.borderColor = 'var(--accent)';
            btn.style.background = 'rgba(212,175,55,0.12)';
            btn.style.color = 'var(--accent)';
            btn.style.boxShadow = '0 0 20px rgba(212,175,55,0.35)';
        } else {
            btn.style.borderColor = '';
            btn.style.background = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
        }
    });
    var input = document.getElementById('proToolInput');
    if (input) {
        var placeholders = {
            kod: 'Örnek: Python\'da asal sayı bulan bir fonksiyon yaz',
            yazi: 'Örnek: Yapay zeka hakkında 300 kelimelik bir yazı yaz',
            ceviri: 'Örnek: "Merhaba dünya" -> İngilizce'
        };
        input.placeholder = placeholders[tool] || 'Ne yapmak istersin?';
        input.focus();
    }
};}catch(e){console.warn("[legacy] proTool",e);}
try{ if(typeof window.runProTool!=="function"||__OVER.indexOf("runProTool")>=0) window.runProTool=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    var input = document.getElementById('proToolInput');
    var resultEl = document.getElementById('proToolResult');
    if (!input || !resultEl) return;
    var text = input.value.trim();
    if (!text) return showNotification('Lütfen bir şey yazın', 'warning');
    resultEl.innerHTML = '<div style="color:var(--text3);font-size:12px;">⏳ İşleniyor...</div>';
    try {
        var tool = window.selectedProTool || 'kod';
        var r = await Parse.Cloud.run('proTools', { tool: tool, input: text });
        if (r && r.success && r.output) {
            resultEl.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;font-family:var(--font-code);color:var(--accent2);font-size:12px;line-height:1.65;margin:0;">' + window.escapeHtml(r.output) + '</pre>';
        } else {
            resultEl.innerHTML = '<div style="color:var(--danger);font-size:12px;">❌ ' + window.escapeHtml((r && r.error) || 'Sonuç alınamadı') + '</div>';
        }
    } catch (e) {
        console.error('runProTool hatası:', e);
        resultEl.innerHTML = '<div style="color:var(--danger);font-size:12px;">❌ Hata: ' + window.escapeHtml(e.message) + '</div>';
    }
};}catch(e){console.warn("[legacy] runProTool",e);}
var currentRole=null;
if(typeof window.currentRole==="undefined")window.currentRole=currentRole;
var statsInterval=null;
if(typeof window.statsInterval==="undefined")window.statsInterval=statsInterval;
var currentDmConversation=null;
if(typeof window.currentDmConversation==="undefined")window.currentDmConversation=currentDmConversation;
var currentLanguage=localStorage.getItem('aethrion_language') || localStorage.getItem('vizyon_language') || 'tr';
if(typeof window.currentLanguage==="undefined")window.currentLanguage=currentLanguage;
var wizardType=null;
if(typeof window.wizardType==="undefined")window.wizardType=wizardType;
var wizardData={};
if(typeof window.wizardData==="undefined")window.wizardData=wizardData;
var currentConversationId=window.currentConversationId || null;
if(typeof window.currentConversationId==="undefined")window.currentConversationId=currentConversationId;
var fullAIConversationId=window.fullAIConversationId || null;
if(typeof window.fullAIConversationId==="undefined")window.fullAIConversationId=fullAIConversationId;
var selectedProTool='kod';
if(typeof window.selectedProTool==="undefined")window.selectedProTool=selectedProTool;
var commentFilter=0;
if(typeof window.commentFilter==="undefined")window.commentFilter=commentFilter;
var isDashboardVisible=false;
if(typeof window.isDashboardVisible==="undefined")window.isDashboardVisible=isDashboardVisible;
var currentImageData=null;
if(typeof window.currentImageData==="undefined")window.currentImageData=currentImageData;
var schemaInitDone=false;
if(typeof window.schemaInitDone==="undefined")window.schemaInitDone=schemaInitDone;
try{ if(typeof window.apiKeysCache==="undefined") window.apiKeysCache=[];}catch(e){console.warn("[legacy] apiKeysCache",e);}
try{ if(typeof window.apiKeysUnlocked==="undefined") window.apiKeysUnlocked=false;}catch(e){console.warn("[legacy] apiKeysUnlocked",e);}
var wizardMode='create';
if(typeof window.wizardMode==="undefined")window.wizardMode=wizardMode;
var wizardEditProjectId=null;
if(typeof window.wizardEditProjectId==="undefined")window.wizardEditProjectId=wizardEditProjectId;
var wizardOriginalData=null;
if(typeof window.wizardOriginalData==="undefined")window.wizardOriginalData=wizardOriginalData;
try{ if(typeof window.currentContestData==="undefined") window.currentContestData=null;}catch(e){console.warn("[legacy] currentContestData",e);}
try{ if(typeof window.contestIsParticipant==="undefined") window.contestIsParticipant=false;}catch(e){console.warn("[legacy] contestIsParticipant",e);}
try{ if(typeof window.currentReviewingProject==="undefined") window.currentReviewingProject=null;}catch(e){console.warn("[legacy] currentReviewingProject",e);}
try{ if(typeof window.currentScoringProject==="undefined") window.currentScoringProject=null;}catch(e){console.warn("[legacy] currentScoringProject",e);}
try{ if(typeof window._a27SelectedDuration==="undefined") window._a27SelectedDuration='unlimited';}catch(e){console.warn("[legacy] _a27SelectedDuration",e);}
try{ if(typeof window._a27LastKey==="undefined") window._a27LastKey=null;}catch(e){console.warn("[legacy] _a27LastKey",e);}
try{ if(typeof window._v27SelectedDuration==="undefined") window._v27SelectedDuration=window._a27SelectedDuration;}catch(e){console.warn("[legacy] _v27SelectedDuration",e);}
try{ if(typeof window._v27LastKey==="undefined") window._v27LastKey=window._a27LastKey;}catch(e){console.warn("[legacy] _v27LastKey",e);}
try{ if(typeof window.jobMarketActive==="undefined") window.jobMarketActive=false;}catch(e){console.warn("[legacy] jobMarketActive",e);}
try{ if(typeof window.jobMarketCache==="undefined") window.jobMarketCache=[];}catch(e){console.warn("[legacy] jobMarketCache",e);}
try{ if(typeof window.currentJobDetail==="undefined") window.currentJobDetail=null;}catch(e){console.warn("[legacy] currentJobDetail",e);}
try{ if(typeof window.currentJobCreateImage==="undefined") window.currentJobCreateImage=null;}catch(e){console.warn("[legacy] currentJobCreateImage",e);}
try{ if(typeof window.modelsShowcaseActive==="undefined") window.modelsShowcaseActive=false;}catch(e){console.warn("[legacy] modelsShowcaseActive",e);}
try{ if(typeof window.currentCategoryPanel==="undefined") window.currentCategoryPanel=null;}catch(e){console.warn("[legacy] currentCategoryPanel",e);}
try{ if(typeof window.assistantActive==="undefined") window.assistantActive=false;}catch(e){console.warn("[legacy] assistantActive",e);}
try{ if(typeof window.assistantSummaryCache==="undefined") window.assistantSummaryCache=null;}catch(e){console.warn("[legacy] assistantSummaryCache",e);}
try{ if(typeof window.aethrionFeaturesPanelOpen==="undefined") window.aethrionFeaturesPanelOpen=false;}catch(e){console.warn("[legacy] aethrionFeaturesPanelOpen",e);}
try{ if(typeof window.PLAN_LIMITS==="undefined") window.PLAN_LIMITS={
    free: {
        label: '🆓 Ücretsiz',
        dailyQueries: 100,
        maxProjects: 3,
        a27ApiKeys: 2,
        v27ApiKeys: 2, // backward-compat
        kocPerWeek: 10,
        vizyonAlPerDay: 10,
        aethrionAlPerDay: 10,
        voiceChatMinutesPerDay: 5,
        fileAnalyzePerDay: 3,
        videoCreatePerMonth: 0,
        videoEditorPerMonth: 0,
        jobListings: 1,
        assistantPerDay: 5,
        logsAccess: false,
        takimKurma: false,
        aganModu: false,
        derinDusunme: false,
        yazilimciModu: false,
        ekranOkuma: false,
        sesliSohbet: true,
        dosyaAnaliz: true,
        a27ApiChat: true,
        v27ApiChat: true,
        nvidiaAccess: true,
        categoryAccess: ['assistant', 'education', 'gamification', 'creative', 'professional'],
        premiumCategories: []
    },
    pro: {
        label: '🌟 Pro',
        dailyQueries: 2000,
        maxProjects: 15,
        a27ApiKeys: 20,
        v27ApiKeys: 20,
        kocPerWeek: 50,
        vizyonAlPerDay: 500,
        aethrionAlPerDay: 500,
        voiceChatMinutesPerDay: 60,
        fileAnalyzePerDay: 50,
        videoCreatePerMonth: 10,
        videoEditorPerMonth: 30,
        jobListings: 10,
        assistantPerDay: 100,
        logsAccess: true,
        takimKurma: false,
        aganModu: true,
        derinDusunme: true,
        yazilimciModu: true,
        ekranOkuma: true,
        sesliSohbet: true,
        dosyaAnaliz: true,
        a27ApiChat: true,
        v27ApiChat: true,
        nvidiaAccess: true,
        categoryAccess: ['assistant', 'education', 'gamification', 'creative', 'professional', 'health', 'social', 'surprise', 'earn'],
        premiumCategories: ['creative', 'professional', 'earn']
    },
    team: {
        label: '👥 Takım',
        dailyQueries: -1,
        maxProjects: -1,
        a27ApiKeys: 100,
        v27ApiKeys: 100,
        kocPerWeek: 1000,
        vizyonAlPerDay: -1,
        aethrionAlPerDay: -1,
        voiceChatMinutesPerDay: -1,
        fileAnalyzePerDay: -1,
        videoCreatePerMonth: -1,
        videoEditorPerMonth: -1,
        jobListings: 100,
        assistantPerDay: -1,
        logsAccess: true,
        takimKurma: true,
        aganModu: true,
        derinDusunme: true,
        yazilimciModu: true,
        ekranOkuma: true,
        sesliSohbet: true,
        dosyaAnaliz: true,
        a27ApiChat: true,
        v27ApiChat: true,
        nvidiaAccess: true,
        categoryAccess: ['assistant', 'education', 'gamification', 'creative', 'professional', 'health', 'social', 'surprise', 'earn'],
        premiumCategories: ['creative', 'professional', 'earn']
    },
    admin: {
        label: '⚙️ Admin',
        dailyQueries: -1,
        maxProjects: -1,
        a27ApiKeys: -1,
        v27ApiKeys: -1,
        kocPerWeek: -1,
        vizyonAlPerDay: -1,
        aethrionAlPerDay: -1,
        voiceChatMinutesPerDay: -1,
        fileAnalyzePerDay: -1,
        videoCreatePerMonth: -1,
        videoEditorPerMonth: -1,
        jobListings: -1,
        assistantPerDay: -1,
        logsAccess: true,
        takimKurma: true,
        aganModu: true,
        derinDusunme: true,
        yazilimciModu: true,
        ekranOkuma: true,
        sesliSohbet: true,
        dosyaAnaliz: true,
        a27ApiChat: true,
        v27ApiChat: true,
        nvidiaAccess: true,
        categoryAccess: ['assistant', 'education', 'gamification', 'creative', 'professional', 'health', 'social', 'surprise', 'earn'],
        premiumCategories: ['creative', 'professional', 'earn']
    },
    founder: {
        label: '👑 Kurucu',
        dailyQueries: -1,
        maxProjects: -1,
        a27ApiKeys: -1,
        v27ApiKeys: -1,
        kocPerWeek: -1,
        vizyonAlPerDay: -1,
        aethrionAlPerDay: -1,
        voiceChatMinutesPerDay: -1,
        fileAnalyzePerDay: -1,
        videoCreatePerMonth: -1,
        videoEditorPerMonth: -1,
        jobListings: -1,
        assistantPerDay: -1,
        logsAccess: true,
        takimKurma: true,
        aganModu: true,
        derinDusunme: true,
        yazilimciModu: true,
        ekranOkuma: true,
        sesliSohbet: true,
        dosyaAnaliz: true,
        a27ApiChat: true,
        v27ApiChat: true,
        nvidiaAccess: true,
        categoryAccess: ['assistant', 'education', 'gamification', 'creative', 'professional', 'health', 'social', 'surprise', 'earn'],
        premiumCategories: ['creative', 'professional', 'earn']
    },
    beta: {
        label: '🔬 Beta',
        dailyQueries: -1,
        maxProjects: -1,
        a27ApiKeys: -1,
        v27ApiKeys: -1,
        kocPerWeek: -1,
        vizyonAlPerDay: -1,
        aethrionAlPerDay: -1,
        voiceChatMinutesPerDay: -1,
        fileAnalyzePerDay: -1,
        videoCreatePerMonth: -1,
        videoEditorPerMonth: -1,
        jobListings: -1,
        assistantPerDay: -1,
        logsAccess: true,
        takimKurma: true,
        aganModu: true,
        derinDusunme: true,
        yazilimciModu: true,
        ekranOkuma: true,
        sesliSohbet: true,
        dosyaAnaliz: true,
        a27ApiChat: true,
        v27ApiChat: true,
        nvidiaAccess: true,
        categoryAccess: ['assistant', 'education', 'gamification', 'creative', 'professional', 'health', 'social', 'surprise', 'earn'],
        premiumCategories: ['creative', 'professional', 'earn']
    },
    moderator: {
        label: '🎨 Moderatör',
        dailyQueries: -1,
        maxProjects: -1,
        a27ApiKeys: -1,
        v27ApiKeys: -1,
        kocPerWeek: -1,
        vizyonAlPerDay: -1,
        aethrionAlPerDay: -1,
        voiceChatMinutesPerDay: -1,
        fileAnalyzePerDay: -1,
        videoCreatePerMonth: -1,
        videoEditorPerMonth: -1,
        jobListings: -1,
        assistantPerDay: -1,
        logsAccess: true,
        takimKurma: true,
        aganModu: true,
        derinDusunme: true,
        yazilimciModu: true,
        ekranOkuma: true,
        sesliSohbet: true,
        dosyaAnaliz: true,
        a27ApiChat: true,
        v27ApiChat: true,
        nvidiaAccess: true,
        categoryAccess: ['assistant', 'education', 'gamification', 'creative', 'professional', 'health', 'social', 'surprise', 'earn'],
        premiumCategories: ['creative', 'professional', 'earn']
    }
};}catch(e){console.warn("[legacy] PLAN_LIMITS",e);}
try{ if(typeof window.MODERATOR_ROLE==="undefined") window.MODERATOR_ROLE='moderator';}catch(e){console.warn("[legacy] MODERATOR_ROLE",e);}
try{ if(typeof window.MODERATOR_LABEL==="undefined") window.MODERATOR_LABEL='🎨 MODERATÖR / TASARIMCI';}catch(e){console.warn("[legacy] MODERATOR_LABEL",e);}
try{ if(typeof window.SUPER_ROLES==="undefined") window.SUPER_ROLES=['founder', 'admin', 'beta', 'moderator'];}catch(e){console.warn("[legacy] SUPER_ROLES",e);}
try{ if(typeof window.isModerator!=="function"||__OVER.indexOf("isModerator")>=0) window.isModerator=function () {
    return currentUser && currentUser.get('role') === 'moderator';
};}catch(e){console.warn("[legacy] isModerator",e);}
try{ if(typeof window.hasSuperRole!=="function"||__OVER.indexOf("hasSuperRole")>=0) window.hasSuperRole=function () {
    if (!currentUser) return false;
    var r = currentUser.get('role');
    return window.SUPER_ROLES.indexOf(r) !== -1;
};}catch(e){console.warn("[legacy] hasSuperRole",e);}
try{ if(typeof window.getPlanLimits!=="function"||__OVER.indexOf("getPlanLimits")>=0) window.getPlanLimits=function (user) {
    if (!user) user = currentUser;
    if (!user) return window.PLAN_LIMITS.free;
    var role = user.get('role') || 'user';
    var plan = user.get('plan') || 'free';
    if (role === 'founder') return window.PLAN_LIMITS.founder;
    if (role === 'admin') return window.PLAN_LIMITS.admin;
    if (role === 'beta') return window.PLAN_LIMITS.beta;
    if (role === 'moderator') return window.PLAN_LIMITS.moderator;
    if (plan === 'team') return window.PLAN_LIMITS.team;
    if (plan === 'pro') return window.PLAN_LIMITS.pro;
    return window.PLAN_LIMITS.free;
};}catch(e){console.warn("[legacy] getPlanLimits",e);}
try{ if(typeof window.isSuperUser!=="function"||__OVER.indexOf("isSuperUser")>=0) window.isSuperUser=function (user) {
    if (!user) user = currentUser;
    if (!user) return false;
    var role = user.get('role') || 'user';
    return window.SUPER_ROLES.indexOf(role) !== -1;
};}catch(e){console.warn("[legacy] isSuperUser",e);}
function getTodayKey() {
    var d = new Date();
    return 'aethrion_usage_v1_' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
if(typeof window.getTodayKey!=="function"||__OVER.indexOf("getTodayKey")>=0)window.getTodayKey=getTodayKey;
function getMonthKey() {
    var d = new Date();
    return 'aethrion_usage_v1_m_' + d.getFullYear() + '-' + (d.getMonth() + 1);
}
if(typeof window.getMonthKey!=="function"||__OVER.indexOf("getMonthKey")>=0)window.getMonthKey=getMonthKey;
function getWeekKey() {
    var d = new Date();
    var day = d.getDay();
    var diff = (day === 0 ? 6 : day - 1);
    var monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    return 'aethrion_usage_v1_w_' + monday.toISOString().split('T')[0];
}
if(typeof window.getWeekKey!=="function"||__OVER.indexOf("getWeekKey")>=0)window.getWeekKey=getWeekKey;
function getUsageData(feature, period) {
    var key;
    if (period === 'month') key = getMonthKey() + '_' + feature;
    else if (period === 'week') key = getWeekKey() + '_' + feature;
    else if (period === 'lifetime') key = 'aethrion_usage_v1_lifetime_' + feature;
    else key = getTodayKey() + '_' + feature;
    try {
        var raw = localStorage.getItem(key);
        if (!raw) {
            // Backward-compat: eski v8 anahtarlarından migrate
            var legacyKey = key.replace('aethrion_usage_v1', 'usage_v8').replace('usage_v8_m_', 'usage_v8_m_');
            if (legacyKey !== key) {
                var legacyRaw = localStorage.getItem(legacyKey);
                if (legacyRaw) {
                    localStorage.setItem(key, legacyRaw);
                    return JSON.parse(legacyRaw).count || 0;
                }
            }
            return 0;
        }
        var data = JSON.parse(raw);
        return data.count || 0;
    } catch (e) { return 0; }
}
if(typeof window.getUsageData!=="function"||__OVER.indexOf("getUsageData")>=0)window.getUsageData=getUsageData;
function setUsageData(feature, period, count) {
    var key;
    if (period === 'month') key = getMonthKey() + '_' + feature;
    else if (period === 'week') key = getWeekKey() + '_' + feature;
    else if (period === 'lifetime') key = 'aethrion_usage_v1_lifetime_' + feature;
    else key = getTodayKey() + '_' + feature;
    try {
        localStorage.setItem(key, JSON.stringify({ count: count, updatedAt: Date.now() }));
    } catch (e) {
        console.warn('LocalStorage yazılamadı:', e);
    }
}
if(typeof window.setUsageData!=="function"||__OVER.indexOf("setUsageData")>=0)window.setUsageData=setUsageData;
try{ if(typeof window._usageQueue==="undefined") window._usageQueue={};}catch(e){console.warn("[legacy] _usageQueue",e);}
try{ if(typeof window._usageQueueTimer==="undefined") window._usageQueueTimer=null;}catch(e){console.warn("[legacy] _usageQueueTimer",e);}
try{ if(typeof window.incrementUsage!=="function"||__OVER.indexOf("incrementUsage")>=0) window.incrementUsage=function (feature, period, amount) {
    amount = amount || 1;
    var queueKey = feature + '_' + period;
    if (!window._usageQueue[queueKey]) {
        window._usageQueue[queueKey] = { feature: feature, period: period, total: 0 };
    }
    window._usageQueue[queueKey].total += amount;
    if (!window._usageQueueTimer) {
        window._usageQueueTimer = setTimeout(function () {
            window._flushUsageQueue();
        }, 800);
    }
    var current = getUsageData(feature, period);
    return current + amount;
};}catch(e){console.warn("[legacy] incrementUsage",e);}
try{ if(typeof window._flushUsageQueue!=="function"||__OVER.indexOf("_flushUsageQueue")>=0) window._flushUsageQueue=function () {
    var queue = window._usageQueue;
    window._usageQueue = {};
    window._usageQueueTimer = null;
    Object.keys(queue).forEach(function (key) {
        var item = queue[key];
        var current = getUsageData(item.feature, item.period);
        var newCount = current + item.total;
        setUsageData(item.feature, item.period, newCount);
        if (currentUser && parseInitialized) {
            try {
                Parse.Cloud.run('trackFeatureUsage', {
                    feature: item.feature,
                    period: item.period,
                    count: item.total
                }).catch(function () {});
            } catch (e) {}
        }
    });
};}catch(e){console.warn("[legacy] _flushUsageQueue",e);}
try{ if(typeof window.checkFeatureLimit!=="function"||__OVER.indexOf("checkFeatureLimit")>=0) window.checkFeatureLimit=function (feature, period) {
    if (!currentUser) {
        return { allowed: false, reason: 'Giriş yapmalısınız', limit: 0, used: 0 };
    }
    var limits = window.getPlanLimits(currentUser);
    var limit = limits[feature];
    // Backward-compat: v27ApiKeys yoksa a27ApiKeys'e bak
    if (limit === undefined && feature === 'v27ApiKeys') limit = limits.a27ApiKeys;
    if (limit === undefined && feature === 'vizyonAlPerDay') limit = limits.aethrionAlPerDay;
    var used = getUsageData(feature, period);

    if (limit === -1 || limit === Infinity) {
        return { allowed: true, limit: -1, used: used, remaining: -1 };
    }
    if (limit === 0) {
        return { allowed: false, reason: 'Bu özellik paketinizde yok', limit: 0, used: used, remaining: 0, requiresUpgrade: true };
    }
    if (limit === true) return { allowed: true, limit: true, used: used };
    if (limit === false) {
        return { allowed: false, reason: 'Bu özellik paketinizde yok', limit: 0, used: used, remaining: 0, requiresUpgrade: true };
    }
    if (used >= limit) {
        return { allowed: false, reason: 'Günlük/aylık limitinize ulaştınız', limit: limit, used: used, remaining: 0, requiresUpgrade: true };
    }
    return { allowed: true, limit: limit, used: used, remaining: limit - used };
};}catch(e){console.warn("[legacy] checkFeatureLimit",e);}
try{ if(typeof window.checkFeatureLimitWithBackend!=="function"||__OVER.indexOf("checkFeatureLimitWithBackend")>=0) window.checkFeatureLimitWithBackend=async function (feature, period) {
    var clientCheck = window.checkFeatureLimit(feature, period);
    if (!clientCheck.allowed) return clientCheck;
    if (currentUser && parseInitialized) {
        try {
            var result = await Parse.Cloud.run('getFeatureUsage', { feature: feature, period: period });
            if (result && result.success) {
                var limits = window.getPlanLimits(currentUser);
                var limit = limits[feature];
                if (limit !== -1 && limit !== Infinity && result.count >= limit) {
                    setUsageData(feature, period, result.count);
                    return { allowed: false, reason: 'Günlük/aylık limitinize ulaştınız', limit: limit, used: result.count, remaining: 0, requiresUpgrade: true };
                }
            }
        } catch (e) {}
    }
    return clientCheck;
};}catch(e){console.warn("[legacy] checkFeatureLimitWithBackend",e);}
try{ if(typeof window.showLimitModal!=="function"||__OVER.indexOf("showLimitModal")>=0) window.showLimitModal=function (feature, checkResult) {
    var featureNames = {
        'vizyonAlPerDay': '✨ Aethrion Al Kullanımı',
        'aethrionAlPerDay': '✨ Aethrion Al Kullanımı',
        'voiceChatMinutesPerDay': '🔊 Sesli Sohbet',
        'fileAnalyzePerDay': '📎 Dosya Analizi',
        'videoCreatePerMonth': '🎬 Video Oluşturma',
        'videoEditorPerMonth': '🎞️ Video Editor',
        'jobListings': '💼 İş İlanı',
        'assistantPerDay': '🤖 AI Asistan',
        'logsAccess': '📋 Logs Sistemi',
        'v27ApiKeys': '🔑 A27 API Anahtarı',
        'a27ApiKeys': '🔑 A27 API Anahtarı',
        'kocPerWeek': '🧭 Aethrion Coach',
        'dailyQueries': '⚡ AI Sorgusu',
        'maxProjects': '📁 Proje',
        'takimKurma': '👥 Takım Kurma',
        'aganModu': '🕵️ Ajan Modu',
        'derinDusunme': '🧠 Derin Düşünme',
        'yazilimciModu': '💻 Yazılımcı Modu',
        'ekranOkuma': '👁️ Ekran Okuma'
    };
    var name = featureNames[feature] || feature;

    var existing = document.getElementById('limitUpgradeModal');
    if (existing) existing.remove();

    var userPlan = currentUser ? (currentUser.get('plan') || 'free') : 'free';

    var featureCompare = {
        'vizyonAlPerDay': { free: '10/gün', pro: '500/gün', team: '♾️' },
        'aethrionAlPerDay': { free: '10/gün', pro: '500/gün', team: '♾️' },
        'voiceChatMinutesPerDay': { free: '5 dk/gün', pro: '60 dk/gün', team: '♾️' },
        'fileAnalyzePerDay': { free: '3/gün', pro: '50/gün', team: '♾️' },
        'videoCreatePerMonth': { free: '❌ Yok', pro: '10/ay', team: '♾️' },
        'videoEditorPerMonth': { free: '❌ Yok', pro: '30/ay', team: '♾️' },
        'jobListings': { free: '1 ilan', pro: '10 ilan', team: '100 ilan' },
        'assistantPerDay': { free: '5/gün', pro: '100/gün', team: '♾️' },
        'logsAccess': { free: '❌ Yok', pro: '✅ Var', team: '✅ Var' },
        'v27ApiKeys': { free: '2 adet', pro: '20 adet', team: '100 adet' },
        'a27ApiKeys': { free: '2 adet', pro: '20 adet', team: '100 adet' },
        'kocPerWeek': { free: '10/hafta', pro: '50/hafta', team: '1000/hafta' },
        'dailyQueries': { free: '100/gün', pro: '2000/gün', team: '♾️' },
        'maxProjects': { free: '3/ay', pro: '15/ay', team: '♾️' },
        'takimKurma': { free: '❌ Yok', pro: '❌ Yok', team: '✅ Var' },
        'aganModu': { free: '❌ Yok', pro: '✅ Var', team: '✅ Var' },
        'derinDusunme': { free: '❌ Yok', pro: '✅ Var', team: '✅ Var' },
        'yazilimciModu': { free: '❌ Yok', pro: '✅ Var', team: '✅ Var' },
        'ekranOkuma': { free: '❌ Yok', pro: '✅ Var', team: '✅ Var' }
    };
    var compare = featureCompare[feature] || { free: '-', pro: '-', team: '-' };

    var modal = document.createElement('div');
    modal.id = 'limitUpgradeModal';
    modal.className = 'modal-overlay open';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999999';
    modal.innerHTML = `
        <div class="modal" style="max-width:580px; text-align:center;">
            <div class="modal-header" style="justify-content:center; border-bottom:none;">
                <div style="font-size:68px; margin-bottom:10px; filter: drop-shadow(0 0 30px rgba(212,175,55,0.6));">🚀</div>
            </div>
            <h3 style="color:var(--gold); font-size:22px; margin-bottom:12px; text-align:center; text-shadow: 0 0 20px rgba(212,175,55,0.5);">Paket Yükseltme Gerekli</h3>
            <p style="color:var(--text2); font-size:14px; line-height:1.75; margin-bottom:22px;">
                <strong style="color:var(--accent);">${name}</strong> için paket limitiniz doldu veya bu özellik paketinizde yok.
            </p>
            <div style="background:linear-gradient(135deg, rgba(212,175,55,0.08), rgba(124,92,255,0.05)); border:1px solid rgba(212,175,55,0.3); border-radius:14px; padding:16px 20px; margin-bottom:22px; text-align:left; font-size:13px; line-height:1.8; color:var(--text2);">
                <div><strong>📊 Mevcut Kullanım:</strong> ${checkResult.used || 0} / ${checkResult.limit === -1 ? '∞' : checkResult.limit}</div>
                <div style="margin-top:6px;"><strong>💡 Sebep:</strong> ${checkResult.reason || 'Limit doldu'}</div>
                <div style="margin-top:6px;"><strong>👤 Planınız:</strong> ${userPlan.toUpperCase()}</div>
            </div>
            <div style="margin-bottom:22px;">
                <div style="font-size:13px; color:var(--text3); margin-bottom:12px; font-weight:600;">Bu özelliğin planlara göre karşılaştırması:</div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; text-align:center; font-size:11.5px;">
                    <div style="background:rgba(0,0,0,0.35); padding:14px 8px; border-radius:12px; border-left:3px solid var(--text3); ${userPlan === 'free' ? 'outline:2px solid var(--accent);' : ''}">
                        <div style="font-size:22px; margin-bottom:5px;">🆓</div>
                        <div style="font-weight:700; color:var(--text3); margin-bottom:6px;">Ücretsiz</div>
                        <div style="color:var(--text2); font-weight:600;">${compare.free}</div>
                    </div>
                    <div style="background:linear-gradient(135deg, rgba(212,175,55,0.12), rgba(124,92,255,0.08)); padding:14px 8px; border-radius:12px; border-left:3px solid var(--gold); ${userPlan === 'pro' ? 'outline:2px solid var(--accent);' : ''}">
                        <div style="font-size:22px; margin-bottom:5px;">🌟</div>
                        <div style="font-weight:700; color:var(--gold); margin-bottom:6px;">Pro</div>
                        <div style="color:var(--text2); font-weight:600;">${compare.pro}</div>
                        <div style="color:var(--text3); font-size:10px; margin-top:4px;">₺299/ay</div>
                    </div>
                    <div style="background:linear-gradient(135deg, rgba(124,92,255,0.12), rgba(212,175,55,0.08)); padding:14px 8px; border-radius:12px; border-left:3px solid var(--purple); ${userPlan === 'team' ? 'outline:2px solid var(--accent);' : ''}">
                        <div style="font-size:22px; margin-bottom:5px;">👥</div>
                        <div style="font-weight:700; color:var(--purple); margin-bottom:6px;">Takım</div>
                        <div style="color:var(--text2); font-weight:600;">${compare.team}</div>
                        <div style="color:var(--text3); font-size:10px; margin-top:4px;">₺899/ay</div>
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:10px;">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="flex:1; padding:13px;">Kapat</button>
                <button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); document.getElementById('pricing').scrollIntoView({behavior:'smooth'});" style="flex:2; padding:13px;">🚀 Paketleri Gör</button>
            </div>
            <div style="margin-top:16px; font-size:11px; color:var(--text3); line-height:1.6;">
                💡 Kurucu, Admin, Beta ve Moderatör hesapları için tüm limitler <strong style="color:var(--gold);">sınırsızdır</strong>. 28 model erişimi dahil. <em style="color:var(--accent2);">AETHRION — Intelligence Without Limits.</em>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (typeof window.addLogWarning === 'function') {
        window.addLogWarning(name + ' limit doldu veya erişim yok', { feature: feature, used: checkResult.used, limit: checkResult.limit, plan: userPlan });
    }
};}catch(e){console.warn("[legacy] showLimitModal",e);}
try{ if(typeof window.requireFeatureAccess!=="function"||__OVER.indexOf("requireFeatureAccess")>=0) window.requireFeatureAccess=function (feature, period) {
    var result = window.checkFeatureLimit(feature, period);
    if (!result.allowed) {
        window.showLimitModal(feature, result);
        return false;
    }
    return true;
};}catch(e){console.warn("[legacy] requireFeatureAccess",e);}
try{ if(typeof window.getLimitText!=="function"||__OVER.indexOf("getLimitText")>=0) window.getLimitText=function (feature, period) {
    var limits = window.getPlanLimits(currentUser);
    var limit = limits[feature];
    if (limit === -1 || limit === Infinity) return '♾️ Sınırsız';
    var used = getUsageData(feature, period);
    var remaining = Math.max(0, limit - used);
    return remaining + ' / ' + limit;
};}catch(e){console.warn("[legacy] getLimitText",e);}
try{ if(typeof window.canCreateProject!=="function"||__OVER.indexOf("canCreateProject")>=0) window.canCreateProject=async function () {
    if (!currentUser) return { allowed: false, reason: 'Giriş yapmalısınız' };
    var limits = window.getPlanLimits(currentUser);
    var maxProjects = limits.maxProjects;
    if (maxProjects === -1) return { allowed: true, limit: -1 };
    try {
        var result = await Parse.Cloud.run('getUserProjectCount', {});
        var currentCount = (result && result.count) ? result.count : 0;
        if (currentCount >= maxProjects) {
            return { allowed: false, limit: maxProjects, used: currentCount, remaining: 0, reason: 'Proje limitinize ulaştınız' };
        }
        return { allowed: true, limit: maxProjects, used: currentCount, remaining: maxProjects - currentCount };
    } catch (e) {
        return { allowed: true, limit: maxProjects, used: 0 };
    }
};}catch(e){console.warn("[legacy] canCreateProject",e);}
try{ if(typeof window.canCreateTeam!=="function"||__OVER.indexOf("canCreateTeam")>=0) window.canCreateTeam=function () {
    var limits = window.getPlanLimits(currentUser);
    if (!limits.takimKurma) {
        return { allowed: false, reason: 'Takım kurmak için Takım paketi gerekli' };
    }
    return { allowed: true };
};}catch(e){console.warn("[legacy] canCreateTeam",e);}
try{ if(typeof window.canUseAgentMode!=="function"||__OVER.indexOf("canUseAgentMode")>=0) window.canUseAgentMode=function () {
    var limits = window.getPlanLimits(currentUser);
    if (!limits.aganModu) return { allowed: false, reason: 'Ajan modu Pro ve üzeri paketlerde mevcut' };
    return { allowed: true };
};}catch(e){console.warn("[legacy] canUseAgentMode",e);}
try{ if(typeof window.canUseDeepThink!=="function"||__OVER.indexOf("canUseDeepThink")>=0) window.canUseDeepThink=function () {
    var limits = window.getPlanLimits(currentUser);
    if (!limits.derinDusunme) return { allowed: false, reason: 'Derin düşünme modu Pro ve üzeri paketlerde mevcut' };
    return { allowed: true };
};}catch(e){console.warn("[legacy] canUseDeepThink",e);}
try{ if(typeof window.canUseDeveloperMode!=="function"||__OVER.indexOf("canUseDeveloperMode")>=0) window.canUseDeveloperMode=function () {
    var limits = window.getPlanLimits(currentUser);
    if (!limits.yazilimciModu) return { allowed: false, reason: 'Yazılımcı modu Pro ve üzeri paketlerde mevcut' };
    return { allowed: true };
};}catch(e){console.warn("[legacy] canUseDeveloperMode",e);}
try{ if(typeof window.canUseScreenRead!=="function"||__OVER.indexOf("canUseScreenRead")>=0) window.canUseScreenRead=function () {
    var limits = window.getPlanLimits(currentUser);
    if (!limits.ekranOkuma) return { allowed: false, reason: 'Ekran okuma Pro ve üzeri paketlerde mevcut' };
    return { allowed: true };
};}catch(e){console.warn("[legacy] canUseScreenRead",e);}
try{ if(typeof window.canCreateJobListing!=="function"||__OVER.indexOf("canCreateJobListing")>=0) window.canCreateJobListing=function () {
    if (!currentUser) return { allowed: false, reason: 'Giriş yapmalısınız' };
    var limits = window.getPlanLimits(currentUser);
    var limit = limits.jobListings;
    if (limit === -1) return { allowed: true, limit: -1 };
    var used = getUsageData('jobListings', 'lifetime');
    if (used >= limit) {
        return { allowed: false, limit: limit, used: used, remaining: 0, reason: 'İş ilanı limitinize ulaştınız' };
    }
    return { allowed: true, limit: limit, used: used, remaining: limit - used };
};}catch(e){console.warn("[legacy] canCreateJobListing",e);}
try{ if(typeof window.canAccessCategory!=="function"||__OVER.indexOf("canAccessCategory")>=0) window.canAccessCategory=function (categoryId) {
    if (!currentUser) return { allowed: false, reason: 'Giriş yapmalısınız' };
    var limits = window.getPlanLimits(currentUser);
    var allowed = limits.categoryAccess || [];
    if (allowed.indexOf(categoryId) === -1) {
        return { allowed: false, reason: 'Bu kategori paketinizde yok', categoryId: categoryId, requiresUpgrade: true };
    }
    return { allowed: true };
};}catch(e){console.warn("[legacy] canAccessCategory",e);}
try{ if(typeof window.logsCache==="undefined") window.logsCache=window.logsCache || [];}catch(e){console.warn("[legacy] logsCache",e);}
try{ if(typeof window.currentLogFilter==="undefined") window.currentLogFilter=window.currentLogFilter || 'all';}catch(e){console.warn("[legacy] currentLogFilter",e);}
try{ if(typeof window.MAX_LOGS_CACHE==="undefined") window.MAX_LOGS_CACHE=500;}catch(e){console.warn("[legacy] MAX_LOGS_CACHE",e);}
try{ if(typeof window.addLog!=="function"||__OVER.indexOf("addLog")>=0) window.addLog=function (level, message, meta) {
    level = level || 'info';
    var entry = {
        id: 'aethrion_log_v1_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        level: level,
        message: String(message || ''),
        meta: meta || null,
        time: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100),
        version: 'v1.0.0'
    };
    window.logsCache.push(entry);
    if (window.logsCache.length > window.MAX_LOGS_CACHE) window.logsCache.shift();
    try { localStorage.setItem('aethrion_logs_v1', JSON.stringify(window.logsCache.slice(-100))); } catch (e) {}
    var consoleMethod = 'log';
    if (level === 'error' || level === 'critical') consoleMethod = 'error';
    else if (level === 'warning') consoleMethod = 'warn';
    try { console[consoleMethod]('[AETHRION-' + level.toUpperCase() + ']', message, meta || ''); } catch (e) {}
    if (parseInitialized && currentUser && ['error', 'critical'].indexOf(level) !== -1) {
        try { Parse.Cloud.run('logError', { level: level, message: message, meta: meta, url: window.location.href, userAgent: navigator.userAgent.substring(0, 200) }).catch(function () {}); } catch (e) {}
    }
    return entry;
};}catch(e){console.warn("[legacy] addLog",e);}
try{ if(typeof window.addLogInfo!=="function"||__OVER.indexOf("addLogInfo")>=0) window.addLogInfo=function (msg, meta) { return window.addLog('info', msg, meta); };}catch(e){console.warn("[legacy] addLogInfo",e);}
try{ if(typeof window.addLogSuccess!=="function"||__OVER.indexOf("addLogSuccess")>=0) window.addLogSuccess=function (msg, meta) { return window.addLog('success', msg, meta); };}catch(e){console.warn("[legacy] addLogSuccess",e);}
try{ if(typeof window.addLogWarning!=="function"||__OVER.indexOf("addLogWarning")>=0) window.addLogWarning=function (msg, meta) { return window.addLog('warning', msg, meta); };}catch(e){console.warn("[legacy] addLogWarning",e);}
try{ if(typeof window.addLogError!=="function"||__OVER.indexOf("addLogError")>=0) window.addLogError=function (msg, meta) { return window.addLog('error', msg, meta); };}catch(e){console.warn("[legacy] addLogError",e);}
try{ if(typeof window.addLogCritical!=="function"||__OVER.indexOf("addLogCritical")>=0) window.addLogCritical=function (msg, meta) { return window.addLog('critical', msg, meta); };}catch(e){console.warn("[legacy] addLogCritical",e);}
try{ if(typeof window.openLogsPanel!=="function"||__OVER.indexOf("openLogsPanel")>=0) window.openLogsPanel=function () {
    if (!currentUser) { showNotification('Önce giriş yapın!', 'error'); return; }
    var limits = window.getPlanLimits(currentUser);
    if (!limits.logsAccess) {
        window.showLimitModal('logsAccess', { allowed: false, reason: 'Logs sistemi sadece Pro ve üzeri paketlerde mevcut', limit: 0, used: 0, requiresUpgrade: true });
        return;
    }
    var modal = document.getElementById('logsModal');
    if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; window.renderLogs(); window.addLogInfo('Logs paneli açıldı'); }
    else {
        if (typeof window.openAethrionLogsFallback === 'function') window.openAethrionLogsFallback();
        else showNotification('Logs paneli yükleniyor...', 'warning');
    }
};}catch(e){console.warn("[legacy] openLogsPanel",e);}
try{ if(typeof window.closeLogsPanel!=="function"||__OVER.indexOf("closeLogsPanel")>=0) window.closeLogsPanel=function () {
    var modal = document.getElementById('logsModal');
    if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
};}catch(e){console.warn("[legacy] closeLogsPanel",e);}
try{ if(typeof window.renderLogs!=="function"||__OVER.indexOf("renderLogs")>=0) window.renderLogs=function () {
    var container = document.getElementById('logsPanelBody');
    if (!container) return;
    try {
        var stored = localStorage.getItem('aethrion_logs_v1') || localStorage.getItem('v27_logs_v8');
        if (stored) window.logsCache = JSON.parse(stored);
    } catch (e) {}
    var filter = window.currentLogFilter || 'all';
    var logs = window.logsCache.slice().reverse();
    if (filter !== 'all') logs = logs.filter(function (l) { return l.level === filter; });
    if (logs.length === 0) { container.innerHTML = '<div class="logs-empty">📭 Bu filtrede log kaydı yok.</div>'; return; }
    var html = '';
    logs.forEach(function (log) {
        var timeStr = '';
        try { timeStr = new Date(log.time).toLocaleString('tr-TR'); } catch (e) { timeStr = log.time; }
        html += '<div class="logs-entry log-' + log.level + '">';
        html += '<span class="logs-entry-time">' + window.escapeHtml(timeStr) + '</span>';
        html += '<span>' + window.escapeHtml(log.message) + '</span>';
        html += '</div>';
    });
    container.innerHTML = html;
};}catch(e){console.warn("[legacy] renderLogs",e);}
try{ if(typeof window.filterLogs!=="function"||__OVER.indexOf("filterLogs")>=0) window.filterLogs=function (filter) {
    window.currentLogFilter = filter;
    document.querySelectorAll('.logs-filter-btn').forEach(function (btn) {
        if (btn.getAttribute('data-filter') === filter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    window.renderLogs();
};}catch(e){console.warn("[legacy] filterLogs",e);}
try{ if(typeof window.refreshLogs!=="function"||__OVER.indexOf("refreshLogs")>=0) window.refreshLogs=function () { window.renderLogs(); showNotification('🔄 Loglar yenilendi', 'success'); };}catch(e){console.warn("[legacy] refreshLogs",e);}
try{ if(typeof window.clearLogs!=="function"||__OVER.indexOf("clearLogs")>=0) window.clearLogs=function () {
    if (!confirm('Tüm log kayıtları temizlenecek. Emin misiniz?')) return;
    window.logsCache = [];
    try { localStorage.removeItem('aethrion_logs_v1'); localStorage.removeItem('v27_logs_v8'); } catch (e) {}
    window.renderLogs();
    showNotification('🗑️ Loglar temizlendi', 'success');
};}catch(e){console.warn("[legacy] clearLogs",e);}
try{ if(typeof window.downloadLogs!=="function"||__OVER.indexOf("downloadLogs")>=0) window.downloadLogs=function () {
    if (window.logsCache.length === 0) { showNotification('İndirilecek log yok.', 'warning'); return; }
    var text = 'AETHRION v1.0.0 — SİSTEM LOGLARI\n' +
        'Intelligence Without Limits.\n' +
        '='.repeat(60) + '\n\n';
    text += 'Toplam: ' + window.logsCache.length + ' kayıt\n';
    text += 'Tarih: ' + new Date().toLocaleString('tr-TR') + '\n\n' + '='.repeat(60) + '\n\n';
    window.logsCache.forEach(function (log) {
        text += '[' + log.time + '] [' + log.level.toUpperCase() + '] ' + log.message + '\n';
        if (log.meta) text += '   Meta: ' + JSON.stringify(log.meta) + '\n';
        text += '---\n';
    });
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'aethrion-v1-logs-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('📥 Loglar indirildi', 'success');
};}catch(e){console.warn("[legacy] downloadLogs",e);}
try{ if(typeof window.FEATURE_LIST==="undefined") window.FEATURE_LIST=[
    { group: 'CORE', icon: '⚡', name: 'Aethrion AI', desc: '28 model birleşik gücü', action: 'openFullAIPanel', color: 'accent' },
    { group: 'CORE', icon: '✨', name: 'Aethrion Al', desc: '4 modlu AI panel', action: 'openAethrionAlPanel', color: 'purple' },
    { group: 'CORE', icon: '🧭', name: 'Aethrion Coach', desc: 'Samimi AI koç', action: 'openKocPanel', color: 'gold' },
    { group: 'CORE', icon: '🟢', name: '28 Model Showcase', desc: '13 Ollama + 7 NIM + 8 API', action: 'openModelsShowcase', color: 'nvidia' },
    { group: 'CORE', icon: '🤖', name: 'AI Kişisel Asistan', desc: 'Günlük özet + hatırlatıcı', action: 'openPersonalAssistant', color: 'accent' },
    { group: 'CREATE', icon: '🧊', name: 'Aethrion 3D Studio', desc: '90+ şekil, .glb indir', action: 'open3DBuilder', color: 'ice' },
    { group: 'CREATE', icon: '🎬', name: 'Video Editör', desc: 'Timeline + trim + overlay', action: 'openVideoEditor', color: 'ember' },
    { group: 'CREATE', icon: '🎥', name: 'Video Stüdyosu', desc: 'Senaryo + Reels + Analiz', action: 'openVideoStudio', color: 'ember' },
    { group: 'CREATE', icon: '🎨', name: 'Görsel Üret', desc: 'FLUX + Stable Diffusion', action: 'scrollToImageGen', color: 'purple' },
    { group: 'CREATE', icon: '🖼️', name: 'Pexels GIF Ara', desc: 'Giphy GIF picker', action: 'openGifPicker', color: 'pink' },
    { group: 'PLATFORM', icon: '💼', name: 'İş İlanları Mağazası', desc: 'İlan ver, iş kabul et', action: 'openJobMarket', color: 'gold' },
    { group: 'PLATFORM', icon: '🛒', name: 'A27 Puan Mağazası', desc: 'Kazan, harca, takas', action: 'openMarket', color: 'gold' },
    { group: 'PLATFORM', icon: '👥', name: 'Aethrion Community', desc: 'Takım + ortak proje', action: 'toggleTeamPage', color: 'platinum' },
    { group: 'PLATFORM', icon: '📁', name: 'Projelerim', desc: 'Kaydet, arşivle, sat', action: 'scrollToProjects', color: 'accent2' },
    { group: 'PLATFORM', icon: '🏆', name: 'Aylık Yarışma', desc: 'Projeni gönder, kazan', action: 'openContestPage', color: 'gold' },
    { group: 'ADVANCED', icon: '🔑', name: 'A27 API Anahtarı', desc: '2/20/100/∞ limitler', action: 'openA27ApiKeyGenerator', color: 'gold' },
    { group: 'ADVANCED', icon: '📖', name: 'A27 API Rehberi', desc: 'Adım adım + cURL/JS/Py', action: 'openA27ApiGuide', color: 'gold' },
    { group: 'ADVANCED', icon: '📋', name: 'Logs Sistemi', desc: '5 seviye + backend sync', action: 'openLogsPanel', color: 'accent2' },
    { group: 'ADVANCED', icon: '📚', name: 'Aethrion Academy', desc: 'Ders + quiz + puan', action: 'scrollToAcademy', color: 'accent2' },
    { group: 'ADVANCED', icon: '🛡️', name: 'Ebeveyn Ayarları', desc: 'Güvenli mod + limitler', action: 'openParentSettings', color: 'warning' },
    { group: 'ACCOUNT', icon: '👤', name: 'Profilim', desc: 'Bilgiler, puan, seviye', action: 'openProfileModal', color: 'accent' },
    { group: 'ACCOUNT', icon: '📋', name: 'Hesap Bilgilerim', desc: 'IP, cihaz, üyelik', action: 'openAccountInfo', color: 'text3' },
    { group: 'ACCOUNT', icon: '⚙️', name: 'Ayarlar', desc: 'Dil, tema, tercihler', action: 'openSettingsModal', color: 'text3' }
];}catch(e){console.warn("[legacy] FEATURE_LIST",e);}
try{ if(typeof window.buildFeaturesPanelHTML!=="function"||__OVER.indexOf("buildFeaturesPanelHTML")>=0) window.buildFeaturesPanelHTML=function () {
    var groups = {};
    window.FEATURE_LIST.forEach(function (f) {
        if (!groups[f.group]) groups[f.group] = [];
        groups[f.group].push(f);
    });

    var groupTitles = {
        'CORE': '⚡ Çekirdek',
        'CREATE': '🎨 Yaratıcı',
        'PLATFORM': '🌐 Platform',
        'ADVANCED': '🔑 Gelişmiş',
        'ACCOUNT': '👤 Hesap'
    };

    var colorMap = {
        'accent': 'var(--accent)',
        'accent2': 'var(--accent2)',
        'purple': 'var(--purple)',
        'gold': 'var(--gold)',
        'ice': 'var(--ice)',
        'ember': 'var(--ember)',
        'pink': 'var(--pink)',
        'nvidia': 'var(--nvidia)',
        'platinum': 'var(--platinum)',
        'warning': 'var(--warning)',
        'text3': 'var(--text3)'
    };

    var html = '';
    html += '<div class="aethrion-features-header">';
    html += '<div class="aethrion-features-title">';
    html += '<span class="aethrion-features-logo">';
    html += '<svg width="36" height="36" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">';
    html += '<defs><linearGradient id="afpGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d4af37"/><stop offset="50%" stop-color="#b8c0d0"/><stop offset="100%" stop-color="#7c5cff"/></linearGradient></defs>';
    html += '<circle cx="32" cy="32" r="28" fill="none" stroke="url(#afpGrad)" stroke-width="1.6"/>';
    html += '<path d="M 22 44 L 32 18 L 42 44" fill="none" stroke="url(#afpGrad)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
    html += '<path d="M 26 34 L 38 34" stroke="url(#afpGrad)" stroke-width="2" stroke-linecap="round"/>';
    html += '<circle cx="32" cy="15" r="2" fill="#e8c555"/>';
    html += '</svg>';
    html += '</span>';
    html += '<div><div class="aethrion-features-brand">AETHRION</div>';
    html += '<div class="aethrion-features-slogan">Intelligence Without Limits.</div></div>';
    html += '</div>';
    html += '<button class="aethrion-features-close" onclick="window.closeAethrionFeaturesPanel()" title="Kapat">✕</button>';
    html += '</div>';

    html += '<div class="aethrion-features-body">';
    Object.keys(groups).forEach(function (gKey) {
        html += '<div class="aethrion-features-group">';
        html += '<div class="aethrion-features-group-title">' + (groupTitles[gKey] || gKey) + '</div>';
        html += '<div class="aethrion-features-list">';
        groups[gKey].forEach(function (f) {
            var color = colorMap[f.color] || 'var(--accent)';
            html += '<button class="aethrion-feature-item" onclick="window.runFeatureAction(\'' + f.action + '\'); window.closeAethrionFeaturesPanel();">';
            html += '<span class="aethrion-feature-icon" style="color:' + color + '; border-color:' + color + '; box-shadow: 0 0 18px ' + color + '40, inset 0 0 12px ' + color + '20;">' + f.icon + '</span>';
            html += '<span class="aethrion-feature-text">';
            html += '<span class="aethrion-feature-name">' + f.name + '</span>';
            html += '<span class="aethrion-feature-desc">' + f.desc + '</span>';
            html += '</span>';
            html += '<span class="aethrion-feature-arrow" style="color:' + color + ';">›</span>';
            html += '</button>';
        });
        html += '</div></div>';
    });
    html += '</div>';

    html += '<div class="aethrion-features-footer">';
    html += '<span>© 2027 AETHRION · v1.0.0</span>';
    html += '<span style="color:var(--accent2);font-style:italic;">Intelligence Without Limits.</span>';
    html += '</div>';

    return html;
};}catch(e){console.warn("[legacy] buildFeaturesPanelHTML",e);}
try{ if(typeof window.runFeatureAction!=="function"||__OVER.indexOf("runFeatureAction")>=0) window.runFeatureAction=function (actionName) {
    try {
        var actionMap = {
            'openFullAIPanel': ['openFullAIPanel'],
            'openAethrionAlPanel': ['openAethrionAlPanel', 'openVizyonAlPanel'],
            'openKocPanel': ['openKocPanel'],
            'openModelsShowcase': ['openModelsShowcase'],
            'openPersonalAssistant': ['openPersonalAssistant'],
            'open3DBuilder': ['open3DBuilder', 'open3DBuilderFull'],
            'openVideoEditor': ['openVideoEditor'],
            'openVideoStudio': ['openVideoStudio'],
            'scrollToImageGen': ['scrollToImageGen'],
            'openGifPicker': ['openGifPicker'],
            'openJobMarket': ['openJobMarket'],
            'openMarket': ['openMarket'],
            'toggleTeamPage': ['toggleTeamPage'],
            'scrollToProjects': ['scrollToProjects'],
            'openContestPage': ['openContestPage'],
            'openA27ApiKeyGenerator': ['openA27ApiKeyGenerator', 'openV27ApiKeyGenerator'],
            'openA27ApiGuide': ['openA27ApiGuide', 'openV27ApiGuide'],
            'openLogsPanel': ['openLogsPanel'],
            'scrollToAcademy': ['scrollToAcademy'],
            'openParentSettings': ['openParentSettings'],
            'openProfileModal': ['openProfileModal'],
            'openAccountInfo': ['openAccountInfo'],
            'openSettingsModal': ['openSettingsModal']
        };

        var candidates = actionMap[actionName] || [actionName];
        for (var i = 0; i < candidates.length; i++) {
            var fnName = candidates[i];
            if (typeof window[fnName] === 'function') {
                window[fnName]();
                return;
            }
        }
        var el = document.getElementById(actionName.replace('scrollTo', '').replace('open', '').toLowerCase());
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        showNotification('Bu özellik hazırlanıyor: ' + actionName, 'warning');
    } catch (e) {
        console.warn('Feature action hatası:', e);
        showNotification('Özellik yüklenemedi: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] runFeatureAction",e);}
try{ if(typeof window.scrollToProjects!=="function"||__OVER.indexOf("scrollToProjects")>=0) window.scrollToProjects=function () {
    var el = document.getElementById('projectsList');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var card = document.querySelector('.dashboard-card h3[data-i18n="Projelerim"]');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
};}catch(e){console.warn("[legacy] scrollToProjects",e);}
try{ if(typeof window.scrollToImageGen!=="function"||__OVER.indexOf("scrollToImageGen")>=0) window.scrollToImageGen=function () {
    var el = document.getElementById('imagePrompt');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function(){ try { el.focus(); } catch(e){} }, 500); }
};}catch(e){console.warn("[legacy] scrollToImageGen",e);}
try{ if(typeof window.scrollToAcademy!=="function"||__OVER.indexOf("scrollToAcademy")>=0) window.scrollToAcademy=function () {
    var el = document.getElementById('courseList');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};}catch(e){console.warn("[legacy] scrollToAcademy",e);}
try{ if(typeof window.togglePasswordInput!=="function"||__OVER.indexOf("togglePasswordInput")>=0) window.togglePasswordInput=function (btn, type, key) {
    var wrapper = btn.closest('.admin-login-box') || btn.closest('div');
    var input = wrapper ? wrapper.querySelector('.admin-pass-input') : null;
    if (!input) {
        var selector = type === 'admin' ? '[data-admin="' + key + '"]' : '[data-beta="' + key + '"]';
        input = document.querySelector(selector);
    }
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        if (btn) btn.innerHTML = '<i class="fas fa-eye"></i>';
    }
};}catch(e){console.warn("[legacy] togglePasswordInput",e);}
var translations={
    tr: {
        'Merhaba! Size nasıl yardımcı olabilirim?': 'Merhaba! Size nasıl yardımcı olabilirim?',
        'AETHRION': 'AETHRION',
        'Özellikler': 'Özellikler',
        'Yapay Zeka': 'Yapay Zeka',
        'Fiyatlar': 'Fiyatlar',
        'Giriş Yap': 'Giriş Yap',
        'Ücretsiz Başla': 'Ücretsiz Başla',
        'Çıkış': 'Çıkış',
        'Takım': 'Takım',
        'Profil': 'Profil',
        'Geçmiş': 'Geçmiş',
        'Aethrion Destek': 'Aethrion Destek',
        'AI Asistan': 'AI Asistan',
        'Gönder': 'Gönder',
        'Puan ver': 'Puan ver',
        'Yorum Gönder': 'Yorum Gönder',
        'Yorumlar': 'Yorumlar',
        'Topluluk Yorumları': 'Topluluk Yorumları',
        'Hesap Oluştur': 'Hesap Oluştur',
        'Kayıt Ol': 'Kayıt Ol',
        'Doğrula': 'Doğrula',
        'Şifre Değiştir': 'Şifre Değiştir',
        'Hesabımı Sil': 'Hesabımı Sil',
        'Ayarlar': 'Ayarlar',
        'Kapat': 'Kapat',
        'Dil Değiştir': 'Dil Değiştir',
        'Siteyi Paylaş': 'Siteyi Paylaş',
        'Yönetim Girişi': 'Yönetim Girişi',
        'Admin Girişi': 'Admin Girişi',
        'Beta Girişi': 'Beta Girişi',
        'İptal': 'İptal',
        'Takım Yönetimi': 'Takım Yönetimi',
        'Takım kodu': 'Takım kodu',
        'üye': 'üye',
        'Mesaj yaz veya @aethrional ile AI\'ya sor...': 'Mesaj yaz veya @aethrional ile AI\'ya sor...',
        'Dosya Yükle': 'Dosya Yükle',
        'Üyeler': 'Üyeler',
        'Değişiklikler': 'Değişiklikler',
        'Ortak Projeler': 'Ortak Projeler',
        'Gelen Kutusu': 'Gelen Kutusu',
        'Takvim / Etkinlik': 'Takvim / Etkinlik',
        'Aethrion AI Geçmişi': 'Aethrion AI Geçmişi',
        'Takım Oluştur': 'Takım Oluştur',
        'Koda Katıl': 'Koda Katıl',
        'Takımdan Ayrıl': 'Takımdan Ayrıl',
        'Takımı Kapat': 'Takımı Kapat',
        'Kurucu Paneli': 'Kurucu Paneli',
        'Aethrion Devriye': 'Aethrion Devriye',
        'AÇIK': 'AÇIK',
        'KAPALI': 'KAPALI',
        'Tüm Takımlar': 'Tüm Takımlar',
        'Ara': 'Ara',
        'Üye Kontrolleri': 'Üye Kontrolleri',
        'Yönetici Yap': 'Yönetici Yap',
        'Yöneticilikten Çıkar': 'Yöneticilikten Çıkar',
        'Takımdan At': 'Takımdan At',
        'Sahipliği Devret': 'Sahipliği Devret',
        'Kullanıcı': 'Kullanıcı',
        'Admin': 'Admin',
        'Beta': 'Beta',
        'Kurucu': 'Kurucu',
        'Sahip': 'Sahip',
        'Yönetici': 'Yönetici',
        'Üye': 'Üye',
        'Engelli Kullanıcılar': 'Engelli Kullanıcılar',
        'Engelle': 'Engelle',
        'Engeli Kaldır': 'Engeli Kaldır',
        'Hediye Gönder': 'Hediye Gönder',
        'Pro Paket': 'Pro Paket',
        'Takım Paketi': 'Takım Paketi',
        'Beta Tester Ata': 'Beta Tester Ata',
        'Admin Ata': 'Admin Ata',
        'Teklif Gönder': 'Teklif Gönder',
        'Yasakla': 'Yasakla',
        'Kullanıcı Listesi': 'Kullanıcı Listesi',
        'Admin Yap': 'Admin Yap',
        'Kullanıcı Yap': 'Kullanıcı Yap',
        'Geri': 'Geri',
        'Projelerim': 'Projelerim',
        'Yeni Proje': 'Yeni Proje',
        'Favoriler': 'Favoriler',
        'Arşiv': 'Arşiv',
        'Çöp Kutusu': 'Çöp Kutusu',
        'Proje Taleplerim': 'Proje Taleplerim',
        'Yönetim İşlemleri': 'Yönetim İşlemleri',
        'Görsel Üret (AI)': 'Görsel Üret (AI)',
        'Görsel Oluştur': 'Görsel Oluştur',
        'Yönetim Paneli (Sadece Kurucu)': 'Yönetim Paneli (Sadece Kurucu)',
        'Tümü': 'Tümü',
        'Hesap Bilgilerim': 'Hesap Bilgilerim',
        'Paylaş': 'Paylaş',
        'Sil': 'Sil',
        'Ad Ver': 'Ad Ver',
        'Yeni Sohbet': 'Yeni Sohbet',
        'İş İlanları': 'İş İlanları',
        'Mağazayı Aç': 'Mağazayı Aç',
        'İlan Ver': 'İlan Ver',
        'İşi Kabul Et': 'İşi Kabul Et',
        '28 Model': '28 Model',
        'A27 API': 'A27 API',
        'Moderatör': 'Moderatör',
        'Aethrion Al': 'Aethrion Al',
        'Kategoriler': 'Kategoriler',
        'Aethrion Academy': 'Aethrion Academy'
    },
    en: {
        'Projelerim': 'My Projects',
        'Yeni Proje': 'New Project',
        'Favoriler': 'Favorites',
        'Arşiv': 'Archive',
        'Çöp Kutusu': 'Trash',
        'Proje Taleplerim': 'My Project Requests',
        'Yönetim İşlemleri': 'Admin Actions',
        'Hediye Paketi Gönder': 'Send Gift Package',
        'Kullanıcı Yasakla': 'Ban User',
        'Görsel Üret (AI)': 'Generate Image (AI)',
        'Görsel Oluştur': 'Create Image',
        'Yönetim Paneli (Sadece Kurucu)': 'Admin Panel (Founder Only)',
        'Kullanıcı Engelle': 'Block User',
        'Tümü': 'All',
        'Yorum yapmak için giriş yapmalısınız.': 'You must login to comment.',
        'Sesli Komut': 'Voice Command',
        'Puan Mağazası': 'Points Store',
        'Mağaza': 'Store',
        'Satın Al': 'Buy',
        'Puan': 'Points',
        'Bana Öğret': 'Teach Me',
        'Kurucu ile İletişime Geç': 'Contact Founder',
        'Ebeveyn Ayarları': 'Parent Settings',
        'GIF Ara': 'Search GIF',
        'Hesap Bilgilerim': 'Account Info',
        'Paylaş': 'Share',
        'Sil': 'Delete',
        'Ad Ver': 'Rename',
        'Yeni Sohbet': 'New Chat',
        'İş İlanları': 'Job Listings',
        'Mağazayı Aç': 'Open Market',
        'İlan Ver': 'Post Job',
        'İşi Kabul Et': 'Accept Job',
        '28 Model': '28 Models',
        'A27 API': 'A27 API',
        'Moderatör': 'Moderator',
        'Aethrion Al': 'Aethrion Al',
        'Kategoriler': 'Categories',
        'Özellikler': 'Features'
    }
};
if(typeof window.translations==="undefined")window.translations=translations;
try{ if(typeof window.applyTranslations!=="function"||__OVER.indexOf("applyTranslations")>=0) window.applyTranslations=function (lang) {
    if (!lang) lang = currentLanguage || 'tr';
    var dict = translations[lang];
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (!dict[key]) return;
        var val = dict[key];
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
            if (el.placeholder !== undefined && el.placeholder !== '') el.placeholder = val;
            else if (el.value !== undefined) el.value = val;
        } else if (el.tagName === 'IMG' && el.alt !== undefined) {
            el.alt = val;
        } else if (el.hasAttribute('title')) {
            el.title = val;
        } else {
            el.textContent = val;
        }
    });
    var logoText = document.querySelector('.logo-text');
    if (logoText && dict['AETHRION']) logoText.textContent = dict['AETHRION'];
    document.querySelectorAll('#languageSelect, #settingsLanguageSelect').forEach(function (sel) {
        if (sel) sel.value = lang;
    });
    localStorage.setItem('aethrion_language', lang);
    currentLanguage = lang;
};}catch(e){console.warn("[legacy] applyTranslations",e);}
try{ if(typeof window.changeLanguage!=="function"||__OVER.indexOf("changeLanguage")>=0) window.changeLanguage=function (lang) { window.applyTranslations(lang); };}catch(e){console.warn("[legacy] changeLanguage",e);}
try{ if(typeof window.ensureSchemasInitialized!=="function"||__OVER.indexOf("ensureSchemasInitialized")>=0) window.ensureSchemasInitialized=async function () {
    if (schemaInitDone) return;
    if (!currentUser) return;
    var role = currentUser.get('role');
    if (role !== 'founder' && role !== 'admin' && role !== 'moderator' && role !== 'beta') return;
    try {
        var result = await Parse.Cloud.run('initSchemas', {});
        if (result && result.success) {
            schemaInitDone = true;
            console.log('✅ Schema init tamamlandı. Toplam:', result.results ? result.results.length : 0, 'sınıf');
            window.addLogSuccess('Schema init tamamlandı (' + (result.results ? result.results.length : 0) + ' sınıf)');
        } else {
            console.warn('⚠️ Schema init başarısız:', result);
        }
    } catch (e) {
        console.warn('Schema init hatası:', e.message);
    }
};}catch(e){console.warn("[legacy] ensureSchemasInitialized",e);}
try{ if(typeof window.showDashboard!=="function"||__OVER.indexOf("showDashboard")>=0) window.showDashboard=async function () {
    try {
        console.log('🔄 Aethrion Dashboard açılıyor...');
        var adminScreen = document.getElementById('adminLoginScreen');
        if (adminScreen) adminScreen.style.display = 'none';
        var mainSite = document.getElementById('mainSite');
        if (mainSite) mainSite.style.display = 'none';
        var userPanel = document.getElementById('userPanel');
        if (userPanel) userPanel.style.display = 'none';
        var dash = document.getElementById('dashboardArea');
        if (!dash) {
            dash = document.createElement('div');
            dash.id = 'dashboardArea';
            dash.className = 'dashboard-container';
            dash.style.display = 'block';
            document.body.appendChild(dash);
        }
        dash.style.display = 'block';
        dash.style.visibility = 'visible';
        dash.style.opacity = '1';

        try {
            document.documentElement.classList.add('dashboard-open');
            document.body.classList.add('dashboard-open');
        } catch (e) {}

        var aiWidget = document.querySelector('.ai-widget');
        if (aiWidget) aiWidget.style.display = 'none';

        try {
            document.querySelectorAll('.comments-track, .tech-scroll').forEach(function (el) {
                el.style.animationPlayState = 'paused';
            });
        } catch (e) {}

        var nameEl = document.getElementById('dashboardUserName');
        var roleEl = document.getElementById('userRoleBadge');
        var name = currentUser ? currentUser.get('name') : 'Kullanıcı';
        var role = currentUser ? currentUser.get('role') : 'user';
        var plan = currentUser ? currentUser.get('plan') : 'free';
        if (nameEl) nameEl.innerHTML = window.escapeHtml(name) || 'Kullanıcı';

        if (roleEl) {
            if (role === 'founder') roleEl.innerHTML = '👑 KURUCU';
            else if (role === 'admin') roleEl.innerHTML = '⚙️ ADMIN';
            else if (role === 'beta') roleEl.innerHTML = '🔬 BETA';
            else if (role === 'moderator') {
                roleEl.innerHTML = '🎨 MODERATÖR / TASARIMCI';
                roleEl.classList.add('moderator');
            }
            else roleEl.innerHTML = '👤 KULLANICI';
        }

        isFounder = (role === 'founder');

        if (currentUser) {
            var points = currentUser.get('points') || 0;
            window.updatePointsBadge(points);
        }

        var isAdmin = (role === 'admin' || role === 'founder');
        var isFounderOnly = (role === 'founder');
        var isModerator = (role === 'moderator');

        await window.ensureSchemasInitialized();

        var limits = window.getPlanLimits(currentUser);
        console.log('📊 Aethrion plan limitleri:', limits.label);
        window.addLogInfo('Dashboard açıldı. Plan: ' + limits.label);

        var planBadges = document.querySelectorAll('.plan-badge-auto');
        planBadges.forEach(function (b) { b.remove(); });
        if (nameEl && limits) {
            var planBadge = document.createElement('span');
            planBadge.className = 'plan-badge-auto';
            planBadge.style.cssText = 'display:inline-block; font-size:11px; padding:3px 10px; border-radius:12px; margin-left:8px; background:linear-gradient(135deg, rgba(212,175,55,0.15), rgba(124,92,255,0.08)); border:1px solid rgba(212,175,55,0.3); color:var(--accent); font-weight:600;';
            planBadge.textContent = limits.label;
            nameEl.parentNode.insertBefore(planBadge, nameEl.nextSibling);
        }

        var modInfoCard = document.getElementById('moderatorInfoCard');
        if (modInfoCard) modInfoCard.style.display = isModerator ? 'block' : 'none';

        var modAssignSection = document.getElementById('moderatorAssignSection');
        if (modAssignSection) modAssignSection.style.display = isFounderOnly ? 'block' : 'none';

        var adminActionsCard = document.getElementById('adminActionsCard');
        if (adminActionsCard) adminActionsCard.style.display = isAdmin ? 'block' : 'none';
        var betaAssignSection = document.getElementById('betaAssignSection');
        if (betaAssignSection) betaAssignSection.style.display = (isAdmin || isFounderOnly) ? 'block' : 'none';
        var adminAssignSection = document.getElementById('adminAssignSection');
        if (adminAssignSection) adminAssignSection.style.display = isFounderOnly ? 'block' : 'none';
        var adminPanelCard = document.getElementById('adminPanelCard');
        if (adminPanelCard) adminPanelCard.style.display = isFounderOnly ? 'block' : 'none';
        var showAdminsBtn = document.getElementById('showAdminsBtn');
        if (showAdminsBtn) showAdminsBtn.style.display = isFounderOnly ? 'inline-block' : 'none';

        var pollCreator = document.getElementById('pollCreator');
        var announcementCreator = document.getElementById('announcementCreator');
        if (pollCreator) pollCreator.style.display = isFounderOnly ? 'block' : 'none';
        if (announcementCreator) announcementCreator.style.display = isFounderOnly || isAdmin ? 'block' : 'none';

        var pollManage = document.getElementById('pollManage');
        if (pollManage) pollManage.style.display = isFounderOnly ? 'flex' : 'none';

        var apiKeyManagementWrapper = document.getElementById('apiKeyManagementWrapper');
        var apiModeToggleWrapper = document.getElementById('apiModeToggleWrapper');
        if (apiKeyManagementWrapper) apiKeyManagementWrapper.style.display = 'block';
        if (apiModeToggleWrapper) apiModeToggleWrapper.style.display = 'block';

        var contestFounderSection = document.getElementById('contestProjectsFounderSection');
        if (contestFounderSection) {
            contestFounderSection.style.display = isFounderOnly ? 'block' : 'none';
            if (isFounderOnly) {
                try { window.loadContestProjectsForFounder(); } catch (e) { console.warn('Yarışma projeleri yüklenemedi:', e); }
            }
        }

        var full3DBuilderEntryCard = document.getElementById('full3DBuilderEntryCard');
        if (full3DBuilderEntryCard) full3DBuilderEntryCard.style.display = 'block';

        if (isFounderOnly) await window.loadUserList();
        else {
            var userListContainer = document.getElementById('userList');
            if (userListContainer) userListContainer.innerHTML = '<div class="user-item">⚠️ Sadece Kurucu görebilir.</div>';
        }

        await window.loadProjects();
        await window.loadFavorites();
        await window.loadArchive();
        await window.loadTrash();
        await window.loadProjectRequests();
        await window.loadInbox();
        try { await window.loadTeamPage(); } catch (e) { console.warn('Takım sayfası yüklenemedi:', e); }
        await window.updateStats();
        window.startStatsInterval();
        await window.loadComments();

        if (currentUser) {
            try { window.loadStore(); } catch (e) {}
            try { window.loadDailyTasks(); } catch (e) {}
            try { window.loadSocialTasks(); } catch (e) {}
            try { window.loadTeamTasks(); } catch (e) {}
            try { window.loadPoll(); } catch (e) {}
            try { window.loadAnnouncements(); } catch (e) {}
            try { window.loadContestRanking(); } catch (e) {}
            try { window.loadCourses(); } catch (e) {}
            try { window.loadJobs(); } catch (e) {}
            try { window.loadQuiz(); } catch (e) {}
            try { window.loadWallet(); } catch (e) {}
            try { window.loadReferralLeaderboard(); } catch (e) {}
            try { window.loadStreak(); } catch (e) {}
            try { window.loadConversationHistory(); } catch (e) {}
            try { window.loadMySubscriptions(); } catch (e) {}
            try { window.loadMyAethrionApiKeys && window.loadMyAethrionApiKeys(); } catch (e) {}
            try { window.loadMyVizyonApiKeys && window.loadMyVizyonApiKeys(); } catch (e) {}
            try { window.loadKocDashboardHistory(); } catch (e) {}
            try { window.updateKocLimitBadge(); } catch (e) {}
            try { window.loadJobMarketDashboardPreview && window.loadJobMarketDashboardPreview(); } catch (e) {}
        }

        await checkAndShowSubscriptionCard();

        var extraCard = document.getElementById('extraAdminCard');
        if (!extraCard) {
            extraCard = document.createElement('div');
            extraCard.id = 'extraAdminCard';
            extraCard.className = 'dashboard-card full-width';
            extraCard.style.marginTop = '24px';
            extraCard.style.display = 'none';
            var wrapperEl = document.querySelector('.dashboard-content-wrapper');
            if (wrapperEl) wrapperEl.appendChild(extraCard);
        }
        if (extraCard) {
            if (isFounderOnly || isAdmin) {
                extraCard.style.display = 'block';
                var html = '<h3>⚙️ Aethrion Yönetim Paneli (Gelişmiş)</h3><div style="display:flex;flex-wrap:wrap;gap:12px;">';
                if (isFounderOnly) html += '<button class="btn-secondary" onclick="window.showAdminsList()">👑 Tüm Adminler</button>';
                if (isFounderOnly || isAdmin) {
                    html += '<button class="btn-secondary" onclick="window.showBetasList()">🧪 Tüm Betalar</button>';
                    html += '<button class="btn-secondary" onclick="window.showBannedList()">🚫 Engelli Kullanıcılar</button>';
                    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
                        '<input type="email" id="banEmailInput" placeholder="Engellenecek e-posta" class="glow-input" style="flex:1;min-width:150px;">' +
                        '<button class="btn-danger btn-sm" onclick="window.banUserByEmail(document.getElementById(\'banEmailInput\').value)">🚫 Engelle</button>' +
                    '</div>';
                    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
                        '<input type="email" id="unbanEmailInput" placeholder="Engeli kaldırılacak e-posta" class="glow-input" style="flex:1;min-width:150px;">' +
                        '<button class="btn-success btn-sm" onclick="window.unbanUserByEmail(document.getElementById(\'unbanEmailInput\').value)">🔓 Engeli Kaldır</button>' +
                    '</div>';
                    html += '<button class="btn-primary btn-sm" onclick="window.sendBlogNotification()">📝 Blog Bildirimi Gönder</button>';
                    html += '<button class="btn-primary btn-sm" onclick="window.sendSystemNotification()">⚡ Sistem Güncellemesi Bildir</button>';
                }
                html += '</div>';
                extraCard.innerHTML = html;
            } else extraCard.style.display = 'none';
        }

        window.applyTranslations(currentLanguage);
        console.log('✅ Aethrion Dashboard açıldı! Rol: ' + role + ' Plan: ' + plan);
        showNotification('Aethrion\'a hoş geldin ' + name + '!', 'success');
    } catch (e) {
        console.error('Dashboard hatası:', e);
        showNotification('Dashboard yüklenirken hata: ' + e.message, 'error');
        window.addLogError('Dashboard hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] showDashboard",e);}
try{ if(typeof window.updatePointsBadge!=="function"||__OVER.indexOf("updatePointsBadge")>=0) window.updatePointsBadge=function (points) {
    var badge = document.getElementById('dashboardPointsDisplay');
    if (badge) badge.textContent = points || 0;
};}catch(e){console.warn("[legacy] updatePointsBadge",e);}
try{ if(typeof window.loadUserPoints!=="function"||__OVER.indexOf("loadUserPoints")>=0) window.loadUserPoints=async function () {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getUserPoints', {});
        window.updatePointsBadge(result.points || 0);
    } catch (e) {}
};}catch(e){console.warn("[legacy] loadUserPoints",e);}
try{ if(typeof window.loadStore!=="function"||__OVER.indexOf("loadStore")>=0) window.loadStore=async function () {
    if (!currentUser) return;
    try {
        const storeResult = await Parse.Cloud.run('getStoreItems', {});
        const marketResult = await Parse.Cloud.run('getMarketProjects', {});
        let allItems = [];
        if (storeResult && storeResult.length > 0) {
            storeResult.forEach(function(item) {
                allItems.push({
                    id: item.id,
                    name: item.name,
                    price_points: item.price_points,
                    icon: item.icon || '🎁',
                    type: 'store',
                    isAdmin: true,
                    description: 'Aethrion tarafından eklenmiştir.',
                    imageUrl: 'https://via.placeholder.com/200x200?text=Aethrion'
                });
            });
        }
        if (marketResult && marketResult.length > 0) {
            marketResult.forEach(function(item) {
                allItems.push({
                    id: item.id,
                    name: item.title,
                    price_points: item.price_points,
                    icon: item.type === '3D' ? '🧊' : (item.type === 'Kod' ? '⌨️' : '🖼️'),
                    type: 'market',
                    isAdmin: false,
                    description: item.description,
                    imageUrl: item.imageUrl,
                    owner: item.owner_name,
                    owner_email: item.owner_email,
                    projectId: item.projectId,
                    marketId: item.id
                });
            });
        }
        var container = document.getElementById('storeItems');
        if (!container) container = document.querySelector('#dashboardArea .store-grid');
        if (!container) return;
        if (allItems.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center;">🏪 Mağaza boş. Henüz ürün veya proje yok.</div>';
            return;
        }
        var html = '';
        allItems.forEach(function (item) {
            html += `
                <div class="store-item" style="position:relative;">
                    <div class="item-icon">${item.icon || '🎁'}</div>
                    <div class="item-name">${window.escapeHtml(item.name)}</div>
                    ${item.isAdmin ? '' : `<div style="font-size:10px;color:var(--text3);">👤 ${window.escapeHtml(item.owner || 'Kullanıcı')}</div>`}
                    <div style="font-size:11px;color:var(--text2);margin:4px 0;">${window.escapeHtml(item.description.substring(0, 40))}...</div>
                    <div class="item-price">⭐ ${item.price_points} Puan</div>
                    ${item.isAdmin ?
                        `<button class="btn-primary btn-sm" onclick="window.buyStoreItem('${item.id}')">Satın Al</button>` :
                        `<button class="btn-primary btn-sm" onclick="window.buyMarketProject('${item.marketId}')">Satın Al</button>`
                    }
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) {
        console.error('Mağaza yüklenirken hata:', e);
        window.addLogError('Mağaza yükleme hatası: ' + e.message);
        var container2 = document.getElementById('storeItems');
        if (container2) container2.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center;">⚠️ Mağaza yüklenemedi.</div>';
    }
};}catch(e){console.warn("[legacy] loadStore",e);}
try{ if(typeof window.buyStoreItem!=="function"||__OVER.indexOf("buyStoreItem")>=0) window.buyStoreItem=async function (itemId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm('Bu ürünü satın almak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('purchaseStoreItem', { itemId: itemId });
        showNotification(result.message, 'success');
        window.addLogSuccess('Ürün satın alındı');
        window.updatePointsBadge(result.remaining_points);
        window.loadStore();
        window.loadUserPoints();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        window.addLogError('Ürün satın alma hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] buyStoreItem",e);}
try{ if(typeof window.openStore!=="function"||__OVER.indexOf("openStore")>=0) window.openStore=function () { window.openMarket(); };}catch(e){console.warn("[legacy] openStore",e);}
try{ if(typeof window.loadDailyTasks!=="function"||__OVER.indexOf("loadDailyTasks")>=0) window.loadDailyTasks=async function () {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getDailyTasks', {});
        var container = document.getElementById('dailyTasksContainer');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">🎯 Bugünlük görev yok.</div>';
            return;
        }
        var html = '';
        result.forEach(function (task) {
            var completed = task.completed || false;
            var taskText = task.task_text;
            var actionUrl = '';
            if (taskText.includes('AI sorgusu')) actionUrl = 'openFullAIPanel()';
            else if (taskText.includes('yorum')) actionUrl = "document.getElementById('commentInput').focus()";
            else if (taskText.includes('proje oluştur')) actionUrl = "window.createProjectWizard()";
            else if (taskText.includes('favorile')) actionUrl = "document.getElementById('favList').scrollIntoView({behavior:'smooth'})";
            else if (taskText.includes('takım mesajı')) actionUrl = "document.getElementById('teamPageInput').focus()";
            html += `
                <div class="task-card ${completed ? 'completed' : ''}">
                    <div class="task-info">
                        <span>${window.escapeHtml(taskText)}</span>
                        <span class="task-points">+${task.points} Puan</span>
                    </div>
                    <div>
                        ${!completed ? `<button class="btn-primary btn-sm" onclick="${actionUrl}" style="font-size:11px;padding:4px 12px;">✅ Tamamla</button>` : '<span class="task-status">✅ Tamamlandı</span>'}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) { console.error('Günlük görevler yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadDailyTasks",e);}
try{ if(typeof window.completeDailyTask!=="function"||__OVER.indexOf("completeDailyTask")>=0) window.completeDailyTask=async function (taskId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('completeDailyTask', { taskId: taskId });
        if (result.success) {
            showNotification(result.message, 'success');
            window.updatePointsBadge(result.remaining_points);
            window.loadDailyTasks();
            window.loadUserPoints();
        } else {
            showNotification('❌ ' + result.message, 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] completeDailyTask",e);}
try{ if(typeof window.loadSocialTasks!=="function"||__OVER.indexOf("loadSocialTasks")>=0) window.loadSocialTasks=async function () {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getSocialTasks', {});
        var container = document.getElementById('socialTasksList');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">🌐 Henüz topluluk görevi yok.</div>';
            return;
        }
        var html = '';
        result.forEach(function (task) {
            var completed = task.completed || false;
            var actionUrl = task.url || '#';
            var isYoutube = actionUrl === '#';
            var platformDisplay = task.platform || 'Sosyal Medya';
            html += `
                <div class="task-card ${completed ? 'completed' : ''}">
                    <div class="task-info">
                        <span>${window.escapeHtml(platformDisplay)}</span>
                        <span class="task-points">+${task.points_reward} Puan</span>
                    </div>
                    <div>
                        ${!completed ? (isYoutube ?
                            `<button class="btn-secondary btn-sm" onclick="showNotification('YouTube sayfamız yakında yayında!', 'warning')" style="font-size:11px;padding:4px 12px;">📺 Yakında</button>` :
                            `<button class="btn-primary btn-sm" onclick="window.open('${window.escapeHtml(actionUrl)}','_blank')" style="font-size:11px;padding:4px 12px;">✅ Git</button>`
                        ) : '<span class="task-status">✅ Tamamlandı</span>'}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) { console.error('Topluluk görevleri yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadSocialTasks",e);}
try{ if(typeof window.verifySocialFollow!=="function"||__OVER.indexOf("verifySocialFollow")>=0) window.verifySocialFollow=async function (taskId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('verifySocialFollow', { taskId: taskId });
        showNotification(result.message, 'success');
        window.updatePointsBadge(result.remaining_points);
        window.loadSocialTasks();
        window.loadUserPoints();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] verifySocialFollow",e);}
try{ if(typeof window.loadTeamTasks!=="function"||__OVER.indexOf("loadTeamTasks")>=0) window.loadTeamTasks=async function () {
    if (!currentUser) return;
    var teamId = currentUser.get('teamId');
    var container = document.getElementById('teamTasksList');
    if (!container) return;
    if (!teamId) {
        container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">👥 Takım görevleri için bir takıma katılın.</div>';
        return;
    }
    try {
        var result = await Parse.Cloud.run('getTeamTasks', { teamId: teamId });
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">📋 Bugün için takım görevi yok.</div>';
            return;
        }
        var html = '';
        result.forEach(function (task) {
            var completed = task.completed || false;
            var actionUrl = "document.getElementById('teamPageInput').focus()";
            html += `
                <div class="task-card ${completed ? 'completed' : ''}">
                    <div class="task-info">
                        <span>👥 ${window.escapeHtml(task.task_text)}</span>
                        <span class="task-points">+${task.points} Puan</span>
                    </div>
                    <div>
                        ${!completed ? `<button class="btn-primary btn-sm" onclick="${actionUrl}" style="font-size:11px;padding:4px 12px;">✅ Tamamla</button>` : '<span class="task-status">✅ Tamamlandı</span>'}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) { console.error('Takım görevleri yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadTeamTasks",e);}
try{ if(typeof window.completeTeamTask!=="function"||__OVER.indexOf("completeTeamTask")>=0) window.completeTeamTask=async function (taskId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('completeTeamTask', { taskId: taskId });
        showNotification(result.message, 'success');
        window.updatePointsBadge(result.remaining_points);
        window.loadTeamTasks();
        window.loadUserPoints();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] completeTeamTask",e);}
try{ if(typeof window.loadPoll!=="function"||__OVER.indexOf("loadPoll")>=0) window.loadPoll=async function () {
    try {
        var result = await Parse.Cloud.run('getActivePoll', {});
        var containers = document.querySelectorAll('#pollContainer');
        containers.forEach(function (container) {
            var questionEl = container.querySelector('.poll-question');
            var optionsEl = container.querySelector('#pollOptions');
            var statusEl = container.querySelector('#pollStatus');
            if (!questionEl || !optionsEl || !statusEl) return;
            if (!result || !result.question) {
                questionEl.textContent = 'Aktif anket yok.';
                optionsEl.innerHTML = '';
                statusEl.textContent = 'Kurucu anket oluşturabilir.';
                return;
            }
            questionEl.textContent = result.question;
            var html = '';
            var totalVotes = result.votes.reduce(function(a, b) { return a + b; }, 0);
            result.options.forEach(function (option, index) {
                var percent = totalVotes > 0 ? (result.votes[index] / totalVotes * 100) : 0;
                html += `
                    <div class="poll-option" onclick="window.votePoll(${index})">
                        <span>${window.escapeHtml(option)}</span>
                        <div class="poll-bar">
                            <div class="poll-bar-fill" style="width:${percent}%;"></div>
                        </div>
                        <span class="poll-percent">${Math.round(percent)}%</span>
                        <span class="poll-votes">(${result.votes[index]} oy)</span>
                    </div>
                `;
            });
            optionsEl.innerHTML = html;
            statusEl.textContent = totalVotes + ' oy kullanıldı. ' + (result.end_date ? 'Kalan süre: ' + window.getTimeRemaining(result.end_date) : '');
        });
    } catch (e) { console.error('Anket yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadPoll",e);}
try{ if(typeof window.votePoll!=="function"||__OVER.indexOf("votePoll")>=0) window.votePoll=async function (index) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        await Parse.Cloud.run('votePoll', { optionIndex: index });
        showNotification('Oy kullanıldı!', 'success');
        window.addLogInfo('Anket oyu kullanıldı');
        window.loadPoll();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] votePoll",e);}
try{ if(typeof window.createPoll!=="function"||__OVER.indexOf("createPoll")>=0) window.createPoll=async function () {
    if (!currentUser || currentUser.get('role') !== 'founder') return showNotification('Sadece kurucu anket oluşturabilir!', 'error');
    var question = document.getElementById('pollQuestionInput').value.trim();
    var optionsInputs = document.querySelectorAll('#pollOptionsInputs input');
    var options = [];
    optionsInputs.forEach(function (inp) {
        var val = inp.value.trim();
        if (val) options.push(val);
    });
    if (!question || options.length < 2) return showNotification('Soru ve en az 2 seçenek girin!', 'error');
    var duration = parseInt(document.getElementById('pollDuration').value) || 3;
    try {
        await Parse.Cloud.run('createPoll', { question: question, options: options, duration: duration });
        showNotification('Anket oluşturuldu!', 'success');
        window.loadPoll();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] createPoll",e);}
try{ if(typeof window.deletePoll!=="function"||__OVER.indexOf("deletePoll")>=0) window.deletePoll=async function () {
    if (!currentUser || currentUser.get('role') !== 'founder') return showNotification('Sadece kurucu silebilir!', 'error');
    if (!confirm('Bu anketi silmek istediğinize emin misiniz?')) return;
    try {
        await Parse.Cloud.run('deletePoll', {});
        showNotification('Anket silindi!', 'success');
        window.loadPoll();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] deletePoll",e);}
try{ if(typeof window.editPoll!=="function"||__OVER.indexOf("editPoll")>=0) window.editPoll=async function () {
    if (!currentUser || currentUser.get('role') !== 'founder') return showNotification('Sadece kurucu düzenleyebilir!', 'error');
    var newQuestion = prompt('Yeni anket sorusu:');
    if (newQuestion === null) return;
    try {
        await Parse.Cloud.run('editPoll', { question: newQuestion });
        showNotification('Anket güncellendi!', 'success');
        window.loadPoll();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] editPoll",e);}
try{ if(typeof window.addPollOption!=="function"||__OVER.indexOf("addPollOption")>=0) window.addPollOption=function () {
    var container = document.getElementById('pollOptionsInputs');
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Yeni seçenek';
    input.className = 'glow-input';
    input.style.cssText = 'width:100%;margin-bottom:4px;';
    container.appendChild(input);
};}catch(e){console.warn("[legacy] addPollOption",e);}
try{ if(typeof window.getTimeRemaining!=="function"||__OVER.indexOf("getTimeRemaining")>=0) window.getTimeRemaining=function (endDate) {
    var now = new Date();
    var end = new Date(endDate);
    var diff = end - now;
    if (diff <= 0) return 'Süre doldu.';
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days + ' gün ' + hours + ' saat';
};}catch(e){console.warn("[legacy] getTimeRemaining",e);}
try{ if(typeof window.loadAnnouncements!=="function"||__OVER.indexOf("loadAnnouncements")>=0) window.loadAnnouncements=async function () {
    try {
        var result = await Parse.Cloud.run('getAnnouncements', {});
        var containers = document.querySelectorAll('#announcementList');
        containers.forEach(function (container) {
            if (!container) return;
            if (!result || result.length === 0) {
                container.innerHTML = '<div style="color:var(--text3);padding:8px;">📭 Henüz duyuru yok.</div>';
                return;
            }
            var html = '';
            result.forEach(function (a) {
                html += `
                    <div style="background:var(--surface);border-radius:8px;padding:12px 16px;margin-bottom:8px;border-left:3px solid var(--accent);">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <strong>${window.escapeHtml(a.title || 'Duyuru')}</strong>
                            <span style="font-size:10px;color:var(--text3);">${new Date(a.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                        <div style="font-size:13px;color:var(--text2);margin-top:4px;">${window.escapeHtml(a.content)}</div>
                        ${(currentUser && (currentUser.get('role') === 'admin' || currentUser.get('role') === 'founder')) ? `
                            <div style="margin-top:6px;display:flex;gap:6px;">
                                <button class="btn-danger btn-sm" onclick="window.deleteAnnouncement('${a.id}')" style="font-size:9px;padding:2px 8px;">🗑️ Sil</button>
                                <button class="btn-secondary btn-sm" onclick="window.editAnnouncement('${a.id}')" style="font-size:9px;padding:2px 8px;">✏️ Düzenle</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            container.innerHTML = html;
        });
    } catch (e) { console.error('Duyurular yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadAnnouncements",e);}
try{ if(typeof window.addAnnouncement!=="function"||__OVER.indexOf("addAnnouncement")>=0) window.addAnnouncement=async function () {
    if (!currentUser || (currentUser.get('role') !== 'admin' && currentUser.get('role') !== 'founder')) {
        return showNotification('Sadece admin ve kurucu duyuru yapabilir!', 'error');
    }
    var title = document.getElementById('announcementTitle').value.trim();
    var content = document.getElementById('announcementContent').value.trim();
    if (!title || !content) return showNotification('Başlık ve içerik girin!', 'error');
    try {
        await Parse.Cloud.run('addAnnouncement', { title: title, content: content });
        showNotification('Duyuru yayınlandı!', 'success');
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementContent').value = '';
        window.loadAnnouncements();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] addAnnouncement",e);}
try{ if(typeof window.deleteAnnouncement!=="function"||__OVER.indexOf("deleteAnnouncement")>=0) window.deleteAnnouncement=async function (id) {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    try {
        await Parse.Cloud.run('deleteAnnouncement', { announcementId: id });
        showNotification('Duyuru silindi!', 'success');
        window.loadAnnouncements();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] deleteAnnouncement",e);}
try{ if(typeof window.editAnnouncement!=="function"||__OVER.indexOf("editAnnouncement")>=0) window.editAnnouncement=async function (id) {
    var newTitle = prompt('Yeni başlık:');
    if (newTitle === null) return;
    var newContent = prompt('Yeni içerik:');
    if (newContent === null) return;
    try {
        await Parse.Cloud.run('editAnnouncement', { announcementId: id, title: newTitle, content: newContent });
        showNotification('Duyuru güncellendi!', 'success');
        window.loadAnnouncements();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] editAnnouncement",e);}
try{ if(typeof window.loadCourses!=="function"||__OVER.indexOf("loadCourses")>=0) window.loadCourses=async function () {
    try {
        var result = await Parse.Cloud.run('getCourses', {});
        var container = document.getElementById('courseList');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">📚 Henüz ders yok.</div>';
            return;
        }
        var html = '';
        result.forEach(function (course) {
            html += `
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;transition:0.2s;cursor:pointer;" onclick="window.viewCourse('${course.id}')">
                    <div style="font-weight:700;font-size:16px;">${window.escapeHtml(course.title || 'Ders')}</div>
                    <div style="font-size:12px;color:var(--text3);margin:6px 0;">${course.total_lessons || 0} ders</div>
                    <div style="font-size:13px;color:var(--text2);">${window.escapeHtml((course.description || '').substring(0, 60))}...</div>
                    ${course.completed ? '<span style="color:var(--success);font-size:12px;">✅ Tamamlandı</span>' : ''}
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) { console.error('Dersler yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadCourses",e);}
try{ if(typeof window.viewCourse!=="function"||__OVER.indexOf("viewCourse")>=0) window.viewCourse=async function (courseId) {
    try {
        var result = await Parse.Cloud.run('getCourseDetails', { courseId: courseId });
        if (!result) return showNotification('Ders bulunamadı!', 'error');
        var content = `
            <div style="padding:16px;">
                <h2>${window.escapeHtml(result.title)}</h2>
                <p style="color:var(--text2);">${window.escapeHtml(result.description)}</p>
                <div style="margin:16px 0;">
                    ${result.lessons ? result.lessons.map(function (lesson, index) {
                        return `
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
                                <span>${index + 1}. ${window.escapeHtml(lesson.title || 'Ders')}</span>
                                <button class="btn-primary btn-sm" onclick="window.completeLesson('${lesson.id}')" style="font-size:10px;padding:2px 10px;">✅ Tamamla (${lesson.points_reward || 0}p)</button>
                            </div>
                        `;
                    }).join('') : ''}
                </div>
            </div>
        `;
        var modal = document.createElement('div');
        modal.className = 'modal-overlay open';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal" style="max-width:600px;">
                <div class="modal-header">
                    <h3>📚 ${window.escapeHtml(result.title)}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                ${content}
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="margin-top:16px;">Kapat</button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] viewCourse",e);}
try{ if(typeof window.completeLesson!=="function"||__OVER.indexOf("completeLesson")>=0) window.completeLesson=async function (lessonId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('completeLesson', { lessonId: lessonId });
        if (result.success) {
            showNotification(result.message || 'Ders tamamlandı!', 'success');
            window.updatePointsBadge(result.remaining_points);
            window.loadCourses();
            window.loadUserPoints();
        } else {
            showNotification('❌ ' + result.message, 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] completeLesson",e);}
try{ if(typeof window.loadQuiz!=="function"||__OVER.indexOf("loadQuiz")>=0) window.loadQuiz=async function () {
    try {
        var result = await Parse.Cloud.run('getQuizQuestions', {});
        var container = document.getElementById('quizContainer');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">🎮 Bugünlük oyun yok.</div>';
            return;
        }
        var html = '';
        result.forEach(function (q, index) {
            html += `
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;">
                    <div style="font-weight:600;margin-bottom:8px;">${index + 1}. ${window.escapeHtml(q.question)}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        ${q.options.map(function (opt, i) {
                            return `<button class="btn-secondary btn-sm" onclick="window.answerQuiz('${q.id}', ${i})" style="font-size:11px;padding:4px 8px;">${window.escapeHtml(opt)}</button>`;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) { console.error('Oyun yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadQuiz",e);}
try{ if(typeof window.answerQuiz!=="function"||__OVER.indexOf("answerQuiz")>=0) window.answerQuiz=async function (quizId, answerIndex) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('submitQuizAnswer', { quizId: quizId, answerIndex: answerIndex });
        if (result.correct) {
            showNotification('✅ Doğru! +' + result.points_reward + ' puan kazandın!', 'success');
            window.updatePointsBadge(result.remaining_points);
            window.loadUserPoints();
        } else {
            showNotification('❌ Yanlış cevap!', 'error');
        }
        window.loadQuiz();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] answerQuiz",e);}
try{ if(typeof window.loadContestRanking!=="function"||__OVER.indexOf("loadContestRanking")>=0) window.loadContestRanking=async function () {
    var container = document.getElementById('contestRanking');
    if (!container) return;
    try {
        var result = await Parse.Cloud.run('getContestRankingV2', {});
        if (!result || !result.ranking || result.ranking.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">📊 Henüz katılımcı yok.</div>';
            return;
        }
        var html = '<div style="font-size:13px;">';
        var medals = ['🥇', '🥈', '🥉'];
        result.ranking.slice(0, 5).forEach(function (item, index) {
            var medal = index < 3 ? medals[index] : (index + 1) + '.';
            html += `
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
                    <span>${medal} ${window.escapeHtml(item.user_name || item.user_email.split('@')[0])}</span>
                    <span style="color:var(--gold);font-weight:600;">${item.total_points || 0} puan</span>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('Yarışma sıralaması yüklenemedi:', e);
        container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;">⚠️ Yüklenemedi.</div>';
    }
};}catch(e){console.warn("[legacy] loadContestRanking",e);}
try{ if(typeof window.closeContestJoinWarning!=="function"||__OVER.indexOf("closeContestJoinWarning")>=0) window.closeContestJoinWarning=function () {
    var modal = document.getElementById('contestJoinWarningModal');
    if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
};}catch(e){console.warn("[legacy] closeContestJoinWarning",e);}
try{ if(typeof window.closeContestReview!=="function"||__OVER.indexOf("closeContestReview")>=0) window.closeContestReview=function () {
    var modal = document.getElementById('contestReviewModal');
    if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
    window.currentReviewingProject = null;
};}catch(e){console.warn("[legacy] closeContestReview",e);}
try{ if(typeof window.closeContestScore!=="function"||__OVER.indexOf("closeContestScore")>=0) window.closeContestScore=function () {
    var modal = document.getElementById('contestScoreModal');
    if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
    window.currentScoringProject = null;
};}catch(e){console.warn("[legacy] closeContestScore",e);}
try{ if(typeof window.loadJobs!=="function"||__OVER.indexOf("loadJobs")>=0) window.loadJobs=async function () {
    try {
        var result = await Parse.Cloud.run('getJobListings', { limit: 6 });
        var container = document.getElementById('jobList');
        if (!container) return;
        if (!result || !result.jobs || result.jobs.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;grid-column:1/-1;">💼 Henüz iş ilanı yok. İlk ilanı sen ver!</div>';
            return;
        }
        var html = '';
        result.jobs.forEach(function (job) {
            var typeIcon = job.job_type === 'Kod' ? '💻' : job.job_type === 'Tasarım' ? '🎨' : job.job_type === 'Video' ? '🎬' : job.job_type === 'Çeviri' ? '🌐' : job.job_type === 'Yazar' ? '✍️' : job.job_type === '3D' ? '🧊' : job.job_type === 'Müzik' ? '🎵' : '📦';
            html += `
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;cursor:pointer;" onclick="window.openJobDetail && window.openJobDetail('${job.id}')">
                    <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${typeIcon} ${window.escapeHtml(job.title || 'İlan')}</div>
                    <div style="font-size:11px;color:var(--text3);">👤 ${window.escapeHtml(job.owner_name || 'Kullanıcı')}</div>
                    <div style="font-size:11.5px;color:var(--text2);margin:6px 0;">${window.escapeHtml((job.description || '').substring(0, 70))}...</div>
                    <div style="color:var(--gold);font-weight:700;font-size:13px;">⭐ ${job.salary || 0} Puan</div>
                    <div style="font-size:10px;color:var(--text3);margin-top:4px;">${window.escapeHtml(job.job_number || '')}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) { console.error('İş ilanları yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadJobs",e);}
try{ if(typeof window.applyJob!=="function"||__OVER.indexOf("applyJob")>=0) window.applyJob=async function (jobId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('acceptJobListing', { jobId: jobId });
        if (result.success) {
            showNotification(result.message || 'İş kabul edildi!', 'success');
        } else {
            showNotification('❌ ' + (result.error || 'İş kabul edilemedi'), 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] applyJob",e);}
try{ if(typeof window.submitBugReport!=="function"||__OVER.indexOf("submitBugReport")>=0) window.submitBugReport=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var description = document.getElementById('bugDescription').value.trim();
    var fileInput = document.getElementById('bugScreenshot');
    var file = fileInput ? fileInput.files[0] : null;
    if (!description) return showNotification('Hata açıklaması girin!', 'error');
    try {
        var fileUrl = null;
        if (file) {
            if (file.size > 5 * 1024 * 1024) return showNotification('Dosya boyutu 5MB\'ı aşamaz!', 'error');
            var parseFile = new Parse.File(file.name, file);
            await parseFile.save();
            fileUrl = parseFile.url();
        }
        var result = await Parse.Cloud.run('submitBugReport', { description: description, screenshot: fileUrl });
        showNotification(result.message || 'Hata bildirimi gönderildi! +100 Puan', 'success');
        window.addLogSuccess('Hata bildirimi gönderildi');
        document.getElementById('bugDescription').value = '';
        if (fileInput) fileInput.value = '';
        window.updatePointsBadge(result.remaining_points);
        window.loadUserPoints();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] submitBugReport",e);}
try{ if(typeof window.loadWallet!=="function"||__OVER.indexOf("loadWallet")>=0) window.loadWallet=async function () {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getWalletBalance', {});
        var el = document.getElementById('walletBalance');
        if (el) el.textContent = (result.balance || 0).toFixed(2);
    } catch (e) { console.error('Cüzdan yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadWallet",e);}
try{ if(typeof window.withdrawFunds!=="function"||__OVER.indexOf("withdrawFunds")>=0) window.withdrawFunds=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var amount = parseFloat(prompt('Çekmek istediğiniz miktarı girin (TL):'));
    if (isNaN(amount) || amount <= 0) return showNotification('Geçerli bir miktar girin!', 'error');
    try {
        var result = await Parse.Cloud.run('withdrawFunds', { amount: amount });
        showNotification(result.message || 'Çekim talebi alındı.', 'success');
        window.loadWallet();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] withdrawFunds",e);}
try{ if(typeof window.toggleFollow!=="function"||__OVER.indexOf("toggleFollow")>=0) window.toggleFollow=async function (userId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('toggleFollow', { userId: userId });
        showNotification(result.message, 'success');
        if (result.action === 'followed') {
            await Parse.Cloud.run('sendNotification', {
                userId: userId,
                message: currentUser.get('name') + ' sizi takip etmeye başladı!',
                type: 'follow'
            });
        }
        window.viewProfile(userId);
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] toggleFollow",e);}
try{ if(typeof window.openDmModal!=="function"||__OVER.indexOf("openDmModal")>=0) window.openDmModal=function (userId) {
    var modal = document.getElementById('dmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dmModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal" style="max-width:900px;width:95%;">
                <div class="modal-header">
                    <h3>✈️ Mesajlar</h3>
                    <button class="modal-close" onclick="closeModal('dmModal')">×</button>
                </div>
                <div class="dm-container">
                    <div class="dm-conversations" id="dmConversations">
                        <div style="padding:12px;color:var(--text3);text-align:center;">Konuşmalar yükleniyor...</div>
                    </div>
                    <div class="dm-chat" id="dmChat">
                        <div class="dm-chat-header" id="dmChatHeader">Bir konuşma seçin</div>
                        <div class="dm-messages" id="dmMessages"></div>
                        <div class="dm-input-area">
                            <input type="text" id="dmInput" placeholder="Mesajınızı yazın..." onkeypress="if(event.key==='Enter') window.sendDmMessage()">
                            <input type="file" id="dmFileInput" style="display:none;" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip">
                            <button class="dm-file-btn" onclick="document.getElementById('dmFileInput').click()">📎</button>
                            <button class="btn-primary btn-sm" onclick="window.sendDmMessage()">Gönder</button>
                        </div>
                    </div>
                </div>
                <button class="btn-secondary" onclick="closeModal('dmModal')" style="margin-top:16px;" data-i18n="Kapat">Kapat</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
    modal.style.display = 'flex';
    window.loadConversations();
    if (userId) window.startConversation(userId);
};}catch(e){console.warn("[legacy] openDmModal",e);}
try{ if(typeof window.loadConversations!=="function"||__OVER.indexOf("loadConversations")>=0) window.loadConversations=async function () {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getConversations', {});
        var container = document.getElementById('dmConversations');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="padding:12px;color:var(--text3);text-align:center;">📭 Henüz konuşma yok.</div>';
            return;
        }
        var userEmail = currentUser.get('email');
        var html = '';
        result.forEach(function (conv) {
            var users = conv.users || [];
            var otherEmail = users.find(function (u) { return u !== userEmail; });
            var name;
            if (otherEmail) {
                var parts = otherEmail.split('@');
                name = parts[0];
            } else {
                name = 'Sadece Sen';
            }
            var lastMsg = conv.lastMessage || 'Yeni konuşma';
            html += `<div class="dm-conversation-item" onclick="window.loadConversation('${conv.id}')">`;
            html += `<div class="dm-avatar">${window.escapeHtml(name.charAt(0).toUpperCase())}</div>`;
            html += `<div><div class="dm-name">${window.escapeHtml(name)}</div><div class="dm-last-msg">${window.escapeHtml(lastMsg.substring(0, 30))}</div></div>`;
            html += `</div>`;
        });
        container.innerHTML = html;
    } catch (e) { console.error('Konuşmalar yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadConversations",e);}
try{ if(typeof window.loadConversation!=="function"||__OVER.indexOf("loadConversation")>=0) window.loadConversation=async function (conversationId) {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getConversationMessages', { conversationId: conversationId });
        var container = document.getElementById('dmMessages');
        var header = document.getElementById('dmChatHeader');
        if (!container || !header) return;
        var userEmail = currentUser.get('email');
        var users = result.users || [];
        var otherEmail = users.find(function (u) { return u !== userEmail; });
        var name;
        if (otherEmail) {
            var parts = otherEmail.split('@');
            name = parts[0];
        } else {
            name = 'Kendin';
        }
        header.textContent = '💬 ' + name;
        currentDmConversation = conversationId;
        var messages = result.messages || [];
        if (messages.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);text-align:center;padding:40px;">Henüz mesaj yok. İlk mesajı sen gönder!</div>';
            return;
        }
        var html = '';
        messages.forEach(function (msg) {
            var fromEmail = (msg.from_user && msg.from_user.id) ? msg.from_user.id : null;
            var isSent = (fromEmail === userEmail);
            var cls = isSent ? 'sent' : 'received';
            var content = msg.text || '';
            if (msg.file) content += `<br><a href="${window.escapeHtml(msg.file)}" target="_blank" class="dm-file">📎 Dosyayı Gör</a>`;
            html += `<div class="dm-msg ${cls}">${window.escapeHtml(content).replace(/\n/g, '<br>')}</div>`;
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    } catch (e) { console.error('Mesajlar yüklenirken hata:', e); }
};}catch(e){console.warn("[legacy] loadConversation",e);}
try{ if(typeof window.sendDmMessage!=="function"||__OVER.indexOf("sendDmMessage")>=0) window.sendDmMessage=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!currentDmConversation) return showNotification('Bir konuşma seçin!', 'warning');
    var input = document.getElementById('dmInput');
    var msg = input.value.trim();
    var fileInput = document.getElementById('dmFileInput');
    var file = fileInput ? fileInput.files[0] : null;
    if (!msg && !file) return showNotification('Mesaj veya dosya gerekli!', 'warning');
    try {
        var fileUrl = null, fileName = null;
        if (file) {
            var parseFile = new Parse.File(file.name, file);
            await parseFile.save();
            fileUrl = parseFile.url();
            fileName = file.name;
            fileInput.value = '';
        }
        await Parse.Cloud.run('sendMessage', { conversationId: currentDmConversation, text: msg || '', fileUrl: fileUrl, fileName: fileName });
        input.value = '';
        await window.loadConversation(currentDmConversation);
        showNotification('Mesaj gönderildi!', 'success');
    } catch (e) { showNotification('Mesaj gönderilemedi: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] sendDmMessage",e);}
try{ if(typeof window.searchUsers!=="function"||__OVER.indexOf("searchUsers")>=0) window.searchUsers=async function () {
    var query = document.getElementById('searchInput').value.trim();
    if (!query) return showNotification('Lütfen bir arama terimi girin!', 'warning');
    try {
        var result = await Parse.Cloud.run('searchUsers', { query: query });
        var container = document.getElementById('searchResults');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px;">🔍 Kullanıcı bulunamadı.</div>';
            return;
        }
        var html = '';
        result.forEach(function (user) {
            var isSelf = user.id === currentUser.id;
            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border);">`;
            html += `<span><strong>${window.escapeHtml(user.name || user.username || 'İsimsiz')}</strong> (${window.escapeHtml(user.email)})</span>`;
            html += `<div>`;
            if (!isSelf) {
                html += `<button class="btn-secondary btn-sm" onclick="window.startConversation('${user.id}')" style="font-size:10px;padding:2px 8px;">✉️ Mesaj At</button>`;
                html += `<button class="btn-secondary btn-sm" onclick="window.viewProfile('${user.id}')" style="font-size:10px;padding:2px 8px;">👤 Profil</button>`;
            } else {
                html += `<span style="color:var(--text3);font-size:12px;">(Bu sensin)</span>`;
            }
            html += `</div></div>`;
        });
        container.innerHTML = html;
    } catch (e) { showNotification('Arama hatası: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] searchUsers",e);}
try{ if(typeof window.viewProfile!=="function"||__OVER.indexOf("viewProfile")>=0) window.viewProfile=async function (userId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('getProfile', { userId: userId });
        if (!result) return showNotification('Profil bulunamadı!', 'error');
        var isSelf = result.user.id === currentUser.id;
        var content = `
            <div style="text-align:center;padding:16px;">
                <div style="font-size:64px;">👤</div>
                <div style="font-size:24px;font-weight:700;">${window.escapeHtml(result.user.name || 'İsimsiz')}</div>
                <div style="color:var(--text3);">@${window.escapeHtml(result.user.username || result.user.email)}</div>
                <div style="margin:12px 0;font-size:14px;">${window.escapeHtml(result.user.bio || 'Merhaba! AETHRION\'dayım.')}</div>
                <div style="display:flex;gap:20px;justify-content:center;margin:12px 0;">
                    <div><strong>${result.followers || 0}</strong> Takipçi</div>
                    <div><strong>${result.following || 0}</strong> Takip Edilen</div>
                    <div><strong>${result.points || 0}</strong> Puan</div>
                </div>
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                    ${!isSelf ? `<button class="btn-primary btn-sm" onclick="window.startConversation('${userId}')">✉️ Mesaj At</button>` : ''}
                    ${!isSelf ? `<button class="btn-secondary btn-sm" onclick="window.toggleFollow('${userId}')">${result.isFollowing ? '✅ Takip Ediliyor' : '➕ Takip Et'}</button>` : ''}
                    ${isSelf ? `<button class="btn-secondary btn-sm" onclick="window.openProfileModal()">✏️ Profil Düzenle</button>` : ''}
                </div>
            </div>
        `;
        var modal = document.createElement('div');
        modal.className = 'modal-overlay open';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal" style="max-width:500px;">
                <div class="modal-header">
                    <h3>👤 Profil</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                ${content}
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="margin-top:16px;" data-i18n="Kapat">Kapat</button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) { showNotification('Profil yüklenemedi: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] viewProfile",e);}
try{ if(typeof window.createProjectWizard!=="function"||__OVER.indexOf("createProjectWizard")>=0) window.createProjectWizard=function () {
    if (!currentUser) { showNotification('Önce giriş yapın!', 'error'); return; }

    var limits = window.getPlanLimits(currentUser);
    var maxProjects = limits.maxProjects;
    if (maxProjects !== -1) {
        Parse.Cloud.run('getUserProjectCount', {}).then(function(res) {
            if (res && res.count >= maxProjects) {
                window.showLimitModal('maxProjects', { allowed: false, limit: maxProjects, used: res.count, remaining: 0, reason: 'Aylık proje limitinize ulaştınız' });
                return;
            }
        }).catch(function() {});
    }

    wizardMode = 'create';
    wizardEditProjectId = null;
    wizardOriginalData = null;
    wizardType = null;
    wizardData = {};

    var modal = document.getElementById('projectWizardModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'projectWizardModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal" style="max-width:620px;">
                <div class="modal-header">
                    <h3 id="wizardTitle">📁 Yeni Proje Oluştur</h3>
                    <button class="modal-close" onclick="closeModal('projectWizardModal')">×</button>
                </div>
                <div id="wizardBody" style="padding:10px 0;">
                    <div id="wizardStep1">
                        <p style="color:var(--text2); margin-bottom:16px;">Ne tür bir proje oluşturmak istersiniz?</p>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            <button class="btn-primary" onclick="window.wizardSelectType('3d')" style="font-size:16px; padding:14px;">🧊 3D Tasarım</button>
                            <button class="btn-primary" onclick="window.wizardSelectType('code')" style="font-size:16px; padding:14px;">⌨️ Kod Yazma</button>
                            <button class="btn-primary" onclick="window.wizardSelectType('image')" style="font-size:16px; padding:14px;">🖼️ Görsel Oluşturma</button>
                            <button class="btn-primary" onclick="window.wizardOpen3DBuilder()" style="font-size:16px; padding:14px; background: linear-gradient(135deg, #d4af37, #7c5cff) !important;">🎨 Kendin 3D Oluştur</button>
                        </div>
                        <div style="margin-top:18px; padding:12px 16px; background:linear-gradient(135deg, rgba(118,185,0,0.08), rgba(212,175,55,0.04)); border:1px dashed rgba(118,185,0,0.35); border-radius:12px; font-size:11.5px; color:#b8e070; line-height:1.65;">
                            🟢 <strong style="color:var(--nvidia);">28 Model:</strong> Proje oluştururken 28 AI modeli (13 Ollama + 7 NVIDIA NIM + 8 Bulut API) birleşik gücünü kullanır.
                        </div>
                    </div>
                    <div id="wizardStep2" style="display:none;">
                        <div id="wizardDynamicFields"></div>
                        <button class="btn-primary" id="wizardSubmitBtn" onclick="window.wizardFinish()" style="margin-top:16px; width:100%;">✅ Projeyi Oluştur</button>
                    </div>
                    <button class="btn-secondary" onclick="closeModal('projectWizardModal')" style="margin-top:16px; width:100%;">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
    modal.style.display = 'flex';

    var step1 = document.getElementById('wizardStep1');
    var step2 = document.getElementById('wizardStep2');
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';

    var titleEl = document.getElementById('wizardTitle');
    if (titleEl) titleEl.textContent = '📁 Yeni Proje Oluştur';
    var submitBtn = document.getElementById('wizardSubmitBtn');
    if (submitBtn) { submitBtn.textContent = '✅ Projeyi Oluştur'; submitBtn.onclick = window.wizardFinish; }
};}catch(e){console.warn("[legacy] createProjectWizard",e);}
try{ if(typeof window.wizardSelectType!=="function"||__OVER.indexOf("wizardSelectType")>=0) window.wizardSelectType=function (type) {
    wizardType = type;
    document.getElementById('wizardStep1').style.display = 'none';
    document.getElementById('wizardStep2').style.display = 'block';
    document.getElementById('wizardTitle').textContent = '📁 ' + (type === '3d' ? '3D Tasarım' : type === 'code' ? 'Kod Yazma' : 'Görsel Oluşturma') + ' Projesi';

    var fields = document.getElementById('wizardDynamicFields');
    fields.innerHTML = '';

    if (type === '3d') {
        fields.innerHTML = `
            <div style="margin-bottom:12px;">
                <label>3D Nesne Açıklaması</label>
                <input type="text" id="wizard3DPrompt" placeholder="Örn: kırmızı küp" class="form-input" style="margin-top:4px;">
            </div>
            <div style="margin-bottom:12px;">
                <label>Proje Adı</label>
                <input type="text" id="wizardProjectName" placeholder="Projenize bir isim verin" class="form-input" style="margin-top:4px;">
            </div>
        `;
    } else if (type === 'code') {
        fields.innerHTML = `
            <div style="margin-bottom:12px;">
                <label>Kodlama Yöntemi</label>
                <div style="display:flex; gap:8px; margin-top:4px;">
                    <button class="btn-secondary btn-sm" onclick="window.wizardSetCodeMethod('manual')" id="wizardCodeManual" style="flex:1;">✍️ Elle Yaz</button>
                    <button class="btn-secondary btn-sm" onclick="window.wizardSetCodeMethod('ai')" id="wizardCodeAi" style="flex:1;">🤖 AI ile Yaz</button>
                </div>
                <div id="wizardCodeField" style="margin-top:8px;">
                    <textarea id="wizardCodeContent" placeholder="Kodunuzu yazın..." rows="5" class="form-input"></textarea>
                </div>
            </div>
            <div style="margin-bottom:12px;">
                <label>Proje Adı</label>
                <input type="text" id="wizardProjectName" placeholder="Projenize bir isim verin" class="form-input" style="margin-top:4px;">
            </div>
        `;
        window.wizardSetCodeMethod('manual');
    } else if (type === 'image') {
        fields.innerHTML = `
            <div style="margin-bottom:12px;">
                <label>Görsel Açıklaması</label>
                <input type="text" id="wizardImagePrompt" placeholder="Örn: dağ manzarası" class="form-input" style="margin-top:4px;">
            </div>
            <div style="margin-bottom:12px;">
                <label>Proje Adı</label>
                <input type="text" id="wizardProjectName" placeholder="Projenize bir isim verin" class="form-input" style="margin-top:4px;">
            </div>
        `;
    }
};}catch(e){console.warn("[legacy] wizardSelectType",e);}
try{ if(typeof window.wizardSetCodeMethod!=="function"||__OVER.indexOf("wizardSetCodeMethod")>=0) window.wizardSetCodeMethod=function (method) {
    wizardData.codeMethod = method;
    var manualBtn = document.getElementById('wizardCodeManual');
    var aiBtn = document.getElementById('wizardCodeAi');
    var field = document.getElementById('wizardCodeField');
    if (method === 'manual') {
        if (manualBtn) { manualBtn.style.borderColor = 'var(--accent)'; manualBtn.style.background = 'rgba(212,175,55,0.1)'; }
        if (aiBtn) { aiBtn.style.borderColor = 'var(--border)'; aiBtn.style.background = 'transparent'; }
        field.innerHTML = `<textarea id="wizardCodeContent" placeholder="Kodunuzu yazın..." rows="5" class="form-input"></textarea>`;
    } else {
        if (aiBtn) { aiBtn.style.borderColor = 'var(--accent)'; aiBtn.style.background = 'rgba(212,175,55,0.1)'; }
        if (manualBtn) { manualBtn.style.borderColor = 'var(--border)'; manualBtn.style.background = 'transparent'; }
        field.innerHTML = `
            <input type="text" id="wizardCodePrompt" placeholder="AI'ya ne yazdırmak istersiniz? Örn: Python'da hesap makinesi" class="form-input" style="margin-bottom:8px;">
            <button class="btn-secondary btn-sm" onclick="window.wizardGenerateCode()">🤖 Kod Oluştur</button>
            <div id="wizardCodeResult" style="margin-top:8px; background:var(--bg); border-radius:8px; padding:8px; display:none;"></div>
        `;
    }
};}catch(e){console.warn("[legacy] wizardSetCodeMethod",e);}
try{ if(typeof window.wizardGenerateCode!=="function"||__OVER.indexOf("wizardGenerateCode")>=0) window.wizardGenerateCode=async function () {
    var prompt = document.getElementById('wizardCodePrompt').value.trim();
    if (!prompt) return showNotification('Lütfen bir komut yazın!', 'error');
    showNotification('⏳ Kod üretiliyor...', 'success');
    try {
        var result = await Parse.Cloud.run('superAI', { prompt: 'Sadece kod ver, açıklama yapma: ' + prompt });
        var resultDiv = document.getElementById('wizardCodeResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<pre style="white-space:pre-wrap; word-break:break-word; color:var(--accent2);">' + window.escapeHtml(result) + '</pre>';
        wizardData.generatedCode = result;
        showNotification('✅ Kod oluşturuldu!', 'success');
    } catch (e) {
        showNotification('❌ Kod üretilemedi: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] wizardGenerateCode",e);}
try{ if(typeof window.wizardFinish!=="function"||__OVER.indexOf("wizardFinish")>=0) window.wizardFinish=async function () {
    var nameInput = document.getElementById('wizardProjectName');
    if (!nameInput) return showNotification('Proje adı alanı bulunamadı!', 'error');
    var name = nameInput.value.trim();
    if (!name) return showNotification('Lütfen proje adı girin!', 'error');

    var typeLabel = wizardType === '3d' ? '3D' : wizardType === 'code' ? 'Kod' : 'Görsel';
    var content = '';

    if (wizardType === '3d') {
        var prompt3D = document.getElementById('wizard3DPrompt').value.trim();
        if (!prompt3D) return showNotification('3D açıklaması girin!', 'error');
        content = '3D: ' + prompt3D;
        if (wizardMode === 'create') {
            try {
                document.getElementById('threeDPrompt').value = prompt3D;
                await window.generate3D();
            } catch (e) {}
        }
    } else if (wizardType === 'code') {
        if (wizardData.codeMethod === 'manual') {
            var codeContent = document.getElementById('wizardCodeContent').value.trim();
            if (!codeContent) return showNotification('Kod yazın!', 'error');
            content = 'Kod (Elle):\n' + codeContent;
        } else {
            if (wizardData.generatedCode) {
                content = 'Kod (AI):\n' + wizardData.generatedCode;
            } else {
                var promptCode = document.getElementById('wizardCodePrompt').value.trim();
                if (!promptCode) return showNotification('AI\'ya ne yazdırmak istediğinizi yazın!', 'error');
                try {
                    var result = await Parse.Cloud.run('superAI', { prompt: 'Sadece kod ver, açıklama yapma: ' + promptCode });
                    content = 'Kod (AI):\n' + result;
                } catch (e) {
                    return showNotification('AI kod üretemedi: ' + e.message, 'error');
                }
            }
        }
    } else if (wizardType === 'image') {
        var promptImage = document.getElementById('wizardImagePrompt').value.trim();
        if (!promptImage) return showNotification('Görsel açıklaması girin!', 'error');
        content = 'Görsel: ' + promptImage;
        if (wizardMode === 'create') {
            try {
                document.getElementById('imagePrompt').value = promptImage;
                await window.generateImage();
            } catch (e) {}
        }
    }

    if (wizardMode === 'edit' && wizardEditProjectId) {
        try {
            var query = new Parse.Query('Project');
            var project = await query.get(wizardEditProjectId);
            if (!project) return showNotification('Proje bulunamadı!', 'error');
            project.set('name', name);
            project.set('type', typeLabel);
            project.set('content', content);
            await project.save();
            closeModal('projectWizardModal');
            await window.loadProjects();
            await window.loadFavorites();
            await window.loadArchive();
            showNotification('✅ "' + name + '" projesi güncellendi!', 'success');
            window.addLogSuccess('Proje güncellendi: ' + name);
            wizardMode = 'create';
            wizardEditProjectId = null;
            wizardOriginalData = null;
        } catch (e) {
            console.error('Proje güncelleme hatası:', e);
            showNotification('❌ Proje güncellenemedi: ' + e.message, 'error');
            window.addLogError('Proje güncelleme hatası: ' + e.message);
        }
    } else {
        try {
            const Project = Parse.Object.extend('Project');
            const project = new Project();
            project.set('user_email', currentUser.get('email'));
            project.set('name', name);
            project.set('type', typeLabel);
            project.set('content', content);
            project.set('is_favorite', false);
            project.set('is_archived', false);
            project.set('is_trashed', false);
            await project.save();
            closeModal('projectWizardModal');
            await window.loadProjects();
            showNotification('✅ Proje "' + name + '" kaydedildi!', 'success');
            window.addLogSuccess('Proje oluşturuldu: ' + name);
            wizardMode = 'create';
            wizardEditProjectId = null;
            wizardOriginalData = null;
        } catch (e) {
            showNotification('❌ Proje kaydedilemedi: ' + e.message, 'error');
            window.addLogError('Proje kaydetme hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] wizardFinish",e);}
try{ if(typeof window.openProjectEditor!=="function"||__OVER.indexOf("openProjectEditor")>=0) window.openProjectEditor=async function (id) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!id) return showNotification('Proje ID gerekli!', 'error');
    try {
        var query = new Parse.Query('Project');
        var project = await query.get(id);
        if (!project) return showNotification('Proje bulunamadı!', 'error');
        if (project.get('user_email') !== currentUser.get('email') && currentUser.get('role') !== 'founder') {
            return showNotification('Bu proje size ait değil!', 'error');
        }
        wizardMode = 'edit';
        wizardEditProjectId = id;
        var projectType = project.get('type') || 'Kod';
        var projectName = project.get('name') || '';
        var projectContent = project.get('content') || '';
        wizardOriginalData = { name: projectName, type: projectType, content: projectContent };

        var modal = document.getElementById('projectWizardModal');
        if (!modal) {
            if (typeof window.createProjectWizard === 'function') {
                window.createProjectWizard();
                setTimeout(function () {
                    wizardMode = 'edit';
                    wizardEditProjectId = id;
                    wizardOriginalData = { name: projectName, type: projectType, content: projectContent };
                    window.openProjectEditorStep2();
                }, 50);
                return;
            }
            return showNotification('Proje sihirbazı bulunamadı!', 'error');
        }
        modal.classList.add('open');
        modal.style.display = 'flex';
        var titleEl = document.getElementById('wizardTitle');
        if (titleEl) titleEl.textContent = '✏️ Projeyi Düzenle';
        var step1 = document.getElementById('wizardStep1');
        var step2 = document.getElementById('wizardStep2');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        window.openProjectEditorStep2();
    } catch (e) {
        console.error('Proje düzenleme hatası:', e);
        showNotification('Proje yüklenemedi: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] openProjectEditor",e);}
try{ if(typeof window.openProjectEditorStep2!=="function"||__OVER.indexOf("openProjectEditorStep2")>=0) window.openProjectEditorStep2=function () {
    if (!wizardOriginalData) return showNotification('Proje verisi bulunamadı!', 'error');
    var typeMap = { '3D': '3d', 'Kod': 'code', 'Görsel': 'image' };
    var wizardTypeLocal = typeMap[wizardOriginalData.type] || 'code';
    wizardType = wizardTypeLocal;
    var fields = document.getElementById('wizardDynamicFields');
    if (!fields) return;
    var content = wizardOriginalData.content || '';
    var name = wizardOriginalData.name || '';

    if (wizardTypeLocal === '3d') {
        var prompt3D = content.replace(/^3D:\s*/i, '').trim();
        fields.innerHTML = `
            <div style="margin-bottom:12px;">
                <label style="color:var(--text3); font-size:12px; display:block; margin-bottom:4px;">3D Nesne Açıklaması</label>
                <input type="text" id="wizard3DPrompt" value="${window.escapeHtml(prompt3D)}" placeholder="Örn: kırmızı küp" class="form-input" style="margin-top:4px;">
                <div style="font-size:11px; color:var(--text3); margin-top:6px;">
                    💡 Not: 3D içeriğinizi gelişmiş stüdyoda düzenlemek için aşağıdaki butonu kullanın.
                </div>
                <button class="btn-secondary btn-sm" onclick="window.wizardOpen3DBuilder()" style="margin-top:8px; font-size:12px; padding:8px 16px;">
                    🎨 3D Stüdyoda Aç
                </button>
            </div>
            <div style="margin-bottom:12px;">
                <label style="color:var(--text3); font-size:12px; display:block; margin-bottom:4px;">Proje Adı</label>
                <input type="text" id="wizardProjectName" value="${window.escapeHtml(name)}" placeholder="Projenize bir isim verin" class="form-input" style="margin-top:4px;">
            </div>
        `;
    } else if (wizardTypeLocal === 'code') {
        var codeContent = content;
        var isAICode = false;
        if (content.indexOf('Kod (AI):') === 0 || content.indexOf('Kod (AI):\n') !== -1) {
            isAICode = true;
            codeContent = content.replace(/^Kod \(AI\):\s*/i, '').replace(/^Kod \(AI\):\n/i, '').trim();
        } else if (content.indexOf('Kod (Elle):') === 0 || content.indexOf('Kod (Elle):\n') !== -1) {
            codeContent = content.replace(/^Kod \(Elle\):\s*/i, '').replace(/^Kod \(Elle\):\n/i, '').trim();
        }
        wizardData.codeMethod = isAICode ? 'ai' : 'manual';
        wizardData.generatedCode = isAICode ? codeContent : null;

        fields.innerHTML = `
            <div style="margin-bottom:12px;">
                <label style="color:var(--text3); font-size:12px; display:block; margin-bottom:4px;">Kodlama Yöntemi</label>
                <div style="display:flex; gap:8px; margin-top:4px;">
                    <button class="btn-secondary btn-sm ${!isAICode ? 'active' : ''}" onclick="window.wizardSetCodeMethod('manual')" id="wizardCodeManual" style="flex:1; ${!isAICode ? 'border-color:var(--accent); background:rgba(212,175,55,0.1);' : ''}">✍️ Elle Yaz</button>
                    <button class="btn-secondary btn-sm ${isAICode ? 'active' : ''}" onclick="window.wizardSetCodeMethod('ai')" id="wizardCodeAi" style="flex:1; ${isAICode ? 'border-color:var(--accent); background:rgba(212,175,55,0.1);' : ''}">🤖 AI ile Yaz</button>
                </div>
                <div id="wizardCodeField" style="margin-top:8px;">
                    ${isAICode
                        ? `<input type="text" id="wizardCodePrompt" placeholder="AI'ya ne yazdırmak istersiniz?" class="form-input" style="margin-bottom:8px;" value="">
                           <button class="btn-secondary btn-sm" onclick="window.wizardGenerateCode()">🤖 Kod Oluştur</button>
                           <div id="wizardCodeResult" style="margin-top:8px; background:var(--bg); border-radius:8px; padding:8px; ${codeContent ? 'display:block' : 'display:none'};"><pre style="white-space:pre-wrap; word-break:break-word; color:var(--accent2);">${window.escapeHtml(codeContent)}</pre></div>`
                        : `<textarea id="wizardCodeContent" placeholder="Kodunuzu yazın..." rows="5" class="form-input">${window.escapeHtml(codeContent)}</textarea>`}
                </div>
            </div>
            <div style="margin-bottom:12px;">
                <label style="color:var(--text3); font-size:12px; display:block; margin-bottom:4px;">Proje Adı</label>
                <input type="text" id="wizardProjectName" value="${window.escapeHtml(name)}" placeholder="Projenize bir isim verin" class="form-input" style="margin-top:4px;">
            </div>
        `;
        if (isAICode) wizardData.generatedCode = codeContent;
    } else if (wizardTypeLocal === 'image') {
        var promptImage = content.replace(/^Görsel:\s*/i, '').trim();
        fields.innerHTML = `
            <div style="margin-bottom:12px;">
                <label style="color:var(--text3); font-size:12px; display:block; margin-bottom:4px;">Görsel Açıklaması</label>
                <input type="text" id="wizardImagePrompt" value="${window.escapeHtml(promptImage)}" placeholder="Örn: dağ manzarası" class="form-input" style="margin-top:4px;">
            </div>
            <div style="margin-bottom:12px;">
                <label style="color:var(--text3); font-size:12px; display:block; margin-bottom:4px;">Proje Adı</label>
                <input type="text" id="wizardProjectName" value="${window.escapeHtml(name)}" placeholder="Projenize bir isim verin" class="form-input" style="margin-top:4px;">
            </div>
        `;
    }
    var submitBtn = document.getElementById('wizardSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = '💾 Güncelle';
        submitBtn.onclick = window.wizardFinish;
    }
};}catch(e){console.warn("[legacy] openProjectEditorStep2",e);}
try{ if(typeof window.createProjectRequest!=="function"||__OVER.indexOf("createProjectRequest")>=0) window.createProjectRequest=function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var modal = document.getElementById('projectRequestModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'projectRequestModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal" style="max-width:600px;">
                <div class="modal-header">
                    <h3>📨 Proje Talebi Oluştur</h3>
                    <button class="modal-close" onclick="window.closeModal('projectRequestModal')">×</button>
                </div>
                <div style="padding:10px 0;">
                    <div style="margin-bottom:12px;">
                        <label>Proje Türü</label>
                        <select id="requestType" class="glow-input" style="width:100%;">
                            <option value="3D">🧊 3D Tasarım</option>
                            <option value="Kod">⌨️ Kod Yazma</option>
                            <option value="Görsel">🖼️ Görsel Oluşturma</option>
                        </select>
                    </div>
                    <div style="margin-bottom:12px;">
                        <label>Proje Başlığı</label>
                        <input type="text" id="requestTitle" placeholder="Proje başlığını girin" class="form-input">
                    </div>
                    <div style="margin-bottom:12px;">
                        <label>Proje Açıklaması</label>
                        <textarea id="requestDescription" placeholder="Projenizi detaylıca anlatın..." rows="4" class="form-input"></textarea>
                    </div>
                    <div style="background:linear-gradient(135deg, rgba(212,175,55,0.1), rgba(124,92,255,0.06)); border:1px solid var(--gold); border-radius:12px; padding:12px; margin-bottom:16px;">
                        ⚠️ Bu talep önce moderatörlere, yoksa tüm admin ve kuruculara gönderilecektir. İlk değerlendiren kabul ederse projeniz oluşturulacaktır.
                    </div>
                    <button class="btn-primary" onclick="window.submitProjectRequest()" style="width:100%; padding:14px;">📤 Talebi Gönder</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
    modal.style.display = 'flex';
    document.getElementById('requestTitle').value = '';
    document.getElementById('requestDescription').value = '';
};}catch(e){console.warn("[legacy] createProjectRequest",e);}
try{ if(typeof window.submitProjectRequest!=="function"||__OVER.indexOf("submitProjectRequest")>=0) window.submitProjectRequest=async function () {
    var title = document.getElementById('requestTitle').value.trim();
    var type = document.getElementById('requestType').value;
    var description = document.getElementById('requestDescription').value.trim();
    if (!title) return showNotification('Lütfen proje başlığı girin!', 'error');
    if (!description) return showNotification('Lütfen proje açıklaması girin!', 'error');
    try {
        var result = await Parse.Cloud.run('createProjectRequest', { title: title, type: type, description: description });
        showNotification(result.message || 'Talep gönderildi.', 'success');
        window.addLogSuccess('Proje talebi gönderildi: ' + title);
        window.closeModal('projectRequestModal');
        window.loadProjectRequests();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        window.addLogError('Proje talebi hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] submitProjectRequest",e);}
try{ if(typeof window.saveUserApiKey!=="function"||__OVER.indexOf("saveUserApiKey")>=0) window.saveUserApiKey=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var nameInput = document.getElementById('apiNameInput');
    var valueInput = document.getElementById('apiValueInput');
    if (!nameInput || !valueInput) return showNotification('API formu bulunamadı!', 'error');
    var name = nameInput.value.trim();
    var value = valueInput.value.trim();
    if (!name) return showNotification('Lütfen sanal isim girin!', 'error');
    if (!value) return showNotification('Lütfen API anahtar değerini girin!', 'error');
    if (name.length < 2) return showNotification('İsim en az 2 karakter olmalı!', 'error');
    if (value.length < 8) return showNotification('API anahtarı çok kısa görünüyor!', 'error');
    try {
        var result = await Parse.Cloud.run('saveUserApiKey', { name: name, value: value });
        if (result.success) {
            showNotification('✅ API anahtarı kaydedildi: ' + name, 'success');
            window.addLogSuccess('API anahtarı kaydedildi');
            closeModal('apiEkleModal');
            if (window.apiKeysUnlocked) window.loadApiKeys();
        } else {
            showNotification('❌ Kayıt başarısız: ' + (result.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        window.addLogError('API anahtarı kaydetme hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] saveUserApiKey",e);}
try{ if(typeof window.loadApiKeys!=="function"||__OVER.indexOf("loadApiKeys")>=0) window.loadApiKeys=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var container = document.getElementById('apiKeysListContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text3);">⏳ Yükleniyor...</div>';
    try {
        var result = await Parse.Cloud.run('getUserApiKeys', {});
        if (!result || !result.success) {
            container.innerHTML = '<div class="api-keys-empty">⚠️ API anahtarları yüklenemedi.</div>';
            return;
        }
        window.apiKeysCache = result.apiKeys || [];
        if (window.apiKeysCache.length === 0) {
            container.innerHTML = '<div class="api-keys-empty">🔑 Henüz API anahtarı eklenmemiş.<br><br><button class="btn-primary btn-sm" onclick="closeModal(\'apiAnahtarlarimModal\'); setTimeout(window.openApiEkle, 200);">➕ İlk API Anahtarını Ekle</button></div>';
            return;
        }
        var html = '';
        window.apiKeysCache.forEach(function (key) {
            var typeLabel = window.detectApiKeyType(key.name || '');
            html += `
                <div class="api-key-card" id="apiKeyCard_${key.id}">
                    <div class="api-key-name">
                        🔑 ${window.escapeHtml(key.name)}
                        ${typeLabel ? `<span class="api-key-type ${typeLabel.toLowerCase()}">${typeLabel}</span>` : ''}
                    </div>
                    <div class="api-key-value-wrap">
                        <div class="api-key-value" id="apiKeyValue_${key.id}">${window.escapeHtml(key.maskedValue || key.value || '••••••••')}</div>
                    </div>
                    <div class="api-key-actions">
                        <button class="btn-reveal" id="apiKeyRevealBtn_${key.id}" onclick="window.toggleApiKeyVisibility('${key.id}')">👁️ Göster</button>
                        <button onclick="window.copyApiKey('${key.id}')">📋 Kopyala</button>
                        <button onclick="window.editApiKey('${key.id}')">✏️ Düzenle</button>
                        <button class="btn-delete" onclick="window.deleteApiKey('${key.id}')">🗑️ Sil</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) {
        console.error('API anahtarları yüklenemedi:', e);
        container.innerHTML = '<div class="api-keys-empty">❌ Hata: ' + window.escapeHtml(e.message) + '</div>';
    }
};}catch(e){console.warn("[legacy] loadApiKeys",e);}
try{ if(typeof window.detectApiKeyType!=="function"||__OVER.indexOf("detectApiKeyType")>=0) window.detectApiKeyType=function (name) {
    var lower = (name || '').toLowerCase();
    if (lower.includes('openai') || lower.includes('gpt')) return 'OpenAI';
    if (lower.includes('anthropic') || lower.includes('claude')) return 'Anthropic';
    if (lower.includes('groq')) return 'Groq';
    if (lower.includes('deepseek') || lower.includes('deep')) return 'DeepSeek';
    if (lower.includes('gemini') || lower.includes('google')) return 'Gemini';
    if (lower.includes('openrouter') || lower.includes('router')) return 'OpenRouter';
    if (lower.includes('cohere')) return 'Cohere';
    if (lower.includes('cerebras')) return 'Cerebras';
    if (lower.includes('mistral')) return 'Mistral';
    if (lower.includes('perplexity')) return 'Perplexity';
    if (lower.includes('together')) return 'Together';
    if (lower.includes('fireworks')) return 'Fireworks';
    if (lower.includes('anyscale')) return 'Anyscale';
    if (lower.includes('deepinfra')) return 'DeepInfra';
    if (lower.includes('nvidia')) return 'NVIDIA';
    return '';
};}catch(e){console.warn("[legacy] detectApiKeyType",e);}
try{ if(typeof window.toggleApiKeyVisibility!=="function"||__OVER.indexOf("toggleApiKeyVisibility")>=0) window.toggleApiKeyVisibility=async function (keyId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var valueEl = document.getElementById('apiKeyValue_' + keyId);
    var btn = document.getElementById('apiKeyRevealBtn_' + keyId);
    if (!valueEl || !btn) return;
    var isRevealed = valueEl.classList.contains('revealed');
    if (isRevealed) {
        var keyData = window.apiKeysCache.find(function(k) { return k.id === keyId; });
        valueEl.textContent = keyData ? (keyData.maskedValue || '••••••••') : '••••••••';
        valueEl.classList.remove('revealed');
        btn.innerHTML = '👁️ Göster';
        btn.classList.remove('active');
        return;
    }
    try {
        btn.innerHTML = '⏳...';
        var result = await Parse.Cloud.run('getUserApiKeyValue', { keyId: keyId });
        if (result && result.success && result.value) {
            valueEl.textContent = result.value;
            valueEl.classList.add('revealed');
            btn.innerHTML = '🙈 Gizle';
            btn.classList.add('active');
        } else {
            showNotification('❌ Anahtar gösterilemedi: ' + (result.error || 'Şifre yanlış olabilir'), 'error');
            btn.innerHTML = '👁️ Göster';
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        btn.innerHTML = '👁️ Göster';
    }
};}catch(e){console.warn("[legacy] toggleApiKeyVisibility",e);}
try{ if(typeof window.copyApiKey!=="function"||__OVER.indexOf("copyApiKey")>=0) window.copyApiKey=async function (keyId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('getUserApiKeyValue', { keyId: keyId });
        if (result && result.success && result.value) {
            var value = result.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(value);
                showNotification('📋 API anahtarı kopyalandı!', 'success');
            } else {
                var textarea = document.createElement('textarea');
                textarea.value = value;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showNotification('📋 API anahtarı kopyalandı!', 'success');
            }
        } else {
            showNotification('❌ Kopyalanamadı: ' + (result.error || 'Şifre yanlış olabilir'), 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] copyApiKey",e);}
try{ if(typeof window.deleteApiKey!=="function"||__OVER.indexOf("deleteApiKey")>=0) window.deleteApiKey=async function (keyId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var keyData = window.apiKeysCache.find(function(k) { return k.id === keyId; });
    var keyName = keyData ? keyData.name : 'bu anahtarı';
    if (!confirm('"' + keyName + '" API anahtarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    try {
        var result = await Parse.Cloud.run('deleteUserApiKey', { keyId: keyId });
        if (result.success) {
            showNotification('🗑️ API anahtarı silindi.', 'success');
            window.addLogInfo('API anahtarı silindi');
            window.loadApiKeys();
            if (window.apiKeysCache.length === 0 && window.currentAIMode === 'custom') {
                window.switchToSiteAI();
            }
        } else {
            showNotification('❌ Silinemedi: ' + (result.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] deleteApiKey",e);}
try{ if(typeof window.editApiKey!=="function"||__OVER.indexOf("editApiKey")>=0) window.editApiKey=async function (keyId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var keyData = window.apiKeysCache.find(function(k) { return k.id === keyId; });
    if (!keyData) return showNotification('Anahtar bulunamadı!', 'error');
    var newName = prompt('Yeni sanal isim:', keyData.name || '');
    if (newName === null) return;
    if (!newName.trim()) return showNotification('İsim boş olamaz!', 'error');
    var changeValue = confirm('API anahtar değerini de değiştirmek ister misiniz?');
    var newValue = null;
    if (changeValue) {
        newValue = prompt('Yeni API anahtar değeri (boş bırakırsanız değişmez):', '');
        if (newValue === null) return;
        if (newValue.trim() === '') newValue = null;
    }
    try {
        var params = { keyId: keyId, name: newName.trim() };
        if (newValue) params.value = newValue.trim();
        var result = await Parse.Cloud.run('updateUserApiKey', params);
        if (result.success) {
            showNotification('✅ API anahtarı güncellendi.', 'success');
            window.loadApiKeys();
        } else {
            showNotification('❌ Güncellenemedi: ' + (result.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] editApiKey",e);}
try{ if(typeof window.setApiPassword!=="function"||__OVER.indexOf("setApiPassword")>=0) window.setApiPassword=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var pass1 = document.getElementById('apiCreatePassword');
    var pass2 = document.getElementById('apiCreatePassword2');
    if (!pass1 || !pass1.value) {
        pass1 = document.getElementById('apiSetPass');
        pass2 = document.getElementById('apiSetPass2');
    }
    if (!pass1 || !pass2) return showNotification('Şifre alanları bulunamadı!', 'error');
    var p1 = pass1.value;
    var p2 = pass2.value;
    if (!p1 || p1.length < 8) return showNotification('Şifre en az 8 karakter olmalı!', 'error');
    if (p1 !== p2) return showNotification('Şifreler eşleşmiyor!', 'error');
    try {
        var result = await Parse.Cloud.run('setApiPassword', { password: p1 });
        if (result.success) {
            showNotification('✅ API şifreniz belirlendi!', 'success');
            var createEl = document.getElementById('apiAnahtarlarimPasswordCreate');
            var verifyEl = document.getElementById('apiAnahtarlarimPasswordVerify');
            var listEl = document.getElementById('apiAnahtarlarimList');
            if (createEl) createEl.style.display = 'none';
            if (verifyEl) verifyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'block';
            window.apiKeysUnlocked = true;
            window.loadApiKeys();
        } else {
            showNotification('❌ Şifre belirlenemedi: ' + (result.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] setApiPassword",e);}
try{ if(typeof window.verifyApiPassword!=="function"||__OVER.indexOf("verifyApiPassword")>=0) window.verifyApiPassword=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var passEl = document.getElementById('apiVerifyPassword');
    if (!passEl || !passEl.value) {
        passEl = document.getElementById('apiEnterPass');
    }
    if (!passEl) return showNotification('Şifre alanı bulunamadı!', 'error');
    var password = passEl.value;
    if (!password) return showNotification('Şifre girin!', 'error');
    try {
        var result = await Parse.Cloud.run('verifyApiPassword', { password: password });
        if (result.success) {
            showNotification('✅ Şifre doğrulandı!', 'success');
            var createEl = document.getElementById('apiAnahtarlarimPasswordCreate');
            var verifyEl = document.getElementById('apiAnahtarlarimPasswordVerify');
            var listEl = document.getElementById('apiAnahtarlarimList');
            if (createEl) createEl.style.display = 'none';
            if (verifyEl) verifyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'block';
            window.apiKeysUnlocked = true;
            window.loadApiKeys();
        } else {
            showNotification('❌ ' + (result.error || 'Şifre yanlış!'), 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] verifyApiPassword",e);}
try{ if(typeof window.lockApiKeysPanel!=="function"||__OVER.indexOf("lockApiKeysPanel")>=0) window.lockApiKeysPanel=function () {
    window.apiKeysUnlocked = false;
    window.apiKeysCache = [];
    showNotification('🔒 API paneli kilitlendi.', 'success');
    var createEl = document.getElementById('apiAnahtarlarimPasswordCreate');
    var verifyEl = document.getElementById('apiAnahtarlarimPasswordVerify');
    var listEl = document.getElementById('apiAnahtarlarimList');
    if (createEl) createEl.style.display = 'none';
    if (verifyEl) verifyEl.style.display = 'flex';
    if (listEl) listEl.style.display = 'none';
};}catch(e){console.warn("[legacy] lockApiKeysPanel",e);}
try{ if(typeof window.openApiEkle!=="function"||__OVER.indexOf("openApiEkle")>=0) window.openApiEkle=function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var modal = document.getElementById('apiEkleModal');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
        var nameInput = document.getElementById('apiNameInput');
        var valueInput = document.getElementById('apiValueInput');
        if (nameInput) nameInput.value = '';
        if (valueInput) valueInput.value = '';
    }
};}catch(e){console.warn("[legacy] openApiEkle",e);}
try{ if(typeof window.openApiAnahtarlarim!=="function"||__OVER.indexOf("openApiAnahtarlarim")>=0) window.openApiAnahtarlarim=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var modal = document.getElementById('apiAnahtarlarimModal');
    if (!modal) return showNotification('API modali bulunamadı!', 'error');
    modal.classList.add('open');
    modal.style.display = 'flex';
    var passwordCreateEl = document.getElementById('apiAnahtarlarimPasswordCreate');
    var passwordVerifyEl = document.getElementById('apiAnahtarlarimPasswordVerify');
    var listEl = document.getElementById('apiAnahtarlarimList');
    if (passwordCreateEl) passwordCreateEl.style.display = 'none';
    if (passwordVerifyEl) passwordVerifyEl.style.display = 'none';
    if (listEl) listEl.style.display = 'none';
    try {
        var result = await Parse.Cloud.run('getUserApiKeys', {});
        var hasPassword = result && result.hasPassword;
        if (!hasPassword) {
            if (passwordCreateEl) passwordCreateEl.style.display = 'flex';
        } else {
            if (passwordVerifyEl) passwordVerifyEl.style.display = 'flex';
            var verifyInput = document.getElementById('apiVerifyPassword');
            if (verifyInput) verifyInput.value = '';
        }
    } catch (e) {
        if (passwordCreateEl) passwordCreateEl.style.display = 'flex';
    }
};}catch(e){console.warn("[legacy] openApiAnahtarlarim",e);}
function getA27ApiKeyLimitClient(user) {
    if (!user) return 0;
    var role = user.get('role');
    var plan = user.get('plan');
    if (role === 'founder' || role === 'admin' || role === 'beta' || role === 'moderator') return -1;
    if (plan === 'team') return 100;
    if (plan === 'pro') return 20;
    return 2;
}
if(typeof window.getA27ApiKeyLimitClient!=="function"||__OVER.indexOf("getA27ApiKeyLimitClient")>=0)window.getA27ApiKeyLimitClient=getA27ApiKeyLimitClient;
try{ if(typeof window.openA27ApiKeyGenerator!=="function"||__OVER.indexOf("openA27ApiKeyGenerator")>=0) window.openA27ApiKeyGenerator=function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var limit = getA27ApiKeyLimitClient(currentUser);
    if (limit === 0) return showNotification('Bu özellik size açık değil!', 'error');
    var modal = document.getElementById('a27ApiKeyGeneratorModal') || document.getElementById('v27ApiKeyGeneratorModal');
    if (!modal) return showNotification('A27 API modalı bulunamadı!', 'error');
    var nameEl = modal.querySelector('#v27KeyName') || document.getElementById('v27KeyName');
    var descEl = modal.querySelector('#v27KeyDesc') || document.getElementById('v27KeyDesc');
    var errEl = modal.querySelector('#v27CreateError') || document.getElementById('v27CreateError');
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    if (errEl) errEl.style.display = 'none';
    window._a27SelectedDuration = 'unlimited';
    window._v27SelectedDuration = 'unlimited';
    modal.querySelectorAll('.v27-duration-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-val') === 'unlimited');
        btn.onclick = function () {
            modal.querySelectorAll('.v27-duration-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            window._a27SelectedDuration = btn.getAttribute('data-val');
            window._v27SelectedDuration = btn.getAttribute('data-val');
        };
    });
    var limitInfo = modal.querySelector('#v27KeyLimitInfo') || document.getElementById('v27KeyLimitInfo');
    var role = currentUser.get('role');
    var plan = currentUser.get('plan');
    if (limitInfo) {
        if (role === 'founder') limitInfo.innerHTML = '👑 <strong style="color:var(--gold);">Kurucu:</strong> Sınırsız A27 API anahtarı oluşturabilirsiniz.';
        else if (role === 'admin') limitInfo.innerHTML = '⚙️ <strong style="color:var(--accent);">Admin:</strong> Sınırsız A27 API anahtarı oluşturabilirsiniz.';
        else if (role === 'beta') limitInfo.innerHTML = '🔬 <strong style="color:var(--purple);">Beta:</strong> Sınırsız A27 API anahtarı oluşturabilirsiniz.';
        else if (role === 'moderator') limitInfo.innerHTML = '🎨 <strong style="color:var(--moderator);">Moderatör:</strong> Sınırsız A27 API anahtarı oluşturabilirsiniz.';
        else if (plan === 'team') limitInfo.innerHTML = '👥 <strong style="color:var(--accent);">Takım Paketi:</strong> En fazla 100 A27 API anahtarı oluşturabilirsiniz.';
        else if (plan === 'pro') limitInfo.innerHTML = '🌟 <strong style="color:var(--gold);">Pro Paket:</strong> En fazla 20 A27 API anahtarı oluşturabilirsiniz.';
        else limitInfo.innerHTML = '🆓 <strong style="color:var(--accent2);">Ücretsiz Üye:</strong> En fazla 2 A27 API anahtarı oluşturabilirsiniz.';
    }
    modal.classList.add('open');
    modal.style.display = 'flex';
    setTimeout(function () { if (nameEl) nameEl.focus(); }, 200);
};}catch(e){console.warn("[legacy] openA27ApiKeyGenerator",e);}
try{ if(typeof window.openV27ApiKeyGenerator==="undefined") window.openV27ApiKeyGenerator=window.openA27ApiKeyGenerator;}catch(e){console.warn("[legacy] openV27ApiKeyGenerator",e);}
try{ if(typeof window.createA27ApiKey!=="function"||__OVER.indexOf("createA27ApiKey")>=0) window.createA27ApiKey=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var nameEl = document.getElementById('v27KeyName') || document.getElementById('a27KeyName');
    var descEl = document.getElementById('v27KeyDesc') || document.getElementById('a27KeyDesc');
    var errEl = document.getElementById('v27CreateError') || document.getElementById('a27CreateError');
    var keyName = nameEl ? nameEl.value.trim() : '';
    var keyDesc = descEl ? descEl.value.trim() : '';
    function showErr(msg) {
        if (errEl) { errEl.textContent = '❌ ' + msg; errEl.style.display = 'block'; }
        showNotification('❌ ' + msg, 'error');
    }
    if (errEl) errEl.style.display = 'none';
    if (!keyName) return showErr('Anahtar adı zorunludur!');
    if (keyName.length < 2) return showErr('Anahtar adı en az 2 karakter olmalı!');
    if (keyName.length > 50) return showErr('Anahtar adı en fazla 50 karakter olabilir!');
    if (keyDesc.length > 150) return showErr('Açıklama en fazla 150 karakter olabilir!');
    var limit = getA27ApiKeyLimitClient(currentUser);
    if (limit !== -1) {
        try {
            var existingResult = await Parse.Cloud.run('getMyV27ApiKeys', {});
            var activeCount = 0;
            if (existingResult && existingResult.keys) {
                existingResult.keys.forEach(function (k) { if (k.is_active) activeCount++; });
            }
            if (activeCount >= limit) return showErr('Maksimum ' + limit + ' aktif A27 API anahtarı limitine ulaştınız. Kullanılmayanları iptal edin.');
        } catch (e) { console.warn('Limit kontrolü yapılamadı:', e); }
    }
    try {
        var result = await Parse.Cloud.run('createV27ApiKey', {
            keyName: keyName,
            keyDescription: keyDesc,
            duration: window._a27SelectedDuration || 'unlimited'
        });
        if (!result.success) return showErr(result.error || 'Anahtar oluşturulamadı.');
        window._a27LastKey = result.plainKey;
        window._v27LastKey = result.plainKey;
        var genModal = document.getElementById('v27ApiKeyGeneratorModal') || document.getElementById('a27ApiKeyGeneratorModal');
        if (genModal) { genModal.classList.remove('open'); genModal.style.display = 'none'; }
        var revealOverlay = document.getElementById('a27KeyRevealOverlay') || document.getElementById('v27KeyRevealOverlay');
        if (revealOverlay) {
            var keyDisp = revealOverlay.querySelector('#v27RevealKeyValue') || revealOverlay.querySelector('#a27RevealKeyValue');
            if (keyDisp) keyDisp.textContent = result.plainKey;
            window._v27RevealKey = result.plainKey;
            window._a27RevealKey = result.plainKey;
            revealOverlay.classList.add('open');
            revealOverlay.style.display = 'flex';
        } else {
            var createdModal = document.getElementById('a27ApiKeyCreatedModal') || document.getElementById('v27ApiKeyCreatedModal');
            var keyDisplay = document.getElementById('a27NewKeyValue') || document.getElementById('v27NewKeyValue');
            if (keyDisplay) keyDisplay.textContent = result.plainKey;
            if (createdModal) { createdModal.classList.add('open'); createdModal.style.display = 'flex'; }
        }
        var durationLabel = result.durationLabel || 'Süresiz';
        showNotification('✅ A27 API anahtarı oluşturuldu! (' + durationLabel + ')', 'success');
        window.addLogSuccess('A27 API anahtarı oluşturuldu: ' + keyName);
    } catch (e) {
        console.error('createA27ApiKey hatası:', e);
        showErr(e.message || 'Bilinmeyen hata');
        window.addLogError('A27 API anahtarı hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] createA27ApiKey",e);}
try{ if(typeof window.createV27ApiKey==="undefined") window.createV27ApiKey=window.createA27ApiKey;}catch(e){console.warn("[legacy] createV27ApiKey",e);}
try{ if(typeof window.copyA27ApiKey!=="function"||__OVER.indexOf("copyA27ApiKey")>=0) window.copyA27ApiKey=function () {
    var key = window._a27LastKey || window._v27LastKey;
    if (!key) return showNotification('Kopyalanacak anahtar yok!', 'error');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(key).then(function () {
            showNotification('📋 A27 API anahtarı kopyalandı!', 'success');
        }).catch(function () { window._fallbackCopyA27(key); });
    } else {
        window._fallbackCopyA27(key);
    }
};}catch(e){console.warn("[legacy] copyA27ApiKey",e);}
try{ if(typeof window.copyV27ApiKey==="undefined") window.copyV27ApiKey=window.copyA27ApiKey;}catch(e){console.warn("[legacy] copyV27ApiKey",e);}
try{ if(typeof window._fallbackCopyA27!=="function"||__OVER.indexOf("_fallbackCopyA27")>=0) window._fallbackCopyA27=function (text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showNotification('📋 A27 API anahtarı kopyalandı!', 'success');
    } catch (e) {
        showNotification('Kopyalanamadı, lütfen manuel seçip kopyalayın.', 'warning');
    }
    document.body.removeChild(ta);
};}catch(e){console.warn("[legacy] _fallbackCopyA27",e);}
try{ if(typeof window._fallbackCopyV27==="undefined") window._fallbackCopyV27=window._fallbackCopyA27;}catch(e){console.warn("[legacy] _fallbackCopyV27",e);}
try{ if(typeof window.loadMyAethrionApiKeys!=="function"||__OVER.indexOf("loadMyAethrionApiKeys")>=0) window.loadMyAethrionApiKeys=async function () {
    if (!currentUser) return;
    var limit = getA27ApiKeyLimitClient(currentUser);
    if (limit === 0) {
        var section0 = document.getElementById('v27ApiKeySection') || document.getElementById('a27ApiKeySection');
        if (section0) section0.style.display = 'none';
        return;
    }
    var section = document.getElementById('a27ApiKeySection') || document.getElementById('v27ApiKeySection');
    if (!section) return;
    section.style.display = 'block';

    var limitInfoEl = document.getElementById('a27ApiLimitInfo') || document.getElementById('v27ApiLimitInfo');
    var role = currentUser.get('role');
    var plan = currentUser.get('plan');
    if (limitInfoEl) {
        var limitText = '';
        if (role === 'founder') limitText = '👑 <strong>Kurucu:</strong> Sınırsız A27 API anahtarı.';
        else if (role === 'admin') limitText = '⚙️ <strong>Admin:</strong> Sınırsız A27 API anahtarı.';
        else if (role === 'beta') limitText = '🔬 <strong>Beta:</strong> Sınırsız A27 API anahtarı.';
        else if (role === 'moderator') limitText = '🎨 <strong>Moderatör:</strong> Sınırsız A27 API anahtarı.';
        else if (plan === 'team') limitText = '👥 <strong>Takım Paketi:</strong> En fazla 100 A27 API anahtarı.';
        else if (plan === 'pro') limitText = '🌟 <strong>Pro Paket:</strong> En fazla 20 A27 API anahtarı.';
        else limitText = '🆓 <strong>Ücretsiz Üye:</strong> En fazla 2 A27 API anahtarı oluşturabilirsiniz.';
        limitInfoEl.innerHTML = limitText + ' Anahtarınızı <code style="background:rgba(212,175,55,0.15); padding:2px 6px; border-radius:4px; color:var(--accent2); font-family:var(--font-code);">X-A27-Api-Key</code> başlığıyla veya <code style="background:rgba(212,175,55,0.15); padding:2px 6px; border-radius:4px; color:var(--accent2); font-family:var(--font-code);">apiKey</code> parametresi olarak gönderin.';
    }

    var listEl = document.getElementById('myVizyonApiKeyList') || document.getElementById('myAethrionApiKeyList');
    if (!listEl) return;
    listEl.innerHTML = '<div style="color:var(--text3);text-align:center;padding:12px;font-size:13px;">⏳ Yükleniyor...</div>';

    try {
        var result = await Parse.Cloud.run('getMyV27ApiKeys', {});
        if (!result || !result.keys || result.keys.length === 0) {
            listEl.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px;font-size:13px;">🔑 Henüz A27 API anahtarınız yok. Yukarıdaki butondan oluşturun.</div>';
            return;
        }
        var html = '';
        var activeCount = 0;
        result.keys.forEach(function (k) {
            if (k.is_active) activeCount++;
            var statusClass = k.is_active ? 'v27-status-active' : 'v27-status-expired';
            var statusText = k.is_active ? '✅ Aktif' : '❌ Süresi Doldu';
            var expText = '';
            if (k.expires_at) {
                var exp = new Date(k.expires_at);
                expText = exp.toLocaleDateString('tr-TR');
            } else {
                expText = 'Süresiz';
            }
            html += '<div class="v27-api-key-card a27-api-key-card">';
            html += '<div style="flex:1; min-width:0;">';
            html += '<div class="v27-name a27-name">🔑 ' + window.escapeHtml(k.key_name) + '</div>';
            if (k.key_description) html += '<div style="font-size:11px; color:var(--text3); margin-top:2px;">' + window.escapeHtml(k.key_description) + '</div>';
            html += '<div class="v27-duration a27-duration">⏱️ ' + window.escapeHtml(k.durationLabel || 'Süresiz') + ' · Bitiş: ' + expText + '</div>';
            html += '</div>';
            html += '<div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">';
            html += '<div class="v27-masked a27-masked">' + window.escapeHtml(k.key_masked) + '</div>';
            html += '<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">';
            html += '<span class="v27-status a27-status ' + statusClass + '">' + statusText + '</span>';
            if (k.is_active) html += '<button class="btn-danger btn-sm" onclick="window.revokeA27ApiKeyConfirm(\'' + k.id + '\')" style="font-size:10px;padding:3px 10px; border-radius:20px;">🗑️ İptal</button>';
            html += '</div></div></div>';
        });
        listEl.innerHTML = html;

        if (limit !== -1 && activeCount >= limit) {
            var createBtn = document.querySelector('.v27-api-btn-create') || document.querySelector('.a27-api-btn-create');
            if (createBtn) {
                createBtn.disabled = true;
                createBtn.style.opacity = '0.5';
                createBtn.style.cursor = 'not-allowed';
                createBtn.textContent = '🔒 Limit Doldu (' + activeCount + '/' + limit + ')';
            }
        } else {
            var createBtn2 = document.querySelector('.v27-api-btn-create') || document.querySelector('.a27-api-btn-create');
            if (createBtn2) {
                createBtn2.disabled = false;
                createBtn2.style.opacity = '1';
                createBtn2.style.cursor = 'pointer';
                if (limit === -1) createBtn2.textContent = '🔑 A27 API Anahtarını Al';
                else createBtn2.textContent = '🔑 Yeni A27 API Anahtarı Oluştur (' + activeCount + '/' + limit + ')';
            }
        }
    } catch (e) {
        console.error('A27 API listesi yüklenemedi:', e);
        listEl.innerHTML = '<div style="color:var(--danger);text-align:center;padding:12px;font-size:13px;">⚠️ Yüklenemedi: ' + window.escapeHtml(e.message) + '</div>';
    }
};}catch(e){console.warn("[legacy] loadMyAethrionApiKeys",e);}
try{ if(typeof window.loadMyVizyonApiKeys==="undefined") window.loadMyVizyonApiKeys=window.loadMyAethrionApiKeys;}catch(e){console.warn("[legacy] loadMyVizyonApiKeys",e);}
try{ if(typeof window.revokeA27ApiKeyConfirm!=="function"||__OVER.indexOf("revokeA27ApiKeyConfirm")>=0) window.revokeA27ApiKeyConfirm=async function (keyId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!keyId) return showNotification('Anahtar ID gerekli!', 'error');
    if (!confirm('Bu A27 API anahtarını iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    try {
        var result = await Parse.Cloud.run('revokeV27ApiKey', { keyId: keyId });
        if (result.success) {
            showNotification('✅ ' + (result.message || 'Anahtar iptal edildi.'), 'success');
            window.addLogInfo('A27 API anahtarı iptal edildi');
            window.loadMyAethrionApiKeys();
        } else {
            showNotification('❌ ' + (result.error || 'İptal edilemedi.'), 'error');
        }
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] revokeA27ApiKeyConfirm",e);}
try{ if(typeof window.revokeV27ApiKeyConfirm==="undefined") window.revokeV27ApiKeyConfirm=window.revokeA27ApiKeyConfirm;}catch(e){console.warn("[legacy] revokeV27ApiKeyConfirm",e);}
try{ if(typeof window.apiKeySelectionMode==="undefined") window.apiKeySelectionMode=null;}catch(e){console.warn("[legacy] apiKeySelectionMode",e);}
try{ if(typeof window.selectedApiKeyIds==="undefined") window.selectedApiKeyIds=[];}catch(e){console.warn("[legacy] selectedApiKeyIds",e);}
try{ if(typeof window.customAIKeyIds==="undefined") window.customAIKeyIds=null;}catch(e){console.warn("[legacy] customAIKeyIds",e);}
try{ if(typeof window.openApiKeySelectionModal!=="function"||__OVER.indexOf("openApiKeySelectionModal")>=0) window.openApiKeySelectionModal=function () {
    if (!currentUser) { showNotification('Bu özelliği kullanmak için giriş yapmalısınız!', 'error'); return; }
    var stage1 = document.getElementById('apiKeySelectionStage1');
    var stage2 = document.getElementById('apiKeySelectionStage2');
    if (stage1) stage1.style.display = 'block';
    if (stage2) stage2.style.display = 'none';
    window.selectedApiKeyIds = [];
    window.apiKeySelectionMode = null;
    var modal = document.getElementById('apiKeySelectionModal');
    if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; }
};}catch(e){console.warn("[legacy] openApiKeySelectionModal",e);}
try{ if(typeof window.closeApiKeySelectionModal!=="function"||__OVER.indexOf("closeApiKeySelectionModal")>=0) window.closeApiKeySelectionModal=function () {
    var modal = document.getElementById('apiKeySelectionModal');
    if (modal) { modal.classList.remove('open'); modal.style.display = ''; }
};}catch(e){console.warn("[legacy] closeApiKeySelectionModal",e);}
try{ if(typeof window.backToApiKeySelectionStage1!=="function"||__OVER.indexOf("backToApiKeySelectionStage1")>=0) window.backToApiKeySelectionStage1=function () {
    var stage1 = document.getElementById('apiKeySelectionStage1');
    var stage2 = document.getElementById('apiKeySelectionStage2');
    if (stage1) stage1.style.display = 'block';
    if (stage2) stage2.style.display = 'none';
};}catch(e){console.warn("[legacy] backToApiKeySelectionStage1",e);}
try{ if(typeof window.useAllApiKeys!=="function"||__OVER.indexOf("useAllApiKeys")>=0) window.useAllApiKeys=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('getUserApiKeys', {});
        if (!result || !result.success || !result.apiKeys || result.apiKeys.length === 0) {
            showNotification('⚠️ Önce bir API anahtarı eklemelisiniz!', 'warning');
            return;
        }
        window.currentAIMode = 'custom';
        window.customAIMode = 'all';
        window.customAIKeyIds = 'all';
        var btnSite = document.getElementById('btnSiteAI');
        var btnCustom = document.getElementById('btnCustomAI');
        var status = document.getElementById('apiModeStatus');
        if (btnSite) btnSite.classList.remove('active');
        if (btnCustom) btnCustom.classList.add('active');
        if (status) status.innerHTML = 'Aktif mod: <span style="color:var(--accent); font-weight:700;">🔑 Tüm API Anahtarlarım</span> (' + result.apiKeys.length + ' anahtar sırayla denenecek)';
        showNotification('🔑 Tüm API anahtarları moduna geçildi (' + result.apiKeys.length + ' anahtar)', 'success');
        window.closeApiKeySelectionModal();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] useAllApiKeys",e);}
try{ if(typeof window.showApiKeySelector!=="function"||__OVER.indexOf("showApiKeySelector")>=0) window.showApiKeySelector=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var stage1 = document.getElementById('apiKeySelectionStage1');
    var stage2 = document.getElementById('apiKeySelectionStage2');
    var listContainer = document.getElementById('apiKeySelectionList');
    var countEl = document.getElementById('apiKeySelectionCount');
    if (!listContainer) return;
    if (stage1) stage1.style.display = 'none';
    if (stage2) stage2.style.display = 'block';
    listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text3); font-size:12px;">⏳ Yükleniyor...</div>';
    try {
        var result = await Parse.Cloud.run('getUserApiKeys', {});
        if (!result || !result.success || !result.apiKeys || result.apiKeys.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text3); font-size:13px;">📭 Henüz API anahtarınız yok.<br><br>Lütfen önce "API Ekle" butonundan bir anahtar ekleyin.</div>';
            if (countEl) countEl.textContent = '0 anahtar';
            return;
        }
        window.selectedApiKeyIds = [];
        var html = '';
        result.apiKeys.forEach(function (key) {
            var keyType = window.detectApiKeyType(key.name || '');
            html += '<label style="display:flex; align-items:center; gap:12px; padding:12px 14px; margin-bottom:6px; background:var(--bg); border:1px solid var(--border); border-radius:12px; cursor:pointer; transition:border-color 0.15s ease;" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border)\'">';
            html += '<input type="checkbox" class="api-key-checkbox" data-key-id="' + key.id + '" onchange="window.updateSelectedApiKeyCount()" style="width:20px; height:20px; accent-color:var(--accent); cursor:pointer;">';
            html += '<div style="flex:1; min-width:0;">';
            html += '<div style="font-weight:600; color:var(--text); font-size:14px; word-break:break-word;">🔑 ' + window.escapeHtml(key.name) + '</div>';
            html += '<div style="font-size:11px; color:var(--text3); margin-top:2px;">';
            if (keyType) html += '<span style="color:var(--accent); font-weight:600;">' + keyType + '</span> · ';
            html += '🔒 Değer gizli';
            html += '</div></div></label>';
        });
        listContainer.innerHTML = html;
        window.updateSelectedApiKeyCount();
    } catch (e) {
        listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:var(--danger); font-size:12px;">❌ Yüklenemedi: ' + window.escapeHtml(e.message) + '</div>';
    }
};}catch(e){console.warn("[legacy] showApiKeySelector",e);}
try{ if(typeof window.toggleSelectAllApiKeys!=="function"||__OVER.indexOf("toggleSelectAllApiKeys")>=0) window.toggleSelectAllApiKeys=function () {
    var checkboxes = document.querySelectorAll('.api-key-checkbox');
    if (!checkboxes.length) return;
    var allChecked = true;
    checkboxes.forEach(function (cb) { if (!cb.checked) allChecked = false; });
    checkboxes.forEach(function (cb) { cb.checked = !allChecked; });
    window.updateSelectedApiKeyCount();
};}catch(e){console.warn("[legacy] toggleSelectAllApiKeys",e);}
try{ if(typeof window.updateSelectedApiKeyCount!=="function"||__OVER.indexOf("updateSelectedApiKeyCount")>=0) window.updateSelectedApiKeyCount=function () {
    var checkboxes = document.querySelectorAll('.api-key-checkbox');
    var selected = [];
    checkboxes.forEach(function (cb) { if (cb.checked) selected.push(cb.getAttribute('data-key-id')); });
    window.selectedApiKeyIds = selected;
    var countEl = document.getElementById('apiKeySelectionCount');
    if (countEl) {
        if (selected.length === 0) { countEl.textContent = '0 anahtar seçildi'; countEl.style.color = 'var(--text3)'; }
        else { countEl.textContent = '✅ ' + selected.length + ' anahtar seçildi (sırayla denenecek)'; countEl.style.color = 'var(--accent2)'; }
    }
};}catch(e){console.warn("[legacy] updateSelectedApiKeyCount",e);}
try{ if(typeof window.confirmSelectedApiKeys!=="function"||__OVER.indexOf("confirmSelectedApiKeys")>=0) window.confirmSelectedApiKeys=function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var checkboxes = document.querySelectorAll('.api-key-checkbox');
    var selected = [];
    checkboxes.forEach(function (cb) { if (cb.checked) selected.push(cb.getAttribute('data-key-id')); });
    if (selected.length === 0) { showNotification('⚠️ Lütfen en az bir anahtar seçin!', 'warning'); return; }
    window.currentAIMode = 'custom';
    window.customAIMode = 'selected';
    window.customAIKeyIds = selected;
    var btnSite = document.getElementById('btnSiteAI');
    var btnCustom = document.getElementById('btnCustomAI');
    var status = document.getElementById('apiModeStatus');
    if (btnSite) btnSite.classList.remove('active');
    if (btnCustom) btnCustom.classList.add('active');
    if (status) status.innerHTML = 'Aktif mod: <span style="color:var(--accent); font-weight:700;">🔑 Seçili API Anahtarlarım</span> (' + selected.length + ' anahtar sırayla denenecek)';
    showNotification('🔑 ' + selected.length + ' seçili anahtarla devam ediliyor', 'success');
    window.closeApiKeySelectionModal();
};}catch(e){console.warn("[legacy] confirmSelectedApiKeys",e);}
try{ if(typeof window.switchToCustomAI!=="function"||__OVER.indexOf("switchToCustomAI")>=0) window.switchToCustomAI=function () {
    window.openApiKeySelectionModal();
};}catch(e){console.warn("[legacy] switchToCustomAI",e);}
try{ if(typeof window.loadInbox!=="function"||__OVER.indexOf("loadInbox")>=0) window.loadInbox=async function () {
    if (!currentUser) return;
    var container = document.getElementById('inboxList');
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text3);padding:8px;text-align:center;font-size:12px;">⏳ Yükleniyor...</div>';
    var items = null;
    try { items = await Parse.Cloud.run('getInboxItems', {}); }
    catch (e) { console.warn('getInboxItems fallback:', e.message); items = null; }
    if (!items) {
        try {
            var Inbox = Parse.Object.extend('Inbox');
            var query = new Parse.Query(Inbox);
            query.equalTo('receiver_email', currentUser.get('email'));
            query.descending('createdAt');
            query.limit(100);
            var results = await query.find();
            items = results.map(function (obj) {
                return {
                    id: obj.id,
                    sender_email: obj.get('sender_email') || 'Sistem',
                    type: obj.get('type') || 'notification',
                    message: obj.get('message') || '',
                    status: obj.get('status') || '',
                    request_id: obj.get('request_id') || '',
                    team_id: obj.get('team_id') || '',
                    team_name: obj.get('team_name') || '',
                    project_id: obj.get('project_id') || '',
                    project_title: obj.get('project_title') || '',
                    role: obj.get('role') || '',
                    package_type: obj.get('package_type') || '',
                    created_at: obj.get('createdAt') ? obj.get('createdAt').toISOString() : new Date().toISOString()
                };
            });
        } catch (e) {
            console.error('Gelen kutusu fallback hatası:', e);
            container.innerHTML = '<div class="inbox-item" style="border-left-color:var(--danger);">⚠️ Gelen kutusu yüklenemedi.</div>';
            return;
        }
    }
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="inbox-item" style="border-left-color:var(--border2);">📭 Gelen kutunuz boş.</div>';
        return;
    }
    var html = '';
    items.forEach(function (item) {
        var type = item.type || 'notification';
        var msg = item.message || '';
        var sender = item.sender_email || 'Sistem';
        var status = item.status || '';
        var requestId = item.request_id || '';
        var id = item.id;
        var timeStr = '';
        try { timeStr = new Date(item.created_at || item.createdAt).toLocaleString('tr-TR'); } catch (e) {}
        html += '<div class="inbox-item">';
        html += '<div class="inbox-sender">' + window.escapeHtml(sender) + ' · ' + window.escapeHtml(timeStr) + '</div>';
        html += '<div class="inbox-message">' + window.escapeHtml(msg) + '</div>';
        if (type === 'team_invite' && status === 'pending') {
            html += '<div class="inbox-actions">';
            html += '<button class="btn-primary btn-sm" onclick="window.acceptTeamInvite(\'' + window.escapeForOnclick(item.team_id) + '\', \'' + window.escapeForOnclick(id) + '\')">✅ Kabul Et</button>';
            html += '<button class="btn-secondary btn-sm" onclick="window.rejectTeamInvite(\'' + window.escapeForOnclick(id) + '\')">❌ Reddet</button>';
            html += '</div>';
        } else if (type === 'gift_request' && status === 'pending') {
            html += '<div class="inbox-actions">';
            html += '<button class="btn-primary btn-sm" onclick="window.handleRequest(\'' + window.escapeForOnclick(requestId) + '\', \'accept\')">🎁 Kabul Et</button>';
            html += '<button class="btn-secondary btn-sm" onclick="window.handleRequest(\'' + window.escapeForOnclick(requestId) + '\', \'reject\')">❌ Reddet</button>';
            html += '</div>';
        } else if (type === 'role_request' && status === 'pending') {
            html += '<div class="inbox-actions">';
            html += '<button class="btn-primary btn-sm" onclick="window.handleRequest(\'' + window.escapeForOnclick(requestId) + '\', \'accept\')">✅ Kabul Et</button>';
            html += '<button class="btn-secondary btn-sm" onclick="window.handleRequest(\'' + window.escapeForOnclick(requestId) + '\', \'reject\')">❌ Reddet</button>';
            html += '</div>';
        } else if (type === 'project_request' && status === 'pending') {
            html += '<div class="inbox-actions">';
            html += '<button class="btn-primary btn-sm" onclick="window.acceptProjectRequest(\'' + window.escapeForOnclick(requestId) + '\')">✅ Kabul</button>';
            html += '<button class="btn-secondary btn-sm" onclick="window.delegateProjectRequest(\'' + window.escapeForOnclick(requestId) + '\')">➡️ Devret</button>';
            html += '<button class="btn-danger btn-sm" onclick="window.rejectProjectRequest(\'' + window.escapeForOnclick(requestId) + '\')">❌ Reddet</button>';
            html += '</div>';
        } else if (type === 'project_completed' && status === 'done') {
            html += '<div class="inbox-actions">';
            html += '<button class="btn-primary btn-sm" onclick="window.acceptProjectCompletion(\'' + window.escapeForOnclick(id) + '\')">📥 Projeyi Al</button>';
            html += '<button class="btn-danger btn-sm" onclick="window.rejectProjectCompletion(\'' + window.escapeForOnclick(id) + '\')">❌ Reddet</button>';
            html += '</div>';
        } else if (type === 'contest_winner') {
            html += '<div class="inbox-actions" style="color:var(--gold); font-weight:600;">🏆 Tebrikler! Yarışma kazananı oldunuz!</div>';
        } else if (type === 'founder_contact' || type === 'referral_request') {
            html += '<div class="inbox-actions" style="color:var(--accent); font-size:11px;">📩 Kurucu talebi</div>';
        } else if (type === 'job_accepted') {
            html += '<div class="inbox-actions" style="color:var(--gold); font-size:11px;">💼 İş ilanı bildirimi</div>';
        }
        html += '</div>';
    });
    container.innerHTML = html;
};}catch(e){console.warn("[legacy] loadInbox",e);}
try{ if(typeof window.updateCommentUI!=="function"||__OVER.indexOf("updateCommentUI")>=0) window.updateCommentUI=function () {
    var form = document.getElementById('commentForm');
    var loginMsg = document.getElementById('commentLoginMessage');
    var nameEl = document.getElementById('commentUserName');
    var roleEl = document.getElementById('commentUserRole');
    if (currentUser) {
        if (form) form.style.display = 'block';
        if (loginMsg) loginMsg.style.display = 'none';
        if (nameEl) nameEl.textContent = currentUser.get('name') || 'Kullanıcı';
        if (roleEl) {
            var role = currentUser.get('role') || 'user';
            var roleLabel = role === 'founder' ? '👑 KURUCU' :
                            role === 'admin' ? '⚙️ ADMIN' :
                            role === 'beta' ? '🔬 BETA' :
                            role === 'moderator' ? '🎨 MODERATÖR' : '👤 KULLANICI';
            roleEl.textContent = roleLabel;
            roleEl.className = 'role-badge ' + role;
        }
    } else {
        if (form) form.style.display = 'none';
        if (loginMsg) loginMsg.style.display = 'block';
    }
};}catch(e){console.warn("[legacy] updateCommentUI",e);}
try{ if(typeof window.quickAssignModerator!=="function"||__OVER.indexOf("quickAssignModerator")>=0) window.quickAssignModerator=async function (email) {
    if (!currentUser || currentUser.get('role') !== 'founder') return showNotification('Sadece kurucu moderatör atayabilir!', 'error');
    if (!email) return showNotification('E-posta gerekli!', 'error');
    if (!confirm(email + ' adlı kullanıcıyı Moderatör yapmak istediğinize emin misiniz?')) return;
    try {
        await Parse.Cloud.run('assignModeratorByEmail', { email: email.toLowerCase() });
        showNotification('✅ ' + email + ' moderatör yapıldı!', 'success');
        window.loadUserList();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] quickAssignModerator",e);}
try{ if(typeof window.assignAdminEmail!=="function"||__OVER.indexOf("assignAdminEmail")>=0) window.assignAdminEmail=async function (email) {
    if (!email) return showNotification('E-posta gerekli!', 'error');
    if (!confirm(email + ' adlı kullanıcıyı admin yapmak istiyor musunuz?')) return;
    try {
        await Parse.Cloud.run('assignAdmin', { email: email });
        showNotification('✅ ' + email + ' admin yapıldı!', 'success');
        window.loadUserList();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] assignAdminEmail",e);}
try{ if(typeof window.setUserRole!=="function"||__OVER.indexOf("setUserRole")>=0) window.setUserRole=async function (email, role) {
    if (!email || !role) return;
    if (!confirm(email + ' rolünü "' + role + '" yapmak istiyor musunuz?')) return;
    try {
        await Parse.Cloud.run('setUserRole', { email: email, role: role });
        showNotification('✅ Rol güncellendi!', 'success');
        window.loadUserList();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] setUserRole",e);}
try{ if(typeof window.banUserEmail!=="function"||__OVER.indexOf("banUserEmail")>=0) window.banUserEmail=async function (email) {
    if (!email) return showNotification('E-posta gerekli!', 'error');
    if (!confirm(email + ' adlı kullanıcıyı yasaklamak istiyor musunuz?')) return;
    try {
        await Parse.Cloud.run('banUser', { targetEmail: email });
        showNotification('✅ ' + email + ' yasaklandı!', 'success');
        window.loadUserList();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] banUserEmail",e);}
try{ if(typeof window.unbanUserEmail!=="function"||__OVER.indexOf("unbanUserEmail")>=0) window.unbanUserEmail=async function (email) {
    if (!email) return showNotification('E-posta gerekli!', 'error');
    try {
        await Parse.Cloud.run('unbanUser', { targetEmail: email });
        showNotification('✅ ' + email + ' yasağı kaldırıldı!', 'success');
        window.loadUserList();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] unbanUserEmail",e);}
try{ if(typeof window.giftUserEmail!=="function"||__OVER.indexOf("giftUserEmail")>=0) window.giftUserEmail=async function (email, pkg) {
    if (!email) return showNotification('E-posta gerekli!', 'error');
    try {
        await Parse.Cloud.run('sendGiftRequest', { email: email, packageType: pkg || 'pro' });
        showNotification('✅ Hediye teklifi gönderildi!', 'success');
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] giftUserEmail",e);}
try{ if(typeof window.sendGiftByEmail!=="function"||__OVER.indexOf("sendGiftByEmail")>=0) window.sendGiftByEmail=async function () {
    var input = document.getElementById('giftEmailInput');
    var select = document.getElementById('giftPackageSelect');
    if (!input || !input.value) return showNotification('E-posta girin!', 'error');
    await window.giftUserEmail(input.value.trim(), select ? select.value : 'pro');
    input.value = '';
};}catch(e){console.warn("[legacy] sendGiftByEmail",e);}
try{ if(typeof window.assignBetaByEmail!=="function"||__OVER.indexOf("assignBetaByEmail")>=0) window.assignBetaByEmail=async function () {
    var input = document.getElementById('betaEmailInput');
    if (!input || !input.value) return showNotification('E-posta girin!', 'error');
    try {
        await Parse.Cloud.run('sendRoleRequest', { email: input.value.trim(), role: 'beta' });
        showNotification('✅ Beta teklifi gönderildi!', 'success');
        input.value = '';
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] assignBetaByEmail",e);}
try{ if(typeof window.assignAdminByEmail!=="function"||__OVER.indexOf("assignAdminByEmail")>=0) window.assignAdminByEmail=async function () {
    var input = document.getElementById('adminEmailInput');
    if (!input || !input.value) return showNotification('E-posta girin!', 'error');
    try {
        await Parse.Cloud.run('sendRoleRequest', { email: input.value.trim(), role: 'admin' });
        showNotification('✅ Admin teklifi gönderildi!', 'success');
        input.value = '';
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] assignAdminByEmail",e);}
try{ if(typeof window.showBannedList!=="function"||__OVER.indexOf("showBannedList")>=0) window.showBannedList=async function () {
    try {
        var result = await Parse.Cloud.run('getBannedUsers', {});
        if (!result || result.length === 0) return showNotification('📭 Yasaklı kullanıcı yok.', 'success');
        alert('🚫 Yasaklı Kullanıcılar:\n\n' + result.map(function(u) { return '📧 ' + u.email + ' (' + u.name + ')'; }).join('\n'));
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] showBannedList",e);}
try{ if(typeof window.showBetasList!=="function"||__OVER.indexOf("showBetasList")>=0) window.showBetasList=async function () {
    try {
        var result = await Parse.Cloud.run('getBetas', {});
        if (!result || result.length === 0) return showNotification('📭 Hiç beta yok.', 'success');
        alert('🔬 Beta Kullanıcılar:\n\n' + result.map(function(u) { return '📧 ' + u.email + ' (' + u.name + ')'; }).join('\n'));
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] showBetasList",e);}
try{ if(typeof window.showAdminsList!=="function"||__OVER.indexOf("showAdminsList")>=0) window.showAdminsList=async function () {
    try {
        var result = await Parse.Cloud.run('getAdmins', {});
        if (!result || result.length === 0) return showNotification('📭 Hiç admin yok.', 'success');
        alert('👑 Adminler:\n\n' + result.map(function(u) { return '📧 ' + u.email + ' (' + u.name + ')'; }).join('\n'));
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] showAdminsList",e);}
try{ if(typeof window.showModeratorsList!=="function"||__OVER.indexOf("showModeratorsList")>=0) window.showModeratorsList=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (currentUser.get('role') !== 'founder') return showNotification('Bu liste sadece kurucuya aittir!', 'error');
    try {
        var result = await Parse.Cloud.run('getModerators', {});
        if (!result || !result.moderators || result.moderators.length === 0) return showNotification('📭 Hiç moderatör atanmamış.', 'success');
        alert('🎨 Moderatörler:\n\n' + result.moderators.map(function(m) { return '📧 ' + m.email + ' (' + m.name + ')'; }).join('\n'));
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] showModeratorsList",e);}
try{ if(typeof window.handleRequest!=="function"||__OVER.indexOf("handleRequest")>=0) window.handleRequest=async function (requestId, action) {
    if (!requestId || !action) return showNotification('Request ID ve action gerekli!', 'error');
    try {
        var result = await Parse.Cloud.run('handleRequest', { requestId: requestId, action: action });
        showNotification('✅ ' + (result.message || 'İşlem başarılı!'), 'success');
        window.loadInbox();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] handleRequest",e);}
try{ if(typeof window.acceptProjectRequest!=="function"||__OVER.indexOf("acceptProjectRequest")>=0) window.acceptProjectRequest=async function (requestId) {
    if (!requestId) return showNotification('Request ID gerekli!', 'error');
    try {
        var result = await Parse.Cloud.run('handleProjectRequest', { requestId: requestId, action: 'accept' });
        showNotification('✅ ' + (result.message || 'Talep kabul edildi!'), 'success');
        window.loadInbox();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] acceptProjectRequest",e);}
try{ if(typeof window.rejectProjectRequest!=="function"||__OVER.indexOf("rejectProjectRequest")>=0) window.rejectProjectRequest=async function (requestId) {
    if (!requestId) return showNotification('Request ID gerekli!', 'error');
    try {
        var result = await Parse.Cloud.run('handleProjectRequest', { requestId: requestId, action: 'reject' });
        showNotification('✅ ' + (result.message || 'Talep reddedildi.'), 'success');
        window.loadInbox();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] rejectProjectRequest",e);}
try{ if(typeof window.delegateProjectRequest!=="function"||__OVER.indexOf("delegateProjectRequest")>=0) window.delegateProjectRequest=async function (requestId) {
    if (!requestId) return showNotification('Request ID gerekli!', 'error');
    try {
        var result = await Parse.Cloud.run('handleProjectRequest', { requestId: requestId, action: 'delegate' });
        showNotification('✅ ' + (result.message || 'Talep devredildi.'), 'success');
        window.loadInbox();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] delegateProjectRequest",e);}
try{ if(typeof window.acceptProjectCompletion!=="function"||__OVER.indexOf("acceptProjectCompletion")>=0) window.acceptProjectCompletion=async function (inboxId) {
    if (!inboxId) return showNotification('Inbox ID gerekli!', 'error');
    try {
        var result = await Parse.Cloud.run('acceptProjectCompletion', { inboxId: inboxId });
        showNotification('✅ ' + (result.message || 'Proje alındı!'), 'success');
        window.loadInbox();
        if (window.loadProjects) window.loadProjects();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] acceptProjectCompletion",e);}
try{ if(typeof window.rejectProjectCompletion!=="function"||__OVER.indexOf("rejectProjectCompletion")>=0) window.rejectProjectCompletion=async function (inboxId) {
    if (!inboxId) return showNotification('Inbox ID gerekli!', 'error');
    try {
        var result = await Parse.Cloud.run('rejectProjectCompletion', { inboxId: inboxId });
        showNotification('✅ ' + (result.message || 'Proje reddedildi.'), 'success');
        window.loadInbox();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] rejectProjectCompletion",e);}
try{ if(typeof window.sendGift!=="function"||__OVER.indexOf("sendGift")>=0) window.sendGift=async function () {
    var input = document.getElementById('giftEmail');
    var select = document.getElementById('giftPackage');
    if (!input || !input.value) return showNotification('E-posta girin!', 'error');
    await window.giftUserEmail(input.value.trim(), select ? select.value : 'pro');
    input.value = '';
};}catch(e){console.warn("[legacy] sendGift",e);}
try{ if(typeof window.assignAdmin==="undefined") window.assignAdmin=window.assignAdminByEmail;}catch(e){console.warn("[legacy] assignAdmin",e);}
try{ if(typeof window.banUser!=="function"||__OVER.indexOf("banUser")>=0) window.banUser=async function () {
    var input = document.getElementById('banUserEmail');
    if (!input || !input.value) return showNotification('E-posta girin!', 'error');
    await window.banUserEmail(input.value.trim());
    input.value = '';
};}catch(e){console.warn("[legacy] banUser",e);}
try{ if(typeof window.unbanUser!=="function"||__OVER.indexOf("unbanUser")>=0) window.unbanUser=async function () {
    var input = document.getElementById('banUserEmailUnban');
    if (!input || !input.value) return showNotification('E-posta girin!', 'error');
    await window.unbanUserEmail(input.value.trim());
    input.value = '';
};}catch(e){console.warn("[legacy] unbanUser",e);}
try{ if(typeof window.checkAndShowSubscriptionCard!=="function"||__OVER.indexOf("checkAndShowSubscriptionCard")>=0) window.checkAndShowSubscriptionCard=async function () {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getMySubscriptions', {});
        var wrapper = document.getElementById('subscriptionsCardWrapper');
        var content = document.getElementById('subscriptionsContent');
        if (!wrapper || !content) return;
        if (!result || (!result.blogActive && !result.systemActive)) { wrapper.style.display = 'none'; return; }
        wrapper.style.display = 'block';
        var html = '<div style="display:flex; flex-direction:column; gap:10px;">';
        if (result.blogActive) html += '<div style="padding:10px 14px; background:linear-gradient(135deg, rgba(184,192,208,0.1), rgba(212,175,55,0.06)); border-left:3px solid var(--accent2); border-radius:10px; font-size:13px;">✅ <strong>Blog Güncellemeleri</strong> aktif</div>';
        if (result.systemActive) html += '<div style="padding:10px 14px; background:linear-gradient(135deg, rgba(212,175,55,0.1), rgba(124,92,255,0.06)); border-left:3px solid var(--accent); border-radius:10px; font-size:13px;">✅ <strong>Sistem Güncellemeleri</strong> aktif</div>';
        html += '<button class="btn-secondary btn-sm" onclick="window.unsubscribeAll()" style="font-size:12px; margin-top:6px;">🔕 Tüm Abonelikleri İptal Et</button>';
        html += '</div>';
        content.innerHTML = html;
    } catch (e) { console.warn('Abonelik kontrolü hatası:', e.message); }
};}catch(e){console.warn("[legacy] checkAndShowSubscriptionCard",e);}
try{ if(typeof window.unsubscribeAll!=="function"||__OVER.indexOf("unsubscribeAll")>=0) window.unsubscribeAll=async function () {
    if (!confirm('Tüm abonelikleriniz iptal edilecek. Onaylıyor musunuz?')) return;
    try {
        await Parse.Cloud.run('unsubscribeFrom', { type: 'blog' }).catch(function(){});
        await Parse.Cloud.run('unsubscribeFrom', { type: 'system' }).catch(function(){});
        showNotification('🔕 Tüm abonelikler iptal edildi', 'success');
        window.checkAndShowSubscriptionCard();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] unsubscribeAll",e);}
try{ if(typeof window.loadMySubscriptions!=="function"||__OVER.indexOf("loadMySubscriptions")>=0) window.loadMySubscriptions=async function () {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getMySubscriptions', {});
        var wrapper = document.getElementById('subscriptionsCardWrapper');
        var content = document.getElementById('subscriptionsContent');
        if (!wrapper || !content) return;
        wrapper.style.display = 'block';
        var html = '<div style="display:flex; flex-direction:column; gap:12px;">';
        html += '<div style="padding:14px 18px; background:rgba(184,192,208,0.08); border-radius:12px; border-left:3px solid var(--accent2);">';
        html += '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">';
        html += '<div><strong style="color:var(--accent2);">📝 Blog Güncellemeleri</strong></div>';
        if (result.blogActive) html += '<button class="btn-danger btn-sm" onclick="window.toggleSubscription(\'blog\')" style="font-size:11px;">🔕 İptal</button>';
        else html += '<button class="btn-primary btn-sm" onclick="window.toggleSubscription(\'blog\')" style="font-size:11px;">🔔 Abone Ol</button>';
        html += '</div></div>';
        html += '<div style="padding:14px 18px; background:rgba(212,175,55,0.08); border-radius:12px; border-left:3px solid var(--accent);">';
        html += '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">';
        html += '<div><strong style="color:var(--accent);">⚡ Sistem Güncellemeleri</strong></div>';
        if (result.systemActive) html += '<button class="btn-danger btn-sm" onclick="window.toggleSubscription(\'system\')" style="font-size:11px;">🔕 İptal</button>';
        else html += '<button class="btn-primary btn-sm" onclick="window.toggleSubscription(\'system\')" style="font-size:11px;">🔔 Abone Ol</button>';
        html += '</div></div>';
        html += '</div>';
        content.innerHTML = html;
    } catch (e) { console.warn('Abonelikler yüklenemedi:', e.message); }
};}catch(e){console.warn("[legacy] loadMySubscriptions",e);}
try{ if(typeof window.toggleSubscription!=="function"||__OVER.indexOf("toggleSubscription")>=0) window.toggleSubscription=async function (type) {
    if (!currentUser) return;
    try {
        var result = await Parse.Cloud.run('getMySubscriptions', {});
        var isActive = (type === 'blog') ? result.blogActive : result.systemActive;
        if (isActive) {
            await Parse.Cloud.run('unsubscribeFrom', { type: type });
            showNotification('🔕 Abonelik iptal edildi', 'success');
        } else {
            var cloudFn = (type === 'blog') ? 'subscribeToBlog' : 'subscribeToSystemUpdates';
            await Parse.Cloud.run(cloudFn, { email: currentUser.get('email') });
            showNotification('🔔 Abonelik aktif edildi', 'success');
        }
        window.loadMySubscriptions();
    } catch (e) { showNotification('Hata: ' + e.message, 'error'); }
};}catch(e){console.warn("[legacy] toggleSubscription",e);}
try{ if(typeof window.jarvisActive==="undefined") window.jarvisActive=false;}catch(e){console.warn("[legacy] jarvisActive",e);}
try{ if(typeof window.jarvisRecognition==="undefined") window.jarvisRecognition=null;}catch(e){console.warn("[legacy] jarvisRecognition",e);}
try{ if(typeof window.jarvisWakeWord==="undefined") window.jarvisWakeWord='jarvis';}catch(e){console.warn("[legacy] jarvisWakeWord",e);}
try{ if(typeof window.jarvisListening==="undefined") window.jarvisListening=false;}catch(e){console.warn("[legacy] jarvisListening",e);}
try{ if(typeof window.jarvisContinuousMode==="undefined") window.jarvisContinuousMode=true;}catch(e){console.warn("[legacy] jarvisContinuousMode",e);}
try{ if(typeof window.jarvisInterimResults==="undefined") window.jarvisInterimResults=true;}catch(e){console.warn("[legacy] jarvisInterimResults",e);}
try{ if(typeof window.jarvisCurrentUtterance==="undefined") window.jarvisCurrentUtterance=null;}catch(e){console.warn("[legacy] jarvisCurrentUtterance",e);}
try{ if(typeof window.jarvisStream==="undefined") window.jarvisStream=null;}catch(e){console.warn("[legacy] jarvisStream",e);}
try{ if(typeof window.jarvisFinalTranscript==="undefined") window.jarvisFinalTranscript='';}catch(e){console.warn("[legacy] jarvisFinalTranscript",e);}
try{ if(typeof window.jarvisProcessing==="undefined") window.jarvisProcessing=false;}catch(e){console.warn("[legacy] jarvisProcessing",e);}
try{ if(typeof window.jarvisStatusEl==="undefined") window.jarvisStatusEl=null;}catch(e){console.warn("[legacy] jarvisStatusEl",e);}
try{ if(typeof window.jarvisTranscriptEl==="undefined") window.jarvisTranscriptEl=null;}catch(e){console.warn("[legacy] jarvisTranscriptEl",e);}
function createJarvisUI() {
    if (document.getElementById('jarvisOverlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'jarvisOverlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999998;
        background: radial-gradient(ellipse at 50% 40%, #0f0f14 0%, #050507 60%, #000 100%);
        display: none; flex-direction: column; align-items: center; justify-content: center;
        padding: 32px; overflow: hidden; backdrop-filter: blur(20px);
    `;
    overlay.innerHTML = `
        <div id="jarvisStatus" style="position: fixed; top: 32px; left: 32px; display: flex; align-items: center; gap: 11px; padding: 11px 20px; background: rgba(0,0,0,0.55); border-radius: 999px; border: 1px solid rgba(212,175,55,0.4); color: var(--accent); font-size: 13px; font-weight: 600; z-index: 3;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #7fd4ff; box-shadow: 0 0 18px #7fd4ff; animation: splashStatusBlink 1s ease-in-out infinite;"></span>
            JARVIS ÇEVRİMİÇİ
        </div>
        <button id="jarvisCloseBtn" style="position: fixed; top: 26px; right: 26px; padding: 13px 24px; background: linear-gradient(135deg, rgba(239,68,68,0.24), rgba(230,57,70,0.18)); border: 1.5px solid rgba(239,68,68,0.55); color: #ef4444; border-radius: 999px; font-size: 14px; font-weight: 700; cursor: pointer; z-index: 3; display: flex; align-items: center; gap: 9px;">
            ✕ Kapat
        </button>
        <div id="jarvisLogo" style="width: 200px; height: 200px; border-radius: 50%; background: linear-gradient(135deg, #d4af37, #b8c0d0, #7c5cff, #7fd4ff); background-size: 250% 250%; display: flex; align-items: center; justify-content: center; font-size: 80px; position: relative; z-index: 2; animation: voiceLogoPulse 2.2s ease-in-out infinite, gradientMove 5s ease infinite; box-shadow: 0 0 70px rgba(212,175,55,0.8), 0 0 140px rgba(124,92,255,0.55); color: #fff;">
            <svg width="80" height="80" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <defs><linearGradient id="jarvisGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#d4af37"/></linearGradient></defs>
                <circle cx="32" cy="32" r="28" fill="none" stroke="url(#jarvisGrad)" stroke-width="2"/>
                <path d="M 22 44 L 32 18 L 42 44" fill="none" stroke="url(#jarvisGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M 26 34 L 38 34" stroke="url(#jarvisGrad)" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="32" cy="15" r="2.5" fill="#fff"/>
            </svg>
        </div>
        <div id="jarvisTranscript" style="margin-top: 36px; max-width: 740px; text-align: center; color: var(--text2); font-size: 16px; line-height: 1.75; padding: 0 22px; z-index: 2; min-height: 62px;">
            <span style="color: var(--text3);">"Jarvis" diyerek veya mikrofon butonuna basarak konuşmaya başlayabilirsiniz.</span>
        </div>
        <div id="jarvisWaves" style="display: flex; gap: 5px; margin-top: 34px; align-items: center; height: 44px; z-index: 2;">
            <span style="width: 4.5px; height: 16px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 28px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.1s; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 38px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.2s; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 28px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.3s; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 16px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.4s; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 32px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.5s; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 22px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.6s; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 38px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.7s; box-shadow: 0 0 12px var(--accent);"></span>
            <span style="width: 4.5px; height: 16px; background: linear-gradient(180deg, var(--accent), var(--platinum), var(--purple)); border-radius: 4px; animation: voiceWave 1.3s ease-in-out infinite 0.8s; box-shadow: 0 0 12px var(--accent);"></span>
        </div>
        <div style="margin-top: 24px; font-size: 12px; color: var(--text3); text-align: center; max-width: 500px; line-height: 1.7; padding: 0 22px; z-index: 2;">
            💡 <strong style="color: var(--accent);">Nasıl çalışır:</strong> "Jarvis" diyerek uyandırın veya mikrofon butonuna basın. Söylediklerinizi anlar ve sesli yanıt verir. Durdurmak için geri tuşuna basın.
        </div>
        <div style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 3; flex-wrap: wrap; justify-content: center;">
            <span class="koc-limit-badge" id="jarvisLimitBadge" style="display:inline-flex;">📅 – / – (günlük)</span>
            <button id="jarvisMicBtn" style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #d4af37, #b8c0d0, #7c5cff); border: none; color: #0a0a0e; font-size: 28px; cursor: pointer; box-shadow: 0 0 40px rgba(212,175,55,0.6); transition: all 0.25s;" title="Mikrofon">🎤</button>
            <button id="jarvisMuteBtn" style="padding: 11px 22px; background: transparent; border: 1.5px solid rgba(212,175,55,0.5); color: var(--accent); border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s;">🔊 Sesi Aç/Kapat</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Event listener'lar
    document.getElementById('jarvisCloseBtn').onclick = closeJarvisPanel;
    document.getElementById('jarvisMicBtn').onclick = toggleJarvisListening;
    document.getElementById('jarvisMuteBtn').onclick = toggleJarvisMute;
}
if(typeof window.createJarvisUI!=="function"||__OVER.indexOf("createJarvisUI")>=0)window.createJarvisUI=createJarvisUI;
function startJarvisWakeWordListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('❌ Tarayıcınız sesli tanıma desteklemiyor!', 'error');
        return;
    }
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;
    window.jarvisRecognition = recognition;

    recognition.onstart = function () {
        updateJarvisStatus('🎤 Dinleniyor...', 'var(--ice)');
    };

    var finalTranscript = '';
    recognition.onresult = function (event) {
        var interim = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
            var t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += t;
            } else {
                interim += t;
            }
        }
        var combined = (finalTranscript + interim).toLowerCase();

        // Wake word algılama
        if (combined.includes('jarvis') || combined.includes('hey jarvis') || combined.includes('hey jarvis')) {
            if (!window.jarvisListening) {
                window.jarvisListening = true;
                finalTranscript = '';
                recognition.stop();
                updateJarvisStatus('🔴 Sizi dinliyorum...', 'var(--danger)');
                startJarvisCommandListening();
                return;
            }
        }

        // Komut modunda transcript güncelle
        if (window.jarvisListening && window.jarvisTranscriptEl) {
            window.jarvisTranscriptEl.innerHTML = '<span style="color: var(--accent);">🎤 Sen:</span> ' + window.escapeHtml(finalTranscript + interim);
        }
    };

    recognition.onerror = function (event) {
        console.warn('JARVIS uyandırma hatası:', event.error);
        if (event.error === 'not-allowed') {
            showNotification('❌ Mikrofon izni gerekli!', 'error');
        }
    };

    recognition.onend = function () {
        if (window.jarvisActive && !window.jarvisListening) {
            try { recognition.start(); } catch (e) {}
        }
    };

    try { recognition.start(); } catch (e) {
        console.error('JARVIS uyandırma başlatılamadı:', e);
    }
}
if(typeof window.startJarvisWakeWordListening!=="function"||__OVER.indexOf("startJarvisWakeWordListening")>=0)window.startJarvisWakeWordListening=startJarvisWakeWordListening;
function startJarvisCommandListening() {
    if (window.jarvisListening) return;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showNotification('❌ Tarayıcınız sesli tanıma desteklemiyor!', 'error');
        return;
    }

    var recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = true;

    var finalTranscript = '';

    recognition.onstart = function () {
        window.jarvisListening = true;
        updateJarvisStatus('🔴 Sizi dinliyorum...', 'var(--danger)');
    };

    recognition.onresult = function (event) {
        var interim = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
            var t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += t;
            } else {
                interim += t;
            }
        }
        if (window.jarvisTranscriptEl) {
            window.jarvisTranscriptEl.innerHTML = '<span style="color: var(--accent);">🎤 Sen:</span> ' + window.escapeHtml(finalTranscript + interim);
        }
    };

    recognition.onerror = function (event) {
        console.warn('JARVIS komut hatası:', event.error);
        window.jarvisListening = false;
        updateJarvisStatus('🎤 Dinleniyor...', 'var(--ice)');
        startJarvisWakeWordListening();
    };

    recognition.onend = function () {
        window.jarvisListening = false;
        if (finalTranscript.trim()) {
            processJarvisCommand(finalTranscript.trim());
        } else {
            updateJarvisStatus('🎤 Dinleniyor...', 'var(--ice)');
            startJarvisWakeWordListening();
        }
    };

    try { recognition.start(); } catch (e) {
        console.error('JARVIS komut başlatılamadı:', e);
        window.jarvisListening = false;
        updateJarvisStatus('🎤 Dinleniyor...', 'var(--ice)');
    }
}
if(typeof window.startJarvisCommandListening!=="function"||__OVER.indexOf("startJarvisCommandListening")>=0)window.startJarvisCommandListening=startJarvisCommandListening;
async function processJarvisCommand(text) {
    if (!text) return;

    window.jarvisProcessing = true;
    if (window.jarvisTranscriptEl) {
        window.jarvisTranscriptEl.innerHTML = '<span style="color: var(--accent);">🎤 Sen:</span> ' + window.escapeHtml(text) +
            '<br><br><span style="color: var(--text3);">⏳ Düşünüyor...</span>';
    }
    updateJarvisStatus('🧠 Düşünüyor...', 'var(--gold)');

    try {
        // 28 modeli kullan
        var result = await Parse.Cloud.run('superAI', { prompt: text });
        var reply = result || 'Üzgünüm, cevap veremiyorum.';

        if (window.jarvisTranscriptEl) {
            window.jarvisTranscriptEl.innerHTML =
                '<span style="color: var(--accent);">🎤 Sen:</span> ' + window.escapeHtml(text) +
                '<br><br>' +
                '<span style="color: var(--ice);">✨ JARVIS:</span> ' + window.escapeHtml(reply);
        }

        // Sesli yanıt ver
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        var utterance = new SpeechSynthesisUtterance(reply);
        utterance.lang = 'tr-TR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        var voices = window.speechSynthesis.getVoices();
        var trVoice = voices.find(function (v) { return v.lang.startsWith('tr'); });
        if (trVoice) utterance.voice = trVoice;
        window.speechSynthesis.speak(utterance);

        window.jarvisFinalTranscript = '';
        updateJarvisStatus('🔴 Sizi dinliyorum...', 'var(--danger)');

        // Tekrar dinlemeye başla (komut modu)
        setTimeout(function () {
            startJarvisCommandListening();
        }, 1000);

        if (typeof window.incrementUsage === 'function') {
            window.incrementUsage('voiceChatMinutesPerDay', 'day', 1);
        }

        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('JARVIS komutu işlendi: ' + text.substring(0, 50));
        }
    } catch (e) {
        console.error('JARVIS işleme hatası:', e);
        if (window.jarvisTranscriptEl) {
            window.jarvisTranscriptEl.innerHTML =
                '<span style="color: var(--danger);">❌ Hata: ' + window.escapeHtml(e.message) + '</span>';
        }
        updateJarvisStatus('🎤 Dinleniyor...', 'var(--ice)');
        setTimeout(function () {
            startJarvisWakeWordListening();
        }, 2000);
    } finally {
        window.jarvisProcessing = false;
    }
}
if(typeof window.processJarvisCommand!=="function"||__OVER.indexOf("processJarvisCommand")>=0)window.processJarvisCommand=processJarvisCommand;
function updateJarvisStatus(text, color) {
    if (window.jarvisStatusEl) {
        window.jarvisStatusEl.innerHTML =
            '<span style="width: 10px; height: 10px; border-radius: 50%; background: ' + (color || 'var(--ice)') + '; box-shadow: 0 0 18px ' + (color || 'var(--ice)') + '; animation: splashStatusBlink 1s ease-in-out infinite;"></span> ' +
            text;
    }
}
if(typeof window.updateJarvisStatus!=="function"||__OVER.indexOf("updateJarvisStatus")>=0)window.updateJarvisStatus=updateJarvisStatus;
function toggleJarvisMute() {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        showNotification('🔇 Ses kapatıldı', 'warning');
    } else {
        showNotification('🔊 Ses açık', 'success');
    }
}
if(typeof window.toggleJarvisMute!=="function"||__OVER.indexOf("toggleJarvisMute")>=0)window.toggleJarvisMute=toggleJarvisMute;
function updateJarvisLimitBadge() {
    var badge = document.getElementById('jarvisLimitBadge');
    if (badge && typeof window.getLimitText === 'function') {
        badge.textContent = '📅 ' + window.getLimitText('voiceChatMinutesPerDay', 'day') + ' (günlük)';
    }
}
if(typeof window.updateJarvisLimitBadge!=="function"||__OVER.indexOf("updateJarvisLimitBadge")>=0)window.updateJarvisLimitBadge=updateJarvisLimitBadge;
try{ if(typeof window.openJarvisPanel==="undefined") window.openJarvisPanel=openJarvisPanel;}catch(e){console.warn("[legacy] openJarvisPanel",e);}
try{ if(typeof window.closeJarvisPanel==="undefined") window.closeJarvisPanel=closeJarvisPanel;}catch(e){console.warn("[legacy] closeJarvisPanel",e);}
try{ if(typeof window.openPersonalAssistant!=="function"||__OVER.indexOf("openPersonalAssistant")>=0) window.openPersonalAssistant=function () {
    if (!window.currentUser) {
        if (typeof showNotification === 'function') showNotification('Önce giriş yapın!', 'error');
        return;
    }
    var modal = document.getElementById('personalAssistantModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'personalAssistantModal';
        modal.className = 'modal-overlay';
        modal.onclick = function (e) { if (e.target === modal) window.closeModal('personalAssistantModal'); };
        modal.innerHTML = `
            <div class="modal" style="max-width:600px;">
                <div class="modal-header">
                    <h3>🤖 AI Kişisel Asistan</h3>
                    <button class="modal-close" onclick="window.closeModal('personalAssistantModal')">×</button>
                </div>
                <div style="padding:10px 0;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <div style="font-size:60px; margin-bottom:12px;">🤖</div>
                        <p style="color:var(--text2); font-size:14px;">Günlük özet, hatırlatıcı, avatar ve sesli asistan özellikleri</p>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <button class="btn-primary" onclick="window.refreshAssistantSummary()" style="padding:14px; font-size:15px;">📊 Bugünkü Özeti Gör</button>
                        <button class="btn-secondary" onclick="window.setAssistantReminder()" style="padding:14px;">⏰ Hatırlatıcı Ekle</button>
                        <button class="btn-secondary" onclick="window.openAvatarCreator()" style="padding:14px;">✨ Avatar Oluştur</button>
                        <button class="btn-secondary" onclick="window.openAssistantSettings()" style="padding:14px;">⚙️ Asistan Ayarları</button>
                    </div>
                    <div style="margin-top:20px; padding:12px 16px; background:linear-gradient(135deg, rgba(118,185,0,0.08), rgba(212,175,55,0.04)); border:1px dashed rgba(118,185,0,0.35); border-radius:12px; font-size:11.5px; color:#b8e070; line-height:1.65; text-align:center;">
                        🟢 <strong style="color:var(--nvidia);">28 Model:</strong> Asistanın 13 Ollama + 7 NVIDIA NIM + 8 Bulut API ile çalışır.
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
    modal.style.display = 'flex';
    if (typeof window.addLogInfo === 'function') window.addLogInfo('AI Kişisel Asistan açıldı');
};}catch(e){console.warn("[legacy] openPersonalAssistant",e);}
try{ if(typeof window.openAvatarCreator!=="function"||__OVER.indexOf("openAvatarCreator")>=0) window.openAvatarCreator=function () {
    if (!window.currentUser) {
        if (typeof showNotification === 'function') showNotification('Önce giriş yapın!', 'error');
        return;
    }
    if (typeof showNotification === 'function') {
        showNotification('✨ Avatar Oluşturucu yakında! Şu anda deneysel özellik.', 'warning');
    }
    if (typeof window.addLogWarning === 'function') window.addLogWarning('Avatar oluşturucu çağrıldı (yakında)');
};}catch(e){console.warn("[legacy] openAvatarCreator",e);}
try{ if(typeof window.openAssistantSettings!=="function"||__OVER.indexOf("openAssistantSettings")>=0) window.openAssistantSettings=function () {
    if (!window.currentUser) {
        if (typeof showNotification === 'function') showNotification('Önce giriş yapın!', 'error');
        return;
    }
    var modal = document.getElementById('assistantSettingsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'assistantSettingsModal';
        modal.className = 'modal-overlay';
        modal.onclick = function (e) { if (e.target === modal) window.closeModal('assistantSettingsModal'); };
        modal.innerHTML = `
            <div class="modal" style="max-width:560px;">
                <div class="modal-header">
                    <h3>⚙️ Asistan Ayarları</h3>
                    <button class="modal-close" onclick="window.closeModal('assistantSettingsModal')">×</button>
                </div>
                <div style="padding:10px 0;">
                    <div class="parent-setting"><span class="setting-label">🟢 Canlı Takip</span><div class="setting-control"><div class="toggle-switch active" id="assistantLiveTracking" onclick="this.classList.toggle('active')"></div></div></div>
                    <div class="parent-setting"><span class="setting-label">📊 Haftalık Analiz</span><div class="setting-control"><div class="toggle-switch active" id="assistantWeeklyReport" onclick="this.classList.toggle('active')"></div></div></div>
                    <div class="parent-setting"><span class="setting-label">🔔 Bildirimler</span><div class="setting-control"><div class="toggle-switch active" id="assistantNotifications" onclick="this.classList.toggle('active')"></div></div></div>
                    <div class="parent-setting"><span class="setting-label">🎤 Sesli Yanıt</span><div class="setting-control"><div class="toggle-switch active" id="assistantVoiceResponse" onclick="this.classList.toggle('active')"></div></div></div>
                    <button class="btn-primary" onclick="window.saveAssistantSettings()" style="width:100%; margin-top:20px; padding:14px;">💾 Kaydet</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
    modal.style.display = 'flex';
};}catch(e){console.warn("[legacy] openAssistantSettings",e);}
try{ if(typeof window.refreshAssistantSummary!=="function"||__OVER.indexOf("refreshAssistantSummary")>=0) window.refreshAssistantSummary=async function () {
    if (!window.currentUser) {
        if (typeof showNotification === 'function') showNotification('Önce giriş yapın!', 'error');
        return;
    }
    var summaryBox = document.getElementById('assistantSummaryBox');
    if (!summaryBox) {
        if (typeof showNotification === 'function') showNotification('Özet kutusu bulunamadı!', 'warning');
        return;
    }
    summaryBox.classList.add('loading');
    summaryBox.innerHTML = '⏳ Günlük özet hazırlanıyor...';
    try {
        var result = await Parse.Cloud.run('superAI', {
            prompt: 'Bugün için kısa bir günlük özet hazırla: motivasyon cümlesi, hava durumu hatırlatması ve 3 öneri. Türkçe olsun.'
        });
        summaryBox.classList.remove('loading');
        summaryBox.innerHTML = '<div style="line-height:1.7;">' + window.escapeHtml(result || 'Bugün harika bir gün olacak!').replace(/\n/g, '<br>') + '</div>';
        if (typeof showNotification === 'function') showNotification('✅ Özet yenilendi!', 'success');
    } catch (e) {
        summaryBox.classList.remove('loading');
        summaryBox.innerHTML = '<div style="color:var(--danger);">⚠️ Özet alınamadı: ' + window.escapeHtml(e.message) + '</div>';
        if (typeof showNotification === 'function') showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] refreshAssistantSummary",e);}
try{ if(typeof window.getJobLimitText!=="function"||__OVER.indexOf("getJobLimitText")>=0) window.getJobLimitText=function () {
    if (!currentUser) return 'Giriş yapmalısınız';
    var limits = window.getPlanLimits(currentUser);
    var limit = limits.jobListings;
    if (limit === -1) return '♾️ Sınırsız';
    var used = getUsageData('jobListings', 'lifetime');
    var remaining = Math.max(0, limit - used);
    return remaining + ' / ' + limit;
};}catch(e){console.warn("[legacy] getJobLimitText",e);}
try{ if(typeof window.openJobMarket!=="function"||__OVER.indexOf("openJobMarket")>=0) window.openJobMarket=function () {
    if (!currentUser) {
        showNotification('Bu özelliği kullanmak için giriş yapın!', 'error');
        return;
    }
    var overlay = document.getElementById('jobMarketOverlay');
    if (!overlay) {
        console.warn('jobMarketOverlay bulunamadı, fallback kullanılıyor');
        window.openJobMarketFallback();
        return;
    }
    overlay.classList.add('open');
    overlay.style.display = 'flex';
    window.jobMarketActive = true;
    window.addLogInfo('A27 İş İlanları Mağazası açıldı');
    window.loadJobMarket();
    window.updateJobMarketLimitBadge();
};}catch(e){console.warn("[legacy] openJobMarket",e);}
try{ if(typeof window.openJobMarketFallback!=="function"||__OVER.indexOf("openJobMarketFallback")>=0) window.openJobMarketFallback=function () {
    var modal = document.getElementById('jobMarketFallbackModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'jobMarketFallbackModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'display:flex; z-index:999998;';
        modal.innerHTML = `
            <div class="modal" style="max-width:1000px; max-height:90vh; overflow-y:auto; padding:24px;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="color:var(--gold); font-size:22px;">💼 A27 İş İlanları Mağazası</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div id="jobMarketFallbackList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:14px;"></div>
                <div style="display:flex; justify-content:center; gap:12px; margin-top:20px; flex-wrap:wrap;">
                    <button class="btn-primary" onclick="window.openJobCreateFormFallback()">➕ İlan Ver</button>
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Kapat</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
    window.loadJobMarketFallbackList();
};}catch(e){console.warn("[legacy] openJobMarketFallback",e);}
try{ if(typeof window.loadJobMarketFallbackList!=="function"||__OVER.indexOf("loadJobMarketFallbackList")>=0) window.loadJobMarketFallbackList=async function () {
    var list = document.getElementById('jobMarketFallbackList');
    if (!list) return;
    list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:40px;">⏳ Yükleniyor...</div>';
    try {
        var result = await Parse.Cloud.run('getJobListings', { limit: 50 });
        var jobs = (result && result.listings) ? result.listings : ((result && result.jobs) ? result.jobs : []);
        if (jobs.length === 0) {
            list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:40px;">📭 Henüz ilan yok. İlk ilanı sen ver!</div>';
            return;
        }
        var html = '';
        jobs.forEach(function(job) {
            var typeIcon = job.job_type === 'Kod' ? '💻' : job.job_type === 'Tasarım' ? '🎨' : job.job_type === 'Video' ? '🎬' : '📦';
            html += '<div style="background:linear-gradient(135deg,rgba(212,175,55,0.06),rgba(124,92,255,0.03)); border:1px solid var(--border2); border-radius:14px; padding:16px; cursor:pointer;" onclick="window.openJobDetail && window.openJobDetail(\'' + job.id + '\')">';
            html += '<div style="font-size:10px; color:var(--accent); font-family:var(--font-code); margin-bottom:6px;">' + window.escapeHtml(job.job_number || '') + '</div>';
            html += '<div style="font-weight:700; color:var(--text); margin-bottom:6px;">' + typeIcon + ' ' + window.escapeHtml(job.job_type || 'İlan') + '</div>';
            html += '<div style="font-size:12px; color:var(--text2); line-height:1.6; margin-bottom:8px;">' + window.escapeHtml((job.description || '').substring(0, 100)) + '</div>';
            html += '<div style="font-size:12px; color:var(--text3);">👤 ' + window.escapeHtml(job.owner_name || 'Kullanıcı') + '</div>';
            html += '<div style="color:var(--gold); font-weight:700; font-size:13px; margin-top:6px;">⭐ ' + (job.salary || 0) + '</div>';
            html += '</div>';
        });
        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--danger);padding:40px;">⚠️ Yüklenemedi: ' + window.escapeHtml(e.message) + '</div>';
    }
};}catch(e){console.warn("[legacy] loadJobMarketFallbackList",e);}
try{ if(typeof window.openJobCreateFormFallback!=="function"||__OVER.indexOf("openJobCreateFormFallback")>=0) window.openJobCreateFormFallback=function () {
    var type = prompt('İş türü (Kod / Tasarım / Video / Çeviri / Yazar / 3D / Müzik / Diğer):', 'Kod');
    if (!type) return;
    var desc = prompt('İş açıklaması:');
    if (!desc) return;
    var salary = prompt('Ücret / Ödül (örn: 5000 TL, 100 puan):');
    if (!salary) return;
    var payment = prompt('Ödeme yöntemi (örn: Nakit, Kripto, A27 Puan):', 'A27 Puan');
    if (!payment) return;
    window.submitJobCreateDirect({ jobType: type, description: desc, salary: salary, paymentMethod: payment });
};}catch(e){console.warn("[legacy] openJobCreateFormFallback",e);}
try{ if(typeof window.submitJobCreateDirect!=="function"||__OVER.indexOf("submitJobCreateDirect")>=0) window.submitJobCreateDirect=async function (params) {
    if (!currentUser) return showNotification('Giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('createJobListing', {
            jobType: params.jobType,
            description: params.description,
            salary: params.salary,
            paymentMethod: params.paymentMethod,
            imageUrl: params.imageUrl || null
        });
        if (result.success) {
            window.incrementUsage('jobListings', 'lifetime', 1);
            showNotification('✅ İlan yayınlandı! No: ' + result.job_number, 'success');
            if (typeof window.addLogSuccess === 'function') window.addLogSuccess('A27 İş ilanı oluşturuldu: ' + result.job_number);
            if (typeof window.loadJobMarketFallbackList === 'function') window.loadJobMarketFallbackList();
            if (typeof window.loadJobMarket === 'function') window.loadJobMarket();
            window.updateJobMarketLimitBadge();
        } else {
            showNotification('❌ ' + (result.error || 'İlan yayınlanamadı'), 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] submitJobCreateDirect",e);}
try{ if(typeof window.renderJobMarket!=="function"||__OVER.indexOf("renderJobMarket")>=0) window.renderJobMarket=function (jobs) {
    var grid = document.getElementById('jobMarketGrid');
    if (!grid) return;
    if (!jobs || jobs.length === 0) {
        grid.innerHTML = '<div class="job-market-empty"><span class="empty-icon">🔍</span><div>Filtreyle eşleşen ilan yok.</div></div>';
        return;
    }
    var html = '';
    jobs.forEach(function (job) {
        var typeClass = 'type-diger';
        var typeIcon = '📦';
        switch (job.job_type) {
            case 'Kod': typeClass = 'type-kod'; typeIcon = '💻'; break;
            case 'Tasarım': typeClass = 'type-tasarim'; typeIcon = '🎨'; break;
            case 'Video': typeClass = 'type-video'; typeIcon = '🎬'; break;
            case 'Çeviri': typeClass = 'type-ceviri'; typeIcon = '🌐'; break;
            case 'Yazar': typeClass = 'type-yazar'; typeIcon = '✍️'; break;
            case '3D': typeClass = 'type-3d'; typeIcon = '🧊'; break;
            case 'Müzik': typeClass = 'type-muzik'; typeIcon = '🎵'; break;
            default: typeClass = 'type-diger'; typeIcon = '📦';
        }
        var statusClass = '';
        if (job.status === 'accepted') statusClass = 'status-accepted';
        else if (job.status === 'closed') statusClass = 'status-closed';
        var safeTitle = window.escapeHtml(job.title || 'İlan');
        var safeDesc = window.escapeHtml((job.description || '').substring(0, 100));
        var safeOwnerName = window.escapeHtml(job.owner_name || 'Kullanıcı');
        var safeOwnerEmail = window.escapeHtml(job.owner_email || '');
        var safeJobNumber = window.escapeHtml(job.job_number || 'ILN-0000-00000');
        var ownerInitial = (job.owner_name || 'U').charAt(0).toUpperCase();
        html += '<div class="job-card ' + statusClass + '" onclick="window.openJobDetail(\'' + job.id + '\')">';
        html += '<div class="job-card-header">';
        html += '<span class="job-card-number">' + safeJobNumber + '</span>';
        html += '<span class="job-card-type ' + typeClass + '">' + typeIcon + ' ' + window.escapeHtml(job.job_type || 'Diğer') + '</span>';
        html += '</div>';
        if (job.image_url) {
            html += '<img class="job-card-image" src="' + window.escapeHtml(job.image_url) + '" alt="İlan görseli" onerror="this.style.display=\'none\'">';
        }
        html += '<div class="job-card-title">' + safeTitle + '</div>';
        html += '<div class="job-card-desc">' + safeDesc + '</div>';
        html += '<div class="job-card-meta">';
        html += '<div class="job-card-owner">';
        html += '<span class="owner-avatar">' + ownerInitial + '</span>';
        html += '<span style="flex:1;min-width:0;">';
        html += '<div style="font-weight:600;color:var(--text2);font-size:12px;">' + safeOwnerName + '</div>';
        html += '<div class="owner-email">' + safeOwnerEmail + '</div>';
        html += '</span>';
        html += '</div>';
        html += '<div class="job-card-footer">';
        html += '<div class="job-card-salary"><span class="salary-icon">⭐</span>' + window.escapeHtml(job.salary || '0') + '</div>';
        html += '<div class="job-card-views">👁️ ' + (job.views || 0) + '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    });
    grid.innerHTML = html;
};}catch(e){console.warn("[legacy] renderJobMarket",e);}
try{ if(typeof window.openJobDetailFallback!=="function"||__OVER.indexOf("openJobDetailFallback")>=0) window.openJobDetailFallback=async function (jobId) {
    try {
        var result = await Parse.Cloud.run('getJobDetail', { jobId: jobId });
        var job = (result && result.listing) ? result.listing : null;
        if (!job) return showNotification('İlan bulunamadı', 'error');
        alert('📋 ' + (job.job_number || '') + '\n\nTür: ' + job.job_type + '\nÜcret: ' + job.salary + '\nÖdeme: ' + job.payment_method + '\n\nAçıklama:\n' + job.description + '\n\n👤 ' + (job.owner_name || 'Kullanıcı') + ' (' + (job.owner_email || '') + ')');
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] openJobDetailFallback",e);}
try{ if(typeof window.editJobListing!=="function"||__OVER.indexOf("editJobListing")>=0) window.editJobListing=function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!window.currentJobDetail) return showNotification('İlan bilgisi yok!', 'error');
    var job = window.currentJobDetail;
    if (currentUser.get('email') !== job.owner_email && currentUser.get('role') !== 'founder') {
        return showNotification('Bu ilanı düzenleme yetkiniz yok!', 'error');
    }
    window.closeJobDetail();
    window.openJobCreateForm();
    setTimeout(function () {
        var typeSel = document.getElementById('jobCreateType');
        var titleInp = document.getElementById('jobCreateTitle');
        var descInp = document.getElementById('jobCreateDescription');
        var salaryInp = document.getElementById('jobCreateSalary');
        var payInp = document.getElementById('jobCreatePaymentMethod');
        if (typeSel) typeSel.value = job.job_type || '';
        if (titleInp) titleInp.value = job.title || '';
        if (descInp) descInp.value = job.description || '';
        if (salaryInp) salaryInp.value = job.salary || '';
        if (payInp) payInp.value = job.payment_method || '';
        window._editingJobId = job.id;
        var submitBtn = document.getElementById('jobCreateSubmitBtn');
        if (submitBtn) submitBtn.textContent = '💾 Güncelle';
        var modal = document.querySelector('#jobCreateOverlay .job-create-modal');
        if (modal) {
            var h3 = modal.querySelector('h3');
            if (h3) h3.textContent = '✏️ İlanı Düzenle';
        }
    }, 100);
};}catch(e){console.warn("[legacy] editJobListing",e);}
try{ if(typeof window.updateJobMarketLimitBadge!=="function"||__OVER.indexOf("updateJobMarketLimitBadge")>=0) window.updateJobMarketLimitBadge=function () {
    if (!currentUser) return;
    var limits = window.getPlanLimits(currentUser);
    var limit = limits.jobListings;
    var used = getUsageData('jobListings', 'lifetime');
    var headerBadge = document.getElementById('jobMarketHeaderLimitBadge');
    var mainBadge = document.getElementById('jobMarketLimitBadge');
    var remainingText = document.getElementById('jobMarketRemainingText');
    var limitText;
    if (limit === -1) {
        limitText = '💼 ♾️ Sınırsız';
    } else {
        var remaining = Math.max(0, limit - used);
        limitText = '💼 ' + used + ' / ' + limit + ' kullanıldı · ' + remaining + ' kaldı';
    }
    if (headerBadge) {
        headerBadge.textContent = limitText;
        if (limit !== -1 && used >= limit) headerBadge.classList.add('danger');
        else if (limit === -1) headerBadge.classList.add('unlimited');
    }
    if (mainBadge) {
        mainBadge.textContent = limitText;
        if (limit !== -1 && used >= limit) mainBadge.classList.add('danger');
        else if (limit === -1) mainBadge.classList.add('unlimited');
    }
    if (remainingText) {
        if (limit === -1) remainingText.textContent = '♾️';
        else remainingText.textContent = Math.max(0, limit - used) + ' / ' + limit;
    }
};}catch(e){console.warn("[legacy] updateJobMarketLimitBadge",e);}
try{ if(typeof window.loadJobMarketDashboardPreview!=="function"||__OVER.indexOf("loadJobMarketDashboardPreview")>=0) window.loadJobMarketDashboardPreview=async function () {
    var container = document.getElementById('jobMarketDashboardPreview');
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text3); font-size:12px; text-align:center; padding:20px; grid-column:1/-1;">⏳ Yükleniyor...</div>';
    try {
        var result = await Parse.Cloud.run('getJobListings', { limit: 3 });
        var jobs = (result && result.listings) ? result.listings : ((result && result.jobs) ? result.jobs : []);
        if (jobs.length === 0) {
            container.innerHTML = '<div style="color:var(--text3); font-size:12px; text-align:center; padding:20px; grid-column:1/-1;">📭 Henüz ilan yok. İlk ilanı sen ver!</div>';
            return;
        }
        var html = '';
        jobs.forEach(function (job) {
            var typeIcon = job.job_type === 'Kod' ? '💻' : job.job_type === 'Tasarım' ? '🎨' : job.job_type === 'Video' ? '🎬' : job.job_type === 'Çeviri' ? '🌐' : job.job_type === 'Yazar' ? '✍️' : job.job_type === '3D' ? '🧊' : job.job_type === 'Müzik' ? '🎵' : '📦';
            html += '<div style="background:linear-gradient(135deg, rgba(212,175,55,0.06), rgba(124,92,255,0.04)); border:1px solid var(--border2); border-radius:12px; padding:12px; cursor:pointer; transition:all 0.22s;" onclick="window.openJobDetail && window.openJobDetail(\'' + job.id + '\')" onmouseover="this.style.borderColor=\'var(--accent)\'; this.style.transform=\'translateY(-3px)\'" onmouseout="this.style.borderColor=\'var(--border2)\'; this.style.transform=\'translateY(0)\'">';
            html += '<div style="font-size:10px; color:var(--accent); font-family:var(--font-code); margin-bottom:4px;">' + window.escapeHtml(job.job_number || '') + '</div>';
            html += '<div style="font-weight:700; font-size:12.5px; margin-bottom:5px;">' + typeIcon + ' ' + window.escapeHtml((job.title || job.job_type || '').substring(0, 40)) + '</div>';
            html += '<div style="font-size:10.5px; color:var(--text3); margin-bottom:6px;">👤 ' + window.escapeHtml(job.owner_name || 'Kullanıcı') + '</div>';
            html += '<div style="color:var(--gold); font-weight:700; font-size:13px;">⭐ ' + window.escapeHtml(job.salary || '0') + '</div>';
            html += '</div>';
        });
        container.innerHTML = html;
    } catch (e) {
        console.error('Dashboard ilan önizleme hatası:', e);
        container.innerHTML = '<div style="color:var(--text3); font-size:12px; text-align:center; padding:20px; grid-column:1/-1;">⚠️ İlanlar yüklenemedi.</div>';
    }
};}catch(e){console.warn("[legacy] loadJobMarketDashboardPreview",e);}
try{ if(typeof window.runCategoryFeature!=="function"||__OVER.indexOf("runCategoryFeature")>=0) window.runCategoryFeature=async function (categoryId, action) {
    var prompts = {
        'openPersonalAssistant': 'Bana bugün için kişisel asistan özeti çıkar: hava, motivasyon, 3 öneri.',
        'setAssistantReminder': 'Bana yarın için hatırlatıcı oluşturmamda yardım et.',
        'openAvatarCreator': 'Kişisel AI avatarı oluşturmam için bana 5 farklı karakter öner.',
        'startLanguageCourse': 'Bana İngilizce öğrenmeye başlamak için 10 kelime + telaffuz ve mini quiz hazırla.',
        'startExamPrep': 'LGS matematik için 5 soru üret ve adım adım çöz.',
        'solveHomework': 'Matematik: 2x + 5 = 17 denkleminin çözümünü adım adım anlat.',
        'pdfToSpeech': 'PDF\'i sesli kitaba çevirmek için dosya yükle butonuna bas.',
        'writeStory': 'Bana kısa bir çocuk masalı yaz: orman ve arkadaşlık temalı.',
        'writePoem': 'Bana bahar temalı 4 kıtalık bir şiir yaz.',
        'startLiveBattle': 'Canlı AI savaşı için bir konu belirle ve 2 AI\'yı karşı karşıya getir.',
        'dailyChallenge': 'Bugünün zeka sorusu: Bana mantık sorusu sor.',
        'startTeamBattle': 'Takım savaşı için bir strateji oyunu öner.',
        'startGuessGame': 'Bana "Bu ünlü kişiyi tahmin et" oyunu için 5 ipucu ver.',
        'startVoiceDuel': 'Sesli düello için bir konu belirle.',
        'createVirtualRoom': 'Sanal oda için 5 farklı AI karakteri öner.',
        'editPhotoAI': 'Fotoğraf düzenleme için dosya yükle butonuna bas.',
        'openVideoEditor': 'Video editörü açmak için tıkla.',
        'generateMusic': 'Bana sakin bir piyano müziği tarifi ver: tempo, akor, duygu.',
        'cloneVoice': 'Ses klonlama için 30 saniyelik kayıt gerekiyor.',
        'selfieToAnime': 'Selfie\'ni anime\'ye çevirmek için dosya yükle.',
        'generateLogo': 'Markam için 5 farklı logo fikri ver: minimal, modern, geometrik.',
        'generateInstaBio': 'Instagram bio için 5 farklı öneri: yaratıcı ve kısa.',
        'generateCV': 'CV\'mi hazırlamam için bana sorular sor.',
        'generateCoverLetter': 'İş başvurusu mektubu için bana bir şablon ver.',
        'analyzeContract': 'Sözleşme analizi için PDF yükle.',
        'generatePresentation': 'Sunum oluşturmak için bana 10 slayt konusu ver.',
        'writeEmail': 'Bana profesyonel bir iş e-postası yaz: toplantı erteleme.',
        'scanInvoice': 'Fatura taramak için fotoğraf yükle.',
        'countCalories': 'Kalori hesaplamak için yemek fotoğrafı yükle.',
        'createWorkoutPlan': 'Bana haftada 4 gün kas yapma programı hazırla.',
        'analyzeSleep': 'Bana uyku kalitesini artırma için 5 öneri ver.',
        'meditationGuide': 'Bana 5 dakikalık nefes egzersizi rehberi yaz.',
        'generateRecipe': 'Elimde yumurta, peynir, domates var. Bana tarif öner.',
        'waterTracking': 'Günde kaç bardak su içmeliyim?',
        'carbonFootprint': 'Karbon ayak izimi nasıl azaltabilirim?',
        'donationPlatform': 'Bağış yapmak istiyorum, hangi kurumlar var?',
        'volunteerAdvice': 'Gönüllü olmak istiyorum, ne yapabilirim?',
        'codingCampaign': 'Gençlere kodlama öğretmek için proje fikri ver.',
        'blogWithAI': 'Blog yazmam için bana 5 konu öner.',
        'interpretDream': 'Rüyamda uçtuğumu gördüm, ne anlama gelir?',
        'getHoroscope': 'Bugün için burç yorumu almak istiyorum.',
        'analyzeCharacter': 'Bir kişinin karakterini analiz etmemi sağla.',
        'relationshipAdvice': 'Sevgilime nasıl sürpriz yapabilirim?',
        'birthdayPoem': 'Arkadaşım için doğum günü şiiri yaz.',
        'createVisionMap': 'Hayallerimi görselleştirmek için yardım et.',
        'scheduleSurpriseMessage': 'Yarın için sürpriz mesaj planla.',
        'memoryJournal': 'Bugünkü anımı yaz, AI düzenlesin.',
        'freelanceMarket': 'Freelance iş almak için ne yapmalıyım?',
        'adService': 'Reklam servisi kurmak için plan yap.',
        'courseMarket': 'Kurs satmak için adımlar neler?',
        'premiumTemplates': 'Premium şablon tasarımı için fikir ver.',
        'apiReseller': 'A27 API bayiliği için bilgi ver.',
        'sponsorship': 'Sponsor bulmak için strateji öner.'
    };

    var prompt = prompts[action];
    if (action === 'openVideoEditor' && typeof window.openVideoEditor === 'function') {
        window.closeCategoryPanel();
        window.openVideoEditor();
        return;
    }
    if (!prompt) {
        showNotification('Bu özellik için AI\'ya yönlendiriliyorsun...', 'success');
        prompt = 'Bana bu konuda yardım et: ' + action;
    }
    window.closeCategoryPanel();
    if (typeof window.openFullAIPanel === 'function') {
        window.openFullAIPanel();
        setTimeout(function () {
            var input = document.getElementById('fullAIInput');
            if (input) {
                input.value = prompt;
                input.focus();
            }
        }, 500);
    } else {
        showNotification('AI paneli açılıyor: ' + prompt.substring(0, 50), 'success');
    }
};}catch(e){console.warn("[legacy] runCategoryFeature",e);}
try{ if(typeof window.openModelsShowcaseFallback!=="function"||__OVER.indexOf("openModelsShowcaseFallback")>=0) window.openModelsShowcaseFallback=function () {
    var modal = document.getElementById('modelsShowcaseFallbackModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modelsShowcaseFallbackModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'display:flex; z-index:999998;';
        modal.innerHTML = `
            <div class="modal" style="max-width:900px; max-height:90vh; overflow-y:auto; padding:26px;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="color:var(--nvidia); font-size:22px;">🟢 AETHRION Models — 28 Yapay Zeka</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div style="background:linear-gradient(135deg,rgba(118,185,0,0.08),rgba(212,175,55,0.05)); border:1px solid rgba(118,185,0,0.35); border-radius:14px; padding:16px 20px; margin-bottom:20px; font-size:13px; line-height:1.75; color:var(--text2);">
                    <strong style="color:var(--nvidia);">AETHRION AI,</strong> 13 yerli Ollama + 7 NVIDIA NIM + 8 Bulut API = <strong style="color:var(--gold);">28 farklı model</strong> kullanır. Her soruda modeller sırayla denenir.
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:12px;">
                    ${window.getModelsListHTML ? window.getModelsListHTML() : '<div style="grid-column:1/-1; text-align:center; color:var(--text3); padding:20px;">28 model yükleniyor...</div>'}
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Kapat</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
};}catch(e){console.warn("[legacy] openModelsShowcaseFallback",e);}
try{ if(typeof window.getModelsListHTML!=="function"||__OVER.indexOf("getModelsListHTML")>=0) window.getModelsListHTML=function() {
    var models = [
        { name: 'granite3.3:2b', provider: 'IBM Ollama', badge: 'ollama' },
        { name: 'qwen2.5vl:3b', provider: 'Vision Language', badge: 'ollama' },
        { name: 'phi4-mini-reasoning', provider: 'Microsoft', badge: 'ollama' },
        { name: 'gemma3:4b', provider: 'Google', badge: 'ollama' },
        { name: 'qwen3:8b', provider: 'En Güçlü Qwen 3', badge: 'ollama' },
        { name: 'qwen3:4b', provider: 'Hızlı Qwen 3', badge: 'ollama' },
        { name: 'qwen2.5-coder', provider: 'Kod Odaklı', badge: 'ollama' },
        { name: 'mistral', provider: 'Mistral AI', badge: 'ollama' },
        { name: 'phi3.5', provider: 'Microsoft', badge: 'ollama' },
        { name: 'gemma2', provider: 'Google', badge: 'ollama' },
        { name: 'llama3.2', provider: 'Meta', badge: 'ollama' },
        { name: 'qwen2.5', provider: 'Alibaba', badge: 'ollama' },
        { name: 'deepseek-r1', provider: 'Reasoning', badge: 'ollama' },
        { name: 'Llama-3.3-70B', provider: 'Meta NIM', badge: 'nvidia' },
        { name: 'Llama-3.1-8B', provider: 'Meta NIM', badge: 'nvidia' },
        { name: 'Qwen2.5-7B', provider: 'Alibaba NIM', badge: 'nvidia' },
        { name: 'Qwen2.5-Coder-32B', provider: 'Kod NIM', badge: 'nvidia' },
        { name: 'DeepSeek-R1-Distill', provider: 'Reasoning NIM', badge: 'nvidia' },
        { name: 'Gemma-2-2B', provider: 'Google NIM', badge: 'nvidia' },
        { name: 'Phi-3.5-MoE', provider: 'Microsoft NIM', badge: 'nvidia' },
        { name: 'Groq Llama 3.3 70B', provider: 'Groq', badge: 'cloud' },
        { name: 'Gemini 2.0 Flash', provider: 'Google', badge: 'cloud' },
        { name: 'DeepSeek Chat', provider: 'DeepSeek', badge: 'cloud' },
        { name: 'Llama 3.1 70B', provider: 'DeepInfra', badge: 'cloud' },
        { name: 'GPT-4o-mini', provider: 'OpenAI', badge: 'cloud' },
        { name: 'Llama 3.3 70B', provider: 'Cerebras', badge: 'cloud' },
        { name: '100+ Model', provider: 'OpenRouter', badge: 'cloud' },
        { name: 'Command R Plus', provider: 'Cohere', badge: 'cloud' }
    ];
    var html = '';
    models.forEach(function(m) {
        var color = m.badge === 'nvidia' ? 'var(--nvidia)' : (m.badge === 'ollama' ? 'var(--accent)' : 'var(--purple)');
        html += '<div style="background:linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.25)); border:1px solid var(--border2); border-radius:12px; padding:12px 14px; position:relative;">';
        html += '<div style="font-size:11px; font-weight:700; color:' + color + '; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">' + m.badge + '</div>';
        html += '<div style="font-weight:700; color:var(--text); font-size:12.5px; line-height:1.3; word-break:break-word;">' + window.escapeHtml(m.name) + '</div>';
        html += '<div style="font-size:10.5px; color:var(--text3); margin-top:3px;">' + window.escapeHtml(m.provider) + '</div>';
        html += '</div>';
    });
    return html;
};}catch(e){console.warn("[legacy] getModelsListHTML",e);}
try{ if(typeof window.openVideoEditorFallback!=="function"||__OVER.indexOf("openVideoEditorFallback")>=0) window.openVideoEditorFallback=function () {
    showNotification('🎬 Video Editör modülü yükleniyor...', 'warning');
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        showNotification('✅ Video seçildi: ' + file.name, 'success');
        showNotification('ℹ️ Tam video editör için sayfayı yenileyip tekrar deneyin.', 'warning');
    };
    input.click();
};}catch(e){console.warn("[legacy] openVideoEditorFallback",e);}
try{ if(typeof window.updateVideoTimeDisplay!=="function"||__OVER.indexOf("updateVideoTimeDisplay")>=0) window.updateVideoTimeDisplay=function () {
    var video = document.getElementById('videoEditorVideo');
    var timeEl = document.getElementById('videoEditorTime');
    if (!video || !timeEl) return;
    var cur = video.currentTime || 0;
    var dur = video.duration || 0;
    function fmt(s) {
        if (!isFinite(s)) return '00:00';
        var m = Math.floor(s / 60);
        var sec = Math.floor(s % 60);
        return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    }
    timeEl.textContent = fmt(cur) + ' / ' + fmt(dur);
};}catch(e){console.warn("[legacy] updateVideoTimeDisplay",e);}
try{ if(typeof window.updateVideoPlayhead!=="function"||__OVER.indexOf("updateVideoPlayhead")>=0) window.updateVideoPlayhead=function () {
    var video = document.getElementById('videoEditorVideo');
    var playhead = document.getElementById('videoEditorPlayhead');
    if (!video || !playhead || !window.videoEditorDuration) return;
    var percent = (video.currentTime / window.videoEditorDuration) * 100;
    playhead.style.left = percent + '%';
};}catch(e){console.warn("[legacy] updateVideoPlayhead",e);}
try{ if(typeof window.openVideoStudioFallback!=="function"||__OVER.indexOf("openVideoStudioFallback")>=0) window.openVideoStudioFallback=function () {
    var type = prompt('Video türü seçin:\n1. Senaryo (story)\n2. Reels Fikirleri (reels)\n3. Video URL Analiz (analyze)\n\nNumara girin (1/2/3):', '1');
    if (!type) return;
    var typeMap = { '1': 'story', '2': 'reels', '3': 'analyze' };
    var typeKey = typeMap[type] || 'story';
    var input = prompt('Konu / URL / açıklama girin:');
    if (!input) return;
    if (typeof window.runVideoStudioQuick === 'function') {
        window.runVideoStudioQuick(typeKey, input);
    } else {
        showNotification('Video Stüdyosu yükleniyor...', 'warning');
    }
};}catch(e){console.warn("[legacy] openVideoStudioFallback",e);}
try{ if(typeof window.closeVideoStudio!=="function"||__OVER.indexOf("closeVideoStudio")>=0) window.closeVideoStudio=function () {
    var modal = document.getElementById('videoStudioModal');
    if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
    }
    window.videoStudioActive = false;
};}catch(e){console.warn("[legacy] closeVideoStudio",e);}
try{ if(typeof window.runVideoStudioQuick!=="function"||__OVER.indexOf("runVideoStudioQuick")>=0) window.runVideoStudioQuick=async function (type, input) {
    showNotification('⏳ Video stüdyo işleniyor...', 'success');
    try {
        var result = await Parse.Cloud.run('videoStudioProcess', { type: type, input: input });
        if (result && result.success) {
            var msg = '✅ Oluşturuldu!\n\n' + (result.result || '').substring(0, 500);
            alert(msg);
            if (result.downloadUrl) {
                window.open(result.downloadUrl, '_blank');
            }
        } else {
            showNotification('❌ ' + (result.error || 'İşlenemedi'), 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] runVideoStudioQuick",e);}
try{ if(typeof window.runVideoStudio!=="function"||__OVER.indexOf("runVideoStudio")>=0) window.runVideoStudio=async function () {
    var typeEl = document.getElementById('videoStudioType');
    var inputEl = document.getElementById('videoStudioInput');
    var type = typeEl ? typeEl.value : 'story';
    var input = inputEl ? inputEl.value.trim() : '';
    if (!input) return showNotification('Lütfen bir açıklama veya URL girin!', 'warning');
    var resultEl = document.getElementById('videoStudioResult');
    if (resultEl) resultEl.textContent = '⏳ İşleniyor...';
    try {
        var result = await Parse.Cloud.run('videoStudioProcess', { type: type, input: input });
        if (resultEl) {
            if (result && result.success) {
                var html = '<div style="line-height:1.75; color:var(--text2);">' + window.escapeHtml(result.result || '').replace(/\n/g, '<br>') + '</div>';
                if (result.downloadUrl) {
                    html += '<div style="margin-top:14px;"><a href="' + result.downloadUrl + '" download class="btn-primary" style="display:inline-block; padding:10px 22px; text-decoration:none; border-radius:30px;">📥 ' + window.escapeHtml(result.fileName || 'İndir') + '</a></div>';
                }
                resultEl.innerHTML = html;
            } else {
                resultEl.innerHTML = '<span style="color:var(--danger);">❌ ' + window.escapeHtml(result.error || 'İşlenemedi') + '</span>';
            }
        }
    } catch (e) {
        if (resultEl) resultEl.innerHTML = '<span style="color:var(--danger);">❌ Hata: ' + window.escapeHtml(e.message) + '</span>';
    }
};}catch(e){console.warn("[legacy] runVideoStudio",e);}
try{ if(typeof window.open3DBuilder!=="function"||__OVER.indexOf("open3DBuilder")>=0) window.open3DBuilder=function () {
    if (!currentUser) {
        showNotification('3D Studio için giriş yapın!', 'error');
        return;
    }
    var builder = document.getElementById('full3DBuilder');
    if (!builder) {
        showNotification('3D Studio yükleniyor...', 'warning');
        return;
    }
    builder.classList.add('open');
    builder.style.display = 'flex';
    if (typeof window.init3D === 'function') {
        try { window.init3D(); } catch (e) { console.warn('init3D hatası:', e); }
    }
    if (typeof window.addLogInfo === 'function') {
        window.addLogInfo('AETHRION 3D Studio açıldı');
    }
    setTimeout(function () {
        try {
            if (window.camera && window.renderer) {
                var container = document.getElementById('full3DStage');
                if (container) {
                    var w = container.clientWidth;
                    var h = container.clientHeight;
                    if (w > 0 && h > 0) {
                        window.camera.aspect = w / h;
                        window.camera.updateProjectionMatrix();
                        window.renderer.setSize(w, h);
                    }
                }
            }
        } catch (e) { console.warn('Canvas resize hatası:', e); }
    }, 300);
};}catch(e){console.warn("[legacy] open3DBuilder",e);}
try{ if(typeof window.open3DBuilderFull==="undefined") window.open3DBuilderFull=window.open3DBuilder;}catch(e){console.warn("[legacy] open3DBuilderFull",e);}
try{ if(typeof window.close3DBuilder!=="function"||__OVER.indexOf("close3DBuilder")>=0) window.close3DBuilder=function () {
    var builder = document.getElementById('full3DBuilder');
    if (builder) {
        builder.classList.remove('open');
        builder.style.display = 'none';
    }
};}catch(e){console.warn("[legacy] close3DBuilder",e);}
try{ if(typeof window.openModeratorAssignModal!=="function"||__OVER.indexOf("openModeratorAssignModal")>=0) window.openModeratorAssignModal=function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (currentUser.get('role') !== 'founder') {
        return showNotification('Bu işlem sadece kurucuya aittir!', 'error');
    }
    var modal = document.getElementById('moderatorAssignModal');
    if (!modal) {
        showNotification('Moderatör atama modalı bulunamadı!', 'error');
        return;
    }
    var emailInput = document.getElementById('moderatorModalEmailInput');
    var errEl = document.getElementById('moderatorAssignError');
    if (emailInput) emailInput.value = '';
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
    modal.classList.add('open');
    modal.style.display = 'flex';
    setTimeout(function () { if (emailInput) emailInput.focus(); }, 200);
};}catch(e){console.warn("[legacy] openModeratorAssignModal",e);}
try{ if(typeof window.submitModeratorAssignment!=="function"||__OVER.indexOf("submitModeratorAssignment")>=0) window.submitModeratorAssignment=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (currentUser.get('role') !== 'founder') {
        return showNotification('Bu işlem sadece kurucuya aittir!', 'error');
    }
    var emailInput = document.getElementById('moderatorModalEmailInput');
    var errEl = document.getElementById('moderatorAssignError');
    var email = emailInput ? emailInput.value.trim() : '';

    function showErr(msg) {
        if (errEl) { errEl.textContent = '❌ ' + msg; errEl.style.display = 'block'; }
        showNotification('❌ ' + msg, 'error');
    }
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    if (!email) return showErr('E-posta adresi gerekli!');
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return showErr('Geçerli bir e-posta adresi girin!');
    if (email.toLowerCase() === currentUser.get('email').toLowerCase()) {
        return showErr('Kendinizi moderatör yapamazsınız!');
    }

    try {
        var result = await Parse.Cloud.run('assignModeratorByEmail', { email: email.toLowerCase() });
        if (result && result.success) {
            showNotification('✅ ' + email + ' başarıyla Moderatör yapıldı!', 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('AETHRION Moderatör atandı: ' + email);
            }
            closeModal('moderatorAssignModal');
            await window.loadModeratorsList();
        } else {
            showErr((result && result.error) ? result.error : 'Atama yapılamadı.');
        }
    } catch (e) {
        console.error('Moderatör atama hatası:', e);
        showErr(e.message || 'Bilinmeyen hata');
    }
};}catch(e){console.warn("[legacy] submitModeratorAssignment",e);}
try{ if(typeof window.assignModeratorByEmail!=="function"||__OVER.indexOf("assignModeratorByEmail")>=0) window.assignModeratorByEmail=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (currentUser.get('role') !== 'founder') {
        return showNotification('Bu işlem sadece kurucuya aittir!', 'error');
    }
    var emailInput = document.getElementById('moderatorAssignEmailInput');
    if (!emailInput) emailInput = document.getElementById('moderatorModalEmailInput');
    if (!emailInput) return showNotification('E-posta alanı bulunamadı!', 'error');
    var email = emailInput.value.trim();
    if (!email) return showNotification('E-posta adresi girin!', 'warning');
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return showNotification('Geçerli bir e-posta adresi girin!', 'error');
    if (email.toLowerCase() === currentUser.get('email').toLowerCase()) {
        return showNotification('Kendinizi moderatör yapamazsınız!', 'error');
    }
    try {
        var result = await Parse.Cloud.run('assignModeratorByEmail', { email: email.toLowerCase() });
        if (result && result.success) {
            showNotification('✅ ' + email + ' başarıyla Moderatör yapıldı!', 'success');
            emailInput.value = '';
            await window.loadModeratorsList();
        } else {
            showNotification('❌ ' + ((result && result.error) ? result.error : 'Atama yapılamadı.'), 'error');
        }
    } catch (e) {
        console.error('Moderatör atama hatası:', e);
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] assignModeratorByEmail",e);}
try{ if(typeof window.loadModeratorsList!=="function"||__OVER.indexOf("loadModeratorsList")>=0) window.loadModeratorsList=async function () {
    if (!currentUser) return;
    if (currentUser.get('role') !== 'founder') {
        return showNotification('Bu liste sadece kurucuya aittir!', 'error');
    }
    var container = document.getElementById('moderatorListContainer');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '<div style="text-align:center; padding:12px; color:var(--text3); font-size:12px;">⏳ Yükleniyor...</div>';
    try {
        var result = await Parse.Cloud.run('getModerators', {});
        var mods = (result && result.moderators) ? result.moderators : [];
        if (mods.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:14px; color:var(--text3); font-size:12px;">📭 Henüz moderatör atanmamış.</div>';
            return;
        }
        var html = '<div style="display:flex; flex-direction:column; gap:6px;">';
        mods.forEach(function (m) {
            var safeEmail = window.escapeHtml(m.email || '');
            var safeName = window.escapeHtml(m.name || 'İsimsiz');
            var safeEmailOnclick = (window.escapeForOnclick ? window.escapeForOnclick(m.email) : m.email);
            html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(0,0,0,0.25); border-radius:8px; border-left:3px solid var(--moderator); gap:8px; flex-wrap:wrap;">';
            html += '<div style="flex:1; min-width:0;">';
            html += '<div style="font-weight:600; color:var(--moderator); font-size:13px;">🎨 ' + safeName + '</div>';
            html += '<div style="font-size:11px; color:var(--text3); word-break:break-all;">' + safeEmail + '</div>';
            html += '</div>';
            html += '<button class="btn-danger btn-sm" onclick="window.removeModeratorByEmail(\'' + safeEmailOnclick + '\')" style="font-size:10px; padding:4px 10px;">🚫 Çıkar</button>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('Moderatör listesi yüklenemedi:', e);
        container.innerHTML = '<div style="text-align:center; padding:12px; color:var(--danger); font-size:12px;">⚠️ Yüklenemedi: ' + window.escapeHtml(e.message) + '</div>';
    }
};}catch(e){console.warn("[legacy] loadModeratorsList",e);}
try{ if(typeof window.removeModeratorPrompt!=="function"||__OVER.indexOf("removeModeratorPrompt")>=0) window.removeModeratorPrompt=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (currentUser.get('role') !== 'founder') {
        return showNotification('Bu işlem sadece kurucuya aittir!', 'error');
    }
    var email = prompt('Moderatörlükten çıkarılacak kullanıcının e-posta adresini girin:');
    if (!email) return;
    email = email.trim().toLowerCase();
    if (!email) return;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return showNotification('Geçerli bir e-posta girin!', 'error');
    await window.removeModeratorByEmail(email);
};}catch(e){console.warn("[legacy] removeModeratorPrompt",e);}
try{ if(typeof window.removeModeratorByEmail!=="function"||__OVER.indexOf("removeModeratorByEmail")>=0) window.removeModeratorByEmail=async function (email) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (currentUser.get('role') !== 'founder') {
        return showNotification('Bu işlem sadece kurucuya aittir!', 'error');
    }
    if (!email) return showNotification('E-posta gerekli!', 'error');
    if (!confirm(email + ' adlı kullanıcının moderatörlüğünü kaldırmak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('setUserRole', { email: email.toLowerCase(), role: 'user' });
        if (result && result.success) {
            showNotification('✅ ' + email + ' moderatörlükten çıkarıldı.', 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('AETHRION Moderatörlük kaldırıldı: ' + email);
            }
            await window.loadModeratorsList();
        } else {
            showNotification('❌ ' + ((result && result.error) ? result.error : 'İşlem başarısız.'), 'error');
        }
    } catch (e) {
        console.error('Moderatör çıkarma hatası:', e);
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] removeModeratorByEmail",e);}
try{ if(typeof window.syncLogsToBackend!=="function"||__OVER.indexOf("syncLogsToBackend")>=0) window.syncLogsToBackend=async function () {
    if (!currentUser || !parseInitialized) return;
    try {
        var criticalLogs = window.logsCache.filter(function (log) {
            return log.level === 'error' || log.level === 'critical';
        }).slice(-20);
        if (criticalLogs.length === 0) return;
        await Parse.Cloud.run('syncClientLogs', { logs: criticalLogs });
        console.log('✅ ' + criticalLogs.length + ' kritik log backend\'e gönderildi');
    } catch (e) {
        console.warn('Log backend sync hatası:', e);
    }
};}catch(e){console.warn("[legacy] syncLogsToBackend",e);}
try{ if(typeof window.checkFirstTimeSetup!=="function"||__OVER.indexOf("checkFirstTimeSetup")>=0) window.checkFirstTimeSetup=async function () {
    try {
        if (!parseInitialized) return;
        var userCount = await new Parse.Query(Parse.User).count({ useMasterKey: true });
        if (userCount === 0) {
            console.log('🆕 İlk kurulum algılandı, admin hesapları oluşturulacak...');
            try {
                await Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true });
                if (typeof window.addLogSuccess === 'function') {
                    window.addLogSuccess('İlk kurulum: Admin hesapları oluşturuldu');
                }
            } catch (e) {
                console.warn('İlk kurulum hatası:', e.message);
            }
        }
    } catch (e) {
        console.warn('İlk kurulum kontrolü başarısız:', e.message);
    }
};}catch(e){console.warn("[legacy] checkFirstTimeSetup",e);}
try{ if(typeof window.openAethrionAlWithJarvis!=="function"||__OVER.indexOf("openAethrionAlWithJarvis")>=0) window.openAethrionAlWithJarvis=function () {
    if (typeof window.openAethrionAlPanel === 'function') {
        window.openAethrionAlPanel();
        // Panel açıldıktan sonra JARVIS dinlemeyi başlat
        setTimeout(function () {
            var voiceBtn = document.getElementById('vzVoiceChatBtn');
            if (voiceBtn) {
                voiceBtn.onclick = function () {
                    if (typeof window.openVoiceChatFullscreen === 'function') {
                        window.openVoiceChatFullscreen();
                    }
                    // Sesli sohbet fullscreen'de JARVIS wake word dinlemeyi başlat
                    setTimeout(function () {
                        if (typeof window.startJarvisWakeWordListening === 'function') {
                            // JARVIS modülü zaten yüklü, direkt çağır
                        }
                    }, 500);
                };
            }
        }, 500);
    }
};}catch(e){console.warn("[legacy] openAethrionAlWithJarvis",e);}
try{ if(typeof window.enhanceVoiceChatWithJarvis!=="function"||__OVER.indexOf("enhanceVoiceChatWithJarvis")>=0) window.enhanceVoiceChatWithJarvis=function () {
    var voiceChatFullscreen = document.getElementById('voiceChatFullscreen');
    if (!voiceChatFullscreen) return;

    // Sesli sohbet modalı açıldığında JARVIS wake word dinlemeyi başlat
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.attributeName === 'class') {
                var isOpen = voiceChatFullscreen.classList.contains('open');
                if (isOpen) {
                    // JARVIS dinlemeyi başlat
                    if (typeof window.startJarvisWakeWordListening === 'function') {
                        // Zaten çalışıyorsa durdur, yeniden başlat
                        if (window.jarvisRecognition) {
                            try { window.jarvisRecognition.abort(); } catch (e) {}
                        }
                        window.startJarvisWakeWordListening();
                    }
                } else {
                    // Kapatıldığında dinlemeyi durdur
                    if (window.jarvisRecognition) {
                        try { window.jarvisRecognition.abort(); } catch (e) {}
                        window.jarvisRecognition = null;
                    }
                }
            }
        });
    });

    observer.observe(voiceChatFullscreen, { attributes: true });
};}catch(e){console.warn("[legacy] enhanceVoiceChatWithJarvis",e);}
var vizyonPatrolActive=true;
if(typeof window.vizyonPatrolActive==="undefined")window.vizyonPatrolActive=vizyonPatrolActive;
var aethrionPatrolActive=true;
if(typeof window.aethrionPatrolActive==="undefined")window.aethrionPatrolActive=aethrionPatrolActive;
var vizyonSupportActive=true;
if(typeof window.vizyonSupportActive==="undefined")window.vizyonSupportActive=vizyonSupportActive;
var aethrionSupportActive=true;
if(typeof window.aethrionSupportActive==="undefined")window.aethrionSupportActive=aethrionSupportActive;
var teamPageOpen=false;
if(typeof window.teamPageOpen==="undefined")window.teamPageOpen=teamPageOpen;
var currentUserId=null;
if(typeof window.currentUserId==="undefined")window.currentUserId=currentUserId;
var vizyonSupportMessagesCache=[];
if(typeof window.vizyonSupportMessagesCache==="undefined")window.vizyonSupportMessagesCache=vizyonSupportMessagesCache;
var aethrionSupportMessagesCache=[];
if(typeof window.aethrionSupportMessagesCache==="undefined")window.aethrionSupportMessagesCache=aethrionSupportMessagesCache;
var vizyonSupportContext={};
if(typeof window.vizyonSupportContext==="undefined")window.vizyonSupportContext=vizyonSupportContext;
var isFounder=false;
if(typeof window.isFounder==="undefined")window.isFounder=isFounder;
var currentGifData=[];
if(typeof window.currentGifData==="undefined")window.currentGifData=currentGifData;
function escapeHtml(text) {
    if (!text) return text;
    return String(text).replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}
if(typeof window.escapeHtml!=="function"||__OVER.indexOf("escapeHtml")>=0)window.escapeHtml=escapeHtml;
function escapeForOnclick(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;');
}
if(typeof window.escapeForOnclick!=="function"||__OVER.indexOf("escapeForOnclick")>=0)window.escapeForOnclick=escapeForOnclick;
function renderMessageContent(content) {
    if (!content) return '';
    var escaped = window.escapeHtml(content);
    escaped = escaped.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width:100%; max-height:250px; border-radius:12px; margin-top:6px; display:block; cursor:pointer;" onclick="window.open(\'$2\', \'_blank\')">'
    );
    escaped = escaped.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" style="color:var(--accent); text-decoration:underline;">$1</a>'
    );
    escaped = escaped.replace(/\n/g, '<br>');
    return escaped;
}
if(typeof window.renderMessageContent!=="function"||__OVER.indexOf("renderMessageContent")>=0)window.renderMessageContent=renderMessageContent;
try{ if(typeof window.openInfoPage!=="function"||__OVER.indexOf("openInfoPage")>=0) window.openInfoPage=function (type) {
    var modal = document.getElementById('infoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'infoModal';
        modal.className = 'modal-overlay';
        modal.onclick = function (e) { if (e.target === this) window.closeModal('infoModal'); };
        document.body.appendChild(modal);
    }

    var title = '';
    var content = '';

    switch (type) {
        case 'vizyonAI':
        case 'aethrionAI':
            title = '🤖 AETHRION AI';
            content = `
                <p><strong>AETHRION AI</strong>, <strong style="color:var(--nvidia);">28 farklı yapay zeka modelini</strong> tek bir platformda birleştiren devrim niteliğinde bir asistan sistemidir.</p>
                <p><strong style="color:var(--accent);">13 Yerli Ollama Modeli:</strong></p>
                <ul>
                    <li>granite3.3:2b (IBM Granite)</li>
                    <li>qwen2.5vl:3b (Vision Language)</li>
                    <li>phi4-mini-reasoning (Microsoft Phi 4 Reasoning)</li>
                    <li>gemma3:4b (Google Gemma 3)</li>
                    <li>qwen3:8b (En Güçlü Qwen 3)</li>
                    <li>qwen3:4b (Hızlı Qwen 3)</li>
                    <li>qwen2.5-coder:latest (Kod Odaklı)</li>
                    <li>mistral:latest (Mistral AI)</li>
                    <li>phi3.5:latest (Microsoft Phi 3.5)</li>
                    <li>gemma2:latest (Google Gemma 2)</li>
                    <li>llama3.2:latest (Meta Llama 3.2)</li>
                    <li>qwen2.5:latest (Alibaba Qwen 2.5)</li>
                    <li>deepseek-r1:latest (Reasoning)</li>
                </ul>
                <p><strong style="color:var(--nvidia);">7 NVIDIA NIM Modeli:</strong></p>
                <ul>
                    <li>Llama-3.3-70B (Meta NIM)</li>
                    <li>Llama-3.1-8B (Meta NIM)</li>
                    <li>Qwen2.5-7B (Alibaba NIM)</li>
                    <li>Qwen2.5-Coder-32B (Kod NIM)</li>
                    <li>DeepSeek-R1-Distill (Reasoning NIM)</li>
                    <li>Gemma-2-2B (Google NIM)</li>
                    <li>Phi-3.5-MoE (Microsoft NIM)</li>
                </ul>
                <p><strong style="color:var(--purple);">8 Bulut API Modeli:</strong></p>
                <ul>
                    <li>Groq (Llama 3.3 70B) – En hızlı inferans</li>
                    <li>Gemini 2.0 Flash – Google</li>
                    <li>DeepSeek Chat – Derin düşünme</li>
                    <li>DeepInfra (Meta Llama 3.1 70B)</li>
                    <li>OpenAI GPT-4o-mini</li>
                    <li>Cerebras (Llama 3.3 70B)</li>
                    <li>OpenRouter (100+ modele erişim)</li>
                    <li>Cohere Command R Plus</li>
                </ul>
                <p><strong>Kullanım:</strong> Dashboard'da "AI Asistan" bölümünden veya ana sayfadaki "⚡ AETHRION AI'ı Başlat" butonundan erişebilirsin.</p>
                <p><em>Örnek sorgular: "Python'da REST API yaz", "React todo app yap", "dolar kaç", "bugün hava nasıl"</em></p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'kodEditor':
        case 'aethrionCreate':
            title = '⌨️ AETHRION Create (Kod Editörü)';
            content = `
                <p><strong>AETHRION Create</strong>, yapay zeka ile kod yazmanın en hızlı ve etkili yoludur.</p>
                <p>Hangi dili kullanırsan kullan, AI sana çalışan kodları anında üretir.</p>
                <ul>
                    <li>🐍 Python</li>
                    <li>⚛️ React / Next.js</li>
                    <li>🌐 HTML, CSS, JavaScript</li>
                    <li>🗄️ SQL</li>
                    <li>🐳 Docker</li>
                    <li>☕ Java, C#, C++</li>
                    <li>📱 Flutter, React Native</li>
                </ul>
                <p><strong>Nasıl çalışır?</strong> Sadece "Python'da hesap makinesi yaz" veya "React'te todo app yap" gibi komutlar ver. AI sana doğrudan kodu verir.</p>
                <p><strong style="color:var(--nvidia);">28 model</strong> sırayla denenir, en iyi cevabı veren kullanılır.</p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'api':
        case 'aethrionAPI':
            title = '🔌 AETHRION API';
            content = `
                <p><strong>AETHRION API</strong>, Back4app Cloud Code üzerinden çalışır. Tüm fonksiyonlara JavaScript (Parse SDK) ile erişebilirsin.</p>
                <p><strong>Kullanılabilir Fonksiyonlar:</strong></p>
                <ul>
                    <li><code>callGroq</code> – Groq Llama 3.3 70B</li>
                    <li><code>callGemini</code> – Gemini 2.0 Flash</li>
                    <li><code>callDeepSeek</code> – DeepSeek Chat</li>
                    <li><code>callDeepInfra</code> – Meta Llama 3.1 70B</li>
                    <li><code>callOpenAI</code> – GPT-4o-mini</li>
                    <li><code>callCerebras</code> – Llama 3.3 70B</li>
                    <li><code>callOpenRouter</code> – 100+ model</li>
                    <li><code>callCohere</code> – Command R Plus</li>
                    <li><code>callNvidiaNIM</code> – NVIDIA NIM (7 model)</li>
                    <li><code>callLocalLlama</code> – 13 yerli Ollama modeli</li>
                    <li><code>superAI</code> – Tüm 28 modeli dener, en iyisini getirir.</li>
                    <li><code>v27ApiChat</code> – A27 API anahtarı ile AI sorgusu</li>
                    <li><code>v27ApiRest</code> – REST endpoint (Postman/cURL için)</li>
                </ul>
                <p><strong>Örnek çağrı:</strong></p>
                <pre style="background:#0a0a0a; padding:10px; border-radius:8px; border:1px solid #262632; color:#b8c0d0;">Parse.Cloud.run('superAI', { prompt: 'Merhaba' })
  .then(console.log)
  .catch(console.error);</pre>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'vizyonAl':
        case 'aethrionAl':
            title = '✨ AETHRION Al Paneli';
            content = `
                <p><strong>AETHRION Al</strong>, <strong style="color:var(--nvidia);">28 yapay zekayı</strong> tek panelde birleştiren çeyrek ekran AI aracıdır.</p>
                <p><strong>Nasıl Açılır?</strong></p>
                <ul>
                    <li>Sağ üst köşedeki <strong>3 çizgi menüye</strong> tıkla (inline panel)</li>
                    <li>Veya <a href="/vizyon-al.html" target="_blank" style="color:var(--accent); text-decoration:underline;">/vizyon-al.html</a> sayfasına git (tam sayfa)</li>
                    <li>Dashboard'da "✨ AETHRION Al" butonu da var</li>
                </ul>
                <p><strong>4 Farklı Mod:</strong></p>
                <ul>
                    <li>🌐 <strong>Normal</strong> – Tüm modeller eşit</li>
                    <li>🧠 <strong>Derin Düşünme</strong> – Uzun düşünür, internette gezer, ince mavi çizgiyle düşünme sürecini gösterir</li>
                    <li>🕵️ <strong>Ajan</strong> – Her siteye girer, şifre dahil tüm işlemleri yapar</li>
                    <li>💻 <strong>Yazılımcı</strong> – En iyi kod üretimi ve hata çözümü</li>
                </ul>
                <p><strong>Özellikler:</strong></p>
                <ul>
                    <li>🖥️ <strong>Ekran Okuma</strong> – İzin verirsen ekranını görebilir (tek kare / canlı)</li>
                    <li>🔊 <strong>Sesli Sohbet</strong> – Tam ekran ChatGPT gibi sesli sohbet</li>
                    <li>📎 <strong>Dosya Analiz</strong> – Fotoğraf, video, PDF, Word, Excel — okur, analiz eder, sunum oluşturur</li>
                    <li>📥 <strong>İndirilebilir Dosya</strong> – Oluşturduğu sunum/dosya için indirme butonu verir</li>
                    <li>🎤 <strong>Sesli Komut</strong> – Konuşarak soru sorabilirsin</li>
                    <li>🔑 <strong>A27 API Key Oluşturma</strong> – "A27 API anahtarı oluştur" diyerek anahtar alabilirsin</li>
                    <li>⚠️ <strong>Sorumluluk</strong> – İlk açılışta onay kutusu zorunlu</li>
                </ul>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'moderator':
            title = '🎨 AETHRION Moderatör / Tasarımcı';
            content = `
                <p><strong>AETHRION Moderatör / Tasarımcı Rütbesi</strong>, satın alınamaz ve butonu olmayan gizli bir rütbedir.</p>
                <p><strong>Nasıl Atanır?</strong></p>
                <ul>
                    <li>Sadece <strong style="color:var(--gold);">Kurucu</strong> tarafından mail ile atanır</li>
                    <li>Dashboard'da kurucu için özel atama bölümü var</li>
                    <li>Ekranı normal üye gibi görünür</li>
                    <li>Yetkileri sınırsızdır (Beta ve Admin ile aynı seviye)</li>
                </ul>
                <p><strong>Yetkileri:</strong></p>
                <ul>
                    <li>♾️ Sınırsız A27 API anahtarı</li>
                    <li>♾️ Sınırsız AI sorgusu (<strong style="color:var(--nvidia);">28 model</strong>)</li>
                    <li>🎬 Video kesit alma ve paylaşma</li>
                    <li>📨 Proje taleplerini yönlendirme</li>
                    <li>💡 Tavsiye ve analiz sunma</li>
                    <li>👥 Tüm takım özellikleri</li>
                </ul>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'logs':
            title = '📋 AETHRION Logs Sistemi';
            content = `
                <p><strong>AETHRION Logs Sistemi</strong>, sitedeki tüm olayları (bilgi, başarı, uyarı, hata, kritik) kaydeden ve gösteren bir araçtır.</p>
                <p><strong>Nasıl Açılır?</strong></p>
                <ul>
                    <li>Dashboard → Ayarlar → "📋 Logs" butonu</li>
                    <li>Dashboard alt kısmındaki "📋 Logs" butonu</li>
                    <li>Özellikler panelinden "Logs Sistemi"</li>
                </ul>
                <p><strong>5 Seviye:</strong></p>
                <ul>
                    <li>ℹ️ <strong>Info</strong> – Bilgi mesajları</li>
                    <li>✅ <strong>Success</strong> – Başarılı işlemler</li>
                    <li>⚠️ <strong>Warning</strong> – Uyarılar</li>
                    <li>❌ <strong>Error</strong> – Hatalar</li>
                    <li>🚨 <strong>Critical</strong> – Kritik hatalar (pulse animasyonlu)</li>
                </ul>
                <p><strong>Plan Limit:</strong> Logs sistemi sadece <strong style="color:var(--accent);">Pro</strong>, <strong style="color:var(--purple);">Takım</strong>, Admin, Beta, Moderatör ve Kurucu için açıktır.</p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'video':
            title = '🎬 AETHRION Video Stüdyosu';
            content = `
                <p><strong>AETHRION Video Stüdyosu</strong>, AI ile video senaryosu, sahne planı ve video oluşturma aracıdır.</p>
                <p><strong>4 Farklı İşlem:</strong></p>
                <ul>
                    <li>🎬 <strong>Video Senaryo</strong> – Fikirden tam senaryoya</li>
                    <li>🎞️ <strong>Reels Fikirleri</strong> – Kısa video fikirleri</li>
                    <li>📊 <strong>Video URL Analiz</strong> – Gerçek video analizi (YouTube destekli)</li>
                    <li>🎥 <strong>Video Kesit</strong> – Moderatör kesit aracı</li>
                </ul>
                <p><strong>Plan Limit:</strong></p>
                <ul>
                    <li>🆓 <strong>Ücretsiz:</strong> Video oluşturma yok</li>
                    <li>🌟 <strong>Pro:</strong> Ayda 10 video</li>
                    <li>👥 <strong>Takım+:</strong> Sınırsız</li>
                </ul>
                <p><strong style="color:var(--nvidia);">28 model</strong> ile video senaryosu ve analizi.</p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'v27api':
        case 'a27api':
            title = '🔑 A27 API';
            content = `
                <p><strong>A27 API Anahtarı</strong>, AETHRION AI'nın <strong style="color:var(--nvidia);">28 model birleşik gücünü</strong> kendi projelerine taşımanı sağlar.</p>
                <p><strong>Nasıl Alınır?</strong></p>
                <ul>
                    <li>Dashboard → "AETHRION API Anahtarı (A27)"</li>
                    <li>Ad ve süre seç (Süresiz / 1y / 5m / 1m / 1w)</li>
                    <li>Anahtarı kopyala (bir kez gösterilir!)</li>
                    <li><strong style="color:var(--gold);">Kısayol:</strong> Aethrion Al'a "A27 API anahtarı oluştur" de!</li>
                </ul>
                <p><strong>Limitler:</strong></p>
                <ul>
                    <li>👑 Kurucu / ⚙️ Admin / 🔬 Beta / 🎨 Moderatör: ♾️ Sınırsız</li>
                    <li>👥 Takım: 100 adet</li>
                    <li>🌟 Pro: 20 adet</li>
                    <li>🆓 Ücretsiz: 2 adet</li>
                </ul>
                <p><strong>Kullanım:</strong> API isteklerinde <code>X-A27-Api-Key</code> başlığı olarak veya <code>apiKey</code> parametresi olarak gönder.</p>
                <p><strong>Detaylı rehber için:</strong> Dashboard → 📖 A27 API Key Rehberi</p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'dokumantasyon':
            title = '📚 AETHRION Dokümantasyon';
            content = `
                <p><strong>AETHRION Dokümantasyonu</strong> yakında tüm özellikleri, API kullanımını, takım yönetimini ve daha fazlasını detaylıca anlatacak.</p>
                <p>Şimdilik aşağıdaki kaynaklardan yararlanabilirsin:</p>
                <ul>
                    <li>📖 <a href="javascript:void(0)" onclick="window.closeModal('infoModal'); window.openHelpArticle();">"Bana Öğret"</a> – Temel rehber</li>
                    <li>📖 <a href="javascript:void(0)" onclick="window.closeModal('infoModal'); window.openV27ApiGuide();">A27 API Key Rehberi</a> – Detaylı API rehberi</li>
                    <li>💬 <a href="javascript:void(0)" onclick="window.closeModal('infoModal'); window.openVizyonSupport();">Aethrion Destek</a> – Canlı yardım</li>
                    <li>👑 <a href="javascript:void(0)" onclick="window.closeModal('infoModal'); window.contactFounder();">Kurucu ile İletişim</a></li>
                </ul>
                <p>Dokümantasyon tamamlandığında buradan erişilebilir olacak.</p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'blog':
            title = '📝 AETHRION Blog';
            content = `
                <p><strong>AETHRION Blog</strong>, yapay zeka dünyasındaki gelişmeleri, platform güncellemelerini ve eğitim içeriklerini paylaşacağımız yer.</p>
                <p>Yakında yayınlanacak konular:</p>
                <ul>
                    <li>🧠 28 Yapay Zeka Modeli Karşılaştırması</li>
                    <li>⚡ AETHRION AI ile Verimlilik Artışı</li>
                    <li>✨ Aethrion Al ile 4 Mod Kullanımı</li>
                    <li>🔊 Sesli Sohbet Nasıl Kullanılır?</li>
                    <li>🎬 Video Stüdyosu ile İçerik Üretimi</li>
                    <li>📋 Logs Sistemi Nedir?</li>
                    <li>👥 Takım Çalışmasının Gücü</li>
                    <li>🔑 A27 API ile Kendi Projeni Yap</li>
                    <li>🎨 Moderatör Rütbesi Nedir?</li>
                    <li>💼 A27 İş İlanları Mağazası</li>
                </ul>
                <p>Blog yazıları için bizi takip etmeye devam et!</p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'hakkimizda':
            title = '👥 AETHRION Hakkında';
            content = `
                <p><strong>AETHRION</strong>, genç ve dinamik bir ekibin hayali olarak doğdu. Amacımız, en güçlü yapay zeka teknolojilerini herkesin kullanımına sunmak.</p>
                <p>Ekibimiz, Eymen ve takım arkadaşlarından oluşuyor.</p>
                <p><strong>Misyonumuz:</strong> Yapay zekayı herkes için erişilebilir ve kullanışlı hale getirmek.</p>
                <p><strong>Vizyonumuz:</strong> Dünyanın en iyi yapay zeka ekosistemini inşa etmek.</p>
                <p><strong>Sloganımız:</strong> <em style="color:var(--accent2);">Intelligence Without Limits.</em></p>
                <p>📧 <a href="mailto:aethrion.official@gmail.com">aethrion.official@gmail.com</a></p>
            `;
            break;
        case 'kariyer':
            title = '💼 AETHRION Kariyer';
            content = `
                <p><strong>AETHRION</strong> ailesine katılmak ister misin?</p>
                <p>Şu an açık pozisyonlarımız yok ama her zaman yetenekli yazılımcı, tasarımcı ve yapay zeka meraklılarına kapımız açık.</p>
                <p><strong>Aradığımız nitelikler:</strong></p>
                <ul>
                    <li>✅ JavaScript / Python bilgisi</li>
                    <li>✅ Yapay zeka ve API'lerle çalışma isteği</li>
                    <li>✅ Takım çalışmasına yatkınlık</li>
                    <li>✅ Öğrenmeye açık olmak</li>
                </ul>
                <p>Bize e-posta gönder: <a href="mailto:aethrion.official@gmail.com">aethrion.official@gmail.com</a></p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'gizlilik':
            title = '🔒 AETHRION Gizlilik Politikası';
            content = `
                <p><strong>AETHRION Gizlilik Politikası</strong></p>
                <p><strong>1. Toplanan Veriler:</strong> Hesap bilgileri (e-posta, kullanıcı adı), kullanım verileri (AI sorguları, takım mesajları), cihaz bilgileri (cihaz modeli, işletim sistemi).</p>
                <p><strong>2. Toplanmayan Veriler:</strong> Konum, fotoğraf, rehber, SMS, arama kayıtları, biyometrik veriler, finansal bilgiler.</p>
                <p><strong>3. Veri Kullanımı:</strong> Yalnızca hizmet kalitesini artırmak ve size özel deneyim sunmak için.</p>
                <p><strong>4. Veri Paylaşımı:</strong> Hiçbir 3. tarafla paylaşılmaz, satılmaz, kiralanmaz.</p>
                <p><strong>5. Güvenlik:</strong> Back4app üzerinde AES-256-GCM ile şifrelenmiş olarak saklanır.</p>
                <p><strong>6. Kullanıcı Hakları:</strong> Bilgi edinme, düzeltme, silme, itiraz, veri taşınabilirliği.</p>
                <p><strong>7. Çocuklar:</strong> 13 yaş altı kullanıcılardan veri toplanmaz. Ebeveyn paneli mevcuttur.</p>
                <p><strong>8. İletişim:</strong> aethrion.official@gmail.com</p>
                <p><em>Son Güncelleme: 22 Eylül 2026</em></p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        case 'sozlesme':
            title = '📜 AETHRION Kullanıcı Sözleşmesi';
            content = `
                <p><strong>AETHRION Kullanıcı Sözleşmesi</strong></p>
                <p>Bu uygulamayı kullanarak aşağıdaki şartları kabul etmiş sayılırsın:</p>
                <ul>
                    <li>✅ Uygulama, eğitim ve kişisel kullanım içindir.</li>
                    <li>❌ Yasa dışı veya zararlı amaçlarla kullanılamaz.</li>
                    <li>🔒 Kişisel verilerin 3. şahıslarla paylaşılmaz.</li>
                    <li>📧 Her türlü sorunda <strong>aethrion.official@gmail.com</strong> adresinden iletişime geçebilirsin.</li>
                </ul>
                <p><strong>Fikri Mülkiyet:</strong> Uygulamanın tüm kodları, tasarımı ve içeriği AETHRION'a aittir. İzinsiz kopyalanamaz veya dağıtılamaz.</p>
                <p><strong>Sorumluluk Reddi:</strong> Uygulama, "olduğu gibi" sağlanır. Hiçbir garanti verilmez.</p>
                <p><strong>Aethrion Al Sorumluluğu:</strong> Aethrion Al'ın ekran okuma ve ajan modu kullanımından doğabilecek tüm sorumluluk kullanıcıya aittir.</p>
                <p><em>Son Güncelleme: 22 Eylül 2026</em></p>
                <p style="text-align:center;color:var(--accent2);font-style:italic;margin-top:14px;">AETHRION — Intelligence Without Limits.</p>
            `;
            break;
        default:
            title = 'ℹ️ Bilgi';
            content = '<p>Bu bölüm yakında doldurulacak.</p>';
    }

    modal.innerHTML = `
        <div class="modal" style="max-width:700px; max-height:90vh; overflow-y:auto;">
            <div class="modal-header">
                <h3 style="color:var(--accent);">${title}</h3>
                <button class="modal-close" onclick="window.closeModal('infoModal')">×</button>
            </div>
            <div style="padding:10px 0; color:var(--text2); line-height:1.8;">
                ${content}
            </div>
            <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
                <button class="btn-secondary" onclick="window.closeModal('infoModal')" style="flex:1; padding:12px; border-radius:40px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer; font-size:16px;">
                    ⬅️ Geri
                </button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    modal.classList.add('open');
};}catch(e){console.warn("[legacy] openInfoPage",e);}
try{ if(typeof window.toggleTeamPage!=="function"||__OVER.indexOf("toggleTeamPage")>=0) window.toggleTeamPage=function () {
    var page = document.getElementById('teamPage');
    if (!page) {
        page = document.querySelector('.team-page-overlay');
        if (!page) {
            page = document.createElement('div');
            page.id = 'teamPage';
            page.className = 'team-page-overlay';
            page.style.display = 'none';
            document.body.appendChild(page);
        }
    }
    if (page.classList.contains('open')) {
        page.classList.remove('open');
        page.style.display = 'none';
        teamPageOpen = false;
    } else {
        page.classList.add('open');
        page.style.display = 'flex';
        teamPageOpen = true;
        window.loadTeamPage();
        window.applyTranslations(currentLanguage);
    }
};}catch(e){console.warn("[legacy] toggleTeamPage",e);}
try{ if(typeof window.loadTeamPage!=="function"||__OVER.indexOf("loadTeamPage")>=0) window.loadTeamPage=async function () {
    if (!currentUser) return;
    var teamId = currentUser.get('teamId');
    var panelInfo = document.getElementById('teamPageInfo');
    var panelMessages = document.getElementById('teamPageMessages');
    var membersList = document.getElementById('teamPageMembersList');
    var changesList = document.getElementById('teamPageChangesList');
    var projectsDiv = document.getElementById('teamPageProjects');
    var inboxDiv = document.getElementById('teamPageInbox');
    var vizyonLogDiv = document.getElementById('teamPageVizyonLog');
    var inviteBtn = document.getElementById('teamPageInviteBtn');
    var leaveBtn = document.getElementById('teamPageLeaveBtn');
    var createBtn = document.getElementById('teamPageCreateBtn');
    var joinBtn = document.getElementById('teamPageJoinBtn');
    var codeInput = document.getElementById('teamPageCodeInput');
    var inviteEmail = document.getElementById('teamPageInviteInput');
    var badgeCount = document.getElementById('teamPageBadge');
    var closeBtn = document.getElementById('teamPageCloseBtn');
    var founderPanel = document.getElementById('teamPageFounderPanel');
    var memberManagementBtn = document.getElementById('teamMemberManagementBtn');
    var panelMemberCount = document.getElementById('teamPageMemberCount');
    var vizyonPatrolBtn = document.getElementById('vizyonPatrolBtn');
    var vizyonSupportBtn = document.getElementById('vizyonSupportBtn');

    var isVizyonFounder = currentUser && currentUser.get('email') === 'admin.tr.reis@gmail.com';

    if (!teamId) {
        if (panelInfo) panelInfo.innerHTML = '<span data-i18n="Takım kodu">Takım kodu</span>: <span class="team-code">-</span> <span>0 <span data-i18n="üye">üye</span></span>';
        if (panelMessages) panelMessages.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px;">Bir takıma üye değilsiniz. Takım kurun veya kodla katılın.</div>';
        if (membersList) membersList.innerHTML = '';
        if (changesList) changesList.innerHTML = '';
        if (projectsDiv) projectsDiv.innerHTML = 'Henüz proje yok.';
        if (inboxDiv) inboxDiv.innerHTML = '📭 Mesaj yok';
        if (vizyonLogDiv) vizyonLogDiv.innerHTML = 'Henüz kayıt yok.';
        if (createBtn) createBtn.style.display = 'inline-block';
        if (codeInput) codeInput.style.display = 'inline-block';
        if (joinBtn) joinBtn.style.display = 'inline-block';
        if (leaveBtn) leaveBtn.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'none';
        if (inviteBtn) inviteBtn.style.display = 'none';
        if (inviteEmail) inviteEmail.style.display = 'none';
        if (founderPanel) founderPanel.style.display = 'none';
        if (badgeCount) badgeCount.textContent = '0';
        if (memberManagementBtn) memberManagementBtn.style.display = 'none';
        if (panelMemberCount) panelMemberCount.textContent = '0 üye';
        if (vizyonPatrolBtn) vizyonPatrolBtn.style.display = 'none';
        if (vizyonSupportBtn) vizyonSupportBtn.style.display = 'none';
        window.applyTranslations(currentLanguage);
        return;
    }

    if (createBtn) createBtn.style.display = 'none';
    if (codeInput) codeInput.style.display = 'none';
    if (joinBtn) joinBtn.style.display = 'none';
    if (leaveBtn) leaveBtn.style.display = 'inline-block';

    if (vizyonPatrolBtn) {
        vizyonPatrolBtn.style.display = isVizyonFounder ? 'inline-flex' : 'none';
    }
    if (vizyonSupportBtn) {
        vizyonSupportBtn.style.display = isVizyonFounder ? 'inline-flex' : 'none';
    }

    try {
        const Team = Parse.Object.extend("Team");
        const Member = Parse.Object.extend("TeamMember");
        const Msg = Parse.Object.extend("TeamMessage");

        var query = new Parse.Query(Team);
        var team = await query.get(teamId);
        var memberQuery = new Parse.Query(Member);
        memberQuery.equalTo('team_id', teamId);
        var members = await memberQuery.find();
        var msgQuery = new Parse.Query(Msg);
        msgQuery.equalTo('team_id', teamId);
        msgQuery.ascending('createdAt');
        var messages = await msgQuery.find();

        var isOwner = (team.get('owner_email') === currentUser.get('email'));
        var isManager = (team.get('manager_email') === currentUser.get('email') && !isOwner);
        var canManage = isOwner || isManager;
        var isFounderRole = currentUser.get('role') === 'founder';
        var isModeratorRole = currentUser.get('role') === 'moderator';
        var isBetaRole = currentUser.get('role') === 'beta';
        var isAdminRole = currentUser.get('role') === 'admin';

        if (panelInfo) {
            panelInfo.innerHTML = `
                <span data-i18n="Takım kodu">Takım kodu</span>: <span class="team-code">${window.escapeHtml(team.get('teamCode') || '')}</span>
                <span>${members.length} <span data-i18n="üye">üye</span></span>
                <span style="font-size:12px;color:var(--text3);">👑 ${window.escapeHtml(team.get('owner_email') || '')}</span>
            `;
        }
        if (badgeCount) badgeCount.textContent = members.length;
        if (panelMemberCount) panelMemberCount.textContent = members.length + ' üye';

        var userEmail = currentUser.get('email');
        var chatHtml = '';
        messages.forEach(function (msg) {
            var sender = msg.get('user_name') || msg.get('user_email');
            var isSystem = msg.get('user_email') === 'system@aethrion.com';
            var isDeleted = msg.get('deleted') || false;
            var isDeletedByFounder = msg.get('deleted_by_founder') || false;
            var edited = msg.get('edited') || false;
            var cls = 'bot';
            var extraClass = '';
            var content = msg.get('message') || '';
            var msgId = msg.id;
            var isMyMessage = (msg.get('user_email') === userEmail);
            var canDelete = isMyMessage || canManage || isFounderRole || isModeratorRole;

            if (msg.get('user_email') === userEmail) cls = 'user';
            if (isSystem) {
                sender = '🧠 AETHRION AI';
                cls = 'bot';
                extraClass = ' vizyon-ai-msg aethrion-ai-msg';
                if (content.includes('aramıza katıldı')) extraClass += ' welcome-msg';
            }
            if (isDeleted) {
                if (isDeletedByFounder) {
                    cls = 'bot';
                    extraClass += ' founder-deleted';
                    content = '🚫 Bu gönderi takım kurucusu tarafından silinmiştir.';
                } else {
                    content = '🗑️ Bu mesaj silindi.';
                    extraClass += ' deleted-message';
                }
            }
            if (msg.get('user_email') === 'admin.tr.reis@gmail.com' && !isSystem) {
                sender += ' <span class="founder-badge">👑 AETHRION KURUCU</span>';
            }
            if (msg.get('user_email') === userEmail && currentUser.get('role') === 'moderator') {
                sender += ' <span class="role-badge moderator">🎨 MODERATÖR</span>';
            }

            var renderedContent = renderMessageContent(content);
            var safeSender = window.escapeHtml(sender)
                .replace(/&lt;span class=&quot;founder-badge&quot;&gt;/g, '<span class="founder-badge">')
                .replace(/&lt;span class=&quot;role-badge moderator&quot;&gt;/g, '<span class="role-badge moderator">')
                .replace(/&lt;\/span&gt;/g, '</span>');

            if (content) {
                chatHtml += '<div class="ai-message ' + cls + extraClass + '" id="teamMsg_' + msgId + '">';
                chatHtml += '<strong>' + safeSender + '</strong>: ' + renderedContent;
                if (edited) chatHtml += ' <span style="font-size:9px;color:var(--text3);">(düzenlendi)</span>';
                if (!isDeleted && !isSystem && canDelete) {
                    chatHtml += '<div class="team-msg-actions">';
                    if (isMyMessage) {
                        chatHtml += '<button onclick="window.editTeamMessage(\'' + msgId + '\')" title="Düzenle">✏️</button>';
                    }
                    chatHtml += '<button onclick="window.deleteTeamMessage(\'' + msgId + '\')" title="Sil">🗑️</button>';
                    chatHtml += '</div>';
                }
                chatHtml += '</div>';
            }
        });
        if (panelMessages) {
            panelMessages.innerHTML = chatHtml || '<div style="color:var(--text3);text-align:center;padding:20px;">Henüz mesaj yok</div>';
            panelMessages.scrollTop = panelMessages.scrollHeight;
        }

        var memberHtml = '';
        members.forEach(function (m) {
            var email = m.get('user_email');
            var isOwnerMember = (email === team.get('owner_email'));
            var isManagerMember = (email === team.get('manager_email'));
            var roleText = isOwnerMember ? '👑 Sahip' : (isManagerMember ? '⭐ Yönetici' : '👤 Üye');
            var isVizyonFounderMember = (email === 'admin.tr.reis@gmail.com');
            var name = m.get('user_name') || email.split('@')[0] || 'İsimsiz';
            var safeName = window.escapeHtml(name);
            var safeEmail = window.escapeHtml(email);
            if (isVizyonFounderMember) safeName += ' <span class="founder-badge">👑 AETHRION KURUCU</span>';
            memberHtml += '<div class="member-item"><span>' + safeName + ' (' + safeEmail + ')</span><span style="font-size:11px;color:var(--text3);">' + roleText + '</span></div>';
        });
        if (membersList) membersList.innerHTML = memberHtml;

        if (changesList) changesList.innerHTML = '<div style="color:var(--text3);">📋 Son değişiklikler burada görünecek.</div>';
        if (projectsDiv) projectsDiv.innerHTML = '📁 Henüz proje yok.';
        if (inboxDiv) inboxDiv.innerHTML = '📭 Mesaj kutusu boş.';
        if (vizyonLogDiv) vizyonLogDiv.innerHTML = '📜 Henüz kayıt yok.';

        if (inviteBtn) inviteBtn.style.display = canManage ? 'inline-block' : 'none';
        if (inviteEmail) inviteEmail.style.display = canManage ? 'inline-block' : 'none';
        if (closeBtn) closeBtn.style.display = isOwner ? 'inline-block' : 'none';
        if (memberManagementBtn) memberManagementBtn.style.display = (isOwner || isManager || isFounderRole || isModeratorRole || isAdminRole || isBetaRole) ? 'inline-block' : 'none';

        if (founderPanel) {
            if (isVizyonFounder) {
                founderPanel.style.display = 'block';
                var patrolStatus = document.getElementById('patrolStatus');
                if (patrolStatus) patrolStatus.textContent = aethrionPatrolActive ? 'AÇIK' : 'KAPALI';
                var supportStatus = document.getElementById('supportStatus');
                if (supportStatus) supportStatus.textContent = aethrionSupportActive ? 'AÇIK' : 'KAPALI';
                window.loadVizyonLog();
            } else {
                founderPanel.style.display = 'none';
            }
        }
        window.applyTranslations(currentLanguage);
    } catch (e) {
        console.error('Takım sayfası yüklenirken hata:', e);
        showNotification('Takım sayfası yüklenemedi: ' + e.message, 'error');
        window.addLogError('Takım sayfası yüklenemedi: ' + e.message);
    }
};}catch(e){console.warn("[legacy] loadTeamPage",e);}
try{ if(typeof window.sendTeamPageMessage!=="function"||__OVER.indexOf("sendTeamPageMessage")>=0) window.sendTeamPageMessage=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var teamId = currentUser.get('teamId');
    if (!teamId) return showNotification('Takımınız yok!', 'error');

    var msgInput = document.getElementById('teamPageInput');
    var msg = msgInput.value.trim();
    var fileInput = document.getElementById('teamPageFileInput');
    var file = fileInput ? fileInput.files[0] : null;
    if (!msg && !file) return showNotification('Lütfen bir mesaj yazın veya dosya seçin!', 'warning');

    try {
        var fileUrl = null, fileName = null, fileType = null;
        if (file) {
            var parseFile = new Parse.File(file.name, file);
            await parseFile.save();
            fileUrl = parseFile.url();
            fileName = file.name;
            fileType = file.type;
            fileInput.value = '';
        }

        // ✅ ÖNCE kullanıcının mesajını kaydet
        var result = await Parse.Cloud.run('sendTeamMessage', {
            teamId: teamId,
            message: msg,
            fileUrl: fileUrl,
            fileName: fileName,
            fileType: fileType
        });

        if (result.success) {
            msgInput.value = '';
            await window.loadTeamPage();
            showNotification('Mesaj gönderildi!', 'success');
            window.addLogInfo('AETHRION takım mesajı gönderildi');
        } else {
            showNotification('Mesaj gönderilemedi: ' + (result.error || 'Bilinmeyen hata'), 'error');
            window.addLogWarning('AETHRION takım mesajı hatası: ' + (result.error || 'Bilinmeyen'));
        }
    } catch (e) {
        console.error('Mesaj gönderme hatası:', e);
        showNotification('Hata: ' + e.message, 'error');
        window.addLogError('AETHRION takım mesajı hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] sendTeamPageMessage",e);}
try{ if(typeof window.deleteTeamMessage!=="function"||__OVER.indexOf("deleteTeamMessage")>=0) window.deleteTeamMessage=async function (msgId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!msgId) return showNotification('Mesaj ID gerekli!', 'error');
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;

    try {
        var result = await Parse.Cloud.run('deleteTeamMessage', { msgId: msgId });
        if (result.success) {
            showNotification('🗑️ Mesaj silindi.', 'success');
            window.addLogInfo('AETHRION takım mesajı silindi');
            await window.loadTeamPage();
        } else {
            showNotification('❌ ' + (result.error || result.message || 'Mesaj silinemedi!'), 'error');
        }
    } catch (e) {
        console.error('Mesaj silme hatası:', e);
        showNotification('Hata: ' + e.message, 'error');
        window.addLogError('AETHRION mesaj silme hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] deleteTeamMessage",e);}
try{ if(typeof window.editTeamMessage!=="function"||__OVER.indexOf("editTeamMessage")>=0) window.editTeamMessage=async function (msgId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!msgId) return showNotification('Mesaj ID gerekli!', 'error');

    try {
        var currentMsg = '';
        try {
            var msgResult = await Parse.Cloud.run('getTeamMessage', { msgId: msgId });
            if (msgResult && msgResult.success && msgResult.message) {
                currentMsg = msgResult.message.message || '';
            }
        } catch (e) { console.warn('Mevcut mesaj alınamadı:', e); }

        var newText = prompt('Mesajı düzenle:', currentMsg);
        if (newText === null) return;
        if (!newText.trim()) return showNotification('Mesaj boş olamaz!', 'error');
        if (newText.trim() === currentMsg.trim()) return showNotification('Değişiklik yapılmadı.', 'warning');

        var result = await Parse.Cloud.run('editTeamMessage', {
            msgId: msgId,
            newMessage: newText.trim()
        });

        if (result.success) {
            showNotification('✅ Mesaj düzenlendi.', 'success');
            window.addLogInfo('AETHRION takım mesajı düzenlendi');
            await window.loadTeamPage();
        } else {
            showNotification('❌ ' + (result.error || result.message || 'Mesaj düzenlenemedi!'), 'error');
        }
    } catch (e) {
        console.error('Mesaj düzenleme hatası:', e);
        showNotification('Hata: ' + e.message, 'error');
        window.addLogError('AETHRION mesaj düzenleme hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] editTeamMessage",e);}
try{ if(typeof window.getTeamMessage!=="function"||__OVER.indexOf("getTeamMessage")>=0) window.getTeamMessage=async function (msgId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!msgId) return showNotification('Mesaj ID gerekli!', 'error');
    try {
        var result = await Parse.Cloud.run('getTeamMessage', { msgId: msgId });
        if (result.success) {
            return result.message;
        } else {
            showNotification('❌ ' + (result.error || 'Mesaj bulunamadı!'), 'error');
            return null;
        }
    } catch (e) {
        console.error('Mesaj getirme hatası:', e);
        showNotification('Hata: ' + e.message, 'error');
        return null;
    }
};}catch(e){console.warn("[legacy] getTeamMessage",e);}
try{ if(typeof window.createTeamPage!=="function"||__OVER.indexOf("createTeamPage")>=0) window.createTeamPage=async function () {
    var name = prompt('Takım adı:');
    if (!name) return;
    try {
        var result = await Parse.Cloud.run('createTeam', { name: name });
        if (result.success) {
            currentUser.set('teamId', result.teamId);
            await currentUser.save();
            await window.loadTeamPage();
            showNotification('"' + name + '" takımı oluşturuldu! Takım kodu: ' + result.teamCode, 'success');
            window.addLogSuccess('AETHRION takım oluşturuldu: ' + name);
        } else {
            showNotification('Takım oluşturulamadı: ' + result.error, 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        window.addLogError('AETHRION takım oluşturma hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] createTeamPage",e);}
try{ if(typeof window.joinTeamPageWithCode!=="function"||__OVER.indexOf("joinTeamPageWithCode")>=0) window.joinTeamPageWithCode=async function () {
    var codeInput = document.getElementById('teamPageCodeInput');
    var teamCode = codeInput.value.trim();
    if (!teamCode) return showNotification('Lütfen bir takım kodu girin!', 'error');
    try {
        var result = await Parse.Cloud.run('joinTeamWithCode', { teamCode: teamCode });
        if (result.success) {
            currentUser.set('teamId', result.teamId);
            await currentUser.save();
            codeInput.value = '';
            await window.loadTeamPage();
            showNotification('✅ Takıma katıldınız!', 'success');
            window.addLogSuccess('AETHRION takıma katıldı: ' + teamCode);
        } else {
            showNotification('❌ ' + result.error, 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] joinTeamPageWithCode",e);}
try{ if(typeof window.leaveTeamPage!=="function"||__OVER.indexOf("leaveTeamPage")>=0) window.leaveTeamPage=async function () {
    if (!confirm('Takımdan ayrılmak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('leaveTeam');
        if (result.success) {
            await window.loadTeamPage();
            showNotification('Takımdan ayrıldınız.', 'success');
            window.addLogInfo('AETHRION takımdan ayrıldı');
        } else {
            showNotification('Hata: ' + result.error, 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] leaveTeamPage",e);}
try{ if(typeof window.closeTeamPage!=="function"||__OVER.indexOf("closeTeamPage")>=0) window.closeTeamPage=async function () {
    if (!confirm('Takımı kapatmak tüm verileri siler ve herkesi atar. Emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('closeTeam');
        if (result.success) {
            await window.loadTeamPage();
            showNotification('Takım kapatıldı.', 'success');
            window.addLogWarning('AETHRION takım kapatıldı');
        } else {
            showNotification('Hata: ' + result.error, 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] closeTeamPage",e);}
try{ if(typeof window.openTeamMemberManagement!=="function"||__OVER.indexOf("openTeamMemberManagement")>=0) window.openTeamMemberManagement=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var teamId = currentUser.get('teamId');
    if (!teamId) return showNotification('Takımınız yok!', 'error');
    try {
        var result = await Parse.Cloud.run('getTeamMembers');
        if (!result.success) return showNotification('Üye listesi alınamadı!', 'error');
        var container = document.getElementById('teamMemberListContainer');
        var modal = document.getElementById('teamMemberModal');
        if (!container) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay open';
            modal.id = 'teamMemberModal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal" style="max-width:700px;">
                    <div class="modal-header">
                        <h3 data-i18n="Üye Kontrolleri">👥 Üye Yönetimi</h3>
                        <button class="modal-close" onclick="window.closeModal('teamMemberModal')">×</button>
                    </div>
                    <div id="teamMemberListContainer" style="max-height:400px; overflow-y:auto;"></div>
                    <div style="margin-top:16px; display:flex; gap:8px; justify-content:flex-end;">
                        <button class="btn-secondary" onclick="window.closeModal('teamMemberModal')" data-i18n="Kapat">Kapat</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            container = document.getElementById('teamMemberListContainer');
        }
        modal.classList.add('open');
        modal.style.display = 'flex';

        var html = '';
        result.members.forEach(function (m) {
            var isOwner = m.isOwner;
            var isManager = m.isManager;
            var isCurrentUser = (m.email === currentUser.get('email'));
            var isVizyonFounder = (m.email === 'admin.tr.reis@gmail.com');
            var roleText = isOwner ? '👑 Sahip' : (isManager ? '⭐ Yönetici' : '👤 Üye');
            if (isVizyonFounder) roleText += ' 👑 AETHRION KURUCU';
            var safeName = window.escapeHtml(m.name || 'İsimsiz');
            var safeEmail = window.escapeHtml(m.email || '');
            html += `<div class="user-item" style="border-left-color: ${isOwner ? 'var(--gold)' : (isManager ? 'var(--accent)' : 'var(--border)')};">`;
            html += `<span style="font-weight:600;">${safeName}</span>`;
            html += `<span>${safeEmail}</span>`;
            html += `<span style="font-size:11px;color:var(--text3);">${roleText}</span>`;
            html += `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">`;
            if (!isOwner && !isVizyonFounder) {
                html += `<button class="btn-secondary btn-sm" onclick="window.makeManager('${safeEmail}')" style="font-size:9px;padding:2px 8px;" data-i18n="Yönetici Yap">⭐ Yönetici Yap</button>`;
            }
            if (isManager && !isOwner && !isVizyonFounder) {
                html += `<button class="btn-secondary btn-sm" onclick="window.demoteManager('${safeEmail}')" style="font-size:9px;padding:2px 8px;" data-i18n="Yöneticilikten Çıkar">⬇️ Yöneticilikten Çıkar</button>`;
            }
            if (!isOwner && !isCurrentUser && !isVizyonFounder) {
                html += `<button class="btn-danger btn-sm" onclick="window.removeMemberFromTeam('${safeEmail}')" style="font-size:9px;padding:2px 8px;" data-i18n="Takımdan At">🚫 Takımdan At</button>`;
            }
            if (isOwner && !isVizyonFounder && result.members.length > 1) {
                html += `<button class="btn-primary btn-sm" onclick="window.transferOwnership('${safeEmail}')" style="font-size:9px;padding:2px 8px;" data-i18n="Sahipliği Devret">👑 Sahipliği Devret</button>`;
            }
            html += `</div></div>`;
        });
        container.innerHTML = html;
        window.applyTranslations(currentLanguage);
    } catch (e) {
        showNotification('Üye listesi yüklenemedi: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] openTeamMemberManagement",e);}
try{ if(typeof window.makeManager!=="function"||__OVER.indexOf("makeManager")>=0) window.makeManager=async function (email) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm(email + ' adlı kullanıcıyı yönetici yapmak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('makeTeamManager', { targetEmail: email });
        showNotification(result.message || 'Kullanıcı yönetici yapıldı.', 'success');
        window.openTeamMemberManagement();
        window.loadTeamPage();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] makeManager",e);}
try{ if(typeof window.demoteManager!=="function"||__OVER.indexOf("demoteManager")>=0) window.demoteManager=async function (email) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm(email + ' adlı kullanıcıyı yöneticilikten çıkarmak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('demoteManager', { targetEmail: email });
        showNotification(result.message || 'Yöneticilik kaldırıldı.', 'success');
        window.openTeamMemberManagement();
        window.loadTeamPage();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] demoteManager",e);}
try{ if(typeof window.removeMemberFromTeam!=="function"||__OVER.indexOf("removeMemberFromTeam")>=0) window.removeMemberFromTeam=async function (email) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm(email + ' adlı kullanıcıyı takımdan atmak istediğinize emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('removeFromTeam', { targetEmail: email });
        showNotification(result.message || 'Kullanıcı takımdan atıldı.', 'success');
        window.addLogInfo('AETHRION takımdan atıldı: ' + email);
        window.openTeamMemberManagement();
        window.loadTeamPage();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] removeMemberFromTeam",e);}
try{ if(typeof window.transferOwnership!=="function"||__OVER.indexOf("transferOwnership")>=0) window.transferOwnership=async function (email) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!confirm('Takım sahipliğini ' + email + ' adlı kullanıcıya devretmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    try {
        var result = await Parse.Cloud.run('transferOwnership', { targetEmail: email });
        showNotification(result.message || 'Sahiplik devredildi.', 'success');
        window.openTeamMemberManagement();
        window.loadTeamPage();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] transferOwnership",e);}
try{ if(typeof window.inviteToTeamPage!=="function"||__OVER.indexOf("inviteToTeamPage")>=0) window.inviteToTeamPage=async function () {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    var teamId = currentUser.get('teamId');
    if (!teamId) return showNotification('Takımınız yok!', 'error');
    var inviteEmail = document.getElementById('teamPageInviteInput');
    if (!inviteEmail) return;
    var email = inviteEmail.value.trim();
    if (!email) return showNotification('E-posta girin!', 'warning');
    try {
        var result = await Parse.Cloud.run('inviteToTeam', { email: email });
        showNotification('📨 Davet gönderildi!', 'success');
        inviteEmail.value = '';
        window.addLogInfo('AETHRION takım daveti gönderildi: ' + email);
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] inviteToTeamPage",e);}
try{ if(typeof window.acceptTeamInvite!=="function"||__OVER.indexOf("acceptTeamInvite")>=0) window.acceptTeamInvite=async function (teamId, inboxId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        var result = await Parse.Cloud.run('acceptTeamInvite', { teamId: teamId, inboxId: inboxId });
        showNotification('✅ Takıma katıldınız!', 'success');
        window.loadInbox();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] acceptTeamInvite",e);}
try{ if(typeof window.rejectTeamInvite!=="function"||__OVER.indexOf("rejectTeamInvite")>=0) window.rejectTeamInvite=async function (inboxId) {
    if (!currentUser) return showNotification('Önce giriş yapın!', 'error');
    try {
        await Parse.Cloud.run('rejectTeamInvite', { inboxId: inboxId });
        showNotification('Davet reddedildi.', 'warning');
        window.loadInbox();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] rejectTeamInvite",e);}
try{ if(typeof window.openVizyonSupport!=="function"||__OVER.indexOf("openVizyonSupport")>=0) window.openVizyonSupport=function () {
    window.openAethrionSupport();
};}catch(e){console.warn("[legacy] openVizyonSupport",e);}
try{ if(typeof window.openAethrionSupport!=="function"||__OVER.indexOf("openAethrionSupport")>=0) window.openAethrionSupport=function () {
    var panel = document.getElementById('vizyonSupportPanel');
    if (!panel) {
        panel = document.querySelector('.vizyon-support-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'vizyonSupportPanel';
            panel.className = 'team-page-overlay vizyon-support-panel';
            panel.style.display = 'none';
            panel.innerHTML = `
                <div class="team-page-header">
                    <h2 data-i18n="Aethrion Destek">📢 AETHRION Destek</h2>
                    <button class="team-page-close" onclick="window.closeAethrionSupport()">×</button>
                </div>
                <div class="team-page-body" style="display:flex;flex-direction:column;gap:16px;">
                    <div style="background:var(--surface);border-radius:16px;border:1px solid var(--border);padding:16px;flex:1;display:flex;flex-direction:column;min-height:0;">
                        <div id="vizyonSupportMessages" style="flex:1;overflow-y:auto;max-height:400px;padding:8px;"></div>
                        <div style="display:flex;gap:8px;margin-top:12px;flex-shrink:0;">
                            <input type="text" id="vizyonSupportInput" placeholder="Şikayet, öneri veya talebinizi yazın..." class="glow-input" style="flex:1;" onkeypress="if(event.key==='Enter') window.sendAethrionSupportMessage()">
                            <button class="btn-primary btn-sm" onclick="window.sendAethrionSupportMessage()" data-i18n="Gönder">Gönder</button>
                        </div>
                    </div>
                    <div style="font-size:12px;color:var(--text3);text-align:center;border-top:1px solid var(--border);padding-top:8px;line-height:1.7;">
                        ⚡ AETHRION Destek, her türlü sorunuzu cevaplar. Yardımcı olamazsam kurucuya iletirim.<br>
                        🟢 <strong style="color:var(--nvidia);">28 model</strong> destekli akıllı yönlendirme.
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
        }
    }
    panel.style.display = 'flex';
    panel.classList.add('open');
    var msgContainer = document.getElementById('vizyonSupportMessages');
    if (msgContainer) msgContainer.innerHTML = '<div class="ai-message bot">📢 AETHRION Destek\'e hoş geldiniz. Her türlü sorunuzu cevaplayabilirim. Yardımcı olmaya çalışacağım.</div>';
    var input = document.getElementById('vizyonSupportInput');
    if (input) {
        input.value = '';
        input.focus();
    }
    window.applyTranslations(currentLanguage);
    window.addLogInfo('AETHRION Destek paneli açıldı');
};}catch(e){console.warn("[legacy] openAethrionSupport",e);}
try{ if(typeof window.closeVizyonSupport!=="function"||__OVER.indexOf("closeVizyonSupport")>=0) window.closeVizyonSupport=function () {
    window.closeAethrionSupport();
};}catch(e){console.warn("[legacy] closeVizyonSupport",e);}
try{ if(typeof window.closeAethrionSupport!=="function"||__OVER.indexOf("closeAethrionSupport")>=0) window.closeAethrionSupport=function () {
    var panel = document.getElementById('vizyonSupportPanel');
    if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('open');
    }
};}catch(e){console.warn("[legacy] closeAethrionSupport",e);}
try{ if(typeof window.sendVizyonSupportMessage!=="function"||__OVER.indexOf("sendVizyonSupportMessage")>=0) window.sendVizyonSupportMessage=function () {
    window.sendAethrionSupportMessage();
};}catch(e){console.warn("[legacy] sendVizyonSupportMessage",e);}
try{ if(typeof window.sendAethrionSupportMessage!=="function"||__OVER.indexOf("sendAethrionSupportMessage")>=0) window.sendAethrionSupportMessage=async function () {
    var input = document.getElementById('vizyonSupportInput');
    if (!input) return;
    var msg = input.value.trim();
    if (!msg) return;
    var container = document.getElementById('vizyonSupportMessages');
    if (!container) return;
    container.innerHTML += '<div class="ai-message user">' + window.escapeHtml(msg) + '</div>';
    input.value = '';
    container.scrollTop = container.scrollHeight;

    var isVizyonFounder = currentUser && currentUser.get('email') === 'admin.tr.reis@gmail.com';

    try {
        var result = await Parse.Cloud.run('vizyonSupportAI', { message: msg });
        var reply = result.reply || 'Üzgünüm, şu anda cevap veremiyorum.';

        if (isVizyonFounder) {
            reply = '👑 Kurucu olarak size yardımcı olmaktan mutluluk duyarım. ' + reply;
        }

        if (result.forwardedToFounder) {
            reply += '<br><br>📨 Bu talep kurucumuza iletilmiştir. En kısa sürede ilgilenecektir.';
        }
        container.innerHTML += '<div class="ai-message bot">' + reply + '</div>';
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        container.innerHTML += '<div class="ai-message bot">❌ Hata: ' + window.escapeHtml(e.message) + '</div>';
        container.scrollTop = container.scrollHeight;
        window.addLogError('AETHRION Destek hatası: ' + e.message);
    }
};}catch(e){console.warn("[legacy] sendAethrionSupportMessage",e);}
try{ if(typeof window.toggleVizyonPatrol!=="function"||__OVER.indexOf("toggleVizyonPatrol")>=0) window.toggleVizyonPatrol=function () {
    window.toggleAethrionPatrol();
};}catch(e){console.warn("[legacy] toggleVizyonPatrol",e);}
try{ if(typeof window.toggleAethrionPatrol!=="function"||__OVER.indexOf("toggleAethrionPatrol")>=0) window.toggleAethrionPatrol=function () {
    aethrionPatrolActive = !aethrionPatrolActive;
    vizyonPatrolActive = aethrionPatrolActive;
    var statusEl = document.getElementById('patrolStatus');
    if (statusEl) statusEl.textContent = aethrionPatrolActive ? 'AÇIK' : 'KAPALI';
    showNotification('AETHRION Devriye ' + (aethrionPatrolActive ? 'açıldı' : 'kapatıldı'), 'success');
    window.addLogInfo('AETHRION Devriye: ' + (aethrionPatrolActive ? 'AÇIK' : 'KAPALI'));

    if (currentUser && currentUser.get('role') === 'founder') {
        try {
            Parse.Cloud.run('toggleVizyonPatrol', { enabled: aethrionPatrolActive }).catch(function () {});
        } catch (e) {}
    }
};}catch(e){console.warn("[legacy] toggleAethrionPatrol",e);}
try{ if(typeof window.toggleVizyonSupport!=="function"||__OVER.indexOf("toggleVizyonSupport")>=0) window.toggleVizyonSupport=function () {
    window.toggleAethrionSupport();
};}catch(e){console.warn("[legacy] toggleVizyonSupport",e);}
try{ if(typeof window.toggleAethrionSupport!=="function"||__OVER.indexOf("toggleAethrionSupport")>=0) window.toggleAethrionSupport=function () {
    aethrionSupportActive = !aethrionSupportActive;
    vizyonSupportActive = aethrionSupportActive;
    var statusEl = document.getElementById('supportStatus');
    if (statusEl) statusEl.textContent = aethrionSupportActive ? 'AÇIK' : 'KAPALI';
    showNotification('AETHRION Destek ' + (aethrionSupportActive ? 'açıldı' : 'kapatıldı'), 'success');
    window.addLogInfo('AETHRION Destek: ' + (aethrionSupportActive ? 'AÇIK' : 'KAPALI'));

    if (currentUser && currentUser.get('role') === 'founder') {
        try {
            Parse.Cloud.run('toggleVizyonSupport', { enabled: aethrionSupportActive }).catch(function () {});
        } catch (e) {}
    }
};}catch(e){console.warn("[legacy] toggleAethrionSupport",e);}
try{ if(typeof window.loadVizyonLog!=="function"||__OVER.indexOf("loadVizyonLog")>=0) window.loadVizyonLog=async function () {
    if (!currentUser || currentUser.get('email') !== 'admin.tr.reis@gmail.com') return;
    try {
        var result = await Parse.Cloud.run('getVizyonLog');
        var container = document.getElementById('vizyonLogContainer');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:8px;">📭 Henüz kayıt yok.</div>';
            return;
        }
        var html = '';
        result.forEach(function (log) {
            var time = new Date(log.createdAt).toLocaleString('tr-TR');
            html += '<div style="border-bottom:1px solid var(--border);padding:6px 0;font-size:13px;">';
            html += '<span style="color:var(--text3);font-size:11px;">' + window.escapeHtml(time) + '</span>';
            html += '<div>' + window.escapeHtml(log.message) + '</div>';
            html += '</div>';
        });
        container.innerHTML = html;
        window.applyTranslations(currentLanguage);
    } catch (e) {
        console.error('AETHRION log yüklenirken hata:', e);
    }
};}catch(e){console.warn("[legacy] loadVizyonLog",e);}
try{ if(typeof window.showAllTeams!=="function"||__OVER.indexOf("showAllTeams")>=0) window.showAllTeams=async function () {
    var container = document.getElementById('allTeamsList');
    if (!container) return;
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }
    try {
        var result = await Parse.Cloud.run('getAllTeams');
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:8px;">📭 Hiç takım yok.</div>';
        } else {
            var html = '<div style="display:flex;flex-direction:column;gap:6px;">';
            result.forEach(function (t) {
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid var(--border);">';
                html += '<span><strong>' + window.escapeHtml(t.name) + '</strong> (' + window.escapeHtml(t.code) + ') - 👑 ' + window.escapeHtml(t.owner) + ' - ' + t.memberCount + ' üye</span>';
                html += '<div style="display:flex;gap:4px;">';
                html += '<button class="btn-secondary btn-sm" onclick="window.joinTeamAsFounder(\'' + t.id + '\')" style="font-size:9px;padding:2px 6px;">📥 Katıl</button>';
                html += '<button class="btn-danger btn-sm" onclick="window.forceCloseTeam(\'' + t.id + '\')" style="font-size:9px;padding:2px 6px;">🗑️ Kapat</button>';
                html += '</div></div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }
        container.style.display = 'block';
        window.applyTranslations(currentLanguage);
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] showAllTeams",e);}
try{ if(typeof window.searchTeams!=="function"||__OVER.indexOf("searchTeams")>=0) window.searchTeams=async function () {
    var query = document.getElementById('teamSearchInput').value.trim().toLowerCase();
    if (!query) {
        window.showAllTeams();
        return;
    }
    try {
        var result = await Parse.Cloud.run('searchTeams', { query: query });
        var container = document.getElementById('allTeamsList');
        if (!container) return;
        if (!result || result.length === 0) {
            container.innerHTML = '<div style="color:var(--text3);padding:8px;">🔍 Takım bulunamadı.</div>';
        } else {
            var html = '<div style="display:flex;flex-direction:column;gap:6px;">';
            result.forEach(function (t) {
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid var(--border);">';
                html += '<span><strong>' + window.escapeHtml(t.name) + '</strong> (' + window.escapeHtml(t.code) + ') - 👑 ' + window.escapeHtml(t.owner) + ' - ' + t.memberCount + ' üye</span>';
                html += '<div style="display:flex;gap:4px;">';
                html += '<button class="btn-secondary btn-sm" onclick="window.joinTeamAsFounder(\'' + t.id + '\')" style="font-size:9px;padding:2px 6px;">📥 Katıl</button>';
                html += '<button class="btn-danger btn-sm" onclick="window.forceCloseTeam(\'' + t.id + '\')" style="font-size:9px;padding:2px 6px;">🗑️ Kapat</button>';
                html += '</div></div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }
        container.style.display = 'block';
        window.applyTranslations(currentLanguage);
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] searchTeams",e);}
try{ if(typeof window.joinTeamAsFounder!=="function"||__OVER.indexOf("joinTeamAsFounder")>=0) window.joinTeamAsFounder=async function (teamId) {
    if (!confirm('Bu takıma katılmak istediğinize emin misiniz? Kurucu olarak tüm yetkilere sahip olacaksınız.')) return;
    try {
        var result = await Parse.Cloud.run('joinTeamAsFounder', { teamId: teamId });
        if (result.success) {
            currentUser.set('teamId', teamId);
            await currentUser.save();
            await window.loadTeamPage();
            showNotification('✅ Takıma katıldınız!', 'success');
            window.addLogInfo('AETHRION Kurucu takıma katıldı');
        } else {
            showNotification('Hata: ' + result.error, 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] joinTeamAsFounder",e);}
try{ if(typeof window.forceCloseTeam!=="function"||__OVER.indexOf("forceCloseTeam")>=0) window.forceCloseTeam=async function (teamId) {
    if (!confirm('Bu takımı kapatmak tüm verileri siler. Emin misiniz?')) return;
    try {
        var result = await Parse.Cloud.run('forceCloseTeam', { teamId: teamId });
        if (result.success) {
            showNotification('Takım kapatıldı.', 'success');
            window.addLogWarning('AETHRION Kurucu takımı zorla kapattı');
            window.showAllTeams();
        } else {
            showNotification('Hata: ' + result.error, 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] forceCloseTeam",e);}
try{ if(typeof window.openSearchModal!=="function"||__OVER.indexOf("openSearchModal")>=0) window.openSearchModal=function () {
    var modal = document.getElementById('searchModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'searchModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:500px;">
                <div class="modal-header">
                    <h3>🔍 Kullanıcı Ara</h3>
                    <button class="modal-close" onclick="window.closeModal('searchModal')">×</button>
                </div>
                <input type="text" id="searchInput" placeholder="Kullanıcı adı veya e-posta ile ara..." class="form-input" onkeypress="if(event.key==='Enter') window.searchUsers()">
                <button class="btn-primary" onclick="window.searchUsers()" style="width:100%;">🔍 Ara</button>
                <div id="searchResults" style="margin-top:16px;max-height:300px;overflow-y:auto;"></div>
                <button class="btn-secondary" onclick="window.closeModal('searchModal')" style="margin-top:16px;" data-i18n="Kapat">Kapat</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('open');
    modal.style.display = 'flex';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchInput').focus();
};}catch(e){console.warn("[legacy] openSearchModal",e);}
try{ if(typeof window.openJarvisFromTeamPage!=="function"||__OVER.indexOf("openJarvisFromTeamPage")>=0) window.openJarvisFromTeamPage=function () {
    if (typeof window.openJarvisPanel === 'function') {
        window.closeTeamPage();
        window.openJarvisPanel();
    } else {
        showNotification('JARVIS modülü yükleniyor...', 'warning');
    }
};}catch(e){console.warn("[legacy] openJarvisFromTeamPage",e);}
try{ if(typeof window._animate3DRunning==="undefined") window._animate3DRunning=false;}catch(e){console.warn("[legacy] _animate3DRunning",e);}
try{ if(typeof window._animate3DRafId==="undefined") window._animate3DRafId=null;}catch(e){console.warn("[legacy] _animate3DRafId",e);}
function is3DVisible() {
    if (document.hidden) return false;
    var canvas = document.getElementById('canvas3d');
    if (!canvas) return false;
    if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return false;
    var dashboard = document.getElementById('dashboardArea');
    if (dashboard && dashboard.style.display === 'none') return false;
    return true;
}
if(typeof window.is3DVisible!=="function"||__OVER.indexOf("is3DVisible")>=0)window.is3DVisible=is3DVisible;
function animate3D() {
    if (!window._animate3DRunning) return;
    window._animate3DRafId = requestAnimationFrame(animate3D);
    if (window.controls) window.controls.update();
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}
if(typeof window.animate3D!=="function"||__OVER.indexOf("animate3D")>=0)window.animate3D=animate3D;
function start3DLoop() {
    if (window._animate3DRunning) return;
    window._animate3DRunning = true;
    animate3D();
}
if(typeof window.start3DLoop!=="function"||__OVER.indexOf("start3DLoop")>=0)window.start3DLoop=start3DLoop;
function stop3DLoop() {
    window._animate3DRunning = false;
    if (window._animate3DRafId !== null) {
        cancelAnimationFrame(window._animate3DRafId);
        window._animate3DRafId = null;
    }
}
if(typeof window.stop3DLoop!=="function"||__OVER.indexOf("stop3DLoop")>=0)window.stop3DLoop=stop3DLoop;
function init3D() {
    var container = document.getElementById('canvas3d');
    if (!container) { console.warn('canvas3d elementi bulunamadı!'); return; }
    if (window.sceneInitialized) {
        try {
            var w = container.clientWidth;
            var h = container.clientHeight;
            if (w > 0 && h > 0 && window.camera && window.renderer) {
                window.camera.aspect = w / h;
                window.camera.updateProjectionMatrix();
                window.renderer.setSize(w, h);
            }
        } catch (e) {}
        if (is3DVisible() && !window._animate3DRunning) start3DLoop();
        return;
    }

    if (typeof THREE === 'undefined') {
        console.warn('⚠️ Three.js yüklenmedi, 3D devre dışı');
        return;
    }

    try {
        window.scene = new THREE.Scene();
        window.scene.background = new THREE.Color(0x050507);

        var width = container.clientWidth || 500;
        var height = container.clientHeight || 400;

        window.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        window.camera.position.set(3, 2, 5);

        window.renderer = new THREE.WebGLRenderer({ antialias: true });
        window.renderer.setSize(width, height);
        window.renderer.shadowMap.enabled = true;
        window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        window.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(window.renderer.domElement);

        if (typeof THREE.OrbitControls !== 'undefined') {
            window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
            window.controls.enableDamping = true;
            window.controls.dampingFactor = 0.08;
            window.controls.autoRotate = false;
            window.controls.target.set(0, 0.5, 0);
            window.controls.update();
        }

        var ambientLight = new THREE.AmbientLight(0x404060);
        window.scene.add(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        window.scene.add(dirLight);

        var fillLight = new THREE.DirectionalLight(0xd4af37, 0.3);
        fillLight.position.set(-3, 2, 4);
        window.scene.add(fillLight);

        var gridHelper = new THREE.GridHelper(10, 10, 0xd4af37, 0x262632);
        gridHelper.position.y = -0.1;
        window.scene.add(gridHelper);

        window.sceneInitialized = true;

        if (is3DVisible()) {
            start3DLoop();
        }

        if (typeof ResizeObserver !== 'undefined') {
            try {
                var ro = new ResizeObserver(function () {
                    var w = container.clientWidth;
                    var h = container.clientHeight;
                    if (w > 0 && h > 0 && window.camera && window.renderer) {
                        window.camera.aspect = w / h;
                        window.camera.updateProjectionMatrix();
                        window.renderer.setSize(w, h);
                    }
                });
                ro.observe(container);
            } catch (e) {}
        }

        window.addEventListener('resize', function () {
            var w = container.clientWidth;
            var h = container.clientHeight;
            if (window.camera && window.renderer) {
                window.camera.aspect = w / h;
                window.camera.updateProjectionMatrix();
                window.renderer.setSize(w, h);
            }
        });
    } catch (e) {
        console.warn('3D başlatılamadı:', e);
    }
}
if(typeof window.init3D!=="function"||__OVER.indexOf("init3D")>=0)window.init3D=init3D;
try{ if(typeof window.generate3D!=="function"||__OVER.indexOf("generate3D")>=0) window.generate3D=async function () {
    var promptEl = document.getElementById('threeDPrompt');
    if (!promptEl) return;
    var prompt = promptEl.value.trim();
    if (!prompt) {
        showNotification('Lütfen bir açıklama yazın!', 'error');
        return;
    }

    if (window.modelLoaded) {
        window.scene.remove(window.modelLoaded);
        window.modelLoaded = null;
    }
    window.currentModelData = null;
    removeDownloadButton();

    showNotification('⏳ 3D model oluşturuluyor (Hugging Face)...', 'success');

    try {
        var result = await Parse.Cloud.run('generate3DWithHF', { prompt: prompt });
        console.log('HF sonucu:', result);

        if (result.success && result.glbBase64) {
            loadModelFromBase64(result.glbBase64);
            showNotification('✅ 3D model Hugging Face ile oluşturuldu!', 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('3D model oluşturuldu: ' + prompt);
            }
            return;
        } else {
            throw new Error(result.error || 'Bilinmeyen hata');
        }
    } catch (e) {
        console.error('HF detaylı hata:', e);
        showNotification('⚠️ HF çalışmadı, yedek sistem devrede...', 'warning');
        try {
            createSimple3DShape(prompt);
            setTimeout(createDownloadButton, 500);
        } catch (err) {
            showNotification('❌ 3D oluşturulamadı: ' + err.message, 'error');
            if (typeof window.addLogError === 'function') {
                window.addLogError('3D oluşturma hatası: ' + err.message);
            }
        }
    }
};}catch(e){console.warn("[legacy] generate3D",e);}
function load3DModel(url) {
    if (!window.scene) init3D();
    if (typeof THREE.GLTFLoader === 'undefined') {
        showNotification('⚠️ GLTFLoader yüklenmedi, basit şekil oluşturuluyor.', 'warning');
        createSimple3DShape('küp');
        return;
    }
    var loader = new THREE.GLTFLoader();
    loader.load(url, function (gltf) {
        if (window.modelLoaded) { window.scene.remove(window.modelLoaded); window.modelLoaded = null; }
        var model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        model.traverse(function (child) {
            if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
        });
        window.scene.add(model);
        window.modelLoaded = model;
        window.currentModelData = model;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = window.camera.fov * (Math.PI / 180);
        let cameraZ = maxDim / (2 * Math.tan(fov / 2));
        cameraZ *= 1.5;
        window.camera.position.set(center.x, center.y + cameraZ * 0.3, center.z + cameraZ);
        if (window.controls) {
            window.controls.target.copy(center);
            window.controls.update();
        }

        createDownloadButton();
        showNotification('✅ 3D model yüklendi! (Fare ile döndürebilirsiniz)', 'success');
    }, undefined, function (error) {
        console.error('Model yüklenemedi:', error);
        createSimple3DShape('küp');
    });
}
if(typeof window.load3DModel!=="function"||__OVER.indexOf("load3DModel")>=0)window.load3DModel=load3DModel;
function loadModelFromBase64(base64String) {
    try {
        const binary = atob(base64String);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) { array[i] = binary.charCodeAt(i); }
        const blob = new Blob([array], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        load3DModel(url);
    } catch (e) {
        console.error('Base64 model yüklenemedi:', e);
        createSimple3DShape('küp');
    }
}
if(typeof window.loadModelFromBase64!=="function"||__OVER.indexOf("loadModelFromBase64")>=0)window.loadModelFromBase64=loadModelFromBase64;
function createDownloadButton() {
    if (window.downloadButtonExists) return;
    var container = document.getElementById('canvas3d');
    if (!container) return;

    var btn = document.createElement('button');
    btn.id = 'download3DBtn';
    btn.innerHTML = '⬇️ Modeli İndir (.glb)';
    btn.style.cssText =
        'position: absolute;' +
        'bottom: 15px;' +
        'right: 15px;' +
        'padding: 10px 20px;' +
        'background: linear-gradient(135deg, #d4af37, #b8c0d0, #7c5cff);' +
        'color: #050507;' +
        'border: none;' +
        'border-radius: 30px;' +
        'cursor: pointer;' +
        'font-size: 13px;' +
        'font-weight: 700;' +
        'z-index: 10;' +
        'box-shadow: 0 0 25px rgba(212,175,55,0.5);' +
        'transition: transform 0.3s ease, box-shadow 0.3s ease;' +
        'font-family: Inter, sans-serif;';

    btn.onmouseover = function () {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 0 40px rgba(212,175,55,0.8)';
    };
    btn.onmouseout = function () {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 25px rgba(212,175,55,0.5)';
    };
    btn.onclick = downloadModel;

    container.style.position = 'relative';
    container.appendChild(btn);
    window.downloadButtonExists = true;
}
if(typeof window.createDownloadButton!=="function"||__OVER.indexOf("createDownloadButton")>=0)window.createDownloadButton=createDownloadButton;
function removeDownloadButton() {
    var oldBtn = document.getElementById('download3DBtn');
    if (oldBtn) oldBtn.remove();
    window.downloadButtonExists = false;
}
if(typeof window.removeDownloadButton!=="function"||__OVER.indexOf("removeDownloadButton")>=0)window.removeDownloadButton=removeDownloadButton;
try{ if(typeof window.downloadModel!=="function"||__OVER.indexOf("downloadModel")>=0) window.downloadModel=function () {
    if (!window.modelLoaded) { showNotification('❌ İndirilecek bir model yok!', 'error'); return; }
    if (typeof THREE.GLTFExporter === 'undefined') {
        showNotification('⚠️ GLTFExporter yüklenmedi, sayfayı yenileyin.', 'error');
        return;
    }
    showNotification('⏳ Model dışa aktarılıyor...', 'success');
    var exporter = new THREE.GLTFExporter();
    exporter.parse(window.scene, function (glb) {
        var blob = new Blob([glb], { type: 'application/octet-stream' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'aethrion3d_model.glb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showNotification('✅ Model indirildi!', 'success');
    }, function (error) {
        console.error('Dışa aktarım hatası:', error);
        showNotification('❌ İndirme hatası: ' + error.message, 'error');
    }, { binary: true });
};}catch(e){console.warn("[legacy] downloadModel",e);}
function createSimple3DShape(prompt) {
    try {
        if (!window.scene) init3D();
        if (window.modelLoaded) { window.scene.remove(window.modelLoaded); window.modelLoaded = null; }

        var lower = prompt.toLowerCase();
        var geometry;
        var color = 0xd4af37;
        var positionY = 0.5;

        if (lower.includes('kırmızı') || lower.includes('red')) color = 0xe63946;
        else if (lower.includes('mavi') || lower.includes('blue')) color = 0x7fd4ff;
        else if (lower.includes('yeşil') || lower.includes('green')) color = 0x76b900;
        else if (lower.includes('sarı') || lower.includes('yellow')) color = 0xe8c555;
        else if (lower.includes('mor') || lower.includes('purple')) color = 0x7c5cff;
        else if (lower.includes('turuncu') || lower.includes('orange')) color = 0xff7a45;
        else if (lower.includes('pembe') || lower.includes('pink')) color = 0xff2d92;
        else if (lower.includes('altın') || lower.includes('gold')) color = 0xd4af37;

        if (lower.includes('küp') || lower.includes('cube')) geometry = new THREE.BoxGeometry(1, 1, 1);
        else if (lower.includes('küre') || lower.includes('sphere')) geometry = new THREE.SphereGeometry(0.7, 32, 32);
        else if (lower.includes('silindir') || lower.includes('cylinder')) geometry = new THREE.CylinderGeometry(0.7, 0.7, 1, 32);
        else if (lower.includes('piramit') || lower.includes('pyramid')) geometry = new THREE.ConeGeometry(0.7, 1, 4);
        else if (lower.includes('torus') || lower.includes('halka')) geometry = new THREE.TorusGeometry(0.6, 0.2, 16, 32);
        else geometry = new THREE.TorusKnotGeometry(0.5, 0.2, 64, 8);

        var material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.6,
            roughness: 0.3,
            emissive: new THREE.Color(color).multiplyScalar(0.1)
        });

        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, positionY, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        window.scene.add(mesh);
        window.modelLoaded = mesh;

        if (window.camera) {
            window.camera.position.set(2, 1.5, 4);
            window.camera.lookAt(0, 0.5, 0);
        }

        console.log('✅ Basit 3D şekil oluşturuldu:', prompt);
        showNotification('✅ 3D şekil oluşturuldu!', 'success');
        createDownloadButton();
    } catch (e) {
        console.error('3D şekil oluşturma hatası:', e);
        showNotification('❌ 3D şekil oluşturulamadı: ' + e.message, 'error');
    }
}
if(typeof window.createSimple3DShape!=="function"||__OVER.indexOf("createSimple3DShape")>=0)window.createSimple3DShape=createSimple3DShape;
try{ if(typeof window.speakText!=="function"||__OVER.indexOf("speakText")>=0) window.speakText=function (text) {
    if (!text) {
        showNotification('❌ Okunacak metin yok!', 'error');
        return;
    }
    if (!('speechSynthesis' in window)) {
        showNotification('❌ Tarayıcınız metin okuma desteklemiyor!', 'error');
        return;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    var voices = window.speechSynthesis.getVoices();
    var trVoice = voices.find(function (v) { return v.lang.startsWith('tr'); });
    if (trVoice) utterance.voice = trVoice;

    window.speechSynthesis.speak(utterance);
    showNotification('🔊 Metin okunuyor...', 'success');
};}catch(e){console.warn("[legacy] speakText",e);}
try{ if(typeof window.startVoiceChatRecognition!=="function"||__OVER.indexOf("startVoiceChatRecognition")>=0) window.startVoiceChatRecognition=function () {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('❌ Tarayıcınız sesli tanıma desteklemiyor!', 'error');
        return;
    }
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;
    window.voiceChatRecognition = recognition;

    var transcriptEl = document.getElementById('vzVoiceTranscript');

    recognition.onstart = function () {
        if (transcriptEl) transcriptEl.innerHTML = '<span class="vz-voice-user-text">🎤 Sen:</span> Konuşmaya başla...';
    };

    var finalTranscript = '';
    recognition.onresult = function (event) {
        var interim = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
            var t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += t;
            } else {
                interim += t;
            }
        }
        if (transcriptEl) {
            transcriptEl.innerHTML = '<span class="vz-voice-user-text">🎤 Sen:</span> ' + (finalTranscript + interim);
        }
        if (finalTranscript.trim().length > 2) {
            var userMsg = finalTranscript.trim();
            finalTranscript = '';
            window.processVoiceChatMessage(userMsg);
        }
    };

    recognition.onerror = function (event) {
        console.warn('Ses tanıma hatası:', event.error);
    };

    recognition.onend = function () {
        if (window.voiceChatActive) {
            try { recognition.start(); } catch (e) {}
        }
    };

    try { recognition.start(); } catch (e) {
        console.error('Ses tanıma başlatılamadı:', e);
    }
};}catch(e){console.warn("[legacy] startVoiceChatRecognition",e);}
try{ if(typeof window.processVoiceChatMessage!=="function"||__OVER.indexOf("processVoiceChatMessage")>=0) window.processVoiceChatMessage=async function (userMsg) {
    if (!userMsg) return;
    if (typeof window.addLogInfo === 'function') {
        window.addLogInfo('Sesli sohbet mesajı: ' + userMsg.substring(0, 50));
    }

    var transcriptEl = document.getElementById('vzVoiceTranscript');
    if (transcriptEl) {
        transcriptEl.innerHTML = '<span class="vz-voice-user-text">🎤 Sen:</span> ' +
            window.escapeHtml(userMsg) +
            '<br><br><span style="color:var(--text3);">⏳ AI düşünüyor...</span>';
    }

    try {
        var result = await Parse.Cloud.run('vizyonAlChat', {
            message: userMsg,
            mode: 'normal'
        });
        var reply = (result && result.reply) ? result.reply : 'Üzgünüm, cevap veremiyorum.';
        if (transcriptEl) {
            transcriptEl.innerHTML =
                '<span class="vz-voice-user-text">🎤 Sen:</span> ' + window.escapeHtml(userMsg) +
                '<br><br>' +
                '<span class="vz-voice-ai-text">✨ Aethrion Al:</span> ' + window.escapeHtml(reply);
        }
        window.speakText(reply);
    } catch (e) {
        if (transcriptEl) {
            transcriptEl.innerHTML = '<span style="color:var(--danger);">❌ Hata: ' + window.escapeHtml(e.message) + '</span>';
        }
        if (typeof window.addLogError === 'function') {
            window.addLogError('Sesli sohbet hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] processVoiceChatMessage",e);}
try{ if(typeof window.searchGif!=="function"||__OVER.indexOf("searchGif")>=0) window.searchGif=async function () {
    var query = prompt('GIF ara (örn: selam, gülen, tebrik):');
    if (!query) return;
    try {
        var result = await Parse.Cloud.run('searchGif', { query: query });
        if (result && result.length > 0) {
            var gifUrl = result[0].images.fixed_height.url;
            var msgInput = document.getElementById('teamPageInput');
            if (msgInput) {
                msgInput.value = '![GIF](' + gifUrl + ')';
                if (typeof window.sendTeamPageMessage === 'function') {
                    window.sendTeamPageMessage();
                }
            }
        } else {
            showNotification('GIF bulunamadı!', 'warning');
        }
    } catch (e) {
        showNotification('GIF hatası: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] searchGif",e);}
try{ if(typeof window.filterBadWords!=="function"||__OVER.indexOf("filterBadWords")>=0) window.filterBadWords=function (text) {
    var badWords = ['küfür', 'siyasi', 'argo', 'küfretmek'];
    var filtered = text;
    badWords.forEach(function (word) {
        var regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '****');
    });
    return filtered;
};}catch(e){console.warn("[legacy] filterBadWords",e);}
try{ if(typeof window.translateText!=="function"||__OVER.indexOf("translateText")>=0) window.translateText=async function (text, targetLang) {
    try {
        var result = await Parse.Cloud.run('smartTranslate', {
            text: text,
            targetLang: targetLang,
            sourceLang: 'auto'
        });
        if (result.success) {
            return result.translatedText;
        } else {
            return text;
        }
    } catch (e) {
        console.error('Çeviri hatası:', e);
        return text;
    }
};}catch(e){console.warn("[legacy] translateText",e);}
try{ if(typeof window.askCoach!=="function"||__OVER.indexOf("askCoach")>=0) window.askCoach=async function (question) {
    if (!window.currentUser) {
        showNotification('Önce giriş yapın!', 'error');
        return;
    }
    if (!question) {
        question = prompt('AETHRION Coach\'a sormak istediğiniz nedir?');
        if (!question) return;
    }
    try {
        var result = await Parse.Cloud.run('getCoachAdvice', { question: question });
        if (result && result.advice) {
            var container = document.getElementById('dashboardAiMessages');
            if (container) {
                container.innerHTML += '<div class="ai-message bot"><div class="role">🧠 AETHRION COACH</div>' + cleanClientResponse(result.advice) + '</div>';
                container.scrollTop = container.scrollHeight;
            }
            showNotification('💬 AETHRION Coach yanıtladı!', 'success');
        } else {
            showNotification('AETHRION Coach şu anda meşgul, lütfen daha sonra tekrar deneyin.', 'warning');
        }
    } catch (e) {
        showNotification('Coach hatası: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('Coach hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] askCoach",e);}
try{ if(typeof window.askSupport!=="function"||__OVER.indexOf("askSupport")>=0) window.askSupport=async function (question) {
    if (!question) {
        question = prompt('AETHRION Destek\'e sormak istediğiniz nedir?');
        if (!question) return;
    }
    try {
        var result = await Parse.Cloud.run('getSupportReply', { question: question });
        if (result && result.reply) {
            var container = document.getElementById('vizyonSupportMessages');
            if (container) {
                container.innerHTML += '<div class="ai-message bot"><div class="role">🛟 AETHRION ASISTAN</div>' + cleanClientResponse(result.reply) + '</div>';
                container.scrollTop = container.scrollHeight;
            }
            showNotification('✅ AETHRION Destek yanıtladı!', 'success');
        } else {
            showNotification('AETHRION Destek şu anda meşgul.', 'warning');
        }
    } catch (e) {
        showNotification('Destek hatası: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] askSupport",e);}
try{ if(typeof window.openHelpArticle!=="function"||__OVER.indexOf("openHelpArticle")>=0) window.openHelpArticle=function () {
    var modal = document.getElementById('helpArticleModal');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
    } else {
        showNotification('Rehber sayfası bulunamadı!', 'error');
    }
};}catch(e){console.warn("[legacy] openHelpArticle",e);}
try{ if(typeof window.vizyonAlMode==="undefined") window.vizyonAlMode='normal';}catch(e){console.warn("[legacy] vizyonAlMode",e);}
try{ if(typeof window.aethrionAlMode==="undefined") window.aethrionAlMode='normal';}catch(e){console.warn("[legacy] aethrionAlMode",e);}
try{ if(typeof window.vizyonAlOpened==="undefined") window.vizyonAlOpened=false;}catch(e){console.warn("[legacy] vizyonAlOpened",e);}
try{ if(typeof window.aethrionAlOpened==="undefined") window.aethrionAlOpened=false;}catch(e){console.warn("[legacy] aethrionAlOpened",e);}
try{ if(typeof window.vizyonAlScreenSharing==="undefined") window.vizyonAlScreenSharing=false;}catch(e){console.warn("[legacy] vizyonAlScreenSharing",e);}
try{ if(typeof window.vizyonAlScreenStream==="undefined") window.vizyonAlScreenStream=null;}catch(e){console.warn("[legacy] vizyonAlScreenStream",e);}
try{ if(typeof window.vizyonAlResponsibilityAccepted==="undefined") window.vizyonAlResponsibilityAccepted=false;}catch(e){console.warn("[legacy] vizyonAlResponsibilityAccepted",e);}
try{ if(typeof window.vizyonAlLastRequestId==="undefined") window.vizyonAlLastRequestId=null;}catch(e){console.warn("[legacy] vizyonAlLastRequestId",e);}
try{ if(typeof window.showVizyonAlResponsibilityArea!=="function"||__OVER.indexOf("showVizyonAlResponsibilityArea")>=0) window.showVizyonAlResponsibilityArea=function () {
    var respArea = document.getElementById('vzResponsibilityArea');
    var mainArea = document.getElementById('vzMainArea');
    if (respArea) respArea.style.display = 'flex';
    if (mainArea) mainArea.style.display = 'none';
};}catch(e){console.warn("[legacy] showVizyonAlResponsibilityArea",e);}
try{ if(typeof window.showVizyonAlMainArea!=="function"||__OVER.indexOf("showVizyonAlMainArea")>=0) window.showVizyonAlMainArea=function () {
    var respArea = document.getElementById('vzResponsibilityArea');
    var mainArea = document.getElementById('vzMainArea');
    if (respArea) respArea.style.display = 'none';
    if (mainArea) {
        mainArea.style.display = 'flex';
        mainArea.style.flexDirection = 'column';
        mainArea.style.overflow = 'hidden';
        mainArea.style.flex = '1';
    }
    setTimeout(function () {
        var inp = document.getElementById('vzInput');
        if (inp) inp.focus();
    }, 300);

    setTimeout(function () {
        if (typeof window.ensureScreenReadButton === 'function') {
            window.ensureScreenReadButton();
        }
    }, 400);
};}catch(e){console.warn("[legacy] showVizyonAlMainArea",e);}
try{ if(typeof window.setAethrionAlMode!=="function"||__OVER.indexOf("setAethrionAlMode")>=0) window.setAethrionAlMode=function (mode) {
    if (['normal', 'deep', 'agent', 'developer'].indexOf(mode) === -1) mode = 'normal';

    if (window.currentUser && typeof window.getPlanLimits === 'function') {
        var limits = window.getPlanLimits(window.currentUser);

        if (mode === 'deep' && !limits.derinDusunme) {
            if (typeof window.showLimitModal === 'function') {
                window.showLimitModal('derinDusunme', {
                    allowed: false,
                    reason: 'Derin Düşünme modu Pro ve üzeri paketlerde mevcut',
                    limit: 0, used: 0, requiresUpgrade: true
                });
            }
            return;
        }
        if (mode === 'agent' && !limits.aganModu) {
            if (typeof window.showLimitModal === 'function') {
                window.showLimitModal('aganModu', {
                    allowed: false,
                    reason: 'Ajan modu Pro ve üzeri paketlerde mevcut',
                    limit: 0, used: 0, requiresUpgrade: true
                });
            }
            return;
        }
        if (mode === 'developer' && !limits.yazilimciModu) {
            if (typeof window.showLimitModal === 'function') {
                window.showLimitModal('yazilimciModu', {
                    allowed: false,
                    reason: 'Yazılımcı modu Pro ve üzeri paketlerde mevcut',
                    limit: 0, used: 0, requiresUpgrade: true
                });
            }
            return;
        }
    }

    window.vizyonAlMode = mode;
    window.aethrionAlMode = mode;

    var btns = document.querySelectorAll('.vz-mode-btn');
    btns.forEach(function (btn) {
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    var panel = document.getElementById('vizyonAlPanel') || document.getElementById('aethrionAlPanel');
    if (panel) {
        panel.classList.remove('vz-mode-deep', 'vz-mode-agent', 'vz-mode-developer');
        if (mode !== 'normal') panel.classList.add('vz-mode-' + mode);
    }

    var modeLabels = {
        normal: '🌐 Normal',
        deep: '🧠 Derin Düşünme',
        agent: '🕵️ Ajan',
        developer: '💻 Yazılımcı'
    };
    showNotification('✨ AETHRION Al modu: ' + modeLabels[mode], 'success');
    if (typeof window.addLogInfo === 'function') {
        window.addLogInfo('AETHRION Al mod değişti: ' + mode);
    }
};}catch(e){console.warn("[legacy] setAethrionAlMode",e);}
try{ if(typeof window.sendAethrionAlMessage!=="function"||__OVER.indexOf("sendAethrionAlMessage")>=0) window.sendAethrionAlMessage=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    if (!window.vizyonAlResponsibilityAccepted) {
        return showNotification('Önce sorumluluk onayını verin!', 'warning');
    }

    if (typeof window.checkFeatureLimit === 'function') {
        var limitCheck = window.checkFeatureLimit('aethrionAlPerDay', 'day');
        if (!limitCheck.allowed) {
            var limitCheck2 = window.checkFeatureLimit('vizyonAlPerDay', 'day');
            if (!limitCheck2.allowed) {
                if (typeof window.showLimitModal === 'function') {
                    window.showLimitModal('aethrionAlPerDay', limitCheck2);
                }
                return;
            }
        }
    }

    var input = document.getElementById('vzInput');
    var chat = document.getElementById('vzChat');
    var sendBtn = document.getElementById('vzSendBtn');
    if (!input || !chat) return;

    var msg = input.value.trim();
    if (!msg && !window.currentUploadedFile) {
        showNotification('Lütfen bir mesaj yazın veya dosya yükleyin!', 'warning');
        return;
    }

    var lowerMsg = msg.toLowerCase();
    var isA27KeyRequest = (
        (lowerMsg.indexOf('a27') !== -1 && lowerMsg.indexOf('api') !== -1 &&
         (lowerMsg.indexOf('oluştur') !== -1 || lowerMsg.indexOf('al') !== -1 || lowerMsg.indexOf('yarat') !== -1 || lowerMsg.indexOf('anahtar') !== -1)) ||
        lowerMsg.indexOf('a27 api anahtarı oluştur') !== -1 ||
        lowerMsg.indexOf('a27 key') !== -1 ||
        lowerMsg.indexOf('a27 anahtar') !== -1 ||
        lowerMsg.indexOf('v27 api anahtarı oluştur') !== -1 ||
        lowerMsg.indexOf('v27 anahtar') !== -1
    );

    if (isA27KeyRequest) {
        chat.innerHTML += '<div class="vz-msg user"><div class="vz-role">👤 Sen</div>' +
            window.escapeHtml(msg).replace(/\n/g, '<br>') + '</div>';
        input.value = '';
        chat.scrollTop = chat.scrollHeight;

        chat.innerHTML += '<div class="vz-msg bot">' +
            '<div class="vz-role">✨ AETHRION AL</div>' +
            'Elbette! Senin için bir <strong>A27 API anahtarı</strong> oluşturacağım. Aşağıdaki formu doldurman yeterli:<br><br>' +
            '🔑 <strong>Anahtar Adı:</strong> (örn: Web Sitem)<br>' +
            '⏱️ <strong>Geçerlilik:</strong> Süresiz / 1 Yıl / 5 Ay / 1 Ay / 1 Hafta<br>' +
            '📝 <strong>Açıklama:</strong> (isteğe bağlı)<br><br>' +
            '⚠️ <strong style="color:var(--danger);">Güvenlik:</strong> Anahtarın değerini ben görmeyeceğim, sistem sana ayrı bir ekranda <strong>sadece bir kez</strong> gösterecek.' +
            '</div>';
        chat.scrollTop = chat.scrollHeight;

        if (typeof window.openA27QuickCreate === 'function') {
            window.openA27QuickCreate();
        } else if (typeof window.openV27QuickCreate === 'function') {
            window.openV27QuickCreate();
        } else if (typeof window.openA27ApiKeyGenerator === 'function') {
            window.openA27ApiKeyGenerator();
        } else if (typeof window.openV27ApiKeyGenerator === 'function') {
            window.openV27ApiKeyGenerator();
        }
        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('AETHRION Al üzerinden A27 API key oluşturma başlatıldı');
        }
        return;
    }

    var reqId = 'vz_req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    window.vizyonAlLastRequestId = reqId;

    var userDisplayMsg = msg;
    if (window.currentUploadedFile) {
        userDisplayMsg = '[📎 ' + window.currentUploadedFile.name + '] ' + msg;
    }
    chat.innerHTML += '<div class="vz-msg user"><div class="vz-role">👤 Sen</div>' +
        window.escapeHtml(userDisplayMsg).replace(/\n/g, '<br>') + '</div>';
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    if (sendBtn) sendBtn.disabled = true;

    var thinkId = 'vz_think_' + reqId;
    if (window.aethrionAlMode === 'deep') {
        chat.innerHTML += '<div class="vz-thinking" id="' + thinkId + '">' +
            '<div class="thinking-text" id="' + thinkId + '_text">Derin düşünme başlatılıyor...</div>' +
            '<div class="thinking-line"></div>' +
            '</div>';
    } else {
        chat.innerHTML += '<div class="vz-msg bot" id="' + thinkId + '">' +
            '<div class="vz-role">✨ AETHRION AL</div>' +
            '<span style="color:var(--text3);">Düşünüyor...</span>' +
            '</div>';
    }
    chat.scrollTop = chat.scrollHeight;

    try {
        var result;

        if (window.currentUploadedFile) {
            var file = window.currentUploadedFile;
            var base64 = await new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function (e) { resolve(e.target.result.split(',')[1]); };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            result = await Parse.Cloud.run('vizyonAlFileAnalyze', {
                fileBase64: base64,
                fileName: file.name,
                fileType: file.type,
                question: msg || 'Bu dosyayı analiz et ve özetle.'
            });
        } else {
            result = await Parse.Cloud.run('vizyonAlChat', {
                message: msg,
                mode: window.aethrionAlMode
            });
        }

        if (window.vizyonAlLastRequestId !== reqId) {
            var t1 = document.getElementById(thinkId);
            if (t1) t1.remove();
            return;
        }

        var t2 = document.getElementById(thinkId);
        if (t2) t2.remove();

        if (result && result.success && result.reply) {
            var cleaned = cleanClientResponse(result.reply);
            var replyHtml = '<div class="vz-msg bot">' +
                '<div class="vz-role">✨ AETHRION AL</div>' +
                cleaned;

            if (result.fileDownloadUrl) {
                replyHtml += '<div style="margin-top:12px;">' +
                    '<a href="' + result.fileDownloadUrl + '" download="' + (result.fileName || 'sunum.txt') + '" class="btn-primary" style="display:inline-flex; align-items:center; gap:8px; padding:10px 18px; text-decoration:none; border-radius:30px; font-size:13px;">' +
                    '<span>📥</span><span>' + (result.fileName || 'Dosyayı İndir') + '</span></a>' +
                    '</div>';
            }

            replyHtml += '</div>';
            chat.innerHTML += replyHtml;
            chat.scrollTop = chat.scrollHeight;

            if (typeof window.incrementUsage === 'function') {
                window.incrementUsage('aethrionAlPerDay', 'day', 1);
            }

            if (window.currentUploadedFile && typeof window.removeVizyonAlFile === 'function') {
                window.removeVizyonAlFile();
            }

            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('AETHRION Al mesajı işlendi', { mode: window.aethrionAlMode });
            }
        } else {
            var errMsg = (result && result.error) ? result.error : 'AETHRION Al cevap veremedi.';
            chat.innerHTML += '<div class="vz-msg bot" style="border-left-color:var(--danger);">' +
                '<div class="vz-role" style="color:var(--danger);">⚠️ HATA</div>' +
                window.escapeHtml(errMsg) +
                '</div>';
            chat.scrollTop = chat.scrollHeight;
            if (typeof window.addLogError === 'function') {
                window.addLogError('AETHRION Al hatası: ' + errMsg);
            }
        }
    } catch (e) {
        console.error('AETHRION Al hatası:', e);
        var t3 = document.getElementById(thinkId);
        if (t3) t3.remove();
        chat.innerHTML += '<div class="vz-msg bot" style="border-left-color:var(--danger);">' +
            '<div class="vz-role" style="color:var(--danger);">⚠️ BAĞLANTI HATASI</div>' +
            window.escapeHtml(e.message || 'Bilinmeyen hata') +
            '</div>';
        chat.scrollTop = chat.scrollHeight;
        if (typeof window.addLogError === 'function') {
            window.addLogError('AETHRION Al bağlantı hatası: ' + e.message);
        }
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
};}catch(e){console.warn("[legacy] sendAethrionAlMessage",e);}
try{ if(typeof window.startAethrionAlVoiceInput!=="function"||__OVER.indexOf("startAethrionAlVoiceInput")>=0) window.startAethrionAlVoiceInput=function () {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('❌ Tarayıcınız sesli komut desteklemiyor!', 'error');
        return;
    }
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    var micBtn = document.getElementById('vzMicBtn');

    recognition.onstart = function () {
        if (micBtn) micBtn.classList.add('listening');
        showNotification('🎤 Konuşmaya başlayın...', 'success');
    };

    recognition.onresult = function (event) {
        var transcript = event.results[0][0].transcript;
        var input = document.getElementById('vzInput');
        if (input) {
            input.value = transcript;
            window.sendAethrionAlMessage();
        }
    };

    recognition.onerror = function (event) {
        if (micBtn) micBtn.classList.remove('listening');
        showNotification('❌ Ses algılanamadı: ' + event.error, 'error');
    };

    recognition.onend = function () {
        if (micBtn) micBtn.classList.remove('listening');
    };

    recognition.start();
};}catch(e){console.warn("[legacy] startAethrionAlVoiceInput",e);}
try{ if(typeof window.currentUploadedFile==="undefined") window.currentUploadedFile=null;}catch(e){console.warn("[legacy] currentUploadedFile",e);}
try{ if(typeof window.handleVizyonAlFileUpload!=="function"||__OVER.indexOf("handleVizyonAlFileUpload")>=0) window.handleVizyonAlFileUpload=function (input) {
    var file = input.files[0];
    if (!file) return;

    window.currentUploadedFile = file;

    var previewBox = document.getElementById('vzFilePreviewBox');
    var icon = document.getElementById('vzFilePreviewIcon');
    var nameEl = document.getElementById('vzFilePreviewName');
    var sizeEl = document.getElementById('vzFilePreviewSize');

    if (previewBox) previewBox.classList.add('show');
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = (file.size / 1024).toFixed(1) + ' KB';

    var isImage = file.type && file.type.startsWith('image/');
    if (isImage && icon) {
        var reader = new FileReader();
        reader.onload = function (e) {
            icon.innerHTML = '<img src="' + e.target.result + '" style="width:100%; height:100%; object-fit:cover;">';
        };
        reader.readAsDataURL(file);
    } else if (icon) {
        var isVideo = file.type && file.type.startsWith('video/');
        icon.innerHTML = isVideo ? '🎬' : '📄';
    }

    showNotification('📎 Dosya hazır: ' + file.name, 'success');
};}catch(e){console.warn("[legacy] handleVizyonAlFileUpload",e);}
try{ if(typeof window.acceptScreenReading!=="function"||__OVER.indexOf("acceptScreenReading")>=0) window.acceptScreenReading=async function () {
    closeModal('vizyonAlScreenPermissionModal');
    closeModal('aethrionAlScreenPermissionModal');
    try {
        var stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: false
        });
        window.vizyonAlScreenStream = stream;
        window.vizyonAlScreenSharing = true;

        stream.getVideoTracks()[0].addEventListener('ended', function () {
            window.vizyonAlScreenSharing = false;
            window.vizyonAlScreenStream = null;
            if (typeof window.stopVizyonAlLiveScreen === 'function') {
                window.stopVizyonAlLiveScreen();
            }
            showNotification('🖥️ Ekran paylaşımı durduruldu.', 'warning');
        });

        var chat = document.getElementById('vzChat');
        if (chat) {
            chat.innerHTML += '<div class="vz-screen-permission">' +
                '🖥️ <strong>Ekran paylaşımı aktif</strong><br>' +
                'AETHRION Al artık ekranınızı görebilir. <strong>👁️</strong> ile tek kare, <strong>🟢 Canlı</strong> ile sürekli izleme başlatabilirsin.' +
                '<button onclick="window.stopScreenReading()">Durdur</button>' +
                '</div>';
            chat.scrollTop = chat.scrollHeight;
        }

        showNotification('✅ Ekran paylaşımı başladı!', 'success');
        if (typeof window.addLogInfo === 'function') {
            window.addLogInfo('AETHRION Al ekran okuma başlatıldı');
        }
    } catch (e) {
        console.error('Ekran paylaşımı hatası:', e);
        showNotification('❌ Ekran paylaşımı başlatılamadı: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] acceptScreenReading",e);}
try{ if(typeof window.declineScreenReading!=="function"||__OVER.indexOf("declineScreenReading")>=0) window.declineScreenReading=function () {
    closeModal('vizyonAlScreenPermissionModal');
    closeModal('aethrionAlScreenPermissionModal');
    showNotification('Ekran okuma izni verilmedi.', 'warning');
};}catch(e){console.warn("[legacy] declineScreenReading",e);}
try{ if(typeof window.stopScreenReading!=="function"||__OVER.indexOf("stopScreenReading")>=0) window.stopScreenReading=function () {
    if (window.vizyonAlScreenStream) {
        try {
            window.vizyonAlScreenStream.getTracks().forEach(function (t) { t.stop(); });
        } catch (e) {}
        window.vizyonAlScreenStream = null;
        window.vizyonAlScreenSharing = false;
        showNotification('🖥️ Ekran paylaşımı durduruldu.', 'warning');
    }
};}catch(e){console.warn("[legacy] stopScreenReading",e);}
try{ if(typeof window.captureScreenAndAnalyze!=="function"||__OVER.indexOf("captureScreenAndAnalyze")>=0) window.captureScreenAndAnalyze=async function (customQuestion) {
    if (!window.currentUser) {
        showNotification('Önce giriş yapın!', 'error');
        return;
    }
    if (!window.vizyonAlScreenStream) {
        showNotification('⚠️ Önce "Ekranı Paylaş" butonuna basıp izin verin!', 'warning');
        return;
    }

    var chat = document.getElementById('vzChat');
    if (!chat) return;

    var q = customQuestion || 'Ekranda ne görüyorsun? Detaylıca açıkla, varsa metinleri oku, butonları ve bölümleri tanımla.';

    chat.innerHTML += '<div class="vz-msg bot" id="vz_scan_info">' +
        '<div class="vz-role">✨ AETHRION AL</div>' +
        '<span style="color:#b8c0d0;">🖥️ Ekran okunuyor... (kare yakalanıyor)</span>' +
        '</div>';
    chat.scrollTop = chat.scrollHeight;

    try {
        var video = document.createElement('video');
        video.srcObject = window.vizyonAlScreenStream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        await new Promise(function (resolve, reject) {
            var timeout = setTimeout(function () { reject(new Error('Video timeout')); }, 3000);
            video.onloadedmetadata = function () {
                clearTimeout(timeout);
                resolve();
            };
        });

        await new Promise(function (resolve) { setTimeout(resolve, 400); });

        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        var base64 = dataUrl.split(',')[1];

        console.log('📸 Ekran karesi yakalandı:', canvas.width + 'x' + canvas.height);

        var infoEl = document.getElementById('vz_scan_info');
        if (infoEl) {
            infoEl.innerHTML = '<div class="vz-role">✨ AETHRION AL</div>' +
                '<span style="color:#b8c0d0;">🧠 Analiz ediliyor...</span>';
        }

        var result = await Parse.Cloud.run('vizyonAlScreenRead', {
            imageBase64: base64,
            question: q
        });

        if (infoEl) infoEl.remove();

        if (result && result.success && result.reply) {
            var cleaned = cleanClientResponse(result.reply);
            chat.innerHTML += '<div class="vz-msg bot">' +
                '<div class="vz-role">✨ AETHRION AL (Ekran Okuma)</div>' +
                cleaned +
                '</div>';
            chat.scrollTop = chat.scrollHeight;
            if (typeof window.incrementUsage === 'function') {
                window.incrementUsage('aethrionAlPerDay', 'day', 1);
            }
        } else {
            var errMsg = (result && result.error) ? result.error : 'Ekran okunamadı.';
            chat.innerHTML += '<div class="vz-msg bot" style="border-left-color:var(--danger);">' +
                '<div class="vz-role" style="color:var(--danger);">⚠️ HATA</div>' +
                window.escapeHtml(errMsg) +
                '</div>';
            chat.scrollTop = chat.scrollHeight;
        }
    } catch (e) {
        console.error('Ekran yakalama hatası:', e);
        var infoEl2 = document.getElementById('vz_scan_info');
        if (infoEl2) infoEl2.remove();
        chat.innerHTML += '<div class="vz-msg bot" style="border-left-color:var(--danger);">' +
            '<div class="vz-role" style="color:var(--danger);">⚠️ EKRAN HATASI</div>' +
            window.escapeHtml(e.message || 'Bilinmeyen hata') +
            '</div>';
        chat.scrollTop = chat.scrollHeight;
    }
};}catch(e){console.warn("[legacy] captureScreenAndAnalyze",e);}
try{ if(typeof window.vizyonAlLiveInterval==="undefined") window.vizyonAlLiveInterval=null;}catch(e){console.warn("[legacy] vizyonAlLiveInterval",e);}
try{ if(typeof window.vizyonAlLiveLastHash==="undefined") window.vizyonAlLiveLastHash=null;}catch(e){console.warn("[legacy] vizyonAlLiveLastHash",e);}
try{ if(typeof window.vizyonAlLiveLastDesc==="undefined") window.vizyonAlLiveLastDesc='';}catch(e){console.warn("[legacy] vizyonAlLiveLastDesc",e);}
try{ if(typeof window.vizyonAlLiveActive==="undefined") window.vizyonAlLiveActive=false;}catch(e){console.warn("[legacy] vizyonAlLiveActive",e);}
function _vzFrameHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i += 50) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h;
}
if(typeof window._vzFrameHash!=="function"||__OVER.indexOf("_vzFrameHash")>=0)window._vzFrameHash=_vzFrameHash;
async function _vzCaptureFrame(quality) {
    var stream = window.vizyonAlScreenStream;
    if (!stream) return null;

    var video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    await new Promise(function (res, rej) {
        var t = setTimeout(function () { rej(new Error('Video timeout')); }, 2000);
        video.onloadedmetadata = function () { clearTimeout(t); res(); };
    });
    await new Promise(function (res) { setTimeout(res, 300); });

    var targetW = 1024;
    var vw = video.videoWidth || 1280;
    var vh = video.videoHeight || 720;
    var ratio = targetW / vw;
    var targetH = Math.round(vh * ratio);

    var canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.getContext('2d').drawImage(video, 0, 0, targetW, targetH);

    var dataUrl = canvas.toDataURL('image/jpeg', quality || 0.55);
    return dataUrl.split(',')[1];
}
if(typeof window._vzCaptureFrame!=="function"||__OVER.indexOf("_vzCaptureFrame")>=0)window._vzCaptureFrame=_vzCaptureFrame;
try{ if(typeof window.startVizyonAlLiveScreen!=="function"||__OVER.indexOf("startVizyonAlLiveScreen")>=0) window.startVizyonAlLiveScreen=async function () {
    if (!window.currentUser) return showNotification('Giriş yapın!', 'error');
    if (!window.vizyonAlScreenStream) {
        return showNotification('⚠️ Önce ekranı paylaş!', 'warning');
    }
    if (window.vizyonAlLiveActive) {
        return showNotification('Zaten canlı modda!', 'warning');
    }

    var chat = document.getElementById('vzChat');
    if (!chat) return;

    window.vizyonAlLiveActive = true;
    window.vizyonAlLiveLastHash = null;
    window.vizyonAlLiveLastDesc = '';

    var btn = document.getElementById('vzLiveBtn');
    if (btn) {
        btn.innerHTML = '🛑 Durdur';
        btn.style.background = 'rgba(239,68,68,0.2)';
        btn.style.borderColor = 'var(--danger)';
        btn.style.color = 'var(--danger)';
    }

    chat.innerHTML += '<div class="vz-msg bot" style="border-left-color:#b8c0d0;">' +
        '<div class="vz-role" style="color:#b8c0d0;">🟢 CANLI MOD AKTİF</div>' +
        'Ekranı sürekli izliyorum. Sadece <strong>değişiklik olduğunda</strong> konuşacağım. Durdurmak için 🛑 butonuna bas.' +
        '</div>';
    chat.scrollTop = chat.scrollHeight;

    window.vizyonAlLiveInterval = setInterval(async function () {
        if (!window.vizyonAlLiveActive) return;
        if (!window.vizyonAlScreenStream) {
            window.stopVizyonAlLiveScreen();
            return;
        }

        try {
            var base64 = await _vzCaptureFrame(0.55);
            if (!base64) return;

            var newHash = _vzFrameHash(base64);
            if (newHash === window.vizyonAlLiveLastHash) {
                return;
            }
            window.vizyonAlLiveLastHash = newHash;

            var result = await Parse.Cloud.run('vizyonAlLiveScreenStream', {
                imageBase64: base64,
                previousDescription: window.vizyonAlLiveLastDesc,
                mode: window.aethrionAlMode || 'normal'
            });

            if (!result || !result.success) return;

            if (result.reply && result.reply.length > 3) {
                window.vizyonAlLiveLastDesc = result.reply;
                var cleaned = cleanClientResponse(result.reply);
                var timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                chat.innerHTML += '<div class="vz-msg bot" style="border-left-color:#b8c0d0;">' +
                    '<div class="vz-role" style="color:#b8c0d0;">👁️ AETHRION AL (canlı ' + timeStr + ')</div>' +
                    cleaned +
                    '</div>';
                chat.scrollTop = chat.scrollHeight;
            }
        } catch (e) {
            console.warn('Canlı mod hatası:', e.message);
        }
    }, 3000);

    showNotification('🟢 Canlı ekran modu başladı (3sn aralık)', 'success');
};}catch(e){console.warn("[legacy] startVizyonAlLiveScreen",e);}
try{ if(typeof window.stopVizyonAlLiveScreen!=="function"||__OVER.indexOf("stopVizyonAlLiveScreen")>=0) window.stopVizyonAlLiveScreen=function () {
    if (window.vizyonAlLiveInterval) {
        clearInterval(window.vizyonAlLiveInterval);
        window.vizyonAlLiveInterval = null;
    }
    window.vizyonAlLiveActive = false;
    window.vizyonAlLiveLastHash = null;

    var btn = document.getElementById('vzLiveBtn');
    if (btn) {
        btn.innerHTML = '🟢 Canlı';
        btn.style.background = 'rgba(184,192,208,0.1)';
        btn.style.borderColor = 'rgba(184,192,208,0.35)';
        btn.style.color = '#b8c0d0';
    }

    var chat = document.getElementById('vzChat');
    if (chat) {
        chat.innerHTML += '<div class="vz-msg bot" style="border-left-color:var(--warning);">' +
            '<div class="vz-role" style="color:var(--warning);">🔴 CANLI MOD DURDURULDU</div>' +
            'Ekran izleme durdu.' +
            '</div>';
        chat.scrollTop = chat.scrollHeight;
    }
    showNotification('🔴 Canlı mod durduruldu', 'warning');
};}catch(e){console.warn("[legacy] stopVizyonAlLiveScreen",e);}
try{ if(typeof window.toggleVizyonAlLiveScreen!=="function"||__OVER.indexOf("toggleVizyonAlLiveScreen")>=0) window.toggleVizyonAlLiveScreen=function () {
    if (window.vizyonAlLiveActive) {
        window.stopVizyonAlLiveScreen();
    } else {
        window.startVizyonAlLiveScreen();
    }
};}catch(e){console.warn("[legacy] toggleVizyonAlLiveScreen",e);}
try{ if(typeof window.ensureScreenReadButton!=="function"||__OVER.indexOf("ensureScreenReadButton")>=0) window.ensureScreenReadButton=function () {
    var inputArea = document.querySelector('.vizyon-al-input-area') || document.querySelector('.aethrion-al-input-area');
    if (!inputArea) return;

    if (!document.getElementById('vzScreenReadBtn')) {
        var btn = document.createElement('button');
        btn.id = 'vzScreenReadBtn';
        btn.className = 'vz-mic-btn';
        btn.title = 'Ekranı Tek Sefer Oku';
        btn.innerHTML = '👁️';
        btn.style.background = 'rgba(184,192,208,0.1)';
        btn.style.borderColor = 'rgba(184,192,208,0.35)';
        btn.style.color = '#b8c0d0';
        btn.onclick = function () { window.captureScreenAndAnalyze(); };
        var sendBtn = document.getElementById('vzSendBtn');
        if (sendBtn) inputArea.insertBefore(btn, sendBtn);
        else inputArea.appendChild(btn);
    }

    if (!document.getElementById('vzLiveBtn')) {
        var liveBtn = document.createElement('button');
        liveBtn.id = 'vzLiveBtn';
        liveBtn.className = 'vz-mic-btn';
        liveBtn.title = 'Canlı Ekran İzleme';
        liveBtn.innerHTML = '🟢 Canlı';
        liveBtn.style.background = 'rgba(184,192,208,0.1)';
        liveBtn.style.borderColor = 'rgba(184,192,208,0.35)';
        liveBtn.style.color = '#b8c0d0';
        liveBtn.style.fontSize = '11px';
        liveBtn.style.padding = '0 12px';
        liveBtn.style.width = 'auto';
        liveBtn.style.borderRadius = '20px';
        liveBtn.onclick = function () { window.toggleVizyonAlLiveScreen(); };
        var sendBtn2 = document.getElementById('vzSendBtn');
        if (sendBtn2) inputArea.insertBefore(liveBtn, sendBtn2);
        else inputArea.appendChild(liveBtn);
    }
};}catch(e){console.warn("[legacy] ensureScreenReadButton",e);}
try{ if(typeof window.stopVizyonAlResponse!=="function"||__OVER.indexOf("stopVizyonAlResponse")>=0) window.stopVizyonAlResponse=function () {
    window.vizyonAlLastRequestId = null;
    var thinking = document.querySelector('.vz-thinking');
    if (thinking) thinking.remove();
    var sendBtn = document.getElementById('vzSendBtn');
    if (sendBtn) sendBtn.disabled = false;
    showNotification('⏹️ AETHRION Al yanıtı durduruldu.', 'warning');
};}catch(e){console.warn("[legacy] stopVizyonAlResponse",e);}
try{ if(typeof window.openScreenPermissionModal!=="function"||__OVER.indexOf("openScreenPermissionModal")>=0) window.openScreenPermissionModal=function () {
    var modal = document.getElementById('vizyonAlScreenPermissionModal') || document.getElementById('aethrionAlScreenPermissionModal');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
    }
};}catch(e){console.warn("[legacy] openScreenPermissionModal",e);}
try{ if(typeof window.openVizyonAlModeInfoModal!=="function"||__OVER.indexOf("openVizyonAlModeInfoModal")>=0) window.openVizyonAlModeInfoModal=function () {
    var modal = document.getElementById('vizyonAlModeInfoModal') || document.getElementById('aethrionAlModeInfoModal');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
    }
};}catch(e){console.warn("[legacy] openVizyonAlModeInfoModal",e);}
try{ if(typeof window.analyzeModeratorVideo!=="function"||__OVER.indexOf("analyzeModeratorVideo")>=0) window.analyzeModeratorVideo=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    var urlInput = document.getElementById('modVideoUrl');
    var startInput = document.getElementById('modVideoStart');
    var endInput = document.getElementById('modVideoEnd');
    var noteInput = document.getElementById('modVideoNote');
    var resultEl = document.getElementById('modVideoResult');
    if (!resultEl) return;

    var url = urlInput ? urlInput.value.trim() : '';
    var start = startInput ? startInput.value : '0';
    var end = endInput ? endInput.value : '30';
    var note = noteInput ? noteInput.value.trim() : '';

    if (!url && !note) {
        return showNotification('Video URL veya not girin!', 'warning');
    }

    resultEl.style.display = 'block';
    resultEl.innerHTML = '⏳ Analiz ediliyor...';

    try {
        var prompt = 'Moderatör video kesit analizi:\n' +
            'URL: ' + (url || 'belirtilmedi') + '\n' +
            'Zaman aralığı: ' + start + 's - ' + end + 's\n' +
            'Not: ' + (note || '-') + '\n\n' +
            'Kısa bir analiz ve tavsiye ver. Türkçe olsun.';
        var result = await Parse.Cloud.run('superAI', { prompt: prompt });
        resultEl.innerHTML = '<strong style="color:var(--moderator);">📊 Analiz Sonucu:</strong><br>' +
            window.escapeHtml(result).replace(/\n/g, '<br>');
        showNotification('✅ Analiz tamamlandı!', 'success');
    } catch (e) {
        resultEl.innerHTML = '❌ Analiz hatası: ' + window.escapeHtml(e.message);
        showNotification('❌ Analiz hatası!', 'error');
    }
};}catch(e){console.warn("[legacy] analyzeModeratorVideo",e);}
try{ if(typeof window.publishModeratorClip!=="function"||__OVER.indexOf("publishModeratorClip")>=0) window.publishModeratorClip=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    var urlInput = document.getElementById('modVideoUrl');
    var startInput = document.getElementById('modVideoStart');
    var endInput = document.getElementById('modVideoEnd');
    var noteInput = document.getElementById('modVideoNote');
    var resultEl = document.getElementById('modVideoResult');

    var url = urlInput ? urlInput.value.trim() : '';
    var start = startInput ? startInput.value : '0';
    var end = endInput ? endInput.value : '30';
    var note = noteInput ? noteInput.value.trim() : '';

    if (!url) return showNotification('Video URL gerekli!', 'warning');
    if (!note) return showNotification('Analiz/tavsiye notu gerekli!', 'warning');

    try {
        var result = await Parse.Cloud.run('createVideoClip', {
            videoUrl: url,
            startTime: parseInt(start) || 0,
            endTime: parseInt(end) || 30,
            note: note
        });
        if (result && result.success) {
            showNotification('✅ Kesit paylaşıldı!', 'success');
            if (typeof window.addLogSuccess === 'function') {
                window.addLogSuccess('AETHRION Moderatör video kesit paylaşıldı');
            }
            if (resultEl) {
                resultEl.style.display = 'block';
                resultEl.innerHTML = '<strong style="color:var(--accent2);">✅ Kesit yayınlandı!</strong><br>' +
                    'Kesit ID: ' + window.escapeHtml(result.clipId || '-');
            }
            setTimeout(function () {
                closeModal('moderatorVideoToolModal');
            }, 1500);
        } else {
            showNotification('❌ ' + (result.error || 'Paylaşılamadı'), 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
        if (typeof window.addLogError === 'function') {
            window.addLogError('AETHRION Video kesit paylaşma hatası: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] publishModeratorClip",e);}
try{ if(typeof window.scrollToProjectRequests!=="function"||__OVER.indexOf("scrollToProjectRequests")>=0) window.scrollToProjectRequests=function () {
    var card = document.getElementById('projectRequestsCard');
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () {
            card.style.outline = '2px solid var(--moderator)';
            setTimeout(function () { card.style.outline = ''; }, 2000);
        }, 600);
    }
};}catch(e){console.warn("[legacy] scrollToProjectRequests",e);}
try{ if(typeof window.kocCurrentRequestId==="undefined") window.kocCurrentRequestId=null;}catch(e){console.warn("[legacy] kocCurrentRequestId",e);}
try{ if(typeof window.renderKocMessage!=="function"||__OVER.indexOf("renderKocMessage")>=0) window.renderKocMessage=function (text) {
    if (!text) return '';
    var safe = window.escapeHtml(text);
    safe = safe.replace(/```([a-zA-Z0-9+#]*)\n?([\s\S]*?)```/g, function (match, lang, code) {
        return '<pre style="background:rgba(0,0,0,0.4);padding:8px 12px;border-radius:8px;overflow-x:auto;margin:6px 0;border:1px solid rgba(212,175,55,0.15);"><code style="font-family:var(--font-code);color:#b8c0d0;font-size:12px;">' + code + '</code></pre>';
    });
    safe = safe.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
};}catch(e){console.warn("[legacy] renderKocMessage",e);}
try{ if(typeof window.getKocLimitClient!=="function"||__OVER.indexOf("getKocLimitClient")>=0) window.getKocLimitClient=function (user) {
    if (!user) return 0;
    var role = user.get('role');
    var plan = user.get('plan');
    if (role === 'founder' || role === 'admin' || role === 'beta' || role === 'moderator') return -1;
    if (plan === 'team') return 1000;
    if (plan === 'pro') return 50;
    return 10;
};}catch(e){console.warn("[legacy] getKocLimitClient",e);}
async function getKocUsageClient() {
    try {
        var result = await Parse.Cloud.run('getKocUsage', {});
        return result || { used: 0, limit: 0 };
    } catch (e) {
        console.warn('KocUsage alınamadı:', e);
        return { used: 0, limit: 0 };
    }
}
if(typeof window.getKocUsageClient!=="function"||__OVER.indexOf("getKocUsageClient")>=0)window.getKocUsageClient=getKocUsageClient;
try{ if(typeof window.onKocShareCheckboxChange!=="function"||__OVER.indexOf("onKocShareCheckboxChange")>=0) window.onKocShareCheckboxChange=function () {
    var cb = document.getElementById('kocResponsibilityCheckbox');
    var pwInput = document.getElementById('kocSharePasswordInput');
    var createBtn = document.getElementById('kocShareCreateBtn');
    var isChecked = cb && cb.checked;
    var hasPw = pwInput && pwInput.value.trim().length >= 4;

    if (createBtn) createBtn.disabled = !(isChecked && hasPw);
};}catch(e){console.warn("[legacy] onKocShareCheckboxChange",e);}
try{ if(typeof window.toggleKocSharePasswordVisibility!=="function"||__OVER.indexOf("toggleKocSharePasswordVisibility")>=0) window.toggleKocSharePasswordVisibility=function () {
    var pwInput = document.getElementById('kocSharePasswordInput');
    if (!pwInput) return;
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
};}catch(e){console.warn("[legacy] toggleKocSharePasswordVisibility",e);}
try{ if(typeof window.generateRandomKocSharePassword!=="function"||__OVER.indexOf("generateRandomKocSharePassword")>=0) window.generateRandomKocSharePassword=function () {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var pw = '';
    for (var i = 0; i < 8; i++) {
        pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    var pwInput = document.getElementById('kocSharePasswordInput');
    if (pwInput) {
        pwInput.value = pw;
        pwInput.type = 'text';
    }
    window.onKocShareCheckboxChange();
};}catch(e){console.warn("[legacy] generateRandomKocSharePassword",e);}
try{ if(typeof window.voiceChatActive==="undefined") window.voiceChatActive=false;}catch(e){console.warn("[legacy] voiceChatActive",e);}
try{ if(typeof window.voiceChatStartTime==="undefined") window.voiceChatStartTime=null;}catch(e){console.warn("[legacy] voiceChatStartTime",e);}
try{ if(typeof window.voiceChatTimer==="undefined") window.voiceChatTimer=null;}catch(e){console.warn("[legacy] voiceChatTimer",e);}
try{ if(typeof window.voiceChatCountedMinutes==="undefined") window.voiceChatCountedMinutes=0;}catch(e){console.warn("[legacy] voiceChatCountedMinutes",e);}
try{ if(typeof window.voiceChatLastTick==="undefined") window.voiceChatLastTick=null;}catch(e){console.warn("[legacy] voiceChatLastTick",e);}
try{ if(typeof window.toggleVoiceChatMute!=="function"||__OVER.indexOf("toggleVoiceChatMute")>=0) window.toggleVoiceChatMute=function () {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        showNotification('🔇 Ses kapatıldı', 'warning');
    } else {
        showNotification('🔊 Ses açık', 'success');
    }
};}catch(e){console.warn("[legacy] toggleVoiceChatMute",e);}
try{ if(typeof window.openA27QuickCreate!=="function"||__OVER.indexOf("openA27QuickCreate")>=0) window.openA27QuickCreate=function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    var modal = document.getElementById('v27QuickCreateOverlay') || document.getElementById('a27QuickCreateOverlay');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
        var nameInput = document.getElementById('v27QuickKeyName') || document.getElementById('a27QuickKeyName');
        if (nameInput) nameInput.value = '';
        var descInput = document.getElementById('v27QuickKeyDesc') || document.getElementById('a27QuickKeyDesc');
        if (descInput) descInput.value = '';
        var errEl = document.getElementById('v27QuickCreateError') || document.getElementById('a27QuickCreateError');
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
        window._a27QuickSelectedDuration = 'unlimited';
        window._v27QuickSelectedDuration = 'unlimited';
        var durationRow = document.getElementById('v27QuickDurationRow') || document.getElementById('a27QuickDurationRow');
        if (durationRow) {
            durationRow.querySelectorAll('.v27-duration-btn').forEach(function (btn) {
                btn.classList.remove('active');
                if (btn.getAttribute('data-val') === 'unlimited') btn.classList.add('active');
                btn.onclick = function () {
                    durationRow.querySelectorAll('.v27-duration-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    window._a27QuickSelectedDuration = btn.getAttribute('data-val');
                    window._v27QuickSelectedDuration = btn.getAttribute('data-val');
                };
            });
        }
    }
};}catch(e){console.warn("[legacy] openA27QuickCreate",e);}
try{ if(typeof window.openV27QuickCreate==="undefined") window.openV27QuickCreate=window.openA27QuickCreate;}catch(e){console.warn("[legacy] openV27QuickCreate",e);}
try{ if(typeof window.closeA27QuickCreate!=="function"||__OVER.indexOf("closeA27QuickCreate")>=0) window.closeA27QuickCreate=function () {
    var modal = document.getElementById('a27QuickCreateOverlay') || document.getElementById('v27QuickCreateOverlay');
    if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
    }
};}catch(e){console.warn("[legacy] closeA27QuickCreate",e);}
try{ if(typeof window.closeV27QuickCreate==="undefined") window.closeV27QuickCreate=window.closeA27QuickCreate;}catch(e){console.warn("[legacy] closeV27QuickCreate",e);}
try{ if(typeof window.submitQuickA27Key!=="function"||__OVER.indexOf("submitQuickA27Key")>=0) window.submitQuickA27Key=async function () {
    if (!window.currentUser) return showNotification('Önce giriş yapın!', 'error');
    var nameEl = document.getElementById('v27QuickKeyName') || document.getElementById('a27QuickKeyName');
    var descEl = document.getElementById('v27QuickKeyDesc') || document.getElementById('a27QuickKeyDesc');
    var errEl = document.getElementById('v27QuickCreateError') || document.getElementById('a27QuickCreateError');
    var keyName = nameEl ? nameEl.value.trim() : '';
    var keyDesc = descEl ? descEl.value.trim() : '';

    function showErr(msg) {
        if (errEl) { errEl.textContent = '❌ ' + msg; errEl.style.display = 'block'; }
        showNotification('❌ ' + msg, 'error');
    }
    if (errEl) errEl.style.display = 'none';

    if (!keyName) return showErr('Anahtar adı gerekli!');
    if (keyName.length < 2) return showErr('Anahtar adı en az 2 karakter olmalı!');

    try {
        var result = await Parse.Cloud.run('createV27ApiKey', {
            keyName: keyName,
            keyDescription: keyDesc,
            duration: window._a27QuickSelectedDuration || 'unlimited',
            viaVizyonAl: true
        });

        if (!result.success) return showErr(result.error || 'Anahtar oluşturulamadı.');

        var genModal = document.getElementById('a27QuickCreateOverlay') || document.getElementById('v27QuickCreateOverlay');
        if (genModal) { genModal.classList.remove('open'); genModal.style.display = 'none'; }
        window.showA27KeyReveal(result.plainKey, result.durationLabel);

        showNotification('✅ A27 API anahtarı oluşturuldu!', 'success');
        if (typeof window.addLogSuccess === 'function') {
            window.addLogSuccess('AETHRION Al üzerinden A27 API anahtarı oluşturuldu');
        }
    } catch (e) {
        console.error('A27 key oluşturma hatası:', e);
        showErr(e.message || 'Bilinmeyen hata');
    }
};}catch(e){console.warn("[legacy] submitQuickA27Key",e);}
try{ if(typeof window.submitQuickV27Key==="undefined") window.submitQuickV27Key=window.submitQuickA27Key;}catch(e){console.warn("[legacy] submitQuickV27Key",e);}
try{ if(typeof window.showA27KeyReveal!=="function"||__OVER.indexOf("showA27KeyReveal")>=0) window.showA27KeyReveal=function (plainKey, durationLabel) {
    var overlay = document.getElementById('a27KeyRevealOverlay') || document.getElementById('v27KeyRevealOverlay');
    if (!overlay) {
        alert('🔑 A27 API Anahtarınız (BİR DAHA GÖSTERİLMEYECEK!):\n\n' + plainKey + '\n\n⏱️ Süre: ' + (durationLabel || 'Süresiz') + '\n\nLütfen güvenli bir yere kaydedin!\n\nAETHRION — Intelligence Without Limits.');
        return;
    }
    var keyEl = document.getElementById('v27RevealKeyValue') || document.getElementById('a27RevealKeyValue');
    if (keyEl) keyEl.textContent = plainKey;
    window._a27RevealKey = plainKey;
    window._v27RevealKey = plainKey;
    overlay.classList.add('open');
    overlay.style.display = 'flex';
};}catch(e){console.warn("[legacy] showA27KeyReveal",e);}
try{ if(typeof window.showV27KeyReveal==="undefined") window.showV27KeyReveal=window.showA27KeyReveal;}catch(e){console.warn("[legacy] showV27KeyReveal",e);}
try{ if(typeof window.closeA27KeyReveal!=="function"||__OVER.indexOf("closeA27KeyReveal")>=0) window.closeA27KeyReveal=function () {
    var overlay = document.getElementById('a27KeyRevealOverlay') || document.getElementById('v27KeyRevealOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        overlay.style.display = 'none';
    }
    window._a27RevealKey = null;
    window._v27RevealKey = null;
    if (typeof window.loadMyAethrionApiKeys === 'function') {
        window.loadMyAethrionApiKeys();
    } else if (typeof window.loadMyVizyonApiKeys === 'function') {
        window.loadMyVizyonApiKeys();
    }
};}catch(e){console.warn("[legacy] closeA27KeyReveal",e);}
try{ if(typeof window.closeV27KeyReveal==="undefined") window.closeV27KeyReveal=window.closeA27KeyReveal;}catch(e){console.warn("[legacy] closeV27KeyReveal",e);}
try{ if(typeof window.copyA27RevealKey!=="function"||__OVER.indexOf("copyA27RevealKey")>=0) window.copyA27RevealKey=function () {
    var key = window._a27RevealKey || window._v27RevealKey;
    if (!key) return showNotification('Kopyalanacak anahtar yok!', 'error');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(key).then(function () {
            showNotification('📋 A27 API anahtarı kopyalandı!', 'success');
        }).catch(function () {
            fallbackCopyText(key);
        });
    } else {
        fallbackCopyText(key);
    }
};}catch(e){console.warn("[legacy] copyA27RevealKey",e);}
try{ if(typeof window.copyV27RevealKey==="undefined") window.copyV27RevealKey=window.copyA27RevealKey;}catch(e){console.warn("[legacy] copyV27RevealKey",e);}
try{ if(typeof window._commentsLoading==="undefined") window._commentsLoading=false;}catch(e){console.warn("[legacy] _commentsLoading",e);}
try{ if(typeof window._commentsLastHash==="undefined") window._commentsLastHash='';}catch(e){console.warn("[legacy] _commentsLastHash",e);}
function _hashComments(comments) {
    if (!comments || comments.length === 0) return 'empty';
    var str = '';
    for (var i = 0; i < Math.min(comments.length, 10); i++) {
        str += (comments[i].id || '') + '|' + (comments[i].comment || '').substring(0, 30) + ';';
    }
    var h = 0;
    for (var j = 0; j < str.length; j++) {
        h = ((h << 5) - h + str.charCodeAt(j)) | 0;
    }
    return String(h) + '_' + comments.length;
}
if(typeof window._hashComments!=="function"||__OVER.indexOf("_hashComments")>=0)window._hashComments=_hashComments;
try{ if(typeof window.loadComments!=="function"||__OVER.indexOf("loadComments")>=0) window.loadComments=async function () {
    if (window._commentsLoading) {
        return;
    }
    window._commentsLoading = true;

    try {
        var result = await Parse.Cloud.run('getComments', {});
        var comments = (result && result.comments) ? result.comments : [];

        var newHash = _hashComments(comments);
        if (newHash === window._commentsLastHash) {
            window._commentsLoading = false;
            return;
        }
        window._commentsLastHash = newHash;

        var dashContainer = document.getElementById('commentsList');
        if (dashContainer) {
            window.renderCommentsStatic(dashContainer, comments);
        }

        var mainContainer = document.getElementById('mainCommentsList');
        if (mainContainer) {
            window.renderCommentsMarquee(mainContainer, comments);
        }
    } catch (e) {
        console.error('Yorumlar yüklenemedi:', e);
        var errHtml = '<div class="comment-item" style="border-left-color:var(--danger);">⚠️ Yorumlar yüklenemedi.</div>';
        var d = document.getElementById('commentsList');
        if (d && d.children.length === 0) d.innerHTML = errHtml;
        var m = document.getElementById('mainCommentsList');
        if (m && m.children.length === 0) m.innerHTML = errHtml;
    } finally {
        window._commentsLoading = false;
    }
};}catch(e){console.warn("[legacy] loadComments",e);}
try{ if(typeof window.renderCommentsStatic!=="function"||__OVER.indexOf("renderCommentsStatic")>=0) window.renderCommentsStatic=function (container, comments) {
    if (!container) return;
    container.classList.remove('comments-track');
    container.classList.add('comments-list-static');

    if (comments.length === 0) {
        container.innerHTML = '<div class="comment-item" style="border-left-color:var(--border2);text-align:center;color:var(--text3);">🌟 Henüz yorum yok. İlk yorumu sen yap!</div>';
        return;
    }

    var currentEmail = window.currentUser ? window.currentUser.get('email') : null;
    var currentRole = window.currentUser ? window.currentUser.get('role') : null;
    var canModerate = (currentRole === 'admin' || currentRole === 'founder' || currentRole === 'moderator');

    var html = '';
    comments.forEach(function (c) {
        var role = c.user_role || 'user';
        var roleLabel = role === 'founder' ? '👑 KURUCU' :
                        role === 'admin' ? '⚙️ ADMIN' :
                        role === 'beta' ? '🔬 BETA' :
                        role === 'moderator' ? '🎨 MODERATÖR' : '👤 KULLANICI';
        var rating = c.rating || 0;
        var stars = '';
        for (var i = 0; i < 5; i++) stars += (i < rating) ? '★' : '☆';

        var isOwner = (currentEmail && c.user_email === currentEmail);
        var canEdit = isOwner || canModerate;
        var canDelete = isOwner || canModerate;

        var time = c.createdAt ? new Date(c.createdAt).toLocaleString('tr-TR') : '';
        var commentId = c.id || '';

        html += '<div class="comment-item" data-rating="' + rating + '" data-comment-id="' + commentId + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
        html += '<span style="font-weight:600;">' + window.escapeHtml(c.user_name || 'Kullanıcı') + ' <span class="role-badge ' + role + '">' + roleLabel + '</span></span>';
        html += '<span style="color:#ffd11a;font-size:14px;" title="' + rating + '/5">' + stars + '</span>';
        html += '</div>';
        html += '<div class="comment-text">' + window.escapeHtml(c.comment || '') + '</div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">';
        html += '<span class="comment-email">' + window.escapeHtml(c.user_email || '') + '</span>';
        html += '<span class="comment-time">' + window.escapeHtml(time) + '</span>';
        html += '</div>';

        if (canEdit || canDelete) {
            html += '<div class="comment-actions">';
            if (canEdit) html += '<button class="comment-edit-btn" onclick="window.editComment(\'' + commentId + '\')">✏️ Düzenle</button>';
            if (canDelete) html += '<button class="comment-delete-btn" onclick="window.deleteComment(\'' + commentId + '\')">🗑️ Sil</button>';
            html += '</div>';
        }
        html += '</div>';
    });
    container.innerHTML = html;
};}catch(e){console.warn("[legacy] renderCommentsStatic",e);}
try{ if(typeof window.renderCommentsMarquee!=="function"||__OVER.indexOf("renderCommentsMarquee")>=0) window.renderCommentsMarquee=function (container, comments) {
    if (!container) return;
    if (!container.classList.contains('comments-track')) container.classList.add('comments-track');
    container.classList.remove('comments-list-static');

    if (comments.length === 0) {
        container.innerHTML = '<div class="comment-item" style="border-left-color:var(--border2);text-align:center;color:var(--text3);">🌟 Henüz yorum yok.</div>';
        return;
    }

    var singleHtml = '';
    comments.forEach(function (c) {
        var role = c.user_role || 'user';
        var roleLabel = role === 'founder' ? '👑 KURUCU' :
                        role === 'admin' ? '⚙️ ADMIN' :
                        role === 'beta' ? '🔬 BETA' :
                        role === 'moderator' ? '🎨 MODERATÖR' : '👤 KULLANICI';
        var rating = c.rating || 0;
        var stars = '';
        for (var i = 0; i < 5; i++) stars += (i < rating) ? '★' : '☆';
        var time = c.createdAt ? new Date(c.createdAt).toLocaleString('tr-TR') : '';

        singleHtml += '<div class="comment-item" data-rating="' + rating + '">';
        singleHtml += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
        singleHtml += '<span style="font-weight:600;">' + window.escapeHtml(c.user_name || 'Kullanıcı') + ' <span class="role-badge ' + role + '">' + roleLabel + '</span></span>';
        singleHtml += '<span style="color:#ffd11a;font-size:14px;">' + stars + '</span>';
        singleHtml += '</div>';
        singleHtml += '<div class="comment-text">' + window.escapeHtml(c.comment || '') + '</div>';
        singleHtml += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">';
        singleHtml += '<span class="comment-email">' + window.escapeHtml(c.user_email || '') + '</span>';
        singleHtml += '<span class="comment-time">' + window.escapeHtml(time) + '</span>';
        singleHtml += '</div></div>';
    });

    container.innerHTML = singleHtml;
};}catch(e){console.warn("[legacy] renderCommentsMarquee",e);}
try{ if(typeof window.editComment!=="function"||__OVER.indexOf("editComment")>=0) window.editComment=async function (commentId) {
    if (!window.currentUser) return showNotification('Giriş yapmalısınız!', 'error');
    if (!commentId) return showNotification('Yorum ID gerekli!', 'error');

    var el = document.querySelector('[data-comment-id="' + commentId + '"]');
    var currentText = '';
    if (el) {
        var t = el.querySelector('.comment-text');
        if (t) currentText = t.textContent.trim();
    }

    var newText = prompt('Yorumu düzenle:', currentText);
    if (newText === null) return;
    if (!newText.trim()) return showNotification('Yorum boş olamaz!', 'warning');
    if (newText.trim() === currentText) return showNotification('Değişiklik yapılmadı.', 'warning');

    try {
        var result = await Parse.Cloud.run('editComment', { commentId: commentId, newText: newText.trim() });
        if (result.success) {
            showNotification('✅ Yorum güncellendi!', 'success');
            window._commentsLastHash = '';
            await window.loadComments();
        } else {
            showNotification('❌ ' + (result.error || 'Güncellenemedi'), 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] editComment",e);}
try{ if(typeof window.deleteComment!=="function"||__OVER.indexOf("deleteComment")>=0) window.deleteComment=async function (commentId) {
    if (!window.currentUser) return showNotification('Giriş yapmalısınız!', 'error');
    if (!commentId) return showNotification('Yorum ID gerekli!', 'error');
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

    try {
        var result = await Parse.Cloud.run('deleteComment', { commentId: commentId });
        if (result.success) {
            showNotification('🗑️ Yorum silindi!', 'success');
            window._commentsLastHash = '';
            await window.loadComments();
        } else {
            showNotification('❌ ' + (result.error || 'Silinemedi'), 'error');
        }
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] deleteComment",e);}
try{ if(typeof window.currentRating==="undefined") window.currentRating=window.currentRating || 0;}catch(e){console.warn("[legacy] currentRating",e);}
try{ if(typeof window.postComment!=="function"||__OVER.indexOf("postComment")>=0) window.postComment=async function () {
    if (!window.currentUser) return showNotification('Yorum yapmak için giriş yapın!', 'error');
    var input = document.getElementById('commentInput');
    if (!input) return;
    var comment = input.value.trim();
    if (!comment) return showNotification('Yorum boş olamaz!', 'warning');
    try {
        await Parse.Cloud.run('addComment', { comment: comment, rating: window.currentRating || 0 });
        input.value = '';
        window.currentRating = 0;
        var ratingDisplay = document.getElementById('ratingDisplay');
        if (ratingDisplay) ratingDisplay.textContent = 'Puan ver';
        var stars = document.querySelectorAll('#ratingStars .star');
        stars.forEach(function (s) { s.style.color = ''; });
        showNotification('✅ Yorumunuz eklendi!', 'success');
        window._commentsLastHash = '';
        await window.loadComments();
    } catch (e) {
        showNotification('Hata: ' + e.message, 'error');
    }
};}catch(e){console.warn("[legacy] postComment",e);}
try{ if(typeof window.setRating!=="function"||__OVER.indexOf("setRating")>=0) window.setRating=function (value) {
    window.currentRating = value;
    var stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach(function (s, i) {
        s.style.color = (i < value) ? '#ffd11a' : '';
    });
    var display = document.getElementById('ratingDisplay');
    if (display) display.textContent = value + ' yıldız';
};}catch(e){console.warn("[legacy] setRating",e);}
try{ if(typeof window.filterComments!=="function"||__OVER.indexOf("filterComments")>=0) window.filterComments=function (minRating) {
    var items = document.querySelectorAll('#commentsList .comment-item, #mainCommentsList .comment-item');
    items.forEach(function (item) {
        if (!minRating || minRating === 0) { item.style.display = ''; return; }
        var r = parseInt(item.getAttribute('data-rating') || '0', 10);
        item.style.display = (r >= minRating) ? '' : 'none';
    });
};}catch(e){console.warn("[legacy] filterComments",e);}
try{ if(typeof window.callNvidiaNIM!=="function"||__OVER.indexOf("callNvidiaNIM")>=0) window.callNvidiaNIM=async function (prompt, model) {
    try {
        var result = await Parse.Cloud.run('callNvidiaNIM', {
            prompt: prompt,
            model: model || 'meta/llama-3.3-70b-instruct'
        });
        return result;
    } catch (e) {
        console.error('NVIDIA NIM hatası:', e);
        throw e;
    }
};}catch(e){console.warn("[legacy] callNvidiaNIM",e);}
try{ if(typeof window.callCustomAPIWithFallback!=="function"||__OVER.indexOf("callCustomAPIWithFallback")>=0) window.callCustomAPIWithFallback=async function (prompt, apiKeys) {
    if (!apiKeys || apiKeys.length === 0) {
        throw new Error('API anahtarı bulunamadı');
    }
    var lastError = null;
    for (var i = 0; i < apiKeys.length; i++) {
        try {
            var result = await Parse.Cloud.run('callCustomAIWithKeys', {
                prompt: prompt,
                keyIds: [apiKeys[i].id]
            });
            if (result && result.success && result.reply) {
                return result.reply;
            }
        } catch (e) {
            console.warn('API anahtarı ' + (i + 1) + ' başarısız:', e.message);
            lastError = e;
        }
    }
    throw lastError || new Error('Tüm API anahtarları başarısız oldu');
};}catch(e){console.warn("[legacy] callCustomAPIWithFallback",e);}
try{ if(typeof window.loadUserList!=="function"||__OVER.indexOf("loadUserList")>=0) window.loadUserList=async function () {
    var container = document.getElementById('userList');
    if (!container) {
        console.warn('⚠️ userList elementi bulunamadı');
        return;
    }

    // Yetki kontrolü — sadece founder/admin görebilir
    if (!window.currentUser) {
        container.innerHTML = '<div class="user-item">⚠️ Giriş yapmalısınız.</div>';
        return;
    }

    var role = window.currentUser.get('role');
    if (role !== 'founder' && role !== 'admin') {
        container.innerHTML = '<div class="user-item">🔒 Bu listeyi sadece Kurucu ve Admin görebilir.</div>';
        return;
    }

    container.innerHTML = '<div class="user-item" style="color:var(--text3);text-align:center;">⏳ Kullanıcılar yükleniyor...</div>';

    try {
        var result = await Parse.Cloud.run('getAllUsers', {});
        if (!result || !result.success || !result.users || result.users.length === 0) {
            container.innerHTML = '<div class="user-item">📭 Hiç kullanıcı bulunamadı.</div>';
            return;
        }

        var html = '';
        result.users.forEach(function (u) {
            var safeEmail = window.escapeHtml(u.email || '');
            var safeName = window.escapeHtml(u.name || 'İsimsiz');
            var safeRole = u.role || 'user';
            var roleLabel = safeRole === 'founder' ? '👑 KURUCU' :
                           safeRole === 'admin' ? '⚙️ ADMIN' :
                           safeRole === 'beta' ? '🔬 BETA' :
                           safeRole === 'moderator' ? '🎨 MODERATÖR' :
                           '👤 KULLANICI';
            var isBanned = u.isBanned ? ' 🚫 ENGELLİ' : '';
            var planLabel = u.plan === 'team' ? '👥 Takım' :
                           u.plan === 'pro' ? '🌟 Pro' : '🆓 Ücretsiz';
            var points = u.points || 0;

            html += '<div class="user-item">';
            html += '<div style="flex:1;min-width:0;">';
            html += '<div class="user-email">' + safeEmail + isBanned + '</div>';
            html += '<div style="font-size:11px;color:var(--text3);margin-top:3px;">' +
                    safeName + ' · ' + roleLabel + ' · ' + planLabel + ' · ⭐ ' + points + '</div>';
            html += '</div>';
            html += '<div class="user-actions">';
            if (safeRole !== 'founder') {
                if (safeRole === 'admin') {
                    html += '<button class="btn-user" onclick="window.setUserRole(\'' + window.escapeForOnclick(u.email) + '\', \'user\')">👤 Üye Yap</button>';
                } else {
                    html += '<button class="btn-admin" onclick="window.setUserRole(\'' + window.escapeForOnclick(u.email) + '\', \'admin\')">⚙️ Admin</button>';
                }
                if (safeRole === 'moderator') {
                    html += '<button class="btn-user" onclick="window.setUserRole(\'' + window.escapeForOnclick(u.email) + '\', \'user\')">🚫 Mod Kaldır</button>';
                } else {
                    html += '<button class="btn-mod" onclick="window.setUserRole(\'' + window.escapeForOnclick(u.email) + '\', \'moderator\')">🎨 Mod</button>';
                }
                if (u.isBanned) {
                    html += '<button class="btn-user" onclick="window.unbanUserEmail(\'' + window.escapeForOnclick(u.email) + '\')">🔓 Aç</button>';
                } else {
                    html += '<button class="btn-ban" onclick="window.banUserEmail(\'' + window.escapeForOnclick(u.email) + '\')">🚫 Ban</button>';
                }
            } else {
                html += '<span style="font-size:10px;color:var(--gold);padding:4px 10px;">👑 Kurucu</span>';
            }
            html += '</div>';
            html += '</div>';
        });
        container.innerHTML = html;
        console.log('✅ loadUserList tamamlandı: ' + result.users.length + ' kullanıcı');
    } catch (e) {
        console.error('loadUserList hatası:', e);
        container.innerHTML = '<div class="user-item" style="color:var(--danger);">⚠️ Yüklenemedi: ' + window.escapeHtml(e.message) + '</div>';
        if (typeof window.addLogError === 'function') {
            window.addLogError('Kullanıcı listesi yüklenemedi: ' + e.message);
        }
    }
};}catch(e){console.warn("[legacy] loadUserList",e);}
try{ if(typeof window.searchAllUsers!=="function"||__OVER.indexOf("searchAllUsers")>=0) window.searchAllUsers=async function () {
    var input = document.getElementById('userSearchInput');
    var container = document.getElementById('userList');
    if (!input || !container) return;
    var query = input.value.trim();
    if (!query) {
        return window.loadUserList();
    }
    container.innerHTML = '<div class="user-item" style="color:var(--text3);text-align:center;">⏳ Aranıyor...</div>';
    try {
        var result = await Parse.Cloud.run('searchUsers', { query: query });
        if (!result || result.length === 0) {
            container.innerHTML = '<div class="user-item">🔍 Eşleşen kullanıcı bulunamadı.</div>';
            return;
        }
        var html = '';
        result.forEach(function (u) {
            var safeEmail = window.escapeHtml(u.email || '');
            var safeName = window.escapeHtml(u.name || 'İsimsiz');
            html += '<div class="user-item">';
            html += '<div class="user-email">' + safeEmail + '</div>';
            html += '<div style="font-size:11px;color:var(--text3);">' + safeName + '</div>';
            html += '</div>';
        });
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div class="user-item" style="color:var(--danger);">⚠️ ' + window.escapeHtml(e.message) + '</div>';
    }
};}catch(e){console.warn("[legacy] searchAllUsers",e);}
try{ if(typeof window.refreshUserList!=="function"||__OVER.indexOf("refreshUserList")>=0) window.refreshUserList=async function () {
    if (window.currentUser && (window.currentUser.get('role') === 'founder' || window.currentUser.get('role') === 'admin')) {
        await window.loadUserList();
    }
};}catch(e){console.warn("[legacy] refreshUserList",e);}
})();

/* AETHRION auth/dashboard recovery hotfix — bounded UI waits and verified-account routing. */
(function (window, document) {
  'use strict';
  function notify(message, type) {
    try { if (typeof window.showNotification === 'function') window.showNotification(message, type || 'error'); else console.warn('[AETHRION Auth Recovery]', message); }
    catch (_) { console.warn('[AETHRION Auth Recovery]', message); }
  }
  function authWithTimeout(promise, ms, label) {
    var timer;
    return Promise.race([
      Promise.resolve(promise),
      new Promise(function (_, reject) {
        timer = window.setTimeout(function () {
          var error = new Error(label + ' timed out after ' + ms + 'ms');
          error.code = 'AETHRION_AUTH_TIMEOUT';
          reject(error);
        }, ms);
      })
    ]).finally(function () { if (timer) window.clearTimeout(timer); });
  }
  function hideBusyLayers() {
    ['aeAuthProgressOverlay', 'aethrionAuthBusyOverlay'].forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      node.classList.remove('is-visible');
      node.setAttribute('aria-hidden', 'true');
      node.style.setProperty('display', 'none', 'important');
      node.style.pointerEvents = 'none';
    });
    document.querySelectorAll('#formRegister button, #formLogin button, #formVerify button').forEach(function (button) {
      if (button.getAttribute('aria-busy') === 'true') {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.classList.remove('ae-auth-busy');
      }
    });
  }
  function showAuthenticatedDashboard() {
    var user = null;
    try { user = window.Parse && window.Parse.User && window.Parse.User.current(); } catch (_) {}
    if (!user) return false;
    var dashboard = document.getElementById('dashboardArea');
    var main = document.getElementById('mainSite');
    var auth = document.getElementById('authModal');
    if (dashboard) {
      dashboard.style.setProperty('display', 'block', 'important');
      dashboard.style.setProperty('visibility', 'visible', 'important');
      dashboard.style.setProperty('opacity', '1', 'important');
      dashboard.style.setProperty('pointer-events', 'auto', 'important');
    }
    if (main) main.style.setProperty('display', 'none', 'important');
    if (auth) { auth.style.setProperty('display', 'none', 'important'); auth.setAttribute('aria-hidden', 'true'); }
    if (document.body) document.body.classList.add('logged-in-user');
    hideBusyLayers();
    return true;
  }

  // Several legacy scripts wrap showDashboard and await unrelated initializers.
  // Never let a non-critical dashboard initializer hold a valid login hostage.
  if (typeof window.showDashboard === 'function' && !window.showDashboard.__aeBounded) {
    var originalShowDashboard = window.showDashboard;
    var boundedShowDashboard = async function () {
      var task;
      try {
        task = Promise.resolve().then(function () { return originalShowDashboard.apply(this, arguments); }.bind(this));
        await Promise.race([
          task,
          new Promise(function (resolve) { window.setTimeout(resolve, 5000); })
        ]);
      } catch (error) {
        console.warn('[AETHRION Auth Recovery] Dashboard initializer failed; using authenticated fallback.', String(error && error.message || error).slice(0, 180));
      }
      if (showAuthenticatedDashboard()) {
        // Legacy timers/guards can run after the initial dashboard promise settles.
        // Re-assert the authenticated view briefly while those old initializers drain.
        [250, 800, 1600, 3000, 6000].forEach(function (delay) {
          window.setTimeout(showAuthenticatedDashboard, delay);
        });
        return true;
      }
      hideBusyLayers();
      return false;
    };
    boundedShowDashboard.__aeBounded = true;
    window.showDashboard = boundedShowDashboard;
  }

  // The old verification handler was local to a legacy script, while the HTML calls
  // window.verifyAccount(). Expose a working public handler if it was not exported.
  if (typeof window.verifyAccount !== 'function') {
    window.verifyAccount = async function () {
      var emailField = document.getElementById('verifyEmail');
      var codeField = document.getElementById('verifyCode');
      var email = emailField ? emailField.value.trim().toLowerCase() : '';
      var code = codeField ? codeField.value.trim() : '';
      if (!email || !/^\d{6}$/.test(code)) {
        notify('Geçerli e-posta adresi ve 6 haneli doğrulama kodu girin.', 'error');
        return false;
      }
      var timeoutId;
      try {
        if (!window.Parse || !window.Parse.Cloud) throw new Error('Kimlik doğrulama servisi hazır değil. Sayfayı yenileyin.');
        var result = await Promise.race([
          window.Parse.Cloud.run('verifyUser', { email: email, code: code }),
          new Promise(function (_, reject) { timeoutId = window.setTimeout(function () { reject(new Error('Doğrulama sunucusu 15 saniye içinde yanıt vermedi. Tekrar deneyin.')); }, 15000); })
        ]);
        if (!result || result.success !== true) throw new Error((result && result.error) || 'Doğrulama başarısız.');
        notify('Hesabınız doğrulandı. Şimdi giriş yapabilirsiniz.', 'success');
        if (typeof window.switchTab === 'function') window.switchTab('login');
        return true;
      } catch (error) {
        notify('Doğrulama tamamlanamadı: ' + String(error && error.message || error), 'error');
        return false;
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        hideBusyLayers();
      }
    };
  }

  // A stuck/failed async path must always release the loading layer and buttons.
  window.addEventListener('unhandledrejection', function () { window.setTimeout(hideBusyLayers, 0); });
  window.addEventListener('error', function () { window.setTimeout(hideBusyLayers, 0); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var overlay = document.getElementById('aeAuthProgressOverlay');
      if (overlay && overlay.classList.contains('is-visible')) {
        // The active handler owns the actual operation; only release stale overlays.
        window.setTimeout(function () {
          if (overlay && overlay.classList.contains('is-visible')) hideBusyLayers();
        }, 36000);
      }
    }
  });
  window.setTimeout(function () {
    try { if (window.Parse && window.Parse.User && window.Parse.User.current()) showAuthenticatedDashboard(); }
    catch (_) {}
  }, 0);

  // Last-loaded reliable email/password flow. This deliberately lives in the
  // hotfix file so legacy UI wrappers cannot leave auth buttons permanently busy.
  function field(id){return document.getElementById(id)}
  function value(id){var e=field(id);return e?String(e.value||'').trim():''}
  function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
  function authTab(tab){
    try{if(typeof window.switchTab==='function')window.switchTab(tab)}catch(_){}
    [['login','formLogin'],['register','formRegister'],['verify','formVerify']].forEach(function(x){var e=field(x[1]);if(e)e.style.display=x[0]===tab?'block':'none'});
    var modal=field('authModal');if(modal){modal.style.display='flex';modal.setAttribute('aria-hidden','false')}
    if(tab==='verify'){var email=value('rEmail')||value('lEmail')||value('verifyEmail');if(field('verifyEmail')&&email)field('verifyEmail').value=email.toLowerCase()}
  }
  function releaseAuth(){hideBusyLayers();var e=field('aeAuthProgressOverlay');if(e){e.classList.remove('is-visible');e.setAttribute('aria-hidden','true')}}
  window.handleRegister=async function(){
    var name=value('rName'),email=value('rEmail').toLowerCase(),displayName=value('rUsername'),pass=value('rPass'),pass2=value('rPass2');
    if(!name||!displayName||!validEmail(email)||pass.length<8){notify('Ad soyad, kullanıcı adı, geçerli e-posta ve en az 8 karakterli şifre girin.','error');return false}
    if(pass!==pass2){notify('Şifreler eşleşmiyor.','error');return false}
    if((field('registerTermsCheck')&&!field('registerTermsCheck').checked)||(field('registerPrivacyCheck')&&!field('registerPrivacyCheck').checked)){notify('Kullanıcı sözleşmesini ve gizlilik politikasını kabul edin.','warning');return false}
    if(!window.Parse||!window.Parse.User||!window.Parse.Cloud){notify('Hesap servisi hazır değil. Sayfayı yenileyip tekrar deneyin.','error');return false}
    try{
      var user=new window.Parse.User();
      user.set('username',email);user.set('password',pass);user.set('email',email);user.set('name',name);user.set('displayUsername',displayName);user.set('role','user');user.set('plan','free');user.set('isVerified',false);
      await user.signUp();
      var mailSent=false,mailError='';
      try{
        var timer;
        var sent=await Promise.race([window.Parse.Cloud.run('resendAccountVerification',{email:email}),new Promise(function(_,reject){timer=window.setTimeout(function(){reject(new Error('E-posta servisi zaman aşımına uğradı.'))},15000)})]);
        if(timer)window.clearTimeout(timer);mailSent=!!(sent&&sent.success===true);if(!mailSent)mailError=(sent&&sent.error)||'E-posta sağlayıcısı gönderimi onaylamadı';
      }catch(e){mailError=String(e&&e.message||e)}
      try{await window.Parse.User.logOut()}catch(_){}
      authTab('verify');
      notify(mailSent?'Hesap oluşturuldu. E-postana gelen 6 haneli kodu gir.':'Hesap oluşturuldu; doğrulama e-postası gönderilemedi. “Yeni Kod Gönder” seçeneğini dene. '+mailError.slice(0,140),mailSent?'success':'warning');
      return true;
    }catch(e){
      var msg=String(e&&e.message||e);
      if(/username.*taken|already taken|email.*taken|already exists/i.test(msg))msg='Bu e-posta ile hesap zaten kayıtlı olabilir. Giriş yapmayı veya şifre sıfırlamayı dene.';
      notify('Kayıt tamamlanamadı: '+msg,'error');return false;
    }finally{releaseAuth()}
  };
  window.handleLogin=async function(){
    var email=value('lEmail').toLowerCase(),pass=value('lPass');
    if(!validEmail(email)||!pass){notify('Geçerli e-posta ve şifreni gir.','error');return false}
    if(!window.Parse||!window.Parse.User||!window.Parse.Cloud){notify('Hesap servisi hazır değil. Sayfayı yenileyip tekrar dene.','error');return false}
    try{
      var user=null,cloudError=null,cloudResult=null,allowClientFallback=false;
      // Preferred path: server-side email lookup supports old usernames and legacy accounts.
      // Keep credential/verification rejections authoritative; only fall back for transport,
      // missing-function, or session-restoration failures.
      try{
        cloudResult=await authWithTimeout(window.Parse.Cloud.run('aethrionLoginWithEmail',{email:email,password:pass}),15000,'AETHRION email login Cloud Code timeout');
      }catch(e){
        cloudError=e;
        var requestMessage=String(e&&e.message||e);
        allowClientFallback=/function.*(?:not found|does not exist|unknown)|cloud code.*(?:not found|unavailable)|network|failed to fetch|timeout|timed out|connection/i.test(requestMessage);
      }
      if(cloudResult&&cloudResult.code==='EMAIL_NOT_VERIFIED'){
        authTab('verify');if(field('verifyEmail'))field('verifyEmail').value=email;
        notify(cloudResult.error||'Hesabını e-posta koduyla doğrulamalısın.','warning');return false;
      }
      if(cloudResult&&cloudResult.success===false){
        throw new Error(cloudResult.error||'E-posta veya şifre hatalı.');
      }
      if(cloudResult&&cloudResult.success===true&&cloudResult.sessionToken){
        try{
          user=await authWithTimeout(window.Parse.User.become(cloudResult.sessionToken),10000,'AETHRION session restore timeout');
        }catch(sessionError){
          cloudError=sessionError;
          allowClientFallback=true;
          console.warn('[AETHRION Auth] Server login accepted credentials but session restoration failed; trying Parse client login.',String(sessionError&&sessionError.message||sessionError).slice(0,160));
        }
      }else if(!cloudResult){
        if(!allowClientFallback)throw cloudError||new Error('Giriş sunucusundan yanıt alınamadı.');
      }else{
        throw new Error('Giriş sunucusu geçerli oturum döndürmedi.');
      }
      if(!user&&allowClientFallback){
        try{user=await authWithTimeout(window.Parse.User.logIn(email,pass),12000,'AETHRION client login timeout')}catch(firstError){
          var byEmail=new window.Parse.Query(window.Parse.User);
          byEmail.equalTo('email',email);
          var legacy=await byEmail.first();
          var legacyUsername=legacy&&legacy.get('username');
          if(!legacyUsername||String(legacyUsername).toLowerCase()===email) throw firstError;
          user=await authWithTimeout(window.Parse.User.logIn(legacyUsername,pass),12000,'AETHRION legacy username login timeout');
        }
      }
      if(!user)throw cloudError||new Error('Sunucu oturum oluşturmadı.');
      if(!user)throw cloudError||new Error('Sunucu oturum oluşturmadı.');
      if(user.get('isVerified')===false&&user.get('emailVerified')!==true&&!!user.get('verificationCode')){
        try{await window.Parse.User.logOut()}catch(_){}
        authTab('verify');if(field('verifyEmail'))field('verifyEmail').value=email;
        notify('Hesap henüz doğrulanmamış. E-postandaki kodu gir veya yeni kod iste.','warning');return false
      }
      // Commit the authenticated state before running any optional dashboard initializer.
      window.currentUser=user;
      function revealDashboard(){
        var auth=field('authModal'),main=field('mainSite'),dash=field('dashboardArea');
        if(auth){auth.classList.remove('open');auth.style.setProperty('display','none','important');auth.setAttribute('aria-hidden','true')}
        if(main)main.style.setProperty('display','none','important');
        if(dash){dash.style.setProperty('display','block','important');dash.style.setProperty('visibility','visible','important');dash.style.setProperty('opacity','1','important');dash.style.setProperty('pointer-events','auto','important')}
        document.body.classList.add('logged-in-user','aethrion-authenticated');
        hideBusyLayers();
        try{if(typeof window.onAethrionLoginSuccess==='function')window.onAethrionLoginSuccess(user)}catch(_){}
        try{window.dispatchEvent(new CustomEvent('aethrion:authenticated',{detail:{user:user}}))}catch(_){}
        return !!dash;
      }
      // Keep the successful email-login route self-contained. The legacy showDashboard
      // chain can run older initializers after authentication and overwrite the active view.
      // Reveal the dashboard directly, then use the current welcome renderer when available.
      function finishDashboardRoute(){
        revealDashboard();
        try{if(typeof window.showWelcome==='function')window.showWelcome()}catch(_){}
        revealDashboard();
      }
      finishDashboardRoute();
      [0,250,800,1600,3000,5000].forEach(function(delay){window.setTimeout(finishDashboardRoute,delay)});
      notify('Giriş başarılı. AETHRION çalışma alanın açıldı.','success');return true
    }catch(e){notify('Giriş tamamlanamadı: '+String(e&&e.message||e),'error');return false}
    finally{releaseAuth()}
  };
  window.verifyAccount=async function(){
    var email=value('verifyEmail').toLowerCase(),code=value('verifyCode');
    if(!validEmail(email)||!/^\d{6}$/.test(code)){notify('Geçerli e-posta ve 6 haneli doğrulama kodu gir.','error');return false}
    try{
      var result=await window.Parse.Cloud.run('verifyUser',{email:email,code:code});
      if(!result||result.success!==true)throw new Error((result&&result.error)||'Kod doğrulanamadı.');
      authTab('login');if(field('lEmail'))field('lEmail').value=email;
      notify('E-posta doğrulandı. Şimdi giriş yapabilirsin.','success');return true
    }catch(e){notify('Doğrulama başarısız: '+String(e&&e.message||e),'error');return false}
    finally{releaseAuth()}
  };
  window.resendAccountVerification=async function(){
    var email=(value('verifyEmail')||value('rEmail')).toLowerCase();
    if(!validEmail(email)){notify('Önce doğrulanacak e-posta adresini gir.','error');return false}
    try{
      var result=await window.Parse.Cloud.run('resendAccountVerification',{email:email});
      if(!result||result.success!==true)throw new Error((result&&result.error)||'Kod gönderilemedi.');
      notify('Hesap uygunsa yeni doğrulama kodu e-posta adresine gönderildi.','success');return true
    }catch(e){notify('Kod gönderilemedi: '+String(e&&e.message||e),'error');return false}
    finally{releaseAuth()}
  };

})(window, document);

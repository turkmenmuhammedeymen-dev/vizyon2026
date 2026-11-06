/* AETHRION OMEGA Welcome Presenter — verified page tour + browser-native Turkish narration */
(function () {
  'use strict';
  var root = document.getElementById('aethrionWelcomeTour');
  if (!root || root.dataset.ready === '1') return;

  var steps = [
    {
      title: 'AETHRION ekosistemine hoş geldiniz',
      text: 'AETHRION; yapay zekâ, üretim araçları, geliştirici kaynakları ve öğrenme rehberlerini tek bir web deneyiminde bir araya getirmeyi amaçlar. Bu tur, depoda doğrulanan gerçek ürün sayfalarını gösterir.',
      caption: 'Merhaba. AETHRION dünyasını birlikte keşfedelim.',
      voice: 'Merhaba. AETHRION platformuna hoş geldiniz. Ben AETHRION sanal rehberiyim. Şimdi platformun gerçek sayfalarını birlikte keşfedeceğiz.',
      url: './dokumantasyon.html',
      label: 'RESMÎ KULLANIM KILAVUZU'
    },
    {
      title: 'AETHRION AI çalışma alanı',
      text: 'AETHRION AI sayfası Normal, Derin Düşünme, Ajan ve Yazılımcı çalışma modlarını tanıtır. Gerçek kullanılabilirlik, dağıtım ayarlarına ve hesabınızın erişim izinlerine bağlıdır.',
      caption: 'Farklı görevler için tasarlanmış AI çalışma alanı.',
      voice: 'AETHRION AI, farklı ihtiyaçlara yönelik çalışma modları sunar. Normal mod genel sohbet, Derin Düşünme kapsamlı analiz, Ajan görev akışları, Yazılımcı modu ise kodlama çalışmaları içindir. Özelliklerin kullanılabilirliği etkin entegrasyonlara ve hesap izinlerine bağlıdır.',
      url: './aethrion-assistant.html',
      label: 'AETHRION AI · ÇALIŞMA ALANI'
    },
    {
      title: 'Sesli sohbet ve dosya rehberi',
      text: 'Resmî dokümantasyon; sesli etkileşim ve desteklenen dosyalarla çalışma adımlarını açıklar. Dosya türü, boyutu ve özellik erişimi ilgili sayfadaki güncel sınırlara bağlıdır.',
      caption: 'Sesli etkileşimi ve dosya akışlarını keşfedin.',
      voice: 'Sesli sohbet için desteklenen tarayıcıda mikrofon izni vermeniz gerekir. Dosya analizi için desteklenen dosyanızı seçip sorunuzu iletebilirsiniz. Dosya türleri, boyut sınırları ve erişim koşulları kullanım kılavuzunda açıklanır.',
      url: './dokumantasyon.html',
      label: 'DOKÜMANTASYON · SES VE DOSYA'
    },
    {
      title: '3D Studio ile üretim',
      text: '3D Studio sayfası, tarayıcı tabanlı üç boyutlu çalışma alanını ve GLB dışa aktarma akışını tanıtır. Kaydetme ve entegrasyon özellikleri dağıtım durumuna göre değişebilir.',
      caption: 'Fikirlerinizi üç boyutlu çalışma alanına taşıyın.',
      voice: 'AETHRION 3D Studio, tarayıcıda üç boyutlu sahneler oluşturmak ve düzenlemek için tasarlanmıştır. Sayfadaki araçları inceleyebilir, desteklenen dışa aktarma seçeneklerini görebilirsiniz.',
      url: './3d-studio.html',
      label: 'AETHRION · 3D STUDIO'
    },
    {
      title: 'Öğrenme ve kullanım rehberi',
      text: 'Bana Öğret sayfası, AETHRION özelliklerini öğrenmek isteyen kullanıcılar için kapsamlı bir rehber sunar. Adım adım açıklamalarla ürün alanlarını keşfedebilirsiniz.',
      caption: 'Öğrenin, deneyin ve kendi çalışma akışınızı kurun.',
      voice: 'AETHRION Bana Öğret alanı, platformun özelliklerini daha iyi anlamanız için hazırlanmış kapsamlı bir rehberdir. Yeni başlayanlar ve belirli bir özelliği öğrenmek isteyen kullanıcılar burada açıklamalara ulaşabilir.',
      url: './bana-ogret.html',
      label: 'AETHRION · BANA ÖĞRET'
    },
    {
      title: 'A27 API ve geliştirici belgeleri',
      text: 'A27 API sayfası geliştirici dokümantasyonunu sunar. Kimlik doğrulama, erişim izinleri ve kullanım limitlerini inceleyin; gizli anahtarları herkese açık kodlarda paylaşmayın.',
      caption: 'Geliştirici belgeleriyle entegrasyon dünyasını keşfedin.',
      voice: 'Geliştiriciler için A27 API belgeleri ayrı bir sayfada bulunur. Entegrasyonları kullanmadan önce kimlik doğrulama, kullanım limitleri ve güvenlik kurallarını dikkatle okuyun. Gizli anahtarlarınızı asla herkese açık kodlarda paylaşmayın.',
      url: './api.html',
      label: 'A27 API · GELİŞTİRİCİ BELGELERİ'
    }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var ui = {
    frame: $('aeTourFrame'), caption: $('aeTourCaption'), title: $('aeTourStepTitle'),
    text: $('aeTourStepText'), link: $('aeTourStepLink'), counter: $('aeTourCounter'),
    label: $('aeTourScreenLabel'), progress: $('aeTourProgress'), play: $('aeTourPlay'),
    state: $('aeVoiceState'), prev: $('aeTourPrev'), next: $('aeTourNext'),
    stop: $('aeTourStop')
  };
  if (Object.keys(ui).some(function (key) { return !ui[key]; })) return;
  root.dataset.ready = '1';

  var index = 0;
  var status = 'idle';
  var utterance = null;
  var synth = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window)
    ? window.speechSynthesis : null;

  function setStatus(message) {
    ui.state.textContent = message;
  }

  function stopNarration(message) {
    if (synth) synth.cancel();
    status = 'idle';
    root.classList.remove('is-speaking');
    ui.play.textContent = '▶ Bu bölümü dinle';
    setStatus(message || (synth ? 'Türkçe sesli anlatım hazır' : 'Tarayıcı ses desteği bulunamadı'));
  }

  function chooseTurkishVoice() {
    if (!synth) return null;
    var voices = synth.getVoices ? synth.getVoices() : [];
    return voices.find(function (voice) {
      return /^tr([-_]|$)/i.test(voice.lang) && /natural|online|premium|google|microsoft/i.test(voice.name);
    }) || voices.find(function (voice) {
      return /^tr([-_]|$)/i.test(voice.lang);
    }) || null;
  }

  function renderStep() {
    var step = steps[index];
    ui.title.textContent = step.title;
    ui.text.textContent = step.text;
    ui.caption.textContent = step.caption;
    ui.link.href = step.url;
    ui.link.textContent = 'Bu gerçek ürün sayfasını aç ↗';
    ui.link.setAttribute('target', '_blank');
    ui.link.setAttribute('rel', 'noopener noreferrer');
    ui.counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    ui.label.textContent = step.label;
    ui.progress.style.width = ((index + 1) / steps.length * 100) + '%';
    if (ui.frame.getAttribute('src') !== step.url) ui.frame.setAttribute('src', step.url);
    ui.prev.disabled = index === 0;
    ui.next.disabled = index === steps.length - 1;
    ui.frame.title = 'AETHRION gerçek ürün sayfası: ' + step.title;
  }

  function speakCurrent() {
    if (!synth) {
      setStatus('Bu tarayıcıda sesli okuma desteklenmiyor; metin anlatımı kullanılabilir.');
      return;
    }
    synth.cancel();
    utterance = new SpeechSynthesisUtterance(steps[index].voice);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.94;
    utterance.pitch = 1.02;
    utterance.volume = 1;
    var voice = chooseTurkishVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = function () {
      status = 'speaking';
      root.classList.add('is-speaking');
      ui.play.textContent = 'Ⅱ Duraklat';
      setStatus('Türkçe sesli anlatım oynatılıyor');
    };
    utterance.onend = function () {
      status = 'idle';
      root.classList.remove('is-speaking');
      ui.play.textContent = '↻ Yeniden dinle';
      setStatus('Bu bölümün anlatımı tamamlandı');
    };
    utterance.onerror = function () {
      status = 'idle';
      root.classList.remove('is-speaking');
      ui.play.textContent = '↻ Tekrar dene';
      setStatus('Ses başlatılamadı; metin anlatımı ekranda mevcut');
    };
    synth.speak(utterance);
  }

  ui.prev.addEventListener('click', function () {
    stopNarration();
    index = Math.max(0, index - 1);
    renderStep();
  });
  ui.next.addEventListener('click', function () {
    stopNarration();
    index = Math.min(steps.length - 1, index + 1);
    renderStep();
  });
  ui.play.addEventListener('click', function () {
    if (!synth) {
      setStatus('Tarayıcınız Türkçe metin okuma özelliğini desteklemiyor.');
      return;
    }
    if (status === 'speaking') {
      synth.pause();
      status = 'paused';
      root.classList.remove('is-speaking');
      ui.play.textContent = '▶ Devam et';
      setStatus('Anlatım duraklatıldı');
      return;
    }
    if (status === 'paused') {
      synth.resume();
      status = 'speaking';
      root.classList.add('is-speaking');
      ui.play.textContent = 'Ⅱ Duraklat';
      setStatus('Anlatım devam ediyor');
      return;
    }
    speakCurrent();
  });
  ui.stop.addEventListener('click', function () {
    stopNarration('Anlatım durduruldu');
  });

  renderStep();
  if (!synth) setStatus('Bu tarayıcıda sesli okuma desteklenmiyor; metni okuyabilirsiniz.');
  else setStatus('Türkçe sesli anlatım başlatılmaya hazır');
  if (synth && typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', function () { chooseTurkishVoice(); });
  }
})();

/* AETHRION Video Editor — local preview, trim range, browser export and IndexedDB drafts. */
(function (w, d) {
  'use strict';
  if (w.__aethrionVideoEditorReady) return;
  w.__aethrionVideoEditorReady = true;
  var state = { file: null, url: '', video: null, exporting: false, recorder: null, chunks: [], start: 0, end: 0 };
  var DB_NAME = 'AETHRIONVideoEditor';
  var STORE = 'drafts';
  function byId(id) { return d.getElementById(id); }
  function notify(message, type) {
    if (typeof w.showNotification === 'function') w.showNotification(message, type || 'info');
    else console.info('[AETHRION video]', message);
  }
  function dbOpen() {
    return new Promise(function (resolve, reject) {
      if (!w.indexedDB) return reject(new Error('Bu tarayıcı yerel taslak depolamasını desteklemiyor.'));
      var request = w.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('Taslak deposu açılamadı.')); };
    });
  }
  function dbRequest(mode, operation) {
    return dbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode), store = tx.objectStore(STORE), request = operation(store);
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(request.error || new Error('Taslak işlemi başarısız.')); };
        tx.oncomplete = function () { db.close(); };
        tx.onerror = function () { db.close(); };
      });
    });
  }
  function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function setTimeLabel() {
    var n = byId('videoEditorTime'), v = state.video;
    if (n && v) n.textContent = formatTime(v.currentTime) + ' / ' + formatTime(v.duration);
  }
  function updateSelection() {
    var v = state.video;
    if (!v || !isFinite(v.duration) || v.duration <= 0) return false;
    var startInput = byId('videoEditorStartSec'), endInput = byId('videoEditorEndSec');
    var start = startInput ? Number(startInput.value) : state.start;
    var end = endInput ? Number(endInput.value) : (state.end || v.duration);
    start = Math.max(0, Math.min(v.duration, isFinite(start) ? start : 0));
    end = Math.max(0, Math.min(v.duration, isFinite(end) ? end : v.duration));
    if (end <= start) end = Math.min(v.duration, start + 0.25);
    if (end <= start) start = Math.max(0, end - 0.25);
    state.start = start;
    state.end = end;
    if (startInput) startInput.value = String(Number(start.toFixed(2)));
    if (endInput) endInput.value = String(Number(end.toFixed(2)));
    var selection = byId('videoEditorSelection');
    if (selection) {
      selection.style.left = (start / v.duration * 100) + '%';
      selection.style.width = ((end - start) / v.duration * 100) + '%';
    }
    var playhead = byId('videoEditorPlayhead');
    if (playhead) playhead.style.left = (v.currentTime / v.duration * 100) + '%';
    setTimeLabel();
    return true;
  }
  function attachVideo(file, start, end) {
    var preview = byId('videoEditorPreview');
    if (!preview) return false;
    if (state.url) URL.revokeObjectURL(state.url);
    state.file = file;
    state.url = URL.createObjectURL(file);
    preview.replaceChildren();
    var video = d.createElement('video');
    video.id = 'videoEditorVideo';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = state.url;
    video.style.cssText = 'display:block;width:100%;height:100%;max-height:52vh;object-fit:contain;background:#05070d;border-radius:12px';
    preview.appendChild(video);
    state.video = video;
    video.addEventListener('loadedmetadata', function () {
      var startInput = byId('videoEditorStartSec'), endInput = byId('videoEditorEndSec');
      if (startInput) startInput.value = String(start == null ? 0 : start);
      if (endInput) endInput.value = String(end == null ? video.duration : end);
      updateSelection();
      notify('Video yüklendi. Başlangıç ve bitiş saniyelerini seçerek kesit aralığını belirleyin.', 'success');
    }, { once: true });
    video.addEventListener('timeupdate', function () {
      setTimeLabel();
      var playhead = byId('videoEditorPlayhead');
      if (playhead && isFinite(video.duration) && video.duration > 0) playhead.style.left = (video.currentTime / video.duration * 100) + '%';
      if (state.exporting && video.currentTime >= state.end) stopExport();
    });
    video.addEventListener('ended', function () { if (state.exporting) stopExport(); });
    return true;
  }
  function waitForSeek(video) {
    return new Promise(function (resolve, reject) {
      if (Math.abs(video.currentTime - state.start) < 0.05) return resolve();
      var done = false;
      var timer = w.setTimeout(function () {
        if (!done) { done = true; reject(new Error('Video kesit başlangıcına gidilemedi.')); }
      }, 5000);
      video.addEventListener('seeked', function () {
        if (done) return;
        done = true;
        w.clearTimeout(timer);
        resolve();
      }, { once: true });
      video.currentTime = state.start;
    });
  }
  function stopExport() {
    if (!state.exporting) return;
    state.exporting = false;
    if (state.video) state.video.pause();
    if (state.recorder && state.recorder.state !== 'inactive') {
      try { state.recorder.stop(); } catch (e) {}
    }
  }
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob), a = d.createElement('a');
    a.href = url; a.download = filename;
    d.body.appendChild(a); a.click(); a.remove();
    w.setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  w.handleVideoUpload = function (input) {
    var file = input && input.files && input.files[0];
    if (!file) return false;
    if (!/^video\//i.test(file.type || '')) { notify('Lütfen geçerli bir video dosyası seçin.', 'warning'); input.value = ''; return false; }
    if (file.size > 200 * 1024 * 1024) { notify('Video dosyası en fazla 200 MB olabilir.', 'warning'); input.value = ''; return false; }
    return attachVideo(file, 0, null);
  };
  w.updateVideoSelection = updateSelection;
  w.videoEditorPlay = function () {
    var v = state.video;
    if (!v) { notify('Önce bir video yükleyin.', 'warning'); return false; }
    updateSelection();
    if (v.currentTime < state.start || v.currentTime >= state.end) v.currentTime = state.start;
    return v.play().catch(function () { notify('Video oynatılamadı. Tarayıcı medya iznini kontrol edin.', 'error'); return false; });
  };
  w.videoEditorPause = function () { if (state.video) state.video.pause(); };
  w.videoEditorReset = function () {
    if (!state.video) return;
    state.video.pause();
    state.video.currentTime = state.start || 0;
    setTimeLabel();
  };
  w.videoEditorTrim = function () {
    if (!state.video) { notify('Önce bir video yükleyin.', 'warning'); return false; }
    if (!updateSelection()) return false;
    state.video.pause();
    state.video.currentTime = state.start;
    notify('Kesit aralığı ' + formatTime(state.start) + ' – ' + formatTime(state.end) + ' olarak ayarlandı. Dışa aktarmak için Export düğmesine basın.', 'success');
    return true;
  };
  w.exportVideo = async function () {
    var v = state.video;
    if (!v || !state.file) { notify('Dışa aktarmadan önce bir video yükleyin.', 'warning'); return false; }
    updateSelection();
    if (!isFinite(state.end) || state.end <= state.start) { notify('Geçerli bir kesit aralığı seçin.', 'warning'); return false; }
    var capture = v.captureStream || v.mozCaptureStream;
    if (!capture || !w.MediaRecorder) {
      downloadBlob(state.file, 'aethrion-video-original-' + Date.now() + '.' + ((state.file.name.split('.').pop() || 'mp4').replace(/[^a-z0-9]/gi, '')));
      notify('Bu tarayıcı kesit dışa aktarımını desteklemiyor; orijinal video indirildi.', 'warning');
      return false;
    }
    try {
      await waitForSeek(v);
      var stream = capture.call(v);
      var mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].filter(function (x) { return !w.MediaRecorder.isTypeSupported || w.MediaRecorder.isTypeSupported(x); })[0] || '';
      state.chunks = [];
      state.recorder = new w.MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      state.recorder.ondataavailable = function (event) { if (event.data && event.data.size) state.chunks.push(event.data); };
      state.recorder.onerror = function () { state.exporting = false; notify('Video dışa aktarımı sırasında hata oluştu.', 'error'); };
      state.recorder.onstop = function () {
        var blob = new Blob(state.chunks, { type: state.recorder.mimeType || 'video/webm' });
        stream.getTracks().forEach(function (track) { try { track.stop(); } catch (e) {} });
        if (blob.size) {
          var ext = (state.recorder.mimeType || '').indexOf('mp4') >= 0 ? 'mp4' : 'webm';
          downloadBlob(blob, 'aethrion-kesit-' + Date.now() + '.' + ext);
          notify('Seçilen video kesiti dışa aktarıldı.', 'success');
        } else notify('Dışa aktarılan video boş. Tekrar deneyin.', 'error');
      };
      state.exporting = true;
      state.recorder.start(250);
      await v.play();
      var stopTimer = function () { if (state.exporting && v.currentTime >= state.end) stopExport(); };
      v.addEventListener('timeupdate', stopTimer);
      state.recorder.addEventListener('stop', function () { v.removeEventListener('timeupdate', stopTimer); }, { once: true });
      notify('Video kesiti dışa aktarılıyor…', 'info');
      return true;
    } catch (error) {
      state.exporting = false;
      notify(error.message || 'Video dışa aktarılamadı.', 'error');
      return false;
    }
  };
  w.saveVideoDraft = async function () {
    if (!state.file || !state.video) { notify('Taslak kaydetmek için önce video yükleyin.', 'warning'); return false; }
    updateSelection();
    try {
      await dbRequest('readwrite', function (store) {
        return store.put({ id: 'latest', file: state.file, name: state.file.name, type: state.file.type, start: state.start, end: state.end, savedAt: Date.now() });
      });
      notify('Video ve kesit ayarları bu tarayıcıda yerel olarak taslak kaydedildi.', 'success');
      ensureRestoreButton(true);
      return true;
    } catch (error) {
      notify(error.message || 'Taslak kaydedilemedi.', 'error');
      return false;
    }
  };
  function ensureRestoreButton(show) {
    var actions = d.querySelector('#videoEditorOverlay .video-editor-actions');
    var existing = byId('videoEditorRestoreDraftBtn');
    if (existing) { if (show) existing.style.display = 'inline-flex'; return; }
    if (!actions) return;
    var button = d.createElement('button');
    button.id = 'videoEditorRestoreDraftBtn';
    button.type = 'button';
    button.className = 'btn-secondary btn-sm';
    button.textContent = '📂 Taslağı Yükle';
    button.style.display = show ? 'inline-flex' : 'none';
    button.addEventListener('click', async function () {
      try {
        var draft = await dbRequest('readonly', function (store) { return store.get('latest'); });
        if (!draft || !draft.file) { notify('Kaydedilmiş video taslağı bulunamadı.', 'warning'); return; }
        attachVideo(draft.file, draft.start, draft.end);
        notify('Yerel video taslağı geri yüklendi.', 'success');
      } catch (error) { notify(error.message || 'Taslak yüklenemedi.', 'error'); }
    });
    var save = actions.querySelector('button[onclick*="saveVideoDraft"]');
    actions.insertBefore(button, save || actions.firstChild);
  }
  var originalOpen = w.openVideoEditor;
  w.openVideoEditor = function () {
    var result = typeof originalOpen === 'function' ? originalOpen.apply(this, arguments) : false;
    ensureRestoreButton(false);
    dbRequest('readonly', function (store) { return store.get('latest'); }).then(function (draft) {
      var button = byId('videoEditorRestoreDraftBtn');
      if (button) button.style.display = draft && draft.file ? 'inline-flex' : 'none';
    }).catch(function () {});
    return result;
  };
  w.openVideoStudio = function () {
    if (typeof w.openFullAIPanel === 'function') w.openFullAIPanel();
    var input = byId('vzInput');
    if (input) {
      input.value = 'AETHRION Video Stüdyosu: Bana video hedefimi ve platformumu sor. Ardından özgün senaryo, sahne planı, çekim listesi, altyazı ve kurgu akışı hazırla.';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    }
    return true;
  };
  w.closeVideoEditor = w.closeVideoEditor || function () {
    var p = byId('videoEditorOverlay');
    if (p) p.style.setProperty('display', 'none', 'important');
    d.body.style.overflow = '';
  };
})(window, document);

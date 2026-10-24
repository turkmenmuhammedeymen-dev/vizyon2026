/* AETHRION universal AI file preparation: image/PDF/media + UTF-8 text + DOCX/XLSX extraction. */
(function () {
  'use strict';
  var MAX_BYTES = 8 * 1024 * 1024;
  var scriptLoads = Object.create(null);

  function loadScript(url, ready) {
    if (ready()) return Promise.resolve();
    if (scriptLoads[url]) return scriptLoads[url];
    scriptLoads[url] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = function () { ready() ? resolve() : reject(new Error('Dosya çözümleme kütüphanesi yüklenemedi.')); };
      script.onerror = function () { delete scriptLoads[url]; reject(new Error('Dosya çözümleme kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.')); };
      document.head.appendChild(script);
    });
    return scriptLoads[url];
  }

  function base64FromBytes(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, bytes.length)));
    }
    return btoa(binary);
  }

  async function fileToBase64(file) {
    var dataUrl = await new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Dosya okunamadı.')); };
      reader.readAsDataURL(file);
    });
    var comma = dataUrl.indexOf(',');
    if (comma < 0) throw new Error('Dosya içeriği okunamadı.');
    return dataUrl.slice(comma + 1);
  }

  async function officeText(file, extension) {
    if (extension === 'docx') {
      await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js', function () { return !!window.mammoth; });
      var doc = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return String(doc && doc.value || '');
    }
    if (extension === 'xlsx' || extension === 'xls') {
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', function () { return !!window.XLSX; });
      var workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      return workbook.SheetNames.map(function (name) {
        return 'Sayfa: ' + name + '\n' + window.XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
      }).join('\n\n').slice(0, 15000);
    }
    throw new Error('Bu dosya türü doğrudan okunamıyor. DOCX, XLSX/XLS, PDF, görsel, metin veya kod dosyası kullanın.');
  }

  async function prepareFile(file) {
    if (!file) throw new Error('Önce bir dosya seçin.');
    if (file.size > MAX_BYTES) throw new Error('Dosya en fazla 8 MB olabilir.');
    var name = String(file.name || 'dosya').slice(0, 180);
    var extMatch = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
    var ext = extMatch ? extMatch[1] : '';
    var type = String(file.type || '').toLowerCase();
    if (!type) { if (ext === 'pdf') type = 'application/pdf'; else if (/^(mp3|wav|ogg|m4a|aac)$/.test(ext)) type = 'audio/' + ext; else if (/^(mp4|mov|avi|mkv|webm)$/.test(ext)) type = 'video/' + ext; }
    if (type.indexOf('image/') === 0 || type === 'application/pdf' || type.indexOf('audio/') === 0 || type.indexOf('video/') === 0 || ext === 'pdf') {
      return { fileBase64: await fileToBase64(file), fileName: name, fileType: type || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream') };
    }

    var text = '';
    if (ext === 'docx' || ext === 'xlsx' || ext === 'xls') {
      text = await officeText(file, ext);
    } else if (/^(txt|md|csv|json|js|ts|jsx|tsx|py|html|css|xml|ya?ml|log|sql|sh|c|cpp|h|java|php|rb|go|rs|ipynb)$/i.test(ext) || type.indexOf('text/') === 0 || /^(application\/(json|xml|javascript|x-javascript))$/.test(type)) {
      text = await file.text();
    } else {
      throw new Error('Bu dosya türü henüz desteklenmiyor. Görsel, PDF, ses/video, DOCX, XLSX/XLS, TXT, MD, CSV, JSON veya kod dosyası kullanın.');
    }
    text = String(text || '').replace(/\u0000/g, '').slice(0, 15000);
    if (!text.trim()) throw new Error('Dosyadan okunabilir metin çıkarılamadı.');
    var bytes = new TextEncoder().encode('Dosya: ' + name + '\n\n' + text);
    return { fileBase64: base64FromBytes(bytes), fileName: name, fileType: 'text/plain' };
  }

  window.aethrionPrepareFileForAI = prepareFile;
})();
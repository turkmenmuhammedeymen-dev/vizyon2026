/* AETHRION Job Market UI — backed by the existing Back4App Cloud Code functions. */
(function (w, d) {
  'use strict';
  if (w.__aeJobMarketReady) return;
  w.__aeJobMarketReady = true;

  var state = { items: [], selected: null, editingId: '', imageUrl: '', priorOverflow: '' };
  function byId(id) { return d.getElementById(id); }
  function notify(message, type) {
    if (typeof w.showNotification === 'function') w.showNotification(message, type || 'info');
    else console.info('[AETHRION jobs]', message);
  }
  function cloud(name, params) {
    if (!w.Parse || !w.Parse.Cloud || typeof w.Parse.Cloud.run !== 'function') {
      return Promise.reject(new Error('Back4App bağlantısı hazır değil. Sayfayı yenileyip tekrar deneyin.'));
    }
    return w.Parse.Cloud.run(name, params || {});
  }
  function currentEmail() {
    try {
      var u = w.Parse && w.Parse.User && w.Parse.User.current();
      return u && (u.get('email') || u.get('username')) || '';
    } catch (e) { return ''; }
  }
  function anyJobOverlayOpen() { return ['jobMarketOverlay', 'jobDetailOverlay', 'jobCreateOverlay'].some(function (id) { var n = byId(id); if (!n) return false; var cs = w.getComputedStyle ? w.getComputedStyle(n) : null; return cs ? cs.display !== 'none' && cs.visibility !== 'hidden' : n.style.display !== 'none' && n.style.visibility !== 'hidden'; }); }
  function setOverlay(id, visible, zIndex) {
    var node = byId(id);
    if (!node) return null;
    if (visible) {
      if (!anyJobOverlayOpen()) state.priorOverflow = d.body.style.overflow || '';
      node.classList.add('open', 'active');
      node.style.setProperty('display', 'flex', 'important');
      node.style.setProperty('visibility', 'visible', 'important');
      node.style.setProperty('pointer-events', 'auto', 'important');
      node.style.setProperty('position', 'fixed', 'important');
      node.style.setProperty('inset', '0', 'important');
      node.style.setProperty('z-index', String(zIndex || 2147482000), 'important');
      node.style.setProperty('overflow', 'auto', 'important');
      d.body.style.overflow = 'hidden';
    } else {
      node.classList.remove('open', 'active');
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
      if (!anyJobOverlayOpen()) d.body.style.overflow = state.priorOverflow;
    }
    return node;
  }
  function textNode(tag, className, value) {
    var n = d.createElement(tag);
    if (className) n.className = className;
    n.textContent = value == null ? '' : String(value);
    return n;
  }
  function renderListings(items) {
    var grid = byId('jobMarketGrid');
    if (!grid) return;
    grid.replaceChildren();
    if (!items.length) {
      var empty = textNode('div', 'job-market-empty', '');
      empty.appendChild(textNode('span', 'empty-icon', '📭'));
      empty.appendChild(textNode('div', '', 'Bu filtrelerle eşleşen ilan bulunamadı.'));
      grid.appendChild(empty);
      return;
    }
    items.forEach(function (job) {
      var statusClass = job.status === 'accepted' ? ' status-accepted' : (job.status === 'closed' ? ' status-closed' : '');
      var card = textNode('article', 'job-card' + statusClass, '');
      var header = textNode('div', 'job-card-header', '');
      var number = textNode('span', 'job-card-number', job.job_number || 'ILN');
      var rawType = String(job.job_type || 'Diğer').toLocaleLowerCase('tr-TR');
      var typeKey = rawType === 'tasarım' ? 'tasarim' : rawType === 'çeviri' ? 'ceviri' : rawType === 'müzik' ? 'muzik' : rawType === '3d' ? '3d' : ['kod','video','yazar'].indexOf(rawType) >= 0 ? rawType : 'diger';
      var type = textNode('span', 'job-card-type type-' + typeKey, job.job_type || 'Diğer');
      header.append(number, type);
      var title = textNode('h3', 'job-card-title', job.title || job.job_type || 'İş ilanı');
      var desc = textNode('p', 'job-card-desc', job.description || '');
      card.append(header, title, desc);
      if (job.image_url) {
        var image = d.createElement('img');
        image.className = 'job-card-image';
        image.src = job.image_url;
        image.alt = String(job.title || 'İş ilanı görseli');
        image.loading = 'lazy';
        card.appendChild(image);
      }
      var meta = textNode('div', 'job-card-meta', '');
      var owner = textNode('div', 'job-card-owner', '');
      var avatar = textNode('span', 'owner-avatar', String(job.owner_name || '?').slice(0, 1).toUpperCase());
      var ownerName = textNode('span', '', job.owner_name || 'AETHRION üyesi');
      owner.append(avatar, ownerName);
      meta.appendChild(owner);
      var footer = textNode('div', 'job-card-footer', '');
      var salary = textNode('strong', 'job-card-salary', '');
      salary.append(textNode('span', 'salary-icon', '🪙'), d.createTextNode((job.salary || 'Belirtilmedi') + ' A27 Puan'));
      var views = textNode('span', 'job-card-views', '👁 ' + String(job.views || 0));
      var open = textNode('button', 'btn-secondary btn-sm', 'İlanı İncele →');
      open.type = 'button';
      open.addEventListener('click', function () { w.openJobDetail(job.id); });
      footer.append(salary, views, open);
      card.append(meta, footer);
      grid.appendChild(card);
    });
  }
  function applyFilters() {
    var search = (byId('jobMarketSearchInput') && byId('jobMarketSearchInput').value || '').toLocaleLowerCase('tr-TR').trim();
    var type = byId('jobMarketTypeFilter') && byId('jobMarketTypeFilter').value || 'all';
    var status = byId('jobMarketStatusFilter') && byId('jobMarketStatusFilter').value || 'all';
    var filtered = state.items.filter(function (job) {
      var haystack = [job.title, job.description, job.job_number, job.owner_name, job.job_type].join(' ').toLocaleLowerCase('tr-TR');
      return (!search || haystack.indexOf(search) !== -1) &&
        (type === 'all' || String(job.job_type || '').toLocaleLowerCase('tr-TR').indexOf(type.toLocaleLowerCase('tr-TR')) !== -1) &&
        (status === 'all' || job.status === status);
    });
    renderListings(filtered);
  }
  function refreshLimit() {
    return cloud('getJobListingLimit', {}).then(function (result) {
      if (!result || !result.success) return result;
      var limit = result.limit === -1 ? 'Sınırsız' : String(result.limit);
      var remaining = result.remaining === -1 ? 'Sınırsız' : String(result.remaining);
      var label = '💼 ' + result.used + ' / ' + limit + ' ilan · Kalan: ' + remaining;
      ['jobMarketHeaderLimitBadge', 'jobMarketLimitBadge', 'jobMarketRemainingText'].forEach(function (id) {
        var n = byId(id);
        if (n) n.textContent = id === 'jobMarketRemainingText' ? remaining : label;
      });
      var create = byId('jobMarketCreateBtn');
      if (create) create.disabled = result.remaining === 0;
      return result;
    }).catch(function (error) {
      var badge = byId('jobMarketHeaderLimitBadge');
      if (badge) badge.textContent = 'Limit bilgisi alınamadı';
      console.warn('[AETHRION jobs] Limit yüklenemedi:', error);
      return null;
    });
  }
  function loadListings() {
    var grid = byId('jobMarketGrid');
    if (grid) {
      grid.replaceChildren();
      grid.appendChild(textNode('div', 'job-market-empty', 'İlanlar yükleniyor…'));
    }
    return cloud('getJobListings', { page: 0, pageSize: 50 }).then(function (result) {
      state.items = result && Array.isArray(result.listings) ? result.listings : [];
      applyFilters();
      return refreshLimit().then(function () { return state.items; });
    }).catch(function (error) {
      if (grid) {
        grid.replaceChildren();
        grid.appendChild(textNode('div', 'job-market-empty', error.message || 'İlanlar yüklenemedi. Tekrar deneyin.'));
      }
      notify(error.message || 'İş ilanları yüklenemedi.', 'error');
      throw error;
    });
  }
  function resetCreateForm() {
    state.editingId = '';
    state.imageUrl = '';
    ['jobCreateType', 'jobCreateTitle', 'jobCreateDescription', 'jobCreateSalary', 'jobCreatePaymentMethod'].forEach(function (id) {
      var n = byId(id);
      if (n) n.value = '';
    });
    var image = byId('jobCreateImageInput');
    if (image) image.value = '';
    var preview = byId('jobCreateImagePreview');
    if (preview) { preview.replaceChildren(); preview.textContent = '📷'; }
    var heading = d.querySelector('#jobCreateOverlay h3');
    if (heading) heading.textContent = '💼 Yeni İş İlanı Ver';
    var error = byId('jobCreateError');
    if (error) { error.textContent = ''; error.style.display = 'none'; }
  }
  function showCreateError(message) {
    var error = byId('jobCreateError');
    if (error) { error.textContent = message; error.style.display = 'block'; }
    else notify(message, 'error');
  }

  w.openJobMarket = function () {
    if (!setOverlay('jobMarketOverlay', true, 2147482000)) {
      w.location.href = './index.html#features';
      return false;
    }
    loadListings().catch(function () {});
    return true;
  };
  w.loadJobMarket = loadListings;
  w.filterJobMarket = applyFilters;
  w.refreshJobListingLimit = refreshLimit;
  w.closeJobMarket = function () {
    setOverlay('jobMarketOverlay', false);
    setOverlay('jobDetailOverlay', false);
    if (d.body.classList.contains('ae-shell-on') && d.body.classList.contains('aews-feature-view') && typeof w.showWelcome === 'function') w.showWelcome();
  };
  w.openJobCreateForm = function () {
    return refreshLimit().then(function (limit) {
      if (limit && limit.remaining === 0) {
        notify('İlan hakkınız doldu. Paket limitinizi kontrol edin.', 'warning');
        return false;
      }
      resetCreateForm();
      return !!setOverlay('jobCreateOverlay', true, 2147482001);
    });
  };
  w.closeJobCreateForm = function () {
    setOverlay('jobCreateOverlay', false);
    resetCreateForm();
  };
  w.handleJobCreateImage = function (input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showCreateError('Görsel en fazla 2 MB olabilir.');
      input.value = '';
      return;
    }
    if (!w.Parse || !w.Parse.File) {
      showCreateError('Görsel yükleme servisi hazır değil. Görselsiz devam edebilirsiniz.');
      return;
    }
    var parseFile = new w.Parse.File(file.name, file, file.type);
    parseFile.save().then(function (saved) {
      state.imageUrl = saved.url();
      var preview = byId('jobCreateImagePreview');
      if (preview) {
        preview.replaceChildren();
        var img = d.createElement('img');
        img.src = state.imageUrl;
        img.alt = 'İlan görseli önizlemesi';
        img.style.cssText = 'max-width:100%;max-height:110px;object-fit:contain';
        preview.appendChild(img);
      }
    }).catch(function (error) {
      showCreateError(error.message || 'Görsel yüklenemedi.');
    });
  };
  w.submitJobCreate = function () {
    var params = {
      jobType: byId('jobCreateType') && byId('jobCreateType').value || '',
      title: byId('jobCreateTitle') && byId('jobCreateTitle').value.trim() || '',
      description: byId('jobCreateDescription') && byId('jobCreateDescription').value.trim() || '',
      salary: byId('jobCreateSalary') && byId('jobCreateSalary').value || '',
      paymentMethod: byId('jobCreatePaymentMethod') && byId('jobCreatePaymentMethod').value.trim() || '',
      imageUrl: state.imageUrl || ''
    };
    if (!params.jobType || !params.title || params.description.length < 10 || !params.salary || !params.paymentMethod) {
      showCreateError('Lütfen ilan türü, başlık, en az 10 karakter açıklama, ücret ve ödeme şeklini doldurun.');
      return Promise.resolve(false);
    }
    var button = byId('jobCreateSubmitBtn');
    if (button) { button.disabled = true; button.textContent = state.editingId ? 'Kaydediliyor…' : 'Yayınlanıyor…'; }
    var request = state.editingId
      ? cloud('editJobListing', Object.assign({ jobId: state.editingId }, params))
      : cloud('createJobListing', params);
    return request.then(function (result) {
      notify(result && result.message || (state.editingId ? 'İlan güncellendi.' : 'İlan yayınlandı.'), 'success');
      w.closeJobCreateForm();
      return loadListings().catch(function () { return false; });
    }).catch(function (error) {
      showCreateError(error.message || 'İlan kaydedilemedi.');
      return false;
    }).finally(function () {
      if (button) { button.disabled = false; button.textContent = '✅ İlanı Yayınla'; }
    });
  };
  w.openJobDetail = function (jobId) {
    return cloud('getJobDetail', { jobId: jobId }).then(function (result) {
      var job = result && result.listing;
      if (!job) throw new Error('İlan bulunamadı.');
      state.selected = job;
      var fields = {
        jobDetailNumberBadge: job.job_number, jobDetailNumberBadge2: job.job_number,
        jobDetailTitle: job.title, jobDetailType: job.job_type, jobDetailSalary: job.salary,
        jobDetailPaymentMethod: job.payment_method, jobDetailCreatedAt: job.createdAt ? new Date(job.createdAt).toLocaleString('tr-TR') : '—',
        jobDetailViews: job.views, jobDetailStatus: job.status === 'accepted' ? 'Kabul edildi' : job.status,
        jobDetailDescription: job.description, jobDetailOwnerName: job.owner_name,
        jobDetailOwnerEmail: job.owner_email || 'İlan sahibiyle iletişim, kabul sonrası bildirim üzerinden sağlanır.'
      };
      Object.keys(fields).forEach(function (id) { var n = byId(id); if (n) n.textContent = fields[id] == null ? '—' : String(fields[id]); });
      var avatar = byId('jobDetailOwnerAvatar');
      if (avatar) avatar.textContent = String(job.owner_name || '?').slice(0, 1).toUpperCase();
      var image = byId('jobDetailImage');
      if (image) {
        if (job.image_url) { image.src = job.image_url; image.style.display = 'block'; }
        else { image.removeAttribute('src'); image.style.display = 'none'; }
      }
      var own = !!(job.owner_email && job.owner_email === currentEmail());
      var accept = byId('jobDetailAcceptBtn'), edit = byId('jobDetailEditBtn'), remove = byId('jobDetailDeleteBtn');
      if (accept) accept.style.display = !own && job.status === 'open' ? 'inline-flex' : 'none';
      if (edit) edit.style.display = own && job.status !== 'accepted' ? 'inline-flex' : 'none';
      if (remove) remove.style.display = own ? 'inline-flex' : 'none';
      setOverlay('jobDetailOverlay', true, 2147482002);
      return job;
    }).catch(function (error) { notify(error.message || 'İlan ayrıntısı açılamadı.', 'error'); return null; });
  };
  w.closeJobDetail = function () { setOverlay('jobDetailOverlay', false); };
  w.openJobEdit = function () {
    var job = state.selected;
    if (!job || !job.owner_email || job.owner_email !== currentEmail()) {
      notify('Yalnızca kendi ilanınızı düzenleyebilirsiniz.', 'warning');
      return false;
    }
    state.editingId = job.id;
    state.imageUrl = job.image_url || '';
    var values = { jobCreateType: job.job_type, jobCreateTitle: job.title, jobCreateDescription: job.description, jobCreateSalary: job.salary, jobCreatePaymentMethod: job.payment_method };
    Object.keys(values).forEach(function (id) { var n = byId(id); if (n) n.value = values[id] == null ? '' : String(values[id]); });
    var heading = d.querySelector('#jobCreateOverlay h3');
    if (heading) heading.textContent = '✏️ İlanı Düzenle';
    setOverlay('jobDetailOverlay', false);
    setOverlay('jobCreateOverlay', true, 2147482001);
    return true;
  };
  w.deleteJobListing = function () {
    if (!state.selected || !state.selected.id) return Promise.resolve(false);
    if (!w.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return Promise.resolve(false);
    return cloud('deleteJobListing', { jobId: state.selected.id }).then(function (result) {
      notify(result && result.message || 'İlan silindi.', 'success');
      w.closeJobDetail();
      return loadListings();
    }).catch(function (error) { notify(error.message || 'İlan silinemedi.', 'error'); return false; });
  };
  w.acceptJobListing = function () {
    if (!state.selected || !state.selected.id) return Promise.resolve(false);
    return cloud('acceptJobListing', { jobId: state.selected.id }).then(function (result) {
      notify(result && result.message || 'İlan kabul edildi.', 'success');
      w.closeJobDetail();
      return loadListings();
    }).catch(function (error) { notify(error.message || 'İlan kabul edilemedi.', 'error'); return false; });
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { refreshLimit(); }, { once: true });
  else refreshLimit();
})(window, document);

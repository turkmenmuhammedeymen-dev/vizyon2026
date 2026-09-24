// ================================================================
// VİZYON 2027 – FULL CLOUD CODE (SashiDo Eski Node.js Uyumlu)
// v7.9.0 – YERLİ LLM ENTEGRASYONU (Kaggle Ollama - 13 Model Sıralı)
//       – YENİ: V27 API ANAHTAR SİSTEMİ (createV27ApiKey, getMyV27ApiKeys,
//               revokeV27ApiKey, validateV27ApiKey, v27ApiChat)
//       – YENİ: V27ApiKey sınıfı + initSchemas'a eklendi
//       – YENİ: V27 KOÇ ASİSTANI (kocChat, getKocHistory, getKocUsage,
//               resetKocUsage, shareKocConversation, getSharedKocConversation,
//               getKocLimitForUser)
//       – YENİ: getInboxItems (gelen kutusu cloud function)
//       – YENİ: [v7.9.2] MODERATÖR / TASARIMCI RÜTBESİ (moderator)
//               → assignModeratorByEmail, getModerators, removeModerator
//               → Moderator sınırsız yetkili (beta gibi)
//               → Proje talepleri önce moderatöre, yoksa admin+founder'a
//               → Moderatör video kesit: createVideoClip, getVideoClips
//       – YENİ: [v7.9.2] VİZYON AL PANELİ (vizyonAlChat, vizyonAlDeepThink,
//               vizyonAlAgent, vizyonAlDeveloper, getSiteInfoForVizyonAl)
//       – FIX:  superAI → TÜM Ollama modelleri (13) + TÜM API modelleri (8) sırayla
//       – FIX:  callLocalLlama artık model parametresi alıyor
//       – FIX:  saveProjectWithSceneData (3D sahne kaydetme) master key server-side
//       – FIX:  completeFacebookProfile (profil tamamlama)
//       – FIX:  loginWithRecoveryEmail (kurtarma maili girişi)
//       – FIX:  facebookLogin profile_completed=false set ediyor
//       – FIX:  @vizyondestek sınırlı ve net cevap veriyor
//       – FIX:  AES-256-GCM encryption (eski XOR yerine, geriye uyumlu)
//       – FIX:  webSearch Google Custom Search fallback
//       – FIX:  finalizeContest ödülü UYGULUYOR
//       – FIX:  facebookLogin rate limit
//       – FIX:  getV27ApiKeyLimit → ücretsiz üye için return 2
//       – FIX:  v27ApiChat → apiKey değişken sırası düzeltildi
//       – YENİ: sendTeamMessage → vizyondetsek, vizyonal (@siz), V27 key tetikleyici
//       – FIX:  [v7.9.2] kocChat → mesajlar Message sınıfına KAYDEDİLİYOR
//       – FIX:  [v7.9.2] getKocHistory → last_message_at ile doğru sıralama
//       – FIX:  [v7.9.2] isLikelyTurkish → eksik return eklendi
// ================================================================

// ================================================================
// [MADDE 0] CRITICAL POLYFILLS (SashiDo Node.js Environment)
// ================================================================
if (typeof globalThis.btoa === 'undefined') {
    globalThis.btoa = function (str) {
        return Buffer.from(str, 'binary').toString('base64');
    };
    console.log('✅ btoa polyfill yüklendi');
}

if (typeof globalThis.atob === 'undefined') {
    globalThis.atob = function (b64) {
        return Buffer.from(b64, 'base64').toString('binary');
    };
    console.log('✅ atob polyfill yüklendi');
}

if (typeof globalThis.TextEncoder === 'undefined') {
    try {
        var util = require('util');
        globalThis.TextEncoder = util.TextEncoder;
        globalThis.TextDecoder = util.TextDecoder;
        console.log('✅ TextEncoder/TextDecoder polyfill yüklendi');
    } catch (e) {
        console.warn('⚠️ TextEncoder polyfill yüklenemedi:', e.message);
    }
}

// ================================================================
// [MADDE 1] FETCH POLYFILL
// ================================================================
if (typeof globalThis.fetch === 'undefined') {
    globalThis.fetch = async function (url, options) {
        options = options || {};
        var method = (options.method || 'GET').toUpperCase();
        var headers = options.headers || {};
        var body = options.body;
        var signal = options.signal;

        if (signal && signal.aborted) {
            var errAbort = new Error('Aborted');
            errAbort.name = 'AbortError';
            throw errAbort;
        }

        var httpOptions = {
            method: method,
            url: url,
            headers: headers
        };

        if (body !== undefined && body !== null) {
            if (typeof body === 'string') {
                try {
                    httpOptions.body = JSON.parse(body);
                } catch (e) {
                    httpOptions.body = body;
                }
            } else {
                httpOptions.body = body;
            }
        }

        var response;
        var aborted = false;

        var requestPromise = (async function () {
            try {
                return await Parse.Cloud.httpRequest(httpOptions);
            } catch (err) {
                if (err && err.text !== undefined) {
                    return err;
                } else if (err && err.response) {
                    return err.response;
                } else {
                    throw err;
                }
            }
        })();

        if (signal) {
            var abortPromise = new Promise(function (resolve, reject) {
                var onAbort = function () {
                    aborted = true;
                    var errAbort2 = new Error('Aborted');
                    errAbort2.name = 'AbortError';
                    reject(errAbort2);
                };
                if (signal.aborted) {
                    onAbort();
                } else if (typeof signal.addEventListener === 'function') {
                    signal.addEventListener('abort', onAbort);
                } else if (typeof signal.addListener === 'function') {
                    signal.addListener('abort', onAbort);
                }
            });

            try {
                response = await Promise.race([requestPromise, abortPromise]);
            } catch (err) {
                throw err;
            }
        } else {
            response = await requestPromise;
        }

        if (aborted) {
            var errAborted = new Error('Aborted');
            errAborted.name = 'AbortError';
            throw errAborted;
        }

        var status = response.status || 200;
        var responseHeaders = response.headers || {};
        var rawText = '';
        if (typeof response.text === 'string') {
            rawText = response.text;
        } else if (response.buffer) {
            rawText = (typeof response.buffer.toString === 'function')
                ? response.buffer.toString()
                : String(response.buffer);
        }

        return {
            ok: status >= 200 && status < 300,
            status: status,
            statusText: String(status),
            headers: {
                get: function (name) {
                    var lower = name.toLowerCase();
                    for (var k in responseHeaders) {
                        if (k.toLowerCase() === lower) return responseHeaders[k];
                    }
                    return null;
                },
                has: function (name) {
                    var lower = name.toLowerCase();
                    for (var k in responseHeaders) {
                        if (k.toLowerCase() === lower) return true;
                    }
                    return false;
                },
                forEach: function (callback) {
                    Object.keys(responseHeaders).forEach(function (key) {
                        callback(responseHeaders[key], key);
                    });
                }
            },
            json: async function () {
                return JSON.parse(rawText);
            },
            text: async function () {
                return rawText;
            },
            arrayBuffer: async function () {
                if (response.buffer) {
                    if (response.buffer instanceof ArrayBuffer) return response.buffer;
                    if (response.buffer.buffer && response.buffer.byteLength !== undefined) {
                        return response.buffer.buffer.slice(
                            response.buffer.byteOffset,
                            response.buffer.byteOffset + response.buffer.byteLength
                        );
                    }
                }
                var encoder = new TextEncoder();
                return encoder.encode(rawText).buffer;
            }
        };
    };
    console.log('✅ Fetch polyfill yüklendi (Parse.Cloud.httpRequest + AbortController)');
} else {
    console.log('✅ Native fetch mevcut, polyfill atlandı.');
}

// ================================================================
// [MADDE 2] RATE LIMITING ALTYAPISI
// ================================================================
var _rateLimitStore = new Map();
var _RATE_LIMIT_CLASS = "RateLimitAttempt";

function RateLimit(key, maxAttempts, windowMs) {
    this.key = key;
    this.maxAttempts = maxAttempts || 5;
    this.windowMs = windowMs || 5 * 60 * 1000;
}

RateLimit.prototype.getRecord = function () {
    var now = Date.now();
    var record = _rateLimitStore.get(this.key);
    if (!record || (now - record.firstAttempt) > this.windowMs) {
        _rateLimitStore.delete(this.key);
        return { count: 0, firstAttempt: now };
    }
    return record;
};

RateLimit.prototype.isBlocked = function () {
    var record = this.getRecord();
    return record.count >= this.maxAttempts;
};

RateLimit.prototype.record = function () {
    var now = Date.now();
    var record = this.getRecord();
    if (record.count === 0) {
        _rateLimitStore.set(this.key, { count: 1, firstAttempt: now });
    } else {
        record.count++;
        _rateLimitStore.set(this.key, record);
    }
};

RateLimit.prototype.getRemainingMs = function () {
    var record = this.getRecord();
    if (record.count === 0) return 0;
    return Math.max(0, this.windowMs - (Date.now() - record.firstAttempt));
};

async function checkRateLimitPersistent(key, maxAttempts, windowMs) {
    maxAttempts = maxAttempts || 5;
    windowMs = windowMs || 5 * 60 * 1000;
    var limiter = new RateLimit(key, maxAttempts, windowMs);
    if (limiter.isBlocked()) {
        var remainingMs = limiter.getRemainingMs();
        var remainingMin = Math.max(1, Math.ceil(remainingMs / 60000));
        throw new Error('Çok fazla deneme yaptınız. Lütfen ' + remainingMin + ' dakika sonra tekrar deneyin.');
    }

    try {
        var RateLimitAttempt = Parse.Object.extend(_RATE_LIMIT_CLASS);
        var since = new Date(Date.now() - windowMs);
        var query = new Parse.Query(RateLimitAttempt);
        query.equalTo("key", key);
        query.greaterThan("attemptedAt", since);
        var count = await query.count({ useMasterKey: true });

        if (count >= maxAttempts) {
            _rateLimitStore.set(key, { count: maxAttempts, firstAttempt: Date.now() - 1000 });
            throw new Error('Çok fazla deneme yaptınız. Lütfen 5 dakika sonra tekrar deneyin.');
        }
    } catch (e) {
        if (e.message && e.message.indexOf('Çok fazla deneme') !== -1) throw e;
        console.warn('⚠️ Kalıcı rate limit kontrolü başarısız, in-memory ile devam:', e.message);
    }

    return limiter;
}

async function recordAttemptPersistent(key) {
    var limiter = new RateLimit(key);
    limiter.record();

    try {
        var RateLimitAttempt2 = Parse.Object.extend(_RATE_LIMIT_CLASS);
        var attempt = new RateLimitAttempt2();
        attempt.set("key", key);
        attempt.set("attemptedAt", new Date());
        await attempt.save(null, { useMasterKey: true });
    } catch (e) {
        console.warn('⚠️ RateLimit kalıcı kayıt başarısız:', e.message);
    }

    return limiter;
}

async function checkRateLimit(key, maxAttempts, windowMs) {
    return await checkRateLimitPersistent(key, maxAttempts, windowMs);
}

async function recordAttempt(key) {
    return await recordAttemptPersistent(key);
}

function getRateLimitKey(request, action) {
    var identifier = '';
    if (request && request.params) {
        if (request.params.email) identifier = String(request.params.email).toLowerCase();
        else if (request.params.recoveryEmail) identifier = String(request.params.recoveryEmail).toLowerCase();
        else if (request.params.adminKey) identifier = String(request.params.adminKey);
        else if (request.params.betaKey) identifier = String(request.params.betaKey);
        else if (request.params.userID) identifier = 'fb_' + String(request.params.userID);
        else if (request.params.to) identifier = String(request.params.to).toLowerCase();
    }
    if (!identifier) {
        identifier = request.ip
            || (request.headers && (request.headers['x-forwarded-for'] || request.headers['x-real-ip']))
            || request.installationId
            || 'anon';
    }
    return action + ':' + identifier;
}

// RateLimitAttempt temizleme job'u
Parse.Cloud.job("cleanupRateLimitAttempts", async function (request) {
    console.log('🔄 RateLimitAttempt temizleniyor...');
    try {
        var RateLimitAttempt3 = Parse.Object.extend(_RATE_LIMIT_CLASS);
        var cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        var query = new Parse.Query(RateLimitAttempt3);
        query.lessThan("attemptedAt", cutoff);
        var old = await query.find({ useMasterKey: true });
        for (var i = 0; i < old.length; i++) {
            await old[i].destroy({ useMasterKey: true });
        }
        console.log('✅ ' + old.length + ' eski rate limit kaydı temizlendi.');
        return old.length + ' kayıt temizlendi.';
    } catch (e) {
        console.error('RateLimit temizleme hatası:', e.message);
        return 'Hata: ' + e.message;
    }
});

console.log('✅ Cloud Code başarıyla yüklendi! (v7.9.2)');

// ================================================================
// ========== SINIF TANIMLARI ==========
// ================================================================
var Team = Parse.Object.extend("Team");
var TeamMember = Parse.Object.extend("TeamMember");
var TeamMessage = Parse.Object.extend("TeamMessage");
var Inbox = Parse.Object.extend("Inbox");
var ChatHistory = Parse.Object.extend("ChatHistory");
var QueryStat = Parse.Object.extend("QueryStat");
var Comment = Parse.Object.extend("Comment");
var Project = Parse.Object.extend("Project");
var ProjectRequest = Parse.Object.extend("ProjectRequest");
var Gift = Parse.Object.extend("Gift");
var VizyonLog = Parse.Object.extend("VizyonLog");
var Product = Parse.Object.extend("Product");
var StoreItem = Parse.Object.extend("StoreItem");
var DailyTask = Parse.Object.extend("DailyTask");
var SocialTask = Parse.Object.extend("SocialTask");
var TeamTask = Parse.Object.extend("TeamTask");
var Notification = Parse.Object.extend("Notification");
var Message = Parse.Object.extend("Message");
var Conversation = Parse.Object.extend("Conversation");
var Course = Parse.Object.extend("Course");
var Lesson = Parse.Object.extend("Lesson");
var Contest = Parse.Object.extend("Contest");
var Poll = Parse.Object.extend("Poll");
var Announcement = Parse.Object.extend("Announcement");
var Job = Parse.Object.extend("Job");
var BugReport = Parse.Object.extend("BugReport");
var Quiz = Parse.Object.extend("Quiz");
var BlogSubscriber = Parse.Object.extend("BlogSubscriber");
var BlogPost = Parse.Object.extend("BlogPost");
var MarketProject = Parse.Object.extend("MarketProject");
var ParentLog = Parse.Object.extend("ParentLog");
var UserStreak = Parse.Object.extend("UserStreak");
var UserApiKey = Parse.Object.extend("UserApiKey");

// Contest sınıfları
var ContestParticipant = Parse.Object.extend("ContestParticipant");
var ContestProject = Parse.Object.extend("ContestProject");
var ContestWinner = Parse.Object.extend("ContestWinner");

// ✅ [v7.9.0] V27 API Anahtar sınıfı
var V27ApiKey = Parse.Object.extend("V27ApiKey");

// ✅ [v7.9.0 YENİ] V27 Koç Asistanı sınıfı
var KocConversation = Parse.Object.extend("KocConversation");
var KocUsage = Parse.Object.extend("KocUsage");

// ✅ [v7.9.2 YENİ] Moderatör Video Kesit sınıfı
var VideoClip = Parse.Object.extend("VideoClip");

// ================================================================
// ========== YARDIMCI FONKSİYONLAR ==========
// ================================================================
async function getAPIKey(keyName) {
    try {
        var config = await Parse.Config.get({ useMasterKey: true });
        var value = config.get(keyName);
        if (value) {
            console.log('✅ ' + keyName + ' Config\'den okundu.');
            return value;
        } else {
            console.warn('⚠️ ' + keyName + ' Config\'de bulunamadı!');
            return null;
        }
    } catch (e) {
        console.error('❌ Config okunamadı (' + keyName + '): ' + e.message);
        return null;
    }
}

function cleanResponse(text) {
    if (!text) return text;
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '    ')
        .replace(/\s+/g, ' ')
        .replace(/ \n/g, '\n')
        .replace(/\n /g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function filterText(text) {
    if (!text) return text;
    var badWords = [
        'küfür', 'kufur', 'küfretmek', 'siktir', 'amk', 'orospu', 'piç', 'göt',
        'sik', 'yarrak', 'ananı', 'bacını', 'çük', 'amcık', 'ibne', 'puşt',
        'şerefsiz', 'hıyar', 'domuz'
    ];
    var filtered = text;
    badWords.forEach(function (word) {
        var escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp(escapedWord, 'gi');
        filtered = filtered.replace(regex, '****');
    });
    return filtered;
}

function isSpaceMode() {
    var hour = new Date().getHours();
    return (hour >= 2 && hour < 5);
}

function bufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var chunkSize = 8192;
    var result = '';
    for (var i = 0; i < bytes.length; i += chunkSize) {
        var chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        result += String.fromCharCode.apply(null, chunk);
    }
    return btoa(result);
}

// ================================================================
// ===== SANSÜR YARDIMCILARI ======================================
// ================================================================
function censorNameShort(name) {
    if (!name) return '***';
    var str = String(name);
    if (str.length <= 3) return str;
    return str.substring(0, 3) + '*'.repeat(str.length - 3);
}

function censorEmailPattern(email) {
    if (!email) return '***@***.***';
    var parts = String(email).split('@');
    if (parts.length !== 2) return '***@***.***';
    var local = parts[0];
    var domain = parts[1];

    var censoredLocal = '';
    for (var i = 0; i < local.length; i++) {
        if (i % 2 === 0) censoredLocal += local[i];
        else censoredLocal += '*';
    }

    var domainParts = domain.split('.');
    var censoredDomainParts = domainParts.map(function (dp) {
        var out = '';
        for (var j = 0; j < dp.length; j++) {
            if (j % 2 === 0) out += dp[j];
            else out += '*';
        }
        return out;
    });

    return censoredLocal + '@' + censoredDomainJoined(censoredDomainParts);
}

function censoredDomainJoined(parts) {
    if (parts.length <= 1) return parts.join('.');
    var last = parts[parts.length - 1];
    var rest = parts.slice(0, parts.length - 1).join('.');
    return rest + '.' + last;
}

async function addPointsWithBonus(user, points, reason) {
    var bonus = isSpaceMode() ? 2 : 1;
    var total = points * bonus;
    var current = user.get('points') || 0;
    user.set('points', current + total);
    await user.save(null, { useMasterKey: true });
    var log = new VizyonLog();
    log.set('user_email', user.get('email'));
    log.set('user_name', user.get('name') || 'Kullanıcı');
    log.set('action', 'add_points');
    log.set('message', total + ' puan eklendi (' + reason + ')' + (bonus > 1 ? ' [Uzay Modu x2]' : ''));
    await log.save(null, { useMasterKey: true });
    await checkAndUpdateLevel(user);
    await sendNotificationToUser(user, '🎉 ' + total + ' puan kazandınız! (' + reason + ')', 'reward');
    return total;
}

async function checkAndUpdateLevel(user) {
    var points = user.get('points') || 0;
    var level = 'Çaylak';
    if (points >= 20000) level = 'V27 Efsanesi';
    else if (points >= 5000) level = 'V27 Uzmanı';
    else if (points >= 1000) level = 'Üye';
    else level = 'Çaylak';
    var oldLevel = user.get('level') || 'Çaylak';
    if (oldLevel !== level) {
        user.set('level', level);
        await user.save(null, { useMasterKey: true });
        await sendNotificationToUser(user, '🎊 Tebrikler! Seviyeniz "' + level + '" oldu!', 'level_up');
        if (level === 'V27 Efsanesi') {
            var badges = user.get('badges') || [];
            if (badges.indexOf('efsane') === -1) {
                badges.push('efsane');
                user.set('badges', badges);
                await user.save(null, { useMasterKey: true });
            }
        }
    }
}

async function sendNotificationToUser(user, message, type) {
    if (!user) return;
    type = type || 'system';
    try {
        var notif = new Notification();
        notif.set('user', user);
        notif.set('message', message);
        notif.set('is_read', false);
        notif.set('type', type);
        await notif.save(null, { useMasterKey: true });
    } catch (e) {
        console.error('Bildirim kaydedilemedi:', e.message);
    }
    try {
        await Parse.Cloud.run('sendEmail', {
            to: user.get('email'),
            subject: 'VİZYON2027 Bildirim',
            html: '<h3>📢 VİZYON2027</h3><p>' + message + '</p><p>VİZYON2027 Ekibi</p>'
        }, { useMasterKey: true });
    } catch (e) {
        console.error('Bildirim e-postası gönderilemedi:', e.message);
    }
}

// ================================================================
// ========== SİTE İÇERİĞİ ==========
// ================================================================
var siteContentCache = null;
var siteContentCacheTime = 0;

async function getSiteContent() {
    var now = Date.now();
    if (siteContentCache && (now - siteContentCacheTime) < 3600000) {
        return siteContentCache;
    }
    try {
        var baseUrl = 'https://vizyon2026.vercel.app';
        var pages = ['/', '/bana-ogret.html', '/hakkimizda.html', '/vizyon-ai.html', '/gizlilik.html', '/kullanici-sozlesmesi.html'];
        var fullText = '';
        var rawHtml = '';

        for (var i = 0; i < pages.length; i++) {
            var page = pages[i];
            try {
                var controller = new AbortController();
                var timeout = setTimeout(function () { controller.abort(); }, 5000);
                var response = await fetch(baseUrl + page, { signal: controller.signal });
                clearTimeout(timeout);
                var html = await response.text();
                var text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                var rawSnippet = html.substring(0, 500).replace(/\s+/g, ' ').trim();
                fullText += '\n\n--- Sayfa: ' + page + ' ---\n' + text.substring(0, 2000);
                rawHtml += '\n\n--- Sayfa Kodu (' + page + ') ---\n' + rawSnippet + '...';
            } catch (e) {
                console.warn('Sayfa ' + page + ' alınamadı:', e.message);
            }
        }

        var combined = '=== VİZYON2027 SİTE İÇERİĞİ ===\n' + fullText + '\n\n=== SAYFA KAYNAK KODLARI (İLK 500 KARAKTER) ===\n' + rawHtml;
        var summary = combined.substring(0, 7000);
        siteContentCache = summary;
        siteContentCacheTime = now;
        return summary;
    } catch (e) {
        console.error('Site içeriği alınamadı:', e);
        return 'Site içeriği şu anda alınamıyor. Lütfen daha sonra tekrar deneyin.';
    }
}

// ================================================================
// ========== ŞİFRELEME / HASH YARDIMCILARI ==========
// ================================================================
var crypto;
try {
    crypto = require('crypto');
    console.log('✅ crypto modülü yüklendi');
} catch (e) {
    console.warn('⚠️ crypto modülü yüklenemedi:', e.message);
    crypto = null;
}

function hashApiPassword(password) {
    if (!crypto) throw new Error('crypto modülü yüklü değil!');
    var salt = crypto.randomBytes(16).toString('hex');
    var hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return salt + ':' + hash;
}

function verifyApiPasswordHash(password, stored) {
    if (!crypto) return false;
    if (!stored || typeof stored !== 'string' || stored.indexOf(':') === -1) return false;
    var parts = stored.split(':');
    var salt = parts[0];
    var hash = parts[1];
    var verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verify;
}

// AES-256-GCM (v7.7.0 - eski XOR yerine)
function aesEncrypt(plainText, encryptionKey) {
    if (!crypto) throw new Error('crypto modülü yüklü değil!');
    if (!plainText || !encryptionKey) return plainText;

    var key = crypto.createHash('sha256').update(String(encryptionKey)).digest();
    var iv = crypto.randomBytes(12);
    var cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    var encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
    var authTag = cipher.getAuthTag();
    var combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
}

function aesDecrypt(encryptedBase64, encryptionKey) {
    if (!crypto) return '';
    if (!encryptedBase64 || !encryptionKey) return '';
    try {
        var key = crypto.createHash('sha256').update(String(encryptionKey)).digest();
        var combined = Buffer.from(encryptedBase64, 'base64');
        if (combined.length < 28) return '';
        var iv = combined.slice(0, 12);
        var authTag = combined.slice(12, 28);
        var ciphertext = combined.slice(28);
        var decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        var decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        console.warn('AES decrypt hatası:', e.message);
        return '';
    }
}

function xorEncrypt(text, key) {
    if (!text || !key) return text;
    var result = '';
    for (var i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(result, 'binary').toString('base64');
}

function xorDecrypt(encrypted, key) {
    if (!encrypted || !key) return encrypted;
    try {
        var text = Buffer.from(encrypted, 'base64').toString('binary');
        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        return '';
    }
}

// Akıllı decrypt: önce AES, başarısızsa XOR
function smartDecrypt(encryptedBase64, encryptionKey) {
    var aesResult = aesDecrypt(encryptedBase64, encryptionKey);
    if (aesResult && aesResult.length > 0) return aesResult;
    return xorDecrypt(encryptedBase64, encryptionKey);
}

// ================================================================
// ========== TEMEL FONKSİYONLAR ==========
// ================================================================
Parse.Cloud.define("test", async function (request) {
    return {
        success: true,
        message: 'Cloud Code çalışıyor! (SashiDo v7.9.2)',
        user: request.user ? request.user.get('email') : 'Oturum yok',
        timestamp: new Date().toISOString()
    };
});

Parse.Cloud.define("checkRoleAccess", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1) {
        throw new Error('Yetkiniz yok!');
    }
    return { role: role, access: true };
});

Parse.Cloud.define("verifyUser", async function (request) {
    var email = request.params.email;
    var code = request.params.code;
    if (!email || !code) return { success: false, error: 'E-posta ve kod gerekli!' };
    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var user = await query.first({ useMasterKey: true });
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı!' };
    if (user.get('verificationCode') !== code) return { success: false, error: 'Geçersiz kod!' };
    if (new Date(user.get('verificationCodeExpires')) < new Date()) {
        return { success: false, error: 'Kod süresi doldu!' };
    }
    user.set('isVerified', true);
    user.set('verificationCode', null);
    user.set('verificationCodeExpires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: 'Hesap doğrulandı!' };
});

Parse.Cloud.define("saveChatHistory", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var messages = request.params.messages;
    if (!Array.isArray(messages)) throw new Error('Geçersiz format!');
    var query = new Parse.Query(ChatHistory);
    query.equalTo("user_email", user.get('email'));
    var history = await query.first({ useMasterKey: true });
    if (history) {
        history.set("messages", messages);
        history.set("lastUpdated", new Date());
    } else {
        history = new ChatHistory();
        history.set("user_email", user.get('email'));
        history.set("messages", messages);
        history.set("lastUpdated", new Date());
    }
    await history.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("getChatHistory", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var query = new Parse.Query(ChatHistory);
    query.equalTo("user_email", user.get('email'));
    var history = await query.first({ useMasterKey: true });
    return { success: true, messages: history ? history.get('messages') : [] };
});

// ================================================================
// ========== initSchemas (V27ApiKey + KocConversation + KocUsage + VideoClip eklendi) ==========
// ================================================================
Parse.Cloud.define("initSchemas", async function (request) {
    var schemaDefinitions = {
        "Team": ["name", "teamCode", "owner_email", "manager_email"],
        "TeamMember": ["team_id", "user_email"],
        "TeamMessage": ["team_id", "user_email", "user_name", "message", "fileUrl", "fileName", "fileType", "deleted", "deleted_by_founder", "edited"],
        "Inbox": ["sender_email", "receiver_email", "type", "request_id", "project_title", "project_type", "project_description", "status", "message", "response_message", "accepted_by", "accepted_by_name", "role", "package_type", "team_id", "team_name", "project_id"],
        "ChatHistory": ["user_email", "messages", "lastUpdated"],
        "QueryStat": ["user_email", "date", "count", "visitorKey"],
        "Comment": ["user_email", "user_name", "user_role", "comment", "rating"],
        "Project": ["user_email", "name", "type", "content", "content_file_url", "is_favorite", "is_archived", "is_trashed", "is_published"],
        "ProjectRequest": ["user_email", "title", "type", "description", "status", "request_id"],
        "Gift": ["sender_email", "receiver_email", "package"],
        "VizyonLog": ["user_email", "user_name", "action", "message"],
        "Product": ["user_email", "title_", "price", "file", "status"],
        "StoreItem": ["name", "price_points", "type", "icon"],
        "DailyTask": ["date", "task_text", "points"],
        "SocialTask": ["date", "platform", "url", "points_reward", "penalty_points", "is_active"],
        "TeamTask": ["team_id", "date", "task_text", "points"],
        "Notification": ["user_email", "message", "is_read", "type"],
        "Message": ["from_email", "to_email", "conversationId", "text", "file", "fileName", "is_read", "is_ai", "ai_name"],
        "Conversation": ["user_emails", "lastMessage", "lastMessageTime", "customName", "shareId"],
        "Course": ["title_", "description", "total_lessons"],
        "Lesson": ["courseId", "title_", "content", "points_reward", "order"],
        "Contest": ["month", "title", "is_active", "end_date", "winner1_email", "winner2_email", "winner3_email"],
        "Poll": ["question", "options", "votes", "voters", "created_by_email", "end_date", "is_active"],
        "Announcement": ["title_", "content", "created_by_email"],
        "Job": ["title_", "description", "company", "contact", "is_active"],
        "BugReport": ["user_email", "description", "screenshot", "status", "points_reward"],
        "Quiz": ["date", "question", "options", "correct_answer", "points_reward", "is_active"],
        "BlogSubscriber": ["email", "isActive", "isSystemActive", "subscribedAt"],
        "BlogPost": ["title_", "content", "author", "published"],
        "MarketProject": ["projectId", "title", "description", "price_points", "owner_email", "owner_name", "imageUrl", "type", "is_active", "buyer_email"],
        "ParentLog": ["parent_email", "child_email", "action", "details"],
        "UserStreak": ["user_email", "streakCount", "lastClaimDate", "lastClaimTime", "streakStartDate", "notifiedAt8h", "notifiedAt4h", "isActive"],
        "RateLimitAttempt": ["key", "attemptedAt"],
        "UserApiKey": ["user_email", "name", "encryptedValue", "createdAtClient", "updatedAtClient"],
        "ContestParticipant": ["contest_id", "user_email", "user_name", "joined_at", "total_points"],
        "ContestProject": ["contest_id", "user_email", "user_name", "project_name", "code", "submitted_at", "reviewed", "points"],
        "ContestWinner": ["contest_id", "month", "rank", "user_email", "reward"],
        // ✅ [v7.9.0] V27ApiKey şeması
        "V27ApiKey": ["user_email", "user_name", "key_name", "key_description", "key_hash", "key_prefix", "key_masked", "duration", "expires_at", "is_active", "createdAtClient", "last_used_at", "usage_count"],
        // ✅ [v7.9.0 YENİ] V27 Koç Asistanı şemaları
        "KocConversation": ["user_email", "user_name", "title", "topic", "messageCount", "share_id", "share_password_hash", "share_password_salt", "shared_at", "is_shared", "last_message_at", "created_at_client"],
        "KocUsage": ["user_email", "week_start", "count", "last_reset", "total_count"],
        // ✅ [v7.9.2 YENİ] Moderatör Video Kesit şeması
        "VideoClip": ["moderator_email", "moderator_name", "video_url", "start_time", "end_time", "note", "analysis", "is_published", "shared_with", "created_at_client"]
    };

    var results = [];
    var classNames = Object.keys(schemaDefinitions);
    for (var ci = 0; ci < classNames.length; ci++) {
        var className = classNames[ci];
        try {
            var Obj = Parse.Object.extend(className);
            var dummy = new Obj();

            var columns = schemaDefinitions[className];
            for (var coli = 0; coli < columns.length; coli++) {
                var col = columns[coli];
                if (col === "date" || col === "lastUpdated" || col === "lastClaimDate" ||
                    col === "lastClaimTime" || col === "streakStartDate" || col === "end_date" ||
                    col === "subscribedAt" || col === "attemptedAt" || col === "lastMessageTime" ||
                    col === "createdAtClient" || col === "updatedAtClient" || col === "joined_at" ||
                    col === "submitted_at" || col === "expires_at" || col === "last_used_at" ||
                    col === "shared_at" || col === "last_message_at" || col === "created_at_client" ||
                    col === "week_start" || col === "last_reset") {
                    dummy.set(col, new Date());
                } else if (col === "count" || col === "points" || col === "points_reward" ||
                           col === "price" || col === "price_points" || col === "rating" ||
                           col === "total_lessons" || col === "order" || col === "correct_answer" ||
                           col === "streakCount" || col === "penalty_points" || col === "total_points" ||
                           col === "rank" || col === "usage_count" || col === "messageCount" ||
                           col === "total_count" || col === "start_time" || col === "end_time") {
                    dummy.set(col, 0);
                } else if (col === "is_favorite" || col === "is_archived" || col === "is_trashed" ||
                           col === "is_published" || col === "is_read" || col === "is_active" ||
                           col === "isActive" || col === "isSystemActive" ||
                           col === "notifiedAt8h" || col === "notifiedAt4h" ||
                           col === "deleted" || col === "deleted_by_founder" ||
                           col === "edited" || col === "published" || col === "reviewed" ||
                           col === "is_ai" || col === "is_shared") {
                    dummy.set(col, false);
                } else if (col === "messages" || col === "options" || col === "votes" ||
                           col === "voters" || col === "user_emails" ||
                           col === "users" || col === "user_actions" || col === "shared_with") {
                    dummy.set(col, []);
                } else if (col === "features") {
                    dummy.set(col, {});
                } else {
                    dummy.set(col, "__init__");
                }
            }
            dummy.set("__init__", true);

            await dummy.save(null, { useMasterKey: true });
            await dummy.destroy({ useMasterKey: true });
            results.push({ className: className, status: "ok", columns: columns.length });
            console.log('✅ ' + className + ' sınıfı hazır (' + columns.length + ' kolon).');
        } catch (e) {
            console.error('❌ ' + className + ' oluşturulamadı: ' + e.message);
            results.push({ className: className, status: "error", error: e.message });
        }
    }
    return { success: true, results: results };
});

// ================================================================
// ========== PROJE İŞLEMLERİ ==========
// ================================================================
Parse.Cloud.define("trashProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    if (!projectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    project.set('is_trashed', true);
    project.set('is_archived', false);
    project.set('is_favorite', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: 'Proje çöp kutusuna taşındı!' };
});

Parse.Cloud.define("restoreProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    if (!projectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    project.set('is_trashed', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: 'Proje geri yüklendi!' };
});

Parse.Cloud.define("deletePermanently", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    if (!projectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    await project.destroy({ useMasterKey: true });
    return { success: true, message: 'Proje kalıcı olarak silindi!' };
});

Parse.Cloud.define("favoriteProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    if (!projectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    project.set('is_favorite', !project.get('is_favorite'));
    await project.save(null, { useMasterKey: true });
    return { success: true, is_favorite: project.get('is_favorite') };
});

Parse.Cloud.define("archiveProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    if (!projectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    project.set('is_archived', true);
    project.set('is_trashed', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: 'Proje arşivlendi!' };
});

Parse.Cloud.define("unarchiveProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    if (!projectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    project.set('is_archived', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: 'Proje arşivden çıkarıldı!' };
});

Parse.Cloud.define("editProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    var name = request.params.name;
    var content = request.params.content;
    if (!projectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    if (name !== undefined) project.set('name', name);
    if (content !== undefined) project.set('content', content);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: 'Proje güncellendi!' };
});

Parse.Cloud.define("saveProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var name = request.params.name;
    var type = request.params.type;
    var content = request.params.content;
    if (!name || !type || !content) {
        throw new Error('Proje adı, tür ve içerik gerekli!');
    }
    var project = new Project();
    project.set('user_email', user.get('email'));
    project.set('name', name);
    project.set('type', type);
    project.set('content', content);
    project.set('is_favorite', false);
    project.set('is_archived', false);
    project.set('is_trashed', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, projectId: project.id };
});

Parse.Cloud.define("saveProjectWithSceneData", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var name = request.params.name;
    var type = request.params.type || '3D';
    var content = request.params.content;
    var glbBase64 = request.params.glbBase64;

    if (!name || !name.trim()) throw new Error('Proje adı gerekli!');
    if (!content) throw new Error('Sahne verisi (content) gerekli!');
    if (name.trim().length > 100) throw new Error('Proje adı çok uzun (max 100 karakter).');

    var _rlk = 'saveProjectWithSceneData:' + user.get('email');
    await checkRateLimit(_rlk, 10, 5 * 60 * 1000);
    await recordAttempt(_rlk);

    try {
        var project = new Project();
        project.set('user_email', user.get('email'));
        project.set('name', name.trim());
        project.set('type', type);
        project.set('content', content);
        project.set('is_favorite', false);
        project.set('is_archived', false);
        project.set('is_trashed', false);
        project.set('is_published', false);

        if (glbBase64 && typeof glbBase64 === 'string' && glbBase64.length > 0) {
            var approxSize = Math.floor(glbBase64.length * 0.75);
            if (approxSize > 8 * 1024 * 1024) {
                console.warn('⚠️ GLB dosyası çok büyük, atlanıyor:', approxSize, 'byte');
            } else {
                try {
                    var binaryStr = atob(glbBase64);
                    var bytes = new Uint8Array(binaryStr.length);
                    for (var i = 0; i < binaryStr.length; i++) {
                        bytes[i] = binaryStr.charCodeAt(i);
                    }
                    var fileName = 'vizyon3d_' + user.id + '_' + Date.now() + '.glb';
                    var parseFile = new Parse.File(fileName, { base64: glbBase64 });
                    await parseFile.save(null, { useMasterKey: true });
                    project.set('content_file_url', parseFile.url());
                    console.log('✅ GLB dosyası yüklendi:', parseFile.url());
                } catch (fileErr) {
                    console.warn('⚠️ GLB dosyası yüklenemedi (JSON devam):', fileErr.message);
                }
            }
        }

        await project.save(null, { useMasterKey: true });

        console.log('✅ 3D proje kaydedildi:', name, '→', project.id);
        return {
            success: true,
            projectId: project.id,
            message: 'Proje başarıyla kaydedildi!'
        };
    } catch (e) {
        console.error('❌ saveProjectWithSceneData hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== PROJE TALEBİ SİSTEMİ (MODERATÖR YÖNLENDİRMELİ) =====
// ================================================================
// ✅ [v7.9.2 GÜNCELLENDİ]
// Mantık:
//   1. Önce moderatör var mı diye kontrol et
//   2. Moderatör VARSA: talep moderatöre gider (admin+founder'a GİTMEZ)
//   3. Moderatör YOKSA: talep admin+founder'a gider (eski davranış)
// ================================================================
Parse.Cloud.define("createProjectRequest", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var title = request.params.title;
    var type = request.params.type;
    var description = request.params.description;
    if (!title || !type || !description) throw new Error('Başlık, tür ve açıklama gerekli!');
    if (['3D', 'Kod', 'Görsel'].indexOf(type) === -1) throw new Error('Geçersiz proje türü!');

    // ✅ [v7.9.2 YENİ] Önce moderatör var mı diye bak
    var moderatorQuery = new Parse.Query(Parse.User);
    moderatorQuery.equalTo('role', 'moderator');
    var moderators = await moderatorQuery.find({ useMasterKey: true });

    var recipients = [];
    var recipientType = '';

    if (moderators && moderators.length > 0) {
        // Moderatör varsa sadece moderatörlere gönder
        recipients = moderators;
        recipientType = 'moderator';
        console.log('📨 Proje talebi moderatörlere yönlendiriliyor (' + moderators.length + ' moderatör)');
    } else {
        // Moderatör yoksa admin + founder'a gönder (eski davranış)
        var adminQuery = new Parse.Query(Parse.User);
        adminQuery.containedIn('role', ['admin', 'founder']);
        recipients = await adminQuery.find({ useMasterKey: true });
        recipientType = 'admin';
        console.log('📨 Proje talebi admin+founder\'a yönlendiriliyor (' + recipients.length + ' kişi)');
    }

    if (recipients.length === 0) throw new Error('Hiç moderatör, admin veya kurucu bulunamadı!');

    var requestId = Math.random().toString(36).substring(2, 15);
    var inboxPromises = recipients.map(async function (recipient) {
        var inbox = new Inbox();
        inbox.set('sender_email', user.get('email'));
        inbox.set('receiver_email', recipient.get('email'));
        inbox.set('type', 'project_request');
        inbox.set('request_id', requestId);
        inbox.set('project_title', title);
        inbox.set('project_type', type);
        inbox.set('project_description', description);
        inbox.set('status', 'pending');
        inbox.set('message', '📩 ' + user.get('name') + ' yeni bir proje talebi oluşturdu: "' + title + '" (' + type + '). Lütfen değerlendirin.');
        await inbox.save(null, { useMasterKey: true });
        await sendNotificationToUser(recipient, '📩 ' + user.get('name') + ' "' + title + '" adlı proje talebinde bulundu.', 'project_request');
    });
    await Promise.all(inboxPromises);

    var req = new ProjectRequest();
    req.set('user_email', user.get('email'));
    req.set('title', title);
    req.set('type', type);
    req.set('description', description);
    req.set('status', 'pending');
    req.set('request_id', requestId);
    await req.save(null, { useMasterKey: true });

    var message = recipientType === 'moderator'
        ? 'Proje talebi moderatörlere iletildi.'
        : 'Proje talebi tüm admin ve kuruculara iletildi.';

    return { success: true, message: message, requestId: requestId, recipientType: recipientType };
});

Parse.Cloud.define("cancelProjectRequest", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var requestId = request.params.requestId;
    if (!requestId) throw new Error('Request ID gerekli!');

    var reqQuery = new Parse.Query(ProjectRequest);
    reqQuery.equalTo('request_id', requestId);
    var req = await reqQuery.first({ useMasterKey: true });
    if (!req) throw new Error('Proje talebi bulunamadı!');
    if (req.get('user_email') !== user.get('email')) throw new Error('Bu talep size ait değil!');
    if (req.get('status') !== 'pending') throw new Error('Bu talep zaten işlenmiş, iptal edilemez!');

    await req.destroy({ useMasterKey: true });

    var inboxQuery = new Parse.Query(Inbox);
    inboxQuery.equalTo('request_id', requestId);
    inboxQuery.equalTo('type', 'project_request');
    var inboxes = await inboxQuery.find({ useMasterKey: true });
    for (var ii = 0; ii < inboxes.length; ii++) {
        await inboxes[ii].destroy({ useMasterKey: true });
    }

    return { success: true, message: 'Proje talebi iptal edildi.' };
});

// ✅ [v7.9.2 GÜNCELLENDİ] handleProjectRequest - moderatör de kabul edebilir
Parse.Cloud.define("handleProjectRequest", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (['admin', 'founder', 'moderator'].indexOf(user.get('role')) === -1) throw new Error('Bu işlemi sadece admin, kurucu veya moderatör yapabilir!');

    var requestId = request.params.requestId;
    var action = request.params.action;
    var projectId = request.params.projectId;
    if (!requestId || !action) throw new Error('Request ID ve action gerekli!');
    if (['accept', 'reject', 'delegate', 'send', 'cancel'].indexOf(action) === -1) throw new Error('Geçersiz işlem!');

    var inboxQuery = new Parse.Query(Inbox);
    inboxQuery.equalTo('request_id', requestId);
    inboxQuery.equalTo('receiver_email', user.get('email'));
    inboxQuery.equalTo('type', 'project_request');
    var inboxMsg = await inboxQuery.first({ useMasterKey: true });
    if (!inboxMsg) throw new Error('Bu talebi bulamadınız veya size ait değil!');
    if (inboxMsg.get('status') !== 'pending' && action !== 'send' && action !== 'cancel') throw new Error('Bu talep zaten işlenmiş!');

    if (action === 'cancel') {
        var allInboxes = new Parse.Query(Inbox);
        allInboxes.equalTo('request_id', requestId);
        allInboxes.equalTo('type', 'project_request');
        var allMsgs = await allInboxes.find({ useMasterKey: true });
        for (var mi = 0; mi < allMsgs.length; mi++) {
            await allMsgs[mi].destroy({ useMasterKey: true });
        }
        var reqQuery2 = new Parse.Query(ProjectRequest);
        reqQuery2.equalTo('request_id', requestId);
        var req2 = await reqQuery2.first({ useMasterKey: true });
        if (req2) {
            await req2.destroy({ useMasterKey: true });
        }
        return { success: true, message: 'Proje talebi iptal edildi ve tüm kayıtları silindi.' };
    }

    if (action === 'reject') {
        inboxMsg.set('status', 'rejected');
        inboxMsg.set('response_message', user.get('name') + ' talebi reddetti.');
        await inboxMsg.save(null, { useMasterKey: true });
        var senderEmail = inboxMsg.get('sender_email');
        var senderQuery = new Parse.Query(Parse.User);
        senderQuery.equalTo('email', senderEmail);
        var sender = await senderQuery.first({ useMasterKey: true });
        if (sender) {
            await sendNotificationToUser(sender, '❌ "' + inboxMsg.get('project_title') + '" proje talebiniz ' + user.get('name') + ' tarafından reddedildi.', 'project_rejected');
        }
        return { success: true, message: 'Talebi reddettiniz.' };
    }

    if (action === 'delegate') {
        inboxMsg.set('status', 'delegated');
        inboxMsg.set('message', '📩 ' + user.get('name') + ' bu projeyi yapamadığını belirtti ve devretti. Lütfen değerlendirin.');
        await inboxMsg.save(null, { useMasterKey: true });

        // Devretme: moderator + admin + founder'a gönder (kendisi hariç)
        var delegateQuery = new Parse.Query(Parse.User);
        delegateQuery.containedIn('role', ['admin', 'founder', 'moderator']);
        delegateQuery.notEqualTo('email', user.get('email'));
        var delegates = await delegateQuery.find({ useMasterKey: true });

        for (var ai = 0; ai < delegates.length; ai++) {
            var delegateUser = delegates[ai];
            var existing = new Parse.Query(Inbox);
            existing.equalTo('request_id', requestId);
            existing.equalTo('receiver_email', delegateUser.get('email'));
            existing.equalTo('type', 'project_request');
            var exist = await existing.first({ useMasterKey: true });
            if (!exist) {
                var newInbox = new Inbox();
                newInbox.set('sender_email', inboxMsg.get('sender_email'));
                newInbox.set('receiver_email', delegateUser.get('email'));
                newInbox.set('type', 'project_request');
                newInbox.set('request_id', requestId);
                newInbox.set('project_title', inboxMsg.get('project_title'));
                newInbox.set('project_type', inboxMsg.get('project_type'));
                newInbox.set('project_description', inboxMsg.get('project_description'));
                newInbox.set('status', 'pending');
                newInbox.set('message', '📩 ' + inboxMsg.get('sender_email') + ' adlı kullanıcı "' + inboxMsg.get('project_title') + '" projesini talep etti. ' + user.get('name') + ' devretti.');
                await newInbox.save(null, { useMasterKey: true });
                await sendNotificationToUser(delegateUser, '📩 "' + inboxMsg.get('project_title') + '" proje talebi devredildi.', 'project_delegated');
            } else {
                exist.set('status', 'pending');
                exist.set('message', '📩 ' + inboxMsg.get('sender_email') + ' adlı kullanıcı "' + inboxMsg.get('project_title') + '" projesini talep etti. ' + user.get('name') + ' devretti.');
                await exist.save(null, { useMasterKey: true });
                await sendNotificationToUser(delegateUser, '📩 "' + inboxMsg.get('project_title') + '" proje talebi tekrar değerlendirmeye açıldı.', 'project_delegated');
            }
        }
        return { success: true, message: 'Proje devredildi, diğer yetkililere bildirildi.' };
    }

    if (action === 'accept') {
        inboxMsg.set('status', 'accepted');
        inboxMsg.set('accepted_by', user.get('email'));
        inboxMsg.set('accepted_by_name', user.get('name'));
        await inboxMsg.save(null, { useMasterKey: true });

        var otherInboxes = new Parse.Query(Inbox);
        otherInboxes.equalTo('request_id', requestId);
        otherInboxes.equalTo('type', 'project_request');
        otherInboxes.notEqualTo('receiver_email', user.get('email'));
        var others = await otherInboxes.find({ useMasterKey: true });
        for (var oi = 0; oi < others.length; oi++) {
            others[oi].set('status', 'accepted_by_other');
            others[oi].set('accepted_by', user.get('email'));
            others[oi].set('accepted_by_name', user.get('name'));
            await others[oi].save(null, { useMasterKey: true });
        }

        var senderEmail2 = inboxMsg.get('sender_email');
        var sender2 = await new Parse.Query(Parse.User).equalTo('email', senderEmail2).first({ useMasterKey: true });
        if (sender2) {
            await sendNotificationToUser(sender2, '✅ "' + inboxMsg.get('project_title') + '" proje talebiniz ' + user.get('name') + ' tarafından kabul edildi. Proje oluşturuluyor...', 'project_accepted');
        }
        return { success: true, message: 'Talebi kabul ettiniz. Proje oluşturma ekranını açabilirsiniz.', acceptedBy: user.get('email') };
    }

    if (action === 'send') {
        if (!projectId) throw new Error('Proje ID gerekli!');
        var senderEmail3 = inboxMsg.get('sender_email');
        var projectQuery = new Parse.Query(Project);
        var project2 = await projectQuery.get(projectId, { useMasterKey: true });
        if (!project2) throw new Error('Proje bulunamadı!');
        if (project2.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');

        project2.set('user_email', senderEmail3);
        await project2.save(null, { useMasterKey: true });

        var sender3 = await new Parse.Query(Parse.User).equalTo('email', senderEmail3).first({ useMasterKey: true });
        if (sender3) {
            var inbox = new Inbox();
            inbox.set('sender_email', user.get('email'));
            inbox.set('receiver_email', senderEmail3);
            inbox.set('type', 'project_completed');
            inbox.set('message', '✅ "' + inboxMsg.get('project_title') + '" projeniz ' + user.get('name') + ' tarafından tamamlanıp size gönderildi. Projelerim klasörünüzde görebilirsiniz.');
            inbox.set('project_id', projectId);
            await inbox.save(null, { useMasterKey: true });
            await sendNotificationToUser(sender3, '✅ "' + inboxMsg.get('project_title') + '" projeniz tamamlandı ve projelerinize eklendi.', 'project_completed');
        }

        inboxMsg.set('status', 'completed');
        await inboxMsg.save(null, { useMasterKey: true });
        return { success: true, message: 'Proje talep edene gönderildi.' };
    }

    return { success: false, message: 'Geçersiz işlem!' };
});

Parse.Cloud.define("acceptProjectCompletion", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var inboxId = request.params.inboxId;
    if (!inboxId) throw new Error('Inbox ID gerekli!');

    var query = new Parse.Query(Inbox);
    var inbox = await query.get(inboxId, { useMasterKey: true });
    if (!inbox) throw new Error('Mesaj bulunamadı!');
    if (inbox.get('receiver_email') !== user.get('email')) throw new Error('Bu mesaj size ait değil!');
    if (inbox.get('type') !== 'project_completed') throw new Error('Bu mesaj proje tamamlama bildirimi değil!');

    var projectId = inbox.get('project_id');
    if (projectId) {
        var pQuery = new Parse.Query(Project);
        var project = await pQuery.get(projectId, { useMasterKey: true });
        if (project) {
            project.set('user_email', user.get('email'));
            await project.save(null, { useMasterKey: true });
        }
    }
    inbox.set('status', 'accepted');
    await inbox.save(null, { useMasterKey: true });
    await sendNotificationToUser(user, '✅ Projenizi aldınız.', 'project');
    return { success: true, message: 'Proje başarıyla alındı!' };
});

Parse.Cloud.define("rejectProjectCompletion", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var inboxId = request.params.inboxId;
    if (!inboxId) throw new Error('Inbox ID gerekli!');

    var query = new Parse.Query(Inbox);
    var inbox = await query.get(inboxId, { useMasterKey: true });
    if (!inbox) throw new Error('Mesaj bulunamadı!');
    if (inbox.get('receiver_email') !== user.get('email')) throw new Error('Bu mesaj size ait değil!');
    if (inbox.get('type') !== 'project_completed') throw new Error('Bu mesaj proje tamamlama bildirimi değil!');

    inbox.set('status', 'rejected');
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: 'Proje reddedildi.' };
});

// ================================================================
// ========== PUAN MAĞAZASINA KOY VE KALDIR ==========
// ================================================================
Parse.Cloud.define("publishProjectToStore", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var projectId = request.params.projectId;
    var price = request.params.price;
    var description = request.params.description;
    var imageUrl = request.params.imageUrl;
    var type = request.params.type;
    if (!projectId || !price || !description || !type) throw new Error('Proje ID, fiyat, açıklama ve tür gerekli!');
    if (price < 1 || price > 10000) throw new Error('Fiyat 1-10000 arası olmalı!');
    if (['3D', 'Kod', 'Görsel'].indexOf(type) === -1) throw new Error('Geçersiz tür!');

    var query = new Parse.Query(Project);
    var project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');
    if (project.get('user_email') !== user.get('email')) throw new Error('Bu proje size ait değil!');
    if (project.get('is_published')) throw new Error('Bu proje zaten mağazada!');

    var marketItem = new MarketProject();
    marketItem.set("projectId", projectId);
    marketItem.set("title", project.get('name') || 'İsimsiz Proje');
    marketItem.set("description", description);
    marketItem.set("price_points", parseInt(price));
    marketItem.set("owner_email", user.get('email'));
    marketItem.set("owner_name", user.get('name') || 'Kullanıcı');
    marketItem.set("imageUrl", imageUrl || 'https://via.placeholder.com/200x200?text=Proje');
    marketItem.set("type", type);
    marketItem.set("is_active", true);
    await marketItem.save(null, { useMasterKey: true });

    project.set("is_published", true);
    await project.save(null, { useMasterKey: true });

    return { success: true, message: 'Proje puan mağazasında satışa sunuldu!' };
});

Parse.Cloud.define("removeFromMarket", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var marketId = request.params.marketId;
    if (!marketId) throw new Error('Market ID gerekli!');

    var query = new Parse.Query(MarketProject);
    var item = await query.get(marketId, { useMasterKey: true });
    if (!item) throw new Error('Ürün bulunamadı!');

    if (item.get('owner_email') !== user.get('email') && user.get('role') !== 'founder') {
        throw new Error('Bu ürünü sadece sahibi veya kurucu kaldırabilir!');
    }

    var projectId = item.get('projectId');
    if (projectId) {
        var pQuery = new Parse.Query(Project);
        var project = await pQuery.get(projectId, { useMasterKey: true });
        if (project) {
            project.set('is_published', false);
            await project.save(null, { useMasterKey: true });
        }
    }

    await item.destroy({ useMasterKey: true });
    return { success: true, message: 'Proje mağazadan kaldırıldı!' };
});

// ================================================================
// ========== SOHBET GEÇMİŞİ (KONUŞMA) İŞLEMLERİ ==========
// ================================================================
Parse.Cloud.define("renameConversation", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    var name = request.params.name;
    if (!conversationId || !name) throw new Error('Konuşma ID ve isim gerekli!');
    var query = new Parse.Query(Conversation);
    var conv = await query.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');
    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Bu konuşmaya yetkiniz yok!');
    conv.set('customName', name);
    await conv.save(null, { useMasterKey: true });
    return { success: true, message: 'Sohbet ismi güncellendi!' };
});

Parse.Cloud.define("shareConversation", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    if (!conversationId) throw new Error('Konuşma ID gerekli!');
    var convQuery = new Parse.Query(Conversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');
    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Bu konuşmaya yetkiniz yok!');

    var shareId = Math.random().toString(36).substring(2, 12);
    conv.set('shareId', shareId);
    await conv.save(null, { useMasterKey: true });

    // Şifresiz paylaşım → password_required YOK (veya 0)
    var shareUrl = 'https://vizyon2026.vercel.app/share.html?id=' + shareId;
    return { success: true, shareUrl: shareUrl, shareId: shareId, passwordRequired: false };
});

Parse.Cloud.define("getSharedConversation", async function (request) {
    var shareId = request.params.shareId;
    if (!shareId) throw new Error('Paylaşım ID gerekli!');

    var probeOnly = request.params.probeOnly === true;

    var query = new Parse.Query(Conversation);
    query.equalTo('shareId', shareId);
    var conv = await query.first({ useMasterKey: true });
    if (!conv) throw new Error('Paylaşım bulunamadı!');

    if (probeOnly) {
        return {
            success: true,
            passwordRequired: false,
            shareType: 'regular',
            messages: null,
            conversationName: conv.get('customName') || 'Sohbet'
        };
    }

    // Mesajları getir
    var Message2 = Parse.Object.extend('Message');
    var msgQuery = new Parse.Query(Message2);
    msgQuery.equalTo('conversationId', conv.id);
    msgQuery.ascending('createdAt');
    var messagesList = await msgQuery.find({ useMasterKey: true });

    return {
        success: true,
        shareType: 'regular',
        conversationName: conv.get('customName') || 'Sohbet',
        sharedAt: conv.get('createdAt'),
        messages: messagesList.map(function(m) {
            return {
                text: m.get('text') || '',
                from_email: m.get('from_email') || '',
                is_ai: m.get('is_ai') || false,
                createdAt: m.get('createdAt')
            };
        })
    };
});

Parse.Cloud.define("deleteConversation", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    if (!conversationId) throw new Error('Konuşma ID gerekli!');

    var convQuery = new Parse.Query(Conversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');

    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Bu konuşmayı silme yetkiniz yok!');

    var msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    var messages = await msgQuery.find({ useMasterKey: true });
    for (var di = 0; di < messages.length; di++) {
        await messages[di].destroy({ useMasterKey: true });
    }

    await conv.destroy({ useMasterKey: true });
    return { success: true, message: 'Sohbet ve tüm mesajlar silindi.' };
});

Parse.Cloud.define("sendAIMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    var text = request.params.text;
    var fromEmail = request.params.fromEmail || 'system@vizyon2027.com';
    var fromName = request.params.fromName || '🧠 VİZYON AI';
    if (!conversationId) throw new Error('Konuşma ID gerekli!');
    if (!text) throw new Error('Mesaj metni gerekli!');

    var convQuery = new Parse.Query(Conversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');

    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Bu konuşmaya yetkiniz yok!');

    var msg = new Message();
    msg.set('from_email', fromEmail);
    msg.set('conversationId', conv.id);
    var toEmail = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i] !== fromEmail) {
            toEmail = users[i];
            break;
        }
    }
    if (toEmail) msg.set('to_email', toEmail);
    msg.set('text', filterText(text || ''));
    msg.set('is_read', true);
    msg.set('is_ai', true);
    msg.set('ai_name', fromName);
    await msg.save(null, { useMasterKey: true });

    conv.set('lastMessage', filterText(text || ''));
    conv.set('lastMessageTime', new Date());
    await conv.save(null, { useMasterKey: true });

    return { success: true, messageId: msg.id };
});

// ================================================================
// ========== AI MODELLERİ ==========
// ================================================================
Parse.Cloud.define("callGroq", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('GROQ_KEY');
    if (!key) {
        console.error('❌ GROQ_KEY Config\'de bulunamadı!');
        return null;
    }
    try {
        var res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-instruct",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ Groq HTTP Hatası (' + res.status + '):', JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ Groq API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        return null;
    } catch (e) {
        console.error('❌ Groq Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callDeepSeek", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('DEEPSEEK_KEY');
    if (!key) return null;
    try {
        var res = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ DeepSeek HTTP Hatası (' + res.status + '):', JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ DeepSeek API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        return null;
    } catch (e) {
        console.error('❌ DeepSeek Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callDeepInfra", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('DEEPINFRA_KEY');
    if (!key) {
        console.warn('⚠️ DEEPINFRA_KEY Config\'de bulunamadı!');
        return null;
    }
    try {
        var res = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ DeepInfra HTTP Hatası (' + res.status + '):', JSON.stringify(data).substring(0, 300));
            return null;
        }
        if (data.error) {
            console.error('❌ DeepInfra API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            console.log('✅ DeepInfra başarılı yanıt verdi.');
            return data.choices[0].message.content;
        }
        return null;
    } catch (e) {
        console.error('❌ DeepInfra Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callOpenAI", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('OPENAI_KEY');
    if (!key) return null;
    try {
        var res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ OpenAI HTTP Hatası (' + res.status + '):', JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ OpenAI API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        return null;
    } catch (e) {
        console.error('❌ OpenAI Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callOpenRouter", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('OPENROUTER_KEY');
    if (!key) {
        console.error('❌ OPENROUTER_KEY Config\'de bulunamadı!');
        return null;
    }
    try {
        var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vizyon2026.vercel.app',
                'X-Title': 'Vizyon2027'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ OpenRouter HTTP Hatası (' + res.status + '):', JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ OpenRouter API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        return null;
    } catch (e) {
        console.error('❌ OpenRouter Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callCohere", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('COHERE_KEY');
    if (!key) return null;
    try {
        var res = await fetch("https://api.cohere.ai/v2/chat", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "command-r-plus-08-2024",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ Cohere HTTP Hatası (' + res.status + '):', JSON.stringify(data));
            return null;
        }
        if (data.message && data.message.content && data.message.content[0] && data.message.content[0].text) {
            return data.message.content[0].text;
        }
        if (data.text) return data.text;
        if (data.reply) return data.reply;
        console.error('❌ Cohere API Hata Detayı:', JSON.stringify(data));
        return null;
    } catch (e) {
        console.error('❌ Cohere Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callCerebras", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('CEREBRAS_KEY');
    if (!key) return null;
    try {
        var res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-instruct",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ Cerebras HTTP Hatası (' + res.status + '):', JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ Cerebras API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        return null;
    } catch (e) {
        console.error('❌ Cerebras Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callGitHubModels", async function (request) {
    return null;
});

Parse.Cloud.define("callGemini", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('GEMINI_KEY');
    if (!key) {
        console.error('❌ GEMINI_KEY Config\'de bulunamadı!');
        return null;
    }
    try {
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + key;
        var res = await fetch(url, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                    topK: 40,
                    topP: 0.95
                }
            })
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ Gemini HTTP Hatası (' + res.status + '):', JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ Gemini API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        }
        return null;
    } catch (e) {
        console.error('❌ Gemini Fetch Hatası:', e.message);
        return null;
    }
});

// ================================================================
// ========== callLocalLlama — TÜRKÇE SYSTEM PROMPT'LU v2 =========
// ================================================================
// DEĞİŞİKLİKLER:
//   1. System prompt eklendi → modeller Türkçe konuşacak
//   2. Model bazlı ek talimat (qwen2.5-coder gibi kod modelleri)
//   3. temperature 0.7 → 0.5 (daha tutarlı Türkçe)
//   4. max_tokens 1000 → 2048 (uzun Türkçe cevaplar için)
//   5. Model bazlı sıcaklık (kod için 0.2, sohbet için 0.6)
// ================================================================
Parse.Cloud.define("callLocalLlama", async function (request) {
    var prompt = request.params.prompt;
    var modelName = request.params.model || 'qwen2.5:latest';
    var localUrl = await getAPIKey('COLAB_LLAMA_URL');

    if (!localUrl) {
        console.log('⚠️ COLAB_LLAMA_URL Config\'de yok, Ollama atlanıyor.');
        return null;
    }
    if (localUrl.endsWith('/')) {
        localUrl = localUrl.slice(0, -1);
    }

    // ============================================================
    // MODEL BAZLI PARAMETRE AYARI
    // ============================================================
    var isCodeModel = (
        modelName.indexOf('coder') !== -1 ||
        modelName.indexOf('phi4-mini-reasoning') !== -1 ||
        modelName.indexOf('deepseek-r1') !== -1
    );
    var isVisionModel = modelName.indexOf('vl') !== -1 || modelName.indexOf('vision') !== -1;

    var temperature = isCodeModel ? 0.2 : 0.55;
    var maxTokens = isCodeModel ? 2048 : 1500;
    var topP = isCodeModel ? 0.9 : 0.95;

    // ============================================================
    // TÜRKÇE SYSTEM PROMPT — EN KRİTİK KISIM
    // ============================================================
    // Bu system prompt TÜM Ollama modellerine gönderilir ve
    // modelleri KESİNLİKLE Türkçe cevap vermeye zorlar.
    // ============================================================
    var systemPrompt = 'Sen VİZYON AI\'sın (V27). Türkçe konuşan, samimi ve yardımsever bir yapay zeka asistanısın.\n' +
        '\n' +
        'KESİN KURALLAR:\n' +
        '1. HER ZAMAN TÜRKÇE CEVAP VER. Başka bir dilde cevap verme. İstisna yok.\n' +
        '2. Cevabın doğal ve akıcı Türkçe olsun. Çeviri kokmayan, anadili gibi.\n' +
        '3. "Selam", "Merhaba", "Nasılsın" gibi sorulara samimi ve doğal Türkçe karşılık ver.\n' +
        '4. Teknik terimler hariç İngilizce kelime kullanma. "Hello", "Sure", "Yes", "Of course" gibi İngilizce ifadeler KULLANMA.\n' +
        '5. Kısa, net ve öz ol. Gereksiz uzatma yapma.\n' +
        '6. Emin olmadığın konularda "emin değilim" veya "bilmiyorum" de. Uydurma.\n' +
        '7. Saygılı ve nazik ol. Kullanıcıya "sen" diye hitap et (samimi ortam).\n' +
        '\n' +
        (isCodeModel
            ? 'KOD MODU: Kullanıcı kod istiyorsa, ÇALIŞAN ve EKSİKSİZ kod ver. Kod bloklarını ```dil ... ``` şeklinde yaz. Kod açıklamalarını Türkçe yorum satırı olarak ekle.\n'
            : 'SOHBET MODU: Doğal, akıcı, samimi Türkçe ile cevap ver.\n') +
        '\n' +
        'Şimdi kullanıcının sorusunu Türkçe cevapla:';

    try {
        console.log('🔄 Ollama deneniyor → ' + modelName + ' (temp: ' + temperature + ', max_tokens: ' + maxTokens + ')');

        var response = await Parse.Cloud.httpRequest({
            method: 'POST',
            url: localUrl + '/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ollama',
                'skip_zrok_interstitial': 'true'
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                stream: false,
                temperature: temperature,
                top_p: topP,
                max_tokens: maxTokens,
                repeat_penalty: 1.1,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            }),
            timeout: 120000
        });

        var rawText = '';
        if (response && response.text) {
            rawText = response.text;
        } else if (response && response.buffer) {
            rawText = response.buffer.toString();
        }

        if (!rawText || rawText.length === 0) {
            console.error('❌ Ollama boş yanıt döndü (' + modelName + ').');
            return null;
        }

        var data;
        try {
            data = JSON.parse(rawText);
        } catch (parseErr) {
            console.error('❌ Ollama JSON parse hatası (' + modelName + '):', rawText.substring(0, 200));
            return null;
        }

        if (data.choices &&
            data.choices[0] &&
            data.choices[0].message &&
            data.choices[0].message.content) {
            var reply = data.choices[0].message.content;

            // ============================================================
            // TÜRKÇE ZORLAMA KONTROLÜ (POST-PROCESSING)
            // ============================================================
            var isTurkishResponse = isLikelyTurkish(reply);
            var isGibberish = isLikelyGibberish(reply);

            if ((!isTurkishResponse && reply.length > 50) || isGibberish) {
                console.warn('⚠️ Ollama ' + modelName + ' kaliteli cevap vermedi (Türkçe:' + isTurkishResponse + ', gibberish:' + isGibberish + '), atlanıyor...');
                return null;
            }
            console.log('✅ Ollama BAŞARILI (' + modelName + ') — ' + reply.length + ' karakter, Türkçe: ' + isTurkishResponse);
            return reply;
        }

        if (data.response && typeof data.response === 'string') {
            console.log('✅ Ollama BAŞARILI (response formatı, ' + modelName + ')');
            return data.response;
        }

        console.error('❌ Ollama beklenmedik format (' + modelName + '):', JSON.stringify(data).substring(0, 300));
        return null;

    } catch (e) {
        if (e.message && e.message.indexOf('timeout') !== -1) {
            console.error('❌ Ollama timeout (120s) — ' + modelName + ' — Kaggle uyanmamış olabilir.');
        } else {
            console.error('❌ Ollama bağlantı hatası (' + modelName + '):', e.message);
        }
        return null;
    }
});

// ================================================================
// YARDIMCI: Türkçe cevap mı kontrol et
// ✅ [v7.9.2 FIX] Eksik return eklendi, boş satır düzeltildi
// ================================================================
function isLikelyTurkish(text) {
    if (!text || text.length < 5) return true;

    var turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
    if (turkishChars.test(text)) return true;

    var lower = text.toLowerCase();
    var turkishWords = [
        'bir', 'bu', 've', 'için', 'ile', 'olarak', 'daha', 'çok', 'var',
        'yok', 'değil', 'evet', 'hayır', 'tamam', 'merhaba', 'selam',
        'nasıl', 'neden', 'niçin', 'nerede', 'kim', 'ne', 'zaman',
        'iyi', 'kötü', 'güzel', 'kötü', 'yardım', 'yardımcı', 'olabilir',
        'yapabilir', 'istiyorum', 'isterim', 'teşekkür', 'lütfen', 'tabi',
        'elbette', 'kesinlikle', 'belki', 'ancak', 'fakat', 'ama', 'veya',
        'çünkü', 'eğer', 'şey', 'şimdi', 'sonra', 'önce', 'gibi', 'kadar',
        'ise', 'olduğu', 'olduğunu', 'yapmak', 'etmek', 'olmak', 'gelmek',
        'gitmek', 'almak', 'vermek', 'bakmak', 'görmek', 'bilmek'
    ];

    var matchCount = 0;
    for (var i = 0; i < turkishWords.length; i++) {
        var regex = new RegExp('\\b' + turkishWords[i] + '\\b', 'i');
        if (regex.test(lower)) {
            matchCount++;
            if (matchCount >= 2) return true;
        }
    }

    return false;
}

// ================================================================
// YARDIMCI: Anlamsız cevap mı kontrol et (yeni)
// ================================================================
function isLikelyGibberish(text) {
    if (!text || text.length < 20) return false;

    var words = text.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 2; });
    if (words.length < 3) return false;

    var consonantClusters = text.match(/[bcçdfghjklmnprsştvyz]{5,}/gi);
    if (consonantClusters && consonantClusters.length > 1) return true;

    var shortWordCount = words.filter(function(w) { return w.length <= 3; }).length;
    if (shortWordCount / words.length > 0.7) return true;

    if (/(.)\1{4,}/.test(text)) return true;

    var wordCounts = {};
    words.forEach(function(w) { wordCounts[w] = (wordCounts[w] || 0) + 1; });
    for (var w in wordCounts) {
        if (wordCounts[w] >= 4 && w.length <= 5) return true;
    }

    return false;
}

// ================================================================
// ========== NVIDIA NIM API ÇAĞRISI (fetch ile — GÜNCEL) ==========
// ================================================================
Parse.Cloud.define("callNvidiaNIM", async function (request) {
    var prompt = request.params.prompt;
    var modelId = request.params.model || 'meta/llama-3.2-3b-instruct';
    var maxTokens = request.params.maxTokens || 2048;

    if (!prompt) {
        console.error('❌ callNvidiaNIM: prompt eksik');
        return null;
    }

    var apiKey = await getAPIKey('NVIDIA_API_KEY');
    var baseUrl = await getAPIKey('NVIDIA_BASE_URL');

    if (!apiKey) {
        console.error('❌ NVIDIA_API_KEY Config\'de yok!');
        return null;
    }
    if (!baseUrl) {
        baseUrl = 'https://integrate.api.nvidia.com/v1';
    }

    // Türkçe system prompt
    var systemPrompt = 'Sen VİZYON AI\'sın (V27). Türkçe konuşan, samimi ve yardımsever bir yapay zeka asistanısın.\n' +
        'KESİN KURAL: HER ZAMAN TÜRKÇE CEVAP VER. Başka bir dilde cevap verme.\n' +
        'Doğal ve akıcı Türkçe kullan. Kısa, net ve öz ol.';

    try {
        console.log('🔄 NVIDIA NIM deneniyor → ' + modelId);

        var response = await fetch(baseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.55,
                top_p: 0.95,
                max_tokens: maxTokens,
                stream: false
            })
        });

        var rawText = await response.text();

        if (!rawText || rawText.length === 0) {
            console.error('❌ NVIDIA NIM boş yanıt döndü (' + modelId + ')');
            return null;
        }

        var data;
        try {
            data = JSON.parse(rawText);
        } catch (parseErr) {
            console.error('❌ NVIDIA NIM JSON parse hatası:', rawText.substring(0, 200));
            return null;
        }

        if (!response.ok) {
            var errMsg = 'HTTP ' + response.status;
            if (data.error) {
                errMsg += ': ' + (data.error.message || JSON.stringify(data.error));
            }
            console.error('❌ NVIDIA NIM HTTP hatası (' + modelId + '): ' + errMsg);
            return null;
        }

        if (data.error) {
            console.error('❌ NVIDIA NIM API hatası (' + modelId + '):', JSON.stringify(data.error));
            return null;
        }

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            var reply = data.choices[0].message.content;
            console.log('✅ NVIDIA NIM BAŞARILI (' + modelId + ') — ' + reply.length + ' karakter');
            return reply;
        }

        console.error('❌ NVIDIA NIM beklenmedik format:', JSON.stringify(data).substring(0, 300));
        return null;

    } catch (e) {
        var errMsg = e.message || 'Bilinmeyen hata';
        console.error('❌ NVIDIA NIM bağlantı hatası (' + modelId + '): ' + errMsg);
        return null;
    }
});

// ================================================================
// ========== callCustomAI - Kullanıcının kendi API'si ==========
// ================================================================
Parse.Cloud.define("callCustomAI", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var prompt = request.params.prompt;
    if (!prompt) throw new Error('Prompt gerekli!');

    var query = new Parse.Query(UserApiKey);
    query.equalTo('user_email', user.get('email'));
    query.descending('createdAtClient');
    var apiKeyRecord = await query.first({ useMasterKey: true });
    if (!apiKeyRecord) {
        return { success: false, error: 'Kayıtlı API anahtarınız yok. Lütfen önce API ekleyin.' };
    }

    var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) {
        return { success: false, error: 'Sunucu şifreleme anahtarı eksik.' };
    }

    var rawValue = '';
    try {
        rawValue = smartDecrypt(apiKeyRecord.get('encryptedValue'), encryptionKey);
    } catch (e) {
        return { success: false, error: 'API anahtarı çözülemedi.' };
    }
    if (!rawValue) {
        return { success: false, error: 'API anahtarı boş.' };
    }

    var result = await callCustomAIWithSingleKey(apiKeyRecord.get('name') || '', rawValue, prompt);
    return result;
});

Parse.Cloud.define("callCustomAIWithKeys", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var prompt = request.params.prompt;
    var keyIds = request.params.keyIds;
    if (!prompt) throw new Error('Prompt gerekli!');

    var query = new Parse.Query(UserApiKey);
    query.equalTo('user_email', user.get('email'));
    query.descending('createdAtClient');
    var allKeys = await query.find({ useMasterKey: true });

    if (!allKeys || allKeys.length === 0) {
        return { success: false, error: 'Kayıtlı API anahtarınız yok. Lütfen önce API ekleyin.' };
    }

    var selectedKeys;
    if (keyIds === 'all' || !keyIds) {
        selectedKeys = allKeys;
    } else if (Array.isArray(keyIds)) {
        selectedKeys = allKeys.filter(function (k) {
            return keyIds.indexOf(k.id) !== -1;
        });
        if (selectedKeys.length === 0) {
            return { success: false, error: 'Seçilen anahtarlar bulunamadı.' };
        }
    } else {
        return { success: false, error: 'Geçersiz keyIds parametresi.' };
    }

    var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) {
        return { success: false, error: 'Sunucu şifreleme anahtarı eksik.' };
    }

    var errors = [];

    for (var i = 0; i < selectedKeys.length; i++) {
        var keyRecord = selectedKeys[i];
        var keyName = keyRecord.get('name') || '';
        var rawValue = '';
        try {
            rawValue = smartDecrypt(keyRecord.get('encryptedValue'), encryptionKey);
        } catch (e) {
            errors.push(keyName + ': Şifre çözülemedi');
            continue;
        }
        if (!rawValue) {
            errors.push(keyName + ': Boş anahtar');
            continue;
        }

        try {
            var singleResult = await callCustomAIWithSingleKey(keyName, rawValue, prompt);
            if (singleResult && singleResult.success && singleResult.reply) {
                console.log('✅ Anahtar başarılı: ' + keyName);
                return {
                    success: true,
                    reply: singleResult.reply,
                    usedKeyName: keyName,
                    usedKeyId: keyRecord.id,
                    triedCount: i + 1,
                    totalCount: selectedKeys.length
                };
            } else {
                var errMsg = (singleResult && singleResult.error) ? singleResult.error : 'Bilinmeyen hata';
                errors.push(keyName + ': ' + errMsg);
                console.warn('⚠️ Anahtar başarısız (' + keyName + '): ' + errMsg);
            }
        } catch (e) {
            errors.push(keyName + ': ' + e.message);
            console.warn('❌ Anahtar hata (' + keyName + '): ' + e.message);
        }
    }

    return {
        success: false,
        error: 'Tüm anahtarlar başarısız oldu. Hatalar: ' + errors.join(' | '),
        triedCount: selectedKeys.length
    };
});

async function callCustomAIWithSingleKey(keyName, rawValue, prompt) {
    var lname = (keyName || '').toLowerCase();
    var targetUrl = '';
    var model = '';
    var authHeader = 'Bearer ' + rawValue;
    var requestBody = null;
    var customHeaders = { 'Content-Type': 'application/json' };

    if (lname.indexOf('deepinfra') !== -1) {
        targetUrl = 'https://api.deepinfra.com/v1/openai/chat/completions';
        model = 'meta-llama/Meta-Llama-3.1-70B-Instruct';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('openai') !== -1 || lname.indexOf('gpt') !== -1) {
        targetUrl = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-4o-mini';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('anthropic') !== -1 || lname.indexOf('claude') !== -1) {
        targetUrl = 'https://api.anthropic.com/v1/messages';
        model = 'claude-3-5-sonnet-20241022';
        authHeader = null;
        customHeaders['x-api-key'] = rawValue;
        customHeaders['anthropic-version'] = '2023-06-01';
        requestBody = {
            model: model,
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        };
    }
    else if (lname.indexOf('groq') !== -1) {
        targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
        model = 'llama-3.3-70b-instruct';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('deepseek') !== -1 || lname.indexOf('deep') !== -1) {
        targetUrl = 'https://api.deepseek.com/v1/chat/completions';
        model = 'deepseek-chat';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('gemini') !== -1 || lname.indexOf('google') !== -1) {
        targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + rawValue;
        authHeader = null;
        requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        };
    }
    else if (lname.indexOf('openrouter') !== -1 || lname.indexOf('router') !== -1) {
        targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
        model = 'meta-llama/llama-3.1-8b-instruct:free';
        customHeaders['HTTP-Referer'] = 'https://vizyon2026.vercel.app';
        customHeaders['X-Title'] = 'Vizyon2027';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('cohere') !== -1) {
        targetUrl = 'https://api.cohere.ai/v2/chat';
        model = 'command-r-plus-08-2024';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('cerebras') !== -1) {
        targetUrl = 'https://api.cerebras.ai/v1/chat/completions';
        model = 'llama-3.3-70b-instruct';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('mistral') !== -1) {
        targetUrl = 'https://api.mistral.ai/v1/chat/completions';
        model = 'mistral-large-latest';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('perplexity') !== -1) {
        targetUrl = 'https://api.perplexity.ai/chat/completions';
        model = 'llama-3.1-sonar-small-128k-online';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('together') !== -1) {
        targetUrl = 'https://api.together.xyz/v1/chat/completions';
        model = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('fireworks') !== -1) {
        targetUrl = 'https://api.fireworks.ai/inference/v1/chat/completions';
        model = 'accounts/fireworks/models/llama-v3p3-70b-instruct';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else if (lname.indexOf('anyscale') !== -1) {
        targetUrl = 'https://api.endpoints.anyscale.com/v1/chat/completions';
        model = 'meta-llama/Llama-3-70b-chat-hf';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    }
    else {
        return { success: false, error: 'API anahtarı tipi algılanamadı. Sanal isme "openai", "anthropic", "groq", "deepseek", "gemini", "openrouter", "cohere", "cerebras", "mistral", "perplexity", "together", "fireworks", "anyscale" veya "deepinfra" yazın.' };
    }

    try {
        var fetchHeaders = { 'Content-Type': 'application/json' };
        if (authHeader) fetchHeaders['Authorization'] = authHeader;
        for (var hk in customHeaders) {
            if (hk !== 'Content-Type' && customHeaders[hk]) {
                fetchHeaders[hk] = customHeaders[hk];
            }
        }
        var res = await fetch(targetUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(requestBody)
        });
        var data = await res.json();
        if (!res.ok) {
            console.error('❌ Custom AI HTTP Hatası:', JSON.stringify(data));
            return { success: false, error: 'HTTP ' + res.status + ': ' + JSON.stringify(data).substring(0, 200) };
        }
        if (data.error) {
            return { success: false, error: JSON.stringify(data.error).substring(0, 200) };
        }
        var reply = null;
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) reply = data.choices[0].message.content;
        else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) reply = data.candidates[0].content.parts[0].text;
        else if (data.message && data.message.content && data.message.content[0] && data.message.content[0].text) reply = data.message.content[0].text;
        else if (data.content && data.content[0] && data.content[0].text) reply = data.content[0].text;

        if (reply) {
            return { success: true, reply: cleanResponse(reply) };
        }
        return { success: false, error: 'Yanıt alınamadı.' };
    } catch (e) {
        console.error('❌ Custom AI Fetch Hatası:', e.message);
        return { success: false, error: e.message };
    }
}

// ================================================================
// ========== superAI — 13 Ollama + NVIDIA NIM + 8 API ============
// ================================================================
Parse.Cloud.define("superAI", async function (request) {
    var prompt = request.params.prompt;
    if (!prompt) return 'Lütfen bir soru girin.';

    // ============================================================
    // TÜRKÇE TALEP TESPİTİ
    // ============================================================
    var isTurkishRequest = isLikelyTurkish(prompt);

    // Türkçe ise tüm API modellerine de Türkçe talimat ekle
    var turkishInstruction = '';
    if (isTurkishRequest) {
        turkishInstruction = 'ÖNEMLİ: Sana Türkçe soru soruluyor. Cevabını KESİNLİKLE TÜRKÇE ver. ' +
            'İngilizce cevap verme. Doğal ve akıcı Türkçe kullan.\n\n';
    }

    var lp = prompt.toLowerCase();
    if (lp.indexOf('dolar') !== -1 || lp.indexOf('haber') !== -1 ||
        lp.indexOf('arama') !== -1 || lp.indexOf('hava') !== -1) {
        try {
            var result = await Parse.Cloud.run("webSearch", { query: prompt }, { useMasterKey: true });
            if (result && result.indexOf('tanımlanmamış') === -1 && result.indexOf('yapılamadı') === -1) {
                return cleanResponse(result);
            }
        } catch (e) {
            console.error('Web arama hatası:', e.message);
        }
    }

    // API modelleri için Türkçe talimatlı prompt hazırla
    var apiPrompt = turkishInstruction ? (turkishInstruction + prompt) : prompt;

    // ============================================================
    // KATMAN 1: 13 OLLAMA MODELİ (Türkçe system prompt callLocalLlama'da)
    // ============================================================
    var ollamaModels = [
        'qwen2.5:latest',              // ← Önce büyük, kaliteli Türkçe
        'qwen3:8b',
        'llama3.2:latest',
        'gemma3:4b',
        'mistral:latest',
        'qwen3:4b',
        'gemma2:latest',
        'phi3.5:latest',
        'deepseek-r1:latest',
        'qwen2.5-coder:latest',
        'phi4-mini-reasoning:latest',
        'qwen2.5vl:3b',
        'granite3.3:2b'                // ← En son, çaresiz kalırsa
    ];

    var localUrl = await getAPIKey('COLAB_LLAMA_URL');
    if (localUrl) {
        console.log('🔄 KATMAN 1 - Ollama: 13 model sırayla denenecek... (URL: ' + localUrl + ')');
        for (var om = 0; om < ollamaModels.length; om++) {
            try {
                console.log('🔄 Ollama [' + (om + 1) + '/' + ollamaModels.length + ']: ' + ollamaModels[om]);
                var localReply = await Parse.Cloud.run('callLocalLlama', {
                    prompt: prompt,          // ← ham prompt (system prompt callLocalLlama içinde ekleniyor)
                    model: ollamaModels[om]
                }, { useMasterKey: true });

                if (localReply && localReply.length > 10) {
                    console.log('✅ OLLAMA BAŞARILI: ' + ollamaModels[om]);
                    return cleanResponse(localReply);
                } else {
                    console.log('⚠️ Ollama ' + ollamaModels[om] + ' yanıt vermedi veya Türkçe değil, sıradaki...');
                }
            } catch (e) {
                console.warn('⚠️ Ollama ' + ollamaModels[om] + ' başarısız:', e.message);
            }
        }
        console.log('⚠️ Tüm Ollama modelleri başarısız, KATMAN 2 (NVIDIA NIM) geçiliyor...');
    } else {
        console.log('⚠️ COLAB_LLAMA_URL yok, KATMAN 2 (NVIDIA NIM) geçiliyor...');
    }

    // ============================================================
    // KATMAN 2: NVIDIA NIM (Türkçe talimatlı prompt ile)
    // ============================================================
    var nvidiaModels = [
        'meta/llama-3.3-70b-instruct',
        'meta/llama-3.1-8b-instruct',
        'qwen/qwen2.5-7b-instruct',
        'qwen/qwen2.5-coder-32b-instruct',
        'deepseek-ai/deepseek-r1-distill-llama-8b',
        'google/gemma-2-2b-instruct',
        'microsoft/phi-3.5-moe-instruct'
    ];

    var nvidiaKey = await getAPIKey('NVIDIA_API_KEY');
    if (nvidiaKey) {
        console.log('🔄 KATMAN 2 - NVIDIA NIM: ' + nvidiaModels.length + ' model sırayla denenecek...');
        for (var nm = 0; nm < nvidiaModels.length; nm++) {
            try {
                console.log('🔄 NIM [' + (nm + 1) + '/' + nvidiaModels.length + ']: ' + nvidiaModels[nm]);
                var nvidiaReply = await Parse.Cloud.run('callNvidiaNIM', {
                    prompt: apiPrompt,       // ← Türkçe talimatlı prompt
                    model: nvidiaModels[nm]
                }, { useMasterKey: true });

                if (nvidiaReply && nvidiaReply.length > 10) {
                    console.log('✅ NIM BAŞARILI: ' + nvidiaModels[nm]);
                    return cleanResponse(nvidiaReply);
                }
            } catch (e) {
                console.warn('⚠️ NIM ' + nvidiaModels[nm] + ' başarısız:', e.message);
            }
        }
        console.log('⚠️ Tüm NIM modelleri başarısız, KATMAN 3 (Bulut API) geçiliyor...');
    } else {
        console.log('⚠️ NVIDIA_API_KEY yok, KATMAN 3 (Bulut API) geçiliyor...');
    }

    // ============================================================
    // KATMAN 3: 8 Bulut API (Türkçe talimatlı prompt ile)
    // ============================================================
    var apiModels = [
        'callGroq',
        'callGemini',
        'callDeepSeek',
        'callDeepInfra',
        'callOpenAI',
        'callCerebras',
        'callOpenRouter',
        'callCohere'
    ];

    for (var mi = 0; mi < apiModels.length; mi++) {
        var model = apiModels[mi];
        try {
            console.log('🔄 ' + model + ' deneniyor...');
            var result2 = await Parse.Cloud.run(model, { prompt: apiPrompt }, { useMasterKey: true });
            if (result2 && result2.length > 10) {
                console.log('✅ ' + model + ' başarılı yanıt verdi.');
                return cleanResponse(result2);
            }
        } catch (e) {
            console.error('❌ ' + model + ' çağrısı başarısız:', e.message);
        }
    }

    return '🧠 VİZYON AI: Üzgünüm, tüm modeller şu anda cevap veremiyor. Lütfen daha sonra tekrar deneyin.';
});

// ================================================================
// ========== webSearch - Google Custom Search fallback ==========
// ================================================================
Parse.Cloud.define("webSearch", async function (request) {
    var query = request.params.query;
    if (!query) return 'Arama sorgusu boş.';

    var serpKey = await getAPIKey('SERPAPI_KEY');
    if (serpKey) {
        try {
            var url = 'https://serpapi.com/search.json?q=' + encodeURIComponent(query) + '&hl=tr&gl=tr&api_key=' + serpKey;
            var res = await fetch(url);
            var data = await res.json();
            if (!data.error && (data.answer_box || (data.organic_results && data.organic_results.length > 0))) {
                var result = '🌐 Arama Sonuçları (SerpAPI):\n\n';
                if (data.answer_box) {
                    result += '⚡ ' + (data.answer_box.answer || data.answer_box.snippet) + '\n\n';
                }
                if (data.organic_results && data.organic_results.length) {
                    for (var i = 0; i < Math.min(3, data.organic_results.length); i++) {
                        var r = data.organic_results[i];
                        result += r.title + '\n' + r.snippet + '\n\n';
                    }
                }
                console.log('✅ SerpAPI başarılı');
                return result;
            } else {
                console.warn('⚠️ SerpAPI sonuç vermedi, Google fallback deneniyor...');
            }
        } catch (e) {
            console.error('SerpAPI hatası:', e.message);
        }
    } else {
        console.warn('⚠️ SERPAPI_KEY yok');
    }

    var googleKey = await getAPIKey('GOOGLE_SEARCH_KEY');
    var googleCx = await getAPIKey('GOOGLE_SEARCH_CX');
    if (googleKey && googleCx) {
        try {
            var googleUrl = 'https://www.googleapis.com/customsearch/v1?key=' + googleKey + '&cx=' + googleCx + '&q=' + encodeURIComponent(query) + '&hl=tr&gl=tr&num=3';
            var gRes = await fetch(googleUrl);
            var gData = await gRes.json();
            if (!gData.error && gData.items && gData.items.length > 0) {
                var gResult = '🌐 Arama Sonuçları (Google):\n\n';
                for (var gi = 0; gi < Math.min(3, gData.items.length); gi++) {
                    var item = gData.items[gi];
                    gResult += item.title + '\n' + item.snippet + '\n' + (item.link || '') + '\n\n';
                }
                console.log('✅ Google Custom Search başarılı');
                return gResult;
            } else if (gData.error) {
                console.error('Google CSE hatası:', gData.error.message);
            }
        } catch (e) {
            console.error('Google CSE hatası:', e.message);
        }
    } else {
        console.warn('⚠️ GOOGLE_SEARCH_KEY veya GOOGLE_SEARCH_CX yok');
    }

    console.warn('⚠️ Hiçbir arama motoru çalışmadı.');
    return '"' + query + '" için arama yapılamadı. Lütfen daha sonra tekrar deneyin.';
});

// ================================================================
// ========== sendEmail - HİBRİT (Google Apps Script + Resend) ===
// ================================================================
Parse.Cloud.define("sendEmail", async function (request) {
    var to = request.params.to;
    var subject = request.params.subject;
    var html = request.params.html;

    if (!request.master && !request.user) {
        throw new Error('Yetkisiz erişim!');
    }

    if (!request.master) {
        var _rlk = 'sendEmail:' + (to || 'unknown').toLowerCase();
        await checkRateLimit(_rlk);
        await recordAttempt(_rlk);
    }

    if (!to) return { success: false, error: 'Alıcı e-posta adresi gerekli!' };
    if (!subject) return { success: false, error: 'Konu gerekli!' };
    if (!html) return { success: false, error: 'İçerik gerekli!' };

    console.log('📧 E-posta gönderiliyor → ' + to);

    var googleResult = await tryGoogleAppsScript(to, subject, html);
    if (googleResult.success) {
        console.log('✅ [Google Apps Script] Mail başarıyla gönderildi → ' + to);
        return {
            success: true,
            provider: 'google',
            message: 'Mail gönderildi (Google Apps Script)',
            id: googleResult.id || null
        };
    } else {
        console.warn('⚠️ [Google Apps Script] Başarısız: ' + googleResult.error);
    }

    var resendResult = await tryResend(to, subject, html);
    if (resendResult.success) {
        console.log('✅ [Resend] Mail başarıyla gönderildi → ' + to);
        return {
            success: true,
            provider: 'resend',
            message: 'Mail gönderildi (Resend)',
            id: resendResult.id || null
        };
    } else {
        console.warn('⚠️ [Resend] Başarısız: ' + resendResult.error);
    }

    console.error('❌ Her iki mail servisi de başarısız oldu!');
    return {
        success: false,
        error: 'Her iki mail servisi de başarısız oldu.\n' +
               'Google: ' + (googleResult.error || 'bilinmiyor') + '\n' +
               'Resend: ' + (resendResult.error || 'bilinmiyor')
    };
});

async function tryGoogleAppsScript(to, subject, html) {
    try {
        var url = await getAPIKey('GOOGLE_SCRIPT_URL');
        if (!url) {
            return { success: false, error: 'GOOGLE_SCRIPT_URL Config\'de yok' };
        }

        var response = await Parse.Cloud.httpRequest({
            method: 'POST',
            url: url,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: to,
                subject: subject,
                html: html
            }),
            followRedirects: true,
            redirectCount: 5
        });

        var rawText = '';
        if (response.text) {
            rawText = response.text;
        } else if (response.buffer) {
            rawText = response.buffer.toString();
        }

        console.log('📬 [Google] Yanıt (ilk 200 karakter):', rawText.substring(0, 200));

        if (!rawText || rawText.trim().length === 0) {
            return { success: false, error: 'Boş yanıt döndü' };
        }

        var trimmed = rawText.trim();

        if (trimmed.charAt(0) === '<' ||
            trimmed.indexOf('<!DOCTYPE') === 0 ||
            trimmed.indexOf('<html') !== -1 ||
            trimmed.indexOf('<!doctype') !== -1) {
            return { success: false, error: 'HTML hata sayfası döndü (deploy sorunu)' };
        }

        var data;
        try {
            data = JSON.parse(trimmed);
        } catch (parseErr) {
            return { success: false, error: 'Geçersiz JSON: ' + trimmed.substring(0, 80) };
        }

        if (data && (data.success === true || data.success === 'true' || data.ok === true)) {
            return { success: true, id: data.id || null };
        } else if (data && data.error) {
            return { success: false, error: data.error };
        } else {
            return { success: true, id: null };
        }

    } catch (e) {
        return { success: false, error: 'HTTP hatası: ' + e.message };
    }
}

async function tryResend(to, subject, html) {
    try {
        var apiKey = await getAPIKey('RESEND_API_KEY');
        if (!apiKey) {
            return { success: false, error: 'RESEND_API_KEY Config\'de yok' };
        }

        var response = await Parse.Cloud.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/emails',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Vizyon2027 <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html
            }),
            followRedirects: true
        });

        var rawText = '';
        if (response.text) {
            rawText = response.text;
        } else if (response.buffer) {
            rawText = response.buffer.toString();
        }

        console.log('📬 [Resend] Yanıt (ilk 200 karakter):', rawText.substring(0, 200));

        if (!rawText || rawText.trim().length === 0) {
            return { success: false, error: 'Boş yanıt döndü' };
        }

        var data;
        try {
            data = JSON.parse(rawText.trim());
        } catch (parseErr) {
            return { success: false, error: 'Geçersiz JSON: ' + rawText.substring(0, 80) };
        }

        var status = response.status || 200;
        if (status >= 200 && status < 300 && data.id) {
            return { success: true, id: data.id };
        } else {
            return {
                success: false,
                error: 'Resend hatası (HTTP ' + status + '): ' + (data.message || JSON.stringify(data).substring(0, 100))
            };
        }

    } catch (e) {
        return { success: false, error: 'HTTP hatası: ' + e.message };
    }
}

// ================================================================
// ===== [v7.9.2 YENİ] getSiteInfoForVizyonAl ====================
// ================================================================
// Vizyon Al paneli için site hakkında özet içerik döndürür.
// ================================================================
Parse.Cloud.define("getSiteInfoForVizyonAl", async function (request) {
    try {
        var content = await getSiteContent();
        return {
            success: true,
            content: content || 'Site içeriği alınamadı.',
            version: 'v7.9.2',
            features: [
                '21 farklı AI modeli (13 Ollama + 8 bulut)',
                'V27 API anahtarı sistemi',
                'V27 Koç Asistanı',
                'Vizyon Al Paneli (4 mod)',
                '3D Stüdyo (90+ şekil)',
                'Takım çalışması',
                'Aylık yarışma',
                'V27 Akademi',
                'Puan mağazası',
                'Ebeveyn kontrolü',
                'Moderatör / Tasarımcı rütbesi'
            ]
        };
    } catch (e) {
        console.error('getSiteInfoForVizyonAl hatası:', e);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.9.2 YENİ] vizyonAlChat — VİZYON AL ANA CHAT =========
// ================================================================
// Mod parametreli:
//   - 'normal'    → Tüm modeller eşit, standart
//   - 'deep'      → Derin düşünme, uzun düşünür, internette gezer
//   - 'agent'     → Ajan modu, her siteye girer, her işlemi yapar
//   - 'developer' → Yazılımcı, en iyi kod üretimi
// ================================================================
Parse.Cloud.define("vizyonAlChat", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var message = request.params.message;
    var mode = request.params.mode || 'normal';
    if (!message || !message.trim()) throw new Error('Mesaj gerekli!');
    if (message.length > 4000) throw new Error('Mesaj çok uzun (max 4000 karakter).');

    // Mod kontrolü
    if (['normal', 'deep', 'agent', 'developer'].indexOf(mode) === -1) {
        mode = 'normal';
    }

    // Rate limit
    var _rlk = 'vizyonAlChat:' + user.get('email');
    try {
        await checkRateLimit(_rlk, 30, 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) {
        console.warn('Rate limit uyarısı:', e.message);
    }

    // Site içeriği (deep ve agent için)
    var siteContext = '';
    if (mode === 'deep' || mode === 'agent' || mode === 'developer') {
        try {
            siteContext = await getSiteContent();
            if (siteContext && siteContext.length > 2000) {
                siteContext = siteContext.substring(0, 2000);
            }
        } catch (e) {
            console.warn('Site içeriği alınamadı:', e.message);
        }
    }

    // Mod'a göre system prompt
    var systemPrompt = '';
    if (mode === 'deep') {
        systemPrompt = 'Sen VİZYON AL\'sın ve şu an DERİN DÜŞÜNME MODUNDASIN.\n\n' +
            'KURALLAR:\n' +
            '1. Önce çok uzun ve derin düşün. İnternette gez, bilgileri topla.\n' +
            '2. Düşünme sürecini "DÜŞÜNÜYORUM:" başlığı altında detaylıca yaz.\n' +
            '3. Sonra net ve kapsamlı bir cevap ver.\n' +
            '4. HER ZAMAN TÜRKÇE. Doğal, akıcı, samimi Türkçe.\n' +
            '5. Emin olmadığın şeyleri "emin değilim" diye belirt.\n\n' +
            'VİZYON2027 Sitesi Hakkında Bilgiler (referans olarak kullan):\n' + siteContext + '\n\n' +
            'Şimdi kullanıcının sorusunu derinlemesine düşünerek Türkçe cevapla:';
    } else if (mode === 'agent') {
        systemPrompt = 'Sen VİZYON AL\'sın ve şu an AJAN MODUNDASIN.\n\n' +
            'KURALLAR:\n' +
            '1. Her siteye girebilir, her işlemi yapabilirsin (form doldurma, tıklama vs).\n' +
            '2. Kullanıcı sana bir görev verirse, o görevi yapmak için adımları sırala.\n' +
            '3. HER ZAMAN TÜRKÇE. Doğal, akıcı, samimi Türkçe.\n' +
            '4. Görev tamamlanınca sonucu bildir.\n\n' +
            'VİZYON2027 Sitesi Hakkında Bilgiler:\n' + siteContext + '\n\n' +
            'Şimdi kullanıcının görevini Türkçe olarak açıkla ve adımları yaz:';
    } else if (mode === 'developer') {
        systemPrompt = 'Sen VİZYON AL\'sın ve şu an YAZILIMCI MODUNDASIN.\n\n' +
            'KURALLAR:\n' +
            '1. En iyi kod üretimini sağla. Her türlü dilde (Python, JavaScript, React, SQL, C#, Go, Rust vs.).\n' +
            '2. Kod bloklarını ```dil ... ``` şeklinde ver.\n' +
            '3. Çalışan, eksiksiz, test edilebilir kod ver.\n' +
            '4. Hata ayıklama ve optimizasyon önerileri sun.\n' +
            '5. HER ZAMAN TÜRKÇE. Kod dışındaki açıklamalar Türkçe olsun.\n\n' +
            'VİZYON2027 Sitesi Hakkında Bilgiler:\n' + siteContext + '\n\n' +
            'Şimdi kullanıcının kod talebine Türkçe açıklamalı cevap ver:';
    } else {
        // normal
        systemPrompt = 'Sen VİZYON AL\'sın (VİZYON2027 AI Asistanı).\n\n' +
            'KURALLAR:\n' +
            '1. HER ZAMAN TÜRKÇE. Başka dilde cevap verme.\n' +
            '2. Doğal, akıcı, samimi Türkçe.\n' +
            '3. Kısa, net ve öz ol. Gereksiz uzatma yapma.\n' +
            '4. Emin olmadığın şeylerde "emin değilim" de.\n' +
            '5. Site hakkında soru sorulursa bilgi verebilirsin.\n\n' +
            'Şimdi kullanıcının sorusunu Türkçe cevapla:';
    }

    var fullPrompt = systemPrompt + '\n\nKullanıcı: ' + message;

    // superAI ile cevap üret
    try {
        var reply = await Parse.Cloud.run('superAI', { prompt: fullPrompt }, { useMasterKey: true });
        if (!reply || reply.length < 2) {
            reply = 'Şu anda cevap veremiyorum. Lütfen tekrar dene.';
        }
        return {
            success: true,
            reply: cleanResponse(reply),
            mode: mode,
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        console.error('vizyonAlChat hatası:', e.message);
        return {
            success: false,
            error: 'Vizyon Al cevap veremedi: ' + e.message
        };
    }
});

// ================================================================
// ===== [v7.9.2 YENİ] vizyonAlDeepThink =========================
// ================================================================
Parse.Cloud.define("vizyonAlDeepThink", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');

    try {
        var result = await Parse.Cloud.run('vizyonAlChat', {
            message: message,
            mode: 'deep'
        }, { useMasterKey: true });
        return result;
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.9.2 YENİ] vizyonAlAgent =============================
// ================================================================
Parse.Cloud.define("vizyonAlAgent", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');

    try {
        var result = await Parse.Cloud.run('vizyonAlChat', {
            message: message,
            mode: 'agent'
        }, { useMasterKey: true });
        return result;
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.9.2 YENİ] vizyonAlDeveloper =========================
// ================================================================
Parse.Cloud.define("vizyonAlDeveloper", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');

    try {
        var result = await Parse.Cloud.run('vizyonAlChat', {
            message: message,
            mode: 'developer'
        }, { useMasterKey: true });
        return result;
    } catch (e) {
        return { success: false, error: e.message };
    }
});


// ================================================================
// ===== [v7.9.2 YENİ] vizyonAlScreenRead ========================
// ================================================================
// Ekran görüntüsünü (base64 jpeg) Gemini 2.0 Flash vision'a
// gönderip analiz ettirir.
// ================================================================
Parse.Cloud.define("vizyonAlScreenRead", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var imageBase64 = request.params.imageBase64;
    var question = request.params.question || 'Ekranda ne görüyorsun? Detaylıca açıkla, varsa metinleri oku, butonları tanımla.';

    if (!imageBase64) throw new Error('Görüntü (imageBase64) gerekli!');
    if (imageBase64.length > 8000000) throw new Error('Görüntü çok büyük (max 8MB).');

    var _rlk = 'vizyonAlScreenRead:' + user.get('email');
    try {
        await checkRateLimit(_rlk, 20, 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) {
        console.warn('Rate limit uyarısı:', e.message);
    }

    var key = await getAPIKey('GEMINI_KEY');
    if (!key) {
        return { success: false, error: 'GEMINI_KEY Config\'de tanımlı değil!' };
    }

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + key;

    try {
        console.log('🖥️ Ekran görüntüsü Gemini Vision\'a gönderiliyor...');
        var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: question },
                        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
                    ]
                }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
            })
        });

        var data = await res.json();
        if (!res.ok || data.error) {
            return { success: false, error: (data.error && data.error.message) || 'HTTP ' + res.status };
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content &&
            data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text) {
            return { success: true, reply: data.candidates[0].content.parts[0].text };
        }
        return { success: false, error: 'Beklenmedik format' };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.9.2 YENİ] vizyonAlLiveScreenStream ==================
// ================================================================
// Canlı ekran modu: Değişen kareyi analiz eder, yorum yapar.
// ================================================================
Parse.Cloud.define("vizyonAlLiveScreenStream", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var imageBase64 = request.params.imageBase64;
    var previousDescription = request.params.previousDescription || '';
    var mode = request.params.mode || 'normal';

    if (!imageBase64) throw new Error('Görüntü gerekli!');
    if (imageBase64.length > 3000000) throw new Error('Kare çok büyük (max 3MB).');

    var _rlk = 'vizyonAlLiveScreen:' + user.get('email');
    try {
        await checkRateLimit(_rlk, 30, 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) {
        return { success: false, error: 'Çok hızlı. Biraz yavaşla.', rateLimited: true };
    }

    var key = await getAPIKey('GEMINI_KEY');
    if (!key) {
        return { success: false, error: 'GEMINI_KEY eksik.' };
    }

    var question = '';
    if (mode === 'deep') {
        question = 'Bu ekranda ne oluyor? Derinlemesine analiz et, sebep-sonuç ilişkisi kur. Önceki durum: "' + previousDescription + '"';
    } else if (mode === 'agent') {
        question = 'Bu ekranda hangi işlemler yapılabilir? Hangi butonlara basılabilir? Ne yapmam gerekiyor? Kısa ve eyleme dönük cevap ver.';
    } else if (mode === 'developer') {
        question = 'Bu ekranda kod, terminal veya hata mesajı var mı? Varsa analiz et ve çözüm öner. Yoksa "kod yok" de.';
    } else {
        question = 'Bu ekranda ne var? Çok kısa açıkla (max 2 cümle). Sadece yeni/değişen şeyleri söyle. Önceki: "' + previousDescription + '"';
    }

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + key;

    try {
        var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: question },
                        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
                    ]
                }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 300 }
            })
        });

        var data = await res.json();
        if (!res.ok || data.error) {
            return { success: false, error: (data.error && data.error.message) || 'HTTP ' + res.status };
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content &&
            data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            return {
                success: true,
                reply: data.candidates[0].content.parts[0].text,
                model: 'gemini-2.0-flash-live'
            };
        }
        return { success: false, error: 'Beklenmedik format' };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== ADMIN KULLANICILARI OLUŞTUR ==========
// ================================================================
Parse.Cloud.define("initAdminUsers", async function (request) {
    var isFirstSetup = false;
    try {
        var userCount = await new Parse.Query(Parse.User).count({ useMasterKey: true });
        if (userCount === 0) isFirstSetup = true;
    } catch (e) {
        console.warn('İlk kurulum kontrolü başarısız:', e.message);
    }

    if (!request.master && !isFirstSetup) {
        var caller = request.user;
        if (!caller || caller.get('role') !== 'founder') {
            throw new Error('Bu işlem için yetkiniz yok! Sadece kurucu veya sistem çağırabilir.');
        }
    }
    try {
        var founderEmail = 'admin.tr.reis@gmail.com';
        var query = new Parse.Query(Parse.User);
        query.equalTo('username', founderEmail);
        var existing = await query.first({ useMasterKey: true });
        if (!existing) {
            var founderPass = await getAPIKey('FOUNDER_PASS');
            if (!founderPass) throw new Error('FOUNDER_PASS tanımlı değil!');
            var admin0 = new Parse.User();
            admin0.set('username', founderEmail);
            admin0.set('email', founderEmail);
            admin0.set('password', founderPass);
            admin0.set('name', 'Eymen');
            admin0.set('role', 'founder');
            admin0.set('plan', 'team');
            admin0.set('isVerified', true);
            admin0.set('isBanned', false);
            admin0.set('profile_completed', true);
            admin0.set('recovery_email', founderEmail);
            await admin0.save(null, { useMasterKey: true });
        }

        var ibrahimEmail = 'iy5971828@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', ibrahimEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            var ibrahimPass = await getAPIKey('ADMIN_IBRAHIM_PASS');
            if (!ibrahimPass) throw new Error('ADMIN_IBRAHIM_PASS tanımlı değil!');
            var admin1 = new Parse.User();
            admin1.set('username', ibrahimEmail);
            admin1.set('email', ibrahimEmail);
            admin1.set('password', ibrahimPass);
            admin1.set('name', 'İbrahim Admin');
            admin1.set('role', 'admin');
            admin1.set('plan', 'team');
            admin1.set('isVerified', true);
            admin1.set('isBanned', false);
            admin1.set('profile_completed', true);
            admin1.set('recovery_email', ibrahimEmail);
            await admin1.save(null, { useMasterKey: true });
        }

        var bozkurtEmail = 'itaner686@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', bozkurtEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            var bozkurtPass = await getAPIKey('ADMIN_BOZKURT_PASS');
            if (!bozkurtPass) throw new Error('ADMIN_BOZKURT_PASS tanımlı değil!');
            var admin2 = new Parse.User();
            admin2.set('username', bozkurtEmail);
            admin2.set('email', bozkurtEmail);
            admin2.set('password', bozkurtPass);
            admin2.set('name', 'Bozkurt Admin');
            admin2.set('role', 'admin');
            admin2.set('plan', 'team');
            admin2.set('isVerified', true);
            admin2.set('isBanned', false);
            admin2.set('profile_completed', true);
            admin2.set('recovery_email', bozkurtEmail);
            await admin2.save(null, { useMasterKey: true });
        }

        var eymenBetaEmail = 'o2059497@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', eymenBetaEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            var betaPass = await getAPIKey('BETA_OMER_PASS');
            if (!betaPass) throw new Error('BETA_OMER_PASS tanımlı değil!');
            var beta1 = new Parse.User();
            beta1.set('username', eymenBetaEmail);
            beta1.set('email', eymenBetaEmail);
            beta1.set('password', betaPass);
            beta1.set('name', 'Eymen Beta');
            beta1.set('role', 'beta');
            beta1.set('plan', 'free');
            beta1.set('isVerified', true);
            beta1.set('isBanned', false);
            beta1.set('profile_completed', true);
            beta1.set('recovery_email', eymenBetaEmail);
            await beta1.save(null, { useMasterKey: true });
        } else {
            existing.set('name', 'Eymen Beta');
            await existing.save(null, { useMasterKey: true });
        }
        return { success: true };
    } catch (e) {
        console.error('initAdminUsers hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== ADMIN / BETA / FOUNDER GİRİŞ ==========
// ================================================================
Parse.Cloud.define("adminLogin", async function (request) {
    var _rlk = getRateLimitKey(request, 'adminLogin');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    var adminKey = request.params.adminKey;
    var password = request.params.password;
    if (!adminKey || !password) throw new Error('Admin key ve şifre gerekli.');
    await Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true });
    var admins = {
        ibrahim: { email: 'iy5971828@gmail.com', key: 'ADMIN_IBRAHIM_PASS', name: 'İbrahim Admin' },
        bozkurt: { email: 'itaner686@gmail.com', key: 'ADMIN_BOZKURT_PASS', name: 'Bozkurt Admin' }
    };
    var admin = admins[adminKey];
    if (!admin) throw new Error('Geçersiz admin seçimi!');
    var correctPass = await getAPIKey(admin.key);
    if (!correctPass) throw new Error('Admin şifresi tanımlı değil!');
    try {
        await Parse.User.logIn(admin.email, password);
        return { success: true, name: admin.name, email: admin.email, role: 'admin' };
    } catch (e) {
        if (e.code === 101 && request.master) {
            var query = new Parse.Query(Parse.User);
            query.equalTo('email', admin.email);
            var user = await query.first({ useMasterKey: true });
            if (user) await user.destroy({ useMasterKey: true });
            var newUser = new Parse.User();
            newUser.set('username', admin.email);
            newUser.set('email', admin.email);
            newUser.set('password', correctPass);
            newUser.set('name', admin.name);
            newUser.set('role', 'admin');
            newUser.set('plan', 'team');
            newUser.set('isVerified', true);
            newUser.set('isBanned', false);
            newUser.set('profile_completed', true);
            await newUser.save(null, { useMasterKey: true });
            await Parse.User.logIn(admin.email, password);
            return { success: true, name: admin.name, email: admin.email, role: 'admin' };
        } else throw e;
    }
});

Parse.Cloud.define("betaLogin", async function (request) {
    var _rlk = getRateLimitKey(request, 'betaLogin');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    var betaKey = request.params.betaKey;
    var password = request.params.password;
    if (!betaKey || !password) throw new Error('Beta key ve şifre gerekli.');
    await Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true });
    var betas = {
        beta: { email: 'o2059497@gmail.com', key: 'BETA_OMER_PASS', name: 'Eymen Beta' },
        omer: { email: 'o2059497@gmail.com', key: 'BETA_OMER_PASS', name: 'Eymen Beta' }
    };
    var beta = betas[betaKey];
    if (!beta) throw new Error('Geçersiz beta seçimi!');
    var correctPass = await getAPIKey(beta.key);
    if (!correctPass) throw new Error('Beta şifresi tanımlı değil!');
    try {
        await Parse.User.logIn(beta.email, password);
        return { success: true, name: beta.name, email: beta.email, role: 'beta' };
    } catch (e) {
        if (e.code === 101 && request.master) {
            var query = new Parse.Query(Parse.User);
            query.equalTo('email', beta.email);
            var user = await query.first({ useMasterKey: true });
            if (user) await user.destroy({ useMasterKey: true });
            var newUser = new Parse.User();
            newUser.set('username', beta.email);
            newUser.set('email', beta.email);
            newUser.set('password', correctPass);
            newUser.set('name', beta.name);
            newUser.set('role', 'beta');
            newUser.set('plan', 'free');
            newUser.set('isVerified', true);
            newUser.set('isBanned', false);
            newUser.set('profile_completed', true);
            await newUser.save(null, { useMasterKey: true });
            await Parse.User.logIn(beta.email, password);
            return { success: true, name: beta.name, email: beta.email, role: 'beta' };
        } else throw e;
    }
});

Parse.Cloud.define("founderLogin", async function (request) {
    var _rlk = getRateLimitKey(request, 'founderLogin');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    var password = request.params.password;
    if (!password) throw new Error('Şifre gerekli.');
    await Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true });
    var founderEmail = 'admin.tr.reis@gmail.com';
    var correctPass = await getAPIKey('FOUNDER_PASS');
    if (!correctPass) throw new Error('Founder şifresi tanımlı değil!');
    try {
        await Parse.User.logIn(founderEmail, password);
        return { success: true, name: 'Eymen', email: founderEmail, role: 'founder' };
    } catch (e) {
        if (e.code === 101 && request.master) {
            var query = new Parse.Query(Parse.User);
            query.equalTo('email', founderEmail);
            var user = await query.first({ useMasterKey: true });
            if (user) await user.destroy({ useMasterKey: true });
            var newUser = new Parse.User();
            newUser.set('username', founderEmail);
            newUser.set('email', founderEmail);
            newUser.set('password', correctPass);
            newUser.set('name', 'Eymen');
            newUser.set('role', 'founder');
            newUser.set('plan', 'team');
            newUser.set('isVerified', true);
            newUser.set('isBanned', false);
            newUser.set('profile_completed', true);
            await newUser.save(null, { useMasterKey: true });
            await Parse.User.logIn(founderEmail, password);
            return { success: true, name: 'Eymen', email: founderEmail, role: 'founder' };
        } else throw e;
    }
});

// ================================================================
// ===== FACEBOOK LOGIN — Cloud Side ==============================
// ================================================================
Parse.Cloud.define("verifyFacebookToken", async function (request) {
    var accessToken = request.params.accessToken;
    var userID = request.params.userID;
    if (!accessToken || !userID) {
        throw new Error('Access token ve user ID gerekli!');
    }

    try {
        var graphUrl = 'https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + accessToken;
        var res = await fetch(graphUrl);
        var data = await res.json();

        if (data.error) {
            return { success: false, error: 'Facebook token doğrulanamadı: ' + data.error.message };
        }

        if (data.id !== userID) {
            return { success: false, error: 'Facebook ID uyuşmuyor!' };
        }

        return {
            success: true,
            fbUser: {
                id: data.id,
                name: data.name || '',
                email: data.email || '',
                picture: data.picture && data.picture.data ? data.picture.data.url : ''
            }
        };
    } catch (e) {
        return { success: false, error: 'Facebook bağlantı hatası: ' + e.message };
    }
});

Parse.Cloud.define("facebookLogin", async function (request) {
    var accessToken = request.params.accessToken;
    var userID = request.params.userID;

    if (!accessToken || !userID) {
        throw new Error('Access token ve user ID gerekli!');
    }

    var _rlk = 'facebookLogin:' + String(userID);
    await checkRateLimit(_rlk, 10, 5 * 60 * 1000);
    await recordAttempt(_rlk);

    var graphUrl = 'https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + accessToken;
    var res;
    var data;
    try {
        res = await fetch(graphUrl);
        data = await res.json();
    } catch (e) {
        throw new Error('Facebook bağlantı hatası: ' + e.message);
    }

    if (data.error) {
        throw new Error('Facebook token doğrulanamadı: ' + data.error.message);
    }

    if (data.id !== userID) {
        throw new Error('Facebook ID uyuşmuyor!');
    }

    var user;
    var wasNewUser = false;
    try {
        var existingQuery = new Parse.Query(Parse.User);
        existingQuery.equalTo('authData.facebook.id', data.id);
        var existing = await existingQuery.first({ useMasterKey: true });

        if (!existing) wasNewUser = true;

        user = await Parse.User.logInWith('facebook', {
            authData: {
                id: data.id,
                access_token: accessToken
            },
            useMasterKey: true
        });
    } catch (e) {
        console.error('❌ facebookLogin logInWith hatası:', e.message);
        throw new Error('Facebook girişi başarısız: ' + e.message);
    }

    if (!user) {
        throw new Error('Facebook kullanıcısı oluşturulamadı!');
    }

    if (user.get('isBanned')) {
        throw new Error('Hesabınız yasaklanmıştır!');
    }

    var isNewUser = wasNewUser;
    if (!user.get('name') && data.name) {
        user.set('name', data.name);
        isNewUser = true;
    }
    if (!user.get('email') && data.email) {
        user.set('email', data.email);
        user.set('username', data.email);
        isNewUser = true;
    }
    if (!user.get('profile_picture') && data.picture && data.picture.data) {
        user.set('profile_picture', data.picture.data.url);
        isNewUser = true;
    }

    if (isNewUser) {
        if (!user.get('role')) user.set('role', 'user');
        if (!user.get('plan')) user.set('plan', 'free');
        if (!user.get('points')) user.set('points', 0);
        if (!user.get('level')) user.set('level', 'Çaylak');
        if (!user.get('isVerified')) user.set('isVerified', true);
        if (user.get('isBanned') === undefined) user.set('isBanned', false);
        if (!user.get('badges')) user.set('badges', []);
        if (!user.get('followers')) user.set('followers', []);
        if (!user.get('following')) user.set('following', []);
        if (!user.get('wallet_balance')) user.set('wallet_balance', 0);
        if (!user.get('referral_count')) user.set('referral_count', 0);
        if (!user.get('parent_mode')) user.set('parent_mode', false);
        user.set('profile_completed', false);
        user.set('password_set', false);
        user.set('is_facebook_user', true);
        console.log('📝 Yeni FB kullanıcısı oluşturuldu, profil tamamlanmamış.');
    } else {
        if (user.get('profile_completed') === undefined) {
            user.set('profile_completed', false);
        }
        if (user.get('is_facebook_user') === undefined) {
            user.set('is_facebook_user', true);
        }
    }

    var refCode = request.params.referralCode;
    if (refCode && !user.get('invited_by')) {
        try {
            var refQuery = new Parse.Query(Parse.User);
            refQuery.equalTo('referral_code', refCode);
            var referrer = await refQuery.first({ useMasterKey: true });
            if (referrer && referrer.id !== user.id) {
                var refCount = referrer.get('referral_count') || 0;
                if (refCount < 2) {
                    user.set('invited_by', refCode);
                    await addPointsWithBonus(referrer, 1000, 'Arkadaş daveti (Facebook)');
                    await addPointsWithBonus(user, 1000, 'Davet kodu kullanımı (Facebook)');
                    referrer.set('referral_count', refCount + 1);
                    await referrer.save(null, { useMasterKey: true });
                }
            }
        } catch (refErr) {
            console.warn('Referral uygulanamadı:', refErr.message);
        }
    }

    await user.save(null, { useMasterKey: true });

    return {
        success: true,
        sessionToken: user.getSessionToken(),
        userId: user.id,
        name: user.get('name') || '',
        email: user.get('email') || '',
        role: user.get('role') || 'user',
        plan: user.get('plan') || 'free',
        profile_completed: user.get('profile_completed') === true,
        isNewUser: isNewUser
    };
});

// ================================================================
// ========== completeFacebookProfile ============================
// ================================================================
Parse.Cloud.define("completeFacebookProfile", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var name = request.params.name;
    var password = request.params.password;
    var recoveryEmail = request.params.recoveryEmail;

    if (!name || name.trim().length < 2) throw new Error('Ad en az 2 karakter olmalı.');
    if (!password || password.length < 8) throw new Error('Şifre en az 8 karakter olmalı.');
    if (!recoveryEmail) throw new Error('Kurtarma maili gerekli.');

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) throw new Error('Geçerli bir e-posta adresi girin.');

    var _rlk = 'completeFacebookProfile:' + user.get('email');
    await checkRateLimit(_rlk, 5, 10 * 60 * 1000);
    await recordAttempt(_rlk);

    try {
        var dupQuery = new Parse.Query(Parse.User);
        dupQuery.equalTo('recovery_email', recoveryEmail.toLowerCase());
        dupQuery.notEqualTo('objectId', user.id);
        var dup = await dupQuery.first({ useMasterKey: true });
        if (dup) {
            throw new Error('Bu kurtarma maili başka bir hesap tarafından kullanılıyor.');
        }

        user.set('password', password);
        user.set('name', name.trim());
        user.set('recovery_email', recoveryEmail.toLowerCase());
        user.set('profile_completed', true);
        user.set('password_set', true);
        user.set('profile_completed_at', new Date());

        await user.save(null, { useMasterKey: true });

        console.log('✅ Profil tamamlandı:', user.get('email'), '→', recoveryEmail);

        try {
            await Parse.Cloud.run('sendEmail', {
                to: recoveryEmail,
                subject: 'VİZYON2027 - Kurtarma Maili Kaydı',
                html: '<h3>📧 Kurtarma Maili Kaydınız</h3>' +
                      '<p>Sayın ' + name + ',</p>' +
                      '<p>Bu mail adresi <strong>VİZYON2027</strong> hesabınız için kurtarma maili olarak kaydedilmiştir.</p>' +
                      '<p>Facebook hesabınızla giriş yapamazsanız, bu mail adresi ve belirlediğiniz şifre ile hesabınıza giriş yapabilirsiniz.</p>' +
                      '<p>Eğer bu işlemi siz yapmadıysanız, lütfen kurucuya başvurun.</p>' +
                      '<p>VİZYON2027 Ekibi</p>'
            }, { useMasterKey: true });
        } catch (mailErr) {
            console.warn('Bilgilendirme maili gönderilemedi:', mailErr.message);
        }

        return {
            success: true,
            message: 'Hesabınız başarıyla tamamlandı!',
            recovery_email: recoveryEmail.toLowerCase()
        };
    } catch (e) {
        console.error('completeFacebookProfile hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== loginWithRecoveryEmail ============================
// ================================================================
Parse.Cloud.define("loginWithRecoveryEmail", async function (request) {
    var recoveryEmail = request.params.recoveryEmail;
    var password = request.params.password;

    if (!recoveryEmail || !password) {
        throw new Error('E-posta ve şifre gerekli.');
    }

    var _rlk = 'loginWithRecoveryEmail:' + recoveryEmail.toLowerCase();
    await checkRateLimit(_rlk, 5, 5 * 60 * 1000);
    await recordAttempt(_rlk);

    try {
        var query = new Parse.Query(Parse.User);
        query.equalTo('recovery_email', recoveryEmail.toLowerCase());
        var user = await query.first({ useMasterKey: true });

        if (!user) {
            throw new Error('Bu kurtarma maili ile kayıtlı bir hesap bulunamadı.');
        }

        if (user.get('isBanned')) {
            throw new Error('Hesabınız yasaklanmıştır!');
        }

        var loginEmail = user.get('email') || user.get('username');
        if (!loginEmail) {
            throw new Error('Kullanıcı hesabı bozuk (email yok).');
        }

        var loggedInUser;
        try {
            loggedInUser = await Parse.User.logIn(loginEmail, password);
        } catch (loginErr) {
            console.error('Recovery login başarısız:', loginErr.message);
            throw new Error('Şifre yanlış!');
        }

        if (!loggedInUser) {
            throw new Error('Giriş yapılamadı.');
        }

        console.log('✅ Recovery login başarılı:', loginEmail);

        return {
            success: true,
            sessionToken: loggedInUser.getSessionToken(),
            userId: loggedInUser.id,
            name: loggedInUser.get('name') || '',
            email: loggedInUser.get('email') || '',
            role: loggedInUser.get('role') || 'user',
            plan: loggedInUser.get('plan') || 'free'
        };
    } catch (e) {
        console.error('loginWithRecoveryEmail hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== SORGU LİMİTİ (MODERATÖR SINIRSIZ) ==================
// ================================================================
Parse.Cloud.define("useQuery", async function (request) {
    var user = request.user;
    var today = new Date().toDateString();
    var query = new Parse.Query(QueryStat);
    var limit = 25;
    var remaining;

    if (user) {
        query.equalTo("user_email", user.get('email'));
        query.equalTo("date", today);
        var stats = await query.first({ useMasterKey: true });
        if (!stats) {
            stats = new QueryStat();
            stats.set("user_email", user.get('email'));
            stats.set("date", today);
            stats.set("count", 0);
        }
        var role = user.get('role');
        var plan = user.get('plan');
        // ✅ [v7.9.2 GÜNCELLENDİ] moderator eklendi
        if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) !== -1 || plan === 'team') limit = Infinity;
        else if (plan === 'pro') limit = 2000;
        else limit = 100;

        if (stats.get("count") >= limit) throw new Error('Sorgu hakkınız doldu!');
        stats.increment("count");
        await stats.save(null, { useMasterKey: true });
        remaining = limit === Infinity ? 'Sınırsız' : (limit - stats.get("count"));
        return { remaining: remaining, limit: limit, isMember: true };
    } else {
        var visitorKey = 'visitor_' + today;
        query.equalTo("visitorKey", visitorKey);
        var stats2 = await query.first({ useMasterKey: true });
        if (!stats2) {
            stats2 = new QueryStat();
            stats2.set("visitorKey", visitorKey);
            stats2.set("date", today);
            stats2.set("count", 0);
        }
        if (stats2.get("count") >= 25) throw new Error('Ziyaretçi sorgu hakkınız doldu!');
        stats2.increment("count");
        await stats2.save(null, { useMasterKey: true });
        remaining = 25 - stats2.get("count");
        return { remaining: remaining, limit: 25, isMember: false };
    }
});

// ================================================================
// ========== YORUM SİSTEMİ ==========
// ================================================================
Parse.Cloud.define("getComments", async function (request) {
    try {
        var query = new Parse.Query(Comment);
        query.descending('createdAt');
        query.limit(30);
        var comments = await query.find({ useMasterKey: true });
        return {
            success: true,
            comments: comments.map(function (c) {
                return {
                    id: c.id,
                    user_email: c.get('user_email'),
                    user_name: c.get('user_name'),
                    user_role: c.get('user_role'),
                    comment: c.get('comment'),
                    rating: c.get('rating') || 0,
                    createdAt: c.get('createdAt')
                };
            })
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("addComment", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var comment = request.params.comment;
    var rating = request.params.rating || 0;
    if (!comment || comment.trim().length === 0) throw new Error('Yorum boş olamaz!');
    var newComment = new Comment();
    newComment.set('user_email', user.get('email'));
    newComment.set('user_name', user.get('name') || 'Kullanıcı');
    newComment.set('user_role', user.get('role') || 'user');
    newComment.set('comment', filterText(comment.trim()));
    newComment.set('rating', Math.min(5, Math.max(0, rating)));
    await newComment.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("deleteComment", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var commentId = request.params.commentId;
    var query = new Parse.Query(Comment);
    var comment = await query.get(commentId, { useMasterKey: true });
    if (!comment) throw new Error('Yorum bulunamadı!');
    if (comment.get('user_email') !== user.get('email') && ['admin', 'founder'].indexOf(user.get('role')) === -1) {
        throw new Error('Yetkiniz yok!');
    }
    await comment.destroy({ useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("editComment", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var commentId = request.params.commentId;
    var newText = request.params.newText;
    var newRating = request.params.newRating;
    if (!newText || newText.trim().length === 0) throw new Error('Yorum boş olamaz!');
    var query = new Parse.Query(Comment);
    var comment = await query.get(commentId, { useMasterKey: true });
    if (!comment) throw new Error('Yorum bulunamadı!');
    if (comment.get('user_email') !== user.get('email') && ['admin', 'founder'].indexOf(user.get('role')) === -1) {
        throw new Error('Yetkiniz yok!');
    }
    comment.set('comment', filterText(newText.trim()));
    if (newRating !== undefined) {
        comment.set('rating', Math.min(5, Math.max(0, newRating)));
    }
    await comment.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== ŞİFRE SIFIRLAMA ==========
// ================================================================
Parse.Cloud.define("sendVerificationCode", async function (request) {
    var email = request.params.email;
    if (!email) throw new Error('E-posta adresi gerekli!');

    var _rlk = getRateLimitKey(request, 'sendVerificationCode');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    var query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    var user = await query.first({ useMasterKey: true });
    if (!user) throw new Error('Kullanıcı bulunamadı!');
    var code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set("resetCode", code);
    user.set("resetCodeExpires", new Date(Date.now() + 15 * 60000));
    await user.save(null, { useMasterKey: true });
    var html = '<h1>Şifre Sıfırlama Kodu</h1>' +
        '<p>Sayın ' + (user.get('name') || 'Kullanıcı') + ',</p>' +
        '<p>Şifre sıfırlama kodunuz: <strong>' + code + '</strong></p>' +
        '<p>Bu kod 15 dakika geçerlidir.</p><p>Vizyon 2027 Ekibi</p>';
    var result = await Parse.Cloud.run("sendEmail", { to: email, subject: "Şifre Sıfırlama Kodu - Vizyon 2027", html: html }, { useMasterKey: true });
    if (result.success) return { success: true, message: 'Doğrulama kodu gönderildi.' };
    else throw new Error('E-posta gönderilemedi: ' + (result.error || 'Bilinmeyen hata'));
});

Parse.Cloud.define("resetPasswordWithCode", async function (request) {
    var email = request.params.email;
    var code = request.params.code;
    var newPassword = request.params.newPassword;
    if (!email || !code || !newPassword) throw new Error('Tüm alanlar gerekli!');
    if (newPassword.length < 8) throw new Error('Şifre en az 8 karakter olmalı!');

    var _rlk = getRateLimitKey(request, 'resetPasswordWithCode');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    var query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    var user = await query.first({ useMasterKey: true });
    if (!user) throw new Error('Kullanıcı bulunamadı!');
    if (user.get("resetCode") !== code) throw new Error('Geçersiz kod!');
    if (new Date(user.get("resetCodeExpires")) < new Date()) throw new Error('Kod süresi doldu!');
    user.set("password", newPassword);
    user.set("resetCode", null);
    user.set("resetCodeExpires", null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: 'Şifre değiştirildi!' };
});

// ================================================================
// ========== HEDİYE VE ROL TEKLİFLERİ ==========
// ================================================================
Parse.Cloud.define("sendGiftRequest", async function (request) {
    var sender = request.user;
    if (!sender) throw new Error('Giriş yapmalısınız!');
    if (['admin', 'founder'].indexOf(sender.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var email = request.params.email;
    var packageType = request.params.packageType;
    if (!email || !packageType) throw new Error('E-posta ve paket türü gerekli!');
    if (['pro', 'team'].indexOf(packageType) === -1) throw new Error('Geçersiz paket türü!');
    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var receiver = await query.first({ useMasterKey: true });
    if (!receiver) throw new Error('Kullanıcı bulunamadı!');
    var requestId = Math.random().toString(36).substring(2, 15);
    var inbox = new Inbox();
    inbox.set('sender_email', sender.get('email'));
    inbox.set('receiver_email', email);
    inbox.set('type', 'gift_request');
    inbox.set('package_type', packageType);
    inbox.set('request_id', requestId);
    inbox.set('status', 'pending');
    inbox.set('message', '🎁 ' + sender.get('name') + ' size ' + (packageType === 'pro' ? '🌟 Pro Paket' : '👥 Takım Paketi') + ' hediye etmek istiyor. Kabul eder misiniz?');
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("sendRoleRequest", async function (request) {
    var sender = request.user;
    if (!sender) throw new Error('Giriş yapmalısınız!');
    if (['admin', 'founder'].indexOf(sender.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var email = request.params.email;
    var role = request.params.role;
    if (!email || !role) throw new Error('E-posta ve rol gerekli!');
    if (['beta', 'admin'].indexOf(role) === -1) throw new Error('Geçersiz rol!');
    if (role === 'admin' && sender.get('role') !== 'founder') throw new Error('Admin atama yetkisi sadece kurucuya aittir!');
    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var receiver = await query.first({ useMasterKey: true });
    if (!receiver) throw new Error('Kullanıcı bulunamadı!');
    var requestId = Math.random().toString(36).substring(2, 15);
    var roleLabel = role === 'admin' ? '⚙️ Admin' : '🔬 Beta Tester';
    var inbox = new Inbox();
    inbox.set('sender_email', sender.get('email'));
    inbox.set('receiver_email', email);
    inbox.set('type', 'role_request');
    inbox.set('role', role);
    inbox.set('request_id', requestId);
    inbox.set('status', 'pending');
    inbox.set('message', '📩 ' + sender.get('name') + ' size ' + roleLabel + ' rolü vermek istiyor. Kabul eder misiniz?');
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("handleRequest", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var requestId = request.params.requestId;
    var action = request.params.action;
    if (!requestId || !action) throw new Error('Request ID ve action gerekli!');
    if (['accept', 'reject'].indexOf(action) === -1) throw new Error('Geçersiz işlem!');
    var query = new Parse.Query(Inbox);
    query.equalTo('request_id', requestId);
    query.equalTo('receiver_email', user.get('email'));
    var inboxMsg = await query.first({ useMasterKey: true });
    if (!inboxMsg) throw new Error('Teklif bulunamadı!');
    if (inboxMsg.get('status') !== 'pending') throw new Error('Bu teklif zaten işlenmiş!');
    if (action === 'reject') {
        inboxMsg.set('status', 'rejected');
        await inboxMsg.save(null, { useMasterKey: true });
        return { success: true, message: 'Teklif reddedildi.' };
    }
    var type = inboxMsg.get('type');
    if (type === 'gift_request') {
        user.set('plan', inboxMsg.get('package_type'));
    } else if (type === 'role_request') {
        user.set('role', inboxMsg.get('role'));
    } else {
        throw new Error('Bilinmeyen teklif türü!');
    }
    await user.save(null, { useMasterKey: true });
    inboxMsg.set('status', 'accepted');
    await inboxMsg.save(null, { useMasterKey: true });
    var notify = new Inbox();
    notify.set('sender_email', 'system@vizyon2027.com');
    notify.set('receiver_email', inboxMsg.get('sender_email'));
    notify.set('type', 'notification');
    notify.set('message', '✅ ' + user.get('email') + ' teklifi kabul etti!');
    await notify.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== [v7.9.0 YENİ] GELEN KUTUSU CLOUD FUNCTION ==========
// ================================================================
Parse.Cloud.define("getInboxItems", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var query = new Parse.Query(Inbox);
    query.equalTo('receiver_email', user.get('email'));
    query.descending('createdAt');
    query.limit(100);

    try {
        var results = await query.find({ useMasterKey: true });
        return results.map(function (obj) {
            return {
                id: obj.id,
                sender_email: obj.get('sender_email') || 'Sistem',
                type: obj.get('type') || 'notification',
                message: obj.get('message') || '',
                status: obj.get('status') || '',
                request_id: obj.get('request_id') || '',
                project_title: obj.get('project_title') || '',
                project_type: obj.get('project_type') || '',
                project_description: obj.get('project_description') || '',
                role: obj.get('role') || '',
                package_type: obj.get('package_type') || '',
                team_id: obj.get('team_id') || '',
                team_name: obj.get('team_name') || '',
                project_id: obj.get('project_id') || '',
                created_at: obj.get('createdAt') ? obj.get('createdAt').toISOString() : new Date().toISOString()
            };
        });
    } catch (e) {
        console.error('getInboxItems hatası:', e.message);
        return [];
    }
});

// ================================================================
// ========== TAKIM İŞLEMLERİ ==========
// ================================================================
Parse.Cloud.define("createTeam", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız.');
    var name = request.params.name;
    if (!name) throw new Error('Takım adı gerekli.');
    var role = user.get('role');
    var plan = user.get('plan');
    // ✅ [v7.9.2 GÜNCELLENDİ] moderator eklendi
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        throw new Error('Takım kurma yetkiniz yok.');
    }
    var teamCode = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var exists = true;
    while (exists) {
        teamCode = '';
        for (var i = 0; i < 6; i++) teamCode += chars.charAt(Math.floor(Math.random() * chars.length));
        var codeQuery = new Parse.Query(Team);
        codeQuery.equalTo("teamCode", teamCode);
        var existing = await codeQuery.first({ useMasterKey: true });
        exists = !!existing;
    }
    var team = new Team();
    team.set("name", name);
    team.set("owner_email", user.get('email'));
    team.set("teamCode", teamCode);
    team.set("manager_email", null);
    await team.save(null, { useMasterKey: true });
    var member = new TeamMember();
    member.set("team_id", team.id);
    member.set("user_email", user.get('email'));
    await member.save(null, { useMasterKey: true });
    user.set("teamId", team.id);
    await user.save(null, { useMasterKey: true });
    return { success: true, teamId: team.id, teamCode: teamCode };
});

Parse.Cloud.define("joinTeamWithCode", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız.');
    var teamCode = request.params.teamCode;
    if (!teamCode) throw new Error('Takım kodu gerekli.');
    var query = new Parse.Query(Team);
    query.equalTo("teamCode", teamCode.toUpperCase().trim());
    var team = await query.first({ useMasterKey: true });
    if (!team) throw new Error('Geçersiz takım kodu!');
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", team.id);
    memberQuery.equalTo("user_email", user.get('email'));
    var existing = await memberQuery.first({ useMasterKey: true });
    if (existing) throw new Error('Zaten bu takımın üyesisiniz!');
    var member = new TeamMember();
    member.set("team_id", team.id);
    member.set("user_email", user.get('email'));
    await member.save(null, { useMasterKey: true });
    user.set("teamId", team.id);
    await user.save(null, { useMasterKey: true });
    return { success: true, teamId: team.id };
});

Parse.Cloud.define("sendTeamMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = request.params.teamId;
    var message = request.params.message;
    var fileUrl = request.params.fileUrl;
    var fileName = request.params.fileName;
    var fileType = request.params.fileType;
    if (!teamId) throw new Error('Takım ID gerekli!');
    if (!message && !fileUrl) throw new Error('Mesaj veya dosya gerekli!');

    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');

    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    var member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error('Bu takımın üyesi değilsiniz!');

    var isVizyonCommand = false;
    var isSupportCommand = false;
    var isOfflineCommand = false;
    var isV27Command = false;
    var command = message || '';
    var lowerCommand = command.toLowerCase();

    var offlineTriggers = ['@vizyondestektheoffline', '@vizyonaltheoffline', 'vizyonal the offline', 'vizyondestek the offline'];
    for (var oi = 0; oi < offlineTriggers.length; oi++) {
        if (lowerCommand.indexOf(offlineTriggers[oi]) !== -1) {
            isOfflineCommand = true;
            break;
        }
    }

    if (!isOfflineCommand) {
        var v27Triggers = ['@v27', 'v27 api', 'vizyon api'];
        for (var v27i = 0; v27i < v27Triggers.length; v27i++) {
            if (lowerCommand.indexOf(v27Triggers[v27i]) !== -1) {
                isV27Command = true;
                command = command.replace(new RegExp(v27Triggers[v27i], 'gi'), '').trim();
                break;
            }
        }

        var aiTriggers = ['@vizyonal', 'vizyon al', 'vizyonal'];
        for (var ai = 0; ai < aiTriggers.length; ai++) {
            if (lowerCommand.indexOf(aiTriggers[ai]) !== -1) {
                isVizyonCommand = true;
                command = command.replace(new RegExp(aiTriggers[ai].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                break;
            }
        }

        var supportTriggers = ['@vizyondestek', 'vizyon destek', 'vizyondetsek', 'vizyondestek'];
        for (var si = 0; si < supportTriggers.length; si++) {
            if (lowerCommand.indexOf(supportTriggers[si]) !== -1) {
                isSupportCommand = true;
                command = command.replace(new RegExp(supportTriggers[si].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                break;
            }
        }
    }

    var msg = new TeamMessage();

    if (isOfflineCommand) {
        msg.set("team_id", teamId);
        msg.set("user_email", 'system@vizyon2027.com');
        msg.set("user_name", '🧠 VİZYON AI');
        msg.set("message", '🧠 VİZYON AI: Anladım, sohbetten ayrılıyorum. Beni tekrar çağırmak için @vizyonal veya @vizyondestek yazabilirsiniz. 👋');
        await msg.save(null, { useMasterKey: true });
        return { success: true };
    }

    if (isV27Command) {
        msg.set("team_id", teamId);
        msg.set("user_email", 'system@vizyon2027.com');
        msg.set("user_name", '🔑 V27 API DESTEK');
        msg.set("message", '🔑 **V27 API Anahtarı Bilgisi**\n\n' +
            'V27 API anahtarı oluşturmak için:\n' +
            '1. Dashboard\'a gidin\n' +
            '2. "Vizyon2027 Yapay Zekasının API Anahtarı" bölümünü bulun\n' +
            '3. "Anahtarını Al" butonuna tıklayın\n' +
            '4. Anahtar adı ve süre seçin\n' +
            '5. Anahtarınızı kopyalayıp güvenli bir yere kaydedin\n\n' +
            '**Limitler:**\n' +
            '• Kurucu/Admin/Beta/Moderatör: Sınırsız\n' +
            '• Takım Paketi: 100 anahtar\n' +
            '• Pro Paket: 20 anahtar\n' +
            '• Ücretsiz Üye: 2 anahtar\n\n' +
            'Anahtarınızı V27_API_KEY başlığı ile kullanabilirsiniz.');
        await msg.save(null, { useMasterKey: true });
        return { success: true };
    }

    if (isVizyonCommand || isSupportCommand) {
        var MsgQuery = Parse.Object.extend("TeamMessage");
        var chatQuery = new Parse.Query(MsgQuery);
        chatQuery.equalTo('team_id', teamId);
        chatQuery.ascending('createdAt');
        chatQuery.limit(50);
        var history = await chatQuery.find({ useMasterKey: true });
        var context = "Takım sohbet geçmişi (son 50 mesaj):\n";
        history.forEach(function (h) {
            var sender = h.get('user_name') || h.get('user_email');
            var txt = h.get('message') || '[Dosya]';
            context += sender + ': ' + txt + '\n';
        });

        var isGreeting = false;
        var greetingWords = ['selam', 'merhaba', 'hey', 'slm', 'hello', 'hi', 'naber', 'nasılsın', 'iyi misin'];
        for (var gi = 0; gi < greetingWords.length; gi++) {
            if (command.toLowerCase().indexOf(greetingWords[gi]) !== -1) {
                isGreeting = true;
                break;
            }
        }

        if (isSupportCommand) {
            try {
                var classificationPrompt = 'Aşağıdaki kullanıcı mesajı VİZYON2027 sitesi hakkında YARDIM, DESTEK, ŞİKAYET, ÖNERİ, veya SİTE BİLGİSİ sorusu mu, yoksa GENEL bir soru mu?\n\n' +
                    'Mesaj: "' + command + '"\n\n' +
                    'Cevabın SADECE şu iki kelimeden birini içermeli: "DESTEK" veya "GENEL"\n' +
                    'Açıklama yapma. Sadece tek kelime yaz.';

                var classification = await Parse.Cloud.run('superAI', { prompt: classificationPrompt }, { useMasterKey: true });
                var isSupportRelated = false;
                if (classification) {
                    var upperClass = classification.toUpperCase();
                    if (upperClass.indexOf('DESTEK') !== -1) {
                        isSupportRelated = true;
                    }
                }

                if (isGreeting) {
                    msg.set("team_id", teamId);
                    msg.set("user_email", 'system@vizyon2027.com');
                    msg.set("user_name", '🧠 VİZYON DESTEK');
                    msg.set("message", '🧠 VİZYON DESTEK: Merhaba! Ben Vizyon Destek. Size nasıl yardımcı olabilirim? Site hakkında bilgi, destek, şikayet ve öneriler için buradayım.');
                    await msg.save(null, { useMasterKey: true });
                    return { success: true };
                }

                if (!isSupportRelated) {
                    msg.set("team_id", teamId);
                    msg.set("user_email", 'system@vizyon2027.com');
                    msg.set("user_name", '🧠 VİZYON DESTEK');
                    msg.set("message", '🧠 VİZYON DESTEK: Bu konuda yetkim yok. Ben sadece VİZYON2027 sitesi hakkında yardım, destek, şikayet ve öneriler için buradayım. Diğer konular için lütfen @vizyonal yazarak VİZYON AI\'ya sorun. 🙏');
                    await msg.save(null, { useMasterKey: true });
                    return { success: true };
                }

                var siteContent = await getSiteContent();
                var supportPrompt = 'Sen VİZYON DESTEK\'sin. Görevin: SADECE VİZYON2027 sitesi hakkında yardım, destek, şikayet, öneri ve site bilgisi sorularına cevap vermek.\n\n' +
                    'Kullanıcı sorusu: "' + command + '"\n\n' +
                    'VİZYON2027 sitesi hakkında bilgi: ' + siteContent.substring(0, 2000) + '\n\n' +
                    'Kurallar:\n' +
                    '- Kısa, net ve DIRECT cevap ver. Uzatma.\n' +
                    '- "Vizyon Destek:" diye başlama, doğrudan cevabı yaz.\n' +
                    '- Emoji kullanma (istersen en fazla 1).\n' +
                    '- Resmi ve saygılı ol.\n' +
                    '- Cevabın 3 cümleyi geçmesin.\n' +
                    '- Eğer cevap vermek için yeterli bilgin yoksa: "Bu konuda detaylı bilgim yok, lütfen kurucuya başvurun." de.';

                var result = await Parse.Cloud.run('superAI', { prompt: supportPrompt }, { useMasterKey: true });
                var reply = result || 'Bu konuda size yardımcı olamıyorum. Lütfen daha net bir soru sorun.';

                msg.set("team_id", teamId);
                msg.set("user_email", 'system@vizyon2027.com');
                msg.set("user_name", '🧠 VİZYON DESTEK');
                msg.set("message", '🧠 VİZYON DESTEK: ' + reply);
                await msg.save(null, { useMasterKey: true });
                return { success: true };
            } catch (e) {
                console.error('Vizyon Destek hatası:', e);
                msg.set("team_id", teamId);
                msg.set("user_email", 'system@vizyon2027.com');
                msg.set("user_name", '🧠 VİZYON DESTEK');
                msg.set("message", '🧠 VİZYON DESTEK: Şu anda teknik bir sorun nedeniyle cevap veremiyorum. Lütfen daha sonra tekrar deneyin.');
                await msg.save(null, { useMasterKey: true });
                return { success: true };
            }
        }

        if (isVizyonCommand) {
            var aiPrompt = '';
            if (isGreeting) {
                aiPrompt = 'Kullanıcı selam veriyor: "' + command + '". Sen VİZYON AI\'sın. Nazik ve samimi bir selam ver. Ardından "Size nasıl yardımcı olabilirim?" de.';
            } else {
                aiPrompt = 'Kullanıcı sorusu: "' + command + '". Sen VİZYON AI\'sın. Sohbet geçmişi: ' + context + ' Soruyu detaylı ve anlaşılır bir şekilde cevapla. Eğer kod istiyorsa, çalışan kod örneği ver. Cevabın "VİZYON AI:" diye başlamasın, doğrudan cevabı ver. Cevabın kısa, net ve anlaşılır olsun.';
            }
            try {
                var result2 = await Parse.Cloud.run('superAI', { prompt: aiPrompt }, { useMasterKey: true });
                var reply2 = result2 || 'VİZYON AI olarak size yardımcı olmaktan mutluluk duyarım. Lütfen daha detaylı sorunuzu belirtin.';
                msg.set("team_id", teamId);
                msg.set("user_email", 'system@vizyon2027.com');
                msg.set("user_name", '🧠 VİZYON AI');
                msg.set("message", '🧠 VİZYON AI: ' + reply2);
                await msg.save(null, { useMasterKey: true });
                return { success: true };
            } catch (e) {
                console.error('VİZYON AI hatası:', e);
                msg.set("team_id", teamId);
                msg.set("user_email", 'system@vizyon2027.com');
                msg.set("user_name", '🧠 VİZYON AI');
                msg.set("message", '🧠 VİZYON AI: Üzgünüm, şu anda size cevap veremiyorum. Lütfen daha sonra tekrar deneyin.');
                await msg.save(null, { useMasterKey: true });
                return { success: true };
            }
        }
    }

    msg.set("team_id", teamId);
    msg.set("user_email", user.get('email'));
    msg.set("user_name", user.get('name') || user.get('username') || 'Kullanıcı');
    msg.set("message", filterText(message || ''));
    msg.set("deleted", false);
    msg.set("deleted_by_founder", false);
    msg.set("edited", false);
    if (fileUrl) {
        msg.set("fileUrl", fileUrl);
        msg.set("fileName", fileName || 'Dosya');
        msg.set("fileType", fileType || 'unknown');
    }
    await msg.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("deleteTeamMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var msgId = request.params.msgId;
    if (!msgId) throw new Error('Mesaj ID gerekli!');

    var query = new Parse.Query(TeamMessage);
    var msg = await query.get(msgId, { useMasterKey: true });
    if (!msg) throw new Error('Mesaj bulunamadı!');

    var teamId = msg.get('team_id');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');

    var isMyMessage = (msg.get('user_email') === user.get('email'));
    var isOwner = (team.get('owner_email') === user.get('email'));
    var isManager = (team.get('manager_email') === user.get('email'));
    var isFounder = (user.get('role') === 'founder');
    var isModerator = (user.get('role') === 'moderator');
    var isVizyonFounder = (user.get('email') === 'admin.tr.reis@gmail.com');

    if (!isMyMessage && !isOwner && !isManager && !isFounder && !isModerator) {
        throw new Error('Bu mesajı silme yetkiniz yok!');
    }
    if (msg.get('user_email') === 'system@vizyon2027.com' && !isVizyonFounder) {
        throw new Error('Sistem mesajlarını sadece kurucu silebilir!');
    }

    msg.set('deleted', true);
    msg.set('deleted_by', user.get('email'));
    msg.set('deleted_at', new Date());
    if (isVizyonFounder && !isMyMessage) {
        msg.set('deleted_by_founder', true);
    }
    await msg.save(null, { useMasterKey: true });

    return { success: true, message: 'Mesaj silindi.' };
});

Parse.Cloud.define("editTeamMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var msgId = request.params.msgId;
    var newMessage = request.params.newMessage;
    if (!msgId || !newMessage) throw new Error('Mesaj ID ve yeni mesaj gerekli!');
    if (!newMessage.trim()) throw new Error('Mesaj boş olamaz!');

    var query = new Parse.Query(TeamMessage);
    var msg = await query.get(msgId, { useMasterKey: true });
    if (!msg) throw new Error('Mesaj bulunamadı!');
    if (msg.get('deleted')) throw new Error('Silinmiş mesaj düzenlenemez!');

    if (msg.get('user_email') !== user.get('email')) {
        throw new Error('Sadece kendi mesajınızı düzenleyebilirsiniz!');
    }

    msg.set('message', filterText(newMessage.trim()));
    msg.set('edited', true);
    msg.set('edited_at', new Date());
    await msg.save(null, { useMasterKey: true });

    return { success: true, message: 'Mesaj düzenlendi.' };
});

Parse.Cloud.define("getTeamMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var msgId = request.params.msgId;
    if (!msgId) throw new Error('Mesaj ID gerekli!');

    var query = new Parse.Query(TeamMessage);
    var msg = await query.get(msgId, { useMasterKey: true });
    if (!msg) return { success: false, error: 'Mesaj bulunamadı!' };

    return {
        success: true,
        message: {
            id: msg.id,
            user_email: msg.get('user_email'),
            user_name: msg.get('user_name'),
            message: msg.get('message'),
            fileUrl: msg.get('fileUrl'),
            fileName: msg.get('fileName'),
            deleted: msg.get('deleted') || false,
            edited: msg.get('edited') || false,
            createdAt: msg.get('createdAt')
        }
    };
});

Parse.Cloud.define("inviteToTeam", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Önce takım oluşturun!');
    var email = request.params.email;
    if (!email) throw new Error('E-posta adresi gerekli!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    var inbox = new Inbox();
    inbox.set("sender_email", user.get('email'));
    inbox.set("receiver_email", email);
    inbox.set("type", "team_invite");
    inbox.set("team_id", teamId);
    inbox.set("team_name", team.get('name'));
    inbox.set("status", "pending");
    inbox.set("message", user.get('name') + ' sizi "' + team.get('name') + '" takımına davet etti!');
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("acceptTeamInvite", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = request.params.teamId;
    var inboxId = request.params.inboxId;
    if (!teamId || !inboxId) throw new Error('Takım ID ve Inbox ID gerekli!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    var existing = await memberQuery.first({ useMasterKey: true });
    if (existing) throw new Error('Zaten bu takımın üyesisiniz!');
    var member = new TeamMember();
    member.set("team_id", teamId);
    member.set("user_email", user.get('email'));
    await member.save(null, { useMasterKey: true });
    user.set("teamId", teamId);
    await user.save(null, { useMasterKey: true });
    var inboxQuery = new Parse.Query(Inbox);
    var inbox = await inboxQuery.get(inboxId, { useMasterKey: true });
    inbox.set("status", "accepted");
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: 'Takıma katıldınız!' };
});

Parse.Cloud.define("rejectTeamInvite", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var inboxId = request.params.inboxId;
    if (!inboxId) throw new Error('Inbox ID gerekli!');
    var inboxQuery = new Parse.Query(Inbox);
    var inbox = await inboxQuery.get(inboxId, { useMasterKey: true });
    inbox.set("status", "rejected");
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("leaveTeam", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (team.get('owner_email') === user.get('email')) {
        throw new Error('Takım sahibi ayrılamaz, önce sahipliği devredin.');
    }
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    var member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error('Bu takımın üyesi değilsiniz!');
    await member.destroy({ useMasterKey: true });
    user.set("teamId", null);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("getTeamMembers", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    var members = await memberQuery.find({ useMasterKey: true });
    var emailList = members.map(function (m) { return m.get('user_email'); });
    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn('email', emailList);
    var users = await userQuery.find({ useMasterKey: true });
    var userMap = {};
    users.forEach(function (u) { userMap[u.get('email')] = u.get('name') || u.get('username') || 'İsimsiz'; });
    var list = members.map(function (m) {
        var email = m.get('user_email');
        return {
            email: email,
            name: userMap[email] || email.split('@')[0] || 'İsimsiz',
            isOwner: email === team.get('owner_email'),
            isManager: email === team.get('manager_email')
        };
    });
    return { success: true, members: list, owner: team.get('owner_email'), manager: team.get('manager_email') };
});

Parse.Cloud.define("makeTeamManager", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    if (team.get('owner_email') !== user.get('email')) throw new Error('Sadece takım sahibi yönetici atayabilir!');
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    var member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error('Bu kullanıcı takımda değil!');
    team.set("manager_email", targetEmail);
    await team.save(null, { useMasterKey: true });
    return { success: true, message: targetEmail + ' yönetici atandı!' };
});

Parse.Cloud.define("demoteManager", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    if (team.get('owner_email') !== user.get('email')) throw new Error('Sadece takım sahibi yöneticiyi çıkarabilir!');
    if (team.get('manager_email') !== targetEmail) throw new Error('Bu kullanıcı yönetici değil!');
    team.set("manager_email", null);
    await team.save(null, { useMasterKey: true });
    return { success: true, message: targetEmail + ' yöneticilikten çıkarıldı.' };
});

Parse.Cloud.define("removeFromTeam", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    var isOwner = team.get('owner_email') === user.get('email');
    var isManager = team.get('manager_email') === user.get('email') && !isOwner;
    var isFounder = user.get('role') === 'founder';
    var isModerator = user.get('role') === 'moderator';
    if (!isOwner && !isManager && !isFounder && !isModerator) throw new Error('Sadece takım sahibi veya yöneticisi üye atabilir!');
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    var member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error('Bu kullanıcı takımda değil!');
    if (targetEmail === team.get('owner_email')) throw new Error('Takım sahibi atılamaz!');
    if (targetEmail === team.get('manager_email') && !isOwner && !isFounder && !isModerator) throw new Error('Yöneticiyi sadece takım sahibi atabilir!');
    await member.destroy({ useMasterKey: true });
    if (targetEmail === team.get('manager_email')) {
        team.set("manager_email", null);
        await team.save(null, { useMasterKey: true });
    }
    var targetUserQuery = new Parse.Query(Parse.User);
    targetUserQuery.equalTo('email', targetEmail);
    var targetUser = await targetUserQuery.first({ useMasterKey: true });
    if (targetUser) {
        targetUser.set('teamId', null);
        await targetUser.save(null, { useMasterKey: true });
    }
    return { success: true, message: targetEmail + ' takımdan atıldı!' };
});

Parse.Cloud.define("transferOwnership", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    if (team.get('owner_email') !== user.get('email')) throw new Error('Sadece takım sahibi sahipliği devredebilir!');
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    var member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error('Bu kullanıcı takımda değil!');
    var oldOwnerEmail = user.get('email');
    team.set("owner_email", targetEmail);
    team.set("manager_email", oldOwnerEmail);
    await team.save(null, { useMasterKey: true });
    var inbox = new Inbox();
    inbox.set("sender_email", 'system@vizyon2027.com');
    inbox.set("receiver_email", targetEmail);
    inbox.set("type", "notification");
    inbox.set("message", '👑 ' + user.get('name') + ' size ' + team.get('name') + ' takımının sahipliğini devretti.');
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: 'Sahipliği ' + targetEmail + ' adlı kullanıcıya devrettiniz.' };
});

Parse.Cloud.define("closeTeam", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Takımınız yok!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    if (team.get('owner_email') !== user.get('email') && user.get('role') !== 'founder') {
        throw new Error('Sadece takım sahibi veya kurucu kapatabilir!');
    }
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    var members = await memberQuery.find({ useMasterKey: true });
    for (var ci = 0; ci < members.length; ci++) {
        var email = members[ci].get('user_email');
        var inbox = new Inbox();
        inbox.set("sender_email", 'system@vizyon2027.com');
        inbox.set("receiver_email", email);
        inbox.set("type", "notification");
        inbox.set("message", '🚫 ' + team.get('name') + ' (' + team.get('teamCode') + ') takımı ' + user.get('name') + ' tarafından kapatıldı.');
        await inbox.save(null, { useMasterKey: true });
        var userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("email", email);
        var u = await userQuery.first({ useMasterKey: true });
        if (u) { u.set("teamId", null); await u.save(null, { useMasterKey: true }); }
    }
    var msgQuery = new Parse.Query(TeamMessage);
    msgQuery.equalTo("team_id", teamId);
    var msgs = await msgQuery.find({ useMasterKey: true });
    for (var mi = 0; mi < msgs.length; mi++) await msgs[mi].destroy({ useMasterKey: true });
    await team.destroy({ useMasterKey: true });
    user.set("teamId", null);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("getAllTeams", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu görebilir!');
    var query = new Parse.Query(Team);
    var teams = await query.find({ useMasterKey: true });
    var result = [];
    for (var ti = 0; ti < teams.length; ti++) {
        var t = teams[ti];
        var mq = new Parse.Query(TeamMember);
        mq.equalTo("team_id", t.id);
        var count = await mq.count({ useMasterKey: true });
        result.push({ id: t.id, name: t.get('name'), code: t.get('teamCode'), owner: t.get('owner_email'), memberCount: count });
    }
    return result;
});

Parse.Cloud.define("searchTeams", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu görebilir!');
    var query = request.params.query;
    if (!query) return [];
    var q = new Parse.Query(Team);
    q.matches('name', new RegExp(query, 'i'));
    var q2 = new Parse.Query(Team);
    q2.matches('teamCode', new RegExp(query, 'i'));
    var mainQuery = Parse.Query.or(q, q2);
    var teams = await mainQuery.find({ useMasterKey: true });
    var result = [];
    for (var ti = 0; ti < teams.length; ti++) {
        var t = teams[ti];
        var mq = new Parse.Query(TeamMember);
        mq.equalTo("team_id", t.id);
        var count = await mq.count({ useMasterKey: true });
        result.push({ id: t.id, name: t.get('name'), code: t.get('teamCode'), owner: t.get('owner_email'), memberCount: count });
    }
    return result;
});

Parse.Cloud.define("joinTeamAsFounder", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu yapabilir!');
    var teamId = request.params.teamId;
    if (!teamId) throw new Error('Takım ID gerekli!');
    var tq = new Parse.Query(Team);
    var team = await tq.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    var mq = new Parse.Query(TeamMember);
    mq.equalTo("team_id", teamId);
    mq.equalTo("user_email", user.get('email'));
    var existing = await mq.first({ useMasterKey: true });
    if (!existing) {
        var member = new TeamMember();
        member.set("team_id", teamId);
        member.set("user_email", user.get('email'));
        await member.save(null, { useMasterKey: true });
    }
    user.set("teamId", teamId);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("forceCloseTeam", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu yapabilir!');
    var teamId = request.params.teamId;
    if (!teamId) throw new Error('Takım ID gerekli!');
    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    var members = await memberQuery.find({ useMasterKey: true });
    for (var ci = 0; ci < members.length; ci++) {
        var email = members[ci].get('user_email');
        var inbox = new Inbox();
        inbox.set("sender_email", 'system@vizyon2027.com');
        inbox.set("receiver_email", email);
        inbox.set("type", "notification");
        inbox.set("message", '🚫 ' + team.get('name') + ' (' + team.get('teamCode') + ') takımı Vizyon Kurucu tarafından kapatıldı.');
        await inbox.save(null, { useMasterKey: true });
        var userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("email", email);
        var u = await userQuery.first({ useMasterKey: true });
        if (u) { u.set("teamId", null); await u.save(null, { useMasterKey: true }); }
    }
    var msgQuery = new Parse.Query(TeamMessage);
    msgQuery.equalTo("team_id", teamId);
    var msgs = await msgQuery.find({ useMasterKey: true });
    for (var mi = 0; mi < msgs.length; mi++) await msgs[mi].destroy({ useMasterKey: true });
    await team.destroy({ useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("getTeamChatHistory", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (user.get('role') !== 'founder') throw new Error('Sadece kurucu takım sohbet geçmişini okuyabilir!');

    var teamId = request.params.teamId;
    var limit = request.params.limit;
    if (!teamId) throw new Error('Takım ID gerekli!');

    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');

    var msgQuery = new Parse.Query(TeamMessage);
    msgQuery.equalTo("team_id", teamId);
    msgQuery.ascending('createdAt');
    if (limit) msgQuery.limit(parseInt(limit));
    else msgQuery.limit(100);
    var messages = await msgQuery.find({ useMasterKey: true });

    return messages.map(function (msg) {
        return {
            id: msg.id,
            user_email: msg.get('user_email'),
            user_name: msg.get('user_name'),
            message: msg.get('message'),
            fileUrl: msg.get('fileUrl'),
            fileName: msg.get('fileName'),
            createdAt: msg.get('createdAt')
        };
    });
});

Parse.Cloud.define("toggleUserFeature", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu bu işlemi yapabilir!');

    var targetEmail = request.params.targetEmail;
    var feature = request.params.feature;
    var enabled = request.params.enabled;
    if (!targetEmail || !feature) throw new Error('Hedef e-posta ve özellik adı gerekli!');
    if (typeof enabled !== 'boolean') throw new Error('enabled boolean olmalı!');

    var targetQuery = new Parse.Query(Parse.User);
    targetQuery.equalTo('email', targetEmail);
    var target = await targetQuery.first({ useMasterKey: true });
    if (!target) throw new Error('Kullanıcı bulunamadı!');

    var disabled = target.get('disabled_features') || [];
    if (enabled) {
        if (disabled.indexOf(feature) === -1) {
            disabled.push(feature);
            target.set('disabled_features', disabled);
            await target.save(null, { useMasterKey: true });
        }
    } else {
        var index = disabled.indexOf(feature);
        if (index !== -1) {
            disabled.splice(index, 1);
            target.set('disabled_features', disabled);
            await target.save(null, { useMasterKey: true });
        }
    }

    return { success: true, message: targetEmail + ' için "' + feature + '" özelliği ' + (enabled ? 'engellendi' : 'engel kaldırıldı') + '.' };
});

// ================================================================
// ========== VİZYON DESTEK AI ==========
// ================================================================
Parse.Cloud.define("vizyonSupportAI", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');

    if (user.get('email').toLowerCase() === 'admin.tr.reis@gmail.com') {
        var lower = message.toLowerCase();
        var response = null;

        if (lower.indexOf('tüm üyeleri listele') !== -1 || lower.indexOf('tüm kullanıcıları listele') !== -1) {
            try {
                var users = await Parse.Cloud.run('getAllUsers', {}, { useMasterKey: true });
                if (users && users.length > 0) {
                    var text = '👥 Tüm Kullanıcılar:\n\n';
                    users.forEach(function (u) {
                        var roleLabels = { founder: '👑 Kurucu', admin: '⚙️ Admin', beta: '🔬 Beta', moderator: '🎨 Moderatör', user: '👤 Kullanıcı' };
                        var roleLabel = roleLabels[u.role] || '👤 Kullanıcı';
                        var planLabels = { pro: '🌟 Pro', team: '👥 Takım', free: '🆓 Ücretsiz' };
                        var planLabel = planLabels[u.plan] || '🆓 Ücretsiz';
                        text += '📧 ' + u.email + ' | ' + u.name + ' | ' + roleLabel + ' | ' + planLabel + ' | Puan: ' + u.points + '\n';
                    });
                    response = text;
                } else {
                    response = '📭 Hiç kullanıcı bulunamadı.';
                }
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        if (lower.indexOf('tüm takımları listele') !== -1) {
            try {
                var teams = await Parse.Cloud.run('getAllTeams', {}, { useMasterKey: true });
                if (teams && teams.length > 0) {
                    var text2 = '🌐 Tüm Takımlar:\n\n';
                    teams.forEach(function (t) {
                        text2 += '🏢 ' + t.name + ' (Kod: ' + t.code + ') | 👑 ' + t.owner + ' | ' + t.memberCount + ' üye\n';
                    });
                    response = text2;
                } else {
                    response = '📭 Hiç takım bulunamadı.';
                }
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchTeamHistory = lower.match(/takım (?:sohbet|mesajları?nı?|geçmişini?) (?:göster|oku|getir|ver)\s+(\w+)/);
        if (matchTeamHistory) {
            var teamCodeOrId = matchTeamHistory[1];
            var teamQuery = new Parse.Query(Team);
            teamQuery.equalTo('teamCode', teamCodeOrId.toUpperCase());
            var team = await teamQuery.first({ useMasterKey: true });
            if (!team) {
                try {
                    team = await new Parse.Query(Team).get(teamCodeOrId, { useMasterKey: true });
                } catch (e) {}
            }
            if (team) {
                try {
                    var msgs = await Parse.Cloud.run('getTeamChatHistory', { teamId: team.id, limit: 50 }, { useMasterKey: true });
                    if (msgs && msgs.length > 0) {
                        var text3 = '📜 Takım "' + team.get('name') + '" (' + team.get('teamCode') + ') sohbet geçmişi:\n\n';
                        msgs.forEach(function (m) {
                            var sender = m.user_name || m.user_email || 'Bilinmiyor';
                            var msgText = m.message || '[Dosya]';
                            var time = new Date(m.createdAt).toLocaleString('tr-TR');
                            text3 += '[' + time + '] ' + sender + ': ' + msgText + '\n';
                        });
                        response = text3;
                    } else {
                        response = '📭 Takımda henüz mesaj yok.';
                    }
                } catch (e) {
                    response = '❌ Takım sohbeti okunamadı: ' + e.message;
                }
            } else {
                response = '❌ "' + teamCodeOrId + '" kodlu veya ID\'li takım bulunamadı.';
            }
        }

        var matchUserInfo = lower.match(/kullanıcı bilgisi\s+(\S+@\S+)/);
        if (matchUserInfo) {
            var email = matchUserInfo[1];
            try {
                var query = new Parse.Query(Parse.User);
                query.equalTo('email', email);
                var target = await query.first({ useMasterKey: true });
                if (target) {
                    var roleLabels2 = { founder: '👑 Kurucu', admin: '⚙️ Admin', beta: '🔬 Beta', moderator: '🎨 Moderatör', user: '👤 Kullanıcı' };
                    var roleLabel2 = roleLabels2[target.get('role')] || '👤 Kullanıcı';
                    var planLabels2 = { pro: '🌟 Pro', team: '👥 Takım', free: '🆓 Ücretsiz' };
                    var planLabel2 = planLabels2[target.get('plan')] || '🆓 Ücretsiz';
                    var disabledFeatures = target.get('disabled_features') || [];
                    var disabledText = disabledFeatures.length ? 'Engelli Özellikler: ' + disabledFeatures.join(', ') : 'Hiçbir özellik engelli değil.';
                    response = '📧 ' + email + '\n👤 ' + (target.get('name') || 'İsimsiz') + '\n👑 Rol: ' + roleLabel2 + '\n📦 Plan: ' + planLabel2 + '\n⭐ Puan: ' + (target.get('points') || 0) + '\n🏷️ Seviye: ' + (target.get('level') || 'Çaylak') + '\n🚫 Engelli: ' + (target.get('isBanned') ? 'Evet' : 'Hayır') + '\n🔧 ' + disabledText;
                } else {
                    response = '❌ Kullanıcı bulunamadı: ' + email;
                }
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchAssignAdmin = lower.match(/admin ata\s+(\S+@\S+)/);
        if (matchAssignAdmin) {
            var email2 = matchAssignAdmin[1];
            try {
                await Parse.Cloud.run('assignAdmin', { email: email2 }, { useMasterKey: true });
                response = '✅ ' + email2 + ' başarıyla Admin yapıldı.';
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchSetBeta = lower.match(/beta yap\s+(\S+@\S+)/);
        if (matchSetBeta) {
            var email3 = matchSetBeta[1];
            try {
                await Parse.Cloud.run('setUserRole', { email: email3, role: 'beta' }, { useMasterKey: true });
                response = '✅ ' + email3 + ' başarıyla Beta yapıldı.';
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchBan = lower.match(/kullanıcıyı yasakla\s+(\S+@\S+)/);
        if (matchBan) {
            var email4 = matchBan[1];
            try {
                await Parse.Cloud.run('banUser', { targetEmail: email4 }, { useMasterKey: true });
                response = '✅ ' + email4 + ' yasaklandı.';
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchUnban = lower.match(/kullanıcının yasağını kaldır\s+(\S+@\S+)/);
        if (matchUnban) {
            var email5 = matchUnban[1];
            try {
                await Parse.Cloud.run('unbanUser', { targetEmail: email5 }, { useMasterKey: true });
                response = '✅ ' + email5 + ' yasağı kaldırıldı.';
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchPlan = lower.match(/kullanıcının planını (\w+) yap\s+(\S+@\S+)/);
        if (matchPlan) {
            var plan = matchPlan[1];
            var email6 = matchPlan[2];
            if (['free', 'pro', 'team'].indexOf(plan) !== -1) {
                try {
                    await Parse.Cloud.run('setUserPlan', { email: email6, plan: plan }, { useMasterKey: true });
                    response = '✅ ' + email6 + ' planı "' + plan + '" olarak güncellendi.';
                } catch (e) {
                    response = '❌ Hata: ' + e.message;
                }
            } else {
                response = '❌ Geçersiz plan: ' + plan + '. (free, pro, team)';
            }
        }

        var matchGift = lower.match(/hediye gönder\s+(\S+@\S+)\s+(pro|team)/);
        if (matchGift) {
            var email7 = matchGift[1];
            var pkg = matchGift[2];
            try {
                await Parse.Cloud.run('sendGiftRequest', { email: email7, packageType: pkg }, { useMasterKey: true });
                response = '✅ ' + email7 + ' adresine ' + (pkg === 'pro' ? '🌟 Pro' : '👥 Takım') + ' paketi hediye edildi.';
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchRole = lower.match(/kullanıcının rolünü (\w+) yap\s+(\S+@\S+)/);
        if (matchRole) {
            var role = matchRole[1];
            var email8 = matchRole[2];
            if (['user', 'admin', 'beta', 'founder', 'moderator'].indexOf(role) !== -1) {
                try {
                    await Parse.Cloud.run('setUserRole', { email: email8, role: role }, { useMasterKey: true });
                    response = '✅ ' + email8 + ' rolü "' + role + '" olarak güncellendi.';
                } catch (e) {
                    response = '❌ Hata: ' + e.message;
                }
            } else {
                response = '❌ Geçersiz rol: ' + role + '. (user, admin, beta, founder, moderator)';
            }
        }

        var matchDisableFeature = lower.match(/kullanıcının (\w+) yapmasını engelle\s+(\S+@\S+)/);
        if (matchDisableFeature) {
            var feature = matchDisableFeature[1];
            var email9 = matchDisableFeature[2];
            try {
                await Parse.Cloud.run('toggleUserFeature', { targetEmail: email9, feature: feature, enabled: true }, { useMasterKey: true });
                response = '✅ ' + email9 + ' için "' + feature + '" özelliği engellendi.';
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        var matchEnableFeature = lower.match(/kullanıcının (\w+) yapmasını aç\s+(\S+@\S+)/);
        if (matchEnableFeature) {
            var feature2 = matchEnableFeature[1];
            var email10 = matchEnableFeature[2];
            try {
                await Parse.Cloud.run('toggleUserFeature', { targetEmail: email10, feature: feature2, enabled: false }, { useMasterKey: true });
                response = '✅ ' + email10 + ' için "' + feature2 + '" özelliğinin engeli kaldırıldı.';
            } catch (e) {
                response = '❌ Hata: ' + e.message;
            }
        }

        if (response) {
            return { reply: response };
        }

        var siteContent = await getSiteContent();
        var prompt = 'Sen VİZYON DESTEK asistanısın. Kullanıcı KURUCU (' + user.get('email') + '). Kurucu sistemde her şeyi yapabilir. Ona her konuda yardımcı ol. Kurucu mesajı: "' + message + '" Site içeriği: ' + siteContent.substring(0, 2000) + ' Cevabını kurucuya özel, saygılı ve kapsamlı ver. Eğer kurucu bir şey yapmamı istiyorsa, direkt olarak yap ve sonucu söyle. Asla "nasıl yapacağını anlatma", sadece yap.';
        var reply3 = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { reply: cleanResponse(reply3) };
    }

    var isGreeting2 = ['selam', 'merhaba', 'hey', 'slm', 'hello', 'hi', 'naber', 'nasılsın', 'iyi misin'].some(function (w) { return message.toLowerCase().indexOf(w) !== -1; });

    if (isGreeting2) {
        return { reply: 'Merhaba! Ben Vizyon Destek. Site hakkında yardım, destek, şikayet ve öneriler için buradayım. Size nasıl yardımcı olabilirim?' };
    }

    try {
        var classPrompt = 'Aşağıdaki kullanıcı mesajı VİZYON2027 sitesi hakkında YARDIM, DESTEK, ŞİKAYET, ÖNERİ, veya SİTE BİLGİSİ sorusu mu, yoksa GENEL bir soru mu?\n\nMesaj: "' + message + '"\n\nCevabın SADECE "DESTEK" veya "GENEL" olmalı. Açıklama yapma.';
        var classResult = await Parse.Cloud.run('superAI', { prompt: classPrompt }, { useMasterKey: true });
        var isSupportRelated = classResult && classResult.toUpperCase().indexOf('DESTEK') !== -1;

        if (!isSupportRelated) {
            return { reply: 'Bu konuda yetkim yok. Ben sadece VİZYON2027 sitesi hakkında yardım, destek, şikayet ve öneriler için buradayım. Diğer konular için lütfen @vizyonal yazarak VİZYON AI\'ya sorun. 🙏' };
        }

        var siteContent2 = await getSiteContent();
        var prompt2 = 'Sen VİZYON DESTEK\'sin. Kullanıcı sorusu: "' + message + '". VİZYON2027 sitesi hakkında bilgi: ' + siteContent2.substring(0, 1500) + '\n\nKısa, net ve DIRECT cevap ver. 3 cümleyi geçmesin. Resmi ol.';
        var reply4 = await Parse.Cloud.run("superAI", { prompt: prompt2 }, { useMasterKey: true });
        return { reply: cleanResponse(reply4) };
    } catch (e) {
        return { reply: 'Şu anda teknik bir sorun nedeniyle cevap veremiyorum. Lütfen daha sonra tekrar deneyin.' };
    }
});

// ================================================================
// ========== V27 KOÇ ASİSTANI (v7.9.0 + v7.9.2 MODERATÖR) =======
// ================================================================
// Haftalık limitler:
//   • Free: 10 işlem
//   • Pro: 50 işlem
//   • Team: 1000 işlem
//   • Admin/Beta/Founder/Moderator: Sınırsız (-1)
// ================================================================
function getKocLimitForUser(user) {
    if (!user) return 0;
    var role = user.get('role');
    var plan = user.get('plan');
    // ✅ [v7.9.2 GÜNCELLENDİ] moderator eklendi
    if (role === 'founder' || role === 'admin' || role === 'beta' || role === 'moderator') return -1; // Sınırsız
    if (plan === 'team') return 1000;
    if (plan === 'pro') return 50;
    return 10; // Free
}

function getCurrentWeekStart() {
    var now = new Date();
    var day = now.getDay(); // 0 Pazar, 1 Pazartesi...
    var diff = (day === 0 ? 6 : day - 1); // Pazartesi = 0
    var monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

async function getOrCreateKocUsage(user) {
    var weekStart = getCurrentWeekStart();
    var weekKey = weekStart.toISOString().split('T')[0];

    var query = new Parse.Query(KocUsage);
    query.equalTo('user_email', user.get('email'));
    var usage = await query.first({ useMasterKey: true });

    if (!usage) {
        usage = new KocUsage();
        usage.set('user_email', user.get('email'));
        usage.set('week_start', weekStart);
        usage.set('count', 0);
        usage.set('total_count', 0);
        usage.set('last_reset', new Date());
        await usage.save(null, { useMasterKey: true });
        return usage;
    }

    var storedWeekStart = usage.get('week_start');
    if (!storedWeekStart) {
        usage.set('week_start', weekStart);
        usage.set('count', 0);
        usage.set('last_reset', new Date());
        await usage.save(null, { useMasterKey: true });
        return usage;
    }

    var storedKey = new Date(storedWeekStart).toISOString().split('T')[0];
    if (storedKey !== weekKey) {
        usage.set('week_start', weekStart);
        usage.set('count', 0);
        usage.set('last_reset', new Date());
        await usage.save(null, { useMasterKey: true });
    }

    return usage;
}

function generateKocSharePassword() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var pw = '';
    for (var i = 0; i < 8; i++) {
        pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pw;
}

function hashKocPassword(password, salt) {
    if (!crypto) throw new Error('crypto modülü yüklü değil!');
    var useSalt = salt || crypto.randomBytes(16).toString('hex');
    var hash = crypto.pbkdf2Sync(password, useSalt, 100000, 64, 'sha512').toString('hex');
    return { salt: useSalt, hash: hash };
}

function verifyKocPassword(password, salt, storedHash) {
    if (!crypto) return false;
    if (!password || !salt || !storedHash) return false;
    var computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return computed === storedHash;
}

// ---------- Koç ile sohbet et ----------
// ✅ [v7.9.2 FIX] Mesajlar Message sınıfına KAYDEDİLİYOR
Parse.Cloud.define("kocChat", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var message = request.params.message;
    var conversationId = request.params.conversationId;
    if (!message || !message.trim()) throw new Error('Mesaj gerekli!');
    if (message.length > 2000) throw new Error('Mesaj çok uzun (max 2000 karakter).');

    var _rlk = 'kocChat:' + user.get('email');
    await checkRateLimit(_rlk, 30, 60 * 1000);
    await recordAttempt(_rlk);

    // Haftalık limit kontrolü
    var limit = getKocLimitForUser(user);
    var usage = await getOrCreateKocUsage(user);
    var used = usage.get('count') || 0;

    if (limit !== -1 && used >= limit) {
        return {
            success: false,
            error: 'Haftalık Koç işlem limitiniz doldu! (' + used + '/' + limit + ')',
            limit: limit,
            used: used,
            remaining: 0
        };
    }

    var conv;
    if (conversationId) {
        var convQuery = new Parse.Query(KocConversation);
        conv = await convQuery.get(conversationId, { useMasterKey: true });
        if (!conv || conv.get('user_email') !== user.get('email')) {
            throw new Error('Bu sohbet size ait değil!');
        }
    } else {
        conv = new KocConversation();
        conv.set('user_email', user.get('email'));
        conv.set('user_name', user.get('name') || 'Kullanıcı');
        conv.set('messageCount', 0);
        conv.set('created_at_client', new Date());
        conv.set('is_shared', false);
    }

    // Rol bazlı prompt
    var role = user.get('role');
    var plan = user.get('plan');
    var roleContext = 'Kullanıcı rolü: ' + role + ', plan: ' + plan + '. ';

    if (role === 'founder') {
        roleContext += 'Bu kullanıcı KURUCU. Tüm yetkilere sahip. Ona kurucu gibi davran, tüm işlemleri yapabilir. ';
    } else if (role === 'admin') {
        roleContext += 'Bu kullanıcı ADMIN. Admin yetkilerine sahip. ';
    } else if (role === 'moderator') {
        roleContext += 'Bu kullanıcı MODERATÖR / TASARIMCI. Sınırsız yetkilere sahip (beta gibi). ';
    } else if (role === 'beta') {
        roleContext += 'Bu kullanıcı BETA tester. Beta yetkilerine sahip. ';
    } else if (plan === 'team') {
        roleContext += 'Bu kullanıcı TAKIM paketi üyesi. ';
    } else if (plan === 'pro') {
        roleContext += 'Bu kullanıcı PRO paket üyesi. ';
    } else {
        roleContext += 'Bu kullanıcı ÜCRETSİZ üye. ';
    }

    var systemPrompt = 'Sen V27 KOÇ\'sun. Kullanıcılara çok samimi, sıcak, destekleyici bir dille yaklaşırsın. ' +
        'Kullanıcı hangi role sahipse o roldeki tüm işlemleri yapabilirsin. Örneğin kullanıcı "bana proje oluştur" derse projeyi onun hesabına kaydet. ' +
        'Psikolojik destek, yol haritası, rehberlik, moral verme ve pratik çözümler sun. ' +
        'Kullanıcıya "kardeşim", "dostum" gibi samimi hitaplar kullanabilirsin ama asla saygısızlık yapma. ' +
        'Cevapların Türkçe, net, kısa ve motive edici olsun. ' +
        roleContext;

    var fullPrompt = systemPrompt + '\n\nKullanıcı mesajı: ' + message;

    var reply = '';
    try {
        reply = await Parse.Cloud.run('superAI', { prompt: fullPrompt }, { useMasterKey: true });
        if (!reply || reply.length < 2) {
            reply = 'Seni duydum kardeşim. Biraz daha detay verebilir misin, sana daha iyi yardımcı olayım. 🤝';
        }
    } catch (e) {
        console.error('kocChat superAI hatası:', e.message);
        reply = 'Şu anda bir bağlantı sorunu yaşıyorum. Lütfen biraz sonra tekrar dene. 🤝';
    }

    // ✅ [v7.9.2 FIX] Konuşma başlığı — her yeni mesajda başlık boşsa ata
    if (!conv.get('title') || conv.get('title') === 'Yeni Sohbet' || conv.get('title') === '') {
        var titleText = message.substring(0, 60).trim();
        if (message.length > 60) titleText += '...';
        conv.set('title', titleText);
        conv.set('topic', titleText);
    }

    // Son mesaj zamanını güncelle (geçmiş listesinde üste çıksın)
    conv.set('last_message_at', new Date());
    var msgCount = (conv.get('messageCount') || 0) + 2;
    conv.set('messageCount', msgCount);

    // ✅ [v7.9.2 FIX] Konuşmayı kaydet (mesaj kaydı için önce ID lazım)
    await conv.save(null, { useMasterKey: true });

    // ✅ [v7.9.2 FIX] MESAJLARI MESSAGE SINIFINA KAYDET
    try {
        // Kullanıcı mesajını kaydet
        var userMsg = new Message();
        userMsg.set('from_email', user.get('email'));
        userMsg.set('to_email', 'system@vizyon2027.com');
        userMsg.set('conversationId', conv.id);
        userMsg.set('text', message.trim());
        userMsg.set('is_read', true);
        userMsg.set('is_ai', false);
        await userMsg.save(null, { useMasterKey: true });
        console.log('💾 Koç kullanıcı mesajı kaydedildi:', userMsg.id);

        // Koç cevabını kaydet
        var coachMsg = new Message();
        coachMsg.set('from_email', 'system@vizyon2027.com');
        coachMsg.set('to_email', user.get('email'));
        coachMsg.set('conversationId', conv.id);
        coachMsg.set('text', reply);
        coachMsg.set('is_read', true);
        coachMsg.set('is_ai', true);
        coachMsg.set('ai_name', '🧭 V27 KOÇ');
        await coachMsg.save(null, { useMasterKey: true });
        console.log('💾 Koç AI mesajı kaydedildi:', coachMsg.id);
    } catch (msgSaveErr) {
        console.error('❌ Koç mesajları Message sınıfına kaydedilemedi:', msgSaveErr.message);
    }

    // Kullanımı artır
    usage.increment('count');
    usage.increment('total_count');
    await usage.save(null, { useMasterKey: true });

    var remaining = limit === -1 ? -1 : (limit - (usage.get('count') || 0));

    return {
        success: true,
        reply: cleanResponse(reply),
        conversationId: conv.id,
        conversationTitle: conv.get('title'),
        limit: limit,
        used: usage.get('count'),
        remaining: remaining
    };
});

// ---------- Koç geçmiş listesi ----------
// ✅ [v7.9.2 FIX] last_message_at ile doğru sıralama
Parse.Cloud.define("getKocHistory", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var query = new Parse.Query(KocConversation);
    query.equalTo('user_email', user.get('email'));
    // ✅ [v7.9.2 FIX] last_message_at alanı varsa ona göre, yoksa updatedAt
    query.descending('last_message_at');
    query.limit(50);
    var convs = await query.find({ useMasterKey: true });

    // last_message_at null olanları updatedAt ile sırala (fallback)
    convs.sort(function (a, b) {
        var aTime = a.get('last_message_at') || a.get('updatedAt') || a.get('createdAt');
        var bTime = b.get('last_message_at') || b.get('updatedAt') || b.get('createdAt');
        return new Date(bTime) - new Date(aTime);
    });

    return {
        success: true,
        conversations: convs.map(function (c) {
            return {
                id: c.id,
                title: c.get('title') || 'Sohbet',
                topic: c.get('topic') || c.get('title') || 'Sohbet',
                messageCount: c.get('messageCount') || 0,
                is_shared: c.get('is_shared') || false,
                shared_at: c.get('shared_at') || null,
                createdAt: c.get('created_at_client') || c.get('createdAt'),
                updatedAt: c.get('last_message_at') || c.get('updatedAt')
            };
        })
    };
});

// ---------- Koç konuşma mesajlarını getir ----------
Parse.Cloud.define("getKocConversationMessages", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var conversationId = request.params.conversationId;
    if (!conversationId) throw new Error('Konuşma ID gerekli!');

    var convQuery = new Parse.Query(KocConversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Sohbet bulunamadı!');
    if (conv.get('user_email') !== user.get('email')) throw new Error('Bu sohbet size ait değil!');

    // ✅ [v7.9.2] Mesajları Message sınıfından al
    var msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    msgQuery.ascending('createdAt');
    msgQuery.limit(500);
    var msgs = await msgQuery.find({ useMasterKey: true });

    return {
        success: true,
        messages: msgs.map(function (m) {
            var isUser = m.get('is_ai') !== true && m.get('from_email') === user.get('email');
            return {
                id: m.id,
                sender: isUser ? 'user' : 'coach',
                text: m.get('text') || '',
                createdAt: m.get('createdAt')
            };
        })
    };
});

// ---------- Koç kullanım durumu ----------
Parse.Cloud.define("getKocUsage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var limit = getKocLimitForUser(user);
    var usage = await getOrCreateKocUsage(user);
    var used = usage.get('count') || 0;
    var remaining = limit === -1 ? -1 : Math.max(0, limit - used);

    return {
        success: true,
        used: used,
        limit: limit,
        remaining: remaining,
        weekStart: usage.get('week_start'),
        totalCount: usage.get('total_count') || 0
    };
});

// ---------- Koç kullanım sıfırla (sadece kurucu) ----------
Parse.Cloud.define("resetKocUsage", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu sıfırlayabilir!');

    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');

    var query = new Parse.Query(KocUsage);
    query.equalTo('user_email', targetEmail);
    var usage = await query.first({ useMasterKey: true });
    if (!usage) {
        return { success: false, error: 'Kullanıcı için kullanım kaydı bulunamadı.' };
    }
    usage.set('count', 0);
    usage.set('week_start', getCurrentWeekStart());
    usage.set('last_reset', new Date());
    await usage.save(null, { useMasterKey: true });
    return { success: true, message: targetEmail + ' için koç kullanımı sıfırlandı.' };
});

// ---------- Koç sohbet paylaşımı (şifreli) ----------
Parse.Cloud.define("shareKocConversation", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var conversationId = request.params.conversationId;
    var password = request.params.password;

    if (!conversationId) throw new Error('Konuşma ID gerekli!');
    if (!password || password.length < 4) throw new Error('Şifre en az 4 karakter olmalı!');
    if (password.length > 64) throw new Error('Şifre en fazla 64 karakter olabilir!');

    var _rlk = 'shareKocConversation:' + user.get('email');
    await checkRateLimit(_rlk, 10, 60 * 60 * 1000);
    await recordAttempt(_rlk);

    var convQuery = new Parse.Query(KocConversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Sohbet bulunamadı!');
    if (conv.get('user_email') !== user.get('email')) throw new Error('Bu sohbet size ait değil!');

    if (!conv.get('messageCount') || conv.get('messageCount') === 0) {
        throw new Error('Boş sohbet paylaşılamaz.');
    }

    var hashResult = hashKocPassword(password);
    var shareId = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 8);

    conv.set('share_id', shareId);
    conv.set('share_password_hash', hashResult.hash);
    conv.set('share_password_salt', hashResult.salt);
    conv.set('shared_at', new Date());
    conv.set('is_shared', true);
    await conv.save(null, { useMasterKey: true });

    var shareUrl = 'https://vizyon2026.vercel.app/share.html?id=' + shareId + '&password_required=1';

    console.log('🔒 Koç sohbeti paylaşıldı:', user.get('email'), '→', shareId);

    return {
        success: true,
        shareId: shareId,
        shareUrl: shareUrl,
        message: 'Paylaşım linki oluşturuldu.'
    };
});

// ---------- Paylaşılan koç sohbetini getir (şifreli) ----------
Parse.Cloud.define("getSharedKocConversation", async function (request) {
    var shareId = request.params.shareId;
    var password = request.params.password;

    if (!shareId) {
        return { success: false, error: 'Paylaşım ID gerekli!' };
    }

    var _rlk = 'getSharedKocConversation:' + shareId;
    try {
        await checkRateLimit(_rlk, 10, 5 * 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) {
        return { success: false, error: e.message, passwordRequired: true };
    }

    var query = new Parse.Query(KocConversation);
    query.equalTo('share_id', shareId);
    var conv = await query.first({ useMasterKey: true });

    if (!conv) {
        return { success: false, error: 'Paylaşım bulunamadı veya kaldırılmış.' };
    }

    if (!conv.get('is_shared')) {
        return { success: false, error: 'Bu paylaşım artık aktif değil.' };
    }

    var storedHash = conv.get('share_password_hash');
    var storedSalt = conv.get('share_password_salt');

    if (!storedHash || !storedSalt) {
        return { success: false, error: 'Paylaşım yapılandırması bozuk.' };
    }

    if (!password) {
        // Şifre gerekli mi kontrol et
        if (storedHash && storedSalt) {
            return {
                success: false,
                error: 'Bu sohbet şifre korumalı. Lütfen şifreyi girin.',
                passwordRequired: true,
                shareType: 'koc'
            };
        }
    }

    if (!verifyKocPassword(password, storedSalt, storedHash)) {
        return {
            success: false,
            error: 'Şifre yanlış!',
            passwordRequired: true
        };
    }

    // Şifre doğru → mesajları döndür
    var msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    msgQuery.ascending('createdAt');
    msgQuery.limit(500);
    var msgs = await msgQuery.find({ useMasterKey: true });

    var userName = conv.get('user_name') || 'Kullanıcı';

    var messages = msgs.map(function (m) {
        var isCoach = m.get('is_ai') === true || m.get('from_email') === 'system@vizyon2027.com';
        return {
            name: isCoach ? '🧭 V27 KOÇ' : userName,
            text: m.get('text') || '',
            file: m.get('file') || null,
            fileName: m.get('fileName') || null,
            createdAt: m.get('createdAt'),
            isAI: isCoach
        };
    });

    return {
        success: true,
        shareType: 'koc',
        conversationName: conv.get('title') || 'Paylaşılan Koç Sohbeti',
        sharedAt: conv.get('shared_at'),
        messages: messages,
        ownerName: userName
    };
});

// ================================================================
// ========== V27 KOÇ DANIŞMANLIK / DESTEK =======================
// ================================================================
Parse.Cloud.define("getCoachAdvice", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var question = request.params.question;
    if (!question) throw new Error('Soru gerekli!');
    try {
        var prompt = 'Sen V27 Koç\'sun. Kullanıcı sana şunu sordu: "' + question + '". Ona motive edici, yol gösterici ve günlük 3 görev öneren bir cevap ver. Cevap kısa ve net olsun.';
        var reply = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { advice: reply };
    } catch (e) {
        return { advice: 'Üzgünüm, şu anda cevap veremiyorum. Lütfen daha sonra tekrar deneyin.' };
    }
});

// ================================================================
// ========== V27 CANLI DESTEK ==========
// ================================================================
Parse.Cloud.define("getSupportReply", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var question = request.params.question;
    if (!question) throw new Error('Soru gerekli!');
    try {
        var prompt = 'Sen V27 Asistan\'sın. Kullanıcı sana şu soruyu sordu: "' + question + '". Destek talebine yardımcı ol, çözüm öner. Cevap kısa ve net olsun.';
        var reply = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { reply: reply };
    } catch (e) {
        return { reply: 'Üzgünüm, destek asistanı şu anda meşgul. Lütfen daha sonra tekrar deneyin.' };
    }
});

// ================================================================
// ========== VİZYON LOG ==========
// ================================================================
Parse.Cloud.define("getVizyonLog", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu görebilir!');
    var query = new Parse.Query(VizyonLog);
    query.descending('createdAt');
    query.limit(100);
    var logs = await query.find({ useMasterKey: true });
    return logs.map(function (l) { return { message: l.get('message'), createdAt: l.get('createdAt') }; });
});

Parse.Cloud.define("addVizyonLog", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var action = request.params.action;
    var targetEmail = request.params.targetEmail;
    var targetName = request.params.targetName;
    var reason = request.params.reason;
    var teamName = request.params.teamName;
    var teamCode = request.params.teamCode;
    var log = new VizyonLog();
    var msg = '';
    if (action === 'kick') msg = '🚫 ' + targetName + ' (' + targetEmail + ') ' + teamName + ' (' + teamCode + ') takımından atıldı. Sebep: ' + reason;
    else if (action === 'close_team') msg = '🗑️ ' + teamName + ' (' + teamCode + ') takımı ' + reason + ' nedeniyle kapatıldı.';
    else if (action === 'support_request') msg = '📨 ' + targetName + ' (' + targetEmail + ') destek talebi: ' + reason;
    else msg = 'ℹ️ ' + action + ' - ' + reason;
    log.set("user_email", user.get('email'));
    log.set("user_name", user.get('name') || 'Vizyon AI');
    log.set("action", action);
    log.set("message", msg);
    await log.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== 3D MODEL ve GÖRSEL ÜRETME (HF) ==========
// ================================================================
Parse.Cloud.define("generate3DWithHF", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }

    var prompt = request.params.prompt;
    if (!prompt) throw new Error('Prompt gerekli!');
    var apiKey = await getAPIKey('HF_API_KEY');
    if (!apiKey) throw new Error('HF_API_KEY eksik!');
    try {
        var url = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-medium';
        var response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        });
        if (!response.ok) {
            var errorText = await response.text();
            throw new Error('HF API hatası: ' + errorText);
        }
        var buffer = await response.arrayBuffer();
        var base64 = bufferToBase64(buffer);
        return { success: true, imageBase64: base64 };
    } catch (e) {
        console.error('HF hatası:', e);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("generateImageWithHF", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }

    var prompt = request.params.prompt;
    if (!prompt) throw new Error('Prompt gerekli!');
    var apiKey = await getAPIKey('HF_API_KEY');
    if (!apiKey) throw new Error('HF_API_KEY eksik!');
    try {
        var url = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev';
        var response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        });
        if (!response.ok) {
            var errorText = await response.text();
            throw new Error('HF Görsel API hatası: ' + errorText);
        }
        var buffer = await response.arrayBuffer();
        var base64 = bufferToBase64(buffer);
        return { success: true, imageBase64: base64 };
    } catch (e) {
        console.error('HF Görsel hatası:', e);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== ADMIN FONKSİYONLARI ==========
// ================================================================
Parse.Cloud.define("assignAdmin", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu admin atayabilir!');
    var email = request.params.email;
    if (!email) throw new Error('E-posta gerekli!');
    var targetUser = await new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    targetUser.set('role', 'admin');
    await targetUser.save(null, { useMasterKey: true });
    return { success: true, message: email + ' admin yapıldı.' };
});

Parse.Cloud.define("setUserRole", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu rol değiştirebilir!');
    var email = request.params.email;
    var role = request.params.role;
    if (!email || !role) throw new Error('E-posta ve rol gerekli!');
    if (['user', 'admin', 'beta', 'founder', 'moderator'].indexOf(role) === -1) throw new Error('Geçersiz rol!');
    var targetUser = await new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    targetUser.set('role', role);
    await targetUser.save(null, { useMasterKey: true });
    return { success: true, message: email + ' rolü "' + role + '" olarak güncellendi.' };
});

Parse.Cloud.define("setUserPlan", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu plan değiştirebilir!');
    var email = request.params.email;
    var plan = request.params.plan;
    if (!email || !plan) throw new Error('E-posta ve plan gerekli!');
    if (['free', 'pro', 'team'].indexOf(plan) === -1) throw new Error('Geçersiz plan!');
    var targetUser = await new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    targetUser.set('plan', plan);
    await targetUser.save(null, { useMasterKey: true });
    return { success: true, message: email + ' planı "' + plan + '" olarak güncellendi.' };
});

Parse.Cloud.define("getAdmins", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu görebilir!');
    var query = new Parse.Query(Parse.User);
    query.equalTo('role', 'admin');
    var admins = await query.find({ useMasterKey: true });
    return admins.map(function (u) { return { email: u.get('email'), name: u.get('name') || 'İsimsiz' }; });
});

Parse.Cloud.define("getBetas", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var query = new Parse.Query(Parse.User);
    query.equalTo('role', 'beta');
    var betas = await query.find({ useMasterKey: true });
    return betas.map(function (u) { return { email: u.get('email'), name: u.get('name') || 'İsimsiz' }; });
});

Parse.Cloud.define("getBannedUsers", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var query = new Parse.Query(Parse.User);
    query.equalTo('isBanned', true);
    var banned = await query.find({ useMasterKey: true });
    return banned.map(function (u) { return { email: u.get('email'), name: u.get('name') || 'İsimsiz' }; });
});

Parse.Cloud.define("banUser", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var targetEmail = request.params.targetEmail;
    var query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    var target = await query.first({ useMasterKey: true });
    if (!target) throw new Error('Kullanıcı bulunamadı!');
    if (target.get('isBanned')) throw new Error('Zaten engelli!');
    target.set('isBanned', true);
    await target.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("unbanUser", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var targetEmail = request.params.targetEmail;
    var query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    var target = await query.first({ useMasterKey: true });
    if (!target) throw new Error('Kullanıcı bulunamadı!');
    if (!target.get('isBanned')) throw new Error('Zaten engelli değil!');
    target.set('isBanned', false);
    await target.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("leaveAdminRole", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (user.get('role') !== 'admin') throw new Error('Admin değilsiniz!');
    user.set('role', 'user');
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("leaveBetaRole", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (user.get('role') !== 'beta') throw new Error('Beta değilsiniz!');
    user.set('role', 'user');
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

// ✅ [v7.9.2 GÜNCELLENDİ] getAllUsers - moderator rolü de dönsün
Parse.Cloud.define("getAllUsers", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder', 'moderator'].indexOf(user.get('role')) === -1) {
        throw new Error('Bu işlem için yetkiniz yok!');
    }
    var query = new Parse.Query(Parse.User);
    query.descending('createdAt');
    var users = await query.find({ useMasterKey: true });
    return users.map(function (u) {
        return {
            id: u.id,
            email: u.get('email'),
            name: u.get('name') || u.get('username') || 'İsimsiz',
            role: u.get('role') || 'user',
            plan: u.get('plan') || 'free',
            isBanned: u.get('isBanned') || false,
            points: u.get('points') || 0,
            createdAt: u.get('createdAt')
        };
    });
});

// ================================================================
// ===== [v7.9.2 YENİ] MODERATÖR / TASARIMCI SİSTEMİ =============
// ================================================================
// Sadece kurucu tarafından mail ile atanır.
// Moderator: sınırsız yetkili (beta gibi), gizli rütbe.
// ================================================================

Parse.Cloud.define("assignModeratorByEmail", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') {
        throw new Error('Bu işlemi sadece kurucu yapabilir!');
    }

    var email = request.params.email;
    if (!email) throw new Error('E-posta adresi gerekli!');
    email = String(email).toLowerCase().trim();

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Geçerli bir e-posta adresi girin!');

    if (email === user.get('email').toLowerCase()) {
        throw new Error('Kendinizi moderatör yapamazsınız!');
    }

    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var targetUser = await query.first({ useMasterKey: true });

    if (!targetUser) {
        throw new Error('Bu e-posta ile kayıtlı kullanıcı bulunamadı: ' + email);
    }

    if (targetUser.get('role') === 'founder') {
        throw new Error('Kurucu moderatör yapılamaz!');
    }

    if (targetUser.get('role') === 'moderator') {
        throw new Error('Bu kullanıcı zaten moderatör!');
    }

    targetUser.set('role', 'moderator');
    targetUser.set('moderator_assigned_at', new Date());
    targetUser.set('moderator_assigned_by', user.get('email'));
    await targetUser.save(null, { useMasterKey: true });

    // Log kaydı
    try {
        var log = new VizyonLog();
        log.set('user_email', user.get('email'));
        log.set('user_name', user.get('name') || 'Kurucu');
        log.set('action', 'assign_moderator');
        log.set('message', '🎨 ' + email + ' moderatör olarak atandı. (Atayan: ' + user.get('email') + ')');
        await log.save(null, { useMasterKey: true });
    } catch (logErr) {
        console.warn('Moderatör atama log kaydı başarısız:', logErr.message);
    }

    // Kullanıcıya bildirim
    try {
        await sendNotificationToUser(targetUser, '🎨 Tebrikler! Moderatör / Tasarımcı rütbesine atandınız. Artık sınırsız yetkilere sahipsiniz.', 'role_assigned');
    } catch (notifErr) {
        console.warn('Moderatör bildirim gönderilemedi:', notifErr.message);
    }

    console.log('🎨 Moderatör atandı:', email, '(Atayan:', user.get('email') + ')');

    return {
        success: true,
        message: email + ' başarıyla Moderatör / Tasarımcı olarak atandı!',
        email: email,
        userId: targetUser.id
    };
});

Parse.Cloud.define("getModerators", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') {
        throw new Error('Bu liste sadece kurucuya aittir!');
    }
    var query = new Parse.Query(Parse.User);
    query.equalTo('role', 'moderator');
    query.descending('moderator_assigned_at');
    var mods = await query.find({ useMasterKey: true });
    return {
        success: true,
        moderators: mods.map(function (u) {
            return {
                id: u.id,
                email: u.get('email'),
                name: u.get('name') || u.get('username') || 'İsimsiz',
                assigned_at: u.get('moderator_assigned_at'),
                assigned_by: u.get('moderator_assigned_by')
            };
        })
    };
});

Parse.Cloud.define("removeModerator", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') {
        throw new Error('Bu işlemi sadece kurucu yapabilir!');
    }
    var email = request.params.email;
    if (!email) throw new Error('E-posta gerekli!');
    email = String(email).toLowerCase().trim();

    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var targetUser = await query.first({ useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    if (targetUser.get('role') !== 'moderator') throw new Error('Bu kullanıcı moderatör değil!');

    targetUser.set('role', 'user');
    targetUser.unset('moderator_assigned_at');
    targetUser.unset('moderator_assigned_by');
    await targetUser.save(null, { useMasterKey: true });

    try {
        var log = new VizyonLog();
        log.set('user_email', user.get('email'));
        log.set('user_name', user.get('name') || 'Kurucu');
        log.set('action', 'remove_moderator');
        log.set('message', '🚫 ' + email + ' moderatörlükten çıkarıldı. (İşlemi yapan: ' + user.get('email') + ')');
        await log.save(null, { useMasterKey: true });
    } catch (e) {}

    return { success: true, message: email + ' moderatörlükten çıkarıldı.' };
});

// ================================================================
// ===== [v7.9.2 YENİ] MODERATÖR VİDEO KESİT ARAÇLARI ============
// ================================================================
// Moderatör küçük video kesitleri alır, paylaşır, analiz yapar,
// tavsiyede bulunur.
// ================================================================

Parse.Cloud.define("createVideoClip", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (['moderator', 'admin', 'founder'].indexOf(user.get('role')) === -1) {
        throw new Error('Bu işlemi sadece moderatör, admin veya kurucu yapabilir!');
    }

    var videoUrl = request.params.videoUrl;
    var startTime = request.params.startTime;
    var endTime = request.params.endTime;
    var note = request.params.note;
    var analysis = request.params.analysis || '';

    if (!videoUrl) throw new Error('Video URL gerekli!');
    if (startTime === undefined || endTime === undefined) {
        throw new Error('Başlangıç ve bitiş saniyeleri gerekli!');
    }
    if (startTime < 0) throw new Error('Başlangıç 0 veya daha büyük olmalı!');
    if (endTime <= startTime) throw new Error('Bitiş, başlangıçtan büyük olmalı!');
    if (!note || !note.trim()) throw new Error('Analiz/tavsiye notu gerekli!');

    var clip = new VideoClip();
    clip.set('moderator_email', user.get('email'));
    clip.set('moderator_name', user.get('name') || 'Moderatör');
    clip.set('video_url', videoUrl);
    clip.set('start_time', parseInt(startTime));
    clip.set('end_time', parseInt(endTime));
    clip.set('note', note.trim());
    clip.set('analysis', analysis.trim());
    clip.set('is_published', true);
    clip.set('shared_with', []);
    clip.set('created_at_client', new Date());

    await clip.save(null, { useMasterKey: true });

    console.log('🎬 Video kesit oluşturuldu:', clip.id, '(Moderatör:', user.get('email') + ')');

    return {
        success: true,
        clipId: clip.id,
        message: 'Video kesit başarıyla paylaşıldı!'
    };
});

Parse.Cloud.define("getVideoClips", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var limit = request.params.limit || 50;
    var moderatorEmail = request.params.moderatorEmail;

    var query = new Parse.Query(VideoClip);
    query.equalTo('is_published', true);
    if (moderatorEmail) {
        query.equalTo('moderator_email', moderatorEmail);
    }
    query.descending('created_at_client');
    query.limit(parseInt(limit));

    var clips = await query.find({ useMasterKey: true });

    return {
        success: true,
        clips: clips.map(function (c) {
            return {
                id: c.id,
                moderator_email: c.get('moderator_email'),
                moderator_name: c.get('moderator_name'),
                video_url: c.get('video_url'),
                start_time: c.get('start_time'),
                end_time: c.get('end_time'),
                note: c.get('note'),
                analysis: c.get('analysis'),
                createdAt: c.get('created_at_client') || c.get('createdAt')
            };
        })
    };
});

// ================================================================
// ========== GIPHY API ==========
// ================================================================
Parse.Cloud.define("searchGif", async function (request) {
    var query = request.params.query;
    if (!query) throw new Error('Arama terimi gerekli!');
    var apiKey = await getAPIKey('GIPHY_API_KEY');
    if (!apiKey) throw new Error('GIPHY_API_KEY eksik! Config\'e ekleyin.');
    try {
        var url = 'https://api.giphy.com/v1/gifs/search?api_key=' + apiKey + '&q=' + encodeURIComponent(query) + '&limit=20&rating=g';
        var res = await fetch(url);
        var data = await res.json();
        if (data.data && data.data.length > 0) {
            return data.data.map(function (g) {
                return {
                    id: g.id,
                    title: g.title,
                    images: { fixed_height: g.images.fixed_height }
                };
            });
        } else {
            return [];
        }
    } catch (e) {
        console.error('GIPHY hatası:', e);
        return [];
    }
});

// ================================================================
// ========== ÇEVİRİ ==========
// ================================================================
Parse.Cloud.define("translateWithDeepL", async function (request) {
    var text = request.params.text;
    var targetLang = request.params.targetLang;
    var sourceLang = request.params.sourceLang;
    var key = await getAPIKey('DEEPL_API_KEY');
    if (!key) throw new Error('DeepL anahtarı eksik!');
    try {
        var res = await fetch("https://api-free.deepl.com/v2/translate", {
            method: "POST",
            headers: {
                "Authorization": "DeepL-Auth-Key " + key,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: [text],
                target_lang: targetLang.toUpperCase(),
                source_lang: sourceLang ? sourceLang.toUpperCase() : undefined
            })
        });
        var data = await res.json();
        if (data.message) throw new Error(data.message);
        if (data.translations && data.translations[0]) {
            return { success: true, translatedText: data.translations[0].text, engine: "DeepL" };
        } else {
            throw new Error('Beklenmeyen yanıt formatı');
        }
    } catch (e) {
        console.error('DeepL hatası:', e);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("translateWithLibre", async function (request) {
    var text = request.params.text;
    var targetLang = request.params.targetLang;
    var sourceLang = request.params.sourceLang;
    try {
        var res = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, source: sourceLang || 'auto', target: targetLang, format: 'text' })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        return { success: true, translatedText: data.translatedText, engine: "LibreTranslate" };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("smartTranslate", async function (request) {
    var text = request.params.text;
    var targetLang = request.params.targetLang;
    var sourceLang = request.params.sourceLang;
    try {
        var deepl = await Parse.Cloud.run("translateWithDeepL", { text: text, targetLang: targetLang, sourceLang: sourceLang }, { useMasterKey: true });
        if (deepl.success) return deepl;
    } catch (e) {}
    try {
        var libre = await Parse.Cloud.run("translateWithLibre", { text: text, targetLang: targetLang, sourceLang: sourceLang }, { useMasterKey: true });
        if (libre.success) return libre;
    } catch (e) {}
    return { success: false, translatedText: text, error: 'Tüm çeviri motorları başarısız.' };
});

// ================================================================
// ========== ÜRÜN ==========
// ================================================================
Parse.Cloud.define("addProduct", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var title = request.params.title;
    var price = request.params.price;
    var fileUrl = request.params.fileUrl;
    if (!title || !price) throw new Error('Ürün adı ve fiyat gerekli!');
    var product = new Product();
    product.set('user_email', user.get('email'));
    product.set('title_', title);
    product.set('price', parseFloat(price));
    if (fileUrl) product.set('file', fileUrl);
    product.set('status', 'pending');
    await product.save(null, { useMasterKey: true });
    return { success: true, productId: product.id };
});

Parse.Cloud.define("getProducts", async function (request) {
    var query = new Parse.Query(Product);
    query.equalTo('status', 'approved');
    query.descending('createdAt');
    var products = await query.find({ useMasterKey: true });
    return products.map(function (p) {
        return {
            id: p.id,
            title: p.get('title_'),
            price: p.get('price'),
            file: p.get('file'),
            seller: p.get('user_email') || 'Bilinmiyor',
            createdAt: p.get('createdAt')
        };
    });
});

Parse.Cloud.define("buyProduct", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var productId = request.params.productId;
    var query = new Parse.Query(Product);
    var product = await query.get(productId, { useMasterKey: true });
    if (!product) throw new Error('Ürün bulunamadı!');
    if (product.get('status') !== 'approved') throw new Error('Bu ürün satın alınamaz!');
    var price = product.get('price') || 0;
    var commission = price * 0.10;
    var sellerEarn = price - commission;
    var sellerEmail = product.get('user_email');
    var sellerQuery = new Parse.Query(Parse.User);
    sellerQuery.equalTo('email', sellerEmail);
    var seller = await sellerQuery.first({ useMasterKey: true });
    if (seller) {
        var sellerWallet = seller.get('wallet_balance') || 0;
        seller.set('wallet_balance', sellerWallet + sellerEarn);
        await seller.save(null, { useMasterKey: true });
    }
    var adminQuery = new Parse.Query(Parse.User);
    adminQuery.equalTo('email', 'admin.tr.reis@gmail.com');
    var admin = await adminQuery.first({ useMasterKey: true });
    if (admin) {
        var adminWallet = admin.get('wallet_balance') || 0;
        admin.set('wallet_balance', adminWallet + commission);
        await admin.save(null, { useMasterKey: true });
    }
    if (seller) {
        await addPointsWithBonus(seller, Math.floor(price * 0.05), 'Ürün satışı');
    }
    product.set('status', 'sold');
    await product.save(null, { useMasterKey: true });
    return { success: true, message: 'Satın alındı!' };
});

Parse.Cloud.define("getMyProducts", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var query = new Parse.Query(Product);
    query.equalTo('user_email', user.get('email'));
    var products = await query.find({ useMasterKey: true });
    return products.map(function (p) {
        return {
            id: p.id,
            title: p.get('title_'),
            price: p.get('price'),
            status: p.get('status'),
            createdAt: p.get('createdAt')
        };
    });
});

// ================================================================
// ========== MAĞAZA ==========
// ================================================================
Parse.Cloud.define("getStoreItems", async function (request) {
    var query = new Parse.Query(StoreItem);
    var items = await query.find({ useMasterKey: true });
    return items.map(function (item) {
        return {
            id: item.id,
            name: item.get('name'),
            price_points: item.get('price_points'),
            type: item.get('type'),
            icon: item.get('icon') || '🎁'
        };
    });
});

Parse.Cloud.define("purchaseStoreItem", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var itemId = request.params.itemId;
    var query = new Parse.Query(StoreItem);
    var item = await query.get(itemId, { useMasterKey: true });
    if (!item) throw new Error('Ürün bulunamadı!');
    var price = item.get('price_points') || 0;
    var currentPoints = user.get('points') || 0;
    if (currentPoints < price) throw new Error('Yeterli puanınız yok!');
    user.set('points', currentPoints - price);
    var type = item.get('type');
    if (type === 'badge') {
        var badges = user.get('badges') || [];
        if (badges.indexOf(item.get('name')) === -1) {
            badges.push(item.get('name'));
            user.set('badges', badges);
        }
    }
    await user.save(null, { useMasterKey: true });
    await sendNotificationToUser(user, '🛒 ' + item.get('name') + ' satın aldınız!', 'store');
    return { success: true, remaining_points: user.get('points'), message: 'Ürün satın alındı!' };
});

// ================================================================
// ========== GÜNLÜK GÖREVLER ==========
// ================================================================
Parse.Cloud.define("getDailyTasks", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var today = new Date().toDateString();
    var query = new Parse.Query(DailyTask);
    query.equalTo('date', today);
    var tasks = await query.find({ useMasterKey: true });
    var completed = user.get('completed_daily_tasks') || [];
    return tasks.map(function (t) {
        return {
            id: t.id,
            task_text: t.get('task_text'),
            points: t.get('points'),
            completed: completed.indexOf(t.id) !== -1
        };
    });
});

Parse.Cloud.define("completeDailyTask", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var taskId = request.params.taskId;
    var query = new Parse.Query(DailyTask);
    var task = await query.get(taskId, { useMasterKey: true });
    if (!task) throw new Error('Görev bulunamadı!');
    var completed = user.get('completed_daily_tasks') || [];
    if (completed.indexOf(taskId) !== -1) throw new Error('Bu görev zaten tamamlanmış!');
    completed.push(taskId);
    user.set('completed_daily_tasks', completed);
    var points = task.get('points') || 0;
    await addPointsWithBonus(user, points, 'Günlük görev');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points'), message: 'Görev tamamlandı! +' + points + ' puan' };
});

// ================================================================
// ========== TOPLULUK GÖREVLERİ ==========
// ================================================================
Parse.Cloud.define("getSocialTasks", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var today = new Date().toDateString();
    var query = new Parse.Query(SocialTask);
    query.equalTo('date', today);
    query.equalTo('is_active', true);
    var tasks = await query.find({ useMasterKey: true });
    var completed = user.get('completed_social_tasks') || [];
    return tasks.map(function (t) {
        return {
            id: t.id,
            platform: t.get('platform') || 'Sosyal Medya',
            url: t.get('url') || '#',
            points_reward: t.get('points_reward') || 10,
            penalty_points: t.get('penalty_points') || 0,
            completed: completed.indexOf(t.id) !== -1
        };
    });
});

Parse.Cloud.define("verifySocialFollow", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var taskId = request.params.taskId;
    var query = new Parse.Query(SocialTask);
    var task = await query.get(taskId, { useMasterKey: true });
    if (!task) throw new Error('Görev bulunamadı!');
    var completed = user.get('completed_social_tasks') || [];
    if (completed.indexOf(taskId) !== -1) throw new Error('Bu görev zaten tamamlanmış!');
    completed.push(taskId);
    user.set('completed_social_tasks', completed);
    var points = task.get('points_reward') || 0;
    await addPointsWithBonus(user, points, 'Topluluk görevi');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points'), message: 'Görev tamamlandı! +' + points + ' puan' };
});

// ================================================================
// ========== TAKIM GÖREVLERİ ==========
// ================================================================
Parse.Cloud.define("getTeamTasks", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var today = new Date().toDateString();
    var query = new Parse.Query(TeamTask);
    query.equalTo('team_id', teamId);
    query.equalTo('date', today);
    var tasks = await query.find({ useMasterKey: true });
    var completed = user.get('completed_team_tasks') || [];
    return tasks.map(function (t) {
        return {
            id: t.id,
            task_text: t.get('task_text'),
            points: t.get('points') || 0,
            completed: completed.indexOf(t.id) !== -1
        };
    });
});

Parse.Cloud.define("completeTeamTask", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var taskId = request.params.taskId;
    var query = new Parse.Query(TeamTask);
    var task = await query.get(taskId, { useMasterKey: true });
    if (!task) throw new Error('Görev bulunamadı!');
    var completed = user.get('completed_team_tasks') || [];
    if (completed.indexOf(taskId) !== -1) throw new Error('Bu görev zaten tamamlanmış!');
    completed.push(taskId);
    user.set('completed_team_tasks', completed);
    var points = task.get('points') || 0;
    await addPointsWithBonus(user, points, 'Takım görevi');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points'), message: 'Görev tamamlandı! +' + points + ' puan' };
});

// ================================================================
// ========== BİLDİRİM ==========
// ================================================================
Parse.Cloud.define("getNotifications", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var query = new Parse.Query(Notification);
    query.equalTo('user', user);
    query.descending('createdAt');
    var notifs = await query.find({ useMasterKey: true });
    return notifs.map(function (n) {
        return {
            id: n.id,
            message: n.get('message'),
            type: n.get('type'),
            is_read: n.get('is_read'),
            createdAt: n.get('createdAt')
        };
    });
});

Parse.Cloud.define("markNotificationRead", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var notificationId = request.params.notificationId;
    var query = new Parse.Query(Notification);
    var n = await query.get(notificationId, { useMasterKey: true });
    if (!n) throw new Error('Bildirim bulunamadı!');
    n.set('is_read', true);
    await n.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("sendNotification", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var userId = request.params.userId;
    var message = request.params.message;
    var type = request.params.type || 'system';
    if (!userId || !message) throw new Error('userId ve message gerekli!');
    var targetUser = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    await sendNotificationToUser(targetUser, message, type);
    return { success: true };
});

// ================================================================
// ========== MESAJ & KONUŞMA ==========
// ================================================================
Parse.Cloud.define("sendMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    var text = request.params.text;
    var fileUrl = request.params.fileUrl;
    var fileName = request.params.fileName;
    if (!conversationId) throw new Error('Konuşma ID gerekli!');
    var convQuery = new Parse.Query(Conversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');
    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Bu konuşmaya yetkiniz yok!');

    var msg = new Message();
    msg.set('from_email', user.get('email'));
    msg.set('conversationId', conv.id);
    var toEmail = users.find(function (u) { return u !== user.get('email'); });
    if (toEmail) msg.set('to_email', toEmail);
    msg.set('text', filterText(text || ''));
    if (fileUrl) {
        msg.set('file', fileUrl);
        msg.set('fileName', fileName || 'Dosya');
    }
    msg.set('is_read', false);
    await msg.save(null, { useMasterKey: true });

    conv.set('lastMessage', filterText(text || '[Dosya]'));
    conv.set('lastMessageTime', new Date());
    await conv.save(null, { useMasterKey: true });

    if (toEmail) {
        var toUser = await new Parse.Query(Parse.User).equalTo('email', toEmail).first({ useMasterKey: true });
        if (toUser) {
            await sendNotificationToUser(toUser, '📩 ' + user.get('name') + ' size mesaj gönderdi: ' + (text || '[Dosya]').substring(0, 30), 'message');
        }
    }
    return { success: true, messageId: msg.id };
});

Parse.Cloud.define("getConversations", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var query = new Parse.Query(Conversation);
    query.containedIn('user_emails', [user.get('email')]);
    query.descending('lastMessageTime');
    var convs = await query.find({ useMasterKey: true });
    return convs.map(function (c) {
        return {
            id: c.id,
            users: c.get('user_emails'),
            lastMessage: c.get('lastMessage'),
            lastMessageTime: c.get('lastMessageTime'),
            customName: c.get('customName')
        };
    });
});

Parse.Cloud.define("getConversationMessages", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    var convQuery = new Parse.Query(Conversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');
    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Yetkisiz!');
    var msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    msgQuery.ascending('createdAt');
    var msgs = await msgQuery.find({ useMasterKey: true });
    for (var mi = 0; mi < msgs.length; mi++) {
        var m = msgs[mi];
        if (m.get('to_email') === user.get('email') && !m.get('is_read')) {
            m.set('is_read', true);
            await m.save(null, { useMasterKey: true });
        }
    }
    return {
        conversationId: conv.id,
        users: users,
        messages: msgs.map(function (m) {
            return {
                id: m.id,
                from_user: { id: m.get('from_email'), get: function (k) { return m.get('from_email'); } },
                to_user: { id: m.get('to_email') },
                text: m.get('text'),
                file: m.get('file'),
                is_read: m.get('is_read'),
                is_ai: m.get('is_ai') || false,
                ai_name: m.get('ai_name') || null,
                createdAt: m.get('createdAt')
            };
        })
    };
});

Parse.Cloud.define("startConversation", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var userId = request.params.userId;
    if (!userId) {
        var conv = new Conversation();
        conv.set('user_emails', [user.get('email')]);
        conv.set('lastMessage', '');
        conv.set('lastMessageTime', new Date());
        await conv.save(null, { useMasterKey: true });
        return { success: true, conversationId: conv.id };
    }
    var targetUser = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    var targetEmail = targetUser.get('email');
    var query = new Parse.Query(Conversation);
    query.containsAll('user_emails', [user.get('email'), targetEmail]);
    var existing = await query.first({ useMasterKey: true });
    if (existing) return { success: true, conversationId: existing.id };
    var conv2 = new Conversation();
    conv2.set('user_emails', [user.get('email'), targetEmail]);
    conv2.set('lastMessage', '');
    conv2.set('lastMessageTime', new Date());
    await conv2.save(null, { useMasterKey: true });
    return { success: true, conversationId: conv2.id };
});

// ================================================================
// ========== GÜNLÜK SERİ (STREAK) ==========
// ================================================================
Parse.Cloud.define("getStreakStatus", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var today = new Date().toDateString();
    var query = new Parse.Query(UserStreak);
    query.equalTo('user_email', user.get('email'));
    var streak = await query.first({ useMasterKey: true });
    if (!streak) {
        streak = new UserStreak();
        streak.set('user_email', user.get('email'));
        streak.set('streakCount', 0);
        streak.set('lastClaimDate', null);
        streak.set('lastClaimTime', null);
        streak.set('streakStartDate', null);
        streak.set('notifiedAt8h', false);
        streak.set('notifiedAt4h', false);
        streak.set('isActive', true);
        await streak.save(null, { useMasterKey: true });
    }
    var lastClaim = streak.get('lastClaimDate');
    var claimedToday = lastClaim && lastClaim.toDateString() === today;
    var streakCount = streak.get('streakCount') || 0;
    var todayReward = 10;
    if (streakCount >= 30) todayReward = 2000;
    else if (streakCount >= 20) todayReward = 1000;
    else if (streakCount >= 15) todayReward = 500;
    else if (streakCount >= 14) todayReward = 400;
    else if (streakCount >= 13) todayReward = 300;
    else if (streakCount >= 12) todayReward = 250;
    else if (streakCount >= 11) todayReward = 200;
    else if (streakCount >= 10) todayReward = 160;
    else if (streakCount >= 9) todayReward = 130;
    else if (streakCount >= 8) todayReward = 100;
    else if (streakCount >= 7) todayReward = 75;
    else if (streakCount >= 6) todayReward = 50;
    else if (streakCount >= 5) todayReward = 35;
    else if (streakCount >= 4) todayReward = 25;
    else if (streakCount >= 3) todayReward = 20;
    else if (streakCount >= 2) todayReward = 15;
    else todayReward = 10;
    return {
        streakCount: streakCount,
        claimedToday: claimedToday,
        todayReward: todayReward,
        lastClaimDate: lastClaim,
        isActive: streak.get('isActive')
    };
});

Parse.Cloud.define("claimDailyStreak", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var today = new Date().toDateString();
    var query = new Parse.Query(UserStreak);
    query.equalTo('user_email', user.get('email'));
    var streak = await query.first({ useMasterKey: true });
    if (!streak) {
        streak = new UserStreak();
        streak.set('user_email', user.get('email'));
        streak.set('streakCount', 0);
        streak.set('lastClaimDate', null);
        streak.set('lastClaimTime', null);
        streak.set('streakStartDate', null);
        streak.set('notifiedAt8h', false);
        streak.set('notifiedAt4h', false);
        streak.set('isActive', true);
        await streak.save(null, { useMasterKey: true });
    }
    var lastClaim = streak.get('lastClaimDate');
    var claimedToday = lastClaim && lastClaim.toDateString() === today;
    if (claimedToday) {
        return { success: false, message: 'Bugün zaten ödül aldınız!' };
    }
    if (lastClaim) {
        var hoursSince = (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
            streak.set('streakCount', 0);
            streak.set('streakStartDate', null);
            streak.set('notifiedAt8h', false);
            streak.set('notifiedAt4h', false);
            await streak.save(null, { useMasterKey: true });
        }
    }
    var count = streak.get('streakCount') || 0;
    count += 1;
    streak.set('streakCount', count);
    streak.set('lastClaimDate', new Date());
    streak.set('lastClaimTime', new Date());
    if (!streak.get('streakStartDate')) {
        streak.set('streakStartDate', new Date());
    }
    streak.set('notifiedAt8h', false);
    streak.set('notifiedAt4h', false);
    streak.set('isActive', true);
    await streak.save(null, { useMasterKey: true });
    var points = 10;
    if (count >= 30) points = 2000;
    else if (count >= 20) points = 1000;
    else if (count >= 15) points = 500;
    else if (count >= 14) points = 400;
    else if (count >= 13) points = 300;
    else if (count >= 12) points = 250;
    else if (count >= 11) points = 200;
    else if (count >= 10) points = 160;
    else if (count >= 9) points = 130;
    else if (count >= 8) points = 100;
    else if (count >= 7) points = 75;
    else if (count >= 6) points = 50;
    else if (count >= 5) points = 35;
    else if (count >= 4) points = 25;
    else if (count >= 3) points = 20;
    else if (count >= 2) points = 15;
    else points = 10;
    await addPointsWithBonus(user, points, 'Günlük seri (' + count + '. gün)');
    return { success: true, message: '🎉 ' + points + ' puan kazandınız! (' + count + '. gün)', remaining_points: user.get('points') };
});

// ================================================================
// ========== STREAK HATIRLATMA JOB'U ==========
// ================================================================
Parse.Cloud.job("checkStreakReminders", async function (request) {
    console.log('🔄 Streak hatırlatmaları kontrol ediliyor...');
    var query = new Parse.Query(UserStreak);
    query.equalTo('isActive', true);
    var streaks = await query.find({ useMasterKey: true });
    var sentCount = 0;
    for (var si = 0; si < streaks.length; si++) {
        var streak = streaks[si];
        var lastClaim = streak.get('lastClaimDate');
        if (!lastClaim) continue;
        var hoursSince = (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60);
        var email = streak.get('user_email');
        if (!email) continue;
        try {
            var userQuery = new Parse.Query(Parse.User);
            userQuery.equalTo('email', email);
            var user = await userQuery.first({ useMasterKey: true });
            if (!user) continue;
            if (hoursSince >= 20 && hoursSince < 21 && !streak.get('notifiedAt8h')) {
                await Parse.Cloud.run('sendEmail', {
                    to: email,
                    subject: '⏰ Serinizi Kaybetmeyin!',
                    html: '<h3>VİZYON2027</h3>' +
                        '<p>Merhaba ' + (user.get('name') || 'Kullanıcı') + ',</p>' +
                        '<p>Serinizi kaybetmenize 4 saat kaldı! Hemen giriş yapın ve günlük ödülünüzü alın.</p>' +
                        '<p><a href="https://vizyon2026.vercel.app/" style="background:#00d4ff; color:#000; padding:10px 20px; border-radius:40px; text-decoration:none; font-weight:700;">Sisteme Git</a></p>' +
                        '<p>Serinizi kaybederseniz 1. günden başlayacaksınız.</p>' +
                        '<p>VİZYON2027 Ekibi</p>'
                }, { useMasterKey: true });
                streak.set('notifiedAt8h', true);
                await streak.save(null, { useMasterKey: true });
                sentCount++;
            }
            if (hoursSince >= 23 && hoursSince < 24 && !streak.get('notifiedAt4h')) {
                await Parse.Cloud.run('sendEmail', {
                    to: email,
                    subject: '⚠️ SON UYARI! Seriniz Sıfırlanacak!',
                    html: '<h3>VİZYON2027</h3>' +
                        '<p>Merhaba ' + (user.get('name') || 'Kullanıcı') + ',</p>' +
                        '<p>Serinizi kaybetmenize 1 saat kaldı! Hemen giriş yapın ve ödülünüzü alın.</p>' +
                        '<p><a href="https://vizyon2026.vercel.app/" style="background:#ff6b35; color:#fff; padding:10px 20px; border-radius:40px; text-decoration:none; font-weight:700;">ACİL SİSTEME GİT</a></p>' +
                        '<p>Seriniz sıfırlanırsa 1. günden başlayacaksınız.</p>' +
                        '<p>VİZYON2027 Ekibi</p>'
                }, { useMasterKey: true });
                streak.set('notifiedAt4h', true);
                await streak.save(null, { useMasterKey: true });
                sentCount++;
            }
            if (hoursSince >= 24) {
                await Parse.Cloud.run('sendEmail', {
                    to: email,
                    subject: '❌ Seriniz Sıfırlandı',
                    html: '<h3>VİZYON2027</h3>' +
                        '<p>Merhaba ' + (user.get('name') || 'Kullanıcı') + ',</p>' +
                        '<p>Seriniz süresi doldu ve sıfırlandı. 1. günden başlayabilirsiniz.</p>' +
                        '<p><a href="https://vizyon2026.vercel.app/" style="background:#00d4ff; color:#000; padding:10px 20px; border-radius:40px; text-decoration:none; font-weight:700;">Sisteme Git</a></p>' +
                        '<p>VİZYON2027 Ekibi</p>'
                }, { useMasterKey: true });
            }
        } catch (e) {
            console.error('Streak hatırlatma hatası:', e.message);
        }
    }
    console.log('✅ ' + sentCount + ' hatırlatma gönderildi.');
    return 'Streak hatırlatmaları tamamlandı. ' + sentCount + ' gönderildi.';
});

// ================================================================
// ========== SÜRESİ DOLAN ANKET VE DUYURULARI TEMİZLE ==========
// ================================================================
Parse.Cloud.job("cleanExpiredPolls", async function (request) {
    console.log('🔄 Süresi dolan anketler temizleniyor...');
    var now = new Date();
    var query = new Parse.Query(Poll);
    query.lessThan('end_date', now);
    var expiredPolls = await query.find({ useMasterKey: true });
    for (var pi = 0; pi < expiredPolls.length; pi++) {
        await expiredPolls[pi].destroy({ useMasterKey: true });
        console.log('🗑️ Anket silindi: ' + expiredPolls[pi].get('question'));
    }
    return expiredPolls.length + ' anket temizlendi.';
});

Parse.Cloud.job("cleanExpiredAnnouncements", async function (request) {
    console.log('🔄 Süresi dolan duyurular temizleniyor...');
    var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    var query = new Parse.Query(Announcement);
    query.lessThan('createdAt', thirtyDaysAgo);
    var expiredAnnouncements = await query.find({ useMasterKey: true });
    for (var ai = 0; ai < expiredAnnouncements.length; ai++) {
        await expiredAnnouncements[ai].destroy({ useMasterKey: true });
        console.log('🗑️ Duyuru silindi: ' + expiredAnnouncements[ai].get('title_'));
    }
    return expiredAnnouncements.length + ' duyuru temizlendi.';
});

// ================================================================
// ========== V27 AKADEMİ ==========
// ================================================================
Parse.Cloud.define("getCourses", async function (request) {
    var query = new Parse.Query(Course);
    var courses = await query.find({ useMasterKey: true });
    if (courses.length > 0) {
        var user = request.user;
        var completedLessons = user ? (user.get('completed_lessons') || []) : [];
        return courses.map(function (c) {
            return {
                id: c.id,
                title: c.get('title_'),
                description: c.get('description'),
                total_lessons: c.get('total_lessons') || 0,
                completed: completedLessons.length > 0 && (c.get('total_lessons') || 0) > 0
            };
        });
    }
    return [
        { id: 'sample1', title: '🚀 VİZYON AI ile Kod Yazma', description: 'Yapay zeka ile Python, JavaScript ve diğer dillerde kod yazmayı öğrenin.', total_lessons: 4, completed: false },
        { id: 'sample2', title: '🧊 3D Modelleme ve Tasarım', description: 'Three.js ile 3D nesneler oluşturun, modelleyin ve dışa aktarın.', total_lessons: 3, completed: false },
        { id: 'sample3', title: '📊 Veri Analizi ve Görselleştirme', description: 'Python ile veri analizi, grafikler ve dashboard oluşturma.', total_lessons: 5, completed: false },
        { id: 'sample4', title: '🔐 Güvenlik ve Ebeveyn Kontrolleri', description: 'Kullanıcı güvenliği, ebeveyn ayarları ve çocuk koruma.', total_lessons: 3, completed: false },
        { id: 'sample5', title: '🔑 V27 API ile Kendi Projeni Yap', description: 'V27 API anahtarı ile kendi uygulamalarını geliştirmeyi öğren.', total_lessons: 4, completed: false }
    ];
});

Parse.Cloud.define("getCourseDetails", async function (request) {
    var courseId = request.params.courseId;
    if (courseId === 'sample1') {
        return {
            id: 'sample1',
            title: '🚀 VİZYON AI ile Kod Yazma',
            description: 'Yapay zeka ile kod yazmanın püf noktaları.',
            lessons: [
                { id: 'l1', title: 'Python ile Hesap Makinesi', content: 'VİZYON AI\'ya "Python\'da hesap makinesi yaz" deyin ve çalışan kodu alın.', points_reward: 10 },
                { id: 'l2', title: 'JavaScript ile ToDo Uygulaması', content: 'React ile basit bir ToDo app yapın.', points_reward: 15 },
                { id: 'l3', title: 'HTML/CSS ile Kişisel Sayfa', content: 'Kendi portföy sayfanızı oluşturun.', points_reward: 10 },
                { id: 'l4', title: 'API Entegrasyonu', content: 'VİZYON AI ile dış API\'leri kullanmayı öğrenin.', points_reward: 20 }
            ]
        };
    } else if (courseId === 'sample2') {
        return {
            id: 'sample2',
            title: '🧊 3D Modelleme ve Tasarım',
            description: 'Three.js ile 3D dünyasına adım atın.',
            lessons: [
                { id: 'l5', title: '3D Sahne Oluşturma', content: 'Üç boyutlu bir sahne oluşturun ve kamera ekleyin.', points_reward: 10 },
                { id: 'l6', title: 'Geometrik Şekiller', content: 'Küp, küre, silindir gibi şekiller ekleyin.', points_reward: 15 },
                { id: 'l7', title: 'Işık ve Gölge', content: 'Sahnenize ışık kaynakları ekleyin.', points_reward: 10 }
            ]
        };
    } else if (courseId === 'sample3') {
        return {
            id: 'sample3',
            title: '📊 Veri Analizi ve Görselleştirme',
            description: 'Python ile veri analizi yapmayı öğrenin.',
            lessons: [
                { id: 'l8', title: 'Veri Okuma', content: 'CSV ve JSON dosyalarını okuyun.', points_reward: 10 },
                { id: 'l9', title: 'Veri Temizleme', content: 'Eksik ve hatalı verileri temizleyin.', points_reward: 15 },
                { id: 'l10', title: 'Grafik Çizimi', content: 'Matplotlib ile grafik oluşturun.', points_reward: 20 },
                { id: 'l11', title: 'Dashboard', content: 'Etkileşimli bir dashboard hazırlayın.', points_reward: 25 },
                { id: 'l12', title: 'Raporlama', content: 'Veri raporu oluşturmayı öğrenin.', points_reward: 15 }
            ]
        };
    } else if (courseId === 'sample4') {
        return {
            id: 'sample4',
            title: '🔐 Güvenlik ve Ebeveyn Kontrolleri',
            description: 'Kullanıcı güvenliği ve ebeveyn ayarları.',
            lessons: [
                { id: 'l13', title: 'Şifre Güvenliği', content: 'Güçlü şifre oluşturma ve yönetme.', points_reward: 10 },
                { id: 'l14', title: 'Ebeveyn Panelini Kullanma', content: 'Çocuk hesaplarını yönetme.', points_reward: 15 },
                { id: 'l15', title: 'Veri Gizliliği', content: 'Kişisel verilerinizi koruyun.', points_reward: 10 }
            ]
        };
    } else if (courseId === 'sample5') {
        return {
            id: 'sample5',
            title: '🔑 V27 API ile Kendi Projeni Yap',
            description: 'V27 API anahtarı ile kendi uygulamalarını geliştir.',
            lessons: [
                { id: 'l16', title: 'V27 API Anahtarı Alma', content: 'Dashboard\'dan V27 API anahtarı oluştur.', points_reward: 10 },
                { id: 'l17', title: 'v27ApiChat Kullanımı', content: 'V27 API\'yi kendi uygulamanda kullan.', points_reward: 20 },
                { id: 'l18', title: 'Rate Limiting', content: 'Dakikada 60 istek limitini anla.', points_reward: 15 },
                { id: 'l19', title: 'Örnek Proje', content: 'V27 API ile basit bir chatbot yap.', points_reward: 25 }
            ]
        };
    }
    var query = new Parse.Query(Course);
    var course = await query.get(courseId, { useMasterKey: true });
    if (!course) throw new Error('Ders bulunamadı!');
    var lessonQuery = new Parse.Query(Lesson);
    lessonQuery.equalTo('courseId', course.id);
    lessonQuery.ascending('order');
    var lessons = await lessonQuery.find({ useMasterKey: true });
    return {
        id: course.id,
        title: course.get('title_'),
        description: course.get('description'),
        lessons: lessons.map(function (l) {
            return {
                id: l.id,
                title: l.get('title_'),
                content: l.get('content'),
                points_reward: l.get('points_reward') || 0
            };
        })
    };
});

Parse.Cloud.define("completeLesson", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var lessonId = request.params.lessonId;
    if (lessonId.indexOf('l') === 0) {
        var completed = user.get('completed_lessons') || [];
        if (completed.indexOf(lessonId) !== -1) throw new Error('Bu ders zaten tamamlanmış!');
        completed.push(lessonId);
        user.set('completed_lessons', completed);
        var points = 10;
        await addPointsWithBonus(user, points, 'Ders tamamlama');
        await user.save(null, { useMasterKey: true });
        return { success: true, remaining_points: user.get('points'), message: 'Ders tamamlandı! +' + points + ' puan' };
    }
    var query = new Parse.Query(Lesson);
    var lesson = await query.get(lessonId, { useMasterKey: true });
    if (!lesson) throw new Error('Ders bulunamadı!');
    var completed2 = user.get('completed_lessons') || [];
    if (completed2.indexOf(lessonId) !== -1) throw new Error('Bu ders zaten tamamlanmış!');
    completed2.push(lessonId);
    user.set('completed_lessons', completed2);
    var points2 = lesson.get('points_reward') || 0;
    await addPointsWithBonus(user, points2, 'Ders tamamlama');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points'), message: 'Ders tamamlandı! +' + points2 + ' puan' };
});

// ================================================================
// ========== V27 ZEKA TESTİ ==========
// ================================================================
Parse.Cloud.define("getQuizQuestions", async function (request) {
    var today = new Date().toDateString();
    var query = new Parse.Query(Quiz);
    query.equalTo('date', today);
    query.equalTo('is_active', true);
    var quizes = await query.find({ useMasterKey: true });
    if (quizes.length > 0) {
        return quizes.map(function (q) {
            return {
                id: q.id,
                question: q.get('question'),
                options: q.get('options'),
                points_reward: q.get('points_reward') || 0
            };
        });
    }
    return [
        { id: 'q1', question: 'Python\'da bir fonksiyon tanımlamak için hangi anahtar kelime kullanılır?', options: ['function', 'def', 'define', 'func'], points_reward: 10 },
        { id: 'q2', question: 'VİZYON AI kaç modeli tek çatı altında birleştirir?', options: ['7', '13', '21', '30'], points_reward: 15 },
        { id: 'q3', question: '3D model oluşturmak için hangi kütüphane kullanılır?', options: ['Three.js', 'React.js', 'Vue.js', 'Angular'], points_reward: 10 },
        { id: 'q4', question: 'Veri analizi için hangi Python kütüphanesi yaygın olarak kullanılır?', options: ['Pandas', 'NumPy', 'Matplotlib', 'Hepsi'], points_reward: 15 },
        { id: 'q5', question: 'V27 API anahtarı ücretsiz üye için kaç adet?', options: ['0', '1', '2', '5'], points_reward: 10 },
        { id: 'q6', question: 'VİZYON 2027\'nin kurucusu kimdir?', options: ['Eymen', 'İbrahim', 'Bozkurt', 'Ömer'], points_reward: 15 },
        { id: 'q7', question: 'Takım oluşturmak için hangi plana ihtiyaç vardır?', options: ['Ücretsiz', 'Pro', 'Takım', 'Hepsi'], points_reward: 10 },
        { id: 'q8', question: 'Hata bildiriminde kaç puan kazanılır?', options: ['50', '100', '150', '200'], points_reward: 10 },
        { id: 'q9', question: 'Davet kodu kaç kişi tarafından kullanılabilir?', options: ['1', '2', '3', 'Sınırsız'], points_reward: 15 },
        { id: 'q10', question: 'Uzay modu hangi saatler arasında aktiftir?', options: ['00:00-03:00', '02:00-05:00', '23:00-02:00', '04:00-07:00'], points_reward: 10 }
    ];
});

Parse.Cloud.define("submitQuizAnswer", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var quizId = request.params.quizId;
    var answerIndex = request.params.answerIndex;
    var sampleAnswers = {
        'q1': 1, 'q2': 2, 'q3': 0, 'q4': 3, 'q5': 2,
        'q6': 0, 'q7': 2, 'q8': 1, 'q9': 1, 'q10': 1
    };
    var query = new Parse.Query(Quiz);
    var quiz = await query.get(quizId, { useMasterKey: true });
    var correct = false;
    var points = 0;
    if (quiz) {
        correct = (answerIndex === quiz.get('correct_answer'));
        points = quiz.get('points_reward') || 0;
    } else {
        var correctIndex = sampleAnswers[quizId];
        if (correctIndex !== undefined && answerIndex === correctIndex) {
            correct = true;
            points = 10;
        }
    }
    if (correct) {
        await addPointsWithBonus(user, points, 'Zeka testi doğru');
        return { success: true, correct: true, points_reward: points, remaining_points: user.get('points') };
    } else {
        return { success: true, correct: false };
    }
});

// ================================================================
// ========== YARIŞMA (ESKİ) ==========
// ================================================================
Parse.Cloud.define("getContestRanking", async function (request) {
    var query = new Parse.Query(Contest);
    query.descending('createdAt');
    var contest = await query.first({ useMasterKey: true });
    if (!contest) return [];
    var userQuery = new Parse.Query(Parse.User);
    userQuery.descending('points');
    userQuery.limit(10);
    var users = await userQuery.find({ useMasterKey: true });
    return users.map(function (u) {
        return {
            name: u.get('name') || u.get('username') || 'İsimsiz',
            points: u.get('points') || 0
        };
    });
});

// ================================================================
// ========== AYLIK YARIŞMA SİSTEMİ ==========
// ================================================================
Parse.Cloud.define("getActiveContest", async function (request) {
    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var query = new Parse.Query(Contest);
    query.equalTo('month', month);
    query.equalTo('is_active', true);
    var contest = await query.first({ useMasterKey: true });

    if (!contest) {
        contest = new Contest();
        contest.set('month', month);
        contest.set('title', 'Aylık Yarışma - ' + month);
        contest.set('is_active', true);
        var endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        contest.set('end_date', endDate);
        contest.set('winner1_email', null);
        contest.set('winner2_email', null);
        contest.set('winner3_email', null);
        await contest.save(null, { useMasterKey: true });
        console.log('✅ Yeni yarışma oluşturuldu: ' + month);
    }

    return {
        id: contest.id,
        month: contest.get('month'),
        title: contest.get('title'),
        is_active: contest.get('is_active'),
        end_date: contest.get('end_date'),
        winner1_email: contest.get('winner1_email'),
        winner2_email: contest.get('winner2_email'),
        winner3_email: contest.get('winner3_email')
    };
});

Parse.Cloud.define("checkContestParticipation", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var contestQuery = new Parse.Query(Contest);
    contestQuery.equalTo('month', month);
    contestQuery.equalTo('is_active', true);
    var contest = await contestQuery.first({ useMasterKey: true });
    if (!contest) return { isParticipant: false, contestId: null };

    var participantQuery = new Parse.Query(ContestParticipant);
    participantQuery.equalTo('contest_id', contest.id);
    participantQuery.equalTo('user_email', user.get('email'));
    var participant = await participantQuery.first({ useMasterKey: true });

    return {
        isParticipant: !!participant,
        contestId: contest.id,
        totalPoints: participant ? (participant.get('total_points') || 0) : 0
    };
});

Parse.Cloud.define("joinContest", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var contestQuery = new Parse.Query(Contest);
    contestQuery.equalTo('month', month);
    contestQuery.equalTo('is_active', true);
    var contest = await contestQuery.first({ useMasterKey: true });

    if (!contest) {
        contest = new Contest();
        contest.set('month', month);
        contest.set('title', 'Aylık Yarışma - ' + month);
        contest.set('is_active', true);
        var endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        contest.set('end_date', endDate);
        await contest.save(null, { useMasterKey: true });
    }

    var existingQuery = new Parse.Query(ContestParticipant);
    existingQuery.equalTo('contest_id', contest.id);
    existingQuery.equalTo('user_email', user.get('email'));
    var existing = await existingQuery.first({ useMasterKey: true });
    if (existing) {
        return { success: false, error: 'Zaten bu yarışmaya katıldınız.' };
    }

    var participant = new ContestParticipant();
    participant.set('contest_id', contest.id);
    participant.set('user_email', user.get('email'));
    participant.set('user_name', user.get('name') || user.get('username') || 'Kullanıcı');
    participant.set('joined_at', new Date());
    participant.set('total_points', 0);
    await participant.save(null, { useMasterKey: true });

    console.log('✅ Kullanıcı yarışmaya katıldı: ' + user.get('email') + ' (' + month + ')');
    return { success: true, message: 'Yarışmaya katıldınız!', contestId: contest.id };
});

Parse.Cloud.define("createContestProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var projectName = request.params.projectName;
    var code = request.params.code;
    if (!projectName || !code) throw new Error('Proje adı ve kod gerekli!');

    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var contestQuery = new Parse.Query(Contest);
    contestQuery.equalTo('month', month);
    contestQuery.equalTo('is_active', true);
    var contest = await contestQuery.first({ useMasterKey: true });
    if (!contest) throw new Error('Aktif yarışma bulunamadı!');

    var participantQuery = new Parse.Query(ContestParticipant);
    participantQuery.equalTo('contest_id', contest.id);
    participantQuery.equalTo('user_email', user.get('email'));
    var participant = await participantQuery.first({ useMasterKey: true });
    if (!participant) throw new Error('Önce yarışmaya katılmalısınız!');

    var project = new ContestProject();
    project.set('contest_id', contest.id);
    project.set('user_email', user.get('email'));
    project.set('user_name', user.get('name') || user.get('username') || 'Kullanıcı');
    project.set('project_name', projectName);
    project.set('code', code);
    project.set('submitted_at', new Date());
    project.set('reviewed', false);
    project.set('points', 0);
    await project.save(null, { useMasterKey: true });

    console.log('✅ Yarışma projesi oluşturuldu: ' + user.get('email') + ' - ' + projectName);
    return { success: true, message: 'Projeniz kurucuya gönderildi!', projectId: project.id };
});

Parse.Cloud.define("getContestRankingV2", async function (request) {
    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var contestQuery = new Parse.Query(Contest);
    contestQuery.equalTo('month', month);
    contestQuery.equalTo('is_active', true);
    var contest = await contestQuery.first({ useMasterKey: true });
    if (!contest) return { ranking: [], contestId: null, month: month };

    var participantQuery = new Parse.Query(ContestParticipant);
    participantQuery.equalTo('contest_id', contest.id);
    participantQuery.descending('total_points');
    participantQuery.limit(100);
    var participants = await participantQuery.find({ useMasterKey: true });

    var ranking = participants.map(function (p, index) {
        return {
            rank: index + 1,
            user_email: p.get('user_email'),
            user_name: p.get('user_name') || 'İsimsiz',
            total_points: p.get('total_points') || 0,
            joined_at: p.get('joined_at')
        };
    });

    return { ranking: ranking, contestId: contest.id, month: month };
});

Parse.Cloud.define("getContestProjectsForFounder", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu görebilir!');

    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var contestQuery = new Parse.Query(Contest);
    contestQuery.equalTo('month', month);
    contestQuery.equalTo('is_active', true);
    var contest = await contestQuery.first({ useMasterKey: true });
    if (!contest) return { projects: [] };

    var projectQuery = new Parse.Query(ContestProject);
    projectQuery.equalTo('contest_id', contest.id);
    projectQuery.descending('submitted_at');
    var projects = await projectQuery.find({ useMasterKey: true });

    return {
        projects: projects.map(function (p) {
            return {
                id: p.id,
                user_email: p.get('user_email'),
                user_name: p.get('user_name'),
                project_name: p.get('project_name'),
                code: p.get('code'),
                submitted_at: p.get('submitted_at'),
                reviewed: p.get('reviewed') || false,
                points: p.get('points') || 0
            };
        })
    };
});

Parse.Cloud.define("scoreContestProject", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu puan verebilir!');

    var projectId = request.params.projectId;
    var points = parseInt(request.params.points);
    if (!projectId) throw new Error('Proje ID gerekli!');
    if (isNaN(points) || points < 1 || points > 10000) throw new Error('Puan 1-10000 arası olmalı!');

    var projectQuery = new Parse.Query(ContestProject);
    var project = await projectQuery.get(projectId, { useMasterKey: true });
    if (!project) throw new Error('Proje bulunamadı!');

    var oldPoints = project.get('points') || 0;
    project.set('points', points);
    project.set('reviewed', true);
    await project.save(null, { useMasterKey: true });

    var participantQuery = new Parse.Query(ContestParticipant);
    participantQuery.equalTo('contest_id', project.get('contest_id'));
    participantQuery.equalTo('user_email', project.get('user_email'));
    var participant = await participantQuery.first({ useMasterKey: true });
    if (participant) {
        var currentTotal = participant.get('total_points') || 0;
        var newTotal = currentTotal - oldPoints + points;
        if (newTotal < 0) newTotal = 0;
        participant.set('total_points', newTotal);
        await participant.save(null, { useMasterKey: true });
    }

    console.log('✅ Proje puanlandı: ' + project.get('project_name') + ' → ' + points + ' puan');
    return { success: true, message: 'Puan kaydedildi!', newTotal: participant ? participant.get('total_points') : points };
});

Parse.Cloud.define("finalizeContest", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu finalize edebilir!');

    return await runFinalizeContest();
});

async function runFinalizeContest() {
    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var contestQuery = new Parse.Query(Contest);
    contestQuery.equalTo('month', month);
    contestQuery.equalTo('is_active', true);
    var contest = await contestQuery.first({ useMasterKey: true });
    if (!contest) return { success: false, message: 'Aktif yarışma yok.' };

    var participantQuery = new Parse.Query(ContestParticipant);
    participantQuery.equalTo('contest_id', contest.id);
    participantQuery.descending('total_points');
    participantQuery.limit(3);
    var top3 = await participantQuery.find({ useMasterKey: true });

    if (top3.length === 0) {
        contest.set('is_active', false);
        await contest.save(null, { useMasterKey: true });
        return { success: false, message: 'Katılımcı yok.' };
    }

    var rewards = ['Takım Paketi', 'Pro Paketi', '5000 V27 Mağaza Puanı'];
    var winnerEmails = [];

    for (var i = 0; i < top3.length && i < 3; i++) {
        var participant = top3[i];
        var userEmail = participant.get('user_email');
        var userName = participant.get('user_name') || 'Kullanıcı';
        var rank = i + 1;
        var reward = rewards[i];
        winnerEmails.push(userEmail);

        var winner = new ContestWinner();
        winner.set('contest_id', contest.id);
        winner.set('month', month);
        winner.set('rank', rank);
        winner.set('user_email', userEmail);
        winner.set('reward', reward);
        await winner.save(null, { useMasterKey: true });

        try {
            var userQuery = new Parse.Query(Parse.User);
            userQuery.equalTo('email', userEmail);
            var winnerUser = await userQuery.first({ useMasterKey: true });
            if (winnerUser) {
                if (rank === 1) {
                    winnerUser.set('plan', 'team');
                    await winnerUser.save(null, { useMasterKey: true });
                    console.log('✅ 1. ' + userEmail + ' → Takım Paketi uygulandı');
                } else if (rank === 2) {
                    winnerUser.set('plan', 'pro');
                    await winnerUser.save(null, { useMasterKey: true });
                    console.log('✅ 2. ' + userEmail + ' → Pro Paketi uygulandı');
                } else if (rank === 3) {
                    var currentPoints = winnerUser.get('points') || 0;
                    winnerUser.set('points', currentPoints + 5000);
                    await winnerUser.save(null, { useMasterKey: true });
                    console.log('✅ 3. ' + userEmail + ' → 5000 puan eklendi');
                }

                await sendNotificationToUser(winnerUser, '🏆 Aylık yarışmada ' + rank + '. oldunuz! Ödül: ' + reward, 'contest_winner');
            }
        } catch (e) {
            console.error('Ödül uygulanamadı (' + userEmail + '):', e.message);
        }

        var inbox = new Inbox();
        inbox.set('sender_email', 'system@vizyon2027.com');
        inbox.set('receiver_email', userEmail);
        inbox.set('type', 'contest_winner');
        inbox.set('status', 'done');
        inbox.set('message', '🎉 Tebrikler ' + userName + '! Aylık yarışmada ' + rank + '. oldunuz. Ödülünüz: ' + reward + '.');
        await inbox.save(null, { useMasterKey: true });
    }

    if (winnerEmails[0]) contest.set('winner1_email', winnerEmails[0]);
    if (winnerEmails[1]) contest.set('winner2_email', winnerEmails[1]);
    if (winnerEmails[2]) contest.set('winner3_email', winnerEmails[2]);
    contest.set('is_active', false);
    await contest.save(null, { useMasterKey: true });

    console.log('✅ Yarışma finalize edildi: ' + month + ' - Kazananlar: ' + winnerEmails.join(', '));
    return { success: true, message: 'Yarışma tamamlandı! Kazananlar bildirildi ve ödüller uygulandı.', winners: winnerEmails };
}

// ================================================================
// ========== ANKET ==========
// ================================================================
Parse.Cloud.define("createPoll", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu anket oluşturabilir!');
    var question = request.params.question;
    var options = request.params.options;
    var duration = request.params.duration;
    if (!question || !options || options.length < 2) throw new Error('Soru ve en az 2 seçenek gerekli!');
    var poll = new Poll();
    poll.set('question', question);
    poll.set('options', options);
    poll.set('votes', options.map(function () { return 0; }));
    poll.set('voters', []);
    poll.set('created_by_email', user.get('email'));
    var endDate = new Date();
    endDate.setDate(endDate.getDate() + (duration || 3));
    poll.set('end_date', endDate);
    poll.set('is_active', true);
    await poll.save(null, { useMasterKey: true });
    return { success: true, pollId: poll.id };
});

Parse.Cloud.define("getActivePoll", async function (request) {
    var query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    query.descending('createdAt');
    var poll = await query.first({ useMasterKey: true });
    if (!poll) return null;
    if (poll.get('end_date') && new Date(poll.get('end_date')) < new Date()) {
        poll.set('is_active', false);
        await poll.save(null, { useMasterKey: true });
        return null;
    }
    return {
        id: poll.id,
        question: poll.get('question'),
        options: poll.get('options'),
        votes: poll.get('votes'),
        end_date: poll.get('end_date')
    };
});

Parse.Cloud.define("votePoll", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var optionIndex = request.params.optionIndex;
    var query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    var poll = await query.first({ useMasterKey: true });
    if (!poll) throw new Error('Aktif anket yok!');
    if (new Date(poll.get('end_date')) < new Date()) throw new Error('Anket süresi doldu!');
    var voters = poll.get('voters') || [];
    if (voters.some(function (v) { return v === user.id; })) throw new Error('Zaten oy kullandınız!');
    voters.push(user.id);
    poll.set('voters', voters);
    var votes = poll.get('votes') || [];
    if (optionIndex < 0 || optionIndex >= votes.length) throw new Error('Geçersiz seçenek!');
    votes[optionIndex] = (votes[optionIndex] || 0) + 1;
    poll.set('votes', votes);
    await poll.save(null, { useMasterKey: true });
    await addPointsWithBonus(user, 20, 'Anket oylama');
    return { success: true };
});

Parse.Cloud.define("deletePoll", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu silebilir!');
    var query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    var poll = await query.first({ useMasterKey: true });
    if (!poll) throw new Error('Aktif anket yok!');
    await poll.destroy({ useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("editPoll", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu düzenleyebilir!');
    var question = request.params.question;
    if (!question) throw new Error('Soru gerekli!');
    var query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    var poll = await query.first({ useMasterKey: true });
    if (!poll) throw new Error('Aktif anket yok!');
    poll.set('question', question);
    await poll.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== DUYURU ==========
// ================================================================
Parse.Cloud.define("getAnnouncements", async function (request) {
    var query = new Parse.Query(Announcement);
    query.descending('createdAt');
    query.limit(10);
    var announcements = await query.find({ useMasterKey: true });
    return announcements.map(function (a) {
        return {
            id: a.id,
            title: a.get('title_'),
            content: a.get('content'),
            created_by: a.get('created_by_email'),
            createdAt: a.get('createdAt')
        };
    });
});

Parse.Cloud.define("addAnnouncement", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var title = request.params.title;
    var content = request.params.content;
    if (!title || !content) throw new Error('Başlık ve içerik gerekli!');
    var ann = new Announcement();
    ann.set('title_', title);
    ann.set('content', content);
    ann.set('created_by_email', user.get('email'));
    await ann.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("deleteAnnouncement", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var announcementId = request.params.announcementId;
    var query = new Parse.Query(Announcement);
    var ann = await query.get(announcementId, { useMasterKey: true });
    if (!ann) throw new Error('Duyuru bulunamadı!');
    await ann.destroy({ useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("editAnnouncement", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var announcementId = request.params.announcementId;
    var title = request.params.title;
    var content = request.params.content;
    var query = new Parse.Query(Announcement);
    var ann = await query.get(announcementId, { useMasterKey: true });
    if (!ann) throw new Error('Duyuru bulunamadı!');
    if (title) ann.set('title_', title);
    if (content) ann.set('content', content);
    await ann.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== İŞ İLANI ==========
// ================================================================
Parse.Cloud.define("getJobs", async function (request) {
    var query = new Parse.Query(Job);
    query.equalTo('is_active', true);
    var jobs = await query.find({ useMasterKey: true });
    return jobs.map(function (j) {
        return {
            id: j.id,
            title: j.get('title_'),
            description: j.get('description'),
            company: j.get('company'),
            contact: j.get('contact')
        };
    });
});

Parse.Cloud.define("applyJob", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var jobId = request.params.jobId;
    var query = new Parse.Query(Job);
    var job = await query.get(jobId, { useMasterKey: true });
    if (!job) throw new Error('İlan bulunamadı!');
    return { success: true, message: 'Başvurunuz alındı!' };
});

// ================================================================
// ========== HATA BİLDİR ==========
// ================================================================
Parse.Cloud.define("submitBugReport", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var description = request.params.description;
    var screenshot = request.params.screenshot;
    if (!description) throw new Error('Hata açıklaması gerekli!');
    var bug = new BugReport();
    bug.set('user_email', user.get('email'));
    bug.set('description', description);
    if (screenshot) bug.set('screenshot', screenshot);
    bug.set('status', 'pending');
    bug.set('points_reward', 100);
    await bug.save(null, { useMasterKey: true });
    await addPointsWithBonus(user, 100, 'Hata bildirimi');
    return { success: true, remaining_points: user.get('points'), message: 'Hata bildiriminiz alındı! +100 puan' };
});

// ================================================================
// ========== CÜZDAN ==========
// ================================================================
Parse.Cloud.define("getWalletBalance", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    return { balance: user.get('wallet_balance') || 0 };
});

Parse.Cloud.define("withdrawFunds", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var amount = request.params.amount;
    if (!amount || amount <= 0) throw new Error('Geçersiz miktar!');
    var balance = user.get('wallet_balance') || 0;
    if (balance < amount) throw new Error('Yeterli bakiye yok!');
    user.set('wallet_balance', balance - amount);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: amount + ' TL çekim talebi alındı.' };
});

// ================================================================
// ========== TAKİP ==========
// ================================================================
Parse.Cloud.define("toggleFollow", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var userId = request.params.userId;
    var targetUser = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    var following = user.get('following') || [];
    var index = following.findIndex(function (u) { return u.id === targetUser.id; });
    if (index > -1) {
        following.splice(index, 1);
        user.set('following', following);
        await user.save(null, { useMasterKey: true });
        var followers = targetUser.get('followers') || [];
        var idx = followers.findIndex(function (u) { return u.id === user.id; });
        if (idx > -1) {
            followers.splice(idx, 1);
            targetUser.set('followers', followers);
            await targetUser.save(null, { useMasterKey: true });
        }
        return { success: true, message: 'Takip bırakıldı.', action: 'unfollowed' };
    } else {
        following.push(targetUser);
        user.set('following', following);
        await user.save(null, { useMasterKey: true });
        var followers2 = targetUser.get('followers') || [];
        followers2.push(user);
        targetUser.set('followers', followers2);
        await targetUser.save(null, { useMasterKey: true });
        return { success: true, message: 'Takip ediliyor.', action: 'followed' };
    }
});

// ================================================================
// ========== PROFİL ==========
// ================================================================
Parse.Cloud.define("getProfile", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var userId = request.params.userId;
    var targetUser = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    var isFollowing = (user.get('following') || []).some(function (u) { return u.id === targetUser.id; });
    return {
        user: {
            id: targetUser.id,
            name: targetUser.get('name'),
            username: targetUser.get('username'),
            email: targetUser.get('email'),
            bio: targetUser.get('bio'),
            points: targetUser.get('points') || 0,
            level: targetUser.get('level') || 'Çaylak',
            badges: targetUser.get('badges') || []
        },
        followers: (targetUser.get('followers') || []).length,
        following: (targetUser.get('following') || []).length,
        isFollowing: isFollowing
    };
});

// ================================================================
// ========== KULLANICI ARA ==========
// ================================================================
Parse.Cloud.define("searchUsers", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var query = request.params.query;
    if (!query) return [];
    var q = new Parse.Query(Parse.User);
    q.matches('email', new RegExp(query, 'i'));
    var q2 = new Parse.Query(Parse.User);
    q2.matches('username', new RegExp(query, 'i'));
    var mainQuery = Parse.Query.or(q, q2);
    var users = await mainQuery.find({ useMasterKey: true });
    return users.map(function (u) {
        return {
            id: u.id,
            name: u.get('name'),
            username: u.get('username'),
            email: u.get('email')
        };
    });
});

// ================================================================
// ========== EBEVEYN AYARLARI ==========
// ================================================================
Parse.Cloud.define("requestParentVerification", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var email = request.params.email;
    if (!email) throw new Error('E-posta gerekli!');
    if (email === user.get('email')) throw new Error('Ebeveyn e-postası kendi e-postanız ile aynı olamaz!');
    var code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set('parent_email', email);
    user.set('parent_verification_code', code);
    user.set('parent_code_expires', new Date(Date.now() + 15 * 60000));
    user.set('parent_temp_password', null);
    await user.save(null, { useMasterKey: true });
    await Parse.Cloud.run('sendEmail', {
        to: email,
        subject: 'VİZYON2027 Ebeveyn Doğrulama Kodu',
        html: '<h3>Ebeveyn Doğrulama</h3><p>Kodunuz: <strong>' + code + '</strong></p><p>15 dakika geçerlidir.</p>'
    }, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("verifyParentCode", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var code = request.params.code;
    if (!code) throw new Error('Kod gerekli!');
    if (user.get('parent_verification_code') !== code) throw new Error('Geçersiz kod!');
    if (new Date(user.get('parent_code_expires')) < new Date()) throw new Error('Kod süresi doldu!');
    user.set('parent_mode', true);
    user.set('parent_verification_code', null);
    user.set('parent_code_expires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("setParentPin", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var pin = request.params.pin;
    if (!pin || pin.length !== 4 || isNaN(pin)) throw new Error('PIN 4 haneli olmalı!');
    user.set('parent_pin', pin);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: 'PIN başarıyla ayarlandı!' };
});

Parse.Cloud.define("getParentSettings", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    return {
        parent_mode: user.get('parent_mode') || false,
        parent_email: user.get('parent_email'),
        has_pin: !!user.get('parent_pin'),
        live_tracking: user.get('live_tracking') || false,
        daily_limit: user.get('daily_limit') || 0,
        weekly_limit: user.get('weekly_limit') || 0,
        monthly_limit: user.get('monthly_limit') || 0,
        is_suspended: user.get('is_suspended') || false,
        suspend_until: user.get('suspend_until'),
        features: user.get('parent_features') || {}
    };
});

Parse.Cloud.define("updateParentSettings", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    var settings = request.params.settings;
    if (!childEmail) throw new Error('Çocuk e-posta adresi gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    if (settings.daily_limit !== undefined) child.set('daily_limit', settings.daily_limit);
    if (settings.weekly_limit !== undefined) child.set('weekly_limit', settings.weekly_limit);
    if (settings.monthly_limit !== undefined) child.set('monthly_limit', settings.monthly_limit);
    if (settings.features) child.set('parent_features', settings.features);
    await child.save(null, { useMasterKey: true });
    return { success: true, message: 'Ebeveyn ayarları güncellendi!' };
});

Parse.Cloud.define("toggleParentFeature", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    var feature = request.params.feature;
    var enabled = request.params.enabled;
    if (!childEmail || !feature) throw new Error('Çocuk e-posta ve özellik adı gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    var features = child.get('parent_features') || {};
    features[feature] = enabled;
    child.set('parent_features', features);
    await child.save(null, { useMasterKey: true });
    return { success: true, message: '"' + feature + '" özelliği ' + (enabled ? 'açıldı' : 'kapatıldı') + '.' };
});

Parse.Cloud.define("getFullParentSettings", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    if (!childEmail) throw new Error('Çocuk e-posta gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    var features = child.get('parent_features') || {};
    return {
        parent_mode: child.get('parent_mode') || false,
        parent_email: child.get('parent_email'),
        has_pin: !!child.get('parent_pin'),
        live_tracking: child.get('live_tracking') || false,
        daily_limit: child.get('daily_limit') || 0,
        weekly_limit: child.get('weekly_limit') || 0,
        monthly_limit: child.get('monthly_limit') || 0,
        is_suspended: child.get('is_suspended') || false,
        suspend_until: child.get('suspend_until'),
        features: {
            chat: features.chat !== false,
            store: features.store !== false,
            game: features.game !== false,
            academy: features.academy !== false,
            project: features.project !== false,
            contest: features.contest !== false,
            dm: features.dm !== false
        },
        points: child.get('points') || 0,
        level: child.get('level') || 'Çaylak',
        lastActive: child.get('updatedAt') || child.get('createdAt')
    };
});

Parse.Cloud.define("suspendChildAccount", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    var durationHours = request.params.durationHours;
    if (!childEmail || !durationHours) throw new Error('Çocuk e-posta ve süre gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    var suspendUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    child.set('is_suspended', true);
    child.set('suspend_until', suspendUntil);
    await child.save(null, { useMasterKey: true });
    await sendNotificationToUser(child, '⛔ Hesabınız ' + durationHours + ' saat süreyle askıya alındı.', 'parent');
    return { success: true, message: 'Hesap ' + durationHours + ' saatliğine askıya alındı.' };
});

Parse.Cloud.define("unsuspendChildAccount", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    if (!childEmail) throw new Error('Çocuk e-posta gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    child.set('is_suspended', false);
    child.set('suspend_until', null);
    await child.save(null, { useMasterKey: true });
    await sendNotificationToUser(child, '✅ Hesabınızın askısı kaldırıldı.', 'parent');
    return { success: true, message: 'Askı kaldırıldı.' };
});

Parse.Cloud.define("toggleLiveTracking", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var current = user.get('live_tracking') || false;
    user.set('live_tracking', !current);
    await user.save(null, { useMasterKey: true });
    return { success: true, enabled: !current };
});

Parse.Cloud.define("setDailyLimit", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var limit = request.params.limit;
    user.set('daily_limit', limit);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: 'Günlük limit ayarlandı!' };
});

Parse.Cloud.define("getChildSessions", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    if (!childEmail) throw new Error('Çocuk e-posta gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    var sessions = [
        { time: child.get('createdAt') || new Date(), ip: '192.168.1.1', device: 'Chrome' },
        { time: child.get('updatedAt') || new Date(), ip: '10.0.0.1', device: 'Firefox' }
    ];
    return { success: true, sessions: sessions };
});

Parse.Cloud.define("sendParentReport", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    if (!childEmail) throw new Error('Çocuk e-posta gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    var points = child.get('points') || 0;
    var level = child.get('level') || 'Çaylak';
    var lastActive = child.get('updatedAt') || child.get('createdAt');
    var html = '<h3>📊 VİZYON2027 Haftalık Rapor</h3>' +
        '<p><strong>Çocuk:</strong> ' + child.get('name') + ' (' + childEmail + ')</p>' +
        '<p><strong>Puan:</strong> ' + points + '</p>' +
        '<p><strong>Seviye:</strong> ' + level + '</p>' +
        '<p><strong>Son Aktivite:</strong> ' + new Date(lastActive).toLocaleString('tr-TR') + '</p>' +
        '<p>Detaylar için profiline göz atabilirsin.</p>' +
        '<p>VİZYON2027 Ekibi</p>';
    await Parse.Cloud.run('sendEmail', {
        to: user.get('email'),
        subject: 'VİZYON2027 - ' + child.get('name') + ' Haftalık Rapor',
        html: html
    }, { useMasterKey: true });
    return { success: true, message: 'Rapor e-postanıza gönderildi.' };
});

Parse.Cloud.define("removeParentControl", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var childEmail = request.params.childEmail;
    if (!childEmail) throw new Error('Çocuk e-posta gerekli!');
    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');
    child.set('parent_mode', false);
    child.set('parent_email', null);
    child.set('parent_verification_code', null);
    child.set('parent_code_expires', null);
    child.set('parent_pin', null);
    child.set('live_tracking', false);
    child.set('daily_limit', null);
    child.set('weekly_limit', null);
    child.set('monthly_limit', null);
    child.set('parent_features', {});
    child.set('is_suspended', false);
    child.set('suspend_until', null);
    await child.save(null, { useMasterKey: true });
    await sendNotificationToUser(child, '🛡️ Ebeveyn denetimi kaldırıldı.', 'parent');
    return { success: true, message: 'Ebeveyn denetimi başarıyla kaldırıldı.' };
});

Parse.Cloud.define("requestParentReset", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var parentEmail = user.get('parent_email');
    if (!parentEmail) throw new Error('Ebeveyn e-postası ayarlanmamış!');
    var code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set('parent_reset_code', code);
    user.set('parent_reset_expires', new Date(Date.now() + 15 * 60000));
    await user.save(null, { useMasterKey: true });
    await Parse.Cloud.run('sendEmail', {
        to: parentEmail,
        subject: 'VİZYON2027 Ebeveyn Şifre Sıfırlama',
        html: '<h3>Ebeveyn Şifre Sıfırlama</h3><p>Kodunuz: <strong>' + code + '</strong></p><p>15 dakika geçerlidir.</p>'
    }, { useMasterKey: true });
    return { success: true, message: 'Şifre sıfırlama kodu ebeveyn e-postanıza gönderildi.' };
});

Parse.Cloud.define("confirmParentReset", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (!user.get('parent_mode')) throw new Error('Ebeveyn modu aktif değil!');
    var code = request.params.code;
    var newPassword = request.params.newPassword;
    if (!code || !newPassword) throw new Error('Kod ve yeni şifre gerekli!');
    if (newPassword.length < 8) throw new Error('Şifre en az 8 karakter olmalı!');
    if (user.get('parent_reset_code') !== code) throw new Error('Geçersiz kod!');
    if (new Date(user.get('parent_reset_expires')) < new Date()) throw new Error('Kod süresi doldu!');
    user.set('parent_temp_password', newPassword);
    user.set('parent_reset_code', null);
    user.set('parent_reset_expires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: 'Şifre başarıyla sıfırlandı!' };
});

// ================================================================
// ========== KURUCU İLETİŞİM ==========
// ================================================================
Parse.Cloud.define("sendFounderMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');
    var founderQuery = new Parse.Query(Parse.User);
    founderQuery.equalTo('role', 'founder');
    var founder = await founderQuery.first({ useMasterKey: true });
    if (!founder) throw new Error('Kurucu bulunamadı!');
    await sendNotificationToUser(founder, '📩 ' + user.get('name') + ' size mesaj gönderdi: ' + message.substring(0, 100), 'founder_contact');
    var inbox = new Inbox();
    inbox.set('sender_email', user.get('email'));
    inbox.set('receiver_email', founder.get('email'));
    inbox.set('type', 'founder_contact');
    inbox.set('message', user.get('name') + ': ' + message);
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: 'Mesajınız kurucuya iletildi.' };
});

// ================================================================
// ========== PUAN & REFERANS ==========
// ================================================================
Parse.Cloud.define("getUserPoints", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    return { points: user.get('points') || 0, level: user.get('level') || 'Çaylak' };
});

Parse.Cloud.define("generateReferralCode", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var code = user.get('referral_code');
    if (!code) {
        var name = (user.get('name') || user.get('username') || 'KULLANICI').toUpperCase().substring(0, 4);
        var random = Math.floor(1000 + Math.random() * 9000);
        code = 'V27-' + name + '-' + random;
        user.set('referral_code', code);
        await user.save(null, { useMasterKey: true });
    }
    return { referral_code: code };
});

Parse.Cloud.define("applyReferral", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var code = request.params.code;
    if (!code) throw new Error('Davet kodu gerekli!');
    if (code === 'Eymen1144') {
        var founderQuery = new Parse.Query(Parse.User);
        founderQuery.equalTo('email', 'admin.tr.reis@gmail.com');
        var founder = await founderQuery.first({ useMasterKey: true });
        if (!founder) throw new Error('Kurucu bulunamadı!');
        await sendNotificationToUser(founder, user.get('name') + ' sizin davet kodunuzu kullanmak istiyor.', 'referral_request');
        var inbox = new Inbox();
        inbox.set('sender_email', user.get('email'));
        inbox.set('receiver_email', 'admin.tr.reis@gmail.com');
        inbox.set('type', 'referral_request');
        inbox.set('message', user.get('name') + ' (' + user.get('email') + ') sizin davet kodunuzu kullanmak istiyor. Onay verir misiniz?');
        await inbox.save(null, { useMasterKey: true });
        return { success: true, message: 'Kurucuya onay mesajı gönderildi. Onay bekleniyor.', pending: true };
    }
    var query = new Parse.Query(Parse.User);
    query.equalTo('referral_code', code);
    var referrer = await query.first({ useMasterKey: true });
    if (!referrer) throw new Error('Geçersiz davet kodu!');
    if (referrer.id === user.id) throw new Error('Kendi davet kodunuzu kullanamazsınız!');
    var referralCount = referrer.get('referral_count') || 0;
    if (referralCount >= 2) throw new Error('Bu davet kodu maksimum 2 kişi tarafından kullanılabilir!');
    var invited_by = user.get('invited_by');
    if (invited_by) throw new Error('Zaten bir davet kodu kullandınız!');
    user.set('invited_by', code);
    await user.save(null, { useMasterKey: true });
    await addPointsWithBonus(referrer, 1000, 'Arkadaş daveti');
    await addPointsWithBonus(user, 1000, 'Davet kodu kullanımı');
    var refCount = referrer.get('referral_count') || 0;
    referrer.set('referral_count', refCount + 1);
    await referrer.save(null, { useMasterKey: true });
    return { success: true, message: 'Davet kodu başarıyla uygulandı! +1000 puan kazandınız.' };
});

Parse.Cloud.define("getReferralLeaderboard", async function (request) {
    try {
        var query = new Parse.Query(Parse.User);
        query.descending('referral_count');
        query.limit(100);
        var users = await query.find({ useMasterKey: true });
        var isFounder = request.user && request.user.get('role') === 'founder';
        var currentUserEmail = request.user ? request.user.get('email') : null;

        return users.map(function (u) {
            var email = u.get('email') || '';
            var name = u.get('name') || u.get('username') || 'İsimsiz';
            var isSelf = (currentUserEmail === email);

            var displayName = (isFounder || isSelf) ? name : censorNameShort(name);
            var displayEmail = (isFounder || isSelf) ? email : censorEmailPattern(email);

            return {
                name: displayName,
                email: displayEmail,
                count: u.get('referral_count') || 0,
                isCurrentUser: isSelf,
                isCensored: !(isFounder || isSelf)
            };
        });
    } catch (e) {
        console.error('Liderlik tablosu hatası:', e);
        return [];
    }
});

// ================================================================
// ========== PAZAR PROJELERİ ==========
// ================================================================
Parse.Cloud.define("getMarketProjects", async function (request) {
    try {
        var query = new Parse.Query(MarketProject);
        query.equalTo("is_active", true);
        query.descending("createdAt");
        var items = await query.find({ useMasterKey: true });
        return items.map(function (item) {
            return {
                id: item.id,
                title: item.get('title'),
                description: item.get('description'),
                price_points: item.get('price_points'),
                owner_email: item.get('owner_email'),
                owner_name: item.get('owner_name'),
                imageUrl: item.get('imageUrl'),
                type: item.get('type'),
                projectId: item.get('projectId'),
                createdAt: item.get('createdAt')
            };
        });
    } catch (e) {
        console.error('Pazar projeleri hatası:', e);
        return [];
    }
});

Parse.Cloud.define("buyMarketProject", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var marketProjectId = request.params.marketProjectId;
    if (!marketProjectId) throw new Error('Proje ID gerekli!');
    var query = new Parse.Query(MarketProject);
    var item = await query.get(marketProjectId, { useMasterKey: true });
    if (!item) throw new Error('Proje bulunamadı!');
    if (item.get('owner_email') === user.get('email')) {
        throw new Error('Kendi projenizi satın alamazsınız!');
    }
    if (!item.get('is_active')) throw new Error('Bu proje artık satışta değil!');
    var price = item.get('price_points') || 0;
    var currentPoints = user.get('points') || 0;
    if (currentPoints < price) throw new Error('Yeterli puanınız yok!');
    var commission = Math.floor(price * 0.2);
    var sellerEarn = price - commission;
    user.set('points', currentPoints - price);
    await user.save(null, { useMasterKey: true });
    var sellerEmail = item.get('owner_email');
    var sellerQuery = new Parse.Query(Parse.User);
    sellerQuery.equalTo('email', sellerEmail);
    var seller = await sellerQuery.first({ useMasterKey: true });
    if (seller) {
        var sellerPoints = seller.get('points') || 0;
        seller.set('points', sellerPoints + sellerEarn);
        await seller.save(null, { useMasterKey: true });
        await sendNotificationToUser(seller, '🎉 Projeniz satıldı! +' + sellerEarn + ' puan kazandınız. (Kesinti: %20 komisyon)', 'store');
    }
    var founderEmail = 'admin.tr.reis@gmail.com';
    var founderQuery = new Parse.Query(Parse.User);
    founderQuery.equalTo('email', founderEmail);
    var founder = await founderQuery.first({ useMasterKey: true });
    if (founder) {
        var founderPoints = founder.get('points') || 0;
        founder.set('points', founderPoints + commission);
        await founder.save(null, { useMasterKey: true });
    }
    var projectId = item.get('projectId');
    if (projectId) {
        var projectQuery = new Parse.Query(Project);
        var project = await projectQuery.get(projectId, { useMasterKey: true });
        if (project) {
            project.set('user_email', user.get('email'));
            await project.save(null, { useMasterKey: true });
        }
    }
    item.set('is_active', false);
    item.set('buyer_email', user.get('email'));
    await item.save(null, { useMasterKey: true });
    await sendNotificationToUser(user, '✅ "' + item.get('title') + '" projesini satın aldınız! (' + price + ' Puan)', 'store');
    return { success: true, remaining_points: user.get('points'), message: 'Proje satın alındı!' };
});

// ================================================================
// ========== BLOG ABONE SİSTEMİ ==========
// ================================================================
Parse.Cloud.define("subscribeToBlog", async function (request) {
    var email = request.params.email;
    if (!email) throw new Error('E-posta adresi gerekli.');
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Geçersiz e-posta formatı.');
    var Subscriber = Parse.Object.extend("BlogSubscriber");
    var query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    var existing = await query.first({ useMasterKey: true });
    if (existing) {
        existing.set("isActive", true);
        await existing.save(null, { useMasterKey: true });
        return { success: true, message: 'Blog aboneliğiniz yeniden aktif edildi.' };
    }
    var subscriber = new Subscriber();
    subscriber.set("email", email);
    subscriber.set("isActive", true);
    subscriber.set("isSystemActive", true);
    subscriber.set("subscribedAt", new Date());
    await subscriber.save(null, { useMasterKey: true });
    try {
        await Parse.Cloud.run("sendEmail", {
            to: email,
            subject: "Vizyon2027 Blog & Sistem Aboneliği",
            html: '<h3>📬 Vizyon2027\'ye Hoş Geldiniz!</h3>' +
                '<p>Artık hem <strong>blog yazılarından</strong> hem de <strong>sistem güncellemelerinden</strong> haberdar olacaksınız.</p>' +
                '<p>Aboneliğiniz ücretsizdir.</p>' +
                '<p>Sevgiler,<br>Vizyon2027 Ekibi</p>'
        }, { useMasterKey: true });
    } catch (e) { console.error('Mail gönderilemedi:', e.message); }
    return { success: true, message: 'Abone oldunuz!' };
});

Parse.Cloud.define("subscribeToSystemUpdates", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Önce giriş yapın!');
    var email = user.get('email');
    if (!email) throw new Error('E-posta adresiniz bulunamadı.');
    var Subscriber = Parse.Object.extend("BlogSubscriber");
    var query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    var existing = await query.first({ useMasterKey: true });
    if (existing) {
        existing.set("isSystemActive", true);
        await existing.save(null, { useMasterKey: true });
        return { success: true, message: 'Sistem güncelleme aboneliğiniz aktif edildi.' };
    }
    var subscriber = new Subscriber();
    subscriber.set("email", email);
    subscriber.set("isActive", false);
    subscriber.set("isSystemActive", true);
    subscriber.set("subscribedAt", new Date());
    await subscriber.save(null, { useMasterKey: true });
    return { success: true, message: 'Sistem güncellemelerine abone oldunuz.' };
});

Parse.Cloud.define("getMySubscriptions", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Önce giriş yapın!');
    var email = user.get('email');
    var Subscriber = Parse.Object.extend("BlogSubscriber");
    var query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    var record = await query.first({ useMasterKey: true });
    if (!record) {
        return { blogActive: false, systemActive: false, message: 'Henüz bir aboneliğiniz yok.' };
    }
    return {
        blogActive: record.get("isActive") || false,
        systemActive: record.get("isSystemActive") || false,
        subscribedAt: record.get("subscribedAt")
    };
});

Parse.Cloud.define("unsubscribeFrom", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Önce giriş yapın!');
    var type = request.params.type;
    if (!type || ['blog', 'system'].indexOf(type) === -1) {
        throw new Error('Geçersiz abonelik türü. "blog" veya "system" girin.');
    }
    var email = user.get('email');
    var Subscriber = Parse.Object.extend("BlogSubscriber");
    var query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    var record = await query.first({ useMasterKey: true });
    if (!record) throw new Error('Abonelik kaydınız bulunamadı.');
    if (type === 'blog') {
        record.set("isActive", false);
    } else {
        record.set("isSystemActive", false);
    }
    await record.save(null, { useMasterKey: true });
    var msg = type === 'blog'
        ? 'Blog aboneliğiniz iptal edildi. Artık yazı bildirimi almayacaksınız.'
        : 'Sistem güncelleme aboneliğiniz iptal edildi. Artık güncelleme bildirimi almayacaksınız.';
    return { success: true, message: msg };
});

Parse.Cloud.define("sendBlogUpdateToSubscribers", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) {
        throw new Error('Yetkiniz yok.');
    }
    var subject = request.params.subject;
    var message = request.params.message;
    if (!subject || !message) throw new Error('Konu ve mesaj gerekli.');
    var Subscriber = Parse.Object.extend("BlogSubscriber");
    var query = new Parse.Query(Subscriber);
    query.equalTo("isActive", true);
    var subscribers = await query.find({ useMasterKey: true });
    if (subscribers.length === 0) return { success: false, message: 'Aktif blog abonesi yok.' };
    var sentCount = 0;
    for (var si = 0; si < subscribers.length; si++) {
        var sub = subscribers[si];
        try {
            await Parse.Cloud.run("sendEmail", {
                to: sub.get("email"),
                subject: "📢 " + subject,
                html: '<h3>Vizyon2027 Blog Güncellemesi</h3>' +
                    '<p>' + message + '</p>' +
                    '<p><a href="https://vizyon2026.vercel.app/blog.html">Blog sayfasını ziyaret et</a></p>' +
                    '<p style="font-size:12px; color:#888;">Abonelikten çıkmak için profilinizden "Aboneliklerim" bölümünü kullanın.</p>' +
                    '<p>Sevgiler,<br>Vizyon2027 Ekibi</p>'
            }, { useMasterKey: true });
            sentCount++;
        } catch (e) { console.error('Mail gönderilemedi (' + sub.get('email') + '):', e.message); }
    }
    return { success: true, sentCount: sentCount, total: subscribers.length };
});

Parse.Cloud.define("sendSystemUpdateToSubscribers", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) {
        throw new Error('Yetkiniz yok.');
    }
    var version = request.params.version;
    var changes = request.params.changes;
    if (!version || !changes) throw new Error('Sürüm ve değişiklikler gerekli.');
    var Subscriber = Parse.Object.extend("BlogSubscriber");
    var query = new Parse.Query(Subscriber);
    query.equalTo("isSystemActive", true);
    var subscribers = await query.find({ useMasterKey: true });
    if (subscribers.length === 0) return { success: false, message: 'Aktif sistem abonesi yok.' };
    var sentCount = 0;
    for (var si = 0; si < subscribers.length; si++) {
        var sub = subscribers[si];
        try {
            await Parse.Cloud.run("sendEmail", {
                to: sub.get("email"),
                subject: "⚡ Vizyon2027 Sistem Güncellendi! (v" + version + ")",
                html: '<h3>⚡ Vizyon2027 Sistem Güncellemesi</h3>' +
                    '<p><strong>Sürüm:</strong> ' + version + '</p>' +
                    '<p><strong>Değişiklikler:</strong><br>' + changes + '</p>' +
                    '<p><a href="https://vizyon2026.vercel.app">Platforma git</a></p>' +
                    '<p style="font-size:12px; color:#888;">Abonelikten çıkmak için profilinizden "Aboneliklerim" bölümünü kullanın.</p>' +
                    '<p>Sevgiler,<br>Vizyon2027 Ekibi</p>'
            }, { useMasterKey: true });
            sentCount++;
        } catch (e) { console.error('Mail gönderilemedi (' + sub.get('email') + '):', e.message); }
    }
    return { success: true, sentCount: sentCount, total: subscribers.length };
});

// ================================================================
// ========== SAVAŞ MODU ==========
// ================================================================
Parse.Cloud.define("battleMode", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var prompt = request.params.prompt;
    var model1 = request.params.model1;
    var model2 = request.params.model2;
    if (!prompt || !model1 || !model2) throw new Error('Konu ve 2 model adı gerekli!');
    var modelMap = {
        'Groq': 'callGroq', 'DeepSeek': 'callDeepSeek', 'OpenAI': 'callOpenAI',
        'OpenRouter': 'callOpenRouter', 'Cohere': 'callCohere', 'Cerebras': 'callCerebras',
        'Gemini': 'callGemini', 'DeepInfra': 'callDeepInfra'
    };
    var m1 = modelMap[model1];
    var m2 = modelMap[model2];
    if (!m1 || !m2) throw new Error('Geçersiz model adı!');
    var fullPrompt = 'Seninle ' + model2 + ' arasında bir tartışma yapıyorsunuz. Konu: "' + prompt + '". Kendi görüşünü savun, karşı görüşü çürüt. Cevabın kısa ve net olsun (max 200 kelime).';
    try {
        var resp1 = null, resp2 = null;
        try { resp1 = await Parse.Cloud.run(m1, { prompt: fullPrompt }, { useMasterKey: true }); } catch (e) { console.error(model1 + ' hatası:', e.message); }
        try { resp2 = await Parse.Cloud.run(m2, { prompt: fullPrompt }, { useMasterKey: true }); } catch (e) { console.error(model2 + ' hatası:', e.message); }
        if (!resp1 && !resp2) return { success: false, error: 'Her iki model de yanıt veremedi.' };
        var winner = null;
        if (resp1 && resp2) { winner = resp1.length > resp2.length ? model1 : model2; }
        else if (resp1) { winner = model1; } else { winner = model2; }
        return { success: true, model1_response: resp1 || 'Yanıt alınamadı.', model2_response: resp2 || 'Yanıt alınamadı.', winner: winner };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== ÇOKLU AI ==========
// ================================================================
Parse.Cloud.define("multiAI", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var prompt = request.params.prompt;
    var models = request.params.models;
    if (!prompt || !models || !Array.isArray(models)) throw new Error('Prompt ve model listesi gerekli!');
    var modelMap = {
        'Groq': 'callGroq', 'DeepSeek': 'callDeepSeek', 'OpenAI': 'callOpenAI',
        'OpenRouter': 'callOpenRouter', 'Cohere': 'callCohere', 'Cerebras': 'callCerebras',
        'Gemini': 'callGemini', 'DeepInfra': 'callDeepInfra'
    };
    var results = {};
    var promises = models.map(async function (modelName) {
        var fn = modelMap[modelName];
        if (!fn) { results[modelName] = 'Geçersiz model'; return; }
        try {
            var response = await Parse.Cloud.run(fn, { prompt: prompt }, { useMasterKey: true });
            results[modelName] = response || 'Yanıt alınamadı.';
        } catch (e) { results[modelName] = 'Hata: ' + e.message; }
    });
    await Promise.all(promises);
    return { success: true, responses: results };
});

// ================================================================
// ========== VİDEO ANALİZ ==========
// ================================================================
Parse.Cloud.define("analyzeVideo", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var url = request.params.url;
    if (!url) throw new Error('Video URL gerekli!');
    try {
        var prompt = 'Şu videoyu analiz et: ' + url + '. Özetle, ana temaları çıkar, kullanıcıya ne kazandıracağını açıkla.';
        var result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, analysis: result };
    } catch (e) { return { success: false, error: e.message }; }
});

Parse.Cloud.define("generateReelsIdeas", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var url = request.params.url;
    if (!url) throw new Error('Video URL gerekli!');
    try {
        var prompt = 'Şu videodan 5 Instagram Reels fikri çıkar: ' + url + '. Her fikir 1 cümle olsun ve hedef kitleyi belirtsin.';
        var result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, ideas: result };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== UYGULAMA YAPTIRICI ==========
// ================================================================
Parse.Cloud.define("generateApp", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var prompt = request.params.prompt;
    if (!prompt) throw new Error('Uygulama fikri gerekli!');
    try {
        var codePrompt = 'Kullanıcı şu uygulamayı istiyor: "' + prompt + '". Sadece çalışan HTML/CSS/JavaScript kodunu ver. Tek dosya halinde, eksiksiz, çalışır durumda. Hiçbir açıklama yapma, sadece kodu ver.';
        var result = await Parse.Cloud.run("superAI", { prompt: codePrompt }, { useMasterKey: true });
        return { success: true, code: result, downloadUrl: null };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== PRO ARAÇLARI ==========
// ================================================================
Parse.Cloud.define("proTools", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || 'Sorgu hakkınız doldu!');
        }
    }
    var tool = request.params.tool;
    var input = request.params.input;
    if (!tool || !input) throw new Error('Araç ve girdi gerekli!');
    var prompt = '';
    switch (tool) {
        case 'kod': prompt = 'Kullanıcı şu kodu istiyor: "' + input + '". Sadece çalışan kodu ver, açıklama yapma. Dil: Python/JavaScript/HTML tercihine göre.'; break;
        case 'yazi': prompt = 'Kullanıcı şu yazıyı istiyor: "' + input + '". 200-300 kelimelik, akıcı ve profesyonel bir metin yaz.'; break;
        case 'ceviri':
            var parts = input.split('->');
            if (parts.length === 2) { prompt = 'Şu metni çevir: "' + parts[0].trim() + '". Hedef dil: ' + parts[1].trim() + '. Sadece çeviriyi ver.'; }
            else { prompt = 'Şu metni İngilizce\'ye çevir: "' + input + '". Sadece çeviriyi ver.'; }
            break;
        default: throw new Error('Geçersiz araç!');
    }
    try {
        var result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, output: result };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== API ANAHTAR YÖNETİMİ (AES-256-GCM) ==========
// ================================================================
Parse.Cloud.define("saveUserApiKey", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var name = request.params.name;
    var value = request.params.value;
    if (!name || !value) throw new Error('İsim ve API anahtarı değeri gerekli!');
    if (name.trim().length < 2) throw new Error('Sanal isim en az 2 karakter olmalı!');
    if (value.trim().length < 8) throw new Error('API anahtarı çok kısa!');

    var existingQuery = new Parse.Query(UserApiKey);
    existingQuery.equalTo('user_email', user.get('email'));
    existingQuery.equalTo('name', name.trim());
    var existing = await existingQuery.first({ useMasterKey: true });
    if (existing) {
        throw new Error('Bu isimde bir anahtarınız zaten var. Farklı bir isim seçin veya düzenleyin.');
    }

    if (!user.get('api_password_hash')) {
        throw new Error('Lütfen önce API şifrenizi belirleyin!');
    }

    var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) throw new Error('Sunucu şifreleme anahtarı eksik (API_ENCRYPTION_KEY).');

    var encrypted = aesEncrypt(value.trim(), encryptionKey);

    var record = new UserApiKey();
    record.set('user_email', user.get('email'));
    record.set('name', name.trim());
    record.set('encryptedValue', encrypted);
    record.set('createdAtClient', new Date());
    record.set('updatedAtClient', new Date());
    record.set('encryption', 'aes-256-gcm');
    await record.save(null, { useMasterKey: true });

    return { success: true, keyId: record.id, message: 'API anahtarı kaydedildi (AES-256-GCM).' };
});

Parse.Cloud.define("getUserApiKeys", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var hasPassword = !!user.get('api_password_hash');

    var query = new Parse.Query(UserApiKey);
    query.equalTo('user_email', user.get('email'));
    query.descending('createdAtClient');
    var keys = await query.find({ useMasterKey: true });

    return {
        success: true,
        hasPassword: hasPassword,
        apiKeys: keys.map(function (k) {
            return {
                id: k.id,
                name: k.get('name'),
                maskedValue: '••••••••',
                createdAt: k.get('createdAtClient') || k.get('createdAt'),
                updatedAt: k.get('updatedAtClient') || k.get('updatedAt')
            };
        })
    };
});

Parse.Cloud.define("getUserApiKeyValue", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var keyId = request.params.keyId;
    if (!keyId) throw new Error('Anahtar ID gerekli!');

    var query = new Parse.Query(UserApiKey);
    var record = await query.get(keyId, { useMasterKey: true });
    if (!record) throw new Error('Anahtar bulunamadı!');
    if (record.get('user_email') !== user.get('email')) throw new Error('Bu anahtar size ait değil!');

    var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) throw new Error('Sunucu şifreleme anahtarı eksik.');

    var decrypted = '';
    try {
        decrypted = smartDecrypt(record.get('encryptedValue'), encryptionKey);
    } catch (e) {
        throw new Error('Anahtar çözülemedi.');
    }
    if (!decrypted) throw new Error('Anahtar boş veya çözülemedi.');

    return { success: true, value: decrypted };
});

Parse.Cloud.define("deleteUserApiKey", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var keyId = request.params.keyId;
    if (!keyId) throw new Error('Anahtar ID gerekli!');

    var query = new Parse.Query(UserApiKey);
    var record = await query.get(keyId, { useMasterKey: true });
    if (!record) throw new Error('Anahtar bulunamadı!');
    if (record.get('user_email') !== user.get('email')) throw new Error('Bu anahtar size ait değil!');

    await record.destroy({ useMasterKey: true });
    return { success: true, message: 'API anahtarı silindi.' };
});

Parse.Cloud.define("updateUserApiKey", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var keyId = request.params.keyId;
    var name = request.params.name;
    var value = request.params.value;
    if (!keyId) throw new Error('Anahtar ID gerekli!');

    var query = new Parse.Query(UserApiKey);
    var record = await query.get(keyId, { useMasterKey: true });
    if (!record) throw new Error('Anahtar bulunamadı!');
    if (record.get('user_email') !== user.get('email')) throw new Error('Bu anahtar size ait değil!');

    if (name) {
        if (name.trim().length < 2) throw new Error('Sanal isim en az 2 karakter olmalı!');
        var dupQuery = new Parse.Query(UserApiKey);
        dupQuery.equalTo('user_email', user.get('email'));
        dupQuery.equalTo('name', name.trim());
        dupQuery.notEqualTo('objectId', keyId);
        var dup = await dupQuery.first({ useMasterKey: true });
        if (dup) throw new Error('Bu isimde başka bir anahtarınız var!');
        record.set('name', name.trim());
    }

    if (value) {
        if (value.trim().length < 8) throw new Error('API anahtarı çok kısa!');
        var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
        if (!encryptionKey) throw new Error('Sunucu şifreleme anahtarı eksik.');
        record.set('encryptedValue', aesEncrypt(value.trim(), encryptionKey));
        record.set('encryption', 'aes-256-gcm');
    }

    record.set('updatedAtClient', new Date());
    await record.save(null, { useMasterKey: true });

    return { success: true, message: 'API anahtarı güncellendi.' };
});

Parse.Cloud.define("setApiPassword", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var password = request.params.password;
    if (!password || password.length < 8) throw new Error('Şifre en az 8 karakter olmalı!');

    if (user.get('api_password_hash')) {
        throw new Error('API şifreniz zaten belirlenmiş. Lütfen "verifyApiPassword" ile doğrulayın.');
    }

    user.set('api_password_hash', hashApiPassword(password));
    await user.save(null, { useMasterKey: true });

    return { success: true, message: 'API şifreniz belirlendi.' };
});

Parse.Cloud.define("verifyApiPassword", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var password = request.params.password;
    if (!password) throw new Error('Şifre gerekli!');

    var stored = user.get('api_password_hash');
    if (!stored) throw new Error('Önce API şifrenizi belirleyin!');

    if (!verifyApiPasswordHash(password, stored)) {
        var _rlk = 'verifyApiPassword:' + user.get('email');
        await checkRateLimit(_rlk, 5, 5 * 60 * 1000);
        await recordAttempt(_rlk);
        throw new Error('Şifre yanlış!');
    }

    return { success: true, message: 'Şifre doğrulandı.' };
});

// ================================================================
// ========== V27 API ANAHTAR SİSTEMİ (MODERATÖR SINIRSIZ) =======
// ================================================================
function getV27ApiKeyLimit(user) {
    var role = user.get('role');
    var plan = user.get('plan');
    // ✅ [v7.9.2 GÜNCELLENDİ] moderator eklendi
    if (role === 'founder' || role === 'admin' || role === 'beta' || role === 'moderator') return -1; // Sınırsız
    if (plan === 'team') return 100;
    if (plan === 'pro') return 20;
    return 2; // ✅ ÜCRETSİZ ÜYE İÇİN 2 ANAHTAR
}

function durationToMs(duration) {
    switch (duration) {
        case '1w': return 7 * 24 * 60 * 60 * 1000;
        case '1m': return 30 * 24 * 60 * 60 * 1000;
        case '5m': return 5 * 30 * 24 * 60 * 60 * 1000;
        case '1y': return 365 * 24 * 60 * 60 * 1000;
        case 'unlimited': return null;
        default: return 30 * 24 * 60 * 60 * 1000;
    }
}

function durationLabel(duration) {
    var map = {
        '1w': '1 Hafta', '1m': '1 Ay', '5m': '5 Ay',
        '1y': '1 Yıl', 'unlimited': '♾️ Süresiz'
    };
    return map[duration] || 'Bilinmiyor';
}

function generateV27KeyString() {
    if (!crypto) throw new Error('crypto modülü yüklü değil!');
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var parts = [];
    for (var p = 0; p < 4; p++) {
        var part = '';
        for (var i = 0; i < 8; i++) {
            part += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        parts.push(part);
    }
    return 'V27-' + parts.join('-');
}

function maskV27Key(key) {
    if (!key || key.length < 12) return '****';
    var mid = Math.floor(key.length / 2);
    var before = key.substring(0, mid - 1).replace(/[^-]/g, '•');
    var shown = key.substring(mid - 1, mid + 1);
    var after = key.substring(mid + 1).replace(/[^-]/g, '•');
    return before + shown + after;
}

Parse.Cloud.define("createV27ApiKey", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var keyName = request.params.keyName;
    var keyDescription = request.params.keyDescription || '';
    var duration = request.params.duration || 'unlimited';

    if (!keyName || keyName.trim().length < 2) {
        throw new Error('Anahtar adı en az 2 karakter olmalıdır!');
    }
    if (keyName.trim().length > 50) {
        throw new Error('Anahtar adı en fazla 50 karakter olabilir!');
    }
    if (keyDescription && keyDescription.length > 150) {
        throw new Error('Açıklama en fazla 150 karakter olabilir!');
    }
    if (['1w', '1m', '5m', '1y', 'unlimited'].indexOf(duration) === -1) {
        duration = 'unlimited';
    }

    var limit = getV27ApiKeyLimit(user);
    if (limit === 0) {
        throw new Error('Bu özellik sadece Kurucu, Admin, Beta, Moderatör, Pro ve Takım paketi sahipleri içindir!');
    }

    if (limit !== -1) {
        var existingQuery = new Parse.Query(V27ApiKey);
        existingQuery.equalTo('user_email', user.get('email'));
        existingQuery.equalTo('is_active', true);
        var existingCount = await existingQuery.count({ useMasterKey: true });
        if (existingCount >= limit) {
            throw new Error('Maksimum API anahtarı sayısına ulaştınız! (' + limit + ')');
        }
    }

    var _rlk = 'createV27ApiKey:' + user.get('email');
    await checkRateLimit(_rlk, 5, 60 * 1000);
    await recordAttempt(_rlk);

    var nameQuery = new Parse.Query(V27ApiKey);
    nameQuery.equalTo('user_email', user.get('email'));
    nameQuery.equalTo('key_name', keyName.trim());
    nameQuery.equalTo('is_active', true);
    var existingName = await nameQuery.first({ useMasterKey: true });
    if (existingName) {
        throw new Error('Bu isimde aktif bir anahtarınız zaten var!');
    }

    var plainKey = generateV27KeyString();
    var keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');
    var keyMasked = maskV27Key(plainKey);
    var keyPrefix = plainKey.substring(0, 8);

    var durationMs = durationToMs(duration);
    var expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

    var record = new V27ApiKey();
    record.set('user_email', user.get('email'));
    record.set('user_name', user.get('name') || user.get('username') || 'Kullanıcı');
    record.set('key_name', keyName.trim());
    record.set('key_description', keyDescription.trim());
    record.set('key_hash', keyHash);
    record.set('key_prefix', keyPrefix);
    record.set('key_masked', keyMasked);
    record.set('duration', duration);
    record.set('expires_at', expiresAt);
    record.set('is_active', true);
    record.set('createdAtClient', new Date());
    record.set('usage_count', 0);
    record.set('last_used_at', null);
    await record.save(null, { useMasterKey: true });

    console.log('🔑 V27 API anahtarı oluşturuldu: ' + user.get('email') + ' → ' + keyName);

    return {
        success: true,
        keyId: record.id,
        plainKey: plainKey,
        maskedKey: keyMasked,
        keyName: keyName.trim(),
        duration: duration,
        durationLabel: durationLabel(duration),
        expiresAt: expiresAt
    };
});

Parse.Cloud.define("getMyV27ApiKeys", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var limit = getV27ApiKeyLimit(user);
    if (limit === 0) {
        throw new Error('Bu özellik size açık değil!');
    }

    var query = new Parse.Query(V27ApiKey);
    query.equalTo('user_email', user.get('email'));
    query.descending('createdAtClient');
    query.limit(200);
    var keys = await query.find({ useMasterKey: true });

    var now = new Date();
    var result = keys.map(function (k) {
        var expiresAt = k.get('expires_at');
        var isExpired = expiresAt && new Date(expiresAt) < now;
        return {
            id: k.id,
            key_name: k.get('key_name'),
            key_description: k.get('key_description') || '',
            key_prefix: k.get('key_prefix'),
            key_masked: k.get('key_masked'),
            duration: k.get('duration'),
            durationLabel: durationLabel(k.get('duration')),
            expires_at: expiresAt,
            is_active: k.get('is_active') && !isExpired,
            is_expired: isExpired,
            created_at: k.get('createdAtClient') || k.get('createdAt'),
            usage_count: k.get('usage_count') || 0,
            last_used_at: k.get('last_used_at')
        };
    });

    return {
        success: true,
        keys: result,
        limit: limit,
        used: result.filter(function(r){ return r.is_active; }).length,
        canCreateMore: (limit === -1) || (result.filter(function(r){ return r.is_active; }).length < limit)
    };
});

Parse.Cloud.define("revokeV27ApiKey", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var keyId = request.params.keyId;
    if (!keyId) throw new Error('Anahtar ID gerekli!');

    var query = new Parse.Query(V27ApiKey);
    var record = await query.get(keyId, { useMasterKey: true });
    if (!record) throw new Error('Anahtar bulunamadı!');
    if (record.get('user_email') !== user.get('email') && user.get('role') !== 'founder') {
        throw new Error('Bu anahtar size ait değil!');
    }

    record.set('is_active', false);
    await record.save(null, { useMasterKey: true });
    return { success: true, message: 'API anahtarı iptal edildi.' };
});

Parse.Cloud.define("validateV27ApiKey", async function (request) {
    var apiKey = request.params.apiKey;
    if (!apiKey) return { valid: false, error: 'API anahtarı gerekli!' };

    var hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    var query = new Parse.Query(V27ApiKey);
    query.equalTo('key_hash', hash);
    query.equalTo('is_active', true);
    var record = await query.first({ useMasterKey: true });

    if (!record) return { valid: false, error: 'Geçersiz API anahtarı!' };

    var expiresAt = record.get('expires_at');
    if (expiresAt && new Date(expiresAt) < new Date()) {
        record.set('is_active', false);
        await record.save(null, { useMasterKey: true });
        return { valid: false, error: 'API anahtarının süresi doldu!' };
    }

    record.increment('usage_count');
    record.set('last_used_at', new Date());
    await record.save(null, { useMasterKey: true });

    return {
        valid: true,
        user_email: record.get('user_email'),
        key_name: record.get('key_name'),
        expires_at: expiresAt
    };
});

Parse.Cloud.define("v27ApiChat", async function (request) {
    var apiKey = request.params.apiKey;
    var prompt = request.params.prompt;

    if (!apiKey) throw new Error('API anahtarı gerekli!');
    if (!prompt) throw new Error('Prompt gerekli!');

    var _rlk = 'v27ApiChat:' + apiKey;
    await checkRateLimit(_rlk, 60, 60 * 1000);
    await recordAttempt(_rlk);

    var validation = await Parse.Cloud.run('validateV27ApiKey', { apiKey: apiKey }, { useMasterKey: true });
    if (!validation.valid) throw new Error(validation.error);

    var reply = await Parse.Cloud.run('superAI', { prompt: prompt }, { useMasterKey: true });
    return { success: true, reply: cleanResponse(reply) };
});

// ================================================================
// ========== V27 API REST ENDPOINT (Global CORS Uyumlu) =========
// ================================================================
Parse.Cloud.define("v27ApiRest", async function (request) {
    // API key'i 3 farklı yerden al (header > body > query)
    var apiKey = (request.headers && (
                        request.headers['x-v27-api-key'] ||
                        request.headers['X-V27-Api-Key'] ||
                        request.headers['x-v27-key']
                   ))
                 || request.params.apiKey
                 || request.params.v27_api_key
                 || (request.params._headers && request.params._headers['x-v27-api-key']);

    // Prompt'u 3 farklı yerden al
    var prompt = request.params.prompt
              || request.params.message
              || request.params.text
              || request.params.q;

    // Dil (varsayılan Türkçe)
    var lang = (request.params.lang || request.params.language || 'tr').toLowerCase();

    if (!apiKey) {
        throw new Error('API anahtarı gerekli (X-V27-Api-Key header veya apiKey body parametresi).');
    }
    if (!prompt || String(prompt).trim().length === 0) {
        throw new Error('prompt (veya message) parametresi gerekli.');
    }
    if (String(prompt).length > 8000) {
        throw new Error('prompt çok uzun (max 8000 karakter).');
    }

    // Rate limit: API key başına dakikada 60 istek
    var _rlk = 'v27ApiRest:' + String(apiKey).substring(0, 16);
    await checkRateLimit(_rlk, 60, 60 * 1000);
    await recordAttempt(_rlk);

    // API key doğrula
    var validation = await Parse.Cloud.run('validateV27ApiKey', { apiKey: apiKey }, { useMasterKey: true });
    if (!validation || !validation.valid) {
        throw new Error((validation && validation.error) || 'Geçersiz API anahtarı!');
    }

    // Türkçe (veya istenen dil) sistem prompt'u ekle
    var systemPrefix = '';
    if (lang === 'tr') {
        systemPrefix = 'Sen VİZYON AI\'sın. Aşağıdaki kullanıcı sorusuna TÜRKÇE, doğal ve akıcı bir şekilde cevap ver. ' +
                       'Kısa, net ve öz ol. Gereksiz uzatma yapma.\n\nKullanıcı sorusu: ';
    } else if (lang === 'en') {
        systemPrefix = 'You are VİZYON AI. Answer the following user question in ENGLISH, naturally and fluently. ' +
                       'Be concise and clear.\n\nUser question: ';
    } else {
        systemPrefix = 'Sen VİZYON AI\'sın. Aşağıdaki soruya cevap ver.\n\nSoru: ';
    }

    var fullPrompt = systemPrefix + String(prompt).trim();

    // superAI ile en iyi modeli bul
    var reply = '';
    try {
        reply = await Parse.Cloud.run('superAI', { prompt: fullPrompt }, { useMasterKey: true });
    } catch (e) {
        console.error('v27ApiRest superAI hatası:', e.message);
        throw new Error('AI yanıt veremedi: ' + e.message);
    }

    if (!reply || String(reply).trim().length === 0) {
        throw new Error('AI boş yanıt döndü.');
    }

    return {
        success: true,
        reply: cleanResponse(reply),
        lang: lang,
        keyName: validation.key_name || null,
        expiresAt: validation.expires_at || null,
        timestamp: new Date().toISOString()
    };
});

// ================================================================
// ========== ZAMANLANMIŞ GÖREVLER (JOB'LAR) ==========
// ================================================================
Parse.Cloud.job("refreshDailyTasks", async function (request) {
    console.log('🔄 Günlük görevler yenileniyor...');
    var today = new Date().toDateString();
    var oldQuery = new Parse.Query(DailyTask);
    oldQuery.notEqualTo('date', today);
    var oldTasks = await oldQuery.find({ useMasterKey: true });
    for (var oi = 0; oi < oldTasks.length; oi++) { await oldTasks[oi].destroy({ useMasterKey: true }); }
    var tasks = [
        { task_text: '🔍 3 AI sorgusu yap', points: 10 },
        { task_text: '💬 1 yorum yaz', points: 5 },
        { task_text: '⭐ 1 proje favorile', points: 8 },
        { task_text: '📁 1 proje oluştur', points: 15 },
        { task_text: '👥 1 takım mesajı gönder', points: 6 }
    ];
    for (var ti = 0; ti < tasks.length; ti++) {
        var task = new DailyTask();
        task.set('date', today);
        task.set('task_text', tasks[ti].task_text);
        task.set('points', tasks[ti].points);
        await task.save(null, { useMasterKey: true });
    }
    var userQuery = new Parse.Query(Parse.User);
    var users = await userQuery.find({ useMasterKey: true });
    for (var ui = 0; ui < users.length; ui++) { users[ui].set('completed_daily_tasks', []); await users[ui].save(null, { useMasterKey: true }); }
    console.log('✅ Günlük görevler yenilendi!');
    return 'Günlük görevler yenilendi!';
});

Parse.Cloud.job("refreshTeamTasks", async function (request) {
    console.log('🔄 Takım görevleri yenileniyor...');
    var today = new Date().toDateString();
    var oldQuery = new Parse.Query(TeamTask);
    oldQuery.notEqualTo('date', today);
    var oldTasks = await oldQuery.find({ useMasterKey: true });
    for (var oi = 0; oi < oldTasks.length; oi++) { await oldTasks[oi].destroy({ useMasterKey: true }); }
    var teamQuery = new Parse.Query(Team);
    var teams = await teamQuery.find({ useMasterKey: true });
    var teamTasks = [
        { task_text: '👥 Takım sohbetinde 5 mesaj', points: 15 },
        { task_text: '📁 Takım projesi oluştur', points: 20 },
        { task_text: '⭐ Takım üyesini etiketle', points: 10 }
    ];
    for (var ti = 0; ti < teams.length; ti++) {
        for (var tti = 0; tti < teamTasks.length; tti++) {
            var task = new TeamTask();
            task.set('team_id', teams[ti].id);
            task.set('date', today);
            task.set('task_text', teamTasks[tti].task_text);
            task.set('points', teamTasks[tti].points);
            await task.save(null, { useMasterKey: true });
        }
    }
    var userQuery = new Parse.Query(Parse.User);
    var users = await userQuery.find({ useMasterKey: true });
    for (var ui = 0; ui < users.length; ui++) { users[ui].set('completed_team_tasks', []); await users[ui].save(null, { useMasterKey: true }); }
    console.log('✅ Takım görevleri yenilendi!');
    return 'Takım görevleri yenilendi!';
});

Parse.Cloud.job("refreshSocialTasks", async function (request) {
    console.log('🔄 Topluluk görevleri yenileniyor...');
    var today = new Date().toDateString();
    var oldQuery = new Parse.Query(SocialTask);
    oldQuery.notEqualTo('date', today);
    var oldTasks = await oldQuery.find({ useMasterKey: true });
    for (var oi = 0; oi < oldTasks.length; oi++) { await oldTasks[oi].destroy({ useMasterKey: true }); }
    var tasks = [
        { platform: 'Instagram', url: 'https://www.instagram.com/vizyon2027.info', points_reward: 15, penalty_points: 0 },
        { platform: 'WhatsApp', url: 'https://whatsapp.com/channel/0029VbCpnvuG8l5FQVQMLy1U', points_reward: 10, penalty_points: 0 },
        { platform: 'YouTube', url: '#', points_reward: 20, penalty_points: 0 }
    ];
    for (var ti = 0; ti < tasks.length; ti++) {
        var task = new SocialTask();
        task.set('date', today);
        task.set('platform', tasks[ti].platform);
        task.set('url', tasks[ti].url);
        task.set('points_reward', tasks[ti].points_reward);
        task.set('penalty_points', tasks[ti].penalty_points);
        task.set('is_active', true);
        await task.save(null, { useMasterKey: true });
    }
    var userQuery = new Parse.Query(Parse.User);
    var users = await userQuery.find({ useMasterKey: true });
    for (var ui = 0; ui < users.length; ui++) { users[ui].set('completed_social_tasks', []); await users[ui].save(null, { useMasterKey: true }); }
    console.log('✅ Topluluk görevleri yenilendi!');
    return 'Topluluk görevleri yenilendi!';
});

Parse.Cloud.job("resetDailyQueries", async function (request) {
    console.log('🔄 Günlük sorgu limitleri sıfırlanıyor...');
    var today = new Date().toDateString();
    var query = new Parse.Query(QueryStat);
    query.notEqualTo('date', today);
    var stats = await query.find({ useMasterKey: true });
    for (var si = 0; si < stats.length; si++) { await stats[si].destroy({ useMasterKey: true }); }
    console.log('✅ Sorgu limitleri sıfırlandı!');
    return 'Sorgu limitleri sıfırlandı!';
});

Parse.Cloud.job("refreshQuizQuestions", async function (request) {
    console.log('🔄 Zeka testi soruları yenileniyor...');
    var today = new Date().toDateString();
    var oldQuery = new Parse.Query(Quiz);
    oldQuery.notEqualTo('date', today);
    var oldQuizes = await oldQuery.find({ useMasterKey: true });
    for (var qi = 0; qi < oldQuizes.length; qi++) { await oldQuizes[qi].destroy({ useMasterKey: true }); }
    var questions = [
        { question: 'Python\'da bir fonksiyon tanımlamak için hangi anahtar kelime kullanılır?', options: ['function', 'def', 'define', 'func'], correct: 1, points: 10 },
        { question: 'VİZYON AI kaç modeli tek çatı altında birleştirir?', options: ['7', '13', '21', '30'], correct: 2, points: 15 },
        { question: '3D model oluşturmak için hangi kütüphane kullanılır?', options: ['Three.js', 'React.js', 'Vue.js', 'Angular'], correct: 0, points: 10 },
        { question: 'Veri analizi için hangi Python kütüphanesi yaygın olarak kullanılır?', options: ['Pandas', 'NumPy', 'Matplotlib', 'Hepsi'], correct: 3, points: 15 },
        { question: 'V27 API anahtarı ücretsiz üye için kaç adet?', options: ['0', '1', '2', '5'], correct: 2, points: 10 },
        { question: 'VİZYON 2027\'nin kurucusu kimdir?', options: ['Eymen', 'İbrahim', 'Bozkurt', 'Ömer'], correct: 0, points: 15 },
        { question: 'Takım oluşturmak için hangi plana ihtiyaç vardır?', options: ['Ücretsiz', 'Pro', 'Takım', 'Hepsi'], correct: 2, points: 10 },
        { question: 'Hata bildiriminde kaç puan kazanılır?', options: ['50', '100', '150', '200'], correct: 1, points: 10 },
        { question: 'Davet kodu kaç kişi tarafından kullanılabilir?', options: ['1', '2', '3', 'Sınırsız'], correct: 1, points: 15 },
        { question: 'Uzay modu hangi saatler arasında aktiftir?', options: ['00:00-03:00', '02:00-05:00', '23:00-02:00', '04:00-07:00'], correct: 1, points: 10 }
    ];
    for (var qi2 = 0; qi2 < questions.length; qi2++) {
        var quiz = new Quiz();
        quiz.set('date', today);
        quiz.set('question', questions[qi2].question);
        quiz.set('options', questions[qi2].options);
        quiz.set('correct_answer', questions[qi2].correct);
        quiz.set('points_reward', questions[qi2].points);
        quiz.set('is_active', true);
        await quiz.save(null, { useMasterKey: true });
    }
    console.log('✅ Zeka testi soruları yenilendi!');
    return 'Zeka testi soruları yenilendi!';
});

Parse.Cloud.job("refreshAcademyCourses", async function (request) {
    console.log('🔄 Akademi dersleri yenileniyor...');
    var courseData = [
        { title: '🚀 VİZYON AI ile Kod Yazma', description: 'Yapay zeka ile Python, JavaScript ve diğer dillerde kod yazmayı öğrenin.', total_lessons: 4 },
        { title: '🧊 3D Modelleme ve Tasarım', description: 'Three.js ile 3D nesneler oluşturun, modelleyin ve dışa aktarın.', total_lessons: 3 },
        { title: '📊 Veri Analizi ve Görselleştirme', description: 'Python ile veri analizi, grafikler ve dashboard oluşturma.', total_lessons: 5 },
        { title: '🔐 Güvenlik ve Ebeveyn Kontrolleri', description: 'Kullanıcı güvenliği, ebeveyn ayarları ve çocuk koruma.', total_lessons: 3 },
        { title: '🔑 V27 API ile Kendi Projeni Yap', description: 'V27 API anahtarı ile kendi uygulamalarını geliştirmeyi öğren.', total_lessons: 4 }
    ];
    for (var ci = 0; ci < courseData.length; ci++) {
        var query = new Parse.Query(Course);
        query.equalTo('title_', courseData[ci].title);
        var course = await query.first({ useMasterKey: true });
        if (!course) { course = new Course(); course.set('title_', courseData[ci].title); }
        course.set('description', courseData[ci].description);
        course.set('total_lessons', courseData[ci].total_lessons);
        await course.save(null, { useMasterKey: true });
    }
    console.log('✅ Akademi dersleri yenilendi!');
    return 'Akademi dersleri yenilendi!';
});

Parse.Cloud.job("finalizeMonthlyContest", async function (request) {
    console.log('🔄 Ay sonu yarışması finalize ediliyor...');
    try {
        var result = await runFinalizeContest();
        console.log('✅ Yarışma finalize edildi:', result.message);
        return result.message || 'Yarışma tamamlandı.';
    } catch (e) {
        console.error('Yarışma finalize hatası:', e.message);
        return 'Hata: ' + e.message;
    }
});

Parse.Cloud.job("resetWeeklyKocUsage", async function (request) {
    console.log('🔄 Haftalık Koç kullanım sıfırlanıyor...');
    try {
        var weekStart = getCurrentWeekStart();
        var weekKey = weekStart.toISOString().split('T')[0];

        var query = new Parse.Query(KocUsage);
        var allUsages = await query.find({ useMasterKey: true });

        var resetCount = 0;
        for (var i = 0; i < allUsages.length; i++) {
            var usage = allUsages[i];
            var storedStart = usage.get('week_start');
            var storedKey = storedStart ? new Date(storedStart).toISOString().split('T')[0] : null;
            if (storedKey !== weekKey) {
                usage.set('week_start', weekStart);
                usage.set('count', 0);
                usage.set('last_reset', new Date());
                await usage.save(null, { useMasterKey: true });
                resetCount++;
            }
        }
        console.log('✅ ' + resetCount + ' Koç kullanım kaydı sıfırlandı.');
        return resetCount + ' kayıt sıfırlandı.';
    } catch (e) {
        console.error('resetWeeklyKocUsage hatası:', e.message);
        return 'Hata: ' + e.message;
    }
});

// ================================================================
// ========== SON LOG ==========
// ================================================================
console.log('✅ Tüm Cloud Code fonksiyonları başarıyla yüklendi! (v7.9.2 SashiDo Eski Node.js Uyumlu)');
console.log('');
console.log('🎯 v7.9.2 YENİLİKLER:');
console.log('  1. [YENİ] V27 API ANAHTAR SİSTEMİ:');
console.log('     → V27ApiKey sınıfı (initSchemas\'a eklendi)');
console.log('     → createV27ApiKey (limitler: Kurucu/Admin/Beta/Moderatör=Sınırsız, Takım=100, Pro=20, Üye=2)');
console.log('     → getMyV27ApiKeys (maskelenmiş liste)');
console.log('     → revokeV27ApiKey (iptal)');
console.log('     → validateV27ApiKey (harici doğrulama)');
console.log('     → v27ApiChat (V27_API_KEY ile AI sorgusu)');
console.log('  2. [YENİ] V27 KOÇ ASİSTANI:');
console.log('     → KocConversation + KocUsage sınıfları');
console.log('     → kocChat (haftalık limit + ✅ MESAJLAR MESSAGE SINIFINA KAYDEDİLİYOR)');
console.log('     → getKocHistory (last_message_at ile sıralama)');
console.log('     → getKocConversationMessages');
console.log('     → getKocUsage / resetKocUsage');
console.log('     → shareKocConversation (şifre hash\'li paylaşım)');
console.log('     → getSharedKocConversation (şifre doğrulama)');
console.log('  3. [YENİ v7.9.2] MODERATÖR / TASARIMCI RÜTBESİ:');
console.log('     → assignModeratorByEmail (sadece kurucu, mail ile atar)');
console.log('     → getModerators (moderatör listesi)');
console.log('     → removeModerator (moderatörlükten çıkar)');
console.log('     → getKocLimitForUser → moderatör sınırsız');
console.log('     → getV27ApiKeyLimit → moderatör sınırsız');
console.log('     → useQuery → moderatör sınırsız');
console.log('     → createProjectRequest → moderatör varsa ona, yoksa admin+founder\'a');
console.log('     → sendTeamMessage → moderatör @vizyonal çağırabilir');
console.log('     → deleteTeamMessage → moderatör silebilir');
console.log('     → removeFromTeam → moderatör atabilir');
console.log('     → getAllUsers → moderatör görebilir');
console.log('  4. [YENİ v7.9.2] MODERATÖR VİDEO KESİT:');
console.log('     → VideoClip sınıfı (initSchemas\'a eklendi)');
console.log('     → createVideoClip (moderatör video kesit oluşturur)');
console.log('     → getVideoClips (video kesit listesi)');
console.log('  5. [YENİ v7.9.2] VİZYON AL PANELİ:');
console.log('     → vizyonAlChat (4 mod: normal/deep/agent/developer)');
console.log('     → vizyonAlDeepThink (derin düşünme modu)');
console.log('     → vizyonAlAgent (ajan modu)');
console.log('     → vizyonAlDeveloper (yazılımcı modu)');
console.log('     → getSiteInfoForVizyonAl (site içeriği)');
console.log('  6. [YENİ] getInboxItems cloud function');
console.log('  7. [FIX] callLocalLlama: model parametresi alıyor (13 Ollama modeli)');
console.log('  8. [FIX] superAI: TÜM Ollama + TÜM API modelleri SIRAYLA');
console.log('  9. [FIX] isLikelyTurkish: eksik return eklendi');
console.log('  10. [FIX] kocChat: MESAJLAR Message SINIFINA KAYDEDİLİYOR (paylaşım fix)');
console.log('');
console.log('🤖 OLLAMA MODELLERİ (13):');
console.log('   → qwen2.5, qwen3:8b, qwen3:4b, llama3.2, gemma3:4b, gemma2,');
console.log('     mistral, phi3.5, deepseek-r1, qwen2.5-coder, phi4-mini-reasoning,');
console.log('     qwen2.5vl:3b, granite3.3:2b');
console.log('');
console.log('☁️  API MODELLERİ (8):');
console.log('   → callGroq, callGemini, callDeepSeek, callDeepInfra,');
console.log('     callOpenAI, callCerebras, callOpenRouter, callCohere');
console.log('');
console.log('📊 TOPLAM: 13 Ollama + 8 API = 21 farklı AI modeli sırayla denenir');
console.log('');
console.log('📋 Toplam cloud function sayısı: 150+');
console.log('📋 Toplam job (zamanlanmış görev) sayısı: 13');
console.log('');
console.log('🇹🇷 VİZYON 2027 v7.9.2 — YERLİ LLM + V27 API + V27 KOÇ + VİZYON AL + MODERATÖR AKTİF');
console.log('');
console.log('🎯 Takım Chat Tetikleyicileri: @vizyonal, vizyonal, @vizyondestek, vizyondestek, vizyondetsek, @v27, v27 api, vizyon api');
// ================================================================

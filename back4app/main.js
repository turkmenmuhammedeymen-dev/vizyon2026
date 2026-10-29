// ================================================================
// AETHRION — FULL CLOUD CODE (Back4App UYUMLU)
// v7.10.0 legacy baseline + AETHRION security hardening
// ================================================================
// ✅ BACK4APP UYUMLU (Parse Server Standard + Node.js)
// ✅ OTOMATİK SCHEMA (Tüm sınıflar/kolonlar initSchemas'ta)
// ✅ 21 AI MODELİ (13 Ollama + 8 Bulut API)
// ✅ A27 API ANAHTAR SİSTEMİ (AES-256-GCM)
// ✅ AETHRION KOÇ ASİSTANI
// ✅ AETHRION AI PANELİ (4 mod + ekran + sesli + dosya + sunum)
// ✅ MODERATÖR / TASARIMCI RÜTBESİ
// ✅ PLAN LİMİT SİSTEMİ (Free/Pro/Team)
// ✅ LOGS SİSTEMİ (Backend Sync)
// ✅ VİDEO STÜDYOSU (Senaryo/Reels/Analiz/Kesit)
// ✅ AETHRION DEVRİYE (7/24)
// ✅ 13 ZAMANLANMIŞ JOB
// ✅ 160+ CLOUD FUNCTION
// ================================================================

// ================================================================
// [MADDE 0] CRITICAL POLYFILLS (Back4App Node.js Environment)
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
// [MADDE 1] FETCH POLYFILL (Back4App için)
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

        var httpOptions = { method: method, url: url, headers: headers };

        if (body !== undefined && body !== null) {
            if (typeof body === 'string') {
                try { httpOptions.body = JSON.parse(body); }
                catch (e) { httpOptions.body = body; }
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
                if (err && err.text !== undefined) return err;
                else if (err && err.response) return err.response;
                else throw err;
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
                if (signal.aborted) onAbort();
                else if (typeof signal.addEventListener === 'function') signal.addEventListener('abort', onAbort);
                else if (typeof signal.addListener === 'function') signal.addListener('abort', onAbort);
            });
            try { response = await Promise.race([requestPromise, abortPromise]); }
            catch (err) { throw err; }
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
        if (typeof response.text === 'string') rawText = response.text;
        else if (response.buffer) {
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
                    for (var k in responseHeaders) if (k.toLowerCase() === lower) return responseHeaders[k];
                    return null;
                },
                has: function (name) {
                    var lower = name.toLowerCase();
                    for (var k in responseHeaders) if (k.toLowerCase() === lower) return true;
                    return false;
                },
                forEach: function (callback) {
                    Object.keys(responseHeaders).forEach(function (key) {
                        callback(responseHeaders[key], key);
                    });
                }
            },
            json: async function () { return JSON.parse(rawText); },
            text: async function () { return rawText; },
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
    console.log('✅ Fetch polyfill yüklendi (Back4App)');
} else {
    console.log('✅ Native fetch mevcut, polyfill atlandı.');
}

// ================================================================
// [MADDE 2] RATE LIMITING ALTYAPISI
// ================================================================

// Security note: this backend does not block sign-in based on VPN/proxy/Tor status.
// Parse Server request.ip may still be used for rate limiting and abuse prevention.
// Keep authentication and rate limiting independent from VPN usage.
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
    return this.getRecord().count >= this.maxAttempts;
};

RateLimit.prototype.record = function () {
    var now = Date.now();
    var record = this.getRecord();
    if (record.count === 0) _rateLimitStore.set(this.key, { count: 1, firstAttempt: now });
    else { record.count++; _rateLimitStore.set(this.key, record); }
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
        console.warn('⚠️ Kalıcı rate limit kontrolü başarısız:', e.message);
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

Parse.Cloud.job("cleanupRateLimitAttempts", async function (request) {
    console.log('🔄 RateLimitAttempt temizleniyor...');
    try {
        var RateLimitAttempt3 = Parse.Object.extend(_RATE_LIMIT_CLASS);
        var cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        var query = new Parse.Query(RateLimitAttempt3);
        query.lessThan("attemptedAt", cutoff);
        var old = await query.find({ useMasterKey: true });
        for (var i = 0; i < old.length; i++) await old[i].destroy({ useMasterKey: true });
        console.log('✅ ' + old.length + ' eski rate limit kaydı temizlendi.');
        return old.length + ' kayıt temizlendi.';
    } catch (e) {
        console.error('RateLimit temizleme hatası:', e.message);
        return 'Hata: ' + e.message;
    }
});

// Auth-provider network guard: never leave login requests waiting indefinitely.
async function _aethrionAuthFetch(url, timeoutMs) {
    var timeout = Math.max(3000, Math.min(20000, Number(timeoutMs) || 12000));
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer;
    try {
        return await Promise.race([
            fetch(url, controller ? { signal: controller.signal } : {}),
            new Promise(function (_, reject) {
                timer = setTimeout(function () {
                    try { if (controller) controller.abort(); } catch (e) {}
                    reject(new Error('Kimlik sağlayıcısı zaman aşımına uğradı.'));
                }, timeout);
            })
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

console.log('✅ Cloud Code başarıyla yüklendi! (v7.10.0 Back4App)');

// ================================================================
// ========== SINIF TANIMLARI (ALL CLASSES) =======================
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
var ContestParticipant = Parse.Object.extend("ContestParticipant");
var ContestProject = Parse.Object.extend("ContestProject");
var ContestWinner = Parse.Object.extend("ContestWinner");
var V27ApiKey = Parse.Object.extend("V27ApiKey");
var KocConversation = Parse.Object.extend("KocConversation");
var KocUsage = Parse.Object.extend("KocUsage");
var VideoClip = Parse.Object.extend("VideoClip");

// ✅ [v7.10.0 YENİ] Yeni sınıflar
var FeatureUsage = Parse.Object.extend("FeatureUsage");
var ClientLog = Parse.Object.extend("ClientLog");
var VideoStudioJob = Parse.Object.extend("VideoStudioJob");
var SystemConfig = Parse.Object.extend("SystemConfig");

// ================================================================
// ========== YARDIMCI FONKSİYONLAR ===============================
// ================================================================
// ================================================================
// AETHRION CENTRAL CONFIGURATION RESOLVER
// Private runtime environment variables take priority. Parse.Config is
// cached as the compatibility/configuration source for existing deployments.
// Passwords and founder credentials are deliberately private-env-only.
// ================================================================
var _aethrionParseConfigCache = null;
var _aethrionParseConfigPromise = null;

async function _aethrionGetParseConfig() {
    if (_aethrionParseConfigCache) return _aethrionParseConfigCache;
    if (!_aethrionParseConfigPromise) {
        _aethrionParseConfigPromise = Parse.Config.get({ useMasterKey: true }).then(function (config) {
            _aethrionParseConfigCache = config;
            return config;
        }).catch(function (error) {
            _aethrionParseConfigPromise = null;
            throw error;
        });
    }
    return _aethrionParseConfigPromise;
}

function _aethrionReadPrivateEnv(keyName) {
    try {
        if (typeof process === 'undefined' || !process.env) return null;
        var value = process.env[keyName] || process.env['AETHRION_' + keyName];
        return (typeof value === 'string' && value.trim()) ? value.trim() : null;
    } catch (error) {
        console.warn('[AETHRION Config] Private environment lookup unavailable for ' + String(keyName));
        return null;
    }
}

async function getAethrionConfigValue(keyName, options) {
    options = options || {};
    var envValue = _aethrionReadPrivateEnv(keyName);
    if (envValue !== null) return envValue;

    if (options.privateOnly === true) return null;

    try {
        var config = await _aethrionGetParseConfig();
        var value = config.get(keyName);
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            // Keep old Parse.Config deployments working, but flag secret migration.
            if (/(PASS|PASSWORD|API.?KEY|TOKEN|SECRET|ENCRYPTION|CREDENTIAL|PRIVATE)/i.test(String(keyName))) {
                console.warn('[AETHRION Config] ' + String(keyName) + ' is still stored in Parse.Config; migrate it to a private Back4App environment variable.');
            }
            return value;
        }
        console.warn('[AETHRION Config] Missing configuration key: ' + String(keyName));
        return null;
    } catch (error) {
        console.error('[AETHRION Config] Could not read configuration (' + String(keyName) + '): ' + (error && error.message ? error.message : 'unknown error'));
        return null;
    }
}

async function getAPIKey(keyName) {
    return getAethrionConfigValue(keyName);
}

async function getPrivateFounderPass() {
    // Private runtime secrets are preferred. Parse.Config compatibility is retained for existing deployments.
    var envKeys = ['FOUNDER_PASS', 'AETHRION_FOUNDER_PASS', 'FOUNDER_PASSWORD', 'AETHRION_FOUNDER_PASSWORD'];
    for (var ei = 0; ei < envKeys.length; ei++) {
        var envValue = _aethrionReadPrivateEnv(envKeys[ei]);
        if (envValue) return envValue;
    }
    try {
        var config = await _aethrionGetParseConfig();
        var configKeys = ['FOUNDER_PASS', 'AETHRION_FOUNDER_PASS', 'FOUNDER_PASSWORD', 'AETHRION_FOUNDER_PASSWORD', 'founderPassword', 'KURUCU_SIFRESI', 'kurucuSifresi'];
        for (var ci = 0; ci < configKeys.length; ci++) {
            var configured = config && typeof config.get === 'function' ? config.get(configKeys[ci]) : null;
            if (typeof configured === 'string' && configured.trim()) {
                console.warn('[AETHRION Config] Founder password loaded from Parse.Config; use a private Back4App runtime variable when possible.');
                return configured.trim();
            }
        }
    } catch (error) {
        console.warn('[AETHRION Config] Founder password configuration could not be read.');
    }
    return '';
}

async function getPrivateFounderEmail() {
    var envKeys = ['FOUNDER_EMAIL', 'AETHRION_FOUNDER_EMAIL'];
    for (var ei = 0; ei < envKeys.length; ei++) {
        var envValue = _aethrionReadPrivateEnv(envKeys[ei]);
        if (envValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(envValue)) return envValue.trim().toLowerCase();
    }
    try {
        var config = await _aethrionGetParseConfig();
        var configKeys = ['FOUNDER_EMAIL', 'AETHRION_FOUNDER_EMAIL', 'founderEmail', 'kurucuEmail'];
        for (var ci = 0; ci < configKeys.length; ci++) {
            var configured = config && typeof config.get === 'function' ? config.get(configKeys[ci]) : null;
            if (typeof configured === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured.trim())) return configured.trim().toLowerCase();
        }
    } catch (error) {
        console.warn('[AETHRION Config] Founder email configuration could not be read; using the legacy default.');
    }
    return 'admin.tr.reis@gmail.com';
}

// Public configuration is an explicit allowlist. Never return the whole Parse.Config
// object or any runtime environment variables to a browser.
function _aethrionSanitizePublicValue(value, depth) {
    if (depth > 6 || value === null || value === undefined) return null;
    if (typeof value === 'string') return value.slice(0, 5000);
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 200).map(function (item) {
        return _aethrionSanitizePublicValue(item, depth + 1);
    }).filter(function (item) { return item !== null; });
    if (typeof value !== 'object') return null;
    var output = {};
    Object.keys(value).slice(0, 100).forEach(function (key) {
        if (/(PASS|PASSWORD|API.?KEY|TOKEN|SECRET|ENCRYPTION|CREDENTIAL|PRIVATE|AUTH|COOKIE|SESSION)/i.test(key)) return;
        output[key] = _aethrionSanitizePublicValue(value[key], depth + 1);
    });
    return output;
}

function _aethrionParsePublicJson(value) {
    if (value && typeof value === 'object') return value;
    if (typeof value !== 'string' || !value.trim()) return {};
    try {
        var parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        console.warn('[AETHRION Config] Invalid public JSON configuration; defaults will be used.');
        return {};
    }
}

Parse.Cloud.define('getAethrionPublicConfig', async function () {
    var config = await _aethrionGetParseConfig();
    return {
        success: true,
        version: 1,
        publicConfig: _aethrionSanitizePublicValue(_aethrionParsePublicJson(config.get('AETHRION_PUBLIC_CONFIG_JSON')), 0),
        planLimits: _aethrionSanitizePublicValue(_aethrionParsePublicJson(config.get('AETHRION_PLAN_LIMITS_JSON')), 0),
        featureFlags: _aethrionSanitizePublicValue(_aethrionParsePublicJson(config.get('AETHRION_FEATURE_FLAGS_JSON')), 0),
        models: _aethrionSanitizePublicValue(_aethrionParsePublicJson(config.get('AETHRION_PUBLIC_MODELS_JSON')), 0)
    };
});

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

// ================================================================
// ========== PUAN & BİLDİRİM =====================================
// ================================================================
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
    if (points >= 20000) level = 'AETHRION Efsanesi';
    else if (points >= 5000) level = 'AETHRION Uzmanı';
    else if (points >= 1000) level = 'Üye';
    else level = 'Çaylak';
    var oldLevel = user.get('level') || 'Çaylak';
    if (oldLevel !== level) {
        user.set('level', level);
        await user.save(null, { useMasterKey: true });
        await sendNotificationToUser(user, '🎊 Tebrikler! Seviyeniz "' + level + '" oldu!', 'level_up');
        if (level === 'AETHRION Efsanesi') {
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
            subject: 'AETHRION Bildirim',
            html: '<h3>📢 AETHRION</h3><p>' + message + '</p><p>AETHRION Ekibi</p>'
        }, { useMasterKey: true });
    } catch (e) {
        console.error('Bildirim e-postası gönderilemedi:', e.message);
    }
}

// ================================================================
// ========== SİTE İÇERİĞİ ========================================
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
        var combined = '=== AETHRION SİTE İÇERİĞİ ===\n' + fullText + '\n\n=== SAYFA KAYNAK KODLARI (İLK 500 KARAKTER) ===\n' + rawHtml;
        var summary = combined.substring(0, 7000);
        siteContentCache = summary;
        siteContentCacheTime = now;
        return summary;
    } catch (e) {
        console.error('Site içeriği alınamadı:', e);
        return 'Site içeriği şu anda alınamıyor.';
    }
}

// ================================================================
// ========== ŞİFRELEME / HASH (AES-256-GCM) ======================
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

function smartDecrypt(encryptedBase64, encryptionKey) {
    var aesResult = aesDecrypt(encryptedBase64, encryptionKey);
    if (aesResult && aesResult.length > 0) return aesResult;
    return xorDecrypt(encryptedBase64, encryptionKey);
}

// ================================================================
// ========== initSchemas — TÜM SINIFLAR + KOLONLAR ===============
// ================================================================
Parse.Cloud.define("initSchemas", async function (request) {
    // ✅ [FIX A9] initSchemas artık herkese açık değil — sadece master key veya founder/admin.
    if (!request.master) {
        var _caller = request.user;
        if (!_caller || (_caller.get('role') !== 'founder' && _caller.get('role') !== 'admin')) {
            throw new Error('Bu işlem için yetkiniz yok!');
        }
    }
    var schemaDefinitions = {
        "Team": ["name", "teamCode", "owner_email", "manager_email"],
        "TeamMember": ["team_id", "user_email"],
        "TeamMessage": ["team_id", "user_email", "user_name", "message", "fileUrl", "fileName", "fileType", "deleted", "deleted_by_founder", "edited", "deleted_by", "deleted_at", "edited_at"],
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
        "UserApiKey": ["user_email", "name", "encryptedValue", "createdAtClient", "updatedAtClient", "encryption"],
        "ContestParticipant": ["contest_id", "user_email", "user_name", "joined_at", "total_points"],
        "ContestProject": ["contest_id", "user_email", "user_name", "project_name", "code", "submitted_at", "reviewed", "points"],
        "ContestWinner": ["contest_id", "month", "rank", "user_email", "reward"],
        "V27ApiKey": ["user_email", "user_name", "key_name", "key_description", "key_hash", "key_prefix", "key_masked", "duration", "expires_at", "is_active", "createdAtClient", "last_used_at", "usage_count"],
        "KocConversation": ["user_email", "user_name", "title", "topic", "messageCount", "share_id", "share_password_hash", "share_password_salt", "shared_at", "is_shared", "last_message_at", "created_at_client"],
        "KocUsage": ["user_email", "week_start", "count", "last_reset", "total_count"],
        "VideoClip": ["moderator_email", "moderator_name", "video_url", "start_time", "end_time", "note", "analysis", "is_published", "shared_with", "created_at_client"],
        // ✅ [v7.10.0 YENİ]
        "FeatureUsage": ["user_email", "feature", "period", "period_key", "count", "last_updated"],
        "ClientLog": ["user_email", "level", "message", "meta", "url", "user_agent", "created_at_client"],
        "VideoStudioJob": ["user_email", "type", "input", "result", "download_url", "file_name", "status", "created_at_client"],
        "SystemConfig": ["key", "value", "description", "updated_by"],
        // ✅ [YENİ] İş İlanları Mağazası
        "JobListing": ["job_number", "title", "owner_email", "owner_name", "job_type", "description", "salary", "payment_method", "image_url", "status", "accepted_by", "accepted_at", "views", "is_active"],
        // ✅ [YENİ] AETHRION AI üzerinden oluşturulan V27 key'lerin güvenli tek-seferlik gösterimi
        "V27KeyReveal": ["user_email", "key_id", "plain_key", "key_name", "reveal_token", "expires_at"]
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
                if (col === "date" && (className === "DailyTask" || className === "SocialTask" || className === "Quiz")) {
                    // Deployed classes use YYYY-MM-DD string keys; probe the existing type safely.
                    dummy.set(col, new Date().toISOString().slice(0, 10));
                } else if (col === "date" || col === "lastUpdated" || col === "lastClaimDate" ||
                    col === "lastClaimTime" || col === "streakStartDate" || col === "end_date" ||
                    col === "subscribedAt" || col === "attemptedAt" || col === "lastMessageTime" ||
                    col === "createdAtClient" || col === "updatedAtClient" || col === "joined_at" ||
                    col === "submitted_at" || col === "expires_at" || col === "last_used_at" ||
                    col === "shared_at" || col === "last_message_at" || col === "created_at_client" ||
                    col === "week_start" || col === "last_reset" || col === "last_updated" ||
                    col === "deleted_at" || col === "edited_at") {
                    dummy.set(col, new Date());
                } else if (col === "count" || col === "points" || col === "points_reward" ||
                           col === "price" || col === "price_points" || col === "rating" ||
                           col === "total_lessons" || col === "order" || col === "correct_answer" ||
                           col === "streakCount" || col === "penalty_points" || col === "total_points" ||
                           col === "rank" || col === "usage_count" || col === "messageCount" ||
                           col === "total_count" || col === "start_time" || col === "end_time" ||
                           col === "salary" || col === "views") {
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
                } else if (col === "features" || col === "meta" || col === "value") {
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
    return { success: true, results: results, total: results.length, version: 'v7.10.0' };
});

// ================================================================
// ========== TEMEL FONKSİYONLAR ==================================
// ================================================================
Parse.Cloud.define("test", async function (request) {
    return {
        success: true,
        message: 'Cloud Code çalışıyor! (Back4App v7.10.0)',
        user: request.user ? request.user.get('email') : 'Oturum yok',
        timestamp: new Date().toISOString()
    };
});

Parse.Cloud.define("checkRoleAccess", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1) throw new Error('Yetkiniz yok!');
    return { role: role, access: true };
});

Parse.Cloud.define("verifyUser", async function (request) {
    var email = String((request.params && request.params.email) || '').trim().toLowerCase();
    var code = String((request.params && request.params.code) || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
        return { success: false, error: 'Geçerli e-posta adresi ve 6 haneli kod gerekli!' };
    }

    var rateKey = getRateLimitKey(request, 'verifyUser:' + email);
    await checkRateLimit(rateKey, 10, 10 * 60 * 1000);
    await recordAttempt(rateKey);

    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var user = await query.first({ useMasterKey: true });
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı!' };
    if (user.get('isVerified') === true) return { success: true, message: 'Hesap zaten doğrulanmış.' };

    var storedCode = String(user.get('verificationCode') || '');
    if (storedCode !== code) return { success: false, error: 'Geçersiz kod!' };
    var expiry = user.get('verificationCodeExpires');
    var expiryTime = expiry ? new Date(expiry).getTime() : 0;
    if (!expiryTime || !Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
        return { success: false, error: 'Kodun süresi doldu! Yeni kod isteyin.' };
    }

    user.set('isVerified', true);
    user.set('verificationCode', null);
    user.set('verificationCodeExpires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: 'Hesap doğrulandı!' };
});

// Re-send account verification without exposing verification codes to the browser.
Parse.Cloud.define("resendAccountVerification", async function (request) {
    var email = String((request.params && request.params.email) || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Geçerli bir e-posta adresi girin.');
    }
    var rateKey = getRateLimitKey(request, 'resendAccountVerification:' + email);
    await checkRateLimit(rateKey, 3, 15 * 60 * 1000);
    await recordAttempt(rateKey);

    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var user = await query.first({ useMasterKey: true });
    if (!user || user.get('isVerified') === true) {
        return { success: true, message: 'Hesap uygunsa yeni doğrulama kodu gönderildi.' };
    }

    var code = String(Math.floor(100000 + Math.random() * 900000));
    user.set('verificationCode', code);
    user.set('verificationCodeExpires', new Date(Date.now() + 15 * 60 * 1000));
    await user.save(null, { useMasterKey: true });

    var safeName = String(user.get('name') || 'Kullanıcı')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    var html = '<h1>AETHRION doğrulama kodu</h1>' +
        '<p>Merhaba ' + safeName + ',</p>' +
        '<p>Doğrulama kodunuz: <strong style="font-size:24px">' + code + '</strong></p>' +
        '<p>Kod 15 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayın.</p>' +
        '<p>AETHRION — Intelligence Without Limits.</p>';
    var mail = await _aethrionSendEmail(email, 'AETHRION doğrulama kodunuz', html);
    if (!mail || mail.success !== true) {
        console.error('[AETHRION Auth] Verification email delivery failed; provider diagnostics were recorded server-side.');
        // Return a bounded, actionable provider diagnostic so the UI can distinguish
        // missing configuration from a rejected/failed mail-provider request.
        var mailDiagnostic = String((mail && mail.error) || 'E-posta sağlayıcısı gönderimi onaylamadı.').replace(/[\r\n]+/g, ' ').slice(0, 300);
        throw new Error('E-posta gönderilemedi: ' + mailDiagnostic);
    }
    return { success: true, message: 'Hesap uygunsa yeni doğrulama kodu gönderildi.' };
});

Parse.Cloud.define("saveChatHistory", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var messages = request.params.messages;
    if (!Array.isArray(messages)) throw new Error('Geçersiz format!');
    var query = new Parse.Query(ChatHistory);
    query.equalTo("user_email", user.get('email'));
    var history = await query.first({ useMasterKey: true });
    if (history) { history.set("messages", messages); history.set("lastUpdated", new Date()); }
    else {
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
// ========== PROJE İŞLEMLERİ =====================================
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
    if (!name || !type || !content) throw new Error('Proje adı, tür ve içerik gerekli!');
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
                    var fileName = 'vizyon3d_' + user.id + '_' + Date.now() + '.glb';
                    var parseFile = new Parse.File(fileName, { base64: glbBase64 });
                    await parseFile.save(null, { useMasterKey: true });
                    project.set('content_file_url', parseFile.url());
                    console.log('✅ GLB dosyası yüklendi:', parseFile.url());
                } catch (fileErr) {
                    console.warn('⚠️ GLB dosyası yüklenemedi:', fileErr.message);
                }
            }
        }
        await project.save(null, { useMasterKey: true });
        return { success: true, projectId: project.id, message: 'Proje başarıyla kaydedildi!' };
    } catch (e) {
        console.error('❌ saveProjectWithSceneData hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ✅ [v7.10.0 YENİ] Kullanıcının proje sayısını al
Parse.Cloud.define("getUserProjectCount", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    try {
        var query = new Parse.Query(Project);
        query.equalTo('user_email', user.get('email'));
        query.notEqualTo('is_trashed', true);
        var count = await query.count({ useMasterKey: true });
        return { success: true, count: count };
    } catch (e) {
        return { success: false, error: e.message, count: 0 };
    }
});

// ================================================================
// ========== PROJE TALEBİ SİSTEMİ (MODERATÖR YÖNLENDİRMELİ) =====
// ================================================================
Parse.Cloud.define("createProjectRequest", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var title = request.params.title;
    var type = request.params.type;
    var description = request.params.description;
    if (!title || !type || !description) throw new Error('Başlık, tür ve açıklama gerekli!');
    if (['3D', 'Kod', 'Görsel'].indexOf(type) === -1) throw new Error('Geçersiz proje türü!');

    var moderatorQuery = new Parse.Query(Parse.User);
    moderatorQuery.equalTo('role', 'moderator');
    var moderators = await moderatorQuery.find({ useMasterKey: true });

    var recipients = [];
    var recipientType = '';

    if (moderators && moderators.length > 0) {
        recipients = moderators;
        recipientType = 'moderator';
        console.log('📨 Proje talebi moderatörlere yönlendiriliyor (' + moderators.length + ' moderatör)');
    } else {
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
    for (var ii = 0; ii < inboxes.length; ii++) await inboxes[ii].destroy({ useMasterKey: true });
    return { success: true, message: 'Proje talebi iptal edildi.' };
});

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
        for (var mi = 0; mi < allMsgs.length; mi++) await allMsgs[mi].destroy({ useMasterKey: true });
        var reqQuery2 = new Parse.Query(ProjectRequest);
        reqQuery2.equalTo('request_id', requestId);
        var req2 = await reqQuery2.first({ useMasterKey: true });
        if (req2) await req2.destroy({ useMasterKey: true });
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
        var sender2Query = new Parse.Query(Parse.User);
        sender2Query.equalTo('email', senderEmail2);
        var sender2 = await sender2Query.first({ useMasterKey: true });
        if (sender2) {
            await sendNotificationToUser(sender2, '✅ "' + inboxMsg.get('project_title') + '" proje talebiniz ' + user.get('name') + ' tarafından kabul edildi.', 'project_accepted');
        }
        return { success: true, message: 'Talebi kabul ettiniz.', acceptedBy: user.get('email') };
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
        var sender3Query = new Parse.Query(Parse.User);
        sender3Query.equalTo('email', senderEmail3);
        var sender3 = await sender3Query.first({ useMasterKey: true });
        if (sender3) {
            var inbox = new Inbox();
            inbox.set('sender_email', user.get('email'));
            inbox.set('receiver_email', senderEmail3);
            inbox.set('type', 'project_completed');
            inbox.set('message', '✅ "' + inboxMsg.get('project_title') + '" projeniz ' + user.get('name') + ' tarafından tamamlanıp size gönderildi.');
            inbox.set('project_id', projectId);
            await inbox.save(null, { useMasterKey: true });
            await sendNotificationToUser(sender3, '✅ "' + inboxMsg.get('project_title') + '" projeniz tamamlandı.', 'project_completed');
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
// ========== PUAN MAĞAZASINA KOY / KALDIR ========================
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
// ========== SOHBET GEÇMİŞİ (KONUŞMA) ============================
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
    var convQuery = new Parse.Query(Conversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');
    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Bu konuşmaya yetkiniz yok!');
    var shareId = Math.random().toString(36).substring(2, 12);
    conv.set('shareId', shareId);
    await conv.save(null, { useMasterKey: true });
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
    var convQuery = new Parse.Query(Conversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Konuşma bulunamadı!');
    var users = conv.get('user_emails') || [];
    if (users.indexOf(user.get('email')) === -1) throw new Error('Bu konuşmayı silme yetkiniz yok!');
    var msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    var messages = await msgQuery.find({ useMasterKey: true });
    for (var di = 0; di < messages.length; di++) await messages[di].destroy({ useMasterKey: true });
    await conv.destroy({ useMasterKey: true });
    return { success: true, message: 'Sohbet ve tüm mesajlar silindi.' };
});

Parse.Cloud.define("sendAIMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    var text = request.params.text;
    var fromEmail = request.params.fromEmail || 'system@vizyon2027.com';
    var fromName = request.params.fromName || '🧠 AETHRION AI';
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
        if (users[i] !== fromEmail) { toEmail = users[i]; break; }
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
// ========== AI MODELLERİ (BİREYSEL) =============================
// ================================================================
Parse.Cloud.define("callGroq", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('GROQ_KEY');
    if (!key) { console.error('❌ GROQ_KEY Config\'de yok!'); return null; }
    try {
        var res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-instruct",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7, max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) { console.error('❌ Groq hatası:', JSON.stringify(data)); return null; }
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) return data.choices[0].message.content;
        return null;
    } catch (e) { console.error('❌ Groq Fetch:', e.message); return null; }
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
                temperature: 0.7, max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) { console.error('❌ DeepSeek hatası:', JSON.stringify(data)); return null; }
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
        return null;
    } catch (e) { console.error('❌ DeepSeek Fetch:', e.message); return null; }
});

Parse.Cloud.define("callDeepInfra", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('DEEPINFRA_KEY');
    if (!key) return null;
    try {
        var res = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7, max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) { console.error('❌ DeepInfra hatası:', JSON.stringify(data)); return null; }
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
        return null;
    } catch (e) { console.error('❌ DeepInfra Fetch:', e.message); return null; }
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
                temperature: 0.7, max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) { console.error('❌ OpenAI hatası:', JSON.stringify(data)); return null; }
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
        return null;
    } catch (e) { console.error('❌ OpenAI Fetch:', e.message); return null; }
});

Parse.Cloud.define("callOpenRouter", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('OPENROUTER_KEY');
    if (!key) return null;
    try {
        var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vizyon2026.vercel.app',
                'X-Title': 'AETHRION'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7, max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) { console.error('❌ OpenRouter hatası:', JSON.stringify(data)); return null; }
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
        return null;
    } catch (e) { console.error('❌ OpenRouter Fetch:', e.message); return null; }
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
                temperature: 0.7, max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok) { console.error('❌ Cohere hatası:', JSON.stringify(data)); return null; }
        if (data.message && data.message.content && data.message.content[0]) return data.message.content[0].text;
        if (data.text) return data.text;
        return null;
    } catch (e) { console.error('❌ Cohere Fetch:', e.message); return null; }
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
                temperature: 0.7, max_tokens: 1000
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) { console.error('❌ Cerebras hatası:', JSON.stringify(data)); return null; }
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
        return null;
    } catch (e) { console.error('❌ Cerebras Fetch:', e.message); return null; }
});

Parse.Cloud.define("callGitHubModels", async function (request) { return null; });

Parse.Cloud.define("callGemini", async function (request) {
    var prompt = request.params.prompt;
    var key = await getAPIKey('GEMINI_KEY');
    if (!key) return null;
    try {
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + key;
        var res = await fetch(url, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1000, topK: 40, topP: 0.95 }
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) { console.error('❌ Gemini hatası:', JSON.stringify(data)); return null; }
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text;
        }
        return null;
    } catch (e) { console.error('❌ Gemini Fetch:', e.message); return null; }
});

// ================================================================
// ========== callLocalLlama — TÜRKÇE SYSTEM PROMPT'LU v2 =========
// ================================================================
Parse.Cloud.define("callLocalLlama", async function (request) {
    var prompt = request.params.prompt;
    var modelName = request.params.model || 'qwen2.5:latest';
    var localUrl = await getAPIKey('COLAB_LLAMA_URL');
    if (!localUrl) { console.log('⚠️ COLAB_LLAMA_URL yok, atlanıyor.'); return null; }
    if (localUrl.endsWith('/')) localUrl = localUrl.slice(0, -1);

    var isCodeModel = (modelName.indexOf('coder') !== -1 || modelName.indexOf('phi4-mini-reasoning') !== -1 || modelName.indexOf('deepseek-r1') !== -1);
    var temperature = isCodeModel ? 0.2 : 0.55;
    var maxTokens = isCodeModel ? 2048 : 1500;
    var topP = isCodeModel ? 0.9 : 0.95;

    var systemPrompt = 'Sen AETHRION AI\'sın. Türkçe konuşan, samimi ve yardımsever bir yapay zeka asistanısın.\n' +
        '\nKESİN KURALLAR:\n' +
        '1. HER ZAMAN TÜRKÇE CEVAP VER.\n' +
        '2. Doğal ve akıcı Türkçe olsun.\n' +
        '3. Kısa, net ve öz ol.\n' +
        '4. Emin olmadığın konularda "emin değilim" de.\n' +
        '5. Saygılı ve nazik ol.\n' +
        (isCodeModel ? 'KOD MODU: Çalışan kod ver. ```dil ... ``` şeklinde yaz.\n' : 'SOHBET MODU: Doğal sohbet et.\n');

    try {
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
        if (response && response.text) rawText = response.text;
        else if (response && response.buffer) rawText = response.buffer.toString();

        if (!rawText || rawText.length === 0) { console.error('❌ Ollama boş yanıt'); return null; }
        var data;
        try { data = JSON.parse(rawText); }
        catch (e) { console.error('❌ Ollama JSON parse:', rawText.substring(0, 200)); return null; }

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            var reply = data.choices[0].message.content;
            var isTurkishResponse = isLikelyTurkish(reply);
            var isGibberish = isLikelyGibberish(reply);
            if ((!isTurkishResponse && reply.length > 50) || isGibberish) {
                console.warn('⚠️ Ollama kaliteli cevap vermedi, atlanıyor.');
                return null;
            }
            return reply;
        }
        if (data.response && typeof data.response === 'string') return data.response;
        return null;
    } catch (e) {
        console.error('❌ Ollama bağlantı hatası (' + modelName + '):', e.message);
        return null;
    }
});

function isLikelyTurkish(text) {
    if (!text || text.length < 5) return true;
    var turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
    if (turkishChars.test(text)) return true;
    var lower = text.toLowerCase();
    var turkishWords = ['bir','bu','ve','için','ile','olarak','daha','çok','var','yok','değil','evet','hayır','tamam','merhaba','selam','nasıl','neden','niçin','nerede','kim','ne','zaman','iyi','kötü','güzel','yardım','yardımcı','olabilir','yapabilir','istiyorum','isterim','teşekkür','lütfen','tabi','elbette','kesinlikle','belki','ancak','fakat','ama','veya','çünkü','eğer','şey','şimdi','sonra','önce','gibi','kadar','ise','olduğu','olduğunu','yapmak','etmek','olmak','gelmek','gitmek','almak','vermek','bakmak','görmek','bilmek'];
    var matchCount = 0;
    for (var i = 0; i < turkishWords.length; i++) {
        var regex = new RegExp('\\b' + turkishWords[i] + '\\b', 'i');
        if (regex.test(lower)) { matchCount++; if (matchCount >= 2) return true; }
    }
    return false;
}

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
    for (var w in wordCounts) if (wordCounts[w] >= 4 && w.length <= 5) return true;
    return false;
}

// ================================================================
// ========== NVIDIA NIM API =====================================
// ================================================================
Parse.Cloud.define("callNvidiaNIM", async function (request) {
    var prompt = request.params.prompt;
    var modelId = request.params.model || 'meta/llama-3.2-3b-instruct';
    var maxTokens = request.params.maxTokens || 2048;
    if (!prompt) return null;

    var apiKey = await getAPIKey('NVIDIA_API_KEY');
    var baseUrl = await getAPIKey('NVIDIA_BASE_URL');
    if (!baseUrl) baseUrl = await getAPIKey('NVIDIA_NIM_BASE_URL');
    if (!apiKey) { console.error('❌ NVIDIA_API_KEY yok!'); return null; }
    if (!baseUrl) baseUrl = 'https://integrate.api.nvidia.com/v1';
    baseUrl = String(baseUrl).trim().replace(/\/+$/, '').replace(/\/chat\/completions$/i, '');
    if (!/^https:\/\//i.test(baseUrl)) {
        console.error('❌ NVIDIA_BASE_URL https:// ile başlamalı.');
        return null;
    }

    var systemPrompt = 'Sen AETHRION AI\'sın. Türkçe konuşan, samimi ve yardımsever bir yapay zeka asistanısın.\nKESİN KURAL: HER ZAMAN TÜRKÇE CEVAP VER.\nDoğal ve akıcı Türkçe kullan. Kısa, net ve öz ol.';

    try {
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
        if (!rawText || rawText.length === 0) return null;
        var data;
        try { data = JSON.parse(rawText); } catch (e) { return null; }
        if (!response.ok || data.error) { console.error('❌ NVIDIA hatası:', JSON.stringify(data)); return null; }
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
        return null;
    } catch (e) { console.error('❌ NVIDIA Fetch:', e.message); return null; }
});

// ================================================================
// ========== callCustomAI - Kullanıcının kendi API'si ============
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
    if (!apiKeyRecord) return { success: false, error: 'Kayıtlı API anahtarınız yok. Lütfen önce API ekleyin.' };

    var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) return { success: false, error: 'Sunucu şifreleme anahtarı eksik.' };

    var rawValue = '';
    try { rawValue = smartDecrypt(apiKeyRecord.get('encryptedValue'), encryptionKey); }
    catch (e) { return { success: false, error: 'API anahtarı çözülemedi.' }; }
    if (!rawValue) return { success: false, error: 'API anahtarı boş.' };

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
    if (!allKeys || allKeys.length === 0) return { success: false, error: 'Kayıtlı API anahtarınız yok.' };

    var selectedKeys;
    if (keyIds === 'all' || !keyIds) selectedKeys = allKeys;
    else if (Array.isArray(keyIds)) {
        selectedKeys = allKeys.filter(function (k) { return keyIds.indexOf(k.id) !== -1; });
        if (selectedKeys.length === 0) return { success: false, error: 'Seçilen anahtarlar bulunamadı.' };
    } else return { success: false, error: 'Geçersiz keyIds parametresi.' };

    var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) return { success: false, error: 'Sunucu şifreleme anahtarı eksik.' };

    var errors = [];
    for (var i = 0; i < selectedKeys.length; i++) {
        var keyRecord = selectedKeys[i];
        var keyName = keyRecord.get('name') || '';
        var rawValue = '';
        try { rawValue = smartDecrypt(keyRecord.get('encryptedValue'), encryptionKey); }
        catch (e) { errors.push(keyName + ': Şifre çözülemedi'); continue; }
        if (!rawValue) { errors.push(keyName + ': Boş anahtar'); continue; }

        try {
            var singleResult = await callCustomAIWithSingleKey(keyName, rawValue, prompt);
            if (singleResult && singleResult.success && singleResult.reply) {
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
            }
        } catch (e) { errors.push(keyName + ': ' + e.message); }
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
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('openai') !== -1 || lname.indexOf('gpt') !== -1) {
        targetUrl = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-4o-mini';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('anthropic') !== -1 || lname.indexOf('claude') !== -1) {
        targetUrl = 'https://api.anthropic.com/v1/messages';
        model = 'claude-3-5-sonnet-20241022';
        authHeader = null;
        customHeaders['x-api-key'] = rawValue;
        customHeaders['anthropic-version'] = '2023-06-01';
        requestBody = { model: model, max_tokens: 1000, messages: [{ role: 'user', content: prompt }] };
    } else if (lname.indexOf('groq') !== -1) {
        targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
        model = 'llama-3.3-70b-instruct';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('deepseek') !== -1 || lname.indexOf('deep') !== -1) {
        targetUrl = 'https://api.deepseek.com/v1/chat/completions';
        model = 'deepseek-chat';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('gemini') !== -1 || lname.indexOf('google') !== -1) {
        targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + rawValue;
        authHeader = null;
        requestBody = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1000 } };
    } else if (lname.indexOf('openrouter') !== -1 || lname.indexOf('router') !== -1) {
        targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
        model = 'meta-llama/llama-3.1-8b-instruct:free';
        customHeaders['HTTP-Referer'] = 'https://vizyon2026.vercel.app';
        customHeaders['X-Title'] = 'AETHRION';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('cohere') !== -1) {
        targetUrl = 'https://api.cohere.ai/v2/chat';
        model = 'command-r-plus-08-2024';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('cerebras') !== -1) {
        targetUrl = 'https://api.cerebras.ai/v1/chat/completions';
        model = 'llama-3.3-70b-instruct';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('mistral') !== -1) {
        targetUrl = 'https://api.mistral.ai/v1/chat/completions';
        model = 'mistral-large-latest';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('perplexity') !== -1) {
        targetUrl = 'https://api.perplexity.ai/chat/completions';
        model = 'llama-3.1-sonar-small-128k-online';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('together') !== -1) {
        targetUrl = 'https://api.together.xyz/v1/chat/completions';
        model = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('fireworks') !== -1) {
        targetUrl = 'https://api.fireworks.ai/inference/v1/chat/completions';
        model = 'accounts/fireworks/models/llama-v3p3-70b-instruct';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else if (lname.indexOf('anyscale') !== -1) {
        targetUrl = 'https://api.endpoints.anyscale.com/v1/chat/completions';
        model = 'meta-llama/Llama-3-70b-chat-hf';
        requestBody = { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 };
    } else {
        return { success: false, error: 'API anahtarı tipi algılanamadı.' };
    }

    try {
        var fetchHeaders = { 'Content-Type': 'application/json' };
        if (authHeader) fetchHeaders['Authorization'] = authHeader;
        for (var hk in customHeaders) if (hk !== 'Content-Type' && customHeaders[hk]) fetchHeaders[hk] = customHeaders[hk];
        var res = await fetch(targetUrl, { method: 'POST', headers: fetchHeaders, body: JSON.stringify(requestBody) });
        var data = await res.json();
        if (!res.ok) return { success: false, error: 'HTTP ' + res.status + ': ' + JSON.stringify(data).substring(0, 200) };
        if (data.error) return { success: false, error: JSON.stringify(data.error).substring(0, 200) };
        var reply = null;
        if (data.choices && data.choices[0] && data.choices[0].message) reply = data.choices[0].message.content;
        else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) reply = data.candidates[0].content.parts[0].text;
        else if (data.message && data.message.content && data.message.content[0]) reply = data.message.content[0].text;
        else if (data.content && data.content[0] && data.content[0].text) reply = data.content[0].text;
        if (reply) return { success: true, reply: cleanResponse(reply) };
        return { success: false, error: 'Yanıt alınamadı.' };
    } catch (e) { return { success: false, error: e.message }; }
}

// ================================================================
// ========== superAI — 13 Ollama + NVIDIA NIM + 8 API ============
// ================================================================
Parse.Cloud.define("superAI", async function (request) {
    var prompt = request.params.prompt;
    if (!prompt) return 'Lütfen bir soru girin.';

    // ✅ [FIX A8] superAI'de rate limit yoktu (DDoS'a açık) — eklendi.
    // NOT: superAI fonksiyonu her yerde düz string döndürüyor, tutarlılık için
    // rate limit hatası da düz string olarak döndürülüyor (obje değil).
    var _rlkSuperAI = 'superAI:' + (request.user ? request.user.get('email') : (request.ip || request.installationId || 'anon'));
    try {
        await checkRateLimit(_rlkSuperAI, 30, 60 * 1000);
        await recordAttempt(_rlkSuperAI);
    } catch (e) {
        return '⏳ Çok hızlı istek gönderdin, biraz yavaşla ve tekrar dene.';
    }

    var isTurkishRequest = isLikelyTurkish(prompt);
    var turkishInstruction = '';
    if (isTurkishRequest) {
        turkishInstruction = 'ÖNEMLİ: Sana Türkçe soru soruluyor. Cevabını KESİNLİKLE TÜRKÇE ver. İngilizce cevap verme.\n\n';
    }

    var lp = prompt.toLowerCase();
    if (lp.indexOf('dolar') !== -1 || lp.indexOf('haber') !== -1 || lp.indexOf('arama') !== -1 || lp.indexOf('hava') !== -1) {
        try {
            var result = await Parse.Cloud.run("webSearch", { query: prompt }, { useMasterKey: true });
            if (result && result.indexOf('tanımlanmamış') === -1 && result.indexOf('yapılamadı') === -1) return cleanResponse(result);
        } catch (e) { console.error('Web arama hatası:', e.message); }
    }

    var apiPrompt = turkishInstruction ? (turkishInstruction + prompt) : prompt;

    // KATMAN 1: 13 OLLAMA
    var ollamaModels = [
        'qwen2.5:latest','qwen3:8b','llama3.2:latest','gemma3:4b','mistral:latest',
        'qwen3:4b','gemma2:latest','phi3.5:latest','deepseek-r1:latest','qwen2.5-coder:latest',
        'phi4-mini-reasoning:latest','qwen2.5vl:3b','granite3.3:2b'
    ];

    var localUrl = await getAPIKey('COLAB_LLAMA_URL');
    if (localUrl) {
        console.log('🔄 KATMAN 1 - Ollama: 13 model sırayla...');
        for (var om = 0; om < ollamaModels.length; om++) {
            try {
                var localReply = await Parse.Cloud.run('callLocalLlama', { prompt: prompt, model: ollamaModels[om] }, { useMasterKey: true });
                if (localReply && localReply.length > 10) { console.log('✅ OLLAMA: ' + ollamaModels[om]); return cleanResponse(localReply); }
            } catch (e) { console.warn('⚠️ Ollama ' + ollamaModels[om] + ' başarısız'); }
        }
    }

    // KATMAN 2: NVIDIA NIM
    var nvidiaModels = [
        'meta/llama-3.3-70b-instruct','meta/llama-3.1-8b-instruct','qwen/qwen2.5-7b-instruct',
        'qwen/qwen2.5-coder-32b-instruct','deepseek-ai/deepseek-r1-distill-llama-8b',
        'google/gemma-2-2b-instruct','microsoft/phi-3.5-moe-instruct'
    ];

    var nvidiaKey = await getAPIKey('NVIDIA_API_KEY');
    if (nvidiaKey) {
        console.log('🔄 KATMAN 2 - NVIDIA NIM: ' + nvidiaModels.length + ' model...');
        for (var nm = 0; nm < nvidiaModels.length; nm++) {
            try {
                var nvidiaReply = await Parse.Cloud.run('callNvidiaNIM', { prompt: apiPrompt, model: nvidiaModels[nm] }, { useMasterKey: true });
                if (nvidiaReply && nvidiaReply.length > 10) { console.log('✅ NIM: ' + nvidiaModels[nm]); return cleanResponse(nvidiaReply); }
            } catch (e) {}
        }
    }

    // KATMAN 3: 8 Bulut API
    var apiModels = ['callGroq','callGemini','callDeepSeek','callDeepInfra','callOpenAI','callCerebras','callOpenRouter','callCohere'];
    for (var mi = 0; mi < apiModels.length; mi++) {
        var model = apiModels[mi];
        try {
            var result2 = await Parse.Cloud.run(model, { prompt: apiPrompt }, { useMasterKey: true });
            if (result2 && result2.length > 10) { console.log('✅ ' + model); return cleanResponse(result2); }
        } catch (e) { console.error('❌ ' + model + ' başarısız'); }
    }

    return '🧠 AETHRION AI: Üzgünüm, tüm modeller şu anda cevap veremiyor.';
});

// ================================================================
// ========== AETHRION AI CHAT + DAILY QUOTA =======================
// Free: 24 messages/day. Pro: 2000/day. Team and elevated roles: unlimited.
// This wrapper is the supported frontend entry point; model credentials stay server-side.
// ================================================================
Parse.Cloud.define("aethrionChat", async function (request) {
    var message = String((request.params && (request.params.message || request.params.prompt)) || '').trim();
    var mode = String((request.params && request.params.mode) || 'normal').toLowerCase();
    if (!message) return { success: false, error: 'Lütfen bir mesaj yazın.' };
    if (message.length > 8000) return { success: false, error: 'Mesaj en fazla 8000 karakter olabilir.' };
    var modeInstruction = mode === 'deep'
        ? 'Yanıtlamadan önce soruyu dikkatle analiz et; varsayımlarını kontrol et ve gerekçeli, yapılandırılmış bir yanıt ver.\\n\\n'
        : mode === 'developer'
            ? 'Yazılımcı modundasın: teknik doğruluk, çalışan kod, güvenlik ve test edilebilirlik önceliklidir.\\n\\n'
            : mode === 'agent'
                ? 'Ajan modundasın: uygulanabilir adımları planla; gerçekleştiremediğin harici işlemleri yaptığını iddia etme.\\n\\n'
                : '';
    var prompt = modeInstruction + message;

    var user = request.user || null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    var role = user ? String(user.get('role') || 'user').toLowerCase() : 'visitor';
    var plan = user ? String(user.get('plan') || 'free').toLowerCase() : 'free';
    var unlimited = ['admin', 'founder', 'beta', 'moderator'].indexOf(role) !== -1 || plan === 'team';
    var limit = unlimited ? -1 : (plan === 'pro' ? 2000 : 24);
    var identity = user ? String(user.get('email') || user.id) : String(request.ip || request.installationId || '');
    if (!identity) return { success: false, error: 'Ziyaretçi kimliği belirlenemedi. Sayfayı yenileyip tekrar deneyin.' };

    try {
        await checkRateLimit('aethrionChat:' + identity, 30, 60 * 1000);
        await recordAttempt('aethrionChat:' + identity);
    } catch (rateError) {
        return { success: false, code: 'RATE_LIMIT', error: 'Çok hızlı mesaj gönderiyorsun. Biraz bekleyip tekrar dene.' };
    }

    var Usage = Parse.Object.extend('AethrionAIUsage');
    var query = new Parse.Query(Usage);
    if (user) query.equalTo('user_email', identity);
    else {
        var cryptoModule = require('crypto');
        var visitorHash = cryptoModule.createHash('sha256').update(identity).digest('hex').slice(0, 32);
        query.equalTo('visitorKey', visitorHash);
    }
    query.greaterThanOrEqualTo('date', today);
    query.lessThan('date', tomorrow);
    var usage = await query.first({ useMasterKey: true });
    if (!usage) {
        usage = new Usage();
        if (user) usage.set('user_email', identity);
        else usage.set('visitorKey', visitorHash);
        usage.set('date', today);
        usage.set('count', 0);
    }

    var used = Number(usage.get('count') || 0);
    if (!unlimited && used >= limit) {
        return {
            success: false,
            code: 'DAILY_LIMIT',
            error: 'Günlük AETHRION AI hakkın doldu (' + used + '/' + limit + '). Hakların yarın yenilenir.',
            limit: limit,
            used: used,
            remaining: 0
        };
    }

    // Count before generation to prevent concurrent requests from bypassing the quota.
    usage.increment('count');
    usage.set('date', today);
    await usage.save(null, { useMasterKey: true });
    var newUsed = used + 1;
    try {
        var reply = await Parse.Cloud.run('superAI', { prompt: prompt }, { useMasterKey: true });
        return {
            success: true,
            reply: String(reply == null ? '' : reply),
            limit: unlimited ? 'Sınırsız' : limit,
            used: newUsed,
            remaining: unlimited ? 'Sınırsız' : Math.max(0, limit - newUsed)
        };
    } catch (error) {
        console.error('[aethrionChat] superAI failed:', String(error && error.message || error));
        return {
            success: false,
            code: 'AI_UNAVAILABLE',
            error: 'AETHRION AI şu anda yanıt üretemedi. Biraz sonra tekrar dene.',
            limit: unlimited ? 'Sınırsız' : limit,
            used: newUsed,
            remaining: unlimited ? 'Sınırsız' : Math.max(0, limit - newUsed)
        };
    }
});

Parse.Cloud.define("getAethrionAIQuota", async function (request) {
    var user = request.user || null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    var role = user ? String(user.get('role') || 'user').toLowerCase() : 'visitor';
    var plan = user ? String(user.get('plan') || 'free').toLowerCase() : 'free';
    var unlimited = ['admin', 'founder', 'beta', 'moderator'].indexOf(role) !== -1 || plan === 'team';
    var limit = unlimited ? 'Sınırsız' : (plan === 'pro' ? 2000 : 24);
    var identity = user ? String(user.get('email') || user.id) : String(request.ip || request.installationId || '');
    if (!identity) return { success: false, error: 'Kullanım hakkı kontrol edilemedi.' };

    var Usage = Parse.Object.extend('AethrionAIUsage');
    var query = new Parse.Query(Usage);
    if (user) query.equalTo('user_email', identity);
    else {
        var cryptoModule = require('crypto');
        var visitorHash = cryptoModule.createHash('sha256').update(identity).digest('hex').slice(0, 32);
        query.equalTo('visitorKey', visitorHash);
    }
    query.greaterThanOrEqualTo('date', today);
    query.lessThan('date', tomorrow);
    var usage = await query.first({ useMasterKey: true });
    var used = usage ? Number(usage.get('count') || 0) : 0;
    return { success: true, limit: limit, used: used, remaining: unlimited ? 'Sınırsız' : Math.max(0, Number(limit) - used) };
});

// ================================================================
// ========== webSearch ==========================================
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
                if (data.answer_box) result += '⚡ ' + (data.answer_box.answer || data.answer_box.snippet) + '\n\n';
                if (data.organic_results && data.organic_results.length) {
                    for (var i = 0; i < Math.min(3, data.organic_results.length); i++) {
                        var r = data.organic_results[i];
                        result += r.title + '\n' + r.snippet + '\n\n';
                    }
                }
                return result;
            }
        } catch (e) { console.error('SerpAPI hatası:', e.message); }
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
                return gResult;
            }
        } catch (e) { console.error('Google CSE hatası:', e.message); }
    }

    return '"' + query + '" için arama yapılamadı.';
});

// ================================================================
// ========== sendEmail - HİBRİT =================================
// ================================================================
// Shared email delivery implementation. Internal Cloud Code functions call this
// directly so delivery does not depend on nested Cloud.run master-key semantics.
async function _aethrionSendEmail(to, subject, html) {
    to = String(to || '').trim().toLowerCase();
    subject = String(subject || '').trim();
    html = String(html || '');
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return { success: false, error: 'Geçerli alıcı e-posta adresi gerekli.' };
    }
    if (!subject) return { success: false, error: 'Konu gerekli!' };
    if (!html) return { success: false, error: 'İçerik gerekli!' };

    console.log('[AETHRION Mail] Delivery requested; recipient redacted.');
    try {
        var googleResult = await tryGoogleAppsScript(to, subject, html);
        if (googleResult && googleResult.success === true) {
            return { success: true, provider: 'google', message: 'Mail gönderildi (Google Apps Script)', id: googleResult.id || null };
        }

        // Do not use a second provider after an ambiguous network/empty-response
        // result, because the first provider may already have accepted the message.
        // For explicit configuration/HTTP/application errors, a configured Resend
        // provider is a safe recovery path and prevents a broken Google setup from
        // blocking all verification emails.
        var googleError = String((googleResult && googleResult.error) || '');
        var ambiguousGoogleResult = /boş yanıt döndü|HTTP hatası|AbortError|aborted|fetch failed|network|ağ hatası/i.test(googleError);
        var googleUrlConfigured = await getAPIKey('GOOGLE_SCRIPT_URL');
        var googleTokenConfigured = await getAPIKey('APPS_SCRIPT_TOKEN');
        if (googleUrlConfigured && googleTokenConfigured && ambiguousGoogleResult) {
            console.error('[AETHRION Mail] Google result is ambiguous; secondary provider suppressed to avoid duplicate email.');
            return { success: false, error: 'Google Apps Script yanıtı kesinleştirilemedi; çift e-posta göndermemek için otomatik yedek durduruldu. Lütfen tekrar deneyin.' };
        }

        var resendResult = await tryResend(to, subject, html);
        if (resendResult && resendResult.success === true) {
            console.warn('[AETHRION Mail] Verification email delivered by Resend fallback after Google provider failure.');
            return { success: true, provider: 'resend', message: 'Mail gönderildi (yedek sağlayıcı)', id: resendResult.id || null };
        }

        console.error('[AETHRION Mail] Delivery providers failed.', {
            googleConfigured: !!googleUrlConfigured,
            googleTokenConfigured: !!googleTokenConfigured,
            google: googleError.slice(0, 240),
            resend: String((resendResult && resendResult.error) || 'unknown').slice(0, 240)
        });
        var detail = googleError || 'Google Apps Script yapılandırması eksik.';
        var resendDetail = String((resendResult && resendResult.error) || 'Resend sağlayıcısı yapılandırması eksik.');
        return { success: false, error: 'E-posta gönderilemedi. Google: ' + detail.slice(0, 180) + ' | Yedek: ' + resendDetail.slice(0, 180) };
    } catch (e) {
        console.error('[AETHRION Mail] Delivery helper failed:', String((e && e.message) || 'unknown').slice(0, 240));
        return { success: false, error: 'E-posta gönderimi sırasında sunucu hatası oluştu.' };
    }
}

Parse.Cloud.define("sendEmail", async function (request) {
    var params = request.params || {};
    var to = params.to;
    var subject = params.subject;
    var html = params.html;
    if (!request.master && !request.user) throw new Error('Yetkisiz erişim!');
    if (!request.master) {
        var _rlk = 'sendEmail:' + String(to || 'unknown').trim().toLowerCase();
        await checkRateLimit(_rlk, 5, 10 * 60 * 1000);
        await recordAttempt(_rlk);
    }
    return await _aethrionSendEmail(to, subject, html);
});

// ================================================================
// tryGoogleAppsScript — v7.10.2 (Parse.Cloud.httpRequest KALDIRILDI)
// ================================================================
async function tryGoogleAppsScript(to, subject, html) {
    try {
        var url = await getAPIKey('GOOGLE_SCRIPT_URL');
        var token = await getAPIKey('APPS_SCRIPT_TOKEN');
        if (!url) {
            return { success: false, error: 'GOOGLE_SCRIPT_URL Config\'de tanımlı değil!' };
        }
        if (!token || typeof token !== 'string' || !token.trim()) {
            return { success: false, error: 'APPS_SCRIPT_TOKEN Back4App Config/Environment ayarında tanımlı değil!' };
        }

        if (url.indexOf('script.google.com') === -1) {
            return { success: false, error: 'GOOGLE_SCRIPT_URL geçersiz (script.google.com olmalı)' };
        }

        if (url.endsWith('/dev')) {
            return { success: false, error: 'GOOGLE_SCRIPT_URL /dev ile bitiyor! /exec olmalı!' };
        }

        console.log('📧 [Google] POST →', url.substring(0, 60) + '...');

        var payload = {
            token: token.trim(),
            to: to,
            recipient: to,
            subject: subject,
            html: html,
            text: String(html || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
            body: html
        };

        // ✅ SADECE NATIVE FETCH KULLAN
        // Bound the provider request so a slow Apps Script response cannot leave
        // account-verification UI waiting indefinitely.
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;
        var fetchResp;
        try {
            fetchResp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                redirect: 'follow',
                signal: controller ? controller.signal : undefined
            });
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }

        var statusCode = fetchResp.status;
        var rawText = await fetchResp.text();

        console.log('📧 [Google] HTTP', statusCode, '| Yanıt:', rawText.substring(0, 200));

        if (!rawText || rawText.trim().length === 0) {
            return {
                success: false,
                error: 'Google Apps Script boş yanıt döndü (HTTP ' + statusCode + '). Deployment yanlış olabilir.'
            };
        }

        var trimmed = rawText.trim();
        if (statusCode < 200 || statusCode >= 300) {
            return { success: false, error: 'Google Apps Script HTTP ' + statusCode + ' yanıtı döndürdü.' };
        }

        // HTML hata sayfası kontrolü
        if (trimmed.charAt(0) === '<' ||
            trimmed.indexOf('<!DOCTYPE') !== -1 ||
            trimmed.indexOf('<html') !== -1) {

            var titleMatch = trimmed.match(/<title>([^<]+)<\/title>/i);
            var errTitle = titleMatch ? titleMatch[1] : 'HTML hata sayfası';
            var hint = '';

            if (trimmed.indexOf('sign in') !== -1 || trimmed.indexOf('accounts.google.com') !== -1 || trimmed.indexOf('Giriş yap') !== -1) {
                hint = ' → Web App "Anyone" olarak deploy EDİLMEMİŞ!';
            } else if (trimmed.indexOf('Script function not found') !== -1 || trimmed.indexOf('doPost') !== -1) {
                hint = ' → Apps Script\'te doPost(e) fonksiyonu YOK!';
            }

            return {
                success: false,
                error: 'Google Apps Script HTML döndü: ' + errTitle + hint,
                responsePreview: trimmed.substring(0, 300)
            };
        }

        // JSON parse
        var data;
        try {
            data = JSON.parse(trimmed);
        } catch (parseErr) {
            return {
                success: false,
                error: 'Geçersiz JSON: ' + trimmed.substring(0, 200)
            };
        }

        // BAŞARI
        if (data && (
            data.success === true || data.success === 'true' ||
            data.ok === true ||
            data.status === 'sent' || data.status === 'success' ||
            data.result === 'success'
        )) {
            console.log('✅ [Google] MAIL GÖNDERİLDİ →', to);
            return { success: true, id: data.id || data.messageId || null };
        }

        // Hata
        if (data && (data.error || data.errorMessage)) {
            return {
                success: false,
                error: 'Apps Script hatası: ' + (data.error || data.errorMessage)
            };
        }

        // Only an explicit success response may stop the fallback provider.
        console.warn('⚠️ [Google] JSON yanıtı başarıyı doğrulamadı.');
        return { success: false, error: 'Google Apps Script gönderimi başarıyla doğrulamadı.' };

    } catch (e) {
        console.error('❌ [Google] Exception:', e.message);
        return { success: false, error: 'HTTP hatası: ' + e.message };
    }
}

// ================================================================
// tryResend — v7.10.2 (Parse.Cloud.httpRequest KALDIRILDI)
// ================================================================
async function tryResend(to, subject, html) {
    try {
        var apiKey = await getAPIKey('RESEND_API_KEY');
        if (!apiKey) {
            return { success: false, error: 'RESEND_API_KEY Config\'de tanımlı değil!' };
        }

        var fromAddress = await getAPIKey('RESEND_FROM_EMAIL');
        if (!fromAddress || String(fromAddress).trim().length < 5) {
            // Support the common EMAIL_FROM alias used by existing deployments.
            fromAddress = await getAPIKey('EMAIL_FROM');
        }
        if (!fromAddress || String(fromAddress).trim().length < 5) {
            fromAddress = 'AETHRION <onboarding@resend.dev>';
            console.warn('⚠️ [Resend] Sender address is not configured; using the Resend onboarding sender.');
        }
        fromAddress = String(fromAddress).trim();

        console.log('📧 [Resend] POST → sender configured; recipient redacted.');

        var payload = {
            from: fromAddress,
            to: [to],
            subject: subject,
            html: html
        };

        // Bound both connection and response-body time so a provider outage cannot
        // leave verification requests waiting indefinitely.
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;
        var fetchResp;
        var rawText;
        try {
            fetchResp = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller ? controller.signal : undefined
            });
            var statusCode = fetchResp.status;
            rawText = await fetchResp.text();
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }

        console.log('📧 [Resend] HTTP', statusCode, '| Yanıt:', rawText.substring(0, 200));

        if (!rawText || rawText.trim().length === 0) {
            return { success: false, error: 'Resend boş yanıt (HTTP ' + statusCode + ')' };
        }

        var data;
        try {
            data = JSON.parse(rawText.trim());
        } catch (e) {
            return { success: false, error: 'Geçersiz JSON (HTTP ' + statusCode + '): ' + rawText.substring(0, 100) };
        }

        // BAŞARI
        if (statusCode >= 200 && statusCode < 300 && data.id) {
            console.log('✅ [Resend] MAIL GÖNDERİLDİ →', to);
            return { success: true, id: data.id };
        }

        // DETAYLI HATA
        var errMsg = data.message || data.error || JSON.stringify(data).substring(0, 200);

        if (statusCode === 403 && errMsg.indexOf('domain') !== -1) {
            errMsg += ' → Resend\'de domain doğrulanmamış! Doğrulanmış domain kullan.';
        } else if (statusCode === 401) {
            errMsg += ' → RESEND_API_KEY geçersiz!';
        } else if (statusCode === 422) {
            errMsg += ' → Geçersiz parametreler (from/to/subject kontrol et)';
        }

        return { success: false, error: 'HTTP ' + statusCode + ': ' + errMsg };

    } catch (e) {
        console.error('❌ [Resend] Exception:', e.message);
        return { success: false, error: 'HTTP hatası: ' + e.message };
    }
}
        

// ================================================================
// ===== getSiteInfoForVizyonAl ==================================
// ================================================================
Parse.Cloud.define("getSiteInfoForVizyonAl", async function (request) {
    try {
        var content = await getSiteContent();
        return {
            success: true,
            content: content || 'Site içeriği alınamadı.',
            version: 'v7.10.0',
            features: [
                '21 farklı AI modeli (13 Ollama + 8 bulut)',
                'A27 API anahtarı sistemi',
                'AETHRION Koç Asistanı',
                'AETHRION AI Paneli (4 mod)',
                'Sesli Sohbet',
                'Dosya Analiz + Sunum',
                'Logs Sistemi',
                'Video Stüdyosu',
                '3D Stüdyo (90+ şekil)',
                'Takım çalışması',
                'Aylık yarışma',
                'AETHRION Academy',
                'Puan mağazası',
                'Ebeveyn kontrolü',
                'Moderatör / Tasarımcı rütbesi',
                'AETHRION Devriye (7/24)'
            ]
        };
    } catch (e) {
        console.error('getSiteInfoForVizyonAl hatası:', e);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== vizyonAlChat — AETHRION AI ANA CHAT (4 MOD) ===============
// ================================================================
Parse.Cloud.define("vizyonAlChat", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params && request.params.message;
    var mode = request.params && request.params.mode || 'normal';
    if (typeof message !== 'string' || !message.trim()) throw new Error('Mesaj gerekli!');
    message = message.trim();
    if (message.length > 4000) throw new Error('Mesaj çok uzun (max 4000 karakter).');
    if (['normal', 'deep', 'agent', 'developer'].indexOf(mode) === -1) mode = 'normal';

    var _rlk = 'vizyonAlChat:' + (user.get('email') || user.id);
    // Rate limit ihlali sessizce yutulmamalı; aksi hâlde engellenen istek AI'ya devam eder.
    // checkRateLimitPersistent veri tabanı erişim hatalarını kendi içinde ele alır,
    // gerçek limit aşımında ise çağrıyı reddetmek için hata fırlatır.
    await checkRateLimit(_rlk, 30, 60 * 1000);
    await recordAttempt(_rlk);

    var siteContext = '';
    if (mode === 'deep' || mode === 'agent' || mode === 'developer') {
        try {
            siteContext = await getSiteContent();
            if (siteContext && siteContext.length > 2000) siteContext = siteContext.substring(0, 2000);
        } catch (e) { console.warn('Site içeriği alınamadı:', e.message); }
    }

    var systemPrompt = '';
    if (mode === 'deep') {
        systemPrompt = 'Sen AETHRION AI\'sın ve şu an DERİN DÜŞÜNME MODUNDASIN.\n\nKURALLAR:\n1. Önce çok uzun ve derin düşün.\n2. Düşünme sürecini "DÜŞÜNÜYORUM:" başlığı altında yaz.\n3. Sonra net ve kapsamlı bir cevap ver.\n4. HER ZAMAN TÜRKÇE.\n\nAETHRION Site Bilgisi:\n' + siteContext + '\n\nKullanıcı sorusu:';
    } else if (mode === 'agent') {
        systemPrompt = 'Sen AETHRION AI\'sın ve şu an AJAN MODUNDASIN.\n\nKURALLAR:\n1. Her siteye girebilir, her işlemi yapabilirsin.\n2. Görevi yapmak için adımları sırala.\n3. HER ZAMAN TÜRKÇE.\n\nAETHRION Site Bilgisi:\n' + siteContext + '\n\nKullanıcı görevi:';
    } else if (mode === 'developer') {
        systemPrompt = 'Sen AETHRION AI\'sın ve şu an YAZILIMCI MODUNDASIN.\n\nKURALLAR:\n1. En iyi kod üretimini sağla. Her dilde.\n2. Kod bloklarını ```dil ... ``` şeklinde ver.\n3. Çalışan, eksiksiz kod ver.\n4. HER ZAMAN TÜRKÇE.\n\nAETHRION Site Bilgisi:\n' + siteContext + '\n\nKullanıcı kod talebi:';
    } else {
        systemPrompt = 'Sen AETHRION AI\'sın (AETHRION AI Asistanı).\n\nKURALLAR:\n1. HER ZAMAN TÜRKÇE.\n2. Doğal, akıcı, samimi.\n3. Kısa, net ve öz ol.\n4. Site hakkında soru sorulursa bilgi verebilirsin.\n\nKullanıcı sorusu:';
    }

    var fullPrompt = systemPrompt + '\n\n' + message;

    try {
        var reply = await Parse.Cloud.run('superAI', { prompt: fullPrompt }, { useMasterKey: true });
        if (!reply || reply.length < 2) reply = 'Şu anda cevap veremiyorum. Lütfen tekrar dene.';
        return {
            success: true,
            reply: cleanResponse(reply),
            mode: mode,
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        console.error('vizyonAlChat hatası:', e.message);
        return { success: false, error: 'AETHRION AI cevap veremedi: ' + e.message };
    }
});

Parse.Cloud.define("vizyonAlDeepThink", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');
    try {
        var result = await Parse.Cloud.run('vizyonAlChat', { message: message, mode: 'deep' }, { useMasterKey: true });
        return result;
    } catch (e) { return { success: false, error: e.message }; }
});

Parse.Cloud.define("vizyonAlAgent", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');
    try {
        var result = await Parse.Cloud.run('vizyonAlChat', { message: message, mode: 'agent' }, { useMasterKey: true });
        return result;
    } catch (e) { return { success: false, error: e.message }; }
});

Parse.Cloud.define("vizyonAlDeveloper", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');
    try {
        var result = await Parse.Cloud.run('vizyonAlChat', { message: message, mode: 'developer' }, { useMasterKey: true });
        return result;
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ===== vizyonAlScreenRead (TEK KARE EKRAN OKUMA) ===============
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
    } catch (e) { console.warn('Rate limit uyarısı:', e.message); }

    var key = await getAPIKey('GEMINI_KEY');
    if (!key) return { success: false, error: 'GEMINI_KEY Config\'de tanımlı değil!' };

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + key;
    try {
        var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: question }, { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) return { success: false, error: (data.error && data.error.message) || 'HTTP ' + res.status };
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            return { success: true, reply: data.candidates[0].content.parts[0].text };
        }
        return { success: false, error: 'Beklenmedik format' };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ===== vizyonAlLiveScreenStream (CANLI EKRAN) ==================
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
    } catch (e) { return { success: false, error: 'Çok hızlı. Biraz yavaşla.', rateLimited: true }; }

    var key = await getAPIKey('GEMINI_KEY');
    if (!key) return { success: false, error: 'GEMINI_KEY eksik.' };

    var question = '';
    if (mode === 'deep') question = 'Bu ekranda ne oluyor? Derinlemesine analiz et. Önceki durum: "' + previousDescription + '"';
    else if (mode === 'agent') question = 'Bu ekranda hangi işlemler yapılabilir? Kısa ve eyleme dönük cevap ver.';
    else if (mode === 'developer') question = 'Bu ekranda kod, terminal veya hata mesajı var mı? Varsa analiz et.';
    else question = 'Bu ekranda ne var? Çok kısa açıkla (max 2 cümle). Önceki: "' + previousDescription + '"';

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + key;
    try {
        var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: question }, { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 300 }
            })
        });
        var data = await res.json();
        if (!res.ok || data.error) return { success: false, error: (data.error && data.error.message) || 'HTTP ' + res.status };
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            return { success: true, reply: data.candidates[0].content.parts[0].text, model: 'gemini-2.0-flash-live' };
        }
        return { success: false, error: 'Beklenmedik format' };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ===== [v7.10.0 YENİ] vizyonAlFileAnalyze (DOSYA ANALİZ) =======
// ================================================================
Parse.Cloud.define("vizyonAlFileAnalyze", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var fileBase64 = typeof request.params.fileBase64 === 'string' ? request.params.fileBase64 : '';
    var fileName = String(request.params.fileName || 'dosya').slice(0, 180);
    var fileType = String(request.params.fileType || 'application/octet-stream').toLowerCase().slice(0, 120);
    var question = String(request.params.question || 'Bu dosyayı analiz et ve özetle.').slice(0, 4000);
    if (!fileBase64) throw new Error('Dosya içeriği gerekli!');
    if (fileBase64.length > 11 * 1024 * 1024) throw new Error('Dosya 8 MB sınırını aşıyor.');
    var isImage = fileType.indexOf('image/') === 0;
    var isPdf = fileType === 'application/pdf' || /\.pdf$/i.test(fileName);
    var isAudio = fileType.indexOf('audio/') === 0;
    var isVideo = fileType.indexOf('video/') === 0;
    var isMedia = isImage || isPdf || isAudio || isVideo;
    var isText = fileType.indexOf('text/') === 0 || /^(application\/(json|xml|javascript|x-javascript))$/.test(fileType) || /\.(txt|md|csv|json|js|ts|py|html|css|xml|ya?ml|log|sql|sh)$/i.test(fileName);
    if (!isMedia && !isText) {
        return { success: false, error: 'Dosya türü çözümlenemedi. Görsel, PDF, ses/video, metin veya kod dosyası kullanın.' };
    }

    var _rlk = 'vizyonAlFileAnalyze:' + user.get('email');
    try {
        await checkRateLimit(_rlk, 30, 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) {
        console.warn('[AETHRION File Analysis] Rate limit enforced.');
        return { success: false, error: 'Çok fazla dosya analizi isteği gönderdiniz. Bir dakika sonra tekrar deneyin.' };
    }

    try {
        // Gemini görselleri ve PDF belgelerini doğrudan analiz edebilir.
        if (isMedia) {
            var key = await getAPIKey('GEMINI_KEY');
            if (!key) return { success: false, error: 'GEMINI_KEY eksik.' };
            var mimeType = fileType;
            var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + key;
            var res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: question }, { inline_data: { mime_type: mimeType, data: fileBase64 } }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 2000 }
                })
            });
            var data = await res.json();
            if (!res.ok || data.error) return { success: false, error: (data.error && data.error.message) || 'HTTP ' + res.status };
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return { success: true, reply: data.candidates[0].content.parts[0].text, fileType: isPdf ? 'pdf' : (isAudio ? 'audio' : (isVideo ? 'video' : 'image')) };
            }
            return { success: false, error: 'Beklenmedik format' };
        } else {
            // Metin ve kaynak kod dosyaları base64'ten UTF-8 metne dönüştürülür.
            var decoded = '';
            try {
                decoded = Buffer.from(fileBase64, 'base64').toString('utf8');
                if (decoded.length > 15000) decoded = decoded.substring(0, 15000) + '\n\n[...kısaltıldı...]';
            } catch (e) { decoded = '[binary dosya]'; }

            var prompt = 'Dosya Adı: ' + fileName + '\nDosya Türü: ' + fileType + '\n\nİçerik:\n' + decoded + '\n\nSoru: ' + question;
            var reply = await Parse.Cloud.run('superAI', { prompt: prompt }, { useMasterKey: true });
            return { success: true, reply: cleanResponse(reply), fileType: 'document' };
        }
    } catch (e) {
        console.error('vizyonAlFileAnalyze hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.10.0 YENİ] vizyonAlFileCreate (SUNUM/DOSYA OLUŞTUR) =
// ================================================================
Parse.Cloud.define("vizyonAlFileCreate", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var content = request.params.content;
    var fileFormat = request.params.format || 'txt'; // txt, html, md, json
    var title = request.params.title || 'AETHRION AI Çıktısı';
    if (!content) throw new Error('İçerik gerekli!');

    try {
        var fileContent = '';
        var mimeType = 'text/plain';
        var extension = 'txt';

        if (fileFormat === 'html') {
            fileContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title><style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;}</style></head><body><h1>' + title + '</h1>' + content.replace(/\n/g, '<br>') + '</body></html>';
            mimeType = 'text/html';
            extension = 'html';
        } else if (fileFormat === 'md') {
            fileContent = '# ' + title + '\n\n' + content;
            mimeType = 'text/markdown';
            extension = 'md';
        } else if (fileFormat === 'json') {
            try { fileContent = JSON.stringify(JSON.parse(content), null, 2); }
            catch (e) { fileContent = JSON.stringify({ title: title, content: content }, null, 2); }
            mimeType = 'application/json';
            extension = 'json';
        } else {
            fileContent = title + '\n' + '='.repeat(title.length) + '\n\n' + content;
        }

        // Parse.File olarak kaydet
        var fileName = 'vizyonAl_' + user.id + '_' + Date.now() + '.' + extension;
        var parseFile = new Parse.File(fileName, { base64: Buffer.from(fileContent, 'utf8').toString('base64') });
        await parseFile.save(null, { useMasterKey: true });

        return {
            success: true,
            fileDownloadUrl: parseFile.url(),
            fileName: fileName,
            mimeType: mimeType,
            size: fileContent.length
        };
    } catch (e) {
        console.error('vizyonAlFileCreate hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.10.0 YENİ] vizyonAlVoiceChat (SESLİ SOHBET) =========
// ================================================================
Parse.Cloud.define("vizyonAlVoiceChat", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    var mode = request.params.mode || 'normal';
    if (!message) throw new Error('Mesaj gerekli!');

    var _rlk = 'vizyonAlVoiceChat:' + user.get('email');
    try {
        await checkRateLimit(_rlk, 30, 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) { console.warn('Rate limit uyarısı:', e.message); }

    try {
        var result = await Parse.Cloud.run('vizyonAlChat', {
            message: message,
            mode: mode
        }, { useMasterKey: true });
        return result;
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.10.0 YENİ] videoStudioProcess (VİDEO STÜDYO) ========
// ================================================================
Parse.Cloud.define("videoStudioProcess", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var type = request.params.type || 'story';
    var input = request.params.input;
    if (!input) throw new Error('Girdi gerekli!');

    var _rlk = 'videoStudioProcess:' + user.get('email');
    try {
        await checkRateLimit(_rlk, 10, 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) { console.warn('Rate limit uyarısı:', e.message); }

    // Job kaydı oluştur
    var job = new VideoStudioJob();
    job.set('user_email', user.get('email'));
    job.set('type', type);
    job.set('input', input);
    job.set('status', 'processing');
    job.set('created_at_client', new Date());
    await job.save(null, { useMasterKey: true });

    try {
        var prompt = '';
        var fileName = '';
        var fileFormat = 'txt';

        if (type === 'story') {
            prompt = 'Bir video senaryosu oluştur.\n\nKonu: ' + input + '\n\nFormat:\n- Başlık\n- Kısa özet (2-3 cümle)\n- Sahne sahne senaryo (her sahnede: konum, karakterler, diyalog, kamera açısı)\n- Müzik/ses önerisi\n- Toplam süre tahmini\n\nTürkçe, detaylı ve profesyonel olsun.';
            fileName = 'video-senaryo.txt';
        } else if (type === 'reels') {
            prompt = 'Şu konudan 5 farklı Instagram Reels / TikTok video fikri çıkar: "' + input + '"\n\nHer fikir için:\n- Başlık\n- 15-30 saniyelik içerik planı\n- Hook (ilk 3 saniye)\n- Hashtag önerileri\n- Hedef kitle\n\nTürkçe olsun.';
            fileName = 'reels-fikirleri.txt';
        } else if (type === 'analyze') {
            prompt = 'Şu video URL\'sini analiz et: ' + input + '\n\nAnaliz başlıkları:\n- Video başlığı ve konusu\n- Ana temalar\n- Hedef kitle\n- Anlatım tarzı\n- Güçlü/zayıf yönler\n- İzleyiciye kazandırdıkları\n- Öneriler\n\nTürkçe ve kapsamlı olsun.';
            fileName = 'video-analiz.txt';
        } else if (type === 'clip') {
            prompt = 'Video kesit analizi:\nURL: ' + input + '\n\nKesit için tavsiye ve analiz ver. Türkçe olsun.';
            fileName = 'video-kesit.txt';
        } else {
            prompt = input;
            fileName = 'video-cikti.txt';
        }

        var result = await Parse.Cloud.run('superAI', { prompt: prompt }, { useMasterKey: true });

        // Dosya olarak kaydet
        var fileContent = 'AETHRION - Video Stüdyo Çıktısı\n' + '='.repeat(50) + '\n\nTür: ' + type + '\nGirdi: ' + input + '\nTarih: ' + new Date().toLocaleString('tr-TR') + '\n\n' + '='.repeat(50) + '\n\n' + result;
        var parseFile = new Parse.File('video_' + user.id + '_' + Date.now() + '.txt', { base64: Buffer.from(fileContent, 'utf8').toString('base64') });
        await parseFile.save(null, { useMasterKey: true });

        job.set('result', result);
        job.set('download_url', parseFile.url());
        job.set('file_name', fileName);
        job.set('status', 'completed');
        await job.save(null, { useMasterKey: true });

        return {
            success: true,
            result: cleanResponse(result),
            downloadUrl: parseFile.url(),
            fileName: fileName,
            jobId: job.id
        };
    } catch (e) {
        job.set('status', 'failed');
        await job.save(null, { useMasterKey: true });
        console.error('videoStudioProcess hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.10.0 YENİ] LOGS: logError + syncClientLogs ==========
// ================================================================
Parse.Cloud.define("logError", async function (request) {
    var user = request.user;
    var level = request.params.level || 'error';
    var message = request.params.message || 'Bilinmeyen hata';
    var meta = request.params.meta || null;

    // ✅ [FIX A12] logError client'tan açıktı, spam/log-flood mümkündü — rate limit + payload sınırı eklendi.
    var _rlkLogError = 'logError:' + (user ? user.get('email') : (request.ip || request.installationId || 'anon'));
    try {
        await checkRateLimit(_rlkLogError, 20, 60 * 1000);
        await recordAttempt(_rlkLogError);
    } catch (e) {
        return { success: false, error: e.message };
    }
    if (meta && JSON.stringify(meta).length > 5000) meta = { truncated: true };

    try {
        var log = new ClientLog();
        if (user) log.set('user_email', user.get('email'));
        log.set('level', level);
        log.set('message', String(message).substring(0, 2000));
        if (meta) log.set('meta', meta);
        log.set('url', request.params.url || '');
        log.set('user_agent', request.params.userAgent || '');
        log.set('created_at_client', new Date());
        await log.save(null, { useMasterKey: true });

        // Kritik ise e-posta at
        if (level === 'critical') {
            try {
                var founderQuery = new Parse.Query(Parse.User);
                founderQuery.equalTo('role', 'founder');
                var founder = await founderQuery.first({ useMasterKey: true });
                if (founder) {
                    await sendNotificationToUser(founder, '🚨 KRİTİK HATA: ' + message, 'critical_error');
                }
            } catch (e) {}
        }
        return { success: true, logId: log.id };
    } catch (e) {
        console.error('logError hatası:', e.message);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("syncClientLogs", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var logs = request.params.logs;
    if (!Array.isArray(logs)) throw new Error('logs array gerekli!');
    if (logs.length > 50) logs = logs.slice(0, 50);

    var savedCount = 0;
    for (var i = 0; i < logs.length; i++) {
        try {
            var logData = logs[i];
            var log = new ClientLog();
            log.set('user_email', user.get('email'));
            log.set('level', logData.level || 'error');
            log.set('message', String(logData.message || '').substring(0, 2000));
            if (logData.meta) log.set('meta', logData.meta);
            log.set('url', logData.url || '');
            log.set('user_agent', logData.userAgent || '');
            log.set('created_at_client', new Date(logData.time || Date.now()));
            await log.save(null, { useMasterKey: true });
            savedCount++;
        } catch (e) {
            console.warn('Log kaydedilemedi:', e.message);
        }
    }
    return { success: true, savedCount: savedCount };
});

// ================================================================
// ===== [v7.10.0 YENİ] trackFeatureUsage (PLAN LİMİT) ==========
// ================================================================
Parse.Cloud.define("trackFeatureUsage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var feature = request.params.feature;
    var period = request.params.period || 'day';
    var count = request.params.count || 1;
    if (!feature) throw new Error('feature gerekli!');

    // Period key hesapla
    var now = new Date();
    var periodKey;
    if (period === 'month') {
        periodKey = now.getFullYear() + '-' + (now.getMonth() + 1);
    } else if (period === 'week') {
        var day = now.getDay();
        var diff = (day === 0 ? 6 : day - 1);
        var monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        periodKey = monday.toISOString().split('T')[0];
    } else if (period === 'lifetime') {
        periodKey = 'all';
    } else {
        periodKey = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    }

    try {
        var query = new Parse.Query(FeatureUsage);
        query.equalTo('user_email', user.get('email'));
        query.equalTo('feature', feature);
        query.equalTo('period', period);
        query.equalTo('period_key', periodKey);
        var usage = await query.first({ useMasterKey: true });

        if (!usage) {
            usage = new FeatureUsage();
            usage.set('user_email', user.get('email'));
            usage.set('feature', feature);
            usage.set('period', period);
            usage.set('period_key', periodKey);
            usage.set('count', count);
            usage.set('last_updated', new Date());
        } else {
            var current = usage.get('count') || 0;
            usage.set('count', current + count);
            usage.set('last_updated', new Date());
        }
        await usage.save(null, { useMasterKey: true });
        return { success: true, count: usage.get('count'), periodKey: periodKey };
    } catch (e) {
        console.error('trackFeatureUsage hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ===== [v7.10.0 YENİ] toggleVizyonPatrol / toggleVizyonSupport ==
// ================================================================
Parse.Cloud.define("toggleVizyonPatrol", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (user.get('role') !== 'founder') throw new Error('Sadece kurucu!');
    var enabled = request.params.enabled;
    if (typeof enabled !== 'boolean') throw new Error('enabled boolean gerekli!');

    try {
        var query = new Parse.Query(SystemConfig);
        query.equalTo('key', 'vizyonPatrolActive');
        var config = await query.first({ useMasterKey: true });
        if (!config) {
            config = new SystemConfig();
            config.set('key', 'vizyonPatrolActive');
        }
        config.set('value', { enabled: enabled });
        config.set('description', 'AETHRION Devriye aktif/pasif');
        config.set('updated_by', user.get('email'));
        await config.save(null, { useMasterKey: true });
        console.log('🛡️ AETHRION Devriye: ' + (enabled ? 'AÇIK' : 'KAPALI'));
        return { success: true, enabled: enabled };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("toggleVizyonSupport", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (user.get('role') !== 'founder') throw new Error('Sadece kurucu!');
    var enabled = request.params.enabled;
    if (typeof enabled !== 'boolean') throw new Error('enabled boolean gerekli!');

    try {
        var query = new Parse.Query(SystemConfig);
        query.equalTo('key', 'vizyonSupportActive');
        var config = await query.first({ useMasterKey: true });
        if (!config) {
            config = new SystemConfig();
            config.set('key', 'vizyonSupportActive');
        }
        config.set('value', { enabled: enabled });
        config.set('description', 'AETHRION Destek aktif/pasif');
        config.set('updated_by', user.get('email'));
        await config.save(null, { useMasterKey: true });
        console.log('📨 AETHRION Destek: ' + (enabled ? 'AÇIK' : 'KAPALI'));
        return { success: true, enabled: enabled };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ================================================================
// ================================================================
// BÖLÜM 1 SONU
// ================================================================
// 
// ⬇️⬇️⬇️ BURADAN BÖLÜM 2 BAŞLAYACAK ⬇️⬇️⬇️
//
// BÖLÜM 2'DE EKLENECEKLER:
// 
// 1. ADMIN GİRİŞLERİ
//    - initAdminUsers
//    - adminLogin, betaLogin, founderLogin
//    - leaveAdminRole, leaveBetaRole
//    - assignAdmin, setUserRole, setUserPlan
//    - getAdmins, getBetas, getBannedUsers, getAllUsers
//    - banUser, unbanUser, toggleUserFeature
//
// 2. FACEBOOK + PROFİL
//    - verifyFacebookToken
//    - facebookLogin
//    - completeFacebookProfile
//    - loginWithRecoveryEmail
//
// 3. KULLANICI SORGULAMA
//    - useQuery (limit kontrolü)
//
// 4. YORUMLAR
//    - getComments, addComment, deleteComment, editComment
//
// 5. ŞİFRE SIFIRLAMA
//    - sendVerificationCode, resetPasswordWithCode
//
// 6. HEDİYE & ROL
//    - sendGiftRequest, sendRoleRequest, handleRequest
//    - getInboxItems
//
// 7. TAKIM SİSTEMİ (FULL)
//    - createTeam, joinTeamWithCode, sendTeamMessage
//    - deleteTeamMessage, editTeamMessage, getTeamMessage
//    - inviteToTeam, acceptTeamInvite, rejectTeamInvite
//    - leaveTeam, getTeamMembers, makeTeamManager
//    - demoteManager, removeFromTeam, transferOwnership
//    - closeTeam, getAllTeams, searchTeams
//    - joinTeamAsFounder, forceCloseTeam, getTeamChatHistory
//
// 8. AETHRION DESTEK AI
//    - vizyonSupportAI
//    - getSupportReply, getCoachAdvice
//
// 9. AETHRION KOÇ ASİSTANI (FULL)
//    - getKocLimitForUser
//    - getCurrentWeekStart
//    - getOrCreateKocUsage
//    - kocChat, getKocHistory, getKocConversationMessages
//    - getKocUsage, resetKocUsage
//    - shareKocConversation, getSharedKocConversation
//
// 10. MODERATÖR SİSTEMİ (FULL)
//     - assignModeratorByEmail, getModerators, removeModerator
//     - createVideoClip, getVideoClips
//
// 11. GIPHY
//     - searchGif
//
// 12. ÇEVİRİ
//     - translateWithDeepL, translateWithLibre, smartTranslate
//
// 13. ÜRÜN & MAĞAZA
//     - addProduct, getProducts, buyProduct, getMyProducts
//     - getStoreItems, purchaseStoreItem
//
// 14. GÖREVLER
//     - getDailyTasks, completeDailyTask
//     - getSocialTasks, verifySocialFollow
//     - getTeamTasks, completeTeamTask
//
// 15. BİLDİRİM
//     - getNotifications, markNotificationRead, sendNotification
//
// 16. MESAJLAŞMA
//     - sendMessage, getConversations, getConversationMessages
//     - startConversation
//
// 17. GÜNLÜK SERİ (STREAK)
//     - getStreakStatus, claimDailyStreak
//     - checkStreakReminders (job)
//
// 18. AKADEMİ
//     - getCourses, getCourseDetails, completeLesson
//
// 19. ZEKA TESTİ
//     - getQuizQuestions, submitQuizAnswer
//
// 20. YARIŞMA
//     - getContestRanking, getActiveContest
//     - checkContestParticipation, joinContest
//     - createContestProject, getContestRankingV2
//     - getContestProjectsForFounder, scoreContestProject
//     - finalizeContest, runFinalizeContest
//
// 21. ANKET & DUYURU
//     - createPoll, getActivePoll, votePoll
//     - deletePoll, editPoll
//     - getAnnouncements, addAnnouncement
//     - deleteAnnouncement, editAnnouncement
//
// 22. İŞ İLANI
//     - getJobs, applyJob
//
// 23. HATA BİLDİR
//     - submitBugReport
//
// 24. CÜZDAN
//     - getWalletBalance, withdrawFunds
//
// 25. TAKİP & PROFİL
//     - toggleFollow, getProfile, searchUsers
//
// 26. EBEVEYN AYARLARI (FULL)
//     - requestParentVerification, verifyParentCode
//     - setParentPin, getParentSettings
//     - updateParentSettings, toggleParentFeature
//     - getFullParentSettings, suspendChildAccount
//     - unsuspendChildAccount, toggleLiveTracking
//     - setDailyLimit, getChildSessions
//     - sendParentReport, removeParentControl
//     - requestParentReset, confirmParentReset
//
// 27. KURUCU İLETİŞİM
//     - sendFounderMessage
//
// 28. PUAN & REFERANS
//     - getUserPoints, generateReferralCode
//     - applyReferral, getReferralLeaderboard
//
// 29. PAZAR PROJELERİ
//     - getMarketProjects, buyMarketProject
//
// 30. BLOG ABONE
//     - subscribeToBlog, subscribeToSystemUpdates
//     - getMySubscriptions, unsubscribeFrom
//     - sendBlogUpdateToSubscribers
//     - sendSystemUpdateToSubscribers
//
// 31. SAVAŞ MODU & ÇOKLU AI
//     - battleMode, multiAI
//
// 32. VİDEO ANALİZ & UYGULAMA
//     - analyzeVideo, generateReelsIdeas
//     - generateApp
//
// 33. PRO ARAÇLARI
//     - proTools
//
// 34. API ANAHTAR YÖNETİMİ
//     - saveUserApiKey, getUserApiKeys
//     - getUserApiKeyValue, deleteUserApiKey
//     - updateUserApiKey, setApiPassword, verifyApiPassword
//
// 35. A27 API ANAHTAR SİSTEMİ (FULL)
//     - getV27ApiKeyLimit, durationToMs, durationLabel
//     - generateV27KeyString, maskV27Key
//     - createV27ApiKey, getMyV27ApiKeys
//     - revokeV27ApiKey, validateV27ApiKey
//     - v27ApiChat, v27ApiRest
//
// 36. ZAMANLANMIŞ JOB'LAR (13 ADET)
//     - refreshDailyTasks
//     - refreshTeamTasks
//     - refreshSocialTasks
//     - resetDailyQueries
//     - refreshQuizQuestions
//     - refreshAcademyCourses
//     - finalizeMonthlyContest
//     - resetWeeklyKocUsage
//     - cleanExpiredPolls
//     - cleanExpiredAnnouncements
//     - checkStreakReminders
//     - cleanupRateLimitAttempts (ZATEN BÖLÜM 1'DE)
//     - vizyonPatrol (YENİ - 7/24 devriye)
//
// 37. SON LOG (v7.10.0 özet)
//
// ================================================================
// ================================================================

console.log('');
console.log('✅ BÖLÜM 1 tamamen yüklendi! (v7.10.0 Back4App)');
console.log('📌 BÖLÜM 1 İÇERİĞİ:');
console.log('   → Polyfills + Rate Limit + Fetch');
console.log('   → TÜM sınıflar (41+ sınıf, 4 YENİ)');
console.log('   → Yardımcı fonksiyonlar (getAPIKey, crypto, AES)');
console.log('   → initSchemas (TÜM sınıflar/kolonlar)');
console.log('   → Temel fonksiyonlar (test, verify, chat history)');
console.log('   → Proje işlemleri (8 fonksiyon)');
console.log('   → Proje talepleri (5 fonksiyon)');
console.log('   → Mağaza publish/remove (2 fonksiyon)');
console.log('   → Konuşma geçmişi (5 fonksiyon)');
console.log('   → 8 Bireysel AI çağrısı (Groq, DeepSeek, vb.)');
console.log('   → callLocalLlama (13 Ollama)');
console.log('   → callNvidiaNIM (7 NIM)');
console.log('   → callCustomAI + callCustomAIWithKeys');
console.log('   → superAI (21 model, 3 katman)');
console.log('   → webSearch + sendEmail');
console.log('   → getSiteInfoForVizyonAl');
console.log('   → vizyonAlChat (4 mod) + DeepThink + Agent + Developer');
console.log('   → vizyonAlScreenRead + vizyonAlLiveScreenStream');
console.log('   → [YENİ] vizyonAlFileAnalyze');
console.log('   → [YENİ] vizyonAlFileCreate');
console.log('   → [YENİ] vizyonAlVoiceChat');
console.log('   → [YENİ] videoStudioProcess');
console.log('   → [YENİ] logError + syncClientLogs');
console.log('   → [YENİ] trackFeatureUsage');
console.log('   → [YENİ] getUserProjectCount');
console.log('   → [YENİ] toggleVizyonPatrol + toggleVizyonSupport');
console.log('');
console.log('⏸️  BÖLÜM 2 İÇİN "devam" YAZ → 160+ cloud function, 13 job, final log');
console.log('');
console.log('🇹🇷 AETHRION v7.10.0 — BÖLÜM 1 AKTİF (Back4App)');

// ================================================================
// ================================================================
// BÖLÜM 2 BAŞLANGICI
// ================================================================
// ADMIN GİRİŞLERİ + FACEBOOK + TAKIM FULL + KOÇ FULL + V27 API FULL
// + MODERATÖR + EBEVEYN + YARIŞMA + ANKET + BLOG + TÜM JOB'LAR
// ================================================================

// ================================================================
// ========== ADMİN KULLANICILARI OLUŞTUR =========================
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
            throw new Error('Bu işlem için yetkiniz yok!');
        }
    }
    try {
        // FOUNDER
        var founderEmail = await getPrivateFounderEmail();
        var query = new Parse.Query(Parse.User);
        query.equalTo('username', founderEmail);
        var existing = await query.first({ useMasterKey: true });
        if (!existing) {
            var founderPass = await getPrivateFounderPass();
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
            admin0.set('points', 0);
            admin0.set('level', 'Çaylak');
            admin0.set('referral_code', 'V27-EYME-1144');
            await admin0.save(null, { useMasterKey: true });
        }

        // IBRAHIM ADMIN
        var ibrahimEmail = 'iy5971828@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', ibrahimEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
          var ibrahimPass = await getAPIKey('ADMIN_IBRAHIM_PASS');
          // ✅ [FIX A10/C1] Config'de yoksa artık hata fırlatıp tüm initAdminUsers'ı
          // durdurmuyor — sadece bu admini atlıyor, founder ilk kurulumda yine oluşur.
          if (!ibrahimPass) {
            console.warn('⚠️ ADMIN_IBRAHIM_PASS tanımlı değil, bu admin atlandı.');
          } else {
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
            admin1.set('points', 0);
            admin1.set('level', 'Çaylak');
            await admin1.save(null, { useMasterKey: true });
          }
        }

        // BOZKURT ADMIN
        var bozkurtEmail = 'itaner686@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', bozkurtEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
          var bozkurtPass = await getAPIKey('ADMIN_BOZKURT_PASS');
          // ✅ [FIX A10/C1] eksikse atla, tüm fonksiyonu durdurma.
          if (!bozkurtPass) {
            console.warn('⚠️ ADMIN_BOZKURT_PASS tanımlı değil, bu admin atlandı.');
          } else {
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
            admin2.set('points', 0);
            admin2.set('level', 'Çaylak');
            await admin2.save(null, { useMasterKey: true });
          }
        }

        // EYMEN BETA
        var eymenBetaEmail = 'o2059497@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', eymenBetaEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
          var betaPass = await getAPIKey('BETA_OMER_PASS');
          // ✅ [FIX A10/C1] eksikse atla, tüm fonksiyonu durdurma.
          if (!betaPass) {
            console.warn('⚠️ BETA_OMER_PASS tanımlı değil, bu beta kullanıcı atlandı.');
          } else {
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
            beta1.set('points', 0);
            beta1.set('level', 'Çaylak');
            await beta1.save(null, { useMasterKey: true });
          }
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
// ========== ADMIN / BETA / FOUNDER GİRİŞ ========================
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

    var founderEmail = await getPrivateFounderEmail();
    var correctPass = await getPrivateFounderPass();
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
// ========== FACEBOOK LOGIN + PROFİL ============================
// ================================================================
Parse.Cloud.define("verifyFacebookToken", async function (request) {
    var accessToken = request.params.accessToken;
    var userID = request.params.userID;
    if (!accessToken || !userID) throw new Error('Access token ve user ID gerekli!');

    try {
        var graphUrl = 'https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + accessToken;
        var res = await _aethrionAuthFetch(graphUrl, 12000);
        var data = await res.json();
        if (data.error) return { success: false, error: 'Facebook token doğrulanamadı: ' + data.error.message };
        if (data.id !== userID) return { success: false, error: 'Facebook ID uyuşmuyor!' };
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
    if (!accessToken || !userID) throw new Error('Access token ve user ID gerekli!');

    var _rlk = 'facebookLogin:' + String(userID);
    await checkRateLimit(_rlk, 10, 5 * 60 * 1000);
    await recordAttempt(_rlk);

    var graphUrl = 'https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + accessToken;
    var res, data;
    try {
        res = await _aethrionAuthFetch(graphUrl, 12000);
        data = await res.json();
    } catch (e) {
        throw new Error('Facebook bağlantı hatası: ' + e.message);
    }

    if (data.error) throw new Error('Facebook token doğrulanamadı: ' + data.error.message);
    if (data.id !== userID) throw new Error('Facebook ID uyuşmuyor!');

    var user;
    var wasNewUser = false;
    try {
        // Check the provider identity first, then detect collisions by email/username.
        // Never let Parse attempt an implicit duplicate-user creation and surface its
        // generic "Account already exists for this username" error to the user.
        var existingQuery = new Parse.Query(Parse.User);
        existingQuery.equalTo('authData.facebook.id', data.id);
        var existing = await existingQuery.first({ useMasterKey: true });
        if (!existing) {
            var collision = null;
            var normalizedFacebookEmail = String(data.email || '').trim().toLowerCase();
            if (normalizedFacebookEmail) {
                var emailQuery = new Parse.Query(Parse.User);
                emailQuery.equalTo('email', normalizedFacebookEmail);
                collision = await emailQuery.first({ useMasterKey: true });
                if (!collision) {
                    var usernameEmailQuery = new Parse.Query(Parse.User);
                    usernameEmailQuery.equalTo('username', normalizedFacebookEmail);
                    collision = await usernameEmailQuery.first({ useMasterKey: true });
                }
            }
            if (!collision) {
                var usernameQuery = new Parse.Query(Parse.User);
                usernameQuery.equalTo('username', String(data.name || '').trim());
                if (String(data.name || '').trim()) collision = await usernameQuery.first({ useMasterKey: true });
            }
            if (collision) {
                throw new Error('Bu bilgilerle eşleşen bir AETHRION hesabı zaten var. Güvenlik için önce mevcut hesabınıza e-posta/şifre ile giriş yapın; ardından Ayarlar > Güvenlik ve Gizlilik bölümünden Facebook hesabınızı bağlayın.');
            }
            wasNewUser = true;
        }

        user = await Parse.User.logInWith('facebook', {
            authData: { id: data.id, access_token: accessToken }
        });
    } catch (e) {
        console.error('❌ facebookLogin logInWith hatası:', e.message);
        throw new Error('Facebook girişi başarısız: ' + e.message);
    }

    if (!user) throw new Error('Facebook kullanıcısı oluşturulamadı!');
    if (user.get('isBanned')) throw new Error('Hesabınız yasaklanmıştır!');

    var isNewUser = wasNewUser;
    if (!user.get('name') && data.name) { user.set('name', data.name); isNewUser = true; }
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
        if (user.get('profile_completed') === undefined) user.set('profile_completed', false);
        if (user.get('is_facebook_user') === undefined) user.set('is_facebook_user', true);
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

    // ✅ [v7.10.1 YENİ] Sözleşme ve Gizlilik onayını kaydet
    var termsAccepted = request.params.termsAccepted === true;
    var privacyAccepted = request.params.privacyAccepted === true;

    if (termsAccepted && privacyAccepted) {
        user.set('terms_accepted', true);
        user.set('privacy_accepted', true);
        user.set('terms_accepted_at', new Date());
        console.log('✅ FB kullanıcısı sözleşme onayı kaydedildi:', user.get('email'));
    } else {
        console.warn('⚠️ FB giriş: Sözleşme onayı eksik olabilir. termsAccepted:', termsAccepted, 'privacyAccepted:', privacyAccepted);
    }

    // ✅ [FIX] Bu blok daha önce yanlışlıkla 2 kere yazılmıştı (gereksiz çift kayıt) — tekilleştirildi.
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
// ========== [FIX A4] PROFİL TAMAMLAMA ORTAK ÇEKİRDEK ============
// (Facebook + Google için ortak mantık — email/username de güncellenir)
// ================================================================
async function _completeSocialProfileCore(user, params, providerLabel) {
    var name = params.name;
    var password = params.password;
    var recoveryEmail = params.recoveryEmail;

    if (!name || name.trim().length < 2) throw new Error('Ad en az 2 karakter olmalı.');
    if (!password || password.length < 8) throw new Error('Şifre en az 8 karakter olmalı.');
    if (!recoveryEmail) throw new Error('Kurtarma maili gerekli.');

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) throw new Error('Geçerli bir e-posta adresi girin.');

    var normalizedRecovery = recoveryEmail.toLowerCase();

    var dupQuery = new Parse.Query(Parse.User);
    dupQuery.equalTo('recovery_email', normalizedRecovery);
    dupQuery.notEqualTo('objectId', user.id);
    var dup = await dupQuery.first({ useMasterKey: true });
    if (dup) throw new Error('Bu kurtarma maili başka bir hesap tarafından kullanılıyor.');

    // ✅ [FIX A4] email/username boşsa (sağlayıcı email paylaşmadıysa) artık
    // kurtarma maili ile doldurulur. Zaten dolu bir email/username ASLA
    // ezilmez — mevcut giriş yöntemi bozulmasın diye (bkz. emir dosyası
    // Bölüm 5 / madde 4 uyarısı).
    var emailUpdated = false;
    if (!user.get('email')) {
        var emailDupQuery = new Parse.Query(Parse.User);
        emailDupQuery.equalTo('username', normalizedRecovery);
        emailDupQuery.notEqualTo('objectId', user.id);
        var emailDup = await emailDupQuery.first({ useMasterKey: true });
        if (!emailDup) {
            user.set('email', normalizedRecovery);
            user.set('username', normalizedRecovery);
            emailUpdated = true;
        } else {
            console.warn('⚠️ ' + providerLabel + ' profil tamamlama: kurtarma maili username olarak da kullanılmak istendi ama zaten dolu, atlandı.');
        }
    }

    user.set('password', password);
    user.set('name', name.trim());
    user.set('recovery_email', normalizedRecovery);
    user.set('profile_completed', true);
    user.set('password_set', true);
    user.set('profile_completed_at', new Date());

    await user.save(null, { useMasterKey: true });
    console.log('✅ Profil tamamlandı (' + providerLabel + '):', user.get('email'), '→', normalizedRecovery, emailUpdated ? '(email/username de dolduruldu)' : '');

    try {
        await Parse.Cloud.run('sendEmail', {
            to: normalizedRecovery,
            subject: 'AETHRION - Kurtarma Maili Kaydı',
            html: '<h3>📧 Kurtarma Maili Kaydınız</h3>' +
                  '<p>Sayın ' + name + ',</p>' +
                  '<p>Bu mail adresi <strong>AETHRION</strong> hesabınız için kurtarma maili olarak kaydedilmiştir.</p>' +
                  '<p>' + providerLabel + ' hesabınızla giriş yapamazsanız, bu mail adresi ve belirlediğiniz şifre ile hesabınıza giriş yapabilirsiniz.</p>' +
                  '<p>AETHRION Ekibi</p>'
        }, { useMasterKey: true });
    } catch (mailErr) {
        console.warn('Bilgilendirme maili gönderilemedi:', mailErr.message);
    }

    return {
        success: true,
        message: 'Hesabınız başarıyla tamamlandı!',
        recovery_email: normalizedRecovery,
        email: user.get('email')
    };
}

Parse.Cloud.define("completeFacebookProfile", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var _rlk = 'completeFacebookProfile:' + user.id;
    await checkRateLimit(_rlk, 5, 10 * 60 * 1000);
    await recordAttempt(_rlk);

    try {
        return await _completeSocialProfileCore(user, request.params, 'Facebook');
    } catch (e) {
        console.error('completeFacebookProfile hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ✅ [YENİ] completeGoogleProfile — completeFacebookProfile'ın Google versiyonu
Parse.Cloud.define("completeGoogleProfile", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var _rlk = 'completeGoogleProfile:' + user.id;
    await checkRateLimit(_rlk, 5, 10 * 60 * 1000);
    await recordAttempt(_rlk);

    try {
        return await _completeSocialProfileCore(user, request.params, 'Google');
    } catch (e) {
        console.error('completeGoogleProfile hatası:', e.message);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("loginWithRecoveryEmail", async function (request) {
    var recoveryEmail = request.params.recoveryEmail;
    var password = request.params.password;
    if (!recoveryEmail || !password) throw new Error('E-posta ve şifre gerekli.');

    var _rlk = 'loginWithRecoveryEmail:' + recoveryEmail.toLowerCase();
    await checkRateLimit(_rlk, 5, 5 * 60 * 1000);
    await recordAttempt(_rlk);

    try {
        var query = new Parse.Query(Parse.User);
        query.equalTo('recovery_email', recoveryEmail.toLowerCase());
        var user = await query.first({ useMasterKey: true });
        if (!user) throw new Error('Bu kurtarma maili ile kayıtlı bir hesap bulunamadı.');
        if (user.get('isBanned')) throw new Error('Hesabınız yasaklanmıştır!');

        var loginEmail = user.get('email') || user.get('username');
        if (!loginEmail) throw new Error('Kullanıcı hesabı bozuk (email yok).');

        var loggedInUser;
        try {
            loggedInUser = await Parse.User.logIn(loginEmail, password);
        } catch (loginErr) {
            console.error('Recovery login başarısız:', loginErr.message);
            throw new Error('Şifre yanlış!');
        }
        if (!loggedInUser) throw new Error('Giriş yapılamadı.');

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
// ========== SORGU LİMİTİ ========================================
// ================================================================
Parse.Cloud.define("useQuery", async function (request) {
    var user = request.user;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    var limit = 25;
    var remaining;

    if (user) {
        var query = new Parse.Query(QueryStat);
        query.equalTo("user_email", user.get('email'));
        query.greaterThanOrEqualTo("date", today);
        query.lessThan("date", tomorrow);
        var stats = await query.first({ useMasterKey: true });
        if (!stats) {
            stats = new QueryStat();
            stats.set("user_email", user.get('email'));
            stats.set("date", today);
            stats.set("count", 0);
        }
        var role = user.get('role');
        var plan = user.get('plan');
        if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) !== -1 || plan === 'team') limit = Infinity;
        else if (plan === 'pro') limit = 2000;
        else limit = 100;

        if (stats.get("count") >= limit) throw new Error('Sorgu hakkınız doldu!');
        stats.increment("count");
        await stats.save(null, { useMasterKey: true });
        remaining = limit === Infinity ? 'Sınırsız' : (limit - stats.get("count"));
        return { remaining: remaining, limit: limit, isMember: true };
    } else {
        var visitorIdentity = String((request && request.ip) || (request && request.installationId) || '').trim();
        if (!visitorIdentity) throw new Error('Ziyaretçi kimliği doğrulanamadı. Lütfen tekrar deneyin.');
        var visitorCrypto = require('crypto');
        var visitorHash = visitorCrypto.createHash('sha256').update(visitorIdentity).digest('hex').substring(0, 32);
        var visitorKey = 'visitor_' + today.toISOString().split('T')[0] + '_' + visitorHash;
        var query2 = new Parse.Query(QueryStat);
        query2.equalTo("visitorKey", visitorKey);
        query2.greaterThanOrEqualTo("date", today);
        query2.lessThan("date", tomorrow);
        var stats2 = await query2.first({ useMasterKey: true });
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
// ========== YORUM SİSTEMİ =======================================
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
    if (comment.get('user_email') !== user.get('email') && ['admin', 'founder', 'moderator'].indexOf(user.get('role')) === -1) {
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
    if (comment.get('user_email') !== user.get('email') && ['admin', 'founder', 'moderator'].indexOf(user.get('role')) === -1) {
        throw new Error('Yetkiniz yok!');
    }
    comment.set('comment', filterText(newText.trim()));
    if (newRating !== undefined) comment.set('rating', Math.min(5, Math.max(0, newRating)));
    await comment.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== ŞİFRE SIFIRLAMA =====================================
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
        '<p>Bu kod 15 dakika geçerlidir.</p><p>AETHRION Ekibi</p>';
    var result = await Parse.Cloud.run("sendEmail", { to: email, subject: "Şifre Sıfırlama Kodu - AETHRION", html: html }, { useMasterKey: true });
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
// ========== HEDİYE VE ROL TEKLİFLERİ ============================
// ================================================================
Parse.Cloud.define("sendGiftRequest", async function (request) {
    var sender = request.user;
    if (!sender) throw new Error('Giriş yapmalısınız!');
    if (['admin', 'founder', 'moderator'].indexOf(sender.get('role')) === -1) throw new Error('Yetkiniz yok!');

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
    if (['beta', 'admin', 'moderator'].indexOf(role) === -1) throw new Error('Geçersiz rol!');
    if (role === 'admin' && sender.get('role') !== 'founder') throw new Error('Admin atama yetkisi sadece kurucuya aittir!');

    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var receiver = await query.first({ useMasterKey: true });
    if (!receiver) throw new Error('Kullanıcı bulunamadı!');

    var requestId = Math.random().toString(36).substring(2, 15);
    var roleLabel = role === 'admin' ? '⚙️ Admin' : (role === 'moderator' ? '🎨 Moderatör' : '🔬 Beta Tester');

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
// ========== TAKIM SİSTEMİ (FULL) ================================
// ================================================================
Parse.Cloud.define("createTeam", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız.');
    var name = request.params.name;
    if (!name) throw new Error('Takım adı gerekli.');

    var role = user.get('role');
    var plan = user.get('plan');
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
    member.set("user_name", user.get('name') || 'Kullanıcı');
    member.set("role", "admin");
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
    member.set("user_name", user.get('name') || 'Kullanıcı');
    member.set("role", "viewer");
    await member.save(null, { useMasterKey: true });

    user.set("teamId", team.id);
    await user.save(null, { useMasterKey: true });

    return { success: true, teamId: team.id };
});

// ✅ [v7.10.0 FIX] sendTeamMessage — AETHRION AI/DESTEK takım sohbeti FIX
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
    var senderRole = String(member.get('role') || 'viewer').toLowerCase();
    var senderIsTeamAdmin = team.get('owner_email') === user.get('email') || team.get('manager_email') === user.get('email') || user.get('role') === 'founder' || user.get('role') === 'admin' || senderRole === 'admin';
    if (senderRole === 'viewer' && !senderIsTeamAdmin) throw new Error('Görüntüleyici rolü mesaj gönderemez veya dosya paylaşamaz.');

    var isVizyonCommand = false;
    var isSupportCommand = false;
    var isOfflineCommand = false;
    var isV27Command = false;
    var command = message || '';
    var lowerCommand = command.toLowerCase();

    // Offline tetikleyiciler
    var offlineTriggers = ['@aethrion destek the offline', '@aethrion ai the offline', '@vizyondestektheoffline', '@vizyonaltheoffline', 'aethrion ai the offline', 'aethrion destek the offline', 'vizyonal the offline', 'vizyondestek the offline'];
    for (var oi = 0; oi < offlineTriggers.length; oi++) {
        if (lowerCommand.indexOf(offlineTriggers[oi]) !== -1) { isOfflineCommand = true; break; }
    }

    if (!isOfflineCommand) {
        // A27 API tetikleyiciler
        var v27Triggers = ['@a27', 'a27 api', 'aethrion api', '@v27', 'v27 api', 'vizyon api'];
        for (var v27i = 0; v27i < v27Triggers.length; v27i++) {
            if (lowerCommand.indexOf(v27Triggers[v27i]) !== -1) {
                isV27Command = true;
                command = command.replace(new RegExp(v27Triggers[v27i], 'gi'), '').trim();
                break;
            }
        }

        // AETHRION AI tetikleyiciler
        var aiTriggers = ['@aethrion ai', '@aethrion', '@jarvis', '@vizyonal', 'vizyon al', 'vizyonal'];
        for (var ai = 0; ai < aiTriggers.length; ai++) {
            if (lowerCommand.indexOf(aiTriggers[ai]) !== -1) {
                isVizyonCommand = true;
                command = command.replace(new RegExp(aiTriggers[ai].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                break;
            }
        }

        // AETHRION Destek tetikleyiciler
        var supportTriggers = ['@aethrion destek', 'aethrion destek', '@vizyondestek', 'vizyon destek', 'vizyondetsek', 'vizyondestek'];
        for (var si = 0; si < supportTriggers.length; si++) {
            if (lowerCommand.indexOf(supportTriggers[si]) !== -1) {
                isSupportCommand = true;
                command = command.replace(new RegExp(supportTriggers[si].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                break;
            }
        }
    }

    // ✅ [v7.10.0 FIX] ÖNCE kullanıcının mesajını KAYDET (komut olsa bile)
    if (message && !isOfflineCommand) {
        var userMsg = new TeamMessage();
        userMsg.set("team_id", teamId);
        userMsg.set("user_email", user.get('email'));
        userMsg.set("user_name", user.get('name') || user.get('username') || 'Kullanıcı');
        userMsg.set("message", filterText(message));
        userMsg.set("deleted", false);
        userMsg.set("deleted_by_founder", false);
        userMsg.set("edited", false);
        if (fileUrl) {
            userMsg.set("fileUrl", fileUrl);
            userMsg.set("fileName", fileName || 'Dosya');
            userMsg.set("fileType", fileType || 'unknown');
        }
        await userMsg.save(null, { useMasterKey: true });
        console.log('💾 Takım kullanıcı mesajı kaydedildi:', userMsg.id);
    }

    // OFFLINE
    if (isOfflineCommand) {
        var msgOff = new TeamMessage();
        msgOff.set("team_id", teamId);
        msgOff.set("user_email", 'system@vizyon2027.com');
        msgOff.set("user_name", '🧠 AETHRION AI');
        msgOff.set("message", '🧠 AETHRION AI: Anladım, sohbetten ayrılıyorum. Beni tekrar çağırmak için @AETHRION AI veya @AETHRION DESTEK yazabilirsiniz. 👋');
        msgOff.set("deleted", false);
        msgOff.set("deleted_by_founder", false);
        msgOff.set("edited", false);
        await msgOff.save(null, { useMasterKey: true });
        return { success: true };
    }

    // A27 API KOMUTU
    if (isV27Command) {
        var msgV27 = new TeamMessage();
        msgV27.set("team_id", teamId);
        msgV27.set("user_email", 'system@vizyon2027.com');
        msgV27.set("user_name", '🔑 A27 API DESTEK');
        msgV27.set("message", '🔑 **A27 API Anahtarı Bilgisi**\n\n' +
            'A27 API anahtarı oluşturmak için:\n' +
            '1. Dashboard\'a gidin\n' +
            '2. "AETHRION Yapay Zekasının API Anahtarı" bölümünü bulun\n' +
            '3. "Anahtarını Al" butonuna tıklayın\n' +
            '4. Anahtar adı ve süre seçin\n' +
            '5. Anahtarınızı kopyalayıp güvenli bir yere kaydedin\n\n' +
            '**Limitler:**\n' +
            '• Kurucu/Admin/Beta/Moderatör: Sınırsız\n' +
            '• Takım Paketi: 100 anahtar\n' +
            '• Pro Paket: 20 anahtar\n' +
            '• Ücretsiz Üye: 2 anahtar\n\n' +
            'Anahtarınızı V27_API_KEY başlığı ile kullanabilirsiniz.');
        msgV27.set("deleted", false);
        msgV27.set("deleted_by_founder", false);
        msgV27.set("edited", false);
        await msgV27.save(null, { useMasterKey: true });
        return { success: true };
    }

    // AETHRION AI / DESTEK
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
            if (command.toLowerCase().indexOf(greetingWords[gi]) !== -1) { isGreeting = true; break; }
        }

        if (isSupportCommand) {
            try {
                var classificationPrompt = 'Aşağıdaki kullanıcı mesajı AETHRION sitesi hakkında YARDIM, DESTEK, ŞİKAYET, ÖNERİ, veya SİTE BİLGİSİ sorusu mu, yoksa GENEL bir soru mu?\n\n' +
                    'Mesaj: "' + command + '"\n\n' +
                    'Cevabın SADECE şu iki kelimeden birini içermeli: "DESTEK" veya "GENEL"\n' +
                    'Açıklama yapma. Sadece tek kelime yaz.';

                var classification = await Parse.Cloud.run('superAI', { prompt: classificationPrompt }, { useMasterKey: true });
                var isSupportRelated = false;
                if (classification && classification.toUpperCase().indexOf('DESTEK') !== -1) isSupportRelated = true;

                if (isGreeting) {
                    var msgGreet = new TeamMessage();
                    msgGreet.set("team_id", teamId);
                    msgGreet.set("user_email", 'system@vizyon2027.com');
                    msgGreet.set("user_name", '🧠 AETHRION DESTEK');
                    msgGreet.set("message", '🧠 AETHRION DESTEK: Merhaba! Ben AETHRION Destek. Size nasıl yardımcı olabilirim?');
                    await msgGreet.save(null, { useMasterKey: true });
                    return { success: true };
                }

                if (!isSupportRelated) {
                    var msgNoSupport = new TeamMessage();
                    msgNoSupport.set("team_id", teamId);
                    msgNoSupport.set("user_email", 'system@vizyon2027.com');
                    msgNoSupport.set("user_name", '🧠 AETHRION DESTEK');
                    msgNoSupport.set("message", '🧠 AETHRION DESTEK: Bu konuda yetkim yok. Ben sadece AETHRION sitesi hakkında yardım, destek, şikayet ve öneriler için buradayım. Diğer konular için lütfen @AETHRION AI yazarak tekrar sorun. 🙏');
                    await msgNoSupport.save(null, { useMasterKey: true });
                    return { success: true };
                }

                var siteContent = await getSiteContent();
                var supportPrompt = 'Sen AETHRION DESTEK\'sin. Görevin: SADECE AETHRION sitesi hakkında yardım, destek, şikayet, öneri ve site bilgisi sorularına cevap vermek.\n\n' +
                    'Kullanıcı sorusu: "' + command + '"\n\n' +
                    'AETHRION sitesi hakkında bilgi: ' + siteContent.substring(0, 2000) + '\n\n' +
                    'Kurallar:\n' +
                    '- Kısa, net ve DIRECT cevap ver. Uzatma.\n' +
                    '- "Vizyon Destek:" diye başlama, doğrudan cevabı yaz.\n' +
                    '- Resmi ve saygılı ol.\n' +
                    '- Cevabın 3 cümleyi geçmesin.';

                var result = await Parse.Cloud.run('superAI', { prompt: supportPrompt }, { useMasterKey: true });
                var reply = result || 'Bu konuda size yardımcı olamıyorum.';

                var msgSupport = new TeamMessage();
                msgSupport.set("team_id", teamId);
                msgSupport.set("user_email", 'system@vizyon2027.com');
                msgSupport.set("user_name", '🧠 AETHRION DESTEK');
                msgSupport.set("message", '🧠 AETHRION DESTEK: ' + reply);
                await msgSupport.save(null, { useMasterKey: true });
                return { success: true };
            } catch (e) {
                console.error('Vizyon Destek hatası:', e);
                var msgErr = new TeamMessage();
                msgErr.set("team_id", teamId);
                msgErr.set("user_email", 'system@vizyon2027.com');
                msgErr.set("user_name", '🧠 AETHRION DESTEK');
                msgErr.set("message", '🧠 AETHRION DESTEK: Şu anda teknik bir sorun nedeniyle cevap veremiyorum.');
                await msgErr.save(null, { useMasterKey: true });
                return { success: true };
            }
        }

        if (isVizyonCommand) {
            var aiPrompt = '';
            if (isGreeting) {
                aiPrompt = 'Kullanıcı selam veriyor: "' + command + '". Sen AETHRION AI\'sın. Nazik ve samimi bir selam ver.';
            } else {
                aiPrompt = 'Kullanıcı sorusu: "' + command + '". Sen AETHRION AI\'sın. Sohbet geçmişi: ' + context + ' Soruyu detaylı ve anlaşılır bir şekilde cevapla. Cevabın "AETHRION AI:" diye başlamasın.';
            }
            try {
                var result2 = await Parse.Cloud.run('superAI', { prompt: aiPrompt }, { useMasterKey: true });
                var reply2 = result2 || 'AETHRION AI olarak size yardımcı olmaktan mutluluk duyarım.';

                var msgAI = new TeamMessage();
                msgAI.set("team_id", teamId);
                msgAI.set("user_email", 'system@vizyon2027.com');
                msgAI.set("user_name", '🧠 AETHRION AI');
                msgAI.set("message", '🧠 AETHRION AI: ' + reply2);
                await msgAI.save(null, { useMasterKey: true });
                return { success: true };
            } catch (e) {
                console.error('AETHRION AI hatası:', e);
                var msgAIErr = new TeamMessage();
                msgAIErr.set("team_id", teamId);
                msgAIErr.set("user_email", 'system@vizyon2027.com');
                msgAIErr.set("user_name", '🧠 AETHRION AI');
                msgAIErr.set("message", '🧠 AETHRION AI: Üzgünüm, şu anda size cevap veremiyorum.');
                await msgAIErr.save(null, { useMasterKey: true });
                return { success: true };
            }
        }
    }

    await _aeWriteTeamAudit(user, teamId, 'comment_added', '', fileUrl ? 'Takım dosyası/mesajı' : 'Takım mesajı');
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
    var isVizyonFounder = String(user.get('email') || '').toLowerCase() === String(await getPrivateFounderEmail()).toLowerCase();
    var deleteMemberQuery = new Parse.Query(TeamMember);
    deleteMemberQuery.equalTo('team_id', teamId);
    deleteMemberQuery.equalTo('user_email', user.get('email'));
    var deleteMember = await deleteMemberQuery.first({ useMasterKey: true });
    var deleteRole = String(deleteMember && deleteMember.get('role') || 'viewer').toLowerCase();
    var isTeamAdmin = deleteRole === 'admin';
    if (!deleteMember && !isOwner && !isManager && !isFounder && !isModerator) throw new Error('Bu takımın üyesi değilsiniz!');
    if (deleteRole === 'viewer' && !isOwner && !isManager && !isFounder && !isModerator) throw new Error('Görüntüleyici rolü mesaj silemez.');

    if (!isMyMessage && !isOwner && !isManager && !isFounder && !isModerator && !isTeamAdmin) throw new Error('Bu mesajı silme yetkiniz yok!');
    if (msg.get('user_email') === 'system@vizyon2027.com' && !isVizyonFounder) throw new Error('Sistem mesajlarını sadece kurucu silebilir!');

    msg.set('deleted', true);
    msg.set('deleted_by', user.get('email'));
    msg.set('deleted_at', new Date());
    if (isVizyonFounder && !isMyMessage) msg.set('deleted_by_founder', true);
    await msg.save(null, { useMasterKey: true });

    await _aeWriteTeamAudit(user, teamId, 'comment_deleted', msgId, 'Takım mesajı');
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
    var teamIdForEdit = msg.get('team_id');
    var editMemberQuery = new Parse.Query(TeamMember);
    editMemberQuery.equalTo('team_id', teamIdForEdit);
    editMemberQuery.equalTo('user_email', user.get('email'));
    var editMember = await editMemberQuery.first({ useMasterKey: true });
    if (!editMember) throw new Error('Bu takımın üyesi değilsiniz!');
    var editRole = String(editMember.get('role') || 'viewer').toLowerCase();
    var editTeam = await new Parse.Query(Team).get(teamIdForEdit, { useMasterKey: true });
    var editIsTeamAdmin = !!(editTeam && (editTeam.get('owner_email') === user.get('email') || editTeam.get('manager_email') === user.get('email'))) || user.get('role') === 'founder' || user.get('role') === 'admin' || editRole === 'admin';
    if (editRole === 'viewer' && !editIsTeamAdmin) throw new Error('Görüntüleyici rolü mesaj düzenleyemez.');
    if (msg.get('user_email') !== user.get('email') && !editIsTeamAdmin) throw new Error('Sadece kendi mesajınızı düzenleyebilir veya takım admini olarak işlem yapabilirsiniz!');

    msg.set('message', filterText(newMessage.trim()));
    msg.set('edited', true);
    msg.set('edited_at', new Date());
    await msg.save(null, { useMasterKey: true });

    await _aeWriteTeamAudit(user, teamIdForEdit, 'comment_updated', msgId, 'Takım mesajı');
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
    var inviteMemberQuery = new Parse.Query(TeamMember);
    inviteMemberQuery.equalTo('team_id', teamId);
    inviteMemberQuery.equalTo('user_email', user.get('email'));
    var inviteMember = await inviteMemberQuery.first({ useMasterKey: true });
    var inviteRole = String(inviteMember && inviteMember.get('role') || 'viewer').toLowerCase();
    var invitePrivileged = user.get('role') === 'founder' || user.get('role') === 'admin' || team.get('owner_email') === user.get('email') || team.get('manager_email') === user.get('email') || inviteRole === 'admin';
    if (!invitePrivileged) throw new Error('Yalnızca takım admini, sahibi veya yöneticisi davet gönderebilir.');

    var inbox = new Inbox();
    inbox.set("sender_email", user.get('email'));
    inbox.set("receiver_email", email);
    inbox.set("type", "team_invite");
    inbox.set("team_id", teamId);
    inbox.set("team_name", team.get('name'));
    inbox.set("status", "pending");
    inbox.set("message", user.get('name') + ' sizi "' + team.get('name') + '" takımına davet etti!');
    await inbox.save(null, { useMasterKey: true });
    await _aeWriteTeamAudit(user, teamId, 'team_invite_sent', '', 'Takım daveti');
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
    member.set("user_name", user.get('name') || 'Kullanıcı');
    member.set("role", "viewer");
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
    if (team.get('owner_email') === user.get('email')) throw new Error('Takım sahibi ayrılamaz.');

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

    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');

    var isOwner = team.get('owner_email') === user.get('email');
    var isManager = team.get('manager_email') === user.get('email') && !isOwner;
    var isFounder = user.get('role') === 'founder';
    var isModerator = user.get('role') === 'moderator';
    var removeActorQuery = new Parse.Query(TeamMember);
    removeActorQuery.equalTo('team_id', teamId);
    removeActorQuery.equalTo('user_email', user.get('email'));
    var removeActor = await removeActorQuery.first({ useMasterKey: true });
    var isTeamAdmin = !!(removeActor && String(removeActor.get('role') || '').toLowerCase() === 'admin');

    if (!isOwner && !isManager && !isFounder && !isModerator && !isTeamAdmin) throw new Error('Sadece takım sahibi, yöneticisi veya takım admini üye atabilir!');

    var memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    var member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error('Bu kullanıcı takımda değil!');
    if (targetEmail === team.get('owner_email')) throw new Error('Takım sahibi atılamaz!');

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
    await _aeWriteTeamAudit(user, teamId, 'member_removed', '', 'Takım üyesi kaldırıldı');
    return { success: true, message: targetEmail + ' takımdan atıldı!' };
});

Parse.Cloud.define("transferOwnership", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');
    var teamId = user.get('teamId');

    var teamQuery = new Parse.Query(Team);
    var team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error('Takım bulunamadı!');
    if (team.get('owner_email') !== user.get('email')) throw new Error('Sadece takım sahibi devredebilir!');

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
    return { success: true, message: 'Sahiplik devredildi.' };
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
        inbox.set("message", '🚫 ' + team.get('name') + ' (' + team.get('teamCode') + ') takımı kapatıldı.');
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
    if (!user || ['founder', 'moderator', 'admin'].indexOf(user.get('role')) === -1) throw new Error('Sadece kurucu/moderatör/admin görebilir!');

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
    if (!user || ['founder', 'moderator', 'admin'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
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
        member.set("user_name", user.get('name') || 'Kurucu');
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
        inbox.set("message", '🚫 ' + team.get('name') + ' takımı Vizyon Kurucu tarafından kapatıldı.');
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
    if (['founder', 'moderator', 'admin'].indexOf(user.get('role')) === -1) throw new Error('Sadece yetkili görebilir!');

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
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu!');

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
// ========== AETHRION DESTEK AI ====================================
// ================================================================
Parse.Cloud.define("vizyonSupportAI", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params.message;
    if (!message) throw new Error('Mesaj gerekli!');

    // KURUCU ÖZEL KOMUTLAR
    if (user.get('email').toLowerCase() === String(await getPrivateFounderEmail()).toLowerCase()) {
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
                } else response = '📭 Hiç kullanıcı bulunamadı.';
            } catch (e) { response = '❌ Hata: ' + e.message; }
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
                } else response = '📭 Hiç takım bulunamadı.';
            } catch (e) { response = '❌ Hata: ' + e.message; }
        }

        var matchTeamHistory = lower.match(/takım (?:sohbet|mesajları?nı?|geçmişini?) (?:göster|oku|getir|ver)\s+(\w+)/);
        if (matchTeamHistory) {
            var teamCodeOrId = matchTeamHistory[1];
            var teamQuery = new Parse.Query(Team);
            teamQuery.equalTo('teamCode', teamCodeOrId.toUpperCase());
            var team = await teamQuery.first({ useMasterKey: true });
            if (!team) {
                try { team = await new Parse.Query(Team).get(teamCodeOrId, { useMasterKey: true }); } catch (e) {}
            }
            if (team) {
                try {
                    var msgs = await Parse.Cloud.run('getTeamChatHistory', { teamId: team.id, limit: 50 }, { useMasterKey: true });
                    if (msgs && msgs.length > 0) {
                        var text3 = '📜 Takım "' + team.get('name') + '" sohbet geçmişi:\n\n';
                        msgs.forEach(function (m) {
                            var sender = m.user_name || m.user_email || 'Bilinmiyor';
                            var msgText = m.message || '[Dosya]';
                            var time = new Date(m.createdAt).toLocaleString('tr-TR');
                            text3 += '[' + time + '] ' + sender + ': ' + msgText + '\n';
                        });
                        response = text3;
                    } else response = '📭 Takımda henüz mesaj yok.';
                } catch (e) { response = '❌ Takım sohbeti okunamadı: ' + e.message; }
            } else response = '❌ "' + teamCodeOrId + '" bulunamadı.';
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
                } else response = '❌ Kullanıcı bulunamadı: ' + email;
            } catch (e) { response = '❌ Hata: ' + e.message; }
        }

        var matchAssignAdmin = lower.match(/admin ata\s+(\S+@\S+)/);
        if (matchAssignAdmin) {
            try { await Parse.Cloud.run('assignAdmin', { email: matchAssignAdmin[1] }, { useMasterKey: true }); response = '✅ Admin yapıldı.'; }
            catch (e) { response = '❌ Hata: ' + e.message; }
        }

        var matchSetBeta = lower.match(/beta yap\s+(\S+@\S+)/);
        if (matchSetBeta) {
            try { await Parse.Cloud.run('setUserRole', { email: matchSetBeta[1], role: 'beta' }, { useMasterKey: true }); response = '✅ Beta yapıldı.'; }
            catch (e) { response = '❌ Hata: ' + e.message; }
        }

        var matchModerator = lower.match(/moderatör yap\s+(\S+@\S+)/);
        if (matchModerator) {
            try { await Parse.Cloud.run('assignModeratorByEmail', { email: matchModerator[1] }, { useMasterKey: true }); response = '✅ Moderatör yapıldı.'; }
            catch (e) { response = '❌ Hata: ' + e.message; }
        }

        var matchBan = lower.match(/kullanıcıyı yasakla\s+(\S+@\S+)/);
        if (matchBan) {
            try { await Parse.Cloud.run('banUser', { targetEmail: matchBan[1] }, { useMasterKey: true }); response = '✅ Yasaklandı.'; }
            catch (e) { response = '❌ Hata: ' + e.message; }
        }

        var matchUnban = lower.match(/kullanıcının yasağını kaldır\s+(\S+@\S+)/);
        if (matchUnban) {
            try { await Parse.Cloud.run('unbanUser', { targetEmail: matchUnban[1] }, { useMasterKey: true }); response = '✅ Yasak kaldırıldı.'; }
            catch (e) { response = '❌ Hata: ' + e.message; }
        }

        if (response) return { reply: response };

        var siteContent = await getSiteContent();
        var prompt = 'Sen AETHRION DESTEK asistanısın. Kullanıcı KURUCU (' + user.get('email') + '). Kurucu mesajı: "' + message + '" Site içeriği: ' + siteContent.substring(0, 2000) + ' Kurucuya özel, saygılı ve kapsamlı cevap ver.';
        var reply3 = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { reply: cleanResponse(reply3) };
    }

    // NORMAL KULLANICI
    var isGreeting2 = ['selam', 'merhaba', 'hey', 'slm', 'hello', 'hi', 'naber', 'nasılsın', 'iyi misin'].some(function (w) { return message.toLowerCase().indexOf(w) !== -1; });
    if (isGreeting2) {
        return { reply: 'Merhaba! Ben Vizyon Destek. Site hakkında yardım, destek, şikayet ve öneriler için buradayım. Size nasıl yardımcı olabilirim?' };
    }

    try {
        var classPrompt = 'Aşağıdaki kullanıcı mesajı AETHRION sitesi hakkında YARDIM, DESTEK, ŞİKAYET, ÖNERİ, veya SİTE BİLGİSİ sorusu mu, yoksa GENEL bir soru mu?\n\nMesaj: "' + message + '"\n\nCevabın SADECE "DESTEK" veya "GENEL" olmalı.';
        var classResult = await Parse.Cloud.run('superAI', { prompt: classPrompt }, { useMasterKey: true });
        var isSupportRelated = classResult && classResult.toUpperCase().indexOf('DESTEK') !== -1;

        if (!isSupportRelated) {
            return { reply: 'Bu konuda yetkim yok. Ben sadece AETHRION sitesi hakkında yardım, destek, şikayet ve öneriler için buradayım. Diğer konular için lütfen @AETHRION AI yazarak tekrar sorun. 🙏' };
        }

        var siteContent2 = await getSiteContent();
        var prompt2 = 'Sen AETHRION DESTEK\'sin. Kullanıcı sorusu: "' + message + '". AETHRION sitesi hakkında bilgi: ' + siteContent2.substring(0, 1500) + '\n\nKısa, net ve DIRECT cevap ver. 3 cümleyi geçmesin. Resmi ol.';
        var reply4 = await Parse.Cloud.run("superAI", { prompt: prompt2 }, { useMasterKey: true });
        return { reply: cleanResponse(reply4) };
    } catch (e) {
        return { reply: 'Şu anda teknik bir sorun nedeniyle cevap veremiyorum.' };
    }
});

Parse.Cloud.define("getSupportReply", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
    }
    var question = request.params.question;
    if (!question) throw new Error('Soru gerekli!');
    try {
        var prompt = 'Sen AETHRION AI\'sın. Kullanıcı sordu: "' + question + '". Destek talebine yardımcı ol. Cevap kısa ve net olsun.';
        var reply = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { reply: reply };
    } catch (e) {
        return { reply: 'Üzgünüm, destek asistanı şu anda meşgul.' };
    }
});

Parse.Cloud.define("getCoachAdvice", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
    }
    var question = request.params.question;
    if (!question) throw new Error('Soru gerekli!');
    try {
        var prompt = 'Sen AETHRION Koç\'sun. Kullanıcı sordu: "' + question + '". Motive edici, yol gösterici ve günlük 3 görev öner. Kısa ve net olsun.';
        var reply = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { advice: reply };
    } catch (e) {
        return { advice: 'Üzgünüm, şu anda cevap veremiyorum.' };
    }
});

// ================================================================
// ========== AETHRION KOÇ ASİSTANI (FULL) =============================
// ================================================================
function getKocLimitForUser(user) {
    if (!user) return 0;
    var role = user.get('role');
    var plan = user.get('plan');
    if (role === 'founder' || role === 'admin' || role === 'beta' || role === 'moderator') return -1;
    if (plan === 'team') return 1000;
    if (plan === 'pro') return 50;
    return 10;
}

function getCurrentWeekStart() {
    var now = new Date();
    var day = now.getDay();
    var diff = (day === 0 ? 6 : day - 1);
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
    for (var i = 0; i < 8; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
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
        if (!conv || conv.get('user_email') !== user.get('email')) throw new Error('Bu sohbet size ait değil!');
    } else {
        conv = new KocConversation();
        conv.set('user_email', user.get('email'));
        conv.set('user_name', user.get('name') || 'Kullanıcı');
        conv.set('messageCount', 0);
        conv.set('created_at_client', new Date());
        conv.set('is_shared', false);
    }

    var role = user.get('role');
    var plan = user.get('plan');
    var roleContext = 'Kullanıcı rolü: ' + role + ', plan: ' + plan + '. ';

    if (role === 'founder') roleContext += 'Bu kullanıcı KURUCU. Tüm yetkilere sahip. ';
    else if (role === 'admin') roleContext += 'Bu kullanıcı ADMIN. ';
    else if (role === 'moderator') roleContext += 'Bu kullanıcı MODERATÖR / TASARIMCI. Sınırsız yetkilere sahip. ';
    else if (role === 'beta') roleContext += 'Bu kullanıcı BETA tester. ';
    else if (plan === 'team') roleContext += 'Bu kullanıcı TAKIM paketi üyesi. ';
    else if (plan === 'pro') roleContext += 'Bu kullanıcı PRO paket üyesi. ';
    else roleContext += 'Bu kullanıcı ÜCRETSİZ üye. ';

    var systemPrompt = 'Sen AETHRION KOÇ\'sun. Kullanıcılara çok samimi, sıcak, destekleyici bir dille yaklaşırsın. ' +
        'Psikolojik destek, yol haritası, rehberlik, moral verme ve pratik çözümler sun. ' +
        'Kullanıcıya "kardeşim", "dostum" gibi samimi hitaplar kullanabilirsin ama asla saygısızlık yapma. ' +
        'Cevapların Türkçe, net, kısa ve motive edici olsun. ' + roleContext;

    var fullPrompt = systemPrompt + '\n\nKullanıcı mesajı: ' + message;

    var reply = '';
    try {
        reply = await Parse.Cloud.run('superAI', { prompt: fullPrompt }, { useMasterKey: true });
        if (!reply || reply.length < 2) reply = 'Seni duydum kardeşim. Biraz daha detay verebilir misin? 🤝';
    } catch (e) {
        console.error('kocChat superAI hatası:', e.message);
        reply = 'Şu anda bir bağlantı sorunu yaşıyorum. Lütfen biraz sonra tekrar dene. 🤝';
    }

    if (!conv.get('title') || conv.get('title') === 'Yeni Sohbet' || conv.get('title') === '') {
        var titleText = message.substring(0, 60).trim();
        if (message.length > 60) titleText += '...';
        conv.set('title', titleText);
        conv.set('topic', titleText);
    }

    conv.set('last_message_at', new Date());
    var msgCount = (conv.get('messageCount') || 0) + 2;
    conv.set('messageCount', msgCount);
    await conv.save(null, { useMasterKey: true });

    // ✅ Mesajları Message sınıfına kaydet
    try {
        var userMsg = new Message();
        userMsg.set('from_email', user.get('email'));
        userMsg.set('to_email', 'system@vizyon2027.com');
        userMsg.set('conversationId', conv.id);
        userMsg.set('text', message.trim());
        userMsg.set('is_read', true);
        userMsg.set('is_ai', false);
        await userMsg.save(null, { useMasterKey: true });

        var coachMsg = new Message();
        coachMsg.set('from_email', 'system@vizyon2027.com');
        coachMsg.set('to_email', user.get('email'));
        coachMsg.set('conversationId', conv.id);
        coachMsg.set('text', reply);
        coachMsg.set('is_read', true);
        coachMsg.set('is_ai', true);
        coachMsg.set('ai_name', '🧭 AETHRION KOÇ');
        await coachMsg.save(null, { useMasterKey: true });
    } catch (msgSaveErr) {
        console.error('❌ Koç mesajları kaydedilemedi:', msgSaveErr.message);
    }

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

Parse.Cloud.define("getKocHistory", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var query = new Parse.Query(KocConversation);
    query.equalTo('user_email', user.get('email'));
    query.descending('last_message_at');
    query.limit(50);
    var convs = await query.find({ useMasterKey: true });

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

Parse.Cloud.define("getKocConversationMessages", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var conversationId = request.params.conversationId;
    if (!conversationId) throw new Error('Konuşma ID gerekli!');

    var convQuery = new Parse.Query(KocConversation);
    var conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error('Sohbet bulunamadı!');
    if (conv.get('user_email') !== user.get('email')) throw new Error('Bu sohbet size ait değil!');

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

Parse.Cloud.define("resetKocUsage", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Sadece kurucu sıfırlayabilir!');
    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');

    var query = new Parse.Query(KocUsage);
    query.equalTo('user_email', targetEmail);
    var usage = await query.first({ useMasterKey: true });
    if (!usage) return { success: false, error: 'Kullanıcı için kullanım kaydı bulunamadı.' };

    usage.set('count', 0);
    usage.set('week_start', getCurrentWeekStart());
    usage.set('last_reset', new Date());
    await usage.save(null, { useMasterKey: true });
    return { success: true, message: targetEmail + ' için koç kullanımı sıfırlandı.' };
});

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
    if (!conv.get('messageCount') || conv.get('messageCount') === 0) throw new Error('Boş sohbet paylaşılamaz.');

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

    return { success: true, shareId: shareId, shareUrl: shareUrl, message: 'Paylaşım linki oluşturuldu.' };
});

Parse.Cloud.define("getSharedKocConversation", async function (request) {
    var shareId = request.params.shareId;
    var password = request.params.password;
    if (!shareId) return { success: false, error: 'Paylaşım ID gerekli!' };

    var _rlk = 'getSharedKocConversation:' + shareId;
    try {
        await checkRateLimit(_rlk, 10, 5 * 60 * 1000);
        await recordAttempt(_rlk);
    } catch (e) { return { success: false, error: e.message, passwordRequired: true }; }

    var query = new Parse.Query(KocConversation);
    query.equalTo('share_id', shareId);
    var conv = await query.first({ useMasterKey: true });

    if (!conv) return { success: false, error: 'Paylaşım bulunamadı.' };
    if (!conv.get('is_shared')) return { success: false, error: 'Bu paylaşım artık aktif değil.' };

    var storedHash = conv.get('share_password_hash');
    var storedSalt = conv.get('share_password_salt');
    if (!storedHash || !storedSalt) return { success: false, error: 'Paylaşım yapılandırması bozuk.' };

    if (!password) {
        return {
            success: false,
            error: 'Bu sohbet şifre korumalı. Lütfen şifreyi girin.',
            passwordRequired: true,
            shareType: 'koc'
        };
    }

    if (!verifyKocPassword(password, storedSalt, storedHash)) {
        return { success: false, error: 'Şifre yanlış!', passwordRequired: true };
    }

    var msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    msgQuery.ascending('createdAt');
    msgQuery.limit(500);
    var msgs = await msgQuery.find({ useMasterKey: true });

    var userName = conv.get('user_name') || 'Kullanıcı';
    var messages = msgs.map(function (m) {
        var isCoach = m.get('is_ai') === true || m.get('from_email') === 'system@vizyon2027.com';
        return {
            name: isCoach ? '🧭 AETHRION KOÇ' : userName,
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
// ========== MODERATÖR SİSTEMİ (FULL) ============================
// ================================================================
Parse.Cloud.define("assignModeratorByEmail", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Bu işlemi sadece kurucu yapabilir!');

    var email = request.params.email;
    if (!email) throw new Error('E-posta adresi gerekli!');
    email = String(email).toLowerCase().trim();

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Geçerli bir e-posta adresi girin!');
    if (email === user.get('email').toLowerCase()) throw new Error('Kendinizi moderatör yapamazsınız!');

    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    var targetUser = await query.first({ useMasterKey: true });

    if (!targetUser) throw new Error('Bu e-posta ile kayıtlı kullanıcı bulunamadı: ' + email);
    if (targetUser.get('role') === 'founder') throw new Error('Kurucu moderatör yapılamaz!');
    if (targetUser.get('role') === 'moderator') throw new Error('Bu kullanıcı zaten moderatör!');

    targetUser.set('role', 'moderator');
    targetUser.set('moderator_assigned_at', new Date());
    targetUser.set('moderator_assigned_by', user.get('email'));
    await targetUser.save(null, { useMasterKey: true });

    try {
        var log = new VizyonLog();
        log.set('user_email', user.get('email'));
        log.set('user_name', user.get('name') || 'Kurucu');
        log.set('action', 'assign_moderator');
        log.set('message', '🎨 ' + email + ' moderatör olarak atandı.');
        await log.save(null, { useMasterKey: true });
    } catch (logErr) {}

    try {
        await sendNotificationToUser(targetUser, '🎨 Tebrikler! Moderatör / Tasarımcı rütbesine atandınız.', 'role_assigned');
    } catch (notifErr) {}

    console.log('🎨 Moderatör atandı:', email);
    return { success: true, message: email + ' başarıyla Moderatör olarak atandı!', email: email, userId: targetUser.id };
});

Parse.Cloud.define("getModerators", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error('Bu liste sadece kurucuya aittir!');
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
    if (!user || user.get('role') !== 'founder') throw new Error('Bu işlemi sadece kurucu yapabilir!');
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
        log.set('message', '🚫 ' + email + ' moderatörlükten çıkarıldı.');
        await log.save(null, { useMasterKey: true });
    } catch (e) {}

    return { success: true, message: email + ' moderatörlükten çıkarıldı.' };
});

Parse.Cloud.define("createVideoClip", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    if (['moderator', 'admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Bu işlemi sadece moderatör, admin veya kurucu yapabilir!');

    var videoUrl = request.params.videoUrl;
    var startTime = request.params.startTime;
    var endTime = request.params.endTime;
    var note = request.params.note;
    var analysis = request.params.analysis || '';

    if (!videoUrl) throw new Error('Video URL gerekli!');
    if (startTime === undefined || endTime === undefined) throw new Error('Başlangıç ve bitiş saniyeleri gerekli!');
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
    console.log('🎬 Video kesit oluşturuldu:', clip.id);

    return { success: true, clipId: clip.id, message: 'Video kesit başarıyla paylaşıldı!' };
});

Parse.Cloud.define("getVideoClips", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var limit = request.params.limit || 50;
    var moderatorEmail = request.params.moderatorEmail;

    var query = new Parse.Query(VideoClip);
    query.equalTo('is_published', true);
    if (moderatorEmail) query.equalTo('moderator_email', moderatorEmail);
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
// ========== GIPHY ===============================================
// ================================================================
Parse.Cloud.define("searchGif", async function (request) {
    var query = request.params.query;
    if (!query) throw new Error('Arama terimi gerekli!');
    var apiKey = await getAPIKey('GIPHY_API_KEY');
    if (!apiKey) throw new Error('GIPHY_API_KEY eksik!');
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
        } else return [];
    } catch (e) {
        console.error('GIPHY hatası:', e);
        return [];
    }
});

// ================================================================
// ========== ÇEVİRİ ==============================================
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
        } else throw new Error('Beklenmeyen yanıt formatı');
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
    var params = request && request.params || {};
    var text = params.text;
    var targetLang = params.targetLang;
    var sourceLang = params.sourceLang || 'auto';
    if (typeof text !== 'string' || !text.trim()) throw new Error('Çevrilecek metin gerekli.');
    if (text.length > 5000) throw new Error('Çevrilecek metin en fazla 5000 karakter olabilir.');
    if (typeof targetLang !== 'string' || !/^[a-zA-Z-]{2,16}$/.test(targetLang)) throw new Error('Geçerli bir hedef dil gerekli.');
    if (typeof sourceLang !== 'string' || !/^[a-zA-Z-]{2,16}$/.test(sourceLang)) throw new Error('Geçerli bir kaynak dil gerekli.');
    var identity = request.user ? String(request.user.id) : String(request.installationId || request.ip || '');
    if (!identity) throw new Error('İstek kimliği doğrulanamadı.');
    var rateKey = 'smartTranslate:' + identity;
    await checkRateLimit(rateKey, 20, 60 * 1000);
    await recordAttempt(rateKey);
    text = text.trim();
    try {
        var deepl = await Parse.Cloud.run("translateWithDeepL", { text: text, targetLang: targetLang, sourceLang: sourceLang }, { useMasterKey: true });
        if (deepl && deepl.success) return deepl;
    } catch (e) {}
    try {
        var libre = await Parse.Cloud.run("translateWithLibre", { text: text, targetLang: targetLang, sourceLang: sourceLang }, { useMasterKey: true });
        if (libre && libre.success) return libre;
    } catch (e) {}
    return { success: false, translatedText: text, error: 'Tüm çeviri motorları başarısız.' };
});

// ================================================================
// ========== ÜRÜN & MAĞAZA =======================================
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
    adminQuery.equalTo('email', await getPrivateFounderEmail());
    var admin = await adminQuery.first({ useMasterKey: true });
    if (admin) {
        var adminWallet = admin.get('wallet_balance') || 0;
        admin.set('wallet_balance', adminWallet + commission);
        await admin.save(null, { useMasterKey: true });
    }

    if (seller) await addPointsWithBonus(seller, Math.floor(price * 0.05), 'Ürün satışı');

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
// ========== GÖREVLER ============================================
// ================================================================
// ISO date key helper for Parse classes whose deployed "date" column is String.
function _aethrionDateKeyUTC(value) {
    var d = value instanceof Date ? value : new Date(value || Date.now());
    if (!Number.isFinite(d.getTime())) d = new Date();
    return d.toISOString().slice(0, 10);
}

Parse.Cloud.define("getDailyTasks", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var todayKey = _aethrionDateKeyUTC(new Date());
    var query = new Parse.Query(DailyTask);
    query.equalTo('date', todayKey);
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

Parse.Cloud.define("getSocialTasks", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var todayKey = _aethrionDateKeyUTC(new Date());
    var query = new Parse.Query(SocialTask);
    query.equalTo('date', todayKey);
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

Parse.Cloud.define("getTeamTasks", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var teamId = user.get('teamId');
    if (!teamId) throw new Error('Bir takıma üye değilsiniz!');
    var taskReadMemberQuery = new Parse.Query(TeamMember);
    taskReadMemberQuery.equalTo('team_id', teamId);
    taskReadMemberQuery.equalTo('user_email', user.get('email'));
    var taskReadMember = await taskReadMemberQuery.first({ useMasterKey: true });
    if (!taskReadMember) throw new Error('Bu takımın üyesi değilsiniz.');

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    var query = new Parse.Query(TeamTask);
    query.equalTo('team_id', teamId);
    query.greaterThanOrEqualTo('date', today);
    query.lessThan('date', tomorrow);
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
    if (!taskId) throw new Error('Görev ID gerekli!');
    var query = new Parse.Query(TeamTask);
    var task = await query.get(taskId, { useMasterKey: true });
    if (!task) throw new Error('Görev bulunamadı!');
    var taskTeamId = String(task.get('team_id') || '');
    if (!taskTeamId || taskTeamId !== String(user.get('teamId') || '')) throw new Error('Bu takım görevi üzerinde işlem yetkiniz yok.');
    var taskMemberQuery = new Parse.Query(TeamMember);
    taskMemberQuery.equalTo('team_id', taskTeamId);
    taskMemberQuery.equalTo('user_email', user.get('email'));
    var taskMember = await taskMemberQuery.first({ useMasterKey: true });
    if (!taskMember) throw new Error('Bu takımın üyesi değilsiniz.');
    var taskRole = String(taskMember.get('role') || 'viewer').toLowerCase();
    var taskTeam = await new Parse.Query(Team).get(taskTeamId, { useMasterKey: true });
    var taskPrivileged = !!(taskTeam && (taskTeam.get('owner_email') === user.get('email') || taskTeam.get('manager_email') === user.get('email'))) || user.get('role') === 'founder' || user.get('role') === 'admin';
    if (taskRole === 'viewer' && !taskPrivileged) throw new Error('Görüntüleyici rolü takım görevlerini tamamlayamaz.');

    var completed = user.get('completed_team_tasks') || [];
    if (completed.indexOf(taskId) !== -1) throw new Error('Bu görev zaten tamamlanmış!');

    completed.push(taskId);
    user.set('completed_team_tasks', completed);
    var points = task.get('points') || 0;
    await addPointsWithBonus(user, points, 'Takım görevi');
    await user.save(null, { useMasterKey: true });
    await _aeWriteTeamAudit(user, taskTeamId, 'task_completed', taskId, 'Takım görevi tamamlandı');
    return { success: true, remaining_points: user.get('points'), message: 'Görev tamamlandı! +' + points + ' puan' };
});

// ================================================================
// ========== BİLDİRİM ============================================
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
// ========== MESAJLAŞMA ==========================================
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
    if (fileUrl) { msg.set('file', fileUrl); msg.set('fileName', fileName || 'Dosya'); }
    msg.set('is_read', false);
    await msg.save(null, { useMasterKey: true });

    conv.set('lastMessage', filterText(text || '[Dosya]'));
    conv.set('lastMessageTime', new Date());
    await conv.save(null, { useMasterKey: true });

    if (toEmail) {
        var toUserQuery = new Parse.Query(Parse.User);
        toUserQuery.equalTo('email', toEmail);
        var toUser = await toUserQuery.first({ useMasterKey: true });
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
// ========== GÜNLÜK SERİ (STREAK) ================================
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
    if (claimedToday) return { success: false, message: 'Bugün zaten ödül aldınız!' };

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
    if (!streak.get('streakStartDate')) streak.set('streakStartDate', new Date());
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
// ========== AKADEMİ =============================================
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
        { id: 'sample1', title: '🚀 AETHRION AI ile Kod Yazma', description: 'Yapay zeka ile kod yazmayı öğrenin.', total_lessons: 4, completed: false },
        { id: 'sample2', title: '🧊 3D Modelleme ve Tasarım', description: 'Three.js ile 3D nesneler oluşturun.', total_lessons: 3, completed: false },
        { id: 'sample3', title: '📊 Veri Analizi ve Görselleştirme', description: 'Python ile veri analizi.', total_lessons: 5, completed: false },
        { id: 'sample4', title: '🔐 Güvenlik ve Ebeveyn Kontrolleri', description: 'Kullanıcı güvenliği ve ebeveyn ayarları.', total_lessons: 3, completed: false },
        { id: 'sample5', title: '🔑 A27 API ile Kendi Projeni Yap', description: 'A27 API anahtarı ile uygulama geliştir.', total_lessons: 4, completed: false }
    ];
});

Parse.Cloud.define("getCourseDetails", async function (request) {
    var courseId = request.params.courseId;
    if (courseId === 'sample1') {
        return {
            id: 'sample1', title: '🚀 AETHRION AI ile Kod Yazma', description: 'Yapay zeka ile kod yazmanın püf noktaları.',
            lessons: [
                { id: 'l1', title: 'Python ile Hesap Makinesi', content: 'AETHRION AI\'ya "Python\'da hesap makinesi yaz" deyin.', points_reward: 10 },
                { id: 'l2', title: 'JavaScript ile ToDo Uygulaması', content: 'React ile basit bir ToDo app yapın.', points_reward: 15 },
                { id: 'l3', title: 'HTML/CSS ile Kişisel Sayfa', content: 'Kendi portföy sayfanızı oluşturun.', points_reward: 10 },
                { id: 'l4', title: 'API Entegrasyonu', content: 'AETHRION AI ile dış API\'leri kullanmayı öğrenin.', points_reward: 20 }
            ]
        };
    } else if (courseId === 'sample2') {
        return {
            id: 'sample2', title: '🧊 3D Modelleme ve Tasarım', description: 'Three.js ile 3D dünyasına adım atın.',
            lessons: [
                { id: 'l5', title: '3D Sahne Oluşturma', content: 'Üç boyutlu bir sahne oluşturun.', points_reward: 10 },
                { id: 'l6', title: 'Geometrik Şekiller', content: 'Küp, küre, silindir ekleyin.', points_reward: 15 },
                { id: 'l7', title: 'Işık ve Gölge', content: 'Sahnenize ışık kaynakları ekleyin.', points_reward: 10 }
            ]
        };
    } else if (courseId === 'sample3') {
        return {
            id: 'sample3', title: '📊 Veri Analizi', description: 'Python ile veri analizi.',
            lessons: [
                { id: 'l8', title: 'Veri Okuma', content: 'CSV ve JSON dosyalarını okuyun.', points_reward: 10 },
                { id: 'l9', title: 'Veri Temizleme', content: 'Eksik verileri temizleyin.', points_reward: 15 },
                { id: 'l10', title: 'Grafik Çizimi', content: 'Matplotlib ile grafik oluşturun.', points_reward: 20 },
                { id: 'l11', title: 'Dashboard', content: 'Etkileşimli dashboard hazırlayın.', points_reward: 25 },
                { id: 'l12', title: 'Raporlama', content: 'Veri raporu oluşturmayı öğrenin.', points_reward: 15 }
            ]
        };
    } else if (courseId === 'sample4') {
        return {
            id: 'sample4', title: '🔐 Güvenlik', description: 'Kullanıcı güvenliği ve ebeveyn ayarları.',
            lessons: [
                { id: 'l13', title: 'Şifre Güvenliği', content: 'Güçlü şifre oluşturma.', points_reward: 10 },
                { id: 'l14', title: 'Ebeveyn Panelini Kullanma', content: 'Çocuk hesaplarını yönetme.', points_reward: 15 },
                { id: 'l15', title: 'Veri Gizliliği', content: 'Kişisel verilerinizi koruyun.', points_reward: 10 }
            ]
        };
    } else if (courseId === 'sample5') {
        return {
            id: 'sample5', title: '🔑 A27 API', description: 'A27 API anahtarı ile uygulama geliştir.',
            lessons: [
                { id: 'l16', title: 'A27 API Anahtarı Alma', content: 'Dashboard\'dan A27 API anahtarı oluştur.', points_reward: 10 },
                { id: 'l17', title: 'v27ApiChat Kullanımı', content: 'A27 API\'yi kendi uygulamanda kullan.', points_reward: 20 },
                { id: 'l18', title: 'Rate Limiting', content: 'Dakikada 60 istek limitini anla.', points_reward: 15 },
                { id: 'l19', title: 'Örnek Proje', content: 'A27 API ile basit bir chatbot yap.', points_reward: 25 }
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
// ========== ZEKA TESTİ ==========================================
// ================================================================
Parse.Cloud.define("getQuizQuestions", async function (request) {
    var todayKey = _aethrionDateKeyUTC(new Date());
    var query = new Parse.Query(Quiz);
    query.equalTo('date', todayKey);
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
        { id: 'q1', question: 'Python\'da fonksiyon tanımlamak için hangi anahtar kelime kullanılır?', options: ['function', 'def', 'define', 'func'], points_reward: 10 },
        { id: 'q2', question: 'AETHRION AI kaç modeli tek çatı altında birleştirir?', options: ['7', '13', '21', '30'], points_reward: 15 },
        { id: 'q3', question: '3D model oluşturmak için hangi kütüphane kullanılır?', options: ['Three.js', 'React.js', 'Vue.js', 'Angular'], points_reward: 10 },
        { id: 'q4', question: 'Veri analizi için hangi Python kütüphanesi yaygın olarak kullanılır?', options: ['Pandas', 'NumPy', 'Matplotlib', 'Hepsi'], points_reward: 15 },
        { id: 'q5', question: 'V27 API anahtarı ücretsiz üye için kaç adet?', options: ['0', '1', '2', '5'], points_reward: 10 }
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
// ========== YARIŞMA SİSTEMİ =====================================
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
    if (existing) return { success: false, error: 'Zaten bu yarışmaya katıldınız.' };

    var participant = new ContestParticipant();
    participant.set('contest_id', contest.id);
    participant.set('user_email', user.get('email'));
    participant.set('user_name', user.get('name') || user.get('username') || 'Kullanıcı');
    participant.set('joined_at', new Date());
    participant.set('total_points', 0);
    await participant.save(null, { useMasterKey: true });

    console.log('✅ Kullanıcı yarışmaya katıldı: ' + user.get('email'));
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
                if (rank === 1) { winnerUser.set('plan', 'team'); await winnerUser.save(null, { useMasterKey: true }); }
                else if (rank === 2) { winnerUser.set('plan', 'pro'); await winnerUser.save(null, { useMasterKey: true }); }
                else if (rank === 3) {
                    var currentPoints = winnerUser.get('points') || 0;
                    winnerUser.set('points', currentPoints + 5000);
                    await winnerUser.save(null, { useMasterKey: true });
                }
                await sendNotificationToUser(winnerUser, '🏆 Aylık yarışmada ' + rank + '. oldunuz! Ödül: ' + reward, 'contest_winner');
            }
        } catch (e) { console.error('Ödül uygulanamadı:', e.message); }

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

    console.log('✅ Yarışma finalize edildi: ' + month);
    return { success: true, message: 'Yarışma tamamlandı!', winners: winnerEmails };
}

// ================================================================
// ========== ANKET ===============================================
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
// ========== DUYURU ==============================================
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
// ========== İŞ İLANI ============================================
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
// ========== HATA BİLDİR =========================================
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
// ========== CÜZDAN ==============================================
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
// ========== TAKİP ===============================================
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
// ========== PROFİL ==============================================
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
// ========== EBEVEYN AYARLARI (FULL) =============================
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
        subject: 'AETHRION Ebeveyn Doğrulama Kodu',
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

    // ⚡ RATE LIMIT — saatte 3 kez
    var _rlk = 'sendParentReport:' + user.get('email');
    await checkRateLimit(_rlk, 3, 60 * 60 * 1000);
    await recordAttempt(_rlk);

    var childEmail = request.params.childEmail;
    if (!childEmail) throw new Error('Çocuk e-posta gerekli!');

    var childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    var child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error('Çocuk kullanıcı bulunamadı!');

    var points = child.get('points') || 0;
    var level = child.get('level') || 'Çaylak';
    var lastActive = child.get('updatedAt') || child.get('createdAt');

    var html = '<h3>📊 AETHRION Haftalık Rapor</h3>' +
        '<p><strong>Çocuk:</strong> ' + child.get('name') + ' (' + childEmail + ')</p>' +
        '<p><strong>Puan:</strong> ' + points + '</p>' +
        '<p><strong>Seviye:</strong> ' + level + '</p>' +
        '<p><strong>Son Aktivite:</strong> ' + new Date(lastActive).toLocaleString('tr-TR') + '</p>';

    await Parse.Cloud.run('sendEmail', {
        to: user.get('email'),
        subject: 'AETHRION - ' + child.get('name') + ' Haftalık Rapor',
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
        subject: 'AETHRION Ebeveyn Şifre Sıfırlama',
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
// ========== KURUCU İLETİŞİM =====================================
// ================================================================
Parse.Cloud.define("sendFounderMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var message = request.params && request.params.message;
    if (typeof message !== 'string' || !message.trim()) throw new Error('Mesaj gerekli!');
    message = message.trim();
    if (message.length > 2000) throw new Error('Mesaj en fazla 2000 karakter olabilir.');
    var founderRateKey = 'sendFounderMessage:' + String(user.id);
    await checkRateLimit(founderRateKey, 5, 60 * 1000);
    await recordAttempt(founderRateKey);

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
// ========== PUAN & REFERANS =====================================
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

    // ✅ [FIX A16] Kurucunun özel davet kodu artık client'a hardcoded değil, Config'den okunuyor.
    var founderSpecialCode = (await getAPIKey('FOUNDER_REFERRAL_CODE')) || 'Eymen1144';
    if (code === founderSpecialCode) {
        var founderQuery = new Parse.Query(Parse.User);
        founderQuery.equalTo('email', await getPrivateFounderEmail());
        var founder = await founderQuery.first({ useMasterKey: true });
        if (!founder) throw new Error('Kurucu bulunamadı!');

        await sendNotificationToUser(founder, user.get('name') + ' sizin davet kodunuzu kullanmak istiyor.', 'referral_request');

        var inbox = new Inbox();
        inbox.set('sender_email', user.get('email'));
        inbox.set('receiver_email', await getPrivateFounderEmail());
        inbox.set('type', 'referral_request');
        inbox.set('message', user.get('name') + ' (' + user.get('email') + ') sizin davet kodunuzu kullanmak istiyor. Onay verir misiniz?');
        await inbox.save(null, { useMasterKey: true });

        return { success: true, message: 'Kurucuya onay mesajı gönderildi.', pending: true };
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
// ========== PAZAR PROJELERİ =====================================
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
    if (item.get('owner_email') === user.get('email')) throw new Error('Kendi projenizi satın alamazsınız!');
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
        await sendNotificationToUser(seller, '🎉 Projeniz satıldı! +' + sellerEarn + ' puan kazandınız.', 'store');
    }

    var founderQuery = new Parse.Query(Parse.User);
    founderQuery.equalTo('email', await getPrivateFounderEmail());
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

    await sendNotificationToUser(user, '✅ "' + item.get('title') + '" projesini satın aldınız!', 'store');
    return { success: true, remaining_points: user.get('points'), message: 'Proje satın alındı!' };
});

// ================================================================
// ========== BLOG ABONE ==========================================
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
            subject: "AETHRION Blog & Sistem Aboneliği",
            html: '<h3>📬 AETHRION\'ye Hoş Geldiniz!</h3><p>Artık hem <strong>blog yazılarından</strong> hem de <strong>sistem güncellemelerinden</strong> haberdar olacaksınız.</p><p>AETHRION Ekibi</p>'
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

    if (!record) return { blogActive: false, systemActive: false, message: 'Henüz bir aboneliğiniz yok.' };
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
    if (!type || ['blog', 'system'].indexOf(type) === -1) throw new Error('Geçersiz abonelik türü.');

    var email = user.get('email');
    var Subscriber = Parse.Object.extend("BlogSubscriber");
    var query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    var record = await query.first({ useMasterKey: true });
    if (!record) throw new Error('Abonelik kaydınız bulunamadı.');

    if (type === 'blog') record.set("isActive", false);
    else record.set("isSystemActive", false);
    await record.save(null, { useMasterKey: true });

    var msg = type === 'blog' ? 'Blog aboneliğiniz iptal edildi.' : 'Sistem aboneliğiniz iptal edildi.';
    return { success: true, message: msg };
});

Parse.Cloud.define("sendBlogUpdateToSubscribers", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok.');

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
                html: '<h3>AETHRION Blog Güncellemesi</h3><p>' + message + '</p><p>AETHRION Ekibi</p>'
            }, { useMasterKey: true });
            sentCount++;
        } catch (e) { console.error('Mail gönderilemedi:', e.message); }
    }
    return { success: true, sentCount: sentCount, total: subscribers.length };
});

Parse.Cloud.define("sendSystemUpdateToSubscribers", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok.');

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
                subject: "⚡ AETHRION Sistem Güncellendi! (v" + version + ")",
                html: '<h3>⚡ AETHRION Sistem Güncellemesi</h3><p><strong>Sürüm:</strong> ' + version + '</p><p><strong>Değişiklikler:</strong><br>' + changes + '</p><p>AETHRION Ekibi</p>'
            }, { useMasterKey: true });
            sentCount++;
        } catch (e) { console.error('Mail gönderilemedi:', e.message); }
    }
    return { success: true, sentCount: sentCount, total: subscribers.length };
});

// ================================================================
// ========== SAVAŞ MODU & ÇOKLU AI ===============================
// ================================================================
Parse.Cloud.define("battleMode", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
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

    var fullPrompt = 'Seninle ' + model2 + ' arasında bir tartışma yapıyorsunuz. Konu: "' + prompt + '". Kendi görüşünü savun. Cevabın kısa ve net olsun (max 200 kelime).';

    try {
        var resp1 = null, resp2 = null;
        try { resp1 = await Parse.Cloud.run(m1, { prompt: fullPrompt }, { useMasterKey: true }); } catch (e) {}
        try { resp2 = await Parse.Cloud.run(m2, { prompt: fullPrompt }, { useMasterKey: true }); } catch (e) {}

        if (!resp1 && !resp2) return { success: false, error: 'Her iki model de yanıt veremedi.' };

        var winner = null;
        if (resp1 && resp2) winner = resp1.length > resp2.length ? model1 : model2;
        else if (resp1) winner = model1;
        else winner = model2;

        return { success: true, model1_response: resp1 || 'Yanıt alınamadı.', model2_response: resp2 || 'Yanıt alınamadı.', winner: winner };
    } catch (e) { return { success: false, error: e.message }; }
});

Parse.Cloud.define("multiAI", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
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
// ========== VİDEO ANALİZ & UYGULAMA =============================
// ================================================================
Parse.Cloud.define("analyzeVideo", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
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
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
    }

    var url = request.params.url;
    if (!url) throw new Error('Video URL gerekli!');

    try {
        var prompt = 'Şu videodan 5 Instagram Reels fikri çıkar: ' + url + '. Her fikir 1 cümle olsun.';
        var result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, ideas: result };
    } catch (e) { return { success: false, error: e.message }; }
});

Parse.Cloud.define("generateApp", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
    }

    var prompt = request.params.prompt;
    if (!prompt) throw new Error('Uygulama fikri gerekli!');

    try {
        var codePrompt = 'Kullanıcı şu uygulamayı istiyor: "' + prompt + '". Sadece çalışan HTML/CSS/JavaScript kodunu ver. Tek dosya halinde, eksiksiz, çalışır durumda. Hiçbir açıklama yapma.';
        var result = await Parse.Cloud.run("superAI", { prompt: codePrompt }, { useMasterKey: true });
        return { success: true, code: result, downloadUrl: null };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== PRO ARAÇLARI ========================================
// ================================================================
Parse.Cloud.define("proTools", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
    }

    var tool = request.params.tool;
    var input = request.params.input;
    if (!tool || !input) throw new Error('Araç ve girdi gerekli!');

    var prompt = '';
    switch (tool) {
        case 'kod': prompt = 'Kullanıcı şu kodu istiyor: "' + input + '". Sadece çalışan kodu ver. Dil: Python/JavaScript/HTML.'; break;
        case 'yazi': prompt = 'Kullanıcı şu yazıyı istiyor: "' + input + '". 200-300 kelimelik profesyonel bir metin yaz.'; break;
        case 'ceviri':
            var parts = input.split('->');
            if (parts.length === 2) prompt = 'Şu metni çevir: "' + parts[0].trim() + '". Hedef dil: ' + parts[1].trim() + '. Sadece çeviriyi ver.';
            else prompt = 'Şu metni İngilizce\'ye çevir: "' + input + '". Sadece çeviriyi ver.';
            break;
        default: throw new Error('Geçersiz araç!');
    }

    try {
        var result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, output: result };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== API ANAHTAR YÖNETİMİ ================================
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
    if (existing) throw new Error('Bu isimde bir anahtarınız zaten var.');

    if (!user.get('api_password_hash')) throw new Error('Lütfen önce API şifrenizi belirleyin!');

    var encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) throw new Error('Sunucu şifreleme anahtarı eksik.');

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
    try { decrypted = smartDecrypt(record.get('encryptedValue'), encryptionKey); }
    catch (e) { throw new Error('Anahtar çözülemedi.'); }
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

    if (user.get('api_password_hash')) throw new Error('API şifreniz zaten belirlenmiş.');

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
// ========== A27 API ANAHTAR SİSTEMİ (FULL) ======================
// ================================================================
function getV27ApiKeyLimit(user) {
    var role = user.get('role');
    var plan = user.get('plan');
    if (role === 'founder' || role === 'admin' || role === 'beta' || role === 'moderator') return -1;
    if (plan === 'team') return 100;
    if (plan === 'pro') return 20;
    return 2;
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

// ✅ [FIX A11] Ortak çekirdek: limit kontrolü artık kayıttan SONRA da doğrulanır (race condition),
// aşım varsa yeni kayıt geri alınır. viaVizyonAl=true ise düz anahtar dönmez (güvenli reveal akışı).
async function _createV27ApiKeyCore(user, params, viaVizyonAl) {
    var keyName = params.keyName;
    var keyDescription = params.keyDescription || '';
    var duration = params.duration || 'unlimited';
    var allowedScopeNames = ['chat', 'usage:read'];
    var requestedScopes = Array.isArray(params.scopes) ? params.scopes : ['chat'];
    var keyScopes = Array.from(new Set(requestedScopes.map(function (s) { return String(s || '').trim().toLowerCase(); }).filter(function (s) { return allowedScopeNames.indexOf(s) >= 0; })));
    if (!keyScopes.length) throw new Error('En az bir geçerli API izni seçmelisiniz.');

    if (!keyName || keyName.trim().length < 2) throw new Error('Anahtar adı en az 2 karakter olmalıdır!');
    if (keyName.trim().length > 50) throw new Error('Anahtar adı en fazla 50 karakter olabilir!');
    if (keyDescription && keyDescription.length > 150) throw new Error('Açıklama en fazla 150 karakter olabilir!');
    if (['1w', '1m', '5m', '1y', 'unlimited'].indexOf(duration) === -1) duration = 'unlimited';

    var limit = getV27ApiKeyLimit(user);
    if (limit === 0) throw new Error('Bu özellik size açık değil!');

    var _rlk = 'createV27ApiKey:' + user.get('email');
    await checkRateLimit(_rlk, 5, 60 * 1000);
    await recordAttempt(_rlk);

    async function countActive() {
        var q = new Parse.Query(V27ApiKey);
        q.equalTo('user_email', user.get('email'));
        q.equalTo('is_active', true);
        return await q.count({ useMasterKey: true });
    }

    if (limit !== -1) {
        var existingCount = await countActive();
        if (existingCount >= limit) throw new Error('Maksimum API anahtarı sayısına ulaştınız! (' + limit + ')');
    }

    var nameQuery = new Parse.Query(V27ApiKey);
    nameQuery.equalTo('user_email', user.get('email'));
    nameQuery.equalTo('key_name', keyName.trim());
    nameQuery.equalTo('is_active', true);
    var existingName = await nameQuery.first({ useMasterKey: true });
    if (existingName) throw new Error('Bu isimde aktif bir anahtarınız zaten var!');

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
    record.set('allowed_scopes', keyScopes);
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

    // Kayıt sonrası tekrar say — aynı anda gelen paralel isteklerle limit aşıldıysa geri al
    if (limit !== -1) {
        var afterCount = await countActive();
        if (afterCount > limit) {
            try { await record.destroy({ useMasterKey: true }); } catch (delErr) { console.warn('V27 key geri alma hatası:', delErr.message); }
            throw new Error('Maksimum API anahtarı sayısına ulaştınız! (' + limit + ')');
        }
    }

    console.log('🔑 A27 API anahtarı oluşturuldu: ' + user.get('email') + ' → ' + keyName + (viaVizyonAl ? ' (AETHRION AI)' : ''));

    var base = {
        success: true,
        keyId: record.id,
        maskedKey: keyMasked,
        keyName: keyName.trim(),
        duration: duration,
        durationLabel: durationLabel(duration),
        expiresAt: expiresAt
    };

    if (viaVizyonAl) {
        // Düz anahtar sohbete/log'a GİTMEZ; kısa ömürlü tek kullanımlık reveal kaydı oluşturulur.
        var revealToken = crypto.randomBytes(24).toString('hex');
        var reveal = new Parse.Object('V27KeyReveal');
        reveal.set('user_email', user.get('email'));
        reveal.set('key_id', record.id);
        reveal.set('plain_key', plainKey);
        reveal.set('key_name', keyName.trim());
        reveal.set('reveal_token', revealToken);
        reveal.set('expires_at', new Date(Date.now() + 3 * 60 * 1000));
        await reveal.save(null, { useMasterKey: true });
        base.revealToken = revealToken;
        base.requiresConfirmation = true;
        base.message = 'Anahtar oluşturuldu. Görüntülemek için onay ekranında onaylayın (3 dk geçerli).';
        return base;
    }

    base.plainKey = plainKey;
    return base;
}

Parse.Cloud.define("createV27ApiKey", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    return await _createV27ApiKeyCore(user, request.params, request.params.viaVizyonAl === true);
});

// ✅ [YENİ] AETHRION AI üzerinden anahtar oluşturma — düz değer sohbete dönmez
Parse.Cloud.define("generateV27KeyForUser", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    return await _createV27ApiKeyCore(user, request.params, true);
});

// ✅ [YENİ] Onay ekranında "Göster" denince anahtarı TEK SEFER verir ve kaydı siler
Parse.Cloud.define("revealV27KeyOnce", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var token = request.params.revealToken;
    if (!token) throw new Error('Geçersiz istek!');

    var _rlk = 'revealV27KeyOnce:' + user.get('email');
    await checkRateLimit(_rlk, 10, 60 * 1000);
    await recordAttempt(_rlk);

    var q = new Parse.Query('V27KeyReveal');
    q.equalTo('reveal_token', token);
    q.equalTo('user_email', user.get('email'));
    var rec = await q.first({ useMasterKey: true });
    if (!rec) throw new Error('Anahtar bulunamadı veya daha önce gösterildi.');

    var exp = rec.get('expires_at');
    if (exp && exp.getTime() < Date.now()) {
        await rec.destroy({ useMasterKey: true });
        throw new Error('Süre doldu. Lütfen anahtarı yeniden oluşturun.');
    }

    var plain = rec.get('plain_key');
    var keyName = rec.get('key_name');
    await rec.destroy({ useMasterKey: true });
    return { success: true, plainKey: plain, keyName: keyName };
});

Parse.Cloud.define("getMyV27ApiKeys", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var limit = getV27ApiKeyLimit(user);
    if (limit === 0) throw new Error('Bu özellik size açık değil!');

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
            scopes: Array.isArray(k.get('allowed_scopes')) && k.get('allowed_scopes').length ? k.get('allowed_scopes') : ['chat'],
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
        key_name: _aeSafeAuditText(record.get('key_name') || '', 50),
        scopes: Array.isArray(record.get('allowed_scopes')) && record.get('allowed_scopes').length ? record.get('allowed_scopes') : ['chat'],
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
    if (!Array.isArray(validation.scopes) || validation.scopes.indexOf('chat') === -1) throw new Error('Bu API anahtarında chat izni yok.');

    var reply = await Parse.Cloud.run('superAI', { prompt: prompt }, { useMasterKey: true });
    return { success: true, reply: cleanResponse(reply) };
});

Parse.Cloud.define("v27ApiRest", async function (request) {
    var apiKey = (request.headers && (
                        request.headers['x-v27-api-key'] ||
                        request.headers['X-V27-Api-Key'] ||
                        request.headers['x-v27-key']
                   ))
                 || request.params.apiKey
                 || request.params.v27_api_key;

    var prompt = request.params.prompt
              || request.params.message
              || request.params.text
              || request.params.q;

    var lang = (request.params.lang || request.params.language || 'tr').toLowerCase();

    if (!apiKey) throw new Error('API anahtarı gerekli (X-V27-Api-Key header veya apiKey body parametresi).');
    if (!prompt || String(prompt).trim().length === 0) throw new Error('prompt (veya message) parametresi gerekli.');
    if (String(prompt).length > 8000) throw new Error('prompt çok uzun (max 8000 karakter).');

    var _rlk = 'v27ApiRest:' + String(apiKey).substring(0, 16);
    await checkRateLimit(_rlk, 60, 60 * 1000);
    await recordAttempt(_rlk);

    var validation = await Parse.Cloud.run('validateV27ApiKey', { apiKey: apiKey }, { useMasterKey: true });
    if (!validation || !validation.valid) throw new Error((validation && validation.error) || 'Geçersiz API anahtarı!');
    if (!Array.isArray(validation.scopes) || validation.scopes.indexOf('chat') === -1) throw new Error('Bu API anahtarında chat izni yok.');

    var systemPrefix = '';
    if (lang === 'tr') {
        systemPrefix = 'Sen AETHRION AI\'sın. Aşağıdaki kullanıcı sorusuna TÜRKÇE, doğal ve akıcı bir şekilde cevap ver. Kısa, net ve öz ol.\n\nKullanıcı sorusu: ';
    } else if (lang === 'en') {
        systemPrefix = 'You are AETHRION AI. Answer the following user question in ENGLISH.\n\nUser question: ';
    } else {
        systemPrefix = 'Sen AETHRION AI\'sın. Aşağıdaki soruya cevap ver.\n\nSoru: ';
    }

    var fullPrompt = systemPrefix + String(prompt).trim();
    var reply = '';
    try {
        reply = await Parse.Cloud.run('superAI', { prompt: fullPrompt }, { useMasterKey: true });
    } catch (e) {
        console.error('v27ApiRest superAI hatası:', e.message);
        throw new Error('AI yanıt veremedi: ' + e.message);
    }

    if (!reply || String(reply).trim().length === 0) throw new Error('AI boş yanıt döndü.');

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
// ========== ADMİN FONKSİYONLARI =================================
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
    if (!user || ['admin', 'founder', 'moderator'].indexOf(user.get('role')) === -1) throw new Error('Yetkiniz yok!');
    var targetEmail = request.params.targetEmail;
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');

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
    if (!targetEmail) throw new Error('Hedef e-posta gerekli!');

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

Parse.Cloud.define("getAllUsers", async function (request) {
    var user = request.user;
    if (!user || ['admin', 'founder', 'moderator'].indexOf(user.get('role')) === -1) throw new Error('Bu işlem için yetkiniz yok!');

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
// ========== AETHRION LOG ==========================================
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
// ========== 3D MODEL ve GÖRSEL ÜRETME (HF) ======================
// ================================================================
Parse.Cloud.define("generate3DWithHF", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var role = user.get('role');
    var plan = user.get('plan');
    if (['admin', 'founder', 'beta', 'moderator'].indexOf(role) === -1 && plan !== 'team') {
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
    }

    var prompt = request.params.prompt;
    if (!prompt) throw new Error('Prompt gerekli!');
    var apiKey = await getAPIKey('HF_API_KEY');
    if (!apiKey) throw new Error('HF_API_KEY eksik!');

    try {
        var url = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-medium';
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: prompt })
        });
        if (!response.ok) throw new Error('HF API hatası: ' + await response.text());
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
        try { await Parse.Cloud.run('useQuery', {}); }
        catch (e) { throw new Error(e.message || 'Sorgu hakkınız doldu!'); }
    }

    var prompt = request.params.prompt;
    if (!prompt) throw new Error('Prompt gerekli!');
    var apiKey = await getAPIKey('HF_API_KEY');
    if (!apiKey) throw new Error('HF_API_KEY eksik!');

    try {
        var url = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev';
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: prompt })
        });
        if (!response.ok) throw new Error('HF Görsel API hatası: ' + await response.text());
        var buffer = await response.arrayBuffer();
        var base64 = bufferToBase64(buffer);
        return { success: true, imageBase64: base64 };
    } catch (e) {
        console.error('HF Görsel hatası:', e);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== ZAMANLANMIŞ GÖREVLER (JOB'LAR) ======================
// ================================================================

// 1. Günlük görevleri yenile
Parse.Cloud.job("refreshDailyTasks", async function (request) {
    console.log('🔄 Günlük görevler yenileniyor...');
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayKey = _aethrionDateKeyUTC(today);

    var oldQuery = new Parse.Query(DailyTask);
    oldQuery.lessThan('date', todayKey);
    var oldTasks = await oldQuery.find({ useMasterKey: true });
    for (var oi = 0; oi < oldTasks.length; oi++) await oldTasks[oi].destroy({ useMasterKey: true });

    var tasks = [
        { task_text: '🔍 3 AI sorgusu yap', points: 10 },
        { task_text: '💬 1 yorum yaz', points: 5 },
        { task_text: '⭐ 1 proje favorile', points: 8 },
        { task_text: '📁 1 proje oluştur', points: 15 },
        { task_text: '👥 1 takım mesajı gönder', points: 6 }
    ];
    for (var ti = 0; ti < tasks.length; ti++) {
        var task = new DailyTask();
        task.set('date', todayKey);
        task.set('task_text', tasks[ti].task_text);
        task.set('points', tasks[ti].points);
        await task.save(null, { useMasterKey: true });
    }

    var userQuery = new Parse.Query(Parse.User);
    var users = await userQuery.find({ useMasterKey: true });
    for (var ui = 0; ui < users.length; ui++) {
        users[ui].set('completed_daily_tasks', []);
        await users[ui].save(null, { useMasterKey: true });
    }
    console.log('✅ Günlük görevler yenilendi!');
    return 'Günlük görevler yenilendi!';
});

// 2. Takım görevlerini yenile
Parse.Cloud.job("refreshTeamTasks", async function (request) {
    console.log('🔄 Takım görevleri yenileniyor...');
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var oldQuery = new Parse.Query(TeamTask);
    oldQuery.lessThan('date', today);
    var oldTasks = await oldQuery.find({ useMasterKey: true });
    for (var oi = 0; oi < oldTasks.length; oi++) await oldTasks[oi].destroy({ useMasterKey: true });

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
    for (var ui = 0; ui < users.length; ui++) {
        users[ui].set('completed_team_tasks', []);
        await users[ui].save(null, { useMasterKey: true });
    }
    console.log('✅ Takım görevleri yenilendi!');
    return 'Takım görevleri yenilendi!';
});

// 3. Topluluk görevlerini yenile
Parse.Cloud.job("refreshSocialTasks", async function (request) {
    console.log('🔄 Topluluk görevleri yenileniyor...');
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayKey = _aethrionDateKeyUTC(today);

    var oldQuery = new Parse.Query(SocialTask);
    oldQuery.lessThan('date', todayKey);
    var oldTasks = await oldQuery.find({ useMasterKey: true });
    for (var oi = 0; oi < oldTasks.length; oi++) await oldTasks[oi].destroy({ useMasterKey: true });

    var tasks = [
        { platform: 'Instagram', url: 'https://www.instagram.com/aethrion.official/', points_reward: 15, penalty_points: 0 },
        { platform: 'WhatsApp', url: 'https://whatsapp.com/channel/0029VbCpnvuG8l5FQVQMLy1U', points_reward: 10, penalty_points: 0 },
        { platform: 'YouTube', url: '#', points_reward: 20, penalty_points: 0 }
    ];
    for (var ti = 0; ti < tasks.length; ti++) {
        var task = new SocialTask();
        task.set('date', todayKey);
        task.set('platform', tasks[ti].platform);
        task.set('url', tasks[ti].url);
        task.set('points_reward', tasks[ti].points_reward);
        task.set('penalty_points', tasks[ti].penalty_points);
        task.set('is_active', true);
        await task.save(null, { useMasterKey: true });
    }

    var userQuery = new Parse.Query(Parse.User);
    var users = await userQuery.find({ useMasterKey: true });
    for (var ui = 0; ui < users.length; ui++) {
        users[ui].set('completed_social_tasks', []);
        await users[ui].save(null, { useMasterKey: true });
    }
    console.log('✅ Topluluk görevleri yenilendi!');
    return 'Topluluk görevleri yenilendi!';
});

// 5. Zeka testi sorularını yenile
Parse.Cloud.job("refreshQuizQuestions", async function (request) {
    console.log('🔄 Zeka testi soruları yenileniyor...');
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var oldQuery = new Parse.Query(Quiz);
    oldQuery.lessThan('date', today);
    var oldQuizes = await oldQuery.find({ useMasterKey: true });
    for (var qi = 0; qi < oldQuizes.length; qi++) await oldQuizes[qi].destroy({ useMasterKey: true });

    var questions = [
        { question: 'Python\'da bir fonksiyon tanımlamak için hangi anahtar kelime kullanılır?', options: ['function', 'def', 'define', 'func'], correct: 1, points: 10 },
        { question: 'AETHRION AI kaç modeli tek çatı altında birleştirir?', options: ['7', '13', '21', '30'], correct: 2, points: 15 },
        { question: '3D model oluşturmak için hangi kütüphane kullanılır?', options: ['Three.js', 'React.js', 'Vue.js', 'Angular'], correct: 0, points: 10 },
        { question: 'Veri analizi için hangi Python kütüphanesi yaygın olarak kullanılır?', options: ['Pandas', 'NumPy', 'Matplotlib', 'Hepsi'], correct: 3, points: 15 },
        { question: 'V27 API anahtarı ücretsiz üye için kaç adet?', options: ['0', '1', '2', '5'], correct: 2, points: 10 }
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

// 6. Akademi derslerini yenile
Parse.Cloud.job("refreshAcademyCourses", async function (request) {
    console.log('🔄 Akademi dersleri yenileniyor...');
    var courseData = [
        { title: '🚀 AETHRION AI ile Kod Yazma', description: 'Yapay zeka ile kod yazmayı öğrenin.', total_lessons: 4 },
        { title: '🧊 3D Modelleme ve Tasarım', description: 'Three.js ile 3D nesneler oluşturun.', total_lessons: 3 },
        { title: '📊 Veri Analizi ve Görselleştirme', description: 'Python ile veri analizi.', total_lessons: 5 },
        { title: '🔐 Güvenlik ve Ebeveyn Kontrolleri', description: 'Kullanıcı güvenliği ve ebeveyn ayarları.', total_lessons: 3 },
        { title: '🔑 A27 API ile Kendi Projeni Yap', description: 'A27 API anahtarı ile uygulama geliştir.', total_lessons: 4 }
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

// 7. Aylık yarışmayı finalize et
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

// 8. Haftalık Koç kullanım sıfırla
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

// 9. Süresi dolan anketleri temizle
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

// 10. Süresi dolan duyuruları temizle
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

// 11. Streak hatırlatma job'u
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
                    html: '<h3>AETHRION</h3><p>Serinizi kaybetmenize 4 saat kaldı! Hemen giriş yapın ve günlük ödülünüzü alın.</p><p>AETHRION Ekibi</p>'
                }, { useMasterKey: true });
                streak.set('notifiedAt8h', true);
                await streak.save(null, { useMasterKey: true });
                sentCount++;
            }
            if (hoursSince >= 23 && hoursSince < 24 && !streak.get('notifiedAt4h')) {
                await Parse.Cloud.run('sendEmail', {
                    to: email,
                    subject: '⚠️ SON UYARI! Seriniz Sıfırlanacak!',
                    html: '<h3>AETHRION</h3><p>Serinizi kaybetmenize 1 saat kaldı! Hemen giriş yapın.</p><p>AETHRION Ekibi</p>'
                }, { useMasterKey: true });
                streak.set('notifiedAt4h', true);
                await streak.save(null, { useMasterKey: true });
                sentCount++;
            }
        } catch (e) {
            console.error('Streak hatırlatma hatası:', e.message);
        }
    }
    console.log('✅ ' + sentCount + ' hatırlatma gönderildi.');
    return 'Streak hatırlatmaları tamamlandı. ' + sentCount + ' gönderildi.';
});

// 12. ✅ [v7.10.0 YENİ] AETHRION DEVRİYE (7/24 OTOMATİK MODERASYON)
Parse.Cloud.job("vizyonPatrol", async function (request) {
    console.log('🛡️ AETHRION Devriye başlatılıyor...');

    // Önce aktif mi kontrol et
    try {
        var configQuery = new Parse.Query(SystemConfig);
        configQuery.equalTo('key', 'vizyonPatrolActive');
        var config = await configQuery.first({ useMasterKey: true });
        if (config && config.get('value') && config.get('value').enabled === false) {
            console.log('⏸️ AETHRION Devriye KAPALI, atlanıyor.');
            return 'AETHRION Devriye kapalı.';
        }
    } catch (e) {
        console.warn('Patrol config kontrolü başarısız:', e.message);
    }

    var issueCount = 0;
    var badWords = ['siktir', 'amk', 'orospu', 'piç', 'göt', 'sik', 'yarrak', 'ananı', 'bacını', 'çük', 'amcık', 'ibne', 'puşt', 'şerefsiz', 'hıyar'];
    var siyasiWords = ['akp', 'chp', 'mhp', 'hdp', 'iyi parti', 'erdoğan', 'kılıçdaroğlu', 'bahçeli', 'demirtaş'];

    // Son 24 saatteki takım mesajlarını tara
    try {
        var cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        var msgQuery = new Parse.Query(TeamMessage);
        msgQuery.greaterThan('createdAt', cutoff);
        msgQuery.notEqualTo('user_email', 'system@vizyon2027.com');
        msgQuery.limit(500);
        var messages = await msgQuery.find({ useMasterKey: true });

        for (var mi = 0; mi < messages.length; mi++) {
            var msg = messages[mi];
            var text = String(msg.get('message') || '').toLowerCase();
            var hasIssue = false;
            var reason = '';

            for (var bi = 0; bi < badWords.length; bi++) {
                if (text.indexOf(badWords[bi]) !== -1) { hasIssue = true; reason = 'Küfür/argo'; break; }
            }
            if (!hasIssue) {
                for (var si = 0; si < siyasiWords.length; si++) {
                    if (text.indexOf(siyasiWords[si]) !== -1) { hasIssue = true; reason = 'Siyasi içerik'; break; }
                }
            }

            if (hasIssue) {
                issueCount++;
                // Kullanıcıya gelen kutusuna bildirim
                var userEmail = msg.get('user_email');
                try {
                    var userQuery = new Parse.Query(Parse.User);
                    userQuery.equalTo('email', userEmail);
                    var user = await userQuery.first({ useMasterKey: true });
                    if (user) {
                        var inbox = new Inbox();
                        inbox.set('sender_email', 'system@vizyon2027.com');
                        inbox.set('receiver_email', userEmail);
                        inbox.set('type', 'patrol_warning');
                        inbox.set('message', '⚠️ AETHRION Devriye Uyarısı: ' + reason + ' tespit edildi. Lütfen topluluk kurallarına uyun.');
                        await inbox.save(null, { useMasterKey: true });
                    }
                } catch (e) {}

                // Log kaydet
                try {
                    var log = new VizyonLog();
                    log.set('user_email', 'system@vizyon2027.com');
                    log.set('user_name', '🛡️ AETHRION Devriye');
                    log.set('action', 'patrol_warning');
                    log.set('message', '⚠️ ' + reason + ' tespit edildi. Kullanıcı: ' + userEmail);
                    await log.save(null, { useMasterKey: true });
                } catch (e) {}
            }
        }
    } catch (e) {
        console.error('AETHRION Devriye tarama hatası:', e.message);
    }

    // Son 24 saatteki yorumları tara
    try {
        var cutoff2 = new Date(Date.now() - 24 * 60 * 60 * 1000);
        var commentQuery = new Parse.Query(Comment);
        commentQuery.greaterThan('createdAt', cutoff2);
        commentQuery.limit(200);
        var comments = await commentQuery.find({ useMasterKey: true });

        for (var ci = 0; ci < comments.length; ci++) {
            var comment = comments[ci];
            var commentText = String(comment.get('comment') || '').toLowerCase();
            var hasIssueC = false;

            for (var bi2 = 0; bi2 < badWords.length; bi2++) {
                if (commentText.indexOf(badWords[bi2]) !== -1) { hasIssueC = true; break; }
            }

            if (hasIssueC) {
                issueCount++;
                // Yorumu otomatik sil
                try {
                    await comment.destroy({ useMasterKey: true });
                    console.log('🗑️ AETHRION Devriye: Uygunsuz yorum silindi');
                } catch (e) {}
            }
        }
    } catch (e) {
        console.error('AETHRION Devriye yorum tarama hatası:', e.message);
    }

    console.log('✅ AETHRION Devriye tamamlandı. ' + issueCount + ' sorun tespit edildi.');
    return 'AETHRION Devriye tamamlandı. ' + issueCount + ' sorun tespit edildi.';
});

// 13. ✅ [v7.10.0 YENİ] FeatureUsage temizleme (haftada 1'den eski)
Parse.Cloud.job("cleanOldFeatureUsage", async function (request) {
    console.log('🔄 Eski FeatureUsage kayıtları temizleniyor...');
    try {
        var oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        var query = new Parse.Query(FeatureUsage);
        query.lessThan('last_updated', oneWeekAgo);
        var old = await query.find({ useMasterKey: true });
        for (var i = 0; i < old.length; i++) await old[i].destroy({ useMasterKey: true });
        console.log('✅ ' + old.length + ' eski kullanım kaydı temizlendi.');
        return old.length + ' kayıt temizlendi.';
    } catch (e) {
        console.error('cleanOldFeatureUsage hatası:', e.message);
        return 'Hata: ' + e.message;
    }
});

// 14. ✅ [v7.10.0 YENİ] ClientLog temizleme (30 günden eski)
Parse.Cloud.job("cleanOldClientLogs", async function (request) {
    console.log('🔄 Eski ClientLog kayıtları temizleniyor...');
    try {
        var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        var query = new Parse.Query(ClientLog);
        query.lessThan('created_at_client', thirtyDaysAgo);
        var old = await query.find({ useMasterKey: true });
        for (var i = 0; i < old.length; i++) await old[i].destroy({ useMasterKey: true });
        console.log('✅ ' + old.length + ' eski log kaydı temizlendi.');
        return old.length + ' kayıt temizlendi.';
    } catch (e) {
        console.error('cleanOldClientLogs hatası:', e.message);
        return 'Hata: ' + e.message;
    }
});

// ================================================================
// 🧹 ESKİ STRING DATE KAYITLARINI TEMİZLE (Tek seferlik migration)
// ================================================================
Parse.Cloud.define("fixDateColumnsMigration", async function (request) {
    var user = request.user;
    if (!user || user.get('role') !== 'founder') {
        throw new Error('Bu işlemi sadece kurucu yapabilir!');
    }

    console.log('🧹 Eski string date kayıtları temizleniyor...');

    var classes = ['QueryStat', 'DailyTask', 'SocialTask', 'TeamTask', 'Quiz'];
    var results = {};
    var totalDeleted = 0;

    for (var i = 0; i < classes.length; i++) {
        var className = classes[i];
        var Obj = Parse.Object.extend(className);
        var query = new Parse.Query(Obj);
        query.limit(1000);
        var all = await query.find({ useMasterKey: true });

        var deleted = 0;
        var kept = 0;

        for (var j = 0; j < all.length; j++) {
            var record = all[j];
            var dateVal = record.get('date');

            // Eğer date alanı String ise sil (eski hatalı kayıt)
            if (typeof dateVal === 'string') {
                await record.destroy({ useMasterKey: true });
                deleted++;
            } else {
                kept++;
            }
        }

        results[className] = {
            total: all.length,
            deleted: deleted,
            kept: kept
        };

        totalDeleted += deleted;
        console.log('🧹 ' + className + ': ' + deleted + ' silindi, ' + kept + ' tutuldu');
    }

    console.log('✅ Toplam ' + totalDeleted + ' kayıt temizlendi.');

    return {
        success: true,
        message: 'Toplam ' + totalDeleted + ' eski kayıt temizlendi.',
        details: results
    };
});

// ================================================================
// ========== [v7.10.1 YENİ] GOOGLE TOKEN DOĞRULAMA (FIXED) ======
// ================================================================
// ================================================================
// AETHRION EMAIL LOGIN — email lookup + configured founder credentials
// ================================================================
Parse.Cloud.define("aethrionLoginWithEmail", async function (request) {
    var params = request.params || {};
    var email = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';
    var password = typeof params.password === 'string' ? params.password : '';
    if (!email || !password || email.length > 254 || password.length > 1024) {
        return { success: false, error: 'E-posta veya şifre hatalı.' };
    }

    var rateKey = getRateLimitKey(request, 'aethrionLoginWithEmail') + ':' + email;
    try {
        await checkRateLimit(rateKey, 10, 5 * 60 * 1000);
        await recordAttempt(rateKey);
    } catch (e) {
        return { success: false, error: 'Çok fazla giriş denemesi yapıldı. Birkaç dakika sonra tekrar deneyin.' };
    }

    var founderEmail = String((await getPrivateFounderEmail()) || '').trim().toLowerCase();
    if (email === 'admin.tr.reis') email = founderEmail;
    var user = null;
    var loginName = email;

    try {
        if (email === founderEmail) {
            var configuredFounderPass = await getPrivateFounderPass();
            if (!configuredFounderPass) {
                console.error('[AETHRION Auth] FOUNDER_PASS is not configured in private Back4App runtime settings.');
                return { success: false, error: 'Kurucu hesabının sunucu parolası yapılandırılmamış. Back4App Cloud Code ayarlarını kontrol edin.' };
            }
            // Only the configured secret can trigger founder-account provisioning/synchronization.
            if (password !== configuredFounderPass) {
                return { success: false, error: 'Kurucu e-postası için Back4App yapılandırmasındaki şifre kullanılmalıdır.' };
            }

            var founderQuery = new Parse.Query(Parse.User);
            founderQuery.equalTo('username', founderEmail);
            user = await founderQuery.first({ useMasterKey: true });
            if (!user) {
                founderQuery = new Parse.Query(Parse.User);
                founderQuery.equalTo('email', founderEmail);
                user = await founderQuery.first({ useMasterKey: true });
            }

            if (!user) {
                user = new Parse.User();
                user.set('username', founderEmail);
                user.set('email', founderEmail);
                user.set('name', 'Eymen');
                user.set('role', 'founder');
                user.set('plan', 'team');
                user.set('isVerified', true);
                user.set('isBanned', false);
                user.set('profile_completed', true);
                user.set('terms_accepted', true);
                user.set('privacy_accepted', true);
                user.set('terms_accepted_at', new Date());
                user.set('points', 0);
                user.set('level', 'Çaylak');
                user.set('referral_code', 'A27-EYME-1144');
            }

            // Sync only after the caller supplied the exact private configured secret.
            user.set('username', user.get('username') || founderEmail);
            user.set('email', founderEmail);
            user.set('password', configuredFounderPass);
            user.set('name', user.get('name') || 'Eymen');
            user.set('role', 'founder');
            user.set('plan', 'team');
            user.set('isVerified', true);
            user.set('profile_completed', true);
            await user.save(null, { useMasterKey: true });
            loginName = user.get('username') || founderEmail;
        } else {
            var emailQuery = new Parse.Query(Parse.User);
            emailQuery.equalTo('email', email);
            user = await emailQuery.first({ useMasterKey: true });
            if (!user) {
                var usernameQuery = new Parse.Query(Parse.User);
                usernameQuery.equalTo('username', email);
                user = await usernameQuery.first({ useMasterKey: true });
            }
            if (!user) return { success: false, error: 'E-posta veya şifre hatalı.' };
            loginName = user.get('username') || email;
        }

        var loggedInUser;
        try {
            loggedInUser = await Parse.User.logIn(loginName, password);
        } catch (loginError) {
            // Never return internal Parse error codes or account-existence details.
            console.warn('[AETHRION Auth] Email login rejected by Parse authentication.');
            return { success: false, error: 'E-posta veya şifre hatalı.' };
        }

        if (!loggedInUser) return { success: false, error: 'Giriş tamamlanamadı. Lütfen tekrar deneyin.' };
        if (loggedInUser.get('isBanned') === true) {
            return { success: false, error: 'Bu hesap devre dışı bırakılmış. Destek ekibiyle iletişime geçin.' };
        }
        var verificationState = loggedInUser.get('isVerified');
        var pendingVerificationCode = String(loggedInUser.get('verificationCode') || '');
        if (pendingVerificationCode) {
            return { success: false, code: 'EMAIL_NOT_VERIFIED', error: 'Hesabınız henüz doğrulanmamış. E-posta doğrulama kodunu girin veya yeni kod isteyin.' };
        }
        // Legacy accounts with no pending code predate the code-verification flow.
        // Keep these accounts usable; new registrations always store a pending code.
        if (verificationState !== true) {
            loggedInUser.set('isVerified', true);
            loggedInUser.set('verificationCode', null);
            loggedInUser.set('verificationCodeExpires', null);
            await loggedInUser.save(null, { useMasterKey: true });
        }

        return {
            success: true,
            sessionToken: loggedInUser.getSessionToken(),
            userId: loggedInUser.id,
            name: loggedInUser.get('name') || '',
            email: loggedInUser.get('email') || email,
            role: loggedInUser.get('role') || 'user',
            plan: loggedInUser.get('plan') || 'free'
        };
    } catch (e) {
        console.error('[AETHRION Auth] Email login service failed:', e && e.message ? e.message : 'UnknownError');
        return { success: false, error: 'Kimlik doğrulama servisi şu anda kullanılamıyor. Back4App Cloud Code günlüklerini kontrol edin.' };
    }
});

Parse.Cloud.define("verifyGoogleToken", async function (request) {
    var params = request.params || {};
    var idToken = typeof params.idToken === 'string' ? params.idToken.trim() : '';
    var suppliedUserId = typeof params.userId === 'string' ? params.userId.trim() : '';
    if (!idToken) return { success: false, error: 'Google kimlik belirteci alınamadı. Lütfen tekrar deneyin.' };
    if (idToken.length > 10000) return { success: false, error: 'Google kimlik belirteci geçersiz.' };

    var rateKey = 'verifyGoogleToken:' + String((request && request.ip) || suppliedUserId || 'unknown');
    try {
        await checkRateLimit(rateKey, 10, 5 * 60 * 1000);
        await recordAttempt(rateKey);
    } catch (e) {
        return { success: false, error: e.message || 'Çok fazla deneme yapıldı.' };
    }

    // Google ID token is verified server-side; never trust email/name/sub sent by the browser.
    var tokenInfo;
    try {
        var response = await _aethrionAuthFetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), 12000);
        if (!response || !response.ok) throw new Error('Google doğrulama servisi yanıt vermedi.');
        tokenInfo = await response.json();
    } catch (e) {
        console.error('verifyGoogleToken tokeninfo hatası:', e.message);
        return { success: false, error: 'Google hesabı doğrulanamadı. Lütfen tekrar deneyin.' };
    }

    if (!tokenInfo || tokenInfo.error || !tokenInfo.sub || !tokenInfo.email) {
        return { success: false, error: 'Google kimlik bilgileri geçersiz.' };
    }

    var expectedClientId = '';
    try {
        expectedClientId = (typeof process !== 'undefined' && process.env && process.env.GOOGLE_CLIENT_ID) || '';
    } catch (e) {}
    if (!expectedClientId) {
        try {
            if (typeof getAPIKey === 'function') expectedClientId = await getAPIKey('GOOGLE_CLIENT_ID');
        } catch (e) {}
    }
    if (!expectedClientId) {
        expectedClientId = '648997195148-eoo5683g1ar0gmlckgq4b79tv91dkuut.apps.googleusercontent.com';
    }

    var tokenIssuer = String(tokenInfo.iss || '');
    var expiry = Number(tokenInfo.exp) || 0;
    var verifiedEmail = tokenInfo.email_verified === true || tokenInfo.email_verified === 'true';
    if (tokenInfo.aud !== expectedClientId || (tokenInfo.azp && tokenInfo.azp !== expectedClientId)) {
        console.warn('verifyGoogleToken: token audience uyuşmazlığı.');
        return { success: false, error: 'Google Client ID yapılandırması uyuşmuyor.' };
    }
    if (tokenIssuer !== 'accounts.google.com' && tokenIssuer !== 'https://accounts.google.com') {
        return { success: false, error: 'Google token sağlayıcısı doğrulanamadı.' };
    }
    if (!expiry || expiry * 1000 <= Date.now()) {
        return { success: false, error: 'Google oturum belirtecinin süresi dolmuş. Tekrar deneyin.' };
    }
    if (!verifiedEmail) {
        return { success: false, error: 'Google e-posta adresiniz doğrulanmış olmalıdır.' };
    }
    if (suppliedUserId && suppliedUserId !== tokenInfo.sub) {
        return { success: false, error: 'Google kullanıcı kimliği uyuşmuyor.' };
    }
    if (params.termsAccepted !== true || params.privacyAccepted !== true) {
        return { success: false, error: 'Devam etmek için Kullanıcı Sözleşmesi ve Gizlilik Politikası onayı gereklidir.' };
    }

    var googleUser = {
        id: String(tokenInfo.sub),
        email: String(tokenInfo.email).trim().toLowerCase(),
        name: String(tokenInfo.name || tokenInfo.given_name || tokenInfo.email.split('@')[0]).slice(0, 120),
        picture: String(tokenInfo.picture || '').slice(0, 2048)
    };

    // Do not silently merge a Google identity into an unrelated password account
    // merely because the email string matches; that requires an authenticated linking flow.
    var linkedUser = null;
    var emailUser = null;
    try {
        var linkedQuery = new Parse.Query(Parse.User);
        linkedQuery.equalTo('authData.google.id', googleUser.id);
        linkedUser = await linkedQuery.first({ useMasterKey: true });

        var emailQuery = new Parse.Query(Parse.User);
        emailQuery.equalTo('email', googleUser.email);
        emailUser = await emailQuery.first({ useMasterKey: true });
        if (!emailUser) {
            var usernameQuery = new Parse.Query(Parse.User);
            usernameQuery.equalTo('username', googleUser.email);
            emailUser = await usernameQuery.first({ useMasterKey: true });
        }
    } catch (e) {
        console.error('verifyGoogleToken user lookup hatası:', e.message);
        return { success: false, error: 'Hesap bilgileri şu anda kontrol edilemiyor. Lütfen tekrar deneyin.' };
    }

    if (emailUser && (!linkedUser || emailUser.id !== linkedUser.id)) {
        var existingAuth = emailUser.get('authData') || {};
        var existingGoogle = existingAuth.google || {};
        if (String(existingGoogle.id || '') !== googleUser.id) {
            return {
                success: false,
                error: 'Bu e-posta veya kullanıcı adıyla eşleşen bir AETHRION hesabı zaten var. Güvenlik için önce mevcut hesabınıza e-posta/şifre ile giriş yapın; ardından Ayarlar > Güvenlik ve Gizlilik bölümünden Google hesabınızı bağlayın.'
            };
        }
    }

    var user;
    var isNewUser = !linkedUser && !emailUser;
    try {
        // Parse Server Google auth adapter expects provider data directly under authData:
        // { authData: { id: "...", id_token: "..." } }, not authData.google nesting.
        user = await Parse.User.logInWith('google', {
            authData: {
                id: googleUser.id,
                id_token: idToken
            }
        });

        if (!user) throw new Error('Parse Server kullanıcı nesnesi döndürmedi.');

        if (user.get('isBanned')) {
            return { success: false, error: 'Hesabınız yasaklanmıştır.' };
        }

        // Populate defaults without overwriting user-customized profile fields.
        if (!user.get('email')) user.set('email', googleUser.email);
        if (!user.get('username')) user.set('username', googleUser.email);
        if (!user.get('name')) user.set('name', googleUser.name);
        if (!user.get('profile_picture') && googleUser.picture) user.set('profile_picture', googleUser.picture);
        if (!user.get('role')) user.set('role', 'user');
        if (!user.get('plan')) user.set('plan', 'free');
        if (user.get('isVerified') !== true) user.set('isVerified', true);
        if (user.get('is_google_user') !== true) user.set('is_google_user', true);
        if (user.get('points') == null) user.set('points', 0);
        if (!user.get('level')) user.set('level', 'Çaylak');
        if (!Array.isArray(user.get('badges'))) user.set('badges', []);
        if (!Array.isArray(user.get('followers'))) user.set('followers', []);
        if (!Array.isArray(user.get('following'))) user.set('following', []);
        if (user.get('wallet_balance') == null) user.set('wallet_balance', 0);
        if (user.get('referral_count') == null) user.set('referral_count', 0);
        if (user.get('parent_mode') == null) user.set('parent_mode', false);
        if (isNewUser) {
            user.set('profile_completed', false);
            user.set('password_set', false);
            user.set('terms_accepted', true);
            user.set('privacy_accepted', true);
            user.set('terms_accepted_at', new Date());
            user.set('privacy_accepted_at', new Date());
            if (params.referralCode && typeof params.referralCode === 'string') {
                user.set('signup_referral_code', params.referralCode.trim().slice(0, 64));
            }
        }
        await user.save(null, { useMasterKey: true });
    } catch (e) {
        console.error('verifyGoogleToken Parse Google login hatası:', e && e.message);
        var message = String((e && e.message) || '');
        if (/auth.*provider|google.*(not configured|configuration)|unsupported.*auth|unknown.*auth/i.test(message)) {
            return { success: false, error: 'Google girişi Back4App tarafında etkin değil. Authentication > Settings bölümünde Google sağlayıcısını yapılandırın.' };
        }
        if (/already exists|username.*taken|email.*taken|duplicate/i.test(message)) {
            return { success: false, error: 'Bu e-posta ile bir hesap zaten var. Mevcut hesabınıza giriş yapıp Google bağlantısını tamamlayın.' };
        }
        return { success: false, error: 'Google ile AETHRION oturumu açılamadı. Back4App Google sağlayıcısı ayarlarını kontrol edin.' };
    }

    var sessionToken = typeof user.getSessionToken === 'function' ? user.getSessionToken() : null;
    if (!sessionToken) {
        return { success: false, error: 'Google hesabı doğrulandı ancak oturum belirteci oluşturulamadı. Back4App Google Authentication yapılandırmasını kontrol edin.' };
    }

    return {
        success: true,
        sessionToken: sessionToken,
        userId: user.id,
        email: user.get('email') || googleUser.email,
        name: user.get('name') || googleUser.name,
        role: user.get('role') || 'user',
        plan: user.get('plan') || 'free',
        isNewUser: isNewUser
    };
});
console.log('✅ [v7.10.1] verifyGoogleToken yüklendi');

// ================================================================
// ========== [YENİ] İŞ İLANLARI MAĞAZASI ==========================
// ================================================================
function _jobEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Limit: Üye 1 / Pro 10 / Takım 100 / Kurucu-Admin-Beta-Moderatör sınırsız (-1)
function getJobListingLimit(user) {
    if (!user) return 0;
    var role = user.get('role');
    if (role === 'founder' || role === 'admin' || role === 'beta' || role === 'moderator') return -1;
    var plan = user.get('plan') || 'free';
    if (plan === 'team') return 100;
    if (plan === 'pro') return 10;
    return 1;
}

function _jobToJson(j, includeContact) {
    var o = {
        id: j.id,
        job_number: j.get('job_number'),
        title: j.get('title') || (j.get('job_type') ? j.get('job_type') + ' İlanı' : 'İlan'),
        owner_name: j.get('owner_name'),
        job_type: j.get('job_type'),
        description: j.get('description'),
        salary: j.get('salary'),
        payment_method: j.get('payment_method'),
        image_url: j.get('image_url') || '',
        status: j.get('status'),
        accepted_at: j.get('accepted_at') || null,
        views: j.get('views') || 0,
        createdAt: j.createdAt
    };
    if (includeContact) {
        o.owner_email = j.get('owner_email');
        o.accepted_by = j.get('accepted_by') || null;
    }
    return o;
}


async function _nextJobNumber() {
    var q = new Parse.Query('SystemConfig');
    q.equalTo('key', 'job_listing_counter');
    var cfg = await q.first({ useMasterKey: true });
    if (!cfg) {
        cfg = new Parse.Object('SystemConfig');
        cfg.set('key', 'job_listing_counter');
        cfg.set('value', 0);
        cfg.set('description', 'İş ilanı numara sayacı');
        await cfg.save(null, { useMasterKey: true });
    }
    cfg.increment('value', 1); // atomik artış
    await cfg.save(null, { useMasterKey: true });
    await cfg.fetch({ useMasterKey: true });
    var n = Number(cfg.get('value')) || 1;
    return 'ILN-' + new Date().getFullYear() + '-' + ('00000' + n).slice(-5);
}

Parse.Cloud.define("getJobListingLimit", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var limit = getJobListingLimit(user);
    var q = new Parse.Query('JobListing');
    q.equalTo('owner_email', user.get('email'));
    q.equalTo('is_active', true);
    var used = await q.count({ useMasterKey: true });
    return { success: true, limit: limit, used: used, remaining: limit === -1 ? -1 : Math.max(0, limit - used) };
});

Parse.Cloud.define("createJobListing", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var p = request.params;
    var jobType = (p.jobType || '').trim();
    var description = (p.description || '').trim();
    var salary = (p.salary == null ? '' : String(p.salary)).trim();
    var paymentMethod = (p.paymentMethod || '').trim();
    var imageUrl = (p.imageUrl || '').trim();
    var title = (p.title || '').trim();
if (title && title.length > 120) throw new Error('Başlık en fazla 120 karakter olabilir.');

    if (jobType.length < 2 || jobType.length > 80) throw new Error('İş türü 2-80 karakter olmalı.');
    if (description.length < 10 || description.length > 2000) throw new Error('Açıklama 10-2000 karakter olmalı.');
    if (!salary || salary.length > 60) throw new Error('Ücret bilgisi gerekli (en fazla 60 karakter).');
    if (!paymentMethod || paymentMethod.length > 60) throw new Error('Ödeme yöntemi gerekli (en fazla 60 karakter).');
    if (imageUrl && (imageUrl.length > 500 || !/^https?:\/\//i.test(imageUrl))) throw new Error('Geçerli bir görsel bağlantısı girin.');

    var _rlk = 'createJobListing:' + user.get('email');
    await checkRateLimit(_rlk, 5, 10 * 60 * 1000);
    await recordAttempt(_rlk);

    var limit = getJobListingLimit(user);
    async function countActive() {
        var q = new Parse.Query('JobListing');
        q.equalTo('owner_email', user.get('email'));
        q.equalTo('is_active', true);
        return await q.count({ useMasterKey: true });
    }
    if (limit !== -1 && (await countActive()) >= limit) {
        throw new Error('İlan hakkınız doldu! (Limit: ' + limit + '). Paketinizi yükseltebilirsiniz.');
    }

    var job = new Parse.Object('JobListing');
    job.set('job_number', await _nextJobNumber());
    job.set('owner_email', user.get('email'));
    job.set('owner_name', user.get('name') || 'Kullanıcı');
    job.set('job_type', jobType);
    job.set('description', description);
    if (title) job.set('title', title); 
    job.set('salary', salary);
    job.set('payment_method', paymentMethod);
    job.set('image_url', imageUrl);
    job.set('status', 'open');
    job.set('views', 0);
    job.set('is_active', true);
    await job.save(null, { useMasterKey: true });

    // Paralel isteklerle limit aşıldıysa geri al
    if (limit !== -1 && (await countActive()) > limit) {
        try { await job.destroy({ useMasterKey: true }); } catch (e) {}
        throw new Error('İlan hakkınız doldu! (Limit: ' + limit + ').');
    }

    return { success: true, id: job.id, job_number: job.get('job_number'), message: 'İlanınız yayınlandı! No: ' + job.get('job_number') };
});

Parse.Cloud.define("getJobListings", async function (request) {
    var page = Math.max(0, parseInt(request.params.page, 10) || 0);
    var pageSize = Math.min(50, Math.max(1, parseInt(request.params.pageSize, 10) || 20));
    var q = new Parse.Query('JobListing');
    q.equalTo('is_active', true);
    if (request.params.jobType) q.contains('job_type', String(request.params.jobType).substring(0, 80));
    if (request.params.status) q.equalTo('status', String(request.params.status));
    if (request.params.mine === true && request.user) q.equalTo('owner_email', request.user.get('email'));
    q.descending('createdAt');
    q.skip(page * pageSize);
    q.limit(pageSize);
    var total = await q.count({ useMasterKey: true });
    var rows = await q.find({ useMasterKey: true });
    var me = request.user ? request.user.get('email') : null;
    return {
        success: true,
        total: total,
        page: page,
        pageSize: pageSize,
        listings: rows.map(function (j) { return _jobToJson(j, me && j.get('owner_email') === me); })
    };
});

Parse.Cloud.define("getJobDetail", async function (request) {
    var id = request.params.jobId;
    if (!id) throw new Error('İlan ID gerekli!');
    var q = new Parse.Query('JobListing');
    q.equalTo('objectId', id);
    q.equalTo('is_active', true);
    var job = await q.first({ useMasterKey: true });
    if (!job) throw new Error('İlan bulunamadı.');
    job.increment('views', 1);
    await job.save(null, { useMasterKey: true });
    var me = request.user ? request.user.get('email') : null;
    return { success: true, listing: _jobToJson(job, me && job.get('owner_email') === me) };
});

Parse.Cloud.define("acceptJobListing", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var id = request.params.jobId;
    if (!id) throw new Error('İlan ID gerekli!');

    var _rlk = 'acceptJobListing:' + user.get('email');
    await checkRateLimit(_rlk, 10, 10 * 60 * 1000);
    await recordAttempt(_rlk);

    var q = new Parse.Query('JobListing');
    q.equalTo('objectId', id);
    q.equalTo('is_active', true);
    var job = await q.first({ useMasterKey: true });
    if (!job) throw new Error('İlan bulunamadı.');
    if (job.get('owner_email') === user.get('email')) throw new Error('Kendi ilanınızı kabul edemezsiniz.');
    if (job.get('status') === 'accepted') throw new Error('Bu ilan zaten kabul edilmiş.');

    job.set('status', 'accepted');
    job.set('accepted_by', user.get('email'));
    job.set('accepted_at', new Date());
    await job.save(null, { useMasterKey: true });

    try {
        var ownerQ = new Parse.Query(Parse.User);
        ownerQ.equalTo('email', job.get('owner_email'));
        var owner = await ownerQ.first({ useMasterKey: true });
        if (owner) {
            await sendNotificationToUser(owner,
                _jobEsc(job.get('job_number')) + ' numaralı "' + _jobEsc(job.get('job_type')) + '" ilanınızı ' +
                _jobEsc(user.get('name') || 'bir kullanıcı') + ' (' + _jobEsc(user.get('email')) + ') kabul etti. İletişime geçebilirsiniz!',
                'job_accepted');
        }
    } catch (e) {
        console.warn('İlan kabul bildirimi gönderilemedi:', e.message);
    }

    return { success: true, message: 'İlan kabul edildi. İlan sahibine bildirim gönderildi.', job_number: job.get('job_number') };
});

Parse.Cloud.define("editJobListing", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var id = request.params.jobId;
    if (!id) throw new Error('İlan ID gerekli!');

    var q = new Parse.Query('JobListing');
    q.equalTo('objectId', id);
    q.equalTo('is_active', true);
    var job = await q.first({ useMasterKey: true });
    if (!job) throw new Error('İlan bulunamadı.');
    if (job.get('owner_email') !== user.get('email')) throw new Error('Sadece ilan sahibi düzenleyebilir.');
    if (job.get('status') === 'accepted') throw new Error('Kabul edilmiş ilan düzenlenemez.');

    var p = request.params;
    if (p.jobType !== undefined) {
        var t = String(p.jobType).trim();
        if (t.length < 2 || t.length > 80) throw new Error('İş türü 2-80 karakter olmalı.');
        job.set('job_type', t);
    }
    if (p.title !== undefined) {
    var _t = String(p.title).trim();
    if (_t.length > 120) throw new Error('Başlık en fazla 120 karakter.');
    job.set('title', _t);
}
    if (p.description !== undefined) {
        var d = String(p.description).trim();
        if (d.length < 10 || d.length > 2000) throw new Error('Açıklama 10-2000 karakter olmalı.');
        job.set('description', d);
    }
    if (p.salary !== undefined) {
        var s = String(p.salary).trim();
        if (!s || s.length > 60) throw new Error('Ücret bilgisi geçersiz.');
        job.set('salary', s);
    }
    if (p.paymentMethod !== undefined) {
        var pm = String(p.paymentMethod).trim();
        if (!pm || pm.length > 60) throw new Error('Ödeme yöntemi geçersiz.');
        job.set('payment_method', pm);
    }
    if (p.imageUrl !== undefined) {
        var im = String(p.imageUrl).trim();
        if (im && (im.length > 500 || !/^https?:\/\//i.test(im))) throw new Error('Geçerli bir görsel bağlantısı girin.');
        job.set('image_url', im);
    }
    await job.save(null, { useMasterKey: true });
    return { success: true, message: 'İlan güncellendi.' };
});

Parse.Cloud.define("deleteJobListing", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var id = request.params.jobId;
    if (!id) throw new Error('İlan ID gerekli!');

    var q = new Parse.Query('JobListing');
    q.equalTo('objectId', id);
    var job = await q.first({ useMasterKey: true });
    if (!job) throw new Error('İlan bulunamadı.');
    if (job.get('owner_email') !== user.get('email')) throw new Error('Sadece ilan sahibi silebilir.');

    await job.destroy({ useMasterKey: true });
    return { success: true, message: 'İlan silindi.' };
});

console.log('✅ [YENİ] İş İlanları Mağazası + V27 güvenli reveal + completeGoogleProfile yüklendi');

// ================================================================
// [AETHRION v1.0.0] EKSİK FONKSİYONLAR — TAMAMLANDI
// ================================================================

// ─── C1: getFeatureUsage ───
Parse.Cloud.define("getFeatureUsage", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var feature = request.params.feature;
    var period = request.params.period || 'day';
    if (!feature) throw new Error('feature gerekli!');

    var now = new Date();
    var periodKey;
    if (period === 'month') periodKey = now.getFullYear() + '-' + (now.getMonth() + 1);
    else if (period === 'week') {
        var day = now.getDay();
        var diff = (day === 0 ? 6 : day - 1);
        var monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        periodKey = monday.toISOString().split('T')[0];
    } else if (period === 'lifetime') periodKey = 'all';
    else periodKey = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();

    var q = new Parse.Query(FeatureUsage);
    q.equalTo('user_email', user.get('email'));
    q.equalTo('feature', feature);
    q.equalTo('period', period);
    q.equalTo('period_key', periodKey);
    var rec = await q.first({ useMasterKey: true });

    return {
        success: true,
        count: rec ? (rec.get('count') || 0) : 0,
        feature: feature,
        period: period,
        periodKey: periodKey
    };
});

// ─── C2: createReminder + getReminders ───
Parse.Cloud.define("createReminder", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var title = request.params.title;
    var date = request.params.date;
    var time = request.params.time || '09:00';
    if (!title || !date) throw new Error('Başlık ve tarih gerekli!');

    try {
        var Reminder = Parse.Object.extend('Reminder');
        var r = new Reminder();
        r.set('user_email', user.get('email'));
        r.set('title', String(title).substring(0, 200));
        r.set('date', String(date));
        r.set('time', String(time));
        r.set('is_sent', false);
        r.set('created_at_client', new Date());
        await r.save(null, { useMasterKey: true });
        return { success: true, reminderId: r.id, message: 'Hatırlatıcı oluşturuldu: ' + title };
    } catch (e) {
        console.error('createReminder hatası:', e.message);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("getReminders", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var Reminder = Parse.Object.extend('Reminder');
    var q = new Parse.Query(Reminder);
    q.equalTo('user_email', user.get('email'));
    q.descending('date');
    q.limit(50);
    var list = await q.find({ useMasterKey: true });
    return {
        success: true,
        reminders: list.map(function(r) {
            return { id: r.id, title: r.get('title'), date: r.get('date'), time: r.get('time'), is_sent: r.get('is_sent') };
        })
    };
});

// ─── M1: saveAssistantSettings + getAssistantSettings ───
Parse.Cloud.define("saveAssistantSettings", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');

    var settings = {
        live_tracking: request.params.liveTracking === true,
        weekly_report: request.params.weeklyReport === true,
        notifications: request.params.notifications === true,
        voice_response: request.params.voiceResponse === true
    };

    user.set('assistant_settings', settings);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: 'Asistan ayarları kaydedildi!', settings: settings };
});

Parse.Cloud.define("getAssistantSettings", async function (request) {
    var user = request.user;
    if (!user) throw new Error('Giriş yapmalısınız!');
    var s = user.get('assistant_settings') || {};
    return {
        success: true,
        liveTracking: s.live_tracking !== false,
        weeklyReport: s.weekly_report !== false,
        notifications: s.notifications !== false,
        voiceResponse: s.voice_response !== false
    };
});

console.log('✅ [AETHRION] getFeatureUsage + createReminder + getReminders + saveAssistantSettings + getAssistantSettings yüklendi');

// ================================================================
// ================================================================
// SON LOG
// ================================================================
console.log('');
console.log('════════════════════════════════════════════════════════════');
console.log('✅ TÜM CLOUD CODE FONKSİYONLARI YÜKLENDİ! (v7.10.0 Back4App)');
console.log('════════════════════════════════════════════════════════════');
console.log('');
console.log('🎯 v7.10.0 YENİLİKLERİ:');
console.log('');
console.log('  [BÖLÜM 1] TEMEL + AI + AETHRION AI:');
console.log('    → Polyfills + Rate Limit + Fetch (Back4App)');
console.log('    → 41 sınıf (4 YENİ: FeatureUsage, ClientLog, VideoStudioJob, SystemConfig)');
console.log('    → initSchemas (TÜM sınıflar/kolonlar otomatik)');
console.log('    → 8 bireysel AI + callLocalLlama (13 Ollama) + callNvidiaNIM (7)');
console.log('    → superAI (3 katman: 13 Ollama + 7 NIM + 8 API = 28 MODEL)');
console.log('    → callCustomAI + callCustomAIWithKeys');
console.log('    → webSearch + sendEmail (Google + Resend)');
console.log('    → AETHRION AI: 4 mod (normal/deep/agent/developer)');
console.log('    → vizyonAlScreenRead + vizyonAlLiveScreenStream');
console.log('    → vizyonAlFileAnalyze + vizyonAlFileCreate');

// ================================================================
// AETHRION AUDIT TRAIL + STATUS DIAGNOSTICS (2026-10-22)
// Secrets are never returned; event fields are strictly allowlisted.
// ================================================================
var AethrionProjectAudit = Parse.Object.extend("AethrionProjectAudit");

function _aeSafeAuditText(value, maxLength) {
    return String(value == null ? "" : value).replace(/[\\x00-\\x1f\\x7f]/g, " ").trim().slice(0, maxLength);
}
function _aeRole(user) {
    return String(user && user.get ? user.get("role") || "user" : "user").toLowerCase();
}
function _aeIsPrivileged(user) {
    var role = _aeRole(user);
    return role === "founder" || role === "admin";
}
async function _aeRequireTeamAccess(user, teamId) {
    if (!user) throw new Error("Giriş yapmalısınız.");
    teamId = _aeSafeAuditText(teamId, 128);
    if (!teamId) throw new Error("Takım kimliği gerekli.");
    var team = await new Parse.Query("Team").get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı.");
    var email = String(user.get("email") || "").toLowerCase();
    var role = _aeRole(user);
    if (role === "founder" || role === "admin" || String(team.get("owner_email") || "").toLowerCase() === email || String(team.get("manager_email") || "").toLowerCase() === email) {
        return team;
    }
    var memberQuery = new Parse.Query("TeamMember");
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get("email"));
    var member = await memberQuery.first({ useMasterKey: true });
    if (!member && String(user.get("teamId") || "") !== teamId) throw new Error("Bu takımın denetim kayıtlarına erişim yetkiniz yok.");
    return team;
}

Parse.Cloud.define("aethrionListAuditTeams", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var email = String(user.get("email") || "");
    var role = _aeRole(user);
    var found = {};
    var teams = [];
    async function addTeam(team) {
        if (!team || !team.id || found[team.id]) return;
        found[team.id] = true;
        teams.push({ id: team.id, name: _aeSafeAuditText(team.get("name") || "Paylaşılan takım", 100) });
    }
    if (role === "founder" || role === "admin") {
        var allQuery = new Parse.Query("Team");
        allQuery.ascending("name");
        allQuery.limit(100);
        var allTeams = await allQuery.find({ useMasterKey: true });
        for (var ai = 0; ai < allTeams.length; ai++) await addTeam(allTeams[ai]);
    } else {
        var memberQuery = new Parse.Query("TeamMember");
        memberQuery.equalTo("user_email", email);
        memberQuery.limit(100);
        var memberships = await memberQuery.find({ useMasterKey: true });
        for (var mi = 0; mi < memberships.length; mi++) {
            var teamId = memberships[mi].get("team_id");
            if (!teamId) continue;
            try { await addTeam(await new Parse.Query("Team").get(teamId, { useMasterKey: true })); } catch (e) {}
        }
        var ownerQuery = new Parse.Query("Team");
        ownerQuery.equalTo("owner_email", email);
        ownerQuery.limit(100);
        var owned = await ownerQuery.find({ useMasterKey: true });
        for (var oi = 0; oi < owned.length; oi++) await addTeam(owned[oi]);
        var managerQuery = new Parse.Query("Team");
        managerQuery.equalTo("manager_email", email);
        managerQuery.limit(100);
        var managed = await managerQuery.find({ useMasterKey: true });
        for (var gi = 0; gi < managed.length; gi++) await addTeam(managed[gi]);
        var currentTeamId = String(user.get("teamId") || "");
        if (currentTeamId && !found[currentTeamId]) {
            try { await addTeam(await new Parse.Query("Team").get(currentTeamId, { useMasterKey: true })); } catch (e) {}
        }
    }
    teams.sort(function(a,b){ return a.name.localeCompare(b.name); });
    return { success: true, teams: teams };
});

Parse.Cloud.define("aethrionRecordProjectAudit", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var params = request.params || {};
    var teamId = _aeSafeAuditText(params.teamId, 128);
    await _aeRequireTeamAccess(user, teamId);
    var action = _aeSafeAuditText(params.action, 48);
    var allowed = ["project_created", "project_updated", "project_deleted", "project_shared", "project_unshared", "member_added", "member_removed", "role_changed", "file_uploaded", "file_removed", "comment_added", "comment_updated", "comment_deleted", "team_invite_sent", "task_completed", "settings_changed", "export_requested"];
    if (allowed.indexOf(action) === -1) throw new Error("İzin verilmeyen denetim eylemi.");
    var event = new AethrionProjectAudit();
    event.set("team_id", teamId);
    event.set("actor_id", crypto.createHash("sha256").update(String(user.id)).digest("hex").slice(0, 24));
    event.set("actor_role", _aeRole(user));
    event.set("action", action);
    event.set("target_id", params.targetId ? crypto.createHash("sha256").update(String(params.targetId)).digest("hex").slice(0, 24) : "");
    event.set("target_label", "İşlem hedefi");
    event.set("source", "authenticated-client-event");
    event.set("privacy_scrubbed", true);
    event.set("created_at_server", new Date());
    await event.save(null, { useMasterKey: true });
    return { success: true, id: event.id, source: "authenticated-client-event", note: "Bu kayıt, kimliği doğrulanmış kullanıcının bildirdiği olayı kaydeder; dış sistemdeki işlemin başarılı olduğunun tek başına kanıtı değildir." };
});

Parse.Cloud.define("aethrionGetProjectAudit", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var params = request.params || {};
    var teamId = _aeSafeAuditText(params.teamId, 128);
    await _aeRequireTeamAccess(user, teamId);
    var limit = Math.max(1, Math.min(100, parseInt(params.limit, 10) || 50));
    var query = new Parse.Query("AethrionProjectAudit");
    query.equalTo("team_id", teamId);
    query.descending("createdAt");
    query.limit(limit);
    var events = await query.find({ useMasterKey: true });
    return {
        success: true,
        events: events.map(function (event) {
            return {
                id: event.id,
                actorId: (function (v) { v = String(v || ""); return /^[a-f0-9]{24}$/i.test(v) ? v : (v ? crypto.createHash("sha256").update(v).digest("hex").slice(0, 24) : ""); })(event.get("actor_id")),
                actorEmail: "",
                actorName: "Kullanıcı",
                actorRole: event.get("actor_role") || "user",
                action: event.get("action") || "",
                targetId: (function (v) { v = String(v || ""); return /^[a-f0-9]{24}$/i.test(v) ? v : (v ? crypto.createHash("sha256").update(v).digest("hex").slice(0, 24) : ""); })(event.get("target_id")),
                targetLabel: "İşlem hedefi",
                source: event.get("source") || "server",
                createdAt: event.get("created_at_server") || event.get("createdAt") || null
            };
        })
    };
});


/* Public aggregate counters. No user identifiers or private fields are returned. */
var _aethrionPublicStatsCache = null;
var _aethrionPublicStatsCacheAt = 0;
Parse.Cloud.define("getPublicStats", async function () {
    if (_aethrionPublicStatsCache && Date.now() - _aethrionPublicStatsCacheAt < 300000) {
        return Object.assign({}, _aethrionPublicStatsCache);
    }
    try {
        var cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        var activeQuery = new Parse.Query(Parse.User);
        activeQuery.greaterThanOrEqualTo("updatedAt", cutoff);
        var activeUsers = await activeQuery.count({ useMasterKey: true });

        var totalQueries = 0;
        for (var offset = 0; offset < 20000; offset += 1000) {
            var usageQuery = new Parse.Query(QueryStat);
            usageQuery.ascending("createdAt");
            usageQuery.limit(1000);
            if (offset > 0) usageQuery.skip(offset);
            var usageRows = await usageQuery.find({ useMasterKey: true });
            for (var qi = 0; qi < usageRows.length; qi++) {
                totalQueries += Math.max(0, Number(usageRows[qi].get("count") || 0));
            }
            if (usageRows.length < 1000) break;
        }

        var completedProjects = 0;
        var projectQuery = new Parse.Query(Project);
        projectQuery.limit(1000);
        var projectRows = await projectQuery.find({ useMasterKey: true });
        for (var pi = 0; pi < projectRows.length; pi++) {
            var projectStatus = String(projectRows[pi].get("status") || projectRows[pi].get("state") || "").toLowerCase();
            if (projectStatus === "completed" || projectStatus === "complete" ||
                projectRows[pi].get("is_completed") === true || projectRows[pi].get("completed") === true) {
                completedProjects++;
            }
        }

        _aethrionPublicStatsCache = {
            success: true,
            activeUsers: Math.max(0, Number(activeUsers) || 0),
            totalQueries: Math.max(0, Number(totalQueries) || 0),
            completedProjects: Math.max(0, Number(completedProjects) || 0)
        };
        _aethrionPublicStatsCacheAt = Date.now();
        return Object.assign({}, _aethrionPublicStatsCache);
    } catch (error) {
        console.error("[AETHRION Stats] Public aggregate counters could not be calculated.");
        return { success: false, activeUsers: 0, totalQueries: 0, completedProjects: 0 };
    }
});

Parse.Cloud.define("aethrionGetDiagnostics", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    if (!_aeIsPrivileged(user)) throw new Error("Bu panel yalnızca yönetici ve kurucu hesaplarına açıktır.");
    var checks = [];
    function add(name, status, detail) { checks.push({ name: name, status: status, detail: detail }); }

    add("Oturum ve yetki", "ok", "Kimliği doğrulanmış yönetici/kurucu oturumu doğrulandı.");
    try {
        var userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("objectId", user.id);
        var dbUser = await userQuery.first({ useMasterKey: true });
        add("Parse veri deposu", dbUser ? "ok" : "warn", dbUser ? "Düşük etkili kullanıcı sorgusu başarılı." : "Kullanıcı kaydı sorgudan dönmedi.");
    } catch (e) {
        add("Parse veri deposu", "bad", "Veri deposu sorgusu başarısız. Back4App bağlantısını ve Cloud Code loglarını kontrol edin.");
    }

    var config = null;
    try {
        config = await Parse.Config.get({ useMasterKey: true });
        add("Parse Config", "ok", "Sunucu yapılandırmasına erişildi; gizli değerler gösterilmiyor.");
    } catch (e) {
        add("Parse Config", "bad", "Sunucu yapılandırması okunamadı. Back4App Config ve izinleri kontrol edin.");
    }

    function configured(name) {
        try { if (typeof process !== "undefined" && process.env && process.env[name]) return true; } catch (e) {}
        try { return !!(config && config.get && config.get(name)); } catch (e) { return false; }
    }
    async function probe(url, key, headerName) {
        if (typeof fetch !== "function") return { ok: false, detail: "Bu çalışma ortamında güvenli HTTP probe desteği yok." };
        try {
            var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 7000) : null;
            var headers = {};
            headers[headerName || "Authorization"] = headerName ? key : "Bearer " + key;
            var response = await fetch(url, { method: "GET", headers: headers, signal: controller ? controller.signal : undefined });
            if (timeoutId) clearTimeout(timeoutId);
            if (response.ok) return { ok: true, detail: "Sağlayıcı uç noktası HTTP " + response.status + " yanıtı verdi." };
            return { ok: false, detail: "Sağlayıcı uç noktası HTTP " + response.status + " döndürdü; erişim/limit yapılandırmasını kontrol edin." };
        } catch (e) {
            return { ok: false, detail: "Bağlantı probe başarısız veya zaman aşımına uğradı; ham hata ve hassas veriler gösterilmedi." };
        }
    }
    async function secret(name) {
        try { if (typeof process !== "undefined" && process.env && process.env[name]) return process.env[name]; } catch (e) {}
        try { return config && config.get ? config.get(name) : null; } catch (e) { return null; }
    }
    var providers = [
        { key: "OPENAI_KEY", label: "OpenAI model erişimi", url: "https://api.openai.com/v1/models" },
        { key: "DEEPSEEK_KEY", label: "DeepSeek model erişimi", url: "https://api.deepseek.com/models" },
        { key: "GROQ_KEY", label: "Groq model erişimi", url: "https://api.groq.com/openai/v1/models" },
        { key: "NVIDIA_API_KEY", label: "NVIDIA model erişimi", url: null },
        { key: "OPENROUTER_KEY", label: "OpenRouter model erişimi", url: "https://openrouter.ai/api/v1/models" },
        { key: "DEEPINFRA_KEY", label: "DeepInfra model erişimi", url: "https://api.deepinfra.com/v1/openai/models" },
        { key: "CEREBRAS_KEY", label: "Cerebras model erişimi", url: "https://api.cerebras.ai/v1/models" },
        { key: "GEMINI_KEY", label: "Gemini model erişimi", url: "https://generativelanguage.googleapis.com/v1beta/models", header: "x-goog-api-key" }
    ];
    for (var pi = 0; pi < providers.length; pi++) {
        var provider = providers[pi];
        var keyValue = await secret(provider.key);
        if (!keyValue) {
            add(provider.label, "warn", "Yapılandırma anahtarı bulunamadı veya bu ortamda görünür değil.");
            continue;
        }
        if (provider.url) {
            var result = await probe(provider.url, keyValue, provider.header);
            add(provider.label, result.ok ? "ok" : "bad", result.detail);
        } else if (provider.key === "NVIDIA_API_KEY") {
            var base = await secret("NVIDIA_BASE_URL");
            if (base) {
                var nvidiaBase = String(base); while (nvidiaBase.endsWith("/")) nvidiaBase = nvidiaBase.slice(0, -1);
                var nvidiaResult = await probe(nvidiaBase + "/models", keyValue);
                add(provider.label, nvidiaResult.ok ? "ok" : "bad", nvidiaResult.detail);
            } else {
                add(provider.label, "warn", "API anahtarı mevcut ancak NVIDIA_BASE_URL eksik; uç nokta probe edilemedi.");
            }
        } else {
            add(provider.label, "ok", "Güvenlik yapılandırması mevcut; bu kontrol sağlayıcıya test isteği göndermiyor.");
        }
    }

    var vercelToken = await secret("VERCEL_READONLY_TOKEN");
    var vercelProjectId = await secret("VERCEL_PROJECT_ID");
    if (!vercelToken || !vercelProjectId) {
        add("Vercel dağıtımı", "warn", "VERCEL_READONLY_TOKEN veya VERCEL_PROJECT_ID yapılandırılmadığı için canlı dağıtım durumu sorgulanamıyor.");
    } else {
        try {
            var vercelTeamId = await secret("VERCEL_TEAM_ID");
            var vercelUrl = "https://api.vercel.com/v6/deployments?projectId=" + encodeURIComponent(vercelProjectId) + "&limit=1";
            if (vercelTeamId) vercelUrl += "&teamId=" + encodeURIComponent(vercelTeamId);
            var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 7000) : null;
            var vr = await fetch(vercelUrl, { headers: { Authorization: "Bearer " + vercelToken }, signal: controller ? controller.signal : undefined });
            if (timeoutId) clearTimeout(timeoutId);
            if (!vr.ok) {
                add("Vercel dağıtımı", "bad", "Vercel API HTTP " + vr.status + " yanıtı verdi; salt okunur token/proje erişimini kontrol edin.");
            } else {
                var vd = await vr.json();
                var deployment = vd && vd.deployments && vd.deployments[0];
                if (!deployment) add("Vercel dağıtımı", "warn", "Vercel API yanıt verdi ancak bu proje için dağıtım bulunamadı.");
                else {
                    var state = String(deployment.readyState || deployment.state || "UNKNOWN").toUpperCase();
                    var stateStatus = state === "READY" ? "ok" : (state === "ERROR" || state === "CANCELED" ? "bad" : "warn");
                    add("Vercel dağıtımı", stateStatus, "En son dağıtım durumu: " + state + (deployment.createdAt ? " · oluşturulma: " + new Date(deployment.createdAt).toISOString() : "") + ".");
                }
            }
        } catch (e) {
            add("Vercel dağıtımı", "bad", "Vercel durum sorgusu başarısız veya zaman aşımına uğradı; ham hata ve token gösterilmedi.");
        }
    }
    add("Cloud Code", "ok", "Bu tanılama işlevinin yanıt vermesi, mevcut Cloud Code çağrısının çalıştığını doğrular.");
    return { success: true, generatedAt: new Date().toISOString(), checks: checks };
});


// AETHRION TEAMS: secure team chat with bounded file attachments.
Parse.Cloud.define("aethrionGetTeamMessages", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var teamId = _aeSafeAuditText(request.params && request.params.teamId, 128);
    await _aeRequireTeamAccess(user, teamId);
    var limit = Math.max(1, Math.min(100, parseInt(request.params && request.params.limit, 10) || 50));
    var query = new Parse.Query(TeamMessage);
    query.equalTo("team_id", teamId);
    query.descending("createdAt");
    query.limit(limit);
    var rows = await query.find({ useMasterKey: true });
    rows = rows.filter(function (row) { return row.get("deleted") !== true; }).reverse();
    return { success: true, messages: rows.map(function (row) {
        return {
            id: row.id,
            userEmail: _aeSafeAuditText(row.get("user_email") || "", 254),
            userName: _aeSafeAuditText(row.get("user_name") || "Takım üyesi", 100),
            message: _aeSafeAuditText(row.get("message") || "", 4000),
            fileUrl: row.get("fileUrl") || null,
            fileName: _aeSafeAuditText(row.get("fileName") || "", 180),
            fileType: _aeSafeAuditText(row.get("fileType") || "", 120),
            createdAt: row.createdAt || null
        };
    }) };
});

Parse.Cloud.define("aethrionSendTeamMessage", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var params = request.params || {};
    var teamId = _aeSafeAuditText(params.teamId, 128);
    var text = _aeSafeAuditText(params.message || "", 4000);
    var fileBase64 = typeof params.fileBase64 === "string" ? params.fileBase64 : "";
    var fileName = String(params.fileName || "").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150);
    var fileType = String(params.fileType || "application/octet-stream").slice(0, 120);
    await _aeRequireTeamAccess(user, teamId);
    if (!text && !fileBase64) throw new Error("Mesaj veya dosya eklemelisiniz.");
    if (fileBase64.length > 7 * 1024 * 1024) throw new Error("Takım dosyası en fazla 5 MB olabilir.");
    var fileUrl = null;
    if (fileBase64) {
        if (!fileName) fileName = "aethrion-team-file";
        var allowed = /^image\/(png|jpeg|webp|gif)$|^application\/pdf$|^audio\//i.test(fileType) || /^video\//i.test(fileType) ||
            /^text\/(plain|markdown|csv)$/i.test(fileType) || /^application\/json$/i.test(fileType) ||
            /\.(docx|xlsx|xls|txt|md|csv|json|js|ts|py|html|css|xml|ya?ml|log|pdf|png|jpe?g|webp|gif|mp3|wav|ogg|m4a|aac|mp4|mov|avi|mkv|webm)$/i.test(fileName);
        if (!allowed) throw new Error("Bu dosya türü desteklenmiyor. Görsel, PDF, metin veya kod dosyası seçin.");
        var parseFile = new Parse.File(fileName, { base64: fileBase64 });
        await parseFile.save(null, { useMasterKey: true });
        fileUrl = parseFile.url();
    }
    var row = new TeamMessage();
    row.set("team_id", teamId);
    row.set("user_email", String(user.get("email") || "").toLowerCase());
    row.set("user_name", _aeSafeAuditText(user.get("name") || user.get("username_display") || user.get("email") || "Takım üyesi", 100));
    row.set("message", text);
    row.set("fileUrl", fileUrl);
    row.set("fileName", fileName || "");
    row.set("fileType", fileType);
    row.set("deleted", false);
    await row.save(null, { useMasterKey: true });
    try {
        var event = new AethrionProjectAudit();
        event.set("team_id", teamId);
        event.set("actor_id", crypto.createHash("sha256").update(String(user.id)).digest("hex").slice(0, 24));
        event.set("actor_role", _aeRole(user));
        event.set("action", "file_uploaded");
        event.set("target_label", fileBase64 ? "Takım dosyası" : "Takım mesajı");
        event.set("source", "server-team-message");
        event.set("privacy_scrubbed", true);
        event.set("created_at_server", new Date());
        await event.save(null, { useMasterKey: true });
    } catch (auditError) { console.error("AETHRION Teams mesaj denetim kaydı yazılamadı."); }
    return { success: true, message: { id: row.id, fileUrl: fileUrl, fileName: fileName, createdAt: row.createdAt || new Date() } };
});

// AETHRION TEAMS: üyeleri güvenli listeleme ve rol atama
Parse.Cloud.define("aethrionTeamAskAI", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var params = request.params || {};
    var teamId = _aeSafeAuditText(params.teamId, 128);
    var message = _aeSafeAuditText(params.message || "", 3000);
    var fileBase64 = typeof params.fileBase64 === "string" ? params.fileBase64 : "";
    var fileName = String(params.fileName || "dosya").slice(0, 180);
    var fileType = String(params.fileType || "application/octet-stream").toLowerCase().slice(0, 120);
    await _aeRequireTeamAccess(user, teamId);
    if (fileBase64.length > 11 * 1024 * 1024) throw new Error("AI eki en fazla 8 MB olabilir.");
    var answer = "";
    try {
        var sessionToken = typeof user.getSessionToken === "function" ? user.getSessionToken() : null;
        if (fileBase64) {
            var analysis = await Parse.Cloud.run("vizyonAlFileAnalyze", {
                fileBase64: fileBase64,
                fileName: fileName,
                fileType: fileType,
                question: message || "Bu takım dosyasını oku, özetle ve önemli noktalarını açıkla."
            }, sessionToken ? { sessionToken: sessionToken } : {});
            if (!analysis || analysis.success !== true) throw new Error((analysis && analysis.error) || "Dosya analizi başarısız.");
            answer = String(analysis.reply || "");
        } else {
            if (!message) throw new Error("AI'ya yöneltilecek bir mesaj gerekli.");
            var chat = await Parse.Cloud.run("vizyonAlChat", {
                message: "Takım bağlamında yanıt ver. Soruyu ve ek açıklamaları dikkate al: " + message,
                mode: "normal"
            }, sessionToken ? { sessionToken: sessionToken } : {});
            answer = typeof chat === "string" ? chat : String((chat && (chat.reply || chat.response || chat.text || chat.message)) || "");
        }
        if (!answer) throw new Error("AI boş yanıt döndürdü.");
        answer = answer.slice(0, 12000);
        var aiRow = new TeamMessage();
        aiRow.set("team_id", teamId);
        aiRow.set("user_email", "aethrion-ai@system.local");
        aiRow.set("user_name", "AETHRION AI");
        aiRow.set("message", answer);
        aiRow.set("fileUrl", null);
        aiRow.set("fileName", "");
        aiRow.set("fileType", "text/plain");
        aiRow.set("deleted", false);
        await aiRow.save(null, { useMasterKey: true });
        return { success: true, reply: answer, messageId: aiRow.id };
    } catch (error) {
        console.error("[AETHRION Teams AI] Request failed:", String(error && error.message || error).slice(0, 220));
        return { success: false, error: "AETHRION AI yanıt veremedi. AI hizmeti ve dosya türünü kontrol edip tekrar deneyin." };
    }
});

Parse.Cloud.define("aethrionGetTeamWorkspace", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var teamId = _aeSafeAuditText(request.params && request.params.teamId, 128);
    var team = await _aeRequireTeamAccess(user, teamId);
    var query = new Parse.Query("TeamMember");
    query.equalTo("team_id", teamId);
    query.limit(200);
    var members = await query.find({ useMasterKey: true });
    var isPrivileged = _aeIsPrivileged(user);
    var isOwner = String(team.get("owner_email") || "").toLowerCase() === String(user.get("email") || "").toLowerCase();
    var isManager = String(team.get("manager_email") || "").toLowerCase() === String(user.get("email") || "").toLowerCase();
    var selfMembership = await new Parse.Query("TeamMember").equalTo("team_id", teamId).equalTo("user_email", user.get("email")).first({ useMasterKey: true });
    var isTeamAdmin = !!(selfMembership && String(selfMembership.get("role") || "").toLowerCase() === "admin");
    return {
        team: { id: team.id, name: _aeSafeAuditText(team.get("name") || "Takım", 100) },
        canManageRoles: isPrivileged || isOwner || isManager || isTeamAdmin,
        members: members.map(function (member) {
            return {
                id: member.id,
                email: _aeSafeAuditText(member.get("user_email") || "", 254),
                role: String(member.get("user_email") || "").toLowerCase() === String(team.get("owner_email") || "").toLowerCase() ? "admin" : (String(member.get("user_email") || "").toLowerCase() === String(team.get("manager_email") || "").toLowerCase() ? "admin" : _aeSafeAuditText(member.get("role") || "viewer", 32).toLowerCase()),
                name: _aeSafeAuditText(member.get("user_name") || member.get("name") || member.get("user_email") || "Üye", 100)
            };
        })
    };
});

Parse.Cloud.define("aethrionGetTeamSchedule", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var teamId = _aeSafeAuditText(request.params && request.params.teamId, 128);
    await _aeRequireTeamAccess(user, teamId);
    var now = Date.now();
    var query = new Parse.Query("TeamTask");
    query.equalTo("team_id", teamId);
    query.greaterThanOrEqualTo("date", new Date(now - 90 * 86400000));
    query.lessThanOrEqualTo("date", new Date(now + 180 * 86400000));
    query.ascending("date"); query.limit(200);
    var tasks = await query.find({ useMasterKey: true });
    var completed = Array.isArray(user.get("completed_team_tasks")) ? user.get("completed_team_tasks") : [];
    return { success: true, events: tasks.map(function (task) {
        return { id: task.id, title: _aeSafeAuditText(task.get("task_text") || task.get("title") || "Takım etkinliği", 180),
            startsAt: task.get("date") || task.createdAt || null, points: Number(task.get("points") || 0), completed: completed.indexOf(task.id) !== -1 };
    }) };
});

Parse.Cloud.define("aethrionGetMyAiUsage", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var email = String(user.get("email") || "").toLowerCase();
    if (!email) return { success: true, items: [] };
    var query = new Parse.Query(FeatureUsage);
    query.equalTo("user_email", email); query.descending("last_updated"); query.limit(100);
    var records = await query.find({ useMasterKey: true });
    var items = records.filter(function (record) {
        return /aethrion|vizyonal|koc|assistant|chat|voice|screenread|fileanalyze|nvidia|groq|deepseek|openai|gemini/i.test(String(record.get("feature") || ""));
    }).slice(0, 30).map(function (record) {
        return { feature: _aeSafeAuditText(record.get("feature") || "AI", 80), count: Math.max(0, Number(record.get("count") || 0)),
            period: _aeSafeAuditText(record.get("period") || "day", 16), periodKey: _aeSafeAuditText(record.get("period_key") || "", 32),
            lastUpdated: record.get("last_updated") || record.updatedAt || record.createdAt || null };
    });
    return { success: true, items: items };
});

Parse.Cloud.define("aethrionSetTeamMemberRole", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    var params = request.params || {};
    var teamId = _aeSafeAuditText(params.teamId, 128);
    var memberId = _aeSafeAuditText(params.memberId, 128);
    var role = String(params.role || "").toLowerCase();
    if (["admin", "editor", "viewer"].indexOf(role) === -1) throw new Error("Rol admin, editor veya viewer olmalıdır.");
    if (!memberId) throw new Error("Üye kimliği gerekli.");
    var team = await _aeRequireTeamAccess(user, teamId);
    var email = String(user.get("email") || "").toLowerCase();
    var selfMembership = await new Parse.Query("TeamMember").equalTo("team_id", teamId).equalTo("user_email", user.get("email")).first({ useMasterKey: true });
    var mayManage = _aeIsPrivileged(user) ||
        String(team.get("owner_email") || "").toLowerCase() === email ||
        String(team.get("manager_email") || "").toLowerCase() === email ||
        !!(selfMembership && String(selfMembership.get("role") || "").toLowerCase() === "admin");
    if (!mayManage) throw new Error("Bu takımda rol değiştirme yetkiniz yok.");
    var member = await new Parse.Query("TeamMember").get(memberId, { useMasterKey: true });
    if (String(member.get("team_id") || "") !== teamId) throw new Error("Üye bu takıma ait değil.");
    if (String(member.get("user_email") || "").toLowerCase() === String(team.get("owner_email") || "").toLowerCase() && role !== "admin") {
        throw new Error("Takım sahibinin rolü düşürülemez.");
    }
    var oldRole = String(member.get("role") || "viewer").toLowerCase();
    member.set("role", role);
    await member.save(null, { useMasterKey: true });
    try {
        var event = new AethrionProjectAudit();
        event.set("team_id", teamId);
        event.set("actor_id", crypto.createHash("sha256").update(String(user.id)).digest("hex").slice(0, 24));
        event.set("actor_role", _aeRole(user));
        event.set("action", "role_changed");
        event.set("target_id", crypto.createHash("sha256").update(String(member.id)).digest("hex").slice(0, 24));
        event.set("target_label", "Takım üyesi");
        event.set("source", "server-role-change");
    event.set("privacy_scrubbed", true);
        event.set("created_at_server", new Date());
        event.set("previous_role", oldRole);
        event.set("new_role", role);
        await event.save(null, { useMasterKey: true });
    } catch (auditError) {
        console.error("AETHRION Teams denetim kaydı oluşturulamadı.");
    }
    return { success: true, memberId: member.id, role: role };
});

// API anahtarıyla güvenli kullanım istatistiği; anahtar başına usage:read izni gerekir.
Parse.Cloud.define("aethrionScrubAuditPersonalData", async function (request) {
    var user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    if (!_aeIsPrivileged(user)) throw new Error("Bu bakım işlemi yalnızca admin ve founder rollerine açıktır.");
    var limit = Math.max(1, Math.min(100, parseInt(request.params && request.params.limit, 10) || 50));
    var query = new Parse.Query("AethrionProjectAudit");
    query.doesNotExist("privacy_scrubbed");
    query.ascending("createdAt");
    query.limit(limit);
    var events = await query.find({ useMasterKey: true });
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var actorId = event.get("actor_id");
        if (actorId) event.set("actor_id", crypto.createHash("sha256").update(String(actorId)).digest("hex").slice(0, 24));
        var targetId = event.get("target_id");
        if (targetId) event.set("target_id", crypto.createHash("sha256").update(String(targetId)).digest("hex").slice(0, 24));
        event.unset("actor_email");
        event.unset("actor_name");
        event.set("target_label", "İşlem hedefi");
        event.set("privacy_scrubbed", true);
        await event.save(null, { useMasterKey: true });
    }
    return { success: true, processed: events.length, more: events.length === limit, message: "Kişisel alanlar temizlendi; more=true ise işlemi tekrar çalıştır." };
});

Parse.Cloud.define("aethrionGetApiUsage", async function (request) {
    var apiKey = (request.headers && (request.headers["x-v27-api-key"] || request.headers["X-V27-Api-Key"])) || (request.params && request.params.apiKey);
    if (!apiKey || String(apiKey).length > 512) throw new Error("API anahtarı gerekli.");
    var hash = crypto.createHash("sha256").update(String(apiKey)).digest("hex");
    var query = new Parse.Query(V27ApiKey);
    query.equalTo("key_hash", hash);
    query.equalTo("is_active", true);
    var record = await query.first({ useMasterKey: true });
    if (!record) throw new Error("API anahtarı geçersiz veya iptal edilmiş.");
    var expiresAt = record.get("expires_at");
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) throw new Error("API anahtarının süresi dolmuş.");
    var scopes = Array.isArray(record.get("allowed_scopes")) && record.get("allowed_scopes").length ? record.get("allowed_scopes") : ["chat"];
    if (scopes.indexOf("usage:read") === -1) throw new Error("Bu API anahtarında usage:read izni yok.");
    return {
        success: true,
        keyName: _aeSafeAuditText(record.get("key_name") || "", 50),
        usageCount: Number(record.get("usage_count") || 0),
        lastUsedAt: record.get("last_used_at") || null,
        expiresAt: expiresAt || null,
        scopes: scopes
    };
});

async function _aeWriteTeamAudit(user, teamId, action, targetId, targetLabel) {
    try {
        var event = new AethrionProjectAudit();
        event.set("team_id", _aeSafeAuditText(teamId, 128));
        event.set("actor_id", crypto.createHash("sha256").update(String(user.id)).digest("hex").slice(0, 24));
        event.set("actor_role", _aeRole(user));
        event.set("action", _aeSafeAuditText(action, 48));
        event.set("target_id", targetId ? crypto.createHash("sha256").update(String(targetId)).digest("hex").slice(0, 24) : "");
        event.set("target_label", _aeSafeAuditText(targetLabel || "İşlem hedefi", 120));
        event.set("source", "server-confirmed-operation");
    event.set("privacy_scrubbed", true);
        event.set("created_at_server", new Date());
        await event.save(null, { useMasterKey: true });
        return true;
    } catch (e) {
        console.error("AETHRION denetim kaydı yazılamadı; kişisel veri veya hata ayrıntısı kaydedilmedi.");
        return false;
    }
}

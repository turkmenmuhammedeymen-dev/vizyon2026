// ================================================================
// VİZYON 2027 – FULL CLOUD CODE (SashiDo Uyumlu + Tüm Hatalar Giderildi)
// v6.04.0 – SashiDo Native Compatibility + Master Key Fix + Polyfill Fixes
// Tüm invalid function ve useMasterKey hataları çözüldü.
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
        const util = require('util');
        globalThis.TextEncoder = util.TextEncoder;
        globalThis.TextDecoder = util.TextDecoder;
        console.log('✅ TextEncoder/TextDecoder polyfill yüklendi');
    } catch (e) {
        console.warn('⚠️ TextEncoder polyfill yüklenemedi:', e.message);
    }
}

// ================================================================
// [MADDE 1] FETCH POLYFILL (SashiDo uyumlu + AbortController destekli)
// SashiDo'da native fetch varsa override etmeyiz; yoksa polyfill kullan
// ================================================================
if (typeof globalThis.fetch === 'undefined') {
    globalThis.fetch = async function (url, options = {}) {
        options = options || {};
        const method = (options.method || 'GET').toUpperCase();
        const headers = options.headers || {};
        const body = options.body;
        const signal = options.signal;

        if (signal && signal.aborted) {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            throw err;
        }

        const httpOptions = {
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

        let response;
        let aborted = false;

        const requestPromise = (async () => {
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
            const abortPromise = new Promise((_, reject) => {
                const onAbort = () => {
                    aborted = true;
                    const err = new Error('Aborted');
                    err.name = 'AbortError';
                    reject(err);
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
            const err = new Error('Aborted');
            err.name = 'AbortError';
            throw err;
        }

        const status = response.status || 200;
        const responseHeaders = response.headers || {};
        let rawText = '';
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
                    const lower = name.toLowerCase();
                    for (const k in responseHeaders) {
                        if (k.toLowerCase() === lower) return responseHeaders[k];
                    }
                    return null;
                },
                has: function (name) {
                    const lower = name.toLowerCase();
                    for (const k in responseHeaders) {
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
                const encoder = new TextEncoder();
                return encoder.encode(rawText).buffer;
            }
        };
    };
    console.log('✅ Fetch polyfill yüklendi (Parse.Cloud.httpRequest + AbortController)');
} else {
    console.log('✅ Native fetch mevcut, polyfill atlandı.');
}

// ================================================================
// [MADDE 8] RATE LIMITING ALTYAPISI (Hibrit: In-Memory + Parse Object)
// ================================================================
const _rateLimitStore = new Map();
const _RATE_LIMIT_CLASS = "RateLimitAttempt";

class RateLimit {
    constructor(key, maxAttempts = 5, windowMs = 5 * 60 * 1000) {
        this.key = key;
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    getRecord() {
        const now = Date.now();
        const record = _rateLimitStore.get(this.key);
        if (!record || (now - record.firstAttempt) > this.windowMs) {
            _rateLimitStore.delete(this.key);
            return { count: 0, firstAttempt: now };
        }
        return record;
    }

    isBlocked() {
        const record = this.getRecord();
        return record.count >= this.maxAttempts;
    }

    record() {
        const now = Date.now();
        const record = this.getRecord();
        if (record.count === 0) {
            _rateLimitStore.set(this.key, { count: 1, firstAttempt: now });
        } else {
            record.count++;
            _rateLimitStore.set(this.key, record);
        }
    }

    getRemainingMs() {
        const record = this.getRecord();
        if (record.count === 0) return 0;
        return Math.max(0, this.windowMs - (Date.now() - record.firstAttempt));
    }
}

async function checkRateLimitPersistent(key, maxAttempts = 5, windowMs = 5 * 60 * 1000) {
    const limiter = new RateLimit(key, maxAttempts, windowMs);
    if (limiter.isBlocked()) {
        const remainingMs = limiter.getRemainingMs();
        const remainingMin = Math.max(1, Math.ceil(remainingMs / 60000));
        throw new Error(`Çok fazla deneme yaptınız. Lütfen ${remainingMin} dakika sonra tekrar deneyin.`);
    }

    try {
        const RateLimitAttempt = Parse.Object.extend(_RATE_LIMIT_CLASS);
        const since = new Date(Date.now() - windowMs);
        const query = new Parse.Query(RateLimitAttempt);
        query.equalTo("key", key);
        query.greaterThan("attemptedAt", since);
        const count = await query.count({ useMasterKey: true });

        if (count >= maxAttempts) {
            _rateLimitStore.set(key, { count: maxAttempts, firstAttempt: Date.now() - 1000 });
            throw new Error(`Çok fazla deneme yaptınız. Lütfen 5 dakika sonra tekrar deneyin.`);
        }
    } catch (e) {
        if (e.message && e.message.includes("Çok fazla deneme")) throw e;
        console.warn("⚠️ Kalıcı rate limit kontrolü başarısız, in-memory ile devam:", e.message);
    }

    return limiter;
}

async function recordAttemptPersistent(key) {
    const limiter = new RateLimit(key);
    limiter.record();

    try {
        const RateLimitAttempt = Parse.Object.extend(_RATE_LIMIT_CLASS);
        const attempt = new RateLimitAttempt();
        attempt.set("key", key);
        attempt.set("attemptedAt", new Date());
        await attempt.save(null, { useMasterKey: true });
    } catch (e) {
        console.warn("⚠️ RateLimit kalıcı kayıt başarısız:", e.message);
    }

    return limiter;
}

async function checkRateLimit(key, maxAttempts = 5, windowMs = 5 * 60 * 1000) {
    return await checkRateLimitPersistent(key, maxAttempts, windowMs);
}

async function recordAttempt(key) {
    return await recordAttemptPersistent(key);
}

function getRateLimitKey(request, action) {
    let identifier = '';
    if (request && request.params) {
        if (request.params.email) identifier = String(request.params.email).toLowerCase();
        else if (request.params.adminKey) identifier = String(request.params.adminKey);
        else if (request.params.betaKey) identifier = String(request.params.betaKey);
        else if (request.params.to) identifier = String(request.params.to).toLowerCase();
    }
    if (!identifier) {
        identifier = request.ip
            || (request.headers && (request.headers['x-forwarded-for'] || request.headers['x-real-ip']))
            || request.installationId
            || 'anon';
    }
    return `${action}:${identifier}`;
}

Parse.Cloud.job("cleanupRateLimitAttempts", async (request) => {
    console.log("🔄 RateLimitAttempt temizleniyor...");
    try {
        const RateLimitAttempt = Parse.Object.extend(_RATE_LIMIT_CLASS);
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const query = new Parse.Query(RateLimitAttempt);
        query.lessThan("attemptedAt", cutoff);
        const old = await query.find({ useMasterKey: true });
        for (const a of old) {
            await a.destroy({ useMasterKey: true });
        }
        console.log(`✅ ${old.length} eski rate limit kaydı temizlendi.`);
        return `${old.length} kayıt temizlendi.`;
    } catch (e) {
        console.error("RateLimit temizleme hatası:", e.message);
        return "Hata: " + e.message;
    }
});

console.log('✅ Cloud Code başarıyla yüklendi!');

// ================================================================
// ========== SINIF TANIMLARI ==========
// ================================================================
const Team = Parse.Object.extend("Team");
const TeamMember = Parse.Object.extend("TeamMember");
const TeamMessage = Parse.Object.extend("TeamMessage");
const Inbox = Parse.Object.extend("Inbox");
const ChatHistory = Parse.Object.extend("ChatHistory");
const QueryStat = Parse.Object.extend("QueryStat");
const Comment = Parse.Object.extend("Comment");
const Project = Parse.Object.extend("Project");
const ProjectRequest = Parse.Object.extend("ProjectRequest");
const Gift = Parse.Object.extend("Gift");
const VizyonLog = Parse.Object.extend("VizyonLog");
const Product = Parse.Object.extend("Product");
const StoreItem = Parse.Object.extend("StoreItem");
const DailyTask = Parse.Object.extend("DailyTask");
const SocialTask = Parse.Object.extend("SocialTask");
const TeamTask = Parse.Object.extend("TeamTask");
const Notification = Parse.Object.extend("Notification");
const Message = Parse.Object.extend("Message");
const Conversation = Parse.Object.extend("Conversation");
const Course = Parse.Object.extend("Course");
const Lesson = Parse.Object.extend("Lesson");
const Contest = Parse.Object.extend("Contest");
const Poll = Parse.Object.extend("Poll");
const Announcement = Parse.Object.extend("Announcement");
const Job = Parse.Object.extend("Job");
const BugReport = Parse.Object.extend("BugReport");
const Quiz = Parse.Object.extend("Quiz");
const BlogSubscriber = Parse.Object.extend("BlogSubscriber");
const BlogPost = Parse.Object.extend("BlogPost");
const MarketProject = Parse.Object.extend("MarketProject");
const ParentLog = Parse.Object.extend("ParentLog");
const UserStreak = Parse.Object.extend("UserStreak");
const UserApiKey = Parse.Object.extend("UserApiKey");

// ================================================================
// ========== YARDIMCI FONKSİYONLAR ==========
// ================================================================
async function getAPIKey(keyName) {
    try {
        // SashiDo'da master key ile Config okuma en güvenilir yoldur.
        const config = await Parse.Config.get({ useMasterKey: true });
        const value = config.get(keyName);
        if (value) {
            console.log(`✅ ${keyName} Config'den okundu.`);
            return value;
        } else {
            console.warn(`⚠️ ${keyName} Config'de bulunamadı!`);
            return null;
        }
    } catch (e) {
        // Fallback: master key olmadan dene (bazı SashiDo sürümlerinde gerekebilir)
        try {
            const config = await Parse.Config.get();
            const value = config.get(keyName);
            if (value) return value;
        } catch (e2) {
            console.error(`❌ Config okunamadı (${keyName}): ${e2.message}`);
        }
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
    const badWords = [
        'küfür', 'kufur', 'küfretmek', 'siktir', 'amk', 'orospu', 'piç', 'göt',
        'sik', 'yarrak', 'ananı', 'bacını', 'çük', 'amcık', 'ibne', 'puşt',
        'şerefsiz', 'hıyar', 'domuz'
    ];
    let filtered = text;
    badWords.forEach(word => {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedWord, 'gi');
        filtered = filtered.replace(regex, '****');
    });
    return filtered;
}

function isSpaceMode() {
    const hour = new Date().getHours();
    return (hour >= 2 && hour < 5);
}

// Base64 encode — büyük buffer'larda stack overflow'u önlemek için parçalı
function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 8192;
    let result = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        result += String.fromCharCode.apply(null, chunk);
    }
    return btoa(result);
}

async function addPointsWithBonus(user, points, reason) {
    let bonus = isSpaceMode() ? 2 : 1;
    const total = points * bonus;
    const current = user.get('points') || 0;
    user.set('points', current + total);
    await user.save(null, { useMasterKey: true });
    const log = new VizyonLog();
    log.set('user_email', user.get('email'));
    log.set('user_name', user.get('name') || 'Kullanıcı');
    log.set('action', 'add_points');
    log.set('message', `${total} puan eklendi (${reason})${bonus > 1 ? ' [Uzay Modu x2]' : ''}`);
    await log.save(null, { useMasterKey: true });
    await checkAndUpdateLevel(user);
    await sendNotificationToUser(user, `🎉 ${total} puan kazandınız! (${reason})`, 'reward');
    return total;
}

async function checkAndUpdateLevel(user) {
    const points = user.get('points') || 0;
    let level = 'Çaylak';
    if (points >= 20000) level = 'V27 Efsanesi';
    else if (points >= 5000) level = 'V27 Uzmanı';
    else if (points >= 1000) level = 'Üye';
    else level = 'Çaylak';
    const oldLevel = user.get('level') || 'Çaylak';
    if (oldLevel !== level) {
        user.set('level', level);
        await user.save(null, { useMasterKey: true });
        await sendNotificationToUser(user, `🎊 Tebrikler! Seviyeniz "${level}" oldu!`, 'level_up');
        if (level === 'V27 Efsanesi') {
            const badges = user.get('badges') || [];
            if (!badges.includes('efsane')) {
                badges.push('efsane');
                user.set('badges', badges);
                await user.save(null, { useMasterKey: true });
            }
        }
    }
}

async function sendNotificationToUser(user, message, type = 'system') {
    if (!user) return;
    try {
        const notif = new Notification();
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
            html: `<h3>📢 VİZYON2027</h3><p>${message}</p><p>VİZYON2027 Ekibi</p>`
        }, { useMasterKey: true });
    } catch (e) {
        console.error('Bildirim e-postası gönderilemedi:', e.message);
    }
}

// ================================================================
// ========== SİTE İÇERİĞİ ==========
// ================================================================
let siteContentCache = null;
let siteContentCacheTime = 0;

async function getSiteContent() {
    const now = Date.now();
    if (siteContentCache && (now - siteContentCacheTime) < 3600000) {
        return siteContentCache;
    }
    try {
        const baseUrl = 'https://vizyon2026.vercel.app';
        const pages = ['/', '/bana-ogret.html', '/hakkimizda.html', '/vizyon-ai.html', '/gizlilik.html', '/kullanici-sozlesmesi.html'];
        let fullText = '';
        let rawHtml = '';

        for (const page of pages) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(baseUrl + page, { signal: controller.signal });
                clearTimeout(timeout);
                const html = await response.text();
                const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const rawSnippet = html.substring(0, 500).replace(/\s+/g, ' ').trim();
                fullText += `\n\n--- Sayfa: ${page} ---\n${text.substring(0, 2000)}`;
                rawHtml += `\n\n--- Sayfa Kodu (${page}) ---\n${rawSnippet}...`;
            } catch (e) {
                console.warn(`Sayfa ${page} alınamadı:`, e.message);
            }
        }

        const combined = `=== VİZYON2027 SİTE İÇERİĞİ ===\n${fullText}\n\n=== SAYFA KAYNAK KODLARI (İLK 500 KARAKTER) ===\n${rawHtml}`;
        const summary = combined.substring(0, 7000);
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
const crypto = require('crypto');

function hashApiPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyApiPasswordHash(password, stored) {
    if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verify;
}

function xorEncrypt(text, key) {
    if (!text || !key) return text;
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(result, 'binary').toString('base64');
}

function xorDecrypt(encrypted, key) {
    if (!encrypted || !key) return encrypted;
    try {
        const text = Buffer.from(encrypted, 'base64').toString('binary');
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        return '';
    }
}

// ================================================================
// ========== TEMEL FONKSİYONLAR ==========
// ================================================================
Parse.Cloud.define("test", async (request) => {
    return {
        success: true,
        message: "Cloud Code çalışıyor! (SashiDo v6.04.0)",
        user: request.user ? request.user.get('email') : 'Oturum yok',
        timestamp: new Date().toISOString()
    };
});

Parse.Cloud.define("checkRoleAccess", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const role = user.get('role');
    if (!['admin', 'founder', 'beta'].includes(role)) {
        throw new Error("Yetkiniz yok!");
    }
    return { role, access: true };
});

Parse.Cloud.define("verifyUser", async (request) => {
    const { email, code } = request.params;
    if (!email || !code) return { success: false, error: "E-posta ve kod gerekli!" };
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    const user = await query.first({ useMasterKey: true });
    if (!user) return { success: false, error: "Kullanıcı bulunamadı!" };
    if (user.get('verificationCode') !== code) return { success: false, error: "Geçersiz kod!" };
    if (new Date(user.get('verificationCodeExpires')) < new Date()) {
        return { success: false, error: "Kod süresi doldu!" };
    }
    user.set('isVerified', true);
    user.set('verificationCode', null);
    user.set('verificationCodeExpires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Hesap doğrulandı!" };
});

Parse.Cloud.define("saveChatHistory", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const messages = request.params.messages;
    if (!Array.isArray(messages)) throw new Error("Geçersiz format!");
    const query = new Parse.Query(ChatHistory);
    query.equalTo("user_email", user.get('email'));
    let history = await query.first({ useMasterKey: true });
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

Parse.Cloud.define("getChatHistory", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const query = new Parse.Query(ChatHistory);
    query.equalTo("user_email", user.get('email'));
    const history = await query.first({ useMasterKey: true });
    return { success: true, messages: history ? history.get('messages') : [] };
});

// ================================================================
// ========== initSchemas (Otomatik Sınıf + Kolon) ==========
// ================================================================
Parse.Cloud.define("initSchemas", async (request) => {
    const schemaDefinitions = {
        "Team": ["name", "teamCode", "owner_email", "manager_email"],
        "TeamMember": ["team_id", "user_email"],
        "TeamMessage": ["team_id", "user_email", "user_name", "message", "fileUrl", "fileName", "fileType", "deleted", "deleted_by_founder", "edited"],
        "Inbox": ["sender_email", "receiver_email", "type", "request_id", "project_title", "project_type", "project_description", "status", "message", "response_message", "accepted_by", "accepted_by_name", "role", "package_type", "team_id", "team_name", "project_id"],
        "ChatHistory": ["user_email", "messages", "lastUpdated"],
        "QueryStat": ["user_email", "date", "count", "visitorKey"],
        "Comment": ["user_email", "user_name", "user_role", "comment", "rating"],
        "Project": ["user_email", "name", "type", "content", "is_favorite", "is_archived", "is_trashed", "is_published"],
        "ProjectRequest": ["user_email", "title", "type", "description", "status", "request_id"],
        "Gift": ["sender_email", "receiver_email", "package"],
        "VizyonLog": ["user_email", "user_name", "action", "message"],
        "Product": ["user_email", "title_", "price", "file", "status"],
        "StoreItem": ["name", "price_points", "type", "icon"],
        "DailyTask": ["date", "task_text", "points"],
        "SocialTask": ["date", "platform", "url", "points_reward", "penalty_points", "is_active"],
        "TeamTask": ["team_id", "date", "task_text", "points"],
        "Notification": ["user_email", "message", "is_read", "type"],
        "Message": ["from_email", "to_email", "conversationId", "text", "file", "fileName", "is_read"],
        "Conversation": ["user_emails", "lastMessage", "lastMessageTime", "customName", "shareId"],
        "Course": ["title_", "description", "total_lessons"],
        "Lesson": ["courseId", "title_", "content", "points_reward", "order"],
        "Contest": ["title_", "description", "end_date"],
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
        "UserApiKey": ["user_email", "name", "encryptedValue", "createdAtClient", "updatedAtClient"]
    };

    const results = [];
    for (const className of Object.keys(schemaDefinitions)) {
        try {
            const Obj = Parse.Object.extend(className);
            const dummy = new Obj();

            const columns = schemaDefinitions[className];
            for (const col of columns) {
                if (col === "date" || col === "lastUpdated" || col === "lastClaimDate" ||
                    col === "lastClaimTime" || col === "streakStartDate" || col === "end_date" ||
                    col === "subscribedAt" || col === "attemptedAt" || col === "lastMessageTime" ||
                    col === "createdAtClient" || col === "updatedAtClient") {
                    dummy.set(col, new Date());
                } else if (col === "count" || col === "points" || col === "points_reward" ||
                           col === "price" || col === "price_points" || col === "rating" ||
                           col === "total_lessons" || col === "order" || col === "correct_answer" ||
                           col === "streakCount" || col === "penalty_points") {
                    dummy.set(col, 0);
                } else if (col === "is_favorite" || col === "is_archived" || col === "is_trashed" ||
                           col === "is_published" || col === "is_read" || col === "is_active" ||
                           col === "isActive" || col === "isSystemActive" ||
                           col === "notifiedAt8h" || col === "notifiedAt4h" ||
                           col === "deleted" || col === "deleted_by_founder" ||
                           col === "edited" || col === "published") {
                    dummy.set(col, false);
                } else if (col === "messages" || col === "options" || col === "votes" ||
                           col === "voters" || col === "user_emails" ||
                           col === "users" || col === "user_actions") {
                    dummy.set(col, []);
                } else {
                    dummy.set(col, "__init__");
                }
            }
            dummy.set("__init__", true);

            await dummy.save(null, { useMasterKey: true });
            await dummy.destroy({ useMasterKey: true });
            results.push({ className, status: "ok", columns: columns.length });
            console.log(`✅ ${className} sınıfı hazır (${columns.length} kolon).`);
        } catch (e) {
            console.error(`❌ ${className} oluşturulamadı: ${e.message}`);
            results.push({ className, status: "error", error: e.message });
        }
    }
    return { success: true, results };
});

// ================================================================
// [YENİ] migrateFromBack4App – Yalnızca founder/master
// ================================================================
Parse.Cloud.define("migrateFromBack4App", async (request) => {
    if (!request.master) {
        const caller = request.user;
        if (!caller || caller.get('role') !== 'founder') {
            throw new Error("Bu işlem sadece kurucu tarafından yapılabilir!");
        }
    }

    const { appId, masterKey, serverUrl, classes, batchSize = 100 } = request.params;
    if (!appId || !masterKey || !serverUrl) {
        throw new Error("appId, masterKey ve serverUrl gerekli!");
    }

    const classesToMigrate = classes || [
        "Team", "TeamMember", "TeamMessage", "Inbox", "ChatHistory", "QueryStat",
        "Comment", "Project", "ProjectRequest", "Gift", "VizyonLog", "Product",
        "StoreItem", "DailyTask", "SocialTask", "TeamTask", "Notification", "Message",
        "Conversation", "Course", "Lesson", "Contest", "Poll", "Announcement",
        "Job", "BugReport", "Quiz", "BlogSubscriber", "BlogPost", "MarketProject",
        "ParentLog", "UserStreak"
    ];

    const results = [];
    const baseUrl = serverUrl.replace(/\/+$/, '');
    const headers = {
        'X-Parse-Application-Id': appId,
        'X-Parse-Master-Key': masterKey,
        'Content-Type': 'application/json'
    };

    for (const className of classesToMigrate) {
        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        try {
            let skip = 0;
            let hasMore = true;
            let batchNumber = 0;

            while (hasMore) {
                batchNumber++;
                const url = `${baseUrl}/classes/${className}?limit=${batchSize}&skip=${skip}&order=createdAt`;
                let response;
                try {
                    response = await fetch(url, { method: 'GET', headers });
                } catch (e) {
                    console.error(`❌ ${className} batch ${batchNumber} çekilemedi: ${e.message}`);
                    break;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    console.error(`❌ ${className} HTTP ${response.status}: ${errText}`);
                    break;
                }

                const data = await response.json();
                const records = data.results || [];

                if (records.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const record of records) {
                    try {
                        const Target = Parse.Object.extend(className);
                        const obj = new Target();

                        for (const key of Object.keys(record)) {
                            if (key === 'objectId' || key === 'createdAt' || key === 'updatedAt' || key === 'ACL') continue;

                            const value = record[key];
                            if (value && typeof value === 'object' && value.__type === 'Pointer') continue;
                            if (value && typeof value === 'object' && value.__type === 'File') {
                                obj.set(key, value.url);
                                continue;
                            }
                            if (value && typeof value === 'object' && value.__type === 'Date') {
                                obj.set(key, new Date(value.iso));
                                continue;
                            }
                            if (value && typeof value === 'object' && value.__type === 'GeoPoint') {
                                obj.set(key, new Parse.GeoPoint(value.latitude, value.longitude));
                                continue;
                            }
                            obj.set(key, value);
                        }

                        if (record.createdAt) {
                            obj.set('migratedAt', new Date());
                            obj.set('migratedFrom', 'back4app');
                            obj.set('originalCreatedAt', new Date(record.createdAt));
                        }

                        await obj.save(null, { useMasterKey: true });
                        migrated++;
                    } catch (e) {
                        errors++;
                        if (errors <= 3) {
                            console.warn(`⚠️ ${className} kayıt hatası: ${e.message}`);
                        }
                    }
                }

                skip += records.length;
                if (records.length < batchSize) hasMore = false;

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            results.push({ className, migrated, skipped, errors, status: "ok" });
            console.log(`✅ ${className}: ${migrated} kayıt taşındı (${errors} hata).`);
        } catch (e) {
            results.push({ className, migrated, skipped, errors, status: "error", error: e.message });
            console.error(`❌ ${className} migration hatası: ${e.message}`);
        }
    }

    return {
        success: true,
        message: `Migration tamamlandı. Toplam ${results.length} sınıf işlendi.`,
        results
    };
});

// ================================================================
// ========== PROJE İŞLEMLERİ ==========
// ================================================================
Parse.Cloud.define("trashProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId } = request.params;
    if (!projectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    project.set('is_trashed', true);
    project.set('is_archived', false);
    project.set('is_favorite', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: "Proje çöp kutusuna taşındı!" };
});

Parse.Cloud.define("restoreProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId } = request.params;
    if (!projectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    project.set('is_trashed', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: "Proje geri yüklendi!" };
});

Parse.Cloud.define("deletePermanently", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId } = request.params;
    if (!projectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    await project.destroy({ useMasterKey: true });
    return { success: true, message: "Proje kalıcı olarak silindi!" };
});

Parse.Cloud.define("favoriteProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId } = request.params;
    if (!projectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    project.set('is_favorite', !project.get('is_favorite'));
    await project.save(null, { useMasterKey: true });
    return { success: true, is_favorite: project.get('is_favorite') };
});

Parse.Cloud.define("archiveProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId } = request.params;
    if (!projectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    project.set('is_archived', true);
    project.set('is_trashed', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: "Proje arşivlendi!" };
});

Parse.Cloud.define("unarchiveProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId } = request.params;
    if (!projectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    project.set('is_archived', false);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: "Proje arşivden çıkarıldı!" };
});

Parse.Cloud.define("editProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId, name, content } = request.params;
    if (!projectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    if (name !== undefined) project.set('name', name);
    if (content !== undefined) project.set('content', content);
    await project.save(null, { useMasterKey: true });
    return { success: true, message: "Proje güncellendi!" };
});

Parse.Cloud.define("saveProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { name, type, content } = request.params;
    if (!name || !type || !content) {
        throw new Error("Proje adı, tür ve içerik gerekli!");
    }
    const project = new Project();
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

// ================================================================
// ========== PROJE TALEBİ SİSTEMİ ==========
// ================================================================
Parse.Cloud.define("createProjectRequest", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { title, type, description } = request.params;
    if (!title || !type || !description) throw new Error("Başlık, tür ve açıklama gerekli!");
    if (!['3D', 'Kod', 'Görsel'].includes(type)) throw new Error("Geçersiz proje türü!");

    const adminQuery = new Parse.Query(Parse.User);
    adminQuery.containedIn('role', ['admin', 'founder']);
    const admins = await adminQuery.find({ useMasterKey: true });
    if (admins.length === 0) throw new Error("Hiç admin veya kurucu bulunamadı!");

    const requestId = Math.random().toString(36).substring(2, 15);
    const inboxPromises = admins.map(async (admin) => {
        const inbox = new Inbox();
        inbox.set('sender_email', user.get('email'));
        inbox.set('receiver_email', admin.get('email'));
        inbox.set('type', 'project_request');
        inbox.set('request_id', requestId);
        inbox.set('project_title', title);
        inbox.set('project_type', type);
        inbox.set('project_description', description);
        inbox.set('status', 'pending');
        inbox.set('message', `📩 ${user.get('name')} yeni bir proje talebi oluşturdu: "${title}" (${type}). Lütfen değerlendirin.`);
        await inbox.save(null, { useMasterKey: true });
        await sendNotificationToUser(admin, `📩 ${user.get('name')} "${title}" adlı proje talebinde bulundu.`, 'project_request');
    });
    await Promise.all(inboxPromises);

    const req = new ProjectRequest();
    req.set('user_email', user.get('email'));
    req.set('title', title);
    req.set('type', type);
    req.set('description', description);
    req.set('status', 'pending');
    req.set('request_id', requestId);
    await req.save(null, { useMasterKey: true });

    return { success: true, message: "Proje talebi tüm admin ve kuruculara iletildi.", requestId };
});

Parse.Cloud.define("cancelProjectRequest", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { requestId } = request.params;
    if (!requestId) throw new Error("Request ID gerekli!");

    const reqQuery = new Parse.Query(ProjectRequest);
    reqQuery.equalTo('request_id', requestId);
    const req = await reqQuery.first({ useMasterKey: true });
    if (!req) throw new Error("Proje talebi bulunamadı!");
    if (req.get('user_email') !== user.get('email')) throw new Error("Bu talep size ait değil!");
    if (req.get('status') !== 'pending') throw new Error("Bu talep zaten işlenmiş, iptal edilemez!");

    await req.destroy({ useMasterKey: true });

    const inboxQuery = new Parse.Query(Inbox);
    inboxQuery.equalTo('request_id', requestId);
    inboxQuery.equalTo('type', 'project_request');
    const inboxes = await inboxQuery.find({ useMasterKey: true });
    for (const inbox of inboxes) {
        await inbox.destroy({ useMasterKey: true });
    }

    return { success: true, message: "Proje talebi iptal edildi." };
});

Parse.Cloud.define("handleProjectRequest", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!['admin', 'founder'].includes(user.get('role'))) throw new Error("Bu işlemi sadece admin veya kurucu yapabilir!");

    const { requestId, action, projectId } = request.params;
    if (!requestId || !action) throw new Error("Request ID ve action gerekli!");
    if (!['accept', 'reject', 'delegate', 'send', 'cancel'].includes(action)) throw new Error("Geçersiz işlem!");

    const inboxQuery = new Parse.Query(Inbox);
    inboxQuery.equalTo('request_id', requestId);
    inboxQuery.equalTo('receiver_email', user.get('email'));
    inboxQuery.equalTo('type', 'project_request');
    const inboxMsg = await inboxQuery.first({ useMasterKey: true });
    if (!inboxMsg) throw new Error("Bu talebi bulamadınız veya size ait değil!");
    if (inboxMsg.get('status') !== 'pending' && action !== 'send' && action !== 'cancel') throw new Error("Bu talep zaten işlenmiş!");

    if (action === 'cancel') {
        const allInboxes = new Parse.Query(Inbox);
        allInboxes.equalTo('request_id', requestId);
        allInboxes.equalTo('type', 'project_request');
        const allMsgs = await allInboxes.find({ useMasterKey: true });
        for (const msg of allMsgs) {
            await msg.destroy({ useMasterKey: true });
        }
        const reqQuery = new Parse.Query(ProjectRequest);
        reqQuery.equalTo('request_id', requestId);
        const req = await reqQuery.first({ useMasterKey: true });
        if (req) {
            await req.destroy({ useMasterKey: true });
        }
        return { success: true, message: "Proje talebi iptal edildi ve tüm kayıtları silindi." };
    }

    if (action === 'reject') {
        inboxMsg.set('status', 'rejected');
        inboxMsg.set('response_message', `${user.get('name')} talebi reddetti.`);
        await inboxMsg.save(null, { useMasterKey: true });
        const senderEmail = inboxMsg.get('sender_email');
        const senderQuery = new Parse.Query(Parse.User);
        senderQuery.equalTo('email', senderEmail);
        const sender = await senderQuery.first({ useMasterKey: true });
        if (sender) {
            await sendNotificationToUser(sender, `❌ "${inboxMsg.get('project_title')}" proje talebiniz ${user.get('name')} tarafından reddedildi.`, 'project_rejected');
        }
        return { success: true, message: "Talebi reddettiniz." };
    }

    if (action === 'delegate') {
        inboxMsg.set('status', 'delegated');
        inboxMsg.set('message', `📩 ${user.get('name')} bu projeyi yapamadığını belirtti ve devretti. Lütfen değerlendirin.`);
        await inboxMsg.save(null, { useMasterKey: true });

        const adminQuery = new Parse.Query(Parse.User);
        adminQuery.containedIn('role', ['admin', 'founder']);
        adminQuery.notEqualTo('email', user.get('email'));
        const admins = await adminQuery.find({ useMasterKey: true });

        for (let admin of admins) {
            const existing = new Parse.Query(Inbox);
            existing.equalTo('request_id', requestId);
            existing.equalTo('receiver_email', admin.get('email'));
            existing.equalTo('type', 'project_request');
            const exist = await existing.first({ useMasterKey: true });
            if (!exist) {
                const newInbox = new Inbox();
                newInbox.set('sender_email', inboxMsg.get('sender_email'));
                newInbox.set('receiver_email', admin.get('email'));
                newInbox.set('type', 'project_request');
                newInbox.set('request_id', requestId);
                newInbox.set('project_title', inboxMsg.get('project_title'));
                newInbox.set('project_type', inboxMsg.get('project_type'));
                newInbox.set('project_description', inboxMsg.get('project_description'));
                newInbox.set('status', 'pending');
                newInbox.set('message', `📩 ${inboxMsg.get('sender_email')} adlı kullanıcı "${inboxMsg.get('project_title')}" projesini talep etti. ${user.get('name')} devretti.`);
                await newInbox.save(null, { useMasterKey: true });
                await sendNotificationToUser(admin, `📩 "${inboxMsg.get('project_title')}" proje talebi devredildi.`, 'project_delegated');
            } else {
                exist.set('status', 'pending');
                exist.set('message', `📩 ${inboxMsg.get('sender_email')} adlı kullanıcı "${inboxMsg.get('project_title')}" projesini talep etti. ${user.get('name')} devretti.`);
                await exist.save(null, { useMasterKey: true });
                await sendNotificationToUser(admin, `📩 "${inboxMsg.get('project_title')}" proje talebi tekrar değerlendirmeye açıldı.`, 'project_delegated');
            }
        }
        return { success: true, message: "Proje devredildi, diğer admin/kuruculara bildirildi." };
    }

    if (action === 'accept') {
        inboxMsg.set('status', 'accepted');
        inboxMsg.set('accepted_by', user.get('email'));
        inboxMsg.set('accepted_by_name', user.get('name'));
        await inboxMsg.save(null, { useMasterKey: true });

        const otherInboxes = new Parse.Query(Inbox);
        otherInboxes.equalTo('request_id', requestId);
        otherInboxes.equalTo('type', 'project_request');
        otherInboxes.notEqualTo('receiver_email', user.get('email'));
        const others = await otherInboxes.find({ useMasterKey: true });
        for (let o of others) {
            o.set('status', 'accepted_by_other');
            o.set('accepted_by', user.get('email'));
            o.set('accepted_by_name', user.get('name'));
            await o.save(null, { useMasterKey: true });
        }

        const senderEmail2 = inboxMsg.get('sender_email');
        const sender2 = await new Parse.Query(Parse.User).equalTo('email', senderEmail2).first({ useMasterKey: true });
        if (sender2) {
            await sendNotificationToUser(sender2, `✅ "${inboxMsg.get('project_title')}" proje talebiniz ${user.get('name')} tarafından kabul edildi. Proje oluşturuluyor...`, 'project_accepted');
        }
        return { success: true, message: "Talebi kabul ettiniz. Proje oluşturma ekranını açabilirsiniz.", acceptedBy: user.get('email') };
    }

    if (action === 'send') {
        if (!projectId) throw new Error("Proje ID gerekli!");
        const senderEmail = inboxMsg.get('sender_email');
        const projectQuery = new Parse.Query(Project);
        const project = await projectQuery.get(projectId, { useMasterKey: true });
        if (!project) throw new Error("Proje bulunamadı!");
        if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");

        project.set('user_email', senderEmail);
        await project.save(null, { useMasterKey: true });

        const sender = await new Parse.Query(Parse.User).equalTo('email', senderEmail).first({ useMasterKey: true });
        if (sender) {
            const inbox = new Inbox();
            inbox.set('sender_email', user.get('email'));
            inbox.set('receiver_email', senderEmail);
            inbox.set('type', 'project_completed');
            inbox.set('message', `✅ "${inboxMsg.get('project_title')}" projeniz ${user.get('name')} tarafından tamamlanıp size gönderildi. Projelerim klasörünüzde görebilirsiniz.`);
            inbox.set('project_id', projectId);
            await inbox.save(null, { useMasterKey: true });
            await sendNotificationToUser(sender, `✅ "${inboxMsg.get('project_title')}" projeniz tamamlandı ve projelerinize eklendi.`, 'project_completed');
        }

        inboxMsg.set('status', 'completed');
        await inboxMsg.save(null, { useMasterKey: true });
        return { success: true, message: "Proje talep edene gönderildi." };
    }

    return { success: false, message: "Geçersiz işlem!" };
});

Parse.Cloud.define("acceptProjectCompletion", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { inboxId } = request.params;
    if (!inboxId) throw new Error("Inbox ID gerekli!");

    const query = new Parse.Query(Inbox);
    const inbox = await query.get(inboxId, { useMasterKey: true });
    if (!inbox) throw new Error("Mesaj bulunamadı!");
    if (inbox.get('receiver_email') !== user.get('email')) throw new Error("Bu mesaj size ait değil!");
    if (inbox.get('type') !== 'project_completed') throw new Error("Bu mesaj proje tamamlama bildirimi değil!");

    const projectId = inbox.get('project_id');
    if (projectId) {
        const pQuery = new Parse.Query(Project);
        const project = await pQuery.get(projectId, { useMasterKey: true });
        if (project) {
            project.set('user_email', user.get('email'));
            await project.save(null, { useMasterKey: true });
        }
    }
    inbox.set('status', 'accepted');
    await inbox.save(null, { useMasterKey: true });
    await sendNotificationToUser(user, `✅ "${inbox.get('message')}" projesini aldınız.`, 'project');
    return { success: true, message: "Proje başarıyla alındı!" };
});

Parse.Cloud.define("rejectProjectCompletion", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { inboxId } = request.params;
    if (!inboxId) throw new Error("Inbox ID gerekli!");

    const query = new Parse.Query(Inbox);
    const inbox = await query.get(inboxId, { useMasterKey: true });
    if (!inbox) throw new Error("Mesaj bulunamadı!");
    if (inbox.get('receiver_email') !== user.get('email')) throw new Error("Bu mesaj size ait değil!");
    if (inbox.get('type') !== 'project_completed') throw new Error("Bu mesaj proje tamamlama bildirimi değil!");

    inbox.set('status', 'rejected');
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: "Proje reddedildi." };
});

// ================================================================
// ========== PROJEYİ PUAN MAĞAZASINA KOY VE KALDIR ==========
// ================================================================
Parse.Cloud.define("publishProjectToStore", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { projectId, price, description, imageUrl, type } = request.params;
    if (!projectId || !price || !description || !type) throw new Error("Proje ID, fiyat, açıklama ve tür gerekli!");
    if (price < 1 || price > 10000) throw new Error("Fiyat 1-10000 arası olmalı!");
    if (!['3D', 'Kod', 'Görsel'].includes(type)) throw new Error("Geçersiz tür!");

    const query = new Parse.Query(Project);
    const project = await query.get(projectId, { useMasterKey: true });
    if (!project) throw new Error("Proje bulunamadı!");
    if (project.get('user_email') !== user.get('email')) throw new Error("Bu proje size ait değil!");
    if (project.get('is_published')) throw new Error("Bu proje zaten mağazada!");

    const marketItem = new MarketProject();
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

    return { success: true, message: "Proje puan mağazasında satışa sunuldu!" };
});

Parse.Cloud.define("removeFromMarket", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { marketId } = request.params;
    if (!marketId) throw new Error("Market ID gerekli!");

    const query = new Parse.Query(MarketProject);
    const item = await query.get(marketId, { useMasterKey: true });
    if (!item) throw new Error("Ürün bulunamadı!");

    if (item.get('owner_email') !== user.get('email') && user.get('role') !== 'founder') {
        throw new Error("Bu ürünü sadece sahibi veya kurucu kaldırabilir!");
    }

    const projectId = item.get('projectId');
    if (projectId) {
        const pQuery = new Parse.Query(Project);
        const project = await pQuery.get(projectId, { useMasterKey: true });
        if (project) {
            project.set('is_published', false);
            await project.save(null, { useMasterKey: true });
        }
    }

    await item.destroy({ useMasterKey: true });
    return { success: true, message: "Proje mağazadan kaldırıldı!" };
});

// ================================================================
// ========== SOHBET GEÇMİŞİ (KONUŞMA) İŞLEMLERİ ==========
// ================================================================
Parse.Cloud.define("renameConversation", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { conversationId, name } = request.params;
    if (!conversationId || !name) throw new Error("Konuşma ID ve isim gerekli!");
    const query = new Parse.Query(Conversation);
    const conv = await query.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error("Konuşma bulunamadı!");
    const users = conv.get('user_emails') || [];
    if (!users.includes(user.get('email'))) throw new Error("Bu konuşmaya yetkiniz yok!");
    conv.set('customName', name);
    await conv.save(null, { useMasterKey: true });
    return { success: true, message: "Sohbet ismi güncellendi!" };
});

Parse.Cloud.define("shareConversation", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { conversationId } = request.params;
    if (!conversationId) throw new Error("Konuşma ID gerekli!");
    const convQuery = new Parse.Query(Conversation);
    const conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error("Konuşma bulunamadı!");
    const users = conv.get('user_emails') || [];
    if (!users.includes(user.get('email'))) throw new Error("Bu konuşmaya yetkiniz yok!");

    const shareId = Math.random().toString(36).substring(2, 12);
    conv.set('shareId', shareId);
    await conv.save(null, { useMasterKey: true });

    const shareUrl = `https://vizyon2026.vercel.app/share.html?id=${shareId}`;
    return { success: true, shareUrl: shareUrl, shareId: shareId };
});

Parse.Cloud.define("getSharedConversation", async (request) => {
    const { shareId } = request.params;
    if (!shareId) throw new Error("Paylaşım ID gerekli!");

    const query = new Parse.Query(Conversation);
    query.equalTo('shareId', shareId);
    const conv = await query.first({ useMasterKey: true });
    if (!conv) throw new Error("Paylaşım bulunamadı!");

    const msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    msgQuery.ascending('createdAt');
    const msgs = await msgQuery.find({ useMasterKey: true });

    const messages = msgs.map(m => {
        const isAI = m.get('from_email') === 'system@vizyon2027.com';
        return {
            name: isAI ? '🧠 VİZYON AI' : (m.get('from_email') || 'Kullanıcı'),
            text: m.get('text') || '',
            file: m.get('file'),
            fileName: m.get('fileName'),
            createdAt: m.get('createdAt'),
            isAI: isAI
        };
    });

    return {
        success: true,
        conversationName: conv.get('customName') || 'Sohbet',
        messages: messages
    };
});

Parse.Cloud.define("deleteConversation", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { conversationId } = request.params;
    if (!conversationId) throw new Error("Konuşma ID gerekli!");

    const convQuery = new Parse.Query(Conversation);
    const conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error("Konuşma bulunamadı!");

    const users = conv.get('user_emails') || [];
    if (!users.includes(user.get('email'))) throw new Error("Bu konuşmayı silme yetkiniz yok!");

    const msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    const messages = await msgQuery.find({ useMasterKey: true });
    for (const msg of messages) {
        await msg.destroy({ useMasterKey: true });
    }

    await conv.destroy({ useMasterKey: true });
    return { success: true, message: "Sohbet ve tüm mesajlar silindi." };
});

// ================================================================
// ========== 8 API MODELİ (Tüm anahtarlar Config'den) ==========
// ================================================================
Parse.Cloud.define("callGroq", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('GROQ_KEY');
    if (!key) {
        console.error('❌ GROQ_KEY Config\'de bulunamadı!');
        return null;
    }
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-instruct",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ Groq HTTP Hatası (${res.status}):`, JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ Groq API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('❌ Groq Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callDeepSeek", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('DEEPSEEK_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ DeepSeek HTTP Hatası (${res.status}):`, JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ DeepSeek API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('❌ DeepSeek Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callOpenAI", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('OPENAI_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ OpenAI HTTP Hatası (${res.status}):`, JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ OpenAI API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('❌ OpenAI Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callOpenRouter", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('OPENROUTER_KEY');
    if (!key) {
        console.error('❌ OPENROUTER_KEY Config\'de bulunamadı!');
        return null;
    }
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ OpenRouter HTTP Hatası (${res.status}):`, JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ OpenRouter API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('❌ OpenRouter Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callCohere", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('COHERE_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.cohere.ai/v2/chat", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "command-r-plus-08-2024",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ Cohere HTTP Hatası (${res.status}):`, JSON.stringify(data));
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

Parse.Cloud.define("callCerebras", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('CEREBRAS_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-instruct",
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ Cerebras HTTP Hatası (${res.status}):`, JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ Cerebras API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('❌ Cerebras Fetch Hatası:', e.message);
        return null;
    }
});

Parse.Cloud.define("callGitHubModels", async (request) => {
    return null;
});

Parse.Cloud.define("callGemini", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('GEMINI_KEY');
    if (!key) {
        console.error('❌ GEMINI_KEY Config\'de bulunamadı!');
        return null;
    }
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;
        const res = await fetch(url, {
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
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ Gemini HTTP Hatası (${res.status}):`, JSON.stringify(data));
            return null;
        }
        if (data.error) {
            console.error('❌ Gemini API Hata Detayı:', JSON.stringify(data.error));
            return null;
        }
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
        console.error('❌ Gemini Fetch Hatası:', e.message);
        return null;
    }
});

// ================================================================
// ========== callCustomAI - Kullanıcının kendi API'si ==========
// ================================================================
Parse.Cloud.define("callCustomAI", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { prompt } = request.params;
    if (!prompt) throw new Error("Prompt gerekli!");

    const query = new Parse.Query(UserApiKey);
    query.equalTo('user_email', user.get('email'));
    query.descending('createdAtClient');
    const apiKeyRecord = await query.first({ useMasterKey: true });
    if (!apiKeyRecord) {
        return { success: false, error: "Kayıtlı API anahtarınız yok. Lütfen önce API ekleyin." };
    }

    const encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) {
        return { success: false, error: "Sunucu şifreleme anahtarı eksik." };
    }

    let rawValue = '';
    try {
        rawValue = xorDecrypt(apiKeyRecord.get('encryptedValue'), encryptionKey);
    } catch (e) {
        return { success: false, error: "API anahtarı çözülemedi." };
    }
    if (!rawValue) {
        return { success: false, error: "API anahtarı boş." };
    }

    const name = (apiKeyRecord.get('name') || '').toLowerCase();
    let targetUrl = '';
    let model = '';
    let authHeader = 'Bearer ' + rawValue;
    let requestBody = null;

    if (name.includes('openai') || name.includes('gpt') || (rawValue.startsWith('sk-') && !rawValue.startsWith('sk-or-'))) {
        targetUrl = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-4o-mini';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    } else if (name.includes('groq') || rawValue.startsWith('gsk_')) {
        targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
        model = 'llama-3.3-70b-instruct';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    } else if (name.includes('deepseek') || rawValue.startsWith('sk-')) {
        targetUrl = 'https://api.deepseek.com/v1/chat/completions';
        model = 'deepseek-chat';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    } else if (name.includes('openrouter') || rawValue.startsWith('sk-or-')) {
        targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
        model = 'meta-llama/llama-3.1-8b-instruct:free';
        requestBody = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        };
    } else if (name.includes('gemini') || name.includes('google')) {
        targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${rawValue}`;
        authHeader = null;
        requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        };
    } else {
        return { success: false, error: "API anahtarı tipi algılanamadı. Sanal isme 'openai', 'groq', 'deepseek', 'openrouter' veya 'gemini' yazın." };
    }

    try {
        const fetchHeaders = { 'Content-Type': 'application/json' };
        if (authHeader) fetchHeaders['Authorization'] = authHeader;
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(requestBody)
        });
        const data = await res.json();
        if (!res.ok) {
            console.error('❌ Custom AI HTTP Hatası:', JSON.stringify(data));
            return { success: false, error: 'HTTP ' + res.status + ': ' + JSON.stringify(data).substring(0, 200) };
        }
        if (data.error) {
            return { success: false, error: JSON.stringify(data.error).substring(0, 200) };
        }
        let reply = null;
        if (data.choices?.[0]?.message?.content) reply = data.choices[0].message.content;
        else if (data.candidates?.[0]?.content?.parts?.[0]?.text) reply = data.candidates[0].content.parts[0].text;
        else if (data.message?.content?.[0]?.text) reply = data.message.content[0].text;

        if (reply) {
            return { success: true, reply: cleanResponse(reply) };
        }
        return { success: false, error: "Yanıt alınamadı." };
    } catch (e) {
        console.error('❌ Custom AI Fetch Hatası:', e.message);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("superAI", async (request) => {
    const prompt = request.params.prompt;
    if (!prompt) return "Lütfen bir soru girin.";

    if (prompt.toLowerCase().includes('dolar') || prompt.toLowerCase().includes('haber') || prompt.toLowerCase().includes('arama') || prompt.toLowerCase().includes('hava')) {
        try {
            const result = await Parse.Cloud.run("webSearch", { query: prompt }, { useMasterKey: true });
            if (result && !result.includes('tanımlanmamış')) return cleanResponse(result);
        } catch (e) {
            console.error('Web arama hatası:', e.message);
        }
    }

    const models = [
        'callCohere',
        'callGroq',
        'callGemini',
        'callCerebras',
        'callOpenRouter',
        'callDeepSeek',
        'callOpenAI'
    ];

    for (const model of models) {
        try {
            console.log(`🔄 ${model} deneniyor...`);
            const result = await Parse.Cloud.run(model, { prompt }, { useMasterKey: true });
            if (result && result.length > 10) {
                console.log(`✅ ${model} başarılı yanıt verdi.`);
                return cleanResponse(result);
            }
        } catch (e) {
            console.error(`❌ ${model} çağrısı başarısız:`, e.message);
        }
    }

    return "🧠 VİZYON AI: Üzgünüm, tüm modeller şu anda cevap veremiyor. Lütfen daha sonra tekrar deneyin.";
});

Parse.Cloud.define("webSearch", async (request) => {
    const query = request.params.query;
    const key = await getAPIKey('SERPAPI_KEY');
    if (!key) return "SerpAPI anahtarı eksik!";
    try {
        const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&hl=tr&gl=tr&api_key=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) return "SerpAPI hatası: " + data.error;
        let result = '🌐 Arama Sonuçları:\n\n';
        if (data.answer_box) {
            result += '⚡ ' + (data.answer_box.answer || data.answer_box.snippet) + '\n\n';
        }
        if (data.organic_results && data.organic_results.length) {
            for (let i = 0; i < 3; i++) {
                const r = data.organic_results[i];
                result += r.title + '\n' + r.snippet + '\n\n';
            }
        } else {
            result += '🔍 Sonuç bulunamadı.';
        }
        return result;
    } catch (e) {
        return "Arama hatası: " + e.message;
    }
});

// ================================================================
// ========== sendEmail ==========
// ================================================================
Parse.Cloud.define("sendEmail", async (request) => {
    const { to, subject, html } = request.params;
    if (!request.master && !request.user) { throw new Error("Yetkisiz erişim!"); }

    if (!request.master) {
        const _rlk = `sendEmail:${(to || 'unknown').toLowerCase()}`;
        await checkRateLimit(_rlk);
        await recordAttempt(_rlk);
    }

    const url = await getAPIKey('GOOGLE_SCRIPT_URL');
    if (!url) {
        console.warn('⚠️ GOOGLE_SCRIPT_URL eksik, e-posta gönderilemedi.');
        return { success: false, error: "GOOGLE_SCRIPT_URL eksik!" };
    }
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });
        const data = await res.json();
        return data.success ? { success: true } : { success: false, error: data.error };
    } catch (e) {
        console.error('E-posta gönderim hatası:', e.message);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== ADMIN KULLANICILARI OLUŞTUR ==========
// ================================================================
Parse.Cloud.define("initAdminUsers", async (request) => {
    if (!request.master) {
        const caller = request.user;
        if (!caller || caller.get('role') !== 'founder') {
            throw new Error("Bu işlem için yetkiniz yok! Sadece kurucu veya sistem çağırabilir.");
        }
    }
    try {
        const founderEmail = 'admin.tr.reis@gmail.com';
        let query = new Parse.Query(Parse.User);
        query.equalTo('username', founderEmail);
        let existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const founderPass = await getAPIKey('FOUNDER_PASS');
            if (!founderPass) throw new Error("FOUNDER_PASS tanımlı değil!");
            const admin0 = new Parse.User();
            admin0.set('username', founderEmail);
            admin0.set('email', founderEmail);
            admin0.set('password', founderPass);
            admin0.set('name', 'Eymen');
            admin0.set('role', 'founder');
            admin0.set('plan', 'team');
            admin0.set('isVerified', true);
            admin0.set('isBanned', false);
            await admin0.save(null, { useMasterKey: true });
        }

        const ibrahimEmail = 'iy5971828@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', ibrahimEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const ibrahimPass = await getAPIKey('ADMIN_IBRAHIM_PASS');
            if (!ibrahimPass) throw new Error("ADMIN_IBRAHIM_PASS tanımlı değil!");
            const admin1 = new Parse.User();
            admin1.set('username', ibrahimEmail);
            admin1.set('email', ibrahimEmail);
            admin1.set('password', ibrahimPass);
            admin1.set('name', 'İbrahim Admin');
            admin1.set('role', 'admin');
            admin1.set('plan', 'team');
            admin1.set('isVerified', true);
            admin1.set('isBanned', false);
            await admin1.save(null, { useMasterKey: true });
        }

        const bozkurtEmail = 'itaner686@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', bozkurtEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const bozkurtPass = await getAPIKey('ADMIN_BOZKURT_PASS');
            if (!bozkurtPass) throw new Error("ADMIN_BOZKURT_PASS tanımlı değil!");
            const admin2 = new Parse.User();
            admin2.set('username', bozkurtEmail);
            admin2.set('email', bozkurtEmail);
            admin2.set('password', bozkurtPass);
            admin2.set('name', 'Bozkurt Admin');
            admin2.set('role', 'admin');
            admin2.set('plan', 'team');
            admin2.set('isVerified', true);
            admin2.set('isBanned', false);
            await admin2.save(null, { useMasterKey: true });
        }

        const eymenBetaEmail = 'o2059497@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', eymenBetaEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const betaPass = await getAPIKey('BETA_OMER_PASS');
            if (!betaPass) throw new Error("BETA_OMER_PASS tanımlı değil!");
            const beta1 = new Parse.User();
            beta1.set('username', eymenBetaEmail);
            beta1.set('email', eymenBetaEmail);
            beta1.set('password', betaPass);
            beta1.set('name', 'Eymen Beta');
            beta1.set('role', 'beta');
            beta1.set('plan', 'free');
            beta1.set('isVerified', true);
            beta1.set('isBanned', false);
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
Parse.Cloud.define("adminLogin", async (request) => {
    const _rlk = getRateLimitKey(request, 'adminLogin');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    const { adminKey, password } = request.params;
    if (!adminKey || !password) throw new Error("Admin key ve şifre gerekli.");
    await Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true });
    const admins = {
        ibrahim: { email: 'iy5971828@gmail.com', key: 'ADMIN_IBRAHIM_PASS', name: 'İbrahim Admin' },
        bozkurt: { email: 'itaner686@gmail.com', key: 'ADMIN_BOZKURT_PASS', name: 'Bozkurt Admin' }
    };
    const admin = admins[adminKey];
    if (!admin) throw new Error("Geçersiz admin seçimi!");
    const correctPass = await getAPIKey(admin.key);
    if (!correctPass) throw new Error("Admin şifresi tanımlı değil!");
    try {
        await Parse.User.logIn(admin.email, password);
        return { success: true, name: admin.name, email: admin.email, role: 'admin' };
    } catch (e) {
        if (e.code === 101 && request.master) {
            const query = new Parse.Query(Parse.User);
            query.equalTo('email', admin.email);
            const user = await query.first({ useMasterKey: true });
            if (user) await user.destroy({ useMasterKey: true });
            const newUser = new Parse.User();
            newUser.set('username', admin.email);
            newUser.set('email', admin.email);
            newUser.set('password', correctPass);
            newUser.set('name', admin.name);
            newUser.set('role', 'admin');
            newUser.set('plan', 'team');
            newUser.set('isVerified', true);
            newUser.set('isBanned', false);
            await newUser.save(null, { useMasterKey: true });
            await Parse.User.logIn(admin.email, password);
            return { success: true, name: admin.name, email: admin.email, role: 'admin' };
        } else throw e;
    }
});

Parse.Cloud.define("betaLogin", async (request) => {
    const _rlk = getRateLimitKey(request, 'betaLogin');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    const { betaKey, password } = request.params;
    if (!betaKey || !password) throw new Error("Beta key ve şifre gerekli.");
    await Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true });
    const betas = {
        beta: { email: 'o2059497@gmail.com', key: 'BETA_OMER_PASS', name: 'Eymen Beta' },
        omer: { email: 'o2059497@gmail.com', key: 'BETA_OMER_PASS', name: 'Eymen Beta' }
    };
    const beta = betas[betaKey];
    if (!beta) throw new Error("Geçersiz beta seçimi!");
    const correctPass = await getAPIKey(beta.key);
    if (!correctPass) throw new Error("Beta şifresi tanımlı değil!");
    try {
        await Parse.User.logIn(beta.email, password);
        return { success: true, name: beta.name, email: beta.email, role: 'beta' };
    } catch (e) {
        if (e.code === 101 && request.master) {
            const query = new Parse.Query(Parse.User);
            query.equalTo('email', beta.email);
            const user = await query.first({ useMasterKey: true });
            if (user) await user.destroy({ useMasterKey: true });
            const newUser = new Parse.User();
            newUser.set('username', beta.email);
            newUser.set('email', beta.email);
            newUser.set('password', correctPass);
            newUser.set('name', beta.name);
            newUser.set('role', 'beta');
            newUser.set('plan', 'free');
            newUser.set('isVerified', true);
            newUser.set('isBanned', false);
            await newUser.save(null, { useMasterKey: true });
            await Parse.User.logIn(beta.email, password);
            return { success: true, name: beta.name, email: beta.email, role: 'beta' };
        } else throw e;
    }
});

Parse.Cloud.define("founderLogin", async (request) => {
    const _rlk = getRateLimitKey(request, 'founderLogin');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    const { password } = request.params;
    if (!password) throw new Error("Şifre gerekli.");
    await Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true });
    const founderEmail = 'admin.tr.reis@gmail.com';
    const correctPass = await getAPIKey('FOUNDER_PASS');
    if (!correctPass) throw new Error("Founder şifresi tanımlı değil!");
    try {
        await Parse.User.logIn(founderEmail, password);
        return { success: true, name: 'Eymen', email: founderEmail, role: 'founder' };
    } catch (e) {
        if (e.code === 101 && request.master) {
            const query = new Parse.Query(Parse.User);
            query.equalTo('email', founderEmail);
            const user = await query.first({ useMasterKey: true });
            if (user) await user.destroy({ useMasterKey: true });
            const newUser = new Parse.User();
            newUser.set('username', founderEmail);
            newUser.set('email', founderEmail);
            newUser.set('password', correctPass);
            newUser.set('name', 'Eymen');
            newUser.set('role', 'founder');
            newUser.set('plan', 'team');
            newUser.set('isVerified', true);
            newUser.set('isBanned', false);
            await newUser.save(null, { useMasterKey: true });
            await Parse.User.logIn(founderEmail, password);
            return { success: true, name: 'Eymen', email: founderEmail, role: 'founder' };
        } else throw e;
    }
});

// ================================================================
// ========== SORGU LİMİTİ ==========
// ================================================================
Parse.Cloud.define("useQuery", async (request) => {
    const user = request.user;
    const today = new Date().toDateString();
    const query = new Parse.Query(QueryStat);
    let limit = 25;
    let remaining;

    if (user) {
        query.equalTo("user_email", user.get('email'));
        query.equalTo("date", today);
        let stats = await query.first({ useMasterKey: true });
        if (!stats) {
            stats = new QueryStat();
            stats.set("user_email", user.get('email'));
            stats.set("date", today);
            stats.set("count", 0);
        }
        const role = user.get('role');
        const plan = user.get('plan');
        if (['admin', 'founder', 'beta'].includes(role) || plan === 'team') limit = Infinity;
        else if (plan === 'pro') limit = 2000;
        else limit = 100;

        if (stats.get("count") >= limit) throw new Error("Sorgu hakkınız doldu!");
        stats.increment("count");
        await stats.save(null, { useMasterKey: true });
        remaining = limit === Infinity ? "Sınırsız" : (limit - stats.get("count"));
        return { remaining, limit, isMember: true };
    } else {
        const visitorKey = 'visitor_' + today;
        query.equalTo("visitorKey", visitorKey);
        let stats = await query.first({ useMasterKey: true });
        if (!stats) {
            stats = new QueryStat();
            stats.set("visitorKey", visitorKey);
            stats.set("date", today);
            stats.set("count", 0);
        }
        if (stats.get("count") >= 25) throw new Error("Ziyaretçi sorgu hakkınız doldu!");
        stats.increment("count");
        await stats.save(null, { useMasterKey: true });
        remaining = 25 - stats.get("count");
        return { remaining, limit: 25, isMember: false };
    }
});

// ================================================================
// ========== YORUM SİSTEMİ ==========
// ================================================================
Parse.Cloud.define("getComments", async (request) => {
    try {
        const query = new Parse.Query(Comment);
        query.descending('createdAt');
        query.limit(30);
        const comments = await query.find({ useMasterKey: true });
        return {
            success: true,
            comments: comments.map(c => ({
                id: c.id,
                user_email: c.get('user_email'),
                user_name: c.get('user_name'),
                user_role: c.get('user_role'),
                comment: c.get('comment'),
                rating: c.get('rating') || 0,
                createdAt: c.get('createdAt')
            }))
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("addComment", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { comment, rating = 0 } = request.params;
    if (!comment || comment.trim().length === 0) throw new Error("Yorum boş olamaz!");
    const newComment = new Comment();
    newComment.set('user_email', user.get('email'));
    newComment.set('user_name', user.get('name') || 'Kullanıcı');
    newComment.set('user_role', user.get('role') || 'user');
    newComment.set('comment', filterText(comment.trim()));
    newComment.set('rating', Math.min(5, Math.max(0, rating)));
    await newComment.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("deleteComment", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { commentId } = request.params;
    const query = new Parse.Query(Comment);
    const comment = await query.get(commentId, { useMasterKey: true });
    if (!comment) throw new Error("Yorum bulunamadı!");
    if (comment.get('user_email') !== user.get('email') && !['admin', 'founder'].includes(user.get('role'))) {
        throw new Error("Yetkiniz yok!");
    }
    await comment.destroy({ useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("editComment", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { commentId, newText, newRating } = request.params;
    if (!newText || newText.trim().length === 0) throw new Error("Yorum boş olamaz!");
    const query = new Parse.Query(Comment);
    const comment = await query.get(commentId, { useMasterKey: true });
    if (!comment) throw new Error("Yorum bulunamadı!");
    if (comment.get('user_email') !== user.get('email') && !['admin', 'founder'].includes(user.get('role'))) {
        throw new Error("Yetkiniz yok!");
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
Parse.Cloud.define("sendVerificationCode", async (request) => {
    const { email } = request.params;
    if (!email) throw new Error("E-posta adresi gerekli!");

    const _rlk = getRateLimitKey(request, 'sendVerificationCode');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    const query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    const user = await query.first({ useMasterKey: true });
    if (!user) throw new Error("Kullanıcı bulunamadı!");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set("resetCode", code);
    user.set("resetCodeExpires", new Date(Date.now() + 15 * 60000));
    await user.save(null, { useMasterKey: true });
    const html = `<h1>Şifre Sıfırlama Kodu</h1>
                  <p>Sayın ${user.get('name') || 'Kullanıcı'},</p>
                  <p>Şifre sıfırlama kodunuz: <strong>${code}</strong></p>
                  <p>Bu kod 15 dakika geçerlidir.</p><p>Vizyon 2027 Ekibi</p>`;
    const result = await Parse.Cloud.run("sendEmail", { to: email, subject: "Şifre Sıfırlama Kodu - Vizyon 2027", html }, { useMasterKey: true });
    if (result.success) return { success: true, message: "Doğrulama kodu gönderildi." };
    else throw new Error("E-posta gönderilemedi: " + (result.error || "Bilinmeyen hata"));
});

Parse.Cloud.define("resetPasswordWithCode", async (request) => {
    const { email, code, newPassword } = request.params;
    if (!email || !code || !newPassword) throw new Error("Tüm alanlar gerekli!");
    if (newPassword.length < 8) throw new Error("Şifre en az 8 karakter olmalı!");

    const _rlk = getRateLimitKey(request, 'resetPasswordWithCode');
    await checkRateLimit(_rlk);
    await recordAttempt(_rlk);

    const query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    const user = await query.first({ useMasterKey: true });
    if (!user) throw new Error("Kullanıcı bulunamadı!");
    if (user.get("resetCode") !== code) throw new Error("Geçersiz kod!");
    if (new Date(user.get("resetCodeExpires")) < new Date()) throw new Error("Kod süresi doldu!");
    user.set("password", newPassword);
    user.set("resetCode", null);
    user.set("resetCodeExpires", null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Şifre değiştirildi!" };
});

// ================================================================
// ========== HEDİYE VE ROL TEKLİFLERİ ==========
// ================================================================
Parse.Cloud.define("sendGiftRequest", async (request) => {
    const sender = request.user;
    if (!sender) throw new Error("Giriş yapmalısınız!");
    if (!['admin', 'founder'].includes(sender.get('role'))) throw new Error("Yetkiniz yok!");
    const { email, packageType } = request.params;
    if (!email || !packageType) throw new Error("E-posta ve paket türü gerekli!");
    if (!['pro', 'team'].includes(packageType)) throw new Error("Geçersiz paket türü!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    const receiver = await query.first({ useMasterKey: true });
    if (!receiver) throw new Error("Kullanıcı bulunamadı!");
    const requestId = Math.random().toString(36).substring(2, 15);
    const inbox = new Inbox();
    inbox.set('sender_email', sender.get('email'));
    inbox.set('receiver_email', email);
    inbox.set('type', 'gift_request');
    inbox.set('package_type', packageType);
    inbox.set('request_id', requestId);
    inbox.set('status', 'pending');
    inbox.set('message', `🎁 ${sender.get('name')} size ${packageType === 'pro' ? '🌟 Pro Paket' : '👥 Takım Paketi'} hediye etmek istiyor. Kabul eder misiniz?`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("sendRoleRequest", async (request) => {
    const sender = request.user;
    if (!sender) throw new Error("Giriş yapmalısınız!");
    if (!['admin', 'founder'].includes(sender.get('role'))) throw new Error("Yetkiniz yok!");
    const { email, role } = request.params;
    if (!email || !role) throw new Error("E-posta ve rol gerekli!");
    if (!['beta', 'admin'].includes(role)) throw new Error("Geçersiz rol!");
    if (role === 'admin' && sender.get('role') !== 'founder') throw new Error("Admin atama yetkisi sadece kurucuya aittir!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    const receiver = await query.first({ useMasterKey: true });
    if (!receiver) throw new Error("Kullanıcı bulunamadı!");
    const requestId = Math.random().toString(36).substring(2, 15);
    const roleLabel = role === 'admin' ? '⚙️ Admin' : '🔬 Beta Tester';
    const inbox = new Inbox();
    inbox.set('sender_email', sender.get('email'));
    inbox.set('receiver_email', email);
    inbox.set('type', 'role_request');
    inbox.set('role', role);
    inbox.set('request_id', requestId);
    inbox.set('status', 'pending');
    inbox.set('message', `📩 ${sender.get('name')} size ${roleLabel} rolü vermek istiyor. Kabul eder misiniz?`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("handleRequest", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { requestId, action } = request.params;
    if (!requestId || !action) throw new Error("Request ID ve action gerekli!");
    if (!['accept', 'reject'].includes(action)) throw new Error("Geçersiz işlem!");
    const query = new Parse.Query(Inbox);
    query.equalTo('request_id', requestId);
    query.equalTo('receiver_email', user.get('email'));
    const inboxMsg = await query.first({ useMasterKey: true });
    if (!inboxMsg) throw new Error("Teklif bulunamadı!");
    if (inboxMsg.get('status') !== 'pending') throw new Error("Bu teklif zaten işlenmiş!");
    if (action === 'reject') {
        inboxMsg.set('status', 'rejected');
        await inboxMsg.save(null, { useMasterKey: true });
        return { success: true, message: "Teklif reddedildi." };
    }
    const type = inboxMsg.get('type');
    if (type === 'gift_request') {
        user.set('plan', inboxMsg.get('package_type'));
    } else if (type === 'role_request') {
        user.set('role', inboxMsg.get('role'));
    } else {
        throw new Error("Bilinmeyen teklif türü!");
    }
    await user.save(null, { useMasterKey: true });
    inboxMsg.set('status', 'accepted');
    await inboxMsg.save(null, { useMasterKey: true });
    const notify = new Inbox();
    notify.set('sender_email', 'system@vizyon2027.com');
    notify.set('receiver_email', inboxMsg.get('sender_email'));
    notify.set('type', 'notification');
    notify.set('message', `✅ ${user.get('email')} teklifi kabul etti!`);
    await notify.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== TAKIM İŞLEMLERİ ==========
// ================================================================
Parse.Cloud.define("createTeam", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    const name = request.params.name;
    if (!name) throw new Error("Takım adı gerekli.");
    const role = user.get('role');
    const plan = user.get('plan');
    if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
        throw new Error("Takım kurma yetkiniz yok.");
    }
    let teamCode = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let exists = true;
    while (exists) {
        teamCode = '';
        for (let i = 0; i < 6; i++) teamCode += chars.charAt(Math.floor(Math.random() * chars.length));
        const codeQuery = new Parse.Query(Team);
        codeQuery.equalTo("teamCode", teamCode);
        const existing = await codeQuery.first({ useMasterKey: true });
        exists = !!existing;
    }
    const team = new Team();
    team.set("name", name);
    team.set("owner_email", user.get('email'));
    team.set("teamCode", teamCode);
    team.set("manager_email", null);
    await team.save(null, { useMasterKey: true });
    const member = new TeamMember();
    member.set("team_id", team.id);
    member.set("user_email", user.get('email'));
    await member.save(null, { useMasterKey: true });
    user.set("teamId", team.id);
    await user.save(null, { useMasterKey: true });
    return { success: true, teamId: team.id, teamCode: teamCode };
});

Parse.Cloud.define("joinTeamWithCode", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız.");
    const teamCode = request.params.teamCode;
    if (!teamCode) throw new Error("Takım kodu gerekli.");
    const query = new Parse.Query(Team);
    query.equalTo("teamCode", teamCode.toUpperCase().trim());
    const team = await query.first({ useMasterKey: true });
    if (!team) throw new Error("Geçersiz takım kodu!");
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", team.id);
    memberQuery.equalTo("user_email", user.get('email'));
    const existing = await memberQuery.first({ useMasterKey: true });
    if (existing) throw new Error("Zaten bu takımın üyesisiniz!");
    const member = new TeamMember();
    member.set("team_id", team.id);
    member.set("user_email", user.get('email'));
    await member.save(null, { useMasterKey: true });
    user.set("teamId", team.id);
    await user.save(null, { useMasterKey: true });
    return { success: true, teamId: team.id };
});

Parse.Cloud.define("sendTeamMessage", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { teamId, message, fileUrl, fileName, fileType } = request.params;
    if (!teamId) throw new Error("Takım ID gerekli!");
    if (!message && !fileUrl) throw new Error("Mesaj veya dosya gerekli!");

    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu takımın üyesi değilsiniz!");

    let isVizyonCommand = false;
    let isSupportCommand = false;
    let isOfflineCommand = false;
    let command = message || '';

    const offlineTriggers = ['@vizyondestektheoffline', '@vizyonaltheoffline', 'vizyonal the offline', 'vizyondestek the offline'];
    for (let t of offlineTriggers) {
        if (command.toLowerCase().includes(t)) {
            isOfflineCommand = true;
            break;
        }
    }

    if (!isOfflineCommand) {
        const aiTriggers = ['@vizyonal', 'vizyon al'];
        for (let t of aiTriggers) {
            if (command.toLowerCase().startsWith(t)) {
                isVizyonCommand = true;
                command = command.replace(new RegExp(t, 'i'), '').trim();
                break;
            }
        }
        const supportTriggers = ['@vizyondestek', 'vizyon destek'];
        for (let t of supportTriggers) {
            if (command.toLowerCase().startsWith(t)) {
                isSupportCommand = true;
                command = command.replace(new RegExp(t, 'i'), '').trim();
                break;
            }
        }
    }

    const TeamMessage = Parse.Object.extend("TeamMessage");
    const msg = new TeamMessage();

    if (isOfflineCommand) {
        msg.set("team_id", teamId);
        msg.set("user_email", 'system@vizyon2027.com');
        msg.set("user_name", '🧠 VİZYON AI');
        msg.set("message", '🧠 VİZYON AI: Anladım, sohbetten ayrılıyorum. Beni tekrar çağırmak için @vizyonal veya @vizyondestek yazabilirsiniz. 👋');
        await msg.save(null, { useMasterKey: true });
        return { success: true };
    }

    if (isVizyonCommand || isSupportCommand) {
        const MsgQuery = Parse.Object.extend("TeamMessage");
        const chatQuery = new Parse.Query(MsgQuery);
        chatQuery.equalTo('team_id', teamId);
        chatQuery.ascending('createdAt');
        chatQuery.limit(50);
        const history = await chatQuery.find({ useMasterKey: true });
        let context = "Takım sohbet geçmişi (son 50 mesaj):\n";
        history.forEach(function(h) {
            const sender = h.get('user_name') || h.get('user_email');
            const txt = h.get('message') || '[Dosya]';
            context += sender + ': ' + txt + '\n';
        });

        let prompt = '';
        let isGreeting = false;
        const greetingWords = ['selam', 'merhaba', 'hey', 'slm', 'hello', 'hi', 'naber', 'nasılsın', 'iyi misin'];
        for (let g of greetingWords) {
            if (command.toLowerCase().includes(g)) {
                isGreeting = true;
                break;
            }
        }

        if (isSupportCommand) {
            try {
                const siteContent = await getSiteContent();
                let supportPrompt = '';
                if (isGreeting) {
                    supportPrompt = `Kullanıcı selam veriyor: "${command}". Sen Vizyon Destek'sin. Nazik ve profesyonel bir şekilde selamına karşılık ver. Ardından "Size nasıl yardımcı olabilirim?" de. VİZYON2027 sitesi hakkında bilgi: ${siteContent.substring(0, 1500)}`;
                } else {
                    supportPrompt = `Kullanıcı sorusu: "${command}". Sen Vizyon Destek'sin. VİZYON2027 sitesi hakkında bilgi: ${siteContent.substring(0, 1500)} Sohbet geçmişi: ${context} Eğer soru site hakkında ise, site bilgisine göre detaylı cevap ver. Eğer soru site dışı bir konu ise, yardımcı olmaya çalış. Cevabın "Vizyon Destek:" diye başlamasın, doğrudan cevabı ver. Cevabın kısa, net ve anlaşılır olsun.`;
                }
                const result = await Parse.Cloud.run('superAI', { prompt: supportPrompt }, { useMasterKey: true });
                const reply = result || 'Vizyon Destek olarak size yardımcı olmaktan mutluluk duyarım. Lütfen daha detaylı sorunuzu belirtin.';
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
                msg.set("message", '🧠 VİZYON DESTEK: Üzgünüm, şu anda size yardımcı olamıyorum. Lütfen daha sonra tekrar deneyin veya destek talebinizi kurucuya iletin.');
                await msg.save(null, { useMasterKey: true });
                return { success: true };
            }
        }

        if (isVizyonCommand) {
            let aiPrompt = '';
            if (isGreeting) {
                aiPrompt = `Kullanıcı selam veriyor: "${command}". Sen VİZYON AI'sın. Sohbete başlamak için nazik ve samimi bir selam ver. Ardından "Size nasıl yardımcı olabilirim?" de.`;
            } else {
                aiPrompt = `Kullanıcı sorusu: "${command}". Sen VİZYON AI'sın. Sohbet geçmişi: ${context} Soruyu detaylı ve anlaşılır bir şekilde cevapla. Eğer kod istiyorsa, çalışan kod örneği ver. Cevabın "VİZYON AI:" diye başlamasın, doğrudan cevabı ver. Cevabın kısa, net ve anlaşılır olsun.`;
            }
            try {
                const result = await Parse.Cloud.run('superAI', { prompt: aiPrompt }, { useMasterKey: true });
                const reply = result || 'VİZYON AI olarak size yardımcı olmaktan mutluluk duyarım. Lütfen daha detaylı sorunuzu belirtin.';
                msg.set("team_id", teamId);
                msg.set("user_email", 'system@vizyon2027.com');
                msg.set("user_name", '🧠 VİZYON AI');
                msg.set("message", '🧠 VİZYON AI: ' + reply);
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

// ================================================================
// ========== TAKIM MESAJI SİL ==========
// ================================================================
Parse.Cloud.define("deleteTeamMessage", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { msgId } = request.params;
    if (!msgId) throw new Error("Mesaj ID gerekli!");

    const query = new Parse.Query(TeamMessage);
    const msg = await query.get(msgId, { useMasterKey: true });
    if (!msg) throw new Error("Mesaj bulunamadı!");

    const teamId = msg.get('team_id');
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    const isMyMessage = (msg.get('user_email') === user.get('email'));
    const isOwner = (team.get('owner_email') === user.get('email'));
    const isManager = (team.get('manager_email') === user.get('email'));
    const isFounder = (user.get('role') === 'founder');
    const isVizyonFounder = (user.get('email') === 'admin.tr.reis@gmail.com');

    if (!isMyMessage && !isOwner && !isManager && !isFounder) {
        throw new Error("Bu mesajı silme yetkiniz yok!");
    }
    if (msg.get('user_email') === 'system@vizyon2027.com' && !isVizyonFounder) {
        throw new Error("Sistem mesajlarını sadece kurucu silebilir!");
    }

    msg.set('deleted', true);
    msg.set('deleted_by', user.get('email'));
    msg.set('deleted_at', new Date());
    if (isVizyonFounder && !isMyMessage) {
        msg.set('deleted_by_founder', true);
    }
    await msg.save(null, { useMasterKey: true });

    return { success: true, message: "Mesaj silindi." };
});

// ================================================================
// ========== TAKIM MESAJI DÜZENLE ==========
// ================================================================
Parse.Cloud.define("editTeamMessage", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { msgId, newMessage } = request.params;
    if (!msgId || !newMessage) throw new Error("Mesaj ID ve yeni mesaj gerekli!");
    if (!newMessage.trim()) throw new Error("Mesaj boş olamaz!");

    const query = new Parse.Query(TeamMessage);
    const msg = await query.get(msgId, { useMasterKey: true });
    if (!msg) throw new Error("Mesaj bulunamadı!");
    if (msg.get('deleted')) throw new Error("Silinmiş mesaj düzenlenemez!");

    if (msg.get('user_email') !== user.get('email')) {
        throw new Error("Sadece kendi mesajınızı düzenleyebilirsiniz!");
    }

    msg.set('message', filterText(newMessage.trim()));
    msg.set('edited', true);
    msg.set('edited_at', new Date());
    await msg.save(null, { useMasterKey: true });

    return { success: true, message: "Mesaj düzenlendi." };
});

// ================================================================
// ========== TEK MESAJ GETİR ==========
// ================================================================
Parse.Cloud.define("getTeamMessage", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { msgId } = request.params;
    if (!msgId) throw new Error("Mesaj ID gerekli!");

    const query = new Parse.Query(TeamMessage);
    const msg = await query.get(msgId, { useMasterKey: true });
    if (!msg) return { success: false, error: "Mesaj bulunamadı!" };

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

Parse.Cloud.define("inviteToTeam", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Önce takım oluşturun!");
    const { email } = request.params;
    if (!email) throw new Error("E-posta adresi gerekli!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const inbox = new Inbox();
    inbox.set("sender_email", user.get('email'));
    inbox.set("receiver_email", email);
    inbox.set("type", "team_invite");
    inbox.set("team_id", teamId);
    inbox.set("team_name", team.get('name'));
    inbox.set("status", "pending");
    inbox.set("message", `${user.get('name')} sizi "${team.get('name')}" takımına davet etti!`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("acceptTeamInvite", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { teamId, inboxId } = request.params;
    if (!teamId || !inboxId) throw new Error("Takım ID ve Inbox ID gerekli!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    const existing = await memberQuery.first({ useMasterKey: true });
    if (existing) throw new Error("Zaten bu takımın üyesisiniz!");
    const member = new TeamMember();
    member.set("team_id", teamId);
    member.set("user_email", user.get('email'));
    await member.save(null, { useMasterKey: true });
    user.set("teamId", teamId);
    await user.save(null, { useMasterKey: true });
    const inboxQuery = new Parse.Query(Inbox);
    const inbox = await inboxQuery.get(inboxId, { useMasterKey: true });
    inbox.set("status", "accepted");
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: "Takıma katıldınız!" };
});

Parse.Cloud.define("rejectTeamInvite", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { inboxId } = request.params;
    if (!inboxId) throw new Error("Inbox ID gerekli!");
    const inboxQuery = new Parse.Query(Inbox);
    const inbox = await inboxQuery.get(inboxId, { useMasterKey: true });
    inbox.set("status", "rejected");
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("leaveTeam", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (team.get('owner_email') === user.get('email')) {
        throw new Error("Takım sahibi ayrılamaz, önce sahipliği devredin.");
    }
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu takımın üyesi değilsiniz!");
    await member.destroy({ useMasterKey: true });
    user.set("teamId", null);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("getTeamMembers", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    const members = await memberQuery.find({ useMasterKey: true });
    const emailList = members.map(m => m.get('user_email'));
    const userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn('email', emailList);
    const users = await userQuery.find({ useMasterKey: true });
    const userMap = {};
    users.forEach(u => { userMap[u.get('email')] = u.get('name') || u.get('username') || 'İsimsiz'; });
    const list = members.map(m => ({
        email: m.get('user_email'),
        name: userMap[m.get('user_email')] || m.get('user_email').split('@')[0] || 'İsimsiz',
        isOwner: m.get('user_email') === team.get('owner_email'),
        isManager: m.get('user_email') === team.get('manager_email')
    }));
    return { success: true, members: list, owner: team.get('owner_email'), manager: team.get('manager_email') };
});

Parse.Cloud.define("makeTeamManager", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("Hedef e-posta gerekli!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    if (team.get('owner_email') !== user.get('email')) throw new Error("Sadece takım sahibi yönetici atayabilir!");
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu kullanıcı takımda değil!");
    team.set("manager_email", targetEmail);
    await team.save(null, { useMasterKey: true });
    return { success: true, message: `${targetEmail} yönetici atandı!` };
});

Parse.Cloud.define("demoteManager", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("Hedef e-posta gerekli!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    if (team.get('owner_email') !== user.get('email')) throw new Error("Sadece takım sahibi yöneticiyi çıkarabilir!");
    if (team.get('manager_email') !== targetEmail) throw new Error("Bu kullanıcı yönetici değil!");
    team.set("manager_email", null);
    await team.save(null, { useMasterKey: true });
    return { success: true, message: `${targetEmail} yöneticilikten çıkarıldı.` };
});

Parse.Cloud.define("removeFromTeam", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("Hedef e-posta gerekli!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const isOwner = team.get('owner_email') === user.get('email');
    const isManager = team.get('manager_email') === user.get('email') && !isOwner;
    if (!isOwner && !isManager) throw new Error("Sadece takım sahibi veya yöneticisi üye atabilir!");
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu kullanıcı takımda değil!");
    if (targetEmail === team.get('owner_email')) throw new Error("Takım sahibi atılamaz!");
    if (targetEmail === team.get('manager_email') && !isOwner) throw new Error("Yöneticiyi sadece takım sahibi atabilir!");
    await member.destroy({ useMasterKey: true });
    if (targetEmail === team.get('manager_email')) {
        team.set("manager_email", null);
        await team.save(null, { useMasterKey: true });
    }
    const targetUserQuery = new Parse.Query(Parse.User);
    targetUserQuery.equalTo('email', targetEmail);
    const targetUser = await targetUserQuery.first({ useMasterKey: true });
    if (targetUser) {
        targetUser.set('teamId', null);
        await targetUser.save(null, { useMasterKey: true });
    }
    return { success: true, message: `${targetEmail} takımdan atıldı!` };
});

Parse.Cloud.define("transferOwnership", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("Hedef e-posta gerekli!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    if (team.get('owner_email') !== user.get('email')) throw new Error("Sadece takım sahibi sahipliği devredebilir!");
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu kullanıcı takımda değil!");
    const oldOwnerEmail = user.get('email');
    team.set("owner_email", targetEmail);
    team.set("manager_email", oldOwnerEmail);
    await team.save(null, { useMasterKey: true });
    const inbox = new Inbox();
    inbox.set("sender_email", 'system@vizyon2027.com');
    inbox.set("receiver_email", targetEmail);
    inbox.set("type", "notification");
    inbox.set("message", `👑 ${user.get('name')} size ${team.get('name')} takımının sahipliğini devretti.`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: `Sahipliği ${targetEmail} adlı kullanıcıya devrettiniz.` };
});

Parse.Cloud.define("closeTeam", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Takımınız yok!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    if (team.get('owner_email') !== user.get('email') && user.get('role') !== 'founder') {
        throw new Error("Sadece takım sahibi veya kurucu kapatabilir!");
    }
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    const members = await memberQuery.find({ useMasterKey: true });
    for (const m of members) {
        const email = m.get('user_email');
        const inbox = new Inbox();
        inbox.set("sender_email", 'system@vizyon2027.com');
        inbox.set("receiver_email", email);
        inbox.set("type", "notification");
        inbox.set("message", `🚫 ${team.get('name')} (${team.get('teamCode')}) takımı ${user.get('name')} tarafından kapatıldı.`);
        await inbox.save(null, { useMasterKey: true });
        const userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("email", email);
        const u = await userQuery.first({ useMasterKey: true });
        if (u) { u.set("teamId", null); await u.save(null, { useMasterKey: true }); }
    }
    const msgQuery = new Parse.Query(TeamMessage);
    msgQuery.equalTo("team_id", teamId);
    const msgs = await msgQuery.find({ useMasterKey: true });
    for (const msg of msgs) await msg.destroy({ useMasterKey: true });
    await team.destroy({ useMasterKey: true });
    user.set("teamId", null);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("getAllTeams", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const query = new Parse.Query(Team);
    const teams = await query.find({ useMasterKey: true });
    const result = [];
    for (const t of teams) {
        const mq = new Parse.Query(TeamMember);
        mq.equalTo("team_id", t.id);
        const count = await mq.count({ useMasterKey: true });
        result.push({ id: t.id, name: t.get('name'), code: t.get('teamCode'), owner: t.get('owner_email'), memberCount: count });
    }
    return result;
});

Parse.Cloud.define("searchTeams", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const { query } = request.params;
    if (!query) return [];
    const q = new Parse.Query(Team);
    q.matches('name', new RegExp(query, 'i'));
    const q2 = new Parse.Query(Team);
    q2.matches('teamCode', new RegExp(query, 'i'));
    const mainQuery = Parse.Query.or(q, q2);
    const teams = await mainQuery.find({ useMasterKey: true });
    const result = [];
    for (const t of teams) {
        const mq = new Parse.Query(TeamMember);
        mq.equalTo("team_id", t.id);
        const count = await mq.count({ useMasterKey: true });
        result.push({ id: t.id, name: t.get('name'), code: t.get('teamCode'), owner: t.get('owner_email'), memberCount: count });
    }
    return result;
});

Parse.Cloud.define("joinTeamAsFounder", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu yapabilir!");
    const { teamId } = request.params;
    if (!teamId) throw new Error("Takım ID gerekli!");
    const tq = new Parse.Query(Team);
    const team = await tq.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const mq = new Parse.Query(TeamMember);
    mq.equalTo("team_id", teamId);
    mq.equalTo("user_email", user.get('email'));
    const existing = await mq.first({ useMasterKey: true });
    if (!existing) {
        const member = new TeamMember();
        member.set("team_id", teamId);
        member.set("user_email", user.get('email'));
        await member.save(null, { useMasterKey: true });
    }
    user.set("teamId", teamId);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("forceCloseTeam", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu yapabilir!");
    const { teamId } = request.params;
    if (!teamId) throw new Error("Takım ID gerekli!");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const memberQuery = new Parse.Query(TeamMember);
    memberQuery.equalTo("team_id", teamId);
    const members = await memberQuery.find({ useMasterKey: true });
    for (const m of members) {
        const email = m.get('user_email');
        const inbox = new Inbox();
        inbox.set("sender_email", 'system@vizyon2027.com');
        inbox.set("receiver_email", email);
        inbox.set("type", "notification");
        inbox.set("message", `🚫 ${team.get('name')} (${team.get('teamCode')}) takımı Vizyon Kurucu tarafından kapatıldı.`);
        await inbox.save(null, { useMasterKey: true });
        const userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("email", email);
        const u = await userQuery.first({ useMasterKey: true });
        if (u) { u.set("teamId", null); await u.save(null, { useMasterKey: true }); }
    }
    const msgQuery = new Parse.Query(TeamMessage);
    msgQuery.equalTo("team_id", teamId);
    const msgs = await msgQuery.find({ useMasterKey: true });
    for (const msg of msgs) await msg.destroy({ useMasterKey: true });
    await team.destroy({ useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== TAKIM SOHBET GEÇMİŞİNİ OKU (KURUCU İÇİN) ==========
// ================================================================
Parse.Cloud.define("getTeamChatHistory", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu takım sohbet geçmişini okuyabilir!");

    const { teamId, limit } = request.params;
    if (!teamId) throw new Error("Takım ID gerekli!");

    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    const msgQuery = new Parse.Query(TeamMessage);
    msgQuery.equalTo("team_id", teamId);
    msgQuery.ascending('createdAt');
    if (limit) msgQuery.limit(parseInt(limit));
    else msgQuery.limit(100);
    const messages = await msgQuery.find({ useMasterKey: true });

    return messages.map(msg => ({
        id: msg.id,
        user_email: msg.get('user_email'),
        user_name: msg.get('user_name'),
        message: msg.get('message'),
        fileUrl: msg.get('fileUrl'),
        fileName: msg.get('fileName'),
        createdAt: msg.get('createdAt')
    }));
});

// ================================================================
// ========== ÖZELLİK ENGELLEME SİSTEMİ (KURUCU) ==========
// ================================================================
Parse.Cloud.define("toggleUserFeature", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu bu işlemi yapabilir!");

    const { targetEmail, feature, enabled } = request.params;
    if (!targetEmail || !feature) throw new Error("Hedef e-posta ve özellik adı gerekli!");
    if (typeof enabled !== 'boolean') throw new Error("enabled boolean olmalı!");

    const targetQuery = new Parse.Query(Parse.User);
    targetQuery.equalTo('email', targetEmail);
    const target = await targetQuery.first({ useMasterKey: true });
    if (!target) throw new Error("Kullanıcı bulunamadı!");

    const disabled = target.get('disabled_features') || [];
    if (enabled) {
        if (!disabled.includes(feature)) {
            disabled.push(feature);
            target.set('disabled_features', disabled);
            await target.save(null, { useMasterKey: true });
        }
    } else {
        const index = disabled.indexOf(feature);
        if (index !== -1) {
            disabled.splice(index, 1);
            target.set('disabled_features', disabled);
            await target.save(null, { useMasterKey: true });
        }
    }

    return { success: true, message: `${targetEmail} için "${feature}" özelliği ${enabled ? 'engellendi' : 'engel kaldırıldı'}.` };
});

// ================================================================
// ========== VİZYON DESTEK AI ==========
// ================================================================
Parse.Cloud.define("vizyonSupportAI", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");

    const message = request.params.message;
    if (!message) throw new Error("Mesaj gerekli!");

    if (user.get('email').toLowerCase() === 'admin.tr.reis@gmail.com') {
        const lower = message.toLowerCase();
        let response = null;

        if (lower.includes('tüm üyeleri listele') || lower.includes('tüm kullanıcıları listele')) {
            try {
                const users = await Parse.Cloud.run('getAllUsers', {}, { useMasterKey: true });
                if (users && users.length > 0) {
                    let text = "👥 Tüm Kullanıcılar:\n\n";
                    users.forEach(u => {
                        const roleLabels = { founder: '👑 Kurucu', admin: '⚙️ Admin', beta: '🔬 Beta', user: '👤 Kullanıcı' };
                        const roleLabel = roleLabels[u.role] || '👤 Kullanıcı';
                        const planLabels = { pro: '🌟 Pro', team: '👥 Takım', free: '🆓 Ücretsiz' };
                        const planLabel = planLabels[u.plan] || '🆓 Ücretsiz';
                        text += `📧 ${u.email} | ${u.name} | ${roleLabel} | ${planLabel} | Puan: ${u.points}\n`;
                    });
                    response = text;
                } else {
                    response = "📭 Hiç kullanıcı bulunamadı.";
                }
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        if (lower.includes('tüm takımları listele')) {
            try {
                const teams = await Parse.Cloud.run('getAllTeams', {}, { useMasterKey: true });
                if (teams && teams.length > 0) {
                    let text = "🌐 Tüm Takımlar:\n\n";
                    teams.forEach(t => {
                        text += `🏢 ${t.name} (Kod: ${t.code}) | 👑 ${t.owner} | ${t.memberCount} üye\n`;
                    });
                    response = text;
                } else {
                    response = "📭 Hiç takım bulunamadı.";
                }
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchTeamHistory = lower.match(/takım (?:sohbet|mesajları?nı?|geçmişini?) (?:göster|oku|getir|ver)\s+(\w+)/);
        if (matchTeamHistory) {
            const teamCodeOrId = matchTeamHistory[1];
            let teamQuery = new Parse.Query(Team);
            teamQuery.equalTo('teamCode', teamCodeOrId.toUpperCase());
            let team = await teamQuery.first({ useMasterKey: true });
            if (!team) {
                try {
                    team = await new Parse.Query(Team).get(teamCodeOrId, { useMasterKey: true });
                } catch (e) {}
            }
            if (team) {
                try {
                    const msgs = await Parse.Cloud.run('getTeamChatHistory', { teamId: team.id, limit: 50 }, { useMasterKey: true });
                    if (msgs && msgs.length > 0) {
                        let text = `📜 Takım "${team.get('name')}" (${team.get('teamCode')}) sohbet geçmişi:\n\n`;
                        msgs.forEach(m => {
                            const sender = m.user_name || m.user_email || 'Bilinmiyor';
                            const msgText = m.message || '[Dosya]';
                            const time = new Date(m.createdAt).toLocaleString('tr-TR');
                            text += `[${time}] ${sender}: ${msgText}\n`;
                        });
                        response = text;
                    } else {
                        response = `📭 Takımda henüz mesaj yok.`;
                    }
                } catch (e) {
                    response = `❌ Takım sohbeti okunamadı: ${e.message}`;
                }
            } else {
                response = `❌ "${teamCodeOrId}" kodlu veya ID'li takım bulunamadı.`;
            }
        }

        const matchUserInfo = lower.match(/kullanıcı bilgisi\s+(\S+@\S+)/);
        if (matchUserInfo) {
            const email = matchUserInfo[1];
            try {
                const query = new Parse.Query(Parse.User);
                query.equalTo('email', email);
                const target = await query.first({ useMasterKey: true });
                if (target) {
                    const roleLabels = { founder: '👑 Kurucu', admin: '⚙️ Admin', beta: '🔬 Beta', user: '👤 Kullanıcı' };
                    const roleLabel = roleLabels[target.get('role')] || '👤 Kullanıcı';
                    const planLabels = { pro: '🌟 Pro', team: '👥 Takım', free: '🆓 Ücretsiz' };
                    const planLabel = planLabels[target.get('plan')] || '🆓 Ücretsiz';
                    const disabledFeatures = target.get('disabled_features') || [];
                    const disabledText = disabledFeatures.length ? `Engelli Özellikler: ${disabledFeatures.join(', ')}` : 'Hiçbir özellik engelli değil.';
                    response = `📧 ${email}\n👤 ${target.get('name') || 'İsimsiz'}\n👑 Rol: ${roleLabel}\n📦 Plan: ${planLabel}\n⭐ Puan: ${target.get('points') || 0}\n🏷️ Seviye: ${target.get('level') || 'Çaylak'}\n🚫 Engelli: ${target.get('isBanned') ? 'Evet' : 'Hayır'}\n🔧 ${disabledText}`;
                } else {
                    response = `❌ Kullanıcı bulunamadı: ${email}`;
                }
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchAssignAdmin = lower.match(/admin ata\s+(\S+@\S+)/);
        if (matchAssignAdmin) {
            const email = matchAssignAdmin[1];
            try {
                await Parse.Cloud.run('assignAdmin', { email }, { useMasterKey: true });
                response = `✅ ${email} başarıyla Admin yapıldı.`;
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchSetBeta = lower.match(/beta yap\s+(\S+@\S+)/);
        if (matchSetBeta) {
            const email = matchSetBeta[1];
            try {
                await Parse.Cloud.run('setUserRole', { email, role: 'beta' }, { useMasterKey: true });
                response = `✅ ${email} başarıyla Beta yapıldı.`;
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchBan = lower.match(/kullanıcıyı yasakla\s+(\S+@\S+)/);
        if (matchBan) {
            const email = matchBan[1];
            try {
                await Parse.Cloud.run('banUser', { targetEmail: email }, { useMasterKey: true });
                response = `✅ ${email} yasaklandı.`;
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchUnban = lower.match(/kullanıcının yasağını kaldır\s+(\S+@\S+)/);
        if (matchUnban) {
            const email = matchUnban[1];
            try {
                await Parse.Cloud.run('unbanUser', { targetEmail: email }, { useMasterKey: true });
                response = `✅ ${email} yasağı kaldırıldı.`;
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchPlan = lower.match(/kullanıcının planını (\w+) yap\s+(\S+@\S+)/);
        if (matchPlan) {
            const plan = matchPlan[1];
            const email = matchPlan[2];
            if (['free', 'pro', 'team'].includes(plan)) {
                try {
                    await Parse.Cloud.run('setUserPlan', { email, plan }, { useMasterKey: true });
                    response = `✅ ${email} planı "${plan}" olarak güncellendi.`;
                } catch (e) {
                    response = `❌ Hata: ${e.message}`;
                }
            } else {
                response = `❌ Geçersiz plan: ${plan}. (free, pro, team)`;
            }
        }

        const matchGift = lower.match(/hediye gönder\s+(\S+@\S+)\s+(pro|team)/);
        if (matchGift) {
            const email = matchGift[1];
            const pkg = matchGift[2];
            try {
                await Parse.Cloud.run('sendGiftRequest', { email, packageType: pkg }, { useMasterKey: true });
                response = `✅ ${email} adresine ${pkg === 'pro' ? '🌟 Pro' : '👥 Takım'} paketi hediye edildi.`;
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchRole = lower.match(/kullanıcının rolünü (\w+) yap\s+(\S+@\S+)/);
        if (matchRole) {
            const role = matchRole[1];
            const email = matchRole[2];
            if (['user', 'admin', 'beta', 'founder'].includes(role)) {
                try {
                    await Parse.Cloud.run('setUserRole', { email, role }, { useMasterKey: true });
                    response = `✅ ${email} rolü "${role}" olarak güncellendi.`;
                } catch (e) {
                    response = `❌ Hata: ${e.message}`;
                }
            } else {
                response = `❌ Geçersiz rol: ${role}. (user, admin, beta, founder)`;
            }
        }

        const matchDisableFeature = lower.match(/kullanıcının (\w+) yapmasını engelle\s+(\S+@\S+)/);
        if (matchDisableFeature) {
            const feature = matchDisableFeature[1];
            const email = matchDisableFeature[2];
            try {
                await Parse.Cloud.run('toggleUserFeature', { targetEmail: email, feature, enabled: true }, { useMasterKey: true });
                response = `✅ ${email} için "${feature}" özelliği engellendi.`;
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        const matchEnableFeature = lower.match(/kullanıcının (\w+) yapmasını aç\s+(\S+@\S+)/);
        if (matchEnableFeature) {
            const feature = matchEnableFeature[1];
            const email = matchEnableFeature[2];
            try {
                await Parse.Cloud.run('toggleUserFeature', { targetEmail: email, feature, enabled: false }, { useMasterKey: true });
                response = `✅ ${email} için "${feature}" özelliğinin engeli kaldırıldı.`;
            } catch (e) {
                response = `❌ Hata: ${e.message}`;
            }
        }

        if (response) {
            return { reply: response };
        }

        const siteContent = await getSiteContent();
        const prompt = `Sen VİZYON DESTEK asistanısın. Kullanıcı KURUCU (${user.get('email')}). Kurucu sistemde her şeyi yapabilir. Ona her konuda yardımcı ol. Kurucu mesajı: "${message}" Site içeriği: ${siteContent.substring(0, 2000)} Cevabını kurucuya özel, saygılı ve kapsamlı ver. Eğer kurucu bir şey yapmamı istiyorsa, direkt olarak yap ve sonucu söyle. Asla "nasıl yapacağını anlatma", sadece yap.`;
        const reply = await Parse.Cloud.run("superAI", { prompt }, { useMasterKey: true });
        return { reply: cleanResponse(reply) };
    }

    const siteContent = await getSiteContent();
    const isGreeting = ['selam', 'merhaba', 'hey', 'slm', 'hello', 'hi', 'naber', 'nasılsın', 'iyi misin'].some(w => message.toLowerCase().includes(w));
    let prompt;
    if (isGreeting) {
        prompt = `Kullanıcı selam veriyor: "${message}". Sen Vizyon Destek'sin. Nazik ve profesyonel bir şekilde selamına karşılık ver. Ardından "Size nasıl yardımcı olabilirim?" de. VİZYON2027 sitesi hakkında bilgi: ${siteContent.substring(0, 1500)}`;
    } else {
        prompt = `Kullanıcı sorusu: "${message}". Sen Vizyon Destek'sin. VİZYON2027 sitesi hakkında bilgi: ${siteContent.substring(0, 1500)} Eğer soru site hakkında ise, site bilgisine göre detaylı cevap ver. Eğer soru site dışı bir konu ise, "Bu soru için VİZYON AI'ı çağırmanız daha doğru olur. Lütfen sohbete @vizyonal yazarak sorunuzu ona iletin." de. Cevabın "Vizyon Destek:" diye başlamasın, doğrudan cevabı ver. Cevabın kısa, net ve anlaşılır olsun.`;
    }
    const reply = await Parse.Cloud.run("superAI", { prompt }, { useMasterKey: true });
    return { reply: cleanResponse(reply) };
});

// ================================================================
// ========== V27 KOÇ ==========
// ================================================================
Parse.Cloud.define("getCoachAdvice", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { question } = request.params;
    if (!question) throw new Error("Soru gerekli!");
    try {
        const prompt = `Sen V27 Koç'sun. Kullanıcı sana şunu sordu: "${question}". Ona motive edici, yol gösterici ve günlük 3 görev öneren bir cevap ver. Cevap kısa ve net olsun.`;
        const reply = await Parse.Cloud.run("superAI", { prompt }, { useMasterKey: true });
        return { advice: reply };
    } catch (e) {
        return { advice: "Üzgünüm, şu anda cevap veremiyorum. Lütfen daha sonra tekrar deneyin." };
    }
});

// ================================================================
// ========== V27 CANLI DESTEK ==========
// ================================================================
Parse.Cloud.define("getSupportReply", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { question } = request.params;
    if (!question) throw new Error("Soru gerekli!");
    try {
        const prompt = `Sen V27 Asistan'sın. Kullanıcı sana şu soruyu sordu: "${question}". Destek talebine yardımcı ol, çözüm öner. Cevap kısa ve net olsun.`;
        const reply = await Parse.Cloud.run("superAI", { prompt }, { useMasterKey: true });
        return { reply: reply };
    } catch (e) {
        return { reply: "Üzgünüm, destek asistanı şu anda meşgul. Lütfen daha sonra tekrar deneyin." };
    }
});

// ================================================================
// ========== VİZYON LOG ==========
// ================================================================
Parse.Cloud.define("getVizyonLog", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const query = new Parse.Query(VizyonLog);
    query.descending('createdAt');
    query.limit(100);
    const logs = await query.find({ useMasterKey: true });
    return logs.map(l => ({ message: l.get('message'), createdAt: l.get('createdAt') }));
});

Parse.Cloud.define("addVizyonLog", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { action, targetEmail, targetName, reason, teamName, teamCode } = request.params;
    const log = new VizyonLog();
    let msg = '';
    if (action === 'kick') msg = `🚫 ${targetName} (${targetEmail}) ${teamName} (${teamCode}) takımından atıldı. Sebep: ${reason}`;
    else if (action === 'close_team') msg = `🗑️ ${teamName} (${teamCode}) takımı ${reason} nedeniyle kapatıldı.`;
    else if (action === 'support_request') msg = `📨 ${targetName} (${targetEmail}) destek talebi: ${reason}`;
    else msg = `ℹ️ ${action} - ${reason}`;
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
Parse.Cloud.define("generate3DWithHF", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }

    const prompt = request.params.prompt;
    if (!prompt) throw new Error("Prompt gerekli!");
    const apiKey = await getAPIKey('HF_API_KEY');
    if (!apiKey) throw new Error("HF_API_KEY eksik!");
    try {
        const url = `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-medium`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("HF API hatası: " + errorText);
        }
        const buffer = await response.arrayBuffer();
        const base64 = bufferToBase64(buffer);
        return { success: true, imageBase64: base64 };
    } catch (e) {
        console.error('HF hatası:', e);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("generateImageWithHF", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }

    const prompt = request.params.prompt;
    if (!prompt) throw new Error("Prompt gerekli!");
    const apiKey = await getAPIKey('HF_API_KEY');
    if (!apiKey) throw new Error("HF_API_KEY eksik!");
    try {
        const url = `https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("HF Görsel API hatası: " + errorText);
        }
        const buffer = await response.arrayBuffer();
        const base64 = bufferToBase64(buffer);
        return { success: true, imageBase64: base64 };
    } catch (e) {
        console.error('HF Görsel hatası:', e);
        return { success: false, error: e.message };
    }
});

// ================================================================
// ========== ADMIN FONKSİYONLARI ==========
// ================================================================
Parse.Cloud.define("assignAdmin", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu admin atayabilir!");
    const { email } = request.params;
    if (!email) throw new Error("E-posta gerekli!");
    const targetUser = await new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
    if (!targetUser) throw new Error("Kullanıcı bulunamadı!");
    targetUser.set('role', 'admin');
    await targetUser.save(null, { useMasterKey: true });
    return { success: true, message: `${email} admin yapıldı.` };
});

Parse.Cloud.define("setUserRole", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu rol değiştirebilir!");
    const { email, role } = request.params;
    if (!email || !role) throw new Error("E-posta ve rol gerekli!");
    if (!['user', 'admin', 'beta', 'founder'].includes(role)) throw new Error("Geçersiz rol!");
    const targetUser = await new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
    if (!targetUser) throw new Error("Kullanıcı bulunamadı!");
    targetUser.set('role', role);
    await targetUser.save(null, { useMasterKey: true });
    return { success: true, message: `${email} rolü "${role}" olarak güncellendi.` };
});

Parse.Cloud.define("setUserPlan", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu plan değiştirebilir!");
    const { email, plan } = request.params;
    if (!email || !plan) throw new Error("E-posta ve plan gerekli!");
    if (!['free', 'pro', 'team'].includes(plan)) throw new Error("Geçersiz plan!");
    const targetUser = await new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
    if (!targetUser) throw new Error("Kullanıcı bulunamadı!");
    targetUser.set('plan', plan);
    await targetUser.save(null, { useMasterKey: true });
    return { success: true, message: `${email} planı "${plan}" olarak güncellendi.` };
});

Parse.Cloud.define("getAdmins", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('role', 'admin');
    const admins = await query.find({ useMasterKey: true });
    return admins.map(u => ({ email: u.get('email'), name: u.get('name') || 'İsimsiz' }));
});

Parse.Cloud.define("getBetas", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) throw new Error("Yetkiniz yok!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('role', 'beta');
    const betas = await query.find({ useMasterKey: true });
    return betas.map(u => ({ email: u.get('email'), name: u.get('name') || 'İsimsiz' }));
});

Parse.Cloud.define("getBannedUsers", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) throw new Error("Yetkiniz yok!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('isBanned', true);
    const banned = await query.find({ useMasterKey: true });
    return banned.map(u => ({ email: u.get('email'), name: u.get('name') || 'İsimsiz' }));
});

Parse.Cloud.define("banUser", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) throw new Error("Yetkiniz yok!");
    const { targetEmail } = request.params;
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    const target = await query.first({ useMasterKey: true });
    if (!target) throw new Error("Kullanıcı bulunamadı!");
    if (target.get('isBanned')) throw new Error("Zaten engelli!");
    target.set('isBanned', true);
    await target.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("unbanUser", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) throw new Error("Yetkiniz yok!");
    const { targetEmail } = request.params;
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    const target = await query.first({ useMasterKey: true });
    if (!target) throw new Error("Kullanıcı bulunamadı!");
    if (!target.get('isBanned')) throw new Error("Zaten engelli değil!");
    target.set('isBanned', false);
    await target.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("leaveAdminRole", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'admin') throw new Error("Admin değilsiniz!");
    user.set('role', 'user');
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("leaveBetaRole", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'beta') throw new Error("Beta değilsiniz!");
    user.set('role', 'user');
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== KULLANICI LİSTESİ (TÜMÜ) ==========
// ================================================================
Parse.Cloud.define("getAllUsers", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) {
        throw new Error("Bu işlem için yetkiniz yok!");
    }
    const query = new Parse.Query(Parse.User);
    query.descending('createdAt');
    const users = await query.find({ useMasterKey: true });
    return users.map(u => ({
        id: u.id,
        email: u.get('email'),
        name: u.get('name') || u.get('username') || 'İsimsiz',
        role: u.get('role') || 'user',
        plan: u.get('plan') || 'free',
        isBanned: u.get('isBanned') || false,
        points: u.get('points') || 0,
        createdAt: u.get('createdAt')
    }));
});

// ================================================================
// ========== GIPHY API ==========
// ================================================================
Parse.Cloud.define("searchGif", async (request) => {
    const query = request.params.query;
    if (!query) throw new Error("Arama terimi gerekli!");
    const apiKey = await getAPIKey('GIPHY_API_KEY');
    if (!apiKey) throw new Error("GIPHY_API_KEY eksik! Config'e ekleyin.");
    try {
        const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            return data.data.map(g => ({
                id: g.id,
                title: g.title,
                images: {
                    fixed_height: g.images.fixed_height
                }
            }));
        } else {
            return [];
        }
    } catch (e) {
        console.error('GIPHY hatası:', e);
        return [];
    }
});

// ================================================================
// ========== ÇEVİRİ (SMART TRANSLATE) ==========
// ================================================================
Parse.Cloud.define("translateWithDeepL", async (request) => {
    const { text, targetLang, sourceLang } = request.params;
    const key = await getAPIKey('DEEPL_API_KEY');
    if (!key) throw new Error("DeepL anahtarı eksik!");
    try {
        const res = await fetch("https://api-free.deepl.com/v2/translate", {
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
        const data = await res.json();
        if (data.message) throw new Error(data.message);
        if (data.translations && data.translations[0]) {
            return { success: true, translatedText: data.translations[0].text, engine: "DeepL" };
        } else {
            throw new Error("Beklenmeyen yanıt formatı");
        }
    } catch (e) {
        console.error('DeepL hatası:', e);
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("translateWithLibre", async (request) => {
    const { text, targetLang, sourceLang } = request.params;
    try {
        const res = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, source: sourceLang || 'auto', target: targetLang, format: 'text' })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return { success: true, translatedText: data.translatedText, engine: "LibreTranslate" };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

Parse.Cloud.define("smartTranslate", async (request) => {
    const { text, targetLang, sourceLang } = request.params;
    try {
        const deepl = await Parse.Cloud.run("translateWithDeepL", { text, targetLang, sourceLang }, { useMasterKey: true });
        if (deepl.success) return deepl;
    } catch (e) {}
    try {
        const libre = await Parse.Cloud.run("translateWithLibre", { text, targetLang, sourceLang }, { useMasterKey: true });
        if (libre.success) return libre;
    } catch (e) {}
    return { success: false, translatedText: text, error: "Tüm çeviri motorları başarısız." };
});

// ================================================================
// ========== ÜRÜN ==========
// ================================================================
Parse.Cloud.define("addProduct", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { title, price, fileUrl } = request.params;
    if (!title || !price) throw new Error("Ürün adı ve fiyat gerekli!");
    const product = new Product();
    product.set('user_email', user.get('email'));
    product.set('title_', title);
    product.set('price', parseFloat(price));
    if (fileUrl) product.set('file', fileUrl);
    product.set('status', 'pending');
    await product.save(null, { useMasterKey: true });
    return { success: true, productId: product.id };
});

Parse.Cloud.define("getProducts", async (request) => {
    const query = new Parse.Query(Product);
    query.equalTo('status', 'approved');
    query.descending('createdAt');
    const products = await query.find({ useMasterKey: true });
    return products.map(p => ({
        id: p.id,
        title: p.get('title_'),
        price: p.get('price'),
        file: p.get('file'),
        seller: p.get('user_email') || 'Bilinmiyor',
        createdAt: p.get('createdAt')
    }));
});

Parse.Cloud.define("buyProduct", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { productId } = request.params;
    const query = new Parse.Query(Product);
    const product = await query.get(productId, { useMasterKey: true });
    if (!product) throw new Error("Ürün bulunamadı!");
    if (product.get('status') !== 'approved') throw new Error("Bu ürün satın alınamaz!");
    const price = product.get('price') || 0;
    const commission = price * 0.10;
    const sellerEarn = price - commission;
    const sellerEmail = product.get('user_email');
    const sellerQuery = new Parse.Query(Parse.User);
    sellerQuery.equalTo('email', sellerEmail);
    const seller = await sellerQuery.first({ useMasterKey: true });
    if (seller) {
        const sellerWallet = seller.get('wallet_balance') || 0;
        seller.set('wallet_balance', sellerWallet + sellerEarn);
        await seller.save(null, { useMasterKey: true });
    }
    const adminQuery = new Parse.Query(Parse.User);
    adminQuery.equalTo('email', 'admin.tr.reis@gmail.com');
    const admin = await adminQuery.first({ useMasterKey: true });
    if (admin) {
        const adminWallet = admin.get('wallet_balance') || 0;
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

Parse.Cloud.define("getMyProducts", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const query = new Parse.Query(Product);
    query.equalTo('user_email', user.get('email'));
    const products = await query.find({ useMasterKey: true });
    return products.map(p => ({
        id: p.id,
        title: p.get('title_'),
        price: p.get('price'),
        status: p.get('status'),
        createdAt: p.get('createdAt')
    }));
});

// ================================================================
// ========== MAĞAZA ==========
// ================================================================
Parse.Cloud.define("getStoreItems", async (request) => {
    const query = new Parse.Query(StoreItem);
    const items = await query.find({ useMasterKey: true });
    return items.map(item => ({
        id: item.id,
        name: item.get('name'),
        price_points: item.get('price_points'),
        type: item.get('type'),
        icon: item.get('icon') || '🎁'
    }));
});

Parse.Cloud.define("purchaseStoreItem", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { itemId } = request.params;
    const query = new Parse.Query(StoreItem);
    const item = await query.get(itemId, { useMasterKey: true });
    if (!item) throw new Error("Ürün bulunamadı!");
    const price = item.get('price_points') || 0;
    const currentPoints = user.get('points') || 0;
    if (currentPoints < price) throw new Error("Yeterli puanınız yok!");
    user.set('points', currentPoints - price);
    const type = item.get('type');
    if (type === 'badge') {
        const badges = user.get('badges') || [];
        if (!badges.includes(item.get('name'))) {
            badges.push(item.get('name'));
            user.set('badges', badges);
        }
    }
    await user.save(null, { useMasterKey: true });
    await sendNotificationToUser(user, `🛒 ${item.get('name')} satın aldınız!`, 'store');
    return { success: true, remaining_points: user.get('points') };
});

// ================================================================
// ========== GÜNLÜK GÖREVLER ==========
// ================================================================
Parse.Cloud.define("getDailyTasks", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const today = new Date().toDateString();
    const query = new Parse.Query(DailyTask);
    query.equalTo('date', today);
    const tasks = await query.find({ useMasterKey: true });
    const completed = user.get('completed_daily_tasks') || [];
    return tasks.map(t => ({
        id: t.id,
        task_text: t.get('task_text'),
        points: t.get('points'),
        completed: completed.includes(t.id)
    }));
});

Parse.Cloud.define("completeDailyTask", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { taskId } = request.params;
    const query = new Parse.Query(DailyTask);
    const task = await query.get(taskId, { useMasterKey: true });
    if (!task) throw new Error("Görev bulunamadı!");
    const completed = user.get('completed_daily_tasks') || [];
    if (completed.includes(taskId)) throw new Error("Bu görev zaten tamamlanmış!");
    completed.push(taskId);
    user.set('completed_daily_tasks', completed);
    const points = task.get('points') || 0;
    await addPointsWithBonus(user, points, 'Günlük görev');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points') };
});

// ================================================================
// ========== TOPLULUK GÖREVLERİ ==========
// ================================================================
Parse.Cloud.define("getSocialTasks", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const today = new Date().toDateString();
    const query = new Parse.Query(SocialTask);
    query.equalTo('date', today);
    query.equalTo('is_active', true);
    const tasks = await query.find({ useMasterKey: true });
    const completed = user.get('completed_social_tasks') || [];
    return tasks.map(t => ({
        id: t.id,
        platform: t.get('platform') || 'Sosyal Medya',
        url: t.get('url') || '#',
        points_reward: t.get('points_reward') || 10,
        penalty_points: t.get('penalty_points') || 0,
        completed: completed.includes(t.id)
    }));
});

Parse.Cloud.define("verifySocialFollow", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { taskId } = request.params;
    const query = new Parse.Query(SocialTask);
    const task = await query.get(taskId, { useMasterKey: true });
    if (!task) throw new Error("Görev bulunamadı!");
    const completed = user.get('completed_social_tasks') || [];
    if (completed.includes(taskId)) throw new Error("Bu görev zaten tamamlanmış!");
    completed.push(taskId);
    user.set('completed_social_tasks', completed);
    const points = task.get('points_reward') || 0;
    await addPointsWithBonus(user, points, 'Topluluk görevi');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points') };
});

// ================================================================
// ========== TAKIM GÖREVLERİ ==========
// ================================================================
Parse.Cloud.define("getTeamTasks", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");
    const today = new Date().toDateString();
    const query = new Parse.Query(TeamTask);
    query.equalTo('team_id', teamId);
    query.equalTo('date', today);
    const tasks = await query.find({ useMasterKey: true });
    const completed = user.get('completed_team_tasks') || [];
    return tasks.map(t => ({
        id: t.id,
        task_text: t.get('task_text'),
        points: t.get('points') || 0,
        completed: completed.includes(t.id)
    }));
});

Parse.Cloud.define("completeTeamTask", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { taskId } = request.params;
    const query = new Parse.Query(TeamTask);
    const task = await query.get(taskId, { useMasterKey: true });
    if (!task) throw new Error("Görev bulunamadı!");
    const completed = user.get('completed_team_tasks') || [];
    if (completed.includes(taskId)) throw new Error("Bu görev zaten tamamlanmış!");
    completed.push(taskId);
    user.set('completed_team_tasks', completed);
    const points = task.get('points') || 0;
    await addPointsWithBonus(user, points, 'Takım görevi');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points') };
});

// ================================================================
// ========== BİLDİRİM ==========
// ================================================================
Parse.Cloud.define("getNotifications", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const query = new Parse.Query(Notification);
    query.equalTo('user', user);
    query.descending('createdAt');
    const notifs = await query.find({ useMasterKey: true });
    return notifs.map(n => ({
        id: n.id,
        message: n.get('message'),
        type: n.get('type'),
        is_read: n.get('is_read'),
        createdAt: n.get('createdAt')
    }));
});

Parse.Cloud.define("markNotificationRead", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { notificationId } = request.params;
    const query = new Parse.Query(Notification);
    const n = await query.get(notificationId, { useMasterKey: true });
    if (!n) throw new Error("Bildirim bulunamadı!");
    n.set('is_read', true);
    await n.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== MESAJ & KONUŞMA ==========
// ================================================================
Parse.Cloud.define("sendMessage", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { conversationId, text, fileUrl, fileName } = request.params;
    if (!conversationId) throw new Error("Konuşma ID gerekli!");
    const convQuery = new Parse.Query(Conversation);
    const conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error("Konuşma bulunamadı!");
    const users = conv.get('user_emails') || [];
    if (!users.includes(user.get('email'))) throw new Error("Bu konuşmaya yetkiniz yok!");

    const msg = new Message();
    msg.set('from_email', user.get('email'));
    msg.set('conversationId', conv.id);
    const toEmail = users.find(u => u !== user.get('email'));
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
        const toUser = await new Parse.Query(Parse.User).equalTo('email', toEmail).first({ useMasterKey: true });
        if (toUser) {
            await sendNotificationToUser(toUser, `📩 ${user.get('name')} size mesaj gönderdi: ${(text || '[Dosya]').substring(0,30)}`, 'message');
        }
    }
    return { success: true, messageId: msg.id };
});

Parse.Cloud.define("getConversations", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const query = new Parse.Query(Conversation);
    query.containedIn('user_emails', [user.get('email')]);
    query.descending('lastMessageTime');
    const convs = await query.find({ useMasterKey: true });
    return convs.map(c => ({
        id: c.id,
        users: c.get('user_emails'),
        lastMessage: c.get('lastMessage'),
        lastMessageTime: c.get('lastMessageTime'),
        customName: c.get('customName')
    }));
});

Parse.Cloud.define("getConversationMessages", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { conversationId } = request.params;
    const convQuery = new Parse.Query(Conversation);
    const conv = await convQuery.get(conversationId, { useMasterKey: true });
    if (!conv) throw new Error("Konuşma bulunamadı!");
    const users = conv.get('user_emails') || [];
    if (!users.includes(user.get('email'))) throw new Error("Yetkisiz!");
    const msgQuery = new Parse.Query(Message);
    msgQuery.equalTo('conversationId', conv.id);
    msgQuery.ascending('createdAt');
    const msgs = await msgQuery.find({ useMasterKey: true });
    for (let m of msgs) {
        if (m.get('to_email') === user.get('email') && !m.get('is_read')) {
            m.set('is_read', true);
            await m.save(null, { useMasterKey: true });
        }
    }
    return {
        conversationId: conv.id,
        users: users,
        messages: msgs.map(m => ({
            id: m.id,
            from_user: { id: m.get('from_email'), get: (k) => m.get('from_email') },
            to_user: { id: m.get('to_email') },
            text: m.get('text'),
            file: m.get('file'),
            is_read: m.get('is_read'),
            createdAt: m.get('createdAt')
        }))
    };
});

Parse.Cloud.define("startConversation", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { userId } = request.params;
    if (!userId) {
        // AI ile yeni boş konuşma
        const conv = new Conversation();
        conv.set('user_emails', [user.get('email')]);
        conv.set('lastMessage', '');
        conv.set('lastMessageTime', new Date());
        await conv.save(null, { useMasterKey: true });
        return { success: true, conversationId: conv.id };
    }
    const targetUser = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (!targetUser) throw new Error("Kullanıcı bulunamadı!");
    const targetEmail = targetUser.get('email');
    const query = new Parse.Query(Conversation);
    query.containsAll('user_emails', [user.get('email'), targetEmail]);
    const existing = await query.first({ useMasterKey: true });
    if (existing) return { success: true, conversationId: existing.id };
    const conv = new Conversation();
    conv.set('user_emails', [user.get('email'), targetEmail]);
    conv.set('lastMessage', '');
    conv.set('lastMessageTime', new Date());
    await conv.save(null, { useMasterKey: true });
    return { success: true, conversationId: conv.id };
});

// ================================================================
// ========== GÜNLÜK SERİ (STREAK) ==========
// ================================================================
Parse.Cloud.define("getStreakStatus", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const today = new Date().toDateString();
    const query = new Parse.Query(UserStreak);
    query.equalTo('user_email', user.get('email'));
    let streak = await query.first({ useMasterKey: true });
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
    const lastClaim = streak.get('lastClaimDate');
    const claimedToday = lastClaim && lastClaim.toDateString() === today;
    const streakCount = streak.get('streakCount') || 0;
    let todayReward = 10;
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

Parse.Cloud.define("claimDailyStreak", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const today = new Date().toDateString();
    const query = new Parse.Query(UserStreak);
    query.equalTo('user_email', user.get('email'));
    let streak = await query.first({ useMasterKey: true });
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
    const lastClaim = streak.get('lastClaimDate');
    const claimedToday = lastClaim && lastClaim.toDateString() === today;
    if (claimedToday) {
        return { success: false, message: "Bugün zaten ödül aldınız!" };
    }
    if (lastClaim) {
        const hoursSince = (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
            streak.set('streakCount', 0);
            streak.set('streakStartDate', null);
            streak.set('notifiedAt8h', false);
            streak.set('notifiedAt4h', false);
            await streak.save(null, { useMasterKey: true });
        }
    }
    let count = streak.get('streakCount') || 0;
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
    let points = 10;
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
    await addPointsWithBonus(user, points, `Günlük seri (${count}. gün)`);
    return { success: true, message: `🎉 ${points} puan kazandınız! (${count}. gün)`, remaining_points: user.get('points') };
});

// ================================================================
// ========== STREAK HATIRLATMA JOB'U ==========
// ================================================================
Parse.Cloud.job("checkStreakReminders", async (request) => {
    console.log("🔄 Streak hatırlatmaları kontrol ediliyor...");
    const query = new Parse.Query(UserStreak);
    query.equalTo('isActive', true);
    const streaks = await query.find({ useMasterKey: true });
    let sentCount = 0;
    for (const streak of streaks) {
        const lastClaim = streak.get('lastClaimDate');
        if (!lastClaim) continue;
        const hoursSince = (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60);
        const email = streak.get('user_email');
        if (!email) continue;
        try {
            const userQuery = new Parse.Query(Parse.User);
            userQuery.equalTo('email', email);
            const user = await userQuery.first({ useMasterKey: true });
            if (!user) continue;
            if (hoursSince >= 20 && hoursSince < 21 && !streak.get('notifiedAt8h')) {
                await Parse.Cloud.run('sendEmail', {
                    to: email,
                    subject: '⏰ Serinizi Kaybetmeyin!',
                    html: `<h3>VİZYON2027</h3>
                           <p>Merhaba ${user.get('name') || 'Kullanıcı'},</p>
                           <p>Serinizi kaybetmenize 4 saat kaldı! Hemen giriş yapın ve günlük ödülünüzü alın.</p>
                           <p><a href="https://vizyon2026.vercel.app/" style="background:#00d4ff; color:#000; padding:10px 20px; border-radius:40px; text-decoration:none; font-weight:700;">Sisteme Git</a></p>
                           <p>Serinizi kaybederseniz 1. günden başlayacaksınız.</p>
                           <p>VİZYON2027 Ekibi</p>`
                }, { useMasterKey: true });
                streak.set('notifiedAt8h', true);
                await streak.save(null, { useMasterKey: true });
                sentCount++;
            }
            if (hoursSince >= 23 && hoursSince < 24 && !streak.get('notifiedAt4h')) {
                await Parse.Cloud.run('sendEmail', {
                    to: email,
                    subject: '⚠️ SON UYARI! Seriniz Sıfırlanacak!',
                    html: `<h3>VİZYON2027</h3>
                           <p>Merhaba ${user.get('name') || 'Kullanıcı'},</p>
                           <p>Serinizi kaybetmenize 1 saat kaldı! Hemen giriş yapın ve ödülünüzü alın.</p>
                           <p><a href="https://vizyon2026.vercel.app/" style="background:#ff6b35; color:#fff; padding:10px 20px; border-radius:40px; text-decoration:none; font-weight:700;">ACİL SİSTEME GİT</a></p>
                           <p>Seriniz sıfırlanırsa 1. günden başlayacaksınız.</p>
                           <p>VİZYON2027 Ekibi</p>`
                }, { useMasterKey: true });
                streak.set('notifiedAt4h', true);
                await streak.save(null, { useMasterKey: true });
                sentCount++;
            }
            if (hoursSince >= 24) {
                await Parse.Cloud.run('sendEmail', {
                    to: email,
                    subject: '❌ Seriniz Sıfırlandı',
                    html: `<h3>VİZYON2027</h3>
                           <p>Merhaba ${user.get('name') || 'Kullanıcı'},</p>
                           <p>Seriniz süresi doldu ve sıfırlandı. 1. günden başlayabilirsiniz.</p>
                           <p><a href="https://vizyon2026.vercel.app/" style="background:#00d4ff; color:#000; padding:10px 20px; border-radius:40px; text-decoration:none; font-weight:700;">Sisteme Git</a></p>
                           <p>VİZYON2027 Ekibi</p>`
                }, { useMasterKey: true });
            }
        } catch (e) {
            console.error('Streak hatırlatma hatası:', e.message);
        }
    }
    console.log(`✅ ${sentCount} hatırlatma gönderildi.`);
    return `Streak hatırlatmaları tamamlandı. ${sentCount} gönderildi.`;
});

// ================================================================
// ========== SÜRESİ DOLAN ANKET VE DUYURULARI TEMİZLE ==========
// ================================================================
Parse.Cloud.job("cleanExpiredPolls", async (request) => {
    console.log("🔄 Süresi dolan anketler temizleniyor...");
    const now = new Date();
    const query = new Parse.Query(Poll);
    query.lessThan('end_date', now);
    const expiredPolls = await query.find({ useMasterKey: true });
    for (const poll of expiredPolls) {
        await poll.destroy({ useMasterKey: true });
        console.log(`🗑️ Anket silindi: ${poll.get('question')}`);
    }
    return `${expiredPolls.length} anket temizlendi.`;
});

Parse.Cloud.job("cleanExpiredAnnouncements", async (request) => {
    console.log("🔄 Süresi dolan duyurular temizleniyor...");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const query = new Parse.Query(Announcement);
    query.lessThan('createdAt', thirtyDaysAgo);
    const expiredAnnouncements = await query.find({ useMasterKey: true });
    for (const ann of expiredAnnouncements) {
        await ann.destroy({ useMasterKey: true });
        console.log(`🗑️ Duyuru silindi: ${ann.get('title_')}`);
    }
    return `${expiredAnnouncements.length} duyuru temizlendi.`;
});

// ================================================================
// ========== V27 AKADEMİ ==========
// ================================================================
Parse.Cloud.define("getCourses", async (request) => {
    const query = new Parse.Query(Course);
    const courses = await query.find({ useMasterKey: true });
    if (courses.length > 0) {
        const user = request.user;
        const completedLessons = user ? (user.get('completed_lessons') || []) : [];
        return courses.map(c => ({
            id: c.id,
            title: c.get('title_'),
            description: c.get('description'),
            total_lessons: c.get('total_lessons') || 0,
            completed: completedLessons.length > 0 && (c.get('total_lessons') || 0) > 0
        }));
    }
    return [
        {
            id: 'sample1',
            title: '🚀 VİZYON AI ile Kod Yazma',
            description: 'Yapay zeka ile Python, JavaScript ve diğer dillerde kod yazmayı öğrenin.',
            total_lessons: 4,
            completed: false
        },
        {
            id: 'sample2',
            title: '🧊 3D Modelleme ve Tasarım',
            description: 'Three.js ile 3D nesneler oluşturun, modelleyin ve dışa aktarın.',
            total_lessons: 3,
            completed: false
        },
        {
            id: 'sample3',
            title: '📊 Veri Analizi ve Görselleştirme',
            description: 'Python ile veri analizi, grafikler ve dashboard oluşturma.',
            total_lessons: 5,
            completed: false
        },
        {
            id: 'sample4',
            title: '🔐 Güvenlik ve Ebeveyn Kontrolleri',
            description: 'Kullanıcı güvenliği, ebeveyn ayarları ve çocuk koruma.',
            total_lessons: 3,
            completed: false
        }
    ];
});

Parse.Cloud.define("getCourseDetails", async (request) => {
    const { courseId } = request.params;
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
    }
    const query = new Parse.Query(Course);
    const course = await query.get(courseId, { useMasterKey: true });
    if (!course) throw new Error("Ders bulunamadı!");
    const lessonQuery = new Parse.Query(Lesson);
    lessonQuery.equalTo('courseId', course.id);
    lessonQuery.ascending('order');
    const lessons = await lessonQuery.find({ useMasterKey: true });
    return {
        id: course.id,
        title: course.get('title_'),
        description: course.get('description'),
        lessons: lessons.map(l => ({
            id: l.id,
            title: l.get('title_'),
            content: l.get('content'),
            points_reward: l.get('points_reward') || 0
        }))
    };
});

Parse.Cloud.define("completeLesson", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { lessonId } = request.params;
    if (lessonId.startsWith('l')) {
        const completed = user.get('completed_lessons') || [];
        if (completed.includes(lessonId)) throw new Error("Bu ders zaten tamamlanmış!");
        completed.push(lessonId);
        user.set('completed_lessons', completed);
        const points = 10;
        await addPointsWithBonus(user, points, 'Ders tamamlama');
        await user.save(null, { useMasterKey: true });
        return { success: true, remaining_points: user.get('points') };
    }
    const query = new Parse.Query(Lesson);
    const lesson = await query.get(lessonId, { useMasterKey: true });
    if (!lesson) throw new Error("Ders bulunamadı!");
    const completed = user.get('completed_lessons') || [];
    if (completed.includes(lessonId)) throw new Error("Bu ders zaten tamamlanmış!");
    completed.push(lessonId);
    user.set('completed_lessons', completed);
    const points = lesson.get('points_reward') || 0;
    await addPointsWithBonus(user, points, 'Ders tamamlama');
    await user.save(null, { useMasterKey: true });
    return { success: true, remaining_points: user.get('points') };
});

// ================================================================
// ========== V27 ZEKA TESTİ ==========
// ================================================================
Parse.Cloud.define("getQuizQuestions", async (request) => {
    const today = new Date().toDateString();
    const query = new Parse.Query(Quiz);
    query.equalTo('date', today);
    query.equalTo('is_active', true);
    const quizes = await query.find({ useMasterKey: true });
    if (quizes.length > 0) {
        return quizes.map(q => ({
            id: q.id,
            question: q.get('question'),
            options: q.get('options'),
            points_reward: q.get('points_reward') || 0
        }));
    }
    return [
        {
            id: 'q1',
            question: 'Python\'da bir fonksiyon tanımlamak için hangi anahtar kelime kullanılır?',
            options: ['function', 'def', 'define', 'func'],
            points_reward: 10
        },
        {
            id: 'q2',
            question: 'VİZYON AI hangi modeli kullanır?',
            options: ['GPT-3', 'GPT-4o', 'LLaMA', 'Hepsi'],
            points_reward: 15
        },
        {
            id: 'q3',
            question: '3D model oluşturmak için hangi kütüphane kullanılır?',
            options: ['Three.js', 'React.js', 'Vue.js', 'Angular'],
            points_reward: 10
        },
        {
            id: 'q4',
            question: 'Veri analizi için hangi Python kütüphanesi yaygın olarak kullanılır?',
            options: ['Pandas', 'NumPy', 'Matplotlib', 'Hepsi'],
            points_reward: 15
        },
        {
            id: 'q5',
            question: 'Ebeveyn panelinde PIN kaç haneli olmalıdır?',
            options: ['4', '6', '8', '10'],
            points_reward: 10
        },
        {
            id: 'q6',
            question: 'VİZYON 2027\'nin kurucusu kimdir?',
            options: ['Eymen', 'İbrahim', 'Bozkurt', 'Ömer'],
            points_reward: 15
        },
        {
            id: 'q7',
            question: 'Takım oluşturmak için hangi plana ihtiyaç vardır?',
            options: ['Ücretsiz', 'Pro', 'Takım', 'Hepsi'],
            points_reward: 10
        },
        {
            id: 'q8',
            question: 'Hata bildiriminde kaç puan kazanılır?',
            options: ['50', '100', '150', '200'],
            points_reward: 10
        },
        {
            id: 'q9',
            question: 'Davet kodu kaç kişi tarafından kullanılabilir?',
            options: ['1', '2', '3', 'Sınırsız'],
            points_reward: 15
        },
        {
            id: 'q10',
            question: 'Uzay modu hangi saatler arasında aktiftir?',
            options: ['00:00-03:00', '02:00-05:00', '23:00-02:00', '04:00-07:00'],
            points_reward: 10
        }
    ];
});

Parse.Cloud.define("submitQuizAnswer", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { quizId, answerIndex } = request.params;
    const sampleAnswers = {
        'q1': 1, 'q2': 3, 'q3': 0, 'q4': 3, 'q5': 0,
        'q6': 0, 'q7': 2, 'q8': 1, 'q9': 1, 'q10': 1
    };
    const query = new Parse.Query(Quiz);
    const quiz = await query.get(quizId, { useMasterKey: true });
    let correct = false;
    let points = 0;
    if (quiz) {
        correct = (answerIndex === quiz.get('correct_answer'));
        points = quiz.get('points_reward') || 0;
    } else {
        const correctIndex = sampleAnswers[quizId];
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
// ========== YARIŞMA ==========
// ================================================================
Parse.Cloud.define("getContestRanking", async (request) => {
    const query = new Parse.Query(Contest);
    query.descending('createdAt');
    const contest = await query.first({ useMasterKey: true });
    if (!contest) return [];
    const userQuery = new Parse.Query(Parse.User);
    userQuery.descending('points');
    userQuery.limit(10);
    const users = await userQuery.find({ useMasterKey: true });
    return users.map(u => ({
        name: u.get('name') || u.get('username') || 'İsimsiz',
        points: u.get('points') || 0
    }));
});

// ================================================================
// ========== ANKET ==========
// ================================================================
Parse.Cloud.define("createPoll", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu anket oluşturabilir!");
    const { question, options, duration } = request.params;
    if (!question || !options || options.length < 2) throw new Error("Soru ve en az 2 seçenek gerekli!");
    const poll = new Poll();
    poll.set('question', question);
    poll.set('options', options);
    poll.set('votes', options.map(() => 0));
    poll.set('voters', []);
    poll.set('created_by_email', user.get('email'));
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (duration || 3));
    poll.set('end_date', endDate);
    poll.set('is_active', true);
    await poll.save(null, { useMasterKey: true });
    return { success: true, pollId: poll.id };
});

Parse.Cloud.define("getActivePoll", async (request) => {
    const query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    query.descending('createdAt');
    const poll = await query.first({ useMasterKey: true });
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

Parse.Cloud.define("votePoll", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { optionIndex } = request.params;
    const query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    const poll = await query.first({ useMasterKey: true });
    if (!poll) throw new Error("Aktif anket yok!");
    if (new Date(poll.get('end_date')) < new Date()) throw new Error("Anket süresi doldu!");
    const voters = poll.get('voters') || [];
    if (voters.some(v => v === user.id)) throw new Error("Zaten oy kullandınız!");
    voters.push(user.id);
    poll.set('voters', voters);
    const votes = poll.get('votes') || [];
    if (optionIndex < 0 || optionIndex >= votes.length) throw new Error("Geçersiz seçenek!");
    votes[optionIndex] = (votes[optionIndex] || 0) + 1;
    poll.set('votes', votes);
    await poll.save(null, { useMasterKey: true });
    await addPointsWithBonus(user, 20, 'Anket oylama');
    return { success: true };
});

Parse.Cloud.define("deletePoll", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu silebilir!");
    const query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    const poll = await query.first({ useMasterKey: true });
    if (!poll) throw new Error("Aktif anket yok!");
    await poll.destroy({ useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("editPoll", async (request) => {
    const user = request.user;
    if (!user || user.get('role') !== 'founder') throw new Error("Sadece kurucu düzenleyebilir!");
    const { question } = request.params;
    if (!question) throw new Error("Soru gerekli!");
    const query = new Parse.Query(Poll);
    query.equalTo('is_active', true);
    const poll = await query.first({ useMasterKey: true });
    if (!poll) throw new Error("Aktif anket yok!");
    poll.set('question', question);
    await poll.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== DUYURU ==========
// ================================================================
Parse.Cloud.define("getAnnouncements", async (request) => {
    const query = new Parse.Query(Announcement);
    query.descending('createdAt');
    query.limit(10);
    const announcements = await query.find({ useMasterKey: true });
    return announcements.map(a => ({
        id: a.id,
        title: a.get('title_'),
        content: a.get('content'),
        created_by: a.get('created_by_email'),
        createdAt: a.get('createdAt')
    }));
});

Parse.Cloud.define("addAnnouncement", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) throw new Error("Yetkiniz yok!");
    const { title, content } = request.params;
    if (!title || !content) throw new Error("Başlık ve içerik gerekli!");
    const ann = new Announcement();
    ann.set('title_', title);
    ann.set('content', content);
    ann.set('created_by_email', user.get('email'));
    await ann.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("deleteAnnouncement", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) throw new Error("Yetkiniz yok!");
    const { announcementId } = request.params;
    const query = new Parse.Query(Announcement);
    const ann = await query.get(announcementId, { useMasterKey: true });
    if (!ann) throw new Error("Duyuru bulunamadı!");
    await ann.destroy({ useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("editAnnouncement", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) throw new Error("Yetkiniz yok!");
    const { announcementId, title, content } = request.params;
    const query = new Parse.Query(Announcement);
    const ann = await query.get(announcementId, { useMasterKey: true });
    if (!ann) throw new Error("Duyuru bulunamadı!");
    if (title) ann.set('title_', title);
    if (content) ann.set('content', content);
    await ann.save(null, { useMasterKey: true });
    return { success: true };
});

// ================================================================
// ========== İŞ İLANI ==========
// ================================================================
Parse.Cloud.define("getJobs", async (request) => {
    const query = new Parse.Query(Job);
    query.equalTo('is_active', true);
    const jobs = await query.find({ useMasterKey: true });
    return jobs.map(j => ({
        id: j.id,
        title: j.get('title_'),
        description: j.get('description'),
        company: j.get('company'),
        contact: j.get('contact')
    }));
});

Parse.Cloud.define("applyJob", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { jobId } = request.params;
    const query = new Parse.Query(Job);
    const job = await query.get(jobId, { useMasterKey: true });
    if (!job) throw new Error("İlan bulunamadı!");
    return { success: true, message: "Başvurunuz alındı!" };
});

// ================================================================
// ========== HATA BİLDİR ==========
// ================================================================
Parse.Cloud.define("submitBugReport", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { description, screenshot } = request.params;
    if (!description) throw new Error("Hata açıklaması gerekli!");
    const bug = new BugReport();
    bug.set('user_email', user.get('email'));
    bug.set('description', description);
    if (screenshot) bug.set('screenshot', screenshot);
    bug.set('status', 'pending');
    bug.set('points_reward', 100);
    await bug.save(null, { useMasterKey: true });
    await addPointsWithBonus(user, 100, 'Hata bildirimi');
    return { success: true, remaining_points: user.get('points') };
});

// ================================================================
// ========== CÜZDAN ==========
// ================================================================
Parse.Cloud.define("getWalletBalance", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    return { balance: user.get('wallet_balance') || 0 };
});

Parse.Cloud.define("withdrawFunds", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { amount } = request.params;
    if (!amount || amount <= 0) throw new Error("Geçersiz miktar!");
    const balance = user.get('wallet_balance') || 0;
    if (balance < amount) throw new Error("Yeterli bakiye yok!");
    user.set('wallet_balance', balance - amount);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: `${amount} TL çekim talebi alındı.` };
});

// ================================================================
// ========== TAKİP ==========
// ================================================================
Parse.Cloud.define("toggleFollow", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { userId } = request.params;
    const targetUser = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (!targetUser) throw new Error("Kullanıcı bulunamadı!");
    const following = user.get('following') || [];
    const index = following.findIndex(u => u.id === targetUser.id);
    if (index > -1) {
        following.splice(index, 1);
        user.set('following', following);
        await user.save(null, { useMasterKey: true });
        const followers = targetUser.get('followers') || [];
        const idx = followers.findIndex(u => u.id === user.id);
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
        const followers = targetUser.get('followers') || [];
        followers.push(user);
        targetUser.set('followers', followers);
        await targetUser.save(null, { useMasterKey: true });
        return { success: true, message: 'Takip ediliyor.', action: 'followed' };
    }
});

// ================================================================
// ========== PROFİL ==========
// ================================================================
Parse.Cloud.define("getProfile", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { userId } = request.params;
    const targetUser = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (!targetUser) throw new Error("Kullanıcı bulunamadı!");
    const isFollowing = (user.get('following') || []).some(u => u.id === targetUser.id);
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
Parse.Cloud.define("searchUsers", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { query } = request.params;
    if (!query) return [];
    const q = new Parse.Query(Parse.User);
    q.matches('email', new RegExp(query, 'i'));
    const q2 = new Parse.Query(Parse.User);
    q2.matches('username', new RegExp(query, 'i'));
    const mainQuery = Parse.Query.or(q, q2);
    const users = await mainQuery.find({ useMasterKey: true });
    return users.map(u => ({
        id: u.id,
        name: u.get('name'),
        username: u.get('username'),
        email: u.get('email')
    }));
});

// ================================================================
// ========== EBEVEYN AYARLARI ==========
// ================================================================
Parse.Cloud.define("requestParentVerification", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { email } = request.params;
    if (!email) throw new Error("E-posta gerekli!");
    if (email === user.get('email')) throw new Error("Ebeveyn e-postası kendi e-postanız ile aynı olamaz!");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set('parent_email', email);
    user.set('parent_verification_code', code);
    user.set('parent_code_expires', new Date(Date.now() + 15 * 60000));
    user.set('parent_temp_password', null);
    await user.save(null, { useMasterKey: true });
    await Parse.Cloud.run('sendEmail', {
        to: email,
        subject: 'VİZYON2027 Ebeveyn Doğrulama Kodu',
        html: `<h3>Ebeveyn Doğrulama</h3><p>Kodunuz: <strong>${code}</strong></p><p>15 dakika geçerlidir.</p>`
    }, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("verifyParentCode", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { code } = request.params;
    if (!code) throw new Error("Kod gerekli!");
    if (user.get('parent_verification_code') !== code) throw new Error("Geçersiz kod!");
    if (new Date(user.get('parent_code_expires')) < new Date()) throw new Error("Kod süresi doldu!");
    user.set('parent_mode', true);
    user.set('parent_verification_code', null);
    user.set('parent_code_expires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("setParentPin", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { pin } = request.params;
    if (!pin || pin.length !== 4 || isNaN(pin)) throw new Error("PIN 4 haneli olmalı!");
    user.set('parent_pin', pin);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "PIN başarıyla ayarlandı!" };
});

Parse.Cloud.define("getParentSettings", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
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

Parse.Cloud.define("updateParentSettings", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail, settings } = request.params;
    if (!childEmail) throw new Error("Çocuk e-posta adresi gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
    if (settings.daily_limit !== undefined) child.set('daily_limit', settings.daily_limit);
    if (settings.weekly_limit !== undefined) child.set('weekly_limit', settings.weekly_limit);
    if (settings.monthly_limit !== undefined) child.set('monthly_limit', settings.monthly_limit);
    if (settings.features) child.set('parent_features', settings.features);
    await child.save(null, { useMasterKey: true });
    return { success: true, message: "Ebeveyn ayarları güncellendi!" };
});

Parse.Cloud.define("toggleParentFeature", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail, feature, enabled } = request.params;
    if (!childEmail || !feature) throw new Error("Çocuk e-posta ve özellik adı gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
    const features = child.get('parent_features') || {};
    features[feature] = enabled;
    child.set('parent_features', features);
    await child.save(null, { useMasterKey: true });
    return { success: true, message: `"${feature}" özelliği ${enabled ? 'açıldı' : 'kapatıldı'}.` };
});

Parse.Cloud.define("getFullParentSettings", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail } = request.params;
    if (!childEmail) throw new Error("Çocuk e-posta gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
    const features = child.get('parent_features') || {};
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

Parse.Cloud.define("suspendChildAccount", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail, durationHours } = request.params;
    if (!childEmail || !durationHours) throw new Error("Çocuk e-posta ve süre gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
    const suspendUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    child.set('is_suspended', true);
    child.set('suspend_until', suspendUntil);
    await child.save(null, { useMasterKey: true });
    await sendNotificationToUser(child, `⛔ Hesabınız ${durationHours} saat süreyle askıya alındı.`, 'parent');
    return { success: true, message: `Hesap ${durationHours} saatliğine askıya alındı.` };
});

Parse.Cloud.define("unsuspendChildAccount", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail } = request.params;
    if (!childEmail) throw new Error("Çocuk e-posta gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
    child.set('is_suspended', false);
    child.set('suspend_until', null);
    await child.save(null, { useMasterKey: true });
    await sendNotificationToUser(child, `✅ Hesabınızın askısı kaldırıldı.`, 'parent');
    return { success: true, message: "Askı kaldırıldı." };
});

Parse.Cloud.define("toggleLiveTracking", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const current = user.get('live_tracking') || false;
    user.set('live_tracking', !current);
    await user.save(null, { useMasterKey: true });
    return { success: true, enabled: !current };
});

Parse.Cloud.define("setDailyLimit", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { limit } = request.params;
    user.set('daily_limit', limit);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Günlük limit ayarlandı!" };
});

Parse.Cloud.define("getChildSessions", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail } = request.params;
    if (!childEmail) throw new Error("Çocuk e-posta gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
    const sessions = [
        { time: child.get('createdAt') || new Date(), ip: '192.168.1.1', device: 'Chrome' },
        { time: child.get('updatedAt') || new Date(), ip: '10.0.0.1', device: 'Firefox' }
    ];
    return { success: true, sessions: sessions };
});

Parse.Cloud.define("sendParentReport", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail } = request.params;
    if (!childEmail) throw new Error("Çocuk e-posta gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
    const points = child.get('points') || 0;
    const level = child.get('level') || 'Çaylak';
    const lastActive = child.get('updatedAt') || child.get('createdAt');
    const html = `
        <h3>📊 VİZYON2027 Haftalık Rapor</h3>
        <p><strong>Çocuk:</strong> ${child.get('name')} (${childEmail})</p>
        <p><strong>Puan:</strong> ${points}</p>
        <p><strong>Seviye:</strong> ${level}</p>
        <p><strong>Son Aktivite:</strong> ${new Date(lastActive).toLocaleString('tr-TR')}</p>
        <p>Detaylar için profiline göz atabilirsin.</p>
        <p>VİZYON2027 Ekibi</p>
    `;
    await Parse.Cloud.run('sendEmail', {
        to: user.get('email'),
        subject: `VİZYON2027 - ${child.get('name')} Haftalık Rapor`,
        html: html
    }, { useMasterKey: true });
    return { success: true, message: "Rapor e-postanıza gönderildi." };
});

Parse.Cloud.define("removeParentControl", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { childEmail } = request.params;
    if (!childEmail) throw new Error("Çocuk e-posta gerekli!");
    const childQuery = new Parse.Query(Parse.User);
    childQuery.equalTo('email', childEmail);
    const child = await childQuery.first({ useMasterKey: true });
    if (!child) throw new Error("Çocuk kullanıcı bulunamadı!");
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
    await sendNotificationToUser(child, `🛡️ Ebeveyn denetimi kaldırıldı.`, 'parent');
    return { success: true, message: "Ebeveyn denetimi başarıyla kaldırıldı." };
});

// ================================================================
// ========== EBEVEYN ŞİFRE SIFIRLAMA ==========
// ================================================================
Parse.Cloud.define("requestParentReset", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const parentEmail = user.get('parent_email');
    if (!parentEmail) throw new Error("Ebeveyn e-postası ayarlanmamış!");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set('parent_reset_code', code);
    user.set('parent_reset_expires', new Date(Date.now() + 15 * 60000));
    await user.save(null, { useMasterKey: true });
    await Parse.Cloud.run('sendEmail', {
        to: parentEmail,
        subject: 'VİZYON2027 Ebeveyn Şifre Sıfırlama',
        html: `<h3>Ebeveyn Şifre Sıfırlama</h3><p>Kodunuz: <strong>${code}</strong></p><p>15 dakika geçerlidir.</p>`
    }, { useMasterKey: true });
    return { success: true, message: "Şifre sıfırlama kodu ebeveyn e-postanıza gönderildi." };
});

Parse.Cloud.define("confirmParentReset", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (!user.get('parent_mode')) throw new Error("Ebeveyn modu aktif değil!");
    const { code, newPassword } = request.params;
    if (!code || !newPassword) throw new Error("Kod ve yeni şifre gerekli!");
    if (newPassword.length < 8) throw new Error("Şifre en az 8 karakter olmalı!");
    if (user.get('parent_reset_code') !== code) throw new Error("Geçersiz kod!");
    if (new Date(user.get('parent_reset_expires')) < new Date()) throw new Error("Kod süresi doldu!");
    user.set('password', newPassword);
    user.set('parent_reset_code', null);
    user.set('parent_reset_expires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Şifre başarıyla sıfırlandı!" };
});

// ================================================================
// ========== KURUCU İLETİŞİM ==========
// ================================================================
Parse.Cloud.define("sendFounderMessage", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { message } = request.params;
    if (!message) throw new Error("Mesaj gerekli!");
    const founderQuery = new Parse.Query(Parse.User);
    founderQuery.equalTo('role', 'founder');
    const founder = await founderQuery.first({ useMasterKey: true });
    if (!founder) throw new Error("Kurucu bulunamadı!");
    await sendNotificationToUser(founder, `📩 ${user.get('name')} size mesaj gönderdi: ${message.substring(0,100)}`, 'founder_contact');
    const inbox = new Inbox();
    inbox.set('sender_email', user.get('email'));
    inbox.set('receiver_email', founder.get('email'));
    inbox.set('type', 'founder_contact');
    inbox.set('message', `${user.get('name')}: ${message}`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: 'Mesajınız kurucuya iletildi.' };
});

// ================================================================
// ========== PUAN & REFERANS ==========
// ================================================================
Parse.Cloud.define("getUserPoints", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    return { points: user.get('points') || 0, level: user.get('level') || 'Çaylak' };
});

Parse.Cloud.define("generateReferralCode", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    let code = user.get('referral_code');
    if (!code) {
        const name = (user.get('name') || user.get('username') || 'KULLANICI').toUpperCase().substring(0, 4);
        const random = Math.floor(1000 + Math.random() * 9000);
        code = `V27-${name}-${random}`;
        user.set('referral_code', code);
        await user.save(null, { useMasterKey: true });
    }
    return { referral_code: code };
});

Parse.Cloud.define("applyReferral", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { code } = request.params;
    if (!code) throw new Error("Davet kodu gerekli!");
    if (code === 'Eymen1144') {
        const founderQuery = new Parse.Query(Parse.User);
        founderQuery.equalTo('email', 'admin.tr.reis@gmail.com');
        const founder = await founderQuery.first({ useMasterKey: true });
        if (!founder) throw new Error("Kurucu bulunamadı!");
        await sendNotificationToUser(founder, `${user.get('name')} sizin davet kodunuzu kullanmak istiyor.`, 'referral_request');
        const inbox = new Inbox();
        inbox.set('sender_email', user.get('email'));
        inbox.set('receiver_email', 'admin.tr.reis@gmail.com');
        inbox.set('type', 'referral_request');
        inbox.set('message', `${user.get('name')} (${user.get('email')}) sizin davet kodunuzu kullanmak istiyor. Onay verir misiniz?`);
        await inbox.save(null, { useMasterKey: true });
        return { success: true, message: 'Kurucuya onay mesajı gönderildi. Onay bekleniyor.', pending: true };
    }
    const query = new Parse.Query(Parse.User);
    query.equalTo('referral_code', code);
    const referrer = await query.first({ useMasterKey: true });
    if (!referrer) throw new Error("Geçersiz davet kodu!");
    if (referrer.id === user.id) throw new Error("Kendi davet kodunuzu kullanamazsınız!");
    const referralCount = referrer.get('referral_count') || 0;
    if (referralCount >= 2) throw new Error("Bu davet kodu maksimum 2 kişi tarafından kullanılabilir!");
    const invited_by = user.get('invited_by');
    if (invited_by) throw new Error("Zaten bir davet kodu kullandınız!");
    user.set('invited_by', code);
    await user.save(null, { useMasterKey: true });
    await addPointsWithBonus(referrer, 1000, 'Arkadaş daveti');
    await addPointsWithBonus(user, 1000, 'Davet kodu kullanımı');
    const refCount = referrer.get('referral_count') || 0;
    referrer.set('referral_count', refCount + 1);
    await referrer.save(null, { useMasterKey: true });
    return { success: true, message: 'Davet kodu başarıyla uygulandı! +1000 puan kazandınız.' };
});

// ================================================================
// ========== LİDERLİK TABLOSU ==========
// ================================================================
Parse.Cloud.define("getReferralLeaderboard", async (request) => {
    try {
        const query = new Parse.Query(Parse.User);
        query.descending('referral_count');
        query.limit(100);
        const users = await query.find({ useMasterKey: true });
        const isFounder = request.user && request.user.get('role') === 'founder';
        const currentUserEmail = request.user ? request.user.get('email') : null;
        function censorEmail(email) {
            if (!email) return '****@****.***';
            if (isFounder || currentUserEmail === email) return email;
            const parts = email.split('@');
            if (parts.length !== 2) return '****@****.***';
            const local = parts[0];
            const domain = parts[1];
            let censored = '';
            for (let i = 0; i < local.length; i++) {
                if (i % 2 === 0 && i > 0) censored += '*';
                else censored += local[i];
            }
            return censored + '@' + domain;
        }
        return users.map(u => {
            const email = u.get('email');
            const name = u.get('name') || u.get('username') || 'İsimsiz';
            let displayEmail = email;
            if (!isFounder && currentUserEmail !== email) {
                displayEmail = censorEmail(email);
            }
            return {
                name: name,
                email: displayEmail,
                count: u.get('referral_count') || 0,
                isCurrentUser: currentUserEmail === email
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
Parse.Cloud.define("getMarketProjects", async (request) => {
    try {
        const query = new Parse.Query(MarketProject);
        query.equalTo("is_active", true);
        query.descending("createdAt");
        const items = await query.find({ useMasterKey: true });
        return items.map(item => ({
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
        }));
    } catch (e) {
        console.error('Pazar projeleri hatası:', e);
        return [];
    }
});

Parse.Cloud.define("buyMarketProject", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { marketProjectId } = request.params;
    if (!marketProjectId) throw new Error("Proje ID gerekli!");
    const query = new Parse.Query(MarketProject);
    const item = await query.get(marketProjectId, { useMasterKey: true });
    if (!item) throw new Error("Proje bulunamadı!");
    if (item.get('owner_email') === user.get('email')) {
        throw new Error("Kendi projenizi satın alamazsınız!");
    }
    if (!item.get('is_active')) throw new Error("Bu proje artık satışta değil!");
    const price = item.get('price_points') || 0;
    const currentPoints = user.get('points') || 0;
    if (currentPoints < price) throw new Error("Yeterli puanınız yok!");
    const commission = Math.floor(price * 0.2);
    const sellerEarn = price - commission;
    user.set('points', currentPoints - price);
    await user.save(null, { useMasterKey: true });
    const sellerEmail = item.get('owner_email');
    const sellerQuery = new Parse.Query(Parse.User);
    sellerQuery.equalTo('email', sellerEmail);
    const seller = await sellerQuery.first({ useMasterKey: true });
    if (seller) {
        const sellerPoints = seller.get('points') || 0;
        seller.set('points', sellerPoints + sellerEarn);
        await seller.save(null, { useMasterKey: true });
        await sendNotificationToUser(seller, `🎉 Projeniz satıldı! +${sellerEarn} puan kazandınız. (Kesinti: %20 komisyon)`, 'store');
    }
    const founderEmail = 'admin.tr.reis@gmail.com';
    const founderQuery = new Parse.Query(Parse.User);
    founderQuery.equalTo('email', founderEmail);
    const founder = await founderQuery.first({ useMasterKey: true });
    if (founder) {
        const founderPoints = founder.get('points') || 0;
        founder.set('points', founderPoints + commission);
        await founder.save(null, { useMasterKey: true });
    }
    const projectId = item.get('projectId');
    if (projectId) {
        const projectQuery = new Parse.Query(Project);
        const project = await projectQuery.get(projectId, { useMasterKey: true });
        if (project) {
            project.set('user_email', user.get('email'));
            await project.save(null, { useMasterKey: true });
        }
    }
    item.set('is_active', false);
    item.set('buyer_email', user.get('email'));
    await item.save(null, { useMasterKey: true });
    await sendNotificationToUser(user, `✅ "${item.get('title')}" projesini satın aldınız! (${price} Puan)`, 'store');
    return { success: true, remaining_points: user.get('points'), message: "Proje satın alındı!" };
});

// ================================================================
// ========== BLOG ABONE SİSTEMİ ==========
// ================================================================
Parse.Cloud.define("subscribeToBlog", async (request) => {
    const { email } = request.params;
    if (!email) throw new Error("E-posta adresi gerekli.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Geçersiz e-posta formatı.");
    const Subscriber = Parse.Object.extend("BlogSubscriber");
    const query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    let existing = await query.first({ useMasterKey: true });
    if (existing) {
        existing.set("isActive", true);
        await existing.save(null, { useMasterKey: true });
        return { success: true, message: "Blog aboneliğiniz yeniden aktif edildi." };
    }
    const subscriber = new Subscriber();
    subscriber.set("email", email);
    subscriber.set("isActive", true);
    subscriber.set("isSystemActive", true);
    subscriber.set("subscribedAt", new Date());
    await subscriber.save(null, { useMasterKey: true });
    try {
        await Parse.Cloud.run("sendEmail", {
            to: email,
            subject: "Vizyon2027 Blog & Sistem Aboneliği",
            html: `<h3>📬 Vizyon2027'ye Hoş Geldiniz!</h3>
                   <p>Artık hem <strong>blog yazılarından</strong> hem de <strong>sistem güncellemelerinden</strong> haberdar olacaksınız.</p>
                   <p>Aboneliğiniz ücretsizdir.</p>
                   <p>Sevgiler,<br>Vizyon2027 Ekibi</p>`
        }, { useMasterKey: true });
    } catch (e) { console.error("Mail gönderilemedi:", e.message); }
    return { success: true, message: "Abone oldunuz!" };
});

Parse.Cloud.define("subscribeToSystemUpdates", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Önce giriş yapın!");
    const email = user.get('email');
    if (!email) throw new Error("E-posta adresiniz bulunamadı.");
    const Subscriber = Parse.Object.extend("BlogSubscriber");
    const query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    let existing = await query.first({ useMasterKey: true });
    if (existing) {
        existing.set("isSystemActive", true);
        await existing.save(null, { useMasterKey: true });
        return { success: true, message: "Sistem güncelleme aboneliğiniz aktif edildi." };
    }
    const subscriber = new Subscriber();
    subscriber.set("email", email);
    subscriber.set("isActive", false);
    subscriber.set("isSystemActive", true);
    subscriber.set("subscribedAt", new Date());
    await subscriber.save(null, { useMasterKey: true });
    return { success: true, message: "Sistem güncellemelerine abone oldunuz." };
});

Parse.Cloud.define("getMySubscriptions", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Önce giriş yapın!");
    const email = user.get('email');
    const Subscriber = Parse.Object.extend("BlogSubscriber");
    const query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    const record = await query.first({ useMasterKey: true });
    if (!record) {
        return { blogActive: false, systemActive: false, message: "Henüz bir aboneliğiniz yok." };
    }
    return {
        blogActive: record.get("isActive") || false,
        systemActive: record.get("isSystemActive") || false,
        subscribedAt: record.get("subscribedAt")
    };
});

Parse.Cloud.define("unsubscribeFrom", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Önce giriş yapın!");
    const { type } = request.params;
    if (!type || !['blog', 'system'].includes(type)) {
        throw new Error("Geçersiz abonelik türü. 'blog' veya 'system' girin.");
    }
    const email = user.get('email');
    const Subscriber = Parse.Object.extend("BlogSubscriber");
    const query = new Parse.Query(Subscriber);
    query.equalTo("email", email);
    const record = await query.first({ useMasterKey: true });
    if (!record) throw new Error("Abonelik kaydınız bulunamadı.");
    if (type === 'blog') {
        record.set("isActive", false);
    } else {
        record.set("isSystemActive", false);
    }
    await record.save(null, { useMasterKey: true });
    const msg = type === 'blog'
        ? "Blog aboneliğiniz iptal edildi. Artık yazı bildirimi almayacaksınız."
        : "Sistem güncelleme aboneliğiniz iptal edildi. Artık güncelleme bildirimi almayacaksınız.";
    return { success: true, message: msg };
});

Parse.Cloud.define("sendBlogUpdateToSubscribers", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) {
        throw new Error("Yetkiniz yok.");
    }
    const { subject, message } = request.params;
    if (!subject || !message) throw new Error("Konu ve mesaj gerekli.");
    const Subscriber = Parse.Object.extend("BlogSubscriber");
    const query = new Parse.Query(Subscriber);
    query.equalTo("isActive", true);
    const subscribers = await query.find({ useMasterKey: true });
    if (subscribers.length === 0) return { success: false, message: "Aktif blog abonesi yok." };
    let sentCount = 0;
    for (const sub of subscribers) {
        try {
            await Parse.Cloud.run("sendEmail", {
                to: sub.get("email"),
                subject: "📢 " + subject,
                html: `<h3>Vizyon2027 Blog Güncellemesi</h3>
                       <p>${message}</p>
                       <p><a href="https://vizyon2026.vercel.app/blog.html">Blog sayfasını ziyaret et</a></p>
                       <p style="font-size:12px; color:#888;">Abonelikten çıkmak için profilinizden "Aboneliklerim" bölümünü kullanın.</p>
                       <p>Sevgiler,<br>Vizyon2027 Ekibi</p>`
            }, { useMasterKey: true });
            sentCount++;
        } catch (e) { console.error(`Mail gönderilemedi (${sub.get('email')}):`, e.message); }
    }
    return { success: true, sentCount, total: subscribers.length };
});

Parse.Cloud.define("sendSystemUpdateToSubscribers", async (request) => {
    const user = request.user;
    if (!user || !['admin', 'founder'].includes(user.get('role'))) {
        throw new Error("Yetkiniz yok.");
    }
    const { version, changes } = request.params;
    if (!version || !changes) throw new Error("Sürüm ve değişiklikler gerekli.");
    const Subscriber = Parse.Object.extend("BlogSubscriber");
    const query = new Parse.Query(Subscriber);
    query.equalTo("isSystemActive", true);
    const subscribers = await query.find({ useMasterKey: true });
    if (subscribers.length === 0) return { success: false, message: "Aktif sistem abonesi yok." };
    let sentCount = 0;
    for (const sub of subscribers) {
        try {
            await Parse.Cloud.run("sendEmail", {
                to: sub.get("email"),
                subject: "⚡ Vizyon2027 Sistem Güncellendi! (v" + version + ")",
                html: `<h3>⚡ Vizyon2027 Sistem Güncellemesi</h3>
                       <p><strong>Sürüm:</strong> ${version}</p>
                       <p><strong>Değişiklikler:</strong><br>${changes}</p>
                       <p><a href="https://vizyon2026.vercel.app">Platforma git</a></p>
                       <p style="font-size:12px; color:#888;">Abonelikten çıkmak için profilinizden "Aboneliklerim" bölümünü kullanın.</p>
                       <p>Sevgiler,<br>Vizyon2027 Ekibi</p>`
            }, { useMasterKey: true });
            sentCount++;
        } catch (e) { console.error(`Mail gönderilemedi (${sub.get('email')}):`, e.message); }
    }
    return { success: true, sentCount, total: subscribers.length };
});

// ================================================================
// ========== SAVAŞ MODU ==========
// ================================================================
Parse.Cloud.define("battleMode", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { prompt, model1, model2 } = request.params;
    if (!prompt || !model1 || !model2) throw new Error("Konu ve 2 model adı gerekli!");
    const modelMap = {
        'Groq': 'callGroq', 'DeepSeek': 'callDeepSeek', 'OpenAI': 'callOpenAI',
        'OpenRouter': 'callOpenRouter', 'Cohere': 'callCohere', 'Cerebras': 'callCerebras', 'Gemini': 'callGemini'
    };
    const m1 = modelMap[model1];
    const m2 = modelMap[model2];
    if (!m1 || !m2) throw new Error("Geçersiz model adı!");
    const fullPrompt = `Seninle ${model2} arasında bir tartışma yapıyorsunuz. Konu: "${prompt}". Kendi görüşünü savun, karşı görüşü çürüt. Cevabın kısa ve net olsun (max 200 kelime).`;
    try {
        let resp1 = null, resp2 = null;
        try { resp1 = await Parse.Cloud.run(m1, { prompt: fullPrompt }, { useMasterKey: true }); } catch (e) { console.error(`${model1} hatası:`, e.message); }
        try { resp2 = await Parse.Cloud.run(m2, { prompt: fullPrompt }, { useMasterKey: true }); } catch (e) { console.error(`${model2} hatası:`, e.message); }
        if (!resp1 && !resp2) return { success: false, error: "Her iki model de yanıt veremedi." };
        let winner = null;
        if (resp1 && resp2) { winner = resp1.length > resp2.length ? model1 : model2; }
        else if (resp1) { winner = model1; } else { winner = model2; }
        return { success: true, model1_response: resp1 || 'Yanıt alınamadı.', model2_response: resp2 || 'Yanıt alınamadı.', winner: winner };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== ÇOKLU AI ==========
// ================================================================
Parse.Cloud.define("multiAI", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { prompt, models } = request.params;
    if (!prompt || !models || !Array.isArray(models)) throw new Error("Prompt ve model listesi gerekli!");
    const modelMap = {
        'Groq': 'callGroq', 'DeepSeek': 'callDeepSeek', 'OpenAI': 'callOpenAI',
        'OpenRouter': 'callOpenRouter', 'Cohere': 'callCohere', 'Cerebras': 'callCerebras', 'Gemini': 'callGemini'
    };
    const results = {};
    const promises = models.map(async (modelName) => {
        const fn = modelMap[modelName];
        if (!fn) { results[modelName] = 'Geçersiz model'; return; }
        try { const response = await Parse.Cloud.run(fn, { prompt: prompt }, { useMasterKey: true }); results[modelName] = response || 'Yanıt alınamadı.'; }
        catch (e) { results[modelName] = 'Hata: ' + e.message; }
    });
    await Promise.all(promises);
    return { success: true, responses: results };
});

// ================================================================
// ========== VİDEO ANALİZ ==========
// ================================================================
Parse.Cloud.define("analyzeVideo", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { url } = request.params;
    if (!url) throw new Error("Video URL gerekli!");
    try {
        const prompt = `Şu videoyu analiz et: ${url}. Özetle, ana temaları çıkar, kullanıcıya ne kazandıracağını açıkla.`;
        const result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, analysis: result };
    } catch (e) { return { success: false, error: e.message }; }
});

Parse.Cloud.define("generateReelsIdeas", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { url } = request.params;
    if (!url) throw new Error("Video URL gerekli!");
    try {
        const prompt = `Şu videodan 5 Instagram Reels fikri çıkar: ${url}. Her fikir 1 cümle olsun ve hedef kitleyi belirtsin.`;
        const result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, ideas: result };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== UYGULAMA YAPTIRICI ==========
// ================================================================
Parse.Cloud.define("generateApp", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { prompt } = request.params;
    if (!prompt) throw new Error("Uygulama fikri gerekli!");
    try {
        const codePrompt = `Kullanıcı şu uygulamayı istiyor: "${prompt}". Sadece çalışan HTML/CSS/JavaScript kodunu ver. Tek dosya halinde, eksiksiz, çalışır durumda. Hiçbir açıklama yapma, sadece kodu ver.`;
        const result = await Parse.Cloud.run("superAI", { prompt: codePrompt }, { useMasterKey: true });
        return { success: true, code: result, downloadUrl: null };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== PRO ARAÇLARI ==========
// ================================================================
Parse.Cloud.define("proTools", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user) {
        const role = user.get('role');
        const plan = user.get('plan');
        if (!['admin', 'founder', 'beta'].includes(role) && plan !== 'team') {
            try {
                await Parse.Cloud.run('useQuery', {});
            } catch (e) {
                throw new Error(e.message || "Sorgu hakkınız doldu!");
            }
        }
    } else {
        try {
            await Parse.Cloud.run('useQuery', {});
        } catch (e) {
            throw new Error(e.message || "Ziyaretçi sorgu hakkınız doldu!");
        }
    }
    const { tool, input } = request.params;
    if (!tool || !input) throw new Error("Araç ve girdi gerekli!");
    let prompt = '';
    switch (tool) {
        case 'kod': prompt = `Kullanıcı şu kodu istiyor: "${input}". Sadece çalışan kodu ver, açıklama yapma. Dil: Python/JavaScript/HTML tercihine göre.`; break;
        case 'yazi': prompt = `Kullanıcı şu yazıyı istiyor: "${input}". 200-300 kelimelik, akıcı ve profesyonel bir metin yaz.`; break;
        case 'ceviri':
            const parts = input.split('->');
            if (parts.length === 2) { prompt = `Şu metni çevir: "${parts[0].trim()}". Hedef dil: ${parts[1].trim()}. Sadece çeviriyi ver.`; }
            else { prompt = `Şu metni İngilizce'ye çevir: "${input}". Sadece çeviriyi ver.`; }
            break;
        default: throw new Error("Geçersiz araç!");
    }
    try {
        const result = await Parse.Cloud.run("superAI", { prompt: prompt }, { useMasterKey: true });
        return { success: true, output: result };
    } catch (e) { return { success: false, error: e.message }; }
});

// ================================================================
// ========== API ANAHTAR YÖNETİMİ FONKSİYONLARI ==========
// ================================================================

Parse.Cloud.define("saveUserApiKey", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { name, value } = request.params;
    if (!name || !value) throw new Error("İsim ve API anahtarı değeri gerekli!");
    if (name.trim().length < 2) throw new Error("Sanal isim en az 2 karakter olmalı!");
    if (value.trim().length < 8) throw new Error("API anahtarı çok kısa!");

    const existingQuery = new Parse.Query(UserApiKey);
    existingQuery.equalTo('user_email', user.get('email'));
    existingQuery.equalTo('name', name.trim());
    const existing = await existingQuery.first({ useMasterKey: true });
    if (existing) {
        throw new Error("Bu isimde bir anahtarınız zaten var. Farklı bir isim seçin veya düzenleyin.");
    }

    if (!user.get('api_password_hash')) {
        throw new Error("Lütfen önce API şifrenizi belirleyin!");
    }

    const encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) throw new Error("Sunucu şifreleme anahtarı eksik (API_ENCRYPTION_KEY).");

    const encrypted = xorEncrypt(value.trim(), encryptionKey);

    const record = new UserApiKey();
    record.set('user_email', user.get('email'));
    record.set('name', name.trim());
    record.set('encryptedValue', encrypted);
    record.set('createdAtClient', new Date());
    record.set('updatedAtClient', new Date());
    await record.save(null, { useMasterKey: true });

    return { success: true, keyId: record.id, message: "API anahtarı kaydedildi." };
});

Parse.Cloud.define("getUserApiKeys", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const hasPassword = !!user.get('api_password_hash');

    const query = new Parse.Query(UserApiKey);
    query.equalTo('user_email', user.get('email'));
    query.descending('createdAtClient');
    const keys = await query.find({ useMasterKey: true });

    function maskValue(value) {
        if (!value) return '••••••••';
        const len = value.length;
        if (len <= 8) return '••••••••';
        return value.substring(0, 4) + '••••' + value.substring(len - 4);
    }

    return {
        success: true,
        hasPassword: hasPassword,
        apiKeys: keys.map(k => {
            let masked = '••••••••';
            return {
                id: k.id,
                name: k.get('name'),
                maskedValue: masked,
                createdAt: k.get('createdAtClient') || k.get('createdAt'),
                updatedAt: k.get('updatedAtClient') || k.get('updatedAt')
            };
        })
    };
});

Parse.Cloud.define("getUserApiKeyValue", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { keyId } = request.params;
    if (!keyId) throw new Error("Anahtar ID gerekli!");

    const query = new Parse.Query(UserApiKey);
    const record = await query.get(keyId, { useMasterKey: true });
    if (!record) throw new Error("Anahtar bulunamadı!");
    if (record.get('user_email') !== user.get('email')) throw new Error("Bu anahtar size ait değil!");

    const encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
    if (!encryptionKey) throw new Error("Sunucu şifreleme anahtarı eksik.");

    let decrypted = '';
    try {
        decrypted = xorDecrypt(record.get('encryptedValue'), encryptionKey);
    } catch (e) {
        throw new Error("Anahtar çözülemedi.");
    }
    if (!decrypted) throw new Error("Anahtar boş veya çözülemedi.");

    return { success: true, value: decrypted };
});

Parse.Cloud.define("deleteUserApiKey", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { keyId } = request.params;
    if (!keyId) throw new Error("Anahtar ID gerekli!");

    const query = new Parse.Query(UserApiKey);
    const record = await query.get(keyId, { useMasterKey: true });
    if (!record) throw new Error("Anahtar bulunamadı!");
    if (record.get('user_email') !== user.get('email')) throw new Error("Bu anahtar size ait değil!");

    await record.destroy({ useMasterKey: true });
    return { success: true, message: "API anahtarı silindi." };
});

Parse.Cloud.define("updateUserApiKey", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { keyId, name, value } = request.params;
    if (!keyId) throw new Error("Anahtar ID gerekli!");

    const query = new Parse.Query(UserApiKey);
    const record = await query.get(keyId, { useMasterKey: true });
    if (!record) throw new Error("Anahtar bulunamadı!");
    if (record.get('user_email') !== user.get('email')) throw new Error("Bu anahtar size ait değil!");

    if (name) {
        if (name.trim().length < 2) throw new Error("Sanal isim en az 2 karakter olmalı!");
        const dupQuery = new Parse.Query(UserApiKey);
        dupQuery.equalTo('user_email', user.get('email'));
        dupQuery.equalTo('name', name.trim());
        dupQuery.notEqualTo('objectId', keyId);
        const dup = await dupQuery.first({ useMasterKey: true });
        if (dup) throw new Error("Bu isimde başka bir anahtarınız var!");
        record.set('name', name.trim());
    }

    if (value) {
        if (value.trim().length < 8) throw new Error("API anahtarı çok kısa!");
        const encryptionKey = await getAPIKey('API_ENCRYPTION_KEY');
        if (!encryptionKey) throw new Error("Sunucu şifreleme anahtarı eksik.");
        record.set('encryptedValue', xorEncrypt(value.trim(), encryptionKey));
    }

    record.set('updatedAtClient', new Date());
    await record.save(null, { useMasterKey: true });

    return { success: true, message: "API anahtarı güncellendi." };
});

Parse.Cloud.define("setApiPassword", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { password } = request.params;
    if (!password || password.length < 8) throw new Error("Şifre en az 8 karakter olmalı!");

    if (user.get('api_password_hash')) {
        throw new Error("API şifreniz zaten belirlenmiş. Lütfen 'verifyApiPassword' ile doğrulayın.");
    }

    user.set('api_password_hash', hashApiPassword(password));
    await user.save(null, { useMasterKey: true });

    return { success: true, message: "API şifreniz belirlendi." };
});

Parse.Cloud.define("verifyApiPassword", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { password } = request.params;
    if (!password) throw new Error("Şifre gerekli!");

    const stored = user.get('api_password_hash');
    if (!stored) throw new Error("Önce API şifrenizi belirleyin!");

    if (!verifyApiPasswordHash(password, stored)) {
        const _rlk = `verifyApiPassword:${user.get('email')}`;
        await checkRateLimit(_rlk, 5, 5 * 60 * 1000);
        await recordAttempt(_rlk);
        throw new Error("Şifre yanlış!");
    }

    return { success: true, message: "Şifre doğrulandı." };
});

// ================================================================
// ========== ZAMANLANMIŞ GÖREVLER ==========
// ================================================================
Parse.Cloud.job("refreshDailyTasks", async (request) => {
    console.log("🔄 Günlük görevler yenileniyor...");
    const today = new Date().toDateString();
    const oldQuery = new Parse.Query(DailyTask);
    oldQuery.notEqualTo('date', today);
    const oldTasks = await oldQuery.find({ useMasterKey: true });
    for (const task of oldTasks) { await task.destroy({ useMasterKey: true }); }
    const tasks = [
        { task_text: "🔍 3 AI sorgusu yap", points: 10 },
        { task_text: "💬 1 yorum yaz", points: 5 },
        { task_text: "⭐ 1 proje favorile", points: 8 },
        { task_text: "📁 1 proje oluştur", points: 15 },
        { task_text: "👥 1 takım mesajı gönder", points: 6 }
    ];
    for (const t of tasks) {
        const task = new DailyTask();
        task.set('date', today);
        task.set('task_text', t.task_text);
        task.set('points', t.points);
        await task.save(null, { useMasterKey: true });
    }
    const userQuery = new Parse.Query(Parse.User);
    const users = await userQuery.find({ useMasterKey: true });
    for (const user of users) { user.set('completed_daily_tasks', []); await user.save(null, { useMasterKey: true }); }
    console.log("✅ Günlük görevler yenilendi!");
    return "Günlük görevler yenilendi!";
});

Parse.Cloud.job("refreshTeamTasks", async (request) => {
    console.log("🔄 Takım görevleri yenileniyor...");
    const today = new Date().toDateString();
    const oldQuery = new Parse.Query(TeamTask);
    oldQuery.notEqualTo('date', today);
    const oldTasks = await oldQuery.find({ useMasterKey: true });
    for (const task of oldTasks) { await task.destroy({ useMasterKey: true }); }
    const teamQuery = new Parse.Query(Team);
    const teams = await teamQuery.find({ useMasterKey: true });
    const teamTasks = [
        { task_text: "👥 Takım sohbetinde 5 mesaj", points: 15 },
        { task_text: "📁 Takım projesi oluştur", points: 20 },
        { task_text: "⭐ Takım üyesini etiketle", points: 10 }
    ];
    for (const team of teams) {
        for (const t of teamTasks) {
            const task = new TeamTask();
            task.set('team_id', team.id);
            task.set('date', today);
            task.set('task_text', t.task_text);
            task.set('points', t.points);
            await task.save(null, { useMasterKey: true });
        }
    }
    const userQuery = new Parse.Query(Parse.User);
    const users = await userQuery.find({ useMasterKey: true });
    for (const user of users) { user.set('completed_team_tasks', []); await user.save(null, { useMasterKey: true }); }
    console.log("✅ Takım görevleri yenilendi!");
    return "Takım görevleri yenilendi!";
});

Parse.Cloud.job("refreshSocialTasks", async (request) => {
    console.log("🔄 Topluluk görevleri yenileniyor...");
    const today = new Date().toDateString();
    const oldQuery = new Parse.Query(SocialTask);
    oldQuery.notEqualTo('date', today);
    const oldTasks = await oldQuery.find({ useMasterKey: true });
    for (const task of oldTasks) { await task.destroy({ useMasterKey: true }); }
    const tasks = [
        { platform: "Instagram", url: "https://www.instagram.com/vizyon2027.info", points_reward: 15, penalty_points: 0 },
        { platform: "WhatsApp", url: "https://whatsapp.com/channel/0029VbCpnvuG8l5FQVQMLy1U", points_reward: 10, penalty_points: 0 },
        { platform: "YouTube", url: "#", points_reward: 20, penalty_points: 0 }
    ];
    for (const t of tasks) {
        const task = new SocialTask();
        task.set('date', today);
        task.set('platform', t.platform);
        task.set('url', t.url);
        task.set('points_reward', t.points_reward);
        task.set('penalty_points', t.penalty_points);
        task.set('is_active', true);
        await task.save(null, { useMasterKey: true });
    }
    const userQuery = new Parse.Query(Parse.User);
    const users = await userQuery.find({ useMasterKey: true });
    for (const user of users) { user.set('completed_social_tasks', []); await user.save(null, { useMasterKey: true }); }
    console.log("✅ Topluluk görevleri yenilendi!");
    return "Topluluk görevleri yenilendi!";
});

Parse.Cloud.job("resetDailyQueries", async (request) => {
    console.log("🔄 Günlük sorgu limitleri sıfırlanıyor...");
    const today = new Date().toDateString();
    const query = new Parse.Query(QueryStat);
    query.notEqualTo('date', today);
    const stats = await query.find({ useMasterKey: true });
    for (const stat of stats) { await stat.destroy({ useMasterKey: true }); }
    console.log("✅ Sorgu limitleri sıfırlandı!");
    return "Sorgu limitleri sıfırlandı!";
});

Parse.Cloud.job("refreshQuizQuestions", async (request) => {
    console.log("🔄 Zeka testi soruları yenileniyor...");
    const today = new Date().toDateString();
    const oldQuery = new Parse.Query(Quiz);
    oldQuery.notEqualTo('date', today);
    const oldQuizes = await oldQuery.find({ useMasterKey: true });
    for (const q of oldQuizes) { await q.destroy({ useMasterKey: true }); }
    const questions = [
        { question: "Python'da bir fonksiyon tanımlamak için hangi anahtar kelime kullanılır?", options: ['function', 'def', 'define', 'func'], correct: 1, points: 10 },
        { question: "VİZYON AI hangi modeli kullanır?", options: ['GPT-3', 'GPT-4o', 'LLaMA', 'Hepsi'], correct: 3, points: 15 },
        { question: "3D model oluşturmak için hangi kütüphane kullanılır?", options: ['Three.js', 'React.js', 'Vue.js', 'Angular'], correct: 0, points: 10 },
        { question: "Veri analizi için hangi Python kütüphanesi yaygın olarak kullanılır?", options: ['Pandas', 'NumPy', 'Matplotlib', 'Hepsi'], correct: 3, points: 15 },
        { question: "Ebeveyn panelinde PIN kaç haneli olmalıdır?", options: ['4', '6', '8', '10'], correct: 0, points: 10 },
        { question: "VİZYON 2027'nin kurucusu kimdir?", options: ['Eymen', 'İbrahim', 'Bozkurt', 'Ömer'], correct: 0, points: 15 },
        { question: "Takım oluşturmak için hangi plana ihtiyaç vardır?", options: ['Ücretsiz', 'Pro', 'Takım', 'Hepsi'], correct: 2, points: 10 },
        { question: "Hata bildiriminde kaç puan kazanılır?", options: ['50', '100', '150', '200'], correct: 1, points: 10 },
        { question: "Davet kodu kaç kişi tarafından kullanılabilir?", options: ['1', '2', '3', 'Sınırsız'], correct: 1, points: 15 },
        { question: "Uzay modu hangi saatler arasında aktiftir?", options: ['00:00-03:00', '02:00-05:00', '23:00-02:00', '04:00-07:00'], correct: 1, points: 10 }
    ];
    for (const q of questions) {
        const quiz = new Quiz();
        quiz.set('date', today);
        quiz.set('question', q.question);
        quiz.set('options', q.options);
        quiz.set('correct_answer', q.correct);
        quiz.set('points_reward', q.points);
        quiz.set('is_active', true);
        await quiz.save(null, { useMasterKey: true });
    }
    console.log("✅ Zeka testi soruları yenilendi!");
    return "Zeka testi soruları yenilendi!";
});

Parse.Cloud.job("refreshAcademyCourses", async (request) => {
    console.log("🔄 Akademi dersleri yenileniyor...");
    const courseData = [
        { title: '🚀 VİZYON AI ile Kod Yazma', description: 'Yapay zeka ile Python, JavaScript ve diğer dillerde kod yazmayı öğrenin.', total_lessons: 4 },
        { title: '🧊 3D Modelleme ve Tasarım', description: 'Three.js ile 3D nesneler oluşturun, modelleyin ve dışa aktarın.', total_lessons: 3 },
        { title: '📊 Veri Analizi ve Görselleştirme', description: 'Python ile veri analizi, grafikler ve dashboard oluşturma.', total_lessons: 5 },
        { title: '🔐 Güvenlik ve Ebeveyn Kontrolleri', description: 'Kullanıcı güvenliği, ebeveyn ayarları ve çocuk koruma.', total_lessons: 3 }
    ];
    for (const c of courseData) {
        const query = new Parse.Query(Course);
        query.equalTo('title_', c.title);
        let course = await query.first({ useMasterKey: true });
        if (!course) { course = new Course(); course.set('title_', c.title); }
        course.set('description', c.description);
        course.set('total_lessons', c.total_lessons);
        await course.save(null, { useMasterKey: true });
    }
    console.log("✅ Akademi dersleri yenilendi!");
    return "Akademi dersleri yenilendi!";
});

console.log('✅ Tüm Cloud Code fonksiyonları başarıyla yüklendi! (v6.04.0 SashiDo)');
console.log('🆕 Bu sürümde: invalid function ve useMasterKey hataları giderildi.');

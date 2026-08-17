// ================================================================
// VİZYON 2027 – FULL CLOUD CODE (HATASIZ, SADELEŞTİRİLMİŞ)
// ================================================================

// Yardımcı fonksiyon: API anahtarını al
async function getAPIKey(keyName) {
    if (process.env[keyName]) return process.env[keyName];
    try {
        const config = await Parse.Config.get({ useMasterKey: true });
        return config.get(keyName) || null;
    } catch (e) {
        return null;
    }
}

// Yardımcı fonksiyon: Yanıtı temizle
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

// ========== TEST ==========
Parse.Cloud.define("test", async (request) => {
    return {
        success: true,
        message: "Cloud Code çalışıyor!",
        user: request.user ? request.user.get('email') : 'Oturum yok',
        timestamp: new Date().toISOString()
    };
});

// ========== SORGU LİMİTİ ==========
Parse.Cloud.define("useQuery", async (request) => {
    const user = request.user;
    const today = new Date().toDateString();
    const QueryStat = Parse.Object.extend("QueryStat");
    const query = new Parse.Query(QueryStat);
    let limit = 25;
    let remaining;

    if (user) {
        query.equalTo("user", user);
        query.equalTo("date", today);
        let stats = await query.first({ useMasterKey: true });
        if (!stats) {
            stats = new QueryStat();
            stats.set("user", user);
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

// ========== YORUM SİSTEMİ ==========
Parse.Cloud.define("getComments", async () => {
    try {
        const query = new Parse.Query('Comment');
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
    const Comment = Parse.Object.extend('Comment');
    const newComment = new Comment();
    newComment.set('user_email', user.get('email'));
    newComment.set('user_name', user.get('name') || 'Kullanıcı');
    newComment.set('user_role', user.get('role') || 'user');
    newComment.set('comment', comment.trim());
    newComment.set('rating', Math.min(5, Math.max(0, rating)));
    await newComment.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("deleteComment", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { commentId } = request.params;
    const Comment = Parse.Object.extend('Comment');
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
    const Comment = Parse.Object.extend('Comment');
    const query = new Parse.Query(Comment);
    const comment = await query.get(commentId, { useMasterKey: true });
    if (!comment) throw new Error("Yorum bulunamadı!");
    if (comment.get('user_email') !== user.get('email') && !['admin', 'founder'].includes(user.get('role'))) {
        throw new Error("Yetkiniz yok!");
    }
    comment.set('comment', newText.trim());
    if (newRating !== undefined) comment.set('rating', Math.min(5, Math.max(0, newRating)));
    await comment.save(null, { useMasterKey: true });
    return { success: true };
});

// ========== WEB ARAMA ==========
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

// ========== SÜPER AI ==========
Parse.Cloud.define("superAI", async (request) => {
    const prompt = request.params.prompt;
    if (!prompt) return "Lütfen bir soru girin.";

    if (prompt.toLowerCase().includes('dolar') || prompt.toLowerCase().includes('haber') || prompt.toLowerCase().includes('arama')) {
        try {
            const result = await Parse.Cloud.run("webSearch", { query: prompt });
            if (result && !result.includes('tanımlanmamış')) return cleanResponse(result);
        } catch (e) {}
    }

    // 7 model dene, ilk başarılı olanı döndür
    const models = [
        'callGroq', 'callDeepSeek', 'callOpenAI',
        'callOpenRouter', 'callCohere', 'callCerebras', 'callGitHubModels'
    ];
    for (const model of models) {
        try {
            const result = await Parse.Cloud.run(model, { prompt });
            if (result && result.length > 10) return cleanResponse(result);
        } catch (e) {}
    }
    return "🧠 VİZYON AI: Üzgünüm, şu anda cevap veremiyorum.";
});

// ========== 7 API MODELİ (SADECE GROQ VE DEEPSEEK ÖRNEK) ==========
// Diğer modelleri (OpenAI, OpenRouter, Cohere, Cerebras, GitHub Models)
// aynı yapıda ekleyebilirsin. Şimdilik sadece Groq ve DeepSeek aktif.

Parse.Cloud.define("callGroq", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('GROQ_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) { return null; }
});

Parse.Cloud.define("callDeepSeek", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('DEEPSEEK_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) { return null; }
});

// ========== E-POSTA ==========
Parse.Cloud.define("sendEmail", async (request) => {
    const { to, subject, html } = request.params;
    const url = await getAPIKey('GOOGLE_SCRIPT_URL');
    if (!url) return { success: false, error: "GOOGLE_SCRIPT_URL eksik!" };
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });
        const data = await res.json();
        return data.success ? { success: true } : { success: false, error: data.error };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ========== ADMIN GİRİŞ ==========
Parse.Cloud.define("adminLogin", async (request) => {
    const { adminKey, password } = request.params;
    if (!adminKey || !password) throw new Error("Admin key ve şifre gerekli.");
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
        if (e.code === 101) {
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
            await newUser.signUp();
            await Parse.User.logIn(admin.email, password);
            return { success: true, name: admin.name, email: admin.email, role: 'admin' };
        } else throw e;
    }
});

// ========== BETA GİRİŞ (SADECE ÖMER BETA) ==========
Parse.Cloud.define("betaLogin", async (request) => {
    const { betaKey, password } = request.params;
    if (!betaKey || !password) throw new Error("Beta key ve şifre gerekli.");
    const betas = {
        omer: { email: 'o2059497@gmail.com', key: 'BETA_OMER_PASS', name: 'Ömer Beta' }
    };
    const beta = betas[betaKey];
    if (!beta) throw new Error("Geçersiz beta seçimi!");
    const correctPass = await getAPIKey(beta.key);
    if (!correctPass) throw new Error("Beta şifresi tanımlı değil!");
    try {
        await Parse.User.logIn(beta.email, password);
        return { success: true, name: beta.name, email: beta.email, role: 'beta' };
    } catch (e) {
        if (e.code === 101) {
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
            await newUser.signUp();
            await Parse.User.logIn(beta.email, password);
            return { success: true, name: beta.name, email: beta.email, role: 'beta' };
        } else throw e;
    }
});

// ========== FOUNDER GİRİŞ ==========
Parse.Cloud.define("founderLogin", async (request) => {
    const { password } = request.params;
    if (!password) throw new Error("Şifre gerekli.");
    const founderEmail = 'admin.tr.reis@gmail.com';
    const correctPass = await getAPIKey('FOUNDER_PASS');
    if (!correctPass) throw new Error("Founder şifresi tanımlı değil!");
    try {
        await Parse.User.logIn(founderEmail, password);
        return { success: true, name: 'Eymen', email: founderEmail, role: 'founder' };
    } catch (e) {
        if (e.code === 101) {
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
            await newUser.signUp();
            await Parse.User.logIn(founderEmail, password);
            return { success: true, name: 'Eymen', email: founderEmail, role: 'founder' };
        } else throw e;
    }
});

// ========== ŞİFRE SIFIRLAMA (ÖZET) ==========
Parse.Cloud.define("sendVerificationCode", async (request) => {
    const { email } = request.params;
    if (!email) throw new Error("E-posta adresi gerekli!");
    const query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    const user = await query.first({ useMasterKey: true });
    if (!user) throw new Error("Kullanıcı bulunamadı!");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set("resetCode", code);
    user.set("resetCodeExpires", new Date(Date.now() + 15 * 60000));
    await user.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("resetPasswordWithCode", async (request) => {
    const { email, code, newPassword } = request.params;
    if (!email || !code || !newPassword) throw new Error("Tüm alanlar gerekli!");
    if (newPassword.length < 8) throw new Error("Şifre en az 8 karakter olmalı!");
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
    return { success: true };
});

// ========== HEDİYE VE ROL TEKLİFLERİ (ÖZET) ==========
Parse.Cloud.define("sendGiftRequest", async (request) => {
    const sender = request.user;
    if (!sender || !['admin', 'founder'].includes(sender.get('role'))) throw new Error("Yetkiniz yok!");
    const { email, packageType } = request.params;
    if (!email || !packageType) throw new Error("E-posta ve paket türü gerekli!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    const receiver = await query.first({ useMasterKey: true });
    if (!receiver) throw new Error("Kullanıcı bulunamadı!");
    const requestId = Math.random().toString(36).substring(2, 15);
    const Inbox = Parse.Object.extend('Inbox');
    const inbox = new Inbox();
    inbox.set('sender_email', sender.get('email'));
    inbox.set('receiver_email', email);
    inbox.set('type', 'gift_request');
    inbox.set('package_type', packageType);
    inbox.set('request_id', requestId);
    inbox.set('status', 'pending');
    inbox.set('message', `🎁 ${sender.get('name')} size ${packageType === 'pro' ? '🌟 Pro Paket' : '👥 Takım Paketi'} hediye etmek istiyor.`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("handleRequest", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { requestId, action } = request.params;
    if (!requestId || !action) throw new Error("Request ID ve action gerekli!");
    if (!['accept', 'reject'].includes(action)) throw new Error("Geçersiz işlem!");
    const Inbox = Parse.Object.extend('Inbox');
    const query = new Parse.Query(Inbox);
    query.equalTo('request_id', requestId);
    query.equalTo('receiver_email', user.get('email'));
    const inboxMsg = await query.first({ useMasterKey: true });
    if (!inboxMsg) throw new Error("Teklif bulunamadı!");
    if (inboxMsg.get('status') !== 'pending') throw new Error("Bu teklif zaten işlenmiş!");
    if (action === 'reject') {
        inboxMsg.set('status', 'rejected');
        await inboxMsg.save(null, { useMasterKey: true });
        return { success: true };
    }
    const type = inboxMsg.get('type');
    if (type === 'gift_request') user.set('plan', inboxMsg.get('package_type'));
    else if (type === 'role_request') user.set('role', inboxMsg.get('role'));
    else throw new Error("Bilinmeyen teklif türü!");
    await user.save(null, { useMasterKey: true });
    inboxMsg.set('status', 'accepted');
    await inboxMsg.save(null, { useMasterKey: true });
    return { success: true };
});

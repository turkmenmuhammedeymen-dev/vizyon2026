// ================================================================
// VİZYON 2027 – FULL CLOUD CODE (HATASIZ, TÜM FONKSİYONLAR)
// ================================================================

async function getAPIKey(keyName) {
    if (process.env[keyName]) {
        console.log(`✅ Anahtar alındı (process.env): ${keyName}`);
        return process.env[keyName];
    }
    try {
        const config = await Parse.Config.get({ useMasterKey: true });
        const value = config.get(keyName);
        if (value !== undefined && value !== null) {
            console.log(`✅ Anahtar alındı (Parse.Config): ${keyName}`);
            return value;
        }
    } catch (e) {
        console.warn(`⚠️ Config hatası (${keyName}):`, e.message);
    }
    console.warn(`❌ Anahtar bulunamadı: ${keyName}`);
    return null;
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

        if (stats.get("count") >= limit) throw new Error("Günlük sorgu hakkınız doldu!");
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
        if (stats.get("count") >= 25) throw new Error("Ziyaretçi sorgu hakkınız (25) doldu!");
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
    } catch (error) {
        return { success: false, error: error.message };
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
    return { success: true, message: "Yorum gönderildi!" };
});

Parse.Cloud.define("deleteComment", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { commentId } = request.params;
    if (!commentId) throw new Error("Yorum ID gerekli!");
    const Comment = Parse.Object.extend('Comment');
    const query = new Parse.Query(Comment);
    const comment = await query.get(commentId, { useMasterKey: true });
    if (!comment) throw new Error("Yorum bulunamadı!");
    const commentUserEmail = comment.get('user_email');
    const currentUserEmail = user.get('email');
    const role = user.get('role');
    if (commentUserEmail !== currentUserEmail && role !== 'admin' && role !== 'founder') {
        throw new Error("Bu yorumu silme yetkiniz yok!");
    }
    await comment.destroy({ useMasterKey: true });
    return { success: true, message: "Yorum silindi!" };
});

Parse.Cloud.define("editComment", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { commentId, newText, newRating } = request.params;
    if (!commentId) throw new Error("Yorum ID gerekli!");
    if (!newText || newText.trim().length === 0) throw new Error("Yorum boş olamaz!");
    const Comment = Parse.Object.extend('Comment');
    const query = new Parse.Query(Comment);
    const comment = await query.get(commentId, { useMasterKey: true });
    if (!comment) throw new Error("Yorum bulunamadı!");
    const role = user.get('role');
    if (comment.get('user_email') !== user.get('email') && role !== 'admin' && role !== 'founder') {
        throw new Error("Bu yorumu düzenleme yetkiniz yok!");
    }
    comment.set('comment', newText.trim());
    if (newRating !== undefined) {
        comment.set('rating', Math.min(5, Math.max(0, newRating)));
    }
    await comment.save(null, { useMasterKey: true });
    return { success: true, message: "Yorum güncellendi!" };
});

// ========== WEB ARAMA ==========
Parse.Cloud.define("webSearch", async (request) => {
    const query = request.params.query;
    const key = await getAPIKey('SERPAPI_KEY');
    if (!key) return "🔍 SerpAPI anahtarı tanımlanmamış!";
    try {
        const url = "https://serpapi.com/search.json?q=" + encodeURIComponent(query) + "&hl=tr&gl=tr&api_key=" + key;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) return "⚠️ SerpAPI hatası: " + data.error;
        let result = '🌐 Arama Sonuçları:\n\n';
        if (data.answer_box) {
            result += '⚡ ' + (data.answer_box.answer || data.answer_box.snippet) + '\n\n';
        }
        if (data.organic_results && data.organic_results.length > 0) {
            for (let i = 0; i < 3 && i < data.organic_results.length; i++) {
                const r = data.organic_results[i];
                result += '• ' + r.title + '\n  ' + r.snippet + '\n\n';
            }
        } else {
            result += '🔍 "' + query + '" için sonuç bulunamadı.';
        }
        return result;
    } catch (e) {
        return "⚠️ Arama hatası: " + e.message;
    }
});

// ========== 7 API MODELİ ==========
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

Parse.Cloud.define("callOpenAI", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('OPENAI_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "gpt-4o", messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) { return null; }
});

Parse.Cloud.define("callOpenRouter", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('OPENROUTER_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct:free", messages: [{ role: 'user', content: prompt }] })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) { return null; }
});

Parse.Cloud.define("callCohere", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('COHERE_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.cohere.ai/v1/generate", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "command-r-plus", prompt: prompt, max_tokens: 1000, temperature: 0.7 })
        });
        const data = await res.json();
        return data.generations?.[0]?.text || null;
    } catch (e) { return null; }
});

Parse.Cloud.define("callCerebras", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('CEREBRAS_KEY');
    if (!key) return null;
    try {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "llama3.1-70b", messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) { return null; }
});

Parse.Cloud.define("callGitHubModels", async (request) => {
    const prompt = request.params.prompt;
    const key = await getAPIKey('GITHUB_TOKEN');
    if (!key) return null;
    try {
        const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "Meta-Llama-3-8B-Instruct", messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) { return null; }
});

// ========== SÜPER AI ==========
Parse.Cloud.define("superAI", async (request) => {
    const prompt = request.params.prompt;
    const lowerPrompt = prompt.toLowerCase().trim();

    if (lowerPrompt.includes('dolar') || lowerPrompt.includes('haber') || lowerPrompt.includes('arama') || lowerPrompt.includes('hava') || lowerPrompt.includes('altın')) {
        try {
            const result = await Parse.Cloud.run("webSearch", { query: prompt });
            if (result && result.indexOf('tanımlanmamış') === -1) {
                return cleanResponse(result);
            }
        } catch (e) { console.log('Web arama hatası:', e); }
    }

    const models = [
        { name: 'Groq', func: 'callGroq' },
        { name: 'DeepSeek', func: 'callDeepSeek' },
        { name: 'OpenRouter', func: 'callOpenRouter' },
        { name: 'OpenAI', func: 'callOpenAI' },
        { name: 'Cohere', func: 'callCohere' },
        { name: 'Cerebras', func: 'callCerebras' },
        { name: 'GitHub Models', func: 'callGitHubModels' }
    ];
    let lastError = null;
    for (const model of models) {
        try {
            const result = await Parse.Cloud.run(model.func, { prompt });
            if (result && result.length > 0 && result.indexOf('tanımlanmamış') === -1 && result.indexOf('hatası') === -1 && result.indexOf('alınamadı') === -1) {
                return cleanResponse(result);
            }
        } catch (e) {
            lastError = e.message;
        }
    }
    return "🧠 VİZYON AI: Üzgünüm, şu anda size cevap veremiyorum. Lütfen daha sonra tekrar deneyin veya destek ekibine ulaşın. (Hata: " + (lastError || 'Bilinmeyen hata') + ")";
});

// ========== DOĞRULAMA KODU ==========
Parse.Cloud.define("verifyUser", async (request) => {
    const { email, code } = request.params;
    if (!email || !code) return { success: false, error: "E-posta ve doğrulama kodu gerekli!" };
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    const user = await query.first({ useMasterKey: true });
    if (!user) return { success: false, error: "Kullanıcı bulunamadı!" };
    const storedCode = user.get('verificationCode');
    const expires = user.get('verificationCodeExpires');
    if (storedCode !== code) return { success: false, error: "Geçersiz doğrulama kodu!" };
    if (new Date(expires) < new Date()) return { success: false, error: "Doğrulama kodunun süresi doldu!" };
    user.set('isVerified', true);
    user.set('verificationCode', null);
    user.set('verificationCodeExpires', null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Hesap başarıyla doğrulandı!" };
});

// ========== ŞİFRE SIFIRLAMA ==========
Parse.Cloud.define("sendVerificationCode", async (request) => {
    const { email } = request.params;
    if (!email) throw new Error("E-posta adresi gerekli!");
    const query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    const user = await query.first({ useMasterKey: true });
    if (!user) throw new Error("Bu e-posta adresine kayıtlı kullanıcı bulunamadı!");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.set("resetCode", code);
    user.set("resetCodeExpires", new Date(Date.now() + 15 * 60000));
    await user.save(null, { useMasterKey: true });
    const html = `<h1>Şifre Sıfırlama Kodu</h1>
                  <p>Sayın ${user.get('name') || 'Kullanıcı'},</p>
                  <p>Şifre sıfırlama kodunuz: <strong style="font-size:24px;color:#00d4ff;">${code}</strong></p>
                  <p>Bu kod 15 dakika geçerlidir.</p><p>Vizyon 2027 Ekibi</p>`;
    const result = await Parse.Cloud.run("sendEmail", { to: email, subject: "Şifre Sıfırlama Kodu - Vizyon 2027", html });
    if (result.success) return { success: true, message: "Doğrulama kodu e-posta adresinize gönderildi." };
    else throw new Error("E-posta gönderilemedi: " + (result.error || "Bilinmeyen hata"));
});

Parse.Cloud.define("resetPasswordWithCode", async (request) => {
    const { email, code, newPassword } = request.params;
    if (!email || !code || !newPassword) throw new Error("Tüm alanlar gerekli!");
    if (newPassword.length < 8) throw new Error("Şifre en az 8 karakter olmalı!");
    const query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    const user = await query.first({ useMasterKey: true });
    if (!user) throw new Error("Kullanıcı bulunamadı!");
    const storedCode = user.get("resetCode");
    const expires = user.get("resetCodeExpires");
    if (storedCode !== code) throw new Error("Geçersiz doğrulama kodu!");
    if (new Date(expires) < new Date()) throw new Error("Doğrulama kodunun süresi doldu!");
    user.set("password", newPassword);
    user.set("resetCode", null);
    user.set("resetCodeExpires", null);
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Şifreniz başarıyla değiştirildi!" };
});

// ========== E-POSTA GÖNDERME ==========
Parse.Cloud.define("sendEmail", async (request) => {
    const { to, subject, html } = request.params;
    const url = await getAPIKey('GOOGLE_SCRIPT_URL');
    if (!url) return { success: false, error: "GOOGLE_SCRIPT_URL tanımlanmamış!" };
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });
        const result = await res.json();
        if (result.success) return { success: true, message: "Mail gönderildi!" };
        else throw new Error(result.error || "Bilinmeyen hata");
    } catch (e) {
        return { success: false, error: "Mail hatası: " + e.message };
    }
});

// ========== ADMIN GİRİŞ ==========
Parse.Cloud.define("adminLogin", async (request) => {
    const { adminKey, password } = request.params;
    if (!adminKey || !password) throw new Error("Admin key ve şifre gerekli.");
    await Parse.Cloud.run('initAdminUsers');
    const admins = {
        ibrahim: { email: 'iy5971828@gmail.com', key: 'ADMIN_IBRAHIM_PASS', name: 'İbrahim Admin' },
        bozkurt: { email: 'itaner686@gmail.com', key: 'ADMIN_BOZKURT_PASS', name: 'Bozkurt Admin' }
    };
    const admin = admins[adminKey];
    if (!admin) throw new Error("Geçersiz admin seçimi!");
    const correctPass = await getAPIKey(admin.key);
    if (!correctPass) throw new Error("Admin şifresi Config'de tanımlı değil! Anahtar: " + admin.key);
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

// ========== BETA GİRİŞ ==========
Parse.Cloud.define("betaLogin", async (request) => {
    const { betaKey, password } = request.params;
    if (!betaKey || !password) throw new Error("Beta key ve şifre gerekli.");
    await Parse.Cloud.run('initAdminUsers');
    const betas = {
        omer: { email: 'o2059497@gmail.com', key: 'BETA_OMER_PASS', name: 'Ömer Beta' },
        emir: { email: 'aaababa789@gmail.com', key: 'BETA_EMIR_PASS', name: 'Emir Beta' }
    };
    const beta = betas[betaKey];
    if (!beta) throw new Error("Geçersiz beta seçimi!");
    const correctPass = await getAPIKey(beta.key);
    if (!correctPass) throw new Error("Beta şifresi Config'de tanımlı değil! Anahtar: " + beta.key);
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
    await Parse.Cloud.run('initAdminUsers');
    const founderEmail = 'admin.tr.reis@gmail.com';
    const correctPass = await getAPIKey('FOUNDER_PASS');
    if (!correctPass) throw new Error("Founder şifresi Config'de tanımlı değil! Anahtar: FOUNDER_PASS");
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

// ========== ADMIN KULLANICILARI OLUŞTUR ==========
Parse.Cloud.define("initAdminUsers", async () => {
    try {
        const founderEmail = 'admin.tr.reis@gmail.com';
        let query = new Parse.Query(Parse.User);
        query.equalTo('username', founderEmail);
        let existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const founderPass = await getAPIKey('FOUNDER_PASS');
            if (!founderPass) throw new Error("FOUNDER_PASS Config'de tanımlı değil!");
            const admin0 = new Parse.User();
            admin0.set('username', founderEmail);
            admin0.set('email', founderEmail);
            admin0.set('password', founderPass);
            admin0.set('name', 'Eymen');
            admin0.set('role', 'founder');
            admin0.set('plan', 'team');
            admin0.set('isVerified', true);
            admin0.set('isBanned', false);
            await admin0.signUp(null, { useMasterKey: true });
        }

        const ibrahimEmail = 'iy5971828@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', ibrahimEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const ibrahimPass = await getAPIKey('ADMIN_IBRAHIM_PASS');
            if (!ibrahimPass) throw new Error("ADMIN_IBRAHIM_PASS Config'de tanımlı değil!");
            const admin1 = new Parse.User();
            admin1.set('username', ibrahimEmail);
            admin1.set('email', ibrahimEmail);
            admin1.set('password', ibrahimPass);
            admin1.set('name', 'İbrahim Admin');
            admin1.set('role', 'admin');
            admin1.set('plan', 'team');
            admin1.set('isVerified', true);
            admin1.set('isBanned', false);
            await admin1.signUp(null, { useMasterKey: true });
        }

        const bozkurtEmail = 'itaner686@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', bozkurtEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const bozkurtPass = await getAPIKey('ADMIN_BOZKURT_PASS');
            if (!bozkurtPass) throw new Error("ADMIN_BOZKURT_PASS Config'de tanımlı değil!");
            const admin2 = new Parse.User();
            admin2.set('username', bozkurtEmail);
            admin2.set('email', bozkurtEmail);
            admin2.set('password', bozkurtPass);
            admin2.set('name', 'Bozkurt Admin');
            admin2.set('role', 'admin');
            admin2.set('plan', 'team');
            admin2.set('isVerified', true);
            admin2.set('isBanned', false);
            await admin2.signUp(null, { useMasterKey: true });
        }

        const omerEmail = 'o2059497@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', omerEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const omerPass = await getAPIKey('BETA_OMER_PASS');
            if (!omerPass) throw new Error("BETA_OMER_PASS Config'de tanımlı değil!");
            const beta1 = new Parse.User();
            beta1.set('username', omerEmail);
            beta1.set('email', omerEmail);
            beta1.set('password', omerPass);
            beta1.set('name', 'Ömer Beta');
            beta1.set('role', 'beta');
            beta1.set('plan', 'free');
            beta1.set('isVerified', true);
            beta1.set('isBanned', false);
            await beta1.signUp(null, { useMasterKey: true });
        }

        const emirEmail = 'aaababa789@gmail.com';
        query = new Parse.Query(Parse.User);
        query.equalTo('username', emirEmail);
        existing = await query.first({ useMasterKey: true });
        if (!existing) {
            const emirPass = await getAPIKey('BETA_EMIR_PASS');
            if (!emirPass) throw new Error("BETA_EMIR_PASS Config'de tanımlı değil!");
            const beta2 = new Parse.User();
            beta2.set('username', emirEmail);
            beta2.set('email', emirEmail);
            beta2.set('password', emirPass);
            beta2.set('name', 'Emir Beta');
            beta2.set('role', 'beta');
            beta2.set('plan', 'free');
            beta2.set('isVerified', true);
            beta2.set('isBanned', false);
            await beta2.signUp(null, { useMasterKey: true });
        }

        return { success: true };
    } catch (e) {
        console.error('initAdminUsers hatası:', e);
        return { success: false, error: e.message };
    }
});

// ========== HEDİYE VE ROL TEKLİFLERİ ==========
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
    const Inbox = Parse.Object.extend('Inbox');
    const inbox = new Inbox();
    inbox.set('sender_email', sender.get('email'));
    inbox.set('receiver_email', email);
    inbox.set('type', 'gift_request');
    inbox.set('package_type', packageType);
    inbox.set('request_id', requestId);
    inbox.set('status', 'pending');
    inbox.set('message', `🎁 ${sender.get('name')} size ${packageType === 'pro' ? '🌟 Pro Paket' : '👥 Takım Paketi'} hediye etmek istiyor. Kabul eder misiniz?`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: `${email} adresine hediye teklifi gönderildi.` };
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
    const Inbox = Parse.Object.extend('Inbox');
    const inbox = new Inbox();
    inbox.set('sender_email', sender.get('email'));
    inbox.set('receiver_email', email);
    inbox.set('type', 'role_request');
    inbox.set('role', role);
    inbox.set('request_id', requestId);
    inbox.set('status', 'pending');
    inbox.set('message', `📩 ${sender.get('name')} size ${roleLabel} rolü vermek istiyor. Kabul eder misiniz?`);
    await inbox.save(null, { useMasterKey: true });
    return { success: true, message: `${email} adresine rol teklifi gönderildi.` };
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
    const Inbox2 = Parse.Object.extend('Inbox');
    const notify = new Inbox2();
    notify.set('sender_email', 'system@vizyon2027.com');
    notify.set('receiver_email', inboxMsg.get('sender_email'));
    notify.set('type', 'notification');
    notify.set('status', 'done');
    notify.set('message', `✅ ${user.get('email')} teklifi kabul etti!`);
    await notify.save(null, { useMasterKey: true });
    return { success: true, message: "Teklif kabul edildi!" };
});

// ========== TAKIM İŞLEMLERİ ==========
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
    const Team = Parse.Object.extend("Team");
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
    const Member = Parse.Object.extend("TeamMember");
    const member = new Member();
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
    const Team = Parse.Object.extend("Team");
    const query = new Parse.Query(Team);
    query.equalTo("teamCode", teamCode.toUpperCase().trim());
    const team = await query.first({ useMasterKey: true });
    if (!team) throw new Error("Geçersiz takım kodu!");
    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", team.id);
    memberQuery.equalTo("user_email", user.get('email'));
    const existing = await memberQuery.first({ useMasterKey: true });
    if (existing) throw new Error("Zaten bu takımın üyesisiniz!");
    const member = new Member();
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

    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu takımın üyesi değilsiniz!");

    const Message = Parse.Object.extend("TeamMessage");
    const msg = new Message();
    msg.set("team_id", teamId);
    msg.set("user_email", user.get('email'));
    msg.set("user_name", user.get('name') || user.get('username') || 'Kullanıcı');
    msg.set("message", message || '');
    if (fileUrl) {
        msg.set("fileUrl", fileUrl);
        msg.set("fileName", fileName || 'Dosya');
        msg.set("fileType", fileType || 'unknown');
    }
    await msg.save(null, { useMasterKey: true });
    return { success: true };
});

Parse.Cloud.define("inviteToTeam", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Önce takım oluşturun!");
    const { email } = request.params;
    if (!email) throw new Error("E-posta adresi gerekli!");
    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const Inbox = Parse.Object.extend("Inbox");
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
    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", user.get('email'));
    const existing = await memberQuery.first({ useMasterKey: true });
    if (existing) throw new Error("Zaten bu takımın üyesisiniz!");
    const member = new Member();
    member.set("team_id", teamId);
    member.set("user_email", user.get('email'));
    await member.save(null, { useMasterKey: true });
    user.set("teamId", teamId);
    await user.save(null, { useMasterKey: true });
    const Inbox = Parse.Object.extend("Inbox");
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
    const Inbox = Parse.Object.extend("Inbox");
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
    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (team.get('owner_email') === user.get('email')) {
        throw new Error("Takım sahibi ayrılamaz, önce sahipliği devredin.");
    }
    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
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

    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    const members = await memberQuery.find({ useMasterKey: true });

    const emailList = members.map(m => m.get('user_email'));
    const userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn('email', emailList);
    const users = await userQuery.find({ useMasterKey: true });
    const userMap = {};
    users.forEach(u => {
        userMap[u.get('email')] = u.get('name') || u.get('username') || 'İsimsiz';
    });

    const list = members.map(m => {
        const email = m.get('user_email');
        return {
            email: email,
            name: userMap[email] || email.split('@')[0] || 'İsimsiz',
            isOwner: email === team.get('owner_email'),
            isManager: email === team.get('manager_email')
        };
    });

    return {
        success: true,
        members: list,
        owner: team.get('owner_email'),
        manager: team.get('manager_email')
    };
});

Parse.Cloud.define("makeTeamManager", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("Hedef e-posta gerekli!");

    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");

    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    if (team.get('owner_email') !== user.get('email')) {
        throw new Error("Sadece takım sahibi yönetici atayabilir!");
    }

    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu kullanıcı takımda değil!");

    team.set("manager_email", targetEmail);
    await team.save(null, { useMasterKey: true });

    return { success: true, message: `${targetEmail} takım yöneticisi olarak atandı!` };
});

Parse.Cloud.define("demoteManager", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("Hedef e-posta gerekli!");

    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Bir takıma üye değilsiniz!");

    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    if (team.get('owner_email') !== user.get('email')) {
        throw new Error("Sadece takım sahibi yöneticiyi çıkarabilir!");
    }

    if (team.get('manager_email') !== targetEmail) {
        throw new Error("Bu kullanıcı yönetici değil!");
    }

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

    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    const isOwner = team.get('owner_email') === user.get('email');
    const isManager = team.get('manager_email') === user.get('email') && !isOwner;

    if (!isOwner && !isManager) {
        throw new Error("Sadece takım sahibi veya yöneticisi üye atabilir!");
    }

    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu kullanıcı takımda değil!");

    if (targetEmail === team.get('owner_email')) {
        throw new Error("Takım sahibi atılamaz!");
    }
    if (targetEmail === team.get('manager_email') && !isOwner) {
        throw new Error("Yöneticiyi sadece takım sahibi atabilir!");
    }

    await member.destroy({ useMasterKey: true });

    if (targetEmail === team.get('manager_email')) {
        team.set("manager_email", null);
        await team.save(null, { useMasterKey: true });
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

    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");

    if (team.get('owner_email') !== user.get('email')) {
        throw new Error("Sadece takım sahibi sahipliği devredebilir!");
    }

    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    memberQuery.equalTo("user_email", targetEmail);
    const member = await memberQuery.first({ useMasterKey: true });
    if (!member) throw new Error("Bu kullanıcı takımda değil!");

    const oldOwnerEmail = user.get('email');
    team.set("owner_email", targetEmail);
    team.set("manager_email", oldOwnerEmail);
    await team.save(null, { useMasterKey: true });

    const Inbox = Parse.Object.extend("Inbox");
    const inbox = new Inbox();
    inbox.set("sender_email", 'system@vizyon2027.com');
    inbox.set("receiver_email", targetEmail);
    inbox.set("type", "notification");
    inbox.set("message", `👑 ${user.get('name')} size ${team.get('name')} takımının sahipliğini devretti. Artık takım sahibisiniz!`);
    await inbox.save(null, { useMasterKey: true });

    return { success: true, message: `Sahipliği ${targetEmail} adlı kullanıcıya devrettiniz. Artık yöneticisiniz.` };
});

Parse.Cloud.define("closeTeam", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const teamId = user.get('teamId');
    if (!teamId) throw new Error("Takımınız yok!");
    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    if (team.get('owner_email') !== user.get('email') && user.get('role') !== 'founder') {
        throw new Error("Sadece takım sahibi veya kurucu kapatabilir!");
    }
    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    const members = await memberQuery.find({ useMasterKey: true });
    const Inbox = Parse.Object.extend("Inbox");
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
        if (u) {
            u.set("teamId", null);
            await u.save(null, { useMasterKey: true });
        }
    }
    const Message = Parse.Object.extend("TeamMessage");
    const msgQuery = new Parse.Query(Message);
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
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const Team = Parse.Object.extend("Team");
    const query = new Parse.Query(Team);
    const teams = await query.find({ useMasterKey: true });
    const result = [];
    for (const t of teams) {
        const Member = Parse.Object.extend("TeamMember");
        const mq = new Parse.Query(Member);
        mq.equalTo("team_id", t.id);
        const count = await mq.count({ useMasterKey: true });
        result.push({
            id: t.id,
            name: t.get('name'),
            code: t.get('teamCode'),
            owner: t.get('owner_email'),
            memberCount: count
        });
    }
    return result;
});

Parse.Cloud.define("searchTeams", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const { query } = request.params;
    if (!query) return [];
    const Team = Parse.Object.extend("Team");
    const q = new Parse.Query(Team);
    q.matches('name', new RegExp(query, 'i'));
    const q2 = new Parse.Query(Team);
    q2.matches('teamCode', new RegExp(query, 'i'));
    const mainQuery = Parse.Query.or(q, q2);
    const teams = await mainQuery.find({ useMasterKey: true });
    const result = [];
    for (const t of teams) {
        const Member = Parse.Object.extend("TeamMember");
        const mq = new Parse.Query(Member);
        mq.equalTo("team_id", t.id);
        const count = await mq.count({ useMasterKey: true });
        result.push({
            id: t.id,
            name: t.get('name'),
            code: t.get('teamCode'),
            owner: t.get('owner_email'),
            memberCount: count
        });
    }
    return result;
});

Parse.Cloud.define("joinTeamAsFounder", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu yapabilir!");
    const { teamId } = request.params;
    if (!teamId) throw new Error("Takım ID gerekli!");
    const Team = Parse.Object.extend("Team");
    const tq = new Parse.Query(Team);
    const team = await tq.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const Member = Parse.Object.extend("TeamMember");
    const mq = new Parse.Query(Member);
    mq.equalTo("team_id", teamId);
    mq.equalTo("user_email", user.get('email'));
    const existing = await mq.first({ useMasterKey: true });
    if (!existing) {
        const member = new Member();
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
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu yapabilir!");
    const { teamId } = request.params;
    if (!teamId) throw new Error("Takım ID gerekli!");
    const Team = Parse.Object.extend("Team");
    const teamQuery = new Parse.Query(Team);
    const team = await teamQuery.get(teamId, { useMasterKey: true });
    if (!team) throw new Error("Takım bulunamadı!");
    const Member = Parse.Object.extend("TeamMember");
    const memberQuery = new Parse.Query(Member);
    memberQuery.equalTo("team_id", teamId);
    const members = await memberQuery.find({ useMasterKey: true });
    const Inbox = Parse.Object.extend("Inbox");
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
        if (u) {
            u.set("teamId", null);
            await u.save(null, { useMasterKey: true });
        }
    }
    const Message = Parse.Object.extend("TeamMessage");
    const msgQuery = new Parse.Query(Message);
    msgQuery.equalTo("team_id", teamId);
    const msgs = await msgQuery.find({ useMasterKey: true });
    for (const msg of msgs) await msg.destroy({ useMasterKey: true });
    await team.destroy({ useMasterKey: true });
    return { success: true };
});

// ========== VİZYON DESTEK AI ==========
Parse.Cloud.define("vizyonSupportAI", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const message = request.params.message;
    if (!message) throw new Error("Mesaj gerekli!");

    try {
        const aiResult = await Parse.Cloud.run("superAI", { prompt: message });
        if (aiResult && aiResult.length > 10 && !aiResult.includes('ulaşılamıyor') && !aiResult.includes('Üzgünüm') && !aiResult.includes('tekrar deneyin')) {
            return { reply: aiResult };
        } else {
            const Inbox = Parse.Object.extend("Inbox");
            const inbox = new Inbox();
            inbox.set("sender_email", user.get('email'));
            inbox.set("receiver_email", 'admin.tr.reis@gmail.com');
            inbox.set("type", "support_escalation");
            inbox.set("message", `📨 ${user.get('name')} (${user.get('email')}) şu mesajı gönderdi, ancak AI yanıt veremedi:\n\n"${message}"\n\nLütfen ilgilenin.`);
            await inbox.save(null, { useMasterKey: true });

            const Log = Parse.Object.extend("VizyonLog");
            const log = new Log();
            log.set("user_email", user.get('email'));
            log.set("user_name", user.get('name'));
            log.set("action", "support_escalation");
            log.set("message", `${user.get('name')} (${user.get('email')}) AI ile çözülemeyen mesaj: ${message}`);
            await log.save(null, { useMasterKey: true });

            return { 
                reply: "📨 Üzgünüm, bu soruyu çözemiyorum. Talebiniz kurucumuza iletilmiştir. En kısa sürede ilgilenecektir.", 
                forwardedToFounder: true 
            };
        }
    } catch (e) {
        const Inbox = Parse.Object.extend("Inbox");
        const inbox = new Inbox();
        inbox.set("sender_email", user.get('email'));
        inbox.set("receiver_email", 'admin.tr.reis@gmail.com');
        inbox.set("type", "support_error");
        inbox.set("message", `⚠️ ${user.get('name')} (${user.get('email')}) destek talebinde hata oluştu:\nMesaj: ${message}\nHata: ${e.message}`);
        await inbox.save(null, { useMasterKey: true });

        return { 
            reply: "📨 Bir teknik hata oluştu. Talebiniz kurucumuza iletilmiştir. En kısa sürede ilgilenecektir.", 
            forwardedToFounder: true 
        };
    }
});

// ========== VİZYON LOG'U GETİR (KURUCU) ==========
Parse.Cloud.define("getVizyonLog", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const Log = Parse.Object.extend("VizyonLog");
    const query = new Parse.Query(Log);
    query.descending('createdAt');
    query.limit(100);
    const logs = await query.find({ useMasterKey: true });
    return logs.map(l => ({
        message: l.get('message'),
        createdAt: l.get('createdAt')
    }));
});

// ========== DEVRİYE LOG'U EKLE ==========
Parse.Cloud.define("addVizyonLog", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const { action, targetEmail, targetName, reason, teamName, teamCode } = request.params;
    const Log = Parse.Object.extend("VizyonLog");
    const log = new Log();
    let msg = '';
    if (action === 'kick') {
        msg = `🚫 ${targetName} (${targetEmail}) kullanıcısı, ${reason} nedeniyle ${teamName} (${teamCode}) takımından atıldı.`;
    } else if (action === 'close_team') {
        msg = `🗑️ ${teamName} (${teamCode}) takımı, ${reason} nedeniyle Vizyon AI tarafından kapatıldı.`;
    } else if (action === 'support_request') {
        msg = `📨 ${targetName} (${targetEmail}) destek talebi: ${reason}`;
    } else {
        msg = `ℹ️ Vizyon AI işlemi: ${action} - ${reason}`;
    }
    log.set("user_email", user.get('email'));
    log.set("user_name", user.get('name') || 'Vizyon AI');
    log.set("action", action);
    log.set("message", msg);
    await log.save(null, { useMasterKey: true });
    return { success: true };
});

// ========== 3D MODEL ÜRETME – HUGGING FACE ==========
Parse.Cloud.define("generate3DWithHF", async (request) => {
    const prompt = request.params.prompt;
    if (!prompt) throw new Error("Prompt gerekli!");
    const HF_TOKEN = await getAPIKey('HF_TOKEN');
    if (!HF_TOKEN) throw new Error("HF_TOKEN Config'de tanımlı değil! Lütfen ekleyin.");
    try {
        console.log("HF 3D başlatıldı (trefoil):", prompt);
        const modelRes = await fetch("https://api-inference.huggingface.co/models/justinpinkney/trefoil", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + HF_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                options: { wait_for_model: true }
            })
        });
        if (!modelRes.ok) {
            const errorText = await modelRes.text();
            throw new Error("HF Hatası " + modelRes.status + ": " + errorText);
        }
        const modelBuffer = await modelRes.arrayBuffer();
        const base64Model = Buffer.from(modelBuffer).toString('base64');
        return {
            success: true,
            glbBase64: base64Model,
            message: "Model hazır!"
        };
    } catch (e) {
        console.error("Hugging Face 3D üretim hatası:", e);
        return { success: false, error: e.message };
    }
});

// ========== YENİ YÖNETİM FONKSİYONLARI ==========
Parse.Cloud.define("getAdmins", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu görebilir!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('role', 'admin');
    const admins = await query.find({ useMasterKey: true });
    return admins.map(u => ({
        email: u.get('email'),
        name: u.get('name') || 'İsimsiz',
        id: u.id
    }));
});

Parse.Cloud.define("getBetas", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const role = user.get('role');
    if (role !== 'admin' && role !== 'founder') throw new Error("Yetkiniz yok!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('role', 'beta');
    const betas = await query.find({ useMasterKey: true });
    return betas.map(u => ({
        email: u.get('email'),
        name: u.get('name') || 'İsimsiz',
        id: u.id
    }));
});

Parse.Cloud.define("getBannedUsers", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const role = user.get('role');
    if (role !== 'admin' && role !== 'founder') throw new Error("Yetkiniz yok!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('isBanned', true);
    const banned = await query.find({ useMasterKey: true });
    return banned.map(u => ({
        email: u.get('email'),
        name: u.get('name') || 'İsimsiz',
        id: u.id
    }));
});

Parse.Cloud.define("demoteAdmin", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'founder') throw new Error("Sadece kurucu yapabilir!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("E-posta gerekli!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    const target = await query.first({ useMasterKey: true });
    if (!target) throw new Error("Kullanıcı bulunamadı!");
    if (target.get('role') !== 'admin') throw new Error("Bu kullanıcı admin değil!");
    target.set('role', 'user');
    await target.save(null, { useMasterKey: true });
    return { success: true, message: `${targetEmail} artık üye.` };
});

Parse.Cloud.define("demoteBeta", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const role = user.get('role');
    if (role !== 'admin' && role !== 'founder') throw new Error("Yetkiniz yok!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("E-posta gerekli!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    const target = await query.first({ useMasterKey: true });
    if (!target) throw new Error("Kullanıcı bulunamadı!");
    if (target.get('role') !== 'beta') throw new Error("Bu kullanıcı beta değil!");
    target.set('role', 'user');
    await target.save(null, { useMasterKey: true });
    return { success: true, message: `${targetEmail} artık üye.` };
});

Parse.Cloud.define("banUser", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const role = user.get('role');
    if (role !== 'admin' && role !== 'founder') throw new Error("Yetkiniz yok!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("E-posta gerekli!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    const target = await query.first({ useMasterKey: true });
    if (!target) throw new Error("Kullanıcı bulunamadı!");
    if (target.get('isBanned')) throw new Error("Zaten engelli!");
    target.set('isBanned', true);
    await target.save(null, { useMasterKey: true });
    return { success: true, message: `${targetEmail} engellendi.` };
});

Parse.Cloud.define("unbanUser", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    const role = user.get('role');
    if (role !== 'admin' && role !== 'founder') throw new Error("Yetkiniz yok!");
    const { targetEmail } = request.params;
    if (!targetEmail) throw new Error("E-posta gerekli!");
    const query = new Parse.Query(Parse.User);
    query.equalTo('email', targetEmail);
    const target = await query.first({ useMasterKey: true });
    if (!target) throw new Error("Kullanıcı bulunamadı!");
    if (!target.get('isBanned')) throw new Error("Zaten engelli değil!");
    target.set('isBanned', false);
    await target.save(null, { useMasterKey: true });
    return { success: true, message: `${targetEmail} engeli kaldırıldı.` };
});

Parse.Cloud.define("leaveAdminRole", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'admin') throw new Error("Admin değilsiniz!");
    user.set('role', 'user');
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Admin rolünden ayrıldınız." };
});

Parse.Cloud.define("leaveBetaRole", async (request) => {
    const user = request.user;
    if (!user) throw new Error("Giriş yapmalısınız!");
    if (user.get('role') !== 'beta') throw new Error("Beta değilsiniz!");
    user.set('role', 'user');
    await user.save(null, { useMasterKey: true });
    return { success: true, message: "Beta rolünden ayrıldınız." };
});

// ========== ÇEVİRİ MOTORLARI ==========
Parse.Cloud.define("translateWithDeepL", async (request) => {
    const { text, targetLang, sourceLang } = request.params;
    const apiKey = await getAPIKey('DEEPL_API_KEY');
    if (!apiKey) throw new Error("DeepL API anahtarı bulunamadı!");

    try {
        const response = await fetch("https://api-free.deepl.com/v2/translate", {
            method: "POST",
            headers: {
                'Authorization': 'DeepL-Auth-Key ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: [text],
                target_lang: targetLang.toUpperCase(),
                source_lang: sourceLang ? sourceLang.toUpperCase() : undefined
            })
        });

        const data = await response.json();
        if (data.message) throw new Error(data.message);

        return {
            success: true,
            translatedText: data.translations[0].text,
            engine: "DeepL"
        };
    } catch (error) {
        console.error("DeepL hatası:", error);
        return { success: false, error: error.message };
    }
});

Parse.Cloud.define("translateWithLibre", async (request) => {
    const { text, targetLang, sourceLang } = request.params;

    try {
        const response = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                source: sourceLang || 'auto',
                target: targetLang,
                format: 'text'
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return {
            success: true,
            translatedText: data.translatedText,
            engine: "LibreTranslate"
        };
    } catch (error) {
        console.error("LibreTranslate hatası:", error);
        return { success: false, error: error.message };
    }
});

Parse.Cloud.define("smartTranslate", async (request) => {
    const { text, targetLang, sourceLang } = request.params;

    try {
        const deeplResult = await Parse.Cloud.run("translateWithDeepL", { text, targetLang, sourceLang });
        if (deeplResult.success) {
            return {
                success: true,
                translatedText: deeplResult.translatedText,
                engine: "DeepL"
            };
        }
    } catch (e) {
        console.log("DeepL başarısız, LibreTranslate'e geçiliyor...", e.message);
    }

    try {
        const libreResult = await Parse.Cloud.run("translateWithLibre", { text, targetLang, sourceLang });
        if (libreResult.success) {
            return {
                success: true,
                translatedText: libreResult.translatedText,
                engine: "LibreTranslate"
            };
        }
    } catch (e) {
        console.log("LibreTranslate de başarısız:", e.message);
    }

    return {
        success: false,
        translatedText: text,
        error: "Tüm çeviri motorları başarısız oldu."
    };
});

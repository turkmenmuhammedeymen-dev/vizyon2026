// ================================================================
// VİZYON 2027 – CLOUD CODE (KENDİ SUNUCUN İÇİN - HATASIZ)
// ================================================================

// Yardımcı fonksiyon: API anahtarlarını al
async function getAPIKey(keyName) {
    try {
        const config = await Parse.Config.get({ useMasterKey: true });
        const value = config.get(keyName);
        if (value === undefined || value === null) {
            console.warn('Config anahtarı bulunamadı:', keyName);
            return null;
        }
        return value;
    } catch (e) {
        console.error(keyName + ' alınamadı:', e.message);
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

// ========== TEST FONKSİYONU ==========
Parse.Cloud.define("test", async (request) => {
    try {
        return {
            success: true,
            message: "Cloud Code çalışıyor!",
            user: request.user ? request.user.get('email') : 'Oturum yok',
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
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
        if (role === 'admin' || role === 'founder' || role === 'beta' || plan === 'team') {
            limit = Infinity;
        } else if (plan === 'pro') {
            limit = 2000;
        } else {
            limit = 100;
        }

        if (stats.get("count") >= limit) throw new Error("Günlük sorgu hakkınız doldu! Yarın tekrar deneyin.");
        stats.increment("count");
        await stats.save(null, { useMasterKey: true });
        remaining = limit === Infinity ? "Sınırsız" : (limit - stats.get("count"));
        return { remaining, limit, isMember: true };
    } else {
        const visitorKey = 'visitor_' + today;
        query.equalTo("visitorKey", visitorKey);
        let visitorStats = await query.first({ useMasterKey: true });
        if (!visitorStats) {
            visitorStats = new QueryStat();
            visitorStats.set("visitorKey", visitorKey);
            visitorStats.set("date", today);
            visitorStats.set("count", 0);
        }
        if (visitorStats.get("count") >= 25) throw new Error("Günlük sorgu hakkınız (25) doldu! Lütfen üye olun.");
        visitorStats.increment("count");
        await visitorStats.save(null, { useMasterKey: true });
        remaining = 25 - visitorStats.get("count");
        return { remaining, limit: 25, isMember: false };
    }
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
                result += r.title + '\n' + r.snippet + '\n\n';
            }
        } else {
            result += '🔍 "' + query + '" için sonuç bulunamadı.';
        }
        return result;
    } catch (e) {
        return "⚠️ Arama hatası: " + e.message;
    }
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

    return "🧠 VİZYON AI: '" + prompt + "' hakkında yardımcı olabilirim. Detaylı yanıt için lütfen daha spesifik bir soru sorun.";
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
        return {
            success: false,
            error: error.message
        };
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

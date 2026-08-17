// ================================================================
// VİZYON 2027 – TEMEL CLOUD CODE (HATASIZ)
// ================================================================

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

// ========== SÜPER AI (BASİT) ==========
Parse.Cloud.define("superAI", async (request) => {
    const prompt = request.params.prompt;
    if (!prompt) return "Lütfen bir soru girin.";
    return "🧠 VİZYON AI: '" + prompt + "' hakkında yardımcı olabilirim. Detaylı yanıt için lütfen daha spesifik bir soru sorun.";
});

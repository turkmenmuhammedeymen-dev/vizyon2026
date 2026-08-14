// ================================================================
// EN BASİT CLOUD CODE – SADECE TEST
// ================================================================

Parse.Cloud.define("test", async (request) => {
    return {
        success: true,
        message: "Cloud Code çalışıyor!",
        timestamp: new Date().toISOString()
    };
});

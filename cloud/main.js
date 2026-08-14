Parse.Cloud.define("test", async (request) => {
  return {
    success: true,
    message: "Cloud Code çalışıyor!",
    user: request.user ? request.user.get('email') : 'Oturum yok',
    timestamp: new Date().toISOString()
  };
});
